import { useId, type ReactNode } from "react";

import styles from "./CustomCheckbox.module.css";

type CustomCheckboxVariant = "admin" | "public";
type CustomCheckboxSize = "sm" | "md";

type CustomCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel?: string;
  children?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
  variant?: CustomCheckboxVariant;
  size?: CustomCheckboxSize;
};

const variantClassNames: Record<CustomCheckboxVariant, string> = {
  admin: styles.rootAdmin,
  public: styles.rootPublic,
};

const sizeClassNames: Record<CustomCheckboxSize, string> = {
  sm: styles.rootSmall,
  md: styles.rootMedium,
};

export function CustomCheckbox({
  checked,
  onChange,
  ariaLabel,
  children,
  description,
  disabled = false,
  required = false,
  name,
  value,
  id,
  className = "",
  variant = "admin",
  size = "md",
}: CustomCheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-checkbox`;
  const hasText = Boolean(children || description);

  return (
    <label
      className={[
        styles.root,
        variantClassNames[variant],
        sizeClassNames[size],
        checked ? styles.rootChecked : "",
        disabled ? styles.rootDisabled : "",
        !hasText ? styles.rootIconOnly : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      htmlFor={inputId}
    >
      <span className={styles.control} aria-hidden="true">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          required={required}
          name={name}
          value={value}
          aria-label={ariaLabel}
          className={styles.input}
          onChange={(event) => onChange(event.target.checked)}
        />

        <span className={styles.box}>
          <span className={styles.mark}>✓</span>
        </span>
      </span>

      {hasText ? (
        <span className={styles.copy}>
          {children ? <span className={styles.label}>{children}</span> : null}
          {description ? (
            <span className={styles.description}>{description}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}