const {
    Client,
    GatewayIntentBits,
    Collection,
    REST,
    Routes,
    EmbedBuilder,
    Events
} = require("discord.js")
const fs = require("fs")
const path = require("path")
const config = require("./config.json")

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration // Dodato za banove
    ]
})

const statsChannels = {
    serverId: '1491182020879978578',
    totalMembers: '1492501644628463747', 
    voiceActive: '1492501647979450400',  
    totalBans: '1492501643160322230'    
};

async function updateStats(guild) {
    if (!guild || guild.id !== statsChannels.serverId) return;

    try {

        const memberChannel = guild.channels.cache.get(statsChannels.totalMembers);
        if (memberChannel) await memberChannel.setName(`˙．👥・ ${guild.memberCount} članova`);

        const voiceChannel = guild.channels.cache.get(statsChannels.voiceActive);
        if (voiceChannel) {
            const voiceCount = guild.members.cache.filter(m => m.voice.channel).size;
            await voiceChannel.setName(`˙．📞・ U Voiceu: ${voiceCount}`);
        }

        const banChannel = guild.channels.cache.get(statsChannels.totalBans);
        if (banChannel) {
            const bans = await guild.bans.fetch().catch(() => null);
            if (bans) await banChannel.setName(`˙．🔐・Banovani: ${bans.size}`);
        }
    } catch (err) {
        
    }
}

client.commands = new Collection()
client.slashCommands = new Collection()

const commandsPath = path.join(__dirname, "commands")
if (fs.existsSync(commandsPath)) {
    for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"))) {
        const cmd = require(path.join(commandsPath, file))
        client.commands.set(cmd.name, cmd)
    }
}

const slashPath = path.join(__dirname, "slashcommands")
if (fs.existsSync(slashPath)) {
    for (const file of fs.readdirSync(slashPath).filter(f => f.endsWith(".js"))) {
        const slash = require(path.join(slashPath, file))
        client.slashCommands.set(slash.data.name, slash)
    }
}

const eventPath = path.join(__dirname, "events")
for (const file of fs.readdirSync(eventPath).filter(f => f.endsWith(".js"))) {
    const event = require(path.join(eventPath, file))
    if (event.once) client.once(event.name, (...a) => event.execute(...a, client))
    else client.on(event.name, (...a) => event.execute(...a, client))
}

// === EVENTI ZA AUTOMATSKO OSVEŽAVANJE ===

client.on('ready', () => {
    const guild = client.guilds.cache.get(statsChannels.serverId);
    updateStats(guild);
});

client.on('guildMemberAdd', (member) => updateStats(member.guild));
client.on('guildMemberRemove', (member) => updateStats(member.guild));
client.on('voiceStateUpdate', (oldState, newState) => updateStats(newState.guild));
client.on('guildBanAdd', (ban) => updateStats(ban.guild));
client.on('guildBanRemove', (ban) => updateStats(ban.guild));

client.on('guildMemberUpdate', (oldMember, newMember) => {
    const boostChannelId = '1492501691151683655';
    if (!oldMember.premiumSince && newMember.premiumSince) {
        const channel = newMember.guild.channels.cache.get(boostChannelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('#a00092')
                .setTitle('NOVI SERVER BOOST!')
                .setAuthor({ name: newMember.user.username, iconURL: newMember.user.displayAvatarURL() })
                .setDescription(`<@${newMember.id}>`)
                .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTimestamp();
            channel.send({ content: `<@${newMember.id}>`, embeds: [embed] });
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.id !== '1419061592062034045') return;

    if (message.content.startsWith('!boost')) {
        const targetUser = message.mentions.users.first();
        if (!targetUser) return;

        const boostChannelId = '1492501691151683655';
        const channel = message.guild.channels.cache.get(boostChannelId);

        if (channel) {
            const testEmbed = new EmbedBuilder()
                .setColor('#a00092')
                .setTitle('NOVI SERVER BOOST!')
                .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
                .setDescription(`<@${targetUser.id}>`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 512 }))
                .setTimestamp();

            channel.send({ content: `<@${targetUser.id}>`, embeds: [testEmbed] });
        }
    }
});

client.login(config.token)