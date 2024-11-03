async function handleCreateTicketCommand(interaction) {
    await interaction.reply({ content: 'Please use the ticket creation menu in the designated channel.', ephemeral: true });
  }
  
  module.exports = { handleCreateTicketCommand };