const { Client, GatewayIntentBits } = require('discord.js');
const { setupCommands } = require('./commands/setupCommands');
const { handleInteraction } = require('./handlers/interactionHandler');
console.log(typeof handleInteraction);
const { handleMessage } = require('./handlers/messageHandler');
const { handleMemberEvents } = require('./handlers/memberHandler');
const { scheduleStatusChecks } = require('./utils/statusChecker');
require('dotenv').config();

if (!process.env.BOT_TOKEN) {
  console.error('Error: BOT_TOKEN is not defined in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}!`);
    
    await setupCommands(client);
    
    scheduleStatusChecks(client);
    
  } catch (error) {
    console.error('Error during the ready event:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  try {
    await handleInteraction(interaction);
  } catch (error) {
    console.error('Error handling interaction:', error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(console.error);
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(console.error);
    }
  }
});

client.on('messageCreate', async (message) => {
  try {
    await handleMessage(message);
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

handleMemberEvents(client);

client.login(process.env.BOT_TOKEN).catch(console.error);