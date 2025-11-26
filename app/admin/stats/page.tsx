import { getStatistics } from '@/app/actions'
import Link from 'next/link'

export default async function StatsPage() {
    const stats = await getStatistics()

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="text-gray-400 hover:text-white">
                        ← Back
                    </Link>
                    <h1 className="text-3xl font-bold text-amber-500">Statistics 🏆</h1>
                </div>
            </div>

            {/* Global Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Tournaments</div>
                    <div className="text-4xl font-bold">{stats.totalTournaments}</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Players</div>
                    <div className="text-4xl font-bold">{stats.totalPlayers}</div>
                </div>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm uppercase tracking-wider mb-2">Ranked Games</div>
                    <div className="text-4xl font-bold text-amber-500">
                        {stats.leaderboard.reduce((acc: number, curr: any) => acc + curr.gamesPlayed, 0)}
                    </div>
                </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold">Leaderboard (Free Tournaments)</h2>
                    <p className="text-gray-400 text-sm mt-1">Ranked by total points earned</p>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Player</th>
                            <th className="p-4 text-center">Games</th>
                            <th className="p-4 text-center">Wins 🥇</th>
                            <th className="p-4 text-right">Total Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {stats.leaderboard.map((player: any, index: number) => (
                            <tr key={player.id} className="hover:bg-gray-750 transition">
                                <td className="p-4 font-mono text-gray-500">#{index + 1}</td>
                                <td className="p-4 font-bold">
                                    {player.firstName} {player.lastName}
                                    <div className="text-xs text-gray-500 font-normal">@{player.username}</div>
                                </td>
                                <td className="p-4 text-center">{player.gamesPlayed}</td>
                                <td className="p-4 text-center text-yellow-500 font-bold">{player.wins}</td>
                                <td className="p-4 text-right font-mono text-xl text-amber-500 font-bold">
                                    {player.totalPoints.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {stats.leaderboard.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No ranked games played yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
