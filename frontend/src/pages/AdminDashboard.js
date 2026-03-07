import { useEffect, useState } from "react";
import { API } from "../services/api.js";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ADMIN_PASSWORD = "vocaldine2026";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (isAuthenticated) loadDashboardData();
  }, [isAuthenticated]);

  const handleLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("// ACCESS DENIED — invalid credentials");
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, statsRes] = await Promise.all([
        API.get("/bookings"),
        API.get("/bookings/analytics"),
      ]);
      setBookings(bookingsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm("Cancel this reservation?")) {
      setDeletingId(bookingId);
      try {
        await API.delete(`/bookings/${bookingId}`);
        loadDashboardData();
      } catch (err) {
        alert("Failed to delete booking.");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ["Booking ID,Customer,Email,Guests,Date,Time,Seating,Cuisine,Requests\n"];
    const rows = bookings.map(
      (b) =>
        `${b.bookingId},${b.customerName},${b.customerEmail || "N/A"},${b.numberOfGuests},${new Date(b.bookingDate).toLocaleDateString()},${b.bookingTime},${b.seatingPreference},${b.cuisinePreference},"${b.specialRequests || ""}"\n`,
    );
    const blob = new Blob([headers, ...rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VocalDine_Report_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  const chartData = {
    labels: stats?.popularCuisines?.map((c) => c._id || "Other") || [],
    datasets: [
      {
        label: "Bookings",
        data: stats?.popularCuisines?.map((c) => c.count) || [],
        backgroundColor: "rgba(0, 200, 255, 0.2)",
        borderColor: "rgba(0, 200, 255, 0.8)",
        borderWidth: 1,
        borderRadius: 0,
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(5, 13, 20, 0.95)",
        borderColor: "rgba(0,200,255,0.3)",
        borderWidth: 1,
        titleColor: "#00c8ff",
        bodyColor: "rgba(180,220,255,0.8)",
        titleFont: { family: "'Space Mono', monospace", size: 11 },
        bodyFont: { family: "'Syne', sans-serif", size: 12 },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(0,200,255,0.05)" },
        ticks: { color: "rgba(120,160,200,0.6)", font: { family: "'Space Mono', monospace", size: 10 } },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: "rgba(120,160,200,0.6)", font: { family: "'Space Mono', monospace", size: 10 } },
        grid: { color: "rgba(0,200,255,0.05)" },
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="auth-gate">
        <div className="auth-card">
          <h2>🔒 ADMIN ACCESS</h2>
          <p>Authorized personnel only</p>
          <input
            type="password"
            placeholder="Enter access code"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="typed-input"
            style={{ marginBottom: "12px" }}
          />
          {authError && <p className="auth-error">{authError}</p>}
          <button onClick={handleLogin} className="btn-primary" style={{ width: "100%" }}>
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loader">Loading System Data</div>;

  return (
    <div className="admin-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.2em", color: "var(--cyan)", marginBottom: "4px" }}>
            VOCALDINE — ADMIN PORTAL
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", letterSpacing: "0.15em", color: "var(--text-muted)" }}>
            // SYSTEM ACCESS GRANTED
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={exportToCSV} className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.65rem" }}>
            ↓ Export CSV
          </button>
          <button onClick={() => setIsAuthenticated(false)} className="btn-reset" style={{ marginTop: 0 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
        <div className="card">
          <h3>Total Reservations</h3>
          <p>{stats?.totalBookings || 0}</p>
        </div>
        <div className="card">
          <h3>Top Cuisine</h3>
          <p style={{ fontSize: "1.2rem", color: "var(--green)" }}>{stats?.topCuisine || "N/A"}</p>
        </div>
        <div className="card">
          <h3>Peak Hour</h3>
          <p style={{ fontSize: "1.4rem", color: "var(--amber)" }}>{stats?.topHour || "N/A"}</p>
        </div>
      </div>

      <div className="chart-wrapper">
        <h3>Cuisine Distribution</h3>
        <div style={{ height: "260px" }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "0.72rem", letterSpacing: "0.18em", color: "var(--text-secondary)" }}>
          LIVE RESERVATION LOG
        </h3>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
          {bookings.length} records
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Seating</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.bookingId}>
                <td>
                  <strong>{b.customerName}</strong><br />
                  <small>{b.customerEmail || "—"}</small>
                </td>
                <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem" }}>{b.bookingTime}</td>
                <td>{b.numberOfGuests}</td>
                <td style={{ textTransform: "capitalize" }}>{b.seatingPreference}</td>
                <td>
                  <button
                    className="btn-cancel"
                    onClick={() => handleDelete(b.bookingId)}
                    disabled={deletingId === b.bookingId}
                  >
                    {deletingId === b.bookingId ? "..." : "Cancel"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="admin-footer">
        <p>VocalDine Admin Portal v1.0 &nbsp;</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;