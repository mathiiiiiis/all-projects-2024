const { EmbedBuilder } = require('discord.js');
const { checkNertiviaStatus } = require('../utils/statusChecker');

async function handleStatusCommand(interaction) {
  const { online, pingTime } = await checkNertiviaStatus();
  const statusEmbed = new EmbedBuilder()
    .setColor(online ? '#00ff00' : '#ff0000')
    .setTitle('Nertivia Status')
    .setDescription(`Nertivia is currently ${online ? '🟢 Online' : '🔴 Offline'}`)
    .setTimestamp();
  
  if (online && pingTime !== null) {
    statusEmbed.addFields({ name: 'Ping', value: `🏓 ${pingTime}ms`, inline: true });
  }
  
  await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
}

module.exports = { handleStatusCommand };