const axios = require('axios');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

const PING_TIMEOUT = 5000;

async function pingNertivia() {
  const startTime = Date.now();
  try {
    await axios.get('https://bloyid.com', { timeout: PING_TIMEOUT });
    const endTime = Date.now();
    const pingTime = endTime - startTime;
    return { online: true, pingTime };
  } catch (error) {
    return { online: false, pingTime: null };
  }
}

async function checkNertiviaStatus() {
  return await pingNertivia();
}

async function sendStatusUpdate(client) {
  const { online, pingTime } = await checkNertiviaStatus();
  const statusChannel = client.channels.cache.get(config.statusChannelId);
  if (statusChannel) {
    const statusEmbed = new EmbedBuilder()
      .setColor(online ? '#00ff00' : '#ff0000')
      .setTitle('Bloyid Status Update')
      .setDescription(`Bloyid is currently ${online ? '🟢 Online' : '🔴 Offline'}`)
      .setTimestamp();
    
    if (online && pingTime !== null) {
      statusEmbed.addFields({ name: 'Ping', value: `🏓 ${pingTime}ms`, inline: true });
    }
    
    statusEmbed.addFields({ name: 'Last Checked', value: `🕒 ${new Date().toLocaleString()}`, inline: true });
    
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel('Visit Bloyid')
          .setURL('https://bloyid.com')
          .setStyle(ButtonStyle.Link)
      );
    
    statusChannel.send({ embeds: [statusEmbed], components: [row] });
  }
}

function scheduleStatusChecks(client) {
  sendStatusUpdate(client);
  setInterval(() => sendStatusUpdate(client), 4 * 60 * 60 * 1000);
}

module.exports = { checkNertiviaStatus, scheduleStatusChecks };