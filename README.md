# ☀️ SkyPulse — Weather App

A stunning, premium weather Single Page Application built with **pure HTML, CSS & JavaScript** — no frameworks, no build tools, no API key required.

![SkyPulse Screenshot](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-blue?style=for-the-badge)
![API](https://img.shields.io/badge/API-Open--Meteo-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌍 **Auto-detect Location** | Uses browser geolocation to load weather for your current location |
| 🔍 **City Search** | Instant debounced search with geocoding — find any city worldwide |
| 📊 **Detailed View** | 6-tile stats grid: humidity, wind, feels-like, pressure, sunrise/sunset, UV index |
| 📅 **7-Day Forecast** | Daily forecast with weather codes, high/low temps, and temperature bars |
| ⏰ **Hourly Forecast** | Scrollable 12-hour forecast cards |
| 🌡️ **°C / °F Toggle** | Switch temperature units with one click, persisted in localStorage |
| 📌 **Recent Cities** | Automatically saves last 5 searched cities, removable from home |
| 🎨 **Dynamic Themes** | Background gradient shifts based on weather condition (clear, rain, snow, thunder, etc.) |
| ✨ **Animated Background** | Floating orbs + particle effects for a living, breathing UI |
| 📱 **Fully Responsive** | Mobile-first design that scales beautifully to desktop |

---

## 🖼️ Design

- **Glassmorphism** cards with `backdrop-filter: blur` and translucent borders
- **Animated gradient** background with 3 floating colour orbs
- **Micro-interactions** — hover glow, press feedback, slide-in animations
- **Google Fonts** — Inter typeface for clean, modern typography
- **WMO weather code → emoji** icon mapping (no external icon packs)

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Edge, Firefox, Safari)
- That's it — **no Node.js, no npm, no API keys**

### Run Locally

1. **Clone or download** this repository:
   ```bash
   git clone https://github.com/your-username/skypulse-weather.git
   cd skypulse-weather
   ```

2. **Open `index.html`** in your browser:
   - Double-click the file, **or**
   - Use a local server for best results:
     ```bash
     # Python
     python -m http.server 8000

     # Node.js (if installed)
     npx serve .
     ```

3. **Allow location access** when prompted (or it falls back to New Delhi).

---

## 🗂️ Project Structure

```
weather/
├── index.html    # SPA shell — all views, nav, semantic HTML
├── style.css     # Design system — glassmorphism, animations, themes
├── app.js        # Logic — API calls, routing, rendering, state
└── README.md     # You're reading it
```

---

## 🌐 APIs Used

| API | Purpose | Key Required |
|-----|---------|:------------:|
| [Open-Meteo Weather](https://open-meteo.com/) | Current weather, hourly & daily forecasts | ❌ Free |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City name → lat/lon search | ❌ Free |
| [Nominatim (OpenStreetMap)](https://nominatim.org/) | Reverse geocoding (lat/lon → city name) | ❌ Free |

> **No API keys, no sign-ups, no rate-limit worries** for personal use.

---

## ⚙️ How It Works

### SPA Routing
Hash-based navigation (`#home`, `#search`, `#details`, `#error`) with smooth CSS view transitions.

### Weather Data Flow
```
Geolocation / City Search
        ↓
  Open-Meteo API
        ↓
  Parse & Transform
        ↓
  Render Views + Apply Theme
        ↓
  Save to localStorage (recent cities, units)
```

### Weather Themes
The app maps **WMO weather codes** to dynamic CSS themes that change the background gradient:

| Condition | Theme |
|-----------|-------|
| Clear | Deep indigo + purple |
| Clouds | Muted grey-purple |
| Rain / Drizzle | Dark navy blue |
| Snow | Cool blue-grey |
| Thunderstorm | Near-black |
| Fog / Mist | Soft purple haze |

---

## 🛠️ Customization

- **Default fallback city** — Change coordinates in the `requestLocation()` function in `app.js`
- **Colour palette** — Edit CSS custom properties in `:root` at the top of `style.css`
- **Number of forecast days** — Change `forecast_days=7` in the API URL
- **Recent cities limit** — Change `MAX_RECENT` in `app.js`

---

## 📄 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

---

<p align="center">
  Built with ❤️ using pure HTML, CSS & JavaScript
</p>
