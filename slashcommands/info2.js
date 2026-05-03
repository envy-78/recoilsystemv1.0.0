const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Prikazuje drugi deo informacija o otvaranju')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setDescription(
                '<a:ceh_strelice:1491858887551357099>**Pratite server za sve informacije o otvaranju!**\n\n' +
                '<:emoji_28:1491837148402421780> Ostavite reakciju na ovom postu, za brži release servera\n' +
                '<:emoji_28:1491837148402421780> Invite prijatelje i širite glas. Vreme je da se ekipa ponovo skupi.\n' +
                '<:emoji_28:1491837148402421780> [/bunt](https://discord.gg/9UcZuRdM5y)\n\n' +
                '\<:stars:1491889380821041284> **Očekujte uskoro zvanično otvaranje.**\n' +
                '\<:Holographic_owner_crown:1491847991261134979> Owners: <@1419061592062034045>'
            )
            .setImage('https://cdn.discordapp.com/attachments/1474440087138730118/1492636931362652281/buntbannerwarden.png?ex=69dc0df8&is=69dabc78&hm=652b3b5096f3d5390ea74f2abf312750d54840b2f73dc8b81d6406e998717fd3&');

        await interaction.channel.send({ embeds: [embed] });

        await interaction.reply({ 
            content: 'Poslao si informaciju', 
            ephemeral: true 
        });
    },
};