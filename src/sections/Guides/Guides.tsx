import { ArrowUpRight, Instagram, Send } from "lucide-react";
import { useLanguage } from "../../app/providers/LanguageProvider";
import { Button } from "../../components/Button/Button";
import { Container } from "../../components/Container/Container";
import { SectionTitle } from "../../components/SectionTitle/SectionTitle";
import { siteSettings } from "../../data/siteSettings";
import type { GuideItem, GuidePlatform } from "../../types/guides";
import type { SocialLink } from "../../types/config";
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
          {guideItems.map((guide: GuideItem, index) => {
            const href = getHrefByPlatform(guide.platform);

            return (
              <article key={guide.title} className={styles.card}>
                <div
                  className={`${styles.cover} ${
                    index % 2 === 0 ? styles.coverLavender : styles.coverPeach
                  }`}
                >
                  <div className={styles.coverInner}>
                    <span className={styles.coverLabel}>{guide.coverLabel}</span>
                    <h3 className={styles.coverTitle}>{guide.title}</h3>
                  </div>
                </div>

                <div className={styles.body}>
                  <h3 className={styles.cardTitle}>{guide.title}</h3>
                  <p className={styles.cardDescription}>{guide.description}</p>
                </div>

                <div className={styles.actions}>
                  <Button
                    href={href}
                    variant="secondary"
                    className={styles.button}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {getGuideIcon(guide.platform)}
                    {guide.buttonLabel}
                    <ArrowUpRight size={16} />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}