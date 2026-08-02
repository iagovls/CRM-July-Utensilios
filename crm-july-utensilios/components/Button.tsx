"use client";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: "bg-[#FFDAD8] hover:bg-[#FFC5C2] text-[#2A2933]",
    secondary: "bg-[#F8F6F4] hover:bg-[#E8E1DF] text-[#2A2933]",
    danger: "bg-[#C23A2E] hover:bg-[#A52E26] text-white",
    ghost: "bg-transparent hover:bg-[#F8F6F4] text-[#616167]",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      className={`rounded-xl font-semibold font-['Inter'] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
