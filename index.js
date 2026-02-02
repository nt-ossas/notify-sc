require("dotenv").config()
const { Telegraf } = require("telegraf")
const express = require('express')
const axios = require('axios') // MANCAVA QUESTO!

const bot = new Telegraf(process.env.BOT_TOKEN)
const chat_id = process.env.CHAT_ID
const api_url = process.env.API_URL_DEFAULT

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

bot.command("list", async (ctx) => {
  if(ctx.chat.id != chat_id){
    ctx.reply("❌ Accesso non consentito, solo l'admin può usufruire di questo bot")
    return
  }

  // Mostra un messaggio di attesa
  await ctx.reply("⏳ Caricamento segnalazioni in corso...")

  //carica tutti i messaggi dal db altervista
  try {
    const response = await axios.post(api_url + "carica_msg.php");
    
    console.log("Messaggi caricati:", response.data)

    if (response.data.success) {
      // Passa ctx alla funzione per poter rispondere nella chat
      await mostraMessaggi(ctx, response.data.msgs)
    } else {
      await ctx.reply("❌ Errore dal server: " + response.data.error)
      console.error("Errore dal server:", response.data.error)
    }
    
  } catch (error){
    await ctx.reply("❌ Errore nel caricamento delle segnalazioni")
    console.error("Errore nel caricamento:", error)
  }
})

// MODIFICA: Aggiungi ctx come parametro
async function mostraMessaggi(ctx, messaggi) {
  try {
    let testoMessaggio = `*📋 SEGNALAZIONI RICEVUTE*\n\n`;
    let index = 0

    messaggi.forEach((msg) => {
      testoMessaggio += `*${index + 1}.* ${msg.testo}\n`;
      testoMessaggio += `👤 ${msg.autore} | 📅 ${msg.data}\n\n`;
    });
    
    testoMessaggio += `*Totale:* ${messaggi.length} segnalazioni`;
    
    // MODIFICA: Invia al ctx invece che a chat_id
    await ctx.reply(testoMessaggio, {
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
    
    console.log("✅ Messaggio inviato");
  } catch (error) {
    console.error("❌ Errore invio:", error);
    // MODIFICA: Rispondi nella chat in caso di errore
    await ctx.reply("❌ Errore nella visualizzazione dei messaggi");
  }
}

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
      `👤 Nome: ${username}\n` +
      `📧 Email: ${email}\n` +
      `🏫 Scuola: ${scuola} ${classe}\n` +
      `❓ Problema:\n${problema}`
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