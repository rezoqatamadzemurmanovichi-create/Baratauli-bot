const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(express.json());

// პირდაპირ HTML-ის დაბრუნება ფაილების გარეშე
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baratauli Bot</title>
  <style>
    body { font-family: sans-serif; background: #121212; color: white; display: flex; flex-direction: column; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    #chat { flex: 1; overflow-y: auto; border: 1px solid #333; padding: 10px; border-radius: 8px; margin-bottom: 10px; }
    .msg { margin: 8px 0; padding: 8px 12px; border-radius: 6px; max-width: 80%; }
    .user { background: #007bff; align-self: flex-end; margin-left: auto; }
    .bot { background: #222; align-self: flex-start; }
    .input-area { display: flex; gap: 8px; }
    input { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #222; color: white; }
    button { padding: 12px 20px; border-radius: 6px; border: none; background: #28a745; color: white; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <h2>ბარათაული ბოტი 🤖</h2>
  <div id="chat"></div>
  <div class="input-area">
    <input type="text" id="userInput" placeholder="ჩაწერე ტექსტი...">
    <button onclick="sendMsg()">გაგზავნა</button>
  </div>

  <script>
    async function sendMsg() {
      const input = document.getElementById('userInput');
      const chat = document.getElementById('chat');
      const msg = input.value.trim();
      if (!msg) return;

      chat.innerHTML += '<div class="msg user">' + msg + '</div>';
      input.value = '';
      chat.scrollTop = chat.scrollHeight;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        chat.innerHTML += '<div class="msg bot">' + (data.reply || data.error) + '</div>';
      } catch (e) {
        chat.innerHTML += '<div class="msg bot">შეცდომა კავშირისას.</div>';
      }
      chat.scrollTop = chat.scrollHeight;
    }
  </script>
</body>
</html>
  `);
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key არ არის მითითებული Environment Variables-ში.' });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'შეცდომა: ' + error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
