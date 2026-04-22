import { Outlet } from "react-router-dom";
import { FloatingBookingCta } from "../sections/FloatingBookingCta/FloatingBookingCta";

export function PublicLayout() {
  return (
    <>
      <Outlet />
      <FloatingBookingCta />
    </>
  );
}
