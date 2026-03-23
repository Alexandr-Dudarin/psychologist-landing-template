import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Container } from "../../components/Container/Container";
import { Button } from "../../components/Button/Button";
import { useLanguage } from "../../app/providers/LanguageProvider";
import styles from "./Header.module.css";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  const { t, language, setLanguage, showLanguageSwitcher } = useLanguage();
  const { profile, ui } = t;

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
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

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
              {profile.fullName}
            </a>

            <nav className={styles.nav}>
              {ui.navItems.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ))}
            </nav>

            <div className={styles.actions}>
              {showLanguageSwitcher && (
                <div className={styles.langSwitcher}>
                  <button
                    type="button"
                    className={`${styles.langButton} ${
                      language === "ru" ? styles.langButtonActive : ""
                    }`}
                    onClick={() => setLanguage("ru")}
                  >
                    {ui.language.ru}
                  </button>

                  <button
                    type="button"
                    className={`${styles.langButton} ${
                      language === "en" ? styles.langButtonActive : ""
                    }`}
                    onClick={() => setLanguage("en")}
                  >
                    {ui.language.en}
                  </button>
                </div>
              )}

              <Button href="#booking" variant="primary">
                {ui.buttons.book}
              </Button>

              <button
                type="button"
                className={`${styles.burger} ${isOpen ? styles.burgerOpen : ""}`}
                onClick={handleToggleMenu}
                aria-label={isOpen ? ui.header.closeMenu : ui.header.openMenu}
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
              {ui.navItems.map((item) => (
                <a key={item.href} href={item.href} onClick={handleCloseMenu}>
                  {item.label}
                </a>
              ))}
            </nav>

            {showLanguageSwitcher && (
              <div className={styles.mobileLangSwitcher}>
                <button
                  type="button"
                  className={`${styles.langButton} ${
                    language === "ru" ? styles.langButtonActive : ""
                  }`}
                  onClick={() => setLanguage("ru")}
                >
                  {ui.language.ru}
                </button>

                <button
                  type="button"
                  className={`${styles.langButton} ${
                    language === "en" ? styles.langButtonActive : ""
                  }`}
                  onClick={() => setLanguage("en")}
                >
                  {ui.language.en}
                </button>
              </div>
            )}

            <Button href="#booking" variant="primary" fullWidth>
              {ui.buttons.book}
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