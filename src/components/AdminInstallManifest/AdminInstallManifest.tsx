import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ADMIN_INSTALL_HEAD_IDS = [
  "admin-webmanifest-link",
  "admin-apple-touch-icon-link",
  "admin-application-name-meta",
  "admin-apple-web-app-title-meta",
  "admin-apple-web-app-capable-meta",
  "admin-apple-status-bar-style-meta",
  "admin-theme-color-meta",
];

function removeAdminInstallHeadTags() {
  ADMIN_INSTALL_HEAD_IDS.forEach((id) => {
    document.getElementById(id)?.remove();
  });
}

function appendLink(id: string, rel: string, href: string) {
  if (document.getElementById(id)) {
    return;
  }

  const link = document.createElement("link");

  link.id = id;
  link.rel = rel;
  link.href = href;

  document.head.appendChild(link);
}

function appendMeta(id: string, name: string, content: string) {
  if (document.getElementById(id)) {
    return;
  }

  const meta = document.createElement("meta");

  meta.id = id;
  meta.name = name;
  meta.content = content;

  document.head.appendChild(meta);
}

export function AdminInstallManifest() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!isAdminRoute) {
      removeAdminInstallHeadTags();
      return;
    }

    appendLink("admin-webmanifest-link", "manifest", "/admin.webmanifest");
    appendLink("admin-apple-touch-icon-link", "apple-touch-icon", "/apple-touch-icon.png");

    appendMeta("admin-application-name-meta", "application-name", "Psychologist CRM");
    appendMeta(
      "admin-apple-web-app-title-meta",
      "apple-mobile-web-app-title",
      "Psychologist CRM"
    );
    appendMeta("admin-apple-web-app-capable-meta", "apple-mobile-web-app-capable", "yes");
    appendMeta(
      "admin-apple-status-bar-style-meta",
      "apple-mobile-web-app-status-bar-style",
      "default"
    );
    appendMeta("admin-theme-color-meta", "theme-color", "#9a766c");
  }, [isAdminRoute]);

  return null;
}