const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'mute',

    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Muteduje korisnika na određeno vreme.')
        .addUserOption(opt =>
            opt.setName('korisnik')
                .setDescription('Korisnik koji će biti utisan.')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('vreme')
                .setDescription('Vreme muta (npr: 10m, 2h, 1d)')
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('razlog')
                .setDescription('Razlog mutovanja')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const targetUser = interaction.options.getUser('korisnik');
        const reason = interaction.options.getString('razlog') || 'Nije naveden razlog.';
        const timeInput = interaction.options.getString('vreme');
        const member = guild.members.cache.get(targetUser.id);

        const muteRole = guild.roles.cache.get('1491184162315440320'); // muted
        const defaultRole = guild.roles.cache.get('1491184125602828288'); // role koja se vraca

        if (!member) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Korisnik nije pronadjen u data bazi.`)] });
        if (!muteRole) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Mute role ne postoji.`)] });

        if (member.roles.cache.has(muteRole.id)) 
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Korisnik je već mutovan.`)] });

        const regex = /^(\d+)(m|h|d)$/;
        const match = timeInput.match(regex);
        if (!match) return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ad0fa0').setDescription(`> ❌ Neispravan format vremena. Primer: 10m, 2h, 1d`)] });

        const value = parseInt(match[1]);
        const unit = match[2];
        let durationMs;

        switch(unit){
            case 'm': durationMs = value * 60_000; break;
            case 'h': durationMs = value * 60 * 60_000; break;
            case 'd': durationMs = value * 24 * 60 * 60_000; break;
        }

        const rolesToRemove = member.roles.cache.filter(r => r.id !== muteRole.id);
        await member.roles.remove(rolesToRemove);

        await member.roles.add(muteRole, reason);

        const dmEmbed = new EmbedBuilder()
            .setAuthor({ name: 'bunt | Mute', iconURL: guild.iconURL({ dynamic: true }) })
            .setColor('#ad0fa0')
            .setDescription(`> 🔇 Mutovani ste na serveru: ${guild.name}\n> Moderator: <@${interaction.user.id}>\n> Razlog: ${reason}\n> Trajanje: ${timeInput}`)
            .setTimestamp();

        try { await targetUser.send({ embeds: [dmEmbed] }); } catch {}


        const channelEmbed = new EmbedBuilder()
            .setAuthor({ name: 'bunt | Mute', iconURL: guild.iconURL({ dynamic: true }) })
            .setColor('#ad0fa0')
            .setDescription(`> 🔇 **Korisnik:** <@${targetUser.id}> je mutovan\n> Razlog: ${reason}\n> Trajanje: ${timeInput}`)
            .setTimestamp();

        await interaction.editReply({ embeds: [channelEmbed] });

        setTimeout(async () => {
            const freshMember = guild.members.cache.get(member.id);
            if (!freshMember) return;

            if (freshMember.roles.cache.has(muteRole.id)) {
                await freshMember.roles.remove(muteRole); // skini muted
                await freshMember.roles.add(defaultRole); // dodaj default role

                // DM auto unmute
                const autoUnmuteDM = new EmbedBuilder()
                    .setAuthor({ name: 'bunt | Auto Unmute', iconURL: guild.iconURL({ dynamic: true }) })
                    .setColor('#00ff9d')
                    .setDescription(`> 🔊 Više niste mutovani na serveru ${guild.name}\n> Isteklo vreme muta: ${timeInput}`)
                    .setTimestamp();

                try { await targetUser.send({ embeds: [autoUnmuteDM] }); } catch {}
            }
        }, durationMs);
    }
};