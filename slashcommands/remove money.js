const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const EconomyProfile = require("../database/models/profile");
const emojis = require("../assets/emojis.json"); // ako koristiš iste emojije kao u balance.js

module.exports = {
    data: new SlashCommandBuilder()
        .setName("removemoney")
        .setDescription("Oduzmi novac korisniku")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("Korisnik kome odubuntš novac")
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Količina novca za odubuntnje")
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName("type")
                .setDescription("Odakle oduzeti novac?")
                .addChoices(
                    { name: "Wallet", value: "wallet" },
                    { name: "Bank", value: "bank" }
                )
                .setRequired(true)
        ),

    async execute(interaction) {

        if (!interaction.member.permissions.has("Administrator")) {
            return interaction.reply({ content: "Nemaš permisije za ovu komandu.", ephemeral: true });
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

        if (profile[type] < amount) {
            return interaction.reply({
                content: "Korisnik nema toliko novca.",
                ephemeral: true
            });
        }

        profile[type] -= amount;
        await profile.save();

        const embed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setAuthor({ name: `Uklanjanje novca | ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`> <:diamond_minus:1417111892836614185> | Oduzeto: **${amount}**\n> <:diamond_user:1248754065882484836> | Korsnik: ${iser}\n> <:diamond_coins:1418981903901655150> | Lokacija: **${type}**`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
