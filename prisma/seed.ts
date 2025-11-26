
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create some players
    const player1 = await prisma.player.upsert({
        where: { telegramId: '123456789' },
        update: {},
        create: {
            telegramId: '123456789',
            username: 'poker_king',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
        },
    })

    const player2 = await prisma.player.upsert({
        where: { telegramId: '987654321' },
        update: {},
        create: {
            telegramId: '987654321',
            username: 'bluff_master',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+0987654321',
        },
    })

    console.log('Created players:', player1.username, player2.username)

    // Create a Paid Tournament
    const paidTournament = await prisma.tournament.create({
        data: {
            name: 'Sunday Special',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week from now
            type: 'PAID',
            buyIn: 5000,
            stack: 15000,
            levels: {
                create: [
                    { levelNumber: 1, smallBlind: 100, bigBlind: 200, duration: 20 },
                    { levelNumber: 2, smallBlind: 200, bigBlind: 400, duration: 20 },
                    { levelNumber: 3, smallBlind: 300, bigBlind: 600, duration: 20, isBreak: true },
                ],
            },
        },
    })

    console.log('Created paid tournament:', paidTournament.name)

    // Create a Free Ranked Tournament
    const freeTournament = await prisma.tournament.create({
        data: {
            name: 'Weekly Ranked Freeeroll',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2), // 2 days from now
            type: 'FREE',
            stack: 10000,
            levels: {
                create: [
                    { levelNumber: 1, smallBlind: 50, bigBlind: 100, duration: 15 },
                    { levelNumber: 2, smallBlind: 100, bigBlind: 200, duration: 15 },
                ],
            },
        },
    })

    console.log('Created free tournament:', freeTournament.name)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
