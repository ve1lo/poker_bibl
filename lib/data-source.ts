import { DataSource } from 'typeorm'
import { Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table } from './entities'

let dataSource: DataSource | null = null

export async function getDataSource() {
    if (dataSource && dataSource.isInitialized) {
        return dataSource
    }

    dataSource = new DataSource({
        type: 'sqlite',
        database: process.env.DATABASE_URL?.replace('file:', '') || './poker.db',
        synchronize: true,
        logging: false,
        entities: [Player, Tournament, TournamentLevel, Registration, GameEvent, TournamentTemplate, TemplateLevel, Table],
        subscribers: [],
        migrations: [],
    })

    if (!dataSource.isInitialized) {
        await dataSource.initialize()
    }

    return dataSource
}
