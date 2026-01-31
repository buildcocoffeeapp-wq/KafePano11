// Clock Widget Module

const ClockWidget = {
  intervalId: null,
  format24h: true,
  showDate: true,

  // Start clock
  start(container, options = {}) {
    this.format24h = options.format24h !== false;
    this.showDate = options.showDate !== false;
    
    this.update(container);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Update every second
    this.intervalId = setInterval(() => {
      this.update(container);
    }, 1000);
  },

  // Stop clock
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Update display
  update(container) {
    const now = new Date();
    const time = this.formatTime(now);
    const date = this.formatDate(now);

    if (container.classList.contains('clock-widget')) {
      // Header clock (compact)
      container.innerHTML = `
        <div class="clock-time">${time}</div>
        ${this.showDate ? `<div class="clock-date">${date}</div>` : ''}
      `;
    } else {
      // Widget clock (full)
      container.innerHTML = `
        <div class="clock-display">
          <div class="clock-time-large">${time}</div>
          <div class="clock-date-large">${date}</div>
        </div>
      `;
    }
  },

  // Format time
  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (!this.format24h) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  },

  // Format date
  formatDate(date) {
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    };
    return date.toLocaleDateString('tr-TR', options);
  },

  // Get settings from database
  async getSettings() {
    try {
      const snapshot = await database.ref('widgets/clock').once('value');
      return snapshot.val() || { format24h: true, showDate: true };
    } catch (error) {
      console.error('Error fetching clock settings:', error);
      return { format24h: true, showDate: true };
    }
  },

  // Save settings
  async saveSettings(settings) {
    try {
      await database.ref('widgets/clock').update(settings);
      return { success: true };
    } catch (error) {
      console.error('Error saving clock settings:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export
window.ClockWidget = ClockWidget;
