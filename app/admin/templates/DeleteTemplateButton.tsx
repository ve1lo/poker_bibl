'use client'

import { deleteTemplate } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function DeleteTemplateButton({ templateId }: { templateId: number }) {
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this template?')) {
            return
        }

        await deleteTemplate(templateId)
        router.refresh()
    }

    return (
        <button
            onClick={handleDelete}
            className="w-full px-3 py-2 bg-red-900 text-red-300 rounded hover:bg-red-800 text-sm"
        >
            Delete
        </button>
    )
}
