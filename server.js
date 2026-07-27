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
    body { font-family: sans-serif; background: #111; color: white; margin: 0; padding: 20px; height: 100dvh; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; }
      #chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  border: 1px solid #444;
  padding: 12px;
  display: flex;
  flex-direction: column;
}
    .msg { margin: 8px 0; padding: 8px 12px; border-radius: 6px; max-width: 100%; }
    .user { background: #007bff; align-self: flex-end; margin-left: auto; }
    .bot { background: #222; align-self: flex-start; }
    .input-area { display: flex; gap: 8px; flex-shrink: 0; }
    input { flex: 1; padding: 12px; border-radius: 6px; border: 1px solid #444; background: #222; color: white; }
    button { padding: 12px 20px; border-radius: 6px; border: none; background: #28a745; color: white; font-weight: bold; cursor: pointer; }
  </style>
</head>
<body>
  <h2>ბარათაული ბოტი 🤖</h2>
  <div id="chat">
  <div class="msg bot">
    👋 გამარჯობა! მე ვარ ბარათაულის AI ასისტენტი. მკითხე ბარათაულის შესახებ ყველაფერი.
  </div>
</div>
  <div class="input-area">
    <input type="text" id="userInput" placeholder="ჩაწერე ტექსტი...">
    <button onclick="sendMsg()">გაგზავნა</button>
  </div>

  <script>function fixHeight() {
  document.body.style.height = window.visualViewport.height + 'px';
}

window.visualViewport.addEventListener('resize', fixHeight);
fixHeight();
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
    if (
  message.toLowerCase().includes('ამინდი') ||
  message.toLowerCase().includes('ტემპერატურა') ||
  message.toLowerCase().includes('პროგნოზი') ||
  message.toLowerCase().includes('მზის ამოსვლა') ||
  message.toLowerCase().includes('მზის ჩასვლა') ||
  message.toLowerCase().includes('მთვარის ამოსვლა') ||
  message.toLowerCase().includes('მთვარის ჩასვლა') ||
  message.toLowerCase().includes('weather')
) {
  const latitude = 41.6758;
  const longitude = 42.2028;

  const weatherResponse = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset` +
    `&timezone=Asia%2FTbilisi&forecast_days=7`
  );

  if (!weatherResponse.ok) {
    return res.status(500).json({
      error: 'ამინდის მონაცემების მიღება ვერ მოხერხდა.'
    });
  }

  const data = await weatherResponse.json();

  const weatherNames = {
    0: 'მოწმენდილი ცა ☀️',
    1: 'უმეტესად მოწმენდილი 🌤️',
    2: 'ნაწილობრივ მოღრუბლული ⛅',
    3: 'მოღრუბლული ☁️',
    45: 'ნისლი 🌫️',
    48: 'ყინვიანი ნისლი 🌫️',
    51: 'მსუბუქი ჟინჟღლი 🌦️',
    53: 'ჟინჟღლი 🌦️',
    55: 'ძლიერი ჟინჟღლი 🌧️',
    61: 'მსუბუქი წვიმა 🌦️',
    63: 'წვიმა 🌧️',
    65: 'ძლიერი წვიმა 🌧️',
    71: 'მსუბუქი თოვა 🌨️',
    73: 'თოვა ❄️',
    75: 'ძლიერი თოვა ❄️',
    77: 'თოვლის მარცვლები 🌨️',
    80: 'ხანმოკლე მსუბუქი წვიმა 🌦️',
    81: 'ხანმოკლე წვიმა 🌧️',
    82: 'ძლიერი თავსხმა ⛈️',
    85: 'ხანმოკლე თოვა 🌨️',
    86: 'ძლიერი ხანმოკლე თოვა ❄️',
    95: 'ჭექა-ქუხილი ⛈️',
    96: 'ჭექა-ქუხილი და სეტყვა ⛈️',
    99: 'ძლიერი ჭექა-ქუხილი და სეტყვა ⛈️'
  };

  const dayNames = [
    'კვირა',
    'ორშაბათი',
    'სამშაბათი',
    'ოთხშაბათი',
    'ხუთშაბათი',
    'პარასკევი',
    'შაბათი'
  ];

  const formatTime = (value) => {
    if (!value) return 'მონაცემი არ არის';

    return new Intl.DateTimeFormat('ka-GE', {
      timeZone: 'Asia/Tbilisi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(value));
  };

  const formatMoonTime = (value) => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      return 'ამ დღეს არ ფიქსირდება';
    }

    return new Intl.DateTimeFormat('ka-GE', {
      timeZone: 'Asia/Tbilisi',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(value);
  };

  const forecast = data.daily.time.map((dateString, index) => {
    const date = new Date(`${dateString}T12:00:00+04:00`);
    const dayName = dayNames[date.getDay()];

    const moonTimes = SunCalc.getMoonTimes(
      date,
      latitude,
      longitude
    );

    const condition =
      weatherNames[data.daily.weather_code[index]] ||
      'ამინდის მდგომარეობა უცნობია';

    return (
      `\n📅 ${dayName}, ${dateString}\n` +
      `🌤️ ${condition}\n` +
      `🌡️ ${data.daily.temperature_2m_min[index]}°C — ${data.daily.temperature_2m_max[index]}°C\n` +
      `🌧️ წვიმის ალბათობა: ${data.daily.precipitation_probability_max[index] ?? 0}%\n` +
      `🌅 მზის ამოსვლა: ${formatTime(data.daily.sunrise[index])}\n` +
      `🌇 მზის ჩასვლა: ${formatTime(data.daily.sunset[index])}\n` +
      `🌙 მთვარის ამოსვლა: ${formatMoonTime(moonTimes.rise)}\n` +
      `🌘 მთვარის ჩასვლა: ${formatMoonTime(moonTimes.set)}`
    );
  }).join('\n');

  const currentCondition =
    weatherNames[data.current.weather_code] ||
    'ამინდის მდგომარეობა უცნობია';

  const reply =
    `📍 ბარათაულის ამინდი\n\n` +
    `🌤️ მდგომარეობა: ${currentCondition}\n` +
    `🌡️ ტემპერატურა: ${data.current.temperature_2m}°C\n` +
    `🤗 შეგრძნებით: ${data.current.apparent_temperature}°C\n` +
    `💨 ქარი: ${data.current.wind_speed_10m} კმ/სთ\n\n` +
    `📆 7-დღიანი პროგნოზი:\n${forecast}`;

  return res.json({ reply });
}
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key არ არის მითითებული Environment Variables-ში.' });
    }
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const prompt = `
    - პასუხი იყოს მოკლე, გასაგები და მაქსიმუმ 3-5 წინადადება, თუ მომხმარებელი დეტალურ პასუხს არ ითხოვს.
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
