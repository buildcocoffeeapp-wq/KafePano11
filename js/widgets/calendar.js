// Calendar Widget Module

const CalendarWidget = {
  // Get today's events
  async getEvents() {
    try {
      const snapshot = await database.ref('content/events').once('value');
      const events = snapshot.val() || {};
      
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = [];
      
      Object.keys(events).forEach(key => {
        const event = events[key];
        if (event.date === today) {
          todayEvents.push({ id: key, ...event });
        }
      });
      
      // Sort by time
      todayEvents.sort((a, b) => a.time.localeCompare(b.time));
      
      return todayEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },

  // Listen for real-time updates
  listenForUpdates(callback) {
    const today = new Date().toISOString().split('T')[0];
    
    database.ref('content/events').on('value', (snapshot) => {
      const events = snapshot.val() || {};
      const todayEvents = [];
      
      Object.keys(events).forEach(key => {
        const event = events[key];
        if (event.date === today) {
          todayEvents.push({ id: key, ...event });
        }
      });
      
      todayEvents.sort((a, b) => a.time.localeCompare(b.time));
      callback(todayEvents);
    });
  },

  // Render events in display mode
  renderDisplay(events, container) {
    if (events.length === 0) {
      container.innerHTML = `
        <div class="no-events">
          <div class="no-events-icon">📅</div>
          <p>Bugün için etkinlik yok</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="event-list">
        ${events.map(event => `
          <div class="event-item">
            <span class="event-time">${event.time}</span>
            <span class="event-icon">${event.icon || '📌'}</span>
            <div class="event-details">
              <div class="event-title">${event.title}</div>
              ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Admin: Get all events
  async getAllEvents() {
    try {
      const snapshot = await database.ref('content/events').once('value');
      const events = snapshot.val() || {};
      
      const allEvents = Object.keys(events).map(key => ({
        id: key,
        ...events[key]
      }));
      
      // Sort by date and time
      allEvents.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
      
      return allEvents;
    } catch (error) {
      console.error('Error fetching all events:', error);
      return [];
    }
  },

  // Admin: Add event
  async addEvent(eventData) {
    try {
      const newRef = database.ref('content/events').push();
      await newRef.set(eventData);
      return { success: true, id: newRef.key };
    } catch (error) {
      console.error('Error adding event:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Update event
  async updateEvent(eventId, eventData) {
    try {
      await database.ref(`content/events/${eventId}`).update(eventData);
      return { success: true };
    } catch (error) {
      console.error('Error updating event:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Delete event
  async deleteEvent(eventId) {
    try {
      await database.ref(`content/events/${eventId}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { success: false, error: error.message };
    }
  },

  // Format date for display
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return date.toLocaleDateString('tr-TR', options);
  },

  // Get today's date formatted
  getTodayFormatted() {
    return this.formatDate(new Date().toISOString().split('T')[0]);
  }
};

// Export
window.CalendarWidget = CalendarWidget;
