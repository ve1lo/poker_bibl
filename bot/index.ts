
import 'reflect-metadata';
import { Telegraf, Markup, Context } from 'telegraf';
import 'dotenv/config';
import { getDataSource } from '../lib/data-source';
import { Player, Tournament, Registration } from '../lib/entities';

const token = process.env.BOT_TOKEN || '';
console.log('Starting bot with token:', token ? '***' + token.slice(-4) : 'MISSING');
const bot = new Telegraf(token);

interface AppContext extends Context {
    user?: Player;
}

// Middleware
bot.use(async (ctx: AppContext, next) => {
    console.log('Received update:', ctx.updateType);
    if (ctx.from) {
        try {
            const ds = await getDataSource();
            const user = await ds.getRepository(Player).findOne({
                where: { telegramId: ctx.from.id.toString() }
            });
            // @ts-ignore
            ctx.user = user || undefined;
        } catch (e) {
            console.error('Database error in middleware:', e);
        }
    }
    return next();
});

// Start
bot.command('start', async (ctx) => {
    console.log('Handling /start command');
    const user = (ctx as AppContext).user;

    if (!user) {
        await ctx.reply(
            'Welcome to the Poker Tournament System! ♠️♥️\n\nYou are not registered yet. Please register to participate in tournaments.',
            Markup.inlineKeyboard([
                Markup.button.callback('📝 Register', 'register_start')
            ])
        );
    } else {
        await ctx.reply(
            `Welcome back, ${user.firstName}! 🎲\n\nWhat would you like to do?`,
            Markup.keyboard([
                ['🏆 Tournaments', '👤 My Profile'],
                ['📊 Leaderboard', '❓ Help']
            ]).resize()
        );
    }
});

// Registration Flow
bot.action('register_start', async (ctx) => {
    await ctx.reply('Please enter your phone number to register (or share contact):', Markup.keyboard([
        Markup.button.contactRequest('📱 Share Contact')
    ]).resize().oneTime());
});

bot.on('contact', async (ctx) => {
    if ((ctx as AppContext).user) return ctx.reply('You are already registered!');

    const contact = ctx.message.contact;
    const telegramId = ctx.from.id.toString();

    try {
        const ds = await getDataSource();
        const player = new Player();
        player.telegramId = telegramId;
        player.firstName = contact.first_name;
        player.lastName = contact.last_name || '';
        player.phone = contact.phone_number;
        player.username = ctx.from.username || '';

        const newUser = await ds.manager.save(player);

        await ctx.reply(
            `Registration successful! Welcome, ${newUser.firstName}.`,
            Markup.keyboard([
                ['🏆 Tournaments', '👤 My Profile']
            ]).resize()
        );
    } catch (e) {
        console.error(e);
        await ctx.reply('An error occurred during registration.');
    }
});

// Tournaments
bot.hears('🏆 Tournaments', async (ctx) => {
    const ds = await getDataSource();
    const tournaments = await ds.getRepository(Tournament).find({
        where: [
            { status: 'SCHEDULED' },
            { status: 'RUNNING' }
        ],
        order: { date: 'ASC' }
    });

    if (tournaments.length === 0) {
        return ctx.reply('No upcoming tournaments found.');
    }

    for (const t of tournaments) {
        const dateStr = new Date(t.date).toLocaleString();
        const typeStr = t.type === 'PAID' ? `💰 Buy-in: ${t.buyIn}` : '🆓 Free Ranked';

        await ctx.reply(
            `🏆 *${t.name}*\n📅 ${dateStr}\n${typeStr}\nStack: ${t.stack}`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('✅ Register', `join_${t.id}`)
                ])
            }
        );
    }
});

// Join Tournament
bot.action(/join_(\d+)/, async (ctx) => {
    const tournamentId = parseInt(ctx.match[1]);
    const user = (ctx as AppContext).user;

    if (!user) return ctx.reply('Please register first.');

    try {
        const ds = await getDataSource();
        const regRepo = ds.getRepository(Registration);

        const existing = await regRepo.findOne({
            where: {
                player: { id: user.id },
                tournament: { id: tournamentId }
            }
        });

        if (existing) {
            return ctx.reply('You are already registered for this tournament.');
        }

        const reg = new Registration();
        reg.player = user;
        // @ts-ignore
        reg.tournament = { id: tournamentId };

        await regRepo.save(reg);

        await ctx.reply('✅ You have successfully registered for the tournament!');
    } catch (e) {
        console.error(e);
        await ctx.reply('Failed to register. You might already be registered.');
    }
});

// Profile
bot.hears('👤 My Profile', async (ctx) => {
    const user = (ctx as AppContext).user;
    if (!user) return ctx.reply('Not registered.');

    const ds = await getDataSource();
    const regRepo = ds.getRepository(Registration);

    const registrations = await regRepo.find({
        where: { player: { id: user.id } },
        relations: { tournament: true },
        order: { createdAt: 'DESC' },
        take: 5
    });

    const totalPoints = await regRepo.sum('points', { player: { id: user.id } });
    const count = await regRepo.count({ where: { player: { id: user.id } } });

    let history = registrations.map(r =>
        `- ${r.tournament.name} (${r.status})`
    ).join('\n');

    await ctx.reply(
        `👤 *${user.firstName} ${user.lastName || ''}*\n` +
        `📱 ${user.phone}\n\n` +
        `📊 Stats:\n` +
        `Tournaments: ${count}\n` +
        `Total Points: ${totalPoints || 0}\n\n` +
        `🕒 Recent History:\n${history}`,
        { parse_mode: 'Markdown' }
    );
});

bot.launch().then(() => {
    console.log('Bot started!');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
