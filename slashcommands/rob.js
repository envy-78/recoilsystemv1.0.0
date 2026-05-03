const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("Pokušaj opljačkati drugog korisnika")
        .addUserOption(option => option.setName("user").setDescription("Korisnik kojeg želiš opljačkati").setRequired(true)),

    async execute(interaction) {
        const user = interaction.user;
        const target = interaction.options.getUser("user");
        const guildId = interaction.guild.id;

        if (target.id === user.id) return interaction.reply({ content: `${emojis.x} | Ne možeš opljačkati sebe!`, ephemeral: true });

        const profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id }) || new EconomyProfile({ guildID: guildId, userID: user.id });
        const targetProfile = await EconomyProfile.findOne({ guildID: guildId, userID: target.id }) || new EconomyProfile({ guildID: guildId, userID: target.id });

        if (!targetProfile.wallet || targetProfile.wallet < 50) return interaction.reply({ content: `${emojis.x} | Cilj nema dovoljno novčića!`, ephemeral: true });

        const success = Math.random() < 0.5;
        if (success) {
            const stolen = Math.floor(targetProfile.wallet * (Math.random() * 0.5 + 0.1)); // 10-60%
            targetProfile.wallet -= stolen;
            profile.wallet += stolen;
            await profile.save();
            await targetProfile.save();

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`${emojis.coins} | Uspešno si opljačkao **${stolen} novčića** od ${target.tag}`)
                .setColor("#ad0fa0")
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        } else {
            const loss = Math.floor(profile.wallet * (Math.random() * 0.2 + 0.05));
            profile.wallet -= loss;
            await profile.save();

            const embed = new EmbedBuilder()
                .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`${emojis.x} | Pljačka nije uspela! Izgubio si **${loss} novčića** u pokušaju`)
                .setColor("#ad0fa0")
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }
    }
};
