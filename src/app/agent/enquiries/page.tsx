"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { FilterChips, formatAge, PageHeading, panelClass, SummaryStrip } from "@/components/dashboard-ui";
import { EnquiryList, useOwnerInquiries } from "@/components/enquiry-inbox";
import { replyFigures, REPLY_TARGET_MS } from "@/lib/dashboard-math";
import { asStage, INQUIRY_STAGES, STAGE_LABEL, type InquiryStage } from "@/lib/seller-inquiries";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 10A — Inbox (docs/dashboards/PLAN.md, Phase A). The queue of buyers'
// enquiries on this agent's listings, newest first, worked in place. Phase D:
// each enquiry moves through stages, with a filter chip per stage.

type Show = "all" | InquiryStage;

const EMPTY_FOR: Record<InquiryStage, string> = {
  new: "No new enquiries. Every buyer has had a reply.",
  contacted: "No enquiries at Contacted.",
  viewing: "No enquiries with a viewing booked.",
  offer: "No enquiries with an offer made.",
  won: "No won enquiries yet.",
  lost: "No lost enquiries.",
};

function EnquiriesInbox() {
  const params = useSearchParams();
  const initial = params.get("show");
  const [show, setShow] = useState<Show>(
    initial && (INQUIRY_STAGES as readonly string[]).includes(initial) ? (initial as InquiryStage) : "all",
  );
  const uid = useAccountUid();
  const inbox = useOwnerInquiries(uid);

  const countOf = (stage: InquiryStage) => inbox.items.filter((item) => asStage(item.status) === stage).length;
  const visible = inbox.items.filter((item) => show === "all" || asStage(item.status) === show);

  // Arriving from the dashboard with #enquiry-<id>: scroll to it once loaded.
  const ready = inbox.state === "ready";
  const [now] = useState(() => Date.now());
  const waiting = inbox.items.filter((item) => asStage(item.status) === "new");
  const oldestWait = waiting.reduce<Date | null>((old, item) => (item.createdAt && (!old || item.createdAt < old) ? item.createdAt : old), null);
  const late = oldestWait !== null && now - oldestWait.getTime() > REPLY_TARGET_MS;
  const replies = replyFigures(inbox.items, now);
  const open = inbox.items.filter((item) => !["won", "lost"].includes(asStage(item.status))).length;
  useEffect(() => {
    if (!ready || !window.location.hash.startsWith("#enquiry-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [ready]);

  return (
    <>
      <PageHeading
        title="Enquiries"
        description="Buyers’ messages and viewing requests on your listings, newest first. Move each one through its stages as it progresses. We don’t send email or SMS alerts yet, so check back here."
      />
      <SummaryStrip
        label="Enquiries at a glance"
        items={[
          { label: "Open", value: ready ? String(open) : null, note: "Not yet won or lost" },
          {
            label: "Waiting for a reply",
            value: ready ? String(waiting.length) : null,
            note: oldestWait ? `Oldest ${formatAge(oldestWait, now)}${late ? ", past the 1 h target" : ""}` : "Nobody is waiting",
            tone: late ? "late" : undefined,
          },
          {
            label: "Replied within 1 h",
            value: ready ? (replies ? `${Math.round(replies.withinTarget * 100)}%` : "–") : null,
            note: replies ? `${replies.count} first ${replies.count === 1 ? "reply" : "replies"}, last 30 days` : "No first replies in 30 days",
          },
          { label: "Won", value: ready ? String(countOf("won")) : null, note: "All time", tone: "accent" },
        ]}
      />
      <section aria-label="Enquiries" className={panelClass}>
        <FilterChips<Show>
          label="Show enquiries"
          value={show}
          onChange={setShow}
          options={[
            { value: "all", label: "All", count: ready ? inbox.items.length : undefined },
            ...INQUIRY_STAGES.map((stage) => ({ value: stage, label: STAGE_LABEL[stage], count: ready ? countOf(stage) : undefined })),
          ]}
        />
        <EnquiryList
          {...inbox}
          stages="pipeline"
          items={visible}
          emptyMessage={
            show === "all" || inbox.items.length === 0
              ? "No enquiries on your listings yet. When a buyer messages you or asks for a viewing, it shows here."
              : EMPTY_FOR[show]
          }
        />
      </section>
    </>
  );
}

export default function AgentEnquiriesPage() {
  return (
    <Suspense fallback={<p role="status" className="text-sm text-slate-600 dark:text-slate-300">Loading…</p>}>
      <EnquiriesInbox />
    </Suspense>
  );
}
