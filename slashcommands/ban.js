const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis');

const vreme = new Date().toLocaleString('sr-Latn-RS', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});

module.exports = {
    name: 'ban',
    description: 'Banuje korisnika sa servera.',

    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banuje korisnika sa servera.')
        .addUserOption(option =>
            option.setName('korisnik')
                .setDescription('Korisnik koji ce biti banovan')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razlog')
                .setDescription('Razlog bana'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: false });

        const targetUser = interaction.options.getUser('korisnik');
        const reason = interaction.options.getString('razlog') || 'Nije naveden razlog.';
        const member = interaction.guild.members.cache.get(targetUser.id);

        if (!member) {
            return interaction.editReply({ content: `${emojis.error} Korisnik nije pronadjen u data bazi.` });
        }

        if (!member.bannable) {
            return interaction.editReply({ content: `${emojis.error} Ne mogu da banujem ovog korisnika. Možda ima veće permisije od mene.` });
        }

        try {
        const dmEmbed = new EmbedBuilder()
               .setAuthor({ 
        name: 'bunt | Ban', 
        iconURL: interaction.guild.iconURL({ dynamic: true }) 
    })
                .setColor('#ad0fa0')
                .setDescription(
                    `<:staff:1491843299747823647> | **Ban Information:**\n` +
                    `> <:g_info:1491843443792678994> | **Server: ${interaction.guild.name}**\n` +
                    `> <:member:1491844391864897757> | **Korisnik: <@${targetUser.id}>**\n` +
                    `> <:bunt_ban:1491844524249714939> | **Moderator: <@${interaction.user.id}>**\n` +
                    `> ✏️ | **Razlog: ${reason}**\n` +
                    `> <:emoji_28:1491837148402421780> | **Vreme: \`${vreme}\`**`
                )
                .setTimestamp();

const channelEmbed = new EmbedBuilder()
    .setColor('#ad0fa0')
   .setAuthor({ 
        name: 'bunt | Ban', 
        iconURL: interaction.guild.iconURL({ dynamic: true }) 
    })
    .setDescription(
        `> <:bunt_ban:1491844524249714939> | **Korisnik:** <@${targetUser.id}> je dobio **BAN** na **bunt** server\n` +
        `> ✏️ | **Razlog: \`${reason}\`**`
    )
    .setTimestamp();

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                console.log(`Ne mogu poslati DM korisniku ${targetUser.tag}`);
            }

            await member.ban({ reason });

            await interaction.editReply({ embeds: [channelEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: `${emojis.error} Error: nisam uspeo da banujem korisnika.` });
        }
    }
};