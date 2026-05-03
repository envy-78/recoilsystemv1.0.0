const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("work")
        .setDescription("Radi i zaradi novčiće!"),

    async execute(interaction, client) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const now = new Date();
        const cooldown = 30 * 1000; // 30 sekundi da znas ako se ne razumes

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) profile = new EconomyProfile({ guildID: guildId, userID: user.id });

        if (profile.lastWork && now - profile.lastWork < cooldown) {
            const remaining = cooldown - (now - profile.lastWork);
            const minutes = Math.floor(remaining / 60000);
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Već si radio! Možeš ponovo za **${minutes}m**`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const earnings = Math.floor(Math.random() * 200) + 50; // 50-250 coins
        profile.wallet = (profile.wallet || 0) + earnings;
        profile.lastWork = now;
        await profile.save();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${emojis.coins} | Zaradio si **${earnings} novčića** radeći!`)
            .setColor("#ad0fa0")
            .setTimestamp()
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    }
};
