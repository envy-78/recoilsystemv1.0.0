const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unmute',

    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Skida mute sa korisnika.')
        .addUserOption(opt =>
            opt.setName('korisnik')
                .setDescription('Korisnik koji će biti unmuteovan.')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const targetUser = interaction.options.getUser('korisnik');
        const member = guild.members.cache.get(targetUser.id);
        const muteRole = guild.roles.cache.get('1491184162315440320');
        const defaultRole = guild.roles.cache.get('1491184125602828288');

        if (!member) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Korisnik nije pronađen.`)] });
        if (!muteRole) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Mute rola ne postoji.`)] });
        if (!member.roles.cache.has(muteRole.id)) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Korisnik nije mutovan.`)] });

        await member.roles.remove(muteRole);
        await member.roles.add(defaultRole);

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'bunt | Unmute', iconURL: guild.iconURL({ dynamic: true }) })
            .setColor('#ad0fa0')
            .setDescription(`> 🔊 **Korisnik:** <@${targetUser.id}> više nije mutovan`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};