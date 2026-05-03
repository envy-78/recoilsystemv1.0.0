const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Uzmi svoj dnevni bonus novčića"),

    async execute(interaction, client) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const now = new Date();

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) {
            profile = new EconomyProfile({ guildID: guildId, userID: user.id });
        }

        const cooldown = 24 * 60 * 60 * 1000; // 24h u ms

        if (profile.lastDaily && now - profile.lastDaily < cooldown) {
            const remaining = cooldown - (now - profile.lastDaily);
            const hours = Math.floor(remaining / 3600000);
            const minutes = Math.floor((remaining % 3600000) / 60000);

            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({
                    name: `${client.user.username} | Error`,
                    iconURL: client.user.avatarURL()
                })
                .setDescription(`${emojis.x} | Već si uzeo dnevni bonus danas! Možeš ponovo za **${hours}h ${minutes}m**`)
                .setTimestamp();

            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }

        const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100 - 600 coins
        profile.wallet = (profile.wallet || 0) + dailyAmount;

        if (profile.lastDaily && (now - profile.lastDaily < 2 * cooldown)) {
            profile.dailyStreak = (profile.dailyStreak || 0) + 1;
        } else {
            profile.dailyStreak = 1;
        }

        profile.lastDaily = now;
        await profile.save();

        const streakText = profile.dailyStreak === 1 ? `${emojis.vatrice} | Streak: 1 dan` : `${emojis.vatrice} | Streak: ${profile.dailyStreak} dana`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${emojis.coins} | Dnevni bonus! Dobio si **${dailyAmount} novčića**\n${streakText}`)
            .setColor("#ad0fa0")
            .setTimestamp()
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    }
};
