const { EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

async function handleTimeoutCommand(interaction) {
  const user = interaction.options.getUser('user');
  const duration = interaction.options.getInteger('duration');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  const actionEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('User Timed Out')
    .setDescription(`${user.tag} has been timed out.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true },
      { name: 'Duration', value: `${duration} minutes`, inline: true }
    )
    .setTimestamp();

  await interaction.guild.members.cache.get(user.id).timeout(duration * 60 * 1000, reason);
  await interaction.reply({ embeds: [actionEmbed], ephemeral: true });

  const userEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('You have been timed out')
    .setDescription(`You have been timed out in ${interaction.guild.name}.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true },
      { name: 'Duration', value: `${duration} minutes`, inline: true }
    )
    .setTimestamp();

  try {
    await user.send({ embeds: [userEmbed] });
  } catch (error) {
    console.error(`Failed to send DM to ${user.tag}:`, error);
    await interaction.followUp({ content: `Failed to send a DM to ${user.tag}. They may have DMs disabled.`, ephemeral: true });
  }

  logAction(interaction.guild, 'User Timed Out', `${user.tag} was timed out by ${interaction.user.tag} for ${duration} minutes. Reason: ${reason}`);
}

module.exports = { handleTimeoutCommand };