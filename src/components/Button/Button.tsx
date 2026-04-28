import {
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
  type MouseEvent,
} from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "outline" | "premium";

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  className?: string;
};

type NativeButtonProps = BaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type LinkButtonProps = BaseProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

type ButtonProps = NativeButtonProps | LinkButtonProps;

function isInternalAppLink(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function isAnchorLink(href: string) {
  return href.startsWith("#");
}

export function Button(props: ButtonProps) {
  const {
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
  } = props;

  const ref = useRef<HTMLElement | null>(null);

  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (variant !== "premium" || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ref.current.style.setProperty("--x", `${x}px`);
    ref.current.style.setProperty("--y", `${y}px`);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const moveX = (x - centerX) * 0.15;
    const moveY = (y - centerY) * 0.2;

    ref.current.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.02)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = "";
  };

  const commonProps = {
    className: classes,
    ref: ref as any,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };

  if ("href" in props && typeof props.href === "string") {
    const { href, ...anchorProps } = props;

    if (isInternalAppLink(href)) {
      const {
        onClick,
        target,
        rel,
        download,
        hrefLang,
        media,
        ping,
        referrerPolicy,
        type,
        ...linkProps
      } = anchorProps;

      return (
        <Link to={href} {...commonProps} onClick={onClick} {...linkProps}>
          {children}
        </Link>
      );
    }

    if (isAnchorLink(href)) {
      return (
        <a href={href} {...commonProps} {...anchorProps}>
          {children}
        </a>
      );
    }

    return (
      <a href={href} {...commonProps} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type = "button", ...buttonProps } = props;

  return (
    <button type={type} {...commonProps} {...buttonProps}>
      {children}
    </button>
  );
}