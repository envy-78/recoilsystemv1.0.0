const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

const words = fs.readFileSync(path.join(__dirname, "..", "assets", "serbian-words-latin.txt"), "utf-8")
    .split(/\r?\n/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 4);

const ALLOWED_CHANNEL = "1491184330339389480"; // samo ovaj kanal

module.exports = {
    data: new SlashCommandBuilder()
        .setName("kaladont")
        .setDescription("Pokreni igru Kaladont")
        .addStringOption(opt =>
            opt.setName("mode")
                .setDescription("start / stop")
                .setRequired(true)
                .addChoices(
                    { name: "start", value: "start" },
                    { name: "stop", value: "stop" }
                )
        ),

    async execute(interaction) {
        if (interaction.channel.id !== ALLOWED_CHANNEL) {
            return interaction.reply({ content: "<a:no:1491835785945809107> Komanda može da se koristi samo u kanalu #kaladont.", ephemeral: true });
        }

        const mode = interaction.options.getString("mode");
        const key = `${interaction.guild.id}-${interaction.channel.id}`;

        if (mode === "start") {
            if (global.kaladontGames && global.kaladontGames[key]) {
                return interaction.reply({ content: "<a:no:1491835785945809107> Igra već traje u ovom kanalu.", ephemeral: true });
            }

            const firstWord = words[Math.floor(Math.random() * words.length)];

            const game = {
                used: new Set([firstWord]),
                lastTwo: firstWord.slice(-2),
                active: true,
                history: [{ user: interaction.user.tag, word: firstWord }]
            };
            global.kaladontGames = global.kaladontGames || {};
            global.kaladontGames[key] = game;

            const embed = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setTitle("🟢 Kaladont | Nova igra")
                .setDescription(`> <a:pisanje:1491841659535884389> | Prva reč: **${firstWord}**\n> ✏️ | Sledeća reč mora početi sa: **${game.lastTwo}**`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }

        if (mode === "stop") {
            if (!global.kaladontGames || !global.kaladontGames[key]) {
                return interaction.reply({ content: "<a:no:1491835785945809107> Nema aktivne igre u ovom kanalu.", ephemeral: true });
            }
            delete global.kaladontGames[key];
            return interaction.reply({ content: "🛑 Igra je prekinuta.", ephemeral: true });
        }
    },

    onMessage: async (message) => {
        if (!message.guild || message.author.bot) return;
        if (message.channel.id !== ALLOWED_CHANNEL) return;

        const key = `${message.guild.id}-${message.channel.id}`;
        const game = global.kaladontGames?.[key];
        if (!game || !game.active) return;

        const word = message.content.toLowerCase().trim();

        if (!words.includes(word)) {
            return message.reply("<a:no:1491835785945809107> Ta reč nije u rečniku ili nije validna.");
        }
        if (game.used.has(word)) {
            return message.reply("<a:no:1491835785945809107> Ta reč je već korišćena.");
        }
        if (!word.startsWith(game.lastTwo)) {
            return message.reply(`<a:no:1491835785945809107> Reč mora početi sa **${game.lastTwo}**.`);
        }

        game.used.add(word);
        game.lastTwo = word.slice(-2);
        game.history.push({ user: message.author.tag, word });

        if (game.lastTwo === "ka") {
            game.active = false;

            const embed = new EmbedBuilder()
                .setColor("#19f505")
                .setTitle("🎉 Kaladont | Pobednik!")
                .setDescription(`> <:member:1491844391864897757> | **${message.author.tag}** je pobedio/la!\n>  | Reč kojom je završio/la igru: **${word}**`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            delete global.kaladontGames[key];

            const newWord = words[Math.floor(Math.random() * words.length)];
            const newGame = {
                used: new Set([newWord]),
                lastTwo: newWord.slice(-2),
                active: true,
                history: [{ user: "Bot (auto start)", word: newWord }]
            };
            global.kaladontGames[key] = newGame;

            const embedRestart = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setTitle("🟢 Kaladont | Nova igra (auto start)")
                .setDescription(`>  | Prva reč: **${newWord}**\n> ✏️ | Sledeća reč mora početi sa: **${newGame.lastTwo}**`)
                .setTimestamp();

            await message.channel.send({ embeds: [embedRestart] });
            return;
        }

        const possibleNext = words.some(w => w.startsWith(game.lastTwo) && !game.used.has(w));
        if (!possibleNext) {
            game.active = false;

            const embedNoNext = new EmbedBuilder()
                .setColor("#f50505")
                .setTitle("⚠ Kaladont | Nema više reči!")
                .setDescription(`>  | Igrač **${message.author.tag}** je rekao/la: **${word}**\n> Nema više validnih reči, igra se automatski restartuje.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embedNoNext] });

            const newWord = words[Math.floor(Math.random() * words.length)];
            const newGame = {
                used: new Set([newWord]),
                lastTwo: newWord.slice(-2),
                active: true,
                history: [{ user: "Bot (auto start)", word: newWord }]
            };
            global.kaladontGames[key] = newGame;

            const embedRestart = new EmbedBuilder()
                .setColor("#ad0fa0")
                .setTitle("🟢 Kaladont | Nova igra (auto start)")
                .setDescription(`>  | Prva reč: **${newWord}**\n> ✏️ | Sledeća reč mora početi sa: **${newGame.lastTwo}**`)
                .setTimestamp();

            await message.channel.send({ embeds: [embedRestart] });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setTitle("🟢 Kaladont | Nova reč")
            .setDescription(`> <:Holographic_owner_crown:1491847991261134979> | **${message.author.tag}** je rekao/la: **${word}**\n>  | Sledeća reč mora početi sa: **${game.lastTwo}**`)
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });
    }
};
