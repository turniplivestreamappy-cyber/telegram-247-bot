/**
 * Telegram 24/7 Bot for Render Deployment
 *
 * IMPORTANT:
 * Set BOT_TOKEN in Render Environment Variables.
 * Do not commit your Telegram bot token to a public repository.
 */

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const https = require('https');
const http = require('http');

// ১. কনফিগারেশন
const TOKEN = process.env.BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL || '';

if (!TOKEN) {
  console.error('BOT_TOKEN environment variable is required.');
  process.exit(1);
}

// ২. টেলিগ্রাম বট ইনিশিয়ালাইজ (লং পোলিং সক্রিয়)
const bot = new TelegramBot(TOKEN, {
  polling: {
    interval: 300,
    autoStart: true,
    params: { timeout: 10 }
  }
});

const startTime = new Date();

// ৩. /start কমান্ড
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'বন্ধু';

  const welcomeMessage =
    `👋 <b>স্বাগতম, ${firstName}!</b>\n\n` +
    `🤖 আমি একটি <b>২৪/৭ সচল টেলিগ্রাম বট</b>।\n` +
    `আমি Render-এ ডিপ্লয় হওয়ার জন্য তৈরি এবং সার্বক্ষণিক সক্রিয় থাকার জন্য কনফিগার করা হয়েছে!\n\n` +
    `📌 <b>কমান্ড তালিকা:</b>\n` +
    `• /start - বটের মূল মেনু\n` +
    `• /ping - বটের গতি ও লেটেন্সি চেক করুন\n` +
    `• /status - সার্ভার ও আপটাইম স্ট্যাটাস\n` +
    `• /help - সাহায্যের জন্য বিস্তারিত তথ্য\n\n` +
    `<i>যেকোনো মেসেজ পাঠালে আমি উত্তর দেব!</i>`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⚡ পিং টেস্ট (/ping)', callback_data: 'cmd_ping' },
          { text: '📊 বটের অবস্থা (/status)', callback_data: 'cmd_status' }
        ],
        [
          { text: 'ℹ️ সাহায্য (/help)', callback_data: 'cmd_help' }
        ]
      ]
    },
    parse_mode: 'HTML'
  };

  bot.sendMessage(chatId, welcomeMessage, keyboard);
});

// ৪. /ping কমান্ড
bot.onText(/^\/ping$/, (msg) => {
  const chatId = msg.chat.id;
  const startPing = Date.now();

  bot.sendMessage(chatId, '🏓 পং! গণনা করা হচ্ছে...').then((sentMsg) => {
    const latency = Date.now() - startPing;

    return bot.editMessageText(
      `🏓 <b>Pong!</b>\n` +
      `⚡ লেটেন্সি: <code>${latency}ms</code>\n` +
      `🟢 স্ট্যাটাস: <b>অনলাইন</b>`,
      {
        chat_id: chatId,
        message_id: sentMsg.message_id,
        parse_mode: 'HTML'
      }
    );
  }).catch((err) => console.error('[Ping Error]', err.message));
});

// ৫. /status কমান্ড
bot.onText(/^\/status$/, (msg) => {
  const chatId = msg.chat.id;
  const uptimeSeconds = Math.floor(
    (Date.now() - startTime.getTime()) / 1000
  );

  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;

  const statusText =
    `📊 <b>বট সিস্টেম স্ট্যাটাস:</b>\n\n` +
    `🟢 অবস্থা: <b>সক্রিয় (Online)</b>\n` +
    `⏱️ আপটাইম: <b>${hours} ঘণ্টা, ${minutes} মিনিট, ${seconds} সেকেন্ড</b>\n` +
    `🚀 হোস্টিং: <b>Render Cloud Platform</b>\n` +
    `🛡️ মেমরি ব্যবহার: <code>${(
      process.memoryUsage().rss / 1024 / 1024
    ).toFixed(2)} MB</code>`;

  bot.sendMessage(chatId, statusText, { parse_mode: 'HTML' });
});

// ৬. /help কমান্ড
bot.onText(/^\/help$/, (msg) => {
  const chatId = msg.chat.id;

  const helpText =
    `ℹ️ <b>সাহায্য ও নির্দেশনা:</b>\n\n` +
    `এই বটটি Render ক্লাউড সার্ভারে চালানোর জন্য তৈরি করা হয়েছে।\n\n` +
    `• <code>/start</code> - মূল মেনু ও অভিবাদন\n` +
    `• <code>/ping</code> - সার্ভার রেসপন্স টাইম\n` +
    `• <code>/status</code> - সার্ভার হেলথ ও আপটাইম\n` +
    `• <code>/help</code> - এই সাহায্য বার্তা`;

  bot.sendMessage(chatId, helpText, { parse_mode: 'HTML' });
});

// ৭. ইন্টারেক্টিভ বাটনের ক্লিক হ্যান্ডলার
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  bot.answerCallbackQuery(query.id).catch((err) =>
    console.error('[Callback Error]', err.message)
  );

  if (query.data === 'cmd_ping') {
    bot.sendMessage(
      chatId,
      '🏓 <b>Pong!</b> বট একদম সচল আছে।',
      { parse_mode: 'HTML' }
    );
  } else if (query.data === 'cmd_status') {
    const uptimeSec = Math.floor(
      (Date.now() - startTime.getTime()) / 1000
    );

    bot.sendMessage(
      chatId,
      `🟢 <b>বট স্ট্যাটাস:</b> সচল (${uptimeSec} সেকেন্ড ধরে চলন্ত)`,
      { parse_mode: 'HTML' }
    );
  } else if (query.data === 'cmd_help') {
    bot.sendMessage(
      chatId,
      '📖 যেকোনো প্রশ্ন বা সহায়তার জন্য /help লিখুন।',
      { parse_mode: 'HTML' }
    );
  }
});

// ৮. সাধারণ বার্তার স্বয়ংক্রিয় উত্তর
bot.on('message', (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const safeText = msg.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  bot.sendMessage(
    chatId,
    `📩 আপনার বার্তা পেয়েছি: <i>"${safeText}"</i>\n\n` +
    `বটের মূল মেনু দেখতে <b>/start</b> লিখুন।`,
    { parse_mode: 'HTML' }
  );
});

// ৯. এরর হ্যান্ডলিং
bot.on('polling_error', (error) =>
  console.error('[Polling Error]', error.code, error.message)
);

process.on('uncaughtException', (err) =>
  console.error('[Uncaught]', err)
);

process.on('unhandledRejection', (err) =>
  console.error('[Unhandled]', err)
);

// ১০. Express সার্ভার
const app = express();

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Telegram Bot is running on Render!',
    uptime_seconds: Math.floor(
      (Date.now() - startTime.getTime()) / 1000
    )
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('===============================================');
  console.log('🤖 Telegram Bot started successfully!');
  console.log(`🌐 HTTP Server listening on port ${PORT}`);
  console.log('===============================================');

  // ১১. Self-ping keep-alive
  if (RENDER_EXTERNAL_URL) {
    const pingUrl = `${RENDER_EXTERNAL_URL.replace(/\/$/, '')}/health`;

    setInterval(() => {
      const client = pingUrl.startsWith('https') ? https : http;

      client.get(pingUrl, (res) => {
        console.log(
          `[Keep-Alive] Pinged ${pingUrl} - Status: ${res.statusCode}`
        );
      }).on('error', (e) => {
        console.warn('[Keep-Alive Warning]', e.message);
      });
    }, 10 * 60 * 1000);
  }
});
