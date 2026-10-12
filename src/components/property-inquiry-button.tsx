"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { CheckIcon, XMarkIcon } from "@/components/icons";
import CustomSelect from "@/components/custom-select";
import { auth } from "@/lib/firebase";
import { createPropertyInquiry, type InquiryKind } from "@/lib/inquiries";

export default function PropertyInquiryButton({
  propertyId,
  propertyTitle,
  kind,
  children,
  className,
}: {
  propertyId: string;
  propertyTitle: string;
  kind: InquiryKind;
  children: React.ReactNode;
  className: string;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState("Morning (09:00 - 12:00)");
  const [buyerStatus, setBuyerStatus] = useState("Pre-approved bond");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.displayName) setFullName(currentUser.displayName);
        if (currentUser.email) setEmail(currentUser.email);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);

    try {
      const summaryText =
        kind === "message"
          ? `Status: ${buyerStatus}. Notes: ${notes || "Requesting property prospectus."}`
          : `Viewing on ${date} (${timeSlot}). Status: ${buyerStatus}. Notes: ${notes || "None"}`;

      await createPropertyInquiry({
        userId: user?.uid ?? `guest-${Date.now()}`,
        userEmail: email || user?.email || "anonymous@buyer.co.za",
        propertyId,
        propertyTitle,
        kind,
        notes: summaryText,
      });

      setSuccessNotice(true);
      setTimeout(() => {
        setSuccessNotice(false);
        setIsOpen(false);
      }, 2500);
    } catch (error) {
      // This used to show the success notice anyway, so a buyer was told their
      // enquiry had been sent when nothing was stored. Report the failure and
      // leave the form filled in so they can retry.
      console.error("Property enquiry failed to save:", error);
      setSubmitError(
        "We could not send your request. Please check your connection and try again, or contact the agent directly.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        {children}
      </button>

      {/* Interactive Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl text-slate-900 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)] dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200/80 pb-4 dark:border-white/10">
              <div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  {kind === "message" ? "Direct Enquiry" : "Private Viewing Appointment"}
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{propertyTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            {successNotice ? (
              <div className="py-8 text-center">
                <CheckIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="mt-2 text-base font-bold text-emerald-800 dark:text-emerald-400">Request Sent</h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Your request has been recorded against this listing. The practitioner will be in touch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
                {submitError ? (
                  <p
                    role="alert"
                    className="rounded-xl border border-rose-300/80 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-300"
                  >
                    {submitError}
                  </p>
                ) : null}

                {/* Contact Fields */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="inquiry-name" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                      Full Name
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Johan van der Merwe"
                      className="w-full h-[40px] rounded-xl border border-slate-300/80 bg-white px-3 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="inquiry-phone" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                      Phone Number
                    </label>
                    <input
                      id="inquiry-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 082 123 4567"
                      className="w-full h-[40px] rounded-xl border border-slate-300/80 bg-white px-3 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiry-email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                    Email Address
                  </label>
                  <input
                    id="inquiry-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. johan@example.co.za"
                    className="w-full h-[40px] rounded-xl border border-slate-300/80 bg-white px-3 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                  />
                </div>

                {/* Viewing Date & Time (if viewing/tour) */}
                {kind !== "message" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="inquiry-date" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                        Preferred Date
                      </label>
                      <input
                        id="inquiry-date"
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full h-[40px] rounded-xl border border-slate-300/80 bg-white px-3 font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="inquiry-time" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                        Preferred Time Slot
                      </label>
                      <CustomSelect
                        id="inquiry-time"
                        value={timeSlot}
                        onChange={(val) => setTimeSlot(val)}
                        options={[
                          "Morning (09:00 - 12:00)",
                          "Afternoon (14:00 - 17:00)",
                          "Late Afternoon (17:00 - 18:30)",
                          "Weekend Slot",
                        ]}
                        className="h-[40px]"
                        buttonClassName="w-full h-full rounded-xl border border-slate-300/80 bg-white px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex items-center justify-between dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Buyer Qualification Status */}
                <div>
                  <label htmlFor="inquiry-status" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                    Purchasing Position
                  </label>
                  <CustomSelect
                    id="inquiry-status"
                    value={buyerStatus}
                    onChange={(val) => setBuyerStatus(val)}
                    options={[
                      "Pre-approved bond (Ready to offer)",
                      "Cash buyer (Proof of funds available)",
                      "Subject to sale of existing property",
                      "Need bond pre-qualification assistance",
                    ]}
                    className="h-[40px]"
                    buttonClassName="w-full h-full rounded-xl border border-slate-300/80 bg-white px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 flex items-center justify-between dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="inquiry-notes" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 dark:text-slate-400">
                    Notes or Questions for Practitioner
                  </label>
                  <textarea
                    id="inquiry-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please confirm inverter battery capacity and body corporate rules for pets."
                    className="w-full rounded-xl border border-slate-300/80 bg-white px-3 py-2 font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-emerald-500"
                  />
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-slate-950 py-3 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                  >
                    {loading ? "Submitting..." : kind === "message" ? "Send Message to Practitioner" : "Confirm Viewing Request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
