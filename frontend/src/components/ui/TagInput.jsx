import { useState } from "react";
import { X } from "lucide-react";

export function TagInput({ label, value = [], onChange, placeholder = "Add and press Enter" }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (value.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (t) => onChange(value.filter((x) => x !== t));

  return (
    <div>
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs font-medium text-brand-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="hover:text-brand-900"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={add}
          placeholder={value.length ? "" : placeholder}
          className="flex-1 min-w-[8ch] bg-transparent px-1 py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
