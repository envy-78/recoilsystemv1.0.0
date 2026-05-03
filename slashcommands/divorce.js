const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const profileModel = require("../database/models/profile");
const emojis = require('../assets/emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("divorce")
        .setDescription("Razvedi se od svog partnera"),

    async execute(interaction, client) {
        const user = interaction.user;

        const profile = await profileModel.findOne({ guildID: interaction.guild.id, userID: user.id });

        if (!profile || !profile.marriedTo) {
            const notMarriedEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({
                    name: `${client.user.username} | Divorce Error`,
                    iconURL: client.user.avatarURL()
                })

                .setDescription(`${emojis.chat} | Trenutno nisi u braku.`)
                .setTimestamp();
            return interaction.reply({ embeds: [notMarriedEmbed], ephemeral: true });
        }

        const partnerProfile = await profileModel.findOne({ guildID: interaction.guild.id, userID: profile.marriedTo });

        profile.marriedTo = null;
        await profile.save();

        if (partnerProfile) {
            partnerProfile.marriedTo = null;
            await partnerProfile.save();
        }

        const successEmbed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({
                name: `${client.user.username} | Divorce`,
                iconURL: client.user.avatarURL()
            })
            .setDescription(`${emojis.chat} | ${user} i tvoj partner su sada razvedeni.`)
            .setTimestamp();

        await interaction.reply({ embeds: [successEmbed] });
    }
};
