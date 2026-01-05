import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export function ProtectedRoute({ children, requireAdmin }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, loading, isAdmin, profile } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if ((profile as any)?.is_banned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 text-center">
          <h1 className="font-display text-2xl text-foreground">Account restricted</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Your account has been restricted. If you believe this is a mistake, contact support.
          </p>
          {(profile as any)?.ban_reason && (
            <div className="mt-4 text-left bg-muted/50 border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reason</p>
              <p className="text-sm text-foreground mt-1">{(profile as any).ban_reason}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
