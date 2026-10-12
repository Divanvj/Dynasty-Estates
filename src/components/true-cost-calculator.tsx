"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  ArrowRightIcon,
  CheckIcon,
  ChevronDownIcon,
  InfoCircleIcon,
  SparklesIcon,
  XMarkIcon,
} from "@/components/icons";
import { formatNumber } from "@/lib/formatters";

export function calculateSARSTransferDuty(price: number): number {
  if (price <= 1100000) return 0;
  if (price <= 1512500) return Math.round((price - 1100000) * 0.03);
  if (price <= 2722500) return Math.round(25250 + (price - 1512500) * 0.08);
  if (price <= 12100000) return Math.round(98250 + (price - 2722500) * 0.11);
  return Math.round(1129775 + (price - 12100000) * 0.13);
}

export default function TrueCostCalculator({
  askingPriceZAR,
  monthlyLevy = 2200,
  monthlyRates = 1850,
  listingType = "sale",
  leaseTerm = "12 Months",
  depositRequiredZAR,
  furnishedStatus,
}: {
  askingPriceZAR: number;
  monthlyLevy?: number;
  monthlyRates?: number;
  listingType?: "sale" | "rent";
  leaseTerm?: string;
  depositRequiredZAR?: number;
  furnishedStatus?: string;
}) {
  const [purchasePrice, setPurchasePrice] = useState<number>(askingPriceZAR);
  const [depositPercent, setDepositPercent] = useState<number>(10);
  const [interestRate, setInterestRate] = useState<number>(11.75); // SA benchmark prime
  const [tenureYears, setTenureYears] = useState<number>(20);
  const [levy, setLevy] = useState<number>(monthlyLevy);
  const [rates, setRates] = useState<number>(monthlyRates);
  const [includeInsurance, setIncludeInsurance] = useState<boolean>(false);
  const [showUpfrontModal, setShowUpfrontModal] = useState<boolean>(false);
  const [showPreApprovalModal, setShowPreApprovalModal] = useState<boolean>(false);
  const [showCustomSettings, setShowCustomSettings] = useState<boolean>(false);

  // Rental specific state
  const [monthlyRent, setMonthlyRent] = useState<number>(askingPriceZAR);
  const initialDepositMultiple = depositRequiredZAR && askingPriceZAR > 0
    ? Math.round((depositRequiredZAR / askingPriceZAR) * 10) / 10
    : 1;
  const [depositMultiple, setDepositMultiple] = useState<number>(initialDepositMultiple || 1);
  const [utilities, setUtilities] = useState<number>(1850);
  const [includeTenantInsurance, setIncludeTenantInsurance] = useState<boolean>(false);
  const utilitiesInputId = useId();

  const priceId = useId();
  const depositId = useId();
  const rateId = useId();
  const tenureId = useId();

  // Rental financial calculations
  const {
    depositZAR,
    leaseAdminFee,
    totalMonthlyRentalCost,
    totalMoveInCash,
    recommendedGrossIncome,
  } = useMemo(() => {
    const dep = Math.round(monthlyRent * depositMultiple);
    const adminFee = 1450;
    const insurance = includeTenantInsurance ? 350 : 0;
    const monthlyTotal = monthlyRent + utilities + insurance;
    const moveIn = monthlyRent + dep + adminFee;
    const recIncome = Math.round(monthlyTotal / 0.3);

    return {
      depositZAR: dep,
      leaseAdminFee: adminFee,
      totalMonthlyRentalCost: monthlyTotal,
      totalMoveInCash: moveIn,
      recommendedGrossIncome: recIncome,
    };
  }, [monthlyRent, depositMultiple, utilities, includeTenantInsurance]);

  function handleRentalReset() {
    setMonthlyRent(askingPriceZAR);
    setDepositMultiple(initialDepositMultiple || 1);
    setUtilities(1850);
    setIncludeTenantInsurance(false);
  }

  function adjustUtilities(delta: number) {
    setUtilities((prev) => Math.max(0, prev + delta));
  }

  // Financial calculations
  const {
    depositAmount,
    principal,
    monthlyBond,
    totalMonthlyCost,
    transferDuty,
    conveyancingFee,
    bondRegFee,
    totalUpfrontCash,
  } = useMemo(() => {
    const dep = Math.round((purchasePrice * depositPercent) / 100);
    const loan = Math.max(0, purchasePrice - dep);
    const monthlyRate = interestRate / 100 / 12;
    const numMonths = tenureYears * 12;

    let bond = 0;
    if (loan > 0 && monthlyRate > 0) {
      bond = Math.round(
        (loan * (monthlyRate * Math.pow(1 + monthlyRate, numMonths))) /
          (Math.pow(1 + monthlyRate, numMonths) - 1)
      );
    }

    const duty = calculateSARSTransferDuty(purchasePrice);
    const legalConveyancing =
      purchasePrice > 0 ? Math.round(18000 + Math.min(purchasePrice, 10000000) * 0.0055) : 0;
    const legalBond =
      loan > 0 ? Math.round(16000 + Math.min(loan, 10000000) * 0.0045) : 0;
    const insurance = includeInsurance
      ? Math.round(purchasePrice * 0.00035 + loan * 0.00045)
      : 0;
    const total = bond + levy + rates + insurance;
    const totalUpfront = dep + duty + legalConveyancing + legalBond;

    return {
      depositAmount: dep,
      principal: loan,
      monthlyBond: bond,
      estInsurance: insurance,
      totalMonthlyCost: total,
      transferDuty: duty,
      conveyancingFee: legalConveyancing,
      bondRegFee: legalBond,
      totalUpfrontCash: totalUpfront,
    };
  }, [purchasePrice, depositPercent, interestRate, tenureYears, levy, rates, includeInsurance]);

  function handleReset() {
    setPurchasePrice(askingPriceZAR);
    setDepositPercent(10);
    setInterestRate(11.75);
    setTenureYears(20);
    setLevy(monthlyLevy);
    setRates(monthlyRates);
    setIncludeInsurance(false);
  }

  // Steppers
  function adjustDeposit(delta: number) {
    setDepositPercent((prev) => Math.min(50, Math.max(0, Math.round((prev + delta) * 10) / 10)));
  }

  function adjustRate(delta: number) {
    setInterestRate((prev) => Math.min(18, Math.max(6, Math.round((prev + delta) * 100) / 100)));
  }

  function adjustPrice(delta: number) {
    setPurchasePrice((prev) => Math.max(500000, prev + delta));
  }

  if (listingType === "rent") {
    return (
      <div className="rounded-[30px] border border-white/80 bg-white/55 p-5 sm:p-6 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
        {/* Header & Total Monthly Cost */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3 dark:border-white/10">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.24em] text-amber-800 font-bold dark:text-amber-400">
                Dynasty True Cost™
              </span>
              <span className="rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-[9px] font-bold px-2 py-0.5 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-500/30">
                Tenant Lease Model
              </span>
            </div>
            <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
              Estimated Total Monthly Cost
            </h2>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-amber-400">
              R {formatNumber(totalMonthlyRentalCost)}
            </span>
            <span className="block text-[10px] text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Rent + Utilities / month
            </span>
          </div>
        </div>

        {/* Breakdown Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
              Monthly Rent
            </p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              R {formatNumber(monthlyRent)}
            </p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
              Est. Utilities
            </p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              R {formatNumber(utilities)}
            </p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
              Insurance
            </p>
            <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {includeTenantInsurance ? "R 350" : "Optional"}
            </p>
          </div>
        </div>

        {/* Interactive Sliders & Controls */}
        <div className="mt-5 space-y-5 text-xs text-slate-700 border-t border-slate-200/60 pt-4 dark:text-slate-300 dark:border-white/10">
          {/* The advertised rent, stated rather than adjustable.
              This used to be an offer slider with -5% / +5% chips. A rental is
              not negotiated on a listing page the way a purchase is: the
              advertised figure is the rent, and inviting someone to budget on a
              discount no landlord has agreed to produces a move-in total that is
              simply wrong. The variables below it — deposit term, lease length,
              utilities, insurance — are the ones that genuinely differ, so those
              stay adjustable. */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2.5 dark:border-white/10 dark:bg-[#060d0e]/60">
            <div>
              <span className="font-semibold">Advertised monthly rent</span>
              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                Set by the landlord. Any variation is agreed on application.
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-slate-950 dark:text-white">
              R {formatNumber(monthlyRent)} <span className="font-medium opacity-60">/ mo</span>
            </span>
          </div>

          {/* Security Deposit Selection */}
          <div>
            <div className="flex items-center justify-between font-semibold mb-1.5">
              <span>Security Deposit Term</span>
              <span className="text-slate-950 font-bold text-xs dark:text-white">
                {depositMultiple}x month (R {formatNumber(depositZAR)})
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "1 Month", value: 1 },
                { label: "1.5 Months", value: 1.5 },
                { label: "2 Months", value: 2 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setDepositMultiple(item.value)}
                  className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                    depositMultiple === item.value
                      ? "bg-slate-950 text-white shadow-sm dark:bg-amber-600 dark:text-white dark:shadow-[0_0_12px_rgba(217,119,6,0.3)]"
                      : "border border-slate-200 bg-white/70 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Utilities & Tenant Insurance Controls */}
          <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/60 p-3.5 shadow-sm dark:border-white/10 dark:bg-[#060d0e]/60">
            <div className="flex items-center justify-between">
              <label htmlFor={utilitiesInputId} className="font-semibold text-slate-800 text-xs dark:text-slate-300">
                Estimated Water & Electricity:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustUtilities(-250)}
                  className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  -
                </button>
                <span className="font-bold text-slate-900 text-xs min-w-[60px] text-center dark:text-white">
                  R {formatNumber(utilities)}
                </span>
                <button
                  type="button"
                  onClick={() => adjustUtilities(250)}
                  className="h-6 w-6 rounded border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  +
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200/60 dark:border-white/10">
              <input
                type="checkbox"
                checked={includeTenantInsurance}
                onChange={(e) => setIncludeTenantInsurance(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 accent-slate-900 cursor-pointer dark:accent-amber-400"
              />
              <span className="text-[11px] text-slate-700 font-medium dark:text-slate-300">
                Include Tenant Contents & Liability Insurance (+R 350/mo)
              </span>
            </label>
          </div>

          {/* Move-in Cash Required Card */}
          <div className="rounded-2xl border border-amber-300/80 bg-amber-50/80 p-3.5 shadow-sm dark:border-amber-500/25 dark:bg-amber-950/25 dark:shadow-[0_4px_20px_rgba(245,158,11,0.06)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-900 dark:text-amber-400">
                  Total Move-In Cash Required
                </span>
                <p className="text-lg font-extrabold text-amber-950 dark:text-amber-200">
                  R {formatNumber(totalMoveInCash)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpfrontModal(true)}
                className="rounded-xl border border-amber-600/30 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 transition-all cursor-pointer shadow-sm dark:bg-amber-900/40 dark:border-amber-500/30 dark:text-amber-200 dark:hover:bg-amber-900/60"
              >
                Breakdown →
              </button>
            </div>
            <p className="mt-1 text-[10px] text-amber-800/80 dark:text-amber-300/70">
              Includes 1st month&apos;s rent (R {formatNumber(monthlyRent)}) + deposit (R {formatNumber(depositZAR)}) + lease admin fee (R 1,450).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowPreApprovalModal(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              <SparklesIcon className="h-4 w-4 text-amber-400 dark:text-white" />
              <span>Check Tenant Qualification & Affordability</span>
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleRentalReset}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer dark:text-slate-400 dark:hover:text-white"
              >
                Reset to Listing Defaults
              </button>
              <Link
                href="/calculators"
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1 dark:text-amber-400 dark:hover:text-amber-300"
              >
                <span>Full Financial Hub</span>
                <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Upfront Cash Breakdown Modal for Rent */}
        {showUpfrontModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400">
                    Tenant Move-In Requirements
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Upfront Cash Outlay
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUpfrontModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-[#0c1a1c] dark:text-slate-300 dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                  <span>First Month&apos;s Rent (in advance):</span>
                  <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(monthlyRent)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                  <div>
                    <span>Security Deposit ({depositMultiple}x rent):</span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-400">Held in interest-bearing account</p>
                  </div>
                  <span className="font-bold text-amber-900 dark:text-amber-400">R {formatNumber(depositZAR)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                  <span>Lease Agreement & Vetting Fee:</span>
                  <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(leaseAdminFee)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-950 dark:border-white/20 dark:text-white">
                  <span>Total Due Prior to Key Handover:</span>
                  <span className="text-amber-900 dark:text-amber-400">R {formatNumber(totalMoveInCash)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
                Under South African Rental Housing Act regulations, the tenant security deposit must be invested in an interest-bearing account and refunded with interest upon successful exit inspection.
              </div>

              <button
                type="button"
                onClick={() => setShowUpfrontModal(false)}
                className="w-full rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Tenant Affordability Modal */}
        {showPreApprovalModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 dark:border dark:border-amber-500/30">
                    <CheckIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 dark:text-amber-400">
                      Tenant Vetting Guideline
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Income Affordability
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreApprovalModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-[#0c1a1c] dark:text-slate-300 dark:hover:text-white"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-500/25 dark:bg-amber-950/25">
                  <p className="text-[10px] uppercase font-bold text-amber-900 tracking-wider dark:text-amber-400">
                    Recommended Monthly Gross Income (30% Rule)
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-amber-950 dark:text-amber-200">
                    R {formatNumber(recommendedGrossIncome)}
                  </p>
                  <p className="text-[11px] text-amber-900 mt-0.5 dark:text-amber-300/80">
                    Landlords and managing agents typically require that the total monthly rental outlays do not exceed 30% of combined gross household income.
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs dark:border-white/10">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Monthly Rent:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(monthlyRent)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Utilities Allowance:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(utilities)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 dark:text-slate-400">Lease Term:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{leaseTerm}</span>
                  </div>
                  {furnishedStatus && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 dark:text-slate-400">Furnished Status:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{furnishedStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPreApprovalModal(false)}
                  className="flex-1 rounded-2xl border border-slate-300 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPreApprovalModal(false);
                    alert("Your tenant application request has been submitted to the listing practitioner.");
                  }}
                  className="flex-1 rounded-2xl bg-slate-950 py-3 text-center text-xs font-bold text-white hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Apply to Lease
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-[30px] border border-white/80 bg-white/55 p-5 sm:p-6 shadow-[0_16px_36px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/75 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      {/* Header & Total Cost */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-3 dark:border-white/10">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-[0.24em] text-emerald-800 font-bold dark:text-emerald-400">
              Dynasty True Cost™
            </span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
              Live Model
            </span>
          </div>
          <h2 className="mt-0.5 text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
            Estimated Total Monthly Cost
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-800 dark:text-emerald-400">
            R {formatNumber(totalMonthlyCost)}
          </span>
          <span className="block text-[10px] text-slate-500 uppercase tracking-wider dark:text-slate-400">
            Total All-Inclusive / month
          </span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
            Bond
          </p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            R {formatNumber(monthlyBond)}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
            Levies
          </p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            R {formatNumber(levy)}
          </p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/70 p-2 sm:p-2.5 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10 dark:shadow-none">
          <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-400 font-semibold dark:text-slate-400">
            Rates & Taxes
          </p>
          <p className="mt-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            R {formatNumber(rates)}
          </p>
        </div>
      </div>

      {/* Interactive Sliders & Controls */}
      <div className="mt-5 space-y-5 text-xs text-slate-700 border-t border-slate-200/60 pt-4 dark:text-slate-300 dark:border-white/10">
        {/* Purchase Price / Offer Slider */}
        <div>
          <div className="flex items-center justify-between font-semibold mb-1">
            <label htmlFor={priceId} className="flex items-center gap-1.5">
              <span>Purchase / Offer Price</span>
              {purchasePrice !== askingPriceZAR && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-500/30">
                  Custom Offer
                </span>
              )}
            </label>
            <span className="text-slate-950 font-bold text-sm dark:text-white">
              R {formatNumber(purchasePrice)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustPrice(-50000)}
              aria-label="Decrease price by 50,000"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              -
            </button>
            <div className="relative flex-1">
              <input
                id={priceId}
                type="range"
                min={Math.max(500000, Math.round(askingPriceZAR * 0.5))}
                max={Math.round(askingPriceZAR * 1.5)}
                step="25000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                onInput={(e) => setPurchasePrice(Number((e.target as HTMLInputElement).value))}
                className="w-full cursor-pointer touch-none dark:accent-emerald-400"
              />
            </div>
            <button
              type="button"
              onClick={() => adjustPrice(50000)}
              aria-label="Increase price by 50,000"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              +
            </button>
          </div>

          {/* Quick Price Chips */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPurchasePrice(Math.round(askingPriceZAR * 0.95))}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                purchasePrice === Math.round(askingPriceZAR * 0.95)
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              -5% Offer
            </button>
            <button
              type="button"
              onClick={() => setPurchasePrice(askingPriceZAR)}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                purchasePrice === askingPriceZAR
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              Asking Price (R {(askingPriceZAR / 1000000).toFixed(2)}M)
            </button>
            <button
              type="button"
              onClick={() => setPurchasePrice(Math.round(askingPriceZAR * 1.05))}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                purchasePrice === Math.round(askingPriceZAR * 1.05)
                  ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              +5% Compete
            </button>
          </div>
        </div>

        {/* Deposit Slider */}
        <div>
          <div className="flex items-center justify-between font-semibold mb-1">
            <label htmlFor={depositId}>
              Deposit ({depositPercent}%)
            </label>
            <span className="text-slate-950 font-bold text-sm dark:text-white">
              R {formatNumber(depositAmount)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustDeposit(-1)}
              aria-label="Decrease deposit by 1 percent"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              -
            </button>
            <div className="relative flex-1">
              <input
                id={depositId}
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={depositPercent}
                onChange={(e) => setDepositPercent(Number(e.target.value))}
                onInput={(e) => setDepositPercent(Number((e.target as HTMLInputElement).value))}
                className="w-full cursor-pointer touch-none dark:accent-emerald-400"
              />
            </div>
            <button
              type="button"
              onClick={() => adjustDeposit(1)}
              aria-label="Increase deposit by 1 percent"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              +
            </button>
          </div>

          {/* Quick Deposit Chips */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[0, 10, 15, 20, 30].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setDepositPercent(pct)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                  depositPercent === pct
                    ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                {pct === 0 ? "0% (100% Bond)" : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Interest Rate Slider */}
        <div>
          <div className="flex items-center justify-between font-semibold mb-1">
            <label htmlFor={rateId}>
              Interest Rate ({interestRate.toFixed(2)}%)
            </label>
            <span className="text-slate-500 font-medium text-[11px] dark:text-slate-400">
              Benchmark Prime = 11.75%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustRate(-0.25)}
              aria-label="Decrease interest rate by 0.25 percent"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              -
            </button>
            <div className="relative flex-1">
              <input
                id={rateId}
                type="range"
                min="7.0"
                max="16.0"
                step="0.05"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                onInput={(e) => setInterestRate(Number((e.target as HTMLInputElement).value))}
                className="w-full cursor-pointer touch-none dark:accent-emerald-400"
              />
            </div>
            <button
              type="button"
              onClick={() => adjustRate(0.25)}
              aria-label="Increase interest rate by 0.25 percent"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-slate-200 dark:hover:bg-white/10"
            >
              +
            </button>
          </div>

          {/* Quick Rate Chips */}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              { label: "Prime - 1% (10.75%)", value: 10.75 },
              { label: "Prime (11.75%)", value: 11.75 },
              { label: "Prime + 1% (12.75%)", value: 12.75 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setInterestRate(chip.value)}
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                  Math.abs(interestRate - chip.value) < 0.01
                    ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loan Term Selection */}
        <div>
          <label id={tenureId} className="font-semibold block mb-1">
            Loan Duration
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[15, 20, 25, 30].map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => setTenureYears(years)}
                className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                  tenureYears === years
                    ? "bg-slate-950 text-white shadow-sm dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "border border-slate-200 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                {years} Yrs
              </button>
            ))}
          </div>
        </div>

        {/* Insurance Toggle */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 p-3 dark:border-white/10 dark:bg-[#060d0e]/60">
          <div>
            <p className="font-bold text-slate-900 text-xs dark:text-white">Include HOC & Life Assurance</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Estimated R {formatNumber(Math.round(purchasePrice * 0.00035 + principal * 0.00045))}/mo
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={includeInsurance}
            onClick={() => setIncludeInsurance(!includeInsurance)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              includeInsurance ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                includeInsurance ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Collapsible: Custom Levies & Rates */}
        <div className="border-t border-slate-200/60 pt-2 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowCustomSettings(!showCustomSettings)}
            className="flex w-full items-center justify-between py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 cursor-pointer dark:text-slate-300 dark:hover:text-white"
          >
            <span>Custom Levies & Municipal Taxes</span>
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform duration-200 ${
                showCustomSettings ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCustomSettings && (
            <div className="mt-2 grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-white/70 p-3 dark:border-white/10 dark:bg-[#060d0e]/60">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 dark:text-slate-400">
                  Monthly Levy (HOA)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs dark:text-slate-400">
                    R
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={levy}
                    onChange={(e) => setLevy(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-7 pr-2 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1 dark:text-slate-400">
                  Municipal Rates
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400 text-xs dark:text-slate-400">
                    R
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={rates}
                    onChange={(e) => setRates(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-7 pr-2 text-xs font-bold text-slate-900 dark:border-white/10 dark:bg-[#060d0e]/80 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upfront Statutory Costs Banner */}
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 dark:border-emerald-500/25 dark:bg-emerald-950/25 dark:shadow-[0_4px_20px_rgba(16,185,129,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-900 dark:text-emerald-400">
                Upfront Cash Required
              </span>
              <p className="text-lg font-extrabold text-emerald-900 dark:text-emerald-200">
                R {formatNumber(totalUpfrontCash)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpfrontModal(true)}
              className="rounded-xl border border-emerald-600/30 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 transition-all cursor-pointer shadow-sm dark:bg-emerald-500/20 dark:border-emerald-500/40 dark:text-emerald-300 dark:hover:bg-emerald-500/30 dark:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              Breakdown →
            </button>
          </div>
          <p className="mt-1 text-[10px] text-emerald-800/80 dark:text-emerald-300/70">
            Includes R {formatNumber(depositAmount)} deposit + R {formatNumber(transferDuty)} SARS duty + legal registration.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowPreApprovalModal(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 transition-all cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
          >
            <SparklesIcon className="h-4 w-4 text-emerald-400 dark:text-white" />
            <span>Check Pre-Approval & Affordability</span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900 underline cursor-pointer dark:text-slate-400 dark:hover:text-white"
            >
              Reset to Listing Defaults
            </button>
            <Link
              href="/calculators"
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <span>Full Financial Hub</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Upfront Cash Breakdown Modal */}
      {showUpfrontModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                  Transaction Cash Outlay
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Upfront Purchasing Requirements
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpfrontModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-[#0c1a1c] dark:text-slate-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                <span>Purchase Price:</span>
                <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(purchasePrice)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                <span>Cash Deposit ({depositPercent}%):</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-400">R {formatNumber(depositAmount)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-1">
                  <span>SARS Transfer Duty:</span>
                  <InfoCircleIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {transferDuty === 0 ? "EXEMPT (Under R1.1M)" : `R ${formatNumber(transferDuty)}`}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                <span>Conveyancing Attorney Fees (Est):</span>
                <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(conveyancingFee)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-white/10">
                <span>Bond Registration Legal Fees (Est):</span>
                <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(bondRegFee)}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-900 text-sm font-extrabold text-slate-950 dark:border-white/20 dark:text-white">
                <span>Total Cash Needed Upfront:</span>
                <span className="text-emerald-800 dark:text-emerald-400">R {formatNumber(totalUpfrontCash)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
              Official South African statutory tariffs apply. Exact conveyancing disbursements and Deeds Office levies will be billed by the transfer attorney.
            </div>

            <button
              type="button"
              onClick={() => setShowUpfrontModal(false)}
              className="w-full rounded-2xl bg-slate-950 py-3 text-xs font-bold text-white hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Pre-Approval Modal */}
      {showPreApprovalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_25px_60px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                  <CheckIcon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                    Bond Qualification Check
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Affordability Snapshot
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreApprovalModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:hover:bg-[#0c1a1c] dark:text-slate-300 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-500/25 dark:bg-emerald-950/25">
                <p className="text-[10px] uppercase font-bold text-emerald-900 tracking-wider dark:text-emerald-400">
                  Required Monthly Gross Income (30% Rule)
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900 dark:text-emerald-200">
                  R {formatNumber(Math.round(monthlyBond / 0.3))}
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5 dark:text-emerald-300/80">
                  Combined household gross income recommended to service this bond.
                </p>
              </div>

              <div className="space-y-1.5 border-t border-slate-100 pt-2 text-xs dark:border-white/10">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Loan Amount (Principal):</span>
                  <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(principal)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Monthly Installment:</span>
                  <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(monthlyBond)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Benchmark Rate:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{interestRate.toFixed(2)}% ({tenureYears} yrs)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href="/calculators"
                onClick={() => setShowPreApprovalModal(false)}
                className="flex-1 rounded-2xl border border-slate-300 py-3 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                Detailed Affordability Hub
              </Link>
              <button
                type="button"
                onClick={() => {
                  setShowPreApprovalModal(false);
                  alert("Your finance inquiry has been recorded. Our partner bond originator (Ooba / BetterBond) will assist you with multi-bank pre-qualification.");
                }}
                className="flex-1 rounded-2xl bg-slate-950 py-3 text-center text-xs font-bold text-white hover:bg-slate-800 cursor-pointer dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Request Pre-Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

