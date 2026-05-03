const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("deposit")
        .setDescription("Stavi novčiće u banku")
        .addIntegerOption(option => option.setName("amount").setDescription("Iznos za depozit").setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const amount = interaction.options.getInteger("amount");

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) profile = new EconomyProfile({ guildID: guildId, userID: user.id });

        if (!profile.wallet || profile.wallet < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Nemaš dovoljno novčića u walletu!`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        profile.wallet -= amount;
        profile.bank += amount;
        await profile.save();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${emojis.bank} | Uspešno si stavio **${amount} novčića** u banku`)
            .setColor("#ad0fa0")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
