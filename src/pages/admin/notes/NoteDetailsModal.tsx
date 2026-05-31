import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";

import type { CrmNoteRecord } from "../../../types/note";
import styles from "./NotesPage.module.css";

type NoteDetailsModalProps = {
  note: CrmNoteRecord | null;
  onClose: () => void;
};

const NOTE_DETAILS_MAX_VISIBLE_CHARS = 20000;

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("ru-RU");
}

function getVisibleNoteContent(content: string): {
  text: string;
  isTrimmed: boolean;
} {
  if (content.length <= NOTE_DETAILS_MAX_VISIBLE_CHARS) {
    return {
      text: content,
      isTrimmed: false,
    };
  }

  return {
    text: content.slice(0, NOTE_DETAILS_MAX_VISIBLE_CHARS),
    isTrimmed: true,
  };
}

export function NoteDetailsModal({ note, onClose }: NoteDetailsModalProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!note) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [note, onClose]);

  if (!note) {
    return null;
  }

  const visibleNoteContent = getVisibleNoteContent(note.content);

  return (
    <div
      className={styles.noteDetailsOverlay}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className={styles.noteDetailsDialog}
        role="dialog"
      >
        <header className={styles.noteDetailsHeader}>
          <div className={styles.noteDetailsTitleGroup}>
            <span className={styles.noteDetailsKicker}>Детали заметки</span>
            <h2 id={titleId} className={styles.noteDetailsTitle}>
              {note.clientName}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            aria-label="Закрыть"
            className={styles.noteDetailsCloseButton}
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className={styles.noteDetailsBody}>
          <div className={styles.noteDetailsGrid}>
            <div className={styles.noteDetailsField}>
              <span className={styles.noteDetailsLabel}>Клиент</span>
              <Link
                className={styles.noteDetailsValue}
                to={`/admin/clients?highlightClientId=${note.clientId}`}
              >
                {note.clientName}
              </Link>
            </div>

            <div className={styles.noteDetailsField}>
              <span className={styles.noteDetailsLabel}>Сессия</span>
              <span className={styles.noteDetailsValue}>
                {note.sessionId && note.sessionScheduledAt ? (
                  <Link
                    to={`/admin/sessions?highlightSessionId=${note.sessionId}`}
                  >
                    {formatDateTime(note.sessionScheduledAt)}
                  </Link>
                ) : (
                  "—"
                )}
              </span>
            </div>

            <div className={styles.noteDetailsField}>
              <span className={styles.noteDetailsLabel}>Услуга</span>
              <span className={styles.noteDetailsValue}>
                {note.sessionServiceTitle || "—"}
              </span>
            </div>

            <div className={styles.noteDetailsField}>
              <span className={styles.noteDetailsLabel}>Создана</span>
              <span className={styles.noteDetailsValue}>
                {formatDateTime(note.createdAt)}
              </span>
            </div>
          </div>

          <section className={styles.noteDetailsContentSection}>
            <h3 className={styles.noteDetailsContentTitle}>Текст заметки</h3>

            <div className={styles.noteDetailsContent}>
              {visibleNoteContent.text}
            </div>

            {visibleNoteContent.isTrimmed ? (
              <p className={styles.noteDetailsHint}>
                Показаны первые {NOTE_DETAILS_MAX_VISIBLE_CHARS.toLocaleString("ru-RU")}{" "}
                символов заметки. Полный текст сохранён, но для стабильной работы
                интерфейса в этом окне показан ограниченный фрагмент.
              </p>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}