import { useMemo } from "react";

import {
  CustomSelect,
  type CustomSelectOption,
} from "../ui/CustomSelect";

type AdminTimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  startHour?: number;
  endHour?: number;
  minuteStep?: number;
};

function normalizeTimeValue(value: string): string {
  const match = value.match(/^(\d{2}):(\d{2})/);

  if (!match) {
    return value;
  }

  return `${match[1]}:${match[2]}`;
}

function buildTimeOptions({
  value,
  placeholder,
  startHour,
  endHour,
  minuteStep,
}: {
  value: string;
  placeholder: string;
  startHour: number;
  endHour: number;
  minuteStep: number;
}): CustomSelectOption[] {
  const normalizedValue = normalizeTimeValue(value);
  const options = new Set<string>();

  for (let hour = startHour; hour <= endHour; hour += 1) {
    for (let minute = 0; minute < 60; minute += minuteStep) {
      options.add(
        `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      );
    }
  }

  if (normalizedValue) {
    options.add(normalizedValue);
  }

  return [
    {
      value: "",
      label: placeholder,
    },
    ...Array.from(options)
      .sort((left, right) => left.localeCompare(right))
      .map((time) => ({
        value: time,
        label: time,
      })),
  ];
}

export function AdminTimeSelect({
  value,
  onChange,
  ariaLabel,
  disabled = false,
  className = "",
  placeholder = "Выберите время",
  startHour = 0,
  endHour = 23,
  minuteStep = 15,
}: AdminTimeSelectProps) {
  const normalizedValue = normalizeTimeValue(value);

  const options = useMemo(
    () =>
      buildTimeOptions({
        value: normalizedValue,
        placeholder,
        startHour,
        endHour,
        minuteStep,
      }),
    [endHour, minuteStep, normalizedValue, placeholder, startHour]
  );

  return (
    <CustomSelect
      value={normalizedValue}
      options={options}
      onChange={onChange}
      ariaLabel={ariaLabel}
      disabled={disabled}
      variant="admin"
      layout="form"
      dropdownWidth="trigger"
      className={className}
    />
  );
}