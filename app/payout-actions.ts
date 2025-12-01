'use server'

import { getDataSource } from '@/lib/data-source'
import { Tournament, Payout, Player } from '@/lib/entities'
import { revalidatePath } from 'next/cache'

export async function addPayout(tournamentId: number, amount: number, place?: number, description?: string) {
    const ds = await getDataSource()
    const payoutRepo = ds.getRepository(Payout)
    const tournamentRepo = ds.getRepository(Tournament)

    const tournament = await tournamentRepo.findOne({ where: { id: tournamentId } })
    if (!tournament) throw new Error('Tournament not found')

    const payout = new Payout()
    payout.tournament = tournament
    payout.amount = amount
    payout.place = place || null
    payout.description = description || null

    await payoutRepo.save(payout)
    revalidatePath(`/admin/tournaments/${tournamentId}`)
}

export async function removePayout(payoutId: number) {
    const ds = await getDataSource()
    const payoutRepo = ds.getRepository(Payout)

    const payout = await payoutRepo.findOne({
        where: { id: payoutId },
        relations: { tournament: true }
    })

    if (!payout) return

    const tournamentId = payout.tournament.id
    await payoutRepo.remove(payout)
    revalidatePath(`/admin/tournaments/${tournamentId}`)
}

export async function assignPayout(payoutId: number, playerId: number | null) {
    const ds = await getDataSource()
    const payoutRepo = ds.getRepository(Payout)
    const playerRepo = ds.getRepository(Player)

    const payout = await payoutRepo.findOne({
        where: { id: payoutId },
        relations: { tournament: true }
    })

    if (!payout) return

    if (playerId) {
        const player = await playerRepo.findOne({ where: { id: playerId } })
        if (!player) throw new Error('Player not found')
        payout.player = player
    } else {
        payout.player = null
    }

    await payoutRepo.save(payout)
    revalidatePath(`/admin/tournaments/${payout.tournament.id}`)
}

export async function applyPayoutStructure(tournamentId: number, payouts: { amount: number, place: number, description?: string }[]) {
    const ds = await getDataSource()
    const payoutRepo = ds.getRepository(Payout)
    const tournamentRepo = ds.getRepository(Tournament)

    const tournament = await tournamentRepo.findOne({ where: { id: tournamentId } })
    if (!tournament) throw new Error('Tournament not found')

    // Delete existing payouts
    await payoutRepo.delete({ tournament: { id: tournamentId } })

    // Create new payouts
    const newPayouts = payouts.map(p => {
        const payout = new Payout()
        payout.tournament = tournament
        payout.amount = p.amount
        payout.place = p.place
        payout.description = p.description || null
        return payout
    })

    await payoutRepo.save(newPayouts)
    revalidatePath(`/admin/tournaments/${tournamentId}`)
}

export async function updatePayout(payoutId: number, amount: number, place?: number, description?: string) {
    const ds = await getDataSource()
    const payoutRepo = ds.getRepository(Payout)

    const payout = await payoutRepo.findOne({
        where: { id: payoutId },
        relations: { tournament: true }
    })

    if (!payout) return

    payout.amount = amount
    payout.place = place || null
    payout.description = description || null

    await payoutRepo.save(payout)
    revalidatePath(`/admin/tournaments/${payout.tournament.id}`)
}
