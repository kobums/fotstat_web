import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Destination for unknown paths: the app for signed-in users, the public
// landing page otherwise. Routing them through a protected route instead would
// let RequireAuth overwrite the saved post-login return path with "/myteam".
export default function CatchAllRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/myteam" : "/"} replace />;
}
