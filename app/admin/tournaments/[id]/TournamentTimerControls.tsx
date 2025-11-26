'use client'

import { toggleTournamentStatus, changeLevel } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function TournamentTimerControls({
    tournamentId,
    status,
    currentLevelIndex,
    totalLevels
}: {
    tournamentId: number
    status: string
    currentLevelIndex: number
    totalLevels: number
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleToggleStatus = async () => {
        setLoading(true)
        try {
            await toggleTournamentStatus(tournamentId)
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Error toggling tournament status')
        } finally {
            setLoading(false)
        }
    }

    const handleChangeLevel = async (direction: 'next' | 'prev') => {
        setLoading(true)
        try {
            await changeLevel(tournamentId, direction)
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Error changing level')
        } finally {
            setLoading(false)
        }
    }

    const isScheduled = status === 'SCHEDULED'
    const isRunning = status === 'RUNNING'
    const isPaused = status === 'PAUSED'
    const isFinished = status === 'FINISHED'

    if (isFinished) return null

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">Tournament Controls</h2>
            <div className="flex gap-3">
                {/* Start/Pause/Resume Button */}
                <button
                    onClick={handleToggleStatus}
                    disabled={loading}
                    className={`px-6 py-3 rounded-lg font-bold text-lg disabled:opacity-50 transition-colors ${isScheduled
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : isRunning
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    {isScheduled ? '▶️ Start Tournament' : isRunning ? '⏸️ Pause' : '▶️ Resume'}
                </button>

                {/* Previous Level Button */}
                {(isRunning || isPaused) && (
                    <button
                        onClick={() => handleChangeLevel('prev')}
                        disabled={loading || currentLevelIndex === 0}
                        className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                        ⏮️ Previous Level
                    </button>
                )}

                {/* Next Level Button */}
                {(isRunning || isPaused) && (
                    <button
                        onClick={() => handleChangeLevel('next')}
                        disabled={loading || currentLevelIndex >= totalLevels - 1}
                        className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                        Next Level ⏭️
                    </button>
                )}
            </div>
        </div>
    )
}
