import { getTemplate, createTournamentFromTemplate } from '@/app/actions'
import { notFound, redirect } from 'next/navigation'

export default async function UseTemplatePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const template = await getTemplate(id)

    if (!template) return notFound()

    async function handleSubmit(formData: FormData) {
        'use server'
        const name = formData.get('name') as string
        const date = formData.get('date') as string
        const season = formData.get('season') as string

        const tournamentId = await createTournamentFromTemplate(id, name, date, season)
        redirect(`/admin/tournaments/${tournamentId}`)
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold text-amber-500 mb-2">Create Tournament from Template</h1>
                <p className="text-gray-400 mb-8">Using template: <strong>{template.name}</strong></p>

                <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 mb-6">
                    <h3 className="text-lg font-bold mb-4">Template Details</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Type:</span>
                            <span className="font-bold">{template.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Buy-in:</span>
                            <span className="font-mono">{template.buyIn || 'Free'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Starting Stack:</span>
                            <span className="font-mono">{template.stack}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Levels:</span>
                            <span className="font-mono">{template.levels?.length || 0}</span>
                        </div>
                    </div>
                </div>

                <form action={handleSubmit} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-2">Tournament Name</label>
                            <input
                                type="text"
                                name="name"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                placeholder="e.g., Friday Night Poker"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2">Date & Time</label>
                            <input
                                type="datetime-local"
                                name="date"
                                required
                                className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                            />
                        </div>

                        {template.type === 'FREE' && (
                            <div>
                                <label className="block text-sm font-bold mb-2">Season (Optional)</label>
                                <input
                                    type="text"
                                    name="season"
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="e.g. Winter 2024"
                                />
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-bold"
                            >
                                Create Tournament
                            </button>
                            <a
                                href="/admin/templates"
                                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold text-center"
                            >
                                Cancel
                            </a>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
