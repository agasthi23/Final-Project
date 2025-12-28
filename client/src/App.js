import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AddBill from "./pages/AddBill";
import MainLayout from "./layout/mainlayout";
import Analytics from "./pages/Analytics";
import Prediction from "./pages/PredictionPage";

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/add-bill" element={<AddBill />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/predictions" element={<Prediction />} /> 
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
