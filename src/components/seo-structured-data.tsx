import React from "react";
import { PropertyRecord } from "@/lib/property-data";

interface SeoStructuredDataProps {
  property: PropertyRecord;
  siteUrl?: string;
}

export default function SeoStructuredData({
  property,
  siteUrl = "https://dynastyestates.co.za",
}: SeoStructuredDataProps) {
  const propertyUrl = `${siteUrl}/property/${property.slug}`;
  const isRental = property.listingType === "rent";

  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": property.province || "South Africa",
        "item": `${siteUrl}/${isRental ? "to-rent" : "for-sale"}/${encodeURIComponent(
          (property.province || "all").toLowerCase().replace(/\s+/g, "-")
        )}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": property.city || "Metro",
        "item": `${siteUrl}/${isRental ? "to-rent" : "for-sale"}/${encodeURIComponent(
          (property.province || "all").toLowerCase().replace(/\s+/g, "-")
        )}/${encodeURIComponent((property.city || "all").toLowerCase().replace(/\s+/g, "-"))}`,
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": property.title,
        "item": propertyUrl,
      },
    ],
  };

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
      availability: "https://schema.org/InStock",
      validFrom: "2026-01-20T08:00:00+02:00",
      businessFunction: isRental
        ? "http://purl.org/goodrelations/v1#LeaseOut"
        : "http://purl.org/goodrelations/v1#Sell",
    },
    contentLocation: {
      "@type": "Place",
      name: `${property.suburb || ""}, ${property.city || ""}`,
      address: {
        "@type": "PostalAddress",
        addressLocality: property.city || "Pretoria",
        addressRegion: property.province || "Gauteng",
        addressCountry: "ZA",
      },
    },
    about: {
      "@type": "Accommodation",
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

