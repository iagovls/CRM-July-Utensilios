"use client";

import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-[400px]",
    md: "max-w-[560px]",
    lg: "max-w-[800px]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white rounded-[28px] p-6 shadow-xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#2A2933] text-xl font-bold font-['Inter']">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[#F8F6F4] flex items-center justify-center hover:bg-[#E8E1DF] transition-colors"
          >
            <X className="w-5 h-5 text-[#616167]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
