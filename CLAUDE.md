# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
- `npm run dev` - Start the Next.js development server on port 3000
- `npm run bot` - Start the Telegram bot using tsx
- `npm run all` - Run both the web app and bot concurrently
- `npm run build` - Build the Next.js application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

### Database
- Uses SQLite with TypeORM for data persistence
- Database file: `poker.db` (created automatically)
- Entities are defined in `lib/entities.ts`
- Data source configuration in `lib/data-source.ts`
- Database synchronization happens automatically via TypeORM

## Architecture Overview

This is a **poker tournament management system** with dual interfaces:

### Web Interface (Next.js 16 + React 19)
- **Admin Panel**: Full tournament management at `/admin`
  - Create tournaments and templates
  - Manage players, seating, and real-time timer controls
  - View statistics and leaderboards
- **Display Interface**: Public tournament display at `/display/[id]`
  - Real-time tournament status for external monitors
  - Configurable display settings for what information to show

### Telegram Bot
- Located in `bot/index.ts`
- Player registration and tournament participation via Telegram
- Handles user authentication through Telegram contacts
- Real-time tournament notifications

### Key Components

**Core Entities** (`lib/entities.ts`):
- `Tournament` - Main tournament with timer state and configuration
- `Player` - Registered users from Telegram or manual entry
- `Registration` - Links players to tournaments with seating and points
- `Table` - Tournament seating with automatic balancing logic
- `TournamentTemplate` - Reusable tournament configurations

**Server Actions** (`app/actions.ts`):
- All database operations as Next.js server actions
- Tournament lifecycle management (start/pause/finish)
- Player elimination and points calculation
- Automated table balancing recommendations
- Real-time seating assignment algorithms

**Technology Stack**:
- TypeORM with SQLite for data persistence
- Telegraf for Telegram bot functionality
- TailwindCSS for styling
- Real-time updates via Next.js revalidation

## Important Implementation Details

### Tournament Timer System
- Tournaments have complex timer state in the `Tournament` entity
- Timer can be running, paused, or stopped with persistent state
- Level progression is automatic for FREE tournaments when players are eliminated
- All timer operations happen in server actions with proper revalidation

### Table Balancing Logic
- Automatic balancing recommendations when player counts become uneven
- "Break table" functionality when tables can be consolidated
- Random seating assignment with balanced distribution across tables
- Located in `checkAndBalanceTables()` function in `app/actions.ts`

### Points System
- FREE tournaments use a points-based ranking system
- Points calculation includes bounty system (eliminating other players)
- Implementation in `lib/points.ts`
- Leaderboard aggregation via TypeORM query builder

### Real-time Updates
- Uses Next.js `revalidatePath()` for cache invalidation
- Admin and display views update automatically when tournament state changes
- Telegram bot receives updates through database polling

## File Structure Notes

- `app/admin/` - Administrative interface pages and components
- `app/display/` - Public display interface
- `lib/` - Core business logic, entities, and utilities
- `bot/` - Telegram bot implementation
- Database files (`poker.db`, `dev.db`) are gitignored but auto-created

## Development Environment Setup

The application uses TypeORM with automatic database synchronization, so no manual migration commands are needed. Both the web app and Telegram bot can run simultaneously using `npm run all`.

Environment variables needed:
- `BOT_TOKEN` - Telegram bot token
- `DATABASE_URL` - SQLite database path (optional, defaults to `./poker.db`)