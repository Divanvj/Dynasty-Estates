"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, XMarkIcon } from "@/components/icons";
import { useAuth } from "@/components/auth-provider";
import CustomSelect from "@/components/custom-select";
import { formatNumber } from "@/lib/formatters";
import { createTenantApplication } from "@/lib/tenant-applications";

interface TenantApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  monthlyRentZAR: number;
  depositZAR?: number;
}

export default function TenantApplicationModal({
  isOpen,
  onClose,
  propertyId,
  propertyTitle,
  monthlyRentZAR,
  depositZAR,
}: TenantApplicationModalProps) {
  const { user, demoUser } = useAuth();
  const signedInUser = user ?? demoUser;
  const deposit = depositZAR || Math.round(monthlyRentZAR * 1.5);
  const leaseFee = 1500;
  const keyDeposit = 750;
  const totalMoveInCost = monthlyRentZAR + deposit + leaseFee + keyDeposit;

  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [error, setError] = useState("");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Lock body scroll and handle ESC key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") onClose();
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [occupationDate, setOccupationDate] = useState("Immediate");
  const [leaseTerm, setLeaseTerm] = useState("12 Months");
  const [employer, setEmployer] = useState("");
  const [netIncome, setNetIncome] = useState("");
  const [creditConsent, setCreditConsent] = useState(false);

  const nameId = useId();
  const saIdId = useId();
  const emailId = useId();
  const phoneId = useId();
  const employerId = useId();
  const incomeId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!signedInUser) {
      setError("Please sign in before submitting a tenancy application.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      const { reference } = await createTenantApplication({
        applicantId: signedInUser.uid,
        applicantEmail: signedInUser.email ?? null,
        propertyId,
        propertyTitle,
        fullName,
        idNumber,
        email,
        phone,
        employer,
        netIncome,
        occupationDate,
        leaseTerm,
        monthlyRentZAR,
        depositZAR: deposit,
        totalMoveInCostZAR: totalMoveInCost,
        creditConsent,
      });

      setRefNumber(reference);
      setStep("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStep("form");
    setError("");
    onClose();
  }

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="fixed inset-0 bg-transparent cursor-pointer" onClick={onClose} />
      <div
        className="relative z-10 my-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-white/80 dark:border-white/10 bg-white/95 dark:bg-[#0c1a1c] p-6 shadow-2xl backdrop-blur-xl sm:p-8 max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tenant-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-colors cursor-pointer"
          aria-label="Close application modal"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>

        {step === "form" ? (
          <div>
            <div className="mb-5">
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 dark:shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                Digital Tenant Onboarding
              </span>
              <h2 id="tenant-modal-title" className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-2xl">
                Online Tenancy Application
              </h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Applying for <span className="font-semibold text-slate-900 dark:text-emerald-300">{propertyTitle}</span>
              </p>
            </div>

            {/* Move-in Cost Schedule Preview */}
            <div className="mb-6 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#060d0e]/60 p-4 text-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Mandatory Move-In Cost Schedule
              </p>
              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>First Month Rental:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R {formatNumber(monthlyRentZAR)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable Damage Deposit (1.5×):</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R {formatNumber(deposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lease Drafting & Credit Assessment:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R {formatNumber(leaseFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Key & Remote Access Deposit:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">R {formatNumber(keyDeposit)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-2 font-bold text-slate-950 dark:text-white text-sm">
                  <span>Total Due Prior to Occupation:</span>
                  <span className="text-emerald-800 dark:text-emerald-300">R {formatNumber(totalMoveInCost)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={nameId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    id={nameId}
                    type="text"
                    required
                    placeholder="e.g. Kabelo Mthembu"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label htmlFor={saIdId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    SA ID or Passport Number *
                  </label>
                  <input
                    id={saIdId}
                    type="text"
                    required
                    placeholder="13-digit SA ID"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={emailId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Email Address *
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    required
                    placeholder="you@domain.co.za"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label htmlFor={phoneId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Contact Number *
                  </label>
                  <input
                    id={phoneId}
                    type="tel"
                    required
                    placeholder="082 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={employerId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Current Employer / Occupation
                  </label>
                  <input
                    id={employerId}
                    type="text"
                    placeholder="e.g. Discovery Health / Senior Analyst"
                    value={employer}
                    onChange={(e) => setEmployer(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label htmlFor={incomeId} className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Monthly Net Income *
                  </label>
                  <input
                    id={incomeId}
                    type="text"
                    required
                    placeholder="e.g. R 45,000"
                    value={netIncome}
                    onChange={(e) => setNetIncome(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#091518] px-3 py-2 text-xs text-slate-900 dark:text-white shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Target Occupation Date</label>
                  <CustomSelect
                    value={occupationDate}
                    onChange={(val) => setOccupationDate(val)}
                    options={[
                      { value: "Immediate", label: "Immediate / Within 7 Days" },
                      { value: "1st of next month", label: "1st of Next Month" },
                      { value: "15th of next month", label: "15th of Next Month" },
                      { value: "Flexible", label: "Flexible Negotiation" },
                    ]}
                    ariaLabel="Target Occupation Date"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">Proposed Lease Duration</label>
                  <CustomSelect
                    value={leaseTerm}
                    onChange={(val) => setLeaseTerm(val)}
                    options={[
                      { value: "12 Months", label: "12 Months (Standard)" },
                      { value: "24 Months", label: "24 Months (Long Term)" },
                      { value: "6 Months", label: "6 Months (Short Term)" },
                    ]}
                    ariaLabel="Proposed Lease Duration"
                  />
                </div>
              </div>

              {/* TPN Credit Consent Checkbox */}
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#060d0e]/60 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={creditConsent}
                    onChange={(e) => setCreditConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    I hereby give consent to Dynasty Estates to perform a credit bureau verification via{" "}
                    <span className="font-bold text-slate-900 dark:text-emerald-400">TPN (Tenant Profile Network)</span> and contact my employer and prior landlord for references under the National Credit Act and POPIA.
                  </span>
                </label>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-[11px] leading-relaxed text-red-700 dark:text-red-300"
                >
                  {error}
                </p>
              ) : null}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-slate-950 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 py-3 text-xs font-bold text-white shadow-lg dark:shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-transparent dark:border-emerald-500/50 disabled:opacity-50 transition-all cursor-pointer text-center"
                >
                  {submitting ? "Submitting Application..." : "Submit Digital Tenancy Application →"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 mb-4 dark:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <CheckIcon className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Application Received!</h2>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              Thank you, <span className="font-bold text-slate-900 dark:text-white">{fullName}</span>. Your application for{" "}
              <span className="font-semibold text-slate-900 dark:text-emerald-300">{propertyTitle}</span> has been logged under reference:
            </p>
            <div className="my-4 inline-block rounded-xl bg-slate-100 dark:bg-[#060d0e]/80 px-4 py-2 text-xs font-mono font-bold text-slate-800 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/30 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              {refNumber || "DY-TEN-849201"}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Our leasing practitioner will review your pre-vetting score and contact you within 24 hours to collect FICA documents (3 months bank statements & payslips).
            </p>
            <button
              onClick={handleReset}
              className="mt-6 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] border border-emerald-500/40 transition-all cursor-pointer"
            >
              Done & Return to Listing
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
