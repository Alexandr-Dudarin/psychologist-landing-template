import { useEffect } from "react";
import { initYandexMetrika } from "../lib/analytics/yandexMetrika";
import { initScrollGoals } from "../lib/analytics/scrollGoals";
import { AppRouter } from "./router/AppRouter";

export default function App() {
  useEffect(() => {
    initYandexMetrika();
    const cleanupScrollGoals = initScrollGoals();

    return () => {
      cleanupScrollGoals();
    };
  }, []);

  return <AppRouter />;
}