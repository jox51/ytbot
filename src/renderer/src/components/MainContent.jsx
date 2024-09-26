import React, { useState } from 'react'
import Sidebar from './Sidebar'
import AccountsScreen from './AccountsScreen'
import YoutubeBotScreen from './YoutubeBotScreen'
import YoutubeActionsScreen from './YoutubeActionsScreen'

const MainContent = () => {
  const [activeScreen, setActiveScreen] = useState('accounts')

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar setActiveScreen={setActiveScreen} />
      <div className="flex-1 ml-64 p-8 overflow-auto">
        {activeScreen === 'accounts' ? (
          <AccountsScreen />
        ) : activeScreen === 'youtubeActions' ? (
          <YoutubeActionsScreen />
        ) : (
          <YoutubeBotScreen />
        )}
      </div>
    </div>
  )
}

export default MainContent
