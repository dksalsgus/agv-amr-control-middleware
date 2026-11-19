import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/require-auth";
import { LoginPage } from "./pages/login-page";
import { MonitorPage } from "./pages/monitor-page";
import { ConnectionsPage } from "./pages/connections-page";
import { PlaceholderPage } from "./pages/placeholder-page";

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <MonitorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/connections"
        element={
          <RequireAuth>
            <ConnectionsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/logs"
        element={
          <RequireAuth>
            <PlaceholderPage title="로그·알람 이력" />
          </RequireAuth>
        }
      />
      <Route
        path="/faults"
        element={
          <RequireAuth>
            <PlaceholderPage title="장애 주입" />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
