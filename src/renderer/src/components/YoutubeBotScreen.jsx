import React, { useState, useEffect } from 'react'
import { PlayArrow as PlayIcon, Stop as StopIcon } from '@mui/icons-material'

const YoutubeBotScreen = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Set up the log update listener when the component mounts
    const unsubscribe = window.api.onLogUpdate((newLogs) => {
      setLogs(newLogs)
    })

    // Clean up the listener when the component unmounts
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])

  const handleStartBot = async () => {
    setIsRunning(true)
    setLogs([]) // Clear previous logs
    try {
      const result = await window.api.startYoutubeBot()
      setLogs(result.logs)
    } catch (error) {
      setLogs((prev) => [...prev, `Error: ${error.message}`])
    } finally {
      setIsRunning(false)
    }
  }

  const handleStopBot = async () => {
    try {
      await window.api.stopYoutubeBot()
      setLogs((prev) => [...prev, 'Stopping YouTube Bot...'])
    } catch (error) {
      setLogs((prev) => [...prev, `Error stopping bot: ${error.message}`])
    }
    setIsRunning(false)
  }

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-4">YouTube Bot</h1>
      <div className="mb-4">
        <button
          onClick={isRunning ? handleStopBot : handleStartBot}
          className={`px-4 py-2 rounded text-white flex items-center ${
            isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isRunning ? (
            <>
              <StopIcon className="mr-2" /> Stop Bot
            </>
          ) : (
            <>
              <PlayIcon className="mr-2" /> Start Bot
            </>
          )}
        </button>
      </div>
      <div className="flex-grow bg-gray-100 p-4 overflow-auto">
        <h2 className="text-lg font-semibold mb-2">Logs</h2>
        {logs.map((log, index) => (
          <div key={index} className="mb-1">
            {log}
          </div>
        ))}
      </div>
    </div>
  )
}

export default YoutubeBotScreen
