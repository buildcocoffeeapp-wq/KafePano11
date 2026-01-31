// Gallery Widget Module

const GalleryWidget = {
  currentIndex: 0,
  photos: [],
  intervalId: null,
  intervalTime: 5000, // 5 seconds default

  // Get all photos
  async getPhotos() {
    try {
      const snapshot = await database.ref('content/photos').once('value');
      const photos = snapshot.val() || {};
      
      const photoList = Object.keys(photos).map(key => ({
        id: key,
        ...photos[key]
      }));
      
      // Sort by order
      photoList.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      return photoList;
    } catch (error) {
      console.error('Error fetching photos:', error);
      return [];
    }
  },

  // Listen for real-time updates
  listenForUpdates(callback) {
    database.ref('content/photos').on('value', (snapshot) => {
      const photos = snapshot.val() || {};
      
      const photoList = Object.keys(photos).map(key => ({
        id: key,
        ...photos[key]
      }));
      
      photoList.sort((a, b) => (a.order || 0) - (b.order || 0));
      this.photos = photoList;
      callback(photoList);
    });
  },

  // Start slideshow
  startSlideshow(container, intervalTime = 5000) {
    this.intervalTime = intervalTime;
    this.renderDisplay(container);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.nextSlide(container);
    }, this.intervalTime);
  },

  // Stop slideshow
  stopSlideshow() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  },

  // Next slide
  nextSlide(container) {
    if (this.photos.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.renderDisplay(container);
  },

  // Previous slide
  prevSlide(container) {
    if (this.photos.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.renderDisplay(container);
  },

  // Render display
  renderDisplay(container) {
    if (this.photos.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🖼️</div>
          <p>Henüz fotoğraf eklenmemiş</p>
        </div>
      `;
      return;
    }

    const photo = this.photos[this.currentIndex];
    const dots = this.photos.map((_, i) => 
      `<div class="gallery-dot ${i === this.currentIndex ? 'active' : ''}"></div>`
    ).join('');

    container.innerHTML = `
      <div class="gallery-container">
        <img src="${photo.url}" alt="${photo.caption || ''}" class="gallery-image">
        ${this.photos.length > 1 ? `<div class="gallery-dots">${dots}</div>` : ''}
        ${photo.caption ? `<div class="gallery-caption">${photo.caption}</div>` : ''}
      </div>
    `;
  },

  // Admin: Upload photo to Cloudinary
  async uploadPhoto(file) {
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
        return { success: true, url: data.secure_url };
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Add photo to database
  async addPhoto(photoData) {
    try {
      // Get current count for order
      const snapshot = await database.ref('content/photos').once('value');
      const photos = snapshot.val() || {};
      const order = Object.keys(photos).length;
      
      const newRef = database.ref('content/photos').push();
      await newRef.set({
        ...photoData,
        order: order,
        createdAt: Date.now()
      });
      
      return { success: true, id: newRef.key };
    } catch (error) {
      console.error('Error adding photo:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Update photo
  async updatePhoto(photoId, photoData) {
    try {
      await database.ref(`content/photos/${photoId}`).update(photoData);
      return { success: true };
    } catch (error) {
      console.error('Error updating photo:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Delete photo
  async deletePhoto(photoId) {
    try {
      await database.ref(`content/photos/${photoId}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Error deleting photo:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Reorder photos
  async reorderPhotos(photoIds) {
    try {
      const updates = {};
      photoIds.forEach((id, index) => {
        updates[`content/photos/${id}/order`] = index;
      });
      await database.ref().update(updates);
      return { success: true };
    } catch (error) {
      console.error('Error reordering photos:', error);
      return { success: false, error: error.message };
    }
  }
};

// Export
window.GalleryWidget = GalleryWidget;
