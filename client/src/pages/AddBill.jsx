// src/pages/AddBill.jsx
import { useState, useMemo, useEffect } from "react";
import { FiZap, FiDroplet, FiEdit2, FiTrash2, FiCheck, FiX,
         FiTrendingUp, FiDollarSign, FiList, FiAlertCircle,
         FiFilter, FiChevronDown, FiWifi } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

const API_URL = "http://localhost:5000/api/bills";
const getToken = () => localStorage.getItem("authToken");

if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("ab-anim")) {
  const s = document.createElement("style");
  s.id = "ab-anim";
  s.textContent = `
    @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
    @keyframes popIn   { from{opacity:0;transform:scale(.94)}       to{opacity:1;transform:scale(1)}      }
    .ab-fu  { animation: fadeUp  .4s ease both }
    .ab-pop { animation: popIn   .3s ease both }
    .ab-row { animation: slideIn .3s ease both }
    .ab-card-hover:hover { transform:translateY(-2px); box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .ab-del:hover  { background:#fee2e2!important; color:#dc2626!important; }
    .ab-edit:hover { background:#eff6ff!important; color:#2563eb!important; }
    .ab-submit:hover:not(:disabled) { background:#1d4ed8!important; }
    .ab-filter-btn:hover { background:#f0f2f7!important; }
    .ab-tog:hover { opacity:.85; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const UTILITIES = ["Electricity", "Water", "Internet"];

const fmt = (n) => Number(n).toLocaleString();
const fmtMonth = (m) => {
  if (!m) return "—";
  const [y, mo] = m.split("-");
  return new Date(y, mo - 1).toLocaleString("default", { month:"long", year:"numeric" });
};

export default function AddBill() {
  const { darkMode } = useTheme();

  // ⭐ C is now INSIDE the component - reacts to darkMode
  const C = {
    page:    darkMode ? "#0f172a" : "#f3f4f8",
    card:    darkMode ? "#1e293b" : "#ffffff",
    hover:   darkMode ? "#334155" : "#f0f2f7",
    ink:     darkMode ? "#f1f5f9" : "#0f172a",
    body:    darkMode ? "#cbd5e1" : "#334155",
    muted:   darkMode ? "#94a3b8" : "#64748b",
    faint:   darkMode ? "#64748b" : "#94a3b8",
    border:  darkMode ? "#334155" : "#e2e8f0",
    borderB: darkMode ? "#475569" : "#cbd5e1",
    blue:    "#2563eb",
    blueD:   "#1d4ed8",
    blueL:   darkMode ? "rgba(37,99,235,0.15)"  : "#eff6ff",
    blueM:   darkMode ? "#1e3a8a"               : "#bfdbfe",
    teal:    "#0891b2",
    tealL:   darkMode ? "rgba(8,145,178,0.15)" : "#ecfeff",
    tealM:   darkMode ? "#164e63"               : "#a5f3fc",
    green:   "#059669",
    greenL:  darkMode ? "rgba(5,150,105,0.15)"  : "#ecfdf5",
    greenM:  darkMode ? "#064e3b"               : "#a7f3d0",
    amber:   "#d97706",
    amberL:  darkMode ? "rgba(217,119,6,0.15)"  : "#fffbeb",
    amberM:  darkMode ? "#78350f"               : "#fde68a",
    red:     "#dc2626",
    redL:    darkMode ? "rgba(220,38,38,0.15)"  : "#fef2f2",
    redM:    darkMode ? "#7f1d1d"               : "#fecaca",
    violet:  "#7c3aed",
    violetL: darkMode ? "rgba(124,58,237,0.15)" : "#f5f3ff",
    violetM: darkMode ? "#4c1d95"               : "#ddd6fe",
    indigo:  "#4f46e5",
    indigoL: darkMode ? "rgba(79,70,229,0.15)"  : "#eef2ff",
    indigoM: darkMode ? "#312e81"               : "#c7d2fe",
    s1: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2: "0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3: "0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  };

  // Utility helpers (now use C from inside)
  const typeColor = (t) => t === "Electricity" ? C.blue  : t === "Water" ? C.teal  : C.indigo;
  const typeBg    = (t) => t === "Electricity" ? C.blueL : t === "Water" ? C.tealL : C.indigoL;
  const typeBdr   = (t) => t === "Electricity" ? C.blueM : t === "Water" ? C.tealM : C.indigoM;
  const typeIcon  = (t) => t === "Electricity" ? <FiZap size={13}/> : t === "Water" ? <FiDroplet size={13}/> : <FiWifi size={13}/>;
  const unitLabel = (t) => t === "Electricity" ? "kWh" : t === "Water" ? "Units" : null;

  const SectionLabel = ({ children }) => (
    <p style={{ fontSize:"0.63rem", fontWeight:800, letterSpacing:"0.15em",
      textTransform:"uppercase", color:C.faint, margin:"0 0 12px", fontFamily:F }}>
      {children}
    </p>
  );

  const Card = ({ children, style={}, className="" }) => (
    <div className={`ab-card-hover ${className}`}
      style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
        boxShadow:C.s1, overflow:"hidden",
        transition:"transform .22s ease, box-shadow .22s ease", ...style }}>
      {children}
    </div>
  );

  const InsightTile = ({ icon, label, value, accent, bg, bdr, sub }) => (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px",
      background:bg, border:`1px solid ${bdr}`, borderRadius:12 }}>
      <div style={{ width:38, height:38, borderRadius:9, background:C.card,
        border:`1px solid ${bdr}`, display:"flex", alignItems:"center",
        justifyContent:"center", color:accent, flexShrink:0 }}>{icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:accent, margin:0,
          textTransform:"uppercase", letterSpacing:"0.09em" }}>{label}</p>
        <p style={{ fontSize:"1rem", fontWeight:800, color:C.ink, margin:"2px 0 0", letterSpacing:"-0.02em" }}>{value}</p>
        {sub && <p style={{ fontSize:"0.7rem", color:C.muted, margin:"1px 0 0" }}>{sub}</p>}
      </div>
    </div>
  );

  const [utilityType,  setUtilityType]  = useState("Electricity");
  const [selMonth,     setSelMonth]     = useState("");
  const [selYear,      setSelYear]      = useState("2025");
  const [unitsUsed,    setUnitsUsed]    = useState("");
  const [billAmount,   setBillAmount]   = useState("");
  const [successMsg,   setSuccessMsg]   = useState("");
  const [dupWarning,   setDupWarning]   = useState("");
  const [loading,      setLoading]      = useState(false);

  const [bills,        setBills]        = useState([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState("");

  const [editId,       setEditId]       = useState(null);
  const [editUnits,    setEditUnits]    = useState("");
  const [editAmount,   setEditAmount]   = useState("");

  const [filterType,   setFilterType]   = useState("All");
  const [sortDir,      setSortDir]      = useState("desc");

  const billingMonthKey = selYear && selMonth ? `${selYear}-${selMonth}` : "";
  const isInternet = utilityType === "Internet";
  const costPerUnit = !isInternet && unitsUsed && billAmount && Number(unitsUsed) > 0
    ? (Number(billAmount) / Number(unitsUsed)).toFixed(2) : null;

  useEffect(() => { fetchBills(); }, []);

  const fetchBills = async () => {
    setFetchLoading(true); setFetchError("");
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load bills");
      setBills(data.bills);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetchLoading(false);
    }
  };

  const filteredBills = useMemo(() => {
    let list = filterType === "All" ? bills : bills.filter(b => b.utilityType === filterType);
    return [...list].sort((a, b) =>
      sortDir === "desc"
        ? b.billingMonth.localeCompare(a.billingMonth)
        : a.billingMonth.localeCompare(b.billingMonth)
    );
  }, [bills, filterType, sortDir]);

  const insights = useMemo(() => {
    if (!bills.length) return null;
    const elecBills    = bills.filter(b => b.utilityType === "Electricity");
    const waterBills   = bills.filter(b => b.utilityType === "Water");
    const internetBills= bills.filter(b => b.utilityType === "Internet");
    const totalSpent   = bills.reduce((s, b) => s + Number(b.billAmount), 0);
    const highestBill  = [...bills].sort((a,b) => Number(b.billAmount) - Number(a.billAmount))[0];
    const avgElec      = elecBills.length
      ? (elecBills.reduce((s,b)=>s+Number(b.billAmount),0)/elecBills.length).toFixed(0) : null;
    const avgWater     = waterBills.length
      ? (waterBills.reduce((s,b)=>s+Number(b.billAmount),0)/waterBills.length).toFixed(0) : null;
    const avgInternet  = internetBills.length
      ? (internetBills.reduce((s,b)=>s+Number(b.billAmount),0)/internetBills.length).toFixed(0) : null;
    const byMonth = {};
    bills.forEach(b => {
      byMonth[b.billingMonth] = (byMonth[b.billingMonth] || 0) + Number(b.billAmount);
    });
    return { totalSpent, highestBill, avgElec, avgWater, avgInternet, byMonth,
      elecCount: elecBills.length, waterCount: waterBills.length, internetCount: internetBills.length };
  }, [bills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDupWarning(""); setSuccessMsg("");
    if (!billingMonthKey) { setDupWarning("Please select both a month and a year."); return; }

    setLoading(true);
    try {
      const payload = {
        utilityType,
        billingMonth: billingMonthKey,
        billAmount: Number(billAmount),
        unitsUsed: isInternet ? 0 : Number(unitsUsed),
      };
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add bill");

      setBills(prev => [data.bill, ...prev]);
      setUnitsUsed(""); setBillAmount(""); setSelMonth(""); setSelYear("2025");
      setSuccessMsg(`${utilityType} bill for ${fmtMonth(billingMonthKey)} added!`);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setDupWarning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setBills(prev => prev.filter(b => b._id !== id));
    } catch (err) { alert(err.message); }
  };

  const startEdit = (bill) => {
    setEditId(bill._id);
    setEditUnits(String(bill.unitsUsed));
    setEditAmount(String(bill.billAmount));
  };
  const saveEdit = async (id) => {
    try {
      const bill = bills.find(b => b._id === id);
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          unitsUsed: bill?.utilityType === "Internet" ? 0 : Number(editUnits),
          billAmount: Number(editAmount),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update");
      setBills(prev => prev.map(b => b._id === id ? data.bill : b));
      setEditId(null);
    } catch (err) { alert(err.message); }
  };
  const cancelEdit = () => setEditId(null);

  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {/* HEADER */}
      <div className="ab-fu" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink, margin:0, letterSpacing:"-0.03em" }}>Billing</h1>
        <p style={{ fontSize:"0.85rem", color:C.muted, margin:"6px 0 0" }}>
          Add and manage your monthly utility bills
        </p>
      </div>

      {/* TOP GRID */}
      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr", gap:24, marginBottom:28, alignItems:"start" }}>

        {/* ADD BILL FORM */}
        <Card className="ab-fu" style={{ animationDelay:".06s" }}>
          <div style={{ padding:"22px 24px 18px", borderBottom:`1px solid ${C.border}`, marginBottom:20 }}>
            <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:0 }}>Add New Bill</h2>
            <p style={{ fontSize:"0.72rem", color:C.muted, margin:"3px 0 0" }}>
              Enter your monthly utility bill details
            </p>
          </div>

          <div style={{ padding:"0 24px 24px" }}>
            {successMsg && (
              <div className="ab-pop" style={{ display:"flex", alignItems:"center", gap:8,
                padding:"10px 14px", background:C.greenL, border:`1px solid ${C.greenM}`,
                borderRadius:10, marginBottom:16 }}>
                <FiCheck size={14} color={C.green}/>
                <span style={{ fontSize:"0.8rem", color:C.green, fontWeight:600 }}>{successMsg}</span>
              </div>
            )}
            {dupWarning && (
              <div className="ab-pop" style={{ display:"flex", alignItems:"center", gap:8,
                padding:"10px 14px", background:C.amberL, border:`1px solid ${C.amberM}`,
                borderRadius:10, marginBottom:16 }}>
                <FiAlertCircle size={14} color={C.amber}/>
                <span style={{ fontSize:"0.8rem", color:C.amber, fontWeight:600 }}>{dupWarning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:20 }}>
                <p style={{ fontSize:"0.72rem", fontWeight:700, color:C.muted,
                  textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 8px" }}>Utility Type</p>
                <div style={{ display:"flex", gap:8 }}>
                  {UTILITIES.map(t => {
                    const active = utilityType === t;
                    return (
                      <button key={t} type="button" className="ab-tog"
                        onClick={() => { setUtilityType(t); setUnitsUsed(""); setDupWarning(""); }}
                        style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
                          gap:7, padding:"10px 14px", borderRadius:10,
                          border:`1.5px solid ${active ? typeColor(t) : C.border}`,
                          background: active ? typeBg(t) : C.hover,
                          color: active ? typeColor(t) : C.muted,
                          fontFamily:F, fontSize:"0.85rem", fontWeight:700,
                          cursor:"pointer", transition:"all .18s" }}>
                        {t === "Electricity" && <FiZap size={15}/>}
                        {t === "Water"       && <FiDroplet size={15}/>}
                        {t === "Internet"    && <FiWifi size={15}/>}
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                  color:C.body, marginBottom:6 }}>Billing Month &amp; Year</label>
                <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:10 }}>
                  <div style={{ position:"relative" }}>
                    <select value={selMonth} required
                      onChange={e => { setSelMonth(e.target.value); setDupWarning(""); }}
                      style={{ width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
                        border:`1.5px solid ${C.border}`, background:C.hover,
                        color: selMonth ? C.ink : C.faint, fontFamily:F,
                        fontSize:"0.875rem", fontWeight:500, outline:"none",
                        appearance:"none", cursor:"pointer", boxSizing:"border-box" }}
                      onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background="#fff"; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; }}
                      onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background=C.hover; e.target.style.boxShadow="none"; }}>
                      <option value="" disabled>Select month</option>
                      {["January","February","March","April","May","June",
                        "July","August","September","October","November","December"
                      ].map((m,i) => (
                        <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>
                      ))}
                    </select>
                    <FiChevronDown size={15} style={{ position:"absolute", right:12,
                      top:"50%", transform:"translateY(-50%)", color:C.faint, pointerEvents:"none" }}/>
                  </div>
                  <div style={{ position:"relative" }}>
                    <select value={selYear} required
                      onChange={e => { setSelYear(e.target.value); setDupWarning(""); }}
                      style={{ width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
                        border:`1.5px solid ${C.border}`, background:C.hover,
                        color: selYear ? C.ink : C.faint, fontFamily:F,
                        fontSize:"0.875rem", fontWeight:500, outline:"none",
                        appearance:"none", cursor:"pointer", boxSizing:"border-box" }}
                      onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background="#fff"; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; }}
                      onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background=C.hover; e.target.style.boxShadow="none"; }}>
                      <option value="" disabled>Year</option>
                      {[2022,2023,2024,2025,2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <FiChevronDown size={15} style={{ position:"absolute", right:12,
                      top:"50%", transform:"translateY(-50%)", color:C.faint, pointerEvents:"none" }}/>
                  </div>
                </div>
              </div>

              {!isInternet && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                    color:C.body, marginBottom:6 }}>Units Used ({unitLabel(utilityType)})</label>
                  <input type="number" min="0" step="0.01" value={unitsUsed} required
                    placeholder={`Enter ${unitLabel(utilityType)}`}
                    onChange={e => setUnitsUsed(e.target.value)}
                    style={{ width:"100%", padding:"11px 14px", borderRadius:10,
                      border:`1.5px solid ${C.border}`, background:C.hover,
                      color:C.ink, fontFamily:F, fontSize:"0.875rem",
                      outline:"none", boxSizing:"border-box" }}
                    onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background="#fff"; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; }}
                    onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background=C.hover; e.target.style.boxShadow="none"; }}/>
                </div>
              )}

              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                  color:C.body, marginBottom:6 }}>Bill Amount (Rs.)</label>
                <input type="number" min="0" step="0.01" value={billAmount} required
                  placeholder="Enter amount in Rs."
                  onChange={e => setBillAmount(e.target.value)}
                  style={{ width:"100%", padding:"11px 14px", borderRadius:10,
                    border:`1.5px solid ${C.border}`, background:C.hover,
                    color:C.ink, fontFamily:F, fontSize:"0.875rem",
                    outline:"none", boxSizing:"border-box" }}
                  onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.background="#fff"; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; }}
                  onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background=C.hover; e.target.style.boxShadow="none"; }}/>
              </div>

              {isInternet && billAmount && (
                <div className="ab-pop" style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"10px 14px",
                  background:C.indigoL, border:`1px solid ${C.indigoM}`,
                  borderRadius:10, marginBottom:16 }}>
                  <span style={{ fontSize:"0.78rem", color:C.indigo, fontWeight:600 }}>Flat-rate monthly plan</span>
                  <span style={{ fontSize:"0.9rem", fontWeight:800, color:C.indigo }}>Rs. {billAmount}</span>
                </div>
              )}

              {costPerUnit && (
                <div className="ab-pop" style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"10px 14px",
                  background:C.blueL, border:`1px solid ${C.blueM}`,
                  borderRadius:10, marginBottom:16 }}>
                  <span style={{ fontSize:"0.78rem", color:C.blue, fontWeight:600 }}>Cost per {unitLabel(utilityType)}</span>
                  <span style={{ fontSize:"0.9rem", fontWeight:800, color:C.blue }}>Rs. {costPerUnit}</span>
                </div>
              )}

              <button type="submit" className="ab-submit"
                disabled={loading || !selMonth || !selYear}
                style={{ width:"100%", padding:"12px", borderRadius:10, border:"none", fontFamily:F,
                  fontSize:"0.875rem", fontWeight:700, color:"#fff",
                  background: (loading||!selMonth||!selYear) ? C.faint : typeColor(utilityType),
                  cursor: (loading||!selMonth||!selYear) ? "not-allowed" : "pointer",
                  transition:"background .18s", display:"flex", alignItems:"center",
                  justifyContent:"center", gap:7 }}>
                <FiCheck size={15}/> {loading ? "Saving…" : "Add Bill"}
              </button>
            </form>
          </div>
        </Card>

        {/* INSIGHTS */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card className="ab-fu" style={{ animationDelay:".10s", padding:"18px 20px" }}>
            <SectionLabel>Quick Insights</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <InsightTile icon={<FiDollarSign size={17}/>} label="Total Spent"
                value={insights ? `Rs. ${fmt(insights.totalSpent)}` : "Rs. 0"}
                accent={C.violet} bg={C.violetL} bdr={C.violetM}
                sub={`Across ${bills.length} bill${bills.length !== 1?"s":""}`}/>
              <InsightTile icon={<FiZap size={17}/>} label="Avg. Electricity Bill"
                value={insights?.avgElec ? `Rs. ${fmt(insights.avgElec)}` : "—"}
                accent={C.blue} bg={C.blueL} bdr={C.blueM}
                sub={insights?.elecCount ? `${insights.elecCount} bill${insights.elecCount!==1?"s":""}` : "No data"}/>
              <InsightTile icon={<FiDroplet size={17}/>} label="Avg. Water Bill"
                value={insights?.avgWater ? `Rs. ${fmt(insights.avgWater)}` : "—"}
                accent={C.teal} bg={C.tealL} bdr={C.tealM}
                sub={insights?.waterCount ? `${insights.waterCount} bill${insights.waterCount!==1?"s":""}` : "No data"}/>
              <InsightTile icon={<FiWifi size={17}/>} label="Avg. Internet Bill"
                value={insights?.avgInternet ? `Rs. ${fmt(insights.avgInternet)}` : "—"}
                accent={C.indigo} bg={C.indigoL} bdr={C.indigoM}
                sub={insights?.internetCount ? `${insights.internetCount} bill${insights.internetCount!==1?"s":""}` : "No data"}/>
              {insights?.highestBill && (
                <InsightTile icon={<FiTrendingUp size={17}/>} label="Highest Bill"
                  value={`Rs. ${fmt(insights.highestBill.billAmount)}`}
                  accent={C.amber} bg={C.amberL} bdr={C.amberM}
                  sub={`${insights.highestBill.utilityType} · ${fmtMonth(insights.highestBill.billingMonth)}`}/>
              )}
            </div>
          </Card>

          {insights && Object.keys(insights.byMonth).length > 0 && (
            <Card className="ab-fu" style={{ animationDelay:".14s", padding:"18px 20px" }}>
              <SectionLabel>Monthly Combined Totals</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {Object.entries(insights.byMonth)
                  .sort((a,b) => b[0].localeCompare(a[0]))
                  .slice(0, 5)
                  .map(([month, total]) => (
                    <div key={month} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"8px 12px", background:C.hover, borderRadius:9 }}>
                      <span style={{ fontSize:"0.8rem", fontWeight:500, color:C.body }}>{fmtMonth(month)}</span>
                      <span style={{ fontSize:"0.875rem", fontWeight:800, color:C.ink }}>Rs. {fmt(total)}</span>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* BILLING HISTORY */}
      <Card className="ab-fu" style={{ animationDelay:".18s" }}>
        <div style={{ padding:"20px 24px 16px", borderBottom:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
          <div>
            <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:0 }}>Billing History</h2>
            <p style={{ fontSize:"0.72rem", color:C.muted, margin:"3px 0 0" }}>
              {bills.length} bill{bills.length !== 1 ? "s" : ""} recorded
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", background:C.hover, border:`1px solid ${C.border}`,
              borderRadius:9, padding:3, gap:2 }}>
              {["All", ...UTILITIES].map(t => (
                <button key={t} className="ab-filter-btn" onClick={() => setFilterType(t)}
                  style={{ display:"flex", alignItems:"center", gap:5,
                    padding:"5px 11px", borderRadius:7, border:"none",
                    background: filterType===t ? C.card : "transparent",
                    color: filterType===t
                      ? (t==="Electricity"?C.blue : t==="Water"?C.teal : t==="Internet"?C.indigo : C.ink)
                      : C.muted,
                    fontFamily:F, fontSize:"0.75rem", fontWeight:600,
                    cursor:"pointer", transition:"all .15s",
                    boxShadow: filterType===t ? C.s1 : "none" }}>
                  {t==="Electricity" && <FiZap size={11}/>}
                  {t==="Water"       && <FiDroplet size={11}/>}
                  {t==="Internet"    && <FiWifi size={11}/>}
                  {t==="All"         && <FiList size={11}/>}
                  {t}
                </button>
              ))}
            </div>
            <button className="ab-filter-btn"
              onClick={() => setSortDir(d => d==="desc"?"asc":"desc")}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px",
                borderRadius:9, border:`1px solid ${C.border}`, background:"transparent",
                color:C.muted, fontFamily:F, fontSize:"0.75rem", fontWeight:600,
                cursor:"pointer", transition:"all .15s" }}>
              <FiFilter size={12}/>
              {sortDir === "desc" ? "Newest first" : "Oldest first"}
              <FiChevronDown size={11} style={{ transform: sortDir==="asc"?"rotate(180deg)":"none", transition:"transform .2s" }}/>
            </button>
          </div>
        </div>

        {fetchLoading ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <p style={{ fontSize:"0.875rem", color:C.muted, margin:0 }}>Loading bills…</p>
          </div>
        ) : fetchError ? (
          <div style={{ padding:"24px", textAlign:"center" }}>
            <p style={{ fontSize:"0.875rem", color:C.red, margin:0 }}>{fetchError}</p>
          </div>
        ) : filteredBills.length === 0 ? (
          <div style={{ padding:"48px 24px", textAlign:"center" }}>
            <div style={{ width:48, height:48, borderRadius:12, background:C.hover,
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 12px", color:C.faint }}>
              <FiList size={22}/>
            </div>
            <p style={{ fontSize:"0.875rem", color:C.muted, margin:0, fontWeight:500 }}>
              {bills.length === 0 ? "No bills added yet. Add your first bill above." : "No bills match this filter."}
            </p>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F }}>
              <thead>
                <tr style={{ background:C.hover }}>
                  {["Month","Utility","Units","Bill Amount","Cost / Unit","Actions"].map((h,i) => (
                    <th key={i} style={{ padding:"11px 20px", fontSize:"0.67rem", fontWeight:800,
                      color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em",
                      textAlign: i>=2?"right":"left", borderBottom:`1px solid ${C.border}`,
                      whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill, idx) => {
                  const isEditing   = editId === bill._id;
                  const isBillNet   = bill.utilityType === "Internet";
                  const cpu = !isBillNet && Number(bill.unitsUsed) > 0
                    ? (Number(bill.billAmount)/Number(bill.unitsUsed)).toFixed(2) : "—";
                  const editCpu = !isBillNet && editUnits && editAmount && Number(editUnits)>0
                    ? (Number(editAmount)/Number(editUnits)).toFixed(2) : "—";

                  return (
                    <tr key={bill._id} className="ab-row"
                      style={{ borderBottom:`1px solid ${C.border}`,
                        background: isEditing ? typeBg(bill.utilityType) : "transparent",
                        animationDelay:`${idx*0.04}s`, transition:"background .2s" }}>

                      <td style={{ padding:"13px 20px" }}>
                        <span style={{ fontSize:"0.85rem", fontWeight:600, color:C.ink }}>
                          {fmtMonth(bill.billingMonth)}
                        </span>
                      </td>

                      <td style={{ padding:"13px 20px" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5,
                          padding:"3px 10px", borderRadius:20,
                          background:typeBg(bill.utilityType), border:`1px solid ${typeBdr(bill.utilityType)}`,
                          color:typeColor(bill.utilityType), fontSize:"0.72rem", fontWeight:700 }}>
                          {typeIcon(bill.utilityType)} {bill.utilityType}
                        </span>
                      </td>

                      <td style={{ padding:"13px 20px", textAlign:"right" }}>
                        {isBillNet ? (
                          <span style={{ fontSize:"0.8rem", color:C.faint, fontStyle:"italic" }}>Flat-rate</span>
                        ) : isEditing ? (
                          <input type="number" value={editUnits} min="0" step="0.01"
                            onChange={e => setEditUnits(e.target.value)}
                            style={{ width:90, padding:"6px 10px", borderRadius:8,
                              border:`1.5px solid ${typeColor(bill.utilityType)}`, fontFamily:F,
                              fontSize:"0.85rem", textAlign:"right",
                              background:"#fff", color:C.ink, outline:"none" }}/>
                        ) : (
                          <span style={{ fontSize:"0.85rem", color:C.body }}>
                            {fmt(bill.unitsUsed)} {bill.utilityType==="Electricity"?"kWh":"Units"}
                          </span>
                        )}
                      </td>

                      <td style={{ padding:"13px 20px", textAlign:"right" }}>
                        {isEditing ? (
                          <input type="number" value={editAmount} min="0" step="0.01"
                            onChange={e => setEditAmount(e.target.value)}
                            style={{ width:110, padding:"6px 10px", borderRadius:8,
                              border:`1.5px solid ${typeColor(bill.utilityType)}`, fontFamily:F,
                              fontSize:"0.85rem", textAlign:"right",
                              background:"#fff", color:C.ink, outline:"none" }}/>
                        ) : (
                          <span style={{ fontSize:"0.875rem", fontWeight:700, color:C.ink }}>
                            Rs. {fmt(bill.billAmount)}
                          </span>
                        )}
                      </td>

                      <td style={{ padding:"13px 20px", textAlign:"right" }}>
                        <span style={{ fontSize:"0.8rem", color:C.muted }}>
                          {isBillNet ? "—" : `Rs. ${isEditing ? editCpu : cpu}`}
                        </span>
                      </td>

                      <td style={{ padding:"13px 20px", textAlign:"right" }}>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                          {isEditing ? (
                            <>
                              <button className="ab-edit" onClick={() => saveEdit(bill._id)}
                                style={{ width:32, height:32, borderRadius:8,
                                  border:`1px solid ${C.greenM}`, background:C.greenL,
                                  color:C.green, cursor:"pointer", display:"flex",
                                  alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                <FiCheck size={14}/>
                              </button>
                              <button className="ab-del" onClick={cancelEdit}
                                style={{ width:32, height:32, borderRadius:8,
                                  border:`1px solid ${C.border}`, background:C.hover,
                                  color:C.muted, cursor:"pointer", display:"flex",
                                  alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                <FiX size={14}/>
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="ab-edit" onClick={() => startEdit(bill)}
                                style={{ width:32, height:32, borderRadius:8,
                                  border:`1px solid ${C.border}`, background:C.hover,
                                  color:C.muted, cursor:"pointer", display:"flex",
                                  alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                <FiEdit2 size={13}/>
                              </button>
                              <button className="ab-del" onClick={() => handleDelete(bill._id)}
                                style={{ width:32, height:32, borderRadius:8,
                                  border:`1px solid ${C.border}`, background:C.hover,
                                  color:C.muted, cursor:"pointer", display:"flex",
                                  alignItems:"center", justifyContent:"center", transition:"all .15s" }}>
                                <FiTrash2 size={13}/>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}