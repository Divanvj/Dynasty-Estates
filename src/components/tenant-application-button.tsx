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
        className={className || "rounded-full bg-emerald-800 px-4 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all cursor-pointer text-center"}
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

