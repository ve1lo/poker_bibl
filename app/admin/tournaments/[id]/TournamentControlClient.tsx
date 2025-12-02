'use client'

import { useState } from 'react'
import {
    toggleTournamentStatus,
    changeLevel,
    startBreak
} from '@/app/actions'
import EliminatePlayerButton from './EliminatePlayerButton'
import AddPlayerForm from './AddPlayerForm'
import TournamentSeatingWrapper from './TournamentSeatingWrapper'
import TournamentTabs from './TournamentTabs'
import BalancingProvider from './BalancingProvider'
import BalancingRecommendationBlock from './BalancingRecommendationBlock'
import DisplaySettingsPanel from './DisplaySettingsPanel'
import PayoutsPanel from './PayoutsPanel'
import StructurePanel from './StructurePanel'
import RebuyAddonButtons from './RebuyAddonButtons'
import RemovePlayerButton from './RemovePlayerButton'
import { Tournament, Player, Table, TournamentLevel, Registration, Payout } from '@/lib/entities'

interface TournamentControlClientProps {
    tournament: Tournament & { registrations: Registration[], payouts: Payout[] }
    allPlayers: Player[]
    tables: Table[]
    currentLevel?: TournamentLevel
    nextLevel?: TournamentLevel
    isFinished: boolean
    isRegistrationClosed: boolean
    sortedRegistrations: Registration[]
}

export default function TournamentControlClient({
    tournament,
    allPlayers,
    tables,
    currentLevel,
    nextLevel,
    isFinished,
    isRegistrationClosed,
    sortedRegistrations
}: TournamentControlClientProps) {
    const id = tournament.id
    const [loading, setLoading] = useState(false)
    const [showBreakModal, setShowBreakModal] = useState(false)
    const [breakDuration, setBreakDuration] = useState('15')

    const handleToggleStatus = async () => {
        setLoading(true)
        try {
            await toggleTournamentStatus(tournament.id)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleStartBreak = async () => {
        setLoading(true)
        try {
            await startBreak(tournament.id, parseInt(breakDuration))
            setShowBreakModal(false)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const playersContent = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Players List */}
            <div className="lg:col-span-2 bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 bg-gray-750 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {isFinished ? 'Final Results' : `Players (${tournament.registrations.length})`}
                    </h2>
                    {!isRegistrationClosed && (
                        <AddPlayerForm
                            tournamentId={id}
                            allPlayers={allPlayers}
                            registeredPlayerIds={tournament.registrations.map((r: Registration) => r.player.id)}
                        />
                    )}
                </div>

                {/* Balancing Recommendation Block */}
                <div className="p-4">
                    <BalancingRecommendationBlock tournamentId={id} />
                </div>

                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-2">Place</th>
                            <th className="px-4 py-2">Player</th>
                            {tournament.type === 'FREE' && <th className="px-4 py-2">Bounties</th>}
                            <th className="px-4 py-2">Rebuys</th>
                            {tournament.type === 'FREE' && <th className="px-4 py-2">Points</th>}
                            <th className="px-4 py-2">Status</th>
                            {!isFinished && <th className="px-4 py-2">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sortedRegistrations.map((reg: Registration) => (
                            <tr key={reg.id} className="hover:bg-gray-750">
                                <td className="px-4 py-3 text-gray-300">{reg.place || '-'}</td>
                                <td className="px-4 py-3 font-medium">{reg.player.firstName} {reg.player.lastName}</td>
                                {tournament.type === 'FREE' && <td className="px-4 py-3 text-gray-300">{reg.bountyCount || 0}</td>}
                                <td className="px-4 py-3 text-gray-300">
                                    {reg.rebuys}
                                    {tournament.type === 'PAID' && reg.addons > 0 && <span className="text-purple-400 ml-1">+{reg.addons}A</span>}
                                </td>
                                {tournament.type === 'FREE' && <td className="px-4 py-3 text-amber-400 font-bold">{reg.points || 0}</td>}
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${reg.status === 'REGISTERED' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                                        }`}>
                                        {reg.status === 'REGISTERED' ? 'Active' : 'Eliminated'}
                                    </span>
                                </td>
                                {!isFinished && (
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            {reg.status === 'REGISTERED' && (
                                                <EliminatePlayerButton
                                                    registrationId={reg.id}
                                                    isFree={tournament.type === 'FREE'}
                                                />
                                            )}
                                            {tournament.type === 'PAID' && reg.status === 'REGISTERED' && (
                                                <RebuyAddonButtons
                                                    registrationId={reg.id}
                                                />
                                            )}
                                            {reg.status === 'REGISTERED' && (
                                                <RemovePlayerButton
                                                    registrationId={reg.id}
                                                    playerName={`${reg.player.firstName} ${reg.player.lastName}`}
                                                />
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Blinds & Level Info */}
            <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-4">Current Level</h2>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Level:</span>
                            <span className="font-bold">{tournament.currentLevelIndex + 1}</span>
                        </div>
                        {currentLevel ? (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Small Blind:</span>
                                    <span className="font-bold text-amber-400">{currentLevel.smallBlind}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Big Blind:</span>
                                    <span className="font-bold text-amber-400">{currentLevel.bigBlind}</span>
                                </div>
                                {currentLevel.ante > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Ante:</span>
                                        <span className="font-bold text-amber-400">{currentLevel.ante}</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-gray-500 italic">Level info unavailable</div>
                        )}
                    </div>
                </div>

                {nextLevel && (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-xl font-bold mb-4">Next Level</h2>
                        <div className="space-y-2 text-gray-400">
                            <div className="flex justify-between">
                                <span>Small Blind:</span>
                                <span>{nextLevel.smallBlind}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Big Blind:</span>
                                <span>{nextLevel.bigBlind}</span>
                            </div>
                            {nextLevel.ante > 0 && (
                                <div className="flex justify-between">
                                    <span>Ante:</span>
                                    <span>{nextLevel.ante}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )

    return (
        <BalancingProvider>
            <div className="space-y-6">
                {/* Control Panel */}
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Tournament Control</h2>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${tournament.status === 'RUNNING' ? 'bg-green-500 animate-pulse' :
                                    tournament.status === 'PAUSED' ? 'bg-yellow-500' :
                                        tournament.status === 'BREAK' ? 'bg-blue-500 animate-pulse' :
                                            'bg-gray-500'
                                    }`}></div>
                                <span className="text-gray-400 font-mono">{tournament.status}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {tournament.status !== 'FINISHED' && (
                                <>
                                    <button
                                        onClick={handleToggleStatus}
                                        disabled={loading}
                                        className={`px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all ${tournament.status === 'RUNNING'
                                            ? 'bg-yellow-600 hover:bg-yellow-700'
                                            : 'bg-green-600 hover:bg-green-700'
                                            }`}
                                    >
                                        {tournament.status === 'RUNNING' ? '⏸ Pause' : '▶ Resume'}
                                    </button>

                                    {(tournament.status === 'RUNNING' || tournament.status === 'PAUSED') && (
                                        <>
                                            <button
                                                onClick={() => changeLevel(tournament.id, 'prev')}
                                                disabled={loading || tournament.currentLevelIndex === 0}
                                                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 shadow-lg transition-all"
                                            >
                                                ⏮️ Prev
                                            </button>
                                            <button
                                                onClick={() => changeLevel(tournament.id, 'next')}
                                                disabled={loading || tournament.currentLevelIndex >= tournament.levels.length - 1}
                                                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold disabled:opacity-50 shadow-lg transition-all"
                                            >
                                                Next ⏭️
                                            </button>
                                        </>
                                    )}

                                    {tournament.status === 'RUNNING' && (
                                        <button
                                            onClick={() => setShowBreakModal(true)}
                                            disabled={loading}
                                            className="px-6 py-3 rounded-lg font-bold text-white shadow-lg transition-all bg-blue-600 hover:bg-blue-700"
                                        >
                                            ☕ Break
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <TournamentTabs
                    playersContent={playersContent}
                    seatingContent={
                        <TournamentSeatingWrapper
                            tournamentId={id}
                            tables={tables}
                            registrations={tournament.registrations}
                            isFinished={isFinished}
                        />
                    }
                    payoutsContent={
                        <PayoutsPanel
                            tournament={tournament}
                            allPlayers={allPlayers}
                        />
                    }
                    structureContent={
                        <StructurePanel tournament={tournament} />
                    }
                    settingsContent={
                        <DisplaySettingsPanel
                            tournamentId={id}
                            initialSettings={tournament.displaySettings}
                        />
                    }
                />
            </div>

            {/* Break Modal */}
            {showBreakModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-96 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Start Break</h3>
                        <div className="mb-6">
                            <label className="block text-gray-400 text-sm mb-2">Duration (minutes)</label>
                            <input
                                type="number"
                                value={breakDuration}
                                onChange={(e) => setBreakDuration(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white focus:border-blue-500 outline-none"
                                min="1"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowBreakModal(false)}
                                className="px-4 py-2 rounded text-gray-300 hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartBreak}
                                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                Start Break
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </BalancingProvider>
    )
}
