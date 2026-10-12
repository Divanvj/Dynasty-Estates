"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/components/auth-provider";
import RoleGuard from "@/components/role-guard";
import CustomSelect from "@/components/custom-select";
import PredictiveLocationInput from "@/components/predictive-location-input";
import ListingPhotoUploader from "@/components/listing-photo-uploader";
import {
  AreaIcon,
  ArrowLeftIcon,
  BathIcon,
  BedIcon,
  CarIcon,
  CheckIcon,
} from "@/components/icons";
import {
  calculateListingQualityScore,
  createSellerListing,
  type ListingFormData,
  type ListingLifecycleStatus,
} from "@/lib/seller-listings";
import type { ListingPhoto } from "@/lib/photo-intake";

const inputClass =
  "w-full h-[48px] rounded-[18px] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md transition-all";

const selectTriggerClass =
  "w-full h-full flex items-center justify-between rounded-[18px] border border-white/70 bg-white/60 dark:border-white/10 dark:bg-[#060d0e]/60 px-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md transition-all";

const availableFeatures = [
  { id: "solar_system", label: "Solar Power System" },
  { id: "inverter_battery", label: "Battery Inverter Backup" },
  { id: "borehole", label: "Borehole Water" },
  { id: "water_tanks", label: "Rainwater Tanks (JoJo)" },
  { id: "security_estate", label: "24h Manned Security Estate" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "garden", label: "Private Garden" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "flatlet", label: "Separate Flatlet / Cottage" },
  { id: "staff_quarters", label: "Staff Accommodation" },
  { id: "study", label: "Home Office / Study" },
  { id: "fibre_ready", label: "Fibre Ready" },
];

const provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "Limpopo",
  "North West",
  "Northern Cape",
];

const AUTOSAVE_STORAGE_KEY = "dynasty_seller_wizard_autosave";

const defaultFormData: ListingFormData = {
  ownerId: "",
  ownerEmail: "",
  title: "",
  location: "",
  suburb: "",
  city: "",
  province: "",
  price: "",
  type: "Apartment",
  listingType: "rent",
  leaseTerm: "12 Months",
  depositRequired: "",
  furnishedStatus: "Unfurnished",
  beds: 3,
  baths: 2,
  parking: 2,
  erfSizeSqm: 850,
  floorSizeSqm: 380,
  monthlyLevy: "",
  ratesAndTaxes: "",
  features: ["solar_system", "security_estate", "garden"],
  description: "",
  // Photos come only from the checked uploader; the cover is photos[0].
  image: "",
  gallery: [],
  photos: [],
  status: "Draft",
};

function subscribeDraft(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getDraftSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTOSAVE_STORAGE_KEY);
}

function getServerDraftSnapshot(): string | null {
  return null;
}

export default function NewListingWizardPage() {
  const router = useRouter();
  // Use the shared auth context rather than a private listener: it resolves the
  // Firebase user and the demo session, and does not silently give up when
  // Firebase is unconfigured.
  const { user: firebaseUser, demoUser, loading: authLoading } = useAuth();
  const user = firebaseUser ?? demoUser;
  const [currentStep, setCurrentStep] = useState(1);

  // Form State initialized cleanly to defaultFormData to match SSR
  const [formData, setFormData] = useState<ListingFormData>(defaultFormData);

  const savedDraftRaw = useSyncExternalStore(subscribeDraft, getDraftSnapshot, getServerDraftSnapshot);
  const [draftDismissed, setDraftDismissed] = useState(false);

  function handleRestoreDraft() {
    if (savedDraftRaw) {
      try {
        const parsed = JSON.parse(savedDraftRaw) as Partial<ListingFormData>;
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore
      }
    }
    setDraftDismissed(true);
  }

  function handleDiscardDraft() {
    try {
      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
    } catch {
      // ignore
    }
    setDraftDismissed(true);
  }

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Accessible unique IDs for form fields
  const titleId = useId();
  const suburbId = useId();
  const cityId = useId();
  const provinceId = useId();
  const typeId = useId();
  const erfId = useId();
  const floorId = useId();
  const bedsId = useId();
  const bathsId = useId();
  const parkingId = useId();
  const priceId = useId();
  const levyId = useId();
  const ratesId = useId();
  const descId = useId();
  const leaseTermId = useId();
  const depositId = useId();
  const furnishedId = useId();


  // 3. Trigger Autosave on form changes
  function updateField<K extends keyof ListingFormData>(key: K, value: ListingFormData[K]) {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      try {
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  }

  function updateFields(patch: Partial<ListingFormData>) {
    setFormData((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  }

  function updatePhotos(update: (previous: ListingPhoto[]) => ListingPhoto[]) {
    setFormData((prev) => {
      const updated = { ...prev, photos: update(prev.photos ?? []) };
      try {
        localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Storage full or unavailable
      }
      return updated;
    });
  }

  // Only checked uploads count. A draft autosaved before the uploader existed
  // may still carry a pasted `image` URL, which is deliberately ignored.
  const coverUrl = formData.photos?.[0]?.url ?? "";

  function toggleFeature(featureId: string) {
    const current = formData.features ?? [];
    const next = current.includes(featureId)
      ? current.filter((item) => item !== featureId)
      : [...current, featureId];
    updateField("features", next);
  }

  const { score: qualityScore, recommendations } = calculateListingQualityScore({ ...formData, image: coverUrl });

  async function handleComplete(statusToSubmit: ListingLifecycleStatus) {
    if (!user) {
      setError("Please sign in before saving or submitting your listing.");
      return;
    }

    if (!formData.title || !formData.price || !formData.description) {
      setError("Please fill in required fields (Title, Price, and Description).");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const fullLocation = `${formData.suburb ? formData.suburb + ", " : ""}${formData.city}, ${formData.province}`;
      await createSellerListing({
        ...formData,
        // Stamp ownership from the live session rather than from form state, so
        // it cannot drift or be edited through the autosaved draft.
        ownerId: user.uid,
        ownerEmail: user.email ?? null,
        image: coverUrl,
        gallery: [],
        location: fullLocation,
        status: statusToSubmit,
      });

      localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
      router.push("/seller/portal");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save listing.");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: "Location" },
    { num: 2, label: "Specs" },
    { num: 3, label: "Features" },
    { num: 4, label: "Financials" },
    { num: 5, label: "Media & Copy" },
    { num: 6, label: "Preview & Submit" },
  ];

  return (
    <RoleGuard allowedRoles={["Seller", "Agent", "Admin"]} featureName="Publish Listing">
      <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Bar */}
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-white/70 bg-white/40 px-3.5 sm:px-5 py-3 shadow-[0_10px_25px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <Link href="/seller/portal" className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors dark:text-white">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back to seller portal</span>
            <span className="sm:hidden">Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Step {currentStep} of 6</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
              Quality {qualityScore}%
            </span>
          </div>
        </header>

        {/* Draft Restore Alert */}
        {savedDraftRaw && !draftDismissed && (
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-300/40 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-500/30 dark:text-amber-200 px-4 py-3 text-xs text-amber-950 backdrop-blur-md">
            <span>
              <strong>Draft saved:</strong> You have an unsaved listing draft from a previous session.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="rounded-xl bg-amber-800 px-3.5 py-1.5 font-bold text-white shadow-xs hover:bg-amber-900 transition-colors cursor-pointer"
              >
                Restore Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-xl border border-amber-300/60 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-[#0c1a1c]"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Wizard Progress Bar */}
        <div className="mb-6 grid grid-cols-6 gap-2">
          {steps.map((step) => (
            <button
              key={step.num}
              onClick={() => setCurrentStep(step.num)}
              className={`rounded-2xl p-2.5 text-center text-xs transition-all cursor-pointer ${
                currentStep === step.num
                  ? "border border-slate-900 bg-slate-900 text-white shadow-md dark:border-emerald-500/50 dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : currentStep > step.num
                  ? "border border-emerald-300 bg-emerald-100/70 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border border-white/60 bg-white/30 text-slate-500 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-[#0c1a1c]"
              }`}
            >
              <span className="block font-semibold">{step.num}. {step.label}</span>
            </button>
          ))}
        </div>

        {/* Wizard Body */}
        <div className="rounded-[32px] border border-white/75 bg-white/45 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] backdrop-blur-xl md:p-8 dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* STEP 1: Location */}
          {currentStep === 1 && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 1 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Property Headline & Location</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Establish the primary geographic identity for your property.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Listing Type / Purpose *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateField("listingType", "rent")}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                        formData.listingType === "rent"
                          ? "border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "border-white/70 bg-white/40 text-slate-600 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c]"
                      }`}
                    >
                      <span className="text-sm font-bold">To Rent</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Lease to verified tenants</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("listingType", "sale")}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                        formData.listingType !== "rent"
                          ? "border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "border-white/70 bg-white/40 text-slate-600 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c]"
                      }`}
                    >
                      <span className="text-sm font-bold">For Sale</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Sell property to buyers</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor={titleId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Listing Title / Headline *
                  </label>
                  <input
                    id={titleId}
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder={
                      formData.listingType === "rent"
                        ? "e.g. Modern Waterkloof Furnished Rental Villa"
                        : "e.g. Modern Waterkloof Family Estate with Solar"
                    }
                    className={inputClass}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <PredictiveLocationInput
                      id={suburbId}
                      label="Suburb"
                      type="suburb"
                      value={formData.suburb || ""}
                      selectedCity={formData.city}
                      onChange={(val) => updateField("suburb", val)}
                      onSelectLocation={(data) => {
                        const patch: Partial<ListingFormData> = { suburb: data.name };
                        if (data.city) patch.city = data.city;
                        if (data.province) patch.province = data.province;
                        updateFields(patch);
                      }}
                      placeholder="e.g. Waterkloof, Camps Bay..."
                    />
                  </div>
                  <div>
                    <PredictiveLocationInput
                      id={cityId}
                      label="City / Metro"
                      type="city"
                      value={formData.city || ""}
                      onChange={(val) => updateField("city", val)}
                      onSelectLocation={(data) => {
                        updateFields({
                          city: data.name,
                          province: data.province || formData.province,
                        });
                      }}
                      placeholder="e.g. Polokwane, Pretoria, Cape Town..."
                    />
                  </div>
                  <div>
                    <label htmlFor={provinceId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Province
                    </label>
                    <CustomSelect
                      id={provinceId}
                      value={formData.province || "Gauteng"}
                      onChange={(p) => updateField("province", p)}
                      options={provinces}
                      className="h-[48px]"
                      buttonClassName={selectTriggerClass}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 2: Specs */}
          {currentStep === 2 && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 2 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Physical Specifications</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Define the immutable architectural footprint of the physical property.</p>
              </div>

              <div className="grid gap-4 pt-2 md:grid-cols-2">
                <div>
                  <label htmlFor={typeId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Property Type
                  </label>
                  <CustomSelect
                    id={typeId}
                    value={formData.type}
                    onChange={(t) => updateField("type", t)}
                    options={[
                      { value: "House", label: "Freehold House" },
                      { value: "Villa", label: "Luxury Villa" },
                      { value: "Estate Home", label: "Security Estate Home" },
                      { value: "Townhouse", label: "Townhouse / Simplex" },
                      { value: "Apartment", label: "Apartment / Penthouse" },
                      { value: "Farm", label: "Farm / Smallholding" },
                    ]}
                    className="h-[48px]"
                    buttonClassName={selectTriggerClass}
                  />
                </div>
                <div>
                  <label htmlFor={erfId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Erf / Land Size (m²)
                  </label>
                  <input
                    id={erfId}
                    type="number"
                    value={formData.erfSizeSqm ?? ""}
                    onChange={(e) => updateField("erfSizeSqm", Number(e.target.value))}
                    placeholder="e.g. 950"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={floorId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Floor Area (m²)
                  </label>
                  <input
                    id={floorId}
                    type="number"
                    value={formData.floorSizeSqm ?? ""}
                    onChange={(e) => updateField("floorSizeSqm", Number(e.target.value))}
                    placeholder="e.g. 420"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={bedsId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Bedrooms
                  </label>
                  <input
                    id={bedsId}
                    type="number"
                    min="0"
                    value={formData.beds}
                    onChange={(e) => updateField("beds", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={bathsId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Bathrooms
                  </label>
                  <input
                    id={bathsId}
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.baths}
                    onChange={(e) => updateField("baths", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={parkingId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Parking / Garages
                  </label>
                  <input
                    id={parkingId}
                    type="number"
                    min="0"
                    value={formData.parking ?? 2}
                    onChange={(e) => updateField("parking", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: Features */}
          {currentStep === 3 && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 3 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Features & Amenities</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Select verified South African lifestyle and energy resilience features.</p>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-2 md:grid-cols-3">
                {availableFeatures.map((feat) => {
                  const isChecked = (formData.features ?? []).includes(feat.id);
                  return (
                    <button
                      key={feat.id}
                      type="button"
                      onClick={() => toggleFeature(feat.id)}
                      className={`flex items-center gap-3 rounded-[20px] border p-3.5 text-left text-xs transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold"
                          : "border-white/60 bg-white/40 text-slate-700 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c]"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isChecked ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-600" : "border-slate-300 bg-white dark:border-white/20 dark:bg-[#060d0e]/80"}`}>
                        {isChecked ? <CheckIcon className="h-3.5 w-3.5 text-white" /> : null}
                      </span>
                      <span>{feat.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* STEP 4: Financials */}
          {currentStep === 4 && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 4 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  {formData.listingType === "rent" ? "Rental Pricing & Lease Terms" : "Pricing & True Cost"}
                </h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {formData.listingType === "rent"
                    ? "Transparent rental pricing and deposit terms help qualify prospective tenants."
                    : "Transparent financial breakdown helps buyers estimate total monthly ownership."}
                </p>
              </div>

              {formData.listingType === "rent" ? (
                <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor={priceId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Monthly Rental (ZAR) *
                    </label>
                    <input
                      id={priceId}
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="e.g. R 28,000 / month"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={depositId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Security Deposit (ZAR)
                    </label>
                    <input
                      id={depositId}
                      value={formData.depositRequired ?? ""}
                      onChange={(e) => updateField("depositRequired", e.target.value)}
                      placeholder="e.g. R 28,000 (1 month)"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={leaseTermId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Lease Period
                    </label>
                    <CustomSelect
                      id={leaseTermId}
                      value={formData.leaseTerm ?? "12 Months"}
                      onChange={(lt) => updateField("leaseTerm", lt)}
                      options={[
                        { value: "6 Months", label: "6 Months" },
                        { value: "12 Months", label: "12 Months (Standard)" },
                        { value: "24 Months", label: "24 Months (Long Term)" },
                        { value: "Flexible / Month-to-Month", label: "Flexible / Month-to-Month" },
                      ]}
                      className="h-[48px]"
                      buttonClassName={selectTriggerClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={furnishedId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Furnished Status
                    </label>
                    <CustomSelect
                      id={furnishedId}
                      value={formData.furnishedStatus ?? "Unfurnished"}
                      onChange={(fs) => updateField("furnishedStatus", fs)}
                      options={[
                        { value: "Unfurnished", label: "Unfurnished" },
                        { value: "Semi-Furnished", label: "Semi-Furnished" },
                        { value: "Fully Furnished", label: "Fully Furnished" },
                      ]}
                      className="h-[48px]"
                      buttonClassName={selectTriggerClass}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 pt-2 md:grid-cols-3">
                  <div>
                    <label htmlFor={priceId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Asking Price (ZAR) *
                    </label>
                    <input
                      id={priceId}
                      value={formData.price}
                      onChange={(e) => updateField("price", e.target.value)}
                      placeholder="e.g. R 4,850,000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={levyId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Monthly Levy (if applicable)
                    </label>
                    <input
                      id={levyId}
                      value={formData.monthlyLevy ?? ""}
                      onChange={(e) => updateField("monthlyLevy", e.target.value)}
                      placeholder="e.g. R 2,400"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={ratesId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Rates & Taxes (monthly)
                    </label>
                    <input
                      id={ratesId}
                      value={formData.ratesAndTaxes ?? ""}
                      onChange={(e) => updateField("ratesAndTaxes", e.target.value)}
                      placeholder="e.g. R 1,950"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </section>
          )}

          {/* STEP 5: Media & Description */}
          {currentStep === 5 && (
            <section className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 5 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Photography & Copy</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">High-resolution imagery powers visual recommendations and buyer interest.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <p className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Photos * <span className="normal-case tracking-normal font-normal text-slate-500 dark:text-slate-400">(the first is the cover)</span>
                  </p>
                  <ListingPhotoUploader
                    ownerId={user?.uid ?? null}
                    authLoading={authLoading}
                    photos={formData.photos ?? []}
                    onPhotosChange={updatePhotos}
                  />
                </div>
                <div>
                  <label htmlFor={descId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Property Description *
                  </label>
                  <textarea
                    id={descId}
                    rows={6}
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Detail the indoor/outdoor flow, entertaining patio, security features, and location appeal..."
                    className={inputClass}
                  />
                </div>
              </div>
            </section>
          )}

          {/* STEP 6: Review, Preview & Submit */}
          {currentStep === 6 && (
            <section className="space-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Step 6 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Review & Submission</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Inspect how your listing will appear to buyers and verify quality score.</p>
              </div>

              {/* Quality Score Breakdown */}
              <div className="rounded-[24px] border border-slate-700/40 bg-slate-900/90 dark:bg-[#0c1a1c] dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] p-5 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400">Listing Quality Score</span>
                    <h2 className="mt-1 text-4xl font-light">{qualityScore}/100</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${qualityScore >= 80 ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-400/20 text-amber-300 border border-amber-500/30"}`}>
                    {qualityScore >= 80 ? "High Quality" : "Can Be Improved"}
                  </span>
                </div>
                {recommendations.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-3 dark:border-white/10">
                    <p className="text-xs text-slate-400 dark:text-slate-400">Actionable recommendations to boost score:</p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-200">
                      {recommendations.map((rec) => (
                        <li key={rec}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="rounded-[28px] border border-white/80 bg-white/50 p-4 shadow-lg backdrop-blur-xl dark:bg-[#060d0e]/60 dark:border-white/10">
                <p className="mb-3 text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Live Card Preview</p>
                <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70 shadow-sm md:flex dark:bg-[#0c1a1c]/90 dark:border-white/10">
                  {coverUrl ? (
                    <div
                      className="h-48 w-full bg-cover bg-center md:h-auto md:w-56"
                      style={{ backgroundImage: `url(${coverUrl})` }}
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-slate-200/70 text-xs font-semibold text-slate-500 md:h-auto md:w-56 dark:bg-[#060d0e] dark:text-slate-400">
                      No photo yet
                    </div>
                  )}
                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          formData.listingType === "rent"
                            ? "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                        }`}>
                          {formData.listingType === "rent" ? "To Rent" : "For Sale"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300">
                          {formData.type}
                        </span>
                        {formData.listingType === "rent" && formData.furnishedStatus && (
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-[#060d0e]/80 dark:border dark:border-white/10 dark:text-slate-300">
                            {formData.furnishedStatus}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formData.price
                          ? (formData.listingType === "rent" && !formData.price.includes("/")
                              ? `${formData.price} / mo`
                              : formData.price)
                          : "Price on request"}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{formData.title || "Untitled Property"}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formData.suburb ? `${formData.suburb}, ` : ""}{formData.city}, {formData.province}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{formData.beds} Beds</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{formData.baths} Baths</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                        <span>{formData.parking} Garages</span>
                      </span>
                      {formData.erfSizeSqm ? (
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                          <span>{formData.erfSizeSqm} m²</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-300/40 bg-rose-100/70 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200 p-3 text-xs text-rose-800">
                  {error}
                </div>
              )}
            </section>
          )}

          {/* Navigation Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200/60 dark:border-white/10 pt-5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => s - 1)}
                className="rounded-full border border-slate-300 bg-white/60 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-white dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all cursor-pointer"
              >
                Previous Step
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s + 1)}
                  className="rounded-full bg-slate-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-600 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-500 transition-all cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleComplete("Draft")}
                    className="rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-xs font-semibold text-slate-800 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-[#060d0e]/60 dark:text-slate-300 dark:hover:bg-[#0c1a1c] dark:hover:text-white transition-all cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleComplete("Submitted")}
                    className="rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-500 transition-all cursor-pointer"
                  >
                    {loading ? "Submitting..." : "Submit for Moderation"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
    </RoleGuard>
  );
}
