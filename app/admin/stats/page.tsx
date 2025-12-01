'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRankedStatistics, getSeasons, getPaidStatistics } from '@/app/actions'

export default function StatisticsPage() {
    const [activeTab, setActiveTab] = useState<'RANKED' | 'PAID'>('RANKED')
    const [seasons, setSeasons] = useState<string[]>([])
    const [selectedSeason, setSelectedSeason] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{
        tournaments: { id: number, name: string, date: Date }[],
        stats: {
            id: number,
            name: string,
            totalPoints?: number,
            totalWinnings?: number,
            gamesPlayed: number,
            results: Record<number, { points?: number, amount?: number, place: number | null, bounty?: number, isPaid?: boolean }>
        }[]
    } | null>(null)

    useEffect(() => {
        loadSeasons()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (activeTab === 'RANKED') {
            loadRankedStats()
        } else if (activeTab === 'PAID') {
            loadPaidStats()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, selectedSeason])

    const loadSeasons = async () => {
        const s = await getSeasons()
        setSeasons(s)
        if (s.length > 0 && !selectedSeason) {
            setSelectedSeason(s[0])
        }
    }

    const loadRankedStats = async () => {
        setLoading(true)
        try {
            const result = await getRankedStatistics(selectedSeason)
            setData(result)
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadPaidStats = async () => {
        setLoading(true)
        try {
            const result = await getPaidStatistics()
            setData(result)
        } catch (error) {
            console.error('Failed to load stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-amber-500">Statistics</h1>
                <Link href="/admin" className="text-gray-400 hover:text-white flex items-center gap-2">
                    ← Back to Dashboard
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-gray-700">
                <button
                    onClick={() => setActiveTab('RANKED')}
                    className={`px-4 py-2 font-bold border-b-2 transition-colors ${activeTab === 'RANKED'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Ranked (Free)
                </button>
                <button
                    onClick={() => setActiveTab('PAID')}
                    className={`px-4 py-2 font-bold border-b-2 transition-colors ${activeTab === 'PAID'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300'
                        }`}
                >
                    Paid (Money)
                </button>
            </div>

            {activeTab === 'RANKED' && (
                <div>
                    {/* Season Filter */}
                    <div className="mb-6 flex items-center gap-4">
                        <label className="font-bold text-gray-400">Season:</label>
                        <select
                            suppressHydrationWarning
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded px-3 py-1 outline-none focus:border-amber-500"
                        >
                            <option value="">All Time</option>
                            {seasons.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading statistics...</div>
                    ) : !data || data.stats.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">No statistics available for this period.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-800 text-gray-400 text-xs uppercase">
                                        <th className="p-3 border border-gray-700 sticky left-0 bg-gray-800 z-10 min-w-[150px]">Player</th>
                                        <th className="p-3 border border-gray-700 text-center w-24">Total Points</th>
                                        <th className="p-3 border border-gray-700 text-center w-24">Games</th>
                                        {data.tournaments.map(t => (
                                            <th key={t.id} className="p-3 border border-gray-700 min-w-[100px] text-center">
                                                <div className="font-bold text-white">{t.name}</div>
                                                <div className="text-[10px] font-normal">{new Date(t.date).toLocaleDateString()}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.stats.map((player, idx) => (
                                        <tr key={player.id} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                                            <td className="p-3 border border-gray-700 font-bold sticky left-0 bg-inherit z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-amber-500 text-black' : 'bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {idx + 1}
                                                    </span>
                                                    {player.name}
                                                </div>
                                            </td>
                                            <td className="p-3 border border-gray-700 text-center font-bold text-amber-400 text-lg">
                                                {player.totalPoints}
                                            </td>
                                            <td className="p-3 border border-gray-700 text-center text-gray-400">
                                                {player.gamesPlayed}
                                            </td>
                                            {data.tournaments.map(t => {
                                                const result = player.results[t.id]
                                                return (
                                                    <td key={t.id} className="p-3 border border-gray-700 text-center">
                                                        {result ? (
                                                            <div>
                                                                <div className={`font-bold ${result.place === 1 ? 'text-amber-400' : 'text-white'}`}>
                                                                    {result.place === 1 ? '🏆 1st' : (result.place ? `${result.place}${getOrdinalSuffix(result.place)}` : '-')}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {result.points} pts
                                                                    {(result.bounty || 0) > 0 && ` • ${result.bounty} KO`}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-700">-</span>
                                                        )}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )
            }

            {
                activeTab === 'PAID' && (
                    <div>
                        {loading ? (
                            <div className="text-center py-12 text-gray-500">Loading statistics...</div>
                        ) : !data || data.stats.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">No paid tournaments found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-800 text-gray-400 text-xs uppercase">
                                            <th className="p-3 border border-gray-700 sticky left-0 bg-gray-800 z-10 min-w-[150px]">Player</th>
                                            <th className="p-3 border border-gray-700 text-center w-24">Total Winnings</th>
                                            <th className="p-3 border border-gray-700 text-center w-24">Games</th>
                                            {data.tournaments.map(t => (
                                                <th key={t.id} className="p-3 border border-gray-700 min-w-[100px] text-center">
                                                    <div className="font-bold text-white">{t.name}</div>
                                                    <div className="text-[10px] font-normal">{new Date(t.date).toLocaleDateString()}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.stats.map((player, idx) => (
                                            <tr key={player.id} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-800/50'}>
                                                <td className="p-3 border border-gray-700 font-bold sticky left-0 bg-inherit z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${idx < 3 ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'
                                                            }`}>
                                                            {idx + 1}
                                                        </span>
                                                        {player.name}
                                                    </div>
                                                </td>
                                                <td className="p-3 border border-gray-700 text-center font-bold text-green-400 text-lg">
                                                    ${(player.totalWinnings || 0).toLocaleString()}
                                                </td>
                                                <td className="p-3 border border-gray-700 text-center text-gray-400">
                                                    {player.gamesPlayed}
                                                </td>
                                                {data.tournaments.map(t => {
                                                    const result = player.results[t.id]
                                                    return (
                                                        <td key={t.id} className="p-3 border border-gray-700 text-center">
                                                            {result ? (
                                                                <div>
                                                                    <div className={`font-bold ${result.isPaid ? 'text-green-400' : 'text-gray-500'}`}>
                                                                        {result.isPaid ? `$${result.amount?.toLocaleString()}` : '-'}
                                                                    </div>
                                                                    {result.place && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {result.place === 1 ? '🏆 1st' : `${result.place}${getOrdinalSuffix(result.place)}`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-700">-</span>
                                                            )}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    )
}

function getOrdinalSuffix(i: number) {
    const j = i % 10,
        k = i % 100
    if (j == 1 && k != 11) {
        return "st"
    }
    if (j == 2 && k != 12) {
        return "nd"
    }
    if (j == 3 && k != 13) {
        return "rd"
    }
    return "th"
}
