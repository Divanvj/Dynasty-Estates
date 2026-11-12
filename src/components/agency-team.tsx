"use client";

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { getMembers, getOwnAgency, getSentInvites, type Agency, type AgencyInvite, type AgencyMember } from "@/lib/agency";
import { lastDays, sumStats, type DayStats } from "@/lib/listing-stats";
import { getOwnerStats } from "@/lib/listing-stats-client";
import { getPractitioner } from "@/lib/practitioners";
import { asStage, getSellerInquiries, medianReplyMs, type SellerInquiry } from "@/lib/seller-inquiries";
import { getSellerListings, type SellerListing } from "@/lib/seller-listings";
import { ACTIVE_CATALOGUE_STATUSES } from "@/lib/types/domain";

/**
 * Everything the principal's pages need (PLAN.md Phase G), loaded once per
 * visit: the agency, its agents (the principal counts as one), their listings,
 * the enquiries on those listings and the last 30 days of listing stats.
 *
 * An enquiry is credited to the agent handling it: the one it is assigned to,
 * otherwise the listing's own agent. Figures come only from stored data; an
 * agent with nothing yet shows zeros and "None yet", never an estimate.
 */

export const WINDOW_DAYS = 30;

export type TeamAgent = {
  uid: string;
  name: string;
  email: string;
  isPrincipal: boolean;
  joinedAt: Date | null;
  listings: SellerListing[];
  activeListings: number;
  /** Enquiries this agent is handling, all time. */
  enquiries: SellerInquiry[];
  enquiries30: number;
  waiting: number;
  won30: number;
  reply: { ms: number; count: number } | null;
  views30: number | null;
  /** Daily listing stats for the last 60 days (null = couldn't be loaded), for trends and changes. */
  statsRows: DayStats[] | null;
};

export type AgencyLoad =
  | { state: "loading" }
  | { state: "error" }
  | { state: "none" }
  | {
      state: "ready";
      agency: Agency;
      agents: TeamAgent[];
      members: AgencyMember[];
      invites: AgencyInvite[];
      /** Every enquiry on the agency's listings, newest first. */
      enquiries: SellerInquiry[];
    };

export function useAgencyTeam(uid: string | null | undefined) {
  const { user } = useAuth();
  const [loaded, setLoaded] = useState<{ uid: string; load: AgencyLoad } | null>(null);
  const [version, setVersion] = useState(0);
  const [now] = useState(() => Date.now());
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      const agency = await getOwnAgency(uid);
      if (!agency) return { state: "none" } as AgencyLoad;
      const [members, invites, self] = await Promise.all([
        getMembers(uid),
        getSentInvites(uid),
        getPractitioner(uid).catch(() => null),
      ]);
      // Two windows' worth, so the overview can compare with the 30 days before.
      const since = lastDays(WINDOW_DAYS * 2, now)[0];
      const currentStart = lastDays(WINDOW_DAYS, now)[0];
      const people = [
        { uid, name: self?.fullName || user?.displayName || "You", email: user?.email ?? "", isPrincipal: true, joinedAt: agency.createdAt },
        ...members.map((m) => ({ uid: m.memberUid, name: m.name || m.email, email: m.email, isPrincipal: false, joinedAt: m.joinedAt })),
      ];
      const loads = await Promise.all(
        people.map(async (p) => {
          const [listings, enquiries, stats] = await Promise.all([
            getSellerListings(p.uid),
            getSellerInquiries(p.uid),
            getOwnerStats(p.uid, since).catch(() => null),
          ]);
          return { p, listings, enquiries, stats };
        }),
      );
      const all = loads.flatMap((l) => l.enquiries).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
      const cutoff = now - WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const agents: TeamAgent[] = loads.map(({ p, listings, stats }) => {
        const handling = all.filter((e) => (e.assignedTo ?? e.ownerId) === p.uid);
        const recent = handling.filter((e) => (e.createdAt?.getTime() ?? 0) >= cutoff);
        return {
          ...p,
          listings,
          activeListings: listings.filter((l) => (ACTIVE_CATALOGUE_STATUSES as readonly string[]).includes(l.status)).length,
          enquiries: handling,
          enquiries30: recent.length,
          waiting: handling.filter((e) => asStage(e.status) === "new").length,
          won30: recent.filter((e) => asStage(e.status) === "won").length,
          reply: medianReplyMs(handling, now, WINDOW_DAYS),
          views30: stats ? sumStats(stats.filter((s) => s.date >= currentStart)).views : null,
          statsRows: stats,
        };
      });
      return { state: "ready", agency, agents, members, invites, enquiries: all } as AgencyLoad;
    })()
      .then((load) => !cancelled && setLoaded({ uid, load }))
      .catch((error) => {
        console.error("Could not load the agency:", error);
        if (!cancelled) setLoaded({ uid, load: { state: "error" } });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, version, now, user?.displayName, user?.email]);

  const load: AgencyLoad = uid && loaded?.uid === uid ? loaded.load : uid === null ? { state: "none" } : { state: "loading" };
  return { load, reload, now };
}
