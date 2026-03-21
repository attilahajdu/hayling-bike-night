"use client";

import { useEffect } from "react";

/** Ensures /gallery#community-photos lands on the community section after App Router navigation. */
export function GalleryHashScroll() {
  useEffect(() => {
    if (window.location.hash !== "#community-photos") return;
    const run = () => document.getElementById("community-photos")?.scrollIntoView({ behavior: "smooth", block: "start" });
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, []);
  return null;
}
