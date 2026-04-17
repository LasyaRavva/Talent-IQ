import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import AiCoachPage from "./pages/AiCoachPage";
import ResumeCheckerPage from "./pages/ResumeCheckerPage";
import ServicesPage from "./pages/ServicesPage";
import HelpChatWidget from "./components/HelpChatWidget";
import { setAuthTokenGetter, setAuthUserGetter } from "./lib/axios";

function RootRoute({ isSignedIn }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectPath = params.get("redirect");

  if (!isSignedIn) return <HomePage />;

  // Only allow in-app relative paths to avoid open redirect issues.
  if (redirectPath && redirectPath.startsWith("/")) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

function RequireAuth({ isSignedIn, children }) {
  const location = useLocation();

  if (isSignedIn) return children;

  const destination = `${location.pathname}${location.search || ""}`;
  return <Navigate to={`/?redirect=${encodeURIComponent(destination)}`} replace />;
}

function App() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const previousUserIdRef = useRef(null);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isSignedIn) return null;
      return getToken();
    });

    setAuthUserGetter(() => {
      if (!isSignedIn) return null;
      return window.Clerk?.user || null;
    });

    return () => {
      setAuthTokenGetter(null);
      setAuthUserGetter(null);
    };
  }, [getToken, isSignedIn]);

  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;

    if (previousUserId && currentUserId && previousUserId !== currentUserId) {
      queryClient.removeQueries({
        predicate: (query) => {
          const [rootKey] = query.queryKey;
          return rootKey === "activeSessions" || rootKey === "myRecentSessions" || rootKey === "session";
        },
      });
      sessionStorage.removeItem("liveSession");
    }

    previousUserIdRef.current = currentUserId;
  }, [queryClient, user?.id]);

  // this will get rid of the flickering effect
  if (!isLoaded) return null;

  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute isSignedIn={isSignedIn} />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/ai-coach"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <AiCoachPage />
            </RequireAuth>
          }
        />
        <Route
          path="/resume-checker"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <ResumeCheckerPage />
            </RequireAuth>
          }
        />

        <Route
          path="/problems"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <ProblemsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/problem/:id"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <ProblemPage />
            </RequireAuth>
          }
        />
        <Route
          path="/session/:id"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <SessionPage />
            </RequireAuth>
          }
        />
        <Route
          path="/session/live"
          element={
            <RequireAuth isSignedIn={isSignedIn}>
              <SessionPage />
            </RequireAuth>
          }
        />
      </Routes>

      <HelpChatWidget />
      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
