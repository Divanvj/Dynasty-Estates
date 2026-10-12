export type ListingPackageTier = "Standard" | "Showcase" | "Prestige Spotlight";

export type ListingPackage = {
  id: string;
  name: ListingPackageTier;
  priceZAR: number;
  durationDays: number;
  features: string[];
  isPopular?: boolean;
};

export type BillingInvoice = {
  id: string;
  userId: string;
  listingId: string;
  packageName: ListingPackageTier;
  amountZAR: number;
  status: "Paid" | "Pending" | "Failed";
  provider: "PayFast" | "Ozow" | "Manual";
  createdAt: string;
};

export const listingPackages: ListingPackage[] = [
  {
    id: "pkg-standard",
    name: "Standard",
    priceZAR: 1450,
    durationDays: 30,
    features: [
      "Catalogue discovery & search listing",
      "Up to 15 high-res photographs",
      "True Cost bond calculator inclusion",
      "Direct lead inquiry routing",
    ],
  },
  {
    id: "pkg-showcase",
    name: "Showcase",
    priceZAR: 2950,
    durationDays: 45,
    isPopular: true,
    features: [
      "Top-tier search priority placement",
      "Up to 30 photographs + 4K video embed",
      "Featured Obsidian Glass glow badge",
      "Weekly performance & viewer analytics",
      "AI MatchScore recommendation boost",
    ],
  },
  {
    id: "pkg-prestige",
    name: "Prestige Spotlight",
    priceZAR: 5800,
    durationDays: 60,
    features: [
      "Homepage flagship banner rotation",
      "Dedicated social media showcase feature",
      "Unlimited 4K photography & virtual tour",
      "Real-time lead SMS and instant WhatsApp alert",
      "Dedicated account moderation liaison",
    ],
  },
];

export interface IPaymentGateway {
  createPaymentIntent(params: {
    amountZAR: number;
    userEmail: string;
    listingId: string;
    packageName: string;
  }): Promise<{ transactionId: string; redirectUrl: string }>;
  verifyPayment(transactionId: string): Promise<boolean>;
}

export class MockSouthAfricanPaymentGateway implements IPaymentGateway {
  async createPaymentIntent(params: {
    amountZAR: number;
    userEmail: string;
    listingId: string;
    packageName: string;
  }): Promise<{ transactionId: string; redirectUrl: string }> {
    const transactionId = `txn_${Date.now()}`;
    return {
      transactionId,
      redirectUrl: `/payment/complete?txn=${transactionId}&listing=${params.listingId}`,
    };
  }

  async verifyPayment(_transactionId: string): Promise<boolean> {
    void _transactionId;
    return true;
  }
}

export const paymentGateway: IPaymentGateway = new MockSouthAfricanPaymentGateway();
