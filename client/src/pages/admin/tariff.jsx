// src/pages/admin/TariffManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FiZap, FiDroplet, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle, FiAlertTriangle, FiClock, FiInfo, FiCopy } from "react-icons/fi";
import { tariffAPI } from "../../services/api";

if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("tar-anim")) {
  const s = document.createElement("style");
  s.id = "tar-anim";
  s.textContent = `
    @keyframes tarFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateX(0)} }
    .t-fu1{animation:tarFadeUp .4s .05s ease both}
    .t-fu2{animation:tarFadeUp .4s .10s ease both}
    .t-fu3{animation:tarFadeUp .4s .15s ease both}
    .t-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .t-input:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(191,219,254,.45)!important; outline:none; background:#fff!important; }
    .t-btn-save:hover { background:#1d4ed8!important; transform:translateY(-1px)!important; }
    .t-btn-danger:hover { background:#b91c1c!important; }
    .t-btn-ghost:hover { background:#f0f2f7!important; }
    .t-btn-add:hover { background:#eff6ff!important; }
    .t-tier-row:hover { background:#f8fafc!important; }
    .t-hist-row:hover { background:#f8fafc!important; }
    @keyframes spin { to { transform: rotate(360deg) } }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const C = {
  page:"#f3f4f8", card:"#fff", hover:"#f0f2f7",
  ink:"#0f172a", body:"#334155", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0",
  blue:"#2563eb", blueL:"#eff6ff", blueM:"#bfdbfe",
  teal:"#0891b2", tealL:"#ecfeff", tealM:"#a5f3fc",
  green:"#059669", greenL:"#ecfdf5", greenM:"#a7f3d0",
  amber:"#d97706", amberL:"#fffbeb", amberM:"#fde68a",
  red:"#dc2626",   redL:"#fef2f2",   redM:"#fecaca",
  violet:"#7c3aed",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10)",
};

// ── Unwrap helpers matching backend response shape ──
const unwrapTariffData = (res) => {
  const raw = res?.data;
  if (raw?.tariff) return raw.tariff;
  if (raw?.data) return raw.data;
  if (raw?.utilityType) return raw;
  return null;
};

const unwrapHistoryData = (res) => {
  const raw = res?.data;
  if (Array.isArray(raw?.tariffs)) return raw.tariffs;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw)) return raw;
  return [];
};

const formatDateForDisplay = (date) => {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch { return "—"; }
};

const Btn = ({ variant = "primary", onClick, children, style = {}, disabled = false }) => {
  const variants = {
    primary: { bg: C.blue, color: "#fff", border: C.blue, cls: "t-btn-save" },
    danger:  { bg: C.red, color: "#fff", border: C.red, cls: "t-btn-danger" },
    ghost:   { bg: "transparent", color: C.muted, border: C.border, cls: "t-btn-ghost" },
    add:     { bg: C.card, color: C.blue, border: C.blueM, cls: "t-btn-add" },
  };
  const v = variants[variant];
  return (
    <button className={v.cls} onClick={onClick} disabled={disabled}
      style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 9,
        border: `1px solid ${v.border}`, background: v.bg, color: v.color, fontFamily: F, fontSize: "0.82rem",
        fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition: "all .15s", ...style }}>
      {children}
    </button>
  );
};

export default function TariffManagement() {
  const [activeTab, setActiveTab] = useState("electricity");
  
  // Electricity state
  const [elecTiers, setElecTiers] = useState([]);
  const [elecFixed, setElecFixed] = useState("0");
  const [editingElecTier, setEditingElecTier] = useState(null);
  const [editElecValues, setEditElecValues] = useState({});
  const [activeElecTariff, setActiveElecTariff] = useState(null);
  
  // Water state (for NEW tariff creation - starts empty)
  const [waterTiers, setWaterTiers] = useState([]);
  const [waterFixed, setWaterFixed] = useState("");
  const [editingWaterTier, setEditingWaterTier] = useState(null);
  const [editWaterValues, setEditWaterValues] = useState({});
  const [activeWaterTariff, setActiveWaterTariff] = useState(null);
  
  // Common state
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [toast, setToast] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  const fetchTariffs = useCallback(async () => {
    setLoading(true);
    try {
      const [elecRes, waterRes, histRes] = await Promise.allSettled([
        tariffAPI.getActive({ params: { type: "electricity" } }),
        tariffAPI.getActive({ params: { type: "water" } }),
        tariffAPI.getHistory(),
      ]);

      if (elecRes.status === "fulfilled" && elecRes.value?.data) {
        const t = unwrapTariffData(elecRes.value);
        if (t && t.tiers && t.tiers.length) {
          setActiveElecTariff(t);
          // ✅ Form stays empty - user must click "Copy Current" or "Add Tier" to create new tariff
        }
      }
      
      if (waterRes.status === "fulfilled" && waterRes.value?.data) {
        const t = unwrapTariffData(waterRes.value);
        if (t && t.tiers && t.tiers.length) {
          setActiveWaterTariff(t);
          // DON'T auto-fill waterTiers - keep it empty for new tariff creation
          // setWaterFixed is left empty intentionally
        }
      }
      
      if (histRes.status === "fulfilled" && histRes.value?.data) {
        const hist = unwrapHistoryData(histRes.value);
        setHistory(hist.sort((a, b) => new Date(b.effectiveFrom) - new Date(a.effectiveFrom)));
      }
    } catch (err) {
      showToast("Failed to load tariffs", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTariffs(); }, [fetchTariffs]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyCurrentTariff = () => {
    if (activeWaterTariff) {
      setWaterFixed(String(activeWaterTariff.fixedCharge || ""));
      setWaterTiers(activeWaterTariff.tiers.map((tier, idx) => ({
        id: idx + 1,
        upTo: tier.upTo === null ? null : tier.upTo,
        ratePerUnit: Number(tier.ratePerUnit) || 0,
      })));
      showToast("Current tariff copied! You can now modify it before publishing.", "success");
    }
  };

  const clearForm = () => {
    setWaterTiers([]);
    setWaterFixed("");
    setEditingWaterTier(null);
    setEditWaterValues({});
    showToast("Form cleared. Start creating a new tariff.", "success");
  };

  // Electricity tier handlers
  const addElecTier = () => {
    const newId = Math.max(...elecTiers.map(t => t.id), 0) + 1;
    setElecTiers(prev => [...prev, { id: newId, upTo: null, ratePerUnit: 0 }]);
    setEditingElecTier(newId);
    setEditElecValues({ upTo: "", ratePerUnit: "" });
  };

  const saveElecTier = (id) => {
    const rate = parseFloat(editElecValues.ratePerUnit);
    if (isNaN(rate) || rate <= 0) { showToast("Rate must be a positive number.", "error"); return; }
    const upTo = editElecValues.upTo === "" || editElecValues.upTo === "∞" ? null : parseFloat(editElecValues.upTo);
    setElecTiers(prev => prev.map(t => t.id === id ? { ...t, upTo, ratePerUnit: rate } : t));
    setEditingElecTier(null);
    showToast("Tier updated.");
  };

  const deleteElecTier = (id) => {
    if (elecTiers.length <= 1) { showToast("At least one tier is required.", "error"); return; }
    setElecTiers(prev => prev.filter(t => t.id !== id));
  };

  // Water tier handlers
  const addWaterTier = () => {
    const newId = Math.max(...waterTiers.map(t => t.id), 0) + 1;
    setWaterTiers(prev => [...prev, { id: newId, upTo: null, ratePerUnit: 0 }]);
    setEditingWaterTier(newId);
    setEditWaterValues({ upTo: "", ratePerUnit: "" });
  };

  const saveWaterTier = (id) => {
    const rate = parseFloat(editWaterValues.ratePerUnit);
    if (isNaN(rate) || rate <= 0) { showToast("Rate must be a positive number.", "error"); return; }
    const upTo = editWaterValues.upTo === "" || editWaterValues.upTo === "∞" ? null : parseFloat(editWaterValues.upTo);
    setWaterTiers(prev => prev.map(t => t.id === id ? { ...t, upTo, ratePerUnit: rate } : t));
    setEditingWaterTier(null);
    showToast("Tier updated.");
  };

  const deleteWaterTier = (id) => {
    if (waterTiers.length <= 1) { showToast("At least one tier is required.", "error"); return; }
    setWaterTiers(prev => prev.filter(t => t.id !== id));
  };

  const validatePublish = () => {
    const e = {};
    if (!effectiveFrom.trim()) e.effectiveFrom = "Effective date is required.";
    if (activeTab === "water") {
      if (waterTiers.length === 0) e.waterTiers = "At least one tier is required.";
      if (!waterFixed || parseFloat(waterFixed) < 0) e.waterFixed = "Valid fixed charge is required.";
    }
    if (activeTab === "electricity") {
      if (elecTiers.length === 0) e.elecTiers = "At least one tier is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = () => { if (validatePublish()) setShowConfirm(true); };

  const confirmPublish = async () => {
    setShowConfirm(false);
    setPublishing(true);
    try {
      const payload = activeTab === "electricity"
        ? {
            utilityType: "electricity",
            tiers: elecTiers.map(({ upTo, ratePerUnit }) => ({ upTo, ratePerUnit })),
            fixedCharge: parseFloat(elecFixed) || 0,
            effectiveFrom: `${effectiveFrom}-01`,
          }
        : {
            utilityType: "water",
            tiers: waterTiers.map(({ upTo, ratePerUnit }) => ({ upTo, ratePerUnit })),
            fixedCharge: parseFloat(waterFixed) || 0,
            effectiveFrom: `${effectiveFrom}-01`,
          };
      await tariffAPI.create(payload);
      showToast("Tariff published and activated successfully!");
      setEffectiveFrom("");
      if (activeTab === "water") {
        setWaterTiers([]);
        setWaterFixed("");
      }
      await fetchTariffs();
    } catch (error) {
      showToast(error?.response?.data?.message || "Failed to publish tariff.", "error");
    } finally {
      setPublishing(false);
    }
  };

  const inputStyle = (err) => ({
    width: "100%", padding: "9px 12px", border: `1.5px solid ${err ? C.red : C.border}`,
    borderRadius: 9, background: C.hover, fontFamily: F, fontSize: "0.875rem",
    color: C.ink, transition: "all .15s", boxSizing: "border-box",
    boxShadow: err ? `0 0 0 3px ${C.redM}55` : "none",
  });

  const calculatePreview = (tiers, fixed, units = 20) => {
    let remaining = units;
    let total = fixed;
    let prevLimit = 0;
    for (const tier of tiers) {
      const tierLimit = tier.upTo === null ? Infinity : tier.upTo;
      const tierUnits = Math.min(remaining, tierLimit - prevLimit);
      if (tierUnits > 0) {
        total += tierUnits * (tier.ratePerUnit || 0);
        remaining -= tierUnits;
      }
      prevLimit = tierLimit;
      if (remaining <= 0) break;
    }
    return total;
  };

  if (loading) return (
    <div style={{ padding: "28px 32px", fontFamily: F }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted, fontSize: "0.875rem" }}>
        <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
        Fetching tariff data...
      </div>
    </div>
  );

  return (
    <div style={{ padding: "28px 32px 64px", fontFamily: F }}>
      {toast && (
        <div style={{ position: "fixed", top: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
          background: toast.type === "error" ? C.red : C.green, color: "#fff", padding: "12px 18px", borderRadius: 12,
          boxShadow: C.s3, fontFamily: F, fontSize: "0.875rem", fontWeight: 500 }}>
          {toast.type === "error" ? <FiAlertTriangle size={15}/> : <FiCheckCircle size={15}/>}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.7)", display: "flex", padding: 0, marginLeft: 4 }}><FiX size={14}/></button>
        </div>
      )}

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,.45)", backdropFilter: "blur(3px)" }}>
          <div style={{ background: C.card, borderRadius: 18, padding: "28px 32px", maxWidth: 420, width: "90%", boxShadow: C.s3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.amberL, border: `1px solid ${C.amberM}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.amber }}><FiAlertTriangle size={22}/></div>
              <div><h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Publish New Tariff?</h3><p style={{ fontSize: "0.78rem", color: C.muted, margin: 0 }}>This will affect all future bill calculations.</p></div>
            </div>
            <div style={{ background: C.amberL, border: `1px solid ${C.amberM}`, borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
              <p style={{ fontSize: "0.8rem", color: C.body, margin: 0, lineHeight: 1.6 }}>Effective from <strong>{formatDateForDisplay(`${effectiveFrom}-01`)}</strong>. All new bills entered after this date will use the updated rates.</p>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={confirmPublish} disabled={publishing}><FiCheckCircle size={13}/> {publishing ? "Publishing…" : "Yes, Publish"}</Btn>
            </div>
          </div>
        </div>
      )}

      <div className="t-fu1" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.ink, margin: "0 0 5px", letterSpacing: "-0.03em" }}>Tariff Management</h1>
        <p style={{ fontSize: "0.85rem", color: C.muted, margin: 0 }}>Manage electricity and water tariff rates. Changes apply to future bills only.</p>
      </div>

      <div className="t-fu1" style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", borderRadius: 12, background: C.blueL, border: `1px solid ${C.blueM}`, marginBottom: 24 }}>
        <FiInfo size={16} color={C.blue} style={{ flexShrink: 0, marginTop: 2 }}/>
        <p style={{ fontSize: "0.82rem", color: C.body, margin: 0, lineHeight: 1.6 }}>
            Tariff changes only affect <strong>future bills</strong> (non-destructive). 
          The <strong>colored box above</strong> shows the current active tariff. 
          Use the <strong>form below</strong> to create a new tariff — click "Copy Current" to start from existing rates, 
          or build from scratch. Then choose an effective month and click "Publish Tariff".
        </p>
      </div>

      <div className="t-fu2" style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, gap: 3, marginBottom: 20, width: "fit-content" }}>
        {[
          { key: "electricity", icon: <FiZap size={15}/>, label: "Electricity", activeColor: C.amber, activeBg: C.amberL, activeBdr: C.amberM },
          { key: "water", icon: <FiDroplet size={15}/>, label: "Water", activeColor: C.teal, activeBg: C.tealL, activeBdr: C.tealM },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 18px", borderRadius: 9,
              border: `1px solid ${activeTab === tab.key ? tab.activeBdr : "transparent"}`,
              background: activeTab === tab.key ? tab.activeBg : "transparent",
              color: activeTab === tab.key ? tab.activeColor : C.muted, fontFamily: F, fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", transition: "all .15s" }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="t-fu3" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20, alignItems: "start" }}>
        {/* Main Content Area */}
        <div>
          {activeTab === "electricity" ? (
            <div className="t-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.s1 }}>
              
              {/* Current Active Electricity Tariff - READ ONLY */}
              <div style={{ padding: "20px 22px", background: C.amberL, borderBottom: `1px solid ${C.amberM}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: C.amber }}>🟡 Current Active Electricity Tariff</h3>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>Effective since: {formatDateForDisplay(activeElecTariff?.effectiveFrom)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.7rem", color: C.muted }}>Fixed Charge</span>
                    <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.ink }}>Rs. {activeElecTariff?.fixedCharge?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
                
                {/* Tiers displayed in a clean grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
                  {activeElecTariff?.tiers?.map((tier, idx) => {
                    const prevUpTo = idx === 0 ? 0 : activeElecTariff.tiers[idx - 1].upTo;
                    return (
                      <div key={idx} style={{ background: C.card, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: "0.75rem", color: C.muted }}>{prevUpTo + 1}–{tier.upTo === null ? "∞" : tier.upTo} units</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.amber }}>Rs. {tier.ratePerUnit.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 12, textAlign: "right" }}>
                  Total: {activeElecTariff?.tiers?.length || 0} tiers
                </p>
              </div>

              {/* Create NEW Electricity Tariff - STARTS EMPTY */}
              <div style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.ink }}>⚡ Create New Electricity Tariff</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button 
                      onClick={() => {
                        if (activeElecTariff) {
                          setElecFixed(String(activeElecTariff.fixedCharge || ""));
                          setElecTiers(activeElecTariff.tiers.map((tier, idx) => ({
                            id: idx + 1,
                            upTo: tier.upTo === null ? null : tier.upTo,
                            ratePerUnit: Number(tier.ratePerUnit) || 0,
                          })));
                          showToast("Current tariff copied! You can now modify it before publishing.", "success");
                        }
                      }} 
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: "0.7rem", cursor: "pointer" }}>
                      <FiCopy size={12}/> Copy Current
                    </button>
                    <button 
                      onClick={() => {
                        setElecTiers([]);
                        setElecFixed("");
                        setEditingElecTier(null);
                        setEditElecValues({});
                        showToast("Form cleared. Start creating a new tariff.", "success");
                      }} 
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: "0.7rem", cursor: "pointer" }}>
                      <FiX size={12}/> Clear
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, marginBottom: 20 }}>Fill in the details below to publish a new tariff. The current active tariff will be automatically archived.</p>
                
                {/* Fixed Charge */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                    Fixed Charge — Rs.
                  </label>
                  <input 
                    className="t-input" 
                    value={elecFixed} 
                    onChange={e => setElecFixed(e.target.value)} 
                    placeholder="e.g., 80" 
                    style={{ ...inputStyle(), maxWidth: 200 }}
                  />
                  <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 4 }}>Fixed charge applied per billing period</p>
                </div>

                {/* Electricity Tiers Management - Starts Empty */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Consumption Tiers (Rate per Unit)</label>
                    <button onClick={addElecTier} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.amberM}`, background: C.amberL, color: C.amber, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                      <FiPlus size={12}/> Add Tier
                    </button>
                  </div>
                  
                  {elecTiers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", background: C.hover, borderRadius: 12, border: `1px dashed ${C.border}` }}>
                      <p style={{ fontSize: "0.8rem", color: C.muted }}>No tiers added yet. Click "Add Tier" to start creating your new tariff.</p>
                      <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 8 }}>You can also click "Copy Current" to load the existing tariff and modify it.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: C.hover }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Tier</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Up to (units)</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Rate per Unit (Rs.)</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {elecTiers.map((tier, idx) => {
                            const prevMax = idx === 0 ? 0 : (elecTiers[idx - 1].upTo || 0);
                            return (
                              <tr key={tier.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: C.muted, fontWeight: 600 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, background: C.amberL, color: C.amber, fontSize: "0.7rem", fontWeight: 800 }}>{idx + 1}</span>
                                </td>
                                <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: C.body }}>
                                  {editingElecTier === tier.id ? (
                                    <input className="t-input" value={editElecValues.upTo} onChange={e => setEditElecValues(p => ({ ...p, upTo: e.target.value }))} placeholder="e.g., 30, 60, or blank for ∞" style={{ ...inputStyle(), maxWidth: 100 }}/>
                                  ) : (
                                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{tier.upTo === null ? `${prevMax + 1} – ∞` : `${prevMax + 1} – ${tier.upTo}`}</span>
                                  )}
                                </td>
                                <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                                  {editingElecTier === tier.id ? (
                                    <input className="t-input" value={editElecValues.ratePerUnit} onChange={e => setEditElecValues(p => ({ ...p, ratePerUnit: e.target.value }))} placeholder="e.g., 5.00" style={{ ...inputStyle(), maxWidth: 110 }}/>
                                  ) : (
                                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.amber }}>Rs. {Number(tier.ratePerUnit || 0).toFixed(2)}</span>
                                  )}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {editingElecTier === tier.id ? (
                                      <>
                                        <button onClick={() => saveElecTier(tier.id)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.amberM}`, background: C.amberL, color: C.amber, fontSize: "0.7rem", cursor: "pointer" }}><FiSave size={11}/> Save</button>
                                        <button onClick={() => { setEditingElecTier(null); setEditElecValues({}); }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}><FiX size={12}/></button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setEditingElecTier(tier.id); setEditElecValues({ upTo: tier.upTo === null ? "" : String(tier.upTo), ratePerUnit: String(tier.ratePerUnit) }); }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}><FiEdit2 size={12}/></button>
                                        <button onClick={() => deleteElecTier(tier.id)} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.redM}`, background: C.redL, color: C.red, cursor: "pointer" }}><FiTrash2 size={12}/></button>
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
                </div>

                {/* Preview Calculation - Only show if tiers exist */}
                {elecTiers.length > 0 && (
                  <div style={{ background: C.amberL, border: `1px solid ${C.amberM}`, borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: C.amber, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Preview Calculation (150 units example)</p>
                    <p style={{ fontSize: "0.85rem", color: C.body, margin: 0, lineHeight: 1.7 }}>
                      Fixed charge: <strong>Rs. {(parseFloat(elecFixed) || 0).toFixed(2)}</strong><br />
                      + Tiered consumption: <strong>Rs. {(calculatePreview(elecTiers, 0, 150)).toFixed(2)}</strong><br />
                      = <strong style={{ color: C.amber, fontSize: "1rem" }}>Total: Rs. {calculatePreview(elecTiers, parseFloat(elecFixed) || 0, 150).toFixed(2)}</strong>
                    </p>
                    <details style={{ fontSize: "0.7rem", color: C.muted, marginTop: 8 }}>
                      <summary>How is this calculated?</summary>
                      <p style={{ marginTop: 8, lineHeight: 1.6 }}>
                        For 150 units, the calculation goes through each tier:<br/>
                        • First 30 units × rate<br/>
                        • Next 30 units × rate<br/>
                        • And so on until 150 units are covered.<br/>
                        Then add the fixed charge.
                      </p>
                    </details>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ── WATER TAB (CLEAN VERSION - NO DUPLICATION) ──
            <div className="t-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: C.s1 }}>
              
              {/* Current Active Water Tariff - READ ONLY */}
              <div style={{ padding: "20px 22px", background: C.greenL, borderBottom: `1px solid ${C.greenM}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "1rem", fontWeight: 700, color: C.green }}>💧 Current Active Water Tariff</h3>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: C.muted }}>Effective since: {formatDateForDisplay(activeWaterTariff?.effectiveFrom)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.7rem", color: C.muted }}>Monthly Fixed Charge</span>
                    <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.ink }}>Rs. {activeWaterTariff?.fixedCharge?.toFixed(2) || "0.00"}</p>
                  </div>
                </div>
                
                {/* Tiers displayed in a clean grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginTop: 12 }}>
                  {activeWaterTariff?.tiers?.map((tier, idx) => {
                    const prevUpTo = idx === 0 ? 0 : activeWaterTariff.tiers[idx - 1].upTo;
                    return (
                      <div key={idx} style={{ background: C.card, borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: "0.75rem", color: C.muted }}>{prevUpTo + 1}–{tier.upTo === null ? "∞" : tier.upTo} units</span>
                        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.teal }}>Rs. {tier.ratePerUnit.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 12, textAlign: "right" }}>
                  Total: {activeWaterTariff?.tiers?.length || 0} tiers
                </p>
              </div>

              {/* Create NEW Water Tariff - EMPTY FORM */}
              <div style={{ padding: "22px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.ink }}>📝 Create New Water Tariff</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={copyCurrentTariff} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: "0.7rem", cursor: "pointer" }}>
                      <FiCopy size={12}/> Copy Current
                    </button>
                    <button onClick={clearForm} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 6, border: `1px solid ${C.border}`, background: C.card, fontSize: "0.7rem", cursor: "pointer" }}>
                      <FiX size={12}/> Clear
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, marginBottom: 20 }}>Fill in the details below to publish a new tariff. The current active tariff will be automatically archived.</p>
                
                {/* Fixed Charge */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>
                    Monthly Service Charge (Fixed Charge) — Rs.
                  </label>
                  <input 
                    className="t-input" 
                    value={waterFixed} 
                    onChange={e => setWaterFixed(e.target.value)} 
                    placeholder="e.g., 350" 
                    style={{ ...inputStyle(errors.waterFixed), maxWidth: 200 }}
                  />
                  <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 4 }}>Base fee charged every month regardless of usage</p>
                </div>

                {/* Water Tiers Management - Starts Empty */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <label style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Consumption Tiers (Rate per Unit)</label>
                    <button onClick={addWaterTier} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.tealM}`, background: C.tealL, color: C.teal, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                      <FiPlus size={12}/> Add Tier
                    </button>
                  </div>
                  
                  {waterTiers.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", background: C.hover, borderRadius: 12, border: `1px dashed ${C.border}` }}>
                      <p style={{ fontSize: "0.8rem", color: C.muted }}>No tiers added yet. Click "Add Tier" to start creating your new tariff.</p>
                      <p style={{ fontSize: "0.7rem", color: C.faint, marginTop: 8 }}>You can also click "Copy Current" to load the existing tariff and modify it.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: C.hover }}>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Tier</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Up to (units)</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}>Rate per Unit (Rs.)</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {waterTiers.map((tier, idx) => {
                            const prevMax = idx === 0 ? 0 : (waterTiers[idx - 1].upTo || 0);
                            return (
                              <tr key={tier.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                                <td style={{ padding: "10px 12px", fontSize: "0.8rem", color: C.muted, fontWeight: 600 }}>
                                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 6, background: C.tealL, color: C.teal, fontSize: "0.7rem", fontWeight: 800 }}>{idx + 1}</span>
                                </td>
                                <td style={{ padding: "10px 12px", fontSize: "0.85rem", color: C.body }}>
                                  {editingWaterTier === tier.id ? (
                                    <input className="t-input" value={editWaterValues.upTo} onChange={e => setEditWaterValues(p => ({ ...p, upTo: e.target.value }))} placeholder="e.g., 5, 10, or blank for ∞" style={{ ...inputStyle(), maxWidth: 100 }}/>
                                  ) : (
                                    <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{tier.upTo === null ? `${prevMax + 1} – ∞` : `${prevMax + 1} – ${tier.upTo}`}</span>
                                  )}
                                </td>
                                <td style={{ padding: "10px 12px", fontSize: "0.85rem" }}>
                                  {editingWaterTier === tier.id ? (
                                    <input className="t-input" value={editWaterValues.ratePerUnit} onChange={e => setEditWaterValues(p => ({ ...p, ratePerUnit: e.target.value }))} placeholder="e.g., 50.00" style={{ ...inputStyle(), maxWidth: 110 }}/>
                                  ) : (
                                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: C.teal }}>Rs. {Number(tier.ratePerUnit || 0).toFixed(2)}</span>
                                  )}
                                </td>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", gap: 6 }}>
                                    {editingWaterTier === tier.id ? (
                                      <>
                                        <button onClick={() => saveWaterTier(tier.id)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${C.tealM}`, background: C.tealL, color: C.teal, fontSize: "0.7rem", cursor: "pointer" }}><FiSave size={11}/> Save</button>
                                        <button onClick={() => { setEditingWaterTier(null); setEditWaterValues({}); }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}><FiX size={12}/></button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => { setEditingWaterTier(tier.id); setEditWaterValues({ upTo: tier.upTo === null ? "" : String(tier.upTo), ratePerUnit: String(tier.ratePerUnit) }); }} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer" }}><FiEdit2 size={12}/></button>
                                        <button onClick={() => deleteWaterTier(tier.id)} style={{ padding: "4px 6px", borderRadius: 6, border: `1px solid ${C.redM}`, background: C.redL, color: C.red, cursor: "pointer" }}><FiTrash2 size={12}/></button>
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
                </div>

                {/* Preview Calculation - Only show if tiers exist */}
                {waterTiers.length > 0 && (
                  <div style={{ background: C.tealL, border: `1px solid ${C.tealM}`, borderRadius: 12, padding: "14px 16px", marginTop: 12 }}>
                    <p style={{ fontSize: "0.72rem", fontWeight: 700, color: C.teal, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Preview Calculation (20 units)</p>
                    <p style={{ fontSize: "0.85rem", color: C.body, margin: 0, lineHeight: 1.7 }}>
                      Fixed charge: <strong>Rs. {(parseFloat(waterFixed) || 0).toFixed(2)}</strong> + Tiered consumption: <strong>Rs. {(calculatePreview(waterTiers, 0, 20)).toFixed(2)}</strong> = <strong style={{ color: C.teal, fontSize: "1rem" }}>Rs. {calculatePreview(waterTiers, parseFloat(waterFixed) || 0, 20).toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Publish & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Publish New Tariff Card */}
          <div className="t-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px", boxShadow: C.s1 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <FiClock size={15} color={C.violet}/> Publish New Tariff
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>Effective From (Month)</label>
                <input className="t-input" type="month" value={effectiveFrom} onChange={e => { setEffectiveFrom(e.target.value); setErrors(p => ({ ...p, effectiveFrom: "" })); }} style={{ ...inputStyle(errors.effectiveFrom) }}/>
                {errors.effectiveFrom && <span style={{ fontSize: "0.72rem", color: C.red, marginTop: 5, display: "block" }}>{errors.effectiveFrom}</span>}
              </div>
              
              {/* Validation warnings */}
              {activeTab === "water" && waterTiers.length === 0 && (
                <div style={{ background: C.redL, border: `1px solid ${C.redM}`, borderRadius: 8, padding: "8px 12px" }}>
                  <p style={{ fontSize: "0.7rem", color: C.red, margin: 0 }}>⚠️ Add at least one tier before publishing</p>
                </div>
              )}
              
              <div style={{ background: C.amberL, border: `1px solid ${C.amberM}`, borderRadius: 10, padding: "11px 14px" }}>
                <p style={{ fontSize: "0.78rem", color: C.body, margin: 0, lineHeight: 1.6 }}>
                  <FiAlertTriangle size={12} style={{ marginRight: 5, color: C.amber, display: "inline" }}/>
                  Publishing will immediately activate these rates for all new bill entries.
                </p>
              </div>
              <Btn variant="primary" onClick={handlePublish} disabled={publishing || (activeTab === "water" && waterTiers.length === 0)} style={{ width: "100%", justifyContent: "center", padding: "11px 16px" }}>
                <FiCheckCircle size={14}/> {publishing ? "Publishing…" : "Publish Tariff"}
              </Btn>
            </div>
          </div>

          {/* Tariff History Card */}
          <div className="t-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px", boxShadow: C.s1 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 16px" }}>Tariff History ({history.length})</h3>
            {history.length === 0 ? (
              <p style={{ fontSize: "0.82rem", color: C.faint, margin: 0, textAlign: "center", padding: "20px 0" }}>No tariff history yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {history.map((h, i) => (
                  <div key={h._id} className="t-hist-row" style={{ padding: "12px 0", borderBottom: i < history.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", alignItems: "center", gap: 12, transition: "background .15s" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: C.ink }}>{formatDateForDisplay(h.effectiveFrom)}</span>
                        <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", background: h.status === "active" ? C.greenL : C.hover, border: `1px solid ${h.status === "active" ? C.greenM : C.border}`, color: h.status === "active" ? C.green : C.faint }}>{h.status || "archived"}</span>
                        <span style={{ fontSize: "0.72rem", color: C.faint, textTransform: "capitalize" }}>{h.utilityType}</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", color: C.faint, fontFamily: "monospace" }}>Fixed: Rs. {h.fixedCharge} · {(h.tiers || []).length} tier{(h.tiers || []).length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}