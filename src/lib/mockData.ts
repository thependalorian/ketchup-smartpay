// Namibian regions for realistic data
export const NAMIBIAN_REGIONS = [
  'Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto',
  'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa',
  'Omaheke', 'Hardap', 'Karas'
] as const;

export type Region = typeof NAMIBIAN_REGIONS[number];

export interface Beneficiary {
  id: string;
  name: string;
  phone: string;
  region: Region;
  grantType: 'social_grant' | 'subsidy' | 'pension' | 'disability';
  status: 'active' | 'suspended' | 'pending';
  enrolledAt: string;
  lastPayment: string;
}

export interface Voucher {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  amount: number;
  grantType: string;
  status: 'issued' | 'delivered' | 'redeemed' | 'expired' | 'cancelled';
  issuedAt: string;
  expiryDate: string;
  redeemedAt?: string;
  redemptionMethod?: 'wallet' | 'cash_out' | 'merchant_payment';
  region: Region;
}

export interface Agent {
  id: string;
  name: string;
  type: 'small' | 'medium' | 'large';
  region: Region;
  status: 'active' | 'inactive' | 'low_liquidity';
  liquidity: number;
  transactionsToday: number;
  volumeToday: number;
  successRate: number;
}

export interface DashboardMetrics {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalVouchersIssued: number;
  vouchersRedeemed: number;
  vouchersExpired: number;
  totalDisbursement: number;
  monthlyDisbursement: number;
  activeAgents: number;
  totalAgents: number;
  networkHealthScore: number;
}

// Generate realistic Namibian names
const firstNames = [
  'Johannes', 'Maria', 'Petrus', 'Anna', 'Paulus', 'Helena', 'Thomas', 'Elizabeth',
  'Michael', 'Sarah', 'David', 'Martha', 'Simon', 'Ndapewa', 'Fillemon', 'Hilma',
  'Festus', 'Frieda', 'Gabriel', 'Victoria', 'Joseph', 'Olivia', 'Immanuel', 'Grace'
];

const lastNames = [
  'Shikongo', 'Hamutenya', 'Nghipondoka', 'Iipinge', 'Shilongo', 'Angula', 'Shipanga',
  'Tjirimuje', 'Haimbodi', 'Nangolo', 'Kamati', 'Shapumba', 'Shiindi', 'Uutoni',
  'Nghifikepunye', 'Kapewasha', 'Kaunapawa', 'Shikesho', 'Ndeitunga', 'Hashikutuva'
];

const agentNames = {
  small: [
    'Katutura Corner Shop', 'Oshakati Mini Mart', 'Rundu Quick Stop', 'Windhoek Spaza',
    'Ondangwa Daily Needs', 'Walvis Bay Convenience', 'Swakopmund Store', 'Tsumeb Mini Market'
  ],
  medium: [
    'Coastal Supermarket', 'Northern Traders', 'Central Grocers', 'Kavango Retail',
    'Hardap Provisions', 'Kunene Supplies', 'Erongo Markets', 'Omaheke Trading'
  ],
  large: [
    'Shoprite Windhoek Central', 'Pick n Pay Oshakati', 'Woermann Brock Walvis Bay',
    'Checkers Swakopmund', 'OK Foods Ondangwa', 'Spar Rundu', 'Model Pick n Pay Grootfontein'
  ]
};

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNamibianPhone(): string {
  const prefixes = ['81', '85', '811', '812', '814'];
  return `+264${randomItem(prefixes)}${randomBetween(1000000, 9999999)}`;
}

function generateBeneficiaryId(): string {
  return `NA${randomBetween(100000000, 999999999)}`;
}

function generateDate(daysAgo: number, daysRange: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo - randomBetween(0, daysRange));
  return date.toISOString();
}

export function generateBeneficiaries(count: number): Beneficiary[] {
  return Array.from({ length: count }, () => {
    const grantTypes: Beneficiary['grantType'][] = ['social_grant', 'subsidy', 'pension', 'disability'];
    const statuses: Beneficiary['status'][] = ['active', 'active', 'active', 'active', 'suspended', 'pending'];
    
    return {
      id: generateBeneficiaryId(),
      name: `${randomItem(firstNames)} ${randomItem(lastNames)}`,
      phone: generateNamibianPhone(),
      region: randomItem(NAMIBIAN_REGIONS),
      grantType: randomItem(grantTypes),
      status: randomItem(statuses),
      enrolledAt: generateDate(365, 730),
      lastPayment: generateDate(0, 30),
    };
  });
}

export function generateVouchers(beneficiaries: Beneficiary[], count: number): Voucher[] {
  const statuses: Voucher['status'][] = ['issued', 'delivered', 'redeemed', 'redeemed', 'redeemed', 'expired', 'cancelled'];
  const amounts = [500, 1000, 2000, 3000, 6000];
  
  return Array.from({ length: count }, () => {
    const beneficiary = randomItem(beneficiaries);
    const status = randomItem(statuses);
    const issuedAt = generateDate(0, 60);
    const expiryDate = new Date(issuedAt);
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    return {
      id: `VCH-${randomBetween(100000, 999999)}`,
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.name,
      amount: randomItem(amounts),
      grantType: beneficiary.grantType,
      status,
      issuedAt,
      expiryDate: expiryDate.toISOString(),
      redeemedAt: status === 'redeemed' ? generateDate(0, 15) : undefined,
      redemptionMethod: status === 'redeemed' ? randomItem(['wallet', 'cash_out', 'merchant_payment'] as const) : undefined,
      region: beneficiary.region,
    };
  });
}

export function generateAgents(count: number): Agent[] {
  const types: Agent['type'][] = ['small', 'small', 'small', 'medium', 'medium', 'large'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = randomItem(types);
    const isActive = Math.random() > 0.1;
    const hasLowLiquidity = isActive && Math.random() > 0.85;
    
    const liquidityRanges = {
      small: [5000, 30000],
      medium: [20000, 100000],
      large: [50000, 250000],
    };
    
    const [minLiq, maxLiq] = liquidityRanges[type];
    
    return {
      id: `AGENT-${String(i + 1).padStart(4, '0')}`,
      name: randomItem(agentNames[type]),
      type,
      region: randomItem(NAMIBIAN_REGIONS),
      status: !isActive ? 'inactive' : hasLowLiquidity ? 'low_liquidity' : 'active',
      liquidity: randomBetween(hasLowLiquidity ? 1000 : minLiq, maxLiq),
      transactionsToday: randomBetween(type === 'large' ? 20 : type === 'medium' ? 10 : 3, type === 'large' ? 100 : type === 'medium' ? 50 : 20),
      volumeToday: randomBetween(10000, type === 'large' ? 200000 : type === 'medium' ? 100000 : 30000),
      successRate: randomBetween(9200, 10000) / 100,
    };
  });
}

export function generateDashboardMetrics(): DashboardMetrics {
  const totalBeneficiaries = 104582;
  const activeBeneficiaries = 98234;
  const totalVouchersIssued = 1247893;
  const vouchersRedeemed = 1089234;
  const vouchersExpired = 45678;
  
  return {
    totalBeneficiaries,
    activeBeneficiaries,
    totalVouchersIssued,
    vouchersRedeemed,
    vouchersExpired,
    totalDisbursement: 7_234_567_890,
    monthlyDisbursement: 602_847_500,
    activeAgents: 452,
    totalAgents: 487,
    networkHealthScore: 94.7,
  };
}

export function generateRegionalStats(): { region: Region; beneficiaries: number; vouchers: number; redeemed: number }[] {
  return NAMIBIAN_REGIONS.map(region => ({
    region,
    beneficiaries: randomBetween(3000, 15000),
    vouchers: randomBetween(50000, 150000),
    redeemed: randomBetween(40000, 140000),
  }));
}

export function generateMonthlyTrend(): { month: string; issued: number; redeemed: number; expired: number }[] {
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  return months.map(month => ({
    month,
    issued: randomBetween(95000, 110000),
    redeemed: randomBetween(85000, 100000),
    expired: randomBetween(3000, 8000),
  }));
}

export function generateRedemptionChannels(): { channel: string; value: number; color: string }[] {
  return [
    { channel: 'Agent Cash-Out', value: 42, color: 'hsl(32, 95%, 44%)' },
    { channel: 'Wallet Credit', value: 31, color: 'hsl(222, 47%, 18%)' },
    { channel: 'Merchant Payment', value: 18, color: 'hsl(16, 85%, 55%)' },
    { channel: 'NamPost', value: 9, color: 'hsl(152, 69%, 40%)' },
  ];
}
