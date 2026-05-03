const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ComponentType } = require("discord.js");
const profileModel = require("../database/models/profile");
const emojis = require('../assets/emojis.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("marry")
        .setDescription("Pokušaj oženiti/udati nekog člana")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Korisnik kojeg želiš oženiti/udati")
                .setRequired(true)
        ),

    async execute(interaction, client) {
        const proposer = interaction.user;
        const target = interaction.options.getUser("user");

        const errorEmbed = (desc) => new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({
                name: `${client.user.username} | Marriage Error`,
                iconURL: client.user.avatarURL()
            })
            .setDescription(`${emojis.chat} | ${desc}`)
            .setTimestamp();

        if (target.id === proposer.id)
            return interaction.reply({ embeds: [errorEmbed("Ne možeš se oženiti/udati sam sebi!")] });
        let proposerProfile = await profileModel.findOne({ guildID: interaction.guild.id, userID: proposer.id })
            || new profileModel({ guildID: interaction.guild.id, userID: proposer.id, totalXP:0, level:0, messages:0 });

        let targetProfile = await profileModel.findOne({ guildID: interaction.guild.id, userID: target.id })
            || new profileModel({ guildID: interaction.guild.id, userID: target.id, totalXP:0, level:0, messages:0 });

        if (proposerProfile.marriedTo || targetProfile.marriedTo)
            return interaction.reply({ embeds: [errorEmbed("Jedan od korisnika je već u braku!")] });

        const proposalEmbed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({
                name: `${client.user.username} | Marriage Proposal`,
                iconURL: client.user.avatarURL()
            })
            .setDescription(`${emojis.chat} | ${proposer} želi da se oženi/uda tebi, ${target}!\n${emojis.heart} | Klikni dugme ispod da prihvatiš ili odbiješ.`)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("accept_marry")
                    .setLabel("Prihvatam")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("decline_marry")
                    .setLabel("Odbijam")
                    .setStyle(ButtonStyle.Danger)
            );

        const msg = await interaction.reply({ embeds: [proposalEmbed], components: [row], fetchReply: true });

        const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on("collect", async (btn) => {
            if (btn.user.id !== target.id) {
                return btn.reply({ embeds: [errorEmbed("Samo predloženi korisnik može odgovoriti!")] , ephemeral: true });
            }

            if (btn.customId === "accept_marry") {
                proposerProfile.marriedTo = target.id;
                targetProfile.marriedTo = proposer.id;
                await proposerProfile.save();
                await targetProfile.save();

                const successEmbed = new EmbedBuilder()
                    .setColor("#ad0fa0")
                    .setAuthor({
                        name: `${client.user.username} | Marriage Success`,
                        iconURL: client.user.avatarURL()
                    })
                    .setDescription(`${emojis.crown} | ${proposer} i ${target} su sada u braku! ${emojis.heart}`)
                    .setTimestamp();

                await btn.update({ embeds: [successEmbed], components: [] });
            } else if (btn.customId === "decline_marry") {
                const declineEmbed = new EmbedBuilder()
                    .setColor("#ad0fa0")
                    .setAuthor({
                        name: `${client.user.username} | Marriage Declined`,
                        iconURL: client.user.avatarURL()
                    })
                    .setDescription(`${emojis.chat} | ${target} je odbio brak sa ${proposer}.`)
                    .setTimestamp();

                await btn.update({ embeds: [declineEmbed], components: [] });
            }

            collector.stop();
        });

        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor("#ad0fa0")
                    .setAuthor({
                        name: `${client.user.username} | Marriage Timeout`,
                        iconURL: client.user.avatarURL()
                    })
                    .setDescription(`${emojis.chat} | ${target} nije odgovorio na vreme, brak je otkazan.`)
                    .setTimestamp();

                await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    }
};
