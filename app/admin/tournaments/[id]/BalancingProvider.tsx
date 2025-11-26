'use client'

import { useState, createContext, useContext, ReactNode } from 'react'

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

export default function BalancingProvider({ children }: { children: ReactNode }) {
    const [recommendation, setRecommendation] = useState<any>(null)

    return (
        <BalancingContext.Provider value={{ recommendation, setRecommendation }}>
            {children}
        </BalancingContext.Provider>
    )
}
