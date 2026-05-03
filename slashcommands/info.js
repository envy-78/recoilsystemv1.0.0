const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('informacije')
        .setDescription('Prikazuje bitne informacije o zajednici')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('<a:ceh_leptir:1491856910423429213> Bunt se vraća!')
            .setThumbnail('https://cdn.discordapp.com/attachments/1474440087138730118/1492636914652676196/buntlogowarden.png?ex=69dc0df4&is=69dabc74&hm=7897adf9d1dd2ec2855c9690c9c50ddde0e141a68738f73db0345eaa803d8661&')
            .setDescription(
                'Posle dugo vremena, odlučili smo da naši ljudi koji su bili deo ' +
                '**Bunt**-a od **1,000+ Membera** zaslužuju da se svi zajedno ' +
                'ponovo nađu na jednom pravom Community Serveru.\n\n' +
                'Bunt nije bio samo server, bio je zajednica. I uskoro se vraćamo.'
            );

        await interaction.channel.send({ embeds: [embed] });

        await interaction.reply({ 
            content: 'Poslao si informaciju', 
            ephemeral: true 
        });
    },
};