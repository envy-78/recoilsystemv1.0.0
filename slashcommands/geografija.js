const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const GEO_CHANNEL = "1491184340401393924"; //ovde stavljas kanal id valjda znas

const countries = fs.readFileSync(path.join(__dirname, "..", "assets", "geografija.txt"), "utf-8")
    .split(/\r?\n/)
    .map(c => c.trim())
    .filter(Boolean);

const countryMap = {
    "srbija": "Serbia",
    "crna gora": "Montenegro",
    "bosna i hercegovina": "Bosnia and Herzegovina",
    "severna makedonija": "North Macedonia",
    "slovenija": "Slovenia",
    "hrvatska": "Croatia",
    // dodaj po potrebi
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName("geografija")
        .setDescription("Pokreni geografsku igru"),

    async execute(interaction) {
        if (interaction.channel.id !== GEO_CHANNEL) {
            return interaction.reply({ content: "Komanda može samo u GEO kanalu.", ephemeral: true });
        }

        if (!global.geografija) {
            global.geografija = {
                active: false,
                currentAnswer: null,
                currentQuestion: null,
                scores: {}
            };
        }

        if (global.geografija.active) {
            return interaction.reply({ content: "Već postoji aktivna igra!", ephemeral: true });
        }

        await interaction.reply({ content: "Geografija igra je pokrenuta!" });
        sendNextQuestion(interaction.channel);
    },

    onMessage: async (message) => {
        if (message.channel.id !== GEO_CHANNEL || !global.geografija?.active || message.author.bot) return;

        const answer = message.content.toLowerCase().trim();

        if (answer === global.geografija.currentAnswer) {
        global.geografija.scores[message.author.id] = (global.geografija.scores[message.author.id] || 0) + 1;

            const embed = new EmbedBuilder()
                .setColor("#00FF00")
                .setTitle("<a:check_yes:1491835595285332039> Tačan odgovor!")
                .setDescription(`> <a:giveaway:1491850817492221952> ${message.author} je tačno odgovorio/la!\n> Poeni: ${global.geografija.scores[message.author.id]}`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

        } else {
        const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle("❌ Pogrešan odgovor!")
                .setDescription(`> 😢 ${message.author} je pogrešno odgovorio/la!\n> Tačan odgovor je: **${global.geografija.currentAnswer}**`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
        }

        global.geografija.active = false;
        setTimeout(() => sendNextQuestion(message.channel), 3000);
    }
};

async function sendNextQuestion(channel) {
    if (!countries.length) return;

    const randIndex = Math.floor(Math.random() * countries.length);
    const country = countries[randIndex];

    global.geografija.currentQuestion = "Koja je ovo lokacija?";
    global.geografija.currentAnswer = country.toLowerCase();
    global.geografija.active = true;

    let img = null;
    try {
    const apiName = countryMap[country.toLowerCase()] || country;
        const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(apiName)}`);
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.flags) {
            img = data[0].flags.png || data[0].flags.svg || null;
        }
    } catch (err) {
        console.error("Greška fetch-ovanja zastave:", err);
    }

    const embed = new EmbedBuilder()
        .setColor("#ad0fa0")
        .setTitle("❓ Geografija | Novo pitanje")
        .setDescription(`> 🌍 Pogodi o kojoj se lokaciji radi!\n> 💬 Odgovori u chat da osvojiš poen!`)
        .setImage(img || null)
        .setTimestamp();

    await channel.send({ embeds: [embed] });
}
