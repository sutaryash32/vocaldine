// Handles fetching real weather data from OpenWeatherMap API
// Uses Geocoding API + 5-day forecast API

import axios from "axios";

/**
 * Fetch weather forecast for a given date and location.
 * Uses Geocoding API to get lat/lon, then 5-day forecast API.
 * @param {string} dateString - Booking date (YYYY-MM-DD)
 * @param {string} city - City name (default: Mumbai)
 * @param {string} countryCode - Country code (default: IN)
 * @returns {Object} { temperature, condition, description }
 */
export async function getWeatherForDate(
  dateString,
  city = "Mumbai", // FIX: changed default from "Delhi" to "Mumbai" to match controller usage
  countryCode = "IN",
) {
  const apiKey = process.env.OPEN_WEATHER_API_KEY;

  // FIX: validate inputs before making any API calls
  if (!apiKey) {
    console.error("Weather Service: Missing OPEN_WEATHER_API_KEY in .env");
    return { temperature: null, condition: "Unknown", description: "API key not configured" };
  }

  if (!dateString) {
    console.error("Weather Service: dateString is required");
    return { temperature: null, condition: "Unknown", description: "No date provided" };
  }

  if (!city || typeof city !== "string") {
    console.error("Weather Service: invalid city provided");
    return { temperature: null, condition: "Unknown", description: "Invalid city" };
  }

  try {
    // Convert city name into latitude and longitude coordinates
    const geo = await axios.get(
      "https://api.openweathermap.org/geo/1.0/direct",
      {
        params: { q: `${city},${countryCode}`, limit: 1, appid: apiKey },
      },
    );

    if (!geo.data || !geo.data.length) {
      console.error(`Weather Service: Location not found — ${city}, ${countryCode}`);
      return { temperature: null, condition: "Unknown", description: `Location not found: ${city}` };
    }

    const { lat, lon } = geo.data[0];

    // Request the 5-day weather forecast using the coordinates
    const forecastRes = await axios.get(
      "https://api.openweathermap.org/data/2.5/forecast",
      {
        params: { lat, lon, units: "metric", appid: apiKey },
      },
    );

    if (!forecastRes.data || !forecastRes.data.list?.length) {
      console.error("Weather Service: Empty forecast response");
      return { temperature: null, condition: "Unknown", description: "No forecast data available" };
    }

    const targetDate = new Date(dateString).toDateString();

    // Filter the API results to find the forecast for the user's booking date
    const dayForecast =
      forecastRes.data.list.find(
        (item) => new Date(item.dt_txt).toDateString() === targetDate,
      ) || forecastRes.data.list[0]; // Fallback to current weather if exact date is beyond 5-day range

    // Return structured data for the frontend to use in seating suggestions
    return {
      temperature: dayForecast.main.temp,
      condition: dayForecast.weather[0].main,
      description: dayForecast.weather[0].description,
    };
  } catch (error) {
    // FIX: log the actual error reason instead of swallowing it silently
    console.error("Weather Service Error:", error.response?.data?.message || error.message);
    return {
      temperature: null,
      condition: "Unknown",
      description: "Weather data temporarily unavailable",
    };
  }
}