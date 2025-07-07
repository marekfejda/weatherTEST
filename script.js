document.addEventListener('DOMContentLoaded', async () => {
  const API_URL =
    'https://api.open-meteo.com/v1/forecast' +
    '?latitude=48.1486&longitude=17.1077' +
    '&current_weather=true' +
    '&hourly=temperature_2m,weathercode' +
    '&daily=weathercode,temperature_2m_max,temperature_2m_min' +
    '&timezone=Europe/Bratislava' +
    '&forecast_days=10'; 

  const CODE_MAP = {
    0:  { label:'Clear sky',           icon:'clearORmostly_clear.png',          theme:'clear-day' },
    1:  { label:'Mainly clear',        icon:'clearORmostly_clear.png',          theme:'clear-day' },
    2:  { label:'Partly cloudy',       icon:'partly_cloudy.png',                theme:'partly-cloudy-day' },
    3:  { label:'Overcast',            icon:'cloudy.png',                       theme:'cloudy' },
    45: { label:'Fog',                 icon:'fog.png',                          theme:'fog' },
    48: { label:'Depositing rime fog', icon:'fog.png',                          theme:'fog' },
    51: { label:'Light drizzle',       icon:'drizzle(night).png',               theme:'rain' },
    53: { label:'Moderate drizzle',    icon:'drizzle(night).png',               theme:'rain' },
    55: { label:'Dense drizzle',       icon:'drizzle(night).png',               theme:'rain' },
    56: { label:'Light freezing drizzle', icon:'freezing_rainORsleetORwintry_mix.png', theme:'snow' },
    57: { label:'Dense freezing drizzle', icon:'freezing_rainORsleetORwintry_mix.png', theme:'snow' },
    61: { label:'Slight rain',         icon:'rain.png',                         theme:'rain' },
    63: { label:'Moderate rain',       icon:'rain.png',                         theme:'rain' },
    65: { label:'Heavy rain',          icon:'heavy_rain.png',                   theme:'rain' },
    66: { label:'Light freezing rain', icon:'freezing_rainORsleetORwintry_mix.png', theme:'snow' },
    67: { label:'Heavy freezing rain', icon:'freezing_rainORsleetORwintry_mix.png', theme:'snow' },
    71: { label:'Slight snow fall',    icon:'snow.png',                         theme:'snow' },
    73: { label:'Moderate snow fall',  icon:'heavy_snowORblizzard.png',         theme:'snow' },
    75: { label:'Heavy snow fall',     icon:'heavy_snowORblizzard.png',         theme:'snow' },
    77: { label:'Snow grains',         icon:'snow.png',                         theme:'snow' },
    80: { label:'Slight rain showers', icon:'rain.png',                         theme:'rain' },
    81: { label:'Moderate rain showers', icon:'heavy_rain.png',                 theme:'rain' },
    82: { label:'Violent rain showers', icon:'heavy_rain.png',                  theme:'rain' },
    85: { label:'Slight snow showers', icon:'snow.png',                         theme:'snow' },
    86: { label:'Heavy snow showers',  icon:'heavy_snowORblizzard.png',         theme:'snow' },
    95: { label:'Thunderstorm',        icon:'thunderstorm.png',                 theme:'thunder' },
    96: { label:'Thunder w/ hail',     icon:'thunderstorm.png',                 theme:'thunder' },
    99: { label:'Thunder w/ hail',     icon:'thunderstorm.png',                 theme:'thunder' },
  };

  const pad = n => n.toString().padStart(2,'0');
  const weekday = ds => new Date(ds).toLocaleDateString('en-GB',{weekday:'short'});

  let json;
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API ${res.status}`);
    json = await res.json();
  } catch (e) {
    return console.error('Weather fetch failed', e);
  }

  // Safely pull arrays (or empty defaults)
  const cw        = json.current_weather || {};
  const hrs       = json.hourly          || {};
  const dys       = json.daily           || {};
  const hrTimes   = Array.isArray(hrs.time)   ? hrs.time   : [];
  const hrTemps   = Array.isArray(hrs.temperature_2m) ? hrs.temperature_2m : [];
  const hrCodes   = Array.isArray(hrs.weathercode)     ? hrs.weathercode   : [];
  const dayTimes  = Array.isArray(dys.time)  ? dys.time  : [];
  const dayMin    = Array.isArray(dys.temperature_2m_min) ? dys.temperature_2m_min : [];
  const dayMax    = Array.isArray(dys.temperature_2m_max) ? dys.temperature_2m_max : [];
  const dayCodes  = Array.isArray(dys.weathercode)     ? dys.weathercode     : [];


  // CURRENT
  const cm = CODE_MAP[cw.weathercode] || CODE_MAP[0];
  document.body.classList.add('weather-theme');
  document.body.dataset.condition = cm.theme;

  document.querySelector('.location-title').textContent = 'Bratislava';
  document.querySelector('.sub-location').textContent = 'Bratislava II';
  
  // FIXED: Use cw.temperature (not temperature_2m) for current weather
  document.querySelector('.temp-value').textContent = 
    cw.temperature != null ? Math.round(cw.temperature) + '°' : '--';
  
  document.querySelector('.temp-condition').textContent = cm.label;

  // High/low (today = index 0)
  document.querySelector('.high-temp').textContent = 
    dayMax[0] != null ? Math.round(dayMax[0]) + '°' : '--';
  document.querySelector('.low-temp').textContent = 
    dayMin[0] != null ? Math.round(dayMin[0]) + '°' : '--';
  
  document.querySelector('.conditions-forecast').textContent = cm.label + ' expected.';

  // HOURLY FORECAST - MODIFIED VERSION
  const hrWrap = document.querySelector('.scroll-container');
  hrWrap.innerHTML = '';
  // Get current time from API response
  const currentTime = cw.time ? new Date(cw.time) : new Date();
  const nowHour = currentTime.getHours();
  // Find the index of the current hour in the hourly data
  let startIndex = hrTimes.findIndex(t => {
    const date = new Date(t);
    return date.getHours() === nowHour && date.getDate() === currentTime.getDate();
  });
  // If exact hour not found, find the next available hour
  if (startIndex === -1) {
    startIndex = hrTimes.findIndex(t => new Date(t) >= currentTime);
    if (startIndex === -1) startIndex = 0; // fallback
  }
  // Show next 25 hours
  for (let i = startIndex; i < Math.min(startIndex + 25, hrTimes.length); i++) {
    const t = hrTimes[i];
    const map = CODE_MAP[hrCodes[i]] || CODE_MAP[0];
    const date = new Date(t);
    const isNow = i === startIndex && date.getHours() === nowHour;
    
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.innerHTML = `
      <div class="hour-time">${isNow ? 'Now' : pad(date.getHours())}</div>
      <div class="hour-icon">
        <img class="hour-icon-img" src="ios_icons/${map.icon}" alt="">
      </div>
      <div class="hour-temp">${hrTemps[i] != null ? Math.round(hrTemps[i]) + '°' : '--'}</div>
    `;
    hrWrap.appendChild(card);
  }

  // DAILY FORECAST
  const dayList = document.querySelector('.day-list');
  dayList.innerHTML = '';
  dayTimes.forEach((d,i) => {
    const map = CODE_MAP[dayCodes[i]] || CODE_MAP[0];
    const li = document.createElement('li');
    li.className = 'day-item';
    li.innerHTML = `
      <span class="day-name">${i === 0 ? 'Today' : weekday(d)}</span>
      <span class="chance">
        <img class="hour-icon-img" src="ios_icons/${map.icon}" alt="${map.label}">
      </span>
      <span class="day-range">${
        (dayMin[i] != null ? Math.round(dayMin[i]) + '°' : '--')
      } / ${
        (dayMax[i] != null ? Math.round(dayMax[i]) + '°' : '--')
      }</span>
    `;
    dayList.appendChild(li);
  });
});