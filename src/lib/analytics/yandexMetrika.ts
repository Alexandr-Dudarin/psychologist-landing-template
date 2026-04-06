import { config } from "../../data/config";
import { siteSettings } from "../../data/siteSettings";

type YmFunction = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmFunction;
  }
}

const analytics = config.analytics;

export function initYandexMetrika() {
  if (
    !siteSettings.analytics.enabled ||
    analytics.provider !== "yandex-metrika" ||
    !analytics.counterId
  ) {
    return;
  }

  if (document.getElementById("yandex-metrika-script")) {
    return;
  }

  if (!window.ym) {
    const ymQueue = ((...args: unknown[]) => {
      ymQueue.a = ymQueue.a || [];
      ymQueue.a.push(args);
    }) as YmFunction;

    ymQueue.l = Date.now();
    window.ym = ymQueue;
  }

  const script = document.createElement("script");
  script.id = "yandex-metrika-script";
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";

  const firstScript = document.getElementsByTagName("script")[0];
  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  window.ym(analytics.counterId, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
}

export function reachGoal(goal: string) {
  if (
    !siteSettings.analytics.enabled ||
    analytics.provider !== "yandex-metrika" ||
    !analytics.counterId ||
    !window.ym
  ) {
    return;
  }

  window.ym(analytics.counterId, "reachGoal", goal);
}