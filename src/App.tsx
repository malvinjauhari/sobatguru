/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import GenerateDoc from './pages/GenerateDoc';
import ViewDoc from './pages/ViewDoc';
import Landing from './pages/Landing';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="settings" element={<Settings />} />
            <Route path="generate" element={<GenerateDoc />} />
            <Route path="doc/:id" element={<ViewDoc />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
