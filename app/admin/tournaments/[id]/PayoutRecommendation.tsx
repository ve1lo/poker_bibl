'use client'

import { useState } from 'react'
import { applyPayoutStructure } from '@/app/payout-actions'

interface PayoutRecommendationProps {
    tournamentId: number
    totalPrizePool: number
    entriesCount: number
}

interface PayoutOption {
    place: number
    percent: number
    amount: number
}

export default function PayoutRecommendation({ tournamentId, totalPrizePool, entriesCount }: PayoutRecommendationProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [placesPaid, setPlacesPaid] = useState(Math.max(2, Math.ceil(entriesCount * 0.15))) // Default to ~15%

    // Calculate payouts based on number of places
    const calculatePayouts = (count: number): PayoutOption[] => {
        if (count <= 0) return []

        let structure: number[] = []

        // Simple standard payout structures (percentages)
        if (count === 2) structure = [65, 35]
        else if (count === 3) structure = [50, 30, 20]
        else if (count === 4) structure = [45, 25, 18, 12]
        else if (count === 5) structure = [40, 25, 15, 12, 8]
        else if (count === 6) structure = [38, 22, 14, 10, 9, 7]
        else if (count === 7) structure = [35, 21, 13, 10, 9, 7, 5]
        else if (count === 8) structure = [33, 20, 13, 10, 8, 7, 5, 4]
        else if (count === 9) structure = [31, 19, 12, 10, 8, 7, 5, 4, 4]
        else {
            // Re-implementing a smoother curve for N places:
            let totalWeight = 0
            const weights = []
            for (let i = 0; i < count; i++) {
                const w = 1 / (i + 1) // 1, 0.5, 0.33...
                weights.push(w)
                totalWeight += w
            }
            structure = weights.map(w => (w / totalWeight) * 100)
        }

        // Round amounts to nearest 10
        let remainingPool = totalPrizePool
        const payouts = structure.map((pct, idx) => {
            const isLast = idx === structure.length - 1
            const rawAmount = totalPrizePool * (pct / 100)
            let amount = Math.round(rawAmount / 10) * 10

            // Adjust last place to match total exactly
            if (isLast) {
                amount = remainingPool
            } else {
                remainingPool -= amount
            }

            return {
                place: idx + 1,
                percent: pct,
                amount
            }
        })

        return payouts
    }

    const recommendedPayouts = calculatePayouts(placesPaid)

    const handleApply = async () => {
        if (!confirm('This will replace all existing payouts. Continue?')) return

        setLoading(true)
        try {
            await applyPayoutStructure(tournamentId, recommendedPayouts.map(p => ({
                amount: p.amount,
                place: p.place,
                description: `${p.place}${getOrdinalSuffix(p.place)} Place`
            })))
            setIsOpen(false)
        } catch (error) {
            console.error('Failed to apply payouts:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="text-amber-500 hover:text-amber-400 text-sm font-bold underline decoration-dotted"
            >
                Need help? Use Payout Recommendation
            </button>
        )
    }

    return (
        <div className="bg-gray-750 border border-gray-600 rounded-xl p-4 mt-4">
            <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-white">Payout Recommendation</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-bold text-gray-400 mb-1">
                    Places Paid (approx. 10-15% of {entriesCount} entries)
                </label>
                <div className="flex gap-2 items-center">
                    <input
                        type="range"
                        min="2"
                        max={Math.min(entriesCount, 20)} // Cap at 20 or entries
                        value={placesPaid}
                        onChange={(e) => setPlacesPaid(parseInt(e.target.value))}
                        className="flex-1"
                    />
                    <span className="font-bold w-8 text-center">{placesPaid}</span>
                </div>
            </div>

            <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden mb-4">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-gray-400 uppercase text-xs">
                        <tr>
                            <th className="px-3 py-2">Place</th>
                            <th className="px-3 py-2">%</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {recommendedPayouts.map((p) => (
                            <tr key={p.place}>
                                <td className="px-3 py-2">{p.place}</td>
                                <td className="px-3 py-2 text-gray-500">{p.percent.toFixed(1)}%</td>
                                <td className="px-3 py-2 text-right font-bold text-green-400">
                                    ${p.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end gap-2">
                <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 text-gray-400 hover:text-white text-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApply}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded disabled:opacity-50"
                >
                    {loading ? 'Applying...' : 'Apply Structure'}
                </button>
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
