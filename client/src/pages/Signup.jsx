// src/pages/Signup.jsx
// ORIGINAL logic 100% preserved — premium redesign
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiArrowRight, FiCheck, FiZap, FiBarChart2, FiActivity } from 'react-icons/fi';
import Logo from '../components/Logo';

/* ─── Font — reuses auth-anim injected by Login if loaded, safe to re-inject ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("auth-anim")) {
  const s = document.createElement("style");
  s.id = "auth-anim";
  s.textContent = `
    @keyframes authFadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes authSlideIn  { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
    @keyframes authPulseRing{ 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.08);opacity:.6} }
    .au-fu1{animation:authFadeUp .5s .05s ease both}
    .au-fu2{animation:authFadeUp .5s .15s ease both}
    .au-fu3{animation:authFadeUp .5s .25s ease both}
    .au-fu4{animation:authFadeUp .5s .35s ease both}
    .au-fu5{animation:authFadeUp .5s .45s ease both}
    .au-fu6{animation:authFadeUp .5s .55s ease both}
    .au-si1{animation:authSlideIn .6s .1s ease both}
    .au-si2{animation:authSlideIn .6s .25s ease both}
    .au-si3{animation:authSlideIn .6s .4s ease both}
    .au-input:focus {
      border-color:#2563eb!important;
      box-shadow:0 0 0 4px rgba(191,219,254,.45)!important;
      background:#fff!important;
      outline:none;
    }
    .au-input.err { border-color:#dc2626!important; box-shadow:0 0 0 4px rgba(254,202,202,.45)!important; }
    .au-btn-submit {
      background:linear-gradient(135deg,#2563eb,#1d4ed8);
      transition:all .2s ease;
    }
    .au-btn-submit:hover:not(:disabled) {
      background:linear-gradient(135deg,#1d4ed8,#1e40af);
      transform:translateY(-1px);
      box-shadow:0 8px 24px rgba(37,99,235,.4)!important;
    }
    .au-btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .au-link:hover { color:#1d4ed8!important; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

const Signup = () => {
  const [formData, setFormData] = useState({ name:'', email:'', password:'', confirmPassword:'' });
  const [errors, setErrors]         = useState({});
  const [localError, setLocalError] = useState('');
  const { signup, loading, error }  = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]:value });
    if (errors[name]) setErrors({ ...errors, [name]:"" });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.name)                                tempErrors.name            = "Full name is required.";
    if (!formData.email)                               tempErrors.email           = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))    tempErrors.email           = "Email is invalid.";
    if (!formData.password)                            tempErrors.password        = "Password is required.";
    else if (formData.password.length < 8)             tempErrors.password        = "Minimum 8 characters.";
    if (formData.password !== formData.confirmPassword)tempErrors.confirmPassword = "Passwords do not match.";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!validate()) return;
    const result = await signup(formData.name, formData.email, formData.password);
    if (result?.success) {
      navigate('/login', { state:{ message:result.message, fromSignup:true } });
    } else {
      setLocalError(result?.message || 'Signup failed');
    }
  };

  const perks = [
    { icon:<FiZap size={15}/>,       text:"Track electricity & water in one place", color:"#f59e0b" },
    { icon:<FiBarChart2 size={15}/>, text:"Monthly reports & spend summaries",       color:"#2563eb" },
    { icon:<FiActivity size={15}/>,  text:"AI predictions for next month's bill",    color:"#059669" },
    { icon:<FiCheck size={15}/>,     text:"Free forever · No credit card needed",    color:"#7c3aed" },
  ];

  /* reusable field */
  const Field = ({ label, name, type="text", value, placeholder, icon, error }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:"0.72rem", fontWeight:700, color:"#475569",
        textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</label>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)",
          color:"#94a3b8", pointerEvents:"none", display:"flex" }}>{icon}</span>
        <input type={type} name={name} value={value} onChange={handleChange}
          placeholder={placeholder}
          className={`au-input${error?" err":""}`}
          style={{ width:"100%", padding:"11px 14px 11px 42px",
            border:`1.5px solid ${error?"#dc2626":"#e2e8f0"}`, borderRadius:12,
            background:"#f8fafc", fontFamily:F, fontSize:"0.875rem",
            color:"#0f172a", transition:"all .15s", boxSizing:"border-box",
            boxShadow: error ? "0 0 0 4px rgba(254,202,202,.45)" : "none" }}/>
      </div>
      {error && <span style={{ fontSize:"0.71rem", color:"#dc2626", fontWeight:500 }}>{error}</span>}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:F, background:"#f3f4f8" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex:"0 0 40%", background:"linear-gradient(145deg,#0f172a 0%,#1e293b 60%,#0f2d5a 100%)",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        padding:"48px 48px", position:"relative", overflow:"hidden" }}>

        {/* orbs */}
        <div style={{ position:"absolute", top:-80, left:-80, width:300, height:300,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.2) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-40, right:-40, width:240, height:240,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(5,150,105,.15) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"35%", left:"15%", width:200, height:200,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,.1) 0%,transparent 70%)", pointerEvents:"none",
          animation:"authPulseRing 5s ease-in-out infinite" }}/>

        {/* Logo */}
        <div className="au-si1">
          <Logo size={38} showText variant="light"/>
        </div>

        {/* Copy */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div className="au-si1" style={{ display:"inline-block", padding:"5px 14px",
            borderRadius:999, background:"rgba(5,150,105,.2)", border:"1px solid rgba(5,150,105,.35)",
            fontSize:"0.68rem", fontWeight:700, color:"#6ee7b7",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:20 }}>
            Join thousands of users
          </div>
          <h2 className="au-si2" style={{ fontSize:"1.9rem", fontWeight:800, color:"#fff",
            lineHeight:1.2, letterSpacing:"-0.03em", margin:"0 0 12px" }}>
            Take control of<br/>
            <span style={{ background:"linear-gradient(90deg,#34d399,#60a5fa)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              your utility bills.
            </span>
          </h2>
          <p className="au-si3" style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.5)",
            lineHeight:1.7, margin:"0 0 32px", maxWidth:300 }}>
            Create your free account and start making smarter decisions about your energy and water usage today.
          </p>

          {/* Perks */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {perks.map((p,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:30, height:30, borderRadius:8,
                  background:`${p.color}18`, border:`1px solid ${p.color}33`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:p.color, flexShrink:0 }}>{p.icon}</div>
                <span style={{ fontSize:"0.82rem", color:"rgba(255,255,255,.65)", fontWeight:500 }}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.22)", margin:0 }}>
          © 2025 Utilyze · Built for smarter living
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"48px 32px", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Heading */}
          <div className="au-fu1" style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:"1.65rem", fontWeight:800, color:"#0f172a",
              margin:"0 0 6px", letterSpacing:"-0.03em" }}>
              Create your account
            </h1>
            <p style={{ fontSize:"0.875rem", color:"#64748b", margin:0 }}>
              Free forever · Takes 30 seconds
            </p>
          </div>

          {/* Messages */}
          {location.state?.message && (
            <div className="au-fu2" style={{ padding:"12px 16px", borderRadius:12, marginBottom:18,
              background:"#ecfdf5", border:"1px solid #a7f3d0", color:"#065f46",
              fontSize:"0.82rem", fontWeight:500 }}>
              {location.state.message}
            </div>
          )}
          {(error || localError) && (
            <div className="au-fu2" style={{ padding:"12px 16px", borderRadius:12, marginBottom:18,
              background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b",
              fontSize:"0.82rem", fontWeight:500 }}>
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:15 }}>
            <div className="au-fu2">
              <Field label="Full Name" name="name" value={formData.name}
                placeholder="John Doe" icon={<FiUser size={15}/>} error={errors.name}/>
            </div>
            <div className="au-fu3">
              <Field label="Email Address" name="email" type="email" value={formData.email}
                placeholder="you@example.com" icon={<FiMail size={15}/>} error={errors.email}/>
            </div>
            <div className="au-fu4">
              <Field label="Password" name="password" type="password" value={formData.password}
                placeholder="Min. 8 characters" icon={<FiLock size={15}/>} error={errors.password}/>
            </div>
            <div className="au-fu5">
              <Field label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword}
                placeholder="Repeat password" icon={<FiLock size={15}/>} error={errors.confirmPassword}/>
            </div>

            {/* Submit */}
            <div className="au-fu6" style={{ paddingTop:4 }}>
              <button type="submit" disabled={loading}
                className="au-btn-submit"
                style={{ width:"100%", padding:"13px 24px", borderRadius:12,
                  border:"none", color:"#fff", fontFamily:F, fontSize:"0.9rem",
                  fontWeight:700, cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:"0 4px 16px rgba(37,99,235,.3)" }}>
                {loading ? "Creating account…" : <> Create Account <FiArrowRight size={16}/> </>}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="au-fu6" style={{ display:"flex", alignItems:"center", gap:14, margin:"22px 0" }}>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
            <span style={{ fontSize:"0.7rem", color:"#94a3b8", fontWeight:600 }}>ALREADY HAVE AN ACCOUNT</span>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
          </div>

          <p className="au-fu6" style={{ textAlign:"center", fontSize:"0.875rem", color:"#64748b", margin:0 }}>
            <Link to="/login" className="au-link"
              style={{ color:"#2563eb", fontWeight:700, textDecoration:"none", transition:"color .15s" }}>
              ← Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;