import { Instagram, MessageCircle, Phone, Send } from "lucide-react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import { trackPhoneClick, trackTelegramClick } from "../../lib/analytics/trackers";
import type { SocialLink } from "../../types/config";
import styles from "./Contacts.module.css";

export function Contacts() {
  const { t, language } = useLanguage();
  const { config, content, ui } = t;

  const showContactsSection = siteSettings.sections.contacts.enabled;
  const showSocialLinks = siteSettings.sections.contacts.socialLinksEnabled;
  const showTelegramButton = siteSettings.sections.contacts.telegramButtonEnabled;
  const showWhatsappButton = siteSettings.sections.contacts.whatsappButtonEnabled;
  const socialLinks = ("socialLinks" in config
    ? config.socialLinks
    : []) as SocialLink[];

  const whatsappHref =
    "whatsappHref" in config ? config.whatsappHref : "https://wa.me/79185555555";
  const whatsappLabel =
    "whatsappLabel" in config
      ? config.whatsappLabel
      : language === "ru"
        ? "WhatsApp"
        : "WhatsApp";

  const phoneLabel = language === "ru" ? "Телефон" : "Phone";
  const telegramLabel = "Telegram";
  const formatLabel = language === "ru" ? "Формат" : "Format";

  const contactsContent = content.contacts as typeof content.contacts & {
    socialTitle?: string;
    socialDescription?: string;
  };

  const socialTitle =
    contactsContent.socialTitle ??
    (language === "ru" ? "Мои соцсети" : "My social media");

  const socialDescription =
    contactsContent.socialDescription ??
    (language === "ru"
      ? "Здесь можно быстро перейти в социальные сети специалиста."
      : "Here you can quickly open the specialist’s social media profiles.");

        if (!showContactsSection) {
    return null;
  }

  const getSocialIcon = (key: SocialLink["key"]) => {
    if (key === "instagram") {
      return <Instagram size={18} />;
    }

    return <Send size={18} />;
  };

  return (
    <section id="contacts" className={`${styles.section} section`}>
      <Container>
        <div className={styles.wrapper}>
          <div className={styles.left}>
            <SectionTitle
              eyebrow={content.contacts.eyebrow}
              title={content.contacts.title}
              description={content.contacts.description}
            />

            {showSocialLinks && socialLinks.length > 0 ? (
              <div className={styles.socialsBlock}>
                <div className={styles.socialsHeader}>
                  <h3 className={styles.socialsTitle}>{socialTitle}</h3>
                  <p className={styles.socialsDescription}>{socialDescription}</p>
                </div>

                <div className={styles.socialsList}>
                  {socialLinks.map((social: SocialLink) => (
                    <a
                      key={social.key}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.socialItem}
                      onClick={
                        social.key === "telegram-channel"
                          ? trackTelegramClick
                          : undefined
                      }
                    >
                      <span className={styles.socialIcon}>
                        {getSocialIcon(social.key)}
                      </span>

                      <span className={styles.socialBody}>
                        <span className={styles.socialLabel}>{social.label}</span>
                        <span className={styles.socialUsername}>{social.username}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className={styles.right}>
            <div className={styles.buttons}>
              {showTelegramButton ? (
                <Button
                  href={config.telegramHref}
                  variant="primary"
                  target="_blank"
                  rel="noreferrer"
                  onClick={trackTelegramClick}
                >
                  <Send size={16} />
                  {ui.buttons.writeTelegram}
                </Button>
              ) : null}

              <Button
                href={config.phoneHref}
                variant="secondary"
                onClick={trackPhoneClick}
              >
                <Phone size={16} />
                {ui.buttons.call}
              </Button>

              {showWhatsappButton ? (
                <Button
                  href={whatsappHref}
                  variant="secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle size={16} />
                  {whatsappLabel}
                </Button>
              ) : null}
            </div>

            <div className={styles.info}>
              <div className={styles.item}>
                <span className={styles.label}>{phoneLabel}</span>
                <a
                  href={config.phoneHref}
                  className={styles.contactItem}
                  onClick={trackPhoneClick}
                >
                  <Phone size={18} />
                  <span className={styles.linkText}>{config.phone}</span>
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>{telegramLabel}</span>
                <a
                  href={config.telegramHref}
                  className={styles.contactItem}
                  target="_blank"
                  rel="noreferrer"
                  onClick={trackTelegramClick}
                >
                  <Send size={18} />
                  <span className={styles.linkText}>{config.telegramUsername}</span>
                </a>
              </div>

              <div className={styles.item}>
                <span className={styles.label}>{formatLabel}</span>
                <span className={styles.text}>{content.contacts.format}</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}