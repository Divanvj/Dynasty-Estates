"use client";

import { useState } from "react";
import TenantApplicationModal from "@/components/tenant-application-modal";

interface TenantApplicationButtonProps {
  propertyId: string;
  propertyTitle: string;
  monthlyRentZAR: number;
  depositZAR?: number;
  className?: string;
}

export default function TenantApplicationButton({
  propertyId,
  propertyTitle,
  monthlyRentZAR,
  depositZAR,
  className = "",
}: TenantApplicationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        // Outlined by default, not filled emerald. In the practitioner card
        // this sits directly above Schedule Private Viewing, which is the
        // card's primary — two solid buttons stacked on each other gave a
        // rental listing two things competing to be the obvious next step.
        // A caller that wants it filled can still pass its own className.
        className={
          className ||
          "pill-lg w-full border border-emerald-700/40 bg-white/80 font-bold text-emerald-900 transition-all hover:bg-white cursor-pointer dark:border-emerald-500/30 dark:bg-surface-ink/60 dark:text-emerald-300 dark:hover:bg-white/10"
        }
      >
        Apply for Tenancy (Online) →
      </button>

      <TenantApplicationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        monthlyRentZAR={monthlyRentZAR}
        depositZAR={depositZAR}
      />
    </>
  );
}

