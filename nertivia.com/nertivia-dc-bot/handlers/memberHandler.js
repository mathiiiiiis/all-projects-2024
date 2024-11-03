const { handleMemberJoin } = require('./welcomeHandler');

function handleMemberEvents(client) {
  client.on('guildMemberAdd', handleMemberJoin);
}

module.exports = { handleMemberEvents };