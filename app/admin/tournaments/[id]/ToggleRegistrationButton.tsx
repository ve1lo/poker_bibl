'use client'

import { toggleRegistration } from '@/app/actions'
import { useRouter } from 'next/navigation'

export default function ToggleRegistrationButton({ tournamentId, isClosed }: { tournamentId: number, isClosed: boolean }) {
    const router = useRouter()

    const handleToggle = async () => {
        await toggleRegistration(tournamentId)
        router.refresh()
    }

    return (
        <button
            onClick={handleToggle}
            className={`px-4 py-2 rounded-lg font-bold text-sm ${isClosed
                    ? 'bg-green-900 text-green-300 hover:bg-green-800 border border-green-800'
                    : 'bg-orange-900 text-orange-300 hover:bg-orange-800 border border-orange-800'
                }`}
        >
            {isClosed ? '🔓 Open Registration' : '🔒 Close Registration'}
        </button>
    )
}
