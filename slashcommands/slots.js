const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const emojis = require("../assets/emojis.json");
const EconomyProfile = require("../database/models/profile");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Isprobaj slot mašinu")
        .addIntegerOption(option => option.setName("bet").setDescription("Iznos za klađenje").setRequired(true)),

    async execute(interaction, client) {
        const user = interaction.user;
        const guildId = interaction.guild.id;
        const bet = interaction.options.getInteger("bet");

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) profile = new EconomyProfile({ guildID: guildId, userID: user.id });

        if (!profile.wallet || profile.wallet < bet) {
            const errorEmbed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setAuthor({ name: `${client.user.username} | Error`, iconURL: client.user.avatarURL() })
                .setDescription(`${emojis.x} | Nemaš dovoljno novčića u walletu!`)
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const slotsEmojis = ["🍎", "🍌", "🍒", "🍇", "🍉"];
        const slots = ["❔", "❔", "❔"];

        const embed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`🎰 | Slotovi: ${slots.join(" | ")}\n${emojis.coins} | Ulog: ${bet} novčića\n${emojis.heart} | Vrtimo slotove...`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setColor("#ad0fa0")
            .setTimestamp();

        const msg = await interaction.reply({ embeds: [embed] });

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 3; j++) {
                slots[j] = slotsEmojis[Math.floor(Math.random() * slotsEmojis.length)];
            }

            const tempEmbed = new EmbedBuilder()
                .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setDescription(`🎰 | Slotovi: ${slots.join(" | ")}\n${emojis.coins} | Ulog: ${bet} novčića\n${emojis.heart} | Vrtimo slotove...`)
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setColor("#ad0fa0")
                .setTimestamp();

            await interaction.editReply({ embeds: [tempEmbed] });
            await new Promise(r => setTimeout(r, 500));
        }

        const result = [
            slotsEmojis[Math.floor(Math.random() * slotsEmojis.length)],
            slotsEmojis[Math.floor(Math.random() * slotsEmojis.length)],
            slotsEmojis[Math.floor(Math.random() * slotsEmojis.length)]
        ];

        let winnings = 0;
        if (result[0] === result[1] && result[1] === result[2]) winnings = bet * 5;
        else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) winnings = bet * 2;
        else winnings = -bet;

        profile.wallet += winnings;
        await profile.save();

        const finalEmbed = new EmbedBuilder()
            .setAuthor({ name: `${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setDescription(`🎰 | Rezultat: ${result.join(" | ")}\n${winnings > 0 ? `${emojis.crown} | Dobitak: ${winnings} novčića` : `${emojis.x} | Izgubili ste ${-winnings} novčića`}`)
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setColor("#ad0fa0")
            .setTimestamp();

        await interaction.editReply({ embeds: [finalEmbed] });
    }
};
