// ═══════════════════════════════════════════════════════════
//  KIRA TECH BOT 🌹  v2 — Telegram + WhatsApp (Baileys)
//  Auteur : Mr Kira Tech
// ═══════════════════════════════════════════════════════════
import fs from 'fs'
import path from 'path'
import express from 'express'
import pino from 'pino'
import TelegramBot from 'node-telegram-bot-api'
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  Browsers
} from '@whiskeysockets/baileys'

// ═════════════ CONFIG ═════════════
const TOKEN = process.env.TELEGRAM_TOKEN // ⚠️ Render > Environment
if (!TOKEN) {
  console.error('❌ Variable TELEGRAM_TOKEN manquante')
  process.exit(1)
}
const PORT = process.env.PORT || 3000
const SELF_URL = process.env.RENDER_EXTERNAL_URL || ''
const REPO_URL = process.env.REPO_URL || 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X'

const SIGN = '> power by Mr Kira tech 🌐'
const IMG = {
  TG: 'https://i.ibb.co/wN35ZdRS/9-D288-DC7-3-E3-F-49-E4-BFAB-8-C59-D2-F53-FAD.jpg',
  WA: 'https://i.ibb.co/jPVknpDD/D2820665-C0-E7-4259-889-E-EB0-C902-BFEB6.png',
  OTHER: 'https://i.ibb.co/fVx9TFpv/5-A210-D08-145-E-43-C7-8-EB4-C60-FF6490-A39.jpg',
  BYE: 'https://i.ibb.co/zHh1D54R/F7-BBBCA2-F6-A7-4912-82-C3-880-E93696-F60.jpg',
  WELCOME: 'https://i.ibb.co/XZgPz7pL/FD93-B97-B-4460-4003-A52-C-661-FBAF4-E73-F.jpg'
}
const LINKS = {
  tgChannel: 'https://t.me/+mQ3aQpCsEqI0YmY0',
  tgGroup: 'https://t.me/+2JDC_Be4_ww1N2Vk',
  waChannel: 'https://whatsapp.com/channel/0029Vb7WJzp84OmBD0fEEJ2X',
  waGroup: 'https://chat.whatsapp.com/IP0nFB79rMDF0nvFSMXtDR?s=cl&p=i&mlu=0&ilr=4',
  bot: 'https://t.me/Kira_tech_bot'
}
const CHANNEL_INVITE = `Voici une invitation à suivre la chaîne ⫸ »͜͡𝐌𝐫 KIRA_TECH ⫷ sur WhatsApp : ${LINKS.waChannel}`

// ═════════════ PERSISTANCE ═════════════
const DATA_DIR = 'data'
const AUTH_DIR = 'auth'
fs.mkdirSync(DATA_DIR, { recursive: true })
fs.mkdirSync(AUTH_DIR, { recursive: true })
const DB_FILE = path.join(DATA_DIR, 'db.json')
let db = { users: [], verified: [], connected: [], groups: {}, settings: {}, kira: {}, activity: {}, stats: {} }
try { db = { ...db, ...JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) } } catch {}
let saveTimer = null
const saveDb = () => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(db)) } catch (e) { console.error('saveDb:', e.message) }
  }, 500)
}

// ═════════════ UTILS ═════════════
const logger = pino({ level: 'silent' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pad = (n) => String(n).padStart(2, '0')
const nowStr = () => {
  const d = new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())} / ${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`
}
const today = () => new Date().toISOString().slice(0, 10)
const rand = (a) => a[Math.floor(Math.random() * a.length)]
const jidNum = (j = '') => String(j).split('@')[0].split(':')[0]
const fmtCode = (c) => c?.match(/.{1,4}/g)?.join('-') ?? c
const bar = (p, n = 10) => '▰'.repeat(Math.round(p * n)) + '▱'.repeat(n - Math.round(p * n))
const maskNum = (n) => (n.length > 7 ? n.slice(0, 5) + '•••••' + n.slice(-2) : n)

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'user-agent': 'Mozilla/5.0 KiraTechBot' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return r.json()
}
async function getBuffer(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'user-agent': 'Mozilla/5.0 KiraTechBot' } })
  if (!r.ok) throw new Error('HTTP ' + r.status)
  return Buffer.from(await r.arrayBuffer())
}

// ═════════════ TEXTES TELEGRAM (exacts) ═════════════
const MSG = {
  start: `═══════════════════════════════════════════
   ✦  WELCOME IN BOT TELEGRAM ✦
═══════════════════════════════════════════

🤖 NAME       : BOT kIRA TECH 🌐 
👑  CREATOR   : MR KIRA TECH ✨

───────────────────────────────────────────
  DESCRIPTION
───────────────────────────────────────────
THE BEST FOR CONNECT A ACCOUNT
───────────────────────────────────────────
Tape /menu pour voir le menu 
───────────────────────────────────────────`,

  help: `✨━━━━━━━━━━━━━━━━━━━━✨
🤖 MERCI D'UTILISER LE BOT PAIRING DE MR KIRA TECH 🤖
✨━━━━━━━━━━━━━━━━━━━━✨

➤ ÉTAPE 1 : Tapez ➜ /pair 242…
📲 suivi du numéro à connecter à WhatsApp

➤ ÉTAPE 2 : Une fois connecté ✅
📜 tapez ➜ .menu

✨━━━━━━━━━━━━━━━━━━━━✨
🔥 Profitez bien ! 🔥
✨━━━━━━━━━━━━━━━━━━━━✨`,

  menu: `✨━━━━━━━━━━━━━━━━━━━━✨
🌐 KIRA TECH BOT 🌐
⚜️ Auteur : Mr Kira Tech ⚜️
✨━━━━━━━━━━━━━━━━━━━━✨

╔══════════════════════════╗
📜 COMMANDES TÉLÉGRAM
╚══════════════════════════╝

▶️ /start ➜ Démarrer le bot
📋 /menu ➜ Afficher le menu
❓ /help ➜ Aide
🔗 /pair ➜ Lancer un appairage
📲 /link ➜ Obtenir le lien
📩 /contact ➜ Nous contacter
📊 /user ➜ Nombre d'utilisateurs

━━━━━━━━━━━━━━━━━━━━
⚡ DÉMARRAGE RAPIDE
━━━━━━━━━━━━━━━━━━━━

1️⃣ Tapez ➜ /pair
2️⃣ Envoyez le numéro à connecter à WhatsApp
3️⃣ Une fois connecté ✅ tapez ➜ .menu

━━━━━━━━━━━━━━━━━━━━
🙏 Merci d'utiliser Bot kira tech 🌐
🔥 Bon appairage ! 🔥
━━━━━━━━━━━━━━━━━━━━`,

  badNumber: `⚠️❌ ERREUR : NUMÉRO ERRONÉ ❌⚠️
━━━━━━━━━━━━━━━━━━━━━━
🚫 Le numéro que tu as tapé est invalide.
📲 Format correct : 242XXXXXXXX
⛔ Sans le (+) devant.
✅ Exemple : 242XXXXXXXX

🔁 Réessaie en tapant :
➜ /pair 242XXXXXXXX

━━━━━━━━━━━━━━━━━━━━━━`,

  pairing: (n) => `📡 Demande en cours pour ${n}… 🔄`,

  code: (n, code) => `✨━━━━━━━━━━━━━━━━━━━━✨
📲 PAIRING CODE pour ${n} ☑️
✨━━━━━━━━━━━━━━━━━━━━✨

╔══════════════════════════╗
🔑 CODE DE JUMELAGE :
╚══════════════════════════╝

    ┌───────────────┐  
    │  ${code}    │  
    └───────────────┘  

━━━━━━━━━━━━━━━━━━━━━━
👉 INSTRUCTIONS :
━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Ouvrez WhatsApp sur votre téléphone 📱
2️⃣ Allez dans « Appareils liés » 🔗 ➜ « Lier un appareil » ➕
3️⃣ Entrez ce code pour associer ce bot 🤖

━━━━━━━━━━━━━━━━━━━━━━
✅ Une fois connecté, tapez .menu pour continuer 📜
━━━━━━━━━━━━━━━━━━━━━

${SIGN}`,

  congratsTg: () => `✨━━━━━━━━━━━━━━━━━━━━✨
🎊🎉 CONGRATULATIONS ! 🎉🎊
✨━━━━━━━━━━━━━━━━━━━━✨

╔══════════════════════════╗
✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${nowStr()}
⚜️ BY ➜ Mr Kira Tech ⚜️
╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━
📌 NB :
➜ Tapez .menu sur whatsapp 📲
━━━━━━━━━━━━━━━━━━━━━━

🔥✨ Profitez bien de votre bot ! ✨🔥
🎯 Merci à Mr kira tech 🌐🚫`,

  congratsWa: () => `╔══════════════════════════╗
✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${nowStr()}
⚜️ BY ➜ Mr Kira Tech ⚜️
╚═══════════════ Tape .menu ═══════╝`,

  user: () => `✨━━━━━━━━━━━━━━━━━━━━✨
🌐 KiRA BOT TECH 🌐
⚜️ By Mr Kira Tech ⚜️
✨━━━━━━━━━━━━━━━━━━━━✨

╔══════════════════════════╗
👥 Nombre d'utilisateurs :
( ${db.users.length} ) 🚹🚺
╚══════════════════════════╝

━━━━━━━━━━━━━━━━━━━━`
}

const NUM_EMOJI = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
function testimonials(page = 0) {
  const per = 10
  const total = db.connected.length
  const slice = db.connected.slice(page * per, page * per + per)
  const lines = NUM_EMOJI.map((e, i) => `${e} ${slice[i] ? maskNum(slice[i]) : '…'}`).join('\n')
  return {
    hasMore: (page + 1) * per < total,
    text: `✨━━━━━━━━━━━━━━━━━━━━✨
📢 TÉMOIGNAGES 📢
👥 Nombre de personnes déjà connectées : ( ${total} )
✨━━━━━━━━━━━━━━━━━━━━✨

╔══════════════════════════╗
📞 NUMÉROS CONNECTÉS
╚══════════════════════════╝

${lines}

━━━━━━━━━━━━━━━━━━━━━━
[ ➡️ SUITE ]
Clique sur le bouton pour continuer la liste…
━━━━━━━━━━━━━━━━━━━━━━`
  }
}

// ═════════════ TELEGRAM ═════════════
const bot = new TelegramBot(TOKEN, { polling: true })
const pendingPair = new Set()
const lastPair = new Map()
const sessions = new Map() // déclaré tôt pour les handlers

bot.setMyCommands([
  { command: 'start', description: '▶️ Démarrer le bot' },
  { command: 'menu', description: '📋 Afficher le menu' },
  { command: 'help', description: '❓ Aide' },
  { command: 'pair', description: '🔗 Lancer un appairage' },
  { command: 'link', description: '📲 Obtenir les liens' },
  { command: 'contact', description: '📩 Nous contacter' },
  { command: 'user', description: '📊 Nombre d\'utilisateurs' }
]).catch(() => {})

// ----- Animations Telegram -----
const typing = (chatId, a = 'typing') => bot.sendChatAction(chatId, a).catch(() => {})
const EMO_A = ['📢', '🔔', '📣', '🔊']
const EMO_B = ['👥', '🫂', '🤝', '👨‍👩‍👧‍👦']

async function animateKeyboard(chatId, messageId, frames, delay = 1100) {
  for (const kb of frames) {
    await sleep(delay)
    try {
      await bot.editMessageReplyMarkup({ inline_keyboard: kb }, { chat_id: chatId, message_id: messageId })
    } catch (e) {
      if (!/not modified/i.test(e.message)) return
    }
  }
}
async function editMsg(chatId, messageId, text, isCaption = false, markup) {
  try {
    const o = { chat_id: chatId, message_id: messageId }
    if (markup) o.reply_markup = markup
    if (isCaption) await bot.editMessageCaption(text, o)
    else await bot.editMessageText(text, o)
  } catch {}
}
async function photoLoader(chatId, img, title, steps = 4, delay = 400) {
  const m = await bot.sendPhoto(chatId, img, { caption: `${title}\n${bar(0)} 0%` }).catch(() => null)
  if (!m) return null
  for (let i = 1; i <= steps; i++) {
    await sleep(delay)
    await editMsg(chatId, m.message_id, `${title}\n${bar(i / steps)} ${Math.round((i / steps) * 100)}%`, true)
  }
  return m
}

async function sendImg(chatId, img, text, opts = {}) {
  try {
    if (text.length <= 1024) return await bot.sendPhoto(chatId, img, { caption: text, ...opts })
    await bot.sendPhoto(chatId, img)
    return await bot.sendMessage(chatId, text, opts)
  } catch (e) {
    console.error('sendImg:', e.message)
    return bot.sendMessage(chatId, text, opts).catch(() => null)
  }
}

// ----- Claviers -----
const kbLinks = (i = 0) => {
  const rows = [
    [
      { text: `${EMO_A[i % 4]} Suivre la chaîne TG`, url: LINKS.tgChannel },
      { text: `${EMO_B[i % 4]} Groupe TG`, url: LINKS.tgGroup }
    ],
    [
      { text: `${EMO_A[(i + 1) % 4]} Chaîne WhatsApp`, url: LINKS.waChannel },
      { text: `${EMO_B[(i + 1) % 4]} Groupe WhatsApp`, url: LINKS.waGroup }
    ]
  ]
  return rows
}
const kbCode = (code, i = 0, copyMode = true) => {
  const copyLbl = ['📄 Copier', '📋 Copier', '✨ Copier', '📄 Copier'][i % 4]
  const chkLbl = ['⛔ Check', '🔎 Check', '📊 Check', '⛔ Check'][i % 4]
  return [[
    copyMode ? { text: copyLbl, copy_text: { text: code } } : { text: copyLbl, callback_data: 'copy_' + code },
    { text: chkLbl, callback_data: 'check' }
  ]]
}

// ----- Utilisateurs -----
function registerUser(id) {
  if (!db.users.includes(id)) { db.users.push(id); saveDb() }
}
async function guard(msg) {
  registerUser(msg.from.id)
  return true
}

// ----- Commandes Telegram -----
bot.onText(/^\/start(?:@\w+)?(?:\s.*)?$/, async (msg) => {
  registerUser(msg.from.id)
  const chatId = msg.chat.id
  await typing(chatId, 'upload_photo')
  const m = await photoLoader(chatId, IMG.TG, '🌹 KIRA TECH BOT — Démarrage…', 4, 350)
  let id = m?.message_id
  if (id) {
    await sleep(300)
    await editMsg(chatId, id, MSG.start, true, { inline_keyboard: kbLinks(0) })
  } else {
    id = (await sendImg(chatId, IMG.TG, MSG.start, { reply_markup: { inline_keyboard: kbLinks(0) } }))?.message_id
  }
  if (id) animateKeyboard(chatId, id, [1, 2, 3, 0, 1, 2, 3, 0].map((i) => kbLinks(i)))
})

bot.onText(/^\/help(?:@\w+)?$/, async (msg) => {
  if (!(await guard(msg))) return
  await typing(msg.chat.id)
  await sendImg(msg.chat.id, IMG.OTHER, MSG.help)
})

bot.onText(/^\/menu(?:@\w+)?$/, async (msg) => {
  if (!(await guard(msg))) return
  const chatId = msg.chat.id
  await typing(chatId, 'upload_photo')
  const m = await photoLoader(chatId, IMG.OTHER, '📜 Chargement du menu…', 4, 400)
  if (!m) return sendImg(chatId, IMG.OTHER, MSG.menu)
  await sleep(300)
  try {
    await bot.editMessageCaption(MSG.menu, { chat_id: chatId, message_id: m.message_id })
  } catch {
    await editMsg(chatId, m.message_id, '🌐 KIRA TECH BOT 🌐\n⚜️ Auteur : Mr Kira Tech ⚜️', true)
    await bot.sendMessage(chatId, MSG.menu).catch(() => {})
  }
})

bot.onText(/^\/link(?:@\w+)?$/, async (msg) => {
  if (!(await guard(msg))) return
  await typing(msg.chat.id)
  const sent = await sendImg(msg.chat.id, IMG.OTHER, '🔗 Nos liens officiels 👇', { reply_markup: { inline_keyboard: kbLinks(0) } })
  if (sent?.message_id) animateKeyboard(msg.chat.id, sent.message_id, [1, 2, 3, 0].map((i) => kbLinks(i)))
})

bot.onText(/^\/contact(?:@\w+)?$/, async (msg) => {
  if (!(await guard(msg))) return
  await typing(msg.chat.id)
  const lbl = ['📩 Nous contacter', '✉️ Nous contacter', '💬 Nous contacter', '📩 Nous contacter']
  const mk = (i) => ({ inline_keyboard: [[{ text: lbl[i % 4], url: LINKS.tgGroup }]] })
  const sent = await sendImg(msg.chat.id, IMG.OTHER, '📩 DEMANDE D\'AIDE\n\nBesoin d\'aide ? Un admin est là pour toi.\nClique sur le bouton ci-dessous 👇', { reply_markup: mk(0) })
  if (sent?.message_id) animateKeyboard(msg.chat.id, sent.message_id, [1, 2, 3].map((i) => mk(i).inline_keyboard))
})

bot.onText(/^\/users?(?:@\w+)?$/, async (msg) => {
  if (!(await guard(msg))) return
  const kb = (i) => [
    [{ text: `${['▶️', '⏩', '🚀', '▶️'][i % 4]} Commencer à utiliser`, callback_data: 'start' }],
    [{ text: `${['📢', '🗣️', '💬', '📢'][i % 4]} Témoignages`, callback_data: 'testi_0' }]
  ]
  await typing(msg.chat.id)
  const sent = await sendImg(msg.chat.id, IMG.TG, MSG.user(), { reply_markup: { inline_keyboard: kb(0) } })
  if (sent?.message_id) animateKeyboard(msg.chat.id, sent.message_id, [1, 2, 3].map(kb))
})

bot.onText(/^\/pair(?:@\w+)?(?:\s+(.+))?$/, async (msg, match) => {
  if (!(await guard(msg))) return
  const arg = match?.[1]
  if (!arg) {
    pendingPair.add(msg.from.id)
    return sendImg(msg.chat.id, IMG.OTHER, '📲 Envoie maintenant le numéro à connecter à WhatsApp\n✅ Exemple : 242XXXXXXXX (sans le +)')
  }
  return handlePair(msg, arg)
})

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/') || !msg.from) return
  if (pendingPair.has(msg.from.id)) {
    pendingPair.delete(msg.from.id)
    if (!(await guard(msg))) return
    handlePair(msg, msg.text)
  }
})

bot.on('callback_query', async (q) => {
  const chatId = q.message?.chat.id
  const data = q.data || ''
  try {
    if (data === 'start') {
      await bot.answerCallbackQuery(q.id, { text: '▶️ Tape /start' })
      sendImg(chatId, IMG.TG, '▶️ Tape /start pour commencer.')
    } else if (data === 'check') {
      await bot.answerCallbackQuery(q.id, { text: `⛔ Numéros déjà connectés : ${db.connected.length}`, show_alert: true })
    } else if (data.startsWith('copy_')) {
      await bot.answerCallbackQuery(q.id, { text: '📄 Code envoyé, appuie dessus pour le copier' })
      sendImg(chatId, IMG.TG, `<code>${data.slice(5)}</code>`, { parse_mode: 'HTML' })
    } else if (data.startsWith('testi_') || data.startsWith('testp_')) {
      await bot.answerCallbackQuery(q.id)
      const page = parseInt(data.split('_')[1], 10) || 0
      const t = testimonials(page)
      const nav = []
      if (page > 0) nav.push({ text: '⬅️ Retour', callback_data: `testp_${page - 1}` })
      if (t.hasMore) nav.push({ text: '➡️ Suite', callback_data: `testp_${page + 1}` })
      const markup = { inline_keyboard: nav.length ? [nav] : [] }
      if (data.startsWith('testp_') && q.message.photo) await editMsg(chatId, q.message.message_id, t.text, true, markup)
      else await sendImg(chatId, IMG.TG, t.text, { reply_markup: markup })
    } else {
      await bot.answerCallbackQuery(q.id)
    }
  } catch (e) {
    console.error('callback:', e.message)
  }
})
bot.on('polling_error', (e) => console.error('polling_error:', e.message))

async function handlePair(msg, raw) {
  const chatId = msg.chat.id
  const number = raw.replace(/[\s\-()]/g, '')
  if (!/^\d{8,15}$/.test(number)) return sendImg(chatId, IMG.OTHER, MSG.badNumber)
  const s = sessions.get(number)
  if (s?.sock?.authState?.creds?.registered) {
    return sendImg(chatId, IMG.TG, `✅ Le numéro ${number} est déjà connecté.\nTape .menu sur WhatsApp 📲`)
  }
  const wait = (lastPair.get(msg.from.id) || 0) + 20000 - Date.now()
  if (wait > 0) return sendImg(chatId, IMG.OTHER, `⏳ Patiente ${Math.ceil(wait / 1000)}s avant une nouvelle demande.`)
  lastPair.set(msg.from.id, Date.now())

  await typing(chatId)
  const m = await bot.sendPhoto(chatId, IMG.TG, { caption: MSG.pairing(number) })
  let stop = false
  const spin = ['🔄', '⏳', '📡', '🔁']
  const anim = (async () => {
    let i = 0
    while (!stop && i < 25) {
      await sleep(900)
      if (stop) break
      i++
      await editMsg(chatId, m.message_id, `📡 Demande en cours pour ${number}… ${spin[i % 4]}\n${bar(Math.min(0.9, i / 10))} ${Math.min(90, i * 9)}%`, true)
    }
  })()

  try {
    let code
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        code = await createSession(number, { tgChatId: chatId, wantCode: true })
        if (code) break
      } catch (e) {
        console.error('pair attempt', attempt, e.message)
        await killSession(number, false)
        await sleep(1500)
      }
    }
    stop = true
    await anim
    if (!code) throw new Error('no code')
    await editMsg(chatId, m.message_id, `✅ Code généré pour ${number}\n${bar(1)} 100%`, true)
    await sleep(500)
    bot.deleteMessage(chatId, m.message_id).catch(() => {})

    await typing(chatId, 'upload_photo')
    let copyMode = true
    let sent
    try {
      sent = await bot.sendPhoto(chatId, IMG.TG, { caption: MSG.code(number, code), reply_markup: { inline_keyboard: kbCode(code, 0, true) } })
    } catch (e) {
      copyMode = false
      sent = await sendImg(chatId, IMG.TG, MSG.code(number, code), { reply_markup: { inline_keyboard: kbCode(code, 0, false) } })
    }
    if (sent?.message_id) animateKeyboard(chatId, sent.message_id, [1, 2, 3, 0, 1, 2, 3, 0].map((i) => kbCode(code, i, copyMode)), 1100)
  } catch (e) {
    stop = true
    console.error('pair:', e.message)
    editMsg(chatId, m.message_id, `❌ Impossible de générer le code pour ${number} pour le moment.\n🔁 Réessaie avec /pair ${number}`, true)
  }
}

async function congratsTelegram(chatId) {
  await typing(chatId, 'upload_photo')
  const frames = ['🔗 CONNEXION EN COURS…\n▰▰▰▱▱▱▱▱▱▱ 30%', '🔗 CONNEXION EN COURS…\n▰▰▰▰▰▰▱▱▱▱ 60%', '🎉 CONNEXION RÉUSSIE ✨\n▰▰▰▰▰▰▰▰▰▰ 100%', '🎊🎉🎊🎉🎊🎉🎊🎉🎊🎉']
  let sent
  try { sent = await bot.sendPhoto(chatId, IMG.TG, { caption: frames[0] }) } catch { return sendImg(chatId, IMG.TG, MSG.congratsTg()) }
  for (let i = 1; i < frames.length; i++) {
    await sleep(700)
    await editMsg(chatId, sent.message_id, frames[i], true)
  }
  await sleep(700)
  await editMsg(chatId, sent.message_id, MSG.congratsTg(), true)
}

// ═════════════ WHATSAPP : SESSIONS ═════════════
async function killSession(number, removeAuth = true) {
  const s = sessions.get(number)
  if (s) {
    clearTimeout(s.expireTimer)
    s.dead = true
    try { s.sock.ev.removeAllListeners('connection.update') } catch {}
    try { s.sock.ws?.close() } catch {}
    sessions.delete(number)
  }
  if (removeAuth) fs.rmSync(path.join(AUTH_DIR, number), { recursive: true, force: true })
}

async function createSession(number, { tgChatId = null, wantCode = false } = {}) {
  const dir = path.join(AUTH_DIR, number)
  const { state, saveCreds } = await useMultiFileAuthState(dir)
  const { version } = await fetchLatestBaileysVersion().catch(() => ({}))
  const prev = sessions.get(number)
  if (prev) {
    prev.dead = true
    clearTimeout(prev.expireTimer)
    try { prev.sock.ev.removeAllListeners('connection.update'); prev.sock.ev.removeAllListeners('messages.upsert') } catch {}
    try { prev.sock.ws?.close() } catch {}
  }

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
        browser: Browsers.ubuntu('Chrome'),
    markOnlineOnConnect: false,
    syncFullHistory: false
  })
  const session = {
    sock,
    number,
    tgChatId: tgChatId ?? prev?.tgChatId ?? null,
    pairing: wantCode || prev?.pairing || false,
    cmdCount: prev?.cmdCount || 0,
    retries: prev?.retries || 0,
    lastCmd: prev?.lastCmd || {},
    expireTimer: null,
    dead: false
  }
  sessions.set(number, session)
  sock.ev.on('creds.update', saveCreds)

  if (session.pairing && !state.creds.registered) {
    session.expireTimer = setTimeout(async () => {
      if (!sock.authState.creds.registered && !session.dead) {
        const chat = session.tgChatId
        await killSession(number, true)
        if (chat) sendImg(chat, IMG.OTHER, `⌛ Le code pour ${number} a expiré.\n🔁 Relance avec /pair ${number}`)
      }
    }, 3 * 60 * 1000)
  }

  sock.ev.on('connection.update', async (u) => {
    if (session.dead) return
    const { connection, lastDisconnect } = u
    if (connection === 'open') {
      session.retries = 0
      console.log(`✅ ${number} connecté`)
      if (!db.connected.includes(number)) { db.connected.push(number); saveDb() }
      if (session.pairing) {
        session.pairing = false
        clearTimeout(session.expireTimer)
        if (session.tgChatId) congratsTelegram(session.tgChatId)
        const self = sock.user.id.replace(/:\d+@/, '@')
        try {
          const tmp = await waAnim(sock, self, null, ['🔗 Connexion…\n▰▰▱▱▱▱▱▱▱▱', '🔗 Connexion…\n▰▰▰▰▰▰▱▱▱▱'], '✅ Connecté !\n▰▰▰▰▰▰▰▰▰▰', 600)
          await sleep(500)
          await sock.sendMessage(self, { delete: tmp.key }).catch(() => {})
          await waSay(sock, self, MSG.congratsWa(), { img: IMG.WA })
        } catch (e) { console.error('congrats wa:', e.message) }
      }
    }
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode
      const registered = sock.authState.creds.registered
      if (status === DisconnectReason.loggedOut) {
        console.log(`🚪 ${number} déconnecté`)
        db.connected = db.connected.filter((n) => n !== number)
        saveDb()
        await killSession(number, true)
      } else if (status === DisconnectReason.connectionReplaced) {
        await killSession(number, false)
      } else if (!registered && status !== DisconnectReason.restartRequired) {
        await killSession(number, true)
      } else {
        session.retries++
        await sleep(Math.min(2000 * session.retries, 30000))
        if (!session.dead) createSession(number, { tgChatId: session.tgChatId }).catch((e) => console.error('reconnect:', e.message))
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const m of messages) {
      try {
        if (m.message && m.key.id) storeMsg(m)
        if (type !== 'notify') continue
        await onWaMessage(session, m)
      } catch (e) { console.error('wa msg:', e.message) }
    }
  })
  sock.ev.on('group-participants.update', (ev) => onGroupParticipants(sock, ev).catch((e) => console.error('group evt:', e.message)))

  if (wantCode && !state.creds.registered) {
    return await new Promise((resolve, reject) => {
      let done = false
      const go = async () => {
        if (done) return
        done = true
        try { resolve(fmtCode(await sock.requestPairingCode(number))) } catch (e) { reject(e) }
      }
      sock.ev.on('connection.update', (u) => { if (u.qr) go() })
      setTimeout(go, 5000)
    })
  }
  return null
}

// ═════════════ WHATSAPP : CACHE & ANIMATIONS ═════════════
const msgStore = new Map()
const groupMsgs = new Map()
function storeMsg(m) {
  msgStore.set(m.key.id, m)
  if (msgStore.size > 3000) msgStore.delete(msgStore.keys().next().value)
  const jid = m.key.remoteJid
  if (jid?.endsWith('@g.us')) {
    const arr = groupMsgs.get(jid) || []
    arr.push(m.key)
    if (arr.length > 60) arr.shift()
    groupMsgs.set(jid, arr)
  }
}
async function waAnim(sock, jid, quoted, frames, final, delay = 500) {
  const sent = await sock.sendMessage(jid, { text: frames[0] }, quoted ? { quoted } : {})
  for (let i = 1; i < frames.length; i++) {
    await sleep(delay)
    await sock.sendMessage(jid, { text: frames[i], edit: sent.key }).catch(() => {})
  }
  await sleep(delay)
  await sock.sendMessage(jid, { text: final, edit: sent.key }).catch(() => sock.sendMessage(jid, { text: final }))
  return sent
}
const imgCache = new Map()
async function imgBuf(url) {
  if (imgCache.has(url)) return imgCache.get(url)
  try {
    const b = await getBuffer(url)
    imgCache.set(url, b)
    return b
  } catch { return { url } }
}
// Envoie TOUJOURS une image avec le texte en légende (texte long : image puis texte)
async function waSay(sock, jid, text, { img = IMG.OTHER, quoted, mentions } = {}) {
  const opts = quoted ? { quoted } : {}
  const mn = mentions ? { mentions } : {}
  try {
    const image = await imgBuf(img)
    if (text.length <= 1000) return await sock.sendMessage(jid, { image, caption: text, ...mn }, opts)
    await sock.sendMessage(jid, { image }, opts)
    return await sock.sendMessage(jid, { text, ...mn }, opts)
  } catch (e) {
    console.error('waSay:', e.message)
    return sock.sendMessage(jid, { text, ...mn }, opts).catch(() => null)
  }
}
const getSettings = (number) =>
  (db.settings[number] = { prefix: '.', name: 'KIRA TECH B0T🌹', antidelete: false, image: null, ...(db.settings[number] || {}) })

// ═════════════ WHATSAPP : MENU ═════════════
const CMD_LIST = {
  GROUP: ['add 👤', 'antilink ⚠️', 'antispam 🚫', 'antitag 🏷', 'goodbye 🫂', 'del', 'ppgroup 🌆', 'groupinfo 🎤', 'groupname 🗂', 'kick 🚫', 'link 🔗', 'listadmin 🧾', 'mute🥂', 'promote💎', 'purge 🪬', 'resetlink ⛔️', 'revoke 🛡', 'setgdesc🍎', 'staff 😎', 'tag 🏷', 'tagall 🌐', 'unmute🤦‍♂️', 'welcome 🗞', 'signale📵'],
  FUN: ['blague 🃏', 'character🍥', 'compliment🦋', 'gif 🎁', 'goodnight💤', 'meme 🤣', 'news 🗞', 'stupid 🧨'],
  GENERAL: ['alive🛎', 'antidelete🧨', 'channelid🔑', 'gpstatus🛁', 'menu🛒', 'owner🚪', 'pair🪄', 'ping🎁', 'repo📊', 'voice 📯'],
  AI: ['kirabot🤖', 'imagine😇', 'manga 📰'],
  TOOLS: ['photo 🚹', 'sticker 🚼', 'url⚜️', 'boucle / .ban📵'],
  SYSTEM: ['botprefix⁉️', 'botimage🛅', 'botname🔱', 'status✅', 'speed❤️‍🩹', 'creator❤️‍🔥']
}
const TOTAL_CMDS = Object.values(CMD_LIST).reduce((a, l) => a + l.length, 0) + 1 // .boucle + .ban

function waMenu(st) {
  const block = (t, l) => `╢ ${t} ♰\n╭▰▰▰▰▰▰▰◈\n${l.map((c) => `┆❏ ${st.prefix}${c}`).join('\n')}\n╰▰▰▰▰▰▰▰◈`
  return `
▉ ${st.name} ▉

✅ BOT ➜ Connecté 🤖
🟢 STATUS ➜ OPEN
📅 DATE ➜ ${nowStr()}
▰▰▰▰▰▰▰▰▰▰
➠ Auteur : Mr Kira Tech 🌐
➠ Préfixe : [ ${st.prefix} ]
➠ Total Cmds : [ ${TOTAL_CMDS} ]

---

${block('GROUP', CMD_LIST.GROUP)}

${block('FUN', CMD_LIST.FUN)}

${block('GENERAL', CMD_LIST.GENERAL)}

${block('AI', CMD_LIST.AI)}

${block('TOOLS', CMD_LIST.TOOLS)}

${block('SYSTEM', CMD_LIST.SYSTEM)}

END…… 🌐

Powered by Mr Kira Tech 🌐`
}

// ═════════════ WHATSAPP : CONTENUS ═════════════
const BLAGUES = [
  'Pourquoi les plongeurs plongent-ils toujours en arrière ? Parce que sinon ils tombent dans le bateau 😂',
  'Que fait une fraise sur un cheval ? Tagada tagada 🍓',
  'Quel est le comble pour un électricien ? De ne pas être au courant 💡',
  'Pourquoi les poissons détestent l\'ordinateur ? À cause du net 🐟',
  'Comment appelle-t-on un chat tombé dans un pot de peinture le jour de Noël ? Un chat-peint de Noël 🎄',
  'Un croque-monsieur et un croque-madame ont un enfant. Il s\'appelle ? Un croque-mitaine 🥪',
  'Que dit un escargot sur le dos d\'une tortue ? Youhou ! 🐌',
  'Pourquoi les squelettes ne se battent jamais ? Ils n\'ont pas le cœur 💀',
  'Quel est le comble pour un jardinier ? Raconter des salades 🥬',
  'Que dit un fantôme quand il est ému ? C\'est drap 👻',
  'Pourquoi le livre de maths est triste ? Il a trop de problèmes 📘',
  'Quel est le fruit préféré des fantômes ? Le citrouille… euh, la boo-nane 🍌',
  'Comment appelle-t-on un boomerang qui ne revient pas ? Un bâton 🪃',
  'Que fait un geek quand il a froid ? Il ferme ses fenêtres 🪟',
  'Pourquoi les oiseaux volent vers le sud ? Parce que c\'est trop loin à pied 🐦',
  'Quel est l\'animal le plus rapide ? Le pou, il est toujours en tête 🐛',
  'Que dit un 0 à un 8 ? Sympa ta ceinture ! ➰',
  'Pourquoi Superman porte son slip par-dessus ? Parce que sa mère n\'a pas fini la lessive 🦸',
  'Quel est le sport préféré des insectes ? Le cricket 🦗',
  'Pourquoi les éléphants ne font pas de vélo ? Ils n\'ont pas de pouce pour la sonnette 🐘',
  'Que dit un vampire au restaurant ? Je prendrai un steak… saignant 🧛',
  'Quel est le comble pour un cordonnier ? D\'avoir les pieds sur terre… et de ne pas être bien chaussé 👞',
  'Que dit un pirate qui arrive en retard ? Désolé, j\'avais la cale 🏴‍☠️',
  'Comment appelle-t-on un poisson sans œil ? Un psn 🐠',
  'Pourquoi les maths sont toujours fatiguées ? Elles ont trop de racines à porter 🌱',
  'Que dit une imprimante qui se fâche ? J\'en ai marre, je vais te faire un bourrage ! 🖨️',
  'Que dit un cannibale quand il est en retard ? Je vais être la cible des remarques 🍖',
  'Quel est le comble du vampire ? Être à cran de sang 🩸',
  'Pourquoi un chat n\'aime pas internet ? À cause de la souris 🐭',
  'Que dit une poule qui rentre dans un bar ? Rien, elle pond un sujet 🐔',
  'Comment appelle-t-on un chien sans pattes ? On ne l\'appelle pas, on va le chercher 🐶',
  'Quel est le comble pour un pompier ? Se faire allumer 🔥',
  'Que fait un crocodile qui surveille la pharmacie ? Il Lacoste 🐊',
  'Pourquoi le café est jamais en retard ? Parce qu\'il est toujours bien filtré ☕',
  'Que dit le 1 au 2 ? On se voit en 3 ? 1️⃣',
  'Pourquoi le téléphone a des lunettes ? Pour mieux voir les appels 📱',
  'Que dit un œuf à une poêle ? Tu me fais cuire de peur 🍳',
  'Pourquoi les astronautes n\'ont pas peur du noir ? Ils sont habitués à l\'espace 🚀',
  'Comment s\'appelle un lapin qui dort ? Un lapin-sieste 🐇',
  'Quel est le comble d\'un boulanger ? Être dans le pétrin 🥖',
  'Que dit un panneau de sens interdit ? Je t\'ai à l\'œil 🚫',
  'Pourquoi l\'ordinateur est fatigué ? Il a trop de fenêtres ouvertes 💻',
  'Que dit un balai à une poussière ? Je vais te faire disparaître 🧹',
  'Pourquoi les pieds sentent mauvais ? Parce qu\'ils courent après le temps 🦶',
  'Que fait une vache dans un champ ? Elle meuh-dite 🐄',
  'Comment appelle-t-on un chat qui fait du karaté ? Un chat-pion 🥋',
  'Pourquoi les nuages sont toujours pressés ? Ils ont des orages à gérer ☁️',
  'Que dit un stylo qui a tout dit ? J\'ai plus rien à écrire ✒️',
  'Quel est le comble pour un menuisier ? Perdre le fil du bois 🪵',
  'Que dit une tomate à une autre ? Tu sauces trop vite 🍅',
  'Pourquoi les poules ont des plumes ? Pour ne pas avoir froid aux œufs 🥚',
  'Que dit un mouton qui veut du calme ? Béééh… chut 🐑'
]
const COMPLIMENTS = [
  'Tu illumines n\'importe quelle pièce où tu entres ✨', 'Ton sourire est contagieux 😊', 'Tu es plus fort(e) que tu ne le penses 💪',
  'Ta bonne humeur fait du bien à tout le monde 🌹', 'Tu as un cœur en or 💛', 'Tu es une personne rare et précieuse 💎',
  'Ton énergie est incroyable ⚡', 'Tu rends le monde meilleur 🌍', 'Tu as un humour génial 😂', 'Tu es toujours là pour les autres 🤝',
  'Ton intelligence est impressionnante 🧠', 'Tu inspires beaucoup de gens 🌟', 'Tu as un style unique 😎', 'Ta gentillesse est touchante 🥰',
  'Tu es courageux(se) 🦁', 'Tu es une vraie source de motivation 🔥', 'Ta voix est apaisante 🎶', 'Tu as un grand talent 🎨',
  'Tu mérites tout le bonheur du monde 🌈', 'Tu es authentique et ça se voit 🌻', 'Ton rire est adorable 😄', 'Tu es un(e) ami(e) formidable 👑',
  'Tu travailles dur et ça paie 🏆', 'Ta présence rassure 🕊️', 'Tu as un cerveau en or 🥇', 'Tu es créatif(ve) 🎭', 'Tu as l\'art de rendre les choses simples 🌸',
  'Tu es adorable 🧸', 'Tu es lumineux(se) 🌞', 'Tu es un(e) battant(e) 🥊', 'Tu fais de ce monde un endroit plus doux 🍯',
  'Ton esprit est brillant 💡', 'Tu as une belle âme 🕯️', 'Tu es une vraie star ⭐', 'Tu as du charisme 😏', 'Tu es d\'une grande sagesse 🦉',
  'Tu es généreux(se) 🎁', 'Tu es une force tranquille 🌊', 'Tu mets de la joie partout 🎈', 'Tu es unique au monde 🧬',
  'Tu es exceptionnel(le) 🚀', 'Tu as un grand cœur 💖', 'Tu es plein(e) de ressources 🛠️', 'Tu es toujours positif(ve) ➕',
  'Ta persévérance est admirable 🧗', 'Tu es un exemple pour moi 📚', 'Tu as du talent à revendre 🎤', 'Tu es la meilleure version de toi-même 🌹',
  'Tu es tout simplement génial(e) 🎉', 'Tu es un(e) vrai(e) champion(ne) 🏅'
]
const STUPID = [
  'Si un avion s\'écrase à la frontière, où enterre-t-on les survivants ? 🤔', 'Combien de mois ont 28 jours ? 🧐',
  'Si tu mets un canard dans un camion, ça fait quoi ? Un canard qui roule 🦆', 'Un coq pond un œuf sur un toit pointu, de quel côté tombe-t-il ? 🥚',
  'Pourquoi on dit « se lever du pied gauche » alors qu\'on se lève avec les deux ? 🦶', 'Qu\'est-ce qui est plus lourd : 1 kg de plumes ou 1 kg de plomb ? 🪶',
  'Si un train électrique va vers le nord, de quel côté va la fumée ? 🚂', 'Comment faire entrer une girafe dans un frigo ? 🦒',
  'Quelle est la couleur du cheval blanc d\'Henri IV ? 🐎', 'Si je te donne 3 pommes et que tu en prends 2, combien en as-tu ? 🍎'
]
const GOODNIGHT = [
  'Bonne nuit 🌙 Fais de beaux rêves et repose-toi bien 💤', 'Il est temps de fermer les yeux 😴 À demain avec le sourire ✨',
  'Dors bien, demain sera une belle journée 🌟', 'Que les étoiles veillent sur ton sommeil 🌌', 'Bonne nuit 🌹 Recharge tes batteries, tu le mérites 🔋',
  'Les rêves t\'attendent… bonne nuit 🛌'
]
const IMAGINE = [
  'Tu trouves une porte secrète dans ta chambre. Que fais-tu ? 🚪', 'Tu peux voyager dans le temps 24h. Où vas-tu ? ⏳',
  'Tu te réveilles avec un super-pouvoir. Lequel ? 🦸', 'Tu gagnes un voyage autour du monde. Premier pays ? ✈️',
  'Tu peux parler aux animaux pendant une journée. Avec qui commences-tu ? 🐾', 'Tu deviens invisible 1h. Que fais-tu ? 👻',
  'Tu es seul(e) sur une île déserte avec 3 objets. Lesquels ? 🏝️', 'Tu peux avoir un repas gratuit à vie. Quel restaurant ? 🍽️',
  'Tu rencontres ton toi du futur. Quelle question poses-tu ? 🔮', 'Tu trouves 1 000 000 € dans la rue. Que fais-tu ? 💰',
  'Tu peux changer un événement de l\'histoire. Lequel ? 📜', 'Tu deviens président(e) pour un jour. Première décision ? 🏛️',
  'Tu peux vivre sur une autre planète. Laquelle ? 🪐', 'Tu es coincé(e) dans un ascenseur avec ta star préférée. Que dis-tu ? 🎤',
  'Tu peux maîtriser n\'importe quel instrument instantanément. Lequel ? 🎸', 'Tu hérites d\'un château. Quelle est ta première pièce à visiter ? 🏰',
  'Tu peux téléporter ta famille n\'importe où. Où ? 🌴', 'Tu te réveilles dans un jeu vidéo. Lequel ? 🎮',
  'Tu peux effacer un souvenir. Lequel ? 🧠', 'Tu deviens célèbre demain. Pour quoi ? 🌟', 'Tu peux manger un seul plat toute ta vie. Lequel ? 🍕',
  'Tu trouves une lampe magique, 3 vœux ! Lesquels ? 🧞', 'Tu peux voler pendant 10 minutes. Où vas-tu ? 🕊️',
  'Tu es chef(fe) d\'un pays pour une semaine. Que construis-tu ? 🏗️', 'Tu peux parler toutes les langues. Quelle est ta première conversation ? 🗣️',
  'Tu dois vivre 1 an sans téléphone. Comment t\'organises-tu ? 📵', 'Tu découvres un trésor pirate. Que fais-tu ? 🏴‍☠️',
  'Tu peux inviter 3 personnes à dîner (vivantes ou non). Qui ? 🍷', 'Tu deviens un animal 1 jour. Lequel ? 🦁', 'Tu peux arrêter le temps 5 minutes. Que fais-tu ? ⏱️',
  'Tu pars en vacances avec un budget illimité. Où ? 🏖️', 'Tu peux créer une invention. Que crées-tu ? 🔧', 'Tu rencontres un extraterrestre. Première phrase ? 👽',
  'Tu es détective sur une affaire mystérieuse. Quel est ton premier indice ? 🕵️', 'Tu peux changer de métier demain. Lequel ? 💼',
  'Tu as un jour pour tout réaliser. Par quoi commences-tu ? ✅', 'Tu perds tout ton réseau pour une semaine. Tu fais quoi ? 📶', 'Tu deviens chanteur(se) de renom. Quel est ton premier tube ? 🎵',
  'Tu peux lire dans les pensées 1h. Qui écoutes-tu ? 🧐', 'Tu reçois une maison dans le pays de ton choix. Où ? 🏡', 'Tu peux dormir sur un nuage. À quoi rêves-tu ? ☁️',
  'Tu es le héros d\'un film. Quel genre ? 🎬', 'Tu pars en mission sur la Lune. Qu\'emportes-tu ? 🌕', 'Tu gagnes une voiture de rêve. Laquelle ? 🏎️',
  'Tu peux refaire ta journée d\'hier. Que changes-tu ? 🔁', 'Tu es plongé(e) dans l\'océan avec des dauphins. Que ressens-tu ? 🐬', 'Tu ouvres ton propre café. Quel nom ? ☕',
  'Tu peux offrir un cadeau à tout le monde. Lequel ? 🎁', 'Tu es le dernier humain sur Terre pendant 1h. Que fais-tu ? 🌍', 'Tu deviens le meilleur joueur du monde. Dans quel sport ? ⚽'
]
const MEME_SUBS = ['memes', 'dankmemes', 'me_irl', 'wholesomememes', 'MemeEconomy', 'funny', 'ProgrammerHumor', 'AdviceAnimals']
const WAIFU = ['waifu', 'neko', 'shinobu', 'megumin', 'smile', 'happy', 'wave', 'dance']

// ═════════════ WHATSAPP : HELPERS ═════════════
function textOf(m) {
  const x = m.message?.ephemeralMessage?.message || m.message?.viewOnceMessage?.message || m.message
  if (!x) return ''
  return x.conversation || x.extendedTextMessage?.text || x.imageMessage?.caption || x.videoMessage?.caption || ''
}
function ctxOf(m) {
  const x = m.message?.ephemeralMessage?.message || m.message
  const t = x && Object.keys(x).find((k) => x[k]?.contextInfo)
  return t ? x[t].contextInfo : undefined
}
const idsOf = (p) => [p.id, p.phoneNumber, p.lid].filter(Boolean)
async function loadMeta(sock, jid) {
  const meta = await sock.groupMetadata(jid)
  const isAdmin = (j) => !!j && meta.participants.some((p) => p.admin && idsOf(p).some((x) => jidNum(x) === jidNum(j)))
  return { meta, isAdmin }
}
async function mediaOf(sock, m) {
  const c = ctxOf(m)
  const direct = m.message?.imageMessage || m.message?.videoMessage || m.message?.stickerMessage
  let target = null
  if (direct) target = m
  else if (c?.quotedMessage && (c.quotedMessage.imageMessage || c.quotedMessage.videoMessage || c.quotedMessage.stickerMessage)) {
    target = { key: { remoteJid: m.key.remoteJid, id: c.stanzaId, participant: c.participant }, message: c.quotedMessage }
  }
  if (!target) return null
  const buffer = await downloadMediaMessage(target, 'buffer', {}, { logger, reuploadRequest: sock.updateMediaMessage })
  return { buffer, isVideo: !!(target.message.videoMessage) }
}

// ═════════════ WHATSAPP : COMMANDES ═════════════
const COMMANDS = {}
const alias = (names, fn) => names.forEach((n) => (COMMANDS[n] = fn))
const needGroup = async (c) => {
  if (!c.isGroup) { await c.reply('⚠️ Cette commande fonctionne uniquement dans un groupe.'); return null }
  const g = await loadMeta(c.sock, c.jid)
  g.senderAdmin = c.isOwner || g.isAdmin(c.sender)
  g.botAdmin = g.isAdmin(c.sock.user.id) || g.isAdmin(c.sock.user.lid)
  return g
}
const needAdmin = async (c, needBot = false) => {
  const g = await needGroup(c)
  if (!g) return null
  if (!g.senderAdmin) { await c.reply('⛔ Commande réservée aux admins.'); return null }
  if (needBot && !g.botAdmin) { await c.reply('⚠️ Je dois être admin du groupe pour faire ça.'); return null }
  return g
}
const needOwner = async (c) => {
  if (!c.isOwner) { await c.reply('⛔ Commande réservée au propriétaire du bot.'); return false }
  return true
}
function targetOf(c, g) {
  const x = ctxOf(c.m)
  if (x?.mentionedJid?.length) return x.mentionedJid[0]
  if (x?.participant) return x.participant
  const n = c.arg.replace(/\D/g, '')
  if (!n) return null
  const p = g?.meta.participants.find((p) => idsOf(p).some((i) => jidNum(i) === n))
  return p ? p.id : n + '@s.whatsapp.net'
}
const sendRemoteImage = async (c, url, caption) => {
  try {
    await c.sock.sendMessage(c.jid, { image: { url }, caption: `${caption}\n\n${SIGN}` }, { quoted: c.m })
  } catch { await c.reply(`${caption}\n${url}`) }
}

// ----- GENERAL -----
alias(['menu', 'help'], async (c) => {
  const st = c.st
    const img = st.image && fs.existsSync(st.image) ? fs.readFileSync(st.image) : null
  await c.sock.sendMessage(c.jid, { image: img || (await imgBuf(IMG.WA)), caption: `🌹 ${st.name}\n\n${SIGN}` }, { quoted: c.m })
  const frames = ['⏳ Chargement du menu…\n▱▱▱▱▱ 0%', '⏳ Chargement du menu…\n▰▰▱▱▱ 40%', '⏳ Chargement du menu…\n▰▰▰▰▱ 80%', '✅ Menu prêt !\n▰▰▰▰▰ 100%']
  await waAnim(c.sock, c.jid, c.m, frames, `${waMenu(st)}\n\n${SIGN}`, 450)
})
COMMANDS.alive = async (c) => {
  await c.reply(`🛎 Le bot est en ligne et actif ✅\n🟢 STATUS ➜ OPEN\n📅 ${nowStr()}\n⏱️ Uptime : ${Math.floor(process.uptime() / 60)} min`, { img: IMG.WA })
}
COMMANDS.ping = async (c) => {
  const t = Date.now()
  await c.sock.sendPresenceUpdate('composing', c.jid)
  const ms = Date.now() - t
  await c.reply(`🏓 Pong !\n⚡ Latence : ${ms} ms\n${bar(Math.max(0.1, 1 - ms / 500))}`, { img: IMG.WA })
}
COMMANDS.speed = async (c) => {
  const t = performance.now()
  await c.sock.sendPresenceUpdate('composing', c.jid)
  const ms = (performance.now() - t).toFixed(1)
  await c.reply(`❤️‍🩹 VITESSE DE TRAITEMENT\n⚡ ${ms} ms\n${bar(Math.max(0.1, 1 - ms / 1000))}`)
}
alias(['owner'], async (c) => {
  const num = jidNum(c.sock.user.id)
  const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:Propriétaire ${c.st.name}\nTEL;type=CELL;waid=${num}:+${num}\nEND:VCARD`
  await c.sock.sendMessage(c.jid, { contacts: { displayName: 'Propriétaire', contacts: [{ vcard }] } }, { quoted: c.m })
  await c.reply(`🚪 Propriétaire du bot : wa.me/${num}`)
})
COMMANDS.repo = async (c) => c.reply(`📊 Dépôt / chaîne du bot :\n${REPO_URL}`)
COMMANDS.channelid = async (c) => {
  const m = c.arg.match(/channel\/([A-Za-z0-9_-]+)/)
  if (!m) return c.reply(`🔑 Usage : ${c.st.prefix}channelid https://whatsapp.com/channel/XXXX`)
  try {
    const info = await c.sock.newsletterMetadata('invite', m[1])
    await c.reply(`🔑 ID de la chaîne : ${info.id}\n📛 Nom : ${info.name}`)
  } catch { await c.reply('❌ Chaîne introuvable.') }
}
COMMANDS.gpstatus = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  const cfg = db.groups[c.jid] || {}
  const on = (k) => (cfg[k] ? '✅' : '⛔')
  await c.reply(`🛁 STATUT DU GROUPE\n👥 Membres : ${g.meta.participants.length}\n🛡 Admins : ${g.meta.participants.filter((p) => p.admin).length}\n🔒 Écriture : ${g.meta.announce ? 'admins uniquement' : 'tous'}\n\nAntilink ${on('antilink')} | Antispam ${on('antispam')} | Antitag ${on('antitag')}\nWelcome ${cfg.welcome === false ? '⛔' : '✅'} | Goodbye ${cfg.goodbye === false ? '⛔' : '✅'}`)
}
COMMANDS.antidelete = async (c) => {
  if (!(await needOwner(c))) return
  const v = (c.args[0] || '').toLowerCase()
  c.st.antidelete = v === 'on' ? true : v === 'off' ? false : !c.st.antidelete
  saveDb()
  await c.reply(`🧨 Anti-suppression : ${c.st.antidelete ? 'activé ✅' : 'désactivé ⛔'}`)
}
COMMANDS.pair = async (c) => {
  const n = c.arg.replace(/\D/g, '')
  if (!/^\d{8,15}$/.test(n)) return c.reply(MSG.badNumber)
  if (sessions.get(n)?.sock?.authState?.creds?.registered) return c.reply(`✅ Le numéro ${n} est déjà connecté.`)
  await c.reply(MSG.pairing(n))
  let code
  for (let i = 0; i < 3 && !code; i++) {
    try { code = await createSession(n, { wantCode: true }) } catch { await killSession(n, false); await sleep(1500) }
  }
  if (!code) return c.reply('❌ Impossible de générer le code pour le moment.')
  await waSay(c.sock, c.jid, MSG.code(n, code), { img: IMG.WA, quoted: c.m })
}
COMMANDS.voice = async (c) => {
  const q = c.arg || textOf({ message: ctxOf(c.m)?.quotedMessage })
  if (!q) return c.reply(`📯 Usage : ${c.st.prefix}voice ton texte (max 200 caractères)`)
  try {
    const buf = await getBuffer(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fr&q=${encodeURIComponent(q.slice(0, 200))}`)
    await c.sock.sendPresenceUpdate('recording', c.jid)
    await c.sock.sendMessage(c.jid, { audio: buf, mimetype: 'audio/mpeg', ptt: true }, { quoted: c.m })
  } catch { await c.reply('❌ Impossible de générer le vocal pour le moment.') }
}

// ----- LIENS -----
COMMANDS.url = async (c) => c.reply(`⚜️ Chaîne WhatsApp du bot :\n${LINKS.waChannel}`)
COMMANDS.link = async (c) =>
  c.reply(`🔗 LIENS OFFICIELS\n\n1️⃣ 📢 Chaîne TG : ${LINKS.tgChannel}\n2️⃣ 👥 Groupe TG : ${LINKS.tgGroup}\n3️⃣ 📢 Chaîne WA : ${LINKS.waChannel}\n4️⃣ 👥 Groupe WA : ${LINKS.waGroup}\n5️⃣ 🤖 Bot TG : ${LINKS.bot}`)

// ----- GROUP -----
alias(['tagall'], async (c) => {
  const g = await needAdmin(c)
  if (!g) return
  const ids = g.meta.participants.map((p) => p.id)
  const body = `🌐 TAG ALL\n${c.arg ? `📝 ${c.arg}\n` : ''}\n${ids.map((i) => `➤ @${jidNum(i)}`).join('\n')}\n\nPower by Kira Tech Bot 🌐\n${SIGN}`
  await waSay(c.sock, c.jid, body, { quoted: c.m, mentions: ids })
})
COMMANDS.tag = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  const x = ctxOf(c.m)
  const ids = g.meta.participants.map((p) => p.id)
  if (c.arg || x?.mentionedJid?.length || x?.quotedMessage) {
    const text = c.arg || textOf({ message: x?.quotedMessage }) || '🏷'
    return c.reply(text, { mentions: g.senderAdmin ? ids : x?.mentionedJid || [] })
  }
  await c.reply('🏷 Usage : .tag texte (admins : mentionne tout le monde)')
}
COMMANDS.groupinfo = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  const admins = g.meta.participants.filter((p) => p.admin)
  await c.reply(`🎤 *${g.meta.subject}*\n\n📝 ${g.meta.desc || 'Aucune description'}\n👥 Membres : ${g.meta.participants.length}\n🛡 Admins : ${admins.length}\n📅 Créé : ${new Date((g.meta.creation || 0) * 1000).toLocaleDateString('fr-FR')}`)
}
COMMANDS.groupname = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  if (!c.arg) return c.reply(`🗂 Nom du groupe : ${g.meta.subject}`)
  if (!g.senderAdmin) return c.reply('⛔ Commande réservée aux admins.')
  if (!g.botAdmin) return c.reply('⚠️ Je dois être admin du groupe pour faire ça.')
  await c.sock.groupUpdateSubject(c.jid, c.arg)
  await c.reply('✅ Nom du groupe modifié.')
}
COMMANDS.setgdesc = async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  if (!c.arg) return c.reply(`🍎 Usage : ${c.st.prefix}setgdesc nouvelle description`)
  await c.sock.groupUpdateDescription(c.jid, c.arg)
  await c.reply('✅ Description modifiée.')
}
COMMANDS.ppgroup = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  try {
    const url = await c.sock.profilePictureUrl(c.jid, 'image')
    await sendRemoteImage(c, url, `🌆 ${g.meta.subject}`)
  } catch { await c.reply('❌ Ce groupe n\'a pas de photo de profil.') }
}
alias(['listadmin', 'staff'], async (c) => {
  const g = await needGroup(c)
  if (!g) return
  const admins = g.meta.participants.filter((p) => p.admin)
  await c.reply(`🧾 *ADMINS DU GROUPE* (${admins.length})\n\n${admins.map((a, i) => `${i + 1}. ${a.admin === 'superadmin' ? '👑' : '🛡'} @${jidNum(a.id)}`).join('\n')}`, { mentions: admins.map((a) => a.id) })
})
COMMANDS.add = async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const n = c.arg.replace(/\D/g, '')
  if (!n) return c.reply(`👤 Usage : ${c.st.prefix}add 242XXXXXXXX`)
  try {
    const r = await c.sock.groupParticipantsUpdate(c.jid, [n + '@s.whatsapp.net'], 'add')
    const st = r?.[0]?.status
    await c.reply(st === '200' ? '✅ Membre ajouté.' : st === '403' ? '⚠️ Ce numéro n\'autorise pas l\'ajout direct (confidentialité).' : st === '409' ? 'ℹ️ Ce numéro est déjà dans le groupe.' : '⚠️ Impossible d\'ajouter ce numéro.')
  } catch { await c.reply('⚠️ Impossible d\'ajouter ce numéro.') }
}
COMMANDS.kick = async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const t = targetOf(c, g)
  if (!t) return c.reply(`🚫 Usage : ${c.st.prefix}kick @membre`)
  if (g.isAdmin(t)) return c.reply('⚠️ Impossible de retirer un admin.')
  await c.sock.groupParticipantsUpdate(c.jid, [t], 'remove')
  await c.reply('🚫 Membre retiré du groupe.')
}
COMMANDS.promote = async (c) => {
  if (!(await needOwner(c))) return
  const g = await needGroup(c)
  if (!g) return
  if (!g.botAdmin) return c.reply('⚠️ Je dois être admin du groupe pour faire ça.')
  const t = targetOf(c, g)
  if (!t) return c.reply(`💎 Usage : ${c.st.prefix}promote @membre`)
  await c.sock.groupParticipantsUpdate(c.jid, [t], 'promote')
  await c.reply('💎 Membre nommé admin.')
}
alias(['mute', 'unmute'], async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const mute = c.cmd === 'mute'
  await c.sock.groupSettingUpdate(c.jid, mute ? 'announcement' : 'not_announcement')
  await c.reply(mute ? '🥂 Groupe fermé : seuls les admins peuvent écrire.' : '🤦‍♂️ Groupe réouvert à tous les membres.')
})
alias(['resetlink', 'revoke'], async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const code = await c.sock.groupRevokeInvite(c.jid)
  await c.reply(`${c.cmd === 'revoke' ? '🛡' : '⛔️'} Lien d'invitation révoqué.\n🔗 Nouveau lien : https://chat.whatsapp.com/${code}`)
})
COMMANDS.purge = async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const self = jidNum(c.sock.user.id)
  const targets = g.meta.participants.filter((p) => !p.admin && !idsOf(p).some((i) => jidNum(i) === self)).map((p) => p.id)
  if (!targets.length) return c.reply('ℹ️ Aucun membre à retirer.')
  await c.reply(`🪬 Purge de ${targets.length} membre(s) en cours…`)
  let n = 0
  for (const t of targets) {
    try { await c.sock.groupParticipantsUpdate(c.jid, [t], 'remove'); n++ } catch {}
    await sleep(1500)
  }
  await c.reply(`✅ Purge terminée : ${n}/${targets.length} membre(s) retiré(s).`)
}
COMMANDS.del = async (c) => {
  const g = await needAdmin(c, true)
  if (!g) return
  const keys = (groupMsgs.get(c.jid) || []).slice(-11)
  let n = 0
  for (const k of keys.reverse()) {
    if (n >= 10) break
    try { await c.sock.sendMessage(c.jid, { delete: k }); n++ } catch {}
    await sleep(400)
  }
  groupMsgs.set(c.jid, [])
  await c.reply(`🧹 ${n} message(s) supprimé(s).`)
}
alias(['antilink', 'antispam', 'antitag', 'welcome', 'goodbye'], async (c) => {
  const g = await needAdmin(c)
  if (!g) return
  const cfg = (db.groups[c.jid] = db.groups[c.jid] || {})
  const v = (c.args[0] || '').toLowerCase()
  const cur = ['welcome', 'goodbye'].includes(c.cmd) ? cfg[c.cmd] !== false : !!cfg[c.cmd]
  cfg[c.cmd] = v === 'on' ? true : v === 'off' ? false : !cur
  saveDb()
  const icon = { antilink: '⚠️', antispam: '🚫', antitag: '🏷', welcome: '🗞', goodbye: '🫂' }[c.cmd]
  await c.reply(`${icon} ${c.cmd} : ${cfg[c.cmd] ? 'activé ✅' : 'désactivé ⛔'}\n(utilise ${c.st.prefix}${c.cmd} on / off)`)
})
COMMANDS.signale = async (c) => {
  const g = await needGroup(c)
  if (!g) return
  const t = targetOf(c, g)
  if (!t) return c.reply(`📵 Usage : ${c.st.prefix}signale @membre (ou en réponse à un message)`)
  try { await c.sock.updateBlockStatus(t, 'block') } catch {}
  await c.reply(`📵 @${jidNum(t)} a été signalé et bloqué.`, { mentions: [t] })
}

// ----- FUN -----
COMMANDS.blague = async (c) => c.reply(`🃏 BLAGUE\n\n${rand(BLAGUES)}`)
COMMANDS.compliment = async (c) => {
  const x = ctxOf(c.m)
  const t = x?.mentionedJid?.[0]
  await c.reply(`🦋 COMPLIMENT\n\n${t ? `@${jidNum(t)} ` : ''}${rand(COMPLIMENTS)}`, t ? { mentions: [t] } : {})
}
COMMANDS.stupid = async (c) => c.reply(`🧨 QUESTION STUPIDE\n\n${rand(STUPID)}`)
COMMANDS.goodnight = async (c) => c.reply(`💤 ${rand(GOODNIGHT)}`)
COMMANDS.imagine = async (c) => c.reply(`😇 IMAGINE…\n\n${rand(IMAGINE)}`)
alias(['meme', 'photo'], async (c) => {
  const sub = c.cmd === 'photo' ? 'funny' : rand(MEME_SUBS)
  try {
    const j = await getJson(`https://meme-api.com/gimme/${sub}`)
    if (!j.url) throw new Error('no url')
    await sendRemoteImage(c, j.url, c.cmd === 'photo' ? `🚹 ${j.title}` : `🤣 ${j.title}`)
  } catch { await c.reply('❌ Impossible de récupérer une image pour le moment, réessaie.') }
})
alias(['character', 'gif'], async (c) => {
  try {
    const j = await getJson(`https://api.waifu.pics/sfw/${c.cmd === 'gif' ? rand(['hug', 'pat', 'wave', 'dance', 'happy', 'smile', 'highfive', 'wink']) : rand(['waifu', 'neko', 'shinobu', 'megumin'])}`)
    if (c.cmd === 'gif') {
      try { await c.sock.sendMessage(c.jid, { video: { url: j.url }, gifPlayback: true, caption: `🎁 GIF\n\n${SIGN}` }, { quoted: c.m }) } catch { await sendRemoteImage(c, j.url, '🎁 GIF') }
    } else await sendRemoteImage(c, j.url, '🍥 PERSONNAGE')
  } catch { await c.reply('❌ Service indisponible, réessaie dans un instant.') }
})
COMMANDS.news = async (c) => {
  try {
    const r = await fetch('https://www.francetvinfo.fr/titres.rss', { signal: AbortSignal.timeout(12000) })
    const xml = await r.text()
    const items = [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>/g)].slice(0, 5)
    if (!items.length) throw new Error('empty')
    await c.reply(`🗞 INFOS DU JOUR\n\n${items.map((m, i) => `${NUM_EMOJI[i]} ${m[1].trim()}\n🔗 ${m[2].trim()}`).join('\n\n')}`)
  } catch { await c.reply('❌ Impossible de charger les actualités pour le moment.') }
}

// ----- AI -----
COMMANDS.manga = async (c) => {
  try {
    const j = (await getJson('https://api.jikan.moe/v4/random/manga')).data
    const txt = `📰 MANGA : ${j.title}\n⭐ Note : ${j.score ?? 'N/A'} | 📚 Chapitres : ${j.chapters ?? '?'}\n🏷 ${(j.genres || []).map((g) => g.name).join(', ')}\n\n${(j.synopsis || 'Pas de synopsis.').slice(0, 450)}…\n🔗 ${j.url}`
    await sendRemoteImage(c, j.images?.jpg?.large_image_url, txt)
  } catch { await c.reply(`📰 Conseil manga : ${rand(['One Piece', 'Naruto', 'Death Note', 'Attack on Titan', 'Fullmetal Alchemist', 'Demon Slayer', 'Hunter x Hunter'])}`) }
}
COMMANDS.kirabot = async (c) => {
  const num = jidNum(c.sender)
  const prof = (db.kira[num] = db.kira[num] || { name: null, notes: [] })
  const a = c.arg.trim()
  const low = a.toLowerCase()
  const nm = a.match(/^(?:mon nom est|je m'appelle|je suis|nom)\s+(.+)/i)
  if (nm) {
    prof.name = nm[1].trim().slice(0, 40)
    saveDb()
    return c.reply(`🤖 Enchanté ${prof.name} ! Je retiens ton nom 🌹\nTape ${c.st.prefix}kirabot aide pour voir ce que je sais faire.`)
  }
  if (!prof.name) return c.reply(`🤖 Salut ! Je suis KIRA BOT 🌹\nComment t'appelles-tu ?\n👉 ${c.st.prefix}kirabot mon nom est TonNom`)
  if (/^retiens\s+/.test(low)) {
    prof.notes.push(a.replace(/^retiens\s+/i, '').slice(0, 200))
    prof.notes = prof.notes.slice(-20)
    saveDb()
    return c.reply(`🧠 C'est noté ${prof.name} !`)
  }
  if (low === 'notes') return c.reply(prof.notes.length ? `🧠 Ce que je retiens, ${prof.name} :\n\n${prof.notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}` : '🧠 Je n\'ai encore rien retenu.')
  if (low === 'oublie') { prof.notes = []; saveDb(); return c.reply('🧹 J\'ai tout oublié.') }
  if (low === 'bilan') {
    const s = db.stats[today()] || { msgs: 0, cmds: 0 }
    return c.reply(`📊 BILAN DE LA JOURNÉE, ${prof.name}\n\n💬 Messages vus : ${s.msgs}\n⚙️ Commandes : ${s.cmds}\n📅 ${today()}`)
  }
  if (low === 'groupe' || low === 'actifs') {
    const g = await needGroup(c)
    if (!g) return
    const act = Object.entries(db.activity[c.jid] || {}).sort((x, y) => y[1] - x[1]).slice(0, 5)
    return c.reply(`👥 *${g.meta.subject}*\nMembres : ${g.meta.participants.length}\n\n🔥 MEMBRES LES PLUS ACTIFS\n${act.length ? act.map(([n, v], i) => `${NUM_EMOJI[i]} @${n} — ${v} msg`).join('\n') : 'Pas encore de données.'}`, { mentions: act.map(([n]) => n + '@s.whatsapp.net') })
  }
  await c.reply(`🤖 Salut ${prof.name} ! Voici ce que je sais faire :\n\n🧠 ${c.st.prefix}kirabot retiens <info>\n📝 ${c.st.prefix}kirabot notes\n📊 ${c.st.prefix}kirabot bilan\n👥 ${c.st.prefix}kirabot groupe\n🧹 ${c.st.prefix}kirabot oublie`)
}

// ----- TOOLS -----
COMMANDS.sticker = async (c) => {
  try {
    const { Sticker } = await import('wa-sticker-formatter')
    let buf
    const media = await mediaOf(c.sock, c.m).catch(() => null)
    if (media && !media.isVideo) buf = media.buffer
    else if (media?.isVideo) return c.reply('⚠️ Les stickers vidéo ne sont pas pris en charge, envoie une image.')
    else {
      const j = await getJson(`https://api.waifu.pics/sfw/${rand(WAIFU)}`)
      buf = await getBuffer(j.url)
    }
    const st = await new Sticker(buf, { pack: 'KIRA TECH', author: 'Mr Kira Tech', type: 'full', quality: 60 }).toBuffer()
    await c.sock.sendMessage(c.jid, { sticker: st }, { quoted: c.m })
  } catch (e) {
    console.error('sticker:', e.message)
    await c.reply('❌ Impossible de créer le sticker.')
  }
}
alias(['boucle', 'ban'], async (c) => {
  const n = Math.min(parseInt(c.args[0], 10) || 0, 10)
  const last = c.session.lastCmd[c.jid]
  if (!n) return c.reply(`📵 Usage : ${c.st.prefix}boucle 3 (répète la commande précédente N fois, max 10)`)
  if (!last) return c.reply('ℹ️ Aucune commande précédente à répéter.')
  await c.reply(`🔁 Répétition de ${last.cmd} × ${n}`)
  for (let i = 0; i < n; i++) {
    await runCommand(c.session, c.m, last.text, true)
    await sleep(900)
  }
})

// ----- SYSTEM -----
COMMANDS.botprefix = async (c) => {
  if (!c.arg) return c.reply(`⁉️ Préfixe actuel : [ ${c.st.prefix} ]`)
  if (!(await needOwner(c))) return
  const p = c.args[0].slice(0, 3)
  c.st.prefix = p
  saveDb()
  await c.reply(`⁉️ Nouveau préfixe : [ ${p} ]`)
}
COMMANDS.botname = async (c) => {
  if (!c.arg) return c.reply(`🔱 Nom du bot : ${c.st.name}`)
  if (!(await needOwner(c))) return
  c.st.name = c.arg.slice(0, 40)
  saveDb()
  try { await c.sock.updateProfileName(c.st.name) } catch {}
  await c.reply(`🔱 Nouveau nom : ${c.st.name}`)
}
COMMANDS.botimage = async (c) => {
  const media = await mediaOf(c.sock, c.m).catch(() => null)
  if (!media || media.isVideo) {
    return c.sock.sendMessage(c.jid, { image: { url: IMG.WA }, caption: `🛅 Image actuelle du bot\nPour la changer : envoie ou réponds à une image avec ${c.st.prefix}botimage\n\n${SIGN}` }, { quoted: c.m })
  }
  if (!(await needOwner(c))) return
  const file = path.join(DATA_DIR, `botimage-${c.session.number}.jpg`)
  fs.writeFileSync(file, media.buffer)
  c.st.image = file
  saveDb()
  try { await c.sock.updateProfilePicture(c.sock.user.id, media.buffer) } catch {}
  await c.reply('🛅 Image du bot mise à jour ✅')
}
COMMANDS.status = async (c) => {
  if (!c.arg) return c.reply('✅ STATUS ➜ OPEN 🟢')
  if (!(await needOwner(c))) return
  try { await c.sock.updateProfileStatus(c.arg.slice(0, 130)) } catch { return c.reply('❌ Impossible de modifier le statut.') }
  await c.reply('✅ Statut modifié.')
}
COMMANDS.creator = async (c) => c.reply('❤️‍🔥 Créateur du bot : Mr Kira Tech 🌐')

// ═════════════ WHATSAPP : EXÉCUTION ═════════════
async function runCommand(session, m, text, fromLoop = false) {
  const { sock, number } = session
  const st = getSettings(number)
  const jid = m.key.remoteJid
  const isGroup = jid.endsWith('@g.us')
  const self = sock.user.id.replace(/:\d+@/, '@')
  const sender = m.key.fromMe ? self : m.key.participant || jid
  const [raw, ...args] = text.slice(st.prefix.length).trim().split(/\s+/)
  const cmd = (raw || '').toLowerCase()
  const fn = COMMANDS[cmd]
  const reply = (t, extra = {}) => waSay(sock, jid, `${t}\n\n${SIGN}`, { quoted: m, img: extra.img || IMG.OTHER, mentions: extra.mentions })
  if (!fn) {
    if (!fromLoop) await reply(`❓ Commande inconnue : ${st.prefix}${cmd}\nTape ${st.prefix}menu pour voir la liste.`)
    return
  }
  const c = { sock, m, jid, isGroup, sender, session, st, cmd, args, arg: args.join(' '), text, reply, isOwner: !!m.key.fromMe, number }
  if (!['boucle', 'ban'].includes(cmd)) session.lastCmd[jid] = { cmd: st.prefix + cmd, text }
  try {
    await fn(c)
  } catch (e) {
    console.error(`cmd ${cmd}:`, e.message)
    await reply(`⚠️ Erreur sur ${st.prefix}${cmd} : ${e.message?.slice(0, 80) || 'inconnue'}`).catch(() => {})
  }
}

async function onWaMessage(session, m) {
  const { sock, number } = session
  if (!m.message || m.key.remoteJid === 'status@broadcast') return
    const jid = m.key.remoteJid
  const isGroup = jid.endsWith('@g.us')
  const st = getSettings(number)

  // anti-suppression
  const proto = m.message.protocolMessage
  if (proto && proto.type === 0 && st.antidelete) {
    const orig = msgStore.get(proto.key?.id)
    if (orig && !orig.key.fromMe) {
      const who = orig.key.participant || orig.key.remoteJid
      await waSay(sock, jid, `🧨 ANTI-DELETE\n@${jidNum(who)} a supprimé ce message :\n\n${SIGN}`, { mentions: [who] })
      await sock.sendMessage(jid, { forward: orig }).catch(() => {})
    }
    return
  }

  const text = textOf(m).trim()
  const self = sock.user.id.replace(/:\d+@/, '@')
  const sender = m.key.fromMe ? self : m.key.participant || jid

  // stats & activité
  const s = (db.stats[today()] = db.stats[today()] || { msgs: 0, cmds: 0 })
  s.msgs++
  if (isGroup && !m.key.fromMe) {
    const a = (db.activity[jid] = db.activity[jid] || {})
    a[jidNum(sender)] = (a[jidNum(sender)] || 0) + 1
  }
  saveDb()

  // protections de groupe
  if (isGroup && !m.key.fromMe) {
    const cfg = db.groups[jid] || {}
    if (cfg.antilink || cfg.antitag || cfg.antispam) {
      const { meta, isAdmin } = await loadMeta(sock, jid)
      const botAdmin = isAdmin(sock.user.id) || isAdmin(sock.user.lid)
      const senderAdmin = isAdmin(sender)
      const del = () => sock.sendMessage(jid, { delete: m.key }).catch(() => {})
      if (cfg.antilink && !senderAdmin && /(https?:\/\/|chat\.whatsapp\.com|www\.)/i.test(text)) {
        if (botAdmin) await del()
        return waSay(sock, jid, `⚠️ @${jidNum(sender)} les liens sont interdits dans ce groupe.\n\n${SIGN}`, { mentions: [sender] })
      }
      const mentions = ctxOf(m)?.mentionedJid || []
      if (cfg.antitag && !senderAdmin && mentions.length >= Math.max(5, Math.floor(meta.participants.length * 0.5))) {
        if (botAdmin) await del()
        return waSay(sock, jid, `🏷 @${jidNum(sender)} les tags massifs sont interdits.\n\n${SIGN}`, { mentions: [sender] })
      }
      if (cfg.antispam && !senderAdmin && text) {
        const k = jid + sender
        const prev = spamMap.get(k)
        spamMap.set(k, text)
        if (prev === text && botAdmin) await del()
      }
    }
  }

  if (!text.startsWith(st.prefix) || text.length <= st.prefix.length) return
  s.cmds++
  session.cmdCount++
  await runCommand(session, m, text)

  // invitation toutes les 5 commandes
  if (session.cmdCount % 5 === 0) {
    await sleep(900)
    await waSay(sock, jid, `📢 REJOINS-NOUS ! 🌹\n\n📢 Chaîne TG : ${LINKS.tgChannel}\n👥 Groupe TG : ${LINKS.tgGroup}\n📢 Chaîne WA : ${LINKS.waChannel}\n👥 Groupe WA : ${LINKS.waGroup}\n\n${SIGN}`, { img: IMG.WA })
  }
}
const spamMap = new Map()

// ═════════════ WHATSAPP : JOIN / LEAVE ═════════════
async function onGroupParticipants(sock, { id, participants, action }) {
  if (action !== 'add' && action !== 'remove') return
  const cfg = db.groups[id] || {}
  if (cfg[action === 'add' ? 'welcome' : 'goodbye'] === false) return
  const meta = await sock.groupMetadata(id)
  const tags = participants.map((p) => (typeof p === 'string' ? p : p.id))
  const mentions = tags.map((t) => `@${jidNum(t)}`).join(' ')
  const caption =
    action === 'add'
      ? `═══════════════════════════════════════════
   ✦  WELCOME IN GROUPES ✦
═══════════════════════════════════════════

- ${mentions}

───────────────────────────────────────────
* ${meta.subject}
───────────────────────────────────────────
* ${meta.desc || 'Aucune description'}
───────────────────────────────────────────
  👇 JOIN MY CHANNEL 👇
───────────────────
───────────────────

> power by kira tech 🌐

Ce message sera sous ce lien 👇

${CHANNEL_INVITE}`
      : `═══════════════════════════════════════════
   ✦  GOOD BYE IN GROUPES ✦
═══════════════════════════════════════════

${mentions}

───────────────────────────────────────────
*   ${meta.subject}
───────────────────────────────────────────
* ${meta.desc || 'Aucune description'}
──────────────────────────────────────

> power by kira tech 🌐

Ce message sera sous ce lien 👇

${CHANNEL_INVITE}`
  await sock.sendMessage(id, { image: { url: action === 'add' ? IMG.WELCOME : IMG.BYE }, caption, mentions: tags })
}

// ═════════════ EXPRESS / ANTI-SOMMEIL ═════════════
const app = express()
app.get('/', (_req, res) => res.send('Bot en ligne ✅'))
app.get('/health', (_req, res) => res.json({ ok: true, sessions: sessions.size }))
app.listen(PORT, () => console.log(`🌐 Serveur sur le port ${PORT}`))
if (SELF_URL) setInterval(() => fetch(SELF_URL).catch(() => {}), 10 * 60 * 1000)

// ═════════════ RESTAURATION DES SESSIONS ═════════════
async function restoreSessions() {
  const dirs = fs.readdirSync(AUTH_DIR, { withFileTypes: true }).filter((d) => d.isDirectory())
  for (const d of dirs) {
    try {
      const creds = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, d.name, 'creds.json'), 'utf8'))
      if (creds.registered) { await createSession(d.name); await sleep(1500) }
      else fs.rmSync(path.join(AUTH_DIR, d.name), { recursive: true, force: true })
    } catch { /* dossier incomplet */ }
  }
}
restoreSessions().catch((e) => console.error('restore:', e.message))

process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e))
process.on('uncaughtException', (e) => console.error('uncaughtException:', e))
console.log('🌹 KIRA TECH BOT v2 démarré')
