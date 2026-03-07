import { useEffect } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

/**
 * Component to handle voice-to-text processing using the browser's Web Speech API
 * @param {Function} onUserMessage - Callback function to process the final transcript
 */
const VoiceAssistant = ({ onUserMessage }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!listening && transcript.trim().length > 0) {
      onUserMessage(transcript.trim());
      resetTranscript();
    }
  }, [listening, transcript, onUserMessage, resetTranscript]);

  if (!browserSupportsSpeechRecognition) {
    return (
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.72rem",
        color: "var(--plasma)",
        letterSpacing: "0.1em",
        padding: "12px",
        border: "1px solid rgba(255,60,172,0.3)",
        borderRadius: "2px"
      }}>
        // Browser does not support speech recognition
      </p>
    );
  }

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ language: "en-IN" });
    }
  };

  return (
    <div className="voice-ui">
      <button
        className={`btn-talk ${listening ? "pulse-active" : ""}`}
        onClick={handleMicClick}
      >
        {listening ? "⬛ Stop" : "🎙 Push to Talk"}
      </button>

      <p className="status" style={{ color: listening ? "var(--green)" : "var(--text-muted)" }}>
        <span className={`status-dot ${listening ? "status-listening" : "status-off"}`} />
        {listening ? "Mic Active" : "Click to speak"}
      </p>

      {transcript && (
        <div className="preview">
          &gt; {transcript}
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;