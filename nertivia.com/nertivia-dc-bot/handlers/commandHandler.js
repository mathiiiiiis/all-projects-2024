const { handleHelpCommand } = require('../commands/help');
const { handleStatusCommand } = require('../commands/status');
const { handleBanCommand } = require('../commands/ban');
const { handleKickCommand } = require('../commands/kick');
const { handleTimeoutCommand } = require('../commands/timeout');
const { handleCreateTicketCommand } = require('../commands/createTicket');
const { handleRulesCommand } = require('../commands/rules');
const { handleSendTicketMessageCommand } = require('../commands/sendTicketMessage');

async function handleCommandInteraction(interaction) {
  const { commandName } = interaction;

  switch (commandName) {
    case 'help':
      await handleHelpCommand(interaction);
      break;
    case 'status':
      await handleStatusCommand(interaction);
      break;
    case 'ban':
      await handleBanCommand(interaction);
      break;
    case 'kick':
      await handleKickCommand(interaction);
      break;
    case 'timeout':
      await handleTimeoutCommand(interaction);
      break;
    case 'createticket':
      await handleCreateTicketCommand(interaction);
      break;
    case 'rules':
      await handleRulesCommand(interaction);
      break;
    case 'sendticketmessage':
      await handleSendTicketMessageCommand(interaction);
      break;
    default:
      await interaction.reply({ content: 'Unknown command', ephemeral: true });
  }
}

module.exports = { handleCommandInteraction };