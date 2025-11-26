import { getTournaments } from '@/app/actions'
import Link from 'next/link'

export default async function AdminDashboard() {
    const tournaments = await getTournaments()

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-amber-500 mb-8">Admin Dashboard</h1>

                <div className="flex gap-4 mb-8">
                    <Link href="/admin/tournaments/new" className="px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold">
                        + Create Tournament
                    </Link>
                    <Link href="/admin/stats" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold">
                        📊 Stats
                    </Link>
                    <Link href="/admin/templates" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold">
                        📋 Templates
                    </Link>
                </div>

                <div className="grid gap-4">
                    {tournaments.map((t: any) => (
                        <div key={t.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">{t.name}</h2>
                                <p className="text-gray-400">
                                    {new Date(t.date).toLocaleDateString()} at {new Date(t.date).toLocaleTimeString()}
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

                    {tournaments.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            No tournaments found. Create one to get started.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
