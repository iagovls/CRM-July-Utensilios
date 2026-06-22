"use client";

interface KPICardProps {
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}

export default function KPICard({ label, value, note, highlight = false }: KPICardProps) {
  return (
    <div
      className={`rounded-[28px] p-5 flex flex-col gap-3 ${
        highlight ? "bg-[#FFDAD8]" : "bg-white"
      }`}
    >
      <span className="text-[#2A2933] text-[13px] font-semibold font-['Inter']">
        {label}
      </span>
      <span className="text-[#2A2933] text-[28px] font-bold font-['Inter'] leading-none">
        {value}
      </span>
      <span className="text-[#616167] text-xs font-normal font-['Inter']">
        {note}
      </span>
    </div>
  );
}
