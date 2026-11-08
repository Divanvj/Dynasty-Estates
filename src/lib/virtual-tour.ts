/**
 * A listing's tour link, as the agent pasted it in the listing wizard, turned
 * into something the listing page can show.
 *
 * The listing page used to carry a "3D tour" built from the ordinary photos:
 * it panned them, linked them with invented room hotspots and offered a
 * "Dollhouse" view and a "Laser Tape" with made-up measurements. That is gone.
 * A tour now appears only when the agent supplied a real one.
 */

export type TourKind = "3d" | "video" | "link";

export type ListingTour = {
  kind: TourKind;
  /** The agent's own link, opened in a new tab. */
  url: string;
  /** Present for providers that allow embedding; otherwise only the link shows. */
  embedUrl?: string;
};

/** Parses an agent-supplied tour link. Anything that is not an https URL is ignored. */
export function parseTourUrl(raw: string | undefined | null): ListingTour | null {
  const value = raw?.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  // Matterport: my.matterport.com/show/?m=<model id>
  if (host === "my.matterport.com" || host === "matterport.com") {
    const model = url.searchParams.get("m");
    if (model && /^[A-Za-z0-9]{6,32}$/.test(model)) {
      return { kind: "3d", url: url.toString(), embedUrl: `https://my.matterport.com/show/?m=${model}&play=0` };
    }
    return { kind: "3d", url: url.toString() };
  }

  // YouTube: watch?v=, youtu.be/<id>, /shorts/<id>, /embed/<id>
  const youTubeId =
    host === "youtu.be"
      ? url.pathname.slice(1)
      : host === "youtube.com" || host === "m.youtube.com"
        ? url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] ?? ""
        : "";
  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    return /^[A-Za-z0-9_-]{11}$/.test(youTubeId)
      ? { kind: "video", url: url.toString(), embedUrl: `https://www.youtube-nocookie.com/embed/${youTubeId}` }
      : { kind: "video", url: url.toString() };
  }

  // Vimeo: vimeo.com/<numeric id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const vimeoId = url.pathname.match(/(\d{6,12})/)?.[1];
    return vimeoId
      ? { kind: "video", url: url.toString(), embedUrl: `https://player.vimeo.com/video/${vimeoId}` }
      : { kind: "video", url: url.toString() };
  }

  // Any other https tour host: shown as a link only, never framed.
  return { kind: "link", url: url.toString() };
}

export function tourTabLabel(kind: TourKind): string {
  return kind === "3d" ? "3D tour" : kind === "video" ? "Video tour" : "Virtual tour";
}
