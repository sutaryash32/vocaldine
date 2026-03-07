/**
 * Futuristic loading indicator with animated dots
 * @param {string} message - Status text to display
 */
const LoadingIndicator = ({ message }) => (
  <div style={{ margin: "20px 0", textAlign: "center" }}>
    <div className="loading-text">
      {message || "Processing"}
      <span style={{ display: "inline-block", animation: "pulse 1s 0s infinite" }}>.</span>
      <span style={{ display: "inline-block", animation: "pulse 1s 0.2s infinite" }}>.</span>
      <span style={{ display: "inline-block", animation: "pulse 1s 0.4s infinite" }}>.</span>
    </div>
  </div>
);

export default LoadingIndicator;