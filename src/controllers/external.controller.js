/**
 * ============================================================================
 * CONTROLLERS/EXTERNAL.CONTROLLER.JS — Consumo de APIs Externas
 * ============================================================================
 *
 * - GET /api/external/weather   → Clima actual (Open-Meteo, sin clave)

 * ============================================================================
 */

// ─── Duraciones de caché ─────────────────────────────────────────────────────
const CACHE_DURATION_WEATHER = 15 * 60 * 1000; // 15 min

// ─── Cachés de datos ─────────────────────────────────────────────────────────
let weatherCache = { data: null, lastUpdate: 0 };

// ============================================================
// GET /api/external/weather
// ============================================================
export const getWeather = async (req, res) => {
  try {
    const now = Date.now();
    if (weatherCache.data && now - weatherCache.lastUpdate < CACHE_DURATION_WEATHER) {
      return res.json(weatherCache.data);
    }

    const lat = -34.588;
    const lon = -58.638;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m`;

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) throw new Error("Error fetching weather");

    const result = {
      temperature: data.current_weather.temperature,
      windspeed:   data.current_weather.windspeed,
      weathercode: data.current_weather.weathercode,
      time:        data.current_weather.time,
      location:    "Hurlingham, BA",
    };

    weatherCache = { data: result, lastUpdate: now };
    res.json(result);
  } catch (err) {
    console.error("Weather API Error:", err);
    res.status(500).json({ error: "No se pudo obtener el clima", fallback: true });
  }
};

