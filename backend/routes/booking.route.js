// Booking API routes

import express from "express";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
  getBookingById,
  getAvailableSlots,
  getAnalytics,
} from "../controllers/booking.controller.js";

const router = express.Router();

// POST /api/bookings - create a new booking
router.post("/", createBooking);

// GET /api/bookings - get all bookings for the admin list view
router.get("/", getAllBookings);

// GET /api/bookings/available-slots - get calendar availability for specific dates
router.get("/available-slots", getAvailableSlots);

// GET /api/bookings/analytics - fetch aggregated data for dashboard charts
router.get("/analytics", getAnalytics);

// GET /api/bookings/:id - get a single booking details by its unique bookingId
router.get("/:id", getBookingById);

// DELETE /api/bookings/:id - remove a booking from the database by its bookingId
router.delete("/:id", deleteBooking);

export default router;
