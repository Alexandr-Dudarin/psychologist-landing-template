import { useLanguage } from "../../../app/providers/LanguageProvider";

export function AdminDashboardPage() {
  const { t } = useLanguage();

  return (
    <main>
      <h1>{t.admin.dashboard.title}</h1>
      <p>{t.admin.dashboard.description}</p>
    </main>
  );
}
