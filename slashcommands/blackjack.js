const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const EconomyProfile = require("../database/models/profile");
const emojis = require("../assets/emojis.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("blackjack")
        .setDescription("Zaigraj blackjack i osvoji novac!")
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Ulog koji želiš staviti")
                .setRequired(true)
        ),

    async execute(interaction) {
        const user = interaction.user;
        const amount = interaction.options.getInteger("amount");
        const guildId = interaction.guild.id;

        let profile = await EconomyProfile.findOne({ guildID: guildId, userID: user.id });
        if (!profile) {
            profile = new EconomyProfile({ guildID: guildId, userID: user.id });
            await profile.save();
        }

        if (profile.wallet < amount) {
            return interaction.reply({
                content: "Nemaš dovoljno novčića u novčaniku!",
                ephemeral: true
            });
        }

        const suits = ["♠️", "♥️", "♦️", "♣️"];
        const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

        const deck = [];
        for (let s of suits) for (let r of ranks) deck.push({ suit: s, rank: r });

        const drawCard = () => deck.splice(Math.floor(Math.random() * deck.length), 1)[0];

        const calcValue = (hand) => {
            let value = 0;
            let aces = 0;

            for (let card of hand) {
                if (["J", "Q", "K"].includes(card.rank)) value += 10;
                else if (card.rank === "A") { value += 11; aces++; }
                else value += Number(card.rank);
            }

            while (value > 21 && aces > 0) { value -= 10; aces--; }

            return value;
        };

        let playerHand = [drawCard(), drawCard()];
        let dealerHand = [drawCard(), drawCard()];

        let playerValue = calcValue(playerHand);

        const formatHand = (hand) =>
            hand.map(c => `${c.rank}${c.suit}`).join(", ");

        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("hit").setLabel("Hit").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("stand").setLabel("Stand").setStyle(ButtonStyle.Success)
        );

        const embed = new EmbedBuilder()
            .setColor("##ad0fa0")
            .setAuthor({ name: `Blackjack | ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setDescription(
                `> <:member:1491844391864897757> | Igrač: ${formatHand(playerHand)}\n` +
                `> <:_coins:1491845378104885442> | Vrednost: **${playerValue}**\n` +
                `> <:emoji_28:1491837148402421780> | Diler: ${dealerHand[0].rank}${dealerHand[0].suit}, ❓\n` +
                `> <:_coins:1491845378104885442> | Ulog: **${amount}**`
            )
            .setTimestamp();

        const msg = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === user.id,
            time: 30000
        });

        collector.on("collect", async (btn) => {
            if (btn.customId === "hit") {
                playerHand.push(drawCard());
                playerValue = calcValue(playerHand);

                if (playerValue >= 22) {
                    collector.stop("bust");
                } else {
                    const updated = new EmbedBuilder()
                        .setColor("##ad0fa0")
                        .setAuthor({ name: `Blackjack | ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                        .setDescription(
                            `> <:member:1491844391864897757> | Igrač: ${formatHand(playerHand)}\n` +
                            `> <:_coins:1491845378104885442> | Vrednost: **${playerValue}**\n` +
                            `> <:emoji_28:1491837148402421780> | Diler: ${dealerHand[0].rank}${dealerHand[0].suit}, ❓\n` +
                            `> <:_coins:1491845378104885442> | Ulog: **${amount}**`
                        );

                    await btn.update({ embeds: [updated], components: [buttons] });
                }
            }

            if (btn.customId === "stand") {
                collector.stop("stand");
            }
        });

        collector.on("end", async (collected, reason) => {
            let dealerValue = calcValue(dealerHand);

            while (dealerValue < 17) {
                dealerHand.push(drawCard());
                dealerValue = calcValue(dealerHand);
            }

            let result = "";
            let winAmount = 0;

            if (reason === "bust" || playerValue > 21) {
                result = "Izgubio si!";
                profile.wallet -= amount;

            } else if (dealerValue > 21 || playerValue > dealerValue) {
                result = "\<a:check_yes:1491835595285332039> Pobedio si!";
                winAmount = amount;
                profile.wallet += amount;

            } else if (playerValue === dealerValue) {
                result = "Nereseno";
            } else {
                result = "Izgubio si!";
                profile.wallet -= amount;
            }

            await profile.save();

            const final = new EmbedBuilder()
                .setColor(winAmount > 0 ? "#19f505" : "#ad0fa0")
                .setAuthor({ name: `Blackjack | ${user.tag}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                .setDescription(
                    `> <:member:1491844391864897757> | Igrač: ${formatHand(playerHand)}\n` +
                    `> <:_coins:1491845378104885442> | Vrednost: **${playerValue}**\n` +
                    `> <:member:1491844391864897757> | Diler: ${formatHand(dealerHand)}\n` +
                    `> <:_coins:1491845378104885442> | Dilera-Vrednost: **${dealerValue}**\n` +
                    `> <:box:1491846138993709236> | Rezultat: **${result}**`
                )
                .setTimestamp();

            if (winAmount > 0)
                final.addFields({ name: "<a:check_yes:1491835595285332039> | Dobitak", value: `> **+${winAmount}** novčića` });
            else if (result.includes("Izgubio"))
                final.addFields({ name: "<a:no:1491835785945809107> | Izgubio si", value: `> **-${amount}** novčića` });

            await msg.edit({ embeds: [final], components: [] });
        });
    }
};
