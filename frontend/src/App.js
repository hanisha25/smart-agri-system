import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.jpeg";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import Weather from "./components/Weather";
import Crops from "./components/Crops";
import DiseaseDetection from "./components/Disease";
import Reports from "./components/Reports";
import ResearchDashboard from "./components/ResearchDashboard";
import ResearchSidebar from "./components/ResearchSidebar";
import FarmerOverview from "./components/FarmerOverview";
import ResearchOverview from "./components/ResearchOverview";
import Notifications from "./components/Notifications";
import AdminSidebar from "./components/AdminSidebar";
import AdminOverview from "./components/AdminOverview";
import MapInsights from "./components/MapInsights";
import { apiUrl } from "./api";

const initialForm = {
  name: "",
  mobile: "",
  id: "",
  email: "",
  password: "",
  role: "farmer",
};

function App() {
  const [lang, setLang] = useState("en");
  const [active, setActive] = useState("home");
  const [showLang, setShowLang] = useState(false);
  const [user, setUser] = useState(localStorage.getItem("user"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [page, setPage] = useState("home");
  const [section, setSection] = useState("overview");
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("role");

    if (token && savedUser) {
      setUser(savedUser);
      setRole(savedRole);
      if (page !== "dashboard") {
        setSection("overview");
      }
      return;
    }

    setUser(null);
    setRole(null);

    if (page === "dashboard") {
      setPage("home");
    }
  }, [page]);

  const text = useMemo(
    () => ({
      en: { home: "Home", about: "About" },
      te: { home: "హోమ్", about: "గురించి" },
      hi: { home: "होम", about: "के बारे में" },
    }),
    []
  );

  const resetForm = (nextRole = "farmer") => {
    setForm({ ...initialForm, role: nextRole });
  };

  const closeAuth = () => {
    setShowAuth(false);
    setIsSignup(false);
    resetForm(form.role);
  };

  const openLogin = () => {
    setIsSignup(false);
    setShowAuth(true);
    resetForm("farmer");
  };

  const openSignup = () => {
    setIsSignup(true);
    setShowAuth(true);
    resetForm("farmer");
  };

  const handleSignup = async () => {
    try {
      const payload =
        form.role === "researcher"
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              role: "researcher",
            }
          : {
              name: form.name,
              mobile: form.mobile,
              farmerId: form.id,
              password: form.password,
              role: "farmer",
            };

      const res = await axios.post(apiUrl("/api/auth/signup"), payload);

      alert(res.data.message);
      closeAuth();
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  const handleLogin = async () => {
    try {
      const payload =
        form.role === "researcher"
          ? { email: form.email, password: form.password }
          : { farmerId: form.id, password: form.password };

      const res = await axios.post(apiUrl("/api/auth/login"), payload);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", res.data.user.name);

      setUser(res.data.user.name);
      setRole(res.data.role);
      setSection("overview");
      setShowAuth(false);
      setPage("dashboard");
      resetForm(res.data.role === "researcher" ? "researcher" : "farmer");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setRole(null);
    setSection("overview");
    setPage("home");
    setActive("home");
    closeAuth();
  };

  return (
    <div className="app-shell bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.24),_transparent_35%),linear-gradient(135deg,_#eefbf2,_#f6fff7_45%,_#ffffff)] text-slate-900">
      <nav className="sticky top-0 z-50 border-b border-white/50 bg-white/85 backdrop-blur-xl">
        <div className="app-main flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="logo" className="h-12 w-12 rounded-2xl object-cover shadow-md" />
            <div>
              <h1 className="text-xl font-bold text-green-900">AgroBrain</h1>
              <p className="text-xs text-slate-500">Smart agriculture support platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {!user && (
              <>
                <button
                  onClick={() => {
                    setActive("home");
                    setPage("home");
                  }}
                  className={`nav-chip ${active === "home" && page === "home" ? "nav-chip-active" : ""}`}
                >
                  {text[lang].home}
                </button>

                <button
                  onClick={() => {
                    setActive("about");
                    setPage("home");
                  }}
                  className={`nav-chip ${active === "about" ? "nav-chip-active" : ""}`}
                >
                  {text[lang].about}
                </button>
              </>
            )}

            {!user ? (
              <>
                <button onClick={openLogin} className="nav-chip">
                  Login
                </button>
                <button onClick={openSignup} className="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800">
                  Signup
                </button>
              </>
            ) : (
                <button onClick={handleLogout} className="nav-chip text-red-700">
                  Logout
                </button>
            )}

            {user && (
              <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm sm:block">
                Logged in as <span className="font-semibold text-slate-900">{user}</span>
              </div>
            )}

            <div className="relative">
              <button
                onClick={() => setShowLang((value) => !value)}
                className="nav-chip"
              >
                Language
              </button>

              {showLang && (
                <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                  {[
                    ["en", "English"],
                    ["te", "తెలుగు"],
                    ["hi", "हिंदी"],
                  ].map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLang(code);
                        setShowLang(false);
                      }}
                      className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-green-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="app-main app-workspace py-6">
        {page === "home" && active === "home" && (
          <section className="app-scroll flex h-full flex-col justify-center gap-8 py-8 xl:py-12">
            <div className="section-hero items-stretch">
              <div className="panel-card p-8 sm:p-10 xl:p-12">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                  For farmers and researchers
                </p>
                <h2 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl xl:text-6xl">
                  Monitor crops, report field problems, and get faster research support.
                </h2>
                <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                  AgroBrain brings weather, field records, crop issue reporting, and researcher responses into one workflow with a cleaner day-to-day dashboard.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={openSignup} className="rounded-full bg-green-700 px-5 py-3 font-semibold text-white transition hover:bg-green-800">
                    Get Started
                  </button>
                  <button onClick={openLogin} className="nav-chip px-5 py-3">
                    Sign In
                  </button>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3 xl:grid-cols-1">
                <div className="stat-card">
                  <p className="text-sm text-slate-500">Field tracking</p>
                  <p className="mt-3 text-3xl font-bold text-green-900">Live</p>
                  <p className="mt-2 text-sm text-slate-600">Store field records, crop details, and local conditions in one place.</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-500">Research loop</p>
                  <p className="mt-3 text-3xl font-bold text-green-900">Fast</p>
                  <p className="mt-2 text-sm text-slate-600">Send crop issues and collect responses without jumping between tools.</p>
                </div>
                <div className="stat-card">
                  <p className="text-sm text-slate-500">Weather context</p>
                  <p className="mt-3 text-3xl font-bold text-green-900">Daily</p>
                  <p className="mt-2 text-sm text-slate-600">See weather-driven risk signals tied to the crops you manage.</p>
                </div>
              </div>
            </div>

            <div className="content-grid">
              <GlassCard emoji="🌦" text="Weather monitoring and risk signals" />
              <GlassCard emoji="📸" text="Disease reporting with image uploads" />
              <GlassCard emoji="🧑‍🔬" text="Researcher review and recommendations" />
              <GlassCard emoji="⚠️" text="Actionable alerts for field decisions" />
            </div>
          </section>
        )}

        {page === "home" && active === "about" && (
          <section className="app-scroll panel-card flex h-full flex-col justify-center p-8 sm:p-10 xl:p-12">
            <h2 className="text-3xl font-bold text-green-900">About AgroBrain</h2>
            <p className="mt-4 max-w-3xl text-slate-600">
              This platform is designed to help farmers keep their field data organized, submit crop issues quickly, and receive support from researchers in a single dashboard.
            </p>
          </section>
        )}

        {page === "dashboard" && (
          <section className="grid h-full gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
            {role === "admin" ? (
              <AdminSidebar section={section} setSection={setSection} />
            ) : role === "researcher" ? (
              <ResearchSidebar section={section} setSection={setSection} />
            ) : (
              <Sidebar section={section} setSection={setSection} />
            )}

            <div className="panel-card app-scroll min-w-0 p-5 sm:p-8 xl:p-10">
              <div className="mb-6 flex flex-col gap-1 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Signed in as</p>
                  <h2 className="text-2xl font-bold text-slate-900">{user}</h2>
                </div>
                <span className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  {role === "researcher" ? "Researcher" : "Farmer"}
                </span>
              </div>

              {section === "overview" && (
                role === "admin" ? <AdminOverview /> :
                role === "researcher" ? <ResearchOverview /> :
                <FarmerOverview />
              )}
              {section === "map" && <MapInsights role={role} />}
              {section === "weather" && <Weather />}
              {section === "crops" && <Crops />}
              {section === "disease" && <DiseaseDetection lang={lang} />}
              {section === "reports" && <Reports />}
              {section === "research" && <ResearchDashboard />}
              {section === "notifications" && <Notifications />}
            </div>
          </section>
        )}
      </main>

      {showAuth && (
        <AuthPopup
          form={form}
          setForm={setForm}
          isSignup={isSignup}
          handleSignup={handleSignup}
          handleLogin={handleLogin}
          closeAuth={closeAuth}
        />
      )}

    </div>
  );
}

const GlassCard = ({ emoji, text }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    className="panel-card flex min-h-[220px] flex-col justify-center p-8 text-left xl:p-9"
  >
    <div className="text-4xl">{emoji}</div>
    <p className="mt-5 text-lg font-semibold text-slate-800">{text}</p>
  </motion.div>
);

const AuthPopup = ({ form, setForm, isSignup, handleSignup, handleLogin, closeAuth }) => {
  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4 py-8"
      onClick={closeAuth}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-[28px] border border-white/60 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{isSignup ? "Create account" : "Welcome back"}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {isSignup ? "Register first, then log in from the home screen." : "Use your farmer or researcher credentials."}
            </p>
          </div>
          <button onClick={closeAuth} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {isSignup && (
            <input
              value={form.name}
              placeholder="Name"
              className="auth-input"
              onChange={(e) => updateField("name", e.target.value)}
            />
          )}

          <select
            className="auth-input"
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
          >
            <option value="farmer">{isSignup ? "Register as Farmer" : "Login as Farmer"}</option>
            <option value="researcher">{isSignup ? "Register as Researcher" : "Login as Researcher"}</option>
          </select>

          {form.role === "researcher" ? (
            <input
              value={form.email}
              placeholder="Researcher Email"
              className="auth-input"
              onChange={(e) => updateField("email", e.target.value)}
            />
          ) : (
            <>
              {isSignup && (
                <input
                  value={form.mobile}
                  placeholder="Mobile Number"
                  className="auth-input"
                  onChange={(e) => updateField("mobile", e.target.value)}
                />
              )}
              <input
                value={form.id}
                placeholder="Farmer ID"
                className="auth-input"
                onChange={(e) => updateField("id", e.target.value)}
              />
            </>
          )}

          <input
            type="password"
            value={form.password}
            placeholder="Password"
            className="auth-input"
            onChange={(e) => updateField("password", e.target.value)}
          />
        </div>

        <button
          onClick={isSignup ? handleSignup : handleLogin}
          className="mt-6 w-full rounded-full bg-green-700 px-4 py-3 font-semibold text-white transition hover:bg-green-800"
        >
          {isSignup ? "Signup" : "Login"}
        </button>
      </motion.div>
    </div>
  );
};

export default App;
