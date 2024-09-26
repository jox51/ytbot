import fs from 'fs/promises'
import path from 'path'
import Papa from 'papaparse'
import { app } from 'electron'

const isDev = process.env.NODE_ENV === 'development'

export function getResourcePath(filename) {
  if (app.isPackaged) {
    const mainPath = path.join(process.resourcesPath, filename)
    const userPath = getUserDataPath(filename)
    copyFileIfNotExists(mainPath, userPath)
    console.log(`Resource path: ${mainPath}`)
    console.log(`User path: ${userPath}`)

    const actualPath = mainPath || userPath

    return userPath
  } else {
    return path.join(app.getAppPath(), 'src', 'main', filename)
  }
}

export function getUserDataPath(filename) {
  return path.join(app.getPath('userData'), filename)
}

function copyFileIfNotExists(sourcePath, destPath) {
  try {
    fs.access(destPath)
  } catch (error) {
    if (error.code === 'ENOENT') {
      const content = fs.readFile(sourcePath, 'utf8')
      fs.writeFile(destPath, content, 'utf8')
    } else {
      throw error
    }
  }
}

export async function readCsvFile(fileName) {
  const resourcePath = getResourcePath(fileName)
  const userDataPath = getUserDataPath(fileName)

  console.log(`Attempting to read CSV file from: ${resourcePath}`)
  try {
    // First, try to read from the resource path
    const csvData = await fs.readFile(resourcePath, 'utf8')
    console.log(`Successfully read CSV file from resources: ${fileName}`)

    // Copy the file to the user data path if it doesn't exist
    copyFileIfNotExists(resourcePath, userDataPath)

    return Papa.parse(csvData, { header: true }).data
  } catch (error) {
    console.error(`Error reading CSV file ${fileName} from resources: ${error.message}`)
    console.log(`Attempting to read from user data path: ${userDataPath}`)

    try {
      // If reading from resources fails, try reading from user data path
      const csvData = await fs.readFile(userDataPath, 'utf8')
      console.log(`Successfully read CSV file from user data: ${fileName}`)
      return Papa.parse(csvData, { header: true }).data
    } catch (secondError) {
      console.error(`Error reading CSV file ${fileName} from user data: ${secondError.message}`)
      throw secondError
    }
  }
}

export async function getAccountsAndActions() {
  const accounts = await readCsvFile('account_settings3.csv')
  const actions = await readCsvFile('youtube_actions3.csv')

  // Process actions to correctly assign Keywords and Url
  const processedActions = actions.map((action) => {
    const { Number, Account, Keywords, Url, Comment, PostedUrl, Status } = action

    // Check if Keywords is a YouTube URL
    if (Keywords && Keywords.includes('youtube.com/watch?v=')) {
      return { Number, Account, Url: Keywords, Keywords: '', Comment, PostedUrl, Status }
    }

    // If Keywords is not a URL, it's either keywords or empty
    return { Number, Account, Keywords, Url, Comment, PostedUrl, Status }
  })

  return { accounts, actions: processedActions }
}

export async function updateActionStatus(
  accountName,
  status,
  postedUrl = '',
  number,
  logs,
  sendLogs
) {
  const filePath = getUserDataPath('youtube_actions3.csv')
  logs.push(`filePath: ${filePath}`)
  logs.push(`Updating status for ${accountName} to ${status} with URL ${postedUrl}`)
  sendLogs()
  try {
    const csvData = await fs.readFile(filePath, 'utf8')
    logs.push('CSV data read successfully')
    sendLogs()
    const { data } = Papa.parse(csvData, { header: true })

    const updatedData = data.map((row) => {
      logs.push(`Checking row ${row.Number} against ${number}`)
      sendLogs()
      if (row.Number === number) {
        logs.push(`Matching row found for ${accountName}`)
        sendLogs()
        return { ...row, Status: status, PostedUrl: postedUrl }
      }
      return row
    })

    const updatedCsv = Papa.unparse(updatedData)
    await fs.writeFile(filePath, updatedCsv, 'utf8')
    logs.push(`Updated status for ${accountName} to ${status}`)
    sendLogs()
  } catch (error) {
    logs.push(`Error updating action status: ${error.message}`)
    sendLogs()
    throw error
  }
}
