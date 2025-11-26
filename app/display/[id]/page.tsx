'use client'

import { getTournament, changeLevel } from '@/app/actions'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function DisplayPage() {
    const params = useParams()
    const [tournament, setTournament] = useState<any>(null)
    const [timeLeft, setTimeLeft] = useState<number>(0)
    const [loading, setLoading] = useState(true)
    const [showAlert, setShowAlert] = useState(false)
    const [showBalancingAlert, setShowBalancingAlert] = useState(false)
    const [balancingMessage, setBalancingMessage] = useState('')
    const lastLevelIndexRef = useRef<number | null>(null)
    const lastBalancingRef = useRef<string | null>(null)
    const isAdvancingRef = useRef(false)

    const id = parseInt(params.id as string)

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/level-up-289723.mp3')
            audio.volume = 0.7
            audio.play().catch(e => console.error("Audio play failed", e))
        } catch (e) {
            console.error("Audio play failed", e)
        }
    }

    const fetchTournament = async () => {
        try {
            const data = await getTournament(id)

            // Check for level change
            if (data && lastLevelIndexRef.current !== null) {
                if (data.currentLevelIndex > lastLevelIndexRef.current) {
                    setShowAlert(true)
                    playNotificationSound()
                    setTimeout(() => setShowAlert(false), 5000)
                }
            }
            if (data) {
                lastLevelIndexRef.current = data.currentLevelIndex
            }

            // Check for balancing recommendation change
            if (data && data.balancingRecommendation) {
                const currentBalancing = JSON.stringify(data.balancingRecommendation)
                if (lastBalancingRef.current !== null && lastBalancingRef.current !== currentBalancing) {
                    // New or changed balancing recommendation
                    setBalancingMessage(data.balancingRecommendation.message || 'Table balancing required')
                    setShowBalancingAlert(true)
                    setTimeout(() => setShowBalancingAlert(false), 15000)
                }
                lastBalancingRef.current = currentBalancing
            } else if (data) {
                lastBalancingRef.current = null
            }

            setTournament(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Poll for data updates
    useEffect(() => {
        fetchTournament()
        const interval = setInterval(fetchTournament, 5000)
        return () => clearInterval(interval)
    }, [id])

    // Timer Logic
    useEffect(() => {
        if (!tournament) return

        const calculateTimeLeft = () => {
            if (tournament.status === 'PAUSED') {
                return tournament.timerSeconds || 0
            }
            if (tournament.status !== 'RUNNING') {
                return 0
            }

            const level = tournament.levels[tournament.currentLevelIndex]
            if (!level) return 0

            const now = new Date().getTime()
            const start = new Date(tournament.levelStartedAt).getTime()
            const durationMs = level.duration * 60 * 1000
            const elapsed = now - start

            return Math.max(0, Math.floor((durationMs - elapsed) / 1000))
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft()
            setTimeLeft(remaining)

            // Auto-advance level if timer hits 0 and tournament is running
            if (remaining === 0 && tournament.status === 'RUNNING' && !lastBalancingRef.current) {
                // Use a flag to prevent multiple calls would be better, but for now rely on polling updates
                // Actually, let's use a ref to debounce
                if (!isAdvancingRef.current) {
                    isAdvancingRef.current = true
                    changeLevel(id, 'next')
                        .then(() => {
                            // Reset flag after a delay to allow for data refresh
                            setTimeout(() => { isAdvancingRef.current = false }, 5000)
                        })
                        .catch(e => {
                            console.error('Failed to auto-advance level', e)
                            isAdvancingRef.current = false
                        })
                }
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [tournament, id])

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
    if (!tournament) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Tournament not found</div>

    showTotalChips: boolean
    showPlayersList: boolean
    showAnte: boolean
}

// Parse display settings with defaults
const defaultSettings = {
    showTimer: true,
    showBlinds: true,
    showNextLevel: true,
    showPlayersLeft: true,
    showAvgStack: true,
    showTotalChips: true,
    showPlayersList: true,
    showAnte: true
}

let displaySettings = defaultSettings
if (tournament.displaySettings) {
    try {
        displaySettings = { ...defaultSettings, ...JSON.parse(tournament.displaySettings) }
    } catch (e) {
        console.error('Failed to parse display settings', e)
    }
}

const currentLevel = tournament.levels[tournament.currentLevelIndex]
const nextLevel = tournament.levels[tournament.currentLevelIndex + 1]
const activePlayers = tournament.registrations.filter((r: any) => r.status === 'REGISTERED').length
const totalChips = tournament.registrations.length * tournament.stack +
    tournament.registrations.reduce((acc: number, r: any) => acc + (r.rebuys * tournament.stack) + (r.addons * tournament.stack), 0)
const avgStack = activePlayers > 0 ? Math.floor(totalChips / activePlayers) : 0

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

return (
    <div className="min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
        {/* Background Effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black opacity-50 z-0"></div>

        <div className="relative z-10 h-screen flex flex-col p-8">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-600">
                    {tournament.name}
                </h1>
                <div className={`px-6 py-2 rounded-full font-bold tracking-widest text-sm border ${tournament.status === 'RUNNING' ? 'border-green-500 text-green-400 bg-green-900/20' :
                    tournament.status === 'PAUSED' ? 'border-yellow-500 text-yellow-400 bg-yellow-900/20' :
                        'border-gray-500 text-gray-400'
                    }`}>
                    {tournament.status}
                </div>
            </header>

            {/* Main Display */}
            <main className="flex-1 grid grid-cols-12 gap-8">

                {/* Left Column: Timer & Blinds */}
                <div className="col-span-8 flex flex-col justify-center items-center text-center space-y-12">

                    {/* Timer */}
                    {displaySettings.showTimer && (
                        <div className="relative">
                            <div className="text-[12rem] leading-none font-bold tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                {formatTime(timeLeft)}
                                <h2 className="text-[12rem] leading-none font-black uppercase tracking-tighter mb-8">Level Up!</h2>
                                <div className="text-[8rem] leading-none font-bold mb-4">
                                    {currentLevel?.smallBlind} / {currentLevel?.bigBlind}
                                </div>
                                <div className="text-6xl font-semibold opacity-75 uppercase tracking-widest">
                                    Ante: {currentLevel?.ante}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table Balancing Alert */}
                    {showBalancingAlert && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                            <div className="w-[90vw] h-[80vh] bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-[3rem] shadow-[0_0_150px_rgba(59,130,246,0.8)] flex flex-col items-center justify-center text-center p-12">
                                <div className="text-8xl mb-8">⚖️</div>
                                <h2 className="text-[8rem] leading-none font-black uppercase tracking-tighter mb-8">Table Balancing</h2>
                                <div className="text-4xl font-semibold max-w-4xl whitespace-pre-line">
                                    {balancingMessage}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                )
}
