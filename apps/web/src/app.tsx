import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { PlaceholderPage } from "./pages/placeholder-page";

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PlaceholderPage title="관제" />} />
      <Route
        path="/connections"
        element={<PlaceholderPage title="연결 설정" />}
      />
      <Route
        path="/logs"
        element={<PlaceholderPage title="로그·알람 이력" />}
      />
      <Route path="/faults" element={<PlaceholderPage title="장애 주입" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
