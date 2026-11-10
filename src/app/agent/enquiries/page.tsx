"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { FilterChips, PageHeading, panelClass } from "@/components/dashboard-ui";
import { EnquiryList, useOwnerInquiries } from "@/components/enquiry-inbox";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 10A — Inbox (docs/dashboards/PLAN.md, Phase A). The queue of buyers'
// enquiries on this agent's listings, newest first, worked in place.

type Show = "all" | "new" | "contacted";

function EnquiriesInbox() {
  const params = useSearchParams();
  const initial = params.get("show");
  const [show, setShow] = useState<Show>(initial === "new" || initial === "contacted" ? initial : "all");
  const uid = useAccountUid();
  const inbox = useOwnerInquiries(uid);

  const counts = {
    all: inbox.items.length,
    new: inbox.items.filter((item) => item.status === "new").length,
    contacted: inbox.items.filter((item) => item.status !== "new").length,
  };
  const visible = inbox.items.filter((item) =>
    show === "all" ? true : show === "new" ? item.status === "new" : item.status !== "new",
  );

  // Arriving from the dashboard with #enquiry-<id>: scroll to it once loaded.
  const ready = inbox.state === "ready";
  useEffect(() => {
    if (!ready || !window.location.hash.startsWith("#enquiry-")) return;
    document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [ready]);

  return (
    <>
      <PageHeading
        title="Enquiries"
        description="Buyers’ messages and viewing requests on your listings, newest first. We don’t send email or SMS alerts yet, so check back here."
      />
      <section aria-label="Enquiries" className={panelClass}>
        <FilterChips<Show>
          label="Show enquiries"
          value={show}
          onChange={setShow}
          options={[
            { value: "all", label: "All", count: ready ? counts.all : undefined },
            { value: "new", label: "New", count: ready ? counts.new : undefined },
            { value: "contacted", label: "Contacted", count: ready ? counts.contacted : undefined },
          ]}
        />
        <EnquiryList
          {...inbox}
          items={visible}
          emptyMessage={
            show === "all" || inbox.items.length === 0
              ? "No enquiries on your listings yet. When a buyer messages you or asks for a viewing, it shows here."
              : show === "new"
                ? "No new enquiries. Every buyer has been contacted."
                : "No contacted enquiries yet."
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
