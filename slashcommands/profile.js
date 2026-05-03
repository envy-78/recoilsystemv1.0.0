const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    subtext,
    SlashCommandBuilder
} = require("discord.js");

const emojis = require('../assets/emojis.json');
const profileModel = require("../database/models/profile");
const { vatriceDB } = require("../utils/vatrice");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("profile")
        .setDescription("Prikaži svoj ili tuđi bunt profil")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Korisnik čiji profil želiš da vidiš")
                .setRequired(false)
        ),

    async execute(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const userId = user.id;
        const guildId = interaction.guild.id;

        const member = await interaction.guild.members.fetch(user.id);
        const joinedAtUnix = Math.floor(member.joinedTimestamp / 1000);
        const createdUnix = Math.floor(user.createdTimestamp / 1000);

        let profile = await profileModel.findOne({ guildID: guildId, userID: userId });
        if (!profile) {
            profile = new profileModel({
                guildID: guildId,
                userID: userId,
                totalXP: 0,
                level: 0,
                messages: 0,
                marriedTo: null,
                wallet: 0,
                bank: 0,
                dailyStreak: 0,
                items: []
            });
            await profile.save();
        }

        const LEVEL_MULTIPLIER = 200;
        const nextLevelXP = (profile.level + 1) * LEVEL_MULTIPLIER;

        let marriageText = "Korisnik trenutno nije married.";
        if (profile.marriedTo) {
            try {
                const partner = await interaction.guild.members.fetch(profile.marriedTo);
                marriageText = `U braku sa **${partner.user.username}** ${emojis.heart}`;
            } catch {
                marriageText = "U braku (partner nije pronađen na serveru).";
            }
        }

        const vatrice = vatriceDB[userId]?.vatrice || 0;
        const vatriceText = `Ukupno vatrica: \`${vatrice}\``;

        const guildID = interaction.guild.id;
        const allUsers = await profileModel.find({ guildID });
        allUsers.sort((a, b) => (b.wallet + b.bank) - (a.wallet + a.bank));
        const rank = allUsers.findIndex(u => u.userID === userId) + 1 || 1;
        const totalCash = (profile.wallet || 0) + (profile.bank || 0);


        const container = new ContainerBuilder()
            .setAccentColor(0xFF870A)

            .addTextDisplayComponents(
                (t1) => t1.setContent(`# ${emojis.idcard}︲${user.username}`),
                (t2) => t2.setContent(subtext(`ID: ${user.id} | Joined: <t:${joinedAtUnix}:R> | Created: <t:${createdUnix}:R>`))
            )

            .addSeparatorComponents((sep) =>
                sep.setSpacing(SeparatorSpacingSize.Small)
            )

            .addTextDisplayComponents(
                (t1) => t1.setContent(`${emojis.chat}︲**Chat Informacije**`),
                (t2) => t2.setContent(`Level: \`${profile.level}\` | XP: \`${profile.totalXP}/${nextLevelXP}\` | Messages: \`${profile.messages}\``)
            )

            .addTextDisplayComponents(
                (t1) => t1.setContent(`${emojis.coins}︲**Cash Balance**`),
                (t2) => t2.setContent(`Cash: \`${totalCash}$\` | Rank: #${rank}`)
            )

            .addTextDisplayComponents(
                (t1) => t1.setContent(`${emojis.heart}︲**Marriage**`),
                (t2) => t2.setContent(marriageText)
            )

            .addTextDisplayComponents(
                (t1) => t1.setContent(`${emojis.vatrice}︲**Vatrice**`),
                (t2) => t2.setContent(vatriceText)
            )

            .addSeparatorComponents((sep) =>
                sep.setSpacing(SeparatorSpacingSize.Small)
            )

            .addTextDisplayComponents(
                (t1) => t1.setContent(subtext(`Generated at: <t:${Math.floor(Date.now() / 1000)}:F>`))
            );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        });
    }
};
