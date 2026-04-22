import { siteSettings } from "../../../data/siteSettings";
import styles from "./PremiumSchedulerPage.module.css";
import type { SchedulerDetail } from "./premiumScheduler.helpers";
import { SchedulerDetailPanel } from "./SchedulerDetailPanel";

type SchedulerSidebarProps = {
  activeDetail: SchedulerDetail | null;
  rulesCount: number;
  totalBlockedSlots: number;
  totalOverrides: number;
};

export function SchedulerSidebar({
  activeDetail,
  rulesCount,
  totalBlockedSlots,
  totalOverrides,
}: SchedulerSidebarProps) {
  return (
    <aside className={styles.sideColumn}>
      <section className={styles.panel}>
        <div className={styles.infoPanel}>
          <h2 className={styles.panelTitle}>Навигатор</h2>
          <p className={styles.panelDescription}>
            Неделя работает как компактный обзор по дням, а режим дня даёт больше воздуха и
            контекста по конкретной записи. Слева остаётся спокойная панель деталей без перегруза.
          </p>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.infoPanel}>
          <h2 className={styles.panelTitle}>Легенда</h2>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <span className={styles.legendSwatch} />
              <div className={styles.legendText}>
                <span className={styles.legendTitle}>Сессия</span>
                <span className={styles.legendHint}>
                  Карточка показывает время, клиента, услугу, статус и короткое превью заметки.
                </span>
              </div>
            </div>

            <div className={styles.legendItem}>
              <span className={styles.legendSwatchBlocked} />
              <div className={styles.legendText}>
                <span className={styles.legendTitle}>Блокировка</span>
                <span className={styles.legendHint}>
                  Штриховка подчеркивает закрытый слот и не конкурирует с обычными сессиями.
                </span>
              </div>
            </div>

            <div className={styles.legendItem}>
              <span className={styles.legendSwatchMuted} />
              <div className={styles.legendText}>
                <span className={styles.legendTitle}>Нерабочее время</span>
                <span className={styles.legendHint}>
                  Фоновые зоны мягко показывают часы вне рабочего окна и выходной день без
                  визуального шума.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.infoPanel}>
          <h2 className={styles.panelTitle}>Выбранная деталь</h2>
          <SchedulerDetailPanel detail={activeDetail} />
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.infoPanel}>
          <h2 className={styles.panelTitle}>Сводка модуля</h2>
          <div className={styles.summaryList}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Модуль</span>
              <span className={styles.summaryValue}>
                {siteSettings.premiumModules.scheduler.enabled ? "Включён" : "Выключен"}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Режим по умолчанию</span>
              <span className={styles.summaryValue}>
                {siteSettings.premiumModules.scheduler.defaultView === "week"
                  ? "Неделя"
                  : siteSettings.premiumModules.scheduler.defaultView === "day"
                    ? "День"
                    : "Месяц"}
              </span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Базовые правила</span>
              <span className={styles.summaryValue}>{rulesCount}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Исключения</span>
              <span className={styles.summaryValue}>{totalOverrides}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Блокировки</span>
              <span className={styles.summaryValue}>{totalBlockedSlots}</span>
            </div>
          </div>
        </div>
      </section>
    </aside>
  );
}
