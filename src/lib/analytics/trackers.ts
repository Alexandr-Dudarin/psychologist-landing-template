import { config } from "../../data/config";
import { reachGoal } from "./yandexMetrika";

export function trackTelegramClick() {
  reachGoal(config.analytics.goals.telegramClick);
}

export function trackPhoneClick() {
  reachGoal(config.analytics.goals.phoneClick);
}

export function trackFormStart() {
  reachGoal(config.analytics.goals.formStart);
}

export function trackFormSubmit() {
  reachGoal(config.analytics.goals.formSubmit);
}

export function trackScroll25() {
  reachGoal(config.analytics.goals.scroll25);
}

export function trackScroll50() {
  reachGoal(config.analytics.goals.scroll50);
}

export function trackScroll75() {
  reachGoal(config.analytics.goals.scroll75);
}

export function trackScroll100() {
  reachGoal(config.analytics.goals.scroll100);
}