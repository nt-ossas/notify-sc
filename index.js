require("dotenv").config()
const { Telegraf } = require("telegraf")
const express = require('express')
const axios = require('axios')

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
  if (ctx.chat.id != chat_id) {
    ctx.reply("❌ Accesso non consentito, posso rispondere solo al mio padrone Ossas")
    return
  }
  ctx.reply("Ciao! Sono il tuo bot di assistenza per Schoolsync")
})

bot.command("completa", async (ctx) => {
  if (ctx.chat.id != chat_id) {
    ctx.reply("❌ Accesso non consentito, posso rispondere solo al mio padrone Ossas")
    return
  }
  //ctx.reply("Comando ancora da implementare")

  const args = ctx.message.text.split(' ')
  const id = args[1]
  
  if (!id) {
    await ctx.reply("❌ Specifica l'ID: /completa [numero]")
    return
  }

  try{
    const response = await axios.post(api_url + "elimina_msg.php", { id })

    if(response.data.success){
      await ctx.reply("Problema " + id + " completato")
    } else {
      await ctx.reply("❌ Errore dal server: " + response.data.error)
      console.error("Errore dal server:", response.data.error)
    }
  } catch (error) {
    await ctx.reply("❌ Errore nell'eliminazione delle segnalazioni")
    console.error("Errore nell'eliminazione:", error)
  }
})

bot.command("list", async (ctx) => {
  if (ctx.chat.id != chat_id) {
    ctx.reply("❌ Accesso non consentito, posso rispondere solo al mio padrone Ossas")
    return
  }

  await ctx.reply("⏳ Caricamento segnalazioni in corso...")

  try {
    const response = await axios.post(api_url + "carica_msg.php");

    console.log("Messaggi caricati:", response.data)

    if (response.data.success) {
      await mostraMessaggi(ctx, response.data.msgs)
    } else {
      await ctx.reply("❌ Errore dal server: " + response.data.error)
      console.error("Errore dal server:", response.data.error)
    }

  } catch (error) {
    await ctx.reply("❌ Errore nel caricamento delle segnalazioni")
    console.error("Errore nel caricamento:", error)
  }
})

async function mostraMessaggi(ctx, messaggi) {
  try {
    // Funzione per escape HTML
    function escapeHtml(text) {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    let testoMessaggio = `<b>📋 SEGNALAZIONI RICEVUTE</b>\n\n`;
    let index = 0

    messaggi.forEach((msg) => {
      const testoEscape = escapeHtml(msg.testo);
      const autoreEscape = escapeHtml(msg.autore);
      
      testoMessaggio += `<b>${++index}.</b> ${testoEscape}\n`;
      testoMessaggio += `👤 ${autoreEscape}\n 📅 ${msg.data}\n\n\n`;
    });

    testoMessaggio += `<b>Totale:</b> ${messaggi.length} segnalazioni`;

    await ctx.reply(testoMessaggio, {
      parse_mode: 'HTML', // Usa HTML invece di Markdown
      disable_web_page_preview: true
    });

    console.log("✅ Messaggio inviato");
  } catch (error) {
    console.error("❌ Errore invio:", error);
    await ctx.reply("❌ Errore nella visualizzazione dei messaggi");
  }
}

const app = express()

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

app.use(bot.webhookCallback('/telegram-webhook'))

app.get('/', (req, res) => {
  res.json({
    status: 'Bot online',
    timestamp: new Date(),
    webhook: 'https://notify-sc.onrender.com/telegram-webhook'
  })
})

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