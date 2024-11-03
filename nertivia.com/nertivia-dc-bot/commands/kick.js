const { EmbedBuilder } = require('discord.js');
const { logAction } = require('../utils/logger');

async function handleKickCommand(interaction) {
  const user = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  const actionEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('User Kicked')
    .setDescription(`${user.tag} has been kicked.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  await interaction.guild.members.kick(user, reason);
  await interaction.reply({ embeds: [actionEmbed], ephemeral: true });

  const userEmbed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('You have been kicked')
    .setDescription(`You have been kicked from ${interaction.guild.name}.`)
    .addFields(
      { name: 'Reason', value: reason, inline: true },
      { name: 'Moderator', value: interaction.user.tag, inline: true }
    )
    .setTimestamp();

  try {
    await user.send({ embeds: [userEmbed] });
  } catch (error) {
    console.error(`Failed to send DM to ${user.tag}:`, error);
    await interaction.followUp({ content: `Failed to send a DM to ${user.tag}. They may have DMs disabled.`, ephemeral: true });
  }

  logAction(interaction.guild, 'User Kicked', `${user.tag} was kicked by ${interaction.user.tag}. Reason: ${reason}`);
}

module.exports = { handleKickCommand };