const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5312";
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export function assetUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export { API_BASE_URL };

// ML function
export async function predictCrop(data) {
  try {
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return await response.json();
  } catch (error) {
    console.error("Prediction error:", error);
    return null;
  }
}