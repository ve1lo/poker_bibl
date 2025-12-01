'use client'

import { useState, createContext, useContext, ReactNode } from 'react'

interface BalancingRecommendation {
    action: string
    message: string
    recommendations?: { fromTable: number, toTable: number, count: number }[]
    assignments?: string[]
    tableNumber?: number
    moves?: { registrationId: number, targetTableId: number, targetSeat: number }[]
    tableId?: number
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

export default function BalancingProvider({ children }: { children: ReactNode }) {
    const [recommendation, setRecommendation] = useState<BalancingRecommendation | null>(null)

    return (
        <BalancingContext.Provider value={{ recommendation, setRecommendation }}>
            {children}
        </BalancingContext.Provider>
    )
}
