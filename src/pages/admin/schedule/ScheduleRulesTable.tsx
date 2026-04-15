import type { ScheduleRuleRecord } from "../../../types/schedule";

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
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Рабочие дни и часы</h2>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableHeadCell}>День</th>
              <th className={styles.tableHeadCell}>Активен</th>
              <th className={styles.tableHeadCell}>Начало</th>
              <th className={styles.tableHeadCell}>Окончание</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.weekday}>
                <td className={styles.tableCell}>{weekdayLabels[rule.weekday]}</td>
                <td className={styles.tableCell}>
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={(event) =>
                      onRuleChange(rule.weekday, "isEnabled", event.target.checked)
                    }
                  />
                </td>
                <td className={styles.tableCell}>
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
                <td className={styles.tableCell}>
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
        </table>
      </div>
    </section>
  );
}
