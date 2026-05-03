const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require("discord.js");

const ALLOWED_COMMAND_CHANNEL = "1491184344138645604"; // kanal gde se komanda može koristiti

module.exports = {
    data: new SlashCommandBuilder()
        .setName("postavi")
        .setDescription("Postavi kanal za brojanje")
        .addChannelOption(opt =>
            opt.setName("kanal")
                .setDescription("Izaberi kanal gde će brojanje ići")
                .setRequired(true)
        ),

    async execute(interaction) {
        
        if (interaction.channel.id !== ALLOWED_COMMAND_CHANNEL) {
            return interaction.reply({ content: "<a:no:1491835785945809107>  Komanda može da se koristi samo u specijalnom kanalu.", ephemeral: true });
        }

        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "<a:no:1491835785945809107> Moraš biti administrator da postaviš kanal za brojanje.", ephemeral: true });
        }

        const channel = interaction.options.getChannel("kanal");

        global.brojanjeChannel = channel.id;
        global.brojanje = {
            current: 0,
            lastUserId: null,
            active: true
        };

        const embed = new EmbedBuilder()
            .setColor("#ad0fa0")
            .setTitle("🟢 Brojanje | Kanal postavljen")
            .setDescription(`> <a:check_yes:1491835595285332039> | Brojanje je sada postavljeno u kanal: ${channel}\n>  | Sledeći broj treba biti **1**.`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    onMessage: async (message) => {
        if (!message.guild || message.author.bot) return;
        if (!global.brojanjeChannel) return;
        if (message.channel.id !== global.brojanjeChannel) return;

        const num = parseInt(message.content);
        if (isNaN(num)) return;

        if (!global.brojanje || !global.brojanje.active) {
            // Ako brojanje nije aktivno, resetuje se
            global.brojanje = {
                current: 0,
                lastUserId: null,
                active: true
            };
        }

        if (message.author.id === global.brojanje.lastUserId) {
            global.brojanje.current = 0;
            global.brojanje.lastUserId = null;

            const embed = new EmbedBuilder()
                .setColor("#f50505")
                .setTitle("<a:no:1491835785945809107> Brojanje prekinuto")
                .setDescription(`> <a:no:1491835785945809107> | ${message.author.tag} je pokušao/la brojati dva puta zaredom.\n>  | Počnite brojanje ispocetka od 1.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            return;
        }

        if (num !== global.brojanje.current + 1) {
            global.brojanje.current = 0;
            global.brojanje.lastUserId = null;

            const embed = new EmbedBuilder()
                .setColor("#f50505")
                .setTitle("<a:no:1491835785945809107> Brojanje prekinuto")
                .setDescription(`> <a:no:1491835785945809107> | ${message.author.tag} je napisao/la **${num}**, ali sledeći broj je trebao biti **${global.brojanje.current + 1}**.\n>  | Počnite brojanje ispocetka od 1.`)
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });
            return;
        }

        global.brojanje.current = num;
        global.brojanje.lastUserId = message.author.id;

        try {
            await message.react("<a:check_yes:1491835595285332039>");
        } catch (err) {
            console.error("Greška pri dodavanju reakcije:", err);
        }
    }
};
