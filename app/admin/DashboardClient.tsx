'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TournamentSummary {
    id: number
    name: string
    date: string | Date
    type: 'FREE' | 'PAID'
    status: 'SCHEDULED' | 'RUNNING' | 'FINISHED'
    _count: {
        registrations: number
    }
}

interface DashboardClientProps {
    tournaments: TournamentSummary[]
}

export default function DashboardClient({ tournaments }: DashboardClientProps) {
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'SCHEDULED' | 'RUNNING' | 'FINISHED'>('ALL')
    const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PAID'>('ALL')
    const [filterDate, setFilterDate] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        // Use a timeout to avoid synchronous state update warning during hydration
        const timer = setTimeout(() => setMounted(true), 0)
        return () => clearTimeout(timer)
    }, [])

    const filteredTournaments = tournaments.filter(t => {
        if (filterStatus !== 'ALL' && t.status !== filterStatus) return false
        if (filterType !== 'ALL' && t.type !== filterType) return false
        if (filterDate) {
            const tDate = new Date(t.date).toISOString().split('T')[0]
            if (tDate !== filterDate) return false
        }
        return true
    })

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-amber-500 mb-8">Admin Dashboard</h1>

                <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-start md:items-center">
                    <div className="flex gap-4">
                        <Link href="/admin/tournaments/new" className="px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold">
                            + Create Tournament
                        </Link>
                        <Link href="/admin/stats" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                            📊 Stats
                        </Link>
                        <Link href="/admin/templates" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold">
                            📋 Templates
                        </Link>
                        <Link href="/admin/settings" className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold">
                            ⚙️ Settings
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 bg-gray-800 p-2 rounded-lg border border-gray-700 items-center">
                        {mounted && (
                            <>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm outline-none focus:border-amber-500 text-white"
                                />
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as 'ALL' | 'SCHEDULED' | 'RUNNING' | 'FINISHED')}
                                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm outline-none focus:border-amber-500"
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="SCHEDULED">Scheduled</option>
                                    <option value="RUNNING">Running</option>
                                    <option value="FINISHED">Finished</option>
                                </select>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value as 'ALL' | 'FREE' | 'PAID')}
                                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm outline-none focus:border-amber-500"
                                >
                                    <option value="ALL">All Types</option>
                                    <option value="FREE">Free</option>
                                    <option value="PAID">Paid</option>
                                </select>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-4">
                    {filteredTournaments.map((t) => (
                        <div key={t.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{t.name}</h2>
                                <p className="text-gray-400">
                                    {mounted ? (
                                        <>
                                            {new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString()}
                                        </>
                                    ) : (
                                        <span className="opacity-0">Loading date...</span>
                                    )}
                                </p>
                                <div className="mt-2 flex gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.type === 'PAID' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                                        }`}>
                                        {t.type}
                                    </span>
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === 'SCHEDULED' ? 'bg-yellow-900 text-yellow-300' :
                                        t.status === 'RUNNING' ? 'bg-red-900 text-red-300 animate-pulse' :
                                            'bg-gray-700 text-gray-300'
                                        }`}>
                                        {t.status}
                                    </span>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-2xl font-bold">{t._count.registrations}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Players</p>
                                <div className="flex flex-col gap-1 mt-2">
                                    <Link
                                        href={`/admin/tournaments/${t.id}`}
                                        className="text-amber-500 hover:text-amber-400 text-sm font-semibold"
                                    >
                                        Manage →
                                    </Link>
                                    <Link
                                        href={`/display/${t.id}`}
                                        target="_blank"
                                        className="text-blue-400 hover:text-blue-300 text-xs"
                                    >
                                        View Display ↗
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredTournaments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No tournaments found matching filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
