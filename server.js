const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });
    res.json({ reply: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'შეცდომა მოთხოვნის დამუშავებისას' });
  }
});

app.listen(port, () => {
  console.log(`სერვერი ჩაირთო პორტზე: ${port}`);
});
