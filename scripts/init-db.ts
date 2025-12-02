
import "reflect-metadata"
import { DataSource } from 'typeorm'
import { Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings } from '../lib/entities'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

async function initializeDatabase() {
    console.log('Initializing database...')

    const dbPath = './poker-build.db'
    if (fs.existsSync(dbPath)) {
        try {
            fs.unlinkSync(dbPath)
        } catch (e) { }
    }

    const entities = [Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings]
    console.log('Entities:', entities.map(e => e.name))

    const dataSource = new DataSource({
        type: 'better-sqlite3',
        database: dbPath,
        synchronize: true,
        logging: true,
        entities: entities,
        subscribers: [],
        migrations: [],
    })

    try {
        await dataSource.initialize()
        console.log('Database initialized and synchronized successfully.')
        await dataSource.destroy()
    } catch (error: any) {
        console.error('Error initializing database:', error)
        if (error.driverError) {
            console.error('Driver Error:', error.driverError)
        }
        if (error.message) {
            console.error('Error Message:', error.message)
        }
        process.exit(1)
    }
}

initializeDatabase()
