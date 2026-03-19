export type CouponStatus = 'Active' | 'Inactive' | 'Expired';
export type CampaignStatus = 'Active' | 'Inactive' | 'Scheduled' | 'Ended';

export interface CouponRecord {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  usage: { used: number; total: number };
  expires: string;
  status: CouponStatus;
}

export interface CampaignRecord {
  id: string;
  name: string;
  description: string;
  badge: string;
  discountText: string;
  startsAt: string;
  endsAt: string;
  status: CampaignStatus;
}

let coupons: CouponRecord[] = [
  {
    id: '1',
    code: 'SAVE10',
    discount: 10,
    minOrder: 500,
    usage: { used: 0, total: 100 },
    expires: '12/31/2026',
    status: 'Active',
  },
  {
    id: '2',
    code: 'WELCOME20',
    discount: 20,
    minOrder: 1000,
    usage: { used: 5, total: 50 },
    expires: '11/30/2026',
    status: 'Inactive',
  },
];

let campaigns: CampaignRecord[] = [
  {
    id: '1',
    name: 'Eid Mega Deals',
    description: 'Festival picks with big markdowns across categories.',
    badge: 'Seasonal',
    discountText: 'Up to 18% off',
    startsAt: '03/01/2026',
    endsAt: '04/15/2026',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Electronics Sprint',
    description: 'Fast-moving gadgets with limited stock discounts.',
    badge: 'Electronics',
    discountText: 'Extra 12% off',
    startsAt: '03/10/2026',
    endsAt: '05/01/2026',
    status: 'Inactive',
  },
];

export function listCoupons() {
  return coupons;
}

export function createCoupon(input: Omit<CouponRecord, 'id' | 'usage'> & { totalUsage: number }) {
  const coupon: CouponRecord = {
    id: Date.now().toString(),
    code: input.code,
    discount: input.discount,
    minOrder: input.minOrder,
    usage: { used: 0, total: input.totalUsage },
    expires: input.expires,
    status: input.status,
  };
  coupons = [coupon, ...coupons];
  return coupon;
}

export function updateCoupon(id: string, input: Partial<CouponRecord> & { totalUsage?: number }) {
  let updated: CouponRecord | null = null;
  coupons = coupons.map((coupon) => {
    if (coupon.id !== id) return coupon;
    updated = {
      ...coupon,
      ...input,
      usage: {
        used: coupon.usage.used,
        total: input.totalUsage ?? input.usage?.total ?? coupon.usage.total,
      },
    };
    return updated;
  });
  return updated;
}

export function deleteCoupon(id: string) {
  const before = coupons.length;
  coupons = coupons.filter((coupon) => coupon.id !== id);
  return coupons.length < before;
}

export function listCampaigns() {
  return campaigns;
}

export function createCampaign(input: Omit<CampaignRecord, 'id'>) {
  const campaign: CampaignRecord = {
    id: Date.now().toString(),
    ...input,
  };
  campaigns = [campaign, ...campaigns];
  return campaign;
}

export function updateCampaign(id: string, input: Partial<CampaignRecord>) {
  let updated: CampaignRecord | null = null;
  campaigns = campaigns.map((campaign) => {
    if (campaign.id !== id) return campaign;
    updated = { ...campaign, ...input };
    return updated;
  });
  return updated;
}

export function deleteCampaign(id: string) {
  const before = campaigns.length;
  campaigns = campaigns.filter((campaign) => campaign.id !== id);
  return campaigns.length < before;
}

export function getActiveCoupon() {
  return coupons.find((coupon) => coupon.status === 'Active') || null;
}

export function getActiveCampaigns() {
  return campaigns.filter((campaign) => campaign.status === 'Active');
}
