import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "outline";

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

  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

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
        <Link to={href} className={classes} onClick={onClick} {...linkProps}>
          {children}
        </Link>
      );
    }

    if (isAnchorLink(href)) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {children}
        </a>
      );
    }

    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type = "button", ...buttonProps } = props;

  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}