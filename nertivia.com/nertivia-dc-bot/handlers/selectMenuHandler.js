const { ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

const config = {
  ticketCategoryId: '1295453141940047934',
  logChannelId: '1295453428289634364'
};

async function handleSelectMenu(interaction) {
  if (interaction.customId === 'ticket_select') {
    await createTicket(interaction, interaction.values[0]);
  }
}

async function createTicket(interaction, purpose) {
  const guild = interaction.guild;
  const category = guild.channels.cache.get(config.ticketCategoryId);

  if (!category) {
    return interaction.reply({ content: 'Ticket category not found.', ephemeral: true });
  }

  const channelName = `ticket-${purpose}-${interaction.user.username}`;

  try {
    const channel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: ['ViewChannel'],
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages'],
        },
      ],
    });

    const embed = new EmbedBuilder()
      .setColor('#00ff00')
      .setTitle(`🎫 New ${purpose.replace('_', ' ')} Ticket`)
      .setDescription(`Welcome to your ticket, ${interaction.user}!`)
      .addFields(
        { name: 'Ticket Channel', value: channel.toString(), inline: true },
        { name: 'Created By', value: interaction.user.toString(), inline: true }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('take_ticket')
          .setLabel('Take Ticket')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Danger)
      );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `Ticket created! Check ${channel}`, ephemeral: true });

    logAction(guild, 'Ticket Created', `${interaction.user.tag} created a new ${purpose.replace('_', ' ')} ticket.`);

    const members = await guild.members.fetch();
    members.forEach(member => {
      if (member.permissions.has([PermissionFlagsBits.Administrator, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers])) {
        channel.permissionOverwrites.edit(member, { ViewChannel: true, SendMessages: true });
      }
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    await interaction.reply({ content: 'There was an error creating your ticket. Please try again later.', ephemeral: true });
  }
}

function logAction(guild, title, description) {
  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (!logChannel) return;

  const logEmbed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(`📝 ${title}`)
    .setDescription(description)
    .setTimestamp();

  logChannel.send({ embeds: [logEmbed] }).catch(console.error);
}

module.exports = { handleSelectMenu };