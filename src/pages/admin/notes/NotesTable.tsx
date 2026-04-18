import { Link } from "react-router-dom";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminTable } from "../../../components/admin/AdminTable";
import type { CrmNoteRecord } from "../../../types/note";

type NotesTableProps = {
  items: CrmNoteRecord[];
  deletingId: number | null;
  onEdit: (note: CrmNoteRecord) => void;
  onDelete: (id: number) => void;
};

export function NotesTable({
  items,
  deletingId,
  onEdit,
  onDelete,
}: NotesTableProps) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>Клиент</th>
          <th>Сессия</th>
          <th>Услуга</th>
          <th>Текст заметки</th>
          <th>Создана</th>
          <th style={{ textAlign: "right" }}>Действия</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>
              <Link
                to={`/admin/clients?search=${encodeURIComponent(
                  String(item.clientId)
                )}&highlightClientId=${item.clientId}`}
              >
                {item.clientName}
              </Link>
            </td>
            <td>
              {item.sessionId && item.sessionScheduledAt ? (
                <Link
                  to={`/admin/sessions?search=${encodeURIComponent(
                    String(item.sessionId)
                  )}&highlightSessionId=${item.sessionId}`}
                >
                  {new Date(item.sessionScheduledAt).toLocaleString("ru-RU")}
                </Link>
              ) : (
                "-"
              )}
            </td>
            <td>{item.sessionServiceTitle || "-"}</td>
            <td>{item.content}</td>
            <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
            <td style={{ textAlign: "right" }}>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  Редактировать
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
  );
}