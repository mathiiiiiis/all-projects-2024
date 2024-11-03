const { EmbedBuilder } = require('discord.js');

const config = {
  ticketCategoryId: '1298626061894160466',
  welcomeChannelId: '1298626061894160468',
  logChannelId: '1298626061894160468',
  statusChannelId: '1298626061894160468',
  ticketChannelId: '1298626061894160468',
  swearWords: [
    'n[i!1|]gg[e3]r', 'b[a@4]st[a@4]rd', '[a@4]ssh[o0]l[e3]', 
    's[o0]n.*[o0]f.*[a@4].*b[i!1|]tch', 'f[u|ν]ck', 'f[u|ν]ck.*y[o0]u', 
    'g[o0].*k[i!1|]ll.*y[o0]urs[e3]lf', 'hur[e3]ns[o0]hn', 'd[i!1|]sc[o0]rd.*b[e3]tt[e3]r',
    'sh[i!1|]t', 'd[o0]uch[e3]b[a@4]g', 'c[u|ν]nt', 'm[o0]th[e3]rf[u|ν]ck[e3]r', 
    'b[i!1|]tch', 'd[i!1|]ck', 'pr[i!1|]ck', 'sl[u|ν]t', 'p[i!1|]ss.*[o0]ff', 
    'wh[o0]r[e3]', 'j[a@4]ck[a@4]ss', 'f[a@4]gg[o0]t', 'tw[a@4]t', 'p[u|ν]ssy', 
    'w[a@4]nk[e3]r', 'sch[e3][i!1|]([ßs])[e3]', '[a@4]rschl[o0]ch', 
    'f[i!1|]ck.*d[i!1|]ch', 'l[e3]ck.*m[i!1|]ch', 'schl[a@4]mp[e3]', 
    'w[i!1|]chs[e3]r', 'f[o0]tz[e3]', 'd[u|ν]mmk[o0]pf', 'm[i!1|]stst[uü]ck', 
    '[a@4]rsch', 'p[i!1|]ss[e3]r', 'sp[a@4]st[i!1|]', '[i!1|]d[i!1|][o0]t', 
    'k[a@4]ck[e3]', 'schw[a@4]nz', 'k[i!1|]ll.*y[o0]urs[e3]lf', 
    'c[o0]mm[i!1|]t.*s[u|ν][i!1|]c[i!1|]d[e3]', 'd[i!1|][e3].*[i!1|]n.*[a@4].*f[i!1|]r[e3]',
    'n[a@4]z[i!1|]', 'r[a@4]c[i!1|]st', 'd[u|ν].*h[u|ν]nd'
  ],
  questions: {
    'what is bloyid': 'Bloyid is a chat platform, offering features like servers, channels, and voice chat.',
    'how can i get the beta access': 'You can get Access to the Bloyid Beta, by creating a [Ticket](https://discord.com/channels/1278965826564919378/1295453625493225563).',
    'was ist blyoid': 'Blyoid ist ein Chat Platform, was dir Features wie Server, Channels und Voice Chat bietet.',
    'wie kann ich beta zugriff bekommen': 'Du kannst Zugriff auf den Beta von Bloyid bekommen, indem du ein [Ticket](https://discord.com/channels/1278965826564919378/1295453625493225563) erstellst.',
  },
};

async function handleMessage(message) {   
  if (message.author.bot) return;

  if (await moderateMessage(message)) return;

  answerQuestion(message);
}

async function moderateMessage(message) {
  const content = message.content;
  
  const normalizedContent = content
    .toLowerCase()
    .replace(/[\s.,*_\-+=!?~`'"#$%^&(){}[\]|\\/<>:;]/g, '')
    .replace(/@/g, 'a')
    .replace(/4/g, 'a')
    .replace(/1|\!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/\$/g, 's')
    .replace(/7/g, 't')
    .replace(/(.)\1+/g, '$1');

  const hasSwearWord = config.swearWords.some(pattern => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(normalizedContent);
    } catch (error) {
      console.error(`Invalid regex pattern: ${pattern}`, error);
      return false;
    }
  });

  if (hasSwearWord) {
    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('⚠️ Language Warning')
      .setDescription(`${message.author}, please watch your language!`)
      .setTimestamp();

    try {
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send message to channel:', error);
    }

    try {
      await message.author.send({ embeds: [embed] });
    } catch (error) {
      if (error.code === 50007) {
        console.log('User has DMs disabled.');
      } else {
        console.error('Failed to send DM to user:', error);
      }
    }

    logAction(message.guild, 'Message Deleted', `Deleted message from ${message.author.tag} for inappropriate language.`);

    try {
      const member = message.guild.members.cache.get(message.author.id);
      if (member && message.guild.me.permissions.has('MODERATE_MEMBERS')) {
        await member.timeout(30 * 60 * 1000, 'Inappropriate language');
      }
    } catch (error) {
      console.error('Failed to timeout user:', error);
    }

    try {
      await message.delete();
    } catch (error) {
      console.error('Failed to delete message:', error);
    }

    return true;
  }
  
  return false;
}

function answerQuestion(message) {
  const content = message.content.toLowerCase();

  for (const [question, answer] of Object.entries(config.questions)) {
    if (content.includes(question)) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('ℹ️ Question Answered')
        .setDescription(answer)
        .setFooter({ text: 'If you have more questions, feel free to ask!' });

      message.reply({ embeds: [embed] }).catch(console.error);
      return true;
    }
  }

  return false;
}

function logAction(guild, title, description) {
  const logChannel = guild.channels.cache.get(config.logChannelId);
  if (!logChannel) {
    console.error('Log channel not found. Please check the logChannelId in the config.');
    return;
  }

  const logEmbed = new EmbedBuilder()
    .setColor('#ff9900')
    .setTitle(`📝 ${title}`)
    .setDescription(description)
    .setTimestamp();

  logChannel.send({ embeds: [logEmbed] }).catch(console.error);
}

module.exports = { handleMessage };
