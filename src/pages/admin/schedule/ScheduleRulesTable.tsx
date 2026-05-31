import type { FormEvent } from "react";

import type { ScheduleRuleRecord } from "../../../types/schedule";

import { AdminButton } from "../../../components/admin/AdminButton";
import { AdminSection } from "../../../components/admin/AdminSection";
import { AdminTable } from "../../../components/admin/AdminTable";
import { AdminTimeSelect } from "../../../components/admin/AdminTimeSelect";
import styles from "./SchedulePage.module.css";
import {
  weekdayLabels,
  weekdayShortLabels,
  weekdayTinyLabels,
} from "./schedulePage.shared";

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
          <colgroup>
            <col className={styles.scheduleRuleDayColumn} />
            <col className={styles.scheduleRuleActiveColumn} />
            <col className={styles.scheduleRuleTimeColumn} />
            <col className={styles.scheduleRuleTimeColumn} />
          </colgroup>

          <thead>
            <tr>
              <th className={styles.scheduleRuleDayHeader}>День</th>
              <th className={styles.centerHeader}>
                <span className={styles.activeHeaderFull}>Активен</span>
                <span className={styles.activeHeaderCompact}>Вкл.</span>
              </th>
              <th className={styles.centerHeader}>Начало</th>
              <th className={styles.centerHeader}>Окончание</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((rule) => (
              <tr key={rule.weekday}>
                <td className={styles.scheduleRuleDayCell}>
                  <span className={styles.weekdayFull}>
                    {weekdayLabels[rule.weekday]}
                  </span>
                  <span className={styles.weekdayShort}>
                    {weekdayShortLabels[rule.weekday]}
                  </span>
                  <span className={styles.weekdayTiny}>
                    {weekdayTinyLabels[rule.weekday]}
                  </span>
                </td>

                <td className={styles.centerCell}>
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={(event) =>
                      onRuleChange(rule.weekday, "isEnabled", event.target.checked)
                    }
                  />
                </td>

                <td className={`${styles.centerCell} ${styles.scheduleTimeCell}`}>
                  <AdminTimeSelect
                    value={rule.startTime}
                    onChange={(nextTime) =>
                      onRuleChange(rule.weekday, "startTime", nextTime)
                    }
                    ariaLabel={`Начало рабочего дня: ${weekdayLabels[rule.weekday]}`}
                    disabled={!rule.isEnabled}
                    className={styles.timeSelect}
                    includePlaceholderOption={false}
                  />
                </td>

                <td className={`${styles.centerCell} ${styles.scheduleTimeCell}`}>
                  <AdminTimeSelect
                    value={rule.endTime}
                    onChange={(nextTime) =>
                      onRuleChange(rule.weekday, "endTime", nextTime)
                    }
                    ariaLabel={`Окончание рабочего дня: ${weekdayLabels[rule.weekday]}`}
                    disabled={!rule.isEnabled}
                    className={styles.timeSelect}
                    includePlaceholderOption={false}
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