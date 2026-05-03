const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EconomyProfile = require("../database/models/profile");
const emojis = require("../assets/emojis.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roulette")
        .setDescription("Kladite se u ruletu i osvojite novac!")
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Količina novca koju ulažeš")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("color")
                .setDescription("Boja na koju se kladiš")
                .addChoices(
                    { name: "🔴 Red", value: "red" },
                    { name: "⚫ Black", value: "black" },
                    { name: "🟢 Green", value: "green" },
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.user;
        const amount = interaction.options.getInteger("amount");
        const color = interaction.options.getString("color");
        const guildId = interaction.guild.id;

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) {
            profile = new EconomyProfile({ guildID: guildId, userID: user.id });
            await profile.save();
        }

        if (profile.wallet < amount) {
            return interaction.reply({
                content: "❌ Nemaš dovoljno novčića u novčaniku!",
                ephemeral: true
            });
        }

        const numbers = [...Array(37).keys()]; // 0 - 36
        const result = numbers[Math.floor(Math.random() * numbers.length)];

        let resultColor = "";
        if (result === 0) resultColor = "green";
        else if (result % 2 === 0) resultColor = "black";
        else resultColor = "red";

        profile.wallet -= amount;

        let winAmount = 0;

        if (color === resultColor) {
            if (color === "green") winAmount = amount * 14;
            else winAmount = amount * 2;

            profile.wallet += winAmount;
        }

        await profile.save();

        const displayColor =
            resultColor === "red" ? "🔴 Red" :
            resultColor === "black" ? "⚫ Black" :
            "🟢 Green";

        const chosenColor =
            color === "red" ? "🔴 Red" :
            color === "black" ? "⚫ Black" :
            "🟢 Green";


        const embed = new EmbedBuilder()
    .setColor(winAmount > 0 ? "#19f505" : "#ad0fa0")
    .setAuthor({ name: `Roulette | ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
    .setDescription(`> <:diamond_user:1248754065882484836> | Korisnik: ${user}\n> <:diamond_coins:1418981903901655150> | Ulozeno: **${amount}**\n> <:diamond_star:1249045419338760386> | Izabrao: **${chosenColor}**\n> <:diamond_box:1341535864508911637> | Rezultat: **${displayColor} (${result})**`)
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setTimestamp();


        if (winAmount > 0) {
            embed.addFields({ name: "<:diamond_trophy:1416149744669167757> | Dobitak", value: `> **+${winAmount}** novčića` });
        } else {
            embed.addFields({ name: "<:diamond_bin:1249309442353397781> | Izgubio si", value: `> **-${amount}** novčića` });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
