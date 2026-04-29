import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminAPI } from "../Services/api";
import { useAuth } from "../Context/AuthContext";
import "./AuthPage.css";

const HARDCODED_ADMIN = { email: "admin", password: "admin" };

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });
  const [msg, setMsg] = useState({ text: "", type: "", target: "" });
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth(); // 'user' ah inga add pannirukkoam
  const navigate = useNavigate();

  const flash = (text, type, target) => {
    setMsg({ text, type, target });
    setTimeout(() => setMsg({ text: "", type: "", target: "" }), 4000);
  };

  // ─── Login Logic ──────────────────────────────────────────────────
  const handleLogin = async () => {
    const { email, password } = loginForm;
    if (!email || !password) return flash("Fill both fields!", "error", "login");

    if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
      const adminUser = { name: "Administrator", role: "ADMIN", email: "admin" };
      login(adminUser);
      // LocalStorage-la set pannitta, handleJump logic-ku safety-aa irukkum
      localStorage.setItem("user", JSON.stringify(adminUser));

      flash("✅ Welcome back, Admin!", "success", "login");
      setTimeout(() => navigate("/admin"), 900);
      return;
    }

    flash("❌ Unauthorized! Only Admins can sign in here.", "error", "login");
    setLoginForm({ email: "", password: "" });
  };

  // ─── Register Logic ───────────────────────────────────────────────
  const handleRegister = async () => {
    const { name, email, password, role } = regForm;
    if (!name || !email || !password) return flash("Fill all fields!", "error", "reg");

    setLoading(true);
    try {
      await adminAPI.addUser({ name, email, password, role });
      flash("✅ Account created! You can sign in now.", "success", "reg");
      setTimeout(() => setTab("login"), 1500);
    } catch {
      flash("Registration failed. Email may already exist.", "error", "reg");
    } finally {
      setLoading(false);
    }
  };

  // ─── FIX: Protected Jump Logic ──────────────────────────────────
  const handleJump = (path, label) => {
    const activeUser = user || JSON.parse(localStorage.getItem("user"));

    if (!activeUser) {
      // Target-ah "login" nu kudutha, adhu login card kulla mattum thaan message kaattum
      flash("⚠️ Authentication Required! Please Sign In first.", "error", "login");
      return;
    }

    if (label === "Foods") {
      navigate("/admin", { state: { targetTab: "foods" } });
    } else if (label === "Restaurants") {
      navigate("/admin", { state: { targetTab: "restaurants" } });
    } else {
      navigate(path);
    }
  };

  const msgBox = (target) =>
    msg.target === target && msg.text ? (
      <div className={`auth-msg auth-msg--${msg.type}`}>{msg.text}</div>
    ) : null;

  return (
    <div className="auth-root">
      <div className="auth-glow auth-glow--1" />
      <div className="auth-glow auth-glow--2" />

      <nav className="auth-nav">
        <div className="auth-nav__logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/swiggy-1.svg" alt="Swiggy Logo" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem' }}>
            Swiggy <b>Clone</b>
          </span>
        </div>
        <div className="auth-nav__links">
          <button className="auth-nav__btn auth-nav__btn--fill" onClick={() => handleJump("/admin", "Admin")}>
            🛡️ Admin Panel
          </button>
        </div>
      </nav>

      <main className="auth-main">
        <div className="auth-wrap">
          <div className="auth-brand">
            <div className="auth-brand__emoji">🍔</div>
            <h1 style={{ fontFamily: "'Syne', sans-serif" }}>Swiggy Clone</h1><br />
            <p>Food Management Platform — Order 📦 Deliver ✅ Manage 👨🏼‍💻</p>
          </div>

          <div className="auth-card">
            <div className="auth-tabs">
              <button className={`auth-tab${tab === "login" ? " auth-tab--active" : ""}`} onClick={() => setTab("login")}>Sign In</button>
              <button className={`auth-tab${tab === "register" ? " auth-tab--active" : ""}`} onClick={() => setTab("register")}>Register</button>
            </div>

            {tab === "login" && (
              <div className="auth-form">
                <label>Email</label>
                <input type="email" placeholder="you@example.com" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
                <button className="auth-btn-primary" onClick={handleLogin}>Sign In →</button>

                {/* 1. Login tab-la irukkumbodhu message inga varum */}
                {msgBox("login")}
              </div>
            )}

            {tab === "register" && (
              <div className="auth-form">
                {/* ... unga register form fields ... */}
                <button className="auth-btn-primary" onClick={handleRegister} disabled={loading}>{loading ? "Creating…" : "Create Account →"}</button>

                {/* 2. Register tab-la irukkumbodhu message inga varum */}
                {/* handleJump-la namma "login" target kuduthurukkoam, so register tab-layum namma "login" box-ah check pannanum */}
                {msgBox("reg")}
                {msgBox("login")}
              </div>
            )}
          </div>

          <div className="auth-jumps">
            <p>Jump to dashboard</p>

            <div className="auth-jump-grid">
              {[
                { emoji: "🍔", label: "Foods", path: "/admin" },
                { emoji: "🛡️", label: "Admin", path: "/admin" },
                { emoji: "🏠", label: "Restaurants", path: "/admin" },
              ].map((r) => (
                <button key={r.label} className="auth-jump-card" onClick={() => handleJump(r.path, r.label)}>
                  <span className="auth-jump-card__emoji">{r.emoji}</span>
                  <span className="auth-jump-card__label">{r.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}