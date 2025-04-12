import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Products from './pages/Products';
import RawMaterials from './pages/RawMaterials';
import Payments from './pages/Payments';
import JobWork from './pages/JobWork';
import ManageUsers from './pages/ManageUsers';
import Orders from './pages/Orders';
import QualityCheck from './pages/QualityCheck';
import WastageTracking from './pages/WastageTracking';
import Dispatch from './pages/Dispatch';
import RecordSales from './pages/RecordSales';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  className="h-10 w-10"
                />
                <span className="ml-2 text-xl font-bold text-gray-800 hidden md:block">
                  Biowaste Solution
                </span>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />}>
            <Route path="inventory" element={<Inventory />} />
            <Route path="record-sales" element={<RecordSales />} />
            <Route path="products" element={<Products />} />
            <Route path="raw-materials" element={<RawMaterials />} />
            <Route path="payments" element={<Payments />} />
            <Route path="job-work" element={<JobWork />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="orders" element={<Orders />} />
            <Route path="quality-check" element={<QualityCheck />} />
            <Route path="wastage" element={<WastageTracking />} />
            <Route path="dispatch" element={<Dispatch />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;