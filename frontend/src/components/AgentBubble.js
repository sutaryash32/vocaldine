/**
 * UI Component to display the AI Assistant's messages
 * @param {string} message - The current text response from the agent
 */
const AgentBubble = ({ message }) => (
  <div className="agent-bubble">
    <p>
      <strong>// VOCAL.AI</strong>
      {message}
    </p>
  </div>
);

export default AgentBubble;