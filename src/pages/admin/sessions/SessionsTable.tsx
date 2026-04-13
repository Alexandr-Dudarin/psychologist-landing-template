import type { CrmSessionRecord } from "../../../types/session";

type SessionsTableProps = {
  items: CrmSessionRecord[];
  isLoading: boolean;
  deletingId: number | null;
  onEdit: (session: CrmSessionRecord) => void;
  onDelete: (id: number) => void;
};

export function SessionsTable({
  items,
  isLoading,
  deletingId,
  onEdit,
  onDelete,
}: SessionsTableProps) {
  if (isLoading) {
    return <p>Загрузка...</p>;
  }

  if (items.length === 0) {
    return <p>Сессий пока нет.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "16px",
        }}
      >
        <thead>
          <tr>
            <th style={cellHeadStyle}>ID</th>
            <th style={cellHeadStyle}>Дата</th>
            <th style={cellHeadStyle}>Клиент</th>
            <th style={cellHeadStyle}>Услуга</th>
            <th style={cellHeadStyle}>Цена</th>
            <th style={cellHeadStyle}>Длительность</th>
            <th style={cellHeadStyle}>Статус</th>
            <th style={cellHeadStyle}>Заметка</th>
            <th style={cellHeadStyle}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={cellStyle}>{item.id}</td>
              <td style={cellStyle}>
                {new Date(item.scheduledAt).toLocaleString("ru-RU")}
              </td>
              <td style={cellStyle}>{item.clientName}</td>
              <td style={cellStyle}>{item.serviceTitle}</td>
              <td style={cellStyle}>{item.price} ₽</td>
              <td style={cellStyle}>{item.durationMinutes} мин</td>
              <td style={cellStyle}>{item.status}</td>
              <td style={cellStyle}>{item.notes || "-"}</td>
              <td style={cellStyle}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    style={buttonStyle}
                  >
                    Редактировать
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    disabled={deletingId === item.id}
                    style={buttonStyle}
                  >
                    {deletingId === item.id ? "Удаление..." : "Удалить"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  cursor: "pointer",
  background: "#fff",
};

const cellHeadStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
  fontWeight: 700,
};

const cellStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "top",
};
