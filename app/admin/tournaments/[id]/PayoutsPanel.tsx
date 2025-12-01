
'use client'

import { useState } from 'react'
import { Tournament, Payout, Player, Registration } from '@/lib/entities'
import { addPayout, removePayout, assignPayout, updatePayout } from '@/app/payout-actions'
import PayoutRecommendation from './PayoutRecommendation'

interface PayoutsPanelProps {
    tournament: Tournament & { payouts: Payout[], registrations: Registration[] }
    allPlayers: Player[]
}

export default function PayoutsPanel({ tournament, allPlayers }: PayoutsPanelProps) {
    const [amount, setAmount] = useState('')
    const [place, setPlace] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    // Editing state
    const [editingId, setEditingId] = useState<number | null>(null)
    const [editAmount, setEditAmount] = useState('')
    const [editPlace, setEditPlace] = useState('')
    const [editDescription, setEditDescription] = useState('')

    // Calculate prize pool
    const totalBuyIns = (tournament.buyIn || 0) * tournament.registrations.length
    const totalRebuys = tournament.registrations.reduce((sum, r) => sum + (r.rebuys || 0), 0) * (tournament.buyIn || 0)
    const totalAddons = tournament.registrations.reduce((sum, r) => sum + (r.addons || 0), 0) * (tournament.buyIn || 0)
    const totalPrizePool = totalBuyIns + totalRebuys + totalAddons

    const allocatedPrize = tournament.payouts?.reduce((sum, p) => sum + p.amount, 0) || 0
    const remainingPrize = totalPrizePool - allocatedPrize

    const handleAddPayout = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!amount) return

        setLoading(true)
        try {
            await addPayout(
                tournament.id,
                parseInt(amount),
                place ? parseInt(place) : undefined,
                description
            )
            setAmount('')
            setPlace('')
            setDescription('')
        } catch (error) {
            console.error('Failed to add payout:', error)
        } finally {
            setLoading(false)
        }
    }

    const startEditing = (payout: Payout) => {
        setEditingId(payout.id)
        setEditAmount(payout.amount.toString())
        setEditPlace(payout.place?.toString() || '')
        setEditDescription(payout.description || '')
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditAmount('')
        setEditPlace('')
        setEditDescription('')
    }

    const saveEditing = async (payoutId: number) => {
        if (!editAmount) return
        setLoading(true)
        try {
            await updatePayout(
                payoutId,
                parseInt(editAmount),
                editPlace ? parseInt(editPlace) : undefined,
                editDescription
            )
            setEditingId(null)
        } catch (error) {
            console.error('Failed to update payout:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignPlayer = async (payoutId: number, playerId: string) => {
        try {
            await assignPayout(payoutId, playerId ? parseInt(playerId) : null)
        } catch (error) {
            console.error('Failed to assign player:', error)
        }
    }

    const sortedPayouts = [...(tournament.payouts || [])].sort((a, b) => {
        if (a.place && b.place) return a.place - b.place
        if (a.place) return -1
        if (b.place) return 1
        return b.amount - a.amount
    })

    return (
        <div className="space-y-6">
            {/* Prize Pool Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Total Prize Pool</div>
                    <div className="text-2xl font-bold text-amber-500">${totalPrizePool.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {tournament.registrations.length} entries • {tournament.registrations.reduce((s, r) => s + r.rebuys, 0)} rebuys
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Allocated</div>
                    <div className="text-2xl font-bold text-green-400">${allocatedPrize.toLocaleString()}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {((allocatedPrize / totalPrizePool) * 100 || 0).toFixed(1)}% of pool
                    </div>
                </div>
                <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <div className="text-gray-400 text-sm mb-1">Remaining</div>
                    <div className={`text-2xl font-bold ${remainingPrize < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        ${remainingPrize.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Recommendation Tool */}
            <PayoutRecommendation
                tournamentId={tournament.id}
                totalPrizePool={totalPrizePool}
                entriesCount={tournament.registrations.length}
            />

            {/* Add Payout Form */}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                <h3 className="text-lg font-bold mb-4 text-white">Add Payout</h3>
                <form onSubmit={handleAddPayout} className="flex flex-wrap gap-4 items-end">
                    <div className="w-24">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Place</label>
                        <input
                            type="number"
                            value={place}
                            onChange={(e) => setPlace(e.target.value)}
                            placeholder="#"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Amount ($)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0"
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Description (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g. High Hand, Bounty"
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-amber-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold h-[42px]"
                    >
                        Add
                    </button>
                </form>
            </div>

            {/* Payouts List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="p-4 w-20 text-center">Place</th>
                            <th className="p-4 w-32 text-right">Amount</th>
                            <th className="p-4">Description</th>
                            <th className="p-4 w-64">Winner</th>
                            <th className="p-4 w-24 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {sortedPayouts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-500">
                                    No payouts defined yet.
                                </td>
                            </tr>
                        ) : (
                            sortedPayouts.map((payout) => (
                                <tr key={payout.id} className="hover:bg-gray-700/50">
                                    {editingId === payout.id ? (
                                        <>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editPlace}
                                                    onChange={(e) => setEditPlace(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-center text-white"
                                                    placeholder="#"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={editAmount}
                                                    onChange={(e) => setEditAmount(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-right text-white"
                                                    placeholder="$"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={editDescription}
                                                    onChange={(e) => setEditDescription(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-1 text-white"
                                                    placeholder="Desc"
                                                />
                                            </td>
                                            <td className="p-4 text-gray-500 italic">
                                                Editing...
                                            </td>
                                            <td className="p-2 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => saveEditing(payout.id)}
                                                    className="text-green-400 hover:text-green-300 p-1 mr-1"
                                                    title="Save"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="text-red-400 hover:text-red-300 p-1"
                                                    title="Cancel"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="p-4 text-center font-bold text-white">
                                                {payout.place ? (
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${payout.place === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                                        payout.place === 2 ? 'bg-gray-400/20 text-gray-400' :
                                                            payout.place === 3 ? 'bg-amber-700/20 text-amber-700' :
                                                                'bg-gray-800 text-gray-400'
                                                        }`}>
                                                        {payout.place}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-green-400">
                                                ${payout.amount.toLocaleString()}
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {payout.description || (payout.place ? `${payout.place}${getOrdinalSuffix(payout.place)} Place` : 'Prize')}
                                            </td>
                                            <td className="p-4">
                                                <select
                                                    value={payout.player?.id || ''}
                                                    onChange={(e) => handleAssignPlayer(payout.id, e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white focus:border-amber-500 outline-none"
                                                >
                                                    <option value="">-- Select Winner --</option>
                                                    {allPlayers.map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.firstName} {p.lastName}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => startEditing(payout)}
                                                    className="text-blue-400 hover:text-blue-300 p-2"
                                                    title="Edit Payout"
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    onClick={() => removePayout(payout.id)}
                                                    className="text-red-400 hover:text-red-300 p-2"
                                                    title="Remove Payout"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
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
