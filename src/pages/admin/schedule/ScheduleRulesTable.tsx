import type { FormEvent } from "react";

import type { ScheduleRuleRecord } from "../../../types/schedule";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import styles from "./SchedulePage.module.css";
import { weekdayLabels } from "./schedulePage.shared";
import { AdminTimeSelect } from "../../../components/admin/AdminTimeSelect";

type ScheduleRulesTableProps = {
  isSaving: boolean;
  rules: ScheduleRuleRecord[];
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onRuleChange: (
    weekday: number,
    field: keyof ScheduleRuleRecord,
    value: string | boolean
  ) => void;
};

export function ScheduleRulesTable({
  isSaving,
  rules,
  onSave,
  onRuleChange,
}: ScheduleRulesTableProps) {
  return (
    <AdminSection title="Рабочие дни и часы">
      <form onSubmit={onSave} className={styles.rulesSection}>
        <div className={styles.rulesSectionHeader}>
          <AdminButton type="submit" disabled={isSaving} variant="primary">
            {isSaving ? "Сохранение..." : "Сохранить рабочие дни и часы"}
          </AdminButton>

          <p className={styles.rulesSectionHint}>
            Изменения рабочих дней и часов сохраняются этой кнопкой и общей логикой настроек.
          </p>
        </div>

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
                  <AdminTimeSelect
                    value={rule.startTime}
                    onChange={(nextTime) =>
                      onRuleChange(rule.weekday, "startTime", nextTime)
                    }
                    ariaLabel={`Начало рабочего дня: ${weekdayLabels[rule.weekday]}`}
                    disabled={!rule.isEnabled}
                    className={styles.timeSelect}
                  />
                </td>
                <td>
                  <AdminTimeSelect
                    value={rule.endTime}
                    onChange={(nextTime) =>
                      onRuleChange(rule.weekday, "endTime", nextTime)
                    }
                    ariaLabel={`Окончание рабочего дня: ${weekdayLabels[rule.weekday]}`}
                    disabled={!rule.isEnabled}
                    className={styles.timeSelect}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>

        <div className={styles.rulesSectionFooter}>
          <span className={styles.rulesSectionFootnote}>
            Если вы изменили расписание выше, нажмите кнопку сохранения в этом блоке.
          </span>
          <AdminButton
            type="submit"
            disabled={isSaving}
            variant="primary"
            className={styles.rulesSectionFooterButton}
          >
            {isSaving ? "Сохранение..." : "Сохранить изменения блока"}
          </AdminButton>
        </div>
      </form>
    </AdminSection>
  );
}