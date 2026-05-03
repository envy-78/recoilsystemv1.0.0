const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("withdraw")
        .setDescription("Povuci novčiće iz banke")
        .addIntegerOption(option => option.setName("amount").setDescription("Iznos za povlačenje").setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const amount = interaction.options.getInteger("amount");

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) profile = new EconomyProfile({ guildID: guildId, userID: user.id });

        if (!profile.bank || profile.bank < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Nemaš dovoljno novčića u banci!`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        profile.bank -= amount;
        profile.wallet += amount;
        await profile.save();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${emojis.coins} | Uspešno si povukao **${amount} novčića** iz banke`)
            .setColor("#ad0fa0")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
