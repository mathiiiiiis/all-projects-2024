const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

async function handleMemberJoin(member) {
  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (!channel) {
    console.error(`Welcome Channel with ID ${config.welcomeChannelId} not found`);
    return;
  }

  const welcomeEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Welcome to Bloyid!')
    .setDescription(`We are happy to have you here, ${member}!`)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Member Count', value: `You are our ${member.guild.memberCount}th member!`, inline: true },
      { name: 'Getting Started', value: 'Please check out the rules!', inline: true }
    )
    .setTimestamp();

  const rulesButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('view_rules')
        .setLabel('📜 Rules')
        .setStyle(ButtonStyle.Primary)
    );

  try {
    await channel.send({ embeds: [welcomeEmbed], components: [rulesButton] });
  } catch (error) {
    console.error(`Error sending welcome message in ${channel.name}:`, error);
  }
}

module.exports = { handleMemberJoin };