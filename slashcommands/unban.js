const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const emojis = require('../utils/emojis');

module.exports = {
    name: 'unban',

    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Vraća banovanog korisnika na server.')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('ID korisnika kojeg želite unbanovati')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Razlog unbana'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'Nije naveden razlog.';

        try {
            await interaction.guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'bunt | Unban', iconURL: interaction.guild.iconURL({ dynamic: true }) })
                .setColor('#00ff9d')
                .setDescription(
                    `> <a:check_yes:1491835595285332039> | **Korisnik sa ID:** \`${userId}\` je unbanovan\n` +
                    `> ✏️ | **Razlog:** ${reason}`
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`${emojis.error} Ne mogu unbanovati korisnika. Proverite ID i pokušajte ponovo.`);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },

    async prefixRun(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`${emojis.error} Nemate permisiju da koristite ovu komandu.`);
            return message.reply({ embeds: [embed] });
        }

        const userId = args[0];
        if (!userId) {
            const embed = new EmbedBuilder()
                .setColor('#ffcc00')
                .setDescription(`${emojis.warning} Morate uneti ID korisnika kojeg želite unbanovati.`);
            return message.reply({ embeds: [embed] });
        }

        const reason = args.slice(1).join(' ') || 'Nije naveden razlog.';

        try {
            await message.guild.members.unban(userId, reason);

            const embed = new EmbedBuilder()
                .setAuthor({ name: 'bunt | Unban', iconURL: message.guild.iconURL({ dynamic: true }) })
                .setColor('#00ff9d')
                .setDescription(
                    `> \<a:check_yes:1491835595285332039> | **Korisnik sa ID:** \`${userId}\` je unbanovan\n` +
                    `> ✏️ | **Razlog:** ${reason}`
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setDescription(`${emojis.error} Ne mogu unbanovati korisnika. Proverite ID i pokušajte ponovo.`);
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};