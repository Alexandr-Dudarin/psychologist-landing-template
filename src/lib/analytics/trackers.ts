import { config } from "../../data/config";
import { reachGoal } from "./yandexMetrika";

export function trackTelegramClick() {
  return reachGoal(config.analytics.goals.telegramClick);
}

export function trackPhoneClick() {
  return reachGoal(config.analytics.goals.phoneClick);
}

export function trackFormStart() {
  return reachGoal(config.analytics.goals.formStart);
}

export function trackFormSubmit() {
  return reachGoal(config.analytics.goals.formSubmit);
}

export function trackPackagePurchase() {
  return reachGoal(config.analytics.goals.packagePurchase);
}

export function trackScroll25() {
  return reachGoal(config.analytics.goals.scroll25);
}

export function trackScroll50() {
  return reachGoal(config.analytics.goals.scroll50);
}

export function trackScroll75() {
  return reachGoal(config.analytics.goals.scroll75);
}

export function trackScroll100() {
  return reachGoal(config.analytics.goals.scroll100);
}
