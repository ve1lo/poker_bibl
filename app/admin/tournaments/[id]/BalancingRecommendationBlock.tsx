'use client'

import { useState, useEffect } from 'react'
import { useBalancing } from './BalancingProvider'
import { applyBreakTableRecommendation } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function BalancingRecommendationBlock({ tournamentId }: { tournamentId?: number }) {
    const { recommendation } = useBalancing()
    const [dismissed, setDismissed] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [applying, setApplying] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !recommendation || dismissed) return null

    const handleApply = async () => {
        if (!tournamentId) return
        setApplying(true)
        try {
            await applyBreakTableRecommendation(tournamentId, recommendation)
            setDismissed(true)
            router.refresh()
        } catch (error) {
            console.error('Failed to apply recommendation:', error)
            alert('Failed to apply recommendation')
        } finally {
            setApplying(false)
        }
    }

    return (
        <div className="mb-6 bg-amber-900/30 border-2 border-amber-500 rounded-lg p-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⚖️</span>
                        <h3 className="text-lg font-bold text-amber-400">
                            {recommendation.action === 'break_table' ? 'Break Table Recommendation' : 'Balance Tables Recommendation'}
                        </h3>
                    </div>
                    {recommendation.assignments && recommendation.assignments.length > 0 ? (
                        <div>
                            <p className="text-white font-semibold mb-2">
                                Break Table {recommendation.tableNumber}:
                            </p>
                            <ul className="space-y-1 mb-4">
                                {recommendation.assignments.map((assignment: string, idx: number) => (
                                    <li key={idx} className="text-white text-sm flex items-center gap-2">
                                        <span className="text-amber-400">→</span>
                                        {assignment}
                                    </li>
                                ))}
                            </ul>
                            {recommendation.action === 'break_table' && tournamentId && (
                                <button
                                    onClick={handleApply}
                                    disabled={applying}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold text-sm transition-colors disabled:opacity-50"
                                >
                                    {applying ? 'Applying...' : 'Apply & Break Table'}
                                </button>
                            )}
                        </div>
                    ) : (
                        <p className="text-white whitespace-pre-line">{recommendation.message}</p>
                    )}
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="ml-4 text-gray-400 hover:text-white text-xl font-bold"
                    title="Close"
                >
                    ✕
                </button>
            </div>
        </div>
    )
}
