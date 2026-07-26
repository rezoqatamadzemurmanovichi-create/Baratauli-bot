const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key არ არის მითითებული Environment Variables-ში.' });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    res.json({ reply: text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'შეცდომა მოთხოვნის დამუშავებისას: ' + error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
