import { getImageProps } from "next/image";

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
    props: { srcSet: wide },
  } = getImageProps({ alt: "", sizes: "(min-aspect-ratio: 16/9) 100vw, 168vh", src: "/hero/home-hero-wide.webp", width: 2560, height: 1440 });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ alt: "", sizes: "100vw", src: "/hero/home-hero-tall.webp", width: 1080, height: 1920 });

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
      {/* Dark mode: the render is daylight, so it is dimmed rather than swapped. */}
      <div className="absolute inset-0 dark:bg-[rgba(4,10,12,0.45)]" />
      <div className="home-hero-fade absolute inset-0" />
    </div>
  );
}
