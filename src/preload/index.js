import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  writeFile: (filename, content) => ipcRenderer.invoke('write-file', filename, content),
  startYoutubeBot: () => ipcRenderer.invoke('start-youtube-bot'),
  stopYoutubeBot: () => ipcRenderer.invoke('stop-youtube-bot'),
  onLogUpdate: (callback) => ipcRenderer.on('log-update', (_, logs) => callback(logs)),
  getResourcePath: (filename) => ipcRenderer.invoke('get-resource-path', filename), // Make sure this line is here
  dummyFn: () => ipcRenderer.invoke('start-youtube-botter')
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}

// Add this line for debugging
console.log('Preload script executed. API object:', api)
