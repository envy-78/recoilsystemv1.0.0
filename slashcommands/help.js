const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js")
const fs = require("fs")
const path = require("path")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Prikazuje sve komande"),

  async execute(interaction, client) {

    const slashCommands = loadCommands("slashcommands")

    const menu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("Odaberi kategoriju")
      .addOptions([

        { label: "Slash komande", value: "slash", emoji: "🟪" }
      ])

    const row = new ActionRowBuilder().addComponents(menu)

    const embed = new EmbedBuilder()
      .setColor(0xff870a)
      .setTitle("/bunt - Help Menu")
      .setDescription(
        `Ukupno komandi: **${slashCommands.length}**\n` +
        `Izaberite kategoriju ispod.`
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp()

    await interaction.reply({
      embeds: [embed],
      components: [row]
    })
  }
}

function loadCommands(folderName) {
  const folder = path.join(__dirname, "..", folderName)

  if (!fs.existsSync(folder)) return []

  const commands = []

  for (const file of fs.readdirSync(folder)) {
    if (!file.endsWith(".js")) continue

    const filePath = path.join(folder, file)
    const cmd = require(filePath)

    commands.push({
      name: cmd.name || cmd.data?.name || "nepoznato",
      description: cmd.description || cmd.data?.description || "Bez opisa"
    })
  }
  
  return commands
}