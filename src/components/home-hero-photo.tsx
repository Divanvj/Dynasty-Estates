import { getImageProps } from "next/image";
import { preload } from "react-dom";

import HomeHeroScene from "@/components/home-hero-scene";

/**
 * The photograph behind the home hero (owner, 25 Nov 2026): a coastal living
 * room opening onto a pool and the sea. It is our own 3D render (Blender, CC0
 * assets from Poly Haven), not a listing and not stock, so it carries no
 * caption and claims no place. The render setup lives outside the repo in
 * `hero-render/`.
 *
 * Art-directed: a wide crop from `md` up and an upright crop on phones, so a
 * phone never downloads the desktop picture. Both go through the image
 * optimiser (AVIF/WebP at the screen's width). It is the page's largest paint,
 * so it loads eagerly at high priority.
 *
 * The fade over it (`.home-hero-fade` in globals.css) is the page background
 * colour: light at the top for the header, then rising from the bottom behind
 * the headline and search, so the text reads on the page colour and the photo
 * dissolves into the sections below without an edge.
 */
export default function HomeHeroPhoto() {
  // `sizes` is the width the photo is actually drawn at. The hero is often
  // taller than 16:9 (a 1024×768 window), and object-cover then widens the
  // 16:9 picture to the hero's height × 16/9, about 168vh at most; with plain
  // "100vw" the browser picked a picture that size and stretched it soft.
  const {
    props: { srcSet: wide, src: wideSrc },
  } = getImageProps({ alt: "", sizes: "(min-aspect-ratio: 16/9) 100vw, 168vh", src: "/hero/home-hero-wide.webp", width: 2560, height: 1440 });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ alt: "", sizes: "100vw", src: "/hero/home-hero-tall.webp", width: 1080, height: 1920 });

  // Preloaded from the <head>, one per screen size (`media`), so the browser
  // starts the photo before it has parsed down to the <picture>, and never
  // fetches the crop it will not show. Without it, PageSpeed (mobile) found
  // the photo ~620 ms late and the hero's largest paint was 4.4–4.8 s.
  preload(wideSrc, { as: "image", imageSrcSet: wide, imageSizes: "(min-aspect-ratio: 16/9) 100vw, 168vh", media: "(min-width: 768px)", fetchPriority: "high" });
  preload(img.src, { as: "image", imageSrcSet: tall, imageSizes: "100vw", media: "(max-width: 767px)", fetchPriority: "high" });

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <picture>
        <source media="(min-width: 768px)" srcSet={wide} sizes="(min-aspect-ratio: 16/9) 100vw, 168vh" />
        <source media="(max-width: 767px)" srcSet={tall} />
        {/* A plain <img> inside <picture> is how next/image art direction works (getImageProps). */}
        <img
          {...img}
          alt=""
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-cover object-[center_58%]"
        />
      </picture>
      {/* The scroll-driven camera move, drawn over the still once its frames
          have loaded (never for reduced motion, Data Saver or 2G). */}
      <HomeHeroScene />
      {/* Dark mode: the render is daylight, so it is dimmed rather than swapped. */}
      <div className="absolute inset-0 dark:bg-[rgba(4,10,12,0.45)]" />
      <div className="home-hero-fade absolute inset-0" />
    </div>
  );
}
