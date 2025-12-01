'use client'

import { createTable, deleteTable, assignSeating, clearSeating, updateTable, seatPlayers, movePlayer, unseatPlayer } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Table, Registration } from '@/lib/entities'

interface TablesSectionProps {
    tournamentId: number
    tables: (Table & { registrations: Registration[] })[]
    registrations: Registration[]
    isFinished: boolean
    balancingRecommendation?: {
        action: string
        message: string
        recommendations?: { fromTable: number, toTable: number, count: number }[]
        assignments?: string[]
        tableNumber?: number
    }
}

export default function TablesSection({ tournamentId, tables, registrations, isFinished, balancingRecommendation }: TablesSectionProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [editingTable, setEditingTable] = useState<number | null>(null)
    const [editMaxSeats, setEditMaxSeats] = useState<number>(9)
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([])
    const [dismissedRecommendation, setDismissedRecommendation] = useState(false)
    const [draggedPlayer, setDraggedPlayer] = useState<(Registration & { currentTableId: number }) | null>(null)
    const [dragOverSeat, setDragOverSeat] = useState<{ tableId: number, seatNum: number } | null>(null)
    const [playerToUnseat, setPlayerToUnseat] = useState<number | null>(null)

    const handleCreateTable = async () => {
        setLoading(true)
        await createTable(tournamentId)
        router.refresh()
        setLoading(false)
    }

    const handleUnseatPlayer = async () => {
        if (!playerToUnseat) return

        try {
            setLoading(true)
            await unseatPlayer(playerToUnseat)
            setPlayerToUnseat(null)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error unseating player'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTable = async (tableId: number, hasPlayers: boolean) => {
        const message = hasPlayers
            ? 'Table has seated players. Deleting it will unseat them. Continue?'
            : 'Are you sure you want to delete this table?'

        if (!confirm(message)) return

        try {
            setLoading(true)
            await deleteTable(tableId)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error deleting table'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateMaxSeats = async (tableId: number) => {
        if (editMaxSeats < 2 || editMaxSeats > 10) {
            alert('Max seats must be between 2 and 10')
            return
        }

        try {
            setLoading(true)
            await updateTable(tableId, editMaxSeats)
            setEditingTable(null)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error updating table'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignSeating = async () => {
        if (!confirm('This will randomly assign all players to tables. Continue?')) return

        try {
            setLoading(true)
            await assignSeating(tournamentId)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error assigning seating'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    const handleClearSeating = async () => {
        if (!confirm('This will clear all seating assignments. Continue?')) return

        setLoading(true)
        await clearSeating(tournamentId)
        router.refresh()
        setLoading(false)
    }

    const handleSeatSelected = async () => {
        if (selectedPlayers.length === 0) return

        try {
            setLoading(true)
            await seatPlayers(tournamentId, selectedPlayers)
            setSelectedPlayers([])
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error seating players'
            alert(message)
        } finally {
            setLoading(false)
        }
    }

    const togglePlayerSelection = (regId: number) => {
        setSelectedPlayers(prev =>
            prev.includes(regId)
                ? prev.filter(id => id !== regId)
                : [...prev, regId]
        )
    }

    const handleDragStart = (player: Registration, tableId: number) => {
        if (isFinished) return
        setDraggedPlayer({ ...player, currentTableId: tableId })
    }

    const handleDragEnd = () => {
        setDraggedPlayer(null)
        setDragOverSeat(null)
    }

    const handleDragOver = (e: React.DragEvent, tableId: number, seatNum: number) => {
        e.preventDefault()
        if (!draggedPlayer) return
        setDragOverSeat({ tableId, seatNum })
    }

    const handleDragLeave = () => {
        setDragOverSeat(null)
    }

    const handleDrop = async (e: React.DragEvent, targetTableId: number, targetSeatNum: number) => {
        e.preventDefault()
        if (!draggedPlayer) return

        try {
            await movePlayer(draggedPlayer.id, targetTableId, targetSeatNum)
            router.refresh()
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to move player'
            alert(message)
        } finally {
            setDraggedPlayer(null)
            setDragOverSeat(null)
        }
    }

    const hasSeating = tables.some(t => t.registrations?.some((r: Registration) => r.seatNumber))
    const unseatedPlayers = registrations?.filter((r: Registration) => r.status === 'REGISTERED' && !r.seatNumber) || []

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Tables Area */}
            <div className="lg:col-span-3 bg-gray-800 rounded-xl border border-gray-700 p-6">
                {/* Balancing Recommendation Block */}
                {!dismissedRecommendation && balancingRecommendation && (
                    <div className="mb-6 bg-amber-900/30 border-2 border-amber-500 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">⚖️</span>
                                    <h3 className="text-lg font-bold text-amber-400">
                                        {balancingRecommendation.action === 'break_table' ? 'Break Table Recommendation' : 'Balance Tables Recommendation'}
                                    </h3>
                                </div>
                                <p className="text-white whitespace-pre-line">{balancingRecommendation.message}</p>
                            </div>
                            <button
                                onClick={() => setDismissedRecommendation(true)}
                                className="ml-4 text-gray-400 hover:text-white text-xl font-bold"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Tables & Seating</h2>
                    <div className="flex gap-2">
                        {!isFinished && (
                            <button
                                onClick={handleCreateTable}
                                disabled={loading}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded font-bold text-sm disabled:opacity-50"
                            >
                                + Add Table
                            </button>
                        )}
                    </div>
                </div>

                {tables.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-900 rounded-xl border border-gray-700 border-dashed">
                        <p className="mb-4 text-lg">No tables yet</p>
                        {!isFinished && (
                            <button
                                onClick={handleCreateTable}
                                disabled={loading}
                                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold disabled:opacity-50"
                            >
                                Create First Table
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                            {tables.map((table: Table & { registrations: Registration[] }) => {
                                const seatedPlayers = table.registrations?.filter((r: Registration) =>
                                    r.status === 'REGISTERED' && r.seatNumber
                                ) || []
                                const isEditing = editingTable === table.id

                                return (
                                    <div key={table.id} className="bg-gray-900 rounded-xl border border-gray-700 p-6 relative">
                                        {/* Header & Controls */}
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-xl text-amber-500">Table {table.tableNumber}</h3>
                                                <div className="text-sm text-gray-400">
                                                    {seatedPlayers.length}/{table.maxSeats} seats occupied
                                                </div>
                                            </div>

                                            {!isFinished && (
                                                <div className="flex gap-2 z-10">
                                                    <button
                                                        onClick={() => {
                                                            if (isEditing) {
                                                                setEditingTable(null)
                                                            } else {
                                                                setEditingTable(table.id)
                                                                setEditMaxSeats(table.maxSeats)
                                                            }
                                                        }}
                                                        className="px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs font-bold border border-gray-600"
                                                    >
                                                        {isEditing ? 'Cancel Edit' : '⚙️ Config'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTable(table.id, seatedPlayers.length > 0)}
                                                        disabled={loading}
                                                        className="px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-300 rounded text-xs font-bold border border-red-900"
                                                    >
                                                        ✕ Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit Mode */}
                                        {isEditing && (
                                            <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-600">
                                                <div className="flex items-center gap-4">
                                                    <label className="text-sm text-gray-300">Max seats (2-10):</label>
                                                    <input
                                                        type="number"
                                                        min="2"
                                                        max="10"
                                                        value={editMaxSeats}
                                                        onChange={(e) => setEditMaxSeats(parseInt(e.target.value))}
                                                        className="w-20 px-2 py-1 bg-gray-900 border border-gray-600 rounded text-sm"
                                                    />
                                                    <button
                                                        onClick={() => handleUpdateMaxSeats(table.id)}
                                                        disabled={loading}
                                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-bold"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Visual Table */}
                                        <div className="relative bg-gradient-to-br from-green-900 to-green-800 rounded-full aspect-square border-8 border-amber-900 shadow-xl p-8 max-w-[500px] mx-auto">
                                            {/* Table center */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-6xl font-bold text-green-950 opacity-30">♠</div>
                                                </div>
                                            </div>

                                            {/* Seats */}
                                            {Array.from({ length: table.maxSeats }, (_, i) => {
                                                const seatNum = i + 1
                                                const player = seatedPlayers.find((r: Registration) => r.seatNumber === seatNum)

                                                // Calculate position
                                                const angle = (i / table.maxSeats) * 2 * Math.PI - Math.PI / 2
                                                const radius = 42 // percentage
                                                const x = 50 + radius * Math.cos(angle)
                                                const y = 50 + radius * Math.sin(angle)

                                                return (
                                                    <div
                                                        key={seatNum}
                                                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                                        style={{ left: `${x}%`, top: `${y}%` }}
                                                    >
                                                        {player ? (
                                                            <div
                                                                draggable={!isFinished}
                                                                onDragStart={() => handleDragStart(player, table.id)}
                                                                onDragEnd={handleDragEnd}
                                                                className={`bg-gray-900 border-2 border-amber-500 rounded-lg px-2 py-1 shadow-lg min-w-[80px] text-center z-10 ${!isFinished ? 'cursor-move hover:border-amber-400 hover:shadow-xl transition-all' : ''
                                                                    } ${draggedPlayer?.id === player.id ? 'opacity-50' : ''}`}
                                                            >
                                                                <div className="text-[10px] text-amber-500 font-bold leading-none mb-0.5">Seat {seatNum}</div>
                                                                <div className="text-xs font-bold text-white truncate max-w-[80px]">
                                                                    {player.player.username}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onDragOver={(e) => handleDragOver(e, table.id, seatNum)}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={(e) => handleDrop(e, table.id, seatNum)}
                                                                className={`bg-gray-800/50 border-2 rounded-lg px-2 py-1 min-w-[60px] text-center transition-all ${dragOverSeat?.tableId === table.id && dragOverSeat?.seatNum === seatNum
                                                                    ? 'border-green-500 bg-green-900/30 scale-110'
                                                                    : 'border-gray-600/50'
                                                                    }`}
                                                            >
                                                                <div className="text-[10px] text-gray-500 font-bold leading-none">Seat {seatNum}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {!isFinished && (
                            <div className="flex gap-2 pt-6 border-t border-gray-700">
                                <button
                                    onClick={handleAssignSeating}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold text-lg disabled:opacity-50 shadow-lg"
                                >
                                    🎲 {hasSeating ? 'Reshuffle' : 'Assign'} Seating
                                </button>
                                {hasSeating && (
                                    <button
                                        onClick={handleClearSeating}
                                        disabled={loading}
                                        className="px-6 py-3 bg-red-900 text-red-300 hover:bg-red-800 rounded-lg font-bold disabled:opacity-50"
                                    >
                                        Clear Seating
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Unseated Players Sidebar */}
            <div className="lg:col-span-1 bg-gray-800 rounded-xl border border-gray-700 p-6 h-fit sticky top-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Unseated ({unseatedPlayers.length})</h3>
                    {unseatedPlayers.length > 0 && (
                        <button
                            onClick={() => {
                                if (selectedPlayers.length === unseatedPlayers.length) {
                                    setSelectedPlayers([])
                                } else {
                                    setSelectedPlayers(unseatedPlayers.map((r: Registration) => r.id))
                                }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                        >
                            {selectedPlayers.length === unseatedPlayers.length ? 'Deselect All' : 'Select All'}
                        </button>
                    )}
                </div>

                {unseatedPlayers.length === 0 ? (
                    <div className="text-gray-500 text-center py-8 text-sm">
                        All active players are seated.
                    </div>
                ) : (
                    <div className="space-y-2 mb-4 max-h-[600px] overflow-y-auto pr-2">
                        {unseatedPlayers.map((reg: Registration) => (
                            <label
                                key={reg.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedPlayers.includes(reg.id)
                                    ? 'bg-blue-900/30 border-blue-500/50'
                                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPlayers.includes(reg.id)}
                                    onChange={() => togglePlayerSelection(reg.id)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold truncate">{reg.player.username}</div>
                                    <div className="text-xs text-gray-500">
                                        {reg.player.firstName} {reg.player.lastName}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                )}

                {unseatedPlayers.length > 0 && (
                    <button
                        onClick={handleSeatSelected}
                        disabled={loading || selectedPlayers.length === 0}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        Seat Selected ({selectedPlayers.length})
                    </button>
                )}

                {/* Manual Unseat Section */}
                <div className="mt-8 pt-6 border-t border-gray-700">
                    <h3 className="font-bold text-lg mb-4">Manual Unseat</h3>
                    <div className="space-y-3">
                        <select
                            value={playerToUnseat || ''}
                            onChange={(e) => setPlayerToUnseat(Number(e.target.value) || null)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-white focus:border-blue-500 outline-none"
                        >
                            <option value="">Select player to unseat...</option>
                            {tables.flatMap(t => t.registrations || [])
                                .filter((r: Registration) => r.status === 'REGISTERED' && r.seatNumber)
                                .sort((a: Registration, b: Registration) => a.player.username.localeCompare(b.player.username))
                                .map((r: Registration) => (
                                    <option key={r.id} value={r.id}>
                                        {r.player.username} (Table {r.table?.tableNumber}, Seat {r.seatNumber})
                                    </option>
                                ))
                            }
                        </select>
                        <button
                            onClick={handleUnseatPlayer}
                            disabled={loading || !playerToUnseat}
                            className="w-full px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded-lg font-bold text-sm disabled:opacity-50 border border-red-900"
                        >
                            Unseat Player
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
