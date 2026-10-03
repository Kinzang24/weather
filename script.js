const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locateBtn = document.getElementById('locateBtn');
const card = document.getElementById('card');

const weatherCodes = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Drizzle", 55: "Dense drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain",
  71: "Light snow", 73: "Snow", 75: "Heavy snow",
  80: "Rain showers", 81: "Rain showers", 82: "Violent rain showers",
  95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Severe thunderstorm"
};

function showLoading() {
  card.innerHTML = '<div class="spinner"></div>';
}

function showError(msg) {
  card.innerHTML = `<div class="error">${msg}</div>`;
}

function renderWeather(place, data) {
  const c = data.current;
  const desc = weatherCodes[c.weather_code] || "Unknown conditions";
  card.innerHTML = `
    <div class="place">${place}</div>
    <div class="temp">${Math.round(c.temperature_2m)}°C</div>
    <div class="desc">${desc}</div>
    <div class="details">
      <span><strong>${Math.round(c.relative_humidity_2m)}%</strong>Humidity</span>
      <span><strong>${Math.round(c.wind_speed_10m)} km/h</strong>Wind</span>
      <span><strong>${Math.round(c.apparent_temperature)}°C</strong>Feels like</span>
    </div>
  `;
}

async function fetchWeatherByCoords(lat, lon, placeName) {
  showLoading();
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather service unavailable.");
    const data = await res.json();
    renderWeather(placeName, data);
  } catch (err) {
    showError("Couldn't load weather. Please try again.");
  }
}

async function searchCity(query) {
  if (!query.trim()) return;
  showLoading();
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`;
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      showError("Place not found. Try another search.");
      return;
    }

    const place = geoData.results[0];
    const placeName = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .join(", ");

    fetchWeatherByCoords(place.latitude, place.longitude, placeName);
  } catch (err) {
    showError("Something went wrong. Please try again.");
  }
}

function useMyLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation isn't supported by your browser.");
    return;
  }
  showLoading();
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, "Your location");
    },
    () => {
      showError("Couldn't get your location. Try searching instead.");
    }
  );
}

searchBtn.addEventListener('click', () => searchCity(cityInput.value));
cityInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') searchCity(cityInput.value);
});
locateBtn.addEventListener('click', useMyLocation);
