import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { initScrollGoals } from "../../lib/analytics/scrollGoals";
import {
  destroyYandexMetrika,
  initYandexMetrika,
  trackPageView,
} from "../../lib/analytics/yandexMetrika";

export function YandexMetrikaRouteTracker() {
  const { pathname } = useLocation();
  const previousPublicPathRef = useRef<string | null>(null);

  useEffect(() => {
    const isAdminRoute =
      pathname === "/admin" || pathname.startsWith("/admin/");

    if (isAdminRoute) {
      destroyYandexMetrika();
      previousPublicPathRef.current = null;

      return;
    }

    initYandexMetrika();

    trackPageView(pathname, {
      title: document.title,
      referer:
        previousPublicPathRef.current ??
        document.referrer ??
        undefined,
    });

    previousPublicPathRef.current = pathname;

    const cleanupScrollGoals = initScrollGoals();

    return () => {
      cleanupScrollGoals();
    };
  }, [pathname]);

  return null;
}