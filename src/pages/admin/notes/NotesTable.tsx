import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmNoteRecord } from "../../../types/note";
import styles from "./NotesTable.module.css";

type NotesTableProps = {
  items: CrmNoteRecord[];
  deletingId: number | null;
  onEdit: (note: CrmNoteRecord) => void;
  onDelete: (id: number) => void;
  onShowDetails: (note: CrmNoteRecord) => void;
};

export function NotesTable({
  items,
  deletingId,
  onEdit,
  onDelete,
  onShowDetails,
}: NotesTableProps) {
  return (
    <div className={styles.notesTableScope}>
      <AdminTable>
        <colgroup>
          <col className={styles.noteClientColumn} />
          <col className={styles.noteSessionColumn} />
          <col className={styles.noteServiceColumn} />
          <col className={styles.noteTextColumn} />
          <col className={styles.noteCreatedColumn} />
          <col className={styles.noteActionsColumn} />
        </colgroup>

        <thead>
          <tr>
            <th className={styles.noteClientHeader}>Клиент</th>
            <th className={styles.noteSessionHeader}>Сессия</th>
            <th className={styles.noteServiceHeader}>Услуга</th>
            <th className={styles.noteTextHeader}>Текст заметки</th>
            <th className={styles.noteCreatedHeader}>Создана</th>
            <th className={styles.actionCell}>Действия</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className={styles.noteClientCell}>
                <Link to={`/admin/clients?highlightClientId=${item.clientId}`}>
                  {item.clientName}
                </Link>
              </td>

              <td className={styles.noteSessionCell}>
                {item.sessionId && item.sessionScheduledAt ? (
                  <Link to={`/admin/sessions?highlightSessionId=${item.sessionId}`}>
                    {new Date(item.sessionScheduledAt).toLocaleString("ru-RU")}
                  </Link>
                ) : (
                  <span className={styles.emptyValue}>—</span>
                )}
              </td>

              <td className={styles.noteServiceCell}>
                {item.sessionServiceTitle ? (
                  item.sessionServiceTitle
                ) : (
                  <span className={styles.emptyValue}>—</span>
                )}
              </td>

              <td className={styles.noteTextCell}>
                <span className={styles.noteTextPreview} title={item.content}>
                  {item.content}
                </span>
              </td>

              <td className={styles.noteCreatedCell}>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>

              <td className={styles.actionCell}>
                <div className={styles.actionsRow}>
                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => onEdit(item)}
                  >
                    <span className={styles.actionLabelFull}>Редактировать</span>
                    <span className={styles.actionLabelCompact}>Ред.</span>
                  </AdminButton>

                  <AdminButton
                    type="button"
                    variant="secondary"
                    size="sm"
                    className={styles.noteDetailsButton}
                    onClick={() => onShowDetails(item)}
                  >
                    <span className={styles.actionLabelFull}>Подробнее</span>
                    <span className={styles.actionLabelCompact}>Инфо</span>
                  </AdminButton>

                  <AdminButton
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Удаление..." : "Удалить"}
                  </AdminButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
