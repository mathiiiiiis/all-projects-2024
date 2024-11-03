const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder } = require('discord.js');

async function handleRulesCommand(interaction) {
  try {
    const rulesContent = await fs.readFile(path.join(__dirname, '..', 'rules.txt'), 'utf8');
    const rulesEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Server Rules')
      .setDescription(rulesContent)
      .setTimestamp();

    await interaction.reply({ embeds: [rulesEmbed], ephemeral: true });
  } catch (error) {
    console.error('Error reading rules file:', error);
    await interaction.reply({ content: 'Sorry, there was an error displaying the rules. Please contact a server administrator.', ephemeral: true });
  }
}

module.exports = { handleRulesCommand };