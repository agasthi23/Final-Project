// src/pages/ProfilePage.jsx
// ORIGINAL logic 100% preserved — only design tokens updated to match dashboard
import { useState, useEffect } from "react";
import {
  FiUser, FiMail, FiEdit2, FiSave, FiX, FiLock,
  FiLogOut, FiMoon, FiSun, FiBell, FiAlertTriangle,
  FiCamera, FiShield, FiCheck,
} from "react-icons/fi";

/* ─── Font (shared with dashboard) ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("prof-anim")) {
  const s = document.createElement("style");
  s.id = "prof-anim";
  s.textContent = `
    @keyframes profFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .pf-fu { animation: profFadeUp .35s ease both }
    .pf-nav:hover:not(.active) { background:#f0f2f7!important; color:#475569!important; }
    .pf-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .pf-btn-primary:hover   { background:#1d4ed8!important; }
    .pf-btn-secondary:hover { background:#f0f2f7!important; }
    .pf-btn-ghost:hover     { background:#f0f2f7!important; }
    .pf-btn-danger:hover    { background:#b91c1c!important; }
    .pf-logout:hover        { background:#fef2f2!important; }
    .pf-input:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(191,219,254,.5)!important; outline:none; }
    .pf-input.error { border-color:#dc2626!important; }
    /* toggle switch */
    .pf-toggle-input { display:none; }
    .pf-toggle-track {
      display:inline-flex; align-items:center;
      width:44px; height:24px; border-radius:99px;
      background:#e2e8f0; cursor:pointer;
      transition:background .2s; flex-shrink:0; position:relative;
    }
    .pf-toggle-input:checked + .pf-toggle-track { background:#2563eb; }
    .pf-toggle-thumb {
      position:absolute; left:3px; top:3px;
      width:18px; height:18px; border-radius:50%;
      background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.15);
      transition:transform .2s;
    }
    .pf-toggle-input:checked + .pf-toggle-track .pf-toggle-thumb { transform:translateX(20px); }
  `;
  document.head.appendChild(s);
}

/* ════ TOKENS — identical to Dashboard ════ */
const C = {
  page:"#f3f4f8", card:"#fff", hover:"#f0f2f7",
  ink:"#0f172a", body:"#334155", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0", borderB:"#cbd5e1",
  blue:"#2563eb", blueL:"#eff6ff", blueM:"#bfdbfe",
  teal:"#0891b2", tealL:"#ecfeff", tealM:"#a5f3fc",
  green:"#059669", greenL:"#ecfdf5", greenM:"#a7f3d0",
  amber:"#d97706", amberL:"#fffbeb", amberM:"#fde68a",
  red:"#dc2626",   redL:"#fef2f2",   redM:"#fecaca",
  violet:"#7c3aed",violetL:"#f5f3ff",violetM:"#ddd6fe",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s2:"0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
};
const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

/* ════ SHARED BUTTON ════ */
const Btn = ({ variant="secondary", onClick, children, style={} }) => {
  const variants = {
    primary:   { bg:C.blue,  color:"#fff",   border:C.blue,  hoverCls:"pf-btn-primary"   },
    secondary: { bg:C.card,  color:C.muted,  border:C.borderB, hoverCls:"pf-btn-secondary" },
    ghost:     { bg:"transparent", color:C.muted, border:"transparent", hoverCls:"pf-btn-ghost" },
    danger:    { bg:C.red,   color:"#fff",   border:C.red,   hoverCls:"pf-btn-danger"    },
  };
  const v = variants[variant] || variants.secondary;
  return (
    <button className={v.hoverCls} onClick={onClick}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px",
        borderRadius:9, border:`1px solid ${v.border}`, background:v.bg, color:v.color,
        fontFamily:F, fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
        transition:"all .15s", whiteSpace:"nowrap", ...style }}>
      {children}
    </button>
  );
};

/* ════ MAIN COMPONENT ════ */
const ProfilePage = () => {

  /* ── ORIGINAL STATE (unchanged) ── */
  const [profileData, setProfileData] = useState({
    fullName:"John Doe", email:"john.doe@example.com",
    role:"Account Owner", avatar:null,
  });
  const [isEditingProfile,  setIsEditingProfile]  = useState(false);
  const [formData,          setFormData]          = useState({ ...profileData });
  const [settings,          setSettings]          = useState({ darkMode:false, emailNotifications:true, usageAlerts:true });
  const [passwordData,      setPasswordData]      = useState({ currentPassword:"", newPassword:"", confirmPassword:"" });
  const [showPasswordForm,  setShowPasswordForm]  = useState(false);
  const [errors,            setErrors]            = useState({});
  const [notification,      setNotification]      = useState({ message:"", type:"" });
  const [activeTab,         setActiveTab]         = useState("profile");

  /* ── ORIGINAL EFFECTS (unchanged) ── */
  useEffect(() => { document.body.classList.toggle("dark-mode", settings.darkMode); }, [settings.darkMode]);
  useEffect(() => { setFormData({ ...profileData }); }, [profileData]);

  /* ── ORIGINAL HANDLERS (unchanged) ── */
  const showNotification = (message, type="success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message:"", type:"" }), 3000);
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]:value });
    if (errors[name]) setErrors({ ...errors, [name]:"" });
  };
  const handleSettingChange = (setting) => setSettings({ ...settings, [setting]:!settings[setting] });
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]:value });
  };
  const validateProfileForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = "Current password is required";
    if (!passwordData.newPassword) newErrors.newPassword = "New password is required";
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = "Minimum 8 characters";
    if (!passwordData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSaveProfile = () => {
    if (validateProfileForm()) {
      setProfileData({ ...formData });
      setIsEditingProfile(false);
      showNotification("Profile updated successfully!");
    }
  };
  const handleChangePassword = () => {
    if (validatePasswordForm()) {
      setPasswordData({ currentPassword:"", newPassword:"", confirmPassword:"" });
      setShowPasswordForm(false);
      showNotification("Password changed successfully!");
    }
  };
  const handleLogout      = () => console.log("Logout");
  const handleCancelEdit  = () => { setFormData({ ...profileData }); setErrors({}); setIsEditingProfile(false); };
  const initials = profileData.fullName.split(" ").map(n => n[0]).join("").toUpperCase();

  /* ── SHARED FIELD ── */
  const Field = ({ label, name, type="text", value, onChange, error, placeholder, icon }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase",
        letterSpacing:"0.07em", color:C.muted, fontFamily:F }}>{label}</label>
      <div style={{ position:"relative", display:"flex", alignItems:"center" }}>
        {icon && <span style={{ position:"absolute", left:13, color:C.faint, display:"flex", pointerEvents:"none" }}>
          {icon}
        </span>}
        <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
          className={`pf-input${error?" error":""}`}
          style={{ width:"100%", padding: icon ? "10px 14px 10px 38px" : "10px 14px",
            border:`1.5px solid ${error?C.red:C.border}`, borderRadius:10,
            background:C.hover, fontFamily:F, fontSize:"0.875rem", color:C.body,
            transition:"border-color .15s, box-shadow .15s",
            boxShadow: error ? `0 0 0 3px ${C.redM}55` : "none" }}/>
      </div>
      {error && <span style={{ fontSize:"0.72rem", color:C.red, fontFamily:F }}>{error}</span>}
    </div>
  );

  /* ── ICON WRAP ── */
  const IconWrap = ({ color, bg, bdr, children }) => (
    <div style={{ width:38, height:38, borderRadius:10, display:"flex", alignItems:"center",
      justifyContent:"center", background:bg, border:`1px solid ${bdr}`,
      color, flexShrink:0 }}>{children}</div>
  );

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px" }}>

      {/* Toast */}
      {notification.message && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999,
          display:"flex", alignItems:"center", gap:10,
          background:C.green, color:"#fff", padding:"12px 18px",
          borderRadius:12, boxShadow:C.s3, fontFamily:F,
          fontSize:"0.875rem", fontWeight:500, animation:"profFadeUp .3s ease" }}>
          <FiCheck size={16}/>
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ message:"", type:"" })}
            style={{ background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,.7)", display:"flex", padding:0, marginLeft:4 }}>
            <FiX size={14}/>
          </button>
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="pf-fu" style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
          margin:"0 0 5px", letterSpacing:"-0.03em" }}>Account Settings</h1>
        <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
          Manage your profile, preferences, and security
        </p>
      </div>

      {/* ── LAYOUT — sidebar + main ── */}
      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20, alignItems:"start" }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:16, overflow:"hidden", boxShadow:C.s1, position:"sticky", top:24 }}>

          {/* Avatar */}
          <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column", alignItems:"center", gap:10, textAlign:"center" }}>
            <div style={{ position:"relative", display:"inline-block" }}>
              <div style={{ width:72, height:72, borderRadius:"50%",
                background:`linear-gradient(135deg,${C.blue},${C.violet})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.5rem", fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>
                {profileData.avatar
                  ? <img src={profileData.avatar} alt="Profile"
                      style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }}/>
                  : initials}
              </div>
              <button title="Change photo"
                style={{ position:"absolute", bottom:0, right:0, width:26, height:26,
                  borderRadius:"50%", background:C.card, border:`2px solid ${C.page}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:C.muted, cursor:"pointer", boxShadow:C.s1 }}>
                <FiCamera size={12}/>
              </button>
            </div>
            <div>
              <p style={{ fontSize:"0.95rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>
                {profileData.fullName}
              </p>
              <p style={{ fontSize:"0.75rem", color:C.muted, margin:0 }}>{profileData.role}</p>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding:"12px 10px" }}>
            {[
              { id:"profile",     icon:<FiUser size={16}/>,   label:"Profile"     },
              { id:"preferences", icon:<FiBell size={16}/>,   label:"Preferences" },
              { id:"security",    icon:<FiShield size={16}/>, label:"Security"    },
            ].map(item => (
              <button key={item.id}
                className={`pf-nav${activeTab===item.id?" active":""}`}
                onClick={() => setActiveTab(item.id)}
                style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 14px", borderRadius:10, border:"none", fontFamily:F,
                  fontSize:"0.875rem", fontWeight:600, cursor:"pointer", textAlign:"left",
                  marginBottom:2, transition:"all .15s",
                  background: activeTab===item.id ? C.blueL : "transparent",
                  color:      activeTab===item.id ? C.blue  : C.muted }}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          {/* Sign Out */}
          <div style={{ padding:"10px 10px 14px", borderTop:`1px solid ${C.border}` }}>
            <button className="pf-logout" onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"10px 14px", borderRadius:10, border:"none", fontFamily:F,
                fontSize:"0.875rem", fontWeight:600, cursor:"pointer", textAlign:"left",
                background:"transparent", color:C.red, transition:"all .15s" }}>
              <FiLogOut size={16} style={{ flexShrink:0 }}/> Sign Out
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main>

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="pf-fu" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1,
                transition:"box-shadow .2s" }}>

                {/* Card header */}
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Personal Information</h2>
                    <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Update your name and email address</p>
                  </div>
                  {!isEditingProfile && (
                    <Btn variant="secondary" onClick={() => setIsEditingProfile(true)}>
                      <FiEdit2 size={13}/> Edit
                    </Btn>
                  )}
                </div>

                <div style={{ padding:"24px" }}>
                  {isEditingProfile ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                      <Field label="Full Name" name="fullName" value={formData.fullName}
                        onChange={handleInputChange} error={errors.fullName}
                        placeholder="Your full name" icon={<FiUser size={14}/>}/>
                      <Field label="Email Address" name="email" type="email" value={formData.email}
                        onChange={handleInputChange} error={errors.email}
                        placeholder="your@email.com" icon={<FiMail size={14}/>}/>
                      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
                        <Btn variant="primary" onClick={handleSaveProfile}>
                          <FiSave size={13}/> Save Changes
                        </Btn>
                        <Btn variant="ghost" onClick={handleCancelEdit}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[
                        { label:"Full Name",      value:profileData.fullName  },
                        { label:"Email Address",  value:profileData.email     },
                        { label:"Account Role",   value:null, role:profileData.role },
                      ].map((row,i,arr) => (
                        <div key={i} style={{ display:"flex", alignItems:"center",
                          padding:"16px 0", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                          <span style={{ width:160, fontSize:"0.7rem", fontWeight:700,
                            textTransform:"uppercase", letterSpacing:"0.08em", color:C.faint, flexShrink:0 }}>
                            {row.label}
                          </span>
                          {row.role ? (
                            <span style={{ display:"inline-block", padding:"3px 12px",
                              borderRadius:20, fontSize:"0.78rem", fontWeight:600,
                              background:C.blueL, border:`1px solid ${C.blueM}`, color:C.blue }}>
                              {row.role}
                            </span>
                          ) : (
                            <span style={{ fontSize:"0.9rem", color:C.body, fontWeight:500 }}>{row.value}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="pf-fu">
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s" }}>
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                  <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Preferences</h2>
                  <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Customize your experience and notifications</p>
                </div>
                <div style={{ padding:"8px 0" }}>
                  {[
                    {
                      key:"darkMode", label:"Dark Mode", desc:"Switch between light and dark interface",
                      icon: settings.darkMode ? <FiMoon size={16}/> : <FiSun size={16}/>,
                      accent:C.blue, bg:C.blueL, bdr:C.blueM,
                    },
                    {
                      key:"emailNotifications", label:"Email Notifications", desc:"Receive bill reminders and usage alerts via email",
                      icon:<FiBell size={16}/>, accent:C.green, bg:C.greenL, bdr:C.greenM,
                    },
                    {
                      key:"usageAlerts", label:"Usage Alerts", desc:"Get notified about unusual consumption patterns",
                      icon:<FiAlertTriangle size={16}/>, accent:C.amber, bg:C.amberL, bdr:C.amberM,
                    },
                  ].map((s,i,arr) => (
                    <div key={s.key} style={{ display:"flex", alignItems:"center", gap:14,
                      padding:"18px 24px",
                      borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <IconWrap color={s.accent} bg={s.bg} bdr={s.bdr}>{s.icon}</IconWrap>
                      <div style={{ flex:1 }}>
                        <h4 style={{ fontSize:"0.875rem", fontWeight:600, color:C.ink, margin:"0 0 2px" }}>{s.label}</h4>
                        <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>{s.desc}</p>
                      </div>
                      {/* Toggle */}
                      <label style={{ cursor:"pointer", flexShrink:0 }}>
                        <input type="checkbox" className="pf-toggle-input"
                          checked={settings[s.key]}
                          onChange={() => handleSettingChange(s.key)}/>
                        <span className="pf-toggle-track">
                          <span className="pf-toggle-thumb"/>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="pf-fu" style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Password card */}
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s" }}>
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                  <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Security</h2>
                  <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Manage your password and account access</p>
                </div>
                <div style={{ padding:"24px" }}>
                  {!showPasswordForm ? (
                    <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                      <IconWrap color={C.blue} bg={C.blueL} bdr={C.blueM}><FiLock size={16}/></IconWrap>
                      <div style={{ flex:1 }}>
                        <h4 style={{ fontSize:"0.875rem", fontWeight:600, color:C.ink, margin:"0 0 2px" }}>Password</h4>
                        <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Last changed 3 months ago</p>
                      </div>
                      <Btn variant="secondary" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                      </Btn>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                      <Field label="Current Password" name="currentPassword" type="password"
                        value={passwordData.currentPassword} onChange={handlePasswordChange}
                        error={errors.currentPassword} placeholder="Enter current password"
                        icon={<FiLock size={14}/>}/>
                      <Field label="New Password" name="newPassword" type="password"
                        value={passwordData.newPassword} onChange={handlePasswordChange}
                        error={errors.newPassword} placeholder="Min. 8 characters"
                        icon={<FiLock size={14}/>}/>
                      <Field label="Confirm New Password" name="confirmPassword" type="password"
                        value={passwordData.confirmPassword} onChange={handlePasswordChange}
                        error={errors.confirmPassword} placeholder="Repeat new password"
                        icon={<FiLock size={14}/>}/>
                      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
                        <Btn variant="primary" onClick={handleChangePassword}>
                          <FiShield size={13}/> Update Password
                        </Btn>
                        <Btn variant="ghost" onClick={() => { setShowPasswordForm(false); setErrors({}); }}>
                          Cancel
                        </Btn>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pf-card" style={{ background:C.card,
                border:`1px solid ${C.redM}`, borderRadius:16, overflow:"hidden",
                boxShadow:C.s1, transition:"box-shadow .2s" }}>
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.redM}`,
                  background:C.redL }}>
                  <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.red, margin:"0 0 3px" }}>Danger Zone</h2>
                  <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Irreversible account actions</p>
                </div>
                <div style={{ padding:"24px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                    <IconWrap color={C.red} bg={C.redL} bdr={C.redM}><FiLogOut size={16}/></IconWrap>
                    <div style={{ flex:1 }}>
                      <h4 style={{ fontSize:"0.875rem", fontWeight:600, color:C.ink, margin:"0 0 2px" }}>Sign Out</h4>
                      <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Sign out of your account on this device</p>
                    </div>
                    <Btn variant="danger" onClick={handleLogout}>Sign Out</Btn>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProfilePage;