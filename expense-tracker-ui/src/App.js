import { useState, useMemo, useRef } from "react";
import API from "./api/axios";
import { useEffect } from "react";

// ════════════════════════════════════════════════════════════════
// GLOBAL STYLES
// ════════════════════════════════════════════════════════════════
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #07090d; font-family: 'Sora', 'Segoe UI', sans-serif; }
      input, select, button, textarea { font-family: inherit; }
      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: #07090d; }
      ::-webkit-scrollbar-thumb { background: #1e2230; border-radius: 3px; }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes spin { to { transform: rotate(360deg); } }

      .fade-up   { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
      .fade-up-1 { animation-delay: 0.06s; }
      .fade-up-2 { animation-delay: 0.12s; }
      .fade-up-3 { animation-delay: 0.18s; }
      .fade-up-4 { animation-delay: 0.24s; }

      .auth-input { transition: border-color 0.15s, box-shadow 0.15s; }
      .auth-input:focus { border-color: #f59e0b !important; box-shadow: 0 0 0 3px #f59e0b18 !important; outline: none; }
      .auth-input::placeholder { color: #2d3348; }

      .btn-gold { transition: all 0.18s cubic-bezier(0.16,1,0.3,1); }
      .btn-gold:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 24px #f59e0b30; }
      .btn-gold:active { transform: translateY(0); }

      .nav-tab { transition: all 0.15s; }
      .nav-tab:hover { color: #e2e8f0 !important; }

      .exp-row { transition: border-color 0.15s; }
      .exp-row:hover { border-color: #2a2d3a !important; }

      .del-btn:hover { color: #ef4444 !important; }
      .ghost-btn { transition: all 0.15s; }
      .ghost-btn:hover { border-color: #2e3244 !important; color: #e2e8f0 !important; background: #111318 !important; }
    `}</style>
  );
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ════════════════════════════════════════════════════════════════
const VENDOR_MAP = {
  swiggy:"Food", zomato:"Food", dominos:"Food", mcdonald:"Food",
  kfc:"Food", subway:"Food", starbucks:"Food", dunkin:"Food", burger:"Food",
  uber:"Transport", ola:"Transport", rapido:"Transport", irctc:"Transport",
  makemytrip:"Travel", airbnb:"Travel", oyo:"Travel", booking:"Travel", goibibo:"Travel",
  netflix:"Entertainment", spotify:"Entertainment", hotstar:"Entertainment", prime:"Entertainment",
  amazon:"Shopping", flipkart:"Shopping", myntra:"Shopping", ajio:"Shopping", nykaa:"Shopping",
  apollo:"Health", practo:"Health", medplus:"Health", pharmeasy:"Health",
  byjus:"Education", coursera:"Education", udemy:"Education", unacademy:"Education",
  jio:"Utilities", airtel:"Utilities", bsnl:"Utilities",
};
const CAT_COLORS = {
  Food:"#f59e0b", Transport:"#3b82f6", Travel:"#8b5cf6",
  Entertainment:"#ec4899", Shopping:"#10b981", Health:"#ef4444",
  Education:"#06b6d4", Utilities:"#f97316", Other:"#6b7280",
};



function inferCategory(vendor) {
  if (!vendor || typeof vendor !== "string") return "Other";

  const l = vendor.toLowerCase();

  for (const [k, c] of Object.entries(VENDOR_MAP)) {
    if (l.includes(k)) return c;
  }

  return "Other";
}

const catColor = c => CAT_COLORS[c] || "#6b7280";

let nextId = 11;
// const SEED = [
//   { id:1,  date:"2025-02-01", amount:320,  vendor:"Swiggy",     description:"Dinner",         category:"Food" },
//   { id:2,  date:"2025-02-03", amount:150,  vendor:"Uber",       description:"Office cab",      category:"Transport" },
//   { id:3,  date:"2025-02-05", amount:1800, vendor:"Swiggy",     description:"Party order",     category:"Food" },
//   { id:4,  date:"2025-02-07", amount:499,  vendor:"Netflix",    description:"Subscription",    category:"Entertainment" },
//   { id:5,  date:"2025-02-10", amount:200,  vendor:"Ola",        description:"Airport drop",    category:"Transport" },
//   { id:6,  date:"2025-02-12", amount:350,  vendor:"Zomato",     description:"Lunch",           category:"Food" },
//   { id:7,  date:"2025-02-15", amount:5000, vendor:"MakeMyTrip", description:"Flight booking",  category:"Travel" },
//   { id:8,  date:"2025-02-18", amount:180,  vendor:"Rapido",     description:"Evening ride",    category:"Transport" },
//   { id:9,  date:"2025-02-20", amount:999,  vendor:"Amazon",     description:"Headphones",      category:"Shopping" },
//   { id:10, date:"2025-02-22", amount:280,  vendor:"Starbucks",  description:"Coffee meetup",   category:"Food" },
// ];

function detectAnomalies(expenses) {
  const groups = {};
  expenses.forEach(e => { (groups[e.category] = groups[e.category] || []).push(e.amount); });
  const avgs = {};
  Object.entries(groups).forEach(([c, a]) => { avgs[c] = a.reduce((s, v) => s + v, 0) / a.length; });
  return expenses.map(e => ({ ...e, isAnomaly: e.amount > avgs[e.category] * 3 }));
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    const vendor = obj.vendor || obj["vendor name"] || "";
    return {
      id: nextId++,
      date: obj.date || new Date().toISOString().slice(0, 10),
      amount: parseFloat(obj.amount) || 0,
      vendor, description: obj.description || "",
      category: inferCategory(vendor),
    };
  }).filter(e => e.amount > 0);
}

// ════════════════════════════════════════════════════════════════
// SHARED UI ATOMS
// ════════════════════════════════════════════════════════════════
function Badge({ label, color }) {
  return (
    <span style={{ background: color + "20", color, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: "#0e1018", border: "1px solid #1a1d28", borderRadius: 12, padding: "20px 22px", flex: 1, minWidth: 130, borderTop: `3px solid ${accent}` }}>
      <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f0f0", fontFamily: "'DM Mono', monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#4b5563", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {data.map(d => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 100, fontSize: 12, color: "#6b7280", textAlign: "right", flexShrink: 0 }}>{d.label}</div>
          <div style={{ flex: 1, background: "#161920", borderRadius: 4, height: 22, overflow: "hidden" }}>
            <div style={{ width: `${(d.value / max) * 100}%`, height: "100%", background: `linear-gradient(90deg, ${catColor(d.label)}, ${catColor(d.label)}90)`, borderRadius: 4, display: "flex", alignItems: "center", paddingLeft: 8, minWidth: 50 }}>
              <span style={{ fontSize: 11, color: "#000", fontWeight: 800, whiteSpace: "nowrap" }}>₹{d.value.toLocaleString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 17, height: 17, border: "2px solid #00000025", borderTop: "2px solid #000", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "error" ? "#dc2626" : "#16a34a", color: "#fff", padding: "12px 20px", borderRadius: 10, fontWeight: 600, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }}>
      {toast.msg}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// AUTH — shared layout shell
// ════════════════════════════════════════════════════════════════
function AuthShell({ children, title, subtitle, switchLabel, switchCta, onSwitch }) {
  return (
    <div style={{ minHeight: "100vh", background: "#07090d", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Background grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.035, pointerEvents: "none" }}>
        <defs>
          <pattern id="g" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0L0 0 0 56" fill="none" stroke="#f59e0b" strokeWidth="0.7" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>
      {/* Glow orbs */}
      <div style={{ position: "absolute", top: "-15%", right: "-8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, #f59e0b10 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-15%", left: "-8%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, #3b82f610 0%, transparent 70%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ position: "absolute", top: 24, left: 32, display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: "#000" }}>₹</div>
        <span style={{ fontWeight: 800, fontSize: 17, color: "#f0f0f0", letterSpacing: "-0.02em" }}>ExpenseIQ</span>
      </div>

      {/* Card */}
      <div className="fade-up" style={{ width: "100%", maxWidth: 440, background: "#0e1018", border: "1px solid #1a1d28", borderRadius: 20, padding: "44px 40px", position: "relative", zIndex: 10, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ position: "absolute", top: 0, left: 40, right: 40, height: 2, background: "linear-gradient(90deg,transparent,#f59e0b,transparent)", borderRadius: 1 }} />
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ fontSize: 25, fontWeight: 800, color: "#f0f0f0", letterSpacing: "-0.03em", marginBottom: 7 }}>{title}</h1>
          <p style={{ fontSize: 13, color: "#4b5563" }}>{subtitle}</p>
        </div>
        {children}
        <p style={{ textAlign: "center", fontSize: 13, color: "#4b5563", marginTop: 26 }}>
          {switchLabel}{" "}
          <button onClick={onSwitch} style={{ background: "none", border: "none", color: "#f59e0b", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>{switchCta}</button>
        </p>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", placeholder, value, onChange, error, icon }) {
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "#2d3348", pointerEvents: "none" }}>{icon}</span>}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} className="auth-input"
          style={{ width: "100%", background: "#0a0c12", border: `1px solid ${error ? "#ef4444" : "#1a1d28"}`, borderRadius: 10, color: "#e2e8f0", padding: icon ? "12px 14px 12px 40px" : "12px 14px", fontSize: 14 }} />
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 5 }}>{error}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, error }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ marginBottom: 15 }}>
      <label style={{ fontSize: 11, color: "#6b7280", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#2d3348", pointerEvents: "none" }}>🔒</span>
        <input type={show ? "text" : "password"} placeholder="••••••••" value={value} onChange={onChange} className="auth-input"
          style={{ width: "100%", background: "#0a0c12", border: `1px solid ${error ? "#ef4444" : "#1a1d28"}`, borderRadius: 10, color: "#e2e8f0", padding: "12px 40px 12px 40px", fontSize: 14 }} />
        <button type="button" onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 15, padding: 2 }}>
          {show ? "🙈" : "👁"}
        </button>
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 5 }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ════════════════════════════════════════════════════════════════
const DEMO_USER = { name: "Demo User", email: "demo@expenseiq.com", password: "demo1234" };

function LoginPage({ onLogin, onGoSignup, users }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors]     = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading]   = useState(false);

  function validate() {
    const e = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    return e;
  }

  async function handleSubmit(ev) {
  ev.preventDefault();

  const e = validate();
  if (Object.keys(e).length) {
    setErrors(e);
    return;
  }

  try {
    setLoading(true);
    setServerErr("");

    const res = await API.post("/auth/login", {
      email,
      password,
    });

    // save token
    console.log("Login response:", res.data);
    localStorage.setItem("token", res.data);
   console.log("Saved token:", localStorage.getItem("token"));

    onLogin(res.data);
    

  } catch (err) {
    setServerErr("Invalid email or password");
  } finally {
    setLoading(false);
  }
}


  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ExpenseIQ account" switchLabel="Don't have an account?" switchCta="Create one →" onSwitch={onGoSignup}>
      <form onSubmit={handleSubmit}>
        <InputField label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} icon="✉" />
        <PasswordField label="Password" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -6, marginBottom: 20 }}>
          <button type="button" style={{ background: "none", border: "none", color: "#f59e0b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Forgot password?</button>
        </div>

        {serverErr && (
          <div style={{ background: "#ef444412", border: "1px solid #ef444330", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ef4444" }}>
            ⚠ {serverErr}
          </div>
        )}

        <button type="submit" className="btn-gold" style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? <><Spinner /> Signing in…</> : "Sign in →"}
        </button>
      </form>

      <div style={{ marginTop: 18, background: "#f59e0b09", border: "1px solid #f59e0b20", borderRadius: 9, padding: "10px 14px" }}>
        <p style={{ fontSize: 12, color: "#6b7280" }}><span style={{ color: "#f59e0b", fontWeight: 700 }}>Demo:</span> demo@expenseiq.com / demo1234</p>
      </div>
    </AuthShell>
  );
}

// ════════════════════════════════════════════════════════════════
// SIGNUP PAGE
// ════════════════════════════════════════════════════════════════
function SignupPage({ onSignup, onGoLogin, users, onRegister }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [agree, setAgree]       = useState(false);
  const [errors, setErrors]     = useState({});
  const [serverErr, setServerErr] = useState("");
  const [loading, setLoading]   = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const STRENGTH_COLOR = ["#1a1d28","#ef4444","#f59e0b","#22c55e"];
  const STRENGTH_LABEL = ["","Weak","Fair","Strong"];

  function validate() {
    const e = {};
    if (!name.trim()) e.name = "Full name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Minimum 6 characters";
    if (!confirm) e.confirm = "Please confirm your password";
    else if (confirm !== password) e.confirm = "Passwords do not match";
    if (!agree) e.agree = "You must accept the terms to continue";
    return e;
  }

  async function handleSubmit(ev) {
  ev.preventDefault();

  const e = validate();
  if (Object.keys(e).length) {
    setErrors(e);
    return;
  }

  try {
    setLoading(true);
    setServerErr("");

    await API.post("/auth/signup", {
      name,
      email,
      password,
    });

    // after signup redirect to login
    onGoLogin();
     

  } catch (err) {
    setServerErr("Signup failed. Try again.");
  } finally {
    setLoading(false);
  }
}


  return (
    <AuthShell title="Create account" subtitle="Start tracking your expenses for free" switchLabel="Already have an account?" switchCta="Sign in →" onSwitch={onGoLogin}>
      <form onSubmit={handleSubmit}>
        <InputField label="Full Name" placeholder="Arjun Sharma" value={name} onChange={e => setName(e.target.value)} error={errors.name} icon="👤" />
        <InputField label="Email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} icon="✉" />
        <PasswordField label="Password" value={password} onChange={e => setPassword(e.target.value)} error={errors.password} />

        {/* Strength bar */}
        {password.length > 0 && (
          <div style={{ marginTop: -8, marginBottom: 15 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? STRENGTH_COLOR[strength] : "#1a1d28", transition: "background 0.3s" }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: STRENGTH_COLOR[strength], fontWeight: 700 }}>{STRENGTH_LABEL[strength]}</span>
          </div>
        )}

        <PasswordField label="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} error={errors.confirm} />

        {/* Terms checkbox */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }} onClick={() => setAgree(a => !a)}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${errors.agree ? "#ef4444" : "#1e2230"}`, background: agree ? "#f59e0b" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
              {agree && <span style={{ fontSize: 11, color: "#000", fontWeight: 900 }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
              I agree to the <span style={{ color: "#f59e0b", fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: "#f59e0b", fontWeight: 600 }}>Privacy Policy</span>
            </span>
          </div>
          {errors.agree && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 5 }}>{errors.agree}</p>}
        </div>

        {serverErr && (
          <div style={{ background: "#ef444412", border: "1px solid #ef444330", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#ef4444" }}>
            ⚠ {serverErr}
          </div>
        )}

        <button type="submit" className="btn-gold" style={{ width: "100%", background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000", border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {loading ? <><Spinner /> Creating account…</> : "Create Account →"}
        </button>
      </form>
    </AuthShell>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPENSE APP (authenticated view)
// ════════════════════════════════════════════════════════════════
function ExpenseApp({ user, onLogout }) {
  const [rawExpenses, setRawExpenses] = useState([]);
  const [activeTab, setActiveTab]     = useState("dashboard");
  const [form, setForm]               = useState({ date: "", amount: "", vendor: "", description: "" });
  const [formError, setFormError]     = useState("");
  const [csvStatus, setCsvStatus]     = useState("");
  const [toast, setToast]             = useState(null);
  const [filterMonth, setFilterMonth] = useState("all");
  const fileRef = useRef();

  const allExpenses = useMemo(() => detectAnomalies(rawExpenses), [rawExpenses]);
  const anomalies   = useMemo(() => allExpenses.filter(e => e.isAnomaly), [allExpenses]);

  const filtered = useMemo(() =>
    filterMonth === "all" ? allExpenses : allExpenses.filter(e => e.date.startsWith(filterMonth)),
    [allExpenses, filterMonth]
  );

const months = useMemo(() => {
  return Array.from(
    new Set(
      (rawExpenses || [])
        .map(e => e?.date?.slice(0, 7))
        .filter(Boolean)
    )
  ).sort().reverse();
}, [rawExpenses]);



  const totalSpend     = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);
  const categoryTotals = useMemo(() => {
    const m = {};
    filtered.forEach(e => { const cat = e.category || "Other";
  m[cat] = (m[cat] || 0) + e.amount;
});
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);
  const topVendors = useMemo(() => {
    const m = {};
    filtered.forEach(e => { m[e.vendor] = (m[e.vendor] || 0) + e.amount; });
    return Object.entries(m).map(([vendor, total]) => ({ vendor, total })).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filtered]);

  function showToast(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 2600); }
  useEffect(() => {
    fetchExpenses();
  }, []);

  async function fetchExpenses() {
  try {
    const res = await API.get("/expenses");

    const mapped = res.data.map(e => ({
      id: e.id,
      date: e.expenseDate,
      amount: Number(e.amount), 
      vendor: e.vendorName,
      description: e.description,
      category: e.category|| inferCategory(e.vendorName),
      isAnomaly: e.anomaly ?? e.isAnomaly ?? false
    }));

    setRawExpenses(mapped);
    console.log("Backend Data:", res.data);

  } catch (err) {
    console.log(err);
  }
}


  async function handleAddExpense(ev) {
  ev.preventDefault();

  if (!form.date || !form.amount || !form.vendor) {
    setFormError("Date, Amount and Vendor are required.");
    return;
  }

  try {
    const res = await API.post("/expenses", {
      expenseDate: form.date,
      amount: parseFloat(form.amount),
      vendorName: form.vendor,
      description: form.description,
      category:inferCategory(form.vendor)
    });

    const newExpense = {
  id: res.data.id,
  date: res.data.expenseDate,
  amount: Number(res.data.amount),
  vendor: res.data.vendorName,
  description: res.data.description,
  category: res.data.category,
  isAnomaly: res.data.anomaly ?? false
};

setRawExpenses(prev => [newExpense, ...prev]);

    setForm({ date: "", amount: "", vendor: "", description: "" });
    setFormError("");
    showToast("Expense added!");
  } catch (err) {
    console.log(err);
  }
}


async function handleCSVFile(file) {
  // Step 1: Optional quick local preview
  try {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target.result); // quick preview
        setRawExpenses(prev => [...parsed, ...prev]);
        setCsvStatus(`Previewed ${parsed.length} expense${parsed.length !== 1 ? "s" : ""}`);
      } catch {
        setCsvStatus("Failed to parse CSV preview.");
      }
    };
    reader.readAsText(file);
  } catch {
    setCsvStatus("Failed to read file for preview.");
  }

  // Step 2: Upload to backend
  const formData = new FormData();
  formData.append("file", file);
  setCsvStatus("Uploading CSV...");

  try {
    // Get JWT token from localStorage or your auth context
    const token = localStorage.getItem("token"); // adjust based on where you store it

    const res = await API.post("/expenses/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}` // 🔑 send token
      }
    });

    showToast(res.data); // "CSV uploaded successfully"

    // Step 3: Fetch backend-saved expenses to update table
    const backendRes = await API.get("/expenses", {
      headers: { Authorization: `Bearer ${token}` } // make sure GET also sends JWT
    });

    const mapped = backendRes.data.map(e => ({
      id: e.id,
      date: e.expenseDate,
      amount: Number(e.amount),
      vendor: e.vendorName,
      description: e.description,
      category: e.category || inferCategory(e.vendorName),
      isAnomaly: e.anomaly ?? e.isAnomaly ?? false
    }));
    setRawExpenses(mapped); // now Expense list shows DB data
    setCsvStatus(`Uploaded ${mapped.length} total expenses`);
    setTimeout(() => setCsvStatus(""), 4000);

  } catch (err) {
    console.error(err);
    setCsvStatus("CSV upload failed");
    showToast("CSV upload failed", "error");
    setTimeout(() => setCsvStatus(""), 4000);
  }
}

// readAsText(file);
//   }

async function deleteExpense(id) {
  if (!window.confirm("Are you sure you want to delete this expense?")) return;

  try {
    await API.delete(`/expenses/${id}`);

    // Remove from state so UI updates immediately
    setRawExpenses(prev => prev.filter(e => e.id !== id));

    showToast("Expense removed", "error");
  } catch (err) {
    console.error("Failed to delete expense:", err);
    showToast("Failed to delete expense", "error");
  }
}


  const TABS = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "expenses",  icon: "≡", label: "Expenses" },
    { id: "add",       icon: "+", label: "Add Expense" },
    { id: "anomalies", icon: "⚠", label: anomalies.length ? `Anomalies (${anomalies.length})` : "Anomalies" },
  ];

  const S = {
    root:   { minHeight: "100vh", background: "#07090d", color: "#e2e8f0" },
    header: { background: "#0d0f14", borderBottom: "1px solid #1a1d28", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, position: "sticky", top: 0, zIndex: 100 },
    logo:   { display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 17, color: "#f0f0f0", letterSpacing: "-0.02em" },
    mark:   { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15, color: "#000" },
    main:   { maxWidth: 1100, margin: "0 auto", padding: "30px 22px" },
    card:   { background: "#0e1018", border: "1px solid #1a1d28", borderRadius: 16, padding: "22px 26px", marginBottom: 22 },
    title:  { fontSize: 11, fontWeight: 700, color: "#4b5563", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 18, display: "flex", alignItems: "center", gap: 8 },
    input:  { background: "#07090d", border: "1px solid #1a1d28", borderRadius: 8, color: "#e2e8f0", padding: "10px 14px", fontSize: 14, width: "100%", outline: "none" },
    label:  { fontSize: 11, color: "#4b5563", marginBottom: 6, display: "block", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
    btn:    { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000", border: "none", borderRadius: 8, padding: "11px 26px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
    row:    { display: "grid", gridTemplateColumns: "100px 90px 140px 1fr 110px 80px 36px", gap: 10, alignItems: "center" },
  };

  return (
    <div style={S.root}>
      <Toast toast={toast} />

      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.logo}>
          <div style={S.mark}>₹</div>
          ExpenseIQ
        </div>

        <nav style={{ display: "flex", gap: 3 }}>
          {TABS.map(t => (
            <button key={t.id} className="nav-tab" onClick={() => setActiveTab(t.id)} style={{ background: activeTab === t.id ? "#f59e0b12" : "transparent", border: `1px solid ${activeTab === t.id ? "#f59e0b40" : "transparent"}`, color: activeTab === t.id ? "#f59e0b" : "#6b7280", padding: "6px 13px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0" }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "#4b5563" }}>{user.email}</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#000", fontSize: 14, flexShrink: 0 }}>
            {user?.name?.[0]?.toUpperCase()}

          </div>
          <button className="ghost-btn" onClick={onLogout} style={{ background: "transparent", border: "1px solid #1e2230", color: "#6b7280", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
            Sign out
          </button>
        </div>
      </header>

      <main style={S.main}>

        {/* ══ DASHBOARD ══ */}
        {activeTab === "dashboard" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 4 }}>Financial Overview</h1>
                <p style={{ color: "#4b5563", fontSize: 13 }}>Welcome back, {user?.name?.split(" ")?.[0] || "User"}. Here's your spending summary.</p>
              </div>
              <select className="auth-input" style={{ ...S.input, width: "auto", padding: "8px 14px" }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
                <option value="all">All Time</option>
                {months.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: 14, marginBottom: 22, flexWrap: "wrap" }}>
              <StatCard label="Total Spend"  value={`₹${totalSpend.toLocaleString()}`} sub={`${filtered.length} transactions`} accent="#f59e0b" />
              <StatCard label="Categories"   value={categoryTotals.length} sub="with activity" accent="#3b82f6" />
              <StatCard label="Anomalies"    value={anomalies.length} sub="flagged (3× avg)" accent="#ef4444" />
              <StatCard label="Top Category" value={categoryTotals[0]?.label || "—"} sub={categoryTotals[0] ? `₹${categoryTotals[0].value.toLocaleString()}` : "No data"} accent="#10b981" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 22 }}>
              <div style={S.card}>
                <div style={S.title}>◈ Spend by Category</div>
                {categoryTotals.length === 0
                  ? <p style={{ color: "#2d3348", fontSize: 13 }}>No expenses for this period.</p>
                  : <BarChart data={categoryTotals} />}
              </div>
              <div style={S.card}>
                <div style={S.title}>↑ Top 5 Vendors</div>
                {topVendors.map((v, i) => {
                  const cat = inferCategory(v.vendor);
                  const pct = totalSpend > 0 ? ((v.total / totalSpend) * 100).toFixed(1) : 0;
                  return (
                    <div key={v.vendor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < topVendors.length - 1 ? "1px solid #13161e" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `linear-gradient(135deg,${catColor(cat)},${catColor(cat)}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#000" }}>{i + 1}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{v.vendor}</div>
                          <div style={{ fontSize: 11, color: "#4b5563" }}>{cat} · {pct}%</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, color: "#f0f0f0", fontSize: 13 }}>₹{v.total.toLocaleString()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {anomalies.length > 0 && (
              <div style={{ ...S.card, borderTop: "3px solid #ef4444" }}>
                <div style={{ ...S.title, color: "#ef4444" }}>⚠ Anomalies — {anomalies.length} Flagged</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {anomalies.map(e => (
                    <div key={e.id} style={{ background: "#ef444410", border: "1px solid #ef444428", borderRadius: 10, padding: "12px 16px", minWidth: 190 }}>
                      <div style={{ fontWeight: 800, fontSize: 20, color: "#ef4444", fontFamily: "'DM Mono',monospace" }}>₹{e.amount.toLocaleString()}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, margin: "3px 0" }}>{e.vendor}</div>
                      <div style={{ fontSize: 11, color: "#4b5563" }}>{e.date} · {e.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ EXPENSES LIST ══ */}
        {activeTab === "expenses" && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 22 }}>
              All Expenses <span style={{ color: "#2d3348", fontWeight: 500, fontSize: 16 }}>({allExpenses.length})</span>
            </h1>
            <div style={{ ...S.row, padding: "8px 14px", background: "#0a0c12", borderRadius: 9, marginBottom: 8, fontSize: 10, color: "#4b5563", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>Date</span><span>Amount</span><span>Vendor</span><span>Description</span><span>Category</span><span>Status</span><span></span>
            </div>
            {allExpenses.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 0", color: "#2d3348" }}>No expenses yet. Add some!</div>
              : allExpenses.map(e => (
                <div key={e.id} className="exp-row" style={{ ...S.row, padding: "11px 14px", borderRadius: 10, marginBottom: 5, fontSize: 13, background: e.isAnomaly ? "#ef444408" : "#0a0c12", border: `1px solid ${e.isAnomaly ? "#ef444428" : "#13161e"}` }}>
                  <span style={{ color: "#4b5563", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>{e.date}</span>
                  <span style={{ fontWeight: 700, fontFamily: "'DM Mono',monospace", color: e.isAnomaly ? "#ef4444" : "#f0f0f0" }}>₹{e.amount.toLocaleString()}</span>
                  <span style={{ fontWeight: 600 }}>{e.vendor}</span>
                  <span style={{ color: "#4b5563", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.description || "—"}</span>
                  <Badge label={e.category} color={catColor(e.category)} />
                  {e.isAnomaly ? <Badge label="Anomaly" color="#ef4444" /> : <span style={{ color: "#16a34a", fontSize: 11, fontWeight: 700 }}>✓ OK</span>}
                  <button className="del-btn" onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "none", color: "#2d3348", cursor: "pointer", fontSize: 16, padding: 0, transition: "color 0.15s" }}>✕</button>
                </div>
              ))
            }
          </>
        )}

        {/* ══ ADD EXPENSE ══ */}
        {activeTab === "add" && (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 22 }}>Add Expense</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
              <div style={S.card}>
                <div style={S.title}>✎ Manual Entry</div>
                <form onSubmit={handleAddExpense}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={S.label}>Date *</label>
                      <input type="date" className="auth-input" style={S.input} value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                    </div>
                    <div>
                      <label style={S.label}>Amount (₹) *</label>
                      <input type="number" min="0" step="0.01" placeholder="0.00" className="auth-input" style={S.input} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Vendor Name *</label>
                    <input type="text" placeholder="e.g. Swiggy, Uber, Netflix…" className="auth-input" style={S.input} value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} />
                    {form.vendor && (
                      <div style={{ marginTop: 7, fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "#4b5563" }}>Auto-category:</span>
                        <Badge label={inferCategory(form.vendor)} color={catColor(inferCategory(form.vendor))} />
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Description</label>
                    <input type="text" placeholder="Optional note…" className="auth-input" style={S.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  {formError && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{formError}</p>}
                  <button type="submit" style={S.btn} className="btn-gold">Add Expense →</button>
                </form>
              </div>

              <div style={S.card}>
                <div style={S.title}>↑ CSV Import</div>
                <div style={{ border: "2px dashed #1a1d28", borderRadius: 12, padding: "44px 20px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
                  onClick={() => fileRef.current.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCSVFile(f); }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>📂</div>
                  <div style={{ fontWeight: 700, marginBottom: 5, fontSize: 14 }}>Drop CSV or click to browse</div>
                  <div style={{ fontSize: 12, color: "#4b5563" }}>Columns: date, amount, vendor, description</div>
                  <input type="file" accept=".csv" ref={fileRef} style={{ display: "none" }} onChange={e => { const f = e.target.files[0]; if (f) handleCSVFile(f); e.target.value = ""; }} />
                </div>
                {csvStatus && <p style={{ color: csvStatus.startsWith("Failed") ? "#ef4444" : "#16a34a", fontSize: 13, fontWeight: 600, marginBottom: 14 }}>{csvStatus}</p>}

                <div style={S.title}>Sample Format</div>
                <div style={{ background: "#07090d", border: "1px solid #13161e", borderRadius: 8, padding: "12px 14px", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "#4b5563", lineHeight: 1.9 }}>
                 vendorName,description,expenseDate,amount<br />
                  wiggy,Dinner,2025-02-01,320<br/>
                  Uber,Office cab,2025-02-02,150<br/>
                  Netflix,Monthly sub,2025-02-03,499
                </div>
                <div style={{ marginTop: 18 }}>
                  <div style={S.title}>Supported Categories</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {Object.entries(CAT_COLORS).map(([cat, color]) => <Badge key={cat} label={cat} color={color} />)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ANOMALIES ══ */}
        {activeTab === "anomalies" && (
          <>
            <div style={{ marginBottom: 26 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 6 }}>Anomaly Detection</h1>
              <p style={{ color: "#4b5563", fontSize: 13 }}>Flagged when an expense exceeds <strong style={{ color: "#f59e0b" }}>3× the category average</strong>.</p>
            </div>
            {anomalies.length === 0 ? (
              <div style={{ ...S.card, textAlign: "center", padding: "68px 22px", borderTop: "3px solid #22c55e" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>All Clear!</div>
                <div style={{ color: "#4b5563", fontSize: 13 }}>No anomalies across {allExpenses.length} expenses.</div>
              </div>
            ) : anomalies.map(e => {
              const catE = allExpenses.filter(x => x.category === e.category);
              const avg  = catE.reduce((s, x) => s + x.amount, 0) / catE.length;
              const mult = (e.amount / avg).toFixed(1);
              return (
                <div key={e.id} style={{ ...S.card, borderLeft: "4px solid #ef4444", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                      <span style={{ color: "#ef4444", fontSize: 18 }}>⚠</span>
                      <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "'DM Mono',monospace", color: "#ef4444" }}>₹{e.amount.toLocaleString()}</span>
                      <Badge label={e.category} color={catColor(e.category)} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{e.vendor}</div>
                    <div style={{ color: "#4b5563", fontSize: 13 }}>{e.date} · {e.description || "No description"}</div>
                  </div>
                  <div style={{ textAlign: "center", background: "#ef444410", border: "1px solid #ef444428", borderRadius: 12, padding: "14px 22px", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: "#4b5563", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.1em" }}>Category Avg</div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, marginBottom: 8 }}>₹{avg.toFixed(0)}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: "#ef4444", fontFamily: "'DM Mono',monospace" }}>{mult}×</div>
                    <div style={{ fontSize: 10, color: "#ef4444" }}>above average</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// ROOT — manages auth state & page routing
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]       = useState("login");   // "login" | "signup" | "app"
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers]     = useState([DEMO_USER]);

  function handleLogin(u)    { setCurrentUser(u); setPage("app"); }
  function handleSignup(u)   { setCurrentUser(u); setPage("app"); }
  function handleLogout()    { setCurrentUser(null); setPage("login"); }
  function handleRegister(u) { setUsers(prev => [...prev, u]); }

  return (
    <>
      <GlobalStyles />
      {page === "login"  && <LoginPage  onLogin={handleLogin}   onGoSignup={() => setPage("signup")} users={users} />}
      {page === "signup" && <SignupPage onSignup={handleSignup} onGoLogin={() => setPage("login")}   users={users} onRegister={handleRegister} />}
      {page === "app"    && currentUser && <ExpenseApp user={currentUser} onLogout={handleLogout} />}
    </>
  );
}

