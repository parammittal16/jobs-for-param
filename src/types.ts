export interface UserProfile {
  name: string;
  email: string;
  linkedin: string;
  portfolio: string;
  github: string;
  currentRole: string;
  currentCompany: string;
  currentCtc: number; // in LPA
  currentCity: string;
}

export interface SearchCriteria {
  domains: string[];
  hybridDays: string; // e.g. "2-3 days WFO"
  locationFlexibility: string; // e.g. "Any (Justify pay if BLR)"
  requiresUiPrincipal: boolean;
  requiresAiPractices: boolean;
  requiresStockOptions: boolean;
  minScaleDauMau: string; // e.g. "High DAU/MAU"
  managerBackground: string; // e.g. "Frontend Background"
  requiresWlb: boolean;
  requiresGptw: boolean;
}

export interface CompanyProfile {
  id: string;
  name: string;
  logo: string; // we will use Lucide icons or initials
  domain: string;
  isFintech: boolean;
  hybridPolicy: string;
  ctcRating: string; // e.g. "Offers > 45-55LPA for SDE3/Staff"
  hasUiPrincipals: boolean;
  uiPrincipalDetails: string;
  aiPractices: string;
  stockType: string; // e.g. "RSUs / ESOPs available"
  scaleMetrics: string; // e.g. "10M+ MAU"
  managerType: string;
  cultureRating: string; // e.g. "Great / Certified GPTW"
  wlbRating: string; // e.g. "Excellent / Stable"
  fitScore: number; // 0-100
  fitSummary: string;
}

export interface JobOpening {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  description: string;
  publishedAt: string;
  keyRequirements: string[];
  alignmentScore: number;
  alignmentExplanation: string;
  isManual?: boolean;
}

export interface EmailLog {
  id: string;
  sentAt: string;
  triggerType: "Scheduled" | "Manual Test";
  recipient: string;
  subject: string;
  openingsCount: number;
  status: "Sent" | "Failed" | "Simulated";
  previewHtml: string;
  error?: string;
}

export interface ApplicationState {
  id: string;
  companyName: string;
  title: string;
  stage: "Interested" | "Applied" | "Interviewing" | "Offered" | "Rejected";
  appliedDate?: string;
  notes: string;
  lastUpdated: string;
}

export interface AppState {
  profile: UserProfile;
  criteria: SearchCriteria;
  applications: ApplicationState[];
  emailLogs: EmailLog[];
  isSubscribed: boolean;
  emailTime: string; // e.g. "17:00"
  emailDay: number; // e.g. 6 for Saturday
}
