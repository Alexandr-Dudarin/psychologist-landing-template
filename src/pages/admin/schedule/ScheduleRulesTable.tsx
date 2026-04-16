import type { ScheduleRuleRecord } from "../../../types/schedule";

import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./SchedulePage.module.css";
import { weekdayLabels } from "./schedulePage.shared";

type ScheduleRulesTableProps = {
  rules: ScheduleRuleRecord[];
  onRuleChange: (
    weekday: number,
    field: keyof ScheduleRuleRecord,
    value: string | boolean
  ) => void;
};

export function ScheduleRulesTable({
  rules,
  onRuleChange,
}: ScheduleRulesTableProps) {
  return (
    <AdminSection title="Рабочие дни и часы">
      <AdminTable withTopMargin={false}>
          <thead>
            <tr>
              <th>День</th>
              <th>Активен</th>
              <th>Начало</th>
              <th>Окончание</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.weekday}>
                <td>{weekdayLabels[rule.weekday]}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={(event) =>
                      onRuleChange(rule.weekday, "isEnabled", event.target.checked)
                    }
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={rule.startTime}
                    onChange={(event) =>
                      onRuleChange(rule.weekday, "startTime", event.target.value)
                    }
                    disabled={!rule.isEnabled}
                    className={styles.input}
                  />
                </td>
                <td>
                  <input
                    type="time"
                    value={rule.endTime}
                    onChange={(event) =>
                      onRuleChange(rule.weekday, "endTime", event.target.value)
                    }
                    disabled={!rule.isEnabled}
                    className={styles.input}
                  />
                </td>
              </tr>
            ))}
          </tbody>
      </AdminTable>
    </AdminSection>
  );
}
