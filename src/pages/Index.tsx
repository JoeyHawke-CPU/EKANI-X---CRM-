import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import RepDashboard from "./RepDashboard";
import AdminDashboard from "./AdminDashboard";

const Index = () => {
  const { role, loading, session } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") return <AdminDashboard />;
  return <RepDashboard />;
};

export default Index;
