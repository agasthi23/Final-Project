// src/pages/ProfilePage.jsx
import { useState, useEffect, useCallback } from "react";
import {
  FiUser, FiMail, FiEdit2, FiSave, FiX, FiLock,
  FiLogOut, FiMoon, FiSun, FiBell, FiAlertTriangle,
  FiCamera, FiShield, FiCheck, FiLoader,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authAPI } from "../services/api";

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
    .pf-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .pf-btn-primary:hover   { background:#1d4ed8!important; }
    .pf-btn-ghost:hover     { background:rgba(255,255,255,0.05)!important; }
    .pf-btn-danger:hover    { background:#b91c1c!important; }
    .pf-logout:hover        { background:rgba(220,38,38,0.1)!important; }
    .pf-input:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(191,219,254,.5)!important; outline:none; }
    .pf-input.error { border-color:#dc2626!important; }
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
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { animation: spin 1s linear infinite; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

// Btn and Field now accept colors as props so they work outside the component
const Btn = ({ variant="secondary", onClick, children, style={}, disabled=false, colors }) => {
  const C = colors;
  const variants = {
    primary:   { bg:C.blue,  color:"#fff",   border:C.blue,    hoverCls:"pf-btn-primary"   },
    secondary: { bg:C.card,  color:C.muted,  border:C.borderB, hoverCls:"pf-btn-secondary" },
    ghost:     { bg:"transparent", color:C.muted, border:"transparent", hoverCls:"pf-btn-ghost" },
    danger:    { bg:C.red,   color:"#fff",   border:C.red,     hoverCls:"pf-btn-danger"    },
  };
  const v = variants[variant] || variants.secondary;
  return (
    <button className={v.hoverCls} onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"8px 16px",
        borderRadius:9, border:`1px solid ${v.border}`, background:v.bg, color:v.color,
        fontFamily:F, fontSize:"0.82rem", fontWeight:600, cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.6:1, transition:"all .15s", whiteSpace:"nowrap", ...style }}>
      {children}
    </button>
  );
};

const Field = ({ label, name, type="text", value, onChange, error, placeholder, icon, colors }) => {
  const C = colors;
  return (
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
};

const ProfilePage = () => {
  const { logout, updateUser } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  // ── C is now INSIDE the component so it reacts to darkMode ──
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
    blueL:   darkMode ? "rgba(37,99,235,0.15)"  : "#eff6ff",
    blueM:   darkMode ? "#1e3a8a"               : "#bfdbfe",
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
    s1: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2: "0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3: "0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  };

  // State
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({ fullName: "", email: "", role: "Account Owner" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ fullName: "", email: "" });
  const [settings, setSettings] = useState({ emailNotifications: true, usageAlerts: true });
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data?.success && res.data.user) {
        const userData = res.data.user;
        setProfileData({ fullName: userData.name || "", email: userData.email || "", role: "Account Owner" });
        setFormData({ fullName: userData.name || "", email: userData.email || "" });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      showNotification("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const res = await authAPI.getPreferences();
      if (res.data?.success) {
        const prefs = res.data.preferences;
        setSettings({ emailNotifications: prefs.emailNotifications, usageAlerts: prefs.usageAlerts });
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  }, []);

  useEffect(() => { loadProfile(); loadPreferences(); }, [loadProfile, loadPreferences]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSettingChange = async (setting) => {
    if (setting === "darkMode") { toggleDarkMode(); return; }
    const newSettings = { ...settings, [setting]: !settings[setting] };
    setSettings(newSettings);
    try {
      await authAPI.updatePreferences({ [setting]: newSettings[setting] });
      showNotification(`${setting} updated`);
    } catch (error) {
      console.error("Failed to save preference:", error);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
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
    else if (passwordData.newPassword.length < 6) newErrors.newPassword = "Minimum 6 characters";
    if (!passwordData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfileForm()) return;
    setSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: formData.fullName, email: formData.email });
      if (res.data?.success) {
        setProfileData({ ...profileData, fullName: formData.fullName, email: formData.email });
        setIsEditingProfile(false);
        showNotification("Profile updated successfully!");
        if (updateUser) updateUser({ name: formData.fullName, email: formData.email });
      }
    } catch (error) {
      showNotification(error?.response?.data?.message || "Failed to update profile", "error");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    setSaving(true);
    try {
      const res = await authAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      if (res.data?.success) {
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordForm(false);
        showNotification("Password changed successfully! Please login again.");
        setTimeout(() => logout(), 2000);
      }
    } catch (error) {
      showNotification(error?.response?.data?.message || "Failed to change password", "error");
    } finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setFormData({ fullName: profileData.fullName, email: profileData.email });
    setErrors({});
    setIsEditingProfile(false);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showNotification('Please select an image file', 'error'); return; }
    if (file.size > 2 * 1024 * 1024) { showNotification('Image must be less than 2MB', 'error'); return; }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        const res = await authAPI.updateProfilePicture(base64String);
        if (res.data?.success) { setProfilePicture(base64String); showNotification('Profile picture updated!'); }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showNotification('Failed to upload profile picture', 'error');
    } finally { setUploading(false); }
  };

  const initials = profileData.fullName
    ? profileData.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  // IconWrap also needs C — defined inside component so it has access
  const IconWrap = ({ color, bg, bdr, children }) => (
    <div style={{ width:38, height:38, borderRadius:10, display:"flex", alignItems:"center",
      justifyContent:"center", background:bg, border:`1px solid ${bdr}`,
      color, flexShrink:0 }}>{children}</div>
  );

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, color:C.muted }}>
          <div style={{ width:18, height:18, border:`2px solid ${C.border}`,
            borderTopColor:C.blue, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
          Loading profile...
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {notification.message && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999,
          display:"flex", alignItems:"center", gap:10,
          background: notification.type === "error" ? C.red : C.green,
          color:"#fff", padding:"12px 18px", borderRadius:12,
          boxShadow:C.s3, fontFamily:F, fontSize:"0.875rem", fontWeight:500,
          animation:"profFadeUp .3s ease" }}>
          <FiCheck size={16}/>
          <span>{notification.message}</span>
          <button onClick={() => setNotification({ message:"", type:"" })}
            style={{ background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,.7)", display:"flex", padding:0, marginLeft:4 }}>
            <FiX size={14}/>
          </button>
        </div>
      )}

      <input type="file" id="profile-picture-input" accept="image/*"
        style={{ display: 'none' }} onChange={handleProfilePictureUpload} />

      <div className="pf-fu" style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
          margin:"0 0 5px", letterSpacing:"-0.03em" }}>Account Settings</h1>
        <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
          Manage your profile, preferences, and security
        </p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20, alignItems:"start" }}>

        {/* SIDEBAR */}
        <aside style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:16, overflow:"hidden", boxShadow:C.s1, position:"sticky", top:24,
          transition:"background 0.3s ease, border-color 0.3s ease" }}>
          <div style={{ padding:"24px 20px 20px", borderBottom:`1px solid ${C.border}`,
            display:"flex", flexDirection:"column", alignItems:"center", gap:10, textAlign:"center" }}>
            <div style={{ position:"relative", display:"inline-block" }}>
              <div style={{ width:72, height:72, borderRadius:"50%",
                background: profilePicture ? `url(${profilePicture})` : `linear-gradient(135deg,#2563eb,#7c3aed)`,
                backgroundSize:'cover', backgroundPosition:'center',
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.5rem", fontWeight:800, color:"#fff", letterSpacing:"-0.5px" }}>
                {!profilePicture && initials}
              </div>
              <button title="Change photo"
                onClick={() => document.getElementById('profile-picture-input').click()}
                disabled={uploading}
                style={{ position:"absolute", bottom:0, right:0, width:26, height:26,
                  borderRadius:"50%", background:C.card, border:`2px solid ${C.page}`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:C.muted, cursor: uploading ? "not-allowed" : "pointer",
                  boxShadow:C.s1, opacity: uploading ? 0.6 : 1 }}>
                {uploading ? <FiLoader size={12} className="spinner"/> : <FiCamera size={12}/>}
              </button>
            </div>
            <div>
              <p style={{ fontSize:"0.95rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>
                {profileData.fullName}
              </p>
              <p style={{ fontSize:"0.75rem", color:C.muted, margin:0 }}>{profileData.role}</p>
            </div>
          </div>

          <nav style={{ padding:"12px 10px" }}>
            {[
              { id:"profile",     icon:<FiUser size={16}/>,   label:"Profile"     },
              { id:"preferences", icon:<FiBell size={16}/>,   label:"Preferences" },
              { id:"security",    icon:<FiShield size={16}/>, label:"Security"    },
            ].map(item => (
              <button key={item.id}
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

          <div style={{ padding:"10px 10px 14px", borderTop:`1px solid ${C.border}` }}>
            <button className="pf-logout" onClick={() => logout()}
              style={{ display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"10px 14px", borderRadius:10, border:"none", fontFamily:F,
                fontSize:"0.875rem", fontWeight:600, cursor:"pointer", textAlign:"left",
                background:"transparent", color:C.red, transition:"all .15s" }}>
              <FiLogOut size={16} style={{ flexShrink:0 }}/> Sign Out
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main>
          {activeTab === "profile" && (
            <div className="pf-fu" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s, background 0.3s ease" }}>
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}`,
                  display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Personal Information</h2>
                    <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Update your name and email address</p>
                  </div>
                  {!isEditingProfile && (
                    <Btn colors={C} variant="secondary" onClick={() => setIsEditingProfile(true)}>
                      <FiEdit2 size={13}/> Edit
                    </Btn>
                  )}
                </div>
                <div style={{ padding:"24px" }}>
                  {isEditingProfile ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                      <Field colors={C} label="Full Name" name="fullName" value={formData.fullName}
                        onChange={handleInputChange} error={errors.fullName}
                        placeholder="Your full name" icon={<FiUser size={14}/>}/>
                      <Field colors={C} label="Email Address" name="email" type="email" value={formData.email}
                        onChange={handleInputChange} error={errors.email}
                        placeholder="your@email.com" icon={<FiMail size={14}/>}/>
                      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
                        <Btn colors={C} variant="primary" onClick={handleSaveProfile} disabled={saving}>
                          <FiSave size={13}/> {saving ? "Saving..." : "Save Changes"}
                        </Btn>
                        <Btn colors={C} variant="ghost" onClick={handleCancelEdit}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column" }}>
                      {[
                        { label:"Full Name", value:profileData.fullName },
                        { label:"Email Address", value:profileData.email },
                        { label:"Account Role", role:profileData.role },
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

          {activeTab === "preferences" && (
            <div className="pf-fu">
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s, background 0.3s ease" }}>
                <div style={{ padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                  <h2 style={{ fontSize:"1rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Preferences</h2>
                  <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Customize your experience and notifications</p>
                </div>
                <div style={{ padding:"8px 0" }}>
                  {[
                    { key:"darkMode", label:"Dark Mode", desc:"Switch between light and dark interface",
                      icon: darkMode ? <FiMoon size={16}/> : <FiSun size={16}/>,
                      accent:C.blue, bg:C.blueL, bdr:C.blueM },
                    { key:"emailNotifications", label:"Email Notifications", desc:"Receive bill reminders and usage alerts via email",
                      icon:<FiBell size={16}/>, accent:C.green, bg:C.greenL, bdr:C.greenM },
                    { key:"usageAlerts", label:"Usage Alerts", desc:"Get notified about unusual consumption patterns",
                      icon:<FiAlertTriangle size={16}/>, accent:C.amber, bg:C.amberL, bdr:C.amberM },
                  ].map((s,i,arr) => (
                    <div key={s.key} style={{ display:"flex", alignItems:"center", gap:14,
                      padding:"18px 24px", borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                      <IconWrap color={s.accent} bg={s.bg} bdr={s.bdr}>{s.icon}</IconWrap>
                      <div style={{ flex:1 }}>
                        <h4 style={{ fontSize:"0.875rem", fontWeight:600, color:C.ink, margin:"0 0 2px" }}>{s.label}</h4>
                        <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>{s.desc}</p>
                      </div>
                      <label style={{ cursor:"pointer", flexShrink:0 }}>
                        <input type="checkbox" className="pf-toggle-input"
                          checked={s.key === "darkMode" ? darkMode : settings[s.key]}
                          onChange={() => handleSettingChange(s.key)}/>
                        <span className="pf-toggle-track"><span className="pf-toggle-thumb"/></span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="pf-fu" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="pf-card" style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:16, overflow:"hidden", boxShadow:C.s1, transition:"box-shadow .2s, background 0.3s ease" }}>
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
                        <p style={{ fontSize:"0.78rem", color:C.muted, margin:0 }}>Change your password</p>
                      </div>
                      <Btn colors={C} variant="secondary" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                      </Btn>
                    </div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
                      <Field colors={C} label="Current Password" name="currentPassword" type="password"
                        value={passwordData.currentPassword} onChange={handlePasswordChange}
                        error={errors.currentPassword} placeholder="Enter current password" icon={<FiLock size={14}/>}/>
                      <Field colors={C} label="New Password" name="newPassword" type="password"
                        value={passwordData.newPassword} onChange={handlePasswordChange}
                        error={errors.newPassword} placeholder="Min. 6 characters" icon={<FiLock size={14}/>}/>
                      <Field colors={C} label="Confirm New Password" name="confirmPassword" type="password"
                        value={passwordData.confirmPassword} onChange={handlePasswordChange}
                        error={errors.confirmPassword} placeholder="Repeat new password" icon={<FiLock size={14}/>}/>
                      <div style={{ display:"flex", gap:10, paddingTop:4 }}>
                        <Btn colors={C} variant="primary" onClick={handleChangePassword} disabled={saving}>
                          <FiShield size={13}/> {saving ? "Updating..." : "Update Password"}
                        </Btn>
                        <Btn colors={C} variant="ghost" onClick={() => { setShowPasswordForm(false); setErrors({}); }}>
                          Cancel
                        </Btn>
                      </div>
                    </div>
                  )}
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