import React from "react";
import { PropertyRecord } from "@/lib/property-data";
import { SITE_URL } from "@/lib/site-url";

interface SeoStructuredDataProps {
  property: PropertyRecord;
  siteUrl?: string;
}

export default function SeoStructuredData({
  property,
  siteUrl = SITE_URL,
}: SeoStructuredDataProps) {
  const propertyUrl = `${siteUrl}/property/${property.slug}`;
  const isRental = property.listingType === "rent";

  const provSlug = (property.province || "gauteng").toLowerCase().replace(/\s+/g, "-");
  const citySlug = (property.city || "johannesburg").toLowerCase().replace(/\s+/g, "-");
  const transactionTypeSlug = isRental ? "to-rent" : "for-sale";

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: isRental ? "To Rent" : "For Sale",
        item: `${siteUrl}/${transactionTypeSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: property.province || "Gauteng",
        item: `${siteUrl}/${transactionTypeSlug}/${provSlug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: property.city || "Johannesburg",
        item: `${siteUrl}/${transactionTypeSlug}/${provSlug}/${citySlug}`,
      },
      {
        "@type": "ListItem",
        position: 5,
        name: property.title,
        item: propertyUrl,
      },
    ],
  };

  const isApartment = property.type === "Apartment" || property.type === "Penthouse";
  const accommodationType = isApartment ? "Apartment" : "SingleFamilyResidence";

  const realEstateListingSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: propertyUrl,
    image: property.gallery && property.gallery.length > 0 ? property.gallery : [property.image],
    datePosted: "2026-01-20T08:00:00+02:00",
    offers: {
      "@type": "Offer",
      price: property.numericPrice,
      priceCurrency: "ZAR",
      availability: property.status === "Sold" || property.status === "Rented"
        ? "https://schema.org/Discontinued"
        : "https://schema.org/InStock",
      validFrom: "2026-01-20T08:00:00+02:00",
      businessFunction: isRental
        ? "http://purl.org/goodrelations/v1#LeaseOut"
        : "http://purl.org/goodrelations/v1#Sell",
    },
    contentLocation: {
      "@type": "Place",
      name: `${property.suburb || property.location || ""}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.location || "",
        addressLocality: property.city || "Johannesburg",
        addressRegion: property.province || "Gauteng",
        addressCountry: "ZA",
      },
    },
    about: {
      "@type": accommodationType,
      name: property.title,
      numberOfBedrooms: property.beds,
      numberOfBathroomsTotal: property.baths,
      floorSize: {
        "@type": "QuantitativeValue",
        value: parseInt(property.area.replace(/[^0-9]/g, ""), 10) || 350,
        unitCode: "MTK", // Square meters
      },
      amenityFeature: property.features.map((f) => ({
        "@type": "LocationFeatureSpecification",
        name: f.replace(/_/g, " "),
        value: true,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(realEstateListingSchema) }}
      />
    </>
  );
}

