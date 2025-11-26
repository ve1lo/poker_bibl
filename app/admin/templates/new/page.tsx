'use client'

import { createTemplate } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function NewTemplatePage() {
    const router = useRouter()
    const [type, setType] = useState<'FREE' | 'PAID'>('FREE')
    const [levels, setLevels] = useState([
        { smallBlind: 25, bigBlind: 50, ante: 0, duration: 20, isBreak: false },
        { smallBlind: 50, bigBlind: 100, ante: 0, duration: 20, isBreak: false },
        { smallBlind: 100, bigBlind: 200, ante: 25, duration: 20, isBreak: false },
    ])

    const addLevel = () => {
        const lastLevel = levels[levels.length - 1]
        setLevels([...levels, {
            smallBlind: lastLevel.smallBlind * 2,
            bigBlind: lastLevel.bigBlind * 2,
            ante: lastLevel.ante * 2,
            duration: 20,
            isBreak: false
        }])
    }

    const addBreak = () => {
        setLevels([...levels, { smallBlind: 0, bigBlind: 0, ante: 0, duration: 10, isBreak: true }])
    }

    const removeLevel = (index: number) => {
        setLevels(levels.filter((_, i) => i !== index))
    }

    const updateLevel = (index: number, field: string, value: any) => {
        const newLevels = [...levels]
        newLevels[index] = { ...newLevels[index], [field]: value }
        setLevels(newLevels)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const data = {
            name: formData.get('name'),
            description: formData.get('description'),
            type,
            buyIn: formData.get('buyIn'),
            stack: formData.get('stack'),
            levels
        }

        await createTemplate(data)
        router.push('/admin/templates')
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-amber-500 mb-8">Create Tournament Template</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <h2 className="text-2xl font-bold mb-4">Template Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Template Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="e.g., Standard Turbo Structure"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Description (Optional)</label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="Brief description of this template..."
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-2">Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as 'FREE' | 'PAID')}
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    >
                                        <option value="FREE">Free (Ranked)</option>
                                        <option value="PAID">Paid (Cash)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Buy-in</label>
                                    <input
                                        type="number"
                                        name="buyIn"
                                        min="0"
                                        value={type === 'FREE' ? '' : undefined}
                                        defaultValue={type === 'PAID' ? '100' : ''}
                                        disabled={type === 'FREE'}
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none disabled:opacity-50"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2">Starting Stack</label>
                                    <input
                                        type="number"
                                        name="stack"
                                        required
                                        min="1000"
                                        defaultValue="10000"
                                        className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Blind Structure */}
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Blind Structure</h2>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={addLevel}
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded font-bold text-sm"
                                >
                                    + Add Level
                                </button>
                                <button
                                    type="button"
                                    onClick={addBreak}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold text-sm"
                                >
                                    + Add Break
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {levels.map((level, index) => (
                                <div key={index} className="flex gap-2 items-center bg-gray-900 p-3 rounded">
                                    <span className="text-gray-500 font-mono w-8">#{index + 1}</span>

                                    {level.isBreak ? (
                                        <>
                                            <span className="flex-1 text-amber-500 font-bold">BREAK</span>
                                            <input
                                                type="number"
                                                value={level.duration}
                                                onChange={(e) => updateLevel(index, 'duration', parseInt(e.target.value))}
                                                className="w-20 bg-gray-800 border border-gray-700 rounded p-2 text-white text-center"
                                            />
                                            <span className="text-gray-500 w-12">min</span>
                                        </>
                                    ) : (
                                        <>
                                            <input
                                                type="number"
                                                value={level.smallBlind}
                                                onChange={(e) => updateLevel(index, 'smallBlind', parseInt(e.target.value))}
                                                className="w-24 bg-gray-800 border border-gray-700 rounded p-2 text-white text-center"
                                            />
                                            <span className="text-gray-500">/</span>
                                            <input
                                                type="number"
                                                value={level.bigBlind}
                                                onChange={(e) => updateLevel(index, 'bigBlind', parseInt(e.target.value))}
                                                className="w-24 bg-gray-800 border border-gray-700 rounded p-2 text-white text-center"
                                            />
                                            <span className="text-gray-500 w-16">Ante:</span>
                                            <input
                                                type="number"
                                                value={level.ante}
                                                onChange={(e) => updateLevel(index, 'ante', parseInt(e.target.value))}
                                                className="w-20 bg-gray-800 border border-gray-700 rounded p-2 text-white text-center"
                                            />
                                            <input
                                                type="number"
                                                value={level.duration}
                                                onChange={(e) => updateLevel(index, 'duration', parseInt(e.target.value))}
                                                className="w-20 bg-gray-800 border border-gray-700 rounded p-2 text-white text-center"
                                            />
                                            <span className="text-gray-500 w-12">min</span>
                                        </>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => removeLevel(index)}
                                        className="px-3 py-2 bg-red-900 text-red-300 rounded hover:bg-red-800 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-bold"
                        >
                            Create Template
                        </button>
                        <a
                            href="/admin/templates"
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
