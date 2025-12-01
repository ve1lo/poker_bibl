'use client'

import { getTournament, changeLevel, toggleTournamentStatus } from '@/app/actions'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Tournament } from '@/lib/entities'

interface ExtendedTournament extends Tournament {
    balancingRecommendation?: {
        message?: string
        action?: string
        recommendations?: { fromTable: number, toTable: number, count: number }[]
        assignments?: string[]
        tableNumber?: number
    }
}

interface DisplaySettings {
    showTimer: boolean
    showBlinds: boolean
    showNextLevel: boolean
    showPlayersLeft: boolean
    showAvgStack: boolean
    showTotalChips: boolean
    showPlayersList: boolean
    showAnte: boolean
}

export default function DisplayPage() {
    const params = useParams()
    const [tournament, setTournament] = useState<ExtendedTournament | null>(null)
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

    const fetchTournament = useCallback(async () => {
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
    }, [id])

    // Poll for data updates
    useEffect(() => {
        fetchTournament()
        const interval = setInterval(fetchTournament, 5000)
        return () => clearInterval(interval)
    }, [fetchTournament])

    // Timer Logic
    useEffect(() => {
        if (!tournament) return

        const calculateTimeLeft = () => {
            if (tournament.status === 'BREAK') {
                if (!tournament.breakStartTime || !tournament.breakDurationMinutes) return 0
                const now = new Date().getTime()
                const start = new Date(tournament.breakStartTime).getTime()
                const durationMs = tournament.breakDurationMinutes * 60 * 1000
                const elapsed = now - start
                return Math.max(0, Math.floor((durationMs - elapsed) / 1000))
            }
            if (tournament.status === 'PAUSED') {
                return tournament.timerSeconds || 0
            }
            if (tournament.status !== 'RUNNING') {
                return 0
            }

            const level = tournament.levels[tournament.currentLevelIndex]
            if (!level) return 0

            const now = new Date().getTime()
            const start = tournament.levelStartedAt ? new Date(tournament.levelStartedAt).getTime() : now
            const durationMs = level.duration * 60 * 1000
            const elapsed = now - start

            return Math.max(0, Math.floor((durationMs - elapsed) / 1000))
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft()
            setTimeLeft(remaining)

            // Auto-advance level if timer hits 0 and tournament is running
            if (remaining === 0 && tournament.status === 'RUNNING') {
                if (!isAdvancingRef.current) {
                    isAdvancingRef.current = true
                    console.log('Auto-advancing level...')
                    changeLevel(id, 'next')
                        .then(() => {
                            setTimeout(() => { isAdvancingRef.current = false }, 5000)
                        })
                        .catch(e => {
                            console.error('Failed to auto-advance level', e)
                            isAdvancingRef.current = false
                        })
                }
            }

            // Auto-resume from break if timer hits 0
            if (remaining === 0 && tournament.status === 'BREAK') {
                if (!isAdvancingRef.current) {
                    isAdvancingRef.current = true
                    console.log('Ending break...')
                    toggleTournamentStatus(id)
                        .then(() => {
                            setTimeout(() => { isAdvancingRef.current = false }, 5000)
                        })
                        .catch(e => {
                            console.error('Failed to end break', e)
                            isAdvancingRef.current = false
                        })
                }
            }
        }, 1000)

        return () => clearInterval(timer)
    }, [tournament, id])

    if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
    if (!tournament) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Tournament not found</div>

    // Parse display settings with defaults
    const defaultSettings: DisplaySettings = {
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
    const activePlayers = tournament.registrations.filter(r => r.status === 'REGISTERED').length
    const totalChips = tournament.registrations.length * tournament.stack +
        tournament.registrations.reduce((acc, r) => acc + (r.rebuys * tournament.stack) + (r.addons * tournament.stack), 0)
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
                            tournament.status === 'BREAK' ? 'border-blue-500 text-blue-400 bg-blue-900/20' :
                                'border-gray-500 text-gray-400'
                        }`}>
                        {tournament.status}
                    </div>
                </header>

                {/* Main Display */}
                <main className="flex-1 grid grid-cols-12 gap-8 min-h-0">

                    {/* Left Column: Timer & Blinds */}
                    <div className="col-span-8 flex flex-col justify-center items-center text-center space-y-12">

                        {/* Timer */}
                        {displaySettings.showTimer && (
                            <div className="relative">
                                <div className="text-[12rem] leading-none font-bold tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                                    {formatTime(timeLeft)}
                                </div>
                                <div className="text-2xl text-gray-500 uppercase tracking-[0.5em] mt-4">
                                    {tournament.status === 'BREAK' ? 'Break Time' : `Level ${currentLevel?.levelNumber || '-'}`}
                                </div>
                            </div>
                        )}

                        {/* Blinds & Ante */}
                        {(displaySettings.showBlinds || displaySettings.showAnte) && (
                            <div className="w-full max-w-4xl bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-3xl p-12 flex justify-around items-center shadow-2xl">
                                {displaySettings.showBlinds && (
                                    <div>
                                        <div className="text-gray-400 text-xl uppercase tracking-widest mb-2">Blinds</div>
                                        <div className="text-7xl font-bold text-white">
                                            {currentLevel ? `${currentLevel.smallBlind} / ${currentLevel.bigBlind}` : '-'}
                                        </div>
                                    </div>
                                )}

                                {displaySettings.showBlinds && displaySettings.showAnte && (
                                    <div className="w-px h-32 bg-gray-800"></div>
                                )}

                                {displaySettings.showAnte && (
                                    <div>
                                        <div className="text-gray-400 text-xl uppercase tracking-widest mb-2">Ante</div>
                                        <div className="text-7xl font-bold text-amber-500">
                                            {currentLevel?.ante || 0}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    {/* Right Column: Stats & Next Level */}
                    <div className="col-span-4 flex flex-col gap-4 h-full min-h-0">

                        {/* Next Level */}
                        {displaySettings.showNextLevel && (
                            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex-none">
                                <div className="text-gray-500 text-sm uppercase tracking-widest mb-2">Next Level</div>
                                <div className="text-3xl font-bold text-gray-300">
                                    {nextLevel ? `${nextLevel.smallBlind} / ${nextLevel.bigBlind}` : 'End'}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">Ante: {nextLevel?.ante || 0}</div>
                            </div>
                        )}

                        {/* Stats Grid - Equal Height Blocks */}
                        <div className="grid grid-cols-1 gap-4 flex-none">
                            {displaySettings.showPlayersLeft && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center h-32">
                                    <div className="text-gray-500 text-sm uppercase tracking-widest mb-2">Players Left</div>
                                    <div className="text-5xl font-bold text-white">{activePlayers} <span className="text-2xl text-gray-600">/ {tournament.registrations.length}</span></div>
                                </div>
                            )}

                            {displaySettings.showAvgStack && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center h-32">
                                    <div className="text-gray-500 text-sm uppercase tracking-widest mb-2">Avg Stack</div>
                                    <div className="text-5xl font-bold text-amber-500">{avgStack.toLocaleString()}</div>
                                </div>
                            )}

                            {displaySettings.showTotalChips && (
                                <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex flex-col justify-center h-32">
                                    <div className="text-gray-500 text-sm uppercase tracking-widest mb-2">Total Chips</div>
                                    <div className="text-4xl font-bold text-gray-300">{totalChips.toLocaleString()}</div>
                                </div>
                            )}
                        </div>

                        {/* Players List - Stretched */}
                        {displaySettings.showPlayersList && (
                            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6 flex-1 overflow-hidden flex flex-col min-h-0">
                                <div className="text-gray-500 text-sm uppercase tracking-widest mb-4 flex-none">Active Players</div>
                                <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                                    {tournament.registrations
                                        .filter(r => r.status === 'REGISTERED')
                                        .sort((a, b) => {
                                            const nameA = a.player.username || `${a.player.firstName} ${a.player.lastName}`
                                            const nameB = b.player.username || `${b.player.firstName} ${b.player.lastName}`
                                            return nameA.localeCompare(nameB)
                                        })
                                        .map((reg) => (
                                            <div key={reg.id} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                                                <span className="text-white font-medium text-sm truncate">
                                                    {reg.player.username || `${reg.player.firstName} ${reg.player.lastName}`}
                                                </span>
                                                {reg.table && reg.seatNumber && (
                                                    <span className="text-xs text-gray-400 ml-2 whitespace-nowrap">
                                                        T{reg.table.tableNumber} S{reg.seatNumber}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
            {/* Level Up Alert */}
            {showAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="w-[90vw] h-[80vh] bg-amber-500 text-black rounded-[3rem] shadow-[0_0_150px_rgba(245,158,11,0.8)] flex flex-col items-center justify-center text-center animate-bounce">
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
