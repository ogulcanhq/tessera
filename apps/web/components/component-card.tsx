"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ComponentOutput } from "@/lib/registry";
import { usePrefersReducedMotion, useSiteTheme } from "./use-site-theme";

type Props = {
  component: ComponentOutput;
  categoryTitle: string;
  /** Larger type for the lead card in a featured layout. */
  size?: "default" | "large";
};

/**
 * Gallery card: the component's first recorded preview on its stage. Videos
 * play only while the card is on screen. Under Reduce Motion they don't play
 * on their own, only while the card is hovered or focused.
 */
export function ComponentCard({ component, categoryTitle, size = "default" }: Props) {
  const scheme = useSiteTheme();
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [engaged, setEngaged] = useState(false);

  const scenario = component.previews[0];
  const media = scenario?.media.find((m) => m.scheme === scheme) ?? scenario?.media[0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(video);
    return () => observer.disconnect();
  }, [media?.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && (!reducedMotion || engaged)) void video.play().catch(() => {});
    else video.pause();
  }, [visible, reducedMotion, engaged]);

  return (
    <Link
      href={`/components/${component.id}`}
      onPointerEnter={() => setEngaged(true)}
      onPointerLeave={() => setEngaged(false)}
      onFocus={() => setEngaged(true)}
      onBlur={() => setEngaged(false)}
      className="group flex h-full flex-col rounded-[var(--radius-card)] outline-offset-4"
    >
      <div
        data-theme={media?.scheme}
        className={`relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-stage transition-[border-color] duration-150 group-hover:border-line-strong ${
          size === "large" ? "aspect-[4/3] lg:aspect-auto lg:flex-1" : "aspect-[4/3]"
        }`}
      >
        {media?.kind === "video" ? (
          <video
            ref={videoRef}
            src={media.src}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            className="absolute inset-0 size-full object-cover"
          />
        ) : media?.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-meta text-muted">No preview recorded yet</span>
        )}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 px-0.5">
        <span className={`font-medium tracking-[-0.01em] ${size === "large" ? "text-title" : "text-body"}`}>
          {component.name}
        </span>
        <span className="shrink-0 text-meta text-muted">{categoryTitle}</span>
      </div>
      <p className="mt-0.5 line-clamp-1 px-0.5 text-small text-muted">{component.summary}</p>
    </Link>
  );
}
