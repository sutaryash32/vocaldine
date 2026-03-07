# 🎙️ VocalDine

> **Voice-Powered Restaurant Reservations — Reborn.**

A full-stack MERN application where you book a restaurant table by simply *talking*. No forms. No clicks. Just speak naturally and VocalDine's AI assistant handles everything — from checking the weather to sending your confirmation email.

---

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)
![Author](https://img.shields.io/badge/Built%20by-Sandeep%20Mukku-orange.svg)
![Stack](https://img.shields.io/badge/Stack-MERN-green.svg)

---

## ✨ What Makes VocalDine Different

| Feature | Description |
|--------|-------------|
| 🎙️ **Voice First** | Speak naturally — "table for 3 next Friday evening" just works |
| 🌦️ **Weather Aware** | Fetches real-time weather and suggests indoor/outdoor seating |
| 📧 **Auto Confirmation** | Email receipt sent instantly after booking |
| 📊 **Admin Analytics** | Live dashboard with charts, CSV export, and booking management |
| 🔒 **Protected Admin** | Password-gated admin portal |
| 🤖 **Smart NLP** | Understands dates like "tomorrow", "next Monday", spoken numbers like "three guests" |

---

## 🧰 Tech Stack

```
Frontend    →  React 19, Web Speech API, react-speech-recognition, Chart.js, Axios
Backend     →  Node.js, Express 5
Database    →  MongoDB (local) + Mongoose
Email       →  Nodemailer (Ethereal SMTP)
Weather     →  OpenWeatherMap API
NLP         →  chrono-node (natural language date parsing)
```

---

## 📦 Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally
- OpenWeatherMap free API key → [openweathermap.org](https://openweathermap.org/api)

---

### 1. Clone the Repository

```bash
git clone https://github.com/sandeepmukku12/vocaldine.git
cd vocaldine
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (use `.env.example` as reference):

```env
PORT=8082
MONGO_URI=mongodb://localhost:27017/vocaldine
OPEN_WEATHER_API_KEY=your_key_here
```

Start MongoDB locally:

```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

Start the backend server:

```bash
npm run dev
```

> ✅ You should see: `VocalDine server running successfully on PORT: 8082`

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:8082/api
```

Start the React app:

```bash
npm start
```

> ✅ Open [http://localhost:3000](http://localhost:3000) in your browser

---

## 🗨️ How It Works — Full Conversation Flow

Once you click **Start New Booking**, the voice assistant takes over. Here's exactly what happens step by step:

---

### Step 1 — Intent Detection
The assistant greets you and waits for a booking intent.

```
Agent  →  "Welcome to VocalDine! How can I help you today?"
You    →  "I'd like to book a table"
```

> Triggers on keywords: `book`, `reservation`, `table`

---

### Step 2 — Guest Count
```
Agent  →  "How many guests will be joining us?"
You    →  "Three" or "3"
```

> Understands both spoken words ("three") and digits ("3")

---

### Step 3 — Date Selection + Weather + Availability Check
```
Agent  →  "And for what date?"
You    →  "Next Saturday" or "January 26th" or "tomorrow"
```

> Behind the scenes, VocalDine simultaneously:
> - Parses your natural language date via **chrono-node**
> - Fetches **real weather** from OpenWeatherMap
> - Checks **available time slots** from the database

---

### Step 4 — Seating Suggestion (Weather Aware)
```
# If rain expected:
Agent  →  "It might rain on Saturday. I'd recommend indoor seating.
           Would you prefer indoor or outdoor?"

# If clear weather:
Agent  →  "Weather looks great! Indoor or outdoor seating?"

You    →  "Indoor" or "Outdoor"
```

---

### Step 5 — Time Slot Selection
```
Agent  →  "We have: 12:00 PM, 1:00 PM, 7:00 PM, 8:00 PM, 9:00 PM available.
           What time works for you?"
You    →  "7 PM" or "seven"
```

> Only available slots are offered — booked slots are automatically excluded

---

### Step 6 — Cuisine Preference
```
Agent  →  "Which cuisine do you prefer?"
You    →  "Indian" or "Italian" or "Continental"
```

---

### Step 7 — Email (Optional)
```
Agent  →  "Type your email for a confirmation receipt, or click Skip."
```

> This step uses a typed input instead of voice for accuracy with email addresses

---

### Step 8 — Special Requests
```
Agent  →  "Any special requests or dietary requirements?"
You    →  "Window seat please" or "No nuts, I'm allergic" or "None"
```

---

### Step 9 — Review & Confirm
```
Agent  →  "Please review your booking summary. Say yes to confirm!"
```

> A full summary table is shown on screen. Say **"yes"** or **"confirm"** to proceed,
> or say **"no"** / **"cancel"** to restart.

---

### Step 10 — Booking Saved + Email Sent
```
Agent  →  "Your reservation at VocalDine is confirmed.
           We look forward to seeing you!"
```

> - Booking saved to **MongoDB**
> - Confirmation email sent via **Nodemailer**
> - Preview URL printed in backend console (Ethereal test inbox)

---

## 🔒 Admin Dashboard

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)

**Access Code:** `vocaldine2026`

### What you can do:
- 📋 View all live reservations in a table
- 📊 See cuisine distribution chart
- 🏆 Track total bookings, top cuisine, busiest time slot
- ❌ Cancel any booking (with per-row loading state)
- 📥 Export all data to CSV

---

## 🏗️ Project Structure

```
vocaldine/
│
├── backend/
│   ├── config/
│   │   ├── db.js                  # MongoDB connection
│   │   └── weather.js             # OpenWeatherMap API integration
│   ├── controllers/
│   │   └── booking.controller.js  # All booking logic + email + analytics
│   ├── models/
│   │   └── booking.model.js       # Mongoose schema
│   ├── routes/
│   │   ├── booking.route.js       # Booking CRUD routes
│   │   ├── weather.route.js       # Weather proxy route
│   │   └── index.js               # Route aggregator
│   ├── .env                       # ← You create this
│   ├── .env.example               # Template
│   └── server.js                  # Express app entry point
│
├── frontend/
│   ├── public/
│   │   ├── index.html             # Browser tab title
│   │   └── manifest.json          # PWA manifest
│   └── src/
│       ├── components/
│       │   ├── AgentBubble.js     # AI message display
│       │   ├── BookingSummary.js  # Pre-confirm summary table
│       │   ├── LoadingIndicator.js # Async feedback
│       │   └── VoiceAssistant.js  # Mic input + speech recognition
│       ├── pages/
│       │   ├── Home.js            # Main booking flow (state machine)
│       │   └── AdminDashboard.js  # Admin portal
│       ├── services/
│       │   └── api.js             # All Axios API calls
│       ├── App.js                 # Router + Navigation
│       ├── index.css              # Full cyberpunk UI theme
│       ├── .env                   # ← You create this
│
│
├── README.md
└── LICENSE
```

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/bookings` | Create a new booking |
| `GET` | `/api/bookings` | Get all bookings |
| `GET` | `/api/bookings/:id` | Get booking by ID |
| `DELETE` | `/api/bookings/:id` | Delete a booking |
| `GET` | `/api/bookings/available-slots?date=` | Get available time slots for a date |
| `GET` | `/api/bookings/analytics` | Get aggregated analytics data |
| `GET` | `/api/weather?date=&location=` | Get weather forecast |
| `GET` | `/api/health` | Backend health check |

---

## ⚠️ Known Limitations

- Voice recognition requires **Chrome** or a Chromium-based browser for best results
- Weather forecasts only available for the **next 5 days** (OpenWeatherMap free tier)
- Admin password is **frontend-only** — not suitable for production security
- Speech accuracy may vary with background noise or strong accents

---

## 🚀 Future Enhancements

- [ ] OpenAI GPT integration for free-flowing conversation
- [ ] Hinglish (Hindi + English) voice support
- [ ] SMS/WhatsApp confirmations via Twilio
- [ ] JWT-based admin authentication
- [ ] Live menu integration with POS systems
- [ ] Multi-restaurant support

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## ❤️ Built With Love

**VocalDine** was designed, built, and polished by **Sandeep Mukku**

> *"No forms. No friction. Just your voice."*

---
"# vocaldine" 
