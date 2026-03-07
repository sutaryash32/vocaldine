import express from "express";
import bookingRoutes from "./booking.route.js";
import weatherRoutes from "./weather.route.js";

const router = express.Router();

/**
 * Main API Router configuration
 */

// Handles all reservation, analytics, and booking management endpoints
router.use("/bookings", bookingRoutes);

// Handles weather forecasting and location-based data services
router.use("/weather", weatherRoutes);

export default router;
