import { siteSettings } from "../../data/siteSettings";
import {
  trackScroll25,
  trackScroll50,
  trackScroll75,
  trackScroll100,
} from "./trackers";

export function initScrollGoals() {
  if (!siteSettings.analytics.enabled) {
    return () => {};
  }

  const fired = {
    scroll25: false,
    scroll50: false,
    scroll75: false,
    scroll100: false,
  };

  const handleScroll = () => {
    const scrollTop =
      window.scrollY || document.documentElement.scrollTop || 0;

    const viewportHeight = window.innerHeight;
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    if (documentHeight <= 0) return;

    const viewedPercent = Math.min(
      100,
      ((scrollTop + viewportHeight) / documentHeight) * 100
    );

    if (viewedPercent >= 25 && !fired.scroll25) {
      fired.scroll25 = true;
      trackScroll25();
    }

    if (viewedPercent >= 50 && !fired.scroll50) {
      fired.scroll50 = true;
      trackScroll50();
    }

    if (viewedPercent >= 75 && !fired.scroll75) {
      fired.scroll75 = true;
      trackScroll75();
    }

    if (viewedPercent >= 100 && !fired.scroll100) {
      fired.scroll100 = true;
      trackScroll100();
    }
  };

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", handleScroll);
  handleScroll();

  return () => {
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", handleScroll);
  };
}