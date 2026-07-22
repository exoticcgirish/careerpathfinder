import { Navigate, Route, Routes, Link, useNavigate } from "react-router-dom";
import { Compass, LogOut } from "lucide-react";
import Login from "./pages/Login.jsx";
import Assessment from "./pages/Assessment.jsx";
import RoadmapView from "./pages/RoadmapView.jsx";
import { auth } from "./services/api.js";

function RequireAuth({ children }) {
  if (!auth.isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function Header() {
  const navigate = useNavigate();
  const authed = auth.isAuthenticated();
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-slate-900">
          <Compass className="h-6 w-6 text-brand-600" />
          <span className="font-semibold">Career PathFinder</span>
        </Link>
        {authed && (
          <button
            onClick={() => {
              auth.logout();
              navigate("/login");
            }}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Assessment />
              </RequireAuth>
            }
          />
          <Route
            path="/roadmap/:id"
            element={
              <RequireAuth>
                <RoadmapView />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
