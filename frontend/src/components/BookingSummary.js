/**
 * Component to display a structured summary of the booking data before final confirmation.
 * @param {Object} data - The collected booking state from the Home component
 */
const BookingSummary = ({ data }) => {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        letterSpacing: "0.2em",
        color: "var(--cyan)",
        textTransform: "uppercase",
        marginBottom: "12px",
        textAlign: "left"
      }}>
        // Reservation Summary
      </p>
      <table className="summary-table">
        <tbody>
          <tr>
            <td className="label">Guests</td>
            <td>{data.numberOfGuests}</td>
          </tr>
          <tr>
            <td className="label">Date</td>
            <td>{data.bookingDate?.toDateString()}</td>
          </tr>
          <tr>
            <td className="label">Time</td>
            <td>{data.bookingTime}</td>
          </tr>
          <tr>
            <td className="label">Seating</td>
            <td style={{ textTransform: "capitalize" }}>{data.seatingPreference}</td>
          </tr>
          <tr>
            <td className="label">Cuisine</td>
            <td>{data.cuisinePreference}</td>
          </tr>
          <tr>
            <td className="label">Requests</td>
            <td>{data.specialRequests || "—"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default BookingSummary;