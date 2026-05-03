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
    name: 'kick',

    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Izbacuje korisnika sa servera.')
        .addUserOption(option =>
            option.setName('korisnik')
                .setDescription('Korisnik koji će biti izbačen')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razlog')
                .setDescription('Razlog kicka'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        await interaction.deferReply();

        const targetUser = interaction.options.getUser('korisnik');
        const reason = interaction.options.getString('razlog') || 'Nije naveden razlog.';
        const member = interaction.guild.members.cache.get(targetUser.id);

        if (!member) {
            return interaction.editReply({
                content: `${emojis.error} Korisnik nije pronadjen u data bazi`
            });
        }

        if (!member.kickable) {
            return interaction.editReply({
                content: `${emojis.error} Ne mogu da izbacim ovog korisnika. Verovatno ima veće permisije od mene.`
            });
        }

        try {

            const dmEmbed = new EmbedBuilder()
                .setAuthor({
                    name: 'bunt | Kick',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setColor('#ad0fa0')
                .setDescription(
                    `<:staff:1491843299747823647> | **Kick Informacije:**\n` +
                    `> <:g_info:1491843443792678994> | **Server:** ${interaction.guild.name}\n` +
                    `> <:member:1491844391864897757>  | **Korisnik:** <@${targetUser.id}>\n` +
                    `> <:member:1491844391864897757>  | **Moderator:** <@${interaction.user.id}>\n` +
                    `> ✏️ | **Razlog:** ${reason}\n` +
                    `> <:emoji_28:1491837148402421780> | **Vreme:** \`${vreme}\``
                )
                .setTimestamp();

            const channelEmbed = new EmbedBuilder()
                .setAuthor({
                    name: 'bunt | Kick',
                    iconURL: interaction.guild.iconURL({ dynamic: true })
                })
                .setColor('#ad0fa0')
                .setDescription(
                    `> <:bunt_ban:1491844524249714939> | **Korisnik:** <@${targetUser.id}> je izbačen sa **bunt** servera.\n` +
                    `> ✏️ | **Razlog:** \`${reason}\``
                )
                .setTimestamp();

            try {
                await targetUser.send({ embeds: [dmEmbed] });
            } catch {
                console.log(`❗ Ne mogu poslati DM korisniku ${targetUser.tag}.`);
            }

            await member.kick(reason);

            await interaction.editReply({ embeds: [channelEmbed] });

        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `${emojis.error} Error: nisam uspeo da izbacim korisnika.`
            });
        }
    }
};