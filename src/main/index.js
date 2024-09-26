import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs/promises'
import path from 'path'
import Hero from '@ulixee/hero-playground'
import { getAccountsAndActions, updateActionStatus } from './utils'
import { loginToGoogle } from './login'
import { loginToYoutube } from './ytLogin'
import { setupProxy } from './proxy'
import { writeComment, searchYouTube } from './youtube-actions'
import { fileURLToPath } from 'url'
import { getResourcePath } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Replace instances of app.getAppPath() with getResourcePath()
app.on('ready', () => {
  console.log(`App path: ${getResourcePath('')}`)
  console.log(`User data path: ${app.getPath('userData')}`)
  // ... rest of your initialization code
})

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // For debugging
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window loaded')
    mainWindow.webContents
      .executeJavaScript(
        `
      console.log('Window object:', window);
      console.log('Window.api:', window.api);
    `
      )
      .then((result) => console.log('Execution result:', result))
      .catch((err) => console.error('Execution error:', err))
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  // if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  //   mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  // } else {
  //   mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  // }

  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.loadURL('http://localhost:5173')
  // } else {
  //   mainWindow.loadFile(path.join(__dirname, '../../dist/renderer/index.html'))
  // }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  app.quit()
})

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return data
  } catch (error) {
    console.error('Error reading file:', error)
    throw error
  }
})

ipcMain.handle('get-app-path', () => {
  return getResourcePath('')
})

ipcMain.handle('write-file', async (event, filename, content) => {
  try {
    const filePath = getResourcePath(filename)

    await fs.writeFile(filePath, content, 'utf8')
    return true
  } catch (error) {
    console.error('Error writing file:', error)
    throw error
  }
})

ipcMain.handle('get-resource-path', (_, filename) => getResourcePath(filename))

let hero = null

function closeApp() {
  if (hero) {
    hero
      .close()
      .then(() => {
        hero = null
        app.quit()
      })
      .catch((error) => {
        console.error('Error closing Hero:', error)
        app.quit()
      })
  } else {
    app.quit()
  }
}

ipcMain.handle('start-youtube-bot', async (event) => {
  const logs = []
  const sendLogs = () => event.sender.send('log-update', logs)

  try {
    // Replace app.getAppPath() with getResourcePath('')
    const { accounts, actions } = await getAccountsAndActions()
    logs.push(`Found ${accounts.length} accounts and ${actions.length} actions`)
    sendLogs()

    for (const action of actions) {
      if (action.Status === 'Done') {
        logs.push(`Skipping ${action.Account} because status is Done`)
        sendLogs()
        continue
      }

      const account = accounts.find((acc) => acc.ACCOUNT === action.Account)
      if (!account) {
        logs.push(`Warning: No matching account found for ${action.Account}`)
        sendLogs()
        continue
      }

      const proxyUrl = setupProxy(account)

      hero = new Hero({
        showChrome: true,
        showChromeInteractions: true,
        showDevTools: true,
        ...(proxyUrl && { upstreamProxyUrl: proxyUrl })
      })

      logs.push('Hero instance created' + (proxyUrl ? ' with proxy' : ''))
      sendLogs()

      await loginToYoutube(hero, account, logs)
      sendLogs()

      if (action.Url) {
        logs.push(`Navigating to ${action.Url}`)
        sendLogs()
        await hero.goto('https://' + action.Url)
        await hero.waitForMillis(8200)

        const commentSuccess = await writeComment(hero, action.Comment, logs)
        sendLogs()

        logs.push(`Action: ${action.Comment}`)
        if (commentSuccess) {
          const number = action.Number
          // Replace app.getAppPath() with getResourcePath('')
          await updateActionStatus(action.Account, 'Done', action.Url, number)
          logs.push(`Updated status for ${action.Account} to Done`)
        }
        sendLogs()
      } else if (action.Keywords) {
        logs.push(`Searching for ${action.Keywords}`)
        sendLogs()

        await searchYouTube(
          hero,
          action.Keywords,
          action.Comment,
          logs,
          action.Account, // Replace app.getAppPath() here
          action.Number,
          sendLogs
        )

        sendLogs()
      } else {
        logs.push(`Warning: No URL or Keywords provided for action`)
        sendLogs()
        continue
      }

      logs.push(`Logging out`)
      sendLogs()

      await hero.close()
      hero = null
    }

    logs.push('Bot finished successfully')
  } catch (error) {
    logs.push(`Error: ${error.message}`)
    console.error('Error in YouTube bot:', error)
  } finally {
    if (hero) {
      await hero.close()
    }
  }

  sendLogs()
  return { logs }
})

ipcMain.handle('stop-youtube-bot', async () => {
  if (hero) {
    await hero.close()
    hero = null
  }
  closeApp() // Call closeApp here as well
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
