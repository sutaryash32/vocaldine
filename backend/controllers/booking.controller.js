// Handles all booking-related operations
// Includes creating booking, fetching bookings, delete bookings
// Integrates weather API to suggest indoor/outdoor seating
import { v4 as uuidv4 } from "uuid";
import { getWeatherForDate } from "../config/weather.js";
import nodemailer from "nodemailer";
import Booking from "../models/booking.model.js";

let transporter;

/**
 * Initializes the email transporter using Ethereal (test account)
 */
const initEmail = async () => {
  try {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log("Ethereal Mail Server Ready");
  } catch (err) {
    console.error("Ethereal Init Error:", err.message);
  }
};

initEmail();

/**
 * Sends a confirmation email to the customer after successful booking
 */
const sendConfirmationEmail = async (booking) => {
  if (!transporter) return;

  const mailOptions = {
    from: '"VocalDine Restaurant" <reservations@vocaldine.com>',
    to: booking.customerEmail,
    subject: "Reservation Confirmed! ✔",
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2>Booking Confirmed!</h2>
        <p>Your table is reserved for <strong>${booking.numberOfGuests} guests</strong>.</p>
        <p><strong>Date:</strong> ${new Date(booking.bookingDate).toDateString()}</p>
        <p><strong>Time:</strong> ${booking.bookingTime}</p>
        <p>See you soon!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("--------------------------------------------------");
    console.log("SUCCESS: Email sent to " + booking.customerEmail);
    console.log("PREVIEW URL: %s", nodemailer.getTestMessageUrl(info));
    console.log("--------------------------------------------------");
  } catch (error) {
    console.error("Email Send Error:", error.message);
  }
};

/**
 * Create a new booking
 * POST /api/bookings
 */
export const createBooking = async (req, res) => {
  try {
    const {
      customerEmail,
      bookingDate,
      bookingTime,
      numberOfGuests,
      ...otherData
    } = req.body;

    // Normalize date to midnight to ensure consistent comparison in DB
    const targetDate = new Date(bookingDate);
    targetDate.setHours(0, 0, 0, 0);

    // Conflict check: prevent multiple bookings for the same date and time
    const exists = await Booking.findOne({
      bookingDate: targetDate,
      bookingTime: bookingTime.trim(),
      status: "confirmed",
    });

    if (exists) {
      return res.status(400).json({ message: "This slot is already taken." });
    }

    // Fetch weather data to include in the booking record
    const weather = await getWeatherForDate(bookingDate, "Mumbai");

    const newBooking = new Booking({
      bookingId: uuidv4(),
      customerName: "Guest",
      customerEmail: customerEmail,
      numberOfGuests,
      bookingDate: targetDate,
      bookingTime: bookingTime.trim(),
      weatherInfo: weather,
      status: "confirmed",
      ...otherData,
    });

    const saved = await newBooking.save();
    console.log("Saved to DB with Email:", saved.customerEmail);

    // Trigger email confirmation if a valid email was provided
    if (saved.customerEmail && saved.customerEmail.includes("@")) {
      await sendConfirmationEmail(saved);
    }

    res.status(201).json(saved);
  } catch (error) {
    console.error("Controller Error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Filters and returns available time slots for a specific date
 */
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const allSlots = [
      "12:00 PM",
      "1:00 PM",
      "2:00 PM",
      "7:00 PM",
      "8:00 PM",
      "9:00 PM",
      "10:00 PM",
    ];

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Retrieve all confirmed bookings for the target day
    const takenBookings = await Booking.find({
      bookingDate: targetDate,
      status: "confirmed",
    }).select("bookingTime");

    // Filter out taken slots from the master list
    const takenSlots = takenBookings.map((b) => b.bookingTime);
    const availableSlots = allSlots.filter(
      (slot) => !takenSlots.includes(slot),
    );

    res.status(200).json(availableSlots);
  } catch (error) {
    res.status(500).json({ message: "Error fetching slots" });
  }
};

/**
 * Get all bookings
 * GET /api/bookings
 */
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error.message);
    res.status(500).json({ message: "Server error fetching bookings" });
  }
};

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findOne({ bookingId: id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking: ", error.message);
    res.status(500).json({ message: "Server error fetching booking" });
  }
};

/**
 * Delete booking by ID
 * DELETE /api/bookings/:id
 */
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBooking = await Booking.findOneAndDelete({ bookingId: id });

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking: ", error.message);
    res.status(500).json({ message: "Server error deleting booking" });
  }
};

export const fetchWeather = async (req, res) => {
  try {
    const { date, location } = req.query;
    const data = await getWeatherForDate(date, location);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get Analytics using Mongoose Aggregation
 * Groups data to find peak times and popular cuisines
 */
export const getAnalytics = async (req, res) => {
  try {
    // Calculate Peak Hours by counting frequency of time slots
    const peakHours = await Booking.aggregate([
      { $group: { _id: "$bookingTime", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Calculate Popular Cuisines by grouping by preference
    const popularCuisines = await Booking.aggregate([
      { $group: { _id: "$cuisinePreference", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get total count for the dashboard summary
    const totalBookings = await Booking.countDocuments();

    res.status(200).json({
      peakHours,
      popularCuisines,
      totalBookings,
      topCuisine: popularCuisines[0]?._id || "N/A",
      topHour: peakHours[0]?._id || "N/A",
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating analytics" });
  }
};