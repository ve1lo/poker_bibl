import { getSeatingChart, getTournament } from '@/app/actions'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function SeatingChartPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const tournament = await getTournament(id)
    const tables = await getSeatingChart(id)

    if (!tournament) return notFound()

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/admin/tournaments/${id}`} className="text-gray-400 hover:text-white mb-2 inline-block">
                        ← Back to Tournament
                    </Link>
                    <h1 className="text-4xl font-bold text-amber-500 mb-2">Seating Chart</h1>
                    <p className="text-gray-400">{tournament.name}</p>
                </div>

                {tables.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                        <p className="text-gray-400 text-lg">No tables created yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {tables.map((table: any) => {
                            const seatedPlayers = table.registrations?.filter((r: any) =>
                                r.status === 'REGISTERED' && r.seatNumber
                            ) || []

                            return (
                                <div key={table.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                                    {/* Table Header */}
                                    <div className="text-center mb-6">
                                        <h2 className="text-2xl font-bold text-amber-500">Table {table.tableNumber}</h2>
                                        <p className="text-gray-400 text-sm">
                                            {seatedPlayers.length}/{table.maxSeats} seats occupied
                                        </p>
                                    </div>

                                    {/* Poker Table Visual */}
                                    <div className="relative bg-gradient-to-br from-green-900 to-green-800 rounded-full aspect-square border-8 border-amber-900 shadow-2xl p-8">
                                        {/* Table center */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-6xl font-bold text-green-950 opacity-30">♠</div>
                                                <div className="text-xs text-green-950 opacity-50 font-bold">TABLE {table.tableNumber}</div>
                                            </div>
                                        </div>

                                        {/* Seats positioned around the table */}
                                        {Array.from({ length: table.maxSeats }, (_, i) => {
                                            const seatNum = i + 1
                                            const player = seatedPlayers.find((r: any) => r.seatNumber === seatNum)

                                            // Calculate position around circle
                                            const angle = (i / table.maxSeats) * 2 * Math.PI - Math.PI / 2
                                            const radius = 45 // percentage
                                            const x = 50 + radius * Math.cos(angle)
                                            const y = 50 + radius * Math.sin(angle)

                                            return (
                                                <div
                                                    key={seatNum}
                                                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                                    style={{
                                                        left: `${x}%`,
                                                        top: `${y}%`,
                                                    }}
                                                >
                                                    {player ? (
                                                        <div className="bg-gray-900 border-2 border-amber-500 rounded-lg px-3 py-2 shadow-lg min-w-[100px] text-center">
                                                            <div className="text-xs text-amber-500 font-bold mb-1">Seat {seatNum}</div>
                                                            <div className="text-sm font-bold text-white truncate">
                                                                {player.player.username}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-gray-700 border-2 border-gray-600 rounded-lg px-3 py-2 shadow-lg min-w-[100px] text-center opacity-50">
                                                            <div className="text-xs text-gray-500 font-bold mb-1">Seat {seatNum}</div>
                                                            <div className="text-sm text-gray-500">Empty</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Players List */}
                                    {seatedPlayers.length > 0 && (
                                        <div className="mt-6 pt-4 border-t border-gray-700">
                                            <h3 className="text-sm font-bold text-gray-400 mb-2">Seated Players:</h3>
                                            <div className="space-y-1 text-sm">
                                                {seatedPlayers
                                                    .sort((a: any, b: any) => a.seatNumber - b.seatNumber)
                                                    .map((reg: any) => (
                                                        <div key={reg.id} className="flex justify-between text-gray-300">
                                                            <span>Seat {reg.seatNumber}:</span>
                                                            <span className="font-bold">{reg.player.username}</span>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
