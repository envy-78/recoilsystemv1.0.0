const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("gamble")
        .setDescription("Kladite se sa novčićima")
        .addIntegerOption(option => option.setName("amount").setDescription("Iznos za klađenje").setRequired(true)),

    async execute(interaction, client) {
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

        const win = Math.random() < 0.5;
        if (win) profile.wallet += amount;
        else profile.wallet -= amount;

        await profile.save();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(win
                ? `${emojis.coins} | Pobedili ste i dobili **${amount} novčića**!`
                : `${emojis.x} | Izgubili ste **${amount} novčića**!`)
            .setColor("#ad0fa0")
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};
