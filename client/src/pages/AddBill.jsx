// src/pages/AddBill.jsx
import { useState } from "react";
import { FiArrowLeft, FiZap, FiDroplet } from "react-icons/fi";
import "./AddBill.css";

const AddBill = () => {
  const [utilityType, setUtilityType] = useState("Electricity");
  const [billingMonth, setBillingMonth] = useState("November 2025");
  const [unitsUsed, setUnitsUsed] = useState("");
  const [billAmount, setBillAmount] = useState("");

  const getUnitLabel = () => {
    return utilityType === "Electricity" ? "kWh" : "kL";
  };

  const getUnitPlaceholder = () => {
    return utilityType === "Electricity" ? "e.g., 450" : "e.g., 15.5";
  };

  const getUtilityIcon = () => {
    return utilityType === "Electricity" ? <FiZap /> : <FiDroplet />;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log({
      utilityType,
      billingMonth,
      unitsUsed,
      billAmount
    });
    
    // Show success message and reset form
    alert("Bill data submitted successfully!");
    setUnitsUsed("");
    setBillAmount("");
  };

  return (
    <div className="add-bill-container">
      {/* Header */}
      <div className="header-section">
        <a href="/dashboard" className="back-link">
          <FiArrowLeft size={18} />
          Back to Dashboard
        </a>
        <h1 className="header-title">Add Bill Data</h1>
        <p className="header-subtitle">Enter your historical utility bill information</p>
      </div>

      {/* Main Form Card */}
      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {/* Utility Type */}
          <div className="form-group">
            <label className="form-label">
              Select Utility Type
            </label>
            <div className="utility-type-selector">
              <select
                value={utilityType}
                onChange={(e) => setUtilityType(e.target.value)}
                className="form-select"
              >
                <option>Electricity</option>
                <option>Water</option>
              </select>
              <div className="utility-icon">
                {getUtilityIcon()}
              </div>
            </div>
          </div>

          {/* Billing Month */}
          <div className="form-group">
            <label className="form-label">
              Billing Month
            </label>
            <select
              value={billingMonth}
              onChange={(e) => setBillingMonth(e.target.value)}
              className="form-select"
            >
              <option>November 2025</option>
              <option>October 2025</option>
              <option>September 2025</option>
              <option>August 2025</option>
              <option>July 2025</option>
              <option>June 2025</option>
              {/* Add more months as needed */}
            </select>
          </div>

          {/* Units Used */}
          <div className="form-group">
            <label className="form-label">
              Units Used ({getUnitLabel()})
            </label>
            <input
              type="number"
              placeholder={getUnitPlaceholder()}
              value={unitsUsed}
              onChange={(e) => setUnitsUsed(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Bill Amount */}
          <div className="form-group">
            <label className="form-label">
              Bill Amount (₹)
            </label>
            <input
              type="number"
              placeholder="e.g., 4500"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-submit"
            >
              Submit Bill Data
            </button>
          </div>
        </form>
      </div>

      {/* Tips Section */}
      <div className="tips-section">
        <h3 className="tips-title">
          📋 Tips for Adding Bill Data
        </h3>
        <ul className="tips-list">
          <li>Add historical data for better predictions</li>
          <li>Enter accurate unit consumption for precise analysis</li>
          <li>Regular updates help track your usage patterns</li>
          <li>Include at least 3 months of data for trend analysis</li>
        </ul>
      </div>
    </div>
  );
};

export default AddBill;