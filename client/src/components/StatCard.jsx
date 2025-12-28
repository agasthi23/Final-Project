import "./StatCard.css";

function StatCard({ title, value, subtitle, color }) {
  return (
    <div className="stat-card" style={{ backgroundColor: color }}>
      <h4>{title}</h4>
      <h2>{value}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}

export default StatCard;
