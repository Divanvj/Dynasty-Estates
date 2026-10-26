import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import BrandLogo from "@/components/brand-logo";
import { BedIcon, BathIcon, CarIcon, LocationPinIcon, ShieldCheckIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { getAgentByIdOrSlug, verifiedPractitioners } from "@/lib/agents-data";
import { getPropertyList } from "@/lib/property-data";
import { absoluteUrl } from "@/lib/site-url";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const agent = getAgentByIdOrSlug(slug);

  if (!agent) {
    return {
      title: "Practitioner Not Found",
      description: "The requested property practitioner profile could not be found.",
    };
  }

  const title = `${agent.name} | PPRA Verified Property Practitioner`;
  const description = `${agent.name} (${agent.ffcNumber}), licensed South African real estate practitioner with ${agent.agency}. Specialising in ${agent.specialty} across ${agent.location}.`;
  const canonicalUrl = absoluteUrl(`/agents/${agent.slug}`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "profile",
      images: [
        {
          url: agent.image,
          width: 600,
          height: 800,
          alt: agent.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [agent.image],
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const agent = getAgentByIdOrSlug(slug);

  if (!agent) {
    notFound();
  }

  const allProperties = await getPropertyList();
  const agentProperties = allProperties.filter(
    (p) => p.agentId === agent.id || p.agentId === agent.slug
  );

  const digits = agent.phone.replace(/\D/g, "");
  const waDigits = digits.startsWith("27") ? digits : digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  const whatsappUrl = `https://wa.me/${waDigits}?text=Hi%20${encodeURIComponent(agent.name.split(" ")[0])},%20I%20am%20enquiring%20about%20your%20Dynasty%20Estates%20property%20mandates.`;

  const agentSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: agent.name,
    jobTitle: "Licensed Property Practitioner",
    worksFor: {
      "@type": "RealEstateAgent",
      name: agent.agency,
    },
    telephone: agent.phone,
    email: agent.email,
    image: agent.image,
    description: agent.bio,
    hasCredential: {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "Property Practitioners Regulatory Authority (PPRA) Fidelity Fund Certificate",
      identifier: agent.ffcNumber,
    },
    knowsAbout: [agent.specialty, "South African Property Law", "Deeds Office Title Registration"],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Property Practitioners",
        item: absoluteUrl("/agents"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: agent.name,
        item: absoluteUrl(`/agents/${agent.slug}`),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-3 py-4 text-slate-900 md:px-8 dark:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(agentSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="mx-auto max-w-6xl">
        {/* Header / Nav */}
        <header className="mb-6 flex items-center justify-between rounded-[26px] border border-white/75 bg-white/45 px-4 sm:px-5 py-3 shadow-[0_12px_28px_rgba(36,48,50,0.08)] backdrop-blur-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <BrandLogo markOnly />
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-white">Home</Link>
              <span>/</span>
              <Link href="/agents" className="hover:text-slate-900 dark:hover:text-white">Agents</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">{agent.name}</span>
            </nav>
          </div>
          <Link
            href="/agents"
            className="rounded-full border border-slate-300/80 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white transition-all dark:bg-[#060d0e]/60 dark:border-white/10 dark:text-slate-300"
          >
            ← All Agents
          </Link>
        </header>

        {/* Profile Card */}
        <section className="mb-10 rounded-3xl border border-white/80 bg-white/60 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_45px_rgba(36,48,50,0.06)] dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
            <div className="relative h-48 w-48 sm:h-56 sm:w-56 shrink-0 overflow-hidden rounded-3xl border border-white/80 shadow-md">
              <Image
                src={agent.image}
                alt={agent.name}
                fill
                sizes="(max-width: 640px) 192px, 224px"
                className="object-cover"
                priority
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-500/30">
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  PPRA Verified Practitioner
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600 dark:bg-[#060d0e]/60 dark:text-slate-300">
                  FFC #{agent.ffcNumber}
                </span>
              </div>

              <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold text-slate-950 dark:text-white">
                {agent.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {agent.agency}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Area Focus: {agent.location} · Specialty: {agent.specialty}
              </p>

              <p className="mt-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-2xl">
                {agent.bio}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  <span>WhatsApp Practitioner</span>
                </a>
                <a
                  href={`tel:${digits}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-950 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all dark:bg-[#060d0e] dark:border dark:border-white/10"
                >
                  <PhoneIcon className="h-4 w-4" />
                  <span>Call {agent.phone}</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Active Listings Handled by this Agent */}
        <section>
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Current Mandates by {agent.name.split(" ")[0]} ({agentProperties.length})
            </h2>
            <Link href="/search" className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400">
              Browse All Listings →
            </Link>
          </div>

          {agentProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentProperties.map((prop) => (
                <article
                  key={prop.id}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/70 shadow-md backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-[#0c1a1c]/80 dark:border-white/10 dark:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={prop.image}
                      alt={prop.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        {prop.type}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white z-10">
                      <p className="text-xl font-extrabold tracking-tight">{prop.price}</p>
                      <span className="text-xs font-semibold text-slate-300">{prop.area}</span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 dark:text-white">
                      {prop.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 line-clamp-1 dark:text-slate-400">
                      <LocationPinIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>{prop.location}</span>
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/10 pt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <BedIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prop.beds} Beds</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BathIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prop.baths} Baths</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CarIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span>{prop.parking} Garages</span>
                      </div>
                    </div>

                    <Link
                      href={`/property/${prop.slug}`}
                      className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
                    >
                      <span>View Mandate Details</span>
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/80 bg-white/50 p-8 text-center backdrop-blur-xl dark:bg-[#0c1a1c]/70 dark:border-white/10">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New mandates for {agent.name.split(" ")[0]} are currently pending statutory verification.
              </p>
              <Link
                href="/search"
                className="mt-3 inline-block rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white dark:bg-emerald-600"
              >
                Browse All Properties →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
