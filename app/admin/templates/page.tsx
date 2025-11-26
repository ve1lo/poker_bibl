import { getTemplates } from '@/app/actions'
import Link from 'next/link'
import DeleteTemplateButton from './DeleteTemplateButton'

export default async function TemplatesPage() {
    const templates = await getTemplates()

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <Link href="/admin" className="text-gray-400 hover:text-white mb-2 inline-block">
                            ← Back to Admin
                        </Link>
                        <h1 className="text-4xl font-bold text-amber-500">Tournament Templates</h1>
                        <p className="text-gray-400 mt-2">Manage reusable tournament structures</p>
                    </div>
                    <Link
                        href="/admin/templates/new"
                        className="px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold"
                    >
                        + Create Template
                    </Link>
                </div>

                {/* Templates List */}
                {templates.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
                        <p className="text-gray-400 text-lg mb-4">No templates yet</p>
                        <Link
                            href="/admin/templates/new"
                            className="inline-block px-6 py-3 bg-amber-600 hover:bg-amber-700 rounded-lg font-bold"
                        >
                            Create Your First Template
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((template: any) => (
                            <div key={template.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-amber-500 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-1">{template.name}</h3>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${template.type === 'FREE' ? 'bg-green-900 text-green-300' : 'bg-blue-900 text-blue-300'
                                            }`}>
                                            {template.type}
                                        </span>
                                    </div>
                                </div>

                                {template.description && (
                                    <p className="text-gray-400 text-sm mb-4">{template.description}</p>
                                )}

                                <div className="space-y-2 text-sm text-gray-400 mb-4">
                                    <div className="flex justify-between">
                                        <span>Buy-in:</span>
                                        <span className="text-white font-mono">{template.buyIn || 'Free'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Starting Stack:</span>
                                        <span className="text-white font-mono">{template.stack}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Levels:</span>
                                        <span className="text-white font-mono">{template.levels?.length || 0}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <Link
                                        href={`/admin/templates/${template.id}/edit`}
                                        className="px-3 py-2 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 text-sm text-center font-bold"
                                    >
                                        Edit
                                    </Link>
                                    <DeleteTemplateButton templateId={template.id} />
                                    <Link
                                        href={`/admin/templates/${template.id}/use`}
                                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 rounded text-center text-sm font-bold"
                                    >
                                        Use
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
