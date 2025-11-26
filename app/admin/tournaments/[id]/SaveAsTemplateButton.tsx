'use client'

import { saveAsTemplate } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SaveAsTemplateButton({ tournamentId }: { tournamentId: number }) {
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [templateName, setTemplateName] = useState('')
    const [templateDescription, setTemplateDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!templateName.trim()) {
            alert('Please enter a template name')
            return
        }

        setLoading(true)
        await saveAsTemplate(tournamentId, templateName, templateDescription)
        setShowModal(false)
        setTemplateName('')
        setTemplateDescription('')
        setLoading(false)
        router.refresh()
        alert('Template saved successfully!')
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-6 py-2 rounded-lg font-bold text-sm bg-purple-900 text-purple-300 hover:bg-purple-800 border border-purple-800"
            >
                💾 Save as Template
            </button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-white">Save as Template</h3>
                        <p className="text-gray-400 mb-4 text-sm">
                            This will save the tournament structure (blinds, levels, buy-in, stack) as a reusable template.
                        </p>

                        <div className="space-y-4 mb-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="e.g., Standard Turbo"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={templateDescription}
                                    onChange={(e) => setTemplateDescription(e.target.value)}
                                    rows={3}
                                    className="w-full bg-gray-900 border border-gray-700 rounded p-3 text-white focus:border-amber-500 outline-none"
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    setTemplateName('')
                                    setTemplateDescription('')
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
