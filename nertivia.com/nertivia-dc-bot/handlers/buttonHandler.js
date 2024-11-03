const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

async function handleButtonInteraction(interaction) {
  if (interaction.customId === 'take_ticket') {
    if (interaction.member.permissions.has([PermissionFlagsBits.Administrator, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers])) {
      await interaction.reply(`${interaction.user} has taken this ticket.`);
    } else {
      await interaction.reply({ content: 'You do not have permission to take this ticket.', ephemeral: true });
    }
  } else if (interaction.customId === 'close_ticket') {
    await interaction.reply('This ticket will be closed in 5 seconds.');
    setTimeout(() => interaction.channel.delete(), 5000);
  } else if (interaction.customId === 'view_rules') {
    const rulesFilePath = path.join(__dirname, '../rules.txt');

    fs.readFile(rulesFilePath, 'utf8', async (err, data) => {
      if (err) {
        console.error('Error reading rules file:', err);
        await interaction.reply({ content: 'Failed to load rules.', ephemeral: true });
        return;
      }

      const rulesEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📜 Server Rules')
        .setDescription(data)
        .setTimestamp()
        .setFooter({ text: 'Please follow the rules to ensure a friendly environment!' });

      await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
    });
  }
}

module.exports = { handleButtonInteraction };

