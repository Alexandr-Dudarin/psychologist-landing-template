import { Instagram, Send } from "lucide-react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import type { SocialLink } from "../../types/config";
import type { GuideItem, GuidePlatform } from "../../types/guides";
import styles from "./Guides.module.css";

function getGuideIcon(platform: GuidePlatform) {
  if (platform === "instagram") {
    return <Instagram size={16} />;
  }

  return <Send size={16} />;
}

export function Guides() {
  const { t } = useLanguage();
  const { content, config } = t;

  if (!siteSettings.sections.guides.enabled) {
    return null;
  }

  const socialLinks = ("socialLinks" in config
    ? config.socialLinks
    : []) as SocialLink[];

  const getHrefByPlatform = (platform: GuidePlatform) => {
    return socialLinks.find((item) => item.key === platform)?.href ?? "#";
  };

  const guideItems = content.guides.items as GuideItem[];

  return (
    <section id="guides" className={`${styles.section} section`}>
      <Container>
        <SectionTitle
          eyebrow={content.guides.eyebrow}
          title={content.guides.title}
          description={content.guides.description}
        />

        <div className={styles.grid}>
          {guideItems.map((guide, index) => {
            const href = getHrefByPlatform(guide.platform);

            return (
              <article key={guide.title} className={styles.card}>
                <div
                  className={`${styles.cover} ${
                    index % 2 === 0 ? styles.coverLavender : styles.coverPeach
                  }`}
                >
                  <div className={styles.coverNoise} />
                  <div className={styles.coverLines} />

                  <div className={styles.coverInner}>
                    <span className={styles.coverLabel}>{guide.coverLabel}</span>
                    <h3 className={styles.coverTitle}>{guide.title}</h3>
                  </div>
                </div>

                <div className={styles.body}>
                  <p className={styles.cardDescription}>{guide.description}</p>
                </div>

                <div className={styles.actions}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.ctaButton}
                  >
                    <span className={styles.ctaButtonInner}>
                      <span className={styles.ctaIcon}>
                        {getGuideIcon(guide.platform)}
                      </span>

                      <span className={styles.ctaLabelDesktop}>
                        {guide.desktopButtonLabel}
                      </span>

                      <span className={styles.ctaLabelMobile}>
                        {guide.mobileButtonLabel}
                      </span>
                    </span>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}