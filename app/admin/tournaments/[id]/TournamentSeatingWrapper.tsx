'use client'

import { useState, createContext, useContext } from 'react'
import TablesSection from './TablesSection'

const BalancingContext = createContext<{
    recommendation: any
    setRecommendation: (rec: any) => void
}>({
    recommendation: null,
    setRecommendation: () => { }
})

export function useBalancing() {
    return useContext(BalancingContext)
}

export default function TournamentSeatingWrapper({
    tournamentId,
    tables,
    registrations,
    isFinished
}: {
    tournamentId: number
    tables: any[]
    registrations: any[]
    isFinished: boolean
}) {
    const [recommendation, setRecommendation] = useState<any>(null)

    return (
        <BalancingContext.Provider value={{ recommendation, setRecommendation }}>
            <TablesSection
                tournamentId={tournamentId}
                tables={tables}
                registrations={registrations}
                isFinished={isFinished}
                balancingRecommendation={recommendation}
            />
        </BalancingContext.Provider>
    )
}
