import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { siteSettings } from "../../data/siteSettings";
import {
  canRenderFloatingBookingCta,
  getBookingTarget,
} from "../../lib/booking/getBookingTarget";
import styles from "./FloatingBookingCta.module.css";

export function FloatingBookingCta() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const bookingTarget = getBookingTarget();
  const { enabled, revealMode, scrollOffsetPx } = siteSettings.booking.floatingCta;
  const [isVisible, setIsVisible] = useState(revealMode === "immediate");

  useEffect(() => {
    if (!enabled || !canRenderFloatingBookingCta(pathname)) {
      setIsVisible(false);
      return;
    }

    if (revealMode === "immediate") {
      setIsVisible(true);
      return;
    }

    const updateVisibility = () => {
      setIsVisible(window.scrollY >= scrollOffsetPx);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateVisibility);
    };
  }, [enabled, pathname, revealMode, scrollOffsetPx]);

  if (!isVisible || !canRenderFloatingBookingCta(pathname)) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <Button href={bookingTarget} variant="primary" className={styles.button}>
        {t.ui.buttons.book}
      </Button>
    </div>
  );
}
