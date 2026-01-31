// Authentication Module
// Handles login/logout operations

// Check if user is logged in
function checkAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user);
    });
  });
}

// Login with email and password
async function login(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: getErrorMessage(error.code) };
  }
}

// Logout
async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
  const messages = {
    "auth/invalid-email": "Geçersiz email adresi",
    "auth/user-disabled": "Bu hesap devre dışı bırakılmış",
    "auth/user-not-found": "Kullanıcı bulunamadı",
    "auth/wrong-password": "Hatalı şifre",
    "auth/too-many-requests": "Çok fazla deneme. Lütfen bekleyin.",
    "auth/invalid-credential": "Email veya şifre hatalı"
  };
  return messages[errorCode] || "Giriş yapılamadı. Lütfen tekrar deneyin.";
}

// Protect admin pages
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// Export functions
window.checkAuth = checkAuth;
window.login = login;
window.logout = logout;
window.requireAuth = requireAuth;
