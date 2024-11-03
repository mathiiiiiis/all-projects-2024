const { EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

async function handleBanCommand(interaction) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';
  const duration = interaction.options.getInteger('duration');

  const actionEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('User Banned')
    .setDescription(`${user.tag} has been banned.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  if (duration) {
    actionEmbed.addFields({ name: 'Duration', value: `${duration} days`, inline: true });
    await interaction.guild.members.ban(user, { reason, days: duration });
  } else {
    actionEmbed.addFields({ name: 'Duration', value: 'Permanent', inline: true });
    await interaction.guild.members.ban(user, { reason });
  }

  await interaction.reply({ embeds: [actionEmbed], ephemeral: true });

  const userEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('You have been banned')
    .setDescription(`You have been banned from ${interaction.guild.name}.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  if (duration) {
    userEmbed.addFields({ name: 'Duration', value: `${duration} days`, inline: true });
  }

  try {
    await user.send({ embeds: [userEmbed] });
  } catch (error) {
    console.error(`Failed to send DM to ${user.tag}:`, error);
    await interaction.followUp({ content: `Failed to send a DM to ${user.tag}. They may have DMs disabled.`, ephemeral: true });
  }

  logAction(interaction.guild, 'User Banned', `${user.tag} was banned by ${interaction.user.tag}. Reason: ${reason}`);
}

module.exports = { handleBanCommand };