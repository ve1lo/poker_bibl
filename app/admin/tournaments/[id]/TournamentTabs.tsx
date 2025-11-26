'use client'

import { useState } from 'react'

type Tab = 'players' | 'seating' | 'settings'

export default function TournamentTabs({
    playersContent,
    seatingContent,
    settingsContent
}: {
    playersContent: React.ReactNode
    seatingContent: React.ReactNode
    settingsContent: React.ReactNode
}) {
    const [activeTab, setActiveTab] = useState<Tab>('players')

    return (
        <div>
            {/* Tabs Header */}
            <div className="flex gap-2 mb-6 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('players')}
                    className={`px-6 py-3 font-bold text-lg transition-colors relative ${activeTab === 'players'
                        ? 'text-amber-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    👥 Players & Blinds
                    {activeTab === 'players' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('seating')}
                    className={`px-6 py-3 font-bold text-lg transition-colors relative ${activeTab === 'seating'
                        ? 'text-amber-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    🪑 Tables & Seating
                    {activeTab === 'seating' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-3 font-bold text-lg transition-colors relative ${activeTab === 'settings'
                        ? 'text-amber-500'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    ⚙️ Settings
                    {activeTab === 'settings' && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t" />
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'players' && <>{playersContent}</>}
                {activeTab === 'seating' && <>{seatingContent}</>}
                {activeTab === 'settings' && <>{settingsContent}</>}
            </div>
        </div>
    )
}
