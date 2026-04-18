import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getAdminSession } from "../../lib/api/adminAuth";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      try {
        const session = await getAdminSession();

        if (isMounted) {
          setIsAuthorized(session.isAuthorized);
        }
      } catch {
        if (isMounted) {
          setIsAuthorized(false);
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isChecking) {
    return <p style={{ padding: "24px" }}>Проверка доступа...</p>;
  }

  if (!isAuthorized) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}