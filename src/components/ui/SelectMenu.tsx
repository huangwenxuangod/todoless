import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { DropdownMenu, type DropdownMenuOption } from "./DropdownMenu";

export type SelectMenuOption<T extends string> = DropdownMenuOption<T>;

export function SelectMenu<T extends string>({
  onChange,
  options,
  value,
}: {
  onChange: (value: T) => void;
  options: Array<SelectMenuOption<T>>;
  value: T;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="select-menu-wrap">
      <button className="select-menu-trigger" onClick={() => setOpen((current) => !current)} type="button">
        <span>{selected?.label}</span>
        <ChevronDown size={14} />
      </button>
      {open ? (
        <DropdownMenu
          activeValue={value}
          onSelect={(nextValue) => {
            onChange(nextValue);
            setOpen(false);
          }}
          options={options}
        />
      ) : null}
    </div>
  );
}
