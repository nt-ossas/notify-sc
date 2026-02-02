require("dotenv").config()
const { Telegraf } = require("telegraf")

const bot = new Telegraf(process.env.BOT_TOKEN)
const chat_id = process.env.CHAT_ID

async function inviaNotifica(messaggio) {
  try {
    await bot.telegram.sendMessage(chat_id, messaggio)
    console.log("✅ Messaggio inviato")
  } catch (error) {
    console.error("❌ Errore invio:", error)
  }
}

bot.command("start", async (ctx) => {
  if(ctx.chat.id != chat_id){
    ctx.reply("❌ Accesso non consentito, solo l'admin puo usufruire di questo bot")
    return
  }
  ctx.reply("Ciao! Sono il tuo bot di assistenza per Schoolsync, ti aiuterò a gestire le richieste di assistenza per la tua applicazione")
})

const express = require('express')
const app = express()
app.use(express.json())

app.post('/webhook/assistenza', async (req, res) => {
  const { user, email, scuola, classe, problema } = req.body
  
  await inviaNotifica(
    `🆘 Nuova richiesta di assistenza:\n\n` +
    `👤 Nome: ${user}\n\n` +
    `📧 Email: ${email}\n\n` +
    `-- Scuola: ${scuola} ` +
    `${classe}\n\n` +
    `❓ Problema:\n\n ${problema}`
  )
  
  res.json({ success: true })
})

//avvio
app.listen(3000, () => console.log("Webhook server attivo su porta 3000"))
bot.launch()
console.log("Bot online...")
