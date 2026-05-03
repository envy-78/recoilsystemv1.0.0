const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("avatar")
        .setDescription("Prikazuje avatar korisnika")
        .addUserOption(option =>
            option.setName("user")
            .setDescription("Korisnik čiji avatar želiš da vidiš")
            .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;

        const embed = {
            color: 0xFF870A,
            title: `Avatar korisnika ${user.username}`,
            image: { url: user.displayAvatarURL({ dynamic: true, size: 4096 }) },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [embed] });
    }
};
