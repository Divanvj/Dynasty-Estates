"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useSyncExternalStore } from "react";

import { useAuth } from "@/components/auth-provider";
import CustomSelect from "@/components/custom-select";
import PredictiveLocationInput from "@/components/predictive-location-input";
import ListingFloorPlanField from "@/components/listing-floor-plan-field";
import ShowDayField from "@/components/listing-show-day-field";
import ListingTourField from "@/components/listing-tour-field";
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
  updateSellerListing,
  type ListingForEdit,
  type ListingFormData,
  type ListingLifecycleStatus,
} from "@/lib/seller-listings";
import { formatListingPrice, formatPriceInput } from "@/lib/formatters";
import { HEALTH_FIX, type HealthKey } from "@/lib/listing-insights";
import { PUBLIC_LISTING_STATUSES } from "@/lib/types/domain";
import type { ListingPhoto } from "@/lib/photo-intake";

const inputClass =
  "w-full h-[48px] rounded-control border border-white/70 bg-white/60 dark:border-white/10 dark:bg-surface-ink/60 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md transition-all";

const selectTriggerClass =
  "w-full h-full flex items-center justify-between rounded-control border border-white/70 bg-white/60 dark:border-white/10 dark:bg-surface-ink/60 px-4 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 backdrop-blur-md transition-all";

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

/**
 * The unfinished new listing is kept in this browser per account:
 * "dynasty_seller_wizard_autosave:<uid>". It used to be one key for the whole
 * browser, so whoever signed in next on the same device was offered the
 * previous person's draft (owner, 24 Nov 2026). That shared copy can't be
 * traced to its owner, so it is deleted unread.
 */
const LEGACY_AUTOSAVE_KEY = "dynasty_seller_wizard_autosave";
function autosaveKey(uid: string | null | undefined): string | null {
  return uid ? `${LEGACY_AUTOSAVE_KEY}:${uid}` : null;
}

const defaultFormData: ListingFormData = {
  ownerId: "",
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

function readDraft(key: string | null): string | null {
  if (typeof window === "undefined" || !key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function getServerDraftSnapshot(): string | null {
  return null;
}

/** Opening the wizard on an existing listing (/seller/listings/[id]/edit). */
export type ListingWizardEdit = {
  listingId: string;
  loaded: ListingForEdit;
  /**
   * From the account's role claim: agents and admins may keep a listing live
   * (firestore.rules), so their edits keep its status. A private seller's
   * edits to a filed listing go back to moderation.
   */
  canPublish: boolean;
  /** Where to go after saving or on "Back". */
  returnTo: string;
  /** A listing-checklist item to fix: opens its step and scrolls to `#fix-<key>`. */
  fix?: HealthKey;
};

/**
 * The listing wizard. Without `edit` it files a new listing (/seller/listings/new);
 * with it, the same six steps edit one of the account's listings. The caller
 * supplies the RoleGuard.
 */
export default function ListingWizard({ edit }: { edit?: ListingWizardEdit }) {
  const router = useRouter();
  // Use the shared auth context rather than a private listener: it resolves the
  // Firebase user and the demo session, and does not silently give up when
  // Firebase is unconfigured.
  const { user: firebaseUser, demoUser, loading: authLoading } = useAuth();
  const user = firebaseUser ?? demoUser;
  const draftKey = autosaveKey(user?.uid);

  // The old browser-wide draft belonged to whoever used this device last.
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_AUTOSAVE_KEY);
    } catch {
      // Storage blocked
    }
  }, []);
  const [currentStep, setCurrentStep] = useState<number>(edit?.fix ? HEALTH_FIX[edit.fix].step : 1);

  // Opened from the listing checklist: bring the field into view and focus it.
  useEffect(() => {
    if (!edit?.fix) return;
    const target = document.getElementById(`fix-${edit.fix}`);
    if (!target) return;
    target.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    const field = target.querySelector<HTMLElement>("input:not([type=hidden]), textarea, button, [tabindex]");
    field?.focus({ preventScroll: true });
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form State initialized cleanly to defaultFormData to match SSR
  const [formData, setFormData] = useState<ListingFormData>(edit ? edit.loaded.form : defaultFormData);

  // What saving does to the listing's status when editing.
  const currentStatus = edit?.loaded.status;
  const isDraft = !edit || currentStatus === "Draft";
  const wasLive = currentStatus ? (PUBLIC_LISTING_STATUSES as readonly string[]).includes(currentStatus) : false;
  const saveStatus: ListingLifecycleStatus = !edit || isDraft ? "Submitted" : edit.canPublish ? edit.loaded.status : "Submitted";
  const saveLabel = !edit || isDraft ? "Submit for Moderation" : edit.canPublish ? "Save changes" : "Save and send for review";

  // A new listing's form is autosaved in this browser; an edit is not, so it
  // can never overwrite the draft of a listing still being written.
  function persist(updated: ListingFormData) {
    if (edit || !draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }
  }

  const savedDraftRaw = useSyncExternalStore(subscribeDraft, () => readDraft(draftKey), getServerDraftSnapshot);
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
      if (draftKey) localStorage.removeItem(draftKey);
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
      persist(updated);
      return updated;
    });
  }

  function updateFields(patch: Partial<ListingFormData>) {
    setFormData((prev) => {
      const updated = { ...prev, ...patch };
      persist(updated);
      return updated;
    });
  }

  function updatePhotos(update: (previous: ListingPhoto[]) => ListingPhoto[]) {
    setFormData((prev) => {
      const updated = { ...prev, photos: update(prev.photos ?? []) };
      persist(updated);
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
      // The province picker shows Gauteng until another is chosen, so save what
      // it shows; an untouched picker used to store an empty province.
      const province = formData.province || "Gauteng";
      const fullLocation = `${formData.suburb ? formData.suburb + ", " : ""}${formData.city}, ${province}`;
      const listing: ListingFormData = {
        ...formData,
        province,
        // Stamp ownership from the live session rather than from form state, so
        // it cannot drift or be edited through the autosaved draft.
        ownerId: user.uid,
        image: coverUrl,
        gallery: [],
        location: fullLocation,
        status: statusToSubmit,
      };

      if (edit) {
        await updateSellerListing(edit.listingId, edit.loaded, listing, statusToSubmit);
        router.push(edit.returnTo);
      } else {
        await createSellerListing(listing);
        if (draftKey) localStorage.removeItem(draftKey);
        router.push("/seller/portal");
      }
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
      <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <div className="mx-auto max-w-4xl">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between rounded-card border border-white/70 bg-white/40 px-3.5 sm:px-5 py-3 shadow-[0_10px_25px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <Link href={edit ? edit.returnTo : "/seller/portal"} className="tap-44 relative flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-950 transition-colors dark:text-white">
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{edit ? "Back to the listing" : "Back to seller portal"}</span>
            <span className="sm:hidden">{edit ? "Listing" : "Portal"}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Step {currentStep} of 6</span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
              Quality {qualityScore}%
            </span>
          </div>
        </div>

        {/* Editing: which listing, and what saving will do to it. */}
        {edit && (
          <div className="mb-4 space-y-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-700 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300">
            <p>
              <span className="font-semibold text-slate-900 dark:text-white">Editing:</span> {edit.loaded.form.title || "Untitled property"}{" "}
              <span className="text-slate-500 dark:text-slate-400">({edit.loaded.status})</span>
            </p>
            {edit.loaded.status === "Needs changes" && edit.loaded.moderationFeedback ? (
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Moderator&rsquo;s note:</span> &ldquo;{edit.loaded.moderationFeedback}&rdquo;
              </p>
            ) : null}
            {!edit.canPublish && !isDraft ? (
              <p role="note" className="text-amber-900 dark:text-amber-200">
                {wasLive
                  ? "This listing is live. When you save, your changes go to a moderator and the listing is hidden from buyers until it is approved again."
                  : "When you save, your changes go to a moderator for review."}
              </p>
            ) : null}
          </div>
        )}

        {/* Draft Restore Alert */}
        {!edit && savedDraftRaw && !draftDismissed && (
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
                className="rounded-xl border border-amber-300/60 bg-white px-3 py-1.5 font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer dark:bg-surface-ink/60 dark:border-white/10 dark:text-slate-300 dark:hover:bg-surface-panel"
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
                  ? "border border-slate-900 bg-slate-900 text-white shadow-md dark:border-emerald-500/50 dark:bg-emerald-700 dark:text-white dark:shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                  : currentStep > step.num
                  ? "border border-emerald-300 bg-emerald-100/70 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-300"
                  : "border border-white/60 bg-white/30 text-slate-600 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-surface-panel"
              }`}
            >
              {/* Six labels don't fit side by side on a phone: numbers only there. */}
              <span className="block font-semibold">
                {step.num}.<span className="sr-only sm:not-sr-only"> {step.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Wizard Body */}
        <div className="rounded-panel border border-white/75 bg-white/45 p-6 shadow-[0_20px_45px_rgba(36,48,50,0.1)] backdrop-blur-xl md:p-8 dark:bg-surface-panel/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          {/* STEP 1: Location */}
          {currentStep === 1 && (
            <section className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 1 of 6</p>
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
                          : "border-white/70 bg-white/40 text-slate-600 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel"
                      }`}
                    >
                      <span className="text-sm font-bold">To Rent</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">Lease to verified tenants</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField("listingType", "sale")}
                      className={`flex flex-col items-center justify-center gap-1 rounded-2xl border p-3.5 text-center transition-all cursor-pointer ${
                        formData.listingType !== "rent"
                          ? "border-emerald-600 bg-emerald-50/90 text-emerald-950 font-bold shadow-sm ring-2 ring-emerald-500/20 dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "border-white/70 bg-white/40 text-slate-600 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel"
                      }`}
                    >
                      <span className="text-sm font-bold">For Sale</span>
                      <span className="text-xs text-slate-600 dark:text-slate-400">Sell property to buyers</span>
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 2 of 6</p>
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
                <div id="fix-size" className="scroll-mt-24">
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 3 of 6</p>
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
                      className={`flex items-center gap-3 rounded-control border p-3.5 text-left text-xs transition-all cursor-pointer ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-300 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)] font-bold"
                          : "border-white/60 bg-white/40 text-slate-700 hover:bg-white/60 font-medium dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel"
                      }`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${isChecked ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-700" : "border-slate-300 bg-white dark:border-white/20 dark:bg-surface-ink/80"}`}>
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 4 of 6</p>
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
                      value={formatPriceInput(formData.price)}
                      inputMode="numeric"
                      onChange={(e) => updateField("price", formatPriceInput(e.target.value))}
                      placeholder="e.g. R 28,000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor={depositId} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                      Security Deposit (ZAR)
                    </label>
                    <input
                      id={depositId}
                      value={formatPriceInput(formData.depositRequired ?? "")}
                      inputMode="numeric"
                      onChange={(e) => updateField("depositRequired", formatPriceInput(e.target.value))}
                      placeholder="e.g. R 28,000"
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
                      value={formatPriceInput(formData.price)}
                      inputMode="numeric"
                      onChange={(e) => updateField("price", formatPriceInput(e.target.value))}
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
                      value={formatPriceInput(formData.monthlyLevy ?? "")}
                      inputMode="numeric"
                      onChange={(e) => updateField("monthlyLevy", formatPriceInput(e.target.value))}
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
                      value={formatPriceInput(formData.ratesAndTaxes ?? "")}
                      inputMode="numeric"
                      onChange={(e) => updateField("ratesAndTaxes", formatPriceInput(e.target.value))}
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 5 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Photography & Copy</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">High-resolution imagery powers visual recommendations and buyer interest.</p>
              </div>

              <div className="space-y-4 pt-2">
                <div id="fix-photos" className="scroll-mt-24">
                  <p className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">
                    Photos * <span className="normal-case tracking-normal font-normal text-slate-600 dark:text-slate-400">(the first is the cover)</span>
                  </p>
                  <ListingPhotoUploader
                    ownerId={user?.uid ?? null}
                    authLoading={authLoading}
                    photos={formData.photos ?? []}
                    onPhotosChange={updatePhotos}
                  />
                </div>
                <div id="fix-showday" className="scroll-mt-24">
                  <ShowDayField
                    value={formData.onShow}
                    onChange={(onShow) => updateField("onShow", onShow)}
                  />
                </div>
                <div id="fix-floorplan" className="scroll-mt-24">
                  <ListingFloorPlanField
                    ownerId={user?.uid ?? null}
                    authLoading={authLoading}
                    floorPlan={formData.floorPlan}
                    onChange={(floorPlan) => updateField("floorPlan", floorPlan)}
                  />
                </div>
                <div id="fix-tour" className="scroll-mt-24">
                  <ListingTourField
                    value={formData.virtualTourUrl}
                    onChange={(url) => updateField("virtualTourUrl", url)}
                  />
                </div>
                <div id="fix-description" className="scroll-mt-24">
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
                <p className="text-xs uppercase tracking-[0.24em] text-slate-600 dark:text-slate-400">Step 6 of 6</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Review & Submission</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Inspect how your listing will appear to buyers and verify quality score.</p>
              </div>

              {/* Quality Score Breakdown */}
              <div className="rounded-card border border-slate-700/40 bg-slate-900/90 dark:bg-surface-panel dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.5)] p-5 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-[0.2em] text-emerald-400">Listing Quality Score</span>
                    <h2 className="mt-1 text-4xl font-light">{qualityScore}/100</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${qualityScore >= 80 ? "bg-emerald-400/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-400/20 text-amber-300 border border-amber-500/30"}`}>
                    {qualityScore >= 80 ? "High Quality" : "Can Be Improved"}
                  </span>
                </div>
                {recommendations.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-3 dark:border-white/10">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Actionable recommendations to boost score:</p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-200">
                      {recommendations.map((rec) => (
                        <li key={rec}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Live Preview Card */}
              <div className="rounded-card border border-white/80 bg-white/50 p-4 shadow-lg backdrop-blur-xl dark:bg-surface-ink/60 dark:border-white/10">
                <p className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Live Card Preview</p>
                <div className="overflow-hidden rounded-control border border-white/70 bg-white/70 shadow-sm md:flex dark:bg-surface-panel/90 dark:border-white/10">
                  {coverUrl ? (
                    <div
                      className="h-48 w-full bg-cover bg-center md:h-auto md:w-56"
                      style={{ backgroundImage: `url(${coverUrl})` }}
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-slate-200/70 text-xs font-semibold text-slate-600 md:h-auto md:w-56 dark:bg-surface-ink dark:text-slate-400">
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
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:text-slate-300">
                          {formData.type}
                        </span>
                        {formData.listingType === "rent" && formData.furnishedStatus && (
                          <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-surface-ink/80 dark:border dark:border-white/10 dark:text-slate-300">
                            {formData.furnishedStatus}
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatListingPrice(formData.price, formData.listingType)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{formData.title || "Untitled Property"}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{formData.suburb ? `${formData.suburb}, ` : ""}{formData.city}, {formData.province}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{formData.beds} Beds</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{formData.baths} Baths</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <CarIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{formData.parking} Garages</span>
                      </span>
                      {formData.erfSizeSqm ? (
                        <span className="flex items-center gap-1">
                          <AreaIcon className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
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
                className="pill-lg border border-slate-300 bg-white/60 font-semibold text-slate-700 hover:bg-white dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white transition-all cursor-pointer"
              >
                Previous Step
              </button>
            ) : <div />}

            <div className="flex flex-wrap items-center justify-end gap-3">
              {currentStep < 6 ? (
                <>
                  {/* An edit can be saved from any step: fixing the price
                      shouldn't mean clicking through all six. */}
                  {edit ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleComplete(isDraft ? "Draft" : saveStatus)}
                      className="pill-lg border border-slate-300 bg-white/70 font-semibold text-slate-800 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white transition-all cursor-pointer"
                    >
                      {loading ? "Saving…" : isDraft ? "Save as Draft" : saveLabel}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => s + 1)}
                    className="pill-lg bg-slate-900 font-semibold text-white shadow-md hover:bg-slate-800 dark:bg-emerald-700 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    Next Step →
                  </button>
                </>
              ) : (
                <>
                  {isDraft ? (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => void handleComplete("Draft")}
                      className="pill-lg border border-slate-300 bg-white/70 font-semibold text-slate-800 hover:bg-white disabled:opacity-50 dark:border-white/10 dark:bg-surface-ink/60 dark:text-slate-300 dark:hover:bg-surface-panel dark:hover:text-white transition-all cursor-pointer"
                    >
                      Save as Draft
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void handleComplete(saveStatus)}
                    className="pill-lg bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:text-white dark:border dark:border-emerald-500/50 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] dark:hover:bg-emerald-800 transition-all cursor-pointer"
                  >
                    {loading ? (edit ? "Saving…" : "Submitting...") : saveLabel}
                  </button>
                </>
              )}
            </div>
          </div>
          {/* Shown on every step, because an edit can be saved from any of them. */}
          {error && currentStep !== 6 && (
            <p role="alert" className="mt-4 rounded-2xl border border-rose-300/40 bg-rose-100/70 dark:bg-rose-950/40 dark:border-rose-500/30 dark:text-rose-200 p-3 text-xs text-rose-800">
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
