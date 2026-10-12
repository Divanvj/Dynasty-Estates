# Dynasty Estates - Property & Feature Taxonomy Specification

**Organisation:** Tricore Enterprises  
**Platform:** Dynasty Estates  
**Version:** 1.0  
**Phase:** 0 - Product Definition and Architecture  
**Date:** September 2026  

---

## 1. Overview & Extensibility Rule

Dynasty Estates utilizes a controlled, versioned, and extensible taxonomy system for all property classifications, architectural styles, amenities, and AI-detected features.

> **Controlled Taxonomy Rule**: Uncontrolled model-generated free text must never become canonical property taxonomy. All AI and seller suggestions must resolve to approved, versioned taxonomy nodes.

---

## 2. Core Taxonomy Categories

### 2.1 Property Categories & Subtypes
- **Residential**:
  - `freehold_house`: Standalone house / villa.
  - `estate_home`: Secure gated estate home.
  - `townhouse`: Duplex or simplex in sectional title scheme.
  - `apartment`: Flat or penthouse.
  - `cluster_home`: Clustered residential unit.
- **Commercial**:
  - `office`: Corporate office park or suite.
  - `retail`: Shop front or retail centre.
  - `industrial`: Warehouse or factory.
- **Agricultural & Land**:
  - `smallholding`: Semi-rural residential plot.
  - `commercial_farm`: Agricultural farm.
  - `vacant_land`: Residential or commercial zoned stand.

---

### 2.2 Extensible Amenity & Feature Taxonomy

Features are stored using a category code and standardized identifier:

| Feature Key | Display Label (en-ZA) | Category | Description / Verification |
|---|---|---|---|
| `solar_system` | Solar Power System | Energy & Resilience | Rooftop solar panels with grid-tie or off-grid capability. |
| `inverter_battery` | Battery Inverter Backup | Energy & Resilience | Inverter with lithium-ion/lead-acid battery backup (load-shedding ready). |
| `generator` | Backup Generator | Energy & Resilience | Dedicated fuel-powered backup generator. |
| `borehole` | Borehole Water | Water & Utilities | Groundwater extraction system with pump. |
| `water_tanks` | Rainwater Harvesting / JoJo Tanks | Water & Utilities | Water storage tanks with pressure pump. |
| `security_estate` | 24h Manned Security Estate | Security & Access | Gated community with guard house, biometric access, and perimeter patrols. |
| `swimming_pool` | Swimming Pool | Outdoor & Leisure | In-ground or above-ground pool. |
| `garden` | Private Garden | Outdoor & Leisure | Enclosed private lawn / garden suitable for recreation. |
| `pet_friendly` | Pet Friendly | Lifestyle | Permitted for dogs/cats under body corporate / municipal rules. |
| `flatlet` | Separate Flatlet / Granny Flat | Additional Living | Self-contained cottage or flatlet with kitchen and bathroom. |
| `staff_quarters` | Staff Accommodation | Additional Living | Domestic worker quarters with en-suite amenities. |
| `study` | Dedicated Study / Home Office | Interior | Quiet room configured for remote work. |
| `fireplace` | Fireplace | Interior | Wood-burning or gas fireplace. |
| `air_conditioning` | Air Conditioning | Climate | Ducted or split-unit cooling/heating. |
| `fibre_ready` | Fibre Internet Ready | Connectivity | High-speed fibre broadband terminated inside property. |
| `wheelchair_accessible` | Wheelchair Accessible | Accessibility | Step-free entrance, wide doorways, accessible bathrooms. |
| `sea_view` | Unobstructed Sea View | Views & Ambience | Direct ocean view. |
| `mountain_view` | Mountain View | Views & Ambience | Direct view of Table Mountain, Magaliesberg, or Drakensberg. |
| `covered_patio` | Covered Entertainment Patio | Entertainment | Built-in braai and covered outdoor seating. |

---

### 2.3 Visual Intelligence Controlled Taxonomy (Room & Style)

#### Approved Room Classifications (`room_type`)
- `living_room`, `dining_room`, `kitchen`, `scullery`, `master_bedroom`, `bedroom`, `bathroom`, `patio`, `garden`, `pool_area`, `garage`, `facade`, `aerial_view`, `floorplan`.

#### Approved Architectural & Interior Styles (`style`)
- `modern_contemporary`, `minimalist`, `cape_dutch`, `industrial_loft`, `classic_traditional`, `farmhouse_chic`, `mediterranean`, `art_deco`.

#### Approved Material Classifications (`materials`)
- `granite_countertop`, `engineered_quartz`, `marble`, `hardwood_flooring`, `polished_concrete`, `porcelain_tile`, `exposed_brick`, `aluminium_frames`.

