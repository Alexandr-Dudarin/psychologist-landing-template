import { useLanguage } from "../../../app/providers/LanguageProvider";

export function AdminLoginPage() {
  const { t } = useLanguage();

  return (
    <main style={{ minHeight: "100vh", padding: "40px 20px" }}>
      <h1>{t.admin.login.title}</h1>
      <p>{t.admin.login.description}</p>
    </main>
  );
}
