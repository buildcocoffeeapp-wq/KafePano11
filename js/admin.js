// Admin Panel Logic
// This runs on the phone/management device

let currentUser = null;
let settings = {};

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  currentUser = await requireAuth();
  if (!currentUser) return;
  
  // Load settings and data
  await initializeAdmin();
});

async function initializeAdmin() {
  // Show loading
  showLoading(true);
  
  // Load settings
  settings = await loadSettings();
  
  // Apply settings to form
  applySettingsToForm(settings);
  
  // Load widgets data
  await loadCalendarEvents();
  await loadGalleryPhotos();
  await loadAnnouncements();
  await loadMenuItems();
  
  // Setup event listeners
  setupEventListeners();
  
  // Hide loading
  showLoading(false);
}

// Settings Management
async function loadSettings() {
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

function applySettingsToForm(settings) {
  // Cafe name
  const cafeNameInput = document.getElementById('cafeName');
  if (cafeNameInput) cafeNameInput.value = settings.cafeName || '';
  
  // Logo
  const logoPreview = document.getElementById('logoPreview');
  const logoPlaceholder = document.getElementById('logoPlaceholder');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  
  if (settings.logoUrl) {
    logoPreview.src = settings.logoUrl;
    logoPreview.style.display = 'block';
    logoPlaceholder.style.display = 'none';
    removeLogoBtn.style.display = 'inline-flex';
  } else {
    logoPreview.style.display = 'none';
    logoPlaceholder.style.display = 'flex';
    removeLogoBtn.style.display = 'none';
  }
  
  // Theme
  const themeSelect = document.getElementById('themeSelect');
  if (themeSelect) themeSelect.value = settings.theme || 'light';
  
  // Primary color (both picker and hex input)
  const colorPicker = document.getElementById('primaryColor');
  const colorHex = document.getElementById('primaryColorHex');
  const colorValue = settings.primaryColor || '#8B4513';
  
  if (colorPicker) colorPicker.value = colorValue;
  if (colorHex) colorHex.value = colorValue.toUpperCase();
  
  // Widget toggles
  const widgets = settings.widgets || {};
  Object.keys(widgets).forEach(widgetName => {
    const toggle = document.getElementById(`${widgetName}Toggle`);
    if (toggle) toggle.checked = widgets[widgetName]?.enabled !== false;
  });
  
  // Weather city
  const citySelect = document.getElementById('weatherCity');
  if (citySelect) citySelect.value = widgets.weather?.city || 'Istanbul';
  
  // Gallery interval
  const galleryInterval = document.getElementById('galleryInterval');
  if (galleryInterval) galleryInterval.value = widgets.gallery?.interval || 5;
  
  // Clock format
  const clockFormat = document.getElementById('clockFormat');
  if (clockFormat) clockFormat.value = widgets.clock?.format24h !== false ? '24h' : '12h';
}

async function saveSettings() {
  const newSettings = {
    cafeName: document.getElementById('cafeName')?.value || 'KafePano',
    logoUrl: settings.logoUrl || '', // Preserve logo URL
    theme: document.getElementById('themeSelect')?.value || 'light',
    primaryColor: document.getElementById('primaryColor')?.value || '#8B4513',
    widgets: {
      calendar: { enabled: document.getElementById('calendarToggle')?.checked ?? true },
      gallery: { 
        enabled: document.getElementById('galleryToggle')?.checked ?? true,
        interval: parseInt(document.getElementById('galleryInterval')?.value) || 5
      },
      announcement: { enabled: document.getElementById('announcementToggle')?.checked ?? true },
      clock: { 
        enabled: document.getElementById('clockToggle')?.checked ?? true,
        format24h: document.getElementById('clockFormat')?.value === '24h'
      },
      weather: { 
        enabled: document.getElementById('weatherToggle')?.checked ?? true,
        city: document.getElementById('weatherCity')?.value || 'Istanbul'
      },
      menu: { enabled: document.getElementById('menuToggle')?.checked ?? false }
    }
  };
  
  try {
    await database.ref('settings').set(newSettings);
    settings = newSettings;
    showToast('Ayarlar kaydedildi', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showToast('Ayarlar kaydedilemedi', 'error');
  }
}

// ===== LOGO UPLOAD =====
async function handleLogoUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Lütfen PNG, JPG veya WEBP formatında bir dosya seçin', 'error');
    input.value = '';
    return;
  }
  
  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    showToast('Dosya boyutu 2MB\'dan küçük olmalıdır', 'error');
    input.value = '';
    return;
  }
  
  showToast('Logo yükleniyor...', 'info');
  
  try {
    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (data.secure_url) {
      // Update settings with logo URL
      settings.logoUrl = data.secure_url;
      await database.ref('settings/logoUrl').set(data.secure_url);
      
      // Update UI
      const logoPreview = document.getElementById('logoPreview');
      const logoPlaceholder = document.getElementById('logoPlaceholder');
      const removeLogoBtn = document.getElementById('removeLogoBtn');
      
      logoPreview.src = data.secure_url;
      logoPreview.style.display = 'block';
      logoPlaceholder.style.display = 'none';
      removeLogoBtn.style.display = 'inline-flex';
      
      showToast('Logo başarıyla yüklendi', 'success');
    } else {
      throw new Error(data.error?.message || 'Yükleme başarısız');
    }
  } catch (error) {
    console.error('Logo upload error:', error);
    showToast('Logo yüklenemedi: ' + error.message, 'error');
  }
  
  input.value = '';
}

async function removeLogo() {
  if (!confirm('Logoyu kaldırmak istediğinize emin misiniz?')) return;
  
  try {
    settings.logoUrl = '';
    await database.ref('settings/logoUrl').set('');
    
    // Update UI
    const logoPreview = document.getElementById('logoPreview');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    
    logoPreview.src = '';
    logoPreview.style.display = 'none';
    logoPlaceholder.style.display = 'flex';
    removeLogoBtn.style.display = 'none';
    
    showToast('Logo kaldırıldı', 'success');
  } catch (error) {
    console.error('Error removing logo:', error);
    showToast('Logo kaldırılamadı', 'error');
  }
}

// ===== COLOR SYNC =====
function syncColorInputs(source) {
  const colorPicker = document.getElementById('primaryColor');
  const colorHex = document.getElementById('primaryColorHex');
  
  if (source === 'picker') {
    colorHex.value = colorPicker.value.toUpperCase();
  } else if (source === 'hex') {
    let hexValue = colorHex.value.trim();
    
    // Add # if missing
    if (!hexValue.startsWith('#')) {
      hexValue = '#' + hexValue;
    }
    
    // Validate hex format
    if (/^#[0-9A-Fa-f]{6}$/.test(hexValue)) {
      colorPicker.value = hexValue;
      colorHex.value = hexValue.toUpperCase();
    }
  }
}

// Calendar Events
async function loadCalendarEvents() {
  const events = await CalendarWidget.getAllEvents();
  renderEventList(events);
}

function renderEventList(events) {
  const container = document.getElementById('eventList');
  if (!container) return;
  
  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p class="empty-state-text">Henüz etkinlik eklenmemiş</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = events.map(event => `
    <div class="item-card" data-id="${event.id}">
      <span class="item-icon">${event.icon || '📌'}</span>
      <div class="item-details">
        <div class="item-title">${event.title}</div>
        <div class="item-subtitle">${event.date} - ${event.time}</div>
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editEvent('${event.id}')">✏️</button>
        <button class="btn-small btn-delete" onclick="deleteEvent('${event.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function showEventModal(event = null) {
  const modal = document.getElementById('eventModal');
  const form = document.getElementById('eventForm');
  const title = document.getElementById('eventModalTitle');
  
  if (event) {
    title.textContent = 'Etkinlik Düzenle';
    form.dataset.id = event.id;
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventDate').value = event.date || '';
    document.getElementById('eventTime').value = event.time || '';
    document.getElementById('eventDescription').value = event.description || '';
    document.getElementById('eventIcon').value = event.icon || '📌';
  } else {
    title.textContent = 'Yeni Etkinlik';
    form.dataset.id = '';
    form.reset();
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventIcon').value = '📌';
  }
  
  modal.classList.add('show');
}

function hideEventModal() {
  document.getElementById('eventModal').classList.remove('show');
}

async function saveEvent() {
  const form = document.getElementById('eventForm');
  const eventId = form.dataset.id;
  
  const eventData = {
    title: document.getElementById('eventTitle').value,
    date: document.getElementById('eventDate').value,
    time: document.getElementById('eventTime').value,
    description: document.getElementById('eventDescription').value,
    icon: document.getElementById('eventIcon').value || '📌'
  };
  
  if (!eventData.title || !eventData.date || !eventData.time) {
    showToast('Lütfen gerekli alanları doldurun', 'error');
    return;
  }
  
  let result;
  if (eventId) {
    result = await CalendarWidget.updateEvent(eventId, eventData);
  } else {
    result = await CalendarWidget.addEvent(eventData);
  }
  
  if (result.success) {
    hideEventModal();
    await loadCalendarEvents();
    showToast('Etkinlik kaydedildi', 'success');
  } else {
    showToast('Hata oluştu', 'error');
  }
}

async function editEvent(id) {
  const events = await CalendarWidget.getAllEvents();
  const event = events.find(e => e.id === id);
  if (event) showEventModal(event);
}

async function deleteEvent(id) {
  if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
  
  const result = await CalendarWidget.deleteEvent(id);
  if (result.success) {
    await loadCalendarEvents();
    showToast('Etkinlik silindi', 'success');
  } else {
    showToast('Silinemedi', 'error');
  }
}

// Gallery Photos
async function loadGalleryPhotos() {
  const photos = await GalleryWidget.getPhotos();
  renderPhotoList(photos);
}

function renderPhotoList(photos) {
  const container = document.getElementById('photoList');
  if (!container) return;
  
  if (photos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🖼️</div>
        <p class="empty-state-text">Henüz fotoğraf eklenmemiş</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = `
    <div class="gallery-grid">
      ${photos.map(photo => `
        <div class="gallery-item" data-id="${photo.id}">
          <img src="${photo.url}" alt="${photo.caption || ''}">
          <div class="gallery-item-overlay">
            <button class="btn-small btn-delete" onclick="deletePhoto('${photo.id}')">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showPhotoModal() {
  document.getElementById('photoModal').classList.add('show');
  document.getElementById('photoPreview').innerHTML = '';
  document.getElementById('photoCaption').value = '';
  document.getElementById('photoUrl').value = '';
}

function hidePhotoModal() {
  document.getElementById('photoModal').classList.remove('show');
}

// Handle file upload
async function handlePhotoUpload(input) {
  const file = input.files[0];
  if (!file) {
    showToast('Dosya seçilemedi', 'error');
    return;
  }
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    showToast('Lütfen PNG, JPG, GIF veya WEBP formatında bir dosya seçin', 'error');
    input.value = '';
    return;
  }
  
  // Validate file size (max 10MB for photos)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('Dosya boyutu 10MB\'dan küçük olmalıdır', 'error');
    input.value = '';
    return;
  }
  
  // Show preview first
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('photoPreview').innerHTML = `
      <img src="${e.target.result}" class="image-preview" alt="Preview">
      <div class="upload-progress">Yükleniyor...</div>
    `;
  };
  reader.onerror = () => {
    showToast('Dosya okunamadı', 'error');
  };
  reader.readAsDataURL(file);
  
  // Upload to Cloudinary
  showToast('Fotoğraf yükleniyor...', 'info');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );
    
    const data = await response.json();
    
    if (data.secure_url) {
      document.getElementById('photoUrl').value = data.secure_url;
      document.getElementById('photoPreview').innerHTML = `
        <img src="${data.secure_url}" class="image-preview" alt="Preview">
        <div class="upload-success">✓ Yüklendi</div>
      `;
      showToast('Fotoğraf başarıyla yüklendi', 'success');
    } else {
      throw new Error(data.error?.message || 'Cloudinary yükleme hatası');
    }
  } catch (error) {
    console.error('Photo upload error:', error);
    document.getElementById('photoPreview').innerHTML = `
      <div class="upload-error">❌ Yükleme başarısız</div>
    `;
    showToast('Fotoğraf yüklenemedi: ' + error.message, 'error');
  }
  
  input.value = ''; // Reset file input for re-selection
}

async function savePhoto() {
  const url = document.getElementById('photoUrl').value;
  const caption = document.getElementById('photoCaption').value;
  
  if (!url) {
    showToast('Lütfen bir fotoğraf yükleyin veya URL girin', 'error');
    return;
  }
  
  const result = await GalleryWidget.addPhoto({ url, caption });
  
  if (result.success) {
    hidePhotoModal();
    await loadGalleryPhotos();
    showToast('Fotoğraf eklendi', 'success');
  } else {
    showToast('Hata oluştu', 'error');
  }
}

async function deletePhoto(id) {
  if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
  
  const result = await GalleryWidget.deletePhoto(id);
  if (result.success) {
    await loadGalleryPhotos();
    showToast('Fotoğraf silindi', 'success');
  } else {
    showToast('Silinemedi', 'error');
  }
}

// Announcements
async function loadAnnouncements() {
  const announcements = await AnnouncementWidget.getAllAnnouncements();
  renderAnnouncementList(announcements);
}

function renderAnnouncementList(announcements) {
  const container = document.getElementById('announcementList');
  if (!container) return;
  
  if (announcements.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📢</div>
        <p class="empty-state-text">Henüz duyuru eklenmemiş</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = announcements.map(ann => `
    <div class="item-card ${!ann.active ? 'inactive' : ''}" data-id="${ann.id}">
      <span class="item-icon">${ann.priority === 'high' ? '🔴' : '📢'}</span>
      <div class="item-details">
        <div class="item-title">${ann.text}</div>
        <div class="item-subtitle">${ann.active ? 'Aktif' : 'Pasif'}</div>
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editAnnouncement('${ann.id}')">✏️</button>
        <button class="btn-small btn-delete" onclick="deleteAnnouncement('${ann.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function showAnnouncementModal(announcement = null) {
  const modal = document.getElementById('announcementModal');
  const form = document.getElementById('announcementForm');
  const title = document.getElementById('announcementModalTitle');
  
  if (announcement) {
    title.textContent = 'Duyuru Düzenle';
    form.dataset.id = announcement.id;
    document.getElementById('announcementText').value = announcement.text || '';
    document.getElementById('announcementPriority').value = announcement.priority || 'normal';
    document.getElementById('announcementActive').checked = announcement.active !== false;
  } else {
    title.textContent = 'Yeni Duyuru';
    form.dataset.id = '';
    form.reset();
    document.getElementById('announcementActive').checked = true;
  }
  
  modal.classList.add('show');
}

function hideAnnouncementModal() {
  document.getElementById('announcementModal').classList.remove('show');
}

async function saveAnnouncement() {
  const form = document.getElementById('announcementForm');
  const annId = form.dataset.id;
  
  const annData = {
    text: document.getElementById('announcementText').value,
    priority: document.getElementById('announcementPriority').value,
    active: document.getElementById('announcementActive').checked
  };
  
  if (!annData.text) {
    showToast('Lütfen duyuru metnini girin', 'error');
    return;
  }
  
  let result;
  if (annId) {
    result = await AnnouncementWidget.updateAnnouncement(annId, annData);
  } else {
    result = await AnnouncementWidget.addAnnouncement(annData);
  }
  
  if (result.success) {
    hideAnnouncementModal();
    await loadAnnouncements();
    showToast('Duyuru kaydedildi', 'success');
  } else {
    showToast('Hata oluştu', 'error');
  }
}

async function editAnnouncement(id) {
  const announcements = await AnnouncementWidget.getAllAnnouncements();
  const ann = announcements.find(a => a.id === id);
  if (ann) showAnnouncementModal(ann);
}

async function deleteAnnouncement(id) {
  if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
  
  const result = await AnnouncementWidget.deleteAnnouncement(id);
  if (result.success) {
    await loadAnnouncements();
    showToast('Duyuru silindi', 'success');
  } else {
    showToast('Silinemedi', 'error');
  }
}

// Menu Items
async function loadMenuItems() {
  const items = await MenuWidget.getMenuItems();
  renderMenuList(items);
}

function renderMenuList(items) {
  const container = document.getElementById('menuList');
  if (!container) return;
  
  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍽️</div>
        <p class="empty-state-text">Henüz menü eklenmemiş</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = items.map(item => `
    <div class="item-card ${!item.available ? 'inactive' : ''}" data-id="${item.id}">
      <span class="item-icon">${item.icon || '🍽️'}</span>
      <div class="item-details">
        <div class="item-title">${item.name}</div>
        <div class="item-subtitle">${item.price} ${!item.available ? '(Tükendi)' : ''}</div>
      </div>
      <div class="item-actions">
        <button class="btn-small btn-edit" onclick="editMenuItem('${item.id}')">✏️</button>
        <button class="btn-small btn-delete" onclick="deleteMenuItem('${item.id}')">🗑️</button>
      </div>
    </div>
  `).join('');
}

function showMenuModal(item = null) {
  const modal = document.getElementById('menuModal');
  const form = document.getElementById('menuForm');
  const title = document.getElementById('menuModalTitle');
  
  if (item) {
    title.textContent = 'Menü Düzenle';
    form.dataset.id = item.id;
    document.getElementById('menuName').value = item.name || '';
    document.getElementById('menuDescription').value = item.description || '';
    document.getElementById('menuPrice').value = item.price || '';
    document.getElementById('menuIcon').value = item.icon || '🍽️';
    document.getElementById('menuAvailable').checked = item.available !== false;
  } else {
    title.textContent = 'Yeni Menü';
    form.dataset.id = '';
    form.reset();
    document.getElementById('menuAvailable').checked = true;
    document.getElementById('menuIcon').value = '🍽️';
  }
  
  modal.classList.add('show');
}

function hideMenuModal() {
  document.getElementById('menuModal').classList.remove('show');
}

async function saveMenuItem() {
  const form = document.getElementById('menuForm');
  const itemId = form.dataset.id;
  
  const itemData = {
    name: document.getElementById('menuName').value,
    description: document.getElementById('menuDescription').value,
    price: document.getElementById('menuPrice').value,
    icon: document.getElementById('menuIcon').value || '🍽️',
    available: document.getElementById('menuAvailable').checked
  };
  
  if (!itemData.name || !itemData.price) {
    showToast('Lütfen gerekli alanları doldurun', 'error');
    return;
  }
  
  let result;
  if (itemId) {
    result = await MenuWidget.updateMenuItem(itemId, itemData);
  } else {
    result = await MenuWidget.addMenuItem(itemData);
  }
  
  if (result.success) {
    hideMenuModal();
    await loadMenuItems();
    showToast('Menü kaydedildi', 'success');
  } else {
    showToast('Hata oluştu', 'error');
  }
}

async function editMenuItem(id) {
  const items = await MenuWidget.getMenuItems();
  const item = items.find(i => i.id === id);
  if (item) showMenuModal(item);
}

async function deleteMenuItem(id) {
  if (!confirm('Bu menüyü silmek istediğinize emin misiniz?')) return;
  
  const result = await MenuWidget.deleteMenuItem(id);
  if (result.success) {
    await loadMenuItems();
    showToast('Menü silindi', 'success');
  } else {
    showToast('Silinemedi', 'error');
  }
}

// Utility Functions
function setupEventListeners() {
  // Toggle widget sections
  document.querySelectorAll('.widget-section-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle when clicking on the toggle switch itself
      if (e.target.closest('.toggle-switch')) return;
      
      const section = header.closest('.widget-section');
      section.classList.toggle('collapsed');
    });
  });
  
  // Widget toggles - save immediately AND update instantly
  document.querySelectorAll('.widget-toggle').forEach(toggle => {
    toggle.addEventListener('change', async (e) => {
      const toggleId = e.target.id;
      const isEnabled = e.target.checked;
      
      // Map toggle IDs to widget names
      const widgetMap = {
        'calendarToggle': 'calendar',
        'galleryToggle': 'gallery',
        'announcementToggle': 'announcement',
        'clockToggle': 'clock',
        'weatherToggle': 'weather',
        'menuToggle': 'menu'
      };
      
      const widgetName = widgetMap[toggleId];
      
      if (widgetName) {
        try {
          // Instant Firebase update for the specific widget
          await database.ref(`settings/widgets/${widgetName}/enabled`).set(isEnabled);
          
          // Update local settings
          if (!settings.widgets) settings.widgets = {};
          if (!settings.widgets[widgetName]) settings.widgets[widgetName] = {};
          settings.widgets[widgetName].enabled = isEnabled;
          
          showToast(`${widgetName.charAt(0).toUpperCase() + widgetName.slice(1)} ${isEnabled ? 'açıldı' : 'kapatıldı'}`, 'success');
        } catch (error) {
          console.error('Toggle update error:', error);
          // Revert toggle on error
          e.target.checked = !isEnabled;
          showToast('Güncelleme başarısız', 'error');
        }
      } else {
        // For non-mapped toggles, save all settings
        saveSettings();
      }
    });
  });
  
  // Settings form
  document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings();
  });
  
  // Theme select - instant update
  document.getElementById('themeSelect')?.addEventListener('change', async (e) => {
    try {
      await database.ref('settings/theme').set(e.target.value);
      settings.theme = e.target.value;
      showToast('Tema güncellendi', 'success');
    } catch (error) {
      showToast('Tema güncellenemedi', 'error');
    }
  });
  
  // Weather city - instant update
  document.getElementById('weatherCity')?.addEventListener('change', async (e) => {
    try {
      await database.ref('settings/widgets/weather/city').set(e.target.value);
      if (!settings.widgets) settings.widgets = {};
      if (!settings.widgets.weather) settings.widgets.weather = {};
      settings.widgets.weather.city = e.target.value;
      showToast('Şehir güncellendi', 'success');
    } catch (error) {
      showToast('Şehir güncellenemedi', 'error');
    }
  });
  
  // Gallery interval - instant update
  document.getElementById('galleryInterval')?.addEventListener('change', async (e) => {
    const interval = parseInt(e.target.value) || 5;
    try {
      await database.ref('settings/widgets/gallery/interval').set(interval);
      if (!settings.widgets) settings.widgets = {};
      if (!settings.widgets.gallery) settings.widgets.gallery = {};
      settings.widgets.gallery.interval = interval;
      showToast('Slayt süresi güncellendi', 'success');
    } catch (error) {
      showToast('Güncelleme başarısız', 'error');
    }
  });
  
  // Clock format - instant update
  document.getElementById('clockFormat')?.addEventListener('change', async (e) => {
    const is24h = e.target.value === '24h';
    try {
      await database.ref('settings/widgets/clock/format24h').set(is24h);
      if (!settings.widgets) settings.widgets = {};
      if (!settings.widgets.clock) settings.widgets.clock = {};
      settings.widgets.clock.format24h = is24h;
      showToast('Saat formatı güncellendi', 'success');
    } catch (error) {
      showToast('Güncelleme başarısız', 'error');
    }
  });
  
  // Cafe name - debounced update
  let cafeNameTimeout;
  document.getElementById('cafeName')?.addEventListener('input', (e) => {
    clearTimeout(cafeNameTimeout);
    cafeNameTimeout = setTimeout(async () => {
      try {
        await database.ref('settings/cafeName').set(e.target.value || 'KafePano');
        settings.cafeName = e.target.value;
      } catch (error) {
        console.error('Cafe name update error:', error);
      }
    }, 500);
  });
  
  // Primary color - instant update
  document.getElementById('primaryColor')?.addEventListener('change', async (e) => {
    try {
      await database.ref('settings/primaryColor').set(e.target.value);
      settings.primaryColor = e.target.value;
      showToast('Renk güncellendi', 'success');
    } catch (error) {
      showToast('Renk güncellenemedi', 'error');
    }
  });
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  // Show
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Expose functions globally
window.showEventModal = showEventModal;
window.hideEventModal = hideEventModal;
window.saveEvent = saveEvent;
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;

window.showPhotoModal = showPhotoModal;
window.hidePhotoModal = hidePhotoModal;
window.handlePhotoUpload = handlePhotoUpload;
window.savePhoto = savePhoto;
window.deletePhoto = deletePhoto;

window.showAnnouncementModal = showAnnouncementModal;
window.hideAnnouncementModal = hideAnnouncementModal;
window.saveAnnouncement = saveAnnouncement;
window.editAnnouncement = editAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;

window.showMenuModal = showMenuModal;
window.hideMenuModal = hideMenuModal;
window.saveMenuItem = saveMenuItem;
window.editMenuItem = editMenuItem;
window.deleteMenuItem = deleteMenuItem;

window.saveSettings = saveSettings;
window.handleLogoUpload = handleLogoUpload;
window.removeLogo = removeLogo;
window.syncColorInputs = syncColorInputs;
