# 01 — Dynasty Estates baseline

Captured from the deployed site (**https://dynasty-estates.vercel.app**) with headless
Chrome over CDP. Animation frozen before each screenshot so both viewports show the
settled frame. Performance figures are from a single unthrottled run on a desktop
connection — treat them as a floor, not a field measurement.

Records: **47** page/viewport combinations.

## Performance, weight and tap targets

| Page | Viewport | Requests | Weight | Image bytes | LCP | CLS | Tap<44px | Controls | H-overflow |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| home | 360x865 | 59 | 1.36 MB | 0.05 MB | 2092 ms | 0.000 | 81 | 115 | 29 |
| home | 390x844 | 63 | 1.62 MB | 0.09 MB | 844 ms | 0.000 | 82 | 115 | 0 |
| home | 768x1024 | 61 | 1.37 MB | 0.23 MB | 1312 ms | 0.000 | 70 | 106 | 0 |
| home | 1024x768 | 61 | 1.44 MB | 0.18 MB | 1084 ms | 0.000 | 96 | 107 | 0 |
| home | 1440x900 | 25 | 0.78 MB | 0.07 MB | 2764 ms | 0.000 | 97 | 107 | 0 |
| for-sale | 360x800 | 67 | 0.86 MB | 0.04 MB | 464 ms | 0.000 | 4 | 29 | 0 |
| for-sale | 390x844 | 60 | 0.87 MB | 0.00 MB | 408 ms | 0.000 | 5 | 29 | 0 |
| for-sale | 768x1024 | 69 | 1.00 MB | 0.02 MB | 452 ms | 0.000 | 4 | 29 | 0 |
| for-sale | 1024x768 | 66 | 1.05 MB | 0.14 MB | 480 ms | 0.000 | 9 | 30 | 0 |
| for-sale | 1440x900 | 60 | 0.93 MB | 0.04 MB | 544 ms | 0.000 | 19 | 30 | 0 |
| to-rent | 390x844 | 62 | 0.88 MB | 0.00 MB | 396 ms | 0.000 | 12 | 29 | 0 |
| to-rent | 1440x900 | 62 | 0.96 MB | 0.07 MB | 448 ms | 0.000 | 19 | 30 | 0 |
| search | 360x800 | 57 | 0.82 MB | 0.01 MB | 2064 ms | 0.000 | 59 | 77 | 0 |
| search | 390x844 | 57 | 0.98 MB | 0.04 MB | 1408 ms | 0.000 | 61 | 77 | 0 |
| search | 768x1024 | 69 | 0.98 MB | 0.07 MB | 1608 ms | 0.000 | 61 | 77 | 0 |
| search | 1024x768 | 57 | 1.27 MB | 0.15 MB | 1576 ms | 0.000 | 68 | 72 | 0 |
| search | 1440x900 | 55 | 1.22 MB | 0.12 MB | 1640 ms | 0.000 | 68 | 72 | 0 |
| map-search | 360x800 | 61 | 1.17 MB | 0.02 MB | 2600 ms | 0.125 | 28 | 38 | 0 |
| map-search | 390x844 | 55 | 1.07 MB | 0.01 MB | 1848 ms | 0.000 | 28 | 38 | 0 |
| map-search | 768x1024 | 60 | 1.10 MB | 0.01 MB | 1824 ms | 0.053 | 30 | 39 | 0 |
| map-search | 1024x768 | 69 | 2.84 MB | 0.01 MB | 3144 ms | 0.000 | 109 | 112 | 0 |
| map-search | 1440x900 | 76 | 3.00 MB | 0.04 MB | 2068 ms | 0.000 | 110 | 112 | 0 |
| ai-search | 390x860 | 48 | 0.78 MB | 0.00 MB | 384 ms | 0.000 | 5 | 14 | 8 |
| ai-search | 1440x900 | 38 | 0.89 MB | 0.00 MB | 416 ms | 0.000 | 6 | 10 | 0 |
| property | 360x800 | 60 | 1.16 MB | 0.02 MB | 1500 ms | 0.001 | 16 | 31 | 0 |
| property | 390x844 | 52 | 1.16 MB | 0.04 MB | 916 ms | 0.001 | 16 | 31 | 0 |
| property | 768x1024 | 52 | 1.14 MB | 0.06 MB | 888 ms | 0.000 | 41 | 58 | 0 |
| property | 1024x768 | 38 | 1.30 MB | 0.19 MB | 820 ms | 0.000 | 40 | 53 | 0 |
| property | 1440x900 | 38 | 1.05 MB | 0.05 MB | 848 ms | 0.000 | 41 | 53 | 0 |
| agents | 390x844 | 57 | 0.80 MB | 0.00 MB | 340 ms | 0.000 | 13 | 20 | 0 |
| agents | 1440x900 | 40 | 1.20 MB | 0.00 MB | 464 ms | 0.000 | 13 | 15 | 0 |
| collections | 390x844 | 59 | 0.92 MB | 0.00 MB | 4652 ms | 0.024 | 2 | 9 | 0 |
| collections | 1440x900 | 32 | 0.87 MB | 0.00 MB | 4280 ms | 0.011 | 2 | 4 | 0 |
| insights | 390x844 | 45 | 1.23 MB | 0.00 MB | 636 ms | 0.000 | 7 | 14 | 0 |
| insights | 1440x900 | 30 | 1.10 MB | 0.00 MB | 552 ms | 0.000 | 7 | 9 | 0 |
| calculators | 390x844 | 47 | 0.86 MB | 0.00 MB | 396 ms | 0.000 | 27 | 39 | 0 |
| calculators | 1440x900 | 31 | 0.69 MB | 0.00 MB | 356 ms | 0.000 | 27 | 34 | 0 |
| compare | 390x844 | 58 | 1.10 MB | 0.02 MB | 836 ms | 0.000 | 25 | 35 | 0 |
| compare | 1440x900 | 39 | 1.19 MB | 0.06 MB | 540 ms | 0.000 | 26 | 30 | 0 |
| saved | 390x844 | 56 | 1.01 MB | 0.05 MB | 1696 ms | 0.000 | 16 | 23 | 0 |
| saved | 1440x900 | 44 | 0.84 MB | 0.02 MB | 1596 ms | 0.000 | 12 | 14 | 0 |
| seller-portal | 390x844 | 46 | 0.72 MB | 0.00 MB | 792 ms | 2.933 | 2 | 7 | 0 |
| seller-portal | 1440x900 | 28 | 0.65 MB | 0.00 MB | 576 ms | 0.395 | 2 | 2 | 0 |
| new-listing | 390x844 | 49 | 0.92 MB | 0.00 MB | 1004 ms | 3.073 | 2 | 7 | 0 |
| new-listing | 1440x900 | 28 | 0.67 MB | 0.00 MB | 612 ms | 0.414 | 2 | 2 | 0 |
| agent-dashboard | 390x844 | 46 | 0.83 MB | 0.00 MB | 832 ms | 0.000 | 2 | 7 | 0 |
| agent-dashboard | 1440x900 | 28 | 0.64 MB | 0.00 MB | 560 ms | 0.545 | 2 | 2 | 0 |

## Page metadata and accessibility basics

| Page | `<title>` | og:image | Headings | Order jumps | Images missing alt | Console errors |
|---|---|---|---:|---:|---:|---:|
| home | Dynasty Estates \| Property Intelligence | **none** | 15 | 0 | 0 | 0 |
| for-sale | Properties & Luxury Homes For Sale in South Africa | **none** | 13 | 0 | 0 | 0 |
| to-rent | Properties & Apartments To Rent in South Africa | **none** | 13 | 0 | 0 | 0 |
| search | Search Luxury Properties & Real Estate | **none** | 11 | 0 | 0 | 0 |
| map-search | Dynasty Estates \| Property Intelligence | **none** | 2 | 1 | 6 | 0 |
| ai-search | Dynasty Estates \| Property Intelligence | **none** | 2 | 0 | 0 | 0 |
| property | Claremont Upper Courtyard Townhouse \| For Sale in Claremont | yes | 4 | 0 | 0 | 0 |
| agents | PPRA Verified Property Practitioners & Real Estate Agents | **none** | 4 | 1 | 0 | 0 |
| collections | Property Collections | **none** | 1 | 0 | 0 | 0 |
| insights | South Africa Property Market Insights & Deeds Office Trends | **none** | 6 | 0 | 0 | 0 |
| calculators | South African Property Financial Calculators \| SARS Transfer Duty & Bond Repayments | **none** | 2 | 0 | 0 | 0 |
| compare | Compare Properties | **none** | 4 | 1 | 0 | 0 |
| saved | Saved Properties | **none** | 3 | 1 | 0 | 0 |
| seller-portal | Seller Portal \| Dynasty Estates | **none** | 1 | 0 | 0 | 0 |
| new-listing | Seller Portal \| Dynasty Estates | **none** | 1 | 0 | 0 | 0 |
| agent-dashboard | Practitioner Workspace \| Dynasty Estates | **none** | 1 | 0 | 0 | 0 |

## Colour inventory

### Backgrounds
| Background colour | Elements | Pages |
|---|---:|---|
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.7` | 614 | 16 |
| `#0.fa9f8c21e1d2180.05388a8b08dd1e40.014bc4fa7074066 @0.8` | 471 | 3 |
| `#60.49374bc6a7f0.da393ee5eedcc2.77eda6612839` | 314 | 12 |
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.6` | 246 | 16 |
| `#5b.bc3c9eecbfb0.ffaf102363b2584.c509bf9c62a1c` | 164 | 5 |
| `#ffffff` | 124 | 6 |
| `#c5a059` | 106 | 4 |
| `#1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4` | 90 | 10 |
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.8` | 82 | 6 |
| `#000000 @0.45` | 76 | 3 |
| `#000000 @0.6` | 74 | 3 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.5` | 67 | 4 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.75` | 65 | 2 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.45` | 47 | 10 |
| `#7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92` | 44 | 5 |
| `#000000` | 36 | 12 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.55` | 36 | 5 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.9` | 35 | 5 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.4` | 31 | 6 |
| `#000000 @0.4` | 30 | 2 |
| `#0b4d4e` | 30 | 3 |
| `#dce4e3` | 30 | 12 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.85` | 25 | 16 |
| `#0.f33300de4c5110.0cbc2c6b98d54e80.03e2cf6d90fd12e @0.9` | 20 | 12 |
| `#5e.e6809d49518411.13afb7e90ff95.a36b8f9b13164` | 20 | 5 |
| `#0.c4dd93c46d82b80.106511d2905b2c0.2d3fe1975f2cb6 @0.9` | 19 | 2 |

### Text
| Text colour | Elements | Pages |
|---|---:|---|
| `#7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92` | 5236 | 16 |
| `#41.88ef34d6a162.4062f5989df12e.81d7dbf487fc8` | 2865 | 12 |
| `#1a.f4f765fd8adb1.785c67dfe32af.b305532617c18` | 2702 | 16 |
| `#ffffff` | 1710 | 15 |
| `#23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f` | 1684 | 14 |
| `#30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7` | 1275 | 16 |
| `#23.5e147ae147ae21.1e69ad42c3ca8.0a3ec02f2f988` | 699 | 13 |
| `#1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4` | 351 | 14 |
| `#10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258` | 218 | 12 |
| `#0f172a` | 202 | 16 |
| `#0.d851a8694035780.235b2d4d4024b40.097e0ac7da1ec5 @0.7` | 130 | 1 |
| `#54.c3e425aee631.f2027525460aa7.eef156191149` | 105 | 5 |
| `#37.0c504816f00631.ecb295e9e1bf.ee147ae147ae` | 102 | 5 |
| `#53.eb98c7e282430.b65fd8adabad.e288ce703afb8` | 72 | 4 |
| `#f.0ee631f8a0911.f36113404ea52.62398201cd5fa` | 60 | 1 |
| `#5a.3985f06f69441f.09fbe76c8b449.7888f861a60d8` | 35 | 3 |
| `#2c.7cb295e9e1b29.0a2339c0ebeeb.093dd97f62b68` | 33 | 3 |
| `#25.e1d7dbf487fc25.2b7e90ff972434.4594af4f0d84` | 30 | 1 |
| `#0078a8` | 30 | 1 |
| `#1c.dd1b71758e221a.ecc63f1412065.75b9628cbd124` | 21 | 5 |
| `#4b.13bcd35a85883c.bb367a0f909613.6a29c779a6b5` | 20 | 3 |
| `#5b.b86594af4f0c0.81594f26aec0731.e88ce703afb8` | 20 | 1 |
| `#5e.e6809d49518411.13afb7e90ff95.a36b8f9b13164` | 18 | 1 |
| `#5b.bc3c9eecbfb0.ffaf102363b2584.c509bf9c62a1c` | 15 | 2 |
| `#56.ce560418937413.30ded288ce74.13d9a95421c04` | 15 | 1 |
| `#31.302de00d1b7251.93b645a1cac24.07f62b6ae7d6` | 15 | 1 |

### Borders
| Border colour | Elements | Pages |
|---|---:|---|
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.8` | 473 | 15 |
| `#0.e7ade225fa6590.16e737b21df4de0.0681d3aa369fcf4 @0.5` | 441 | 2 |
| `#5b.bc3c9eecbfb0.ffaf102363b2584.c509bf9c62a1c` | 403 | 13 |
| `#0.de76a7264a16a80.01a8a174596e3060.05609dcf893faf4 @0.8` | 245 | 16 |
| `#0.edd2d01c0ca60.00d5ce7e27ce2540.0337669e9a8a5a6 @0.7` | 124 | 3 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.3` | 111 | 4 |
| `#60.49374bc6a7f0.da393ee5eedcc2.77eda6612839` | 110 | 3 |
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.7` | 103 | 16 |
| `#0.edd2d01c0ca60.00d5ce7e27ce2540.0337669e9a8a5a6 @0.8` | 97 | 6 |
| `#0.c3d6c72192210.2b61bb05faebc40.0d1517bf396653 @0.3` | 85 | 2 |
| `#54.c3e425aee631.f2027525460aa7.eef156191149` | 62 | 3 |
| `#0.b22ccb3a2595b80.297fd82773e250.0d1a9fbe76c8b4 @0.3` | 50 | 4 |
| `#0.edd2d01c0ca60.00d5ce7e27ce2540.0337669e9a8a5a6 @0.9` | 41 | 3 |
| `#0.b22ccb3a2595b80.297fd82773e250.0d1a9fbe76c8b4 @0.5` | 40 | 1 |
| `#f.34395810624e000.000063fffb13af4ed4` | 36 | 12 |
| `#0.de76a7264a16a80.01a8a174596e3060.05609dcf893faf4 @0.7` | 34 | 1 |
| `#0.c3d6c72192210.2b61bb05faebc40.0d1517bf396653 @0.5` | 31 | 3 |
| `#5a.3985f06f69441f.09fbe76c8b449.7888f861a60d8` | 30 | 1 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.75` | 29 | 10 |
| `#0.edd2d01c0ca60.00d5ce7e27ce2540.0337669e9a8a5a6 @0.6` | 24 | 5 |
| `#0.c3d6c72192210.2b61bb05faebc40.0d1517bf396653 @0.4` | 20 | 3 |
| `#0.b22ccb3a2595b80.297fd82773e250.0d1a9fbe76c8b4 @0.2` | 10 | 1 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.25` | 10 | 2 |
| `#0.cf5c4a83b1d0c80.1d54eb13dfb0d50.060c140a78ffc6 @0.8` | 7 | 2 |
| `#0.ffff9b56323bc0.0002fc7fc8004216c0.00015100262a310d @0.6` | 5 | 1 |
| `#0.ffff9b56323bc0.0002fc8035f3c17e20.00015100262a310d @0.2` | 5 | 1 |

## Contrast (WCAG 2.1 AA)

**84 failing pairs across 315 distinct text/background combinations.**

| Ratio | Required | Text | On background | Size/Weight | Where | Sample |
|---:|---:|---|---|---|---|---|
| **1.01:1** | 4.5:1 | `#ffffff` | `#fdfefd` | 16px/400 | home 390x844 | For Sale |
| **1.01:1** | 4.5:1 | `#fee685` | `#e2e8f0` | 14px/500 | search 390x844 | 12 Months Lease · Fully Furnished |
| **1.01:1** | 4.5:1 | `#ffffff` | `#fefefe` | 16px/400 | search 1440x900 | To Rent |
| **1.02:1** | 4.5:1 | `#ffffff` | `#fcfdfd` | 16px/400 | search 390x844 | To Rent |
| **1.06:1** | 4.5:1 | `#e2e8f0` | `#eaefee` | 14px/400 | property 390x844 | Keurboom Road, Claremont Upper, Cape Town, W |
| **1.06:1** | 4.5:1 | `#e2e8f0` | `#eaefee` | 16px/400 | property 1440x900 | Keurboom Road, Claremont Upper, Cape Town, W |
| **1.08:1** | 3:1 | `#ffffff` | `#f4f7f7` | 20px/800 | for-sale 390x844 | R 2,950,000 |
| **1.16:1** | 3:1 | `#ffffff` | `#eaefee` | 24px/300 | property 390x844 | Claremont Upper Courtyard Townhouse |
| **1.16:1** | 3:1 | `#ffffff` | `#eaefee` | 60px/300 | property 1440x900 | Claremont Upper Courtyard Townhouse |
| **1.16:1** | 3:1 | `#ffffff` | `#eaefee` | 36px/800 | property 1440x900 | R 2,950,000 |
| **1.23:1** | 4.5:1 | `#a4f4cf` | `#99dbcd` | 14px/700 | home 390x844 | Claremont |
| **1.23:1** | 3:1 | `#ffffff` | `#e2e8f0` | 20px/800 | home 390x844 | R 2,950,000 |
| **1.28:1** | 4.5:1 | `#cad5e2` | `#eaefee` | 14px/400 | property 390x844 | Asking Price |
| **1.38:1** | 4.5:1 | `#cad5e2` | `#f4f7f7` | 14px/600 | for-sale 390x844 | 145 m² |
| **1.67:1** | 3:1 | `#87c7c0` | `#ecf0f0` | 30px/300 | home 390x844 | Open the Door to Your Next Chapter |
| **1.67:1** | 3:1 | `#87c7c0` | `#ecf0f0` | 60px/300 | home 1440x900 | Open the Door to Your Next Chapter |
| **1.98:1** | 4.5:1 | `#ffffff` | `#25d366` | 16px/700 | property 1440x900 | WhatsApp |
| **2.03:1** | 4.5:1 | `#ffffff` | `#fca218` | 12px/700 | for-sale 390x844 | On Show Sunday |
| **2.38:1** | 4.5:1 | `#90a1b9` | `#f1f4f4` | 14px/700 | search 1440x900 | Quick Filters: |
| **2.51:1** | 4.5:1 | `#90a1b9` | `#f8faf9` | 14px/400 | home 1440x900 | Developer: |
| **2.53:1** | 4.5:1 | `#90a1b9` | `#fafbfb` | 14px/400 | search 1440x900 | (approx. R 245 /m²) |
| **2.57:1** | 4.5:1 | `#90a1b9` | `#fcfcfc` | 14px/400 | home 1440x900 | (approx. R 20,345 /m²) |
| **2.57:1** | 4.5:1 | `#90a1b9` | `#fcfdfc` | 14px/700 | insights 1440x900 | 5-Year Capital Appreciation |
| **2.79:1** | 4.5:1 | `#ffffff` | `#989b9b` | 14px/700 | property 390x844 | 02 |
| **3.21:1** | 4.5:1 | `#cad5e2` | `#6d7478` | 14px/700 | home 390x844 | Keurboom Road, Claremont Upper, Cape Town, W |
| **3.25:1** | 4.5:1 | `#ffffff` | `#8c8f8f` | 14px/700 | property 390x844 | Southern Suburbs School Belt |
| **3.45:1** | 4.5:1 | `#ffffff` | `#838b90` | 14px/600 | home 390x844 | Recently viewed by you |
| **3.69:1** | 4.5:1 | `#62748e` | `#dce4e3` | 16px/700 | for-sale 390x844 | Browse by Province |
| **3.87:1** | 4.5:1 | `#e2e8f0` | `#6d7478` | 14px/400 | home 390x844 | Claremont Upper Courtyard Townhouse |
| **3.87:1** | 4.5:1 | `#e2e8f0` | `#6d7478` | 16px/400 | home 1440x900 | Claremont Upper Courtyard Townhouse |

## Typography

| Role | Viewport | Family | Size | Weight | Line-height | Tracking | Colour | Seen on |
|---|---|---|---:|---:|---|---|---|---|
| body | 1024x768 | Geist | 14px | 400 | 20px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | home, property |
| body | 1024x768 | Geist | 16px | 400 | 26px | normal | #23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f | for-sale |
| body | 1024x768 | Geist | 14px | 700 | 20px | 2.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | map-search |
| body | 1440x900 | Geist | 14px | 400 | 20px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | home, property, collections, compare, saved |
| body | 1440x900 | Geist | 16px | 400 | 26px | normal | #23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f | for-sale, to-rent |
| body | 1440x900 | Geist | 14px | 700 | 20px | 2.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | map-search, agents, insights, calculators |
| body | 1440x900 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | ai-search |
| body | 360x800 | Geist | 16px | 400 | 26px | normal | #23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f | for-sale |
| body | 360x800 | Geist | 20px | 800 | 28px | normal | #ffffff | search |
| body | 360x865 | Geist | 14px | 400 | 20px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | home |
| body | 390x844 | Geist | 14px | 400 | 20px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | home, saved, seller-portal, new-listing, agent-dashboard |
| body | 390x844 | Geist | 16px | 400 | 26px | normal | #23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f | for-sale, to-rent |
| body | 390x844 | Geist | 20px | 800 | 28px | normal | #ffffff | search |
| body | 390x844 | Geist | 14px | 700 | 20px | 2.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | calculators |
| body | 390x860 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | ai-search |
| body | 768x1024 | Geist | 14px | 400 | 20px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | home, property |
| body | 768x1024 | Geist | 16px | 400 | 26px | normal | #23.8ff2e48e8a721.bff1950331e3af.6e7d566cf41f | for-sale |
| body | 768x1024 | Geist | 14px | 700 | 20px | 2.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | map-search |
| button | 1024x768 | Geist | 14px | 600 | 20px | normal | #1a.f4f765fd8adb1.785c67dfe32af.b305532617c18 | home, for-sale |
| button | 1024x768 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | search, map-search, property |
| button | 1440x900 | Geist | 14px | 600 | 20px | normal | #1a.f4f765fd8adb1.785c67dfe32af.b305532617c18 | home, for-sale, to-rent |
| button | 1440x900 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | search, map-search, ai-search, property, agents |
| button | 360x800 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | search, map-search, property |
| button | 390x844 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | search, map-search, property, agents, collections |
| button | 390x860 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | ai-search |
| button | 768x1024 | Geist | 16px | 400 | 24px | normal | #10.21cac083126f0.516abde3fbbd7ce.aacd9e83e4258 | search, map-search, property |
| h1 | 1024x768 | Geist | 60px | 300 | 75px | -3px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, property |
| h1 | 1024x768 | Geist | 36px | 800 | 40px | -0.9px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | for-sale |
| h1 | 1024x768 | Geist | 24px | 700 | 32px | -0.6px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h1 | 1024x768 | Geist | 16px | 600 | 24px | 0.4px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search |
| h1 | 1440x900 | Geist | 60px | 300 | 75px | -3px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, property |
| h1 | 1440x900 | Geist | 36px | 800 | 40px | -0.9px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | for-sale, to-rent |
| h1 | 1440x900 | Geist | 24px | 700 | 32px | -0.6px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search, seller-portal, new-listing, agent-dashboard |
| h1 | 1440x900 | Geist | 16px | 600 | 24px | 0.4px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search, ai-search, agents, collections, insights |
| h1 | 1440x900 | Geist | 36px | 300 | 40px | -0.9px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | saved |
| h1 | 360x800 | Geist | 24px | 800 | 32px | -0.6px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | for-sale |
| h1 | 360x800 | Geist | 18px | 700 | 28px | -0.45px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h1 | 360x800 | Geist | 14px | 600 | 20px | 0.35px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search |
| h1 | 360x800 | Geist | 24px | 300 | 32px | -0.96px | #ffffff | property |
| h1 | 360x865 | Geist | 30px | 300 | 37.5px | -1.5px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h1 | 390x844 | Geist | 30px | 300 | 37.5px | -1.5px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, saved |
| h1 | 390x844 | Geist | 24px | 800 | 32px | -0.6px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | for-sale, to-rent |
| h1 | 390x844 | Geist | 18px | 700 | 28px | -0.45px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h1 | 390x844 | Geist | 14px | 600 | 20px | 0.35px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search, agents, collections, insights, calculators |
| h1 | 390x844 | Geist | 24px | 300 | 32px | -0.96px | #ffffff | property |
| h1 | 390x844 | Geist | 24px | 700 | 32px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | seller-portal, new-listing, agent-dashboard |
| h1 | 390x860 | Geist | 14px | 600 | 20px | 0.35px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | ai-search |
| h1 | 768x1024 | Geist | 48px | 300 | 60px | -2.4px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, property |
| h1 | 768x1024 | Geist | 36px | 800 | 40px | -0.9px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | for-sale |
| h1 | 768x1024 | Geist | 24px | 700 | 32px | -0.6px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h1 | 768x1024 | Geist | 16px | 600 | 24px | 0.4px | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search |
| h2 | 1024x768 | Geist | 30px | 700 | 36px | -0.75px | #ffffff | home |
| h2 | 1024x768 | Geist | 16px | 700 | 24px | 0.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | for-sale |
| h2 | 1024x768 | Geist | 20px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h2 | 1440x900 | Geist | 30px | 700 | 36px | -0.75px | #ffffff | home |
| h2 | 1440x900 | Geist | 16px | 700 | 24px | 0.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | for-sale, to-rent |
| h2 | 1440x900 | Geist | 20px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h2 | 1440x900 | Geist | 24px | 300 | 32px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | ai-search |
| h2 | 1440x900 | Geist | 30px | 300 | 36px | -0.75px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | insights |
| h2 | 1440x900 | Geist | 18px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | calculators |
| h2 | 360x800 | Geist | 16px | 700 | 24px | 0.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | for-sale |
| h2 | 360x800 | Geist | 18px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h2 | 360x865 | Geist | 24px | 700 | 32px | -0.6px | #ffffff | home |
| h2 | 390x844 | Geist | 24px | 700 | 32px | -0.6px | #ffffff | home |
| h2 | 390x844 | Geist | 16px | 700 | 24px | 0.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | for-sale, to-rent, calculators |
| h2 | 390x844 | Geist | 18px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h2 | 390x844 | Geist | 30px | 300 | 36px | -0.75px | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | insights |
| h2 | 390x860 | Geist | 20px | 300 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | ai-search |
| h2 | 768x1024 | Geist | 30px | 700 | 36px | -0.75px | #ffffff | home |
| h2 | 768x1024 | Geist | 16px | 700 | 24px | 0.8px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | for-sale |
| h2 | 768x1024 | Geist | 20px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | search |
| h3 | 1024x768 | Geist | 24px | 600 | 32px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h3 | 1024x768 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale |
| h3 | 1024x768 | Geist | 18px | 700 | 28px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search |
| h3 | 1024x768 | Geist | 14px | 700 | 20px | 0.7px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | property |
| h3 | 1440x900 | Geist | 24px | 600 | 32px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h3 | 1440x900 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale, to-rent, agents, compare, saved |
| h3 | 1440x900 | Geist | 18px | 700 | 28px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | map-search, insights |
| h3 | 1440x900 | Geist | 14px | 700 | 20px | 0.7px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | property |
| h3 | 360x800 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale |
| h3 | 360x800 | Geist | 14px | 700 | 20px | 0.7px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | property |
| h3 | 360x865 | Geist | 24px | 600 | 32px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h3 | 390x844 | Geist | 24px | 600 | 32px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h3 | 390x844 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale, to-rent, agents, compare, saved |
| h3 | 390x844 | Geist | 14px | 700 | 20px | 0.7px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | property |
| h3 | 390x844 | Geist | 18px | 700 | 28px | normal | #1.c50dae3e6c4c61.53d273d5bab229.49de69ad42c4 | insights |
| h3 | 768x1024 | Geist | 24px | 600 | 32px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| h3 | 768x1024 | Geist | 16px | 700 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale |
| h3 | 768x1024 | Geist | 14px | 700 | 20px | 0.7px | #30.166cf41f212e2.093404ea4a8c210.94d6a161e4f7 | property |
| link | 1024x768 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, for-sale, search, map-search, property |
| link | 1440x900 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, for-sale, to-rent, search, map-search |
| link | 1440x900 | Geist | 14px | 700 | 20px | normal | #ffffff | seller-portal, new-listing, agent-dashboard |
| link | 360x800 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | for-sale, search, map-search, property |
| link | 360x865 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home |
| link | 390x844 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, for-sale, to-rent, search, map-search |
| link | 390x844 | Geist | 14px | 700 | 20px | normal | #ffffff | seller-portal, new-listing, agent-dashboard |
| link | 390x860 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | ai-search |
| link | 768x1024 | Geist | 16px | 400 | 24px | normal | #7.c9672324c83681.d2cd9e83e425bf.0dbf487fcb92 | home, for-sale, search, map-search, property |

## Radii

| border-radius | Elements |
|---|---:|
| `3.35544e+07px` | 896 |
| `9999px` | 889 |
| `6px` | 447 |
| `16px` | 404 |
| `12px` | 319 |
| `26px` | 214 |
| `32px` | 105 |
| `24px` | 77 |
| `20px` | 65 |
| `10px` | 32 |
| `8px` | 30 |
| `4px` | 5 |
| `8px 0px 0px` | 5 |

## Shadows

| box-shadow | Elements |
|---|---:|
| `rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0` | 1127 |

## Motion

| duration / easing or animation | Elements |
|---|---:|
| `0.15s / cubic-bezier(0.4, 0, 0.2, 1)` | 2495 |
| `0.3s / cubic-bezier(0.4, 0, 0.2, 1)` | 160 |
| `0.5s / cubic-bezier(0.4, 0, 0.2, 1)` | 120 |
| `0.55s / cubic-bezier(0.4, 0, 0.2, 1)` | 104 |
| `0.2s / cubic-bezier(0.4, 0, 0.2, 1)` | 73 |
| `0.3s / cubic-bezier(0, 0, 0.2, 1)` | 34 |
| `anim pulse 2s` | 18 |
| `1.2s / cubic-bezier(0.4, 0, 0.2, 1)` | 10 |
| `0.2s / cubic-bezier(0, 0, 0.2, 1)` | 8 |
| `anim aurora-drift-a 23s` | 5 |
| `anim aurora-drift-b 31s` | 5 |
| `anim aurora-drift-c 39s` | 5 |
| `anim aurora-drift-d 27s` | 5 |
| `anim aurora-sheen 26s` | 5 |

## Screenshot index

Screenshots are under `docs/ux-audit/screenshots/dynasty/<page>/<viewport>-{atf,full}.jpg`.

- **home** — 360x865, 390x844, 768x1024, 1024x768, 1440x900
- **for-sale** — 360x800, 390x844, 768x1024, 1024x768, 1440x900
- **to-rent** — 390x844, 1440x900
- **search** — 360x800, 390x844, 768x1024, 1024x768, 1440x900
- **map-search** — 360x800, 390x844, 768x1024, 1024x768, 1440x900
- **ai-search** — 390x860, 1440x900
- **property** — 360x800, 390x844, 768x1024, 1024x768, 1440x900
- **agents** — 390x844, 1440x900
- **collections** — 390x844, 1440x900
- **insights** — 390x844, 1440x900
- **calculators** — 390x844, 1440x900
- **compare** — 390x844, 1440x900
- **saved** — 390x844, 1440x900
- **seller-portal** — 390x844, 1440x900
- **new-listing** — 390x844, 1440x900
- **agent-dashboard** — 390x844, 1440x900
