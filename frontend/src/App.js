import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import logo from "./assets/logo.jpeg";
import axios from "axios";

import Sidebar from "./components/Sidebar";
import Weather from "./components/Weather";
import Crops from "./components/Crops";
import DiseaseDetection from "./components/Disease";
import Reports from "./components/Reports";
import ResearchDashboard from "./components/ResearchDashboard";
import ResearchSidebar from "./components/ResearchSidebar";

function App() {

  const [lang, setLang] = useState("en");
  const [active, setActive] = useState("home");
  const [showLang, setShowLang] = useState(false);

  const [user, setUser] = useState(localStorage.getItem("user"));
  const [showAuth, setShowAuth] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const [page, setPage] = useState("home");
  const [section, setSection] = useState("weather");

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    id: "",
    email: "",
    password: "",
    role: "farmer"
  });

  /* AUTH PROTECTION */

  useEffect(() => {

    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (token && savedUser) {
      setUser(savedUser);
    }

    if (!token && page === "dashboard") {
      setPage("home");
    }

  }, [page]);

  /* SIGNUP */

  const handleSignup = async () => {

    try {

      const payload =
        form.role === "researcher"
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              role: "researcher"
            }
          : {
              name: form.name,
              mobile: form.mobile,
              farmerId: form.id,
              password: form.password,
              role: "farmer"
            };

      const res = await axios.post(
        "http://127.0.0.1:5400/api/auth/signup",
        payload
      );

      alert(res.data.message);
      setIsSignup(false);

    } catch (err) {

      alert(err.response?.data?.message || "Signup failed");

    }

  };

  /* LOGIN */

  const handleLogin = async () => {

    try {

      const payload =
        form.role === "researcher"
          ? { email: form.email, password: form.password }
          : { farmerId: form.id, password: form.password };

      const res = await axios.post(
        "http://localhost:5400/api/auth/login",
        payload
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("user", res.data.user.name);

      setUser(res.data.user.name);

      if (res.data.role === "researcher") {
        setSection("research");
      } else {
        setSection("weather");
      }

      setPage("dashboard");

    } catch (err) {

      console.log(err);
      alert(err.response?.data?.message || "Login failed");

    }

  };

  /* LOGOUT */

  const handleLogout = () => {

    localStorage.clear();
    setUser(null);
    setPage("home");

  };

  const text = {

    en: {
      home: "Home",
      about: "About"
    },

    te: {
      home: "హోమ్",
      about: "గురించి"
    },

    hi: {
      home: "होम",
      about: "के बारे में"
    }

  };

  return (

    <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-200 via-green-100 to-white pt-20">

      {/* NAVBAR */}

      <nav className="fixed top-0 left-0 w-full bg-green-700 text-white p-4 flex justify-between items-center shadow-lg z-50">

        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="h-12" />
          <h1 className="text-xl font-bold">AgroBrain</h1>
        </div>

        <div className="flex gap-6 items-center">

          <button
            onClick={() => { setActive("home"); setPage("home") }}
            className="bg-white text-green-700 px-3 py-1 rounded"
          >
            {text[lang].home}
          </button>

          <button
            onClick={() => { setActive("about"); setPage("home") }}
            className="bg-white text-green-700 px-3 py-1 rounded"
          >
            {text[lang].about}
          </button>

          {user && (
            <button
              onClick={() => setPage("dashboard")}
              className="bg-white text-green-700 px-3 py-1 rounded"
            >
              Dashboard
            </button>
          )}

          {!user ? (
            <>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-white text-green-700 px-3 py-1 rounded"
              >
                Login
              </button>

              <button
                onClick={() => { setIsSignup(true); setShowAuth(true) }}
                className="bg-white text-green-700 px-3 py-1 rounded"
              >
                Signup
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="bg-white text-green-700 px-3 py-1 rounded"
            >
              Logout
            </button>
          )}

          {/* LANGUAGE */}

          <div className="relative">

            <button
              onClick={() => setShowLang(!showLang)}
              className="bg-white text-green-700 px-3 py-1 rounded"
            >
              🌐
            </button>

            {showLang && (

              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded p-2 text-black">

                <p onClick={() => { setLang("en"); setShowLang(false) }}>
                  English
                </p>

                <p onClick={() => { setLang("te"); setShowLang(false) }}>
                  తెలుగు
                </p>

                <p onClick={() => { setLang("hi"); setShowLang(false) }}>
                  हिंदी
                </p>

              </div>

            )}

          </div>

        </div>

      </nav>

      {/* HOME */}

      {page === "home" && active === "home" && (

        <div className="grid grid-cols-2 gap-10 px-20 py-10 flex-1">

          <GlassCard emoji="🌦" text="Weather Monitoring" />
          <GlassCard emoji="📸" text="Crop Disease Reporting" />
          <GlassCard emoji="🧑‍🔬" text="Research Assistance" />
          <GlassCard emoji="⚠️" text="Smart Alerts" />

        </div>

      )}

      {/* DASHBOARD */}

      {page === "dashboard" && (

        <div className="flex flex-1">

          {localStorage.getItem("role") === "researcher"
            ? <ResearchSidebar setSection={setSection}/>
            : <Sidebar setSection={setSection}/>
          }

          <div className="flex-1 p-10">

            {section === "weather" && <Weather />}
            {section === "crops" && <Crops />}
            {section === "disease" && <DiseaseDetection lang={lang} />}
            {section === "reports" && <Reports />}
            {section === "research" && <ResearchDashboard />}

          </div>

        </div>

      )}

      {/* AUTH POPUP */}

      {showAuth && (

        <AuthPopup
          form={form}
          setForm={setForm}
          isSignup={isSignup}
          handleSignup={handleSignup}
          handleLogin={handleLogin}
          setShowAuth={setShowAuth}
        />

      )}

      <footer className="bg-green-700 text-white text-center p-4 mt-auto">
        © 2026 AgroBrain | Made for Farmers ❤️
      </footer>

    </div>

  );

}

/* GLASS CARD */

const GlassCard = ({ emoji, text }) => (

  <motion.div
    whileHover={{ scale: 1.05 }}
    className="bg-white/20 backdrop-blur-lg p-8 rounded-2xl shadow-xl text-center"
  >
    <div className="text-5xl">{emoji}</div>
    <p className="mt-4 text-xl">{text}</p>
  </motion.div>

);

/* AUTH POPUP */

const AuthPopup = ({ form, setForm, isSignup, handleSignup, handleLogin, setShowAuth }) => {

  return (

    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">

      <motion.div
        initial={{ scale: 0.7 }}
        animate={{ scale: 1 }}
        className="bg-white p-8 rounded-xl shadow-xl w-96"
      >

        <h2 className="text-2xl font-bold mb-4 text-center">
          {isSignup ? "Signup" : "Login"}
        </h2>

        {isSignup && (
          <input
            placeholder="Name"
            className="p-2 mb-2 w-full border rounded"
            onChange={(e)=>setForm(prev=>({...prev,name:e.target.value}))}
          />
        )}

        <select
          className="p-2 mb-2 w-full border rounded"
          value={form.role}
          onChange={(e)=>setForm(prev=>({...prev,role:e.target.value}))}
        >
          <option value="farmer">
            {isSignup ? "Register as Farmer" : "Login as Farmer"}
          </option>

          <option value="researcher">
            {isSignup ? "Register as Researcher" : "Login as Researcher"}
          </option>
        </select>

        {form.role === "researcher" ? (

          <input
            placeholder="Researcher Email"
            className="p-2 mb-2 w-full border rounded"
            onChange={(e)=>setForm(prev=>({...prev,email:e.target.value}))}
          />

        ) : (

          <input
            placeholder="Farmer ID"
            className="p-2 mb-2 w-full border rounded"
            onChange={(e)=>setForm(prev=>({...prev,id:e.target.value}))}
          />

        )}

        <input
          type="password"
          placeholder="Password"
          className="p-2 mb-4 w-full border rounded"
          onChange={(e)=>setForm(prev=>({...prev,password:e.target.value}))}
        />

        <button
          onClick={isSignup ? handleSignup : handleLogin}
          className="bg-green-700 text-white w-full py-2 rounded"
        >
          {isSignup ? "Signup" : "Login"}
        </button>

        <button
          onClick={()=>setShowAuth(false)}
          className="mt-3 w-full text-red-500"
        >
          Close
        </button>

      </motion.div>

    </div>

  );

};

export default App;