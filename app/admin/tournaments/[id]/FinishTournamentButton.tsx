'use client'

import { finishTournament } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function FinishTournamentButton({
    tournamentId,
    isFree,
    activePlayerCount
}: {
    tournamentId: number
    isFree: boolean
    activePlayerCount: number
}) {
    const router = useRouter()
    const [showBountyModal, setShowBountyModal] = useState(false)
    const [bountyCount, setBountyCount] = useState(0)
    const [loading, setLoading] = useState(false)

    const hasOnePlayerLeft = activePlayerCount === 1

    const handleFinish = async () => {
        if (isFree && hasOnePlayerLeft && !showBountyModal) {
            setShowBountyModal(true)
            return
        }

        if (!showBountyModal && !confirm('Are you sure you want to finish this tournament?')) {
            return
        }

        setLoading(true)
        await finishTournament(tournamentId, showBountyModal ? bountyCount : undefined)
        setShowBountyModal(false)
        setBountyCount(0)
        setLoading(false)
        router.refresh()
    }

    return (
        <>
            <button
                onClick={handleFinish}
                disabled={loading}
                className="px-6 py-2 rounded-lg font-bold text-sm bg-red-900 text-red-300 hover:bg-red-800 border border-red-800 disabled:opacity-50"
            >
                {loading ? 'Finishing...' : '🏁 End Tournament'}
            </button>

            {showBountyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">🏆 Winner Bounty</h3>
                        <p className="text-gray-400 mb-4">
                            The tournament has one player remaining. Enter their bounty count before finishing:
                        </p>
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">
                                Bounty Count (players eliminated by the winner):
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
                                    setShowBountyModal(false)
                                    setBountyCount(0)
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                            >
                                {loading ? 'Finishing...' : 'Finish Tournament'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
