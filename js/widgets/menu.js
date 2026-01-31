// Menu Widget Module

const MenuWidget = {
  // Get menu items
  async getMenuItems() {
    try {
      const snapshot = await database.ref('content/menuItems').once('value');
      const items = snapshot.val() || {};
      
      return Object.keys(items)
        .map(key => ({ id: key, ...items[key] }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
      console.error('Error fetching menu items:', error);
      return [];
    }
  },

  // Listen for real-time updates
  listenForUpdates(callback) {
    database.ref('content/menuItems').on('value', (snapshot) => {
      const items = snapshot.val() || {};
      
      const menuItems = Object.keys(items)
        .map(key => ({ id: key, ...items[key] }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      callback(menuItems);
    });
  },

  // Render display
  renderDisplay(items, container) {
    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🍽️</div>
          <p>Menü henüz eklenmemiş</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="menu-list">
        ${items.map(item => `
          <div class="menu-item ${!item.available ? 'unavailable' : ''}">
            <div class="menu-item-left">
              <span class="menu-item-icon">${item.icon || '🍽️'}</span>
              <div>
                <div class="menu-item-name">${item.name}</div>
                ${item.description ? `<div class="menu-item-desc">${item.description}</div>` : ''}
              </div>
            </div>
            <div class="menu-item-price">${item.price}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Admin: Add menu item
  async addMenuItem(data) {
    try {
      // Get current count for order
      const snapshot = await database.ref('content/menuItems').once('value');
      const items = snapshot.val() || {};
      const order = Object.keys(items).length;
      
      const newRef = database.ref('content/menuItems').push();
      await newRef.set({
        ...data,
        available: true,
        order: order,
        createdAt: Date.now()
      });
      
      return { success: true, id: newRef.key };
    } catch (error) {
      console.error('Error adding menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Update menu item
  async updateMenuItem(id, data) {
    try {
      await database.ref(`content/menuItems/${id}`).update(data);
      return { success: true };
    } catch (error) {
      console.error('Error updating menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Delete menu item
  async deleteMenuItem(id) {
    try {
      await database.ref(`content/menuItems/${id}`).remove();
      return { success: true };
    } catch (error) {
      console.error('Error deleting menu item:', error);
      return { success: false, error: error.message };
    }
  },

  // Admin: Toggle availability
  async toggleAvailability(id, available) {
    return this.updateMenuItem(id, { available });
  },

  // Common food emojis for selection
  foodEmojis: [
    '☕', '🍵', '🥤', '🧃', '🍺', '🍷', '🥛',
    '🍕', '🍔', '🌭', '🥪', '🌮', '🌯', '🥗',
    '🍝', '🍜', '🍲', '🍛', '🍱', '🥘', '🫕',
    '🍳', '🥐', '🥯', '🍞', '🥖', '🧀', '🥚',
    '🍰', '🧁', '🍮', '🍩', '🍪', '🎂', '🍫',
    '🍎', '🍊', '🍋', '🍇', '🍓', '🥑', '🥕'
  ]
};

// Export
window.MenuWidget = MenuWidget;
