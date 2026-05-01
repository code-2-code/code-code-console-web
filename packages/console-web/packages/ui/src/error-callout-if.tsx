import type { ReactNode } from "react";
import { ErrorCallout } from "./error-callout";

type ErrorCalloutIfProps = {
  error?: unknown;
  children?: ReactNode;
  size?: "1" | "2";
  className?: string;
  mt?: string;
  mb?: string;
};

export function ErrorCalloutIf({
  error,
  children,
  size,
  className,
  mt,
  mb
}: ErrorCalloutIfProps) {
  const message = error == null ? children : errorMessage(error);

  if (message == null) {
    return null;
  }

  if (typeof message === "string" && message.trim() === "") {
    return null;
  }

  return (
    <ErrorCallout size={size} className={className} mt={mt} mb={mb}>
      {message}
    </ErrorCallout>
  );
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }
  if (typeof error === "string") {
    return error.trim();
  }
  return String(error);
}
