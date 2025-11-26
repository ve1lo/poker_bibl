
import { getTournament, getPlayers, getTables } from '@/app/actions'
import TournamentControlClient from './TournamentControlClient'
import TournamentTimerControls from './TournamentTimerControls'
import FinishTournamentButton from './FinishTournamentButton'
import ToggleRegistrationButton from './ToggleRegistrationButton'
import SaveAsTemplateButton from './SaveAsTemplateButton'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TournamentControlPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const tournament = await getTournament(id)
    const allPlayers = await getPlayers()
    const tables = await getTables(id)

    if (!tournament) return notFound()

    const currentLevel = tournament.levels[tournament.currentLevelIndex]
    const nextLevel = tournament.levels[tournament.currentLevelIndex + 1]
    const isFinished = tournament.status === 'FINISHED'
    const isRegistrationClosed = tournament.registrationClosed || isFinished

    // Sort players: active first, then by place (eliminated)
    const sortedRegistrations = [...tournament.registrations].sort((a: any, b: any) => {
        if (a.status === 'REGISTERED' && b.status !== 'REGISTERED') return -1
        if (a.status !== 'REGISTERED' && b.status === 'REGISTERED') return 1
        if (a.place && b.place) return a.place - b.place
        return 0
    })

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b border-gray-700 pb-8">
                <div>
                    <div className="flex gap-4 mb-2">
                        <Link href="/admin" className="text-gray-400 hover:text-white">
                            ← Back to Tournaments
                        </Link>
                        <Link
                            href={`/display/${id}`}
                            target="_blank"
                            className="text-amber-400 hover:text-amber-300"
                        >
                            🖥️ View Display ↗
                        </Link>
                    </div>
                    <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
                    <div className="flex gap-4 text-gray-400">
                        <span>📅 {new Date(tournament.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tournament.status === 'SCHEDULED' ? 'bg-blue-900 text-blue-300' :
                            tournament.status === 'RUNNING' ? 'bg-green-900 text-green-300' :
                                tournament.status === 'PAUSED' ? 'bg-yellow-900 text-yellow-300' :
                                    'bg-gray-700 text-gray-300'
                            }`}>
                            {tournament.status}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tournament.type === 'FREE' ? 'bg-purple-900 text-purple-300' : 'bg-amber-900 text-amber-300'
                            }`}>
                            {tournament.type}
                        </span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <SaveAsTemplateButton tournamentId={id} />
                    <ToggleRegistrationButton tournamentId={id} isClosed={isRegistrationClosed} />
                    <FinishTournamentButton
                        tournamentId={id}
                        isFree={tournament.type === 'FREE'}
                        activePlayerCount={tournament.registrations.filter((r: any) => r.status === 'REGISTERED').length}
                    />
                </div>
            </div>

            {/* Timer Controls */}
            <TournamentTimerControls
                tournamentId={id}
                status={tournament.status}
                currentLevelIndex={tournament.currentLevelIndex}
                totalLevels={tournament.levels.length}
            />

            <TournamentControlClient
                tournament={tournament}
                allPlayers={allPlayers}
                tables={tables}
                currentLevel={currentLevel}
                nextLevel={nextLevel}
                isFinished={isFinished}
                isRegistrationClosed={isRegistrationClosed}
                sortedRegistrations={sortedRegistrations}
            />
        </div>
    )
}
