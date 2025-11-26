'use client'

import AddPlayerForm from './AddPlayerForm'
import FinishTournamentButton from './FinishTournamentButton'
import ToggleRegistrationButton from './ToggleRegistrationButton'
import EliminatePlayerButton from './EliminatePlayerButton'
import SaveAsTemplateButton from './SaveAsTemplateButton'
import TournamentSeatingWrapper from './TournamentSeatingWrapper'
import TournamentTabs from './TournamentTabs'
import BalancingProvider from './BalancingProvider'
import BalancingRecommendationBlock from './BalancingRecommendationBlock'
import DisplaySettingsPanel from './DisplaySettingsPanel'
import Link from 'next/link'

export default function TournamentControlClient({
    tournament,
    allPlayers,
    tables,
    currentLevel,
    nextLevel,
    isFinished,
    isRegistrationClosed,
    sortedRegistrations
}: any) {
    const id = tournament.id

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
                            registeredPlayerIds={tournament.registrations.map((r: any) => r.player.id)}
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
                        {sortedRegistrations.map((reg: any) => (
                            <tr key={reg.id} className="hover:bg-gray-750">
                                <td className="px-4 py-3 text-gray-300">{reg.place || '-'}</td>
                                <td className="px-4 py-3 font-medium">{reg.player.firstName} {reg.player.lastName}</td>
                                {tournament.type === 'FREE' && <td className="px-4 py-3 text-gray-300">{reg.bountyCount || 0}</td>}
                                <td className="px-4 py-3 text-gray-300">{reg.rebuys}</td>
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
                settingsContent={
                    <DisplaySettingsPanel
                        tournamentId={id}
                        initialSettings={tournament.displaySettings}
                    />
                }
            />
        </BalancingProvider>
    )
}
