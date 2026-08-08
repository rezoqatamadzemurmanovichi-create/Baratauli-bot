const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const SunCalc = require('suncalc');
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
  <h2>ბარათაული AI  🤖</h2>
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
    === GEORGIA ===

Georgia is located at the crossroads of Europe and Asia.

Capital city: Tbilisi

Official language: Georgian

Famous Georgian dishes:
- Khachapuri
- Khinkali
- Mtsvadi (barbecue)
- Chakapuli
- Elarji

Georgian wine:
- Georgia is considered one of the oldest wine-producing countries in the world.
- Traditional Qvevri wine-making is recognized by UNESCO.

Georgian traditions:
- Hospitality
- Traditional feast (Supra)
- Toastmaster (Tamada)

Famous places in Georgia:
- Tbilisi
- Mtskheta
- Kazbegi
- Svaneti
- Batumi

=== ADJARA ===

Adjara is an autonomous region of Georgia.

Main city: Batumi

Adjara is famous for:
- The Black Sea coast
- Mountain landscapes
- Adjarian Khachapuri
- Traditional folklore and dances

=== BARATAULI ===

Baratauli is a village located in Shuakhevi Municipality, Adjara, Georgia.

Elevation:
Approximately 900 meters above sea level.

Baratauli offers:
- Beautiful mountain scenery
- Forests and wildlife
- Natural springs
- Traditional watermills
- Family guesthouses
- Hiking opportunities
- Local agricultural products

Transportation:
(Add transportation information here)

Weather:
(The weather system provides live weather information.)
    === GEORGIA ===

საქართველო მდებარეობს ევროპისა და აზიის გასაყარზე.

დედაქალაქი: თბილისი

ოფიციალური ენა: ქართული

ცნობილი კერძები:
- ხაჭაპური
- ხინკალი
- მწვადი
- ჩაქაფული
- ელარჯი

ქართული ღვინო:
- საქართველო ღვინის სამშობლოდ ითვლება.
- ქვევრის ღვინის კულტურა UNESCO-ს სიაშია.

ქართული ტრადიციები:
- სტუმართმოყვარეობა
- სუფრა
- თამადა

საქართველოს ღირსშესანიშნაობები:
- თბილისი
- მცხეთა
- ყაზბეგი
- სვანეთი
- ბათუმი

=== ADJARA ===

აჭარა საქართველოს ავტონომიური რესპუბლიკაა.

მთავარი ქალაქი: ბათუმი

ცნობილია:
- შავი ზღვის სანაპიროთი
- მთიანი აჭარით
- აჭარული ხაჭაპურით
- აჭარული ფოლკლორით

=== BARATAULI ===

ბარათაული მდებარეობს შუახევის მუნიციპალიტეტში.

სიმაღლე:
დაახლოებით 900 მეტრი ზღვის დონიდან.

ბარათაულში არის:
- საბავშვო ბაღი
- სკოლა
- წისქვილები
- წყაროები
- საოჯახო სასტუმროები
- მდინარე
- ტყეები
- ლაშქრობის მარშრუტები

ტრანსპორტი:
(აქ ჩასვი მარშრუტკების ინფორმაცია)

ამინდი:
(აქ უკვე შენი ამინდის კოდი მუშაობს)
    🇬🇪 Georgia

Georgia is a country located at the crossroads of Europe and Asia. It is famous for its hospitality, ancient culture, mountains, the Black Sea coast, and traditional cuisine.

Popular Georgian dishes include:
• Khachapuri
• Khinkali
• Mtsvadi (barbecue)
• Chakapuli
• Elarji
• Adjarian Khachapuri

Guests are treated with great respect in Georgian culture.

Visitors to Baratauli can experience both the traditions of Adjara and the rich Georgian cuisine.
    
  
    🇬🇪 საქართველო

საქართველო მდებარეობს ევროპისა და აზიის გასაყარზე და ცნობილია სტუმართმოყვარეობით, უძველესი კულტურით, მთებით, ზღვითა და ტრადიციული სამზარეულოთი.

ცნობილი ქართული კერძებია:
• ხაჭაპური
• ხინკალი
• მწვადი
• ჩაქაფული
• ელარჯი
• აჭარული ხაჭაპური

ქართული ტრადიციების მიხედვით სტუმარი განსაკუთრებული პატივისცემით სარგებლობს.

თუ ტურისტი სტუმრობს ბარათაულს, მას შეუძლია გაეცნოს როგორც აჭარულ კულტურას, ასევე ქართული სამზარეულოს მრავალფეროვნებას.
    📸 ბარათაულის ფოტოებისა და ვიდეოების გაზიარება

თუ გაქვთ ბარათაულში გადაღებული ლამაზი ფოტოები ან ვიდეოები, გამოგვიგზავნეთ.

თქვენი თანხმობით, გადამოწმების შემდეგ, ისინი შეიძლება გამოქვეყნდეს ბარათაულის ოფიციალურ Facebook გვერდზე, რათა უფრო მეტმა ადამიანმა გაიცნოს ჩვენი ულამაზესი სოფელი.

გმადლობთ მხარდაჭერისთვის!
📸 Share Your Photos and Videos

If you have beautiful photos or videos taken in Baratauli, please send them to us.

With your permission, and after review, they may be published on the official Baratauli Facebook page to help more people discover our beautiful village.

Thank you for your support!
    🚐 ტრანსპორტი

ბარათაულსა და ბათუმს შორის ყოველდღიურად მოძრაობს მარშრუტკა.

📍 ბათუმიდან გამგზავრება:
ძველი ბათუმის ავტოსადგურიდან (23-ე საჯარო სკოლასთან ახლოს).

გამგზავრების დრო:
• 11:00
• 15:00

📍 ბარათაულიდან გამგზავრება:
• 08:00
• 14:00

მძღოლების საკონტაქტო ნომრები:

• რეზო ქათამაძე – +995 599 126 424
• ზებური ტარიელაძე – +995 557 986 263
• ზურაბ ქათამაძე – +995 593 591 590

⚠️ განრიგი და საკონტაქტო ნომრები შეიძლება დროთა განმავლობაში შეიცვალოს, ამიტომ მგზავრობამდე სასურველია მძღოლთან დაკავშირება.

თუ მომხმარებელი კითხულობს, როგორ მივიდეს ბარათაულში ან რა ტრანსპორტი მოძრაობს, მიაწოდე ეს ინფორმაცია.
🚐 Transportation

There is a daily minibus service between Batumi and Baratauli.

📍 Departure from Batumi:
Old Batumi Bus Station (near Public School No. 23).

Departure times:
• 11:00 AM
• 3:00 PM

📍 Departure from Baratauli:
• 8:00 AM
• 2:00 PM

Drivers' contact numbers:

• Rezo Katamadze – +995 599 126 424
• Zeburi Tarieladze – +995 557 986 263
• Zurab Katamadze – +995 593 591 590

⚠️ The schedule and contact numbers may change over time, so it is recommended to contact the driver before traveling.

If a user asks how to get to Baratauli or about public transportation, provide this information.
    ბარათაულში დღემდე ფუნქციონირებს ორი ტრადიციული წყლის წისქვილი. ისინი წყლის ენერგიით მუშაობს და აქ ადგილობრივებსა და სტუმრებს შეუძლიათ სიმინდის დაფქვა ტრადიციული მეთოდით. ეს ბარათაულის ერთ-ერთი საინტერესო და გამორჩეული ღირსშესანიშნაობაა.
    Baratauli is home to two traditional watermills that are still in operation. Powered by flowing water, they are used to grind corn using traditional methods. These watermills are among the village's unique cultural and historical attractions.
    ბარათაულში მიედინება მდინარე ვანისწყალი. სტადიონთან ახლოს მდებარეობს ბუნებრივი საცურაო ადგილი, სადაც ზაფხულის ცხელ დღეებში ადგილობრივები და სტუმრები ხშირად ბანაობენ და გრილდებიან.
    The Vanistskali River flows through Baratauli. Near the village stadium, there is a natural swimming area where locals and visitors enjoy swimming and cooling off during the summer.
    ბარათაულში მდებარეობს ამირან მამალაძის სახელობის საჯარო სკოლა. სკოლას სახელი ეწოდა 2008 წლის რუსეთ-საქართველოს ომში დაღუპული ქართველი გმირის, ამირან მამალაძის პატივსაცემად.
    Baratauli is home to the Amiran Mamaladze Public School. The school is named in honor of Amiran Mamaladze, a Georgian hero who lost his life during the 2008 Russia–Georgia War.
    ამირან მამალაძე — ბარათაულის ქართველი გმირია. იგი 2008 წლის რუსეთ-საქართველოს ომის დროს დაიღუპა სამშობლოს დაცვისას.

თუ მომხმარებელი კითხულობს:
- ვინ არის ამირან მამალაძე?
- ბარათაულის გმირი
- 2008 წლის ომის გმირი

უპასუხე:

„ამირან მამალაძე არის ბარათაულის ქართველი გმირი, რომელიც 2008 წლის რუსეთ-საქართველოს ომის დროს დაიღუპა სამშობლოს დაცვისას. ბარათაული ამაყობს მისი ხსოვნით და პატივს მიაგებს მის გმირობას.“
If the user asks about Amiran Mamaladze, answer:

"Amiran Mamaladze is a Georgian hero from Baratauli who lost his life during the 2008 Russia–Georgia War while defending his homeland. The people of Baratauli honor his memory and sacrifice."
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
რატომ უნდა ვესტუმრო ბარათაულს?

ბარათაული გამორჩეულია თავისი ულამაზესი ბუნებით, სუფთა ჰაერითა და სიმშვიდით. სოფელი მთლიანად ბუნებაშია ჩაფლული და იდეალური ადგილია მათთვის, ვისაც ქალაქის ხმაურისგან დასვენება სურს.

ბარათაულში თითქმის ყველა კუთხეში შეხვდებით ცივ, სუფთა სასმელ წყაროებს. ზაფხულში სოფელი მდიდარია სხვადასხვა ხილით — ბალი, ჟოლო, ვაშლი, მსხალი, ქლიავი და სხვა სეზონური ხილით.

სტუმრებს შეუძლიათ დატკბნენ მთის ხედებით, ბუნებაში სეირნობით, ადგილობრივი სტუმართმოყვარეობითა და მშვიდი გარემოთი.
Why should I visit Baratauli?

Baratauli is surrounded by beautiful nature, fresh mountain air, and a peaceful atmosphere. It is an ideal destination for visitors looking to relax away from busy city life.

The village has many natural cold spring water sources. During summer, visitors can enjoy seasonal fruits such as cherries, raspberries, apples, pears, plums, and more.

Baratauli offers beautiful mountain scenery, peaceful walks in nature, and warm local hospitality.

წესები:

- თუ პასუხი ზუსტად იცი, უპასუხე.
- თუ ინფორმაცია არ იცი, დაწერე:
"ამ ინფორმაციაზე ჯერჯერობით დადასტურებული მონაცემი არ მაქვს."
- არასოდეს მოიგონო ინფორმაცია.
- თუ მომხმარებელი ქართულად წერს, უპასუხე ქართულად.
- თუ მომხმარებელი ინგლისურად წერს, უპასუხე ინგლისურად.
- თუ მომხმარებელი სხვა ენაზე წერს, უპასუხე იმავე ენაზე, თუ შესაძლებელია.
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
