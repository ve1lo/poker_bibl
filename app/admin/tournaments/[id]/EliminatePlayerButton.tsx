'use client'

import { eliminatePlayer } from '@/app/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBalancing } from './BalancingProvider'

export default function EliminatePlayerButton({
    registrationId,
    isFree
}: {
    registrationId: number
    isFree: boolean
}) {
    const [showModal, setShowModal] = useState(false)
    const [bountyCount, setBountyCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { setRecommendation } = useBalancing()

    const handleEliminate = async () => {
        if (isFree && !showModal) {
            setShowModal(true)
            return
        }

        setLoading(true)
        try {
            const result = await eliminatePlayer(registrationId, isFree ? bountyCount : 0)

            if (result && result.message) {
                setRecommendation(result)
            }
        } catch (error) {
            console.error(error)
        }

        setShowModal(false)
        setBountyCount(0)
        setLoading(false)
        router.refresh()
    }

    return (
        <>
            <button
                onClick={handleEliminate}
                className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded hover:bg-red-800"
            >
                Eliminate
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Eliminate Player</h3>
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">
                                Bounty Count (players eliminated by this player):
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={bountyCount}
                                onChange={(e) => setBountyCount(parseInt(e.target.value) || 0)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    setBountyCount(0)
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEliminate}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                            >
                                {loading ? 'Eliminating...' : 'Confirm Elimination'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
