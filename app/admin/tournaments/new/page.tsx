'use client'

import { createTournament } from '@/app/actions'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTournamentPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    interface Level {
        smallBlind: number
        bigBlind: number
        ante: number
        duration: number
        isBreak: boolean
    }

    const [levels, setLevels] = useState<Level[]>([
        { smallBlind: 100, bigBlind: 200, ante: 0, duration: 20, isBreak: false }
    ])

    const addLevel = () => {
        const last = levels[levels.length - 1]
        setLevels([...levels, { ...last, smallBlind: last.smallBlind * 2, bigBlind: last.bigBlind * 2 }])
    }

    const removeLevel = (index: number) => {
        setLevels(levels.filter((_, i) => i !== index))
    }

    const updateLevel = (index: number, field: keyof Level, value: number | boolean) => {
        const newLevels = [...levels]
        newLevels[index] = { ...newLevels[index], [field]: value }
        setLevels(newLevels)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            name: formData.get('name') as string,
            date: formData.get('date') as string,
            type: formData.get('type') as 'FREE' | 'PAID',
            buyIn: formData.get('buyIn') as string,
            stack: formData.get('stack') as string,
            season: formData.get('season') as string,
            levels
        }

        await createTournament(data)
        router.push('/admin')
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold text-amber-500 mb-8">Create Tournament</h1>

            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-bold mb-2">Tournament Name</label>
                        <input name="name" required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" placeholder="e.g. Sunday Special" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Start Date & Time</label>
                        <input name="date" type="datetime-local" required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Type</label>
                        <select name="type" className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" onChange={(e) => {
                            // Force re-render to show/hide season field
                            const form = e.target.form
                            if (form) {
                                const event = new Event('change', { bubbles: true })
                                form.dispatchEvent(event)
                            }
                        }}>
                            <option value="PAID">Paid (Money)</option>
                            <option value="FREE">Free (Ranked)</option>
                        </select>
                    </div>
                    <div className="hidden has-[:checked]:block">
                        <input type="checkbox" className="hidden peer" checked={true} readOnly />
                        {/* This is a hack to show/hide based on type selection without complex state */}
                    </div>

                    {/* Season field - only for FREE tournaments */}
                    <div className="col-span-2 md:col-span-1" style={{ display: 'none' }} ref={el => {
                        if (el && el.parentElement) {
                            const typeSelect = el.parentElement.querySelector('select[name="type"]') as HTMLSelectElement
                            if (typeSelect) {
                                const updateVisibility = () => {
                                    el.style.display = typeSelect.value === 'FREE' ? 'block' : 'none'
                                }
                                typeSelect.addEventListener('change', updateVisibility)
                                updateVisibility()
                            }
                        }
                    }}>
                        <label className="block text-sm font-bold mb-2">Season (Optional)</label>
                        <input name="season" className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" placeholder="e.g. Winter 2024" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Starting Stack</label>
                        <input name="stack" type="number" defaultValue={10000} required className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">Buy-in (if Paid)</label>
                        <input name="buyIn" type="number" className="w-full bg-gray-700 rounded p-2 border border-gray-600 focus:border-amber-500 outline-none" />
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Structure / Blinds</h2>
                        <button type="button" onClick={addLevel} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">+ Add Level</button>
                    </div>

                    <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-2 text-xs uppercase text-gray-400 font-bold mb-2">
                            <div>Level</div>
                            <div>SB</div>
                            <div>BB</div>
                            <div>Ante</div>
                            <div>Min</div>
                            <div>Break?</div>
                        </div>

                        {levels.map((level, i) => (
                            <div key={i} className="grid grid-cols-6 gap-2 items-center">
                                <div className="font-mono text-gray-500">#{i + 1}</div>
                                <input type="number" value={level.smallBlind} onChange={e => updateLevel(i, 'smallBlind', parseInt(e.target.value) || 0)} className="bg-gray-700 rounded p-1 w-full" />
                                <input type="number" value={level.bigBlind} onChange={e => updateLevel(i, 'bigBlind', parseInt(e.target.value) || 0)} className="bg-gray-700 rounded p-1 w-full" />
                                <input type="number" value={level.ante} onChange={e => updateLevel(i, 'ante', parseInt(e.target.value) || 0)} className="bg-gray-700 rounded p-1 w-full" />
                                <input type="number" value={level.duration} onChange={e => updateLevel(i, 'duration', parseInt(e.target.value) || 0)} className="bg-gray-700 rounded p-1 w-full" />
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={level.isBreak} onChange={e => updateLevel(i, 'isBreak', e.target.checked)} className="w-4 h-4" />
                                    <button type="button" onClick={() => removeLevel(i)} className="text-red-500 hover:text-red-400 ml-auto">×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded text-gray-400 hover:text-white">Cancel</button>
                    <button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2 rounded font-bold transition">
                        {loading ? 'Creating...' : 'Create Tournament'}
                    </button>
                </div>
            </form>
        </div>
    )
}
