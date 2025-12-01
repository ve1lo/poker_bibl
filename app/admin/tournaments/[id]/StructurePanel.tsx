'use client'

import { useState } from 'react'
import { Tournament, TournamentLevel } from '@/lib/entities'
import { updateTournamentLevels } from '@/app/actions'

interface StructurePanelProps {
    tournament: Tournament
}

export default function StructurePanel({ tournament }: StructurePanelProps) {
    const [levels, setLevels] = useState(tournament.levels.map(l => ({
        smallBlind: l.smallBlind,
        bigBlind: l.bigBlind,
        ante: l.ante,
        duration: l.duration,
        isBreak: l.isBreak
    })))
    const [loading, setLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const handleLevelChange = (index: number, field: string, value: string | number | boolean) => {
        const newLevels = [...levels]
        newLevels[index] = { ...newLevels[index], [field]: value }
        setLevels(newLevels)
    }

    const addLevel = () => {
        const lastLevel = levels[levels.length - 1]
        setLevels([...levels, {
            smallBlind: lastLevel ? lastLevel.smallBlind * 2 : 100,
            bigBlind: lastLevel ? lastLevel.bigBlind * 2 : 200,
            ante: lastLevel ? lastLevel.ante * 2 : 0,
            duration: lastLevel ? lastLevel.duration : 15,
            isBreak: false
        }])
    }

    const removeLevel = (index: number) => {
        setLevels(levels.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        setLoading(true)
        setSuccessMessage('')
        try {
            await updateTournamentLevels(tournament.id, levels)
            setSuccessMessage('Structure updated successfully!')
            setTimeout(() => setSuccessMessage(''), 3000)
        } catch (error) {
            console.error(error)
            alert('Failed to update structure')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Tournament Structure</h2>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {successMessage && (
                <div className="mb-4 p-4 bg-green-900/50 border border-green-500 text-green-200 rounded-lg">
                    {successMessage}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                            <th className="p-3">Level</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Small Blind</th>
                            <th className="p-3">Big Blind</th>
                            <th className="p-3">Ante</th>
                            <th className="p-3">Duration (min)</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {levels.map((level, index) => (
                            <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-750">
                                <td className="p-3 text-gray-500 font-mono">#{index + 1}</td>
                                <td className="p-3">
                                    <select
                                        value={level.isBreak ? 'BREAK' : 'LEVEL'}
                                        onChange={(e) => handleLevelChange(index, 'isBreak', e.target.value === 'BREAK')}
                                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm"
                                    >
                                        <option value="LEVEL">Level</option>
                                        <option value="BREAK">Break</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    {!level.isBreak && (
                                        <input
                                            type="number"
                                            value={level.smallBlind}
                                            onChange={(e) => handleLevelChange(index, 'smallBlind', parseInt(e.target.value))}
                                            className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                        />
                                    )}
                                </td>
                                <td className="p-3">
                                    {!level.isBreak && (
                                        <input
                                            type="number"
                                            value={level.bigBlind}
                                            onChange={(e) => handleLevelChange(index, 'bigBlind', parseInt(e.target.value))}
                                            className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                        />
                                    )}
                                </td>
                                <td className="p-3">
                                    {!level.isBreak && (
                                        <input
                                            type="number"
                                            value={level.ante}
                                            onChange={(e) => handleLevelChange(index, 'ante', parseInt(e.target.value))}
                                            className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                        />
                                    )}
                                </td>
                                <td className="p-3">
                                    <input
                                        type="number"
                                        value={level.duration}
                                        onChange={(e) => handleLevelChange(index, 'duration', parseInt(e.target.value))}
                                        className="w-24 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-white"
                                    />
                                </td>
                                <td className="p-3">
                                    <button
                                        onClick={() => removeLevel(index)}
                                        className="text-red-400 hover:text-red-300"
                                        title="Remove Level"
                                    >
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button
                onClick={addLevel}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white rounded-lg transition-colors font-bold"
            >
                + Add Level
            </button>
        </div>
    )
}
