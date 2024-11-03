const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

async function sendTicketMessage(channel) {
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('🎫 Bloyid Support')
    .setDescription('This ticket can be used for various purposes. Available options are listed below.')
    .addFields(
      { name: 'Purposes:', value: '• Support\n• Developer Application' }
    )
    .setFooter({ text: 'Before opening a ticket, please note that our support team is NOT available at any time.' });

  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ticket_select')
        .setPlaceholder('Select your purpose...')
        .addOptions([
          { label: 'Support', value: 'support', emoji: '🛠️' },
          { label: 'Developer Application', value: 'dev_application', emoji: '💼' },
          { label: 'Beta Application', value: 'beta_application', emoji: '🎈' },
        ])
    );

  await channel.send({ embeds: [embed], components: [row] });
}

module.exports = { sendTicketMessage };