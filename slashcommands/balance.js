const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Prikaži svoj ili tuđi novčanik")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Korisnik čiji balans želiš da vidiš")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const guildId = interaction.guild.id;

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) {
            profile = new EconomyProfile({ guildID: guildId, userID: user.id });
            await profile.save();
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .addFields(
                { name: `${emojis.coins} | Wallet`, value: `> ${profile.wallet} novčića`, inline: true },
                { name: `${emojis.bank} | Bank`, value: `> ${profile.bank} novčića`, inline: true },
            )
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))

            .setColor("#ad0fa0")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
