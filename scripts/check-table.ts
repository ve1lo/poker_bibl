
import "reflect-metadata"
import { DataSource } from 'typeorm'
import { Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings } from '../lib/entities'

async function checkTable() {
    const dataSource = new DataSource({
        type: 'better-sqlite3',
        database: './poker-build.db',
        entities: [Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings],
        synchronize: false,
        logging: false
    })

    try {
        await dataSource.initialize()
        const result = await dataSource.query("SELECT name FROM sqlite_master WHERE type='table' AND name='TournamentTemplate'")
        console.log('Table TournamentTemplate exists:', result.length > 0)
        await dataSource.destroy()
    } catch (error) {
        console.error('Error checking table:', error)
    }
}

checkTable()
