import "reflect-metadata"
import { DataSource } from 'typeorm'
import { Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings } from './entities'

let dataSource: DataSource | null = null

export async function getDataSource() {
    if (dataSource && dataSource.isInitialized) {
        return dataSource
    }

    const isProduction = process.env.NODE_ENV === 'production'
    console.log('getDataSource: NODE_ENV=', process.env.NODE_ENV, 'isProduction=', isProduction)

    dataSource = new DataSource({
        type: 'better-sqlite3',
        database: './poker-build.db',
        synchronize: false,
        logging: false,
        entities: [Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table, Payout, SystemSettings],
        subscribers: [],
        migrations: [],
    })

    if (!dataSource.isInitialized) {
        await dataSource.initialize()
    }

    return dataSource
}
