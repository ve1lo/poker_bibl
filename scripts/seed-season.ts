
import { getDataSource } from '../lib/data-source'
import { Tournament, Player, Registration } from '../lib/entities'

async function seed() {
    const ds = await getDataSource()
    const playerRepo = ds.getRepository(Player)
    const tournamentRepo = ds.getRepository(Tournament)
    const registrationRepo = ds.getRepository(Registration)

    // Ensure we have players
    let players = await playerRepo.find()
    if (players.length < 10) {
        console.log('Creating dummy players...')
        for (let i = 0; i < 20; i++) {
            const p = new Player()
            p.firstName = `Player${i}`
            p.lastName = `Test`
            p.username = `user${i}`
            p.telegramId = `100${i}`
            await playerRepo.save(p)
        }
        players = await playerRepo.find()
    }

    const seasonName = "Test Season 2024"
    console.log(`Creating 13 tournaments for ${seasonName}...`)

    for (let i = 1; i <= 13; i++) {
        const t = new Tournament()
        t.name = `Season Game #${i}`
        t.date = new Date(Date.now() - (14 - i) * 86400000) // Past dates
        t.type = 'FREE'
        t.status = 'FINISHED'
        t.season = seasonName
        t.buyIn = 0
        t.stack = 10000
        await tournamentRepo.save(t)

        // Register random players
        const shuffledPlayers = [...players].sort(() => 0.5 - Math.random())
        const participantCount = Math.floor(Math.random() * 10) + 5 // 5 to 15 players
        const participants = shuffledPlayers.slice(0, participantCount)

        for (let j = 0; j < participants.length; j++) {
            const player = participants[j]
            const reg = new Registration()
            reg.tournament = t
            reg.player = player
            reg.status = 'ELIMINATED'
            reg.place = j + 1

            // Random points logic
            reg.points = Math.floor(Math.random() * 100)
            reg.bountyCount = Math.floor(Math.random() * 5)

            await registrationRepo.save(reg)
        }
        console.log(`Created tournament ${t.name} with ${participants.length} players`)
    }

    console.log('Seeding complete!')
    process.exit(0)
}

seed().catch(console.error)
