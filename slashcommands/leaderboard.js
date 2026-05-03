const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const profileModel = require("../database/models/profile");
const emojis = require("../assets/emojis.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("Prikazuje top 10 korisnika")
        .addStringOption(option =>
            option.setName("tip")
                .setDescription("Izaberi po čemu želiš leaderboard")
                .setRequired(true)
                .addChoices(
                    { name: "Novčići", value: "money" },
                    { name: "Level/XP", value: "level" }
                )
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const guildID = interaction.guild.id;
        const tip = interaction.options.getString("tip");

        let top;

        if (tip === "money") {

            top = await profileModel.aggregate([
                { $match: { guildID } },
                { $addFields: { totalMoney: { $add: ["$wallet", "$bank"] } } },
                { $sort: { totalMoney: -1 } },
                { $limit: 10 }
            ]);
        } else {
            top = await profileModel.find({ guildID })
                .sort({ totalXP: -1 })
                .limit(10);
        }

        if (!top.length) {
            return interaction.editReply("| Trenutno nema podataka za leaderboard u data bazi.");
        }

        let pos = 1;

        const lines = top.map(user => {
            const crown = pos === 1 ? `${emojis.crown} ` : "";
            const member = interaction.guild.members.cache.get(user.userID);
            const username = member ? member.user.username : "Unknown User";

            let valueText;
            if (tip === "money") {
                const totalMoney = (user.totalMoney != null ? user.totalMoney : (user.wallet || 0) + (user.bank || 0));
                valueText = `\`${totalMoney} novčića\``;
            } else {
                valueText = `\`${user.level || 0} lvl\` • \`${user.totalXP || 0} XP\``;
            }

            const line = `**#${pos}** ▸ ${username} ${crown} — ${valueText}`;
            pos++;
            return line;
        }).join("\n");

        const embed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({
                name: `${client.user.username} | Top 10 Leaderboard`,
                iconURL: client.user.avatarURL()
            })
            .setDescription(lines)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
