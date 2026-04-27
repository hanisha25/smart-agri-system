import { API_BASE_URL, apiUrl, assetUrl } from "./api";

describe("api helpers", () => {
  test("builds API urls from the configured base url", () => {
    expect(API_BASE_URL).toBe(process.env.REACT_APP_API_BASE_URL || "http://localhost:5312");
    expect(apiUrl("/api/auth/login")).toBe(`${API_BASE_URL}/api/auth/login`);
  });

  test("normalizes asset paths", () => {
    expect(assetUrl("uploads/field.jpg")).toBe(`${API_BASE_URL}/uploads/field.jpg`);
    expect(assetUrl("/uploads/field.jpg")).toBe(`${API_BASE_URL}/uploads/field.jpg`);
  });
});
