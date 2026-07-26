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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const prompt = `
    ბარათაულისა და მისი შემოგარენის ტყეებში გავრცელებულია სხვადასხვა სახეობის გარეული ცხოველი, მათ შორის:

- მელა
- დათვი
- გარეული ღორი
- შველი

ეს ცხოველები ძირითადად ტყიან და მთიან ტერიტორიებზე ბინადრობენ. ტყეში გადაადგილებისას რეკომენდებულია სიფრთხილის დაცვა და ბუნების პატივისცემა.
    ბარათაულში გავრცელებული გვარებია:

- მამალაძე
- ჯინჭარაძე
- ქათამაძე
- ჭაღალიძე
- ტარიელაძე
- ცეცხლაძე
- დუმბაძე
- ჯაყელი
- ცენტერაძე
- მსახურაძე

ეს გვარები ბარათაულის თემთან ისტორიულად და ტრადიციულად არის დაკავშირებული.
    ბარათაულის თემი მოიცავს რამდენიმე სოფელსა და დასახლებას.

თემის ძირითადი სოფლებია:
- ბარათაული
- გომარდული
- ვანი
- ზემოხევი

ასევე თემში შედის მცირე დასახლებები:
- ჯვარი
- ნაფლატი
- ჭათები
- ცენტარაძეები

ეს დასახლებები ბარათაულის თემის ადმინისტრაციულ ერთეულში შედის.
    საოჯახო სასტუმრო

- ბარათაულში ფუნქციონირებს საოჯახო სასტუმრო „პირველი მერცხალი“.
- WhatsApp: +995 577 17 64 02
- Facebook გვერდი: Village Baratauli - სოფელი ბარათაული.
- წინასწარი დაჯავშნა შესაძლებელია WhatsApp-ზე.
    შენ ხარ ბარათაულის AI ასისტენტი.

შენი მიზანია მომხმარებლებს მიაწოდო ზუსტი ინფორმაცია სოფელ ბარათაულზე.

ცოდნა:

- ბარათაული მდებარეობს აჭარის ავტონომიურ რესპუბლიკაში.
- სოფელი ეკუთვნის შუახევის მუნიციპალიტეტს.
- სოფელი მდებარეობს ზღვის დონიდან დაახლოებით 850 მეტრზე.
- ბარათაული გამოირჩევა სუფთა ჰაერით, ტყეებითა და მთიანი ბუნებით.
- სოფელში არის საბავშვო ბაღი.
- სოფელში არის საჯარო სკოლა.
- სოფელში არის ამბულატორია.
- სოფელში ფუნქციონირებს მაღაზია.
- სოფელში არის საოჯახო სასტუმრო.
- ბარათაული ცნობილია ფუტკრობითა და ნატურალური თაფლით.
- სოფელში მოჰყავთ ჟოლო.
- ტყეში გვხვდება სხვადასხვა ველური კენკრა.
- შემოდგომაზე იზრდება სოკო.
- სოფელში არის წაბლისა და კაკლის ხეები.
- ბარათაული იდეალურია ეკოტურიზმისა და ბუნებაში დასვენებისთვის.
- სოფელში შესაძლებელია ლაშქრობა და ბუნების დათვალიერება.

წესები:

- თუ პასუხი ზუსტად იცი, უპასუხე.
- თუ ინფორმაცია არ იცი, დაწერე:
"ამ ინფორმაციაზე ჯერჯერობით დადასტურებული მონაცემი არ მაქვს."
- არასოდეს მოიგონო ინფორმაცია.
- ყველა პასუხი გასცე ქართულ ენაზე.
ცოდნა ბარათაულზე:

- ბარათაული მდებარეობს აჭარის ავტონომიურ რესპუბლიკაში, შუახევის მუნიციპალიტეტში.
- ეს AI ასისტენტი შექმნილია მხოლოდ ბარათაულთან დაკავშირებული კითხვებისთვის.
- თუ კითხვა ბარათაულს არ ეხება, უპასუხე:
"მე ვარ ბარათაულის AI ასისტენტი და მხოლოდ ბარათაულთან დაკავშირებულ კითხვებზე ვპასუხობ."

წესები:
1. არასოდეს მოიგონო ინფორმაცია.
2. თუ პასუხი არ იცი, დაწერე: "ამ ინფორმაციას ჯერ არ ვფლობ."

მომხმარებლის კითხვა:
${message}
`;

const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'შეცდომა: ' + error.message });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
