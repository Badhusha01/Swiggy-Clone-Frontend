import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { adminAPI } from "../Services/api";
import { useAuth } from "../Context/AuthContext";
import "./AdminDashboard.css";

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    PLACED: { label: "Placed", cls: "badge--yellow" },
    OUT_FOR_DELIVERY: { label: "Out for Delivery", cls: "badge--blue" },
    DELIVERED: { label: "Delivered", cls: "badge--green" },
  };
  const s = map[status] || { label: status, cls: "badge--gray" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─── Section Header ─────────────────────────────────────────────
function SectionHeader({ title, icon }) {
  return (
    <div className="section-header">
      <span className="section-header__icon">{icon}</span>
      <h2>{title}</h2>
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [foods, setFoods] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");

  const [orderForm, setOrderForm] = useState({
    customerEmail: "",
    foodId: "",
    restaurantId: ""
  });

  // FIX 2: Correct Tab Jumping Logic
useEffect(() => {
  if (location.state && location.state.targetTab) {
    setActiveTab(location.state.targetTab);
    
    // Safety-ku: State-ah clear pannalaam (optional)
    // window.history.replaceState({}, document.title);
  }
}, [location]);

  const [foodForm, setFoodForm] = useState({ name: "", price: "", description: "" });
  const [restForm, setRestForm] = useState({ name: "", location: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "CUSTOMER" });
  const [assignMap, setAssignMap] = useState({});

  const toast = useCallback((text, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);

  // Guard: Redirect if not admin
  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [o, p, f, r] = await Promise.all([
        adminAPI.getAllOrders(),
        adminAPI.getPartners(),
        adminAPI.getFoods(),
        adminAPI.getRestaurants(),
      ]);
      setOrders(o.data);
      setPartners(p.data);
      setFoods(f.data);
      setRestaurants(r.data);
    } catch {
      toast("Failed to load data. Is Spring Boot running?", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Assign delivery ─────────────────────────────────────────
  const handleAssign = async (orderId) => {
    const partnerId = assignMap[orderId];
    if (!partnerId) return toast("Select a partner first", "error");
    try {
      await adminAPI.assignDelivery(orderId, partnerId);
      toast("✅ Delivery partner assigned!");
      fetchAll();
    } catch {
      toast("Assignment failed", "error");
    }
  };

  // ── Complete order ───────────────────────────────────────────
  const handleComplete = async (orderId) => {
    try {
      await adminAPI.completeOrder(orderId);
      toast("✅ Order marked as Delivered!");
      fetchAll();
    } catch {
      toast("Failed to complete order", "error");
    }
  };

  // ── Add Food ─────────────────────────────────────────────────
  const handleAddFood = async () => {
    if (!foodForm.name || !foodForm.price) return toast("Name & price required", "error");
    try {
      await adminAPI.addFood(foodForm);
      toast("✅ Food item added!");
      setFoodForm({ name: "", price: "", description: "" });
      fetchAll();
    } catch {
      toast("Failed to add food", "error");
    }
  };

  // ── Add Restaurant ───────────────────────────────────────────
  const handleAddRest = async () => {
    if (!restForm.name) return toast("Restaurant name required", "error");
    try {
      await adminAPI.addRestaurant(restForm);
      toast("✅ Restaurant added!");
      setRestForm({ name: "", location: "" });
      fetchAll();
    } catch {
      toast("Failed to add restaurant", "error");
    }
  };

  // ── Add User ─────────────────────────────────────────────────
  const handleAddUser = async () => {
    const { name, email, password, role } = userForm;
    if (!name || !email || !password) return toast("All fields required", "error");
    try {
      await adminAPI.addUser(userForm);
      toast("✅ User added!");
      setUserForm({ name: "", email: "", password: "", role: "CUSTOMER" });
    } catch {
      toast("Failed to add user", "error");
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderForm.customerEmail || !orderForm.foodId || !orderForm.restaurantId) {
      return toast("All fields are required!", "error");
    }
    try {
      await adminAPI.placeOrder(orderForm);
      toast("✅ Order Placed Successfully!");
      setOrderForm({ customerEmail: "", foodId: "", restaurantId: "" });
      fetchAll(); // Refresh the table
    } catch {
      toast("Failed to place order. Check if Email/IDs are valid", "error");
    }
  };

  const navTabs = [
    { id: "orders", label: "Admin", icon: "🛡️" },
    { id: "foods", label: "Foods", icon: "🍽️" },
    { id: "restaurants", label: "Restaurants", icon: "🏪" },
    { id: "users", label: "Add User", icon: "👤" },
  ];

  const getFoodEmoji = (foodName) => {
    const name = foodName.toLowerCase();
    if (name.includes("biriyani") || name.includes("rice")) return "🍛";
    if (name.includes("chicken") || name.includes("meat")) return "🍗";
    if (name.includes("burger")) return "🍔";
    if (name.includes("pizza")) return "🍕";
    if (name.includes("cake") || name.includes("sweet")) return "🍰";
    if (name.includes("juice") || name.includes("shake")) return "🍹";

    // Idhu edhuvum illai na random-aa oru emoji tharom
    const emojis = ["🍱", "🍲", "🥙", "🌯", "🥘", "🥨"];
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  return (
    <div className="admin-root">
      <div className="admin-glow admin-glow--1" />
      <Toast toasts={toasts} />

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <img 
      src="/swiggy-1.svg" 
      alt="Swiggy Logo" 
      style={{ width: '35px', height: '35px', objectFit: 'contain' }} 
    />
          <div>
            <div className="sidebar-brand__title">Swiggy Clone</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navTabs.map((t) => (
            <button
              key={t.id}
              className={`sidebar-nav__item${activeTab === t.id ? " sidebar-nav__item--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user__avatar">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <div>
              <div className="sidebar-user__name">{user?.name || "Admin"}</div>
              <div className="sidebar-user__role">Administrator</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={() => { logout(); navigate("/"); }}>
            Logout →
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="admin-main">
        {loading && <div className="admin-loading">⟳ Loading...</div>}

        {/* ── ORDERS TAB ────────────────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="admin-section">
            {/* Inga thaan namma rendu peraiyum pakkam pakkam veikurom */}
            <div className="admin-section-top-row" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px'
            }}>
              <SectionHeader title="Admin Dashboard" icon="🛡️" />

              <button className="home-btn" onClick={() => navigate("/")}>
                🏠 Home
              </button>
            </div>
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-card__val">{orders.length}</div>
                <div className="stat-card__label">Total Orders 📦</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__val">
                  {orders.filter((o) => o.status === "DELIVERED").length}
                </div>

                <div className="stat-card__label">Delivered ✅</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__val">
                  {orders.filter((o) => o.status === "OUT_FOR_DELIVERY").length}
                </div>
                <div className="stat-card__label">Out for Delivery 💨</div>
              </div>
              <div className="stat-card">
                <div className="stat-card__val">{partners.length}</div>
                <div className="stat-card__label">Delivery Partners 🏍️</div>
              </div>
            </div>

            <div className="form-card" style={{ marginTop: '20px' }}>
              <h3>🚀 Quick Place Order</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Email</label>
                  <input
                    placeholder="Enter registered email"
                    value={orderForm.customerEmail}
                    onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Select Food</label>
                  <select onChange={(e) => setOrderForm({ ...orderForm, foodId: e.target.value })}>
                    <option value="">Choose Food...</option>
                    {foods.map(f => <option key={f.id} value={f.id}>{f.name} - ₹{f.price}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Select Restaurant</label>
                  <select onChange={(e) => setOrderForm({ ...orderForm, restaurantId: e.target.value })}>
                    <option value="">Choose Restaurant...</option>
                    {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <button className="form-submit" onClick={handlePlaceOrder}>Place Order Now →</button>
            </div>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th>Partner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 && (
                    <tr><td colSpan={6} className="table-empty">No orders found</td></tr>
                  )}
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="td-id">#{order.id}</td>
                      <td>{order.customer?.name || "—"}</td>
                      <td>
                        <span className="item-pills">
                          {order.items?.map((item) => (
                            <span key={item.id} className="item-pill">{item.name}</span>
                          )) || "—"}
                        </span>
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td>{order.deliveryPartner?.name || <span className="text-muted">Unassigned</span>}</td>
                      <td>
                        <div className="action-cell">
                          {order.status !== "DELIVERED" && (
                            <>
                              <select
                                className="action-select"
                                value={assignMap[order.id] || ""}
                                onChange={(e) =>
                                  setAssignMap({ ...assignMap, [order.id]: e.target.value })
                                }
                              >
                                <option value="">Pick partner…</option>
                                {partners.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <button
                                className="action-btn action-btn--assign"
                                onClick={() => handleAssign(order.id)}
                              >
                                Assign
                              </button>
                            </>
                          )}
                          {order.status === "OUT_FOR_DELIVERY" && (
                            <button
                              className="action-btn action-btn--complete"
                              onClick={() => handleComplete(order.id)}
                            >
                              ✅ Mark Delivered
                            </button>
                          )}
                          {order.status === "DELIVERED" && (
                            <span className="text-muted">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FOODS TAB ─────────────────────────────────────────── */}
        {activeTab === "foods" && (
          <div className="admin-section">
            <SectionHeader title="Food Items" icon="🍽️" />
            <div className="form-card">
              <h3>Add New Food Item</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Food Name</label>
                  <input
                    placeholder="e.g. Butter Chicken"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 250"
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  placeholder="Short description…"
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                />
              </div>
              <button className="form-submit" onClick={handleAddFood}>Add Food Item →</button>
            </div>

            <div className="grid-cards">
              {foods.length === 0 && <p className="text-muted">No food items yet.</p>}
              {foods.map((f) => (
                <div key={f.id} className="item-card">
                  <div className="item-card__emoji">{getFoodEmoji(f.name)}</div>
                  <div className="item-card__name">{f.name}</div>
                  {f.price && <div className="item-card__price">₹{f.price}</div>}
                  {f.description && <div className="item-card__desc">{f.description}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── RESTAURANTS TAB ───────────────────────────────────── */}
        {activeTab === "restaurants" && (
          <div className="admin-section">
            <SectionHeader title="Restaurants" icon="🏪" />
            <div className="form-card">
              <h3>Add New Restaurant</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Restaurant Name</label>
                  <input
                    placeholder="e.g. Spice Garden"
                    value={restForm.name}
                    onChange={(e) => setRestForm({ ...restForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input
                    placeholder="e.g. Anna Nagar, Chennai"
                    value={restForm.location}
                    onChange={(e) => setRestForm({ ...restForm, location: e.target.value })}
                  />
                </div>
              </div>
              <button className="form-submit" onClick={handleAddRest}>Add Restaurant →</button>
            </div>

            <div className="grid-cards">
              {restaurants.length === 0 && <p className="text-muted">No restaurants yet.</p>}
              {restaurants.map((r) => (
                <div key={r.id} className="item-card">
                  <div className="item-card__emoji">🏪</div>
                  <div className="item-card__name">{r.name}</div>
                  {r.location && <div className="item-card__desc">📍 {r.location}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ADD USER TAB ──────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="admin-section">
            <SectionHeader title="Add New User" icon="👤" />
            <div className="form-card form-card--wide">
              <h3>Create User Account</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    placeholder="John Doe"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="user@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  >
                    <option value="CUSTOMER">🛒 Customer</option>
                    <option value="DELIVERY_PARTNER">🛵 Delivery Partner</option>
                    <option value="ADMIN">🛡 Admin</option>
                  </select>
                </div>
              </div>
              <button className="form-submit" onClick={handleAddUser}>Create User →</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}