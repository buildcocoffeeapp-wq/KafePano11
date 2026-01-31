// Announcement Widget Module

const AnnouncementWidget = {
  currentIndex: 0,
  announcements: [],
  intervalId: null,

  // Get active announcements
  async getAnnouncements() {
    try {
      const snapshot = await database.ref('content/announcements').once('value');
      const announcements = snapshot.val() || {};
      
      const activeAnnouncements = Object.keys(announcements)
        .map(key => ({ id: key, ...announcements[key] }))
        .filter(a => a.active !== false);
      
      // Sort by priority (high first) then by creation date
      activeAnnouncements.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      
      return activeAnnouncements;
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  },

  // Listen for real-time updates
  listenForUpdates(callback) {
    database.ref('content/announcements').on('value', (snapshot) => {
      const announcements = snapshot.val() || {};
      
      const activeAnnouncements = Object.keys(announcements)
        .map(key => ({ id: key, ...announcements[key] }))
        .filter(a => a.active !== false);
      
      activeAnnouncements.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (b.priority === 'high' && a.priority !== 'high') return 1;
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
      
      this.announcements = activeAnnouncements;
      callback(activeAnnouncements);
    });
  },

  // Start announcement rotation
  startRotation(container) {
    this.renderDisplay(container);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Rotate every 10 seconds if multiple announcements
    if (this.announcements.length > 1) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.announcements.length;
        this.renderDisplay(container);
      }, 10000);
    }
  },

  // Stop rotation
  stopRotation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Render as banner
  renderDisplay(container) {
    if (this.announcements.length === 0) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';
    const announcement = this.announcements[this.currentIndex];
    const isHigh = announcement.priority === 'high';

    container.innerHTML = `
      <span class="announcement-icon">${isHigh ? '🔴' : '📢'}</span>
      <div class="announcement-text">
        ${this.announcements.length > 1 ? `
          <div class="announcement-marquee">
            <span>${this.announcements.map(a => a.text).join('  •  ')}</span>
          </div>
        ` : announcement.text}
      </div>
    `;
  },

  // Admin: Get all announcements
  async getAllAnnouncements() {
    try {
      const snapshot = await database.ref('content/announcements').once('value');
      const announcements = snapshot.val() || {};
      
      return Object.keys(announcements).map(key => ({
        id: key,
        ...announcements[key]
      }));
    } catch (error) {
      console.error('Error fetching all announcements:', error);
      return [];
    }
  },

  // Admin: Add announcement
  async addAnnouncement(data) {
    try {
      const newRef = database.ref('content/announcements').push();
      await newRef.set({
        ...data,
        active: true,
        createdAt: Date.now()
      });
      return { success: true, id: newRef.key };
    } catch (error) {
      console.error('Error adding announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Update announcement
  async updateAnnouncement(id, data) {
    try {
      await database.ref(`content/announcements/${id}`).update(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Delete announcement
  async deleteAnnouncement(id) {
    try {
      await database.ref(`content/announcements/${id}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Error deleting announcement:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Toggle active state
  async toggleActive(id, active) {
    return this.updateAnnouncement(id, { active });
  }
};

// Export
window.AnnouncementWidget = AnnouncementWidget;
