import React from "react";
import clsx from "classnames";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const LinkButton: React.FC<Props> = ({
  children,
  className,
  variant = "primary",
  startIcon,
  endIcon,
  ...props
}) => {
  return (
    <button
      className={clsx(
        "link-button",
        variant === "ghost" && "text-slate-600 dark:text-slate-300",
        className
      )}
      {...props}
    >
      {startIcon}
      {children}
      {endIcon}
    </button>
  );
};
