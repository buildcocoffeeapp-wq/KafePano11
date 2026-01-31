// Display Screen Logic
// This runs on the tablet/display screen

document.addEventListener('DOMContentLoaded', async () => {
  // Load settings and initialize widgets
  await initializeDisplay();
});

async function initializeDisplay() {
  // Get settings
  const settings = await getSettings();
  
  // Apply theme
  applyTheme(settings);
  
  // Update cafe name
  document.getElementById('cafeName').textContent = settings.cafeName || 'KafePano';
  
  // Initialize widgets based on settings
  await initializeWidgets(settings);
  
  // Listen for settings changes
  database.ref('settings').on('value', (snapshot) => {
    const newSettings = snapshot.val() || {};
    applyTheme(newSettings);
    document.getElementById('cafeName').textContent = newSettings.cafeName || 'KafePano';
  });
}

async function getSettings() {
  try {
    const snapshot = await database.ref('settings').once('value');
    return snapshot.val() || getDefaultSettings();
  } catch (error) {
    console.error('Error loading settings:', error);
    return getDefaultSettings();
  }
}

function getDefaultSettings() {
  return {
    cafeName: 'KafePano',
    theme: 'light',
    primaryColor: '#8B4513',
    widgets: {
      calendar: { enabled: true },
      gallery: { enabled: true, interval: 5 },
      announcement: { enabled: true },
      clock: { enabled: true, format24h: true },
      weather: { enabled: true, city: 'Istanbul' },
      menu: { enabled: false }
    }
  };
}

function applyTheme(settings) {
  const body = document.body;
  
  // Remove existing theme classes
  body.classList.remove('dark-theme', 'custom-theme');
  
  if (settings.theme === 'dark') {
    body.classList.add('dark-theme');
  }
  
  // Apply custom colors
  if (settings.primaryColor) {
    body.style.setProperty('--primary-color', settings.primaryColor);
  }
  if (settings.secondaryColor) {
    body.style.setProperty('--secondary-color', settings.secondaryColor);
  }
}

async function initializeWidgets(settings) {
  const widgets = settings.widgets || {};
  
  // Clock Widget (always in header)
  if (widgets.clock?.enabled !== false) {
    const clockContainer = document.getElementById('clockWidget');
    ClockWidget.start(clockContainer, {
      format24h: widgets.clock?.format24h !== false,
      showDate: widgets.clock?.showDate !== false
    });
  }
  
  // Weather Widget (header)
  if (widgets.weather?.enabled !== false) {
    const weatherContainer = document.getElementById('weatherWidget');
    weatherContainer.style.display = 'flex';
    await WeatherWidget.start(weatherContainer);
  } else {
    document.getElementById('weatherWidget').style.display = 'none';
  }
  
  // Calendar Widget
  if (widgets.calendar?.enabled !== false) {
    const calendarContent = document.querySelector('#calendarWidget .widget-content');
    document.getElementById('calendarWidget').style.display = 'flex';
    document.getElementById('calendarDate').textContent = CalendarWidget.getTodayFormatted();
    
    CalendarWidget.listenForUpdates((events) => {
      CalendarWidget.renderDisplay(events, calendarContent);
    });
  } else {
    document.getElementById('calendarWidget').style.display = 'none';
  }
  
  // Gallery Widget
  if (widgets.gallery?.enabled !== false) {
    const galleryContent = document.querySelector('#galleryWidget .widget-content');
    document.getElementById('galleryWidget').style.display = 'flex';
    
    GalleryWidget.listenForUpdates((photos) => {
      GalleryWidget.photos = photos;
      if (photos.length > 0) {
        GalleryWidget.startSlideshow(galleryContent, (widgets.gallery?.interval || 5) * 1000);
      } else {
        GalleryWidget.renderDisplay(galleryContent);
      }
    });
  } else {
    document.getElementById('galleryWidget').style.display = 'none';
  }
  
  // Announcement Widget
  if (widgets.announcement?.enabled !== false) {
    const announcementBanner = document.getElementById('announcementBanner');
    
    AnnouncementWidget.listenForUpdates((announcements) => {
      AnnouncementWidget.announcements = announcements;
      AnnouncementWidget.startRotation(announcementBanner);
    });
  } else {
    document.getElementById('announcementBanner').style.display = 'none';
  }
  
  // Menu Widget
  if (widgets.menu?.enabled) {
    const menuContent = document.querySelector('#menuWidget .widget-content');
    document.getElementById('menuWidget').style.display = 'flex';
    
    MenuWidget.listenForUpdates((items) => {
      MenuWidget.renderDisplay(items, menuContent);
    });
  } else {
    const menuWidget = document.getElementById('menuWidget');
    if (menuWidget) menuWidget.style.display = 'none';
  }
}

// Fullscreen toggle
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log('Fullscreen error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

// Handle visibility change (for slideshow pause/resume)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    GalleryWidget.stopSlideshow();
    AnnouncementWidget.stopRotation();
  } else {
    // Restart when visible
    const galleryContent = document.querySelector('#galleryWidget .widget-content');
    const announcementBanner = document.getElementById('announcementBanner');
    
    if (galleryContent && GalleryWidget.photos.length > 0) {
      GalleryWidget.startSlideshow(galleryContent);
    }
    if (announcementBanner && AnnouncementWidget.announcements.length > 0) {
      AnnouncementWidget.startRotation(announcementBanner);
    }
  }
});

// Double-click for fullscreen
document.addEventListener('dblclick', toggleFullscreen);
