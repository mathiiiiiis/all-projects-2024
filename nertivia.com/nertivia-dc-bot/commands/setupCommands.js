const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder().setName('help').setDescription('List all available commands'),
  new SlashCommandBuilder().setName('status').setDescription('Check Nertivia server status'),
  new SlashCommandBuilder().setName('ban').setDescription('Ban a user')
    .addUserOption(option => option.setName('user').setDescription('The user to ban').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption(option => option.setName('duration').setDescription('Ban duration in days')),
  new SlashCommandBuilder().setName('kick').setDescription('Kick a user')
    .addUserOption(option => option.setName('user').setDescription('The user to kick').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the kick')),
  new SlashCommandBuilder().setName('timeout').setDescription('Timeout a user')
    .addUserOption(option => option.setName('user').setDescription('The user to timeout').setRequired(true))
    .addIntegerOption(option => option.setName('duration').setDescription('Timeout duration in minutes').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('Reason for the timeout')),
  new SlashCommandBuilder().setName('createticket').setDescription('Create a new ticket'),
  new SlashCommandBuilder().setName('rules').setDescription('Display server rules'),
  new SlashCommandBuilder().setName('sendticketmessage').setDescription('Send the ticket creation message (Admin only)'),
];

async function setupCommands(client) {
  try {
    const guildId = process.env.GUILD_ID;
    
    if (!guildId) {
      throw new Error('GUILD_ID is not defined in environment variables.');
    }

    console.log('Setting up guild-specific commands...');
    
    await client.application.commands.set(commands.map(command => command.toJSON()), guildId);

    console.log('Guild commands have been set up successfully.');
  } catch (error) {
    console.error('Error setting up guild commands:', error);
    throw error;
  }
}

module.exports = { setupCommands };
