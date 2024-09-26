import MainContent from './components/MainContent'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <MainContent />
    </>
  )
}

export default App
