# 02 — Competitor benchmark

Captured the same way as the baseline, at 390x844 and 1440x900 only, with a
handful of page loads per site. Sites that blocked automated loads are marked.

Records: **22**.

## Performance and weight

| Page | Viewport | Requests | Weight | Image bytes | LCP | CLS | Tap<44px | Controls | H-overflow |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| property24/home | 390x2684 | 69 | 2.49 MB | 0.47 MB | 4272 ms | 0.000 | 107 | 140 | 850 |
| property24/home | 1440x900 | 132 | 4.19 MB | 0.39 MB | 2296 ms | 0.006 | 108 | 140 | 0 |
| property24/search | 390x2684 | 185 | 4.67 MB | 0.58 MB | 532 ms | 0.007 | 84 | 190 | 850 |
| property24/search | 1440x900 | 185 | 4.62 MB | 0.64 MB | 700 ms | 0.024 | 84 | 191 | 0 |
| property24/sell | 390x2716 | 104 | 2.23 MB | 0.08 MB | 600 ms | 0.000 | 57 | 97 | 865 |
| property24/sell | 1440x900 | 100 | 2.51 MB | 0.11 MB | 1000 ms | 0.036 | 57 | 97 | 15 |
| property24/valuation | 1440x900 | 92 | 2.62 MB | 0.15 MB | 536 ms | 0.000 | 58 | 73 | 0 |
| privateproperty/home | 390x844 | 61 | 1.90 MB | 0.04 MB | 2928 ms | 0.000 | 84 | 101 | 0 |
| privateproperty/home | 1440x900 | 59 | 2.22 MB | 0.28 MB | 880 ms | 0.006 | 92 | 110 | 0 |
| privateproperty/search | 390x844 | 88 | 3.85 MB | 0.49 MB | 2104 ms | 0.000 | 111 | 147 | 0 |
| privateproperty/search | 1440x900 | 113 | 4.68 MB | 0.99 MB | 988 ms | 0.016 | 143 | 179 | 0 |
| privateproperty/list-agent | 1440x900 | 57 | 1.93 MB | 0.11 MB | 764 ms | 0.122 | 56 | 58 | 0 |
| zillow/home | 390x844 | 16 | 0.52 MB | 0.00 MB | — | — | — | — | — |
| zillow/home | 1440x900 | 17 | 0.51 MB | 0.00 MB | — | — | — | — | — |
| zillow/search | 390x844 | 17 | 0.49 MB | 0.00 MB | — | — | — | — | — |
| zillow/search | 1440x900 | 17 | 0.50 MB | 0.00 MB | — | — | — | — | — |
| zillow/sell | 1440x900 | 18 | 0.55 MB | 0.00 MB | — | — | — | — | — |
| rightmove/home | 390x844 | 91 | 3.42 MB | 0.02 MB | 2564 ms | 0.000 | 103 | 122 | 0 |
| rightmove/home | 1440x900 | 105 | 3.59 MB | 0.08 MB | 772 ms | 0.000 | 108 | 128 | 0 |
| rightmove/search | 390x844 | 138 | 11.99 MB | 0.49 MB | 2184 ms | 0.054 | 133 | 362 | 0 |
| rightmove/search | 1440x900 | 304 | 13.77 MB | 1.51 MB | 2352 ms | 0.308 | 178 | 426 | 0 |
| rightmove/valuation | 1440x900 | 77 | 3.01 MB | 0.00 MB | 2124 ms | 0.393 | 104 | 122 | 0 |

## Metadata

| Site | Page | `<title>` | og:image | Headings | Nav/controls | Tap<44px |
|---|---|---|---|---:|---:|---:|
| property24 | home | Property for Sale: Houses for sale: Property24 | yes | 12 | 140 | 107 |
| property24 | home | Property for Sale: Houses for sale: Property24 | yes | 12 | 140 | 108 |
| property24 | search | Property and houses for sale in Cape Town : Cape Town  | yes | 7 | 190 | 84 |
| property24 | search | Property and houses for sale in Cape Town : Cape Town  | yes | 7 | 191 | 84 |
| property24 | sell | Private Ad : Sell Your Property : Property24.com | yes | 11 | 97 | 57 |
| property24 | sell | Private Ad : Sell Your Property : Property24.com | yes | 11 | 97 | 57 |
| property24 | valuation | Looking to sell your property? Get a Free Automated Pr | yes | 5 | 73 | 58 |
| privateproperty | home | Property for sale in South Africa \| Private Property | yes | 26 | 101 | 84 |
| privateproperty | home | Property for sale in South Africa \| Private Property | yes | 22 | 110 | 92 |
| privateproperty | search | Property for sale in Point Waterfront \| Private Proper | yes | 14 | 147 | 111 |
| privateproperty | search | Property for sale in Point Waterfront \| Private Proper | yes | 16 | 179 | 143 |
| privateproperty | list-agent | List As An Estate Agent \| Market Your Business | none | 9 | 58 | 56 |
| zillow | home |  | none | — | — | — |
| zillow | home |  | none | — | — | — |
| zillow | search |  | none | — | — | — |
| zillow | search |  | none | — | — | — |
| zillow | sell |  | none | — | — | — |
| rightmove | home | Rightmove - UK's number one property website for prope | none | 18 | 122 | 103 |
| rightmove | home | Rightmove - UK's number one property website for prope | none | 18 | 128 | 108 |
| rightmove | search | Properties For Sale in London \| Rightmove | yes | 12 | 362 | 133 |
| rightmove | search | Properties For Sale in London \| Rightmove | yes | 13 | 426 | 178 |
| rightmove | valuation | Agent Valuation \| Online & In-Home Valuation \| Rightmo | yes | 20 | 122 | 104 |

## Colour inventory (all competitors pooled)

### Backgrounds
| Background colour | Elements | Pages |
|---|---:|---|
| `#ffffff` | 572 | 5 |
| `#000433` | 85 | 3 |
| `#e9edf0` | 71 | 1 |
| `#dedee2` | 51 | 1 |
| `#f2f3f4` | 44 | 3 |
| `#0d63c9` | 20 | 4 |
| `#007054` | 19 | 1 |
| `#e71442` | 17 | 3 |
| `#1a72db` | 16 | 2 |
| `#0b63c9` | 13 | 1 |
| `#a4d8f3 @0.15` | 13 | 2 |
| `#0f0c36 @0.9` | 12 | 1 |
| `#0c8852` | 10 | 1 |
| `#0f0c36` | 9 | 4 |
| `#4bc3f9` | 8 | 2 |
| `#3cc89e` | 8 | 2 |
| `#000433 @0.04` | 8 | 1 |
| `#007054 @0.1` | 8 | 1 |
| `#5692d9` | 7 | 4 |
| `#a4d8f3 @0.2` | 7 | 2 |
| `#00deb6` | 7 | 2 |
| `#000000` | 6 | 1 |
| `#a9ede1` | 6 | 1 |
| `#041c4c` | 5 | 1 |
| `#0d1d28` | 5 | 3 |
| `#f6f7f9` | 4 | 1 |

### Text
| Text colour | Elements | Pages |
|---|---:|---|
| `#0f0c36` | 2429 | 4 |
| `#4f5064` | 2022 | 3 |
| `#ffffff` | 1898 | 5 |
| `#000433` | 1835 | 3 |
| `#515b6d` | 977 | 4 |
| `#000000` | 977 | 4 |
| `#0d1d28` | 670 | 3 |
| `#0d63c9` | 561 | 4 |
| `#107a84` | 335 | 3 |
| `#637482` | 314 | 2 |
| `#53535f` | 285 | 1 |
| `#0a6d99` | 238 | 3 |
| `#66636e` | 230 | 3 |
| `#e9edf0` | 228 | 3 |
| `#717184` | 175 | 3 |
| `#3cc89e` | 98 | 1 |
| `#9ea5b1` | 89 | 4 |
| `#11828d` | 89 | 2 |
| `#808080` | 60 | 4 |
| `#202e37` | 50 | 2 |
| `#263248` | 49 | 2 |
| `#007054` | 48 | 1 |
| `#97a4af` | 47 | 3 |
| `#6c6d7f` | 39 | 1 |
| `#30414d` | 31 | 3 |
| `#4e516b` | 20 | 1 |

## Typography

| Role | Viewport | Family | Size | Weight | Line-height | Tracking | Colour | Seen on |
|---|---|---|---:|---:|---|---|---|---|
| body | 1440x900 | Inter | 12px | 400 | 17.16px | normal | #97a4af | home, search |
| body | 1440x900 | Inter | 16px | 400 | 24px | normal | #000000 | list-agent, home, search |
| body | 1440x900 | Effra | 16px | 500 | 24px | 0.1px | #ffffff | valuation |
| body | 390x844 | Inter | 14px | 400 | 20.02px | normal | #ffffff | home, search |
| body | 390x844 | Effra | 16px | 400 | 24px | 0.1px | #4e516b | home, search |
| button | 1440x900 | P24-SourceSans | 15px | 400 | 22px | normal | #ffffff | home |
| button | 1440x900 | P24-SourceSans | 15px | 600 | 22px | normal | #333333 | search |
| button | 1440x900 | P24-SourceSans | 17px | 400 | 22.6666px | normal | #ffffff | sell |
| button | 1440x900 | P24-SourceSans | 17px | 600 | 26px | normal | #ffffff | valuation |
| button | 390x2684 | P24-SourceSans | 15px | 400 | 22px | normal | #ffffff | home |
| button | 390x2684 | P24-SourceSans | 15px | 600 | 22px | normal | #333333 | search |
| button | 390x2716 | P24-SourceSans | 17px | 400 | 22.6666px | normal | #ffffff | sell |
| button | 390x844 | Effra | 16px | 400 | normal | normal | #53535f | home |
| button | 390x844 | Effra | 13.3333px | 400 | normal | normal | #4f5064 | search |
| h1 | 1440x900 | P24-SourceSans | 54px | 400 | 62px | normal | #ffffff | home |
| h1 | 1440x900 | P24-SourceSans | 50px | 300 | 62px | normal | #0f0c36 | search |
| h1 | 1440x900 | P24-SourceSans | 40px | 700 | 50px | normal | #ffffff | sell, home |
| h1 | 1440x900 | P24-SourceSans | 50px | 700 | 62.5px | normal | #ffffff | valuation |
| h1 | 1440x900 | Inter | 24px | 700 | 31.2px | normal | #000000 | search |
| h1 | 1440x900 | Inter | 32px | 700 | 41.6px | normal | #000000 | list-agent |
| h1 | 1440x900 | Effra | 45px | 500 | 48px | 0.1px | #ffffff | home |
| h1 | 1440x900 | Effra | 15px | 400 | normal | normal | #4f5064 | search |
| h1 | 1440x900 | Effra | 32px | 500 | 40px | 0.1px | #ffffff | valuation |
| h1 | 390x2684 | P24-SourceSans | 54px | 400 | 62px | normal | #ffffff | home |
| h1 | 390x2684 | P24-SourceSans | 50px | 300 | 62px | normal | #0f0c36 | search |
| h1 | 390x2716 | P24-SourceSans | 40px | 700 | 50px | normal | #ffffff | sell |
| h1 | 390x844 | Inter | 26px | 700 | 33.8px | normal | #ffffff | home |
| h1 | 390x844 | Inter | 20px | 700 | 26px | normal | #000000 | search |
| h1 | 390x844 | Effra | 32px | 500 | 40px | 0.1px | #ffffff | home |
| h1 | 390x844 | Effra | 15px | 400 | normal | normal | #4f5064 | search |
| h2 | 1440x900 | P24-SourceSans | 30px | 400 | normal | normal | #ffffff | home |
| h2 | 1440x900 | P24-SourceSans | 40px | 300 | 50px | normal | #0f0c36 | sell, valuation |
| h2 | 1440x900 | Inter | 32px | 700 | 41.6px | normal | #000000 | home |
| h2 | 1440x900 | Inter | 16px | 700 | 20.8px | normal | #000000 | search |
| h2 | 1440x900 | Inter | 24px | 700 | 31.2px | normal | #000000 | list-agent |
| h2 | 1440x900 | Effra | 32px | 500 | 40px | 0.1px | #ffffff | home, valuation |
| h2 | 390x2684 | P24-SourceSans | 30px | 400 | normal | normal | #ffffff | home |
| h2 | 390x2716 | P24-SourceSans | 40px | 300 | 50px | normal | #0f0c36 | sell |
| h2 | 390x844 | Inter | 24px | 700 | 31.2px | normal | #000000 | home |
| h2 | 390x844 | Effra | 20px | 500 | 28px | 0.1px | #ffffff | home |
| h3 | 1440x900 | P24-SourceSans | 30px | 400 | normal | normal | #0f0c36 | home |
| h3 | 1440x900 | Inter | 18px | 700 | 23.4px | normal | #000000 | home |
| h3 | 1440x900 | Inter | 16px | 700 | 20.8px | normal | #000000 | search |
| h3 | 1440x900 | Inter | 12px | 700 | 15.96px | 0.24px | #ffffff | list-agent |
| h3 | 1440x900 | Effra | 20px | 500 | 28px | 0.1px | #000433 | home, valuation |
| h3 | 390x2684 | P24-SourceSans | 30px | 400 | normal | normal | #0f0c36 | home |
| h3 | 390x844 | Inter | 18px | 700 | 23.4px | normal | #000000 | home |
| h3 | 390x844 | Inter | 16px | 700 | 20.8px | normal | #000000 | search |
| h3 | 390x844 | Effra | 20px | 500 | 28px | 0.1px | #000433 | home |
| link | 1440x900 | Inter | 14px | 400 | 20.02px | normal | #0a6d99 | home, search, list-agent |
| link | 1440x900 | Effra | 16px | 400 | normal | normal | #11828d | home, search |
| link | 1440x900 | Effra | 16px | 500 | 24px | normal | #107a84 | valuation |
| link | 390x844 | Inter | 14px | 400 | 20.02px | normal | #0a6d99 | home, search |
| link | 390x844 | Effra | 16px | 400 | normal | normal | #11828d | home, search |

## Radii

| border-radius | Elements |
|---|---:|
| `8px` | 423 |
| `6px` | 143 |
| `10px` | 97 |
| `16px` | 70 |
| `4px` | 64 |
| `2px` | 59 |
| `1px 1px 0px 0px` | 57 |
| `50px` | 49 |
| `5px` | 34 |
| `20px` | 21 |
| `6px 0px 0px 6px` | 20 |
| `50%` | 18 |
| `12px` | 16 |
| `13px` | 16 |
| `8px 0px 0px` | 13 |
| `0px 12px 12px 0px` | 12 |

## Shadows

| box-shadow | Elements |
|---|---:|
| `rgba(0, 0, 0, 0.3) 0px 3px 3px -3px` | 50 |
| `rgba(0, 0, 0, 0.04) 0px 2px 8px 0px` | 35 |
| `rgba(0, 0, 0, 0.22) 0px 2px 4px 0px` | 25 |
| `rgba(15, 12, 54, 0.05) 0px 2px 4px 0px` | 19 |
| `rgba(15, 12, 54, 0.05) 0px 0px 10px 0px` | 16 |
| `rgba(0, 0, 0, 0.05) 0px 1px 2px 0px` | 15 |
| `rgba(81, 91, 109, 0.1) 0px 20px 30px 0px` | 11 |
| `rgba(0, 0, 0, 0.25) 0px 0px 25px 0px` | 7 |
| `rgba(0, 0, 0, 0.1) 0px 6px 20px 0px` | 7 |
| `rgba(0, 0, 0, 0.05) 0px 1px 1px 0px` | 6 |

## Motion

| duration / easing or animation | Elements |
|---|---:|
| `0.2s / ease` | 176 |
| `anim fa-spin 2s` | 157 |
| `0.16s / ease` | 130 |
| `0.3s / ease-in` | 96 |
| `0.5s / ease` | 86 |
| `0.05s / linear` | 42 |
| `0.3s / ease` | 26 |
| `0.35s / linear` | 18 |
| `0.8s / ease` | 12 |
| `0.25s / ease-in-out` | 10 |

## Screenshot index

- **property24** — home (390x2684), home (1440x900), search (390x2684), search (1440x900), sell (390x2716), sell (1440x900), valuation (1440x900)
- **privateproperty** — home (390x844), home (1440x900), search (390x844), search (1440x900), list-agent (1440x900)
- **zillow** — home (390x844), home (1440x900), search (390x844), search (1440x900), sell (1440x900)
- **rightmove** — home (390x844), home (1440x900), search (390x844), search (1440x900), valuation (1440x900)
