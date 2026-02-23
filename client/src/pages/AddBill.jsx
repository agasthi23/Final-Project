// src/pages/AddBill.jsx
import { useState } from "react";
import { FiZap, FiDroplet } from "react-icons/fi";
import "./AddBill.css";

const AddBill = () => {
  const [utilityType, setUtilityType] = useState("Electricity");
  const [billingMonth, setBillingMonth] = useState("");
  const [unitsUsed, setUnitsUsed] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [bills, setBills] = useState([]);

  const getUnitLabel = () => {
    return utilityType === "Electricity" ? "kWh" : "kL";
  };

  const costPerUnit =
    unitsUsed && billAmount
      ? (billAmount / unitsUsed).toFixed(2)
      : null;

  const averageUsage =
    bills.length > 0
      ? (
          bills.reduce((sum, bill) => sum + Number(bill.unitsUsed), 0) /
          bills.length
        ).toFixed(2)
      : null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const newBill = {
      id: Date.now(),
      utilityType,
      billingMonth,
      unitsUsed,
      billAmount
    };

    setBills([newBill, ...bills]);

    setUnitsUsed("");
    setBillAmount("");
    setBillingMonth("");
  };

  const handleDelete = (id) => {
    setBills(bills.filter((bill) => bill.id !== id));
  };

  return (
    <div className="billing-page">

      {/* Page Header */}
      <div className="page-header">
        <h1>Billing</h1>
        <p>Manage and analyze your utility bills</p>
      </div>

      {/* Top Section */}
      <div className="billing-top-section">

        {/* Form Section */}
        <div className="billing-form-card">
          <h2>Add New Bill</h2>

          <form onSubmit={handleSubmit}>

            {/* Utility Toggle */}
            <div className="utility-toggle">
              <button
                type="button"
                className={utilityType === "Electricity" ? "active" : ""}
                onClick={() => setUtilityType("Electricity")}
              >
                <FiZap /> Electricity
              </button>

              <button
                type="button"
                className={utilityType === "Water" ? "active" : ""}
                onClick={() => setUtilityType("Water")}
              >
                <FiDroplet /> Water
              </button>
            </div>

            <div className="form-group">
              <label>Billing Month</label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Units Used ({getUnitLabel()})</label>
              <input
                type="number"
                value={unitsUsed}
                onChange={(e) => setUnitsUsed(e.target.value)}
                placeholder="Enter units"
                required
              />
            </div>

            <div className="form-group">
              <label>Bill Amount (₹)</label>
              <input
                type="number"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>

            {costPerUnit && (
              <div className="cost-preview">
                Cost per Unit: ₹ {costPerUnit}
              </div>
            )}

            <button type="submit" className="submit-btn">
              Submit Bill
            </button>

          </form>
        </div>

        {/* Insights Section */}
        <div className="billing-insights-card">
          <h2>Quick Insights</h2>

          <div className="insight-item">
            <span>Total Bills</span>
            <strong>{bills.length}</strong>
          </div>

          <div className="insight-item">
            <span>Average Usage</span>
            <strong>
              {averageUsage ? `${averageUsage} ${getUnitLabel()}` : "--"}
            </strong>
          </div>

          <div className="insight-item">
            <span>Latest Cost per Unit</span>
            <strong>
              {costPerUnit ? `₹ ${costPerUnit}` : "--"}
            </strong>
          </div>
        </div>
      </div>

      {/* Billing History Table */}
      <div className="billing-history-card">
        <h2>Billing History</h2>

        {bills.length === 0 ? (
          <p className="empty-text">No bills added yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Type</th>
                <th>Units</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{bill.billingMonth}</td>
                  <td>{bill.utilityType}</td>
                  <td>{bill.unitsUsed}</td>
                  <td>₹ {bill.billAmount}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(bill.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

export default AddBill;
