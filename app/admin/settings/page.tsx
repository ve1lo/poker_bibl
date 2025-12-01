'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSystemSettings, updateSystemSettings } from '@/app/actions'

export default function SettingsPage() {
    const [theme, setTheme] = useState('default')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')

    useEffect(() => {
        getSystemSettings().then(settings => {
            setTheme(settings.theme)
            setLoading(false)
        })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        setMessage('')
        try {
            await updateSystemSettings(theme)
            setMessage('Settings saved successfully! Refresh to see changes.')
            // Force reload to apply theme
            window.location.reload()
        } catch (error) {
            console.error(error)
            setMessage('Failed to save settings')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-white">Loading settings...</div>

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/admin" className="text-gray-400 hover:text-white">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-amber-500">System Settings</h1>
                </div>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <h2 className="text-xl font-bold mb-6">Appearance</h2>

                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2">System Theme</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button
                                onClick={() => setTheme('default')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${theme === 'default'
                                    ? 'border-amber-500 bg-gray-700'
                                    : 'border-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-bold mb-1">Default (Dark)</div>
                                <div className="text-sm text-gray-400">Classic dark mode</div>
                                <div className="mt-2 flex gap-1">
                                    <div className="w-4 h-4 rounded-full bg-gray-900"></div>
                                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTheme('forest')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${theme === 'forest'
                                    ? 'border-green-500 bg-green-900/20'
                                    : 'border-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-bold mb-1">Forest</div>
                                <div className="text-sm text-gray-400">Deep green tones</div>
                                <div className="mt-2 flex gap-1">
                                    <div className="w-4 h-4 rounded-full bg-[#052e16]"></div>
                                    <div className="w-4 h-4 rounded-full bg-amber-400"></div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTheme('ocean')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${theme === 'ocean'
                                    ? 'border-sky-500 bg-sky-900/20'
                                    : 'border-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-bold mb-1">Ocean</div>
                                <div className="text-sm text-gray-400">Cool blue tones</div>
                                <div className="mt-2 flex gap-1">
                                    <div className="w-4 h-4 rounded-full bg-[#0f172a]"></div>
                                    <div className="w-4 h-4 rounded-full bg-sky-400"></div>
                                </div>
                            </button>

                            <button
                                onClick={() => setTheme('light')}
                                className={`p-4 rounded-lg border-2 text-left transition-all ${theme === 'light'
                                    ? 'border-amber-500 bg-gray-100 text-black'
                                    : 'border-gray-600 hover:border-gray-500'
                                    }`}
                            >
                                <div className="font-bold mb-1">Light</div>
                                <div className="text-sm text-gray-500">Bright mode</div>
                                <div className="mt-2 flex gap-1">
                                    <div className="w-4 h-4 rounded-full bg-white border border-gray-300"></div>
                                    <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {message && (
                        <div className={`mb-4 p-3 rounded ${message.includes('success') ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold disabled:opacity-50 transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    )
}
