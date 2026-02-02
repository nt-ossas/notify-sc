require("dotenv").config()
const { Telegraf } = require("telegraf")
const express = require('express')

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

const app = express()

// ⭐ CORS - Risolve l'errore CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use(express.json())

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Bot online', timestamp: new Date() })
})

app.post('/webhook/assistenza', async (req, res) => {
  const { user, email, scuola, classe, problema } = req.body
  
  console.log('📥 Richiesta ricevuta:', { user, email, scuola, classe })
  
  try {
    await inviaNotifica(
      `🆘 Nuova richiesta di assistenza:\n\n` +
      `👤 Nome: ${user}\n\n` +
      `📧 Email: ${email}\n\n` +
      `🏫 Scuola: ${scuola} ${classe}\n\n` +
      `❓ Problema:\n\n${problema}`
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Errore:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})

// ⭐ Porta dinamica per Render
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`✅ Webhook server attivo su porta ${PORT}`))

bot.launch()
console.log("✅ Bot online...")

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
