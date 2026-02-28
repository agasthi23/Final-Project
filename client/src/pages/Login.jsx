// src/pages/Login.jsx
// ORIGINAL logic 100% preserved — premium redesign
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiZap, FiDroplet, FiTrendingUp, FiShield } from 'react-icons/fi';
import Logo from '../components/Logo';

/* ─── Font ─── */
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
    @keyframes authFloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
    @keyframes authPulseRing{ 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.08);opacity:.6} }
    @keyframes authShimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .au-fu1{animation:authFadeUp .5s .05s ease both}
    .au-fu2{animation:authFadeUp .5s .15s ease both}
    .au-fu3{animation:authFadeUp .5s .25s ease both}
    .au-fu4{animation:authFadeUp .5s .35s ease both}
    .au-fu5{animation:authFadeUp .5s .45s ease both}
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
    .au-btn-submit:active { transform:translateY(0); }
    .au-btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .au-link:hover { color:#1d4ed8!important; }
    .au-feat:hover { transform:translateX(4px)!important; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

const Login = () => {
  const [formData, setFormData] = useState({ email:'', password:'' });
  const [localError, setLocalError] = useState('');
  const { login, loading, error } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(formData.email, formData.password);
      if (!error) navigate('/dashboard');
    } catch (err) {
      setLocalError('Login failed');
    }
  };

  const features = [
    { icon:<FiZap size={18}/>,       text:"Real-time electricity tracking",   color:"#f59e0b" },
    { icon:<FiDroplet size={18}/>,   text:"Water consumption analytics",      color:"#0891b2" },
    { icon:<FiTrendingUp size={18}/>,text:"Smart bill predictions",           color:"#059669" },
    { icon:<FiShield size={18}/>,    text:"Secure & private by default",      color:"#7c3aed" },
  ];

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:F, background:"#f3f4f8" }}>

      {/* ── LEFT PANEL — brand ── */}
      <div style={{ flex:"0 0 42%", background:"linear-gradient(145deg,#0f172a 0%,#1e293b 60%,#0f2d5a 100%)",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        padding:"48px 52px", position:"relative", overflow:"hidden" }}>

        {/* background orbs */}
        <div style={{ position:"absolute", top:-80, right:-80, width:320, height:320,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.25) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-60, left:-60, width:260, height:260,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(8,145,178,.18) 0%,transparent 70%)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"40%", right:"10%", width:180, height:180,
          borderRadius:"50%", background:"radial-gradient(circle,rgba(124,58,237,.12) 0%,transparent 70%)", pointerEvents:"none",
          animation:"authPulseRing 4s ease-in-out infinite" }}/>

        {/* Logo */}
        <div className="au-si1">
          <Logo size={38} showText variant="light"/>
        </div>

        {/* Center copy */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div className="au-si1" style={{ display:"inline-block", padding:"5px 14px",
            borderRadius:999, background:"rgba(37,99,235,.2)",
            border:"1px solid rgba(37,99,235,.35)",
            fontSize:"0.7rem", fontWeight:700, color:"#93c5fd",
            letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:22 }}>
            Utility Intelligence Platform
          </div>
          <h2 className="au-si2" style={{ fontSize:"2rem", fontWeight:800, color:"#fff",
            lineHeight:1.2, letterSpacing:"-0.03em", margin:"0 0 14px" }}>
            Track. Predict.<br/>
            <span style={{ background:"linear-gradient(90deg,#60a5fa,#818cf8)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              Save.
            </span>
          </h2>
          <p className="au-si3" style={{ fontSize:"0.9rem", color:"rgba(255,255,255,.5)",
            lineHeight:1.7, margin:"0 0 36px", maxWidth:320 }}>
            Understand your electricity and water usage like never before. Smart analytics, budget tracking, and AI-powered predictions.
          </p>

          {/* Feature list */}
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {features.map((f,i) => (
              <div key={i} className={`au-feat au-si${Math.min(i+1,3)}`}
                style={{ display:"flex", alignItems:"center", gap:14,
                  transition:"transform .2s ease" }}>
                <div style={{ width:38, height:38, borderRadius:10,
                  background:`${f.color}18`, border:`1px solid ${f.color}33`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:f.color, flexShrink:0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize:"0.85rem", color:"rgba(255,255,255,.7)", fontWeight:500 }}>
                  {f.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.25)", margin:0, lineHeight:1.6 }}>
          © 2025 Utilyze · Built for smarter living
        </p>
      </div>

      {/* ── RIGHT PANEL — form ── */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
        padding:"48px 32px", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:420 }}>

          {/* Heading */}
          <div className="au-fu1" style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"#0f172a",
              margin:"0 0 6px", letterSpacing:"-0.03em" }}>
              Welcome back
            </h1>
            <p style={{ fontSize:"0.875rem", color:"#64748b", margin:0 }}>
              Sign in to your Utilyze account
            </p>
          </div>

          {/* Success message */}
          {location.state?.message && (
            <div className="au-fu2" style={{ display:"flex", alignItems:"flex-start", gap:10,
              padding:"12px 16px", borderRadius:12, marginBottom:20,
              background:"#ecfdf5", border:"1px solid #a7f3d0", color:"#065f46",
              fontSize:"0.82rem", fontWeight:500 }}>
              {location.state.message}
            </div>
          )}

          {/* Error message */}
          {(error || localError) && (
            <div className="au-fu2" style={{ display:"flex", alignItems:"flex-start", gap:10,
              padding:"12px 16px", borderRadius:12, marginBottom:20,
              background:"#fef2f2", border:"1px solid #fecaca", color:"#991b1b",
              fontSize:"0.82rem", fontWeight:500 }}>
              {error || localError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:18 }}>

            {/* Email */}
            <div className="au-fu2" style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:"0.75rem", fontWeight:700, color:"#475569",
                textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Email Address
              </label>
              <div style={{ position:"relative" }}>
                <FiMail size={16} style={{ position:"absolute", left:14, top:"50%",
                  transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}/>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} required
                  placeholder="you@example.com"
                  className="au-input"
                  style={{ width:"100%", padding:"12px 14px 12px 42px",
                    border:"1.5px solid #e2e8f0", borderRadius:12,
                    background:"#f8fafc", fontFamily:F, fontSize:"0.9rem",
                    color:"#0f172a", transition:"all .15s", boxSizing:"border-box" }}/>
              </div>
            </div>

            {/* Password */}
            <div className="au-fu3" style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:"0.75rem", fontWeight:700, color:"#475569",
                textTransform:"uppercase", letterSpacing:"0.07em" }}>
                Password
              </label>
              <div style={{ position:"relative" }}>
                <FiLock size={16} style={{ position:"absolute", left:14, top:"50%",
                  transform:"translateY(-50%)", color:"#94a3b8", pointerEvents:"none" }}/>
                <input type="password" name="password" value={formData.password}
                  onChange={handleChange} required
                  placeholder="••••••••"
                  className="au-input"
                  style={{ width:"100%", padding:"12px 14px 12px 42px",
                    border:"1.5px solid #e2e8f0", borderRadius:12,
                    background:"#f8fafc", fontFamily:F, fontSize:"0.9rem",
                    color:"#0f172a", transition:"all .15s", boxSizing:"border-box" }}/>
              </div>
            </div>

            {/* Submit */}
            <div className="au-fu4">
              <button type="submit" disabled={loading}
                className="au-btn-submit"
                style={{ width:"100%", padding:"13px 24px", borderRadius:12,
                  border:"none", color:"#fff", fontFamily:F, fontSize:"0.9rem",
                  fontWeight:700, cursor:"pointer", display:"flex",
                  alignItems:"center", justifyContent:"center", gap:8,
                  boxShadow:"0 4px 16px rgba(37,99,235,.3)" }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5"
                      style={{ animation:"spin 1s linear infinite" }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                    Signing in…
                  </>
                ) : (
                  <> Sign In <FiArrowRight size={16}/> </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="au-fu5" style={{ display:"flex", alignItems:"center", gap:14, margin:"24px 0" }}>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
            <span style={{ fontSize:"0.72rem", color:"#94a3b8", fontWeight:600 }}>OR</span>
            <div style={{ flex:1, height:1, background:"#e2e8f0" }}/>
          </div>

          {/* Switch to signup */}
          <p className="au-fu5" style={{ textAlign:"center", fontSize:"0.875rem",
            color:"#64748b", margin:0 }}>
            Don't have an account?{" "}
            <Link to="/signup" className="au-link"
              style={{ color:"#2563eb", fontWeight:700, textDecoration:"none",
                transition:"color .15s" }}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;