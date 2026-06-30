import { Component, type ErrorInfo, type ReactNode } from "react";

import styles from "./ErrorBoundary.module.css";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorId: string | null;
};

function createErrorId() {
  return `ui-${Date.now().toString(36)}`;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorId: null,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
      errorId: createErrorId(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React UI error caught by ErrorBoundary:", {
      error,
      errorInfo,
      errorId: this.state.errorId,
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className={styles.page} role="alert">
          <section className={styles.card}>
            <p className={styles.eyebrow}>Ошибка интерфейса</p>
            <h1 className={styles.title}>Что-то пошло не так</h1>
            <p className={styles.description}>
              Попробуйте обновить страницу. Если ошибка повторится, напишите
              специалисту или попробуйте зайти позже.
            </p>

            <button
              className={styles.button}
              type="button"
              onClick={this.handleReload}
            >
              Обновить страницу
            </button>

            {this.state.errorId ? (
              <p className={styles.errorId}>Код ошибки: {this.state.errorId}</p>
            ) : null}
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}