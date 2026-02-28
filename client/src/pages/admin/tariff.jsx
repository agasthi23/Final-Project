// src/pages/admin/TariffManagement.jsx
import { useState } from "react";
import {
  FiZap, FiDroplet, FiPlus, FiEdit2, FiTrash2, FiSave,
  FiX, FiCheckCircle, FiAlertTriangle, FiClock, FiInfo,
} from "react-icons/fi";

/* ─── Font ─── */
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
    @keyframes tarFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .t-fu1{animation:tarFadeUp .4s .05s ease both}
    .t-fu2{animation:tarFadeUp .4s .10s ease both}
    .t-fu3{animation:tarFadeUp .4s .15s ease both}
    .t-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .t-input:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(191,219,254,.45)!important; outline:none; background:#fff!important; }
    .t-input.err   { border-color:#dc2626!important; }
    .t-btn-save:hover    { background:#1d4ed8!important; transform:translateY(-1px)!important; }
    .t-btn-danger:hover  { background:#b91c1c!important; }
    .t-btn-ghost:hover   { background:#f0f2f7!important; }
    .t-btn-add:hover     { background:#eff6ff!important; }
    .t-tier-row:hover    { background:#f8fafc!important; }
    .t-hist-row:hover    { background:#f8fafc!important; }
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
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10)",
};

/* ── Initial tariff data (will come from DB) ── */
const INITIAL_ELEC_TIERS = [
  { id:1, upTo:30,       ratePerUnit:2.50  },
  { id:2, upTo:60,       ratePerUnit:4.85  },
  { id:3, upTo:90,       ratePerUnit:7.85  },
  { id:4, upTo:120,      ratePerUnit:10.00 },
  { id:5, upTo:180,      ratePerUnit:27.50 },
  { id:6, upTo:Infinity, ratePerUnit:32.00 },
];

const TARIFF_HISTORY = [
  { id:1, effectiveFrom:"Jan 2025", setBy:"Admin", elecBase:2.50, waterRate:40.00, status:"active"   },
  { id:2, effectiveFrom:"Jul 2024", setBy:"Admin", elecBase:2.25, waterRate:38.00, status:"archived" },
  { id:3, effectiveFrom:"Jan 2024", setBy:"Admin", elecBase:2.00, waterRate:35.00, status:"archived" },
];

export default function TariffManagement() {
  const [elecTiers,       setElecTiers]       = useState(INITIAL_ELEC_TIERS);
  const [waterRate,       setWaterRate]       = useState("40.00");
  const [waterFixed,      setWaterFixed]      = useState("50.00");
  const [elecFixed,       setElecFixed]       = useState("30.00");
  const [effectiveFrom,   setEffectiveFrom]   = useState("");
  const [editingTier,     setEditingTier]     = useState(null); // tier id being edited
  const [editValues,      setEditValues]      = useState({});
  const [toast,           setToast]           = useState(null);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [errors,          setErrors]          = useState({});
  const [activeTab,       setActiveTab]       = useState("electricity"); // "electricity" | "water"

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── Tier editing ── */
  const startEditTier = (tier) => {
    setEditingTier(tier.id);
    setEditValues({ upTo: tier.upTo === Infinity ? "∞" : String(tier.upTo), ratePerUnit: String(tier.ratePerUnit) });
  };
  const cancelEditTier = () => { setEditingTier(null); setEditValues({}); };

  const saveEditTier = (id) => {
    const rate = parseFloat(editValues.ratePerUnit);
    if (isNaN(rate) || rate <= 0) { showToast("Rate must be a positive number.", "error"); return; }
    setElecTiers(prev => prev.map(t => t.id===id ? { ...t, ratePerUnit:rate } : t));
    setEditingTier(null);
    showToast("Tier updated successfully.");
  };

  const deleteTier = (id) => {
    if (elecTiers.length <= 1) { showToast("At least one tier is required.", "error"); return; }
    setElecTiers(prev => prev.filter(t => t.id!==id));
    showToast("Tier removed.");
  };

  const addTier = () => {
    const newId = Math.max(...elecTiers.map(t=>t.id)) + 1;
    setElecTiers(prev => [...prev, { id:newId, upTo:Infinity, ratePerUnit:0 }]);
    setEditingTier(newId);
    setEditValues({ upTo:"∞", ratePerUnit:"" });
  };

  /* ── Publish tariff ── */
  const validatePublish = () => {
    const e = {};
    if (!effectiveFrom.trim()) e.effectiveFrom = "Effective date is required.";
    const wr = parseFloat(waterRate);
    if (isNaN(wr) || wr <= 0) e.waterRate = "Valid water rate required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePublish = () => {
    if (!validatePublish()) return;
    setShowConfirm(true);
  };

  const confirmPublish = () => {
    // will POST to /api/tariff when backend is ready
    setShowConfirm(false);
    showToast("New tariff published and activated successfully!");
    setEffectiveFrom("");
  };

  /* ── Input style ── */
  const inputStyle = (err) => ({
    width:"100%", padding:"9px 12px", border:`1.5px solid ${err?C.red:C.border}`,
    borderRadius:9, background:C.hover, fontFamily:F, fontSize:"0.875rem",
    color:C.ink, transition:"all .15s", boxSizing:"border-box",
    boxShadow: err ? `0 0 0 3px ${C.redM}55` : "none",
  });

  const Btn = ({ variant="primary", onClick, children, style={}, disabled=false }) => {
    const v = {
      primary: { bg:C.blue, color:"#fff", border:C.blue, cls:"t-btn-save" },
      danger:  { bg:C.red,  color:"#fff", border:C.red,  cls:"t-btn-danger" },
      ghost:   { bg:"transparent", color:C.muted, border:C.border, cls:"t-btn-ghost" },
      add:     { bg:C.card, color:C.blue, border:C.blueM, cls:"t-btn-add" },
    }[variant];
    return (
      <button className={v.cls} onClick={onClick} disabled={disabled}
        style={{ display:"inline-flex", alignItems:"center", gap:6,
          padding:"8px 16px", borderRadius:9, border:`1px solid ${v.border}`,
          background:v.bg, color:v.color, fontFamily:F, fontSize:"0.82rem",
          fontWeight:600, cursor:disabled?"not-allowed":"pointer",
          opacity:disabled?0.5:1, transition:"all .15s", ...style }}>
        {children}
      </button>
    );
  };

  return (
    <div style={{ padding:"28px 32px 64px", fontFamily:F }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999,
          display:"flex", alignItems:"center", gap:10,
          background: toast.type==="error" ? C.red : C.green,
          color:"#fff", padding:"12px 18px", borderRadius:12,
          boxShadow:C.s3, fontFamily:F, fontSize:"0.875rem", fontWeight:500 }}>
          {toast.type==="error" ? <FiAlertTriangle size={15}/> : <FiCheckCircle size={15}/>}
          {toast.msg}
          <button onClick={() => setToast(null)}
            style={{ background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,.7)", display:"flex", padding:0, marginLeft:4 }}>
            <FiX size={14}/>
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, zIndex:9998, display:"flex",
          alignItems:"center", justifyContent:"center",
          background:"rgba(15,23,42,.45)", backdropFilter:"blur(3px)" }}>
          <div style={{ background:C.card, borderRadius:18, padding:"28px 32px",
            maxWidth:420, width:"90%", boxShadow:C.s3 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:C.amberL,
                border:`1px solid ${C.amberM}`, display:"flex",
                alignItems:"center", justifyContent:"center", color:C.amber }}>
                <FiAlertTriangle size={22}/>
              </div>
              <div>
                <h3 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
                  Publish New Tariff?
                </h3>
                <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>
                  This will affect all future bill calculations.
                </p>
              </div>
            </div>
            <div style={{ background:C.amberL, border:`1px solid ${C.amberM}`,
              borderRadius:10, padding:"12px 14px", marginBottom:20 }}>
              <p style={{ fontSize:"0.8rem", color:C.body, margin:0, lineHeight:1.6 }}>
                Effective from <strong>{effectiveFrom}</strong>. All new bills entered after this date
                will use the updated rates. Existing bills are not affected.
              </p>
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <Btn variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Btn>
              <Btn variant="primary" onClick={confirmPublish}>
                <FiCheckCircle size={13}/> Yes, Publish
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div className="t-fu1" style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
          margin:"0 0 5px", letterSpacing:"-0.03em" }}>Tariff Management</h1>
        <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
          Manage electricity and water tariff rates. Changes apply to future bills only.
        </p>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="t-fu1" style={{ display:"flex", alignItems:"flex-start", gap:12,
        padding:"14px 18px", borderRadius:12, background:C.blueL,
        border:`1px solid ${C.blueM}`, marginBottom:24 }}>
        <FiInfo size={16} color={C.blue} style={{ flexShrink:0, marginTop:2 }}/>
        <p style={{ fontSize:"0.82rem", color:C.body, margin:0, lineHeight:1.6 }}>
          Tariff changes are <strong>non-destructive</strong> — existing bills retain the rate that was
          active when they were entered. Each published tariff is stored with its effective date for full audit history.
        </p>
      </div>

      {/* ── UTILITY TABS ── */}
      <div className="t-fu2" style={{ display:"flex", background:C.card,
        border:`1px solid ${C.border}`, borderRadius:12, padding:4, gap:3,
        marginBottom:20, width:"fit-content" }}>
        {[
          { key:"electricity", icon:<FiZap size={15}/>,     label:"Electricity", activeColor:C.amber, activeBg:C.amberL, activeBdr:C.amberM },
          { key:"water",       icon:<FiDroplet size={15}/>, label:"Water",       activeColor:C.teal,  activeBg:C.tealL,  activeBdr:C.tealM  },
        ].map(tab => {
          const active = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px",
                borderRadius:9, border:`1px solid ${active?tab.activeBdr:"transparent"}`,
                background:active?tab.activeBg:"transparent",
                color:active?tab.activeColor:C.muted,
                fontFamily:F, fontWeight:600, fontSize:"0.875rem",
                cursor:"pointer", transition:"all .15s" }}>
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      <div className="t-fu3" style={{ display:"grid",
        gridTemplateColumns:"1.2fr 1fr", gap:20, alignItems:"start" }}>

        {/* ── LEFT — tier editor ── */}
        <div>
          {activeTab === "electricity" ? (
            <div className="t-card" style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s" }}>
              {/* Card header */}
              <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}`,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <h2 style={{ fontSize:"0.95rem", fontWeight:700, color:C.ink, margin:"0 0 2px",
                    display:"flex", alignItems:"center", gap:8 }}>
                    <FiZap size={16} color={C.amber}/> Electricity Tiers
                  </h2>
                  <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                    CEB tiered pricing — rate per unit (kWh)
                  </p>
                </div>
                <Btn variant="add" onClick={addTier} style={{ fontSize:"0.78rem", padding:"6px 12px" }}>
                  <FiPlus size={13}/> Add Tier
                </Btn>
              </div>

              {/* Fixed charge */}
              <div style={{ padding:"14px 22px", borderBottom:`1px solid ${C.border}`,
                display:"flex", alignItems:"center", gap:14 }}>
                <label style={{ fontSize:"0.72rem", fontWeight:700, color:C.muted,
                  textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>
                  Fixed Charge (Rs.)
                </label>
                <input className="t-input" value={elecFixed}
                  onChange={e => setElecFixed(e.target.value)}
                  style={{ ...inputStyle(), maxWidth:120 }}/>
                <span style={{ fontSize:"0.72rem", color:C.faint }}>charged per billing period</span>
              </div>

              {/* Tier table */}
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr>
                      {["Tier","Up to (units)","Rate / kWh (Rs.)",""].map((h,i) => (
                        <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                          fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                          letterSpacing:"0.08em", color:C.muted,
                          borderBottom:`1px solid ${C.border}`, whiteSpace:"nowrap" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {elecTiers.map((tier,i) => (
                      <tr key={tier.id} className="t-tier-row"
                        style={{ transition:"background .15s" }}>
                        <td style={{ padding:"12px 16px", fontSize:"0.8rem",
                          borderBottom:`1px solid ${C.border}`, color:C.muted, fontWeight:600 }}>
                          <span style={{ display:"inline-flex", alignItems:"center",
                            justifyContent:"center", width:22, height:22, borderRadius:6,
                            background:C.amberL, color:C.amber, fontSize:"0.7rem", fontWeight:800 }}>
                            {i+1}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:"0.85rem",
                          borderBottom:`1px solid ${C.border}`, color:C.body }}>
                          {editingTier === tier.id ? (
                            <input className="t-input" value={editValues.upTo}
                              onChange={e => setEditValues(p=>({...p,upTo:e.target.value}))}
                              placeholder="e.g. 60 or ∞"
                              style={{ ...inputStyle(), maxWidth:100 }}/>
                          ) : (
                            <span style={{ fontFamily:"monospace", fontWeight:600 }}>
                              {tier.upTo === Infinity ? "∞ (above)" : `0 – ${tier.upTo}`}
                            </span>
                          )}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:"0.85rem",
                          borderBottom:`1px solid ${C.border}` }}>
                          {editingTier === tier.id ? (
                            <input className="t-input" value={editValues.ratePerUnit}
                              onChange={e => setEditValues(p=>({...p,ratePerUnit:e.target.value}))}
                              placeholder="e.g. 4.85"
                              style={{ ...inputStyle(), maxWidth:110 }}/>
                          ) : (
                            <span style={{ fontFamily:"monospace", fontWeight:700, color:C.amber }}>
                              Rs. {tier.ratePerUnit.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", gap:6 }}>
                            {editingTier === tier.id ? (
                              <>
                                <button onClick={() => saveEditTier(tier.id)}
                                  style={{ display:"flex", alignItems:"center", gap:4,
                                    padding:"5px 10px", borderRadius:7, border:`1px solid ${C.blueM}`,
                                    background:C.blueL, color:C.blue, fontFamily:F,
                                    fontSize:"0.75rem", fontWeight:600, cursor:"pointer" }}>
                                  <FiSave size={12}/> Save
                                </button>
                                <button onClick={cancelEditTier}
                                  style={{ display:"flex", alignItems:"center",
                                    padding:"5px 8px", borderRadius:7,
                                    border:`1px solid ${C.border}`, background:"transparent",
                                    color:C.muted, cursor:"pointer" }}>
                                  <FiX size={13}/>
                                </button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEditTier(tier)}
                                  style={{ display:"flex", alignItems:"center",
                                    padding:"5px 8px", borderRadius:7,
                                    border:`1px solid ${C.border}`, background:"transparent",
                                    color:C.muted, cursor:"pointer" }}>
                                  <FiEdit2 size={13}/>
                                </button>
                                <button onClick={() => deleteTier(tier.id)}
                                  style={{ display:"flex", alignItems:"center",
                                    padding:"5px 8px", borderRadius:7,
                                    border:`1px solid ${C.redM}`, background:C.redL,
                                    color:C.red, cursor:"pointer" }}>
                                  <FiTrash2 size={13}/>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Water tab */
            <div className="t-card" style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s" }}>
              <div style={{ padding:"18px 22px", borderBottom:`1px solid ${C.border}` }}>
                <h2 style={{ fontSize:"0.95rem", fontWeight:700, color:C.ink, margin:"0 0 2px",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <FiDroplet size={16} color={C.teal}/> Water Rate
                </h2>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                  Flat rate per unit consumed
                </p>
              </div>
              <div style={{ padding:"24px 22px", display:"flex", flexDirection:"column", gap:20 }}>
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700,
                    color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em",
                    marginBottom:7 }}>Rate per Unit (Rs.)</label>
                  <input className="t-input" value={waterRate}
                    onChange={e => setWaterRate(e.target.value)}
                    placeholder="e.g. 40.00"
                    style={{ ...inputStyle(errors.waterRate), maxWidth:200 }}/>
                  {errors.waterRate && <span style={{ fontSize:"0.72rem", color:C.red }}>{errors.waterRate}</span>}
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700,
                    color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em",
                    marginBottom:7 }}>Fixed Charge per Period (Rs.)</label>
                  <input className="t-input" value={waterFixed}
                    onChange={e => setWaterFixed(e.target.value)}
                    placeholder="e.g. 50.00"
                    style={{ ...inputStyle(), maxWidth:200 }}/>
                </div>
                {/* Preview */}
                <div style={{ background:C.tealL, border:`1px solid ${C.tealM}`,
                  borderRadius:12, padding:"14px 16px" }}>
                  <p style={{ fontSize:"0.72rem", fontWeight:700, color:C.teal,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 6px" }}>
                    Preview
                  </p>
                  <p style={{ fontSize:"0.85rem", color:C.body, margin:0, lineHeight:1.7 }}>
                    20 units × Rs. {waterRate || "—"} + Rs. {waterFixed || "—"} fixed
                    {" = "}
                    <strong style={{ color:C.teal }}>
                      Rs. {((parseFloat(waterRate)||0)*20 + (parseFloat(waterFixed)||0)).toFixed(2)}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — publish + history ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Publish card */}
          <div className="t-card" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, padding:"22px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 16px",
              display:"flex", alignItems:"center", gap:8 }}>
              <FiClock size={15} color={C.violet}/> Publish New Tariff
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={{ display:"block", fontSize:"0.72rem", fontWeight:700,
                  color:C.muted, textTransform:"uppercase", letterSpacing:"0.07em",
                  marginBottom:7 }}>Effective From</label>
                <input className="t-input" type="month" value={effectiveFrom}
                  onChange={e => { setEffectiveFrom(e.target.value); setErrors(p=>({...p,effectiveFrom:""})); }}
                  style={{ ...inputStyle(errors.effectiveFrom) }}/>
                {errors.effectiveFrom && (
                  <span style={{ fontSize:"0.72rem", color:C.red }}>{errors.effectiveFrom}</span>
                )}
              </div>
              <div style={{ background:C.amberL, border:`1px solid ${C.amberM}`,
                borderRadius:10, padding:"11px 14px" }}>
                <p style={{ fontSize:"0.78rem", color:C.body, margin:0, lineHeight:1.6 }}>
                  <FiAlertTriangle size={12} style={{ marginRight:5, color:C.amber }}/>
                  Publishing will immediately activate these rates for all new bill entries.
                </p>
              </div>
              <Btn variant="primary" onClick={handlePublish}
                style={{ width:"100%", justifyContent:"center", padding:"11px 16px" }}>
                <FiCheckCircle size={14}/> Publish Tariff
              </Btn>
            </div>
          </div>

          {/* History card */}
          <div className="t-card" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, padding:"22px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 16px" }}>
              Tariff History
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
              {TARIFF_HISTORY.map((h,i) => (
                <div key={h.id} className="t-hist-row"
                  style={{ padding:"12px 0", borderBottom:i<TARIFF_HISTORY.length-1?`1px solid ${C.border}`:"none",
                    display:"flex", alignItems:"center", gap:12, transition:"background .15s" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink }}>
                        {h.effectiveFrom}
                      </span>
                      <span style={{ padding:"2px 8px", borderRadius:20, fontSize:"0.65rem",
                        fontWeight:800, letterSpacing:"0.05em", textTransform:"uppercase",
                        background: h.status==="active" ? C.greenL : C.hover,
                        border: `1px solid ${h.status==="active" ? C.greenM : C.border}`,
                        color: h.status==="active" ? C.green : C.faint }}>
                        {h.status}
                      </span>
                    </div>
                    <span style={{ fontSize:"0.72rem", color:C.faint, fontFamily:"monospace" }}>
                      Elec from Rs.{h.elecBase} · Water Rs.{h.waterRate}/unit
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}