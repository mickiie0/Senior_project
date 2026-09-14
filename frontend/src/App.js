import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EventHistory from './pages/EventHistory';
import CameraManagement from './pages/CameraManagement';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<EventHistory />} />
        <Route path="/cameras" element={<CameraManagement />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;