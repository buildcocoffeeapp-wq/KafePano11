// Weather Widget Module
// Uses Open-Meteo API (free, no API key required)

const WeatherWidget = {
  city: 'Istanbul',
  latitude: 41.0082,
  longitude: 28.9784,
  intervalId: null,
  
  // City coordinates (common Turkish cities)
  cities: {
    'Istanbul': { lat: 41.0082, lon: 28.9784 },
    'Ankara': { lat: 39.9334, lon: 32.8597 },
    'Izmir': { lat: 38.4237, lon: 27.1428 },
    'Bursa': { lat: 40.1885, lon: 29.0610 },
    'Antalya': { lat: 36.8969, lon: 30.7133 },
    'Adana': { lat: 37.0000, lon: 35.3213 },
    'Konya': { lat: 37.8746, lon: 32.4932 },
    'Gaziantep': { lat: 37.0662, lon: 37.3833 },
    'Mersin': { lat: 36.8121, lon: 34.6415 },
    'Kayseri': { lat: 38.7312, lon: 35.4787 }
  },

  // Weather codes to emoji
  weatherCodes: {
    0: { icon: '☀️', desc: 'Güneşli' },
    1: { icon: '🌤️', desc: 'Az Bulutlu' },
    2: { icon: '⛅', desc: 'Parçalı Bulutlu' },
    3: { icon: '☁️', desc: 'Bulutlu' },
    45: { icon: '🌫️', desc: 'Sisli' },
    48: { icon: '🌫️', desc: 'Kırağılı Sis' },
    51: { icon: '🌧️', desc: 'Hafif Yağmur' },
    53: { icon: '🌧️', desc: 'Yağmurlu' },
    55: { icon: '🌧️', desc: 'Şiddetli Yağmur' },
    61: { icon: '🌧️', desc: 'Hafif Yağmur' },
    63: { icon: '🌧️', desc: 'Yağmurlu' },
    65: { icon: '🌧️', desc: 'Şiddetli Yağmur' },
    71: { icon: '🌨️', desc: 'Hafif Kar' },
    73: { icon: '🌨️', desc: 'Karlı' },
    75: { icon: '🌨️', desc: 'Yoğun Kar' },
    80: { icon: '🌦️', desc: 'Sağanak' },
    81: { icon: '🌦️', desc: 'Sağanak' },
    82: { icon: '⛈️', desc: 'Şiddetli Sağanak' },
    95: { icon: '⛈️', desc: 'Gök Gürültülü' },
    96: { icon: '⛈️', desc: 'Dolu' },
    99: { icon: '⛈️', desc: 'Şiddetli Dolu' }
  },

  // Fetch weather data
  async fetchWeather() {
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.latitude}&longitude=${this.longitude}&current=temperature_2m,weather_code&timezone=auto`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.current) {
        const code = data.current.weather_code;
        const weather = this.weatherCodes[code] || { icon: '🌡️', desc: 'Bilinmiyor' };
        
        return {
          success: true,
          temp: Math.round(data.current.temperature_2m),
          icon: weather.icon,
          description: weather.desc,
          city: this.city
        };
      }
      
      throw new Error('No weather data');
    } catch (error) {
      console.error('Error fetching weather:', error);
      return {
        success: false,
        temp: '--',
        icon: '🌡️',
        description: 'Yüklenemedi',
        city: this.city
      };
    }
  },

  // Start weather updates
  async start(container) {
    // Load settings
    const settings = await this.getSettings();
    this.setCity(settings.city || 'Istanbul');
    
    // Initial fetch
    await this.update(container);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Update every 30 minutes
    this.intervalId = setInterval(async () => {
      await this.update(container);
    }, 30 * 60 * 1000);
  },

  // Stop updates
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Update display
  async update(container) {
    const weather = await this.fetchWeather();
    
    container.innerHTML = `
      <span class="weather-icon">${weather.icon}</span>
      <span class="weather-temp">${weather.temp}°C</span>
    `;
  },

  // Render full widget
  async renderWidget(container) {
    const weather = await this.fetchWeather();
    
    container.innerHTML = `
      <div class="weather-full">
        <div class="weather-city">${weather.city}</div>
        <div class="weather-main">
          <span class="weather-icon-large">${weather.icon}</span>
          <span class="weather-temp-large">${weather.temp}°C</span>
        </div>
        <div class="weather-desc">${weather.description}</div>
      </div>
    `;
  },

  // Set city
  setCity(cityName) {
    const city = this.cities[cityName];
    if (city) {
      this.city = cityName;
      this.latitude = city.lat;
      this.longitude = city.lon;
    }
  },

  // Get available cities
  getCities() {
    return Object.keys(this.cities);
  },

  // Get settings from database
  async getSettings() {
    try {
      const snapshot = await database.ref('widgets/weather').once('value');
      return snapshot.val() || { city: 'Istanbul', enabled: true };
    } catch (error) {
      console.error('Error fetching weather settings:', error);
      return { city: 'Istanbul', enabled: true };
    }
  },

  // Save settings
  async saveSettings(settings) {
    try {
      await database.ref('widgets/weather').update(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving weather settings:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export
window.WeatherWidget = WeatherWidget;
