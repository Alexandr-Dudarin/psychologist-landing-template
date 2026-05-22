import { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { useLanguage } from "../app/providers/LanguageProvider";
import { AdminButton } from "../components/admin/AdminButton";
import { AdminFeedback } from "../components/admin/AdminFeedback";
import { siteSettings } from "../data/siteSettings";
import { logoutAdmin } from "../lib/api/adminAuth";
import styles from "./AdminLayout.module.css";

type AdminNavItem = {
  to: string;
  label: string;
  end?: boolean;
  isBackToSite?: boolean;
};

const mobileMenuId = "admin-mobile-menu";

function isAdminNavItemActive(pathname: string, item: AdminNavItem) {
  if (item.isBackToSite) {
    return false;
  }

  if (item.end) {
    return pathname === item.to;
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function AdminLayout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef<HTMLDivElement | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = useMemo<AdminNavItem[]>(() => {
    const items: AdminNavItem[] = [
      {
        to: "/admin",
        label: t.admin.layout.nav.dashboard,
        end: true,
      },
      {
        to: "/admin/requests",
        label: t.admin.layout.nav.requests,
      },
      {
        to: "/admin/clients",
        label: t.admin.layout.nav.clients,
      },
      {
        to: "/admin/services",
        label: t.admin.layout.nav.services,
      },
      {
        to: "/admin/sessions",
        label: t.admin.layout.nav.sessions,
      },
      {
        to: "/admin/notes",
        label: t.admin.layout.nav.notes,
      },
      {
        to: "/admin/schedule",
        label: t.admin.layout.nav.schedule,
      },
    ];

    if (siteSettings.premiumModules.scheduler.enabled) {
      items.push({
        to: "/admin/scheduler",
        label: "Планировщик",
      });
    }

    items.push(
      {
        to: "/admin/help",
        label: "Инструкция",
      },
      {
        to: "/",
        label: t.admin.layout.nav.backToSite,
        isBackToSite: true,
      }
    );

    return items;
  }, [t.admin.layout.nav]);

  const currentSectionLabel =
    navItems.find((item) => isAdminNavItemActive(location.pathname, item))
      ?.label ?? "Админка";

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError("");

    try {
      await logoutAdmin();
      navigate("/admin/login", { replace: true });
    } catch (logoutError) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : "Не удалось выйти из админки."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen((current) => !current);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    handleCloseMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!headerRef.current) {
        return;
      }

      if (!headerRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className={styles.layout}>
      <div ref={headerRef} className={styles.header}>
        <div className={styles.desktopHeader}>
          <nav className={styles.desktopNav} aria-label="Навигация админки">
            {navItems.map((item) =>
              item.isBackToSite ? (
                <Link key={item.to} to={item.to} className={styles.navLink}>
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <AdminButton
            type="button"
            variant="danger"
            className={styles.logoutButton}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Выход..." : "Выйти"}
          </AdminButton>
        </div>

        <div className={styles.mobileHeader}>
          <div className={styles.mobileTitleGroup}>
            <Link to="/admin" className={styles.mobileBrand}>
              Панель управления
            </Link>
            <span className={styles.mobileCurrentSection}>
              {currentSectionLabel}
            </span>
          </div>

          <div className={styles.mobileActions}>
            <AdminButton
              type="button"
              variant="danger"
              size="sm"
              className={styles.mobileLogoutButton}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "..." : "Выйти"}
            </AdminButton>

            <button
              type="button"
              className={`${styles.menuButton} ${
                isMobileMenuOpen ? styles.menuButtonOpen : ""
              }`}
              aria-label={
                isMobileMenuOpen
                  ? "Закрыть меню админки"
                  : "Открыть меню админки"
              }
              aria-expanded={isMobileMenuOpen}
              aria-controls={mobileMenuId}
              onClick={handleToggleMobileMenu}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <div
          id={mobileMenuId}
          className={`${styles.mobileMenu} ${
            isMobileMenuOpen ? styles.mobileMenuOpen : ""
          }`}
        >
          <nav className={styles.mobileNav} aria-label="Навигация админки">
            {navItems.map((item) =>
              item.isBackToSite ? (
                <Link
                  key={item.to}
                  to={item.to}
                  className={styles.mobileNavLink}
                  onClick={handleCloseMobileMenu}
                >
                  {item.label}
                </Link>
              ) : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `${styles.mobileNavLink} ${
                      isActive ? styles.mobileNavLinkActive : ""
                    }`
                  }
                  onClick={handleCloseMobileMenu}
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>
        </div>
      </div>

      <AdminFeedback message={error} tone="error" />

      <Outlet />

      <button
        type="button"
        className={`${styles.overlay} ${
          isMobileMenuOpen ? styles.overlayVisible : ""
        }`}
        aria-label="Закрыть меню админки"
        onClick={handleCloseMobileMenu}
      />
    </div>
  );
}