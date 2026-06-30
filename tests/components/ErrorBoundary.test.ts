import { isValidElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ErrorBoundary } from "../../src/components/ErrorBoundary/ErrorBoundary";

function getElementText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getElementText).join("");
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getElementText(node.props.children);
  }

  return "";
}

describe("ErrorBoundary", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders children when there is no error", () => {
    const boundary = new ErrorBoundary({
      children: "Рабочий экран",
    });

    expect(boundary.render()).toBe("Рабочий экран");
  });

  it("renders fallback after an error", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const state = ErrorBoundary.getDerivedStateFromError();
    const boundary = new ErrorBoundary({
      children: "Рабочий экран",
    });

    (
      boundary as unknown as {
        state: {
          hasError: boolean;
          errorId: string | null;
        };
      }
    ).state = state;

    const fallback = boundary.render();

    expect(state.hasError).toBe(true);
    expect(state.errorId).toMatch(/^ui-/);
    expect(isValidElement(fallback)).toBe(true);

    const fallbackText = getElementText(fallback);

    expect(fallbackText).toContain("Ошибка интерфейса");
    expect(fallbackText).toContain("Что-то пошло не так");
    expect(fallbackText).toContain("Обновить страницу");
    expect(fallbackText).toContain("Код ошибки:");
  });
});