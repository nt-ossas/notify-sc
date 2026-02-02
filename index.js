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
    throw error
  }
}

bot.command("start", async (ctx) => {
  if(ctx.chat.id != chat_id){
    ctx.reply("❌ Accesso non consentito, solo l'admin può usufruire di questo bot")
    return
  }
  ctx.reply("Ciao! Sono il tuo bot di assistenza per Schoolsync")
})

const app = express()

//CORS per sicurezza
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

//express
app.use(express.json())

//telegram webhook endpoint
app.use(bot.webhookCallback('/telegram-webhook'))

app.get('/', (req, res) => {
  res.json({ 
    status: 'Bot online', 
    timestamp: new Date(),
    webhook: 'https://notify-sc.onrender.com/telegram-webhook'
  })
})

//quando arriva all'endpoint
app.post('/webhook/assistenza', async (req, res) => {
  const { username, email, scuola, classe, problema } = req.body
  
  console.log('Richiesta ricevuta:', { username, email, scuola, classe })
  
  try {
    await inviaNotifica(
      `🆘 Nuova richiesta di assistenza:\n\n` +
      `👤 Nome: ${username}\n\n` +
      `📧 Email: ${email}\n\n` +
      `🏫 Scuola: ${scuola} ${classe}\n\n` +
      `❓ Problema:\n\n${problema}`
    )
    
    res.json({ success: true })
  } catch (error) {
    console.error('❌ Errore:', error)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

const PORT = process.env.PORT || 10000

app.listen(PORT, () => {
  console.log(`Server attivo su porta ${PORT}`)
})