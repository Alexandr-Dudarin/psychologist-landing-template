import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import styles from "./CustomSelect.module.css";

export type CustomSelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type CustomSelectVariant = "admin" | "public";
type CustomSelectLayout = "filter" | "form" | "full";
type CustomSelectDropdownAlign = "start" | "end";

type CustomSelectProps = {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  variant?: CustomSelectVariant;
  layout?: CustomSelectLayout;
  dropdownAlign?: CustomSelectDropdownAlign;
};

const variantClassNames: Record<CustomSelectVariant, string> = {
  admin: styles.rootAdmin,
  public: styles.rootPublic,
};

const layoutClassNames: Record<CustomSelectLayout, string> = {
  filter: styles.rootFilter,
  form: styles.rootForm,
  full: styles.rootFull,
};

function getEnabledOptionIndexes(options: CustomSelectOption[]): number[] {
  return options
    .map((option, index) => (!option.disabled ? index : -1))
    .filter((index) => index >= 0);
}

function getInitialHighlightedIndex(
  options: CustomSelectOption[],
  value: string
): number {
  const selectedIndex = options.findIndex(
    (option) => option.value === value && !option.disabled
  );

  if (selectedIndex >= 0) {
    return selectedIndex;
  }

  return getEnabledOptionIndexes(options)[0] ?? -1;
}

function getNextHighlightedIndex(
  options: CustomSelectOption[],
  currentIndex: number,
  direction: 1 | -1
): number {
  const enabledIndexes = getEnabledOptionIndexes(options);

  if (enabledIndexes.length === 0) {
    return -1;
  }

  const currentPosition = enabledIndexes.indexOf(currentIndex);

  if (currentPosition === -1) {
    return direction === 1
      ? enabledIndexes[0]
      : enabledIndexes[enabledIndexes.length - 1];
  }

  const nextPosition =
    (currentPosition + direction + enabledIndexes.length) %
    enabledIndexes.length;

  return enabledIndexes[nextPosition];
}

export function CustomSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Выберите значение",
  disabled = false,
  className = "",
  variant = "admin",
  layout = "filter",
  dropdownAlign = "start",
}: CustomSelectProps) {
  const generatedId = useId();
  const triggerId = `${generatedId}-trigger`;
  const listboxId = `${generatedId}-listbox`;

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(() =>
    getInitialHighlightedIndex(options, value)
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value]
  );

  const selectedLabel = selectedOption?.label ?? placeholder;
  const hasSelectedOption = selectedOption !== null;

  const rootClassName = [
    styles.root,
    variantClassNames[variant],
    layoutClassNames[layout],
    isOpen ? styles.rootOpen : "",
    disabled ? styles.rootDisabled : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const dropdownClassName = [
    styles.dropdown,
    dropdownAlign === "end" ? styles.dropdownEnd : "",
  ]
    .filter(Boolean)
    .join(" ");

  const openDropdown = () => {
    if (disabled) {
      return;
    }

    setHighlightedIndex(getInitialHighlightedIndex(options, value));
    setIsOpen(true);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const selectOption = (option: CustomSelectOption, index: number) => {
    if (option.disabled) {
      return;
    }

    setHighlightedIndex(index);

    if (option.value !== value) {
      onChange(option.value);
    }

    closeDropdown();
    triggerRef.current?.focus();
  };

  const handleTriggerClick = () => {
    if (disabled) {
      return;
    }

    if (isOpen) {
      closeDropdown();
      return;
    }

    openDropdown();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (!isOpen) {
        openDropdown();
        return;
      }

      setHighlightedIndex((currentIndex) =>
        getNextHighlightedIndex(options, currentIndex, 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (!isOpen) {
        openDropdown();
        return;
      }

      setHighlightedIndex((currentIndex) =>
        getNextHighlightedIndex(options, currentIndex, -1)
      );
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setHighlightedIndex(getEnabledOptionIndexes(options)[0] ?? -1);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();

      const enabledIndexes = getEnabledOptionIndexes(options);
      setHighlightedIndex(enabledIndexes[enabledIndexes.length - 1] ?? -1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      if (!isOpen) {
        openDropdown();
        return;
      }

      const highlightedOption = options[highlightedIndex];

      if (highlightedOption) {
        selectOption(highlightedOption, highlightedIndex);
      }

      return;
    }

    if (event.key === "Escape") {
      if (isOpen) {
        event.preventDefault();
        closeDropdown();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleDocumentPointerDown(event: MouseEvent | TouchEvent) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    }

    document.addEventListener("mousedown", handleDocumentPointerDown);
    document.addEventListener("touchstart", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentPointerDown);
      document.removeEventListener("touchstart", handleDocumentPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHighlightedIndex((currentIndex) => {
      const currentOption = options[currentIndex];

      if (currentOption && !currentOption.disabled) {
        return currentIndex;
      }

      return getInitialHighlightedIndex(options, value);
    });
  }, [isOpen, options, value]);

  useEffect(() => {
    if (disabled) {
      closeDropdown();
    }
  }, [disabled]);

  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
      >
        <span
          className={[
            styles.triggerLabel,
            !hasSelectedOption ? styles.triggerPlaceholder : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {selectedLabel}
        </span>

        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen ? (
        <div
          id={listboxId}
          className={dropdownClassName}
          role="listbox"
          aria-labelledby={triggerId}
        >
          {options.length > 0 ? (
            options.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  className={[
                    styles.option,
                    isSelected ? styles.optionSelected : "",
                    isHighlighted ? styles.optionHighlighted : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlightedIndex(index);
                    }
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option, index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>

                  {option.description ? (
                    <span className={styles.optionDescription}>
                      {option.description}
                    </span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className={styles.emptyOption}>Нет вариантов</div>
          )}
        </div>
      ) : null}
    </div>
  );
}