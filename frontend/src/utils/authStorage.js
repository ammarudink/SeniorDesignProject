const TOKEN_KEY = "user_token";
const USER_KEY = "user_data";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function parseJwt(token) {
  if (!token) return null;

  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalized));
  } catch {
    return null;
  }
}

export function isTokenValid(token = getToken()) {
  if (!token) return false;
  const decoded = parseJwt(token);
  if (!decoded) return false;
  const now = Math.floor(Date.now() / 1000);
  return !decoded.exp || decoded.exp > now;
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getUserFromToken(token = getToken()) {
  const decoded = parseJwt(token);
  if (!decoded) return null;

  return {
    UserID: Number(decoded.sub),
    Email: decoded.email,
    Role: decoded.role,
    Name: decoded.name,
  };
}

export function persistSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user?.UserID) {
    localStorage.setItem("user_id", String(user.UserID));
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem("user_id");
  localStorage.removeItem("wishlist");
}

export function initializeAuthState() {
  const token = getToken();

  if (!isTokenValid(token)) {
    clearSession();
    return { token: null, user: null };
  }

  return {
    token,
    user: getStoredUser() || getUserFromToken(token),
  };
}
