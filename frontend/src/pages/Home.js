import { useState } from "react";
import VoiceAssistant from "../components/VoiceAssistant";
import BookingSummary from "../components/BookingSummary";
import AgentBubble from "../components/AgentBubble";
import LoadingIndicator from "../components/LoadingIndicator";
import {
  createBooking,
  getWeatherForDate,
  getAvailableSlots,
} from "../services/api";
import { parseDate } from "chrono-node";

// --- Helpers ---

/**
 * Converts verbal numbers (e.g., "three") into integers for the database.
 */
const textToNumber = (text) => {
  const numberMap = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  const digitMatch = text.match(/\d+/);
  if (digitMatch) return parseInt(digitMatch[0]);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) if (numberMap[word]) return numberMap[word];
  return null;
};

/**
 * Normalizes voice-captured time strings into a standard "HH:MM AM/PM" format.
 */
const normalizeTime = (text) => {
  const match = text.match(/(\d+)(?::(\d+))?\s*(am|pm)?/i);
  if (!match) return text;
  let hour = match[1];
  let minutes = match[2] || "00";
  let ampm = match[3] ? match[3].toUpperCase() : "";
  if (!ampm) {
    const h = parseInt(hour);
    // Assume PM for typical dinner hours if not specified
    ampm = (h >= 1 && h <= 6) || (h >= 7 && h <= 11) ? "PM" : "AM";
  }
  return `${hour}:${minutes} ${ampm}`;
};

/**
 * Triggers the browser's native Text-to-Speech engine.
 * Cancels existing speech to prevent overlapping audio.
 */
const speak = (text) => {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  // Uses an Indian-English accent
  utterance.voice = voices.find((v) => v.lang === "en-IN") || voices[0];
  window.speechSynthesis.speak(utterance);
};

function Home() {
  const initialData = {
    numberOfGuests: 0,
    bookingDate: null,
    bookingTime: "",
    customerEmail: "",
    cuisinePreference: "",
    specialRequests: "",
    seatingPreference: "",
  };

  const [step, setStep] = useState(null); // Tracks current position in the conversation flow
  const [assistantActivated, setAssistantActivated] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const [bookingData, setBookingData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(""); // FIX: track loading message text
  const [availableSlots, setAvailableSlots] = useState([]);
  const [emailInput, setEmailInput] = useState("");

  /**
   * Resets all application states to default.
   */
  const handleReset = () => {
    setBookingData(initialData);
    setAssistantActivated(false);
    setIsSuccess(false);
    setStep(null);
    setEmailInput("");
    setLoadingMessage("");
    window.speechSynthesis.cancel();
  };

  /**
   * Starts the conversation flow and welcomes the user.
   */
  const handleActivateAssistant = () => {
    setAssistantActivated(true);
    const welcome =
      "Welcome to VocalDine! I'm your digital assistant. How can I help you today?";
    setAgentMessage(welcome);
    setStep(-1);
    setTimeout(() => speak(welcome), 300);
  };

  /**
   * Main Conversational Logic Handler
   * Processes the transcript from VoiceAssistant.js based on the current 'step'
   */
  const handleUserMessage = async (message) => {
    if (!message.trim()) return;
    const input = message.toLowerCase();

    // STEP -1: Check for Booking Intent
    if (step === -1) {
      if (
        input.includes("book") ||
        input.includes("reservation") ||
        input.includes("table")
      ) {
        const r =
          "I'd be happy to help you with a reservation! First, how many guests will be joining us?";
        setAgentMessage(r);
        speak(r);
        setStep(0);
      } else {
        const r =
          "I am a booking specialist for VocalDine. Would you like to reserve a table?";
        setAgentMessage(r);
        speak(r);
      }
    }
    // STEP 0: Capture Guest Count
    else if (step === 0) {
      const count = textToNumber(input);
      if (!count) {
        speak(
          "I'm sorry, I didn't quite catch that. How many guests for the booking?",
        );
        return;
      }
      setBookingData((prev) => ({ ...prev, numberOfGuests: count }));
      const r = `Got it, ${count} guests. And for what date should I book the table?`;
      setAgentMessage(r);
      speak(r);
      setStep(1);
    }
    // STEP 1: Process Date and Fetch Availability/Weather
    else if (step === 1) {
      const parsed = parseDate(input); // Uses chrono-node for natural language dates (e.g., "next Friday")
      if (!parsed) {
        speak("I'm sorry, I didn't recognize that date. What date was that?");
        return;
      }
      const dateStr = parsed.toISOString().split("T")[0];
      setIsLoading(true);
      setLoadingMessage("Checking availability and weather..."); // FIX: pass message
      try {
        const [weather, slots] = await Promise.all([
          getWeatherForDate(dateStr),
          getAvailableSlots(dateStr),
        ]);
        setIsLoading(false);
        setLoadingMessage("");
        if (slots.length === 0) {
          const m =
            "I've checked our calendar, and we are fully booked for that day. Could we try another date?";
          setAgentMessage(m);
          speak(m);
          return;
        }
        setAvailableSlots(slots);
        setBookingData((prev) => ({ ...prev, bookingDate: parsed }));
        const friendlyDate = parsed.toDateString();
        // Suggest seating based on weather conditions
        let advice = weather.condition.toLowerCase().includes("rain")
          ? `It might rain on ${friendlyDate}. I'd recommend indoor seating. Would you prefer indoor or outdoor?`
          : `Weather looks great for ${friendlyDate}! Would you prefer indoor or outdoor seating?`;
        setAgentMessage(advice);
        speak(advice);
        setStep(2);
      } catch (e) {
        setIsLoading(false);
        setLoadingMessage("");
        speak(
          "I had trouble checking our schedule. Could you repeat the date?",
        );
      }
    }
    // STEP 2: Handle Seating Preference
    else if (step === 2) {
      const choice = input.includes("outdoor") ? "outdoor" : "indoor";
      setBookingData((prev) => ({ ...prev, seatingPreference: choice }));
      const msg = `Excellent. We have the following times available: ${availableSlots.join(", ")}. What time works best for you?`;
      setAgentMessage(msg);
      speak(msg);
      setStep(3);
    }
    // STEP 3: Handle Time Slot Selection
    else if (step === 3) {
      const norm = normalizeTime(input);
      if (!availableSlots.includes(norm)) {
        const m = `I'm sorry, ${norm} is not available. Please choose from: ${availableSlots.join(", ")}`;
        setAgentMessage(m);
        speak(m);
        return;
      }
      setBookingData((prev) => ({ ...prev, bookingTime: norm }));
      const r = "Perfect. Which cuisine do you usually prefer for your meals?";
      setAgentMessage(r);
      speak(r);
      setStep(4);
    }
    // STEP 4: Handle Cuisine and Transition to Email
    else if (step === 4) {
      setBookingData((prev) => ({ ...prev, cuisinePreference: message }));
      const r =
        "Almost done! Please type your email address below if you'd like a confirmation receipt, or simply click skip.";
      setAgentMessage(r);
      speak(r);
      setStep(5);
    }
    // STEP 5: Capture Contact Info (Email)
    else if (step === 5) {
      const isSkip = input === "skip";
      setBookingData((prev) => ({
        ...prev,
        customerEmail: isSkip ? "" : message,
      }));
      const r =
        "Understood. Are there any special requests or dietary requirements we should know about?";
      setAgentMessage(r);
      speak(r);
      setStep(6);
    }
    // STEP 6: Capture Special Requests
    else if (step === 6) {
      setBookingData((prev) => ({ ...prev, specialRequests: message }));
      const r =
        "Excellent. Please take a moment to review your booking summary. If everything is correct, please say yes to confirm!";
      setAgentMessage(r);
      speak(r);
      setStep(7);
    }
    // STEP 7: Final Confirmation and Database Sync
    else if (step === 7) {
      if (input.includes("yes") || input.includes("confirm")) {
        setIsLoading(true);
        setLoadingMessage("Confirming your reservation..."); // FIX: pass message
        try {
          await createBooking(bookingData);
          speak(
            "Great news! Your reservation at VocalDine is confirmed. We look forward to seeing you!",
          );
          setIsSuccess(true);
          setAssistantActivated(false);
        } catch (e) {
          const err =
            e.response?.data?.message ||
            "I'm sorry, I had trouble saving your booking.";
          setAgentMessage(err);
          speak(err);
        }
        setIsLoading(false);
        setLoadingMessage("");
      } else {
        // User said no or cancel: Provide feedback then reset the app
        speak(
          "No problem, I've cancelled the reservation. Let me know if you want to try again.",
        );
        setTimeout(() => {
          handleReset();
        }, 6000); // 6-second delay to allow speech synthesis to finish
      }
    }
  };

  return (
    <div className="hero-wrapper">
      <div className="hero-text-content">
        <h1>VocalDine</h1>
        <p>Smart Voice Reservations for the Modern Diner</p>
      </div>

      <div className="app-container" style={{ marginTop: 0 }}>
        {!assistantActivated && !isSuccess ? (
          // Initial Landing View
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleActivateAssistant}
              className="btn-primary"
              style={{ padding: "20px 60px", fontSize: "1.4rem" }}
            >
              Start New Booking
            </button>
            <p style={{ color: "#ddd", marginTop: "15px" }}>
              Click to speak with our AI host
            </p>
          </div>
        ) : isSuccess ? (
          // Final Success View
          <div
            className="assistant-card success"
            style={{
              borderTop: "5px solid #2ecc71",
              padding: "40px",
              textAlign: "center",
              background: "white",
            }}
          >
            <h2>✓ Booking Confirmed!</h2>
            <p>Details have been sent to your inbox.</p>
            <button
              onClick={handleReset}
              className="btn-primary"
              style={{ marginTop: "20px" }}
            >
              Return Home
            </button>
          </div>
        ) : (
          // Active Voice Interface View
          <div className="assistant-card">
            <AgentBubble message={agentMessage} />

            {/* Manual Email Input for better reliability with emails */}
            {step === 5 && (
              <div
                className="email-input-container"
                style={{
                  margin: "20px 0",
                  background: "#f9f9f9",
                  padding: "15px",
                  borderRadius: "8px",
                }}
              >
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="typed-input"
                  style={{ marginBottom: "10px" }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => handleUserMessage(emailInput)}
                    className="btn-primary"
                    style={{ flex: 1 }}
                    disabled={!emailInput.includes("@")}
                  >
                    Send
                  </button>
                  <button
                    onClick={() => handleUserMessage("skip")}
                    className="btn-reset"
                    style={{ flex: 1, marginTop: 0 }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            {/* FIX: Pass loadingMessage to LoadingIndicator */}
            {isLoading ? (
              <LoadingIndicator message={loadingMessage} />
            ) : (
              <>
                {step !== 5 && (
                  <VoiceAssistant onUserMessage={handleUserMessage} />
                )}
                {step === 7 && <BookingSummary data={bookingData} />}
              </>
            )}
            <button
              onClick={handleReset}
              className="btn-reset"
              style={{ marginTop: "15px", opacity: 0.8 }}
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>

      {/* Hero Features Section */}
      {!assistantActivated && (
        <div className="features-section">
          <div className="feature-info-card">
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎙️</div>
            <h3>Voice Powered</h3>
            <p>Speak naturally to reserve your table in seconds.</p>
          </div>
          <div className="feature-info-card">
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🌦️</div>
            <h3>Weather Aware</h3>
            <p>Real-time suggestions for indoor or outdoor seating.</p>
          </div>
          <div className="feature-info-card">
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📧</div>
            <h3>Instant Receipt</h3>
            <p>Emailed confirmation receipts sent automatically.</p>
          </div>
        </div>
      )}

      {/* Footer Section */}
      <footer className="home-footer">
        <p>
          © 2026 VocalDine | Fast & Simple Table Reservations
        </p>
      </footer>
    </div>
  );
}

export default Home;