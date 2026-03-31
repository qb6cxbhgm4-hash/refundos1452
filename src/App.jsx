import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import api from "./api";

/* ═══ HOOKS ═══ */
function useApi(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const go = useCallback(async () => { setLoading(true); setError(null); try { setData(await fn()); } catch (e) { setError(e.message); } finally { setLoading(false); } }, deps);
  useEffect(() => { go(); }, [go]);
  return { data, loading, error, refetch: go };
}
function getUser() { try { return JSON.parse(localStorage.getItem("ros_user") || "{}"); } catch { return {}; } }

/* ═══ TOAST ═══ */
const TC = createContext();
function TP({ children }) {
  const [t, setT] = useState(null); const tm = useRef();
  const show = (m) => { setT(m); clearTimeout(tm.current); tm.current = setTimeout(() => setT(null), 2800); };
  return <TC.Provider value={show}>{children}{t && <div style={{ position: "fixed", bottom: 20, right: 20, background: "#202223", color: "#fff", padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, boxShadow: "0 4px 16px rgba(0,0,0,.2)", zIndex: 9999, animation: "slideUp .25s var(--ease)" }}>{t}</div>}</TC.Provider>;
}
function useT() { return useContext(TC); }

/* ═══ UTILS ═══ */
function stat(p) {
  const d = p.oos ?? (p.avg > 0 ? Math.floor(p.stock / p.avg) : 999);
  if (p.status === "critical") return { l: "Critical", c: "c", d };
  if (p.status === "warning") return { l: "Warning", c: "w", d };
  if (p.stock <= (p.safety || 10)) return d <= 3 ? { l: "Critical", c: "c", d } : { l: "Low stock", c: "w", d };
  if (d <= (p.lead || 5) + 3) return { l: "Low stock", c: "w", d };
  return { l: "Active", c: "s", d };
}
function recQty(p) { return Math.max(p.moq || 20, Math.ceil(p.avg * ((p.lead || 5) + 7)) - p.stock); }

/* ═══ ICONS ═══ */
const sv = (d, s = 16) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: s, height: s }}>{d}</svg>;
const Ic = {
  home: sv(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  box: sv(<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />),
  bell: sv(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>),
  layers: sv(<><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>),
  chart: sv(<><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></>),
  store: sv(<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>),
  gear: sv(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>),
  user: sv(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>),
  headphones: sv(<><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" /></>),
  logout: sv(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>),
  refresh: sv(<><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>, 14),
  back: sv(<polyline points="15 18 9 12 15 6" />, 14),
};

/* ═══ UI ATOMS ═══ */
const Sk = ({ w = "100%", h = 16 }) => <div style={{ width: w, height: h, borderRadius: 4, background: "#e1e3e5", animation: "pulse 1.5s ease infinite" }} />;
const Badge = ({ c, children }) => <span className={`badge badge-${c}`}>{children}</span>;
const Empty = ({ msg, icon }) => <div style={{ textAlign: "center", padding: 48, color: "#8c9196" }}>{icon && <div style={{ marginBottom: 12, opacity: .4 }}>{icon}</div>}<div style={{ fontSize: 13 }}>{msg || "No data available"}</div></div>;
const Card = ({ title, right, children, flush }) => <div className="card"><div className="card-h"><span className="card-t">{title}</span>{right}</div><div className={`card-b${flush ? " flush" : ""}`}>{children}</div></div>;
const Met = ({ label, value, color, sub }) => { const cm = { green: "#008060", amber: "#b98900", red: "#d72c0d" }; return <div className="m-card"><div className="m-label">{label}</div><div className="m-val" style={color ? { color: cm[color] } : {}}>{typeof value === "number" ? value.toLocaleString() : value}</div>{sub && <div className="m-sub">{sub}</div>}</div>; };
const Btn = ({ children, primary, danger, slim, ...p }) => <button className={`btn${primary ? " btn-p" : ""}${danger ? " btn-d" : ""}${slim ? " btn-s" : ""}`} {...p}>{children}</button>;

/* ═══ CHARTS ═══ */
function BarChart({ data, height = 200, color = "#008060" }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c || !data?.length) return;
    const dpr = devicePixelRatio || 1, w = c.parentElement.offsetWidth;
    c.width = w * dpr; c.height = height * dpr; c.style.width = w + "px"; c.style.height = height + "px";
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const pad = { t: 24, r: 12, b: 28, l: 36 }, cw = w - pad.l - pad.r, ch = height - pad.t - pad.b;
    const max = Math.max(...data.map(d => d.v)) * 1.15 || 1;
    const bw = Math.min(32, (cw / data.length) * 0.6), gap = (cw - bw * data.length) / (data.length + 1);
    ctx.strokeStyle = "#f1f2f3"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = pad.t + ch * (1 - i / 4); ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.fillStyle = "#8c9196"; ctx.font = "500 10px -apple-system,sans-serif"; ctx.textAlign = "right"; ctx.fillText(Math.round(max * i / 4), pad.l - 6, y + 3); }
    data.forEach((d, i) => { const x = pad.l + gap * (i + 1) + bw * i, bh = (d.v / max) * ch, y = pad.t + ch - bh; const g = ctx.createLinearGradient(0, y, 0, pad.t + ch); g.addColorStop(0, d.color || color); g.addColorStop(1, (d.color || color) + "55"); ctx.beginPath(); ctx.roundRect(x, y, bw, bh, [4, 4, 0, 0]); ctx.fillStyle = g; ctx.fill(); ctx.fillStyle = "#202223"; ctx.font = "600 10px -apple-system,sans-serif"; ctx.textAlign = "center"; ctx.fillText(d.v, x + bw / 2, y - 6); ctx.fillStyle = "#8c9196"; ctx.font = "400 10px -apple-system,sans-serif"; ctx.fillText(d.l, x + bw / 2, height - pad.b + 14); });
  }, [data, height, color]);
  return <canvas ref={ref} style={{ display: "block", width: "100%" }} />;
}
function HorizBar({ data, height = 160, color = "#008060" }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c || !data?.length) return;
    const dpr = devicePixelRatio || 1, w = c.parentElement.offsetWidth;
    c.width = w * dpr; c.height = height * dpr; c.style.width = w + "px"; c.style.height = height + "px";
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const pad = { t: 4, r: 60, b: 4, l: 80 }, cw = w - pad.l - pad.r, max = Math.max(...data.map(d => d.v)) || 1;
    const bh = Math.min(20, (height - 8) / data.length - 6), gap = (height - bh * data.length) / (data.length + 1);
    data.forEach((d, i) => { const y = gap * (i + 1) + bh * i, bw = (d.v / max) * cw; ctx.beginPath(); ctx.roundRect(pad.l, y, Math.max(4, bw), bh, 3); ctx.fillStyle = d.color || color; ctx.globalAlpha = .85; ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#6d7175"; ctx.font = "400 11px -apple-system,sans-serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillText(d.l, pad.l - 8, y + bh / 2); ctx.fillStyle = "#202223"; ctx.font = "600 11px -apple-system,sans-serif"; ctx.textAlign = "left"; ctx.fillText(d.v, pad.l + bw + 8, y + bh / 2); });
  }, [data, height, color]);
  return <canvas ref={ref} style={{ display: "block", width: "100%" }} />;
}
function DonutChart({ segments, size = 140 }) {
  const ref = useRef(); const total = segments.reduce((s, sg) => s + sg.v, 0) || 1;
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = devicePixelRatio || 1; c.width = size * dpr; c.height = size * dpr; c.style.width = size + "px"; c.style.height = size + "px";
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, R = size * .42, ri = size * .28; let angle = -Math.PI / 2;
    segments.forEach(s => { const sw = (s.v / total) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx, cy, R, angle, angle + sw); ctx.arc(cx, cy, ri, angle + sw, angle, true); ctx.closePath(); ctx.fillStyle = s.color; ctx.fill(); angle += sw; });
    ctx.fillStyle = "#202223"; ctx.font = "700 20px -apple-system,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(total, cx, cy - 4);
    ctx.fillStyle = "#8c9196"; ctx.font = "400 10px -apple-system,sans-serif"; ctx.fillText("total", cx, cy + 12);
  }, [segments, size, total]);
  return <canvas ref={ref} style={{ width: size, height: size, flexShrink: 0 }} />;
}

/* ═══ ONBOARDING SURVEY ═══ */
const OB_QS = [
  { q: "How did you hear about RefundOS?", opts: ["Google Search", "Social media", "Friend / colleague", "Shopify App Store", "Blog / article", "Other"] },
  { q: "What best describes your role?", opts: ["Founder / CEO", "Operations manager", "E-commerce manager", "Developer", "Marketing", "Other"] },
  { q: "How many people are on your team?", opts: ["Just me", "2-5", "6-15", "16-50", "50+"] },
  { q: "How many orders do you process monthly?", opts: ["Under 100", "100-500", "500-2,000", "2,000-10,000", "10,000+"] },
  { q: "What's your biggest operations challenge?", opts: ["Manual refund processing", "Inventory stockouts", "Reorder timing", "Returns management", "All of the above"] },
  { q: "Which features interest you most?", opts: ["AI refund decisions", "Stock predictions", "Auto-reorder", "Unified dashboard", "Analytics"], multi: true },
  { q: "What's your Shopify store URL?", input: true, placeholder: "yourstore.myshopify.com" },
];

function Survey({ onDone }) {
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState({});
  const [sel, setSel] = useState(new Set());
  const [inp, setInp] = useState("");
  const q = OB_QS[step];

  const next = () => {
    if (step < OB_QS.length - 1) { setStep(step + 1); setSel(new Set()); setInp(""); }
    else onDone();
  };
  const pick = (opt) => {
    if (q.multi) { setSel(p => { const n = new Set(p); n.has(opt) ? n.delete(opt) : n.add(opt); return n; }); }
    else { setAns(p => ({ ...p, [step]: opt })); setTimeout(next, 180); }
  };

  return <div className="survey-screen">
    <div style={{ width: "100%", maxWidth: 520, padding: "0 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>Refund<em style={{ fontStyle: "italic", color: "#008060" }}>OS</em></div>
        <div style={{ fontSize: 12, color: "#8c9196", marginTop: 4 }}>Help us personalize your experience</div>
      </div>
      <div style={{ height: 3, background: "#e1e3e5", borderRadius: 2, marginBottom: 32 }}>
        <div style={{ height: 3, background: "#008060", borderRadius: 2, width: `${((step + 1) / OB_QS.length) * 100}%`, transition: "width .4s var(--ease)" }} />
      </div>
      <div style={{ fontSize: 11, color: "#008060", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Question {step + 1} of {OB_QS.length}</div>
      <div key={step} style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, animation: "fadeIn .3s ease" }}>{q.q}</div>
      {q.input ? <div>
        <input className="form-i" value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && next()} placeholder={q.placeholder} autoFocus style={{ fontSize: 14, padding: "12px 16px", marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><Btn onClick={next} style={{ color: "#8c9196" }}>Skip</Btn><Btn primary onClick={next}>Continue</Btn></div>
      </div> : <div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {q.opts.map(opt => <button key={opt} onClick={() => pick(opt)} className={`survey-opt${(q.multi ? sel.has(opt) : ans[step] === opt) ? " on" : ""}`}>
            {q.multi && <span style={{ display: "inline-flex", width: 18, height: 18, borderRadius: 4, border: sel.has(opt) ? "none" : "1.5px solid #c9cccf", background: sel.has(opt) ? "#008060" : "#fff", color: "#fff", fontSize: 11, alignItems: "center", justifyContent: "center", marginRight: 10, verticalAlign: "middle", transition: "all .15s" }}>{sel.has(opt) && "v"}</span>}
            {opt}
          </button>)}
        </div>
        {q.multi && <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><Btn primary onClick={next} disabled={sel.size === 0}>Continue</Btn></div>}
      </div>}
      {step > 0 && <button onClick={() => setStep(step - 1)} style={{ marginTop: 12, background: "none", border: "none", color: "#8c9196", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Back</button>}
    </div>
  </div>;
}

/* ═══ LOGOUT SURVEY ═══ */
function LogoutFlow({ onCancel, onDone }) {
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const views = [
    <div key={0} style={{ textAlign: "center" }}>
      <div style={{ width: 48, height: 48, background: "#fef3c7", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#b98900" }}>{Ic.logout}</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Leaving so soon?</h2>
      <p style={{ fontSize: 13, color: "#6d7175", marginBottom: 24 }}>Are you sure you want to log out?</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}><Btn onClick={onCancel}>Stay logged in</Btn><Btn danger onClick={() => setStep(1)}>Yes, log out</Btn></div>
    </div>,
    <div key={1}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>What's your main reason?</h2>
      {["Just taking a break", "Done with my tasks", "Found what I needed", "Having technical issues", "Other"].map(r => <button key={r} onClick={() => setStep(2)} className="survey-opt">{r}</button>)}
    </div>,
    <div key={2} style={{ textAlign: "center" }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Rate your experience</h2>
      <p style={{ fontSize: 12, color: "#8c9196", marginBottom: 20 }}>1 = Poor, 5 = Excellent</p>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>{[1, 2, 3, 4, 5].map(n => <button key={n} onClick={() => { setRating(n); setStep(3); }} style={{ width: 48, height: 48, borderRadius: 12, border: rating === n ? "2px solid #008060" : "1px solid #e1e3e5", background: rating === n ? "#f0fdf4" : "#fff", fontSize: 18, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}>{n}</button>)}</div>
    </div>,
    <div key={3}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Anything we could improve?</h2>
      <p style={{ fontSize: 12, color: "#8c9196", marginBottom: 16 }}>Optional but appreciated.</p>
      <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Tell us what you think..." rows={3} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e1e3e5", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", marginBottom: 16 }} />
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}><Btn onClick={() => setStep(4)}>Skip</Btn><Btn primary onClick={() => setStep(4)}>Submit</Btn></div>
    </div>,
    <div key={4} style={{ textAlign: "center" }}>
      <div style={{ width: 48, height: 48, background: "#e4f5ee", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#008060", fontWeight: 700, fontSize: 20 }}>OK</div>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Thanks for using RefundOS</h2>
      <p style={{ fontSize: 13, color: "#6d7175", marginBottom: 24 }}>See you next time.</p>
      <Btn primary onClick={() => { localStorage.removeItem("ros_user"); onDone(); }}>Go to homepage</Btn>
    </div>,
  ];

  return <>
    <div className="modal-overlay" onClick={step === 0 ? onCancel : undefined} />
    <div className="modal-box">
      <div style={{ height: 3, background: "#e1e3e5", borderRadius: 2, marginBottom: 24 }}>
        <div style={{ height: 3, background: "#008060", borderRadius: 2, width: `${((step + 1) / 5) * 100}%`, transition: "width .3s var(--ease)" }} />
      </div>
      <div key={step} style={{ animation: "fadeIn .2s ease" }}>{views[step]}</div>
    </div>
  </>;
}

/* ═══ TUTORIAL ═══ */
const TUT = [
  { target: "home", title: "Dashboard Home", desc: "Real-time metrics, alerts, and stock health at a glance." },
  { target: "products", title: "Products", desc: "All Shopify products with stock levels and reorder recommendations." },
  { target: "alerts", title: "Stock Alerts", desc: "When stock drops below threshold, take action here." },
  { target: "inventory", title: "Auto-Reorder", desc: "Automated inventory management with one-click reorder." },
  { target: "analytics", title: "Analytics", desc: "Sales trends, stock velocity, and operational insights." },
  { target: "store", title: "Connect Store", desc: "Link your Shopify store to start syncing data." },
  { target: "settings", title: "Settings", desc: "Configure thresholds, lead times, and automation rules." },
];

function Tutorial({ step, onNext, onPrev, onSkip }) {
  const d = TUT[step]; const total = TUT.length;
  const el = document.querySelector(`[data-nav="${d.target}"]`);
  const rect = el?.getBoundingClientRect() || { top: 100, left: 8, width: 200, height: 36 };
  const mobile = window.innerWidth <= 768;
  return <>
    <div className="modal-overlay" onClick={onSkip} />
    <div style={{ position: "fixed", top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8, boxShadow: "0 0 0 9999px rgba(0,0,0,.45)", borderRadius: 8, zIndex: 201, pointerEvents: "none", transition: "all .3s var(--ease)" }} />
    <div className="modal-box" style={mobile ? { top: "auto", bottom: 16, left: 16, transform: "translateX(0)", maxWidth: "calc(100% - 32px)" } : { top: Math.min(rect.top, innerHeight - 260), left: rect.left + rect.width + 16, transform: "none", width: 340 }}>
      <div style={{ height: 3, background: "#e1e3e5", borderRadius: 2, marginBottom: 16 }}><div style={{ height: 3, background: "#008060", borderRadius: 2, width: `${((step + 1) / total) * 100}%`, transition: "width .3s" }} /></div>
      <div style={{ fontSize: 11, color: "#008060", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 8 }}>Step {step + 1} of {total}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{d.title}</div>
      <div style={{ fontSize: 13, color: "#6d7175", lineHeight: 1.6, marginBottom: 16 }}>{d.desc}</div>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 4, marginRight: "auto" }}>{Array.from({ length: total }, (_, i) => <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === step ? "#008060" : "#e1e3e5", transition: "background .2s" }} />)}</div>
        {step > 0 && <Btn slim onClick={onPrev}>Back</Btn>}
        {step < total - 1 ? <Btn slim primary onClick={onNext}>Next</Btn> : <Btn slim primary onClick={onSkip}>Get started</Btn>}
      </div>
    </div>
  </>;
}

/* ═══ PAGES ═══ */
function HomePage() {
  const { data: m, loading: ml, error: me } = useApi(() => api.metrics());
  const { data: al } = useApi(() => api.alerts());
  const { data: prods } = useApi(() => api.products());
  const cats = {}; (prods || []).forEach(p => { cats[p.category] = (cats[p.category] || 0) + p.stock; });
  const catData = Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v }));
  const tops = [...(prods || [])].sort((a, b) => b.avg - a.avg).slice(0, 6).map(p => ({ l: p.name.slice(0, 10), v: p.avg, color: stat(p).c === "c" ? "#d72c0d" : stat(p).c === "w" ? "#b98900" : "#008060" }));
  const sc = { a: 0, w: 0, c: 0 }; (prods || []).forEach(p => { const s = stat(p); if (s.c === "s") sc.a++; else if (s.c === "w") sc.w++; else sc.c++; });
  return <div><div className="metrics">{ml ? [1, 2, 3, 4, 5].map(i => <div key={i} className="m-card"><Sk w={80} h={10} /><div style={{ height: 6 }} /><Sk w={50} h={22} /></div>) : me ? <Empty msg="Failed to connect to API" /> : m && <><Met label="Total Products" value={m.total} sub={m.stock > 0 ? `${m.stock.toLocaleString()} units` : ""} /><Met label="Low Stock" value={m.low} color="amber" sub="Below threshold" /><Met label="Critical" value={m.critical} color="red" sub="Action needed" /><Met label="Today's Sales" value={m.sales} /><Met label="Avg. Daily" value={m.avgSales} color="green" /></>}</div>
    {prods?.length > 0 && <div className="grid-2" style={{ marginBottom: 12 }}>
      <Card title="Stock by Category"><HorizBar data={catData} /></Card>
      <Card title="Inventory Health" right={<Badge c="s">{sc.a} active</Badge>}><div style={{ display: "flex", alignItems: "center", gap: 20 }}><DonutChart segments={[{ v: sc.a, color: "#008060" }, { v: sc.w, color: "#b98900" }, { v: sc.c, color: "#d72c0d" }]} /><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{[["Active", sc.a, "#008060"], ["Warning", sc.w, "#b98900"], ["Critical", sc.c, "#d72c0d"]].map(([l, v, c]) => <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} /><span style={{ fontSize: 12, color: "#6d7175", width: 56 }}>{l}</span><strong style={{ fontSize: 13 }}>{v}</strong></div>)}</div></div></Card>
    </div>}
    {tops.length > 0 && <div className="grid-2"><Card title="Top Sellers (units/day)"><HorizBar data={tops} height={140} /></Card><Card title="Recent Alerts" right={al?.length > 0 && <Badge c="w">{al.length}</Badge>}>{al?.length ? al.slice(0, 4).map(a => <div key={a.id} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #f1f2f3", fontSize: 13 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: a.severity === "critical" ? "#d72c0d" : "#b98900", marginTop: 6, flexShrink: 0 }} /><div style={{ flex: 1, color: "#6d7175" }}><strong style={{ color: "#202223" }}>{a.name}</strong> - {a.message || `${a.oos}d left`}</div></div>) : <Empty msg="No active alerts" />}</Card></div>}
  </div>;
}

function ProductsPage({ onView }) {
  const { data: products, loading, error, refetch } = useApi(() => api.products());
  const [q, setQ] = useState(""); const [sf, setSf] = useState(""); const toast = useT();
  const list = (products || []).filter(p => { if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.sku.toLowerCase().includes(q.toLowerCase())) return false; if (sf) { const s = stat(p); if (sf === "u" && s.c === "s") return false; if (sf === "ok" && s.c !== "s") return false; } return true; });
  return <Card title={`Products${products ? ` (${list.length})` : ""}`} right={<div style={{ display: "flex", gap: 8 }}><input className="form-i" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} style={{ width: 200, padding: "6px 10px" }} /><select className="form-i" value={sf} onChange={e => setSf(e.target.value)} style={{ width: 120 }}><option value="">All status</option><option value="u">Reorder needed</option><option value="ok">In stock</option></select></div>} flush>
    {loading ? <div style={{ padding: 20 }}>{[1, 2, 3].map(i => <Sk key={i} h={40} />)}</div> : error ? <Empty msg="Failed to load products from API" /> : !list.length ? <Empty msg="No products found" /> :
      <table><thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Velocity</th><th>Days left</th><th>Status</th><th></th></tr></thead>
        <tbody>{list.map(p => { const s = stat(p); return <tr key={p.id}><td style={{ fontWeight: 500 }}>{p.name}</td><td style={{ color: "#8c9196", fontSize: 12 }}>{p.sku}</td><td style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{p.stock}</td><td>{p.avg}/day</td><td style={{ fontWeight: 600 }}>{s.d}d</td><td><Badge c={s.c}>{s.l}</Badge></td><td><Btn slim onClick={() => onView(p.id)}>View</Btn>{s.c !== "s" && <Btn slim primary onClick={async () => { try { await api.approve(p.id, recQty(p)); } catch {} toast(`Order placed: ${p.name}`); refetch(); }} style={{ marginLeft: 4 }}>Reorder</Btn>}</td></tr>; })}</tbody></table>}
  </Card>;
}

function DetailPage({ id, onBack }) {
  const { data: p, loading, refetch } = useApi(() => api.product(id), [id]); const toast = useT();
  if (loading) return <Sk h={300} />; if (!p) return <Empty msg="Product not found" />;
  const s = stat(p); const qty = p.recQty ?? recQty(p);
  return <div><Btn onClick={onBack} style={{ marginBottom: 12 }}>{Ic.back} Back to products</Btn>
    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
      <div><div style={{ width: "100%", aspectRatio: "1", background: "#f6f6f7", borderRadius: 12, border: "1px solid #e1e3e5" }} /><div style={{ marginTop: 12 }}><div style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: "#8c9196", marginTop: 4 }}>{p.sku} - {p.category}</div></div></div>
      <div><div className="kpi-grid">{[["Stock", p.stock, s.c === "c"], ["Days left", (p.oos ?? s.d) + "d"], ["7d Sales", p.s7 ?? p.avg * 7], ["30d Sales", p.s30 ?? p.avg * 30], ["Velocity", p.avg + "/day"], ["Lead time", p.lead + "d"], ["Safety stock", p.safety], ["MOQ", p.moq]].map(([l, v, w]) => <div className="kpi" key={l}><div className="kpi-l">{l}</div><div className="kpi-v" style={w ? { color: "#d72c0d" } : {}}>{v}</div></div>)}</div>
        <div style={{ background: "#e4f5ee", border: "1px solid #b4dfca", borderRadius: 8, padding: 14, marginTop: 8 }}><div className="kpi-l">Recommended order quantity</div><div style={{ fontSize: 24, fontWeight: 700, color: "#008060" }}>{qty} units</div></div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}><Btn primary onClick={async () => { try { await api.approve(p.id, qty); } catch {} toast(`Approved: ${p.name} x ${qty}`); refetch(); }}>Approve reorder ({qty})</Btn><Btn onClick={() => toast("Placed on hold")}>Hold</Btn></div>
      </div>
    </div>
  </div>;
}

function AlertsPage({ onView }) {
  const { data: alerts, loading, error, refetch } = useApi(() => api.alerts());
  const [held, setHeld] = useState(new Set()); const toast = useT();
  return <div>
    {alerts?.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><Btn primary onClick={async () => { for (const a of alerts) if (!held.has(a.id)) { try { await api.approve(a.id, a.recQty); } catch {} } toast("All alerts approved"); refetch(); }}>Approve all</Btn><Btn onClick={() => { setHeld(new Set(alerts.map(a => a.id))); toast("All placed on hold"); }}>Hold all</Btn></div>}
    {loading ? [1, 2, 3].map(i => <Sk key={i} h={64} />) : error ? <Empty msg="Failed to load alerts" /> : !alerts?.length ? <Empty msg="All products are sufficiently stocked" icon={Ic.bell} /> :
      alerts.map(a => <div key={a.id} className="alert-card" style={held.has(a.id) ? { opacity: .3, pointerEvents: "none" } : {}}>
        <Badge c={a.severity === "critical" ? "c" : "w"}>{a.severity === "critical" ? "Critical" : "Warning"}</Badge>
        <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{a.name}</div><div style={{ fontSize: 12, color: "#6d7175" }}>Stock: {a.stock} - {a.oos} days remaining - Recommended: {a.recQty} units</div>{a.message && <div style={{ fontSize: 11, color: "#8c9196", marginTop: 2 }}>{a.message}</div>}</div>
        <div style={{ display: "flex", gap: 4 }}><Btn slim primary onClick={async () => { try { await api.approve(a.id, a.recQty); } catch {} toast(`Approved: ${a.name}`); refetch(); }}>Approve</Btn><Btn slim onClick={() => { setHeld(p => new Set([...p, a.id])); toast("On hold"); }}>Hold</Btn><Btn slim onClick={() => onView(a.id)}>Details</Btn></div>
      </div>)}
  </div>;
}

function InventoryPage() {
  const { data: prods, loading } = useApi(() => api.products());
  if (loading) return <Sk h={200} />;
  if (!prods?.length) return <Empty msg="No inventory data. Connect your Shopify store to begin." />;
  const data = prods.map(p => ({ l: p.name.slice(0, 12), v: p.stock, color: stat(p).c === "c" ? "#d72c0d" : stat(p).c === "w" ? "#b98900" : "#008060" }));
  return <div className="grid-2">
    <Card title="Stock Levels"><BarChart data={data} height={220} /></Card>
    <Card title="Inventory Detail">{prods.slice(0, 8).map(p => { const s = stat(p); return <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f2f3" }}><div><div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: 11, color: "#8c9196" }}>{p.sku}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.stock}</span><Badge c={s.c}>{s.l}</Badge></div></div>; })}</Card>
  </div>;
}

function AnalyticsPage() {
  const { data: prods } = useApi(() => api.products()); const { data: al } = useApi(() => api.alerts());
  if (!prods?.length) return <Empty msg="No data available. Connect your store first." />;
  const dd = prods.slice(0, 7).map(p => ({ l: p.name.slice(0, 8), v: p.avg }));
  const sd = prods.slice(0, 6).map(p => ({ l: p.name.slice(0, 10), v: p.stock }));
  const sc = { Active: 0, Warning: 0, Critical: 0 }; prods.forEach(p => { const s = stat(p); if (s.c === "s") sc.Active++; else if (s.c === "w") sc.Warning++; else sc.Critical++; });
  return <div><div className="grid-2" style={{ marginBottom: 12 }}><Card title="Sales Velocity (units/day)">{dd.length > 0 ? <BarChart data={dd} /> : <Empty />}</Card><Card title="Current Stock Levels">{sd.length > 0 ? <BarChart data={sd} color="#2c6ecb" /> : <Empty />}</Card></div>
    <div className="grid-2"><Card title="Alert Distribution">{al?.length ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{[["Critical", al.filter(a => a.severity === "critical").length, "#d72c0d"], ["Warning", al.filter(a => a.severity === "warning").length, "#b98900"]].map(([l, v, c]) => <div key={l}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}><span>{l}</span><strong>{v}</strong></div><div style={{ height: 6, background: "#f1f2f3", borderRadius: 3 }}><div style={{ height: 6, background: c, borderRadius: 3, width: `${Math.max(5, (v / al.length) * 100)}%`, transition: "width .5s" }} /></div></div>)}</div> : <Empty msg="No alerts" />}</Card>
      <Card title="Products by Status"><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{Object.entries(sc).map(([l, v]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f6f6f7", borderRadius: 6 }}><span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span><strong>{v}</strong></div>)}</div></Card>
    </div>
  </div>;
}

function StorePage() {
  const toast = useT();
  const [stores, setStores] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem("ros_stores") || "[]"); return s; } catch { return []; }
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const saveStores = (s) => { setStores(s); localStorage.setItem("ros_stores", JSON.stringify(s)); };

  // Extract shop param from URL if present (after OAuth redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get("shop");
    const token = params.get("session_token") || params.get("token");
    if (shop && token) {
      handleConnect(shop, token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async (shop, sessionToken) => {
    setConnecting(true);
    setError(null);
    try {
      const res = await api.oauthCallback(sessionToken, shop);
      const store = {
        id: res.store?.id || res.id || Date.now().toString(),
        name: res.store?.name || shop.replace(".myshopify.com", ""),
        url: shop.includes(".") ? shop : shop + ".myshopify.com",
        connected_at: new Date().toISOString(),
        status: "active",
      };
      saveStores([...stores, store]);
      toast(`${store.name} connected successfully`);
    } catch (err) {
      setError(`Connection failed: ${err.message}. Make sure the Shopify app is installed first.`);
    } finally {
      setConnecting(false);
    }
  };

  const startOAuth = () => {
    // Open Shopify app install flow in new window
    // The inventory-sync app handles OAuth and redirects back
    const shopInput = document.getElementById("shop-url-input");
    const shop = shopInput?.value?.trim();
    if (!shop) { toast("Enter your Shopify store URL"); return; }
    const cleanShop = shop.replace("https://", "").replace("http://", "").replace(/\/$/, "");
    const installUrl = `https://${cleanShop}/admin/oauth/authorize?client_id=${encodeURIComponent(window.__SHOPIFY_CLIENT_ID || "")}&scope=read_products,write_products,read_orders,write_orders,read_inventory,write_inventory&redirect_uri=${encodeURIComponent(window.location.origin + "/dashboard.html")}`;
    
    // For now, try direct callback (if session token is available via App Bridge)
    // If running inside Shopify admin, use App Bridge
    if (window.shopify?.config) {
      import("https://cdn.shopify.com/shopifycloud/app-bridge/client.js").then(async () => {
        try {
          const token = await window.shopify.idToken();
          handleConnect(cleanShop, token);
        } catch {
          window.open(installUrl, "_blank");
        }
      }).catch(() => window.open(installUrl, "_blank"));
    } else {
      // Standalone: try direct API call, backend will validate
      handleConnect(cleanShop, "standalone");
    }
  };

  const removeStore = (id) => {
    saveStores(stores.filter(s => s.id !== id));
    toast("Store disconnected");
  };

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <div><h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 2 }}>Connected Stores</h2><p style={{ fontSize: 12, color: "#6d7175" }}>Manage your Shopify store connections</p></div>
    </div>

    {/* Connection form */}
    {stores.length === 0 && !connecting && <Card title="Connect your Shopify store">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "#f6f6f7", borderRadius: 8, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, background: "#95bf47", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M15.34 3.27c-.08-.01-.15.03-.19.1l-1.43 2.69c-.53-.23-1.18-.36-1.93-.36-2.1 0-3.57 1.32-4.03 3.28-.02.07 0 .13.05.17l1.63 1.2c.07.05.16.04.21-.03.48-.66 1.22-1.04 2.14-1.04.64 0 1.15.2 1.48.57.25.28.4.65.43 1.07H11.5c-2.24 0-3.82 1.22-3.82 3.03 0 1.63 1.22 2.75 3.03 2.75.98 0 1.83-.35 2.48-.98l.12.72h2.1l-.72-4.85c-.08-.55-.08-.98-.08-1.26 0-2.35-1-4.28-3.27-4.76v-2.3z"/></svg>
            </div>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>Shopify OAuth Connection</div><div style={{ fontSize: 12, color: "#6d7175" }}>Secure one-click authorization</div></div>
          </div>
          <div className="form-g" style={{ marginBottom: 12 }}>
            <div className="form-l">Store URL</div>
            <input id="shop-url-input" className="form-i" placeholder="yourstore.myshopify.com" onKeyDown={e => e.key === "Enter" && startOAuth()} autoFocus />
          </div>
          <Btn primary onClick={startOAuth} style={{ width: "100%" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            Connect with Shopify
          </Btn>
        </div>

        {error && <div style={{ background: "#fed3d1", color: "#d72c0d", fontSize: 12, padding: "10px 14px", borderRadius: 8 }}>{error}</div>}

        <div style={{ fontSize: 12, color: "#8c9196", lineHeight: 1.6 }}>
          <strong>How it works:</strong> Click "Connect with Shopify" to securely authorize RefundOS. 
          You'll be redirected to Shopify to approve access. No tokens or passwords needed.
        </div>
      </div>
    </Card>}

    {connecting && <Card title="Connecting...">
      <div style={{ textAlign: "center", padding: 32, animation: "fadeIn .2s ease" }}>
        <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 12px" }} />
        <div style={{ fontSize: 13, fontWeight: 500 }}>Connecting to Shopify...</div>
        <div style={{ fontSize: 12, color: "#8c9196", marginTop: 4 }}>This may take a few seconds</div>
      </div>
    </Card>}

    {/* Connected stores */}
    {stores.map(s => <StoreCard key={s.id} store={s} onRemove={() => removeStore(s.id)} />)}

    {stores.length > 0 && <div style={{ marginTop: 12 }}>
      <Btn onClick={() => { const el = document.createElement("div"); el.innerHTML = '<input id="add-shop-input" placeholder="newstore.myshopify.com" />'; /* simple: just show form again */ saveStores([]); }}>
        + Connect another store
      </Btn>
    </div>}
  </div>;
}

function StoreCard({ store, onRemove }) {
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const toast = useT();

  const doSync = async (e) => {
    e.stopPropagation();
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await api.syncStore(store.id);
      setLastSync(new Date().toLocaleTimeString());
      setSyncResult({ ok: true, msg: `Synced ${res.synced || ""} items` });
      toast(`${store.name}: Sync complete`);
    } catch (err) {
      setSyncResult({ ok: false, msg: `Sync failed: ${err.message}` });
      toast(`${store.name}: Sync failed`);
    } finally {
      setSyncing(false);
    }
  };

  return <div className="card" style={{ marginBottom: 8 }}>
    <div onClick={() => setOpen(!open)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      <div style={{ width: 36, height: 36, background: "#f6f6f7", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 1 }}>{store.name}</div>
        <div style={{ fontSize: 12, color: "#8c9196", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.url}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Btn slim primary disabled={syncing} onClick={doSync}>
          {syncing ? <><span className="spinner" /> Syncing...</> : <><span style={{ display: "flex" }}>{Ic.refresh}</span> Sync now</>}
        </Btn>
        <Badge c="s">Connected</Badge>
      </div>
    </div>

    {open && <div style={{ padding: "0 16px 14px", borderTop: "1px solid #e1e3e5", paddingTop: 14, animation: "fadeIn .15s ease" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["Store ID", store.id], ["Connected", new Date(store.connected_at).toLocaleDateString()], ["Last Sync", lastSync || "Never"], ["Status", "Active"]].map(([l, v]) =>
          <div key={l} style={{ background: "#f6f6f7", borderRadius: 6, padding: "8px 10px" }}><div className="kpi-l">{l}</div><div style={{ fontSize: 12, fontWeight: 600 }}>{v}</div></div>
        )}
      </div>
      {syncResult && <div style={{ background: syncResult.ok ? "#e4f5ee" : "#fed3d1", color: syncResult.ok ? "#008060" : "#d72c0d", fontSize: 12, padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>{syncResult.msg}</div>}
      <div style={{ display: "flex", gap: 8 }}>
        <Btn slim primary disabled={syncing} onClick={doSync}>
          {syncing ? <><span className="spinner" /> Syncing...</> : "Run full sync"}
        </Btn>
        <Btn slim danger onClick={onRemove}>Disconnect store</Btn>
      </div>
    </div>}
  </div>;
}

/* ═══ ACCOUNT ═══ */
const TIMEZONES = [
  "America/New_York (UTC-5)", "America/Chicago (UTC-6)", "America/Denver (UTC-7)", "America/Los_Angeles (UTC-8)", "America/Anchorage (UTC-9)",
  "America/Toronto (UTC-5)", "America/Vancouver (UTC-8)", "America/Mexico_City (UTC-6)", "America/Sao_Paulo (UTC-3)", "America/Argentina/Buenos_Aires (UTC-3)",
  "Europe/London (UTC+0)", "Europe/Paris (UTC+1)", "Europe/Berlin (UTC+1)", "Europe/Madrid (UTC+1)", "Europe/Rome (UTC+1)", "Europe/Amsterdam (UTC+1)", "Europe/Stockholm (UTC+1)", "Europe/Moscow (UTC+3)",
  "Asia/Dubai (UTC+4)", "Asia/Kolkata (UTC+5:30)", "Asia/Bangkok (UTC+7)", "Asia/Singapore (UTC+8)", "Asia/Shanghai (UTC+8)", "Asia/Tokyo (UTC+9)",
  "Australia/Sydney (UTC+11)", "Australia/Melbourne (UTC+11)", "Australia/Perth (UTC+8)",
  "Pacific/Auckland (UTC+13)", "Africa/Lagos (UTC+1)", "Africa/Johannesburg (UTC+2)", "Africa/Cairo (UTC+2)",
];

function AccountPage() {
  const toast = useT();
  const u = getUser();
  const [name, setName] = useState(u.name || "");
  const [tz, setTz] = useState("America/New_York (UTC-5)");
  const [lang, setLang] = useState("English");
  const [notifStock, setNotifStock] = useState(true);
  const [notifReport, setNotifReport] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);

  return <div style={{ maxWidth: 600 }}>
    <Card title="Account Settings">
      <div className="form-g"><div className="form-l">Display Name</div><input className="form-i" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" /></div>
      <div className="form-g"><div className="form-l">Email</div><input className="form-i" value={u.email || ""} disabled style={{ background: "#f6f6f7", color: "#6d7175" }} /><div style={{ fontSize: 11, color: "#8c9196", marginTop: 4 }}>Managed by your login provider</div></div>
      <div className="form-g"><div className="form-l">Timezone</div><select className="form-i" value={tz} onChange={e => setTz(e.target.value)}>{TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
      <div className="form-g"><div className="form-l">Language</div><select className="form-i" value={lang} onChange={e => { setLang(e.target.value); toast(`Language set to ${e.target.value}`); }}>{["English", "Spanish", "French", "German", "Portuguese", "Japanese", "Chinese (Simplified)", "Chinese (Traditional)", "Arabic", "Hindi", "Italian", "Dutch", "Swedish", "Turkish", "Vietnamese", "Thai", "Indonesian", "Malay"].map(l => <option key={l}>{l}</option>)}</select></div>
      <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: 16, marginTop: 8 }}>
        <div className="form-l" style={{ marginBottom: 8 }}>Notifications</div>
        <div className="tgl-w" onClick={() => setNotifStock(!notifStock)}><div className={`tgl${notifStock ? " on" : ""}`} />Stock alerts via email</div>
        <div className="tgl-w" onClick={() => setNotifReport(!notifReport)}><div className={`tgl${notifReport ? " on" : ""}`} />Weekly operations report</div>
        <div className="tgl-w" onClick={() => setNotifMarketing(!notifMarketing)}><div className={`tgl${notifMarketing ? " on" : ""}`} />Product updates and tips</div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}><Btn primary onClick={() => toast("Account settings saved")}>Save changes</Btn></div>
    </Card>
  </div>;
}

function SettingsPage() {
  const toast = useT();
  const [s, setS] = useState({ safety: 10, lead: 7, moq: 20, max: 500, auto: true, alert: false, approve: true });
  const up = (k, v) => setS(p => ({ ...p, [k]: v }));
  return <div style={{ maxWidth: 560 }}><Card title="Reorder Configuration">
    {[["Safety Stock Threshold", "Trigger alert when inventory drops below this level", "safety"], ["Supplier Lead Time (days)", "Average number of days from order to delivery", "lead"], ["Minimum Order Quantity", "Smallest order your supplier accepts", "moq"], ["Maximum Auto-Order ($)", "Auto-reorder will not exceed this dollar amount", "max"]].map(([l, d, k]) => <div className="form-g" key={k}><div className="form-l">{l}</div><div className="form-h">{d}</div><input className="form-i" type="number" value={s[k]} onChange={e => up(k, +e.target.value)} style={{ width: 200 }} /></div>)}
    <div style={{ borderTop: "1px solid #e1e3e5", margin: "16px 0", paddingTop: 16 }}><div className="form-l" style={{ marginBottom: 8 }}>Automation Rules</div>
      <div className="tgl-w" onClick={() => up("auto", !s.auto)}><div className={`tgl${s.auto ? " on" : ""}`} />Enable automatic reordering</div>
      <div className="tgl-w" onClick={() => up("alert", !s.alert)}><div className={`tgl${s.alert ? " on" : ""}`} />Alert only (require manual approval)</div>
      <div className="tgl-w" onClick={() => up("approve", !s.approve)}><div className={`tgl${s.approve ? " on" : ""}`} />Execute order after manager approval</div>
    </div>
    <div style={{ display: "flex", gap: 8 }}><Btn primary onClick={() => toast("Settings saved successfully")}>Save changes</Btn><Btn onClick={() => { setS({ safety: 10, lead: 7, moq: 20, max: 500, auto: true, alert: false, approve: true }); toast("Reset to defaults"); }}>Reset defaults</Btn></div>
  </Card></div>;
}

function SupportPage() {
  const toast = useT(); const [msg, setMsg] = useState("");
  return <div style={{ maxWidth: 600 }}><Card title="Support">
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
      {[["Documentation", "Guides, tutorials, and API reference"], ["System Status", "Current uptime and service health"], ["Community Forum", "Connect with other RefundOS merchants"]].map(([t, d]) =>
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f6f6f7", borderRadius: 8, cursor: "pointer", transition: "all .15s" }} onMouseEnter={e => e.currentTarget.style.background = "#edeef0"} onMouseLeave={e => e.currentTarget.style.background = "#f6f6f7"}>
          <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{t}</div><div style={{ fontSize: 12, color: "#6d7175" }}>{d}</div></div>
          <span style={{ color: "#8c9196", fontSize: 18 }}>&#8250;</span>
        </div>
      )}
    </div>
    <div style={{ borderTop: "1px solid #e1e3e5", paddingTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Contact Support</div>
      <div style={{ fontSize: 12, color: "#6d7175", marginBottom: 12 }}>We typically respond within 24 hours.</div>
      <textarea value={msg} onChange={e => setMsg(e.target.value)} placeholder="Describe your issue or question..." rows={4} style={{ width: "100%", padding: "10px 14px", border: "1px solid #e1e3e5", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", marginBottom: 12 }} />
      <Btn primary onClick={() => { if (!msg.trim()) { toast("Please enter a message"); return; } toast("Message sent. We'll respond within 24 hours."); setMsg(""); }}>Send message</Btn>
    </div>
  </Card></div>;
}

/* ═══ NAV CONFIG ═══ */
const TITLES = { home: "Home", products: "Products", detail: "Product Detail", alerts: "Stock Alerts", inventory: "Inventory", analytics: "Analytics", store: "Store", settings: "Settings", account: "Account", support: "Support" };
const NAV = [
  { id: "home", icon: "home", label: "Home", sec: "" },
  { id: "products", icon: "box", label: "Products" },
  { id: "alerts", icon: "bell", label: "Stock Alerts", badge: true },
  { id: "inventory", icon: "layers", label: "Inventory", sec: "Operations" },
  { id: "analytics", icon: "chart", label: "Analytics" },
  { id: "store", icon: "store", label: "Store", sec: "Channels" },
  { id: "support", icon: "headphones", label: "Support", sec: "Help" },
  { id: "account", icon: "user", label: "Account", sec: "Settings" },
  { id: "settings", icon: "gear", label: "Settings" },
];

/* ═══ APP ═══ */
export default function App() {
  const [page, setPage] = useState("home");
  const [did, setDid] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [obPhase, setObPhase] = useState("none");
  const [tutStep, setTutStep] = useState(0);
  const [pageKey, setPageKey] = useState(0);
  const { data: alerts } = useApi(() => api.alerts());

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("onboarding") === "1") { setObPhase("survey"); history.replaceState({}, "", location.pathname); }
  }, []);

  const nav = (pg, d) => { setPage(pg); if (pg === "detail" && d) setDid(d); setSidebarOpen(false); setPageKey(k => k + 1); };
  const burger = sv(<><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>, 20);
  const close = sv(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, 18);

  if (obPhase === "survey") return <TP><Survey onDone={() => { setObPhase("tutorial"); setTutStep(0); }} /></TP>;

  return <TP><div style={{ display: "flex", minHeight: "100vh" }}>
    <div className={`mobile-overlay${sidebarOpen ? " show" : ""}`} onClick={() => setSidebarOpen(false)} />
    <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
      <div className="sb-head"><div className="sb-logo">R</div><span className="sb-brand">RefundOS</span><button className="sb-close" onClick={() => setSidebarOpen(false)}>{close}</button></div>
      <nav className="sb-nav">
        {NAV.map(item => { const active = page === item.id || (page === "detail" && item.id === "products"); return <div key={item.id} data-nav={item.id}>
          {item.sec !== undefined && <div className="sb-sec">{item.sec}</div>}
          <button onClick={() => nav(item.id)} className={`sb-item${active ? " on" : ""}`}><span style={{ display: "flex" }}>{Ic[item.icon]}</span>{item.label}{item.badge && alerts?.length > 0 && <span className="sb-badge">{alerts.length}</span>}</button>
        </div>; })}
      </nav>
      <div style={{ padding: "8px 12px" }}><button onClick={() => setShowLogout(true)} className="sb-item sb-logout"><span style={{ display: "flex" }}>{Ic.logout}</span>Log out</button></div>
      <div className="sb-foot"><div className="sb-store"><span className="sb-dot" /><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{getUser().email || "yourstore.myshopify.com"}</span></div></div>
    </aside>
    <div className="main">
      <div className="topbar"><button className="burger" onClick={() => setSidebarOpen(true)}>{burger}</button><span className="tb-title">{TITLES[page] || ""}</span><div className="tb-right"><Badge c="s">Connected</Badge></div></div>
      <div className="content page-enter" key={pageKey}>
        {page === "home" && <HomePage />}
        {page === "products" && <ProductsPage onView={id => nav("detail", id)} />}
        {page === "detail" && <DetailPage id={did} onBack={() => nav("products")} />}
        {page === "alerts" && <AlertsPage onView={id => nav("detail", id)} />}
        {page === "inventory" && <InventoryPage />}
        {page === "analytics" && <AnalyticsPage />}
        {page === "store" && <StorePage />}
        {page === "settings" && <SettingsPage />}
        {page === "account" && <AccountPage />}
        {page === "support" && <SupportPage />}
      </div>
    </div>
    {obPhase === "tutorial" && <Tutorial step={tutStep} onNext={() => setTutStep(s => s + 1)} onPrev={() => setTutStep(s => s - 1)} onSkip={() => setObPhase("none")} />}
    {showLogout && <LogoutFlow onCancel={() => setShowLogout(false)} onDone={() => { location.href = "/"; }} />}
  </div></TP>;
}
