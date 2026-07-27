import { config } from "../../data/config";
import { siteSettings } from "../../data/siteSettings";

type YmFunction = ((...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

type PageViewOptions = {
  title?: string;
  referer?: string;
};

declare global {
  interface Window {
    ym?: YmFunction;
  }
}

const analytics = config.analytics;

let isCounterInitialized = false;
let lastTrackedPath: string | null = null;

function isYandexMetrikaEnabled(): boolean {
  return (
    siteSettings.analytics.enabled &&
    analytics.provider === "yandex-metrika" &&
    Boolean(analytics.counterId)
  );
}

function ensureYmQueue() {
  if (window.ym) {
    return;
  }

  const ymQueue = ((...args: unknown[]) => {
    ymQueue.a = ymQueue.a || [];
    ymQueue.a.push(args);
  }) as YmFunction;

  ymQueue.l = Date.now();
  window.ym = ymQueue;
}

function ensureMetrikaScript() {
  if (document.getElementById("yandex-metrika-script")) {
    return;
  }

  const script = document.createElement("script");

  script.id = "yandex-metrika-script";
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";

  const firstScript = document.getElementsByTagName("script")[0];

  if (firstScript?.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
    return;
  }

  document.head.appendChild(script);
}

export function initYandexMetrika(): boolean {
  if (!isYandexMetrikaEnabled()) {
    return false;
  }

  ensureYmQueue();
  ensureMetrikaScript();

  if (isCounterInitialized) {
    return true;
  }

  window.ym?.(analytics.counterId, "init", {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });

  isCounterInitialized = true;

  return true;
}

export function trackPageView(
  pathname: string,
  options: PageViewOptions = {}
) {
  if (!initYandexMetrika() || !window.ym) {
    return;
  }

  const normalizedPath = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;

  if (lastTrackedPath === normalizedPath) {
    return;
  }

  const hitOptions: {
    title: string;
    referer?: string;
  } = {
    title: options.title || document.title,
  };

  if (options.referer) {
    hitOptions.referer = options.referer;
  }

  window.ym(
    analytics.counterId,
    "hit",
    normalizedPath,
    hitOptions
  );

  lastTrackedPath = normalizedPath;
}

export function destroyYandexMetrika() {
  if (
    isYandexMetrikaEnabled() &&
    isCounterInitialized &&
    window.ym
  ) {
    window.ym(analytics.counterId, "destruct");
  }

  isCounterInitialized = false;
  lastTrackedPath = null;
}

export function reachGoal(goal: string): boolean {
  if (
    !isYandexMetrikaEnabled() ||
    !isCounterInitialized ||
    !window.ym
  ) {
    return false;
  }

  window.ym(analytics.counterId, "reachGoal", goal);

  return true;
}
