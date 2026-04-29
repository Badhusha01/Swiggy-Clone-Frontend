import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// ─── Admin Endpoints ───────────────────────────────────────────────
export const adminAPI = {
  // Users
  addUser: (userData) => api.post("/admin/user", userData),

  // Restaurants
  addRestaurant: (data) => api.post("/admin/restaurant", data),
  getRestaurants: () => api.get("/admin/restaurants"),

  // Food Items
  addFood: (data) => api.post("/admin/food", data),
  getFoods: () => api.get("/admin/foods"),
  placeOrder: (orderData) => api.post("/admin/order", orderData),

  // Orders
  getAllOrders: () => api.get("/admin/orders"),
  assignDelivery: (orderId, partnerId) =>
    api.put(`/admin/assign/${orderId}/${partnerId}`),
  completeOrder: (orderId) => api.put(`/admin/complete/${orderId}`),

  // Delivery Partners
  getPartners: () => api.get("/admin/partners"),
};


export default api;