import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useAdminLanguage } from "../../../lib/admin/useAdminLanguage";
import { AdminFeedback } from "../../../components/admin/AdminFeedback";
import { AdminSection } from "../../../components/admin/AdminSection";
import { getAdminClients } from "../../../lib/api/adminClients";
import { getAdminRequests } from "../../../lib/api/adminRequests";
import { getAdminSchedule } from "../../../lib/api/adminSchedule";
import { getAdminServices } from "../../../lib/api/adminServices";
import { getAdminSessions } from "../../../lib/api/adminSessions";
import type { CrmClientRecord } from "../../../types/client";
import type { CrmRequestRecord } from "../../../types/request";
import type { AdminScheduleRecord } from "../../../types/schedule";
import type { CrmServiceRecord } from "../../../types/service";
import type { CrmSessionRecord } from "../../../types/session";
import { dashboardConfigByLanguage } from "./dashboardConfig";
import { buildDashboardData } from "./dashboardHelpers";
import styles from "./AdminDashboardPage.module.css";

type DashboardDataState = {
  requests: CrmRequestRecord[];
  clients: CrmClientRecord[];
  sessions: CrmSessionRecord[];
  services: CrmServiceRecord[];
  schedule: AdminScheduleRecord | null;
};

const initialDashboardData: DashboardDataState = {
  requests: [],
  clients: [],
  sessions: [],
  services: [],
  schedule: null,
};

export function AdminDashboardPage() {
  const { language: adminLanguage, locale } = useAdminLanguage();
  const copy = dashboardConfigByLanguage[adminLanguage];
  const [data, setData] = useState<DashboardDataState>(initialDashboardData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError("");

      try {
        const [requests, clients, sessions, services, schedule] = await Promise.all([
          getAdminRequests(),
          getAdminClients(),
          getAdminSessions(),
          getAdminServices(),
          getAdminSchedule(),
        ]);

        if (!isMounted) {
          return;
        }

        setData({
          requests,
          clients,
          sessions,
          services,
          schedule,
        });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : copy.loadError);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [copy.loadError]);

  const dashboardData = useMemo(() => {
    if (!data.schedule) {
      return null;
    }

    return buildDashboardData({
      clients: data.clients,
      requests: data.requests,
      schedule: data.schedule,
      services: data.services,
      sessions: data.sessions,
      locale,
      copy,
    });
  }, [copy, data.clients, data.requests, data.schedule, data.services, data.sessions, locale]);

  const sections = copy.sections;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>
      </header>

      <AdminFeedback message={error} tone="error" />

      {isLoading ? (
        <section className={styles.loadingGrid} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className={styles.loadingCard} />
          ))}
        </section>
      ) : null}

      {!isLoading && dashboardData ? (
        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            {sections.metrics.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{sections.metrics.title}</h2>
                  <p className={styles.sectionDescription}>
                    {sections.metrics.description}
                  </p>
                </div>

                <div className={styles.metricsGrid}>
                  {dashboardData.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className={[
                        styles.metricCard,
                        metric.tone === "accent" ? styles.metricAccent : "",
                        metric.tone === "muted" ? styles.metricMuted : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <p className={styles.metricLabel}>{metric.label}</p>
                      <p className={styles.metricValue}>{metric.value}</p>
                    </div>
                  ))}
                </div>
              </AdminSection>
            ) : null}

            {sections.priority.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{sections.priority.title}</h2>
                  <p className={styles.sectionDescription}>
                    {sections.priority.description}
                  </p>
                </div>

                <div className={styles.signalsList}>
                  {dashboardData.signals.map((signal) => (
                    <div
                      key={signal.id}
                      className={[
                        styles.signal,
                        signal.tone === "accent" ? styles.signalAccent : "",
                        signal.tone === "warn" ? styles.signalWarn : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {signal.text}
                    </div>
                  ))}
                </div>
              </AdminSection>
            ) : null}

            {sections.upcomingSessions.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {sections.upcomingSessions.title}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {sections.upcomingSessions.description}
                  </p>
                </div>

                {dashboardData.upcomingSessions.length === 0 ? (
                  <p className={styles.description}>{copy.upcomingSessions.empty}</p>
                ) : (
                  <div className={styles.sessionList}>
                    {dashboardData.upcomingSessions.map((session) => (
                      <div key={session.id} className={styles.sessionCard}>
                        <div className={styles.sessionTop}>
                          <span className={styles.sessionTime}>{session.dateLabel}</span>
                          <span className={styles.sessionStatus}>{session.statusLabel}</span>
                        </div>
                        <div className={styles.sessionMeta}>
                          <span className={styles.sessionClient}>{session.clientName}</span>
                          <span className={styles.sessionService}>
                            {session.serviceTitle}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.sectionFooter}>
                  <Link className={styles.linkButton} to="/admin/sessions">
                    {copy.upcomingSessions.viewAll}
                  </Link>
                </div>
              </AdminSection>
            ) : null}

            {sections.recentActivity.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {sections.recentActivity.title}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {sections.recentActivity.description}
                  </p>
                </div>

                {dashboardData.recentActivity.length === 0 ? (
                  <p className={styles.description}>{copy.recentActivity.empty}</p>
                ) : (
                  <div className={styles.activityList}>
                    {dashboardData.recentActivity.map((item) => (
                      <Link key={item.id} to={item.href} className={styles.activityItem}>
                        <span className={styles.activityTitle}>{item.title}</span>
                        <span className={styles.activityMeta}>{item.meta}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </AdminSection>
            ) : null}
          </div>

          <aside className={styles.sideColumn}>
            {sections.quickActions.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>{sections.quickActions.title}</h2>
                  <p className={styles.sectionDescription}>
                    {sections.quickActions.description}
                  </p>
                </div>

                <div className={styles.quickActions}>
                  {copy.quickActions.map((action) => (
                    <Link key={action.href} to={action.href} className={styles.quickAction}>
                      <span className={styles.quickActionTitle}>{action.label}</span>
                      <span className={styles.quickActionDescription}>
                        {action.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </AdminSection>
            ) : null}

            {sections.scheduleSummary.enabled ? (
              <AdminSection>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {sections.scheduleSummary.title}
                  </h2>
                  <p className={styles.sectionDescription}>
                    {sections.scheduleSummary.description}
                  </p>
                </div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>{copy.scheduleSummary.today}</p>
                    <p className={styles.summaryValue}>
                      {dashboardData.scheduleSummary.sessionsToday}
                    </p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>{copy.scheduleSummary.week}</p>
                    <p className={styles.summaryValue}>
                      {dashboardData.scheduleSummary.sessionsThisWeek}
                    </p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>
                      {copy.scheduleSummary.blockedSlots}
                    </p>
                    <p className={styles.summaryValue}>
                      {dashboardData.scheduleSummary.blockedSlots}
                    </p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>{copy.scheduleSummary.overrides}</p>
                    <p className={styles.summaryValue}>
                      {dashboardData.scheduleSummary.overrides}
                    </p>
                  </div>
                  <div className={styles.summaryItem}>
                    <p className={styles.summaryLabel}>
                      {copy.scheduleSummary.activeServices}
                    </p>
                    <p className={styles.summaryValue}>
                      {dashboardData.scheduleSummary.activeServices}
                    </p>
                  </div>
                </div>

                <div className={styles.capacityCard}>
                  <p className={styles.capacityLabel}>{copy.scheduleSummary.capacityLabel}</p>
                  <p className={styles.capacityValue}>
                    {dashboardData.scheduleSummary.todayLooksBusy
                      ? copy.scheduleSummary.capacityBusy
                      : copy.scheduleSummary.capacityOpen}
                  </p>
                </div>
              </AdminSection>
            ) : null}
          </aside>
        </div>
      ) : null}
    </main>
  );
}
