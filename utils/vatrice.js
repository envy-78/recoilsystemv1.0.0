const fs = require("fs")
const { EmbedBuilder } = require("discord.js")

const dbFile = "./vatrice.json"
let vatriceDB = fs.existsSync(dbFile)
    ? JSON.parse(fs.readFileSync(dbFile, "utf-8"))
    : {}

function save() {
    fs.writeFileSync(dbFile, JSON.stringify(vatriceDB, null, 2))
}

async function enforceCorrectNick(member, amount) {
    const name = member.displayName
    const base = name.replace(/🔥\s*\d+/gi, "").trim()
    const newNick = `${base} 🔥 ${amount}`

    const numberInNick = name.match(/🔥\s*(\d+)/)
    const currentAmount = numberInNick ? parseInt(numberInNick[1]) : null

    if (currentAmount === amount) return

    try {
        await member.setNickname(".")
        await member.setNickname(newNick)
    } catch {}
}

async function updateVatrice(guild, userId, type, logChannelId) {
    const today = new Date().toISOString().slice(0, 10)

    if (!vatriceDB[userId])
        vatriceDB[userId] = { lastVatriceDay: null, lastActivityDay: null, vatrice: 0 }

    const u = vatriceDB[userId]

    let reset = false
    if (u.lastActivityDay && u.lastActivityDay !== today) {
        const diff = (new Date(today) - new Date(u.lastActivityDay)) / 86400000
        if (diff > 1) {
            u.vatrice = 0
            reset = true
        }
    }

    u.lastActivityDay = today

    const member = guild.members.cache.get(userId)

    if (reset) {
        u.lastVatriceDay = null
        save()
        if (member?.manageable) await enforceCorrectNick(member, 0)
        return
    }

    if (u.lastVatriceDay === today) {
        save()
        if (member?.manageable) await enforceCorrectNick(member, u.vatrice)
        return
    }

    u.lastVatriceDay = today
    u.vatrice++
    save()

    if (member?.manageable) await enforceCorrectNick(member, u.vatrice)

    const logChannel = guild.channels.cache.get(logChannelId)
    if (!logChannel) return

    const embed = new EmbedBuilder()
        .setColor("#ad0fa0")
        .setAuthor({ name: "bunt | Vatrice", iconURL: guild.iconURL({ dynamic: true }) })
        .setDescription(
            `> <:cry:1491842063594033283>  | **Korisnik:** <@${userId}>\n` +
            `> <:emoji_28:1491837148402421780> | **Dogadjaj:** **Dobio je 1 vatricu**\n` +
            `> <a:buntvatra:1491842417555410994> | **Ukupno vatrice:** **${u.vatrice}**`
        )
        .setThumbnail(`https://cdn.discordapp.com/attachments/1443312024582099025/1444764636904951879/Untitled_file.gif?ex=692e8e2b&is=692d3cab&hm=d01b67eb92bc8641c71971decaf955c0d2efb4cf6c9cc39200ffec662576ae75&`)
        .setTimestamp()

    logChannel.send({ embeds: [embed] })
}

module.exports = { updateVatrice, vatriceDB }