'use server'

import { getDataSource } from '@/lib/data-source'
import { Tournament, Player, Registration, TournamentLevel, TournamentTemplate, TemplateLevel, Table } from '@/lib/entities'
import { revalidatePath } from 'next/cache'
import { calculatePoints } from '@/lib/points'
import { Not, IsNull } from 'typeorm'

export async function getTournaments() {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const tournaments = await repo.find({
        order: { date: 'DESC' },
        relations: { registrations: true }
    })

    // Map to match the shape expected by the UI (with _count)
    const plainTournaments = JSON.parse(JSON.stringify(tournaments))
    return plainTournaments.map((t: any) => ({
        ...t,
        _count: { registrations: t.registrations.length }
    }))
}

export async function createTournament(data: any) {
    const ds = await getDataSource()
    const { name, date, type, buyIn, stack, levels } = data

    const tournament = new Tournament()
    tournament.name = name
    tournament.date = new Date(date)
    tournament.type = type
    const parsedBuyIn = parseInt(buyIn)
    tournament.buyIn = !isNaN(parsedBuyIn) ? parsedBuyIn : null
    const parsedStack = parseInt(stack)
    tournament.stack = !isNaN(parsedStack) ? parsedStack : 0

    tournament.levels = levels.map((l: any, index: number) => {
        const level = new TournamentLevel()
        level.levelNumber = index + 1
        level.smallBlind = parseInt(l.smallBlind) || 0
        level.bigBlind = parseInt(l.bigBlind) || 0
        level.ante = parseInt(l.ante || 0) || 0
        level.duration = parseInt(l.duration) || 0
        level.isBreak = l.isBreak || false
        return level
    })

    await ds.manager.save(tournament)
    revalidatePath('/admin')
}

export async function getTournament(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const tournament = await repo.findOne({
        where: { id },
        relations: {
            levels: true,
            registrations: { player: true },
            events: true
        },
        order: {
            levels: { levelNumber: 'ASC' },
            events: { timestamp: 'DESC' }
            // Sorting registrations by points/place needs to be done in JS or QueryBuilder
        }
    })

    if (tournament) {
        tournament.registrations.sort((a, b) => (b.points || 0) - (a.points || 0))
    }

    const plainTournament = JSON.parse(JSON.stringify(tournament))

    // Add balancing recommendation if tournament is running
    if (plainTournament && plainTournament.status !== 'FINISHED') {
        const balancing = await checkAndBalanceTables(id)
        plainTournament.balancingRecommendation = balancing
    }

    return plainTournament
}

export async function getPlayers() {
    const ds = await getDataSource()
    const players = await ds.getRepository(Player).find({
        order: { firstName: 'ASC' }
    })
    return JSON.parse(JSON.stringify(players))
}

// Tournament Control Actions

export async function toggleTournamentStatus(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const t = await repo.findOne({ where: { id }, relations: { levels: true } })
    if (!t) throw new Error("Tournament not found")

    const now = new Date()

    if (t.status === 'SCHEDULED') {
        t.status = 'RUNNING'
        t.levelStartedAt = now
        t.currentLevelIndex = 0
    } else if (t.status === 'RUNNING') {
        // Pause
        const level = t.levels[t.currentLevelIndex]
        const elapsedSec = Math.floor((now.getTime() - (t.levelStartedAt?.getTime() || now.getTime())) / 1000)
        const durationSec = level.duration * 60
        const remaining = Math.max(0, durationSec - elapsedSec)

        t.status = 'PAUSED'
        t.timerPausedAt = now
        t.timerSeconds = remaining
    } else if (t.status === 'PAUSED') {
        // Resume
        const level = t.levels[t.currentLevelIndex]
        const durationSec = level.duration * 60
        const remaining = t.timerSeconds || 0
        const newStartedAt = new Date(now.getTime() - (durationSec - remaining) * 1000)

        t.status = 'RUNNING'
        t.levelStartedAt = newStartedAt
        t.timerPausedAt = null
        t.timerSeconds = null
    }

    await repo.save(t)
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath(`/display/${id}`)
}

export async function changeLevel(id: number, direction: 'next' | 'prev') {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const t = await repo.findOne({ where: { id } })
    if (!t) return

    const newIndex = t.currentLevelIndex + (direction === 'next' ? 1 : -1)
    if (newIndex < 0) return

    t.currentLevelIndex = newIndex
    t.levelStartedAt = new Date()
    t.timerPausedAt = null
    t.timerSeconds = null
    t.status = 'RUNNING'

    await repo.save(t)
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath(`/display/${id}`)
}

export async function finishTournament(id: number, winnerBountyCount?: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)
    const regRepo = ds.getRepository(Registration)

    const t = await repo.findOne({
        where: { id },
        relations: { registrations: true }
    })
    if (!t) return

    // Find remaining active player
    const activePlayers = t.registrations.filter(r => r.status === 'REGISTERED')

    // If exactly one player remains, they are the winner
    if (activePlayers.length === 1) {
        const winner = activePlayers[0]
        winner.place = 1
        winner.status = 'ELIMINATED' // Mark as eliminated to show in results

        if (t.type === 'FREE') {
            const totalPlayers = t.registrations.length
            // Use provided bountyCount or existing value
            const bountyCount = winnerBountyCount !== undefined ? winnerBountyCount : winner.bountyCount
            winner.bountyCount = bountyCount
            winner.points = calculatePoints(totalPlayers, 1, bountyCount)
        }

        await regRepo.save(winner)
    }

    t.status = 'FINISHED'
    t.timerPausedAt = null
    t.timerSeconds = null

    await repo.save(t)
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath(`/display/${id}`)
}

export async function toggleRegistration(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const t = await repo.findOne({ where: { id } })
    if (!t) return

    t.registrationClosed = !t.registrationClosed

    await repo.save(t)
    revalidatePath(`/admin/tournaments/${id}`)
}

export async function updateDisplaySettings(id: number, settings: any) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Tournament)

    const t = await repo.findOne({ where: { id } })
    if (!t) throw new Error('Tournament not found')

    t.displaySettings = JSON.stringify(settings)

    await repo.save(t)
    revalidatePath(`/admin/tournaments/${id}`)
    revalidatePath(`/display/${id}`)
}

export async function eliminatePlayer(registrationId: number, bountyCount: number = 0) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)

    const reg = await regRepo.findOne({
        where: { id: registrationId },
        relations: { tournament: { registrations: true } }
    })

    if (!reg) return

    const totalPlayers = reg.tournament.registrations.length
    const activePlayers = reg.tournament.registrations.filter(r => r.status === 'REGISTERED').length
    const place = activePlayers

    let points = 0
    if (reg.tournament.type === 'FREE') {
        // Update bounty count before calculating points
        reg.bountyCount = bountyCount
        points = calculatePoints(totalPlayers, place, bountyCount)
    }

    reg.status = 'ELIMINATED'
    reg.place = place
    reg.points = points
    // Clear seating
    reg.seatNumber = null
    reg.table = null

    await regRepo.save(reg)

    // Auto-level up for FREE tournaments
    if (reg.tournament.type === 'FREE') {
        const tRepo = ds.getRepository(Tournament)
        const tournament = await tRepo.findOne({
            where: { id: reg.tournament.id },
            relations: { levels: true }
        })

        if (tournament && tournament.status === 'RUNNING') {
            // Check if there is a next level
            if (tournament.currentLevelIndex < tournament.levels.length - 1) {
                tournament.currentLevelIndex += 1
                // We do NOT update levelStartedAt, so the timer continues relative to the original start time
                // This means if levels have different durations, the time might jump, but usually they are consistent
                await tRepo.save(tournament)
                revalidatePath(`/display/${tournament.id}`)
                revalidatePath(`/admin/tournaments/${tournament.id}`)
            }
        }
    }

    // Check for table balancing
    const balancing = await checkAndBalanceTables(reg.tournament.id)

    revalidatePath(`/admin/tournaments`)
    return balancing
}

async function checkAndBalanceTables(tournamentId: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)

    // Get all tables with their seated players
    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        relations: { registrations: { player: true } },
        order: { tableNumber: 'ASC' }
    })

    if (tables.length < 2) return null

    // Calculate active players per table
    const tableStats = tables.map(table => ({
        tableId: table.id,
        tableNumber: table.tableNumber,
        maxSeats: table.maxSeats,
        activePlayers: table.registrations.filter(r => r.status === 'REGISTERED').length
    }))

    const totalActivePlayers = tableStats.reduce((sum, t) => sum + t.activePlayers, 0)
    const totalTables = tables.length

    // Check if we can break the last table
    const lastTable = tableStats[tableStats.length - 1]
    const otherTables = tableStats.slice(0, -1)
    const totalSeatsOnOtherTables = otherTables.reduce((sum, t) => sum + t.maxSeats, 0)
    const playersOnOtherTables = otherTables.reduce((sum, t) => sum + t.activePlayers, 0)
    const emptySeatsOnOtherTables = totalSeatsOnOtherTables - playersOnOtherTables

    // If last table players can fit on other tables, recommend breaking it
    if (lastTable.activePlayers > 0 && lastTable.activePlayers <= emptySeatsOnOtherTables) {
        // Get players from the last table
        const lastTablePlayers = tables[tables.length - 1].registrations
            .filter(r => r.status === 'REGISTERED')
            .map(r => ({
                id: r.id,
                name: r.player.username || `${r.player.firstName} ${r.player.lastName}`,
                currentSeat: r.seatNumber
            }))

        // Find available seats on other tables
        const assignments: string[] = []
        const moves: Array<{ registrationId: number, targetTableId: number, targetSeat: number }> = []
        let playerIndex = 0

        for (const table of tables.slice(0, -1)) {
            if (playerIndex >= lastTablePlayers.length) break

            const occupiedSeats = new Set(
                table.registrations
                    .filter(r => r.status === 'REGISTERED')
                    .map(r => r.seatNumber)
            )

            for (let seat = 1; seat <= table.maxSeats; seat++) {
                if (playerIndex >= lastTablePlayers.length) break

                if (!occupiedSeats.has(seat)) {
                    const player = lastTablePlayers[playerIndex]
                    assignments.push(`${player.name} → Table ${table.tableNumber}, Seat ${seat}`)
                    moves.push({
                        registrationId: player.id,
                        targetTableId: table.id,
                        targetSeat: seat
                    })
                    playerIndex++
                }
            }
        }

        return {
            action: 'break_table',
            tableNumber: lastTable.tableNumber,
            tableId: lastTable.tableId,
            playersToMove: lastTable.activePlayers,
            assignments,
            moves,
            message: `Break Table ${lastTable.tableNumber}:\n${assignments.join('\n')}`
        }
    }
    // Find min and max player counts
    const minPlayers = Math.min(...tableStats.map(t => t.activePlayers))
    const maxPlayers = Math.max(...tableStats.map(t => t.activePlayers))

    // If difference is more than 1, recommend balancing
    if (maxPlayers - minPlayers > 1) {
        const recommendations: any[] = []

        // Find tables with max and min players
        const fullestTables = tableStats.filter(t => t.activePlayers === maxPlayers)
        const emptiestTables = tableStats.filter(t => t.activePlayers === minPlayers)

        // Calculate how many to move
        const toMove = Math.floor((maxPlayers - minPlayers) / 2)

        if (toMove > 0 && fullestTables.length > 0 && emptiestTables.length > 0) {
            recommendations.push({
                fromTable: fullestTables[0].tableNumber,
                toTable: emptiestTables[0].tableNumber,
                count: toMove
            })

            return {
                action: 'balance_tables',
                recommendations,
                message: `Move ${toMove} player(s) from Table ${fullestTables[0].tableNumber} to Table ${emptiestTables[0].tableNumber}`
            }
        }
    }

    return null
}

export async function rebuyPlayer(registrationId: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)

    const reg = await regRepo.findOne({ where: { id: registrationId } })
    if (reg) {
        reg.rebuys += 1
        await regRepo.save(reg)
    }

    revalidatePath(`/admin/tournaments`)
}

export async function registerPlayer(tournamentId: number, playerId: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)
    const tRepo = ds.getRepository(Tournament)
    const pRepo = ds.getRepository(Player)
    const tableRepo = ds.getRepository(Table)

    const tournament = await tRepo.findOne({ where: { id: tournamentId } })
    const player = await pRepo.findOne({ where: { id: playerId } })

    if (!tournament || !player) return

    // Check if registration is closed
    if (tournament.registrationClosed) return

    // Check if already registered
    const existing = await regRepo.findOne({
        where: {
            tournament: { id: tournamentId },
            player: { id: playerId }
        }
    })

    if (existing) return

    const reg = new Registration()
    reg.tournament = tournament
    reg.player = player
    reg.status = 'REGISTERED'
    reg.rebuys = 0
    reg.addons = 0
    reg.points = 0
    reg.bountyCount = 0

    const savedReg = await regRepo.save(reg)

    // Check if seating exists (any player has table assigned)
    const seatedPlayers = await regRepo.count({
        where: {
            tournament: { id: tournamentId },
            table: { id: Not(null as any) }
        }
    })

    // If seating exists, auto-assign this new player
    if (seatedPlayers > 0) {
        await autoAssignToTable(savedReg.id, tournamentId)
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath(`/display/${tournamentId}`)
}

export async function createPlayer(name: string) {
    const ds = await getDataSource()
    const repo = ds.getRepository(Player)

    const player = new Player()
    player.firstName = name
    player.username = name.toLowerCase().replace(/\s+/g, '_')
    // Generate a fake unique telegram ID for manual players
    player.telegramId = `manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    const savedPlayer = await repo.save(player)
    return JSON.parse(JSON.stringify(savedPlayer))
}

export async function getStatistics() {
    const ds = await getDataSource()

    // Global Stats
    const totalTournaments = await ds.getRepository(Tournament).count()
    const totalPlayers = await ds.getRepository(Player).count()

    // Leaderboard (Free Tournaments)
    // We use getRawMany to aggregate points
    const leaderboard = await ds.getRepository(Registration)
        .createQueryBuilder("reg")
        .leftJoin("reg.player", "player")
        .leftJoin("reg.tournament", "tournament")
        .where("tournament.type = :type", { type: "FREE" })
        .select("player.id", "id")
        .addSelect("player.firstName", "firstName")
        .addSelect("player.lastName", "lastName")
        .addSelect("player.username", "username")
        .addSelect("SUM(reg.points)", "totalPoints")
        .addSelect("COUNT(reg.id)", "gamesPlayed")
        .addSelect("SUM(CASE WHEN reg.place = 1 THEN 1 ELSE 0 END)", "wins")
        .groupBy("player.id")
        .orderBy("totalPoints", "DESC")
        .getRawMany()

    // Format numbers (SQLite returns strings for aggregates)
    const formattedLeaderboard = leaderboard.map(l => ({
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        username: l.username,
        totalPoints: Number(l.totalPoints || 0),
        gamesPlayed: Number(l.gamesPlayed || 0),
        wins: Number(l.wins || 0)
    }))

    return {
        totalTournaments,
        totalPlayers,
        leaderboard: formattedLeaderboard
    }
}

// Tournament Template Actions

export async function getTemplates() {
    const ds = await getDataSource()
    const repo = ds.getRepository(TournamentTemplate)

    const templates = await repo.find({
        order: { createdAt: 'DESC' },
        relations: { levels: true }
    })

    return JSON.parse(JSON.stringify(templates))
}

export async function getTemplate(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TournamentTemplate)

    const template = await repo.findOne({
        where: { id },
        relations: { levels: true },
        order: { levels: { levelNumber: 'ASC' } }
    })

    return JSON.parse(JSON.stringify(template))
}

export async function createTemplate(data: any) {
    const ds = await getDataSource()
    const { name, description, type, buyIn, stack, levels } = data

    const template = new TournamentTemplate()
    template.name = name
    template.description = description || null
    template.type = type
    const parsedBuyIn = parseInt(buyIn)
    template.buyIn = !isNaN(parsedBuyIn) ? parsedBuyIn : null
    const parsedStack = parseInt(stack)
    template.stack = !isNaN(parsedStack) ? parsedStack : 0

    template.levels = levels.map((l: any, index: number) => {
        const level = new TemplateLevel()
        level.levelNumber = index + 1
        level.smallBlind = parseInt(l.smallBlind) || 0
        level.bigBlind = parseInt(l.bigBlind) || 0
        level.ante = parseInt(l.ante || 0) || 0
        level.duration = parseInt(l.duration) || 0
        level.isBreak = l.isBreak || false
        return level
    })

    await ds.manager.save(template)
    revalidatePath('/admin/templates')
}

export async function deleteTemplate(id: number) {
    const ds = await getDataSource()
    const repo = ds.getRepository(TournamentTemplate)

    await repo.delete(id)
    revalidatePath('/admin/templates')
}

export async function createTournamentFromTemplate(templateId: number, name: string, date: string) {
    const ds = await getDataSource()
    const templateRepo = ds.getRepository(TournamentTemplate)

    const template = await templateRepo.findOne({
        where: { id: templateId },
        relations: { levels: true }
    })

    if (!template) throw new Error('Template not found')

    const tournament = new Tournament()
    tournament.name = name
    tournament.date = new Date(date)
    tournament.type = template.type
    tournament.buyIn = template.buyIn
    tournament.stack = template.stack

    tournament.levels = template.levels.map((tl) => {
        const level = new TournamentLevel()
        level.levelNumber = tl.levelNumber
        level.smallBlind = tl.smallBlind
        level.bigBlind = tl.bigBlind
        level.ante = tl.ante
        level.duration = tl.duration
        level.isBreak = tl.isBreak
        return level
    })

    await ds.manager.save(tournament)
    revalidatePath('/admin')
    return tournament.id
}

export async function updateTemplate(id: number, data: any) {
    const ds = await getDataSource()
    const templateRepo = ds.getRepository(TournamentTemplate)
    const levelRepo = ds.getRepository(TemplateLevel)

    const template = await templateRepo.findOne({
        where: { id },
        relations: { levels: true }
    })

    if (!template) throw new Error('Template not found')

    // Update template info
    template.name = data.name
    template.description = data.description || null
    template.type = data.type
    const parsedBuyIn = parseInt(data.buyIn)
    template.buyIn = !isNaN(parsedBuyIn) ? parsedBuyIn : null
    const parsedStack = parseInt(data.stack)
    template.stack = !isNaN(parsedStack) ? parsedStack : 0

    // Delete old levels
    await levelRepo.delete({ template: { id } })

    // Create new levels
    template.levels = data.levels.map((l: any, index: number) => {
        const level = new TemplateLevel()
        level.levelNumber = index + 1
        level.smallBlind = parseInt(l.smallBlind) || 0
        level.bigBlind = parseInt(l.bigBlind) || 0
        level.ante = parseInt(l.ante || 0) || 0
        level.duration = parseInt(l.duration) || 0
        level.isBreak = l.isBreak || false
        return level
    })

    await ds.manager.save(template)
    revalidatePath('/admin/templates')
}

export async function saveAsTemplate(tournamentId: number, templateName: string, templateDescription?: string) {
    const ds = await getDataSource()
    const tournamentRepo = ds.getRepository(Tournament)

    const tournament = await tournamentRepo.findOne({
        where: { id: tournamentId },
        relations: { levels: true }
    })

    if (!tournament) throw new Error('Tournament not found')

    const template = new TournamentTemplate()
    template.name = templateName
    template.description = templateDescription || null
    template.type = tournament.type
    template.buyIn = tournament.buyIn
    template.stack = tournament.stack

    template.levels = tournament.levels.map((tl) => {
        const level = new TemplateLevel()
        level.levelNumber = tl.levelNumber
        level.smallBlind = tl.smallBlind
        level.bigBlind = tl.bigBlind
        level.ante = tl.ante
        level.duration = tl.duration
        level.isBreak = tl.isBreak
        return level
    })

    await ds.manager.save(template)
    revalidatePath('/admin/templates')
}

// Table Management Actions

export async function getTables(tournamentId: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)

    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        relations: { registrations: { player: true } },
        order: { tableNumber: 'ASC' }
    })

    return JSON.parse(JSON.stringify(tables))
}

export async function createTable(tournamentId: number, maxSeats: number = 9) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)
    const tournamentRepo = ds.getRepository(Tournament)

    const tournament = await tournamentRepo.findOne({ where: { id: tournamentId } })
    if (!tournament) throw new Error('Tournament not found')

    // Get highest table number
    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        order: { tableNumber: 'DESC' }
    })

    const tableNumber = tables.length > 0 ? tables[0].tableNumber + 1 : 1

    const table = new Table()
    table.tournament = tournament
    table.tableNumber = tableNumber
    table.maxSeats = maxSeats

    await tableRepo.save(table)
    revalidatePath(`/admin/tournaments/${tournamentId}`)
}

export async function deleteTable(tableId: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)
    const regRepo = ds.getRepository(Registration)

    const table = await tableRepo.findOne({
        where: { id: tableId },
        relations: { tournament: true, registrations: true }
    })
    if (!table) throw new Error('Table not found')

    const tournamentId = table.tournament.id

    // Unseat all players from this table
    for (const registration of table.registrations) {
        if (registration.seatNumber !== null) {
            registration.seatNumber = null
            registration.table = null
            await regRepo.save(registration)
        }
    }

    await tableRepo.delete(tableId)

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath(`/admin/tournaments/${tournamentId}/seating`)
}

export async function updateTable(tableId: number, maxSeats: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)

    const table = await tableRepo.findOne({
        where: { id: tableId },
        relations: { tournament: true }
    })

    if (!table) throw new Error('Table not found')

    table.maxSeats = maxSeats
    await tableRepo.save(table)

    revalidatePath(`/admin/tournaments/${table.tournament.id}`)
    revalidatePath(`/admin/tournaments/${table.tournament.id}/seating`)
}

export async function movePlayer(registrationId: number, targetTableId: number, targetSeatNumber: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)
    const tableRepo = ds.getRepository(Table)

    // Get the registration
    const registration = await regRepo.findOne({
        where: { id: registrationId },
        relations: { tournament: true, table: true }
    })

    if (!registration) throw new Error('Registration not found')
    if (registration.status !== 'REGISTERED') throw new Error('Player is not active')

    // Get the target table
    const targetTable = await tableRepo.findOne({
        where: { id: targetTableId },
        relations: { registrations: true, tournament: true }
    })

    if (!targetTable) throw new Error('Target table not found')
    if (targetTable.tournament.id !== registration.tournament.id) {
        throw new Error('Table belongs to different tournament')
    }

    // Check if seat is available
    const seatTaken = targetTable.registrations.some(r =>
        r.status === 'REGISTERED' && r.seatNumber === targetSeatNumber
    )

    if (seatTaken) throw new Error('Seat is already taken')
    if (targetSeatNumber < 1 || targetSeatNumber > targetTable.maxSeats) {
        throw new Error('Invalid seat number')
    }

    // Move the player
    registration.table = targetTable
    registration.seatNumber = targetSeatNumber
    await regRepo.save(registration)

    revalidatePath(`/admin/tournaments/${registration.tournament.id}`)
}

export async function applyBreakTableRecommendation(tournamentId: number, recommendation: any) {
    // Expect recommendation to contain moves array and tableId
    const moves: Array<{ registrationId: number, targetTableId: number, targetSeat: number }> = recommendation.moves || [];
    const tableId: number = recommendation.tableId;

    // Perform all moves sequentially
    for (const move of moves) {
        await movePlayer(move.registrationId, move.targetTableId, move.targetSeat);
    }

    // Delete the now empty table
    if (tableId) {
        await deleteTable(tableId);
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`);
    revalidatePath(`/display/${tournamentId}`);
}

export async function unseatPlayer(registrationId: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)

    const registration = await regRepo.findOne({
        where: { id: registrationId },
        relations: { tournament: true }
    })

    if (!registration) throw new Error('Registration not found')

    registration.table = null
    registration.seatNumber = null
    await regRepo.save(registration)

    revalidatePath(`/admin/tournaments/${registration.tournament.id}`)
}


export async function assignSeating(tournamentId: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)
    const tableRepo = ds.getRepository(Table)

    // Get all registered players (not eliminated)
    const registrations = await regRepo.find({
        where: {
            tournament: { id: tournamentId },
            status: 'REGISTERED'
        },
        relations: { player: true }
    })

    // Get all tables
    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        order: { tableNumber: 'ASC' }
    })

    if (tables.length === 0) {
        throw new Error('No tables available. Please create tables first.')
    }

    // Shuffle players randomly
    const shuffledPlayers = [...registrations].sort(() => Math.random() - 0.5)

    // Calculate players per table
    const totalPlayers = shuffledPlayers.length
    const totalTables = tables.length
    const basePlayersPerTable = Math.floor(totalPlayers / totalTables)
    const extraPlayers = totalPlayers % totalTables

    let playerIndex = 0

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i]
        const playersForThisTable = i < extraPlayers ? basePlayersPerTable + 1 : basePlayersPerTable

        // Get available seats (1 to maxSeats)
        const availableSeats = Array.from({ length: table.maxSeats }, (_, i) => i + 1)
        const shuffledSeats = availableSeats.sort(() => Math.random() - 0.5)

        for (let j = 0; j < playersForThisTable && playerIndex < totalPlayers; j++) {
            const registration = shuffledPlayers[playerIndex]
            registration.table = table
            registration.seatNumber = shuffledSeats[j]
            await regRepo.save(registration)
            playerIndex++
        }
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath(`/admin/tournaments/${tournamentId}/seating`)
}

export async function clearSeating(tournamentId: number) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)

    await regRepo
        .createQueryBuilder()
        .update(Registration)
        .set({ table: null, seatNumber: null })
        .where('tournamentId = :tournamentId', { tournamentId })
        .execute()

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath(`/admin/tournaments/${tournamentId}/seating`)
}

export async function getSeatingChart(tournamentId: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)

    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        relations: { registrations: { player: true } },
        order: { tableNumber: 'ASC' }
    })

    return JSON.parse(JSON.stringify(tables))
}

// Auto-assign new player to balanced table
async function autoAssignToTable(registrationId: number, tournamentId: number) {
    const ds = await getDataSource()
    const tableRepo = ds.getRepository(Table)
    const regRepo = ds.getRepository(Registration)

    // Get all tables with player counts
    const tables = await tableRepo.find({
        where: { tournament: { id: tournamentId } },
        relations: { registrations: true },
        order: { tableNumber: 'ASC' }
    })

    if (tables.length === 0) return // No tables yet

    // Find table(s) with minimum players
    const tableCounts = tables.map(t => ({
        table: t,
        count: t.registrations.filter(r => r.status === 'REGISTERED').length
    }))

    const minCount = Math.min(...tableCounts.map(tc => tc.count))
    const tablesWithMinPlayers = tableCounts.filter(tc => tc.count === minCount)

    // Pick random table among those with fewest players
    const selectedTableData = tablesWithMinPlayers[Math.floor(Math.random() * tablesWithMinPlayers.length)]
    const selectedTable = selectedTableData.table

    // Get occupied seats
    const occupiedSeats = selectedTable.registrations
        .filter(r => r.status === 'REGISTERED' && r.seatNumber)
        .map(r => r.seatNumber!)

    // Get available seats
    const allSeats = Array.from({ length: selectedTable.maxSeats }, (_, i) => i + 1)
    const availableSeats = allSeats.filter(s => !occupiedSeats.includes(s))

    if (availableSeats.length === 0) return // Table is full

    // Assign random available seat
    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)]

    const registration = await regRepo.findOne({ where: { id: registrationId } })
    if (registration) {
        registration.table = selectedTable
        registration.seatNumber = randomSeat
        await regRepo.save(registration)
    }
}

export async function seatPlayers(tournamentId: number, registrationIds: number[]) {
    const ds = await getDataSource()
    const regRepo = ds.getRepository(Registration)
    const tableRepo = ds.getRepository(Table)

    // Verify tournament and registrations
    const tournament = await ds.getRepository(Tournament).findOne({
        where: { id: tournamentId },
        relations: { tables: { registrations: true } }
    })
    if (!tournament) throw new Error('Tournament not found')

    // Process each player
    for (const regId of registrationIds) {
        // Refresh tables state for each iteration to ensure balancing is up to date
        const tables = await tableRepo.find({
            where: { tournament: { id: tournamentId } },
            relations: { registrations: true }
        })

        // Find table with min players
        let minPlayers = Infinity
        let targetTables: Table[] = []

        for (const table of tables) {
            const count = table.registrations.filter(r => r.status === 'REGISTERED').length
            if (count < minPlayers) {
                minPlayers = count
                targetTables = [table]
            } else if (count === minPlayers) {
                targetTables.push(table)
            }
        }

        if (targetTables.length === 0) continue // Should not happen if tables exist

        // Pick random table from candidates
        const targetTable = targetTables[Math.floor(Math.random() * targetTables.length)]

        // Find empty seat
        const takenSeats = targetTable.registrations
            .filter(r => r.status === 'REGISTERED' && r.seatNumber)
            .map(r => r.seatNumber!)

        const availableSeats = Array.from({ length: targetTable.maxSeats }, (_, i) => i + 1)
            .filter(s => !takenSeats.includes(s))

        if (availableSeats.length === 0) continue // Table full (should be caught by minPlayers logic but safety check)

        const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)]

        // Update registration
        await regRepo.update(regId, {
            table: targetTable,
            seatNumber: randomSeat
        })
    }

    revalidatePath(`/admin/tournaments/${tournamentId}`)
    revalidatePath(`/admin/tournaments/${tournamentId}/seating`)
}
