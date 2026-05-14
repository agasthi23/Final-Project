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

// ─── Sub-components defined OUTSIDE AddBill so React doesn't remount them ───

const SectionLabel = ({ children, C }) => (
  <p style={{ fontSize:"0.63rem", fontWeight:800, letterSpacing:"0.15em",
    textTransform:"uppercase", color:C.faint, margin:"0 0 12px", fontFamily:F }}>
    {children}
  </p>
);

const Card = ({ children, style={}, className="", C }) => (
  <div className={`ab-card-hover ${className}`}
    style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
      boxShadow:C.s1, overflow:"hidden",
      transition:"transform .22s ease, box-shadow .22s ease", ...style }}>
    {children}
  </div>
);

const InsightTile = ({ icon, label, value, accent, bg, bdr, sub, C }) => (
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

// ─────────────────────────────────────────────────────────────────────────────

export default function AddBill() {
  const { darkMode } = useTheme();

  // ✅ C is memoized — only rebuilds when darkMode changes
  const C = useMemo(() => ({
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
  }), [darkMode]);

  // Utility helpers
  const typeColor = (t) => t === "Electricity" ? C.blue  : t === "Water" ? C.teal  : C.indigo;
  const typeBg    = (t) => t === "Electricity" ? C.blueL : t === "Water" ? C.tealL : C.indigoL;
  const typeBdr   = (t) => t === "Electricity" ? C.blueM : t === "Water" ? C.tealM : C.indigoM;
  const typeIcon  = (t) => t === "Electricity" ? <FiZap size={13}/> : t === "Water" ? <FiDroplet size={13}/> : <FiWifi size={13}/>;
  const unitLabel = (t) => t === "Electricity" ? "kWh" : t === "Water" ? "Units" : null;

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

  // Import tabs
  const [activeImportTab, setActiveImportTab] = useState('manual');
  const [pasteText,       setPasteText]       = useState('');
  const [extractedData,   setExtractedData]   = useState(null);

  // File upload states
  const [dragActive,      setDragActive]      = useState(false);
  const [fileUploading,   setFileUploading]   = useState(false);
  const [fileExtractedData, setFileExtractedData] = useState(null);
  const [fileError,       setFileError]       = useState(null);

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

  // ─── Paste image from clipboard support ────────────────────────────────────────
  useEffect(() => {
    const handlePaste = (e) => {
      // Only handle paste when File Upload tab is active
      if (activeImportTab !== 'file') return;
      
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            console.log("📋 Image pasted from clipboard:", file.name);
            processFileUpload(file);
            // Show a quick visual feedback
            setFileError(null);
            break;
          }
        }
      }
    };
    
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [activeImportTab]);

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
    const elecBills     = bills.filter(b => b.utilityType === "Electricity");
    const waterBills    = bills.filter(b => b.utilityType === "Water");
    const internetBills = bills.filter(b => b.utilityType === "Internet");
    const totalSpent    = bills.reduce((s, b) => s + Number(b.billAmount), 0);
    const highestBill   = [...bills].sort((a,b) => Number(b.billAmount) - Number(a.billAmount))[0];
    const avgElec       = elecBills.length
      ? (elecBills.reduce((s,b)=>s+Number(b.billAmount),0)/elecBills.length).toFixed(0) : null;
    const avgWater      = waterBills.length
      ? (waterBills.reduce((s,b)=>s+Number(b.billAmount),0)/waterBills.length).toFixed(0) : null;
    const avgInternet   = internetBills.length
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

  // Unified parser - Handles BOTH SMS and Portal formats
  const parseBillText = (text) => {
    console.log("📝 Parsing bill text...");
    
    // ========== DETECT ELECTRICITY (CEB) ==========
    if (text.includes('CEB e-Bill') || text.includes('kWh') || text.includes('Import')) {
      console.log("✅ Detected: Electricity bill");
      
      // ----- EXTRACT MONTH -----
      let month = "04";
      let year = "2026";
      let monthDisplay = "April 2026";
      
      // Try portal format: "Billing Month | 2026-APRIL"
      let monthMatch = text.match(/Billing Month\s*\|\s*(\d{4})-(\w+)/i);
      
      // Try SMS format: Look for date in "2026-04-15" format
      if (!monthMatch) {
        const dateMatch = text.match(/(\d{4})-(\d{2})-\d{2}/);
        if (dateMatch) {
          year = dateMatch[1];
          month = dateMatch[2];
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          monthDisplay = `${monthNames[parseInt(month) - 1]} ${year}`;
        }
      } else {
        year = monthMatch[1];
        const monthName = monthMatch[2];
        const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
        const monthIndex = monthNames.findIndex(m => m === monthName);
        if (monthIndex !== -1) {
          month = String(monthIndex + 1).padStart(2, '0');
          monthDisplay = `${monthNames[monthIndex].charAt(0) + monthNames[monthIndex].slice(1).toLowerCase()} ${year}`;
        }
      }
      
      // ----- EXTRACT UNITS -----
      let units = 0;
      // Portal format: "Import : 123 kWh" or "Import 123 kWh"
      let unitsMatch = text.match(/Import\s*:?\s*(\d+)\s*kWh/i);
      // SMS format: "Reading: 32671 - 32548 = 123 Units"
      if (!unitsMatch) {
        unitsMatch = text.match(/=\s*(\d+)\s*Units?/i);
      }
      if (unitsMatch) {
        units = parseInt(unitsMatch[1]);
      }
      
      // ----- EXTRACT AMOUNT -----
      let amount = 0;
      // Portal format: "Monthly Bill : 3,927.18 LKR"
      // SMS format: "Monthly Bill: Rs. 3,927.18"
      let amountMatch = text.match(/Monthly Bill\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
      if (!amountMatch) {
        amountMatch = text.match(/Monthly Bill\s*:?\s*([\d,]+\.?\d*)\s*LKR/i);
      }
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
      
      if (amount > 0) {
        return {
          utility: 'Electricity',
          month: `${year}-${month}`,
          monthDisplay: monthDisplay,
          year: year,
          monthNum: month,
          units: units,
          amount: amount
        };
      }
    }
    
    // ========== DETECT WATER (NWSDB) ==========
    if (text.includes('NWSDB') || text.includes('Water Board') || text.includes('National Water Supply')) {
      console.log("✅ Detected: Water bill");
      
      // ----- EXTRACT MONTH -----
      let month = "04";
      let year = "2026";
      let monthDisplay = "April 2026";
      
      // Look for period: "Period : 21-03-2026 to 20-04-2026"
      const periodMatch = text.match(/Period\s*:?\s*\d{2}-\d{2}-(\d{4})\s*to\s*\d{2}-\d{2}-(\d{4})/i);
      if (periodMatch) {
        year = periodMatch[2]; // End year is current billing year
        // Extract month from end date (20-04-2026 -> April)
        const endDateMatch = text.match(/to\s*\d{2}-(\d{2})-(\d{4})/i);
        if (endDateMatch) {
          month = endDateMatch[1];
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          monthDisplay = `${monthNames[parseInt(month) - 1]} ${year}`;
        }
      }
      
      // Alternative: "BILLING MONTH : 2026 APRIL"
      if (!periodMatch) {
        const monthMatch = text.match(/BILLING MONTH\s*:?\s*(\d{4})\s*(\w+)/i);
        if (monthMatch) {
          year = monthMatch[1];
          const monthName = monthMatch[2];
          const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
          const monthIndex = monthNames.findIndex(m => m === monthName.toUpperCase());
          if (monthIndex !== -1) {
            month = String(monthIndex + 1).padStart(2, '0');
            monthDisplay = `${monthNames[monthIndex].charAt(0) + monthNames[monthIndex].slice(1).toLowerCase()} ${year}`;
          }
        }
      }
      
      // ----- EXTRACT UNITS -----
      let units = 0;
      const unitsMatch = text.match(/Consumption\s*:?\s*\d+\s*-\s*\d+\s*=\s*(\d+)/i);
      if (unitsMatch) {
        units = parseInt(unitsMatch[1]);
      }
      
      // ----- EXTRACT AMOUNT -----
      let amount = 0;
      const amountMatch = text.match(/Monthly Bill\s*:?\s*Rs?\.?\s*([\d,]+\.?\d*)/i);
      if (amountMatch) {
        amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      }
      
      if (amount > 0) {
        return {
          utility: 'Water',
          month: `${year}-${month}`,
          monthDisplay: monthDisplay,
          year: year,
          monthNum: month,
          units: units,
          amount: amount
        };
      }
    }
    
    console.log("❌ Could not detect utility type");
    return null;
  };

  // Handle paste import
  const handlePasteImport = () => {
    console.log("Raw paste text:", pasteText);
    
    const parsed = parseBillText(pasteText);
    console.log("Parsed result:", parsed);
    
    if (parsed) {
      setUtilityType(parsed.utility);
      setUnitsUsed(parsed.units.toString());
      setBillAmount(parsed.amount.toString());
      
      // Set month and year
      if (parsed.year && parsed.monthNum) {
        setSelYear(parsed.year);
        setSelMonth(parsed.monthNum);
        console.log(`Setting month to: ${parsed.monthNum}/${parsed.year}`);
      }
      
      setExtractedData(parsed);
      setActiveImportTab('manual');
      
      // Scroll to form
      setTimeout(() => {
        document.querySelector('.ab-submit')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      
      alert(`✅ Extracted ${parsed.utility} bill for ${parsed.monthDisplay}\nUnits: ${parsed.units}\nAmount: Rs. ${parsed.amount.toLocaleString()}`);
    } else {
      alert('❌ Could not parse the text. Please check the format or use manual entry.\n\nMake sure you copied the full text including "Billing Month" and "Monthly Bill".');
    }
  };

  // Handle file drop
  const handleFileDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    await processFileUpload(file);
  };

  // Handle file select
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    await processFileUpload(file);
  };

  // Process file upload to backend
  const processFileUpload = async (file) => {
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File too large. Max 5MB.");
      return;
    }
    
    setFileUploading(true);
    setFileError(null);
    setFileExtractedData(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/api/upload/extract-bill', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.parsed) {
        setFileExtractedData(data.parsed);
      } else {
        setFileError(data.error || "Could not extract bill data. Try copy-paste method.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setFileError("Server error. Please try again.");
    } finally {
      setFileUploading(false);
    }
  };

  // Shared input style helpers (stable references via useMemo)
  const inputBase = useMemo(() => ({
    width:"100%", padding:"11px 14px", borderRadius:10,
    border:`1.5px solid ${C.border}`, background:C.hover,
    color:C.ink, fontFamily:F, fontSize:"0.875rem",
    outline:"none", boxSizing:"border-box", transition:"border-color .15s, background .15s",
  }), [C]);

  const selectBase = useMemo(() => ({
    width:"100%", padding:"11px 36px 11px 14px", borderRadius:10,
    border:`1.5px solid ${C.border}`, background:C.hover,
    fontFamily:F, fontSize:"0.875rem", fontWeight:500,
    outline:"none", appearance:"none", cursor:"pointer",
    boxSizing:"border-box", transition:"border-color .15s, background .15s",
  }), [C]);

  const onFocus = (e) => { e.target.style.borderColor = C.blue; e.target.style.background = C.card; };
  const onBlur  = (e) => { e.target.style.borderColor = C.border; e.target.style.background = C.hover; };

  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink,
      padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {/* HEADER */}
      <div className="ab-fu" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink, margin:0, letterSpacing:"-0.03em" }}>Billing</h1>
        <p style={{ fontSize:"0.85rem", color:C.muted, margin:"6px 0 0" }}>
          Add and manage your monthly utility bills
        </p>
      </div>

      {/* IMPORT TABS */}
      <div className="ab-fu" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
          <button
            onClick={() => setActiveImportTab('manual')}
            style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeImportTab === 'manual' ? `2px solid ${C.blue}` : 'none', color: activeImportTab === 'manual' ? C.blue : C.muted, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ✍️ Manual Entry
          </button>
          <button
            onClick={() => setActiveImportTab('paste')}
            style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeImportTab === 'paste' ? `2px solid ${C.blue}` : 'none', color: activeImportTab === 'paste' ? C.blue : C.muted, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            📋 Quick Import (Copy-Paste)
          </button>
          <button
            onClick={() => setActiveImportTab('file')}
            style={{ padding: '10px 20px', background: 'transparent', border: 'none', borderBottom: activeImportTab === 'file' ? `2px solid ${C.blue}` : 'none', color: activeImportTab === 'file' ? C.blue : C.muted, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
          >
            📄 Upload Bill
          </button>
        </div>

        {/* Manual Entry Tab - Your existing form */}
        {activeImportTab === 'manual' && (
          <div></div>
        )}

        {/* Quick Import Tab - Copy-Paste */}
        {activeImportTab === 'paste' && (
          <Card C={C} style={{ animationDelay: ".06s" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.ink, margin: 0 }}>📋 Quick Import from e-Bill Portal</h2>
              <p style={{ fontSize: "0.72rem", color: C.muted, margin: "3px 0 0" }}>
                Copy the text from your CEB or NWSDB e-Bill portal and paste below
              </p>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.body, marginBottom: 6 }}>
                  📄 Paste Portal Text Here
                </label>
                <textarea
                  rows={10}
                  placeholder={`Example from CEB portal:\nAccount Number : 2101256800\nBilling Month : 2026-APRIL\nImport : 123 kWh\nMonthly Bill : 3,927.18 LKR\n\nExample from NWSDB portal:\nAccount Number : 10/45/281/085/17\nBILLING MONTH : 2026 APRIL\nConsumption : 24\nMonthly Bill : 2,985.40 LKR`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.border}`,
                    background: C.hover,
                    color: C.ink,
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    lineHeight: 1.5,
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <button
                  onClick={handlePasteImport}
                  disabled={!pasteText.trim()}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    background: !pasteText.trim() ? C.faint : C.blue,
                    color: "#fff",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    cursor: !pasteText.trim() ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  <FiCheck size={16} /> Extract & Fill Form
                </button>
                <button
                  onClick={() => setPasteText("")}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    background: "transparent",
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Clear
                </button>
              </div>

              {extractedData && (
                <div style={{
                  background: C.greenL,
                  border: `1px solid ${C.greenM}`,
                  borderRadius: 10,
                  padding: "14px",
                  marginBottom: 16
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FiCheck size={16} color={C.green} />
                    <span style={{ fontWeight: 700, color: C.green }}>Extracted Successfully!</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>Utility:</span>
                    <span style={{ fontWeight: 600 }}>{extractedData.utility}</span>
                    <span style={{ color: C.muted }}>Month:</span>
                    <span style={{ fontWeight: 600 }}>{extractedData.monthDisplay || extractedData.month}</span>
                    <span style={{ color: C.muted }}>Units:</span>
                    <span style={{ fontWeight: 600 }}>{extractedData.units} {extractedData.utility === 'Electricity' ? 'kWh' : 'Units'}</span>
                    <span style={{ color: C.muted }}>Amount:</span>
                    <span style={{ fontWeight: 600 }}>Rs. {extractedData.amount?.toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: C.muted, marginTop: 8, marginBottom: 0 }}>
                    ✅ Form has been auto-filled. Click "Add Bill" to save.
                  </p>
                </div>
              )}

              <div style={{
                background: C.blueL,
                border: `1px solid ${C.blueM}`,
                borderRadius: 10,
                padding: "12px 14px",
                marginTop: 8
              }}>
                <p style={{ fontSize: "0.7rem", color: C.blue, margin: 0, fontWeight: 500 }}>
                  💡 <strong>How it works:</strong> Open the link from your SMS, view the e-Bill portal, 
                  copy all the text, paste here, and click "Extract & Fill Form". The system will 
                  automatically fill the form for you!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* File Upload Tab */}
        {activeImportTab === 'file' && (
          <Card C={C} style={{ animationDelay: ".06s" }}>
            <div style={{ padding: "22px 24px 18px", borderBottom: `1px solid ${C.border}`, marginBottom: 20 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.ink, margin: 0 }}>📄 Upload Bill (PDF or Image)</h2>
              <p style={{ fontSize: "0.72rem", color: C.muted, margin: "3px 0 0" }}>
                Upload your e-Bill PDF or screenshot - we'll extract the data automatically!
              </p>
            </div>

            <div style={{ padding: "0 24px 24px" }}>
              {/* Upload Area */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById('fileInput').click()}
                style={{
                  border: `2px dashed ${dragActive ? C.blue : C.border}`,
                  borderRadius: 12,
                  padding: "40px 20px",
                  textAlign: "center",
                  background: dragActive ? C.blueL : C.hover,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  marginBottom: 16
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: 8 }}>📁</div>
                <p style={{ fontSize: "0.85rem", color: C.ink, margin: 0 }}>
                  {fileUploading ? "⏳ Processing..." : "Drag & drop or click to upload"}
                </p>
                <p style={{ fontSize: "0.7rem", color: C.muted, marginTop: 4 }}>
                  Supports PDF, PNG, JPG (Max 5MB)
                </p>
              </div>

              <input
                id="fileInput"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {/* Progress indicator */}
              {fileUploading && (
                <div style={{
                  background: C.blueL,
                  borderRadius: 10,
                  padding: "12px",
                  marginBottom: 16,
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "0.8rem", color: C.blue }}>
                    🔄 Extracting bill data... (may take a few seconds)
                  </div>
                </div>
              )}

              {/* Success - Show extracted data */}
              {fileExtractedData && (
                <div style={{
                  background: C.greenL,
                  border: `1px solid ${C.greenM}`,
                  borderRadius: 10,
                  padding: "14px",
                  marginBottom: 16
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <FiCheck size={16} color={C.green} />
                    <span style={{ fontWeight: 700, color: C.green }}>✅ Extracted Successfully!</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>Utility:</span>
                    <span style={{ fontWeight: 600 }}>{fileExtractedData.utility}</span>
                    <span style={{ color: C.muted }}>Month:</span>
                    <span style={{ fontWeight: 600 }}>{fileExtractedData.monthDisplay}</span>
                    <span style={{ color: C.muted }}>Units:</span>
                    <span style={{ fontWeight: 600 }}>{fileExtractedData.units}</span>
                    <span style={{ color: C.muted }}>Amount:</span>
                    <span style={{ fontWeight: 600 }}>Rs. {fileExtractedData.amount?.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      setUtilityType(fileExtractedData.utility);
                      setUnitsUsed(fileExtractedData.units.toString());
                      setBillAmount(fileExtractedData.amount.toString());
                      setSelYear(fileExtractedData.year);
                      setSelMonth(fileExtractedData.monthNum);
                      setActiveImportTab('manual');
                      setFileExtractedData(null);
                    }}
                    style={{
                      marginTop: 12,
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: C.blue,
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      width: "100%"
                    }}
                  >
                    📝 Use This Data & Fill Form →
                  </button>
                </div>
              )}

              {/* Error message */}
              {fileError && (
                <div style={{
                  background: C.redL,
                  border: `1px solid ${C.redM}`,
                  borderRadius: 10,
                  padding: "12px",
                  marginBottom: 16,
                  color: C.red,
                  fontSize: "0.8rem"
                }}>
                  ❌ {fileError}
                </div>
              )}

              {/* Instructions */}
              <div style={{
                background: C.blueL,
                border: `1px solid ${C.blueM}`,
                borderRadius: 10,
                padding: "12px 14px"
              }}>
                <p style={{ fontSize: "0.7rem", color: C.blue, margin: 0, fontWeight: 500 }}>
                  💡 <strong>How it works:</strong><br/>
                  • <strong>PDF:</strong> Download e-Bill from portal → Upload here → Auto-extracted<br/>
                  • <strong>Screenshot:</strong> Take photo of bill → Upload → OCR extracts text<br/>
                  • Then review and click "Use This Data" → Form auto-fills!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* TOP GRID */}
      {activeImportTab === 'manual' && (
      <div style={{ display:"grid", gridTemplateColumns:"1.8fr 1fr", gap:24, marginBottom:28, alignItems:"start" }}>

        {/* ADD BILL FORM */}
        <Card C={C} className="ab-fu" style={{ animationDelay:".06s" }}>
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
              {/* Utility Type */}
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

              {/* Billing Month & Year */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                  color:C.body, marginBottom:6 }}>Billing Month &amp; Year</label>
                <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:10 }}>
                  <div style={{ position:"relative" }}>
                    <select value={selMonth} required
                      onChange={e => { setSelMonth(e.target.value); setDupWarning(""); }}
                      style={{ ...selectBase, color: selMonth ? C.ink : C.faint }}
                      onFocus={onFocus} onBlur={onBlur}>
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
                      style={{ ...selectBase, color: selYear ? C.ink : C.faint }}
                      onFocus={onFocus} onBlur={onBlur}>
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

              {/* Units Used */}
              {!isInternet && (
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                    color:C.body, marginBottom:6 }}>Units Used ({unitLabel(utilityType)})</label>
                  <input type="number" min="0" step="0.01" value={unitsUsed} required
                    placeholder={`Enter ${unitLabel(utilityType)}`}
                    onChange={e => setUnitsUsed(e.target.value)}
                    style={inputBase}
                    onFocus={onFocus} onBlur={onBlur}/>
                </div>
              )}

              {/* Bill Amount */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:"0.78rem", fontWeight:600,
                  color:C.body, marginBottom:6 }}>Bill Amount (Rs.)</label>
                <input type="number" min="0" step="0.01" value={billAmount} required
                  placeholder="Enter amount in Rs."
                  onChange={e => setBillAmount(e.target.value)}
                  style={inputBase}
                  onFocus={onFocus} onBlur={onBlur}/>
              </div>

              {/* Internet flat-rate preview */}
              {isInternet && billAmount && (
                <div className="ab-pop" style={{ display:"flex", alignItems:"center",
                  justifyContent:"space-between", padding:"10px 14px",
                  background:C.indigoL, border:`1px solid ${C.indigoM}`,
                  borderRadius:10, marginBottom:16 }}>
                  <span style={{ fontSize:"0.78rem", color:C.indigo, fontWeight:600 }}>Flat-rate monthly plan</span>
                  <span style={{ fontSize:"0.9rem", fontWeight:800, color:C.indigo }}>Rs. {billAmount}</span>
                </div>
              )}

              {/* Cost per unit preview */}
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
          <Card C={C} className="ab-fu" style={{ animationDelay:".10s", padding:"18px 20px" }}>
            <SectionLabel C={C}>Quick Insights</SectionLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <InsightTile C={C} icon={<FiDollarSign size={17}/>} label="Total Spent"
                value={insights ? `Rs. ${fmt(insights.totalSpent)}` : "Rs. 0"}
                accent={C.violet} bg={C.violetL} bdr={C.violetM}
                sub={`Across ${bills.length} bill${bills.length !== 1?"s":""}`}/>
              <InsightTile C={C} icon={<FiZap size={17}/>} label="Avg. Electricity Bill"
                value={insights?.avgElec ? `Rs. ${fmt(insights.avgElec)}` : "—"}
                accent={C.blue} bg={C.blueL} bdr={C.blueM}
                sub={insights?.elecCount ? `${insights.elecCount} bill${insights.elecCount!==1?"s":""}` : "No data"}/>
              <InsightTile C={C} icon={<FiDroplet size={17}/>} label="Avg. Water Bill"
                value={insights?.avgWater ? `Rs. ${fmt(insights.avgWater)}` : "—"}
                accent={C.teal} bg={C.tealL} bdr={C.tealM}
                sub={insights?.waterCount ? `${insights.waterCount} bill${insights.waterCount!==1?"s":""}` : "No data"}/>
              <InsightTile C={C} icon={<FiWifi size={17}/>} label="Avg. Internet Bill"
                value={insights?.avgInternet ? `Rs. ${fmt(insights.avgInternet)}` : "—"}
                accent={C.indigo} bg={C.indigoL} bdr={C.indigoM}
                sub={insights?.internetCount ? `${insights.internetCount} bill${insights.internetCount!==1?"s":""}` : "No data"}/>
              {insights?.highestBill && (
                <InsightTile C={C} icon={<FiTrendingUp size={17}/>} label="Highest Bill"
                  value={`Rs. ${fmt(insights.highestBill.billAmount)}`}
                  accent={C.amber} bg={C.amberL} bdr={C.amberM}
                  sub={`${insights.highestBill.utilityType} · ${fmtMonth(insights.highestBill.billingMonth)}`}/>
              )}
            </div>
          </Card>

          {insights && Object.keys(insights.byMonth).length > 0 && (
            <Card C={C} className="ab-fu" style={{ animationDelay:".14s", padding:"18px 20px" }}>
              <SectionLabel C={C}>Monthly Combined Totals</SectionLabel>
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
      )}

      {/* BILLING HISTORY */}
      <Card C={C} className="ab-fu" style={{ animationDelay:".18s" }}>
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
                  const isEditing = editId === bill._id;
                  const isBillNet = bill.utilityType === "Internet";
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
                              background:C.card, color:C.ink, outline:"none" }}/>
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
                              background:C.card, color:C.ink, outline:"none" }}/>
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