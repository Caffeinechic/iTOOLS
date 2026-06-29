"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fieldInputClass } from "@/lib/tokens";

export function AppSelect({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn(fieldInputClass, "px-4", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-border/60 shadow-lg">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="rounded-xl py-2.5">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
