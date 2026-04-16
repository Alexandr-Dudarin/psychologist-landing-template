import type { CrmClientRecord } from "../../../types/client";

import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./ClientsPage.module.css";

type ClientsTableProps = {
  createdLabel: string;
  emailLabel: string;
  firstRequestLabel: string;
  items: CrmClientRecord[];
  nameLabel: string;
  phoneLabel: string;
  sourceLabel: string;
  statusLabel: string;
  statusLabels: Record<string, string>;
};

export function ClientsTable({
  createdLabel,
  emailLabel,
  firstRequestLabel,
  items,
  nameLabel,
  phoneLabel,
  sourceLabel,
  statusLabel,
  statusLabels,
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
              <td>
                {new Date(item.createdAt).toLocaleString("ru-RU")}
              </td>
              <td>{item.name}</td>
              <td>{item.phone || "-"}</td>
              <td>{item.email || "-"}</td>
              <td>{item.source}</td>
              <td>{statusLabels[item.status]}</td>
              <td>{item.firstRequestId ?? "-"}</td>
            </tr>
          ))}
        </tbody>
    </AdminTable>
  );
}
