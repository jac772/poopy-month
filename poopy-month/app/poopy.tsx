"use client";

import { useEffect, useRef } from "react";
import { mountPoopy } from "../lib/poopy-app";

export default function Poopy() {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (ref.current) mountPoopy(ref.current);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return <div ref={ref} />;
}
