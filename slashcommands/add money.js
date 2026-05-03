const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EconomyProfile = require("../database/models/profile");
const emojis = require("../assets/emojis.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addmoney")
        .setDescription("Dodaj novac korisniku")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Korisnik kome dodajes novac")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Kolicina novca")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Gde dodati novac?")
                .addChoices(
                    { name: "Wallet", value: "wallet" },
                    { name: "Bank", value: "bank" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {

        if (!interaction.member.permissions.has("Administrator")) {
            return interaction.reply({
                content: "Nemaš permisije za korištenje ove komande.",
                ephemeral: true
            });
        }

        const user = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");
        const type = interaction.options.getString("type");
        const guildId = interaction.guild.id;

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) {
            profile = new EconomyProfile({ guildID: guildId, userID: user.id });
            await profile.save();
        }

        profile[type] += amount;
        await profile.save();

        const embed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({
                name: `Dodavanje novca | ${user.tag}`,
                iconURL: user.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`> <:bunt_plus:1491842730475917342> | Dodano: **${amount}**\n> <:cry:1491842063594033283>  | Korisnik: ${user}\n> \<:emoji_28:1491837148402421780> | Lokacija: **${type}**`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
