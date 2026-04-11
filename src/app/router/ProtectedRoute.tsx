import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthorized = true;

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}