import type { ClientStatus, CrmClientRecord } from "../../../types/client";
import { AdminTable } from "../../../components/admin/AdminTable";

type ClientsTableProps = {
  items: CrmClientRecord[];
  createdLabel: string;
  nameLabel: string;
  phoneLabel: string;
  emailLabel: string;
  sourceLabel: string;
  statusLabel: string;
  firstRequestLabel: string;
  statusLabels: Record<ClientStatus, string>;
  sourceLabels: Record<string, string>;
};

export function ClientsTable({
  items,
  createdLabel,
  nameLabel,
  phoneLabel,
  emailLabel,
  sourceLabel,
  statusLabel,
  firstRequestLabel,
  statusLabels,
  sourceLabels,
}: ClientsTableProps) {
  return (
    <AdminTable>
      <thead>
        <tr>
          <th>ID</th>
          <th>{createdLabel}</th>
          <th>{nameLabel}</th>
          <th>{phoneLabel}</th>
          <th>{emailLabel}</th>
          <th>{sourceLabel}</th>
          <th>{statusLabel}</th>
          <th>{firstRequestLabel}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.id}</td>
            <td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td>
            <td>{item.name}</td>
            <td>{item.phone || "-"}</td>
            <td>{item.email || "-"}</td>
            <td>{sourceLabels[item.source] ?? item.source}</td>
            <td>{statusLabels[item.status]}</td>
            <td>{item.firstRequestId ?? "-"}</td>
          </tr>
        ))}
      </tbody>
    </AdminTable>
  );
}