"use client";

import Link from "next/link";
import BrandLogo from "@/components/brand-logo";
import { useId, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  InfoCircleIcon,
  SparklesIcon,
  TagIcon,
} from "@/components/icons";
import CustomSelect from "@/components/custom-select";
import { formatNumber } from "@/lib/formatters";

export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState<
    "true-cost" | "affordability" | "conveyancing" | "amortization" | "transfer-duty"
  >("true-cost");

  // Tab 1: True Cost States
  const [purchasePrice, setPurchasePrice] = useState(5500000);
  const [depositPct, setDepositPct] = useState(10);
  const [interestRate, setInterestRate] = useState(11.75);
  const [loanYears, setLoanYears] = useState(20);
  const [levy, setLevy] = useState(2400);
  const [rates, setRates] = useState(1850);

  // Tab 2: Affordability States
  const [grossIncome, setGrossIncome] = useState(120000);
  const [monthlyExpenses, setMonthlyExpenses] = useState(45000);

  // Tab 3: Interactive SARS Transfer Duty State
  const [customTransferPrice, setCustomTransferPrice] = useState(5500000);

  // Tab 4: Conveyancing & Bond Legal Fees State
  const [conveyPrice, setConveyPrice] = useState(5500000);
  const [conveyBond, setConveyBond] = useState(4950000);

  // Tab 5: Amortization & Extra Payment State
  const [amortLoan, setAmortLoan] = useState(4500000);
  const [amortRate, setAmortRate] = useState(11.75);
  const [amortYears, setAmortYears] = useState(20);
  const [amortExtraMonthly, setAmortExtraMonthly] = useState(1500);

  const priceId = useId();
  const depId = useId();
  const rateId = useId();
  const incomeId = useId();
  const expenseId = useId();
  const transferCalcId = useId();
  const conveyPriceId = useId();
  const conveyBondId = useId();
  const amortLoanId = useId();
  const amortExtraId = useId();

  // Tab 1 Calculations
  const depositAmount = useMemo(() => {
    return Math.round((purchasePrice * depositPct) / 100);
  }, [purchasePrice, depositPct]);

  const transferDuty = useMemo(() => {
    if (purchasePrice <= 1100000) return 0;
    if (purchasePrice <= 1512500) return Math.round((purchasePrice - 1100000) * 0.03);
    if (purchasePrice <= 2722500) return Math.round(25250 + (purchasePrice - 1512500) * 0.08);
    if (purchasePrice <= 12100000) return Math.round(98250 + (purchasePrice - 2722500) * 0.11);
    return Math.round(1129775 + (purchasePrice - 12100000) * 0.13);
  }, [purchasePrice]);

  const monthlyBond = useMemo(() => {
    const loanAmount = Math.max(0, purchasePrice - depositAmount);
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanYears * 12;
    if (loanAmount <= 0 || monthlyRate <= 0) return 0;
    return Math.round(
      (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    );
  }, [purchasePrice, depositAmount, interestRate, loanYears]);

  const totalMonthly = useMemo(() => {
    return monthlyBond + rates + levy;
  }, [monthlyBond, rates, levy]);

  // Tab 2 Calculations: Affordability
  const { maxMonthlyBond, maxPurchasePrice } = useMemo(() => {
    const maxInstallmentByIncome = grossIncome * 0.3; // Standard 30% DTI guideline
    const netDisposable = Math.max(0, grossIncome - monthlyExpenses);
    const maxInstallment = Math.max(0, Math.min(maxInstallmentByIncome, netDisposable));

    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanYears * 12;

    let maxLoan = 0;
    if (monthlyRate > 0 && maxInstallment > 0) {
      maxLoan =
        (maxInstallment * (Math.pow(1 + monthlyRate, numberOfPayments) - 1)) /
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments));
    }

    // Assuming a 10% deposit, max purchase price is maxLoan / 0.9
    const maxPrice = Math.round(maxLoan / 0.9);

    return {
      maxMonthlyBond: Math.round(maxInstallment),
      maxPurchasePrice: maxPrice,
    };
  }, [grossIncome, monthlyExpenses, interestRate, loanYears]);

  // Tab 3 Calculations: Live SARS Transfer Duty
  const customDutyCalc = useMemo(() => {
    let duty = 0;
    let bracketDesc = "0% (Exempt under R1,100,000)";
    if (customTransferPrice <= 1100000) {
      duty = 0;
      bracketDesc = "0% (Fully Exempt)";
    } else if (customTransferPrice <= 1512500) {
      duty = Math.round((customTransferPrice - 1100000) * 0.03);
      bracketDesc = "3% on the value above R 1,100,000";
    } else if (customTransferPrice <= 2722500) {
      duty = Math.round(25250 + (customTransferPrice - 1512500) * 0.08);
      bracketDesc = "R 25,250 + 8% on the value above R 1,512,500";
    } else if (customTransferPrice <= 12100000) {
      duty = Math.round(98250 + (customTransferPrice - 2722500) * 0.11);
      bracketDesc = "R 98,250 + 11% on the value above R 2,722,500";
    } else {
      duty = Math.round(1129775 + (customTransferPrice - 12100000) * 0.13);
      bracketDesc = "R 1,129,775 + 13% on the value above R 12,100,000";
    }
    const effectiveRate = customTransferPrice > 0 ? (duty / customTransferPrice) * 100 : 0;
    return { duty, bracketDesc, effectiveRate };
  }, [customTransferPrice]);

  // Tab 4: Full Conveyancing & Bond Legal Fees Schedule
  const conveyancingSchedule = useMemo(() => {
    // Conveyancing Attorney Fee (LPC / LSSA sliding tariff guidelines)
    let transferAttorneyFee = 26500;
    if (conveyPrice > 1000000 && conveyPrice <= 3000000) {
      transferAttorneyFee = 26500 + Math.round((conveyPrice - 1000000) * 0.011);
    } else if (conveyPrice > 3000000 && conveyPrice <= 7000000) {
      transferAttorneyFee = 48500 + Math.round((conveyPrice - 3000000) * 0.0075);
    } else if (conveyPrice > 7000000) {
      transferAttorneyFee = 78500 + Math.round((conveyPrice - 7000000) * 0.005);
    }
    const transferVat = Math.round(transferAttorneyFee * 0.15);

    // Deeds Office Transfer Fee
    let deedsTransferFee = 1185;
    if (conveyPrice > 1000000 && conveyPrice <= 2000000) deedsTransferFee = 1515;
    else if (conveyPrice > 2000000 && conveyPrice <= 4000000) deedsTransferFee = 1940;
    else if (conveyPrice > 4000000 && conveyPrice <= 6000000) deedsTransferFee = 2420;
    else if (conveyPrice > 6000000) deedsTransferFee = 3025;

    const transferPetties = 1450; // FICA & disbursements

    // SARS Transfer duty for conveyPrice
    let duty = 0;
    if (conveyPrice <= 1100000) duty = 0;
    else if (conveyPrice <= 1512500) duty = Math.round((conveyPrice - 1100000) * 0.03);
    else if (conveyPrice <= 2722500) duty = Math.round(25250 + (conveyPrice - 1512500) * 0.08);
    else if (conveyPrice <= 12100000) duty = Math.round(98250 + (conveyPrice - 2722500) * 0.11);
    else duty = Math.round(1129775 + (conveyPrice - 12100000) * 0.13);

    const totalTransferCosts = transferAttorneyFee + transferVat + deedsTransferFee + transferPetties + duty;

    // Bond Registration Attorney Fee
    let bondAttorneyFee = 0;
    let bondVat = 0;
    let deedsBondFee = 0;
    const bankInitiationFee = conveyBond > 0 ? 6037 : 0;
    const bondPetties = conveyBond > 0 ? 1250 : 0;

    if (conveyBond > 0) {
      if (conveyBond <= 1000000) {
        bondAttorneyFee = Math.round(24000 * (conveyBond / 1000000));
      } else if (conveyBond <= 3000000) {
        bondAttorneyFee = 24000 + Math.round((conveyBond - 1000000) * 0.0095);
      } else if (conveyBond <= 7000000) {
        bondAttorneyFee = 43000 + Math.round((conveyBond - 3000000) * 0.0065);
      } else {
        bondAttorneyFee = 69000 + Math.round((conveyBond - 7000000) * 0.0045);
      }
      bondVat = Math.round(bondAttorneyFee * 0.15);

      if (conveyBond <= 1000000) deedsBondFee = 1185;
      else if (conveyBond <= 2000000) deedsBondFee = 1515;
      else if (conveyBond <= 4000000) deedsBondFee = 1940;
      else deedsBondFee = 2420;
    }

    const totalBondCosts = bondAttorneyFee + bondVat + deedsBondFee + bankInitiationFee + bondPetties;
    const totalLegalCosts = totalTransferCosts + totalBondCosts;
    const depositAmount = Math.max(0, conveyPrice - conveyBond);
    const totalCashUpfront = totalLegalCosts + depositAmount;

    return {
      transferAttorneyFee,
      transferVat,
      deedsTransferFee,
      transferPetties,
      duty,
      totalTransferCosts,
      bondAttorneyFee,
      bondVat,
      deedsBondFee,
      bankInitiationFee,
      bondPetties,
      totalBondCosts,
      totalLegalCosts,
      depositAmount,
      totalCashUpfront,
    };
  }, [conveyPrice, conveyBond]);

  // Tab 5: Extra Payment & Bond Amortization Savings
  const amortizationSchedule = useMemo(() => {
    const r = amortRate / 100 / 12;
    const n = amortYears * 12;
    if (amortLoan <= 0 || r <= 0) {
      return {
        standardMonthly: 0,
        originalTotalInterest: 0,
        acceleratedMonthly: 0,
        newMonths: 0,
        newYears: "0",
        monthsSaved: 0,
        yearsSaved: "0",
        acceleratedTotalInterest: 0,
        interestSaved: 0,
      };
    }

    const standardMonthly = Math.round(
      (amortLoan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
    );
    const originalTotalInterest = Math.round(standardMonthly * n - amortLoan);
    const acceleratedMonthly = standardMonthly + amortExtraMonthly;

    let newMonths = n;
    if (amortExtraMonthly > 0) {
      const top = Math.log(1 - (r * amortLoan) / acceleratedMonthly);
      const bottom = Math.log(1 + r);
      if (top < 0 && bottom > 0) {
        newMonths = Math.ceil(-top / bottom);
      }
    }

    const monthsSaved = Math.max(0, n - newMonths);
    const yearsSaved = (monthsSaved / 12).toFixed(1);
    const newYears = (newMonths / 12).toFixed(1);
    const acceleratedTotalInterest = Math.max(0, Math.round(acceleratedMonthly * newMonths - amortLoan));
    const interestSaved = Math.max(0, originalTotalInterest - acceleratedTotalInterest);

    return {
      standardMonthly,
      originalTotalInterest,
      acceleratedMonthly,
      newMonths,
      newYears,
      monthsSaved,
      yearsSaved,
      acceleratedTotalInterest,
      interestSaved,
    };
  }, [amortLoan, amortRate, amortYears, amortExtraMonthly]);

  return (
    <main className="min-h-screen bg-transparent px-3 py-4 text-slate-900 dark:text-slate-100 md:px-8 transition-colors duration-300">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Header */}
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-white/75 dark:border-white/10 bg-white/45 dark:bg-[#0c1a1c]/80 px-3.5 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] dark:shadow-[0_12px_28px_rgba(0,0,0,0.3)] backdrop-blur-xl">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <div>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold dark:text-slate-400">Property Finance</p>
              <h1 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-900 dark:text-white">
                <span className="hidden sm:inline">South African Financial </span>Calculators
              </h1>
            </div>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-1.5 rounded-full border border-slate-300/80 dark:border-white/10 bg-white/60 dark:bg-[#060d0e]/60 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 dark:hover:text-emerald-300 transition-all whitespace-nowrap shrink-0"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Browse Properties</span>
            <span className="sm:hidden">Catalogue</span>
          </Link>
        </header>

        {/* Tab Switcher */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "true-cost", label: "True Cost™ Monthly", Icon: ChartBarIcon },
            { id: "affordability", label: "Bond Affordability", Icon: TagIcon },
            { id: "conveyancing", label: "Conveyancing & Legal Fees", Icon: BuildingLibraryIcon },
            { id: "amortization", label: "Extra Payment Savings", Icon: SparklesIcon },
            { id: "transfer-duty", label: "SARS Transfer Duty Guide", Icon: BuildingLibraryIcon },
          ].map((tab) => {
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 rounded-2xl px-3.5 sm:px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? "bg-slate-950 dark:bg-emerald-600 text-white shadow-md border border-emerald-400/40 dark:border-emerald-500/50 dark:shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                    : "border border-white/70 dark:border-white/10 bg-white/45 dark:bg-[#0c1a1c]/80 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10"
                }`}
              >
                <TabIcon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? "text-emerald-400 dark:text-white" : "text-slate-500 dark:text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: True Cost Monthly Ownership */}
        {activeTab === "true-cost" && (
          <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/55 p-5 sm:p-6 shadow-sm backdrop-blur-xl space-y-4 text-xs dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Purchase Assumptions</h2>

              {/* Property Asking Price */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={priceId}>Property Asking Price (ZAR)</label>
                  <span className="font-bold text-slate-900 text-sm dark:text-white">R {formatNumber(purchasePrice)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchasePrice((prev) => Math.max(500000, prev - 100000))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      id={priceId}
                      type="range"
                      min="1000000"
                      max="25000000"
                      step="50000"
                      value={purchasePrice}
                      onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      onInput={(e) => setPurchasePrice(Number((e.target as HTMLInputElement).value))}
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPurchasePrice((prev) => prev + 100000)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Price Chips */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[2500000, 4500000, 6850000, 10000000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPurchasePrice(val)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        purchasePrice === val
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      R {(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 2)}M
                    </button>
                  ))}
                </div>
              </div>

              {/* Deposit */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={depId}>Deposit ({depositPct}%)</label>
                  <span className="text-slate-900 font-bold text-sm dark:text-white">R {formatNumber(depositAmount)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositPct((prev) => Math.max(0, prev - 1))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      id={depId}
                      type="range"
                      min="0"
                      max="40"
                      step="0.5"
                      value={depositPct}
                      onChange={(e) => setDepositPct(Number(e.target.value))}
                      onInput={(e) => setDepositPct(Number((e.target as HTMLInputElement).value))}
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setDepositPct((prev) => Math.min(50, prev + 1))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Deposit Chips */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[0, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDepositPct(pct)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        depositPct === pct
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      {pct === 0 ? "0% (100% Bond)" : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={rateId}>Interest Rate ({interestRate.toFixed(2)}%)</label>
                  <span className="text-slate-500 font-medium text-[11px] dark:text-slate-400">Benchmark Prime = 11.75%</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInterestRate((prev) => Math.max(6, Math.round((prev - 0.25) * 100) / 100))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
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
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setInterestRate((prev) => Math.min(18, Math.round((prev + 0.25) * 100) / 100))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Rate Chips */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[
                    { label: "Prime - 1% (10.75%)", val: 10.75 },
                    { label: "Prime (11.75%)", val: 11.75 },
                    { label: "Prime + 1% (12.75%)", val: 12.75 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setInterestRate(chip.val)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        Math.abs(interestRate - chip.val) < 0.01
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Levies & Rates */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold block mb-1">Body Corporate Levy</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={levy}
                    onChange={(e) => setLevy(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 dark:border-white/10 dark:bg-black/30 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Municipal Rates & Taxes</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={rates}
                    onChange={(e) => setRates(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-900 dark:border-white/10 dark:bg-black/30 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Loan Tenure */}
              <div>
                <span className="font-semibold block mb-1">Loan Duration</span>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 20, 25, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setLoanYears(yr)}
                      className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                        loanYears === yr
                          ? "bg-slate-950 text-white shadow-sm dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_14px_rgba(16,185,129,0.35)]"
                          : "border border-slate-300 bg-white/60 text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      {yr} Yrs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Output */}
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-md backdrop-blur-xl flex flex-col justify-between dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                  Total Monthly Outlay
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  R {formatNumber(totalMonthly)}
                </p>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                  Includes bond installment, municipal taxes, and body corporate levies.
                </p>

                <div className="mt-6 space-y-2 border-t border-slate-200/80 dark:border-white/10 pt-4 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between py-1">
                    <span>Monthly Bond Installment:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(monthlyBond)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Monthly Municipal Rates:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(rates)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Monthly Levies:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(levy)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-slate-200 dark:border-white/10 font-bold text-slate-900 dark:text-white">
                    <span>Upfront SARS Transfer Duty:</span>
                    <span className="text-emerald-800 dark:text-emerald-400">
                      {transferDuty === 0 ? "EXEMPT (Under R1.1M)" : `R ${formatNumber(transferDuty)}`}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/search?type=House`}
                className="mt-6 block w-full rounded-2xl bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_25px_rgba(16,185,129,0.35)] py-3 text-center text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                Find Homes Within This Budget →
              </Link>
            </div>
          </section>
        )}

        {/* TAB 2: Affordability Calculator */}
        {activeTab === "affordability" && (
          <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[30px] border border-white/80 bg-white/55 p-5 sm:p-6 shadow-sm backdrop-blur-xl space-y-4 text-xs dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">Income & Debt Profile</h2>

              {/* Combined Gross Monthly Income */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={incomeId}>Combined Gross Monthly Income</label>
                  <span className="font-bold text-slate-900 text-sm dark:text-white">R {formatNumber(grossIncome)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGrossIncome((prev) => Math.max(10000, prev - 5000))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      id={incomeId}
                      type="range"
                      min="20000"
                      max="400000"
                      step="2500"
                      value={grossIncome}
                      onChange={(e) => setGrossIncome(Number(e.target.value))}
                      onInput={(e) => setGrossIncome(Number((e.target as HTMLInputElement).value))}
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGrossIncome((prev) => prev + 5000)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Income Chips */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[45000, 85000, 120000, 200000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGrossIncome(val)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        grossIncome === val
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      R {(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Monthly Living Expenses & Debt */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={expenseId}>Total Monthly Living Expenses & Debt Repayments</label>
                  <span className="font-bold text-slate-900 text-sm dark:text-white">R {formatNumber(monthlyExpenses)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMonthlyExpenses((prev) => Math.max(2500, prev - 2500))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      id={expenseId}
                      type="range"
                      min="5000"
                      max="200000"
                      step="2500"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                      onInput={(e) => setMonthlyExpenses(Number((e.target as HTMLInputElement).value))}
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonthlyExpenses((prev) => prev + 2500)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Expense Chips */}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {[15000, 35000, 60000, 90000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMonthlyExpenses(val)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        monthlyExpenses === val
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      R {(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/70 p-4 text-[11px] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
                <InfoCircleIcon className="h-4 w-4 shrink-0 text-slate-500 mt-0.5 dark:text-slate-400" />
                <span>Major South African commercial banks (Standard Bank, FNB, Nedbank, ABSA) evaluate bond applications against the 30% gross income installment ratio and National Credit Act (NCA) debt affordability limits.</span>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-md backdrop-blur-xl flex flex-col justify-between dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                  Estimated Qualified Purchase Price
                </span>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  R {formatNumber(maxPurchasePrice)}
                </p>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                  Estimated maximum purchasing capacity based on a 10% deposit.
                </p>

                <div className="mt-6 space-y-2 border-t border-slate-200/80 dark:border-white/10 pt-4 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between py-1">
                    <span>Maximum Monthly Installment:</span>
                    <span className="font-bold text-slate-900 dark:text-white">R {formatNumber(maxMonthlyBond)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Assumed Benchmark Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{interestRate}% (Prime)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Loan Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{loanYears} Years</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/search`}
                className="mt-6 block w-full rounded-2xl bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_25px_rgba(16,185,129,0.35)] py-3 text-center text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
              >
                Search Qualified Properties →
              </Link>
            </div>
          </section>
        )}

        {/* TAB 3: SARS Transfer Duty Guide */}
        {activeTab === "transfer-duty" && (
          <section className="space-y-6">
            {/* Interactive Duty Simulator */}
            <div className="rounded-[30px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-4 text-xs dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                    Interactive SARS Tax Calculator
                  </span>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white">
                    Estimate SARS Transfer Duty
                  </h2>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    {customDutyCalc.duty === 0 ? "R 0 (Exempt)" : `R ${formatNumber(customDutyCalc.duty)}`}
                  </span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">
                    Effective Tax Rate: {customDutyCalc.effectiveRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <label htmlFor={transferCalcId}>Property Purchase Price (ZAR)</label>
                  <span className="font-bold text-slate-900 text-sm dark:text-white">
                    R {formatNumber(customTransferPrice)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomTransferPrice((prev) => Math.max(500000, prev - 100000))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      id={transferCalcId}
                      type="range"
                      min="500000"
                      max="20000000"
                      step="50000"
                      value={customTransferPrice}
                      onChange={(e) => setCustomTransferPrice(Number(e.target.value))}
                      onInput={(e) => setCustomTransferPrice(Number((e.target as HTMLInputElement).value))}
                      className="w-full cursor-pointer touch-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomTransferPrice((prev) => prev + 100000)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                  >
                    +
                  </button>
                </div>
                {/* Quick Chips */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[1000000, 2000000, 3500000, 5500000, 8500000, 15000000].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCustomTransferPrice(p)}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                        customTransferPrice === p
                          ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                          : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                      }`}
                    >
                      R {(p / 1000000).toFixed(p % 1000000 === 0 ? 0 : 1)}M
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                <span className="font-bold">Applicable Bracket Formula: </span>
                <span>{customDutyCalc.bracketDesc}</span>
              </div>
            </div>

            {/* Official Reference Table */}
            <div className="rounded-[30px] border border-white/80 bg-white/55 p-5 sm:p-6 shadow-sm backdrop-blur-xl text-xs space-y-4 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">Official SARS Statutory Transfer Duty Rates</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Transfer duty is a statutory tax levied on the acquisition of any property in South Africa, payable directly to SARS prior to deed registration.
              </p>

              <div className="overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-sm dark:bg-[#060d0e]/60 dark:border-white/10">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase font-bold text-slate-500 dark:border-white/10 dark:bg-[#060d0e]/90 dark:text-slate-300">
                    <tr>
                      <th className="py-3 px-4">Property Value Range</th>
                      <th className="py-3 px-4">Rate of Tax</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-slate-700 dark:text-slate-300">
                    <tr>
                      <td className="py-3 px-4 font-semibold">R 0 – R 1,100,000</td>
                      <td className="py-3 px-4 text-emerald-800 font-bold dark:text-emerald-400">0% (Exempt)</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">R 1,100,001 – R 1,512,500</td>
                      <td className="py-3 px-4">3% on the value above R 1,100,000</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">R 1,512,501 – R 2,722,500</td>
                      <td className="py-3 px-4">R 25,250 + 8% on the value above R 1,512,500</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">R 2,722,501 – R 12,100,000</td>
                      <td className="py-3 px-4">R 98,250 + 11% on the value above R 2,722,500</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold">R 12,100,001+</td>
                      <td className="py-3 px-4">R 1,129,775 + 13% on the value above R 12,100,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Conveyancing & Bond Legal Fees Schedule */}
        {activeTab === "conveyancing" && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              {/* Inputs */}
              <div className="rounded-[30px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-md backdrop-blur-xl space-y-5 text-xs dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                    Legal Practice Council (LSSA) Fee Guidelines
                  </span>
                  <h2 className="text-lg font-bold text-slate-950 mt-1 dark:text-white">
                    Conveyancing & Bond Legal Cost Estimator
                  </h2>
                  <p className="text-slate-500 mt-0.5 dark:text-slate-400">
                    Calculates statutory conveyancer fees, bond registration fees, deeds office levies, and bank initiation costs.
                  </p>
                </div>

                {/* Purchase Price Input */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label htmlFor={conveyPriceId}>Purchase Price (ZAR)</label>
                    <span className="font-bold text-slate-900 text-sm dark:text-white">R {formatNumber(conveyPrice)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConveyPrice((prev) => Math.max(500000, prev - 250000))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        id={conveyPriceId}
                        type="range"
                        min="500000"
                        max="20000000"
                        step="100000"
                        value={conveyPrice}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setConveyPrice(val);
                          setConveyBond(Math.round(val * 0.9));
                        }}
                        className="w-full cursor-pointer touch-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConveyPrice((prev) => prev + 250000)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                    >
                      +
                    </button>
                  </div>
                  {/* Chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[1500000, 3000000, 5500000, 8500000, 12000000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setConveyPrice(val);
                          setConveyBond(Math.round(val * 0.9));
                        }}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                          conveyPrice === val
                            ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                            : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                        }`}
                      >
                        R {(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bond Amount Input */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label htmlFor={conveyBondId}>Home Loan / Bond Amount (ZAR)</label>
                    <span className="font-bold text-slate-900 text-sm dark:text-white">
                      {conveyBond === 0 ? "R 0 (Cash Buyer)" : `R ${formatNumber(conveyBond)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConveyBond((prev) => Math.max(0, prev - 250000))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        id={conveyBondId}
                        type="range"
                        min="0"
                        max={conveyPrice}
                        step="50000"
                        value={conveyBond}
                        onChange={(e) => setConveyBond(Number(e.target.value))}
                        className="w-full cursor-pointer touch-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setConveyBond((prev) => Math.min(conveyPrice, prev + 250000))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40"
                    >
                      +
                    </button>
                  </div>
                  {/* Quick Bond % Chips */}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {[
                      { label: "100% Bond", pct: 1.0 },
                      { label: "90% Bond", pct: 0.9 },
                      { label: "80% Bond", pct: 0.8 },
                      { label: "Cash (0%)", pct: 0 },
                    ].map((b) => {
                      const targetVal = Math.round(conveyPrice * b.pct);
                      return (
                        <button
                          key={b.label}
                          type="button"
                          onClick={() => setConveyBond(targetVal)}
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                            conveyBond === targetVal
                              ? "bg-slate-900 text-white dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                              : "border border-slate-200 bg-white/70 text-slate-600 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
                  <InfoCircleIcon className="h-4 w-4 shrink-0 text-slate-500 mt-0.5 dark:text-slate-400" />
                  <span>
                    In South Africa, you pay two independent sets of attorneys: the <strong>Transfer Attorney</strong> (appointed by seller, paid by buyer) and the <strong>Bond Attorney</strong> (appointed by bank, paid by buyer).
                  </span>
                </div>
              </div>

              {/* Total Upfront Cash Summary */}
              <div className="rounded-[30px] border border-white/80 bg-white/70 p-5 sm:p-6 shadow-md backdrop-blur-xl flex flex-col justify-between dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                    Total Upfront Cash Required
                  </span>
                  <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    R {formatNumber(conveyancingSchedule.totalCashUpfront)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    Includes buyer deposit plus all legal, registration, and statutory SARS fees.
                  </p>

                  <div className="mt-6 space-y-3 border-t border-slate-200/80 dark:border-white/10 pt-4 text-xs">
                    <div className="flex justify-between font-bold text-slate-900 border-b border-slate-100 dark:border-white/10 pb-1 dark:text-white">
                      <span>Buyer Cash Deposit:</span>
                      <span>R {formatNumber(conveyancingSchedule.depositAmount)}</span>
                    </div>

                    {/* Transfer Attorney Schedule */}
                    <div className="space-y-1 text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                        <span>Transfer Costs (Conveyancer):</span>
                        <span>R {formatNumber(conveyancingSchedule.totalTransferCosts)}</span>
                      </div>
                      <div className="flex justify-between pl-3 text-[11px]">
                        <span>• Conveyancer Legal Fee:</span>
                        <span>R {formatNumber(conveyancingSchedule.transferAttorneyFee)}</span>
                      </div>
                      <div className="flex justify-between pl-3 text-[11px]">
                        <span>• 15% VAT on Legal Fee:</span>
                        <span>R {formatNumber(conveyancingSchedule.transferVat)}</span>
                      </div>
                      <div className="flex justify-between pl-3 text-[11px]">
                        <span>• Deeds Office Transfer Levy:</span>
                        <span>R {formatNumber(conveyancingSchedule.deedsTransferFee)}</span>
                      </div>
                      <div className="flex justify-between pl-3 text-[11px]">
                        <span>• SARS Transfer Duty:</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-400">
                          {conveyancingSchedule.duty === 0 ? "R 0 (Exempt)" : `R ${formatNumber(conveyancingSchedule.duty)}`}
                        </span>
                      </div>
                    </div>

                    {/* Bond Registration Schedule */}
                    {conveyBond > 0 && (
                      <div className="space-y-1 text-slate-600 border-t border-slate-100 dark:border-white/10 pt-2 dark:text-slate-300">
                        <div className="flex justify-between font-semibold text-slate-900 dark:text-white">
                          <span>Bond Registration Costs:</span>
                          <span>R {formatNumber(conveyancingSchedule.totalBondCosts)}</span>
                        </div>
                        <div className="flex justify-between pl-3 text-[11px]">
                          <span>• Bond Attorney Fee:</span>
                          <span>R {formatNumber(conveyancingSchedule.bondAttorneyFee)}</span>
                        </div>
                        <div className="flex justify-between pl-3 text-[11px]">
                          <span>• 15% VAT on Bond Fee:</span>
                          <span>R {formatNumber(conveyancingSchedule.bondVat)}</span>
                        </div>
                        <div className="flex justify-between pl-3 text-[11px]">
                          <span>• Deeds Office Bond Levy:</span>
                          <span>R {formatNumber(conveyancingSchedule.deedsBondFee)}</span>
                        </div>
                        <div className="flex justify-between pl-3 text-[11px]">
                          <span>• Bank Initiation Fee (NCA):</span>
                          <span>R {formatNumber(conveyancingSchedule.bankInitiationFee)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Link
                  href="/search"
                  className="mt-6 block w-full rounded-2xl bg-slate-950 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:text-white dark:shadow-[0_0_25px_rgba(16,185,129,0.35)] py-3 text-center text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Explore Properties in Budget →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: Extra Payment & Bond Amortization Savings */}
        {activeTab === "amortization" && (
          <section className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              {/* Controls */}
              <div className="rounded-[30px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1a1c]/80 p-5 sm:p-6 shadow-md dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl space-y-5 text-xs">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                    Wealth Accelerator Simulator
                  </span>
                  <h2 className="text-lg font-bold text-slate-950 dark:text-white mt-1">
                    Extra Monthly Bond Savings Calculator
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    See how paying even a small additional amount into your South African home loan slashes compound interest and accelerates debt freedom.
                  </p>
                </div>

                {/* Bond Amount */}
                <div>
                  <div className="flex justify-between font-semibold mb-1">
                    <label htmlFor={amortLoanId}>Home Loan Balance (ZAR)</label>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">R {formatNumber(amortLoan)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAmortLoan((prev) => Math.max(500000, prev - 250000))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 cursor-pointer active:scale-95"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        id={amortLoanId}
                        type="range"
                        min="500000"
                        max="15000000"
                        step="100000"
                        value={amortLoan}
                        onChange={(e) => setAmortLoan(Number(e.target.value))}
                        className="w-full cursor-pointer touch-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmortLoan((prev) => prev + 250000)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 cursor-pointer active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Interest Rate & Term */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Interest Rate (% Prime)</label>
                    <input
                      type="number"
                      step="0.25"
                      min="7"
                      max="20"
                      value={amortRate}
                      onChange={(e) => setAmortRate(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-black/30 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xs hover:border-emerald-500 dark:hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Original Loan Term</label>
                    <CustomSelect
                      value={amortYears}
                      onChange={(val) => setAmortYears(Number(val))}
                      options={[
                        { value: 20, label: "20 Years (Standard)" },
                        { value: 25, label: "25 Years" },
                        { value: 30, label: "30 Years" },
                        { value: 15, label: "15 Years" },
                      ]}
                      ariaLabel="Original loan term"
                    />
                  </div>
                </div>

                {/* Extra Monthly Payment Slider */}
                <div className="rounded-2xl border border-emerald-200/90 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
                  <div className="flex justify-between font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    <label htmlFor={amortExtraId}>Extra Monthly Contribution (ZAR)</label>
                    <span className="text-base font-extrabold text-emerald-800 dark:text-emerald-400">
                      + R {formatNumber(amortExtraMonthly)} / mo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAmortExtraMonthly((prev) => Math.max(0, prev - 250))}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-[#060d0e]/60 text-sm font-bold text-emerald-900 dark:text-white hover:bg-emerald-100 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 cursor-pointer active:scale-95"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input
                        id={amortExtraId}
                        type="range"
                        min="0"
                        max="20000"
                        step="250"
                        value={amortExtraMonthly}
                        onChange={(e) => setAmortExtraMonthly(Number(e.target.value))}
                        className="w-full cursor-pointer touch-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setAmortExtraMonthly((prev) => prev + 250)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-[#0c1a1c] dark:hover:border-emerald-500/40 cursor-pointer active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  {/* Quick Chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[500, 1000, 1500, 2500, 5000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmortExtraMonthly(val)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-all cursor-pointer ${
                          amortExtraMonthly === val
                            ? "bg-emerald-800 dark:bg-emerald-600 dark:border-emerald-500/50 dark:shadow-[0_0_12px_rgba(16,185,129,0.35)] text-white"
                            : "border border-emerald-300 dark:border-white/10 bg-white dark:bg-[#060d0e]/60 text-emerald-900 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300 dark:hover:border-emerald-500/40"
                        }`}
                      >
                        +R {formatNumber(val)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Savings Results Showcase */}
              <div className="rounded-[30px] border border-white/80 dark:border-white/10 bg-white/70 dark:bg-[#0c1a1c]/80 p-5 sm:p-6 shadow-md dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)] backdrop-blur-xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 dark:text-emerald-400 font-bold">
                    Compound Interest Saved
                  </span>
                  <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-800 dark:text-emerald-400 dark:drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    R {formatNumber(amortizationSchedule.interestSaved)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                    Cash savings directly staying in your wealth portfolio over the bond duration.
                  </p>

                  <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-4 text-xs dark:border-white/10">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between font-bold text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                      <span>Time Shaved Off Bond:</span>
                      <span className="text-sm text-emerald-800 dark:text-emerald-400">
                        {amortizationSchedule.yearsSaved} Years Early ({amortizationSchedule.monthsSaved} mo)
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/10">
                      <span className="text-slate-600 dark:text-slate-300">Standard Monthly Repayment:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        R {formatNumber(amortizationSchedule.standardMonthly)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/10">
                      <span className="text-slate-600 dark:text-slate-300">Accelerated Monthly Payment:</span>
                      <span className="font-bold text-emerald-800 dark:text-emerald-400">
                        R {formatNumber(amortizationSchedule.acceleratedMonthly)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/10">
                      <span className="text-slate-600 dark:text-slate-300">New Loan Payoff Horizon:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {amortizationSchedule.newYears} Years (was {amortYears} yrs)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                      <span>Original Total Interest:</span>
                      <span className="line-through text-slate-400 dark:text-slate-400">
                        R {formatNumber(amortizationSchedule.originalTotalInterest)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300">
                  <span>
                    💡 <strong>Pro-Tip:</strong> In South Africa, paying extra into an access bond also functions as a tax-free emergency fund yielding your bond rate (e.g. {amortRate}% return).
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

