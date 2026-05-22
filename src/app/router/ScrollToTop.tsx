import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname, search } = useLocation();
  const previousLocationKeyRef = useRef(`${pathname}${search}`);

  useEffect(() => {
    const currentLocationKey = `${pathname}${search}`;

    if (previousLocationKeyRef.current === currentLocationKey) {
      return;
    }

    previousLocationKeyRef.current = currentLocationKey;

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [pathname, search]);

  return null;
}