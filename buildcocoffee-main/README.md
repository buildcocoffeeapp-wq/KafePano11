# ☕ KafePano - Dijital Pano Sistemi

Kafeler için tasarlanmış, telefondan yönetilen, tablette gösterilen dijital pano sistemi.

## 🚀 Özellikler

- **📅 Takvim/Etkinlikler**: Günlük etkinlikleri listeleyin
- **🖼️ Fotoğraf Galerisi**: Otomatik slideshow
- **📢 Duyurular**: Kayan duyuru bandı
- **🍽️ Menü**: Günün menüsünü gösterin
- **⏰ Saat**: Dijital saat
- **🌤️ Hava Durumu**: Otomatik güncellenen hava durumu

## 📱 Kullanım

### Tablet (Görüntüleme)
```
https://your-app.vercel.app
```
- Tam ekran için çift tıklayın
- Otomatik güncellenir

### Telefon (Yönetim)
```
https://your-app.vercel.app/admin
```
- Email/şifre ile giriş yapın
- İçerik ekleyin, düzenleyin, silin

## 🛠️ Teknolojiler

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Firebase Realtime Database
- **Auth**: Firebase Authentication
- **Images**: Cloudinary
- **Hosting**: Vercel

## 📦 Kurulum

### 1. Firebase Kurulumu
1. [Firebase Console](https://console.firebase.google.com)'da proje oluşturun
2. Realtime Database etkinleştirin
3. Authentication (Email/Password) etkinleştirin
4. `js/firebase-config.js` dosyasını kendi bilgilerinizle güncelleyin

### 2. Cloudinary Kurulumu
1. [Cloudinary](https://cloudinary.com)'de hesap açın
2. Upload preset oluşturun (unsigned)
3. `js/firebase-config.js` dosyasına bilgileri ekleyin

### 3. Deploy
```bash
# Vercel CLI ile
npm i -g vercel
vercel

# veya GitHub'a push edip Vercel'e bağlayın
```

## 🔐 Firebase Güvenlik Kuralları

```json
{
  "rules": {
    "settings": {
      ".read": true,
      ".write": "auth != null"
    },
    "widgets": {
      ".read": true,
      ".write": "auth != null"
    },
    "content": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

## 📁 Dosya Yapısı

```
KafePano/
├── index.html          # Tablet görüntüleme ekranı
├── admin.html          # Yönetim paneli
├── login.html          # Giriş sayfası
├── css/
│   ├── display.css     # Tablet stilleri
│   └── admin.css       # Yönetim stilleri
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── display.js
│   ├── admin.js
│   └── widgets/
│       ├── calendar.js
│       ├── gallery.js
│       ├── announcement.js
│       ├── clock.js
│       ├── weather.js
│       └── menu.js
├── manifest.json       # PWA ayarları
└── vercel.json         # Deploy ayarları
```

## 🎨 Özelleştirme

Yönetim panelinden:
- Kafe adı
- Tema (Açık/Koyu)
- Ana renk
- Widget açma/kapama
- Hava durumu şehri
- Saat formatı
- Slayt süresi

## 📄 Lisans

MIT License

---

Geliştirici: [Adınız]
