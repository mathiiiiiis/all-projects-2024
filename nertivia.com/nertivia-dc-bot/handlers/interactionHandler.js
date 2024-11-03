const { handleCommandInteraction } = require('./commandHandler');
const { handleButtonInteraction } = require('./buttonHandler');
const { handleSelectMenu } = require('./selectMenuHandler');

async function handleInteraction(interaction) {
  if (interaction.isCommand()) {
    await handleCommandInteraction(interaction);
  } else if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await handleSelectMenu(interaction);
  }
}

module.exports = { 
  handleInteraction,
  handleSelectMenu,
};