// Centralized API service for backend communication
// Uses axios to talk to Node + Express backend

import axios from "axios";

/**
 * Base configuration for Axios
 * Defines the root endpoint for all backend communication
 */
export const API = axios.create({
  baseURL: "http://localhost:8082/api",
});

/**
 * Create a new restaurant booking
 * Sends the captured state from the frontend to the database
 */
export const createBooking = async (bookingData) => {
  const response = await API.post("/bookings", bookingData);
  return response.data;
};

/**
 * Fetch all bookings for the Admin Dashboard view
 */
export const getAllBookings = async () => {
  const response = await API.get("/bookings");
  return response.data;
};

/**
 * Fetch a single booking by bookingId
 */
export const getBookingById = async (bookingId) => {
  const response = await API.get(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Delete a booking by bookingId (used by Admin Dashboard)
 */
export const deleteBooking = async (bookingId) => {
  const response = await API.delete(`/bookings/${bookingId}`);
  return response.data;
};

/**
 * Fetches weather forecast data via the proxy backend
 * Includes a fallback object to prevent the UI from breaking if the API fails
 */
export const getWeatherForDate = async (date, location = "Mumbai") => {
  try {
    const res = await API.get(`/weather?date=${date}&location=${location}`);
    return res.data;
  } catch (err) {
    // Graceful degradation: ensures the assistant can still offer basic advice
    return {
      advice: "I couldn't get the weather, but indoor seating is available.",
    };
  }
};

/**
 * Retrieves available time slots for a specific date to prevent double-booking
 */
export const getAvailableSlots = async (date) => {
  try {
    const response = await API.get(`/bookings/available-slots?date=${date}`);
    return response.data;
  } catch (err) {
    console.error("Error fetching slots", err);
    return []; // Returns an empty array to indicate no slots available upon error
  }
};
