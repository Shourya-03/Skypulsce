/* ============================================================
   SkyPulse — Weather App  |  Application Logic
   Uses Open-Meteo API — 100% free, no API key required
   ============================================================ */

(() => {
  'use strict';

  // =======================
  // CONSTANTS
  // =======================
  const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1';
  const WEATHER_BASE = 'https://api.open-meteo.com/v1';
  const STORAGE_KEY = 'skypulse_recent';
  const MAX_RECENT = 5;

  // ── WMO Weather Code → Description & Icon mapping ──────────
  const WMO = {
    0: { desc: 'Clear sky', icon: '☀️', cls: 'clear', bg: 'weather-clear' },
    1: { desc: 'Mainly clear', icon: '🌤️', cls: 'clear', bg: 'weather-clear' },
    2: { desc: 'Partly cloudy', icon: '⛅', cls: 'clouds', bg: 'weather-clouds' },
    3: { desc: 'Overcast', icon: '☁️', cls: 'clouds', bg: 'weather-clouds' },
    45: { desc: 'Foggy', icon: '🌫️', cls: 'mist', bg: 'weather-mist' },
    48: { desc: 'Depositing rime fog', icon: '🌫️', cls: 'mist', bg: 'weather-mist' },
    51: { desc: 'Light drizzle', icon: '🌦️', cls: 'rain', bg: 'weather-rain' },
    53: { desc: 'Moderate drizzle', icon: '🌦️', cls: 'rain', bg: 'weather-rain' },
    55: { desc: 'Dense drizzle', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    56: { desc: 'Freezing drizzle', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    57: { desc: 'Heavy freezing drizzle', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    61: { desc: 'Slight rain', icon: '🌦️', cls: 'rain', bg: 'weather-rain' },
    63: { desc: 'Moderate rain', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    65: { desc: 'Heavy rain', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    66: { desc: 'Freezing rain', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    67: { desc: 'Heavy freezing rain', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    71: { desc: 'Slight snow', icon: '🌨️', cls: 'snow', bg: 'weather-snow' },
    73: { desc: 'Moderate snow', icon: '🌨️', cls: 'snow', bg: 'weather-snow' },
    75: { desc: 'Heavy snow', icon: '❄️', cls: 'snow', bg: 'weather-snow' },
    77: { desc: 'Snow grains', icon: '❄️', cls: 'snow', bg: 'weather-snow' },
    80: { desc: 'Slight rain showers', icon: '🌦️', cls: 'rain', bg: 'weather-rain' },
    81: { desc: 'Moderate rain showers', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    82: { desc: 'Violent rain showers', icon: '🌧️', cls: 'rain', bg: 'weather-rain' },
    85: { desc: 'Slight snow showers', icon: '🌨️', cls: 'snow', bg: 'weather-snow' },
    86: { desc: 'Heavy snow showers', icon: '❄️', cls: 'snow', bg: 'weather-snow' },
    95: { desc: 'Thunderstorm', icon: '⛈️', cls: 'thunder', bg: 'weather-thunder' },
    96: { desc: 'Thunderstorm with hail', icon: '⛈️', cls: 'thunder', bg: 'weather-thunder' },
    99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️', cls: 'thunder', bg: 'weather-thunder' },
  };

  function getWMO(code) {
    return WMO[code] || { desc: 'Unknown', icon: '🌡️', cls: 'clear', bg: 'weather-day' };
  }

  // =======================
  // STATE
  // =======================
  const state = {
    units: localStorage.getItem('skypulse_units') || 'celsius', // celsius | fahrenheit
    currentView: 'home',
    currentData: null,
    currentCity: null,
    unit: 'C',
    searchTimer: null,
    recentCities: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
    currentCityName: '',
    currentCountry: '',
  };

  // =======================
  // DOM ELEMENTS
  // =======================
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    app: $('#app'),
    bgLayer: $('#bgLayer'),
    particles: $('#particles'),
    btnBack: $('#btnBack'),
    topbarTitle: $('#topbarTitle'),
    btnUnits: $('#btnUnits'),
    unitLabel: $('#unitLabel'),
    viewHome: $('#viewHome'),
    viewSearch: $('#viewSearch'),
    viewDetails: $('#viewDetails'),
    viewError: $('#viewError'),
    heroLoader: $('#heroLoader'),
    heroContent: $('#heroContent'),
    heroCity: $('#heroCity'),
    heroIcon: $('#heroIcon'),
    heroTemp: $('#heroTemp'),
    heroDesc: $('#heroDesc'),
    heroHigh: $('#heroHigh'),
    heroLow: $('#heroLow'),
    statHumidity: $('#statHumidity'),
    statWind: $('#statWind'),
    statFeels: $('#statFeels'),
    statSunrise: $('#statSunrise'),
    statsRow: $('#statsRow'),
    hourlyScroll: $('#hourlyScroll'),
    recentLabel: $('#recentLabel'),
    recentList: $('#recentList'),
    searchInput: $('#searchInput'),
    searchClear: $('#searchClear'),
    searchResults: $('#searchResults'),
    searchEmpty: $('#searchEmpty'),
    detailCity: $('#detailCity'),
    detailCountry: $('#detailCountry'),
    detailIcon: $('#detailIcon'),
    detailTemp: $('#detailTemp'),
    detailDesc: $('#detailDesc'),
    detailGrid: $('#detailGrid'),
    forecastList: $('#forecastList'),
    errorTitle: $('#errorTitle'),
    errorMsg: $('#errorMsg'),
    btnRetry: $('#btnRetry'),
    bottomNav: $('#bottomNav'),
  };

  // =======================
  // FUNCTIONS
  // =======================

  // ── Utilities ──────────────────────────────────────────────
  const unitSymbol = () => state.units === 'celsius' ? '°C' : '°F';
  const tempStr = (t) => `${Math.round(t)}°`;
  const convertTemp = (c) => state.units === 'fahrenheit' ? (c * 9 / 5) + 32 : c;

  function formatTimeHM(isoStr) {
    const d = new Date(isoStr);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  function formatHour(isoStr) {
    const d = new Date(isoStr);
    const h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12} ${ampm}`;
  }

  function getDayName(dateStr, i) {
    if (i === 0) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }

  // ── API Calls ──────────────────────────────────────────────
  async function fetchWeather(lat, lon) {
    const url = `${WEATHER_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,surface_pressure,is_day` +
      `&hourly=temperature_2m,weather_code,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
      `&timezone=auto&forecast_days=7`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error ${res.status}`);
    return res.json();
  }

  async function geocodeCity(query) {
    const url = `${GEO_BASE}/search?name=${encodeURIComponent(query)}&count=6&language=en`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding error ${res.status}`);
    return res.json();
  }

  async function reverseGeocode(lat, lon) {
    // Open-Meteo doesn't have reverse geocoding, use a free one
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
      const res = await fetch(url, { headers: { 'User-Agent': 'SkyPulse-WeatherApp/1.0' } });
      if (!res.ok) return { city: 'Your Location', country: '' };
      const data = await res.json();
      const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Your Location';
      const country = data.address?.country_code?.toUpperCase() || '';
      return { city, country };
    } catch {
      return { city: 'Your Location', country: '' };
    }
  }

  // ── Particles ──────────────────────────────────────────────
  function initParticles() {
    const container = dom.particles;
    container.innerHTML = '';
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.top = (60 + Math.random() * 40) + '%';
      p.style.animationDuration = (6 + Math.random() * 12) + 's';
      p.style.animationDelay = Math.random() * 8 + 's';
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      container.appendChild(p);
    }
  }

  // ── Weather Theme ──────────────────────────────────────────
  function applyWeatherTheme(code) {
    document.body.className = '';
    const wmo = getWMO(code);
    document.body.classList.add(wmo.bg);
  }

  // ── Router ─────────────────────────────────────────────────
  const views = { home: dom.viewHome, search: dom.viewSearch, details: dom.viewDetails, error: dom.viewError };

  function navigate(viewName) {
    state.currentView = viewName;
    Object.values(views).forEach(v => { v.style.display = 'none'; });
    const target = views[viewName];
    if (target) {
      target.style.display = '';
      target.style.animation = 'none';
      void target.offsetWidth;
      target.style.animation = '';
    }
    dom.btnBack.style.display = (viewName === 'home' || viewName === 'search') ? 'none' : '';
    $$('.bottom-nav__item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName || (viewName === 'details' && btn.dataset.view === 'search'));
    });
    if (viewName === 'search') {
      setTimeout(() => dom.searchInput.focus(), 100);
    }
    history.replaceState(null, '', `#${viewName}`);
  }

  // ── Render: Home ───────────────────────────────────────────
  function renderHome(data, cityName, country) {
    state.currentData = data;
    state.currentCityName = cityName;
    state.currentCountry = country;

    const cur = data.current;
    const daily = data.daily;
    const wmo = getWMO(cur.weather_code);

    dom.heroCity.textContent = cityName + (country ? `, ${country}` : '');
    dom.heroIcon.src = '';
    dom.heroIcon.alt = wmo.desc;
    // Use emoji as icon in a canvas trick — or just put emoji directly
    dom.heroIcon.style.display = 'none';
    // Instead show emoji in the icon wrap
    const iconWrap = dom.heroIcon.parentElement;
    iconWrap.innerHTML = `<span style="font-size:72px;line-height:1;">${wmo.icon}</span>`;

    dom.heroTemp.textContent = tempStr(convertTemp(cur.temperature_2m));
    dom.heroDesc.textContent = wmo.desc;
    dom.heroHigh.textContent = tempStr(convertTemp(daily.temperature_2m_max[0]));
    dom.heroLow.textContent = tempStr(convertTemp(daily.temperature_2m_min[0]));

    // Stats
    dom.statHumidity.textContent = cur.relative_humidity_2m + '%';
    dom.statWind.textContent = Math.round(cur.wind_speed_10m) + ' km/h';
    dom.statFeels.textContent = tempStr(convertTemp(cur.apparent_temperature));
    dom.statSunrise.textContent = formatTimeHM(daily.sunrise[0]);

    hideLoading();

    applyWeatherTheme(cur.weather_code);
    renderHourly(data);
    renderRecentCities();
  }

  function renderHourly(data) {
    const hourly = data.hourly;
    // Find current hour index
    const now = new Date();
    let startIdx = 0;
    for (let i = 0; i < hourly.time.length; i++) {
      if (new Date(hourly.time[i]) >= now) { startIdx = i; break; }
    }
    const slots = hourly.time.slice(startIdx, startIdx + 12);
    dom.hourlyScroll.innerHTML = slots.map((t, i) => {
      const idx = startIdx + i;
      const wmo = getWMO(hourly.weather_code[idx]);
      const temp = convertTemp(hourly.temperature_2m[idx]);
      const label = i === 0 ? 'Now' : formatHour(t);
      return `
        <div class="hourly-card ${i === 0 ? 'now' : ''}">
          <span class="hourly-card__time">${label}</span>
          <span class="hourly-card__icon" style="font-size:24px;">${wmo.icon}</span>
          <span class="hourly-card__temp">${tempStr(temp)}</span>
        </div>`;
    }).join('');
  }

  // ── Render: Recent Cities ──────────────────────────────────
  function renderRecentCities() {
    const cities = state.recentCities;
    if (!cities.length) {
      dom.recentLabel.style.display = 'none';
      dom.recentList.innerHTML = '';
      return;
    }
    dom.recentLabel.style.display = '';
    dom.recentList.innerHTML = cities.map((c, i) => `
      <div class="recent-item" data-lat="${c.lat}" data-lon="${c.lon}" data-name="${c.name}" data-country="${c.country || ''}" data-index="${i}">
        <span style="font-size:28px;">${c.icon}</span>
        <div class="recent-item__info">
          <div class="recent-item__city">${c.name}</div>
          <div class="recent-item__desc">${c.desc}</div>
        </div>
        <span class="recent-item__temp">${tempStr(c.temp)}</span>
        <button class="recent-item__remove" data-remove="${i}" aria-label="Remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>`).join('');
  }

  function addRecentCity(cityName, country, lat, lon, temp, weatherCode) {
    const wmo = getWMO(weatherCode);
    const entry = {
      name: cityName + (country ? `, ${country}` : ''),
      lat, lon, country,
      temp: convertTemp(temp),
      icon: wmo.icon,
      desc: wmo.desc,
    };
    state.recentCities = state.recentCities.filter(c =>
      !(Math.abs(c.lat - lat) < 0.05 && Math.abs(c.lon - lon) < 0.05)
    );
    state.recentCities.unshift(entry);
    state.recentCities = state.recentCities.slice(0, MAX_RECENT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recentCities));
  }

  // ── Render: Details ────────────────────────────────────────
  function renderDetails(data, cityName, country) {
    state.currentData = data;
    state.currentCityName = cityName;
    state.currentCountry = country;

    const cur = data.current;
    const daily = data.daily;
    const wmo = getWMO(cur.weather_code);

    dom.detailCity.textContent = cityName;
    dom.detailCountry.textContent = country || '';
    dom.detailIcon.style.display = 'none';
    dom.detailIcon.parentElement.insertAdjacentHTML('beforeend', `<span class="detail-emoji" style="font-size:56px;line-height:1;">${wmo.icon}</span>`);
    // Remove previous emoji if any
    const prevEmoji = dom.detailIcon.parentElement.querySelectorAll('.detail-emoji');
    if (prevEmoji.length > 1) prevEmoji[0].remove();

    dom.detailTemp.textContent = tempStr(convertTemp(cur.temperature_2m));
    dom.detailDesc.textContent = wmo.desc;

    applyWeatherTheme(cur.weather_code);

    // Detail grid tiles
    const feelsLike = convertTemp(cur.apparent_temperature);
    const diff = cur.apparent_temperature - cur.temperature_2m;
    const feelsDesc = Math.abs(diff) < 2 ? 'Similar to actual' : diff > 0 ? 'Warmer than actual' : 'Cooler than actual';

    const tiles = [
      { icon: '💧', label: 'Humidity', value: cur.relative_humidity_2m + '%', sub: '' },
      { icon: '💨', label: 'Wind', value: Math.round(cur.wind_speed_10m) + ' km/h', sub: cur.wind_gusts_10m ? `Gusts: ${Math.round(cur.wind_gusts_10m)} km/h` : '' },
      { icon: '🌡️', label: 'Feels Like', value: tempStr(feelsLike), sub: feelsDesc },
      { icon: '🔽', label: 'Pressure', value: Math.round(cur.surface_pressure) + ' hPa', sub: '' },
      { icon: '🌅', label: 'Sunrise', value: formatTimeHM(daily.sunrise[0]), sub: 'Sunset ' + formatTimeHM(daily.sunset[0]) },
      { icon: '☀️', label: 'UV Index', value: daily.uv_index_max[0] !== undefined ? daily.uv_index_max[0].toFixed(1) : '—', sub: uvDesc(daily.uv_index_max[0]) },
    ];
    dom.detailGrid.innerHTML = tiles.map(t => `
      <div class="detail-tile">
        <div class="detail-tile__header">
          <span class="detail-tile__icon">${t.icon}</span>
          <span class="detail-tile__label">${t.label}</span>
        </div>
        <div class="detail-tile__value">${t.value}</div>
        ${t.sub ? `<div class="detail-tile__sub">${t.sub}</div>` : ''}
      </div>`).join('');

    renderForecastDays(data);
  }

  function uvDesc(uv) {
    if (uv === undefined || uv === null) return '';
    if (uv <= 2) return 'Low';
    if (uv <= 5) return 'Moderate';
    if (uv <= 7) return 'High';
    if (uv <= 10) return 'Very high';
    return 'Extreme';
  }

  function renderForecastDays(data) {
    const daily = data.daily;
    const days = daily.time.slice(0, 7);

    let globalMin = Infinity, globalMax = -Infinity;
    days.forEach((_, i) => {
      globalMin = Math.min(globalMin, daily.temperature_2m_min[i]);
      globalMax = Math.max(globalMax, daily.temperature_2m_max[i]);
    });
    const range = globalMax - globalMin || 1;

    dom.forecastList.innerHTML = days.map((date, i) => {
      const wmo = getWMO(daily.weather_code[i]);
      const high = daily.temperature_2m_max[i];
      const low = daily.temperature_2m_min[i];
      const barLeft = ((low - globalMin) / range) * 100;
      const barWidth = ((high - low) / range) * 100;
      const label = getDayName(date, i);
      const precip = daily.precipitation_probability_max[i];
      return `
        <div class="forecast-row">
          <span class="forecast-row__day">${label}</span>
          <span style="font-size:24px;width:36px;text-align:center;">${wmo.icon}</span>
          <span class="forecast-row__desc">${wmo.desc}${precip > 0 ? ` · ${precip}%` : ''}</span>
          <div class="forecast-row__bar-wrap">
            <div class="forecast-row__bar" style="margin-left:${barLeft}%;width:${Math.max(barWidth, 8)}%"></div>
          </div>
          <div class="forecast-row__temps">
            <span class="forecast-row__high">${tempStr(convertTemp(high))}</span>
            <span class="forecast-row__low">${tempStr(convertTemp(low))}</span>
          </div>
        </div>`;
    }).join('');
  }

  // ── Search ─────────────────────────────────────────────────
  function handleSearch(query) {
    clearTimeout(state.searchTimer);
    dom.searchClear.style.display = query ? '' : 'none';

    if (!query.trim()) {
      dom.searchResults.innerHTML = '';
      dom.searchEmpty.style.display = '';
      return;
    }
    dom.searchEmpty.style.display = 'none';

    state.searchTimer = setTimeout(async () => {
      try {
        const data = await geocodeCity(query);
        const results = data.results || [];
        if (!results.length) {
          dom.searchResults.innerHTML = `<div class="search-empty" style="display:flex;"><p>No cities found for "${query}"</p></div>`;
          return;
        }
        dom.searchResults.innerHTML = results.map((r, i) => `
          <div class="search-result" data-lat="${r.latitude}" data-lon="${r.longitude}" data-name="${r.name}" data-country="${r.country_code || r.country || ''}" style="animation-delay:${i * .06}s">
            <svg class="search-result__pin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div>
              <div class="search-result__name">${r.name}</div>
              <div class="search-result__country">${r.admin1 ? r.admin1 + ', ' : ''}${r.country || r.country_code || ''}</div>
            </div>
            <svg class="search-result__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>`).join('');
      } catch {
        dom.searchResults.innerHTML = `<div class="search-empty" style="display:flex;"><p>Search failed — please try again</p></div>`;
      }
    }, 350);
  }

  // ── Load Weather ───────────────────────────────────────────
  async function loadWeatherForCoords(lat, lon, cityName, country, isHome = false) {
    try {
      showLoading();
      const data = await fetchWeather(lat, lon);

      // If no city name, reverse geocode
      if (!cityName) {
        const geo = await reverseGeocode(lat, lon);
        cityName = geo.city;
        country = geo.country;
      }

      addRecentCity(cityName, country, lat, lon, data.current.temperature_2m, data.current.weather_code);

      if (isHome) {
        renderHome(data, cityName, country);
        navigate('home');
      } else {
        renderDetails(data, cityName, country);
        navigate('details');
      }
    } catch {
      hideLoading();
      showError('Failed to load weather', 'Could not fetch weather data. Please check your connection and try again.');
    }
  }

  function showLoading() {
    dom.heroLoader.style.display = '';
    dom.heroContent.style.display = 'none';
  }

  function hideLoading() {
    dom.heroLoader.style.display = 'none';
    dom.heroContent.style.display = '';
  }

  function showError(title, msg) {
    dom.errorTitle.textContent = title;
    dom.errorMsg.textContent = msg;
    navigate('error');
  }

  function showErrorView(title, message) {
    dom.viewHome.style.display = 'none';
    dom.viewError.style.display = 'block';
    dom.errorTitle.textContent = title;
    dom.errorMsg.textContent = message;
  }

  // ── Geolocation ────────────────────────────────────────────
  function requestLocation() {
    if (!navigator.geolocation) {
      loadWeatherForCoords(28.6139, 77.2090, 'New Delhi', 'IN', true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => loadWeatherForCoords(pos.coords.latitude, pos.coords.longitude, null, null, true),
      () => {
        // Denied → load New Delhi as fallback
        loadWeatherForCoords(28.6139, 77.2090, 'New Delhi', 'IN', true);
      },
      { timeout: 8000 }
    );
  }

  // =======================
  // EVENT LISTENERS
  // =======================
  function bindEvents() {
    // Bottom nav
    dom.bottomNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.bottom-nav__item');
      if (!btn) return;
      const view = btn.dataset.view;
      if (view === 'home') {
        navigate('home');
      } else {
        navigate(view);
      }
    });

    // Back button
    dom.btnBack.addEventListener('click', () => navigate('home'));

    // Unit toggle
    dom.btnUnits.addEventListener('click', () => {
      state.units = state.units === 'celsius' ? 'fahrenheit' : 'celsius';
      localStorage.setItem('skypulse_units', state.units);
      dom.unitLabel.textContent = state.units === 'celsius' ? '°C' : '°F';
      // Re-render with current data
      if (state.currentData) {
        if (state.currentView === 'details') {
          renderDetails(state.currentData, state.currentCityName, state.currentCountry);
        } else {
          renderHome(state.currentData, state.currentCityName, state.currentCountry);
        }
        // Update recent cities temps
        state.recentCities = state.recentCities.map(c => ({ ...c }));
        renderRecentCities();
      }
    });

    // Search input
    dom.searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      handleSearch('');
      dom.searchInput.focus();
    });

    // Search result click
    dom.searchResults.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result');
      if (!item) return;
      const lat = parseFloat(item.dataset.lat);
      const lon = parseFloat(item.dataset.lon);
      const name = item.dataset.name;
      const country = item.dataset.country;
      loadWeatherForCoords(lat, lon, name, country, false);
    });

    // Recent city click
    dom.recentList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove]');
      if (removeBtn) {
        e.stopPropagation();
        const idx = parseInt(removeBtn.dataset.remove);
        state.recentCities.splice(idx, 1);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recentCities));
        renderRecentCities();
        return;
      }
      const item = e.target.closest('.recent-item');
      if (!item) return;
      const lat = parseFloat(item.dataset.lat);
      const lon = parseFloat(item.dataset.lon);
      const name = item.dataset.name;
      const country = item.dataset.country;
      loadWeatherForCoords(lat, lon, name, country, false);
    });

    // Retry
    dom.btnRetry.addEventListener('click', () => {
      navigate('home');
      requestLocation();
    });

    // Hash routing
    window.addEventListener('hashchange', () => {
      const hash = location.hash.slice(1);
      if (views[hash] && hash !== state.currentView) {
        navigate(hash);
      }
    });
  }

  // =======================
  // INIT
  // =======================
  function init() {
    initParticles();
    bindEvents();
    dom.unitLabel.textContent = state.units === 'celsius' ? '°C' : '°F';
    requestLocation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
