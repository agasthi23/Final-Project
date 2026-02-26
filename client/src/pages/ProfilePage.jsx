// src/pages/ProfilePage.jsx
import { useState, useEffect } from "react";
import {
  FiUser, FiMail, FiEdit2, FiSave, FiX, FiLock,
  FiLogOut, FiMoon, FiSun, FiBell, FiAlertTriangle,
  FiCamera, FiShield, FiCheck
} from "react-icons/fi";
import "./Profile.css";

const ProfilePage = () => {
  const [profileData, setProfileData] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    role: "Account Owner",
    avatar: null,
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ ...profileData });

  const [settings, setSettings] = useState({
    darkMode: false,
    emailNotifications: true,
    usageAlerts: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ message: "", type: "" });
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", settings.darkMode);
  }, [settings.darkMode]);

  useEffect(() => {
    setFormData({ ...profileData });
  }, [profileData]);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const handleSettingChange = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] });
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
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordForm(false);
      showNotification("Password changed successfully!");
    }
  };

  const handleLogout = () => console.log("Logout");
  const handleCancelEdit = () => {
    setFormData({ ...profileData });
    setErrors({});
    setIsEditingProfile(false);
  };

  const initials = profileData.fullName.split(" ").map(n => n[0]).join("").toUpperCase();

  return (
    <div className="profile-page">
      {/* Toast Notification */}
      {notification.message && (
        <div className={`toast toast--${notification.type}`}>
          <FiCheck className="toast__icon" />
          <span>{notification.message}</span>
          <button className="toast__close" onClick={() => setNotification({ message: "", type: "" })}>
            <FiX />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your profile, preferences, and security</p>
        </div>
      </div>

      <div className="profile-layout">
        {/* Sidebar Navigation */}
        <aside className="profile-sidebar">
          <div className="sidebar-avatar">
            <div className="avatar-circle">
              {profileData.avatar
                ? <img src={profileData.avatar} alt="Profile" />
                : <span className="avatar-initials">{initials}</span>
              }
              <button className="avatar-edit-btn" title="Change photo">
                <FiCamera />
              </button>
            </div>
            <div className="sidebar-user-info">
              <p className="sidebar-name">{profileData.fullName}</p>
              <p className="sidebar-role">{profileData.role}</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${activeTab === "profile" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <FiUser /> Profile
            </button>
            <button
              className={`nav-item ${activeTab === "preferences" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("preferences")}
            >
              <FiBell /> Preferences
            </button>
            <button
              className={`nav-item ${activeTab === "security" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              <FiShield /> Security
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <FiLogOut size={17} color="#ef4444" style={{flexShrink:0}} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="profile-main">

          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Personal Information</h2>
                    <p className="card-subtitle">Update your name and email address</p>
                  </div>
                  {!isEditingProfile && (
                    <button className="btn btn--secondary" onClick={() => setIsEditingProfile(true)}>
                      <FiEdit2 /> Edit
                    </button>
                  )}
                </div>

                <div className="card-body">
                  {isEditingProfile ? (
                    <div className="form-grid">
                      <div className="form-field">
                        <label className="field-label">Full Name</label>
                        <div className="input-wrapper">
                          <FiUser className="input-icon" />
                          <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`field-input ${errors.fullName ? "field-input--error" : ""}`}
                            placeholder="Your full name"
                          />
                        </div>
                        {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                      </div>

                      <div className="form-field">
                        <label className="field-label">Email Address</label>
                        <div className="input-wrapper">
                          <FiMail className="input-icon" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`field-input ${errors.email ? "field-input--error" : ""}`}
                            placeholder="your@email.com"
                          />
                        </div>
                        {errors.email && <span className="field-error">{errors.email}</span>}
                      </div>

                      <div className="form-actions">
                        <button className="btn btn--primary" onClick={handleSaveProfile}>
                          <FiSave /> Save Changes
                        </button>
                        <button className="btn btn--ghost" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="profile-display">
                      <div className="profile-field">
                        <span className="profile-field__label">Full Name</span>
                        <span className="profile-field__value">{profileData.fullName}</span>
                      </div>
                      <div className="profile-field">
                        <span className="profile-field__label">Email Address</span>
                        <span className="profile-field__value">{profileData.email}</span>
                      </div>
                      <div className="profile-field">
                        <span className="profile-field__label">Account Role</span>
                        <span className="profile-field__value">
                          <span className="role-badge">{profileData.role}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PREFERENCES TAB */}
          {activeTab === "preferences" && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Preferences</h2>
                    <p className="card-subtitle">Customize your experience and notifications</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="settings-list">
                    <div className="setting-row">
                      <div className="setting-icon-wrap setting-icon-wrap--blue">
                        {settings.darkMode ? <FiMoon /> : <FiSun />}
                      </div>
                      <div className="setting-text">
                        <h4>Dark Mode</h4>
                        <p>Switch between light and dark interface</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.darkMode}
                          onChange={() => handleSettingChange("darkMode")}
                        />
                        <span className="toggle__track">
                          <span className="toggle__thumb" />
                        </span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-icon-wrap setting-icon-wrap--green">
                        <FiBell />
                      </div>
                      <div className="setting-text">
                        <h4>Email Notifications</h4>
                        <p>Receive bill reminders and usage alerts via email</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.emailNotifications}
                          onChange={() => handleSettingChange("emailNotifications")}
                        />
                        <span className="toggle__track">
                          <span className="toggle__thumb" />
                        </span>
                      </label>
                    </div>

                    <div className="setting-row">
                      <div className="setting-icon-wrap setting-icon-wrap--amber">
                        <FiAlertTriangle />
                      </div>
                      <div className="setting-text">
                        <h4>Usage Alerts</h4>
                        <p>Get notified about unusual consumption patterns</p>
                      </div>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={settings.usageAlerts}
                          onChange={() => handleSettingChange("usageAlerts")}
                        />
                        <span className="toggle__track">
                          <span className="toggle__thumb" />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="tab-content">
              <div className="card">
                <div className="card-header">
                  <div>
                    <h2 className="card-title">Security</h2>
                    <p className="card-subtitle">Manage your password and account access</p>
                  </div>
                </div>
                <div className="card-body">
                  {!showPasswordForm ? (
                    <div className="security-row">
                      <div className="security-row__info">
                        <div className="setting-icon-wrap setting-icon-wrap--blue">
                          <FiLock />
                        </div>
                        <div>
                          <h4>Password</h4>
                          <p>Last changed 3 months ago</p>
                        </div>
                      </div>
                      <button className="btn btn--secondary" onClick={() => setShowPasswordForm(true)}>
                        Change Password
                      </button>
                    </div>
                  ) : (
                    <div className="password-form">
                      <div className="form-grid">
                        <div className="form-field">
                          <label className="field-label">Current Password</label>
                          <div className="input-wrapper">
                            <FiLock className="input-icon" />
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`field-input ${errors.currentPassword ? "field-input--error" : ""}`}
                              placeholder="Enter current password"
                            />
                          </div>
                          {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
                        </div>

                        <div className="form-field">
                          <label className="field-label">New Password</label>
                          <div className="input-wrapper">
                            <FiLock className="input-icon" />
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`field-input ${errors.newPassword ? "field-input--error" : ""}`}
                              placeholder="Min. 8 characters"
                            />
                          </div>
                          {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
                        </div>

                        <div className="form-field">
                          <label className="field-label">Confirm New Password</label>
                          <div className="input-wrapper">
                            <FiLock className="input-icon" />
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`field-input ${errors.confirmPassword ? "field-input--error" : ""}`}
                              placeholder="Repeat new password"
                            />
                          </div>
                          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                        </div>

                        <div className="form-actions">
                          <button className="btn btn--primary" onClick={handleChangePassword}>
                            <FiShield /> Update Password
                          </button>
                          <button className="btn btn--ghost" onClick={() => { setShowPasswordForm(false); setErrors({}); }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card card--danger">
                <div className="card-header">
                  <div>
                    <h2 className="card-title card-title--danger">Danger Zone</h2>
                    <p className="card-subtitle">Irreversible account actions</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="security-row">
                    <div className="security-row__info">
                      <div className="setting-icon-wrap setting-icon-wrap--red">
                        <FiLogOut />
                      </div>
                      <div>
                        <h4>Sign Out</h4>
                        <p>Sign out of your account on this device</p>
                      </div>
                    </div>
                    <button className="btn btn--danger" onClick={handleLogout}>
                      Sign Out
                    </button>
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