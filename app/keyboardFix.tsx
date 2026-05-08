'use client'
import { useEffect } from "react";

export default function KeyboardFix() {
  useEffect(() => {
    const handler = (e: any) => {
      const el = e.target;

      if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable
      ) {
        setTimeout(() => {
          el.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      }
    };

    document.addEventListener("focusin", handler);
    return () => document.removeEventListener("focusin", handler);
  }, []);

  return null;
}