'use client'

import { useState, useRef, useEffect } from 'react'
import { registerPlayer, createPlayer } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function AddPlayerForm({
    tournamentId,
    allPlayers,
    registeredPlayerIds
}: {
    tournamentId: number
    allPlayers: any[]
    registeredPlayerIds: number[]
}) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newPlayerName, setNewPlayerName] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Filter out already registered players
    const availablePlayers = allPlayers.filter(p =>
        !registeredPlayerIds.includes(p.id)
    )

    // Character-by-character search
    const filteredPlayers = availablePlayers.filter(p => {
        const fullName = `${p.firstName} ${p.lastName} ${p.username}`.toLowerCase()
        return fullName.includes(searchQuery.toLowerCase())
    })

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectPlayer = (player: any) => {
        setSelectedPlayerId(player.id)
        setSearchQuery(`${player.firstName} ${player.lastName}`)
        setShowDropdown(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return

        if (selectedPlayerId) {
            setLoading(true)
            await registerPlayer(tournamentId, selectedPlayerId)
            setLoading(false)
            setSelectedPlayerId(null)
            setSearchQuery("")
            router.refresh()
        } else if (searchQuery.trim()) {
            setIsModalOpen(true)
        }
    }

    const handleCreatePlayer = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPlayerName.trim() || loading) return

        setLoading(true)
        try {
            const newPlayer = await createPlayer(newPlayerName)
            await registerPlayer(tournamentId, newPlayer.id)
            setIsModalOpen(false)
            setNewPlayerName("")
            setSearchQuery("")
            router.refresh()
        } catch (error) {
            console.error("Failed to create player", error)
            alert("Failed to create player")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="relative" ref={dropdownRef}>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setSelectedPlayerId(null)
                                setShowDropdown(true)
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search or create player..."
                            className="bg-gray-700 text-white px-3 py-1 rounded text-sm w-64"
                        />

                        {showDropdown && searchQuery && (
                            <div className="absolute top-full left-0 mt-1 w-full bg-gray-700 border border-gray-600 rounded shadow-lg max-h-60 overflow-y-auto z-50">
                                {filteredPlayers.length > 0 ? (
                                    filteredPlayers.map((p: any) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => handleSelectPlayer(p)}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-600 text-white text-sm"
                                        >
                                            {p.firstName} {p.lastName} {p.username ? `(@${p.username})` : ''}
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-gray-400 text-sm">
                                        No players found. Click "Add" to create new.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !searchQuery.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded text-sm font-bold disabled:opacity-50"
                    >
                        {loading ? '...' : '+ Add'}
                    </button>
                </form>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Add New Player</h3>
                        <form onSubmit={handleCreatePlayer}>
                            <input
                                type="text"
                                placeholder="Player Name"
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white mb-4 focus:border-amber-500 outline-none"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded font-bold"
                                >
                                    {loading ? 'Creating...' : 'Create & Add'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
