import type { ButtonHTMLAttributes, ReactNode } from "react";

import styles from "./adminUi.module.css";

type AdminButtonVariant = "primary" | "secondary" | "danger";
type AdminButtonSize = "md" | "sm";

type AdminButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  size?: AdminButtonSize;
  variant?: AdminButtonVariant;
};

const variantClassNames: Record<AdminButtonVariant, string> = {
  primary: styles.buttonPrimary,
  secondary: styles.buttonSecondary,
  danger: styles.buttonDanger,
};

const sizeClassNames: Record<AdminButtonSize, string> = {
  md: "",
  sm: styles.buttonSmall,
};

export function AdminButton({
  children,
  className,
  size = "md",
  type = "button",
  variant = "secondary",
  ...props
}: AdminButtonProps) {
  const classes = [
    styles.buttonBase,
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}