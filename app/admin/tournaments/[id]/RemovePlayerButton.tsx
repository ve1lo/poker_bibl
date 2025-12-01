'use client'

import { useState } from 'react'
import { removePlayerFromTournament } from '@/app/actions'

interface RemovePlayerButtonProps {
    registrationId: number
    playerName: string
}

export default function RemovePlayerButton({ registrationId, playerName }: RemovePlayerButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleRemove = async () => {
        if (!confirm(`Are you sure you want to remove ${playerName} from the tournament?`)) return

        setLoading(true)
        try {
            await removePlayerFromTournament(registrationId)
        } catch (error) {
            console.error('Failed to remove player', error)
            alert('Failed to remove player')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleRemove}
            disabled={loading}
            className="p-2 bg-red-900/50 hover:bg-red-900 text-red-200 rounded transition-colors"
            title="Remove Player"
        >
            {loading ? '...' : '❌'}
        </button>
    )
}
