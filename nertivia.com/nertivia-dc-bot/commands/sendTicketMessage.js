const { PermissionFlagsBits } = require('discord.js');
const { sendTicketMessage } = require('../utils/ticketUtils');
const config = require('../config');

async function handleSendTicketMessageCommand(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
  }

  const channel = interaction.guild.channels.cache.get(config.ticketChannelId);
  if (!channel) {
    return interaction.reply({ content: 'Ticket channel not found.', ephemeral: true });
  }

  await sendTicketMessage(channel);
  await interaction.reply({ content: 'Ticket message sent successfully!', ephemeral: true });
}

module.exports = { handleSendTicketMessageCommand };