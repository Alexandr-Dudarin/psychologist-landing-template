import { AdminInstallManifest } from "../components/AdminInstallManifest/AdminInstallManifest";
import { AppRouter } from "./router/AppRouter";
import { YandexMetrikaRouteTracker } from "./router/YandexMetrikaRouteTracker";

export default function App() {
  return (
    <>
      <AdminInstallManifest />
      <YandexMetrikaRouteTracker />
      <AppRouter />
    </>
  );
}