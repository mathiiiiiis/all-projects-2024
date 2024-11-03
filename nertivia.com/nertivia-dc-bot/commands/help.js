const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder } = require('discord.js');

async function handleHelpCommand(interaction) {
  try {
    const commandsContent = await fs.readFile(path.join(__dirname, '..', 'commands.txt'), 'utf8');
    const commands = commandsContent.split('\n').filter(line => line.trim() !== '');

    if (commands.length === 0) {
      await interaction.reply({ content: 'No commands available.', ephemeral: true });
      return;
    }

    const helpEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Available Commands')
      .setDescription(commands.map(cmd => {
        const [name, description] = cmd.split('|');
        return `**/${name}**: ${description}`;
      }).join('\n'));

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  } catch (error) {
    console.error('Error reading commands file:', error);
    await interaction.reply({ content: 'An error occurred while fetching commands.', ephemeral: true });
  }
}

module.exports = { handleHelpCommand };