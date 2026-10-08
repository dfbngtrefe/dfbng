import React, { createContext, useContext } from "react";
import { ArrowRight } from "lucide-react";
export const Context = createContext();
export const useApp = () => useContext(Context);
export const safeGet = (key, fallback = null) => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
export const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};
export async function api(path, body) {
  const res = await fetch("/api" + path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "request_failed");
  return data;
}
export function Link({ to, children, className = "", ...props }) {
  const { navigate, site, path } = useApp();
  if (
    site &&
    !path.startsWith("/admin") &&
    !/^\/(?:api|admin|account|login|register|checkout|orders)(?:\/|$)/.test(to)
  ) {
    const mapped = site.links.find((x) => x.source === to);
    if (mapped && mapped.url === "")
      return (
        <span className={className} {...props}>
          {children}
        </span>
      );
    to = mapped?.url ?? to;
  }
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (
          to.startsWith("/") &&
          !to.startsWith("//") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.shiftKey &&
          e.button === 0
        ) {
          e.preventDefault();
          navigate(to);
        }
      }}
      {...props}
    >
      {children}
    </a>
  );
}
export function CTA({ to, children, dark = false }) {
  return (
    <Link to={to} className={"cta " + (dark ? "dark" : "")}>
      {children}
      <span>
        <ArrowRight size={17} />
      </span>
    </Link>
  );
}
