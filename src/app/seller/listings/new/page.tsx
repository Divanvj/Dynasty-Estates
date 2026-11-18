"use client";

import ListingWizard from "@/components/listing-wizard";
import RoleGuard from "@/components/role-guard";

// Selling privately is open to any signed-in account; agents and admins list too.
export default function NewListingWizardPage() {
  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} allowAnySignedIn featureName="Publish Listing">
      <ListingWizard />
    </RoleGuard>
  );
}
