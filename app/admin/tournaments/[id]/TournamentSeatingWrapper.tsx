'use client'

import { useState, createContext, useContext } from 'react'
import TablesSection from './TablesSection'
import { Table, Registration } from '@/lib/entities'

interface BalancingRecommendation {
    action: string
    message: string
    recommendations?: { fromTable: number, toTable: number, count: number }[]
    assignments?: string[]
    tableNumber?: number
}

const BalancingContext = createContext<{
    recommendation: BalancingRecommendation | null
    setRecommendation: (rec: BalancingRecommendation | null) => void
}>({
    recommendation: null,
    setRecommendation: () => { }
})

export function useBalancing() {
    return useContext(BalancingContext)
}

interface TournamentSeatingWrapperProps {
    tournamentId: number
    tables: (Table & { registrations: Registration[] })[]
    registrations: Registration[]
    isFinished: boolean
}

export default function TournamentSeatingWrapper({
    tournamentId,
    tables,
    registrations,
    isFinished
}: TournamentSeatingWrapperProps) {
    const [recommendation, setRecommendation] = useState<BalancingRecommendation | null>(null)

    return (
        <BalancingContext.Provider value={{ recommendation, setRecommendation }}>
            <TablesSection
                tournamentId={tournamentId}
                tables={tables}
                registrations={registrations}
                isFinished={isFinished}
                balancingRecommendation={recommendation || undefined}
            />
        </BalancingContext.Provider>
    )
}
