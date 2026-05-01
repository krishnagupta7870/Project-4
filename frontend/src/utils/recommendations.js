import api from "./api";

export async function fetchSimilarProducts(productId) {
  const { data } = await api.get(`/api/recommend/similar-products/${productId}`);
  return data;
}

export async function fetchUserRecommendations(lat = null, lng = null) {
  let url = "/api/recommend/for-user";
  if (lat && lng) {
    url += `?lat=${lat}&lng=${lng}`;
  }
  const { data } = await api.get(url);
  return data;
}

export async function fetchTrendingProducts() {
  const { data } = await api.get("/api/recommend/trending");
  return data;
}
