import express from "express";
import { fetchWeather } from "../controllers/booking.controller.js";

const router = express.Router();

/**
 * Weather API Route
 * GET /api/weather - Fetches forecast data based on date and location
 */
router.get("/", fetchWeather);

export default router;
