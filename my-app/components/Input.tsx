"use client";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[#2A2933] text-sm font-medium font-['Inter']">
          {label}
        </label>
      )}
      <input
        className={`w-full h-12 px-4 bg-[#F8F6F4] rounded-xl text-[#2A2933] font-['Inter'] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all ${
          error ? "ring-2 ring-red-400" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[#2A2933] text-sm font-medium font-['Inter']">
          {label}
        </label>
      )}
      <textarea
        className={`w-full min-h-[100px] px-4 py-3 bg-[#F8F6F4] rounded-xl text-[#2A2933] font-['Inter'] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all resize-none ${
          error ? "ring-2 ring-red-400" : ""
        } ${className}`}
        {...props}
      />
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-[#2A2933] text-sm font-medium font-['Inter']">
          {label}
        </label>
      )}
      <select
        className={`w-full h-12 px-4 bg-[#F8F6F4] rounded-xl text-[#2A2933] font-['Inter'] outline-none focus:ring-2 focus:ring-[#FFDAD8] transition-all ${
          error ? "ring-2 ring-red-400" : ""
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}
