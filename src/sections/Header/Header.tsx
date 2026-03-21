import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "../../components/Container/Container";
import { Button } from "../../components/Button/Button";
import styles from "./Header.module.css";

const navItems = [
  { href: "#about", label: "Обо мне" },
  { href: "#education", label: "Образование" },
  { href: "#pricing", label: "Стоимость" },
  { href: "#booking", label: "Запись" },
  { href: "#contacts", label: "Контакты" },
  { href: "#faq", label: "FAQ" },
  { href: "#privacy", label: "Конфиденциальность" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const handleToggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!headerRef.current) return;

      if (!headerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const body = document.body;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (isOpen) {
      body.style.overflow = "hidden";
      body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      body.style.overflow = "";
      body.style.paddingRight = "";
    }

    return () => {
      body.style.overflow = "";
      body.style.paddingRight = "";
    };
  }, [isOpen]);

  return (
    <>
      <header ref={headerRef} className={styles.header}>
        <Container>
          <div className={styles.row}>
            <a href="#top" className={styles.logo} onClick={handleCloseMenu}>
              Кристина Дударина
            </a>

            <nav className={styles.nav}>
              {navItems.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className={styles.actions}>
              <Button href="#booking" variant="primary">
                Записаться
              </Button>

              <button
                type="button"
                className={`${styles.burger} ${isOpen ? styles.burgerOpen : ""}`}
                onClick={handleToggleMenu}
                aria-label={isOpen ? "Закрыть меню" : "Открыть меню"}
                aria-expanded={isOpen}
              >
                <span className={styles.burgerIcon}>
                  {isOpen ? <X size={22} /> : <Menu size={22} />}
                </span>
              </button>
            </div>
          </div>

          <div
            className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ""}`}
          >
            <nav className={styles.mobileNav}>
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={handleCloseMenu}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <Button href="#booking" variant="primary" fullWidth>
              Записаться
            </Button>
          </div>
        </Container>
      </header>

      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ""}`}
        onClick={handleCloseMenu}
      />
    </>
  );
}