const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("pay")
        .setDescription("Pošalji novčiće drugom korisniku")
        .addUserOption(option => option.setName("user").setDescription("Korisnik kome šaljete").setRequired(true))
        .addIntegerOption(option => option.setName("amount").setDescription("Iznos novčića").setRequired(true)),

    async execute(interaction, client) {
        const sender = interaction.user;
        const target = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");
        const guildId = interaction.guild.id;

        if (target.id === sender.id) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Ne možeš poslati novčiće sebi!`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const senderProfile = await EconomyProfile.findOne({ guildID: guildId, userID: sender.id }) || new EconomyProfile({ guildID: guildId, userID: sender.id });
        const targetProfile = await EconomyProfile.findOne({ guildID: guildId, userID: target.id }) || new EconomyProfile({ guildID: guildId, userID: target.id });

        if (!senderProfile.wallet || senderProfile.wallet < amount) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Nemaš dovoljno novčića!`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        senderProfile.wallet -= amount;
        targetProfile.wallet += amount;
        await senderProfile.save();
        await targetProfile.save();

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${sender.tag}`, iconURL: sender.displayAvatarURL({ dynamic: true }) })
            .setDescription(`${emojis.coins} | Poslali ste **${amount} novčića** korisniku ${target.tag}`)
            .setColor("#ad0fa0")
            .setTimestamp();

        interaction.reply({ embeds: [embed] });
    }
};
