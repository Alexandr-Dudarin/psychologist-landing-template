import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { siteSettings } from "../../data/siteSettings";
import {
  canRenderFloatingBookingCta,
  getBookingTarget,
} from "../../lib/booking/getBookingTarget";
import { playBookingCtaFeedback } from "../../lib/feedback/bookingFeedback";
import styles from "./FloatingBookingCta.module.css";

function getAdaptiveScrollOffset(scrollOffsetPx: number) {
  const isMobileOrTablet = window.matchMedia("(max-width: 960px)").matches;

  if (!isMobileOrTablet) {
    return scrollOffsetPx;
  }

  return Math.max(scrollOffsetPx, Math.round(window.innerHeight * 0.68));
}

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
      const adaptiveScrollOffset = getAdaptiveScrollOffset(scrollOffsetPx);

      setIsVisible(window.scrollY >= adaptiveScrollOffset);
    };

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, [enabled, pathname, revealMode, scrollOffsetPx]);

  if (!isVisible || !canRenderFloatingBookingCta(pathname)) {
    return null;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.button}>
        <Button
          href={bookingTarget}
          variant="premium"
          onClick={playBookingCtaFeedback}
        >
          {t.ui.buttons.book}
        </Button>
      </div>
    </div>
  );
}