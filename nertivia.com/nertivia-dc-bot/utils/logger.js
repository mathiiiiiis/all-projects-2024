const { EmbedBuilder } = require('discord.js');
const config = require('../config');

function logAction(guild, title, description) {
  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (!logChannel) return;

  const logEmbed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(`📝 ${title}`)
    .setDescription(description)
    .setTimestamp();

  logChannel.send({ embeds: [logEmbed] }).catch(console.error);
}

module.exports = { logAction };