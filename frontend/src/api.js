const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://smart-agri-system-6v1s.onrender.com";
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function assetUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export { API_BASE_URL };
