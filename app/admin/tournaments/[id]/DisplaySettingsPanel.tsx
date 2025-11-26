'use client'

import { updateDisplaySettings } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface DisplaySettings {
    showTimer: boolean
    showBlinds: boolean
    showNextLevel: boolean
    showPlayersLeft: boolean
    showAvgStack: boolean
    showTotalChips: boolean
    showPlayersList: boolean
    showAnte: boolean
}

const defaultSettings: DisplaySettings = {
    showTimer: true,
    showBlinds: true,
    showNextLevel: true,
    showPlayersLeft: true,
    showAvgStack: true,
    showTotalChips: true,
    showPlayersList: true,
    showAnte: true
}

export default function DisplaySettingsPanel({
    tournamentId,
    initialSettings
}: {
    tournamentId: number
    initialSettings?: string | null
}) {
    const router = useRouter()
    const [settings, setSettings] = useState<DisplaySettings>(defaultSettings)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initialSettings) {
            try {
                const parsed = JSON.parse(initialSettings)
                setSettings({ ...defaultSettings, ...parsed })
            } catch (e) {
                console.error('Failed to parse display settings', e)
            }
        }
    }, [initialSettings])

    const handleToggle = async (key: keyof DisplaySettings) => {
        const newSettings = { ...settings, [key]: !settings[key] }
        setSettings(newSettings)

        setLoading(true)
        try {
            await updateDisplaySettings(tournamentId, newSettings)
            router.refresh()
        } catch (error: any) {
            alert(error.message || 'Error updating display settings')
            // Revert on error
            setSettings(settings)
        } finally {
            setLoading(false)
        }
    }

    const settingsConfig = [
        { key: 'showTimer' as keyof DisplaySettings, label: 'Timer', description: 'Show countdown timer' },
        { key: 'showBlinds' as keyof DisplaySettings, label: 'Blinds', description: 'Show current blinds' },
        { key: 'showAnte' as keyof DisplaySettings, label: 'Ante', description: 'Show current ante' },
        { key: 'showNextLevel' as keyof DisplaySettings, label: 'Next Level', description: 'Show next level blinds' },
        { key: 'showPlayersLeft' as keyof DisplaySettings, label: 'Players Left', description: 'Show remaining players count' },
        { key: 'showAvgStack' as keyof DisplaySettings, label: 'Average Stack', description: 'Show average chip stack' },
        { key: 'showTotalChips' as keyof DisplaySettings, label: 'Total Chips', description: 'Show total chips in play' },
        { key: 'showPlayersList' as keyof DisplaySettings, label: 'Players List', description: 'Show list of active players' }
    ]

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Display Settings</h2>
                <p className="text-gray-400 text-sm">
                    Control which elements are visible on the tournament display screen. Changes apply in real-time.
                </p>
            </div>

            <div className="space-y-4">
                {settingsConfig.map(({ key, label, description }) => (
                    <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                    >
                        <div className="flex-1">
                            <div className="font-bold text-white">{label}</div>
                            <div className="text-sm text-gray-400">{description}</div>
                        </div>
                        <button
                            onClick={() => handleToggle(key)}
                            disabled={loading}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 ${settings[key] ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                ))}
            </div>

            {loading && (
                <div className="mt-4 text-center text-sm text-gray-400">
                    Updating display...
                </div>
            )}
        </div>
    )
}
