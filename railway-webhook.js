const express = require('express');
const { Pool } = require('pg');
const axios = require('axios');

const app = express();
app.use(express.json());

// Database connection (Railway will auto-fill DATABASE_URL)
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// WhatsApp verification endpoint (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// WhatsApp message handler (POST)
app.post('/webhook', async (req, res) => {
  console.log('📩 Received webhook:', JSON.stringify(req.body, null, 2));
  
  const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message) return res.sendStatus(200);
  
  const phone = message.from;
  const text = message.text?.body?.trim();
  
  try {
    // Your logic here (we'll expand this later)
    await sendWhatsApp(phone, `You said: ${text}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error:', err);
    res.sendStatus(500); // WhatsApp will retry
  }
});

// Helper function to send messages
async function sendWhatsApp(phone, message) {
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
  await axios.post(url, {
    messaging_product: 'whatsapp',
    to: phone,
    text: { body: message }
  }, {
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` }
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
