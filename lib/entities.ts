
import "reflect-metadata"
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Unique } from "typeorm"

@Entity('Player')
export class Player {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text', unique: true })
    telegramId!: string

    @Column({ type: 'text', nullable: true })
    username!: string

    @Column({ type: 'text', nullable: true })
    firstName!: string

    @Column({ type: 'text', nullable: true })
    lastName!: string

    @Column({ type: 'text', nullable: true })
    phone!: string

    @CreateDateColumn()
    createdAt!: Date

    @OneToMany(() => Registration, (registration) => registration.player, { cascade: true })
    registrations!: Registration[]
}

// Tournament Template Entities
@Entity('TournamentTemplate')
export class TournamentTemplate {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text' })
    name!: string

    @Column({ type: 'text', nullable: true })
    description!: string | null

    @Column({ type: 'text' })
    type!: string // "PAID" | "FREE"

    @Column({ type: 'integer', nullable: true })
    buyIn!: number | null

    @Column({ type: 'integer', default: 10000 })
    stack!: number

    @CreateDateColumn()
    createdAt!: Date

    @OneToMany(() => TemplateLevel, (level) => level.template, { cascade: true })
    levels!: TemplateLevel[]
}

@Entity('TemplateLevel')
export class TemplateLevel {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'integer' })
    levelNumber!: number

    @Column({ type: 'integer' })
    smallBlind!: number

    @Column({ type: 'integer' })
    bigBlind!: number

    @Column({ type: 'integer', default: 0 })
    ante!: number

    @Column({ type: 'integer' })
    duration!: number

    @Column({ type: 'boolean', default: false })
    isBreak!: boolean

    @ManyToOne(() => TournamentTemplate, (template) => template.levels, { onDelete: 'CASCADE' })
    template!: TournamentTemplate
}

// Tournament Entity
@Entity('Tournament')
export class Tournament {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text' })
    name!: string

    @Column({ type: 'datetime' })
    date!: Date

    @Column({ type: 'text' })
    type!: string // "PAID" | "FREE"

    @Column({ type: 'text', default: "SCHEDULED" })
    status!: string // "SCHEDULED" | "RUNNING" | "PAUSED" | "FINISHED" | "BREAK"

    @Column({ type: 'datetime', nullable: true })
    breakStartTime!: Date | null

    @Column({ type: 'integer', nullable: true })
    breakDurationMinutes!: number | null

    @Column({ type: 'text', nullable: true })
    season!: string | null

    @Column({ type: 'integer', nullable: true })
    buyIn!: number | null

    @Column({ type: 'integer', default: 10000 })
    stack!: number

    @Column({ type: 'text', nullable: true })
    config!: string // JSON string

    // Timer State
    @Column({ type: 'integer', default: 0 })
    currentLevelIndex!: number

    @Column({ type: 'datetime', nullable: true })
    levelStartedAt!: Date | null

    @Column({ type: 'datetime', nullable: true })
    timerPausedAt!: Date | null

    @Column({ type: 'integer', nullable: true })
    timerSeconds!: number | null

    @Column({ type: 'boolean', default: false })
    registrationClosed!: boolean

    @Column({ type: 'text', nullable: true })
    displaySettings!: string | null // JSON string for display visibility settings

    @CreateDateColumn()
    createdAt!: Date

    @UpdateDateColumn()
    updatedAt!: Date

    @OneToMany(() => TournamentLevel, (level) => level.tournament, { cascade: true })
    levels!: TournamentLevel[]

    @OneToMany(() => Registration, (registration) => registration.tournament, { cascade: true })
    registrations!: Registration[]

    @OneToMany(() => GameEvent, (event) => event.tournament, { cascade: true })
    events!: GameEvent[]

    @OneToMany(() => Table, (table) => table.tournament, { cascade: true })
    tables!: Table[]

    @OneToMany(() => Payout, (payout) => payout.tournament, { cascade: true })
    payouts!: Payout[]
}

@Entity('TournamentLevel')
export class TournamentLevel {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'integer' })
    levelNumber!: number

    @Column({ type: 'integer' })
    smallBlind!: number

    @Column({ type: 'integer' })
    bigBlind!: number

    @Column({ type: 'integer', default: 0 })
    ante!: number

    @Column({ type: 'integer' })
    duration!: number // in minutes

    @Column({ type: 'boolean', default: false })
    isBreak!: boolean

    @ManyToOne(() => Tournament, (tournament) => tournament.levels, { onDelete: "CASCADE" })
    tournament!: Tournament
}

// Table Entity
@Entity('Table')
export class Table {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'integer' })
    tableNumber!: number

    @Column({ type: 'integer', default: 9 })
    maxSeats!: number

    @ManyToOne(() => Tournament, (tournament) => tournament.tables, { onDelete: 'CASCADE' })
    tournament!: Tournament

    @OneToMany(() => Registration, (registration) => registration.table)
    registrations!: Registration[]
}

@Entity('Registration')
@Unique(["player", "tournament"])
export class Registration {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text', default: "REGISTERED" })
    status!: string // "REGISTERED" | "ELIMINATED"

    @Column({ type: 'integer', default: 0 })
    rebuys!: number

    @Column({ type: 'integer', default: 0 })
    addons!: number

    @Column({ type: 'integer', nullable: true })
    place!: number

    @Column({ type: 'integer', default: 0 })
    bountyCount!: number

    @Column({ type: 'integer', nullable: true })
    points!: number

    @Column({ type: 'integer', nullable: true })
    seatNumber!: number | null

    @CreateDateColumn()
    createdAt!: Date

    @ManyToOne(() => Player, (player) => player.registrations, { onDelete: "CASCADE" })
    player!: Player

    @ManyToOne(() => Tournament, (tournament) => tournament.registrations, { onDelete: "CASCADE" })
    tournament!: Tournament

    @ManyToOne(() => Table, (table) => table.registrations, { onDelete: "SET NULL", nullable: true })
    table!: Table | null
}

@Entity('GameEvent')
export class GameEvent {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text' })
    type!: string

    @Column({ type: 'text' })
    description!: string

    @CreateDateColumn()
    timestamp!: Date

    @ManyToOne(() => Tournament, (tournament) => tournament.events, { onDelete: "CASCADE" })
    tournament!: Tournament
}

@Entity('Payout')
export class Payout {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'integer' })
    amount!: number

    @Column({ type: 'integer', nullable: true })
    place!: number | null

    @Column({ type: 'text', nullable: true })
    description!: string | null

    @ManyToOne(() => Tournament, (tournament) => tournament.payouts, { onDelete: "CASCADE" })
    tournament!: Tournament

    @ManyToOne(() => Player, { nullable: true })
    player!: Player | null
}

@Entity('SystemSettings')
export class SystemSettings {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ type: 'text', default: 'default' })
    theme!: string // 'default' | 'forest' | 'ocean'

    @UpdateDateColumn()
    updatedAt!: Date
}
