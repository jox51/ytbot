import React from 'react'
import { FaUserCircle, FaYoutube, FaPlayCircle } from 'react-icons/fa'

const Sidebar = ({ setActiveScreen }) => {
  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-8">YouTube Bot</h1>
        <nav>
          <ul className="space-y-2">
            <MenuItem
              icon={<FaUserCircle />}
              text="Accounts"
              onClick={() => setActiveScreen('accounts')}
            />
            <MenuItem
              icon={<FaPlayCircle />}
              text="YouTube Actions"
              onClick={() => setActiveScreen('youtubeActions')}
            />
            <MenuItem
              icon={<FaYoutube />}
              text="YouTube Bot"
              onClick={() => setActiveScreen('youtubeBot')}
            />
          </ul>
        </nav>
      </div>
    </div>
  )
}

const MenuItem = ({ icon, text, onClick }) => (
  <li>
    <a
      href="#"
      className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors"
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}
    >
      {icon}
      <span className="ml-3">{text}</span>
    </a>
  </li>
)

export default Sidebar
