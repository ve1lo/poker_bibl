'use client'

import { useState } from 'react'
import { movePlayer } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { Table, Registration } from '@/lib/entities'

interface MovePlayerButtonProps {
    registrationId: number
    playerName: string
    currentTable: number
    currentSeat: number
    tables: (Table & { registrations: Registration[] })[]
}

export default function MovePlayerButton({
    registrationId,
    playerName,
    currentTable,
    currentSeat,
    tables
}: MovePlayerButtonProps) {
    const [showModal, setShowModal] = useState(false)
    const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
    const [selectedSeat, setSelectedSeat] = useState<number | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const selectedTable = tables.find(t => t.id === selectedTableId)
    const availableSeats = selectedTable
        ? Array.from({ length: selectedTable.maxSeats }, (_, i) => i + 1).filter(seat => {
            const isTaken = selectedTable.registrations?.some((r: Registration) =>
                r.status === 'REGISTERED' && r.seatNumber === seat
            )
            return !isTaken
        })
        : []

    const handleClose = () => {
        setShowModal(false)
        setError('')
        setSelectedTableId(null)
        setSelectedSeat(null)
    }

    const handleMove = async () => {
        if (!selectedTableId || !selectedSeat) {
            setError('Please select table and seat')
            return
        }

        setLoading(true)
        setError('')

        try {
            await movePlayer(registrationId, selectedTableId, selectedSeat)
            handleClose()
            router.refresh()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to move player'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded hover:bg-blue-800"
                title="Move player to another table"
            >
                Move
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={handleClose}
                >
                    <div
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with close button */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold text-white">
                                    Move {playerName}
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">
                                    Current: Table {currentTable}, Seat {currentSeat}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-white text-3xl font-bold leading-none -mt-1"
                                title="Close"
                            >
                                ✕
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Table Selection */}
                            <div>
                                <label className="block text-gray-300 text-base font-semibold mb-3">
                                    Target Table:
                                </label>
                                <select
                                    value={selectedTableId || ''}
                                    onChange={(e) => {
                                        setSelectedTableId(Number(e.target.value))
                                        setSelectedSeat(null)
                                    }}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-4 text-white text-base focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select table...</option>
                                    {tables.map(table => (
                                        <option key={table.id} value={table.id}>
                                            Table {table.tableNumber} ({table.registrations?.filter((r: Registration) => r.status === 'REGISTERED').length || 0}/{table.maxSeats} seats)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Seat Selection */}
                            {selectedTableId && (
                                <div>
                                    <label className="block text-gray-300 text-base font-semibold mb-3">
                                        Target Seat:
                                    </label>
                                    <div className="grid grid-cols-9 gap-3">
                                        {availableSeats.map(seat => (
                                            <button
                                                key={seat}
                                                type="button"
                                                onClick={() => setSelectedSeat(seat)}
                                                className={`p-4 rounded-lg font-bold text-lg transition-colors ${selectedSeat === seat
                                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    }`}
                                            >
                                                {seat}
                                            </button>
                                        ))}
                                    </div>
                                    {availableSeats.length === 0 && (
                                        <p className="text-gray-500 text-sm mt-3">No available seats on this table</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-6 py-3 text-gray-400 hover:text-white font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMove}
                                disabled={loading || !selectedTableId || !selectedSeat}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Moving...' : 'Move Player'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
