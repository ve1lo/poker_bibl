'use client'

import { useState } from 'react'
import { registerRebuy, registerAddon } from '@/app/actions'

interface RebuyAddonButtonsProps {
    registrationId: number
    rebuys: number
    addons: number
}

export default function RebuyAddonButtons({ registrationId, rebuys, addons }: RebuyAddonButtonsProps) {
    const [loading, setLoading] = useState(false)

    const handleRebuy = async () => {
        if (!confirm('Register a rebuy for this player?')) return
        setLoading(true)
        try {
            await registerRebuy(registrationId)
        } catch (error) {
            console.error('Failed to register rebuy:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddon = async () => {
        if (!confirm('Register an addon for this player?')) return
        setLoading(true)
        try {
            await registerAddon(registrationId)
        } catch (error) {
            console.error('Failed to register addon:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-1">
            <button
                onClick={handleRebuy}
                disabled={loading}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded disabled:opacity-50"
                title="Add Rebuy"
            >
                +R
            </button>
            <button
                onClick={handleAddon}
                disabled={loading}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded disabled:opacity-50"
                title="Add Addon"
            >
                +A
            </button>
        </div>
    )
}
