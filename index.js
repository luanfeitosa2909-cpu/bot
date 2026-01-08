const { Client, Collection, IntentsBitField, Partials, Events } = require('discord.js');
const logger = require('./Utils/logger');
const fs = require('fs');
const path = require('path');
const config = require('./Utils/config');

// MongoDB
const { connectDB, clientMongo } = require('./database/mongodb');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildBans,
    IntentsBitField.Flags.GuildEmojisAndStickers,
    IntentsBitField.Flags.GuildIntegrations,
    IntentsBitField.Flags.GuildWebhooks,
    IntentsBitField.Flags.GuildInvites,
    IntentsBitField.Flags.GuildVoiceStates,
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildMessageTyping,
    IntentsBitField.Flags.DirectMessages,
    IntentsBitField.Flags.DirectMessageReactions,
    IntentsBitField.Flags.DirectMessageTyping,
    IntentsBitField.Flags.MessageContent,
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.Reaction,
    Partials.Channel,
    Partials.GuildMember,
    Partials.ThreadMember,
  ],
});

// Coleções de interações
client.slashCommands = new Collection();
client.buttonHandlers = new Collection();
client.modalHandlers = new Collection();
client.selectHandlers = new Collection();

// Carregamento de handlers
require('./handler')(client);
require('./Utils/loadInteractions')(client, path);
require('./Utils/loadEvents')(client, clientMongo, path);

// Conectar ao MongoDB e logar o bot
connectDB()
  .then(() => {
    logger.logInfo('Conexão com MongoDB estabelecida.');
    return client.login(config.BOT_TOKEN);
  })
  .catch(err => {
    logger.logError('❌ Erro ao conectar no MongoDB:', err);
    process.exit(1);
  });

// Quando o bot estiver pronto
client.once(Events.ClientReady, () => {
  logger.logInfo(`🤖 Bot online como ${client.user.tag}`);
});

// Tratamento global de erros
process.on('unhandledRejection', err => logger.logError('❌ Unhandled Rejection:', err));
process.on('uncaughtException', err => logger.logError('❌ Uncaught Exception:', err));
process.on('uncaughtExceptionMonitor', err =>
  logger.logWarn('❗ Uncaught Exception Monitor:', err)
);

// Shutdown seguro
require('./Utils/setupShutdown')(client, clientMongo);
