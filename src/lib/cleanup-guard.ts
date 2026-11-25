/**
 * Decides whether a night's listing-file clean-up looks safe to run
 * (audit item 1.8). Kept free of Firebase so it can be tested on its own.
 *
 * The clean-up deletes every photo and floor plan that no listing refers to.
 * If its list of in-use files comes back empty or wrong (a failed or partial
 * read, a renamed bucket, a changed download-URL format), every file looks
 * unused, and there are no backups to bring them back. So it stops when the
 * numbers look like that instead of like an ordinary night.
 */

/** A night that would delete more than this share of all files is held back. */
export const MAX_DELETE_SHARE = 0.5;
/** ...unless it is only a handful of files, which is normal for a small bucket. */
export const MIN_FILES_FOR_SHARE_CHECK = 20;

export type CleanupCounts = {
  /** Listings read from Firestore. */
  listings: number;
  /** Distinct file paths those listings refer to. */
  referenced: number;
  /** Files found in the bucket under the listing folders. */
  scanned: number;
  /** Bucket files that a listing refers to. */
  matched: number;
  /** Bucket files that are unreferenced and past the grace period: tonight's deletions. */
  candidates: number;
};

export type CleanupVerdict = { ok: true } | { ok: false; reason: string };

export function cleanupVerdict(c: CleanupCounts): CleanupVerdict {
  if (c.listings > 0 && c.referenced === 0) {
    return { ok: false, reason: `${c.listings} listing(s) were read but none referred to a file, so every file looked unused.` };
  }
  if (c.referenced > 0 && c.scanned > 0 && c.matched === 0) {
    return { ok: false, reason: `None of the ${c.scanned} file(s) in the bucket matches any of the ${c.referenced} path(s) the listings refer to; the bucket or the download-URL format may have changed.` };
  }
  if (c.candidates >= MIN_FILES_FOR_SHARE_CHECK && c.scanned > 0 && c.candidates / c.scanned > MAX_DELETE_SHARE) {
    const pct = Math.round((100 * c.candidates) / c.scanned);
    return { ok: false, reason: `${c.candidates} of ${c.scanned} files (${pct}%) would be deleted in one night, more than the ${Math.round(MAX_DELETE_SHARE * 100)}% limit.` };
  }
  return { ok: true };
}
