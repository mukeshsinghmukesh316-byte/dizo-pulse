export interface ContractActivity {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: 'admin' | 'client';
  notes?: string;
}

export interface ContractApprovalRecord {
  clientName: string;
  email: string;
  status: 'Approved' | 'Changes Requested' | 'Rejected';
  timestamp: string;
  method: string;
  notes?: string;
  signatureData?: string;
  signeeTitle?: string;
}

export interface Contract {
  id: string; // e.g. "CTR-1001"
  proposalId?: string; // e.g. "PROP-1001"
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessName: string;
  businessNiche: string;
  projectName: string;
  projectDescription: string;
  selectedServices: string[];
  deliverables: string;
  timeline: string;
  revisionTerms: string;
  clientResponsibilities: string;
  agencyResponsibilities: string;
  confidentialityTerms: string;
  cancellationTerms: string;
  generalTerms: string;
  createdAt: string;
  expiryDate: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Awaiting Approval' | 'Approved' | 'Changes Requested' | 'Rejected' | 'Expired' | 'Archived';
  archived?: boolean;
  approvalRecord?: ContractApprovalRecord;
  activityHistory: ContractActivity[];
  internalNotes?: string;
}

export type ProjectStatus = 
  | 'Not Started'
  | 'Kickoff'
  | 'In Progress'
  | 'Client Review'
  | 'Revision'
  | 'Final Approval'
  | 'Completed'
  | 'On Hold'
  | 'Cancelled';

export type MilestoneStatus = 
  | 'Pending'
  | 'Active'
  | 'Completed'
  | 'Client Review'
  | 'Revision Requested'
  | 'Approved';

export interface ProjectMilestone {
  id: string;
  stageNumber: number; // 1 to 5
  name: string; // Stage 1 - Kickoff, Stage 2 - Creative / Logo Concepts, Stage 3 - Content Production, Stage 4 - Ad / Web Setup, Stage 5 - Final Handover
  description: string;
  startDate?: string;
  dueDate?: string;
  completionDate?: string;
  status: MilestoneStatus;
  progressPercent: number;
  adminNotes?: string;
  clientVisibleUpdate?: string;
  clientApprovalRequired?: boolean;
  clientApprovalStatus?: 'Pending' | 'Approved' | 'Revision Requested';
  clientFeedback?: string;
}

export interface ProjectActivity {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  role: 'admin' | 'client';
  isClientVisible: boolean;
  notes?: string;
}

export interface ProjectNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface ProjectClientUpdate {
  id: string;
  timestamp: string;
  author: string;
  title: string;
  content: string;
}

export type AssetStatus = 'Draft' | 'In Review' | 'Final' | 'Archived';

export interface FileVersion {
  versionId: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0", "v2.1 Final"
  fileName: string;
  fileType: string;
  fileSize: number; // size in bytes
  fileUrl: string;
  description?: string;
  uploadDate: string;
  uploadedBy: string;
  versionNotes?: string;
  isCurrent: boolean;
  isArchived?: boolean;
}

export interface AssetFolder {
  id: string;
  name: string;
  isDefault?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  assetName: string;
  folderId: string;
  folderName: string;
  status: AssetStatus;
  isClientVisible: boolean;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
  currentVersion: FileVersion;
  versionHistory: FileVersion[];
}

export interface MessageAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number; // in bytes
  fileUrl: string;
}

export type MessageDeliveryStatus = 'sending' | 'sent' | 'failed';

export interface ProjectMessage {
  id: string;
  projectId: string;
  senderName: string;
  senderRole: 'client' | 'admin' | 'agency' | 'staff';
  senderEmail?: string;
  content: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  status: MessageDeliveryStatus;
  isRead: boolean;
  isArchived?: boolean;
}

export interface DeliverableFile {
  id: string;
  name: string;
  category: 'Branding & Logo' | 'Video & Content' | 'Design & Figma' | 'Web & Code' | 'Strategy & Docs' | 'Invoice' | string;
  size: string;
  fileType: 'ZIP' | 'PDF' | 'PNG' | 'MP4' | 'SVG' | 'DOCX' | 'FIGMA' | 'AI' | 'PSD' | string;
  uploadDate: string;
  version: string;
  downloadUrl?: string;
  associatedOrderId?: string;
}

export interface ConversationSummary {
  projectId: string;
  projectName: string;
  clientName: string;
  clientEmail: string;
  latestMessage?: ProjectMessage;
  lastActivity: string;
  totalMessages: number;
  unreadCount: number;
}

export interface ProjectAssetStats {
  totalFiles: number;
  finalFiles: number;
  latestUploadDate?: string;
  totalSizeBytes: number;
}

export interface Project {
  id: string; // e.g. "PRJ-1001"
  contractId?: string; // e.g. "CTR-1001"
  proposalId?: string; // e.g. "PROP-1001"
  clientName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  businessName: string;
  businessNiche?: string;
  projectName: string;
  projectDescription?: string;
  selectedServices: string[];
  deliverables: string;
  timeline?: string;
  status: ProjectStatus;
  overallProgress: number; // 0 - 100
  startDate: string;
  deadline: string;
  completionDate?: string;
  lastUpdated: string;
  projectManager?: string;
  milestones: ProjectMilestone[];
  activityTimeline: ProjectActivity[];
  internalNotes: ProjectNote[];
  clientUpdates: ProjectClientUpdate[];
  folders?: AssetFolder[];
  assets?: ProjectAsset[];
  assetStats?: ProjectAssetStats;
  archived?: boolean;
}

export interface Proposal {
  id: string; // e.g. "PROP-1001"
  inquiryId?: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessName: string;
  businessNiche: string;
  selectedServices: string[];
  deliverables: string;
  timeline: string;
  totalAmount: number;
  termsAndConditions: string;
  createdAt: string;
  expiryDate: string;
  internalNotes?: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Approved' | 'Rejected' | 'Changes Requested';
  clientResponseNote?: string;
  approvalDate?: string;
}

export interface PricingHistoryEntry {
  id: string;
  timestamp: string;
  author: string;
  oldMrp: number;
  newMrp: number;
  oldLaunchPrice: number;
  newLaunchPrice: number;
  reason?: string;
}

export interface Service {
  id: string;
  name: string;
  category: 'social' | 'branding' | 'web' | 'marketing' | 'systems' | string;
  subcategory?: string;
  mrp: number;
  launchPrice: number;
  gstPercent?: number;
  discountPercent?: number;
  turnaroundTime?: string;
  deliverables?: string[];
  description: string;
  unit?: string;
  badge?: string;
  iconName: string;
  imageUrl?: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  status?: 'published' | 'draft' | 'archived';
  displayOrder?: number;
  priceHistory?: PricingHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceBundle {
  id: string;
  name: string;
  description: string;
  category?: string;
  subcategory?: string;
  serviceIds: string[];
  bundleType?: 'fixed' | 'discount_percent';
  mrp: number;
  bundlePrice: number;
  bundleDiscountPercent?: number;
  gstPercent?: number;
  turnaroundTime?: string;
  deliverables?: string[];
  badge?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  status: 'published' | 'draft' | 'archived';
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
  priceHistory?: PricingHistoryEntry[];
}

export type InquiryStatus = 'new' | 'reviewing' | 'contacted' | 'proposal_sent' | 'contract_signed' | 'project_active' | 'completed' | 'closed' | 'lost';
export type InquiryPriority = 'low' | 'medium' | 'high' | 'urgent';

export type ClientStatus = 'lead' | 'active' | 'inactive' | 'completed';

export interface ClientContactPerson {
  id: string;
  name: string;
  title?: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface ClientNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface ClientActivity {
  id: string;
  timestamp: string;
  type: 'inquiry' | 'proposal' | 'contract' | 'project' | 'message' | 'asset' | 'note' | 'status_change';
  title: string;
  description: string;
  author?: string;
  relatedEntityId?: string;
}

export interface ClientProfile {
  id: string;
  companyName: string;
  clientName: string; // primary contact name
  email: string;
  phone: string;
  businessNiche?: string;
  website?: string;
  address?: string;
  gstin?: string;
  status: ClientStatus;
  tags: string[];
  contactPersons: ClientContactPerson[];
  notes: ClientNote[];
  activityTimeline: ClientActivity[];
  createdAt: string;
  updatedAt?: string;
  lastInteraction?: string;
}

export interface ContactHistoryItem {
  id: string;
  timestamp: string;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'note';
  author: string;
  summary: string;
}

export interface InquiryNote {
  id: string;
  timestamp: string;
  author: string;
  content: string;
}

export interface Inquiry {
  id: string;
  clientName: string;
  whatsapp: string;
  email: string;
  businessName: string;
  businessNiche: string;
  message?: string;
  services: string[]; // Service IDs
  serviceDetails?: {
    [serviceId: string]: {
      quantity: number;
      speed: 'standard' | 'express';
      brief?: string;
      fileName?: string;
    }
  };
  totalOriginal: number;
  totalDiscounted: number;
  status: InquiryStatus;
  adminNotes?: string;
  priority?: InquiryPriority;
  assignedStaffId?: string;
  assignedStaffName?: string;
  contactHistory?: ContactHistoryItem[];
  internalNotesList?: InquiryNote[];
  archived?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GrowthStrategyRequest {
  businessName: string;
  businessNiche: string;
  targetAudience: string;
  goals: string[];
}

export interface GrowthStrategyResponse {
  executiveSummary: string;
  brandingStrategy: string;
  contentPlan: string;
  recommendedServices: string[]; // list of service names
  weeklyTimeline: {
    week: string;
    focus: string;
    actions: string[];
  }[];
}

export interface Settings {
  logoTextFirst: string;
  logoTextSecond: string;
  logoSubtitle: string;
  logoSlogan: string;
  logoCyanStart: string;
  logoCyanEnd: string;
  logoPurpleStart: string;
  logoPurpleEnd: string;
  logoAnimDuration: number;
  logoPreset: string;
  // Theme & Logo Variant customization
  activeTheme?: string;
  logoIconType?: string; // 'animated-vector' | 'text-only' | 'symbol-shield' | 'symbol-sparkles' | 'symbol-crown' | 'symbol-bolt'
  logoCustomUrl?: string; // option for custom logo image URL
  // Flipkart-style event settings
  eventActive?: boolean;
  eventName?: string;
  eventTagline?: string;
  eventDiscountText?: string;
  eventEndsAt?: string; // ISO String (e.g. 2026-07-28T18:30:00.000Z)
  eventBannerBg?: string; // 'sunset-fire' | 'blue-neon' | 'emerald-aurora' | 'purple-luxury'
  eventDeals?: {
    id: string;
    title: string;
    description: string;
    dealPrice: number;
    originalPrice: number;
    timeLeftMinutes: number;
  }[];
}

export interface Coupon {
  code: string;
  eventName: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  active: boolean;
}

export type TeamRole = 'super_admin' | 'admin' | 'manager' | 'staff';
export type PermissionLevel = 'write' | 'read' | 'none';

export interface TeamMemberPermissions {
  proposals: PermissionLevel;
  contracts: PermissionLevel;
  projects: PermissionLevel;
  assets: PermissionLevel;
  messages: PermissionLevel;
  settings: PermissionLevel;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole | 'staff' | 'admin';
  password?: string;
  whatsapp?: string;
  department?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastActive?: string;
  avatar?: string;
  permissions?: TeamMemberPermissions;
  projectAccess?: 'all' | string[]; // 'all' or list of project IDs e.g. ['PRJ-1001', 'PRJ-1002']
}

export type NotificationType =
  | 'proposal'
  | 'contract'
  | 'milestone'
  | 'asset'
  | 'message'
  | 'project_status'
  | 'system';

export interface AppNotification {
  id: string;
  recipientEmail: string; // client email or 'all' for broadcasts
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityId?: string; // e.g. "PRJ-1001", "PROP-1001", "CTR-1001"
  relatedSection?: 'proposals' | 'contracts' | 'projects' | 'assets' | 'messages';
  createdAt: string;
  isRead: boolean;
  linkText?: string;
}

export type AuditLogSeverity = 'info' | 'warning' | 'critical';
export type AuditLogStatus = 'success' | 'failed' | 'warning';
export type AuditLogModule = 'auth' | 'staff' | 'proposals' | 'contracts' | 'projects' | 'services' | 'settings' | 'clients' | 'inquiries';

export interface AuditLog {
  id: string;
  user: string;
  userEmail?: string;
  role: string;
  action: string;
  module: AuditLogModule | string;
  target?: string;
  description: string;
  timestamp: string;
  ipAddress?: string;
  deviceInfo?: string;
  status: AuditLogStatus;
  severity: AuditLogSeverity;
  metadata?: Record<string, any>;
}

// --- SEO & SOCIAL SHARING CONFIGURATION INTERFACES ---
export interface SeoGlobalConfig {
  siteTitle: string;
  titleTemplate: string; // e.g. "%s | Dizo Pulse"
  metaDescription: string;
  keywords: string;
  canonicalBaseUrl: string;
  faviconUrl: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  author: string;
  language: string;
  // Open Graph
  ogType: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
  // Twitter / X Card
  twitterCardType: 'summary' | 'summary_large_image';
  twitterTitle: string;
  twitterDescription: string;
  twitterImageUrl: string;
  twitterHandle: string;
}

export interface SeoPageConfig {
  id: string;
  pageName: string;
  path: string;
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number; // 0.0 to 1.0
}

export interface SeoServiceConfig {
  serviceId: string;
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string;
  customOgTitle?: string;
  customOgDescription?: string;
  customOgImage?: string;
  customCanonical?: string;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export interface SeoSitemapCustomUrl {
  loc: string;
  lastmod?: string;
  changefreq: string;
  priority: number;
}

export interface SeoSitemapConfig {
  includeServices: boolean;
  includePages: boolean;
  defaultChangeFreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  defaultPriority: number;
  customUrls: SeoSitemapCustomUrl[];
}

export interface SeoConfig {
  global: SeoGlobalConfig;
  pages: Record<string, SeoPageConfig>;
  servicesSeo: Record<string, SeoServiceConfig>;
  sitemapConfig: SeoSitemapConfig;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
}

// ==========================================
// INTEGRATIONS & API SETTINGS TYPES
// ==========================================
export type IntegrationCategory = 'email' | 'whatsapp' | 'cloud_storage' | 'analytics' | 'payment_gateway';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'not_configured';

export type IntegrationEnvironment = 'test' | 'production';

export interface IntegrationFieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'url' | 'number';
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  isSecret?: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  provider: string;
  category: IntegrationCategory;
  description: string;
  iconName: string;
  docsUrl?: string;
  badge?: string;
  isEnabled: boolean;
  status: IntegrationStatus;
  statusMessage?: string;
  environment: IntegrationEnvironment;
  lastChecked?: string;
  lastTestedLatencyMs?: number;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
  fields: IntegrationFieldDef[];
  config: Record<string, string>;
  hasSecretsSet: Record<string, boolean>;
}

export interface IntegrationsSummary {
  total: number;
  connected: number;
  enabled: number;
  needsAttention: number;
}

// ==========================================
// DASHBOARD CUSTOMIZATION TYPES
// ==========================================
export type WidgetId =
  | 'leads'
  | 'projects'
  | 'proposals'
  | 'contracts'
  | 'messages'
  | 'pending_actions'
  | 'recent_activity'
  | 'performance'
  | 'quick_actions';

export type WidgetSize = 'small' | 'medium' | 'large';

export interface DashboardWidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  icon: string;
  visible: boolean;
  size: WidgetSize; // small: 1 col / 33%, medium: 2 cols / 66%, large: full 3-4 cols / 100%
  order: number;
  requiredRole?: string[];
  minPermission?: { module: string; level: 'read' | 'write' };
}

export interface DashboardLayout {
  id?: string;
  userId?: string;
  userEmail?: string;
  widgets: DashboardWidgetConfig[];
  density?: 'compact' | 'comfortable';
  lastUpdated?: string;
  lastUpdatedBy?: string;
  isGlobalDefault?: boolean;
}


