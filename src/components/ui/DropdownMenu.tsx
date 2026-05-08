import type { LucideIcon } from "lucide-react";

export type DropdownMenuOption<T extends string> = {
  description?: string;
  icon?: LucideIcon;
  label: string;
  value: T;
};

export function DropdownMenu<T extends string>({
  activeValue,
  className = "select-menu",
  itemClassName = "select-menu-item",
  onSelect,
  options,
}: {
  activeValue?: T;
  className?: string;
  itemClassName?: string;
  onSelect: (value: T) => void;
  options: Array<DropdownMenuOption<T>>;
}) {
  return (
    <div className={className}>
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            className={option.value === activeValue ? `${itemClassName} active` : itemClassName}
            key={option.value}
            onClick={() => onSelect(option.value)}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
          >
            {Icon ? <Icon size={14} /> : null}
            <span>{option.label}</span>
            {option.description ? <small>{option.description}</small> : null}
          </button>
        );
      })}
    </div>
  );
}
