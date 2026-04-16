import type { ReactNode } from "react";

import styles from "./adminUi.module.css";

type AdminSectionProps = {
  children: ReactNode;
  title?: ReactNode;
};

export function AdminSection({ children, title }: AdminSectionProps) {
  return (
    <section className={styles.section}>
      {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
      {children}
    </section>
  );
}
