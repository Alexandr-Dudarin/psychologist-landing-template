import type { ReactNode } from "react";

import { AdminButton } from "./AdminButton";
import styles from "./adminUi.module.css";

type AdminCollapsibleCreateSectionProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  openLabel: string;
  closedLabel: string;
  children: ReactNode;
};

export function AdminCollapsibleCreateSection({
  title,
  description,
  isOpen,
  onToggle,
  panelId,
  openLabel,
  closedLabel,
  children,
}: AdminCollapsibleCreateSectionProps) {
  return (
    <>
      <div
        className={`${styles.createToggleBar} ${
          isOpen ? styles.createToggleBarOpen : ""
        }`}
      >
        <div className={styles.createToggleText}>
          <h2 className={styles.createToggleTitle}>{title}</h2>

          {description ? (
            <p className={styles.createToggleDescription}>{description}</p>
          ) : null}
        </div>

        <AdminButton
          type="button"
          variant={isOpen ? "secondary" : "primary"}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {isOpen ? openLabel : closedLabel}
        </AdminButton>
      </div>

      <div
        id={panelId}
        className={`${styles.createPanel} ${
          isOpen ? styles.createPanelOpen : styles.createPanelClosed
        }`}
        aria-hidden={!isOpen}
      >
        <div className={styles.createPanelInner}>{children}</div>
      </div>
    </>
  );
}