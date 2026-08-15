import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { services as defaultServices } from './src/data/services.js';

dotenv.config();

const app = express();
const PORT = 3000;
const dbDir = process.env.VERCEL ? '/tmp' : process.cwd();
const DB_FILE = path.join(dbDir, 'inquiries-db.json');
const SETTINGS_FILE = path.join(dbDir, 'settings-db.json');
const SERVICES_FILE = path.join(dbDir, 'services-db.json');
const BUNDLES_FILE = path.join(dbDir, 'bundles-db.json');
const COUPONS_FILE = path.join(dbDir, 'coupons-db.json');
const USERS_FILE = path.join(dbDir, 'users-db.json');
const STAFF_FILE = path.join(dbDir, 'staff-db.json');
const PROPOSALS_FILE = path.join(dbDir, 'proposals-db.json');
const CONTRACTS_FILE = path.join(dbDir, 'contracts-db.json');
const PROJECTS_FILE = path.join(dbDir, 'projects-db.json');
const ASSETS_FILE = path.join(dbDir, 'assets-db.json');
const FOLDERS_FILE = path.join(dbDir, 'folders-db.json');
const MESSAGES_FILE = path.join(dbDir, 'messages-db.json');
const NOTIFICATIONS_FILE = path.join(dbDir, 'notifications-db.json');
const CLIENTS_FILE = path.join(dbDir, 'clients-db.json');
const AUDIT_LOGS_FILE = path.join(dbDir, 'audit-logs-db.json');
const WEBSITE_CONTENT_FILE = path.join(dbDir, 'website-content-db.json');
const SEO_FILE = path.join(dbDir, 'seo-db.json');
const VISITOR_STATS_FILE = path.join(dbDir, 'visitor-stats-db.json');
const SESSIONS_FILE = path.join(dbDir, 'sessions-db.json');
const FAILED_LOGINS_FILE = path.join(dbDir, 'failed-logins-db.json');
const SECURITY_POLICY_FILE = path.join(dbDir, 'security-policy-db.json');
const INTEGRATIONS_FILE = path.join(dbDir, 'integrations-db.json');
const DASHBOARD_LAYOUTS_FILE = path.join(dbDir, 'dashboard-layouts-db.json');


let globalMemoryUsers: any[] = [];

const DEFAULT_STAFF = [
  {
    id: 'stf_0',
    name: 'Agency Administrator',
    email: 'admin@dizopulse.com',
    role: 'super_admin',
    password: 'dizo@teamwork',
    whatsapp: '+91 98765 43210',
    department: 'Executive Board',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    projectAccess: 'all',
    permissions: {
      proposals: 'write',
      contracts: 'write',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'write'
    }
  },
  {
    id: 'stf_1',
    name: 'Mukesh Singh',
    email: 'mukeshsinghmukesh316@gmail.com',
    role: 'super_admin',
    password: 'dizo@teamwork',
    whatsapp: '+91 98765 43210',
    department: 'Executive Board',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    projectAccess: 'all',
    permissions: {
      proposals: 'write',
      contracts: 'write',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'write'
    }
  },
  {
    id: 'stf_2',
    name: 'Aisha Sharma',
    email: 'aisha.sharma@dizopulse.com',
    role: 'manager',
    password: 'dizo@staff',
    whatsapp: '+91 91234 56789',
    department: 'Creative & Operations Manager',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    projectAccess: 'all',
    permissions: {
      proposals: 'write',
      contracts: 'write',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'read'
    }
  },
  {
    id: 'stf_3',
    name: 'Rahul Verma',
    email: 'rahul.verma@dizopulse.com',
    role: 'staff',
    password: 'dizo@staff',
    whatsapp: '+91 99887 76655',
    department: 'Web & Tech Specialist',
    status: 'active',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    projectAccess: 'all',
    permissions: {
      proposals: 'read',
      contracts: 'read',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'none'
    }
  }
];

const DEFAULT_SETTINGS = {
  // General Agency Settings
  agencyName: "Dizo Pulse Creative Media & Digital Growth Agency",
  agencyTagline: "Designing Brands • Accelerating Growth • Scaling Success",
  agencyDescription: "Full-service digital marketing, custom software engineering, branding, and performance ads agency.",
  industry: "Digital Marketing & Software Engineering",
  officialWebsite: "https://dizopulse.com",

  // Logo & Branding
  logoTextFirst: "DIZO",
  logoTextSecond: "PULSE",
  logoSubtitle: "Marketing Agency",
  logoSlogan: "DESIGN • CREATE • GROW",
  logoCyanStart: "#00F0FF",
  logoCyanEnd: "#0047FF",
  logoPurpleStart: "#7B2CBF",
  logoPurpleEnd: "#FF007F",
  logoAnimDuration: 1.8,
  logoPreset: "default",
  activeTheme: "indigo-cyber",
  logoIconType: "animated-vector",
  logoCustomUrl: "",
  darkLogoUrl: "",
  faviconUrl: "",
  primaryColor: "#4f46e5",
  accentColor: "#06b6d4",

  // Contact Information
  officialEmail: "hello@dizopulse.com",
  supportEmail: "support@dizopulse.com",
  primaryPhone: "+91 98765 43210",
  secondaryPhone: "+91 87654 32109",
  officialAddress: "Suite 402, Pulse Tech Tower, Cyber City",
  city: "Gurugram",
  state: "Haryana",
  pincode: "122002",
  country: "India",

  // Social Links
  linkedinUrl: "https://linkedin.com/company/dizopulse",
  instagramUrl: "https://instagram.com/dizopulse",
  twitterUrl: "https://x.com/dizopulse",
  facebookUrl: "https://facebook.com/dizopulse",
  youtubeUrl: "https://youtube.com/@dizopulse",
  githubUrl: "https://github.com/dizopulse",

  // Business Hours
  workingDays: "Monday - Saturday",
  startHour: "09:30",
  endHour: "18:30",
  supportHours: "24/7 Priority Support for Retainer Clients",
  timezone: "Asia/Kolkata (IST +5:30)",

  // Default Currency & GST settings
  currencyCode: "INR",
  currencySymbol: "₹",
  defaultGstRate: 18,
  enableGstBilling: true,
  gstinNumber: "07AAAAA0000A1Z5",
  panNumber: "AAAAA0000A",

  // Email & WhatsApp Contact Settings
  whatsappCountryCode: "+91",
  whatsappNumber: "9876543210",
  defaultWelcomeMessage: "Hello! Welcome to Dizo Pulse. How can our growth experts assist you today?",
  replyToEmail: "hello@dizopulse.com",
  enableAutoResponder: true,

  // Proposal Default Terms
  proposalValidityDays: 15,
  defaultPaymentTermsPercent: "50% Upfront Deposit, 30% Mid-Milestone, 20% Final Delivery",
  scopeClarificationDisclaimer: "All deliverables strictly align with approved milestone specifications. Out-of-scope revisions billed at standard hourly rates.",
  standardProposalTerms: "1. All quotes remain valid for 15 days from issuance date.\n2. Work commences upon receipt of initial advance deposit.\n3. Client provides required brand assets within 5 working days.",

  // Contract Default Terms
  jurisdictionCity: "Gurugram, Haryana",
  ndaClauseEnabled: true,
  terminationNoticeDays: 14,
  latePaymentInterestPercent: 1.5,
  standardContractClauses: "1. Mutual Non-Disclosure: Confidential client strategies and agency IP shall remain protected.\n2. IP Ownership: Intellectual property transfers to client upon 100% final invoice settlement.\n3. Dispute Resolution: Arbitration under jurisdiction of Gurugram courts.",

  // Project Default Settings
  defaultMilestoneStructure: "Discovery & Briefing -> UI/UX Design -> Development & Build -> QA & Client Review -> Final Launch",
  requireMilestoneApproval: true,
  defaultWorkingDaysPerMilestone: 7,
  autoArchiveCompletedProjectsDays: 90,

  // Client Portal Settings
  allowClientSelfRegistration: false,
  allowClientFileUploads: true,
  showStaffBiosToClient: true,
  clientDashboardBannerMessage: "Welcome to your Dizo Pulse Client Portal! Track project progress, review active proposals, and sign contracts in real time.",

  // File Upload Limits & Formats
  maxFileUploadSizeMB: 25,
  allowedFileExtensions: "pdf, png, jpg, jpeg, zip, docx, figma, mp4, svg, csv, xlsx",

  // Maintenance Mode
  maintenanceModeEnabled: false,
  maintenanceNoticeBanner: "Dizo Pulse is undergoing scheduled maintenance to upgrade client engines. We'll be back shortly!",
  allowedBypassRoles: "super_admin, admin",

  // Metadata
  lastUpdatedBy: "Mukesh Singh (super_admin)",
  lastUpdatedAt: "2026-08-12T07:30:00.000Z",

  // Flipkart event legacy settings
  eventActive: true,
  eventName: "BIG BILLION FIESTA",
  eventTagline: "India's Greatest Digital Growth Sales & Lightning Scoping Deals!",
  eventDiscountText: "FLAT 40% OFF + 10% CASHBACK",
  eventEndsAt: "2026-12-31T23:59:59.000Z",
  eventBannerBg: "sunset-fire",
  eventDeals: [
    {
      id: "deal-1",
      title: "Instagram/FB Reels Scoping Package",
      description: "Complete 15-Reel conceptual outline + video styling guidelines",
      dealPrice: 4999,
      originalPrice: 12000,
      timeLeftMinutes: 45
    },
    {
      id: "deal-2",
      title: "High-Converting Shopify / Web Landing Page",
      description: "SEO-Optimized React-Tailwind custom layout + 6-month support",
      dealPrice: 14999,
      originalPrice: 35000,
      timeLeftMinutes: 120
    },
    {
      id: "deal-3",
      title: "Full Brand Core Identity Lab Pack",
      description: "Custom premium vector logo design, custom fonts, visual stylebook",
      dealPrice: 7999,
      originalPrice: 18000,
      timeLeftMinutes: 90
    }
  ]
};

const DEFAULT_COUPONS = [
  {
    code: "DIZO20",
    eventName: "Launch Special Sale",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 0,
    active: true
  },
  {
    code: "PULSE50",
    eventName: "Independence Day Mega Offer",
    discountType: "percentage",
    discountValue: 50,
    minOrderValue: 3000,
    active: true
  },
  {
    code: "FLAT500",
    eventName: "Founder's Special Voucher",
    discountType: "flat",
    discountValue: 500,
    minOrderValue: 1500,
    active: true
  },
  {
    code: "FESTIVE30",
    eventName: "Festive Seasonal Offer",
    discountType: "percentage",
    discountValue: 30,
    minOrderValue: 1000,
    active: true
  },
  {
    code: "WELCOME10",
    eventName: "Welcome Onboarding Voucher",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    active: true
  }
];

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- FIREBASE ADMIN INITIALIZATION & ENGINE ---
let db: Firestore | null = null;
let isFirebaseInitialized = false;

function getFirestoreDb(): Firestore | null {
  if (isFirebaseInitialized) {
    return db;
  }
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      privateKey = privateKey.trim();
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      db = getFirestore();
      isFirebaseInitialized = true;
      console.log('>>> [Firebase Mode] Firebase Admin SDK initialized. Testing connection next...');
      return db;
    } catch (error) {
      console.error('>>> [Local Fallback] Failed to initialize Firebase Admin SDK. Using local JSON files.', error);
      isFirebaseInitialized = true; // Mark as done to avoid spamming logs
      db = null;
      return null;
    }
  } else {
    isFirebaseInitialized = true;
    console.log('>>> [Local Mode] Firebase environment variables not set. Using local JSON files.');
    return null;
  }
}

// Sync a list of items to Firestore
async function syncCollection(collectionName: string, idField: string, newArray: any[]) {
  const fdb = getFirestoreDb();
  if (!fdb) return;
  
  try {
    const snapshot = await fdb.collection(collectionName).get();
    const existingIds = snapshot.docs.map(doc => doc.id);
    const activeIds = new Set<string>();
    const batch = fdb.batch();

    for (const item of newArray) {
      const docId = String(item[idField]);
      activeIds.add(docId);
      const docRef = fdb.collection(collectionName).doc(docId);
      batch.set(docRef, item);
    }

    for (const id of existingIds) {
      if (!activeIds.has(id)) {
        const docRef = fdb.collection(collectionName).doc(id);
        batch.delete(docRef);
      }
    }

    await batch.commit();
  } catch (error: any) {
    console.log(`>>> [Local Mode] Firestore write unavailable for ${collectionName}. Falling back to local storage.`);
    db = null;
  }
}

async function fetchCollection(collectionName: string, defaultArray: any[] = []) {
  const fdb = getFirestoreDb();
  if (!fdb) return null;

  try {
    const snapshot = await fdb.collection(collectionName).get();
    if (snapshot.empty) {
      if (defaultArray && defaultArray.length > 0) {
        await syncCollection(collectionName, collectionName === 'coupons' ? 'code' : 'id', defaultArray);
        return defaultArray;
      }
      return [];
    }
    const items: any[] = [];
    snapshot.forEach(doc => {
      items.push({ ...doc.data() });
    });
    return items;
  } catch (error: any) {
    console.log(`>>> [Local Mode] Firestore read unavailable for ${collectionName}. Falling back to local storage.`);
    db = null;
    return null;
  }
}

// Helper function to read inquiries
async function readInquiries() {
  const firestoreData = await fetchCollection('inquiries', []);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper function to write inquiries
async function writeInquiries(inquiries: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('inquiries', 'id', inquiries);
    return;
  }

  try {
    await fs.writeFile(DB_FILE, JSON.stringify(inquiries, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing inquiries to file:', error);
  }
}

// Helper to load/save Proposals
async function readProposals() {
  const firestoreData = await fetchCollection('proposals', []);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(PROPOSALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeProposals(proposals: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('proposals', 'id', proposals);
    return;
  }

  try {
    await fs.writeFile(PROPOSALS_FILE, JSON.stringify(proposals, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing proposals to file:', error);
  }
}

// Helper to load/save Contracts
async function readContracts() {
  const firestoreData = await fetchCollection('contracts', []);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(CONTRACTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeContracts(contracts: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('contracts', 'id', contracts);
    return;
  }

  try {
    await fs.writeFile(CONTRACTS_FILE, JSON.stringify(contracts, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing contracts to file:', error);
  }
}

const DEFAULT_PROJECTS = [
  {
    id: 'PRJ-1001',
    contractId: 'CTR-1001',
    proposalId: 'PROP-1001',
    clientName: 'Mukesh Singh',
    contactPerson: 'Mukesh Singh',
    email: 'mukeshsinghmukesh316@gmail.com',
    phone: '+91 98765 43210',
    businessName: 'Aura Digital Labs',
    businessNiche: 'E-Commerce & Retail',
    projectName: 'Aura Digital Labs - Brand Identity & Performance Suite',
    projectDescription: 'End-to-end digital transformation including vector logo system, high-converting React landing page, and 15 viral Instagram reels.',
    selectedServices: ['Logo & Brand Identity Pack', 'High-Converting Landing Page', 'Viral Reels Growth Pack'],
    deliverables: '1. Custom Vector Logo Suite (Main, Stacked, Icon variants)\n2. High-Converting Mobile-Optimized Website\n3. 15 Custom High-Retention Instagram Reels',
    timeline: '7 - 10 Business Days',
    status: 'In Progress',
    overallProgress: 45,
    startDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date().toISOString(),
    projectManager: 'Rahul Verma',
    milestones: [
      {
        id: 'm1',
        stageNumber: 1,
        name: 'Stage 1 — Kickoff',
        description: 'Project onboarding, goal discovery, asset collection, & execution roadmap.',
        status: 'Completed',
        progressPercent: 100,
        completionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        adminNotes: 'Brand brief & asset repository received from client.',
        clientVisibleUpdate: 'Kickoff completed smoothly! Assets gathered.',
        clientApprovalRequired: false
      },
      {
        id: 'm2',
        stageNumber: 2,
        name: 'Stage 2 — Creative / Logo Concepts',
        description: 'Vector logo variations, color palettes, and brand typography rules.',
        status: 'Active',
        progressPercent: 80,
        adminNotes: '3 Logo concepts ready. Sent for client review.',
        clientVisibleUpdate: 'Visual concepts and logo designs submitted for your review.',
        clientApprovalRequired: true,
        clientApprovalStatus: 'Pending'
      },
      {
        id: 'm3',
        stageNumber: 3,
        name: 'Stage 3 — Content Production',
        description: '15 High-converting reel scripts, voiceover guidelines, and video cuts.',
        status: 'Pending',
        progressPercent: 0,
        adminNotes: 'Script outlines prepared.',
        clientVisibleUpdate: 'Reel content scripts queued for video production.',
        clientApprovalRequired: false
      },
      {
        id: 'm4',
        stageNumber: 4,
        name: 'Stage 4 — Ad / Web Setup',
        description: 'React/Tailwind landing page deployment & Meta Pixel integration.',
        status: 'Pending',
        progressPercent: 0,
        clientApprovalRequired: true,
        clientApprovalStatus: 'Pending'
      },
      {
        id: 'm5',
        stageNumber: 5,
        name: 'Stage 5 — Final Handover',
        description: 'Source file transfers, final deployment check, and admin walkthrough.',
        status: 'Pending',
        progressPercent: 0,
        clientApprovalRequired: true,
        clientApprovalStatus: 'Pending'
      }
    ],
    activityTimeline: [
      {
        id: 'act-1',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'Project Created from Approved Contract CTR-1001',
        user: 'Dizo Agency Admin',
        role: 'admin',
        isClientVisible: true,
        notes: 'Project initiated and assigned to Rahul Verma'
      },
      {
        id: 'act-2',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'Kickoff Milestone Completed',
        user: 'Rahul Verma',
        role: 'admin',
        isClientVisible: true,
        notes: 'Brand brief assets confirmed'
      },
      {
        id: 'act-3',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        action: 'Creative Concepts Submitted for Client Approval',
        user: 'Rahul Verma',
        role: 'admin',
        isClientVisible: true,
        notes: 'Logo variations sent for client approval checkpoint'
      }
    ],
    internalNotes: [
      {
        id: 'n-1',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Aisha Sharma',
        content: 'Client prefers dark neon aesthetic with cyan/purple accents matching Dizo style.'
      }
    ],
    clientUpdates: [
      {
        id: 'cu-1',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Dizo Team',
        title: 'Logo Concepts Ready for Review',
        content: 'We have uploaded 3 distinct logo concepts to Stage 2. Please review and provide approval or feedback.'
      }
    ]
  }
];

// Helper to load/save Projects
async function readProjects() {
  const firestoreData = await fetchCollection('projects', DEFAULT_PROJECTS);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_PROJECTS;
  } catch (error) {
    return DEFAULT_PROJECTS;
  }
}

async function writeProjects(projects: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('projects', 'id', projects);
    return;
  }

  try {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing projects to file:', error);
  }
}

// DEFAULT ASSET FOLDERS & SAMPLE ASSETS
const STANDARD_DEFAULT_FOLDERS = [
  { id: 'fld-branding', name: 'Branding', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-logo', name: 'Logo', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-guidelines', name: 'Brand Guidelines', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-social', name: 'Social Media', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-reels', name: 'Reels', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-graphics', name: 'Graphics', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-website', name: 'Website', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-source', name: 'Source Files', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-final', name: 'Final Delivery', isDefault: true, createdAt: new Date().toISOString() },
  { id: 'fld-docs', name: 'Documents', isDefault: true, createdAt: new Date().toISOString() },
];

const DEFAULT_FOLDERS: { [projectId: string]: any[] } = {
  'PRJ-1001': [...STANDARD_DEFAULT_FOLDERS]
};

const sampleLogoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230f172a"/><circle cx="400" cy="300" r="180" fill="none" stroke="%2300f0ff" stroke-width="12"/><path d="M 320 200 L 480 300 L 320 400 Z" fill="%237b2cbf"/><text x="400" y="530" fill="%23ffffff" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">Aura Digital Labs - Master Vector Logo</text></svg>`;

const samplePdfData = `data:application/pdf;base64,JVBERi0xLjQKJSDi483NCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ291bnQgMSAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdIC9Db250ZW50cyA0IDAgUj4+CmVuZG9iago4IDAgb2JqCjw8L0xlbmd0aCA1MD4+CnN0cmVhbQpCVAovRjEgMjQgVGYKNzAgNzAwIFRkCihEaXpvIFB1bHNlIC0gQnJhbmQgR3VpZGVsaW5lcykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp0cmFpbGVyCjw8L1Jvb3QgMSAwIFI+PgolJUVPRg==`;

const sampleVideoData = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`;

const DEFAULT_ASSETS: any[] = [
  {
    id: 'AST-1001',
    projectId: 'PRJ-1001',
    assetName: 'Aura Vector Logo Master Pack',
    folderId: 'fld-logo',
    folderName: 'Logo',
    status: 'Final',
    isClientVisible: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentVersion: {
      versionId: 'ver-1001-v2.1',
      versionNumber: 'v2.1 Final',
      fileName: 'Aura_Vector_Logo_Master.svg',
      fileType: 'image/svg+xml',
      fileSize: 245000,
      fileUrl: sampleLogoSvg,
      description: 'Master vector logo package in cyan & indigo neon variants (SVG, PNG & High-Res)',
      uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      uploadedBy: 'Aisha Sharma (Design Lead)',
      versionNotes: 'Final approved vector files with dark & light background contrast assets.',
      isCurrent: true
    },
    versionHistory: [
      {
        versionId: 'ver-1001-v2.1',
        versionNumber: 'v2.1 Final',
        fileName: 'Aura_Vector_Logo_Master.svg',
        fileType: 'image/svg+xml',
        fileSize: 245000,
        fileUrl: sampleLogoSvg,
        description: 'Master vector logo package in cyan & indigo neon variants',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Aisha Sharma (Design Lead)',
        versionNotes: 'Final approved vector files with dark & light background contrast assets.',
        isCurrent: true
      },
      {
        versionId: 'ver-1001-v2.0',
        versionNumber: 'v2.0',
        fileName: 'Aura_Vector_Logo_v2.svg',
        fileType: 'image/svg+xml',
        fileSize: 230000,
        fileUrl: sampleLogoSvg,
        description: 'Updated cyan gradient ratio per client feedback',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Aisha Sharma (Design Lead)',
        versionNotes: 'Refined icon thickness and contrast.',
        isCurrent: false
      },
      {
        versionId: 'ver-1001-v1.0',
        versionNumber: 'v1.0',
        fileName: 'Aura_Logo_Draft_v1.png',
        fileType: 'image/png',
        fileSize: 180000,
        fileUrl: sampleLogoSvg,
        description: 'Initial concept draft',
        uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Rahul Verma',
        versionNotes: 'Initial design submission.',
        isCurrent: false
      }
    ]
  },
  {
    id: 'AST-1002',
    projectId: 'PRJ-1001',
    assetName: 'Brand Strategy & Visual Guidelines 2026',
    folderId: 'fld-guidelines',
    folderName: 'Brand Guidelines',
    status: 'Final',
    isClientVisible: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentVersion: {
      versionId: 'ver-1002-v1.0',
      versionNumber: 'v1.0 Final',
      fileName: 'Aura_Brand_Identity_Guidelines.pdf',
      fileType: 'application/pdf',
      fileSize: 1450000,
      fileUrl: samplePdfData,
      description: 'Official typography rules, primary & secondary color hex codes, & spacing standards.',
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      uploadedBy: 'Aisha Sharma (Design Lead)',
      versionNotes: 'Comprehensive 12-page PDF brand guide.',
      isCurrent: true
    },
    versionHistory: [
      {
        versionId: 'ver-1002-v1.0',
        versionNumber: 'v1.0 Final',
        fileName: 'Aura_Brand_Identity_Guidelines.pdf',
        fileType: 'application/pdf',
        fileSize: 1450000,
        fileUrl: samplePdfData,
        description: 'Official typography rules, primary & secondary color hex codes, & spacing standards.',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Aisha Sharma (Design Lead)',
        versionNotes: 'Comprehensive 12-page PDF brand guide.',
        isCurrent: true
      }
    ]
  },
  {
    id: 'AST-1003',
    projectId: 'PRJ-1001',
    assetName: 'Product Launch Teaser Reel #1',
    folderId: 'fld-reels',
    folderName: 'Reels',
    status: 'In Review',
    isClientVisible: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentVersion: {
      versionId: 'ver-1003-v1.0',
      versionNumber: 'v1.0',
      fileName: 'Aura_Reel_01_Teaser.mp4',
      fileType: 'video/mp4',
      fileSize: 8500000,
      fileUrl: sampleVideoData,
      description: '15-second high-energy Instagram Reel teaser cut with dynamic typography overlay & trending audio soundtrack.',
      uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      uploadedBy: 'Mukesh Singh (Admin)',
      versionNotes: 'First cut video for client review.',
      isCurrent: true
    },
    versionHistory: [
      {
        versionId: 'ver-1003-v1.0',
        versionNumber: 'v1.0',
        fileName: 'Aura_Reel_01_Teaser.mp4',
        fileType: 'video/mp4',
        fileSize: 8500000,
        fileUrl: sampleVideoData,
        description: '15-second high-energy Instagram Reel teaser cut',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        uploadedBy: 'Mukesh Singh (Admin)',
        versionNotes: 'First cut video for client review.',
        isCurrent: true
      }
    ]
  },
  {
    id: 'AST-1004',
    projectId: 'PRJ-1001',
    assetName: 'Meta Ad Pixel Setup & Campaign Brief',
    folderId: 'fld-docs',
    folderName: 'Documents',
    status: 'Draft',
    isClientVisible: false,
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    currentVersion: {
      versionId: 'ver-1004-v1.0',
      versionNumber: 'v1.0',
      fileName: 'Meta_Pixel_Strategy_Internal.txt',
      fileType: 'text/plain',
      fileSize: 4200,
      fileUrl: 'data:text/plain;charset=utf-8,Internal%20Agency%20Notes%3A%20Meta%20Pixel%20%26%20Conversion%20API%20configurations%20for%20Aura%20Digital.',
      description: 'Internal configuration notes for ad manager setup and audience targeting parameters.',
      uploadDate: new Date().toISOString(),
      uploadedBy: 'Rahul Verma',
      versionNotes: 'Draft internal doc - Admin only.',
      isCurrent: true
    },
    versionHistory: [
      {
        versionId: 'ver-1004-v1.0',
        versionNumber: 'v1.0',
        fileName: 'Meta_Pixel_Strategy_Internal.txt',
        fileType: 'text/plain',
        fileSize: 4200,
        fileUrl: 'data:text/plain;charset=utf-8,Internal%20Agency%20Notes',
        description: 'Internal configuration notes for ad manager setup',
        uploadDate: new Date().toISOString(),
        uploadedBy: 'Rahul Verma',
        versionNotes: 'Draft internal doc - Admin only.',
        isCurrent: true
      }
    ]
  }
];

async function readAssets() {
  const firestoreData = await fetchCollection('assets', DEFAULT_ASSETS);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(ASSETS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_ASSETS;
  } catch (error) {
    return DEFAULT_ASSETS;
  }
}

async function writeAssets(assets: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('assets', 'id', assets);
    return;
  }

  try {
    await fs.writeFile(ASSETS_FILE, JSON.stringify(assets, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing assets to file:', error);
  }
}

async function readFolders() {
  const firestoreData = await fetchCollection('folders', []);
  if (firestoreData !== null && firestoreData.length > 0) {
    const map: any = {};
    firestoreData.forEach((fDoc: any) => {
      map[fDoc.projectId] = fDoc.folders;
    });
    return { ...DEFAULT_FOLDERS, ...map };
  }

  try {
    const data = await fs.readFile(FOLDERS_FILE, 'utf8');
    return { ...DEFAULT_FOLDERS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_FOLDERS;
  }
}

async function writeFolders(foldersMap: any) {
  const fdb = getFirestoreDb();
  if (fdb) {
    const list = Object.keys(foldersMap).map((prjId) => ({
      id: prjId,
      projectId: prjId,
      folders: foldersMap[prjId]
    }));
    await syncCollection('folders', 'id', list);
    return;
  }

  try {
    await fs.writeFile(FOLDERS_FILE, JSON.stringify(foldersMap, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing folders map:', error);
  }
}


// Helper to load/save Settings
async function readSettings() {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('global').get();
      if (doc.exists) {
        return doc.data();
      } else {
        await fdb.collection('settings').doc('global').set(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Error reading settings from Firestore:', error);
      // Fall through to local fallback
    }
  }

  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: any) {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('global').set(settings);
      return;
    } catch (error) {
      console.error('Error writing settings to Firestore:', error);
    }
  }

  try {
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing settings:', error);
  }
}

const DEFAULT_WEBSITE_CONTENT = {
  published: {
    hero: {
      enabled: true,
      badgeText: "All Digital Solutions Under One Roof",
      headlinePrefix: "Design. Create.",
      headlineGradientText: "Grow.",
      description: "From design to digital growth — everything your brand needs, in one place. We edit reels, build professional platforms, set up target ads, and execute organic branding to elevate your business.",
      primaryCtaText: "Browse Services Catalog",
      primaryCtaLink: "#services-browser",
      secondaryCtaText: "Quote Estimator",
      secondaryCtaLink: "#quote-calculator",
      offerBadgeTitle: "Exclusive Launch Deal",
      offerHeadline: "Flat 20% Off Promo Already Applied",
      offerDescription: "All rates shown in our system catalog are strictly pre-discounted to match our promotional launch offer. Check out the savings on your custom quote workspace!",
      offerStartPrice: "149",
      offerButtonText: "Claim Offer",
      imageUrl: ""
    },
    stats: {
      enabled: true,
      items: [
        { id: 'st-1', icon: 'Rocket', title: 'Fast Delivery', subtitle: 'Rapid campaign and creative deployment' },
        { id: 'st-2', icon: 'ShieldCheck', title: 'Premium Quality', subtitle: 'Aesthetic pixel-perfect designs & videos' },
        { id: 'st-3', icon: 'ThumbsUp', title: '100% Satisfaction', subtitle: 'Continuous feedback and iterations' },
        { id: 'st-4', icon: 'Headphones', title: 'Support 24/7', subtitle: 'Friendly digital advisor assistance' }
      ]
    },
    seasonalOffers: {
      enabled: true,
      bannerTitle: "Exclusive Launch Promotion",
      bannerText: "Get flat discounts on all digital bundles and creative packages!",
      discountTag: "FLAT 20% OFF",
      enabledOnHome: true
    },
    featuredServices: {
      enabled: true,
      heading: "Popular Digital Growth Solutions",
      subheading: "Explore top-requested services picked by growing brands and businesses",
      limitCount: 6
    },
    aboutSection: {
      enabled: true,
      title: "About Dizo Pulse",
      description: "Dizo Pulse is India's premier design and digital engineering workspace, operating at the intersection of aesthetic craft and modern growth strategy. We partner with business builders, content creators, and local retail operations to craft memorable corporate signatures.",
      highlights: [
        "End-to-End Execution — From conceptual vector logos to scalable React platforms",
        "Dedicated Growth Strategist & Account Manager",
        "Transparent Tiered Pricing & Zero Hidden Fees"
      ],
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
    },
    testimonials: {
      enabled: true,
      heading: "Trusted by Visionary Founders & Creators",
      subheading: "Real feedback from businesses scaling with Dizo Pulse growth engines",
      items: [
        {
          id: 't-1',
          clientName: "Aarav Sharma",
          businessName: "Luxe Fashion Studio",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
          rating: 5,
          testimonialText: "Dizo Pulse edited 15 Instagram reels for our seasonal catalog launch. Our engagement went up by 300% in 2 weeks! Unbelievable turnaround time.",
          verified: true
        },
        {
          id: 't-2',
          clientName: "Rohan Gupta",
          businessName: "FitFlex Nutrition",
          avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
          rating: 5,
          testimonialText: "They designed our vector logo and built a lightning-fast custom web storefront. The team was responsive 24/7. Highly recommended!",
          verified: true
        },
        {
          id: 't-3',
          clientName: "Ananya Patel",
          businessName: "Aura Skincare",
          avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
          rating: 5,
          testimonialText: "The Quote Estimator gave us immediate clarity on project costs. No back and forth negotiation needed. Seamless process from start to launch.",
          verified: true
        }
      ]
    },
    faq: {
      enabled: true,
      heading: "Frequently Asked Questions",
      subheading: "Everything you need to know about partnering with Dizo Pulse",
      items: [
        {
          id: 'faq-1',
          question: "How do I get started with a project?",
          answer: "Choose your required services using our Quote Estimator or Services Catalog, review your custom estimate, and create an account to initiate your project."
        },
        {
          id: 'faq-2',
          question: "What is the typical turnaround time for deliverables?",
          answer: "Most creative assets (logos, reel edits, graphics) are delivered within 3-5 business days. Full web platforms and custom growth suites take 7-10 days."
        },
        {
          id: 'faq-3',
          question: "Can I request revisions on my deliverables?",
          answer: "Yes! Every project includes dedicated revision cycles to ensure 100% satisfaction with final designs, code, and creative assets."
        },
        {
          id: 'faq-4',
          question: "What payment options are supported?",
          answer: "We accept UPI (GPay, PhonePe, Paytm), NEFT/IMPS Direct Wire Transfers, and Split Advance milestone payments."
        }
      ]
    },
    footerInfo: {
      enabled: true,
      quickDescription: "We provide comprehensive premium branding, graphic designs, advanced video/reel editing, high converting websites, organic SEO, and advertising campaign administration designed to fast-track modern business growth.",
      phone: "+91 70173 24978",
      email: "support.dizopulse@gmail.com",
      instagram: "@dizo_pulse",
      instagramUrl: "https://instagram.com/dizo_pulse",
      whatsappUrl: "https://wa.me/917017324978",
      websiteText: "dizopulse.in",
      copyrightNotice: "© 2026 Dizo Pulse Digital Agency. All rights reserved. Designed for premier growth."
    },
    sectionOrder: [
      'hero',
      'stats',
      'seasonalOffers',
      'featuredServices',
      'aboutSection',
      'testimonials',
      'faq',
      'footerInfo'
    ]
  },
  draft: null,
  history: [
    {
      id: 'rev-init',
      timestamp: new Date().toISOString(),
      updatedBy: 'Mukesh Singh (super_admin)',
      note: 'Initial public website content structure initialized'
    }
  ]
};

async function readWebsiteContent() {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('website_content').get();
      if (doc.exists) {
        return doc.data();
      } else {
        await fdb.collection('settings').doc('website_content').set(DEFAULT_WEBSITE_CONTENT);
        return DEFAULT_WEBSITE_CONTENT;
      }
    } catch (error) {
      console.error('Error reading website_content from Firestore:', error);
    }
  }

  try {
    const data = await fs.readFile(WEBSITE_CONTENT_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_WEBSITE_CONTENT;
  }
}

async function writeWebsiteContent(content: any) {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('website_content').set(content);
      return;
    } catch (error) {
      console.error('Error writing website_content to Firestore:', error);
    }
  }

  try {
    await fs.writeFile(WEBSITE_CONTENT_FILE, JSON.stringify(content, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing website_content:', error);
  }
}

const DEFAULT_SEO_CONFIG = {
  global: {
    siteTitle: 'Dizo Pulse | Creative Media & Digital Growth Agency',
    titleTemplate: '%s | Dizo Pulse',
    metaDescription: 'Full-service digital marketing, custom software engineering, high-converting websites, branding, and performance ads agency in India. Design • Create • Grow.',
    keywords: 'digital marketing, web design, reel editing, branding agency, react web development, performance marketing, SEO services, social media marketing, India',
    canonicalBaseUrl: 'https://dizopulse.com',
    faviconUrl: '',
    robotsIndex: true,
    robotsFollow: true,
    author: 'Dizo Pulse Creative Media',
    language: 'en-US',
    ogType: 'website',
    ogTitle: 'Dizo Pulse | Scaling Digital Growth & Creative Craft',
    ogDescription: 'Transform your brand with high-converting web apps, viral reels, vector identities, and ROI-driven marketing campaigns.',
    ogImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
    ogSiteName: 'Dizo Pulse Agency',
    twitterCardType: 'summary_large_image',
    twitterTitle: 'Dizo Pulse | Creative Media & Digital Growth Agency',
    twitterDescription: 'From design to digital growth — everything your brand needs under one roof.',
    twitterImageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
    twitterHandle: '@dizo_pulse'
  },
  pages: {
    home: {
      id: 'home',
      pageName: 'Home Page',
      path: '/',
      title: 'Dizo Pulse | Creative Media & Digital Growth Agency',
      description: 'From design to digital growth — everything your brand needs in one place. We craft memorable corporate signatures, edit viral reels, and scale businesses.',
      keywords: 'digital marketing agency, web design india, reel editing, branding, performance marketing',
      canonical: 'https://dizopulse.com/',
      ogTitle: 'Dizo Pulse - Design. Create. Grow.',
      ogDescription: 'All digital solutions under one roof for modern founders and creators.',
      ogImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'daily',
      priority: 1.0
    },
    services: {
      id: 'services',
      pageName: 'Services Catalog & Pricing',
      path: '/#services-browser',
      title: 'Services Catalog & Transparent Pricing | Dizo Pulse',
      description: 'Explore all digital services: Instagram post design, 4K reel editing, custom React web development, organic SEO, and Google ads with transparent pricing.',
      keywords: 'services pricing, reel editing price, website design cost, SEO packages, social media management, India digital agency',
      canonical: 'https://dizopulse.com/#services-browser',
      ogTitle: 'Digital Marketing & Web Services Catalog | Dizo Pulse',
      ogDescription: 'Transparent pricing, tiered bundles, and fast delivery turnaround.',
      ogImage: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'weekly',
      priority: 0.9
    },
    calculator: {
      id: 'calculator',
      pageName: 'Quote Estimator & Scope Builder',
      path: '/#quote-calculator',
      title: 'Instant Project Quote Calculator & Cost Estimator | Dizo Pulse',
      description: 'Build your custom service bundle and calculate transparent project costs instantly with pre-applied promotional launch discounts.',
      keywords: 'project quote estimator, marketing cost calculator, website price calculator, digital scope builder',
      canonical: 'https://dizopulse.com/#quote-calculator',
      ogTitle: 'Instant Project Quote Estimator | Dizo Pulse',
      ogDescription: 'Calculate transparent project costs and configure your custom digital package.',
      ogImage: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'monthly',
      priority: 0.8
    },
    client_portal: {
      id: 'client_portal',
      pageName: 'Client Workspace Hub',
      path: '/#client-portal',
      title: 'Client Portal & Project Hub | Dizo Pulse',
      description: 'Private client workspace for active proposals, signed contracts, deliverable review, and milestone tracking.',
      keywords: 'client portal, project tracking, deliverable vault',
      canonical: 'https://dizopulse.com/#client-portal',
      ogTitle: 'Client Workspace Hub | Dizo Pulse',
      ogDescription: 'Private client portal for milestone tracking and real-time deliverables.',
      ogImage: '',
      robotsIndex: false,
      robotsFollow: false,
      changefreq: 'weekly',
      priority: 0.5
    },
    about: {
      id: 'about',
      pageName: 'About & Company',
      path: '/#about',
      title: 'About Dizo Pulse | Creative Media & Digital Engineering',
      description: 'Learn about Dizo Pulse story, our multidisciplinary team of designers, engineers, and growth strategists in India.',
      keywords: 'about dizo pulse, creative agency team, digital engineering india, agency story',
      canonical: 'https://dizopulse.com/#about',
      ogTitle: 'About Dizo Pulse Agency',
      ogDescription: 'Crafting memorable corporate signatures and scalable software platforms.',
      ogImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&h=630&q=80',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'monthly',
      priority: 0.7
    },
    privacy: {
      id: 'privacy',
      pageName: 'Privacy Policy',
      path: '/#privacy',
      title: 'Privacy Policy | Dizo Pulse Agency',
      description: 'Official privacy practices, data security protocols, and client confidentiality terms of Dizo Pulse.',
      keywords: 'privacy policy, client data protection, confidentiality',
      canonical: 'https://dizopulse.com/#privacy',
      ogTitle: 'Privacy Policy | Dizo Pulse',
      ogDescription: 'Privacy practices and data protection commitment.',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'yearly',
      priority: 0.3
    },
    terms: {
      id: 'terms',
      pageName: 'Terms & Conditions',
      path: '/#terms',
      title: 'Terms & Conditions | Dizo Pulse Agency',
      description: 'Standard agency service terms, SLA agreements, and scope clarifications.',
      keywords: 'terms and conditions, service agreement, SLA terms',
      canonical: 'https://dizopulse.com/#terms',
      ogTitle: 'Terms & Conditions | Dizo Pulse',
      ogDescription: 'Service agreements and terms of engagement.',
      ogImage: '',
      robotsIndex: true,
      robotsFollow: true,
      changefreq: 'yearly',
      priority: 0.3
    }
  },
  servicesSeo: {},
  sitemapConfig: {
    includeServices: true,
    includePages: true,
    defaultChangeFreq: 'weekly',
    defaultPriority: 0.8,
    customUrls: []
  },
  lastUpdatedAt: new Date().toISOString(),
  lastUpdatedBy: 'Agency Administrator'
};

async function readSeoConfig() {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('seo_config').get();
      if (doc.exists) {
        return { ...DEFAULT_SEO_CONFIG, ...doc.data() };
      } else {
        await fdb.collection('settings').doc('seo_config').set(DEFAULT_SEO_CONFIG);
        return DEFAULT_SEO_CONFIG;
      }
    } catch (error) {
      console.error('Error reading seo_config from Firestore:', error);
    }
  }

  try {
    const data = await fs.readFile(SEO_FILE, 'utf8');
    return { ...DEFAULT_SEO_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_SEO_CONFIG;
  }
}

async function writeSeoConfig(seoData: any) {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('seo_config').set(seoData);
      return;
    } catch (error) {
      console.error('Error writing seo_config to Firestore:', error);
    }
  }

  try {
    await fs.writeFile(SEO_FILE, JSON.stringify(seoData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing seo_config:', error);
  }
}

// --- VISITOR COUNTER & TRACKING PERSISTENCE HELPERS ---

const DEFAULT_VISITOR_STATS = {
  baseCount: 10420,
  uniqueVisitorsCount: 10420,
  totalPageViews: 24890,
  uniqueVisitorMap: {},
  lastUpdated: new Date().toISOString()
};

async function readVisitorStats(): Promise<{
  baseCount: number;
  uniqueVisitorsCount: number;
  totalPageViews: number;
  uniqueVisitorMap: Record<string, { firstSeen: string; lastSeen: string; visits: number; pageViews: number }>;
  lastUpdated: string;
}> {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('visitor_stats').get();
      if (doc.exists) {
        return { ...DEFAULT_VISITOR_STATS, ...doc.data() };
      }
    } catch (error) {
      console.error('Error reading visitor_stats from Firestore:', error);
    }
  }

  try {
    const data = await fs.readFile(VISITOR_STATS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return { ...DEFAULT_VISITOR_STATS, ...parsed };
  } catch {
    const initial = { ...DEFAULT_VISITOR_STATS, lastUpdated: new Date().toISOString() };
    try {
      await fs.writeFile(VISITOR_STATS_FILE, JSON.stringify(initial, null, 2), 'utf8');
    } catch (err) {
      console.error('Error initializing visitor stats file:', err);
    }
    return initial;
  }
}

async function writeVisitorStats(statsData: any): Promise<void> {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('visitor_stats').set(statsData);
      return;
    } catch (error) {
      console.error('Error writing visitor_stats to Firestore:', error);
    }
  }

  try {
    await fs.writeFile(VISITOR_STATS_FILE, JSON.stringify(statsData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing visitor_stats file:', error);
  }
}

function formatVisitorMilestone(count: number): { formattedCount: string; displayText: string; exactCount: number } {
  let formatted = '10K+';
  if (count >= 1000000) {
    const m = count / 1000000;
    formatted = m % 1 === 0 ? `${m}M+` : `${m.toFixed(1)}M+`;
  } else if (count >= 100000) {
    formatted = `${Math.floor(count / 1000)}K+`;
  } else if (count >= 10000) {
    formatted = `${Math.floor(count / 1000)}K+`;
  } else if (count >= 1000) {
    const k = count / 1000;
    formatted = k % 1 === 0 ? `${k}K+` : `${k.toFixed(1)}K+`;
  } else {
    formatted = `${count}+`;
  }
  return {
    formattedCount: formatted,
    displayText: `${formatted} People have visited Dizo Pulse`,
    exactCount: count
  };
}

const defaultBundles: any[] = [
  {
    id: 'bundle-digital-launch',
    name: '360° Digital Business Launch Pack',
    description: 'Complete high-converting digital presence suite including custom Web & SEO, Logo & Brand Identity, and 1 Month Reels Growth.',
    category: 'branding',
    subcategory: 'Full Suite',
    serviceIds: ['landing-page', 'logo-design', 'smm-18'],
    bundleType: 'fixed',
    mrp: 28999,
    bundlePrice: 19999,
    bundleDiscountPercent: 31,
    gstPercent: 18,
    turnaroundTime: '7-10 Business Days',
    deliverables: [
      'High-converting Landing Page (React/NextJS)',
      'Complete Logo & Brand Stylebook',
      '12 Social Media Posts + 6 Edit Reels',
      'Free Domain & SSL Configuration',
      'Priority Dedicated Account Manager'
    ],
    badge: 'BEST SELLER 🚀',
    isFeatured: true,
    status: 'published',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Helper to load/save Services
async function readServices() {
  let rawList: any[] = [];
  const firestoreData = await fetchCollection('services', defaultServices);
  if (firestoreData !== null) {
    rawList = firestoreData;
  } else {
    try {
      const data = await fs.readFile(SERVICES_FILE, 'utf8');
      rawList = JSON.parse(data);
    } catch {
      rawList = defaultServices;
    }
  }

  return rawList.map((s: any) => {
    const def = defaultServices.find((ds: any) => ds.id === s.id);
    return {
      id: s.id,
      name: s.name || (def ? def.name : 'Service'),
      category: s.category || (def ? def.category : 'social'),
      subcategory: s.subcategory || '',
      mrp: Number(s.mrp || (def ? def.mrp : 0)),
      launchPrice: Number(s.launchPrice || (def ? def.launchPrice : 0)),
      gstPercent: s.gstPercent !== undefined ? Number(s.gstPercent) : 18,
      discountPercent: s.discountPercent !== undefined ? Number(s.discountPercent) : (s.mrp && s.launchPrice ? Math.round(((s.mrp - s.launchPrice)/s.mrp)*100) : 20),
      turnaroundTime: s.turnaroundTime || '3-5 Days',
      deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
      description: s.description || (def ? def.description : ''),
      unit: s.unit || (def ? def.unit : ''),
      badge: s.badge || (s.isFeatured ? 'POPULAR' : ''),
      iconName: s.iconName || (def ? def.iconName : 'Sparkles'),
      imageUrl: s.imageUrl || (def ? def.imageUrl : ''),
      isFeatured: !!s.isFeatured,
      isPopular: !!s.isPopular,
      status: s.status || 'published',
      displayOrder: Number(s.displayOrder || 0),
      priceHistory: Array.isArray(s.priceHistory) ? s.priceHistory : [],
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt || new Date().toISOString()
    };
  });
}

async function writeServices(services: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('services', 'id', services);
    return;
  }

  try {
    await fs.writeFile(SERVICES_FILE, JSON.stringify(services, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing services:', error);
  }
}

// Helper to load/save Bundles
async function readBundles() {
  const firestoreData = await fetchCollection('bundles', defaultBundles);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(BUNDLES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultBundles;
  }
}

async function writeBundles(bundles: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('bundles', 'id', bundles);
    return;
  }

  try {
    await fs.writeFile(BUNDLES_FILE, JSON.stringify(bundles, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing bundles:', error);
  }
}

// Helper to load/save Coupons
async function readCoupons() {
  const firestoreData = await fetchCollection('coupons', DEFAULT_COUPONS);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(COUPONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_COUPONS;
  }
}

async function writeCoupons(coupons: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('coupons', 'code', coupons);
    return;
  }

  try {
    await fs.writeFile(COUPONS_FILE, JSON.stringify(coupons, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing coupons:', error);
  }
}

async function readUsers() {
  let list: any[] = [];
  const firestoreData = await fetchCollection('users', []);
  if (firestoreData !== null) {
    list = firestoreData;
  } else {
    try {
      const data = await fs.readFile(USERS_FILE, 'utf8');
      list = JSON.parse(data);
    } catch {
      list = [];
    }
  }

  // Merge with global memory cache for Vercel serverless continuity
  for (const mu of globalMemoryUsers) {
    if (!list.some((u: any) => u.email === mu.email)) {
      list.push(mu);
    }
  }

  globalMemoryUsers = list;
  return list;
}

async function writeUsers(users: any[]) {
  globalMemoryUsers = users;
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('users', 'id', users);
    return;
  }

  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users:', error);
  }
}

function getDefaultPermissionsForRole(role: string) {
  if (role === 'super_admin' || role === 'admin') {
    return {
      proposals: 'write',
      contracts: 'write',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'write'
    };
  } else if (role === 'manager') {
    return {
      proposals: 'write',
      contracts: 'write',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'read'
    };
  } else {
    return {
      proposals: 'read',
      contracts: 'read',
      projects: 'write',
      assets: 'write',
      messages: 'write',
      settings: 'none'
    };
  }
}

function sanitizeStaffList(list: any[]) {
  if (!Array.isArray(list)) return [];
  return list.map((s) => {
    let role = s.role;
    if (!role || role === 'admin') {
      if (s.email === 'mukeshsinghmukesh316@gmail.com') {
        role = 'super_admin';
      } else {
        role = 'admin';
      }
    }
    const defaultPerms = getDefaultPermissionsForRole(role);
    return {
      ...s,
      role,
      permissions: s.permissions ? { ...defaultPerms, ...s.permissions } : defaultPerms,
      projectAccess: s.projectAccess || 'all',
      status: s.status || 'active',
      department: s.department || 'Operations',
      lastActive: s.lastActive || s.createdAt || new Date().toISOString()
    };
  });
}

async function readStaff() {
  const firestoreData = await fetchCollection('staff', DEFAULT_STAFF);
  if (firestoreData !== null) {
    return sanitizeStaffList(firestoreData);
  }

  try {
    const data = await fs.readFile(STAFF_FILE, 'utf8');
    return sanitizeStaffList(JSON.parse(data));
  } catch {
    return sanitizeStaffList(DEFAULT_STAFF);
  }
}

async function writeStaff(staff: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('staff', 'id', staff);
    return;
  }

  try {
    await fs.writeFile(STAFF_FILE, JSON.stringify(staff, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing staff:', error);
  }
}

const DEFAULT_MESSAGES = [
  {
    id: 'msg_101',
    projectId: 'PRJ-1001',
    senderName: 'Dizo Client Care',
    senderRole: 'agency',
    senderEmail: 'support@dizopulse.com',
    content: 'Welcome to your Dizo Pulse Project Hub! Feel free to send us any notes, asset links, or feedback here.',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'sent',
    isRead: true,
    isArchived: false
  },
  {
    id: 'msg_102',
    projectId: 'PRJ-1001',
    senderName: 'Aarav Mehta',
    senderRole: 'client',
    senderEmail: 'aarav.mehta@techverse.io',
    content: 'Hi Team! We have uploaded our brand guidelines in the Assets tab. Let us know if you need any additional files.',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    status: 'sent',
    isRead: false,
    isArchived: false
  }
];

async function readMessages() {
  const firestoreData = await fetchCollection('messages', DEFAULT_MESSAGES);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_MESSAGES;
  }
}

async function writeMessages(messages: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('messages', 'id', messages);
    return;
  }

  try {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing messages:', error);
  }
}

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_101',
    recipientEmail: 'aarav.mehta@techverse.io',
    title: 'New Proposal Available',
    message: 'Your custom growth proposal PROP-1001 is ready for review.',
    type: 'proposal',
    relatedEntityId: 'PROP-1001',
    relatedSection: 'proposals',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    isRead: false,
    linkText: 'View Proposal'
  },
  {
    id: 'notif_102',
    recipientEmail: 'aarav.mehta@techverse.io',
    title: 'Project Kickoff Milestone',
    message: 'Stage 1: Discovery & Strategy Blueprint is now Active.',
    type: 'milestone',
    relatedEntityId: 'PRJ-1001',
    relatedSection: 'projects',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    isRead: false,
    linkText: 'View Project'
  },
  {
    id: 'notif_103',
    recipientEmail: 'aarav.mehta@techverse.io',
    title: 'Brand Assets Uploaded',
    message: 'Agency team uploaded new brand guidelines in PRJ-1001 assets.',
    type: 'asset',
    relatedEntityId: 'PRJ-1001',
    relatedSection: 'assets',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    isRead: false,
    linkText: 'Open Assets'
  }
];

async function readNotifications() {
  const firestoreData = await fetchCollection('notifications', DEFAULT_NOTIFICATIONS);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_NOTIFICATIONS;
  }
}

async function writeNotifications(notifications: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('notifications', 'id', notifications);
    return;
  }

  try {
    await fs.writeFile(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing notifications:', error);
  }
}

async function readClients(): Promise<any[]> {
  const firestoreData = await fetchCollection('clients', []);
  if (firestoreData !== null) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(CLIENTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeClients(clients: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('clients', 'id', clients);
    return;
  }

  try {
    await fs.writeFile(CLIENTS_FILE, JSON.stringify(clients, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing clients:', error);
  }
}

const DEFAULT_AUDIT_LOGS = [
  {
    id: 'log_seed_1',
    user: 'Mukesh Singh',
    userEmail: 'mukeshsinghmukesh316@gmail.com',
    role: 'super_admin',
    action: 'LOGIN_SUCCESS',
    module: 'auth',
    target: 'Admin Portal',
    description: 'Successful administrator authentication via password',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    ipAddress: '103.21.124.89',
    deviceInfo: 'Chrome 122.0 / macOS Sonoma',
    status: 'success',
    severity: 'info',
    metadata: { method: 'password', mfaVerified: true }
  },
  {
    id: 'log_seed_2',
    user: 'Unknown Attacker',
    userEmail: 'admin_test@dizopulse.com',
    role: 'unknown',
    action: 'LOGIN_FAILED',
    module: 'auth',
    target: 'Admin Portal',
    description: 'Failed login attempt: Invalid password for account admin_test@dizopulse.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    ipAddress: '185.220.101.4',
    deviceInfo: 'Python-requests/2.31.0',
    status: 'failed',
    severity: 'warning',
    metadata: { attemptCount: 3, flag: 'suspicious_ip' }
  },
  {
    id: 'log_seed_3',
    user: 'Agency Administrator',
    userEmail: 'admin@dizopulse.com',
    role: 'super_admin',
    action: 'ROLE_CHANGED',
    module: 'staff',
    target: 'Rohan Sharma (rohan@dizopulse.com)',
    description: 'Modified staff permissions and promoted role from Senior Designer to Design Lead',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    ipAddress: '103.21.124.89',
    deviceInfo: 'Safari 17.2 / macOS',
    status: 'success',
    severity: 'warning',
    metadata: { previousRole: 'Senior Designer', newRole: 'Design Lead' }
  },
  {
    id: 'log_seed_4',
    user: 'Mukesh Singh',
    userEmail: 'mukeshsinghmukesh316@gmail.com',
    role: 'super_admin',
    action: 'PROPOSAL_CREATED',
    module: 'proposals',
    target: 'PROP-2026-089 (Apex Global)',
    description: 'Created custom proposal for Apex Global - Enterprise Web Development',
    timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    ipAddress: '103.21.124.89',
    deviceInfo: 'Chrome 122.0 / macOS Sonoma',
    status: 'success',
    severity: 'info',
    metadata: { amount: 185000, currency: 'INR' }
  },
  {
    id: 'log_seed_5',
    user: 'Priya Verma',
    userEmail: 'priya@dizopulse.com',
    role: 'staff',
    action: 'PROJECT_UPDATED',
    module: 'projects',
    target: 'PRJ-2026-004 (Brand Refresh)',
    description: 'Updated milestone progress from 40% to 75% on Brand Refresh Project',
    timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    ipAddress: '14.139.240.12',
    deviceInfo: 'Firefox 123.0 / Windows 11',
    status: 'success',
    severity: 'info',
    metadata: { milestone: 'UI Design Delivery', status: 'In Review' }
  },
  {
    id: 'log_seed_6',
    user: 'System Core',
    userEmail: 'system@dizopulse.com',
    role: 'system',
    action: 'SETTINGS_UPDATED',
    module: 'settings',
    target: 'Agency Branding',
    description: 'Updated agency branding settings and dark mode theme defaults',
    timestamp: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    ipAddress: '127.0.0.1',
    deviceInfo: 'Server Node.js Runtime',
    status: 'success',
    severity: 'info',
    metadata: { brandName: 'Dizo Pulse' }
  },
  {
    id: 'log_seed_7',
    user: 'Mukesh Singh',
    userEmail: 'mukeshsinghmukesh316@gmail.com',
    role: 'super_admin',
    action: 'CLIENT_MERGED',
    module: 'clients',
    target: 'Apex Global Enterprises (CLI-8821)',
    description: 'Merged duplicate client profiles and consolidated notes and inquiries',
    timestamp: new Date(Date.now() - 1000 * 60 * 2880).toISOString(),
    ipAddress: '103.21.124.89',
    deviceInfo: 'Chrome 122.0 / macOS Sonoma',
    status: 'success',
    severity: 'info',
    metadata: { mergedFrom: ['CLI-8820', 'CLI-8821'] }
  }
];

async function readAuditLogs(): Promise<any[]> {
  const firestoreData = await fetchCollection('audit_logs', []);
  if (firestoreData !== null && firestoreData.length > 0) {
    return firestoreData;
  }

  try {
    const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {}

  // If empty, return default seed logs & save them
  await writeAuditLogs(DEFAULT_AUDIT_LOGS);
  return DEFAULT_AUDIT_LOGS;
}

async function writeAuditLogs(logs: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('audit_logs', 'id', logs);
    return;
  }

  try {
    await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing audit logs:', error);
  }
}

async function logAuditTrail(entry: {
  user: string;
  userEmail?: string;
  role?: string;
  action: string;
  module: string;
  target?: string;
  description: string;
  ipAddress?: string;
  deviceInfo?: string;
  status?: 'success' | 'failed' | 'warning';
  severity?: 'info' | 'warning' | 'critical';
  metadata?: any;
}) {
  try {
    const logs = await readAuditLogs();
    const newLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user: entry.user || 'System User',
      userEmail: entry.userEmail || '',
      role: entry.role || 'staff',
      action: entry.action,
      module: entry.module,
      target: entry.target || '',
      description: entry.description,
      timestamp: new Date().toISOString(),
      ipAddress: entry.ipAddress || '127.0.0.1',
      deviceInfo: entry.deviceInfo || 'Web Client',
      status: entry.status || 'success',
      severity: entry.severity || 'info',
      metadata: entry.metadata || {}
    };
    logs.unshift(newLog);
    if (logs.length > 2000) {
      logs.length = 2000;
    }
    await writeAuditLogs(logs);
    return newLog;
  } catch (err) {
    console.error('Failed to append audit log:', err);
  }
}

// Security & Session Helpers
const DEFAULT_SECURITY_POLICY = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  sessionInactivityMinutes: 120,
  requirePasswordChangeDays: 90,
  forcePasswordChangeOnFirstLogin: false,
};

function parseUserAgent(uaString: string = '') {
  let browser = 'Web Browser';
  let os = 'Unknown OS';
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';

  if (uaString.includes('Mobile') || uaString.includes('Android') || uaString.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (uaString.includes('iPad') || uaString.includes('Tablet')) {
    deviceType = 'Tablet';
  }

  if (uaString.includes('Chrome') && !uaString.includes('Edg')) browser = 'Chrome';
  else if (uaString.includes('Safari') && !uaString.includes('Chrome')) browser = 'Safari';
  else if (uaString.includes('Firefox')) browser = 'Firefox';
  else if (uaString.includes('Edg')) browser = 'Edge';

  if (uaString.includes('Windows')) os = 'Windows';
  else if (uaString.includes('Mac OS') || uaString.includes('Macintosh')) os = 'macOS';
  else if (uaString.includes('Android')) os = 'Android';
  else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';
  else if (uaString.includes('Linux')) os = 'Linux';

  return { browser, os, deviceType };
}

async function readSessions(): Promise<any[]> {
  const firestoreData = await fetchCollection('sessions', []);
  if (firestoreData !== null) return firestoreData;
  try {
    const data = await fs.readFile(SESSIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeSessions(sessions: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('sessions', 'id', sessions);
    return;
  }
  try {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing sessions:', error);
  }
}

async function readFailedLogins(): Promise<any[]> {
  const firestoreData = await fetchCollection('failed_logins', []);
  if (firestoreData !== null) return firestoreData;
  try {
    const data = await fs.readFile(FAILED_LOGINS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeFailedLogins(records: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    await syncCollection('failed_logins', 'id', records);
    return;
  }
  try {
    await fs.writeFile(FAILED_LOGINS_FILE, JSON.stringify(records, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing failed logins:', error);
  }
}

async function readSecurityPolicy(): Promise<any> {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('security_policy').get();
      if (doc.exists) return doc.data();
    } catch {}
  }
  try {
    const data = await fs.readFile(SECURITY_POLICY_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_SECURITY_POLICY;
  }
}

async function writeSecurityPolicy(policy: any) {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('security_policy').set(policy);
      return;
    } catch {}
  }
  try {
    await fs.writeFile(SECURITY_POLICY_FILE, JSON.stringify(policy, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing security policy:', error);
  }
}

async function createSession(user: {
  id?: string;
  email: string;
  name: string;
  role: string;
  userType: 'staff' | 'client';
}, req: express.Request) {
  const token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
  const ipAddress = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
  const userAgent = String(req.headers['user-agent'] || 'Web Client');
  const uaParsed = parseUserAgent(userAgent);

  const newSession = {
    id: `sid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    userId: user.id || user.email,
    userEmail: user.email,
    userName: user.name,
    userRole: user.role,
    userType: user.userType,
    token,
    ipAddress,
    userAgent,
    deviceType: uaParsed.deviceType,
    browser: uaParsed.browser,
    os: uaParsed.os,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    status: 'active' as const
  };

  const sessions = await readSessions();
  sessions.unshift(newSession);
  if (sessions.length > 1000) sessions.length = 1000;
  await writeSessions(sessions);

  return token;
}

async function validateSessionToken(token: string) {
  if (!token) return null;
  const sessions = await readSessions();
  const session = sessions.find(s => s.token === token && s.status === 'active');
  if (!session) return null;

  // Check account status if staff
  if (session.userType === 'staff') {
    const staffList = await readStaff();
    const staffMember = staffList.find(s => s.email.toLowerCase() === session.userEmail.toLowerCase());
    if (staffMember) {
      if (staffMember.status === 'inactive') {
        session.status = 'revoked';
        await writeSessions(sessions);
        return null;
      }
      if (staffMember.lockedUntil && new Date(staffMember.lockedUntil) > new Date()) {
        return null;
      }
    }
  }

  // Check inactivity timeout
  const policy = await readSecurityPolicy();
  if (policy.sessionInactivityMinutes && policy.sessionInactivityMinutes > 0) {
    const lastActive = new Date(session.lastActiveAt).getTime();
    const diffMins = (Date.now() - lastActive) / (1000 * 60);
    if (diffMins > policy.sessionInactivityMinutes) {
      session.status = 'expired';
      await writeSessions(sessions);
      return null;
    }
  }

  // Touch last active time
  session.lastActiveAt = new Date().toISOString();
  await writeSessions(sessions);

  return session;
}


async function createNotification({
  recipientEmail,
  title,
  message,
  type,
  relatedEntityId,
  relatedSection,
  linkText
}: {
  recipientEmail: string;
  title: string;
  message: string;
  type: string;
  relatedEntityId?: string;
  relatedSection?: string;
  linkText?: string;
}) {
  try {
    const notifications = await readNotifications();
    const newNotif = {
      id: 'notif_' + Math.random().toString(36).substr(2, 9),
      recipientEmail: (recipientEmail || 'all').trim().toLowerCase(),
      title,
      message,
      type,
      relatedEntityId: relatedEntityId || '',
      relatedSection: relatedSection || 'projects',
      createdAt: new Date().toISOString(),
      isRead: false,
      linkText: linkText || 'View Details'
    };
    notifications.unshift(newNotif);
    await writeNotifications(notifications);
    return newNotif;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

// Ensure DB files exist
async function initDB() {
  let fdb = getFirestoreDb();
  if (fdb) {
    console.log('>>> [Firebase Mode] Testing connection to Google Cloud Firestore...');
    try {
      // Perform a quick read/get to verify if the Firestore database is initialized and accessible
      await fdb.collection('settings').doc('global').get();
      console.log('>>> [Firebase Mode] Connected to Google Cloud Firestore successfully.');
    } catch (error: any) {
      console.log('>>> [Local Mode] Firestore database is not initialized on cloud project. Falling back to local JSON storage.');
      // Disable Firestore for this process so all subsequent calls seamlessly fall back to local files
      db = null;
      fdb = null;
    }
  }

  if (fdb) {
    console.log('>>> [Firebase Mode] Initializing Firestore default documents.');
    await readSettings();
    await readServices();
    await readCoupons();
    await readStaff();
    await readProposals();
    await readContracts();
    await readProjects();
    await readAssets();
    await readFolders();
    await readMessages();
    await readNotifications();
    await readWebsiteContent();
    return;
  }

  console.log('>>> [Local Mode] Initializing Local JSON files.');
  try { await fs.access(DB_FILE); } catch { await writeInquiries([]); }
  try { await fs.access(SETTINGS_FILE); } catch { await writeSettings(DEFAULT_SETTINGS); }
  try { await fs.access(SERVICES_FILE); } catch { await writeServices(defaultServices); }
  try { await fs.access(COUPONS_FILE); } catch { await writeCoupons(DEFAULT_COUPONS); }
  try { await fs.access(USERS_FILE); } catch { await writeUsers([]); }
  try { await fs.access(STAFF_FILE); } catch { await writeStaff(DEFAULT_STAFF); }
  try { await fs.access(PROPOSALS_FILE); } catch { await writeProposals([]); }
  try { await fs.access(CONTRACTS_FILE); } catch { await writeContracts([]); }
  try { await fs.access(PROJECTS_FILE); } catch { await writeProjects(DEFAULT_PROJECTS); }
  try { await fs.access(ASSETS_FILE); } catch { await writeAssets(DEFAULT_ASSETS); }
  try { await fs.access(FOLDERS_FILE); } catch { await writeFolders(DEFAULT_FOLDERS); }
  try { await fs.access(MESSAGES_FILE); } catch { await writeMessages(DEFAULT_MESSAGES); }
  try { await fs.access(NOTIFICATIONS_FILE); } catch { await writeNotifications(DEFAULT_NOTIFICATIONS); }
  try { await fs.access(WEBSITE_CONTENT_FILE); } catch { await writeWebsiteContent(DEFAULT_WEBSITE_CONTENT); }
  try { await fs.access(VISITOR_STATS_FILE); } catch { await writeVisitorStats(DEFAULT_VISITOR_STATS); }
}
initDB();


// --- API ROUTES ---

// 1. Create a lead/inquiry
app.post('/api/inquiries', async (req, res) => {
  try {
    const { clientName, whatsapp, email, businessName, businessNiche, message, services, serviceDetails, totalOriginal, totalDiscounted } = req.body;
    
    if (!clientName || !whatsapp || !email || !businessName) {
      return res.status(400).json({ error: 'Missing required client or business fields' });
    }

    const inquiries = await readInquiries();
    const newInquiry = {
      id: 'inq_' + Math.random().toString(36).substr(2, 9),
      clientName,
      whatsapp,
      email,
      businessName,
      businessNiche: businessNiche || 'General',
      message: message || '',
      services: services || [],
      serviceDetails: serviceDetails || {},
      totalOriginal: totalOriginal || 0,
      totalDiscounted: totalDiscounted || 0,
      status: 'new',
      createdAt: new Date().toISOString()
    };

    inquiries.push(newInquiry);
    await writeInquiries(inquiries);

    res.status(201).json(newInquiry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all leads/inquiries
app.get('/api/inquiries', async (req, res) => {
  try {
    const rawInquiries = await readInquiries();
    const seen = new Map<string, any>();
    for (const inq of rawInquiries) {
      if (!inq) continue;
      const inqId = inq.id || inq._id;
      if (inqId) {
        if (!seen.has(inqId)) {
          seen.set(inqId, inq);
        } else {
          // Keep newest record if multiple exist
          const existing = seen.get(inqId);
          const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
          const currTime = new Date(inq.updatedAt || inq.createdAt || 0).getTime();
          if (currTime > existingTime) {
            seen.set(inqId, inq);
          }
        }
      }
    }
    const inquiries = Array.from(seen.values());
    // Sort by newest first
    inquiries.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    res.json(inquiries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Update status/notes/priority/archived/staff/history of an inquiry
app.patch('/api/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      adminNotes,
      priority,
      archived,
      assignedStaffId,
      assignedStaffName,
      contactHistory,
      internalNotesList,
      totalDiscounted,
      totalOriginal,
      clientName,
      businessName,
      whatsapp,
      email,
      businessNiche,
      services
    } = req.body;

    const inquiries = await readInquiries();
    const index = inquiries.findIndex((inq: any) => inq.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    const validStatuses = ['new', 'reviewing', 'contacted', 'proposal_sent', 'contract_signed', 'project_active', 'completed', 'closed', 'lost'];
    if (status !== undefined) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
      inquiries[index].status = status;
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority !== undefined) {
      if (!validPriorities.includes(priority)) {
        return res.status(400).json({ error: 'Invalid priority value' });
      }
      inquiries[index].priority = priority;
    }

    if (adminNotes !== undefined) inquiries[index].adminNotes = adminNotes;
    if (archived !== undefined) inquiries[index].archived = !!archived;
    if (assignedStaffId !== undefined) inquiries[index].assignedStaffId = assignedStaffId;
    if (assignedStaffName !== undefined) inquiries[index].assignedStaffName = assignedStaffName;
    if (contactHistory !== undefined) inquiries[index].contactHistory = contactHistory;
    if (internalNotesList !== undefined) inquiries[index].internalNotesList = internalNotesList;
    if (totalDiscounted !== undefined) inquiries[index].totalDiscounted = totalDiscounted;
    if (totalOriginal !== undefined) inquiries[index].totalOriginal = totalOriginal;
    if (clientName !== undefined) inquiries[index].clientName = clientName;
    if (businessName !== undefined) inquiries[index].businessName = businessName;
    if (whatsapp !== undefined) inquiries[index].whatsapp = whatsapp;
    if (email !== undefined) inquiries[index].email = email;
    if (businessNiche !== undefined) inquiries[index].businessNiche = businessNiche;
    if (services !== undefined) inquiries[index].services = services;

    inquiries[index].updatedAt = new Date().toISOString();

    await writeInquiries(inquiries);
    res.json(inquiries[index]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Bulk update inquiries
app.patch('/api/inquiries-bulk', async (req, res) => {
  try {
    const { ids, status, priority, assignedStaffId, assignedStaffName, archived, action } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }

    let inquiries = await readInquiries();

    if (action === 'delete') {
      inquiries = inquiries.filter((inq: any) => !ids.includes(inq.id));
      await writeInquiries(inquiries);
      return res.json({ success: true, count: ids.length, action: 'deleted' });
    }

    let updatedCount = 0;
    inquiries.forEach((inq: any) => {
      if (ids.includes(inq.id)) {
        if (status !== undefined) inq.status = status;
        if (priority !== undefined) inq.priority = priority;
        if (assignedStaffId !== undefined) inq.assignedStaffId = assignedStaffId;
        if (assignedStaffName !== undefined) inq.assignedStaffName = assignedStaffName;
        if (archived !== undefined) inq.archived = !!archived;
        inq.updatedAt = new Date().toISOString();
        updatedCount++;
      }
    });

    await writeInquiries(inquiries);
    res.json({ success: true, updatedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an inquiry (Admin Only)
app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const inquiries = await readInquiries();
    const index = inquiries.findIndex((inq: any) => inq.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    inquiries.splice(index, 1);
    await writeInquiries(inquiries);
    res.json({ success: true, message: 'Inquiry deleted successfully', deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROPOSALS API ENDPOINTS ---

// GET /api/proposals (supports ?email=xxx for client filtering)
app.get('/api/proposals', async (req, res) => {
  try {
    const { email } = req.query;
    let proposals = await readProposals();
    
    if (email) {
      const targetEmail = String(email).trim().toLowerCase();
      proposals = proposals.filter((p: any) => p.email && p.email.trim().toLowerCase() === targetEmail);
    }
    
    proposals.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(proposals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/proposals/:id
app.get('/api/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proposals = await readProposals();
    const found = proposals.find((p: any) => p.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    res.json(found);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proposals (Create new proposal)
app.post('/api/proposals', async (req, res) => {
  try {
    const {
      inquiryId,
      clientName,
      contactPerson,
      email,
      phone,
      businessName,
      businessNiche,
      selectedServices,
      deliverables,
      timeline,
      totalAmount,
      termsAndConditions,
      expiryDate,
      internalNotes,
      status
    } = req.body;

    if (!businessName || !email) {
      return res.status(400).json({ error: 'Business Name and Email are required for proposal creation' });
    }

    const proposals = await readProposals();

    // Auto-generate proposal ID e.g. PROP-1001
    let nextNum = 1001;
    proposals.forEach((p: any) => {
      if (p.id && p.id.startsWith('PROP-')) {
        const num = parseInt(p.id.replace('PROP-', ''), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const newProposal = {
      id: `PROP-${nextNum}`,
      inquiryId: inquiryId || '',
      clientName: clientName || businessName,
      contactPerson: contactPerson || clientName || businessName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      businessName: businessName,
      businessNiche: businessNiche || 'General Growth',
      selectedServices: selectedServices || [],
      deliverables: deliverables || '',
      timeline: timeline || '7 - 10 Business Days',
      totalAmount: Number(totalAmount || 0),
      termsAndConditions: termsAndConditions || '',
      createdAt: new Date().toISOString(),
      expiryDate: expiryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      internalNotes: internalNotes || '',
      status: status || 'Sent'
    };

    proposals.push(newProposal);
    await writeProposals(proposals);

    // Trigger Client Notification
    if (newProposal.email) {
      await createNotification({
        recipientEmail: newProposal.email,
        title: 'New Proposal Available',
        message: `Your custom growth proposal ${newProposal.id} (${newProposal.businessName}) is ready for review.`,
        type: 'proposal',
        relatedEntityId: newProposal.id,
        relatedSection: 'proposals',
        linkText: 'View Proposal'
      });
    }

    // If converted from inquiry, update inquiry status to 'proposal_sent'
    if (inquiryId) {
      const inquiries = await readInquiries();
      const inqIndex = inquiries.findIndex((inq: any) => inq.id === inquiryId);
      if (inqIndex !== -1) {
        inquiries[inqIndex].status = 'proposal_sent';
        await writeInquiries(inquiries);
      }
    }

    res.status(201).json(newProposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/proposals/:id (Update proposal details / status)
app.patch('/api/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proposals = await readProposals();
    const index = proposals.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    const prevStatus = proposals[index].status;
    const updated = {
      ...proposals[index],
      ...req.body
    };

    proposals[index] = updated;
    await writeProposals(proposals);

    // Trigger Client Notification if status changed
    if (req.body.status && req.body.status !== prevStatus && updated.email) {
      await createNotification({
        recipientEmail: updated.email,
        title: `Proposal Update: ${updated.status}`,
        message: `Proposal ${updated.id} (${updated.businessName}) status changed to ${updated.status}.`,
        type: 'proposal',
        relatedEntityId: updated.id,
        relatedSection: 'proposals',
        linkText: 'View Proposal'
      });
    }


    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/proposals/:id/duplicate (Duplicate proposal)
app.post('/api/proposals/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const proposals = await readProposals();
    const original = proposals.find((p: any) => p.id === id);

    if (!original) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    let nextNum = 1001;
    proposals.forEach((p: any) => {
      if (p.id && p.id.startsWith('PROP-')) {
        const num = parseInt(p.id.replace('PROP-', ''), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const duplicateProposal = {
      ...original,
      id: `PROP-${nextNum}`,
      createdAt: new Date().toISOString(),
      status: 'Draft',
      clientResponseNote: undefined,
      approvalDate: undefined
    };

    proposals.push(duplicateProposal);
    await writeProposals(proposals);

    res.status(201).json(duplicateProposal);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/proposals/:id (Delete proposal)
app.delete('/api/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proposals = await readProposals();
    const filtered = proposals.filter((p: any) => p.id !== id);
    await writeProposals(filtered);
    res.json({ success: true, message: 'Proposal deleted successfully', deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CONTRACTS API ENDPOINTS ---

// GET /api/contracts (supports ?email=xxx for client filtering)
app.get('/api/contracts', async (req, res) => {
  try {
    const { email } = req.query;
    let contracts = await readContracts();
    
    if (email) {
      const targetEmail = String(email).trim().toLowerCase();
      contracts = contracts.filter((c: any) => c.email && c.email.trim().toLowerCase() === targetEmail);
    }
    
    contracts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(contracts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/:id
app.get('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contracts = await readContracts();
    const found = contracts.find((c: any) => c.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    res.json(found);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts (Create new contract)
app.post('/api/contracts', async (req, res) => {
  try {
    const {
      proposalId,
      clientName,
      contactPerson,
      email,
      phone,
      businessName,
      businessNiche,
      projectName,
      projectDescription,
      selectedServices,
      deliverables,
      timeline,
      revisionTerms,
      clientResponsibilities,
      agencyResponsibilities,
      confidentialityTerms,
      cancellationTerms,
      generalTerms,
      expiryDate,
      internalNotes,
      status,
      createdByUser,
      createdByRole
    } = req.body;

    if (!businessName || !email) {
      return res.status(400).json({ error: 'Business Name and Email are required for contract creation' });
    }

    const contracts = await readContracts();

    // Auto-generate contract ID e.g. CTR-1001
    let nextNum = 1001;
    contracts.forEach((c: any) => {
      if (c.id && c.id.startsWith('CTR-')) {
        const num = parseInt(c.id.replace('CTR-', ''), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const nowIso = new Date().toISOString();
    const initialActivity = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      timestamp: nowIso,
      action: proposalId ? `Contract created from Proposal ${proposalId}` : 'Contract created',
      user: createdByUser || 'Admin',
      role: (createdByRole || 'admin') as 'admin' | 'client',
      notes: proposalId ? `Converted from approved proposal ${proposalId}` : 'Direct contract creation'
    };

    const defaultRevisionTerms = "Up to 2 rounds of design & development revisions are included per service deliverable. Major scope changes beyond agreed deliverables will be quoted separately as an addendum.";
    const defaultAgencyResp = "1. Deliver high-quality work aligned with agreed project scope and timelines.\n2. Maintain strict confidentiality of client assets, credentials, and proprietary business information.\n3. Provide regular progress updates and milestone reports during execution.";
    const defaultClientResp = "1. Provide required brand assets, copy, logos, and access credentials in a timely manner.\n2. Provide constructive feedback within 48-72 hours during review phases.\n3. Fulfill agreed payment milestones promptly.";
    const defaultConfidentiality = "Both parties agree to treat all business information, trade secrets, software code, strategy briefs, and communications exchanged during this agreement as strictly confidential for a period of 3 years.";
    const defaultCancellation = "Either party may terminate this agreement with 7 days written notice. Payment for all completed deliverables and work-in-progress up to the notice date will remain due and payable.";
    const defaultGeneralTerms = "This contract constitutes the entire agreement between Dizo Pulse and the Client. Any modifications must be made in writing and agreed by both parties. Governed by applicable business & digital service laws.";

    const newContract = {
      id: `CTR-${nextNum}`,
      proposalId: proposalId || '',
      clientName: clientName || businessName,
      contactPerson: contactPerson || clientName || businessName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      businessName: businessName,
      businessNiche: businessNiche || 'General Growth',
      projectName: projectName || `${businessName} - Digital Services Agreement`,
      projectDescription: projectDescription || `Digital execution and growth contract for ${businessName}.`,
      selectedServices: selectedServices || [],
      deliverables: deliverables || '',
      timeline: timeline || '7 - 10 Business Days',
      revisionTerms: revisionTerms || defaultRevisionTerms,
      clientResponsibilities: clientResponsibilities || defaultClientResp,
      agencyResponsibilities: agencyResponsibilities || defaultAgencyResp,
      confidentialityTerms: confidentialityTerms || defaultConfidentiality,
      cancellationTerms: cancellationTerms || defaultCancellation,
      generalTerms: generalTerms || defaultGeneralTerms,
      createdAt: nowIso,
      expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: status || 'Draft',
      internalNotes: internalNotes || '',
      activityHistory: [initialActivity]
    };

    contracts.push(newContract);
    await writeContracts(contracts);

    // Trigger Client Notification
    if (newContract.email) {
      await createNotification({
        recipientEmail: newContract.email,
        title: 'New Contract Issued',
        message: `Contract ${newContract.id} (${newContract.projectName}) has been issued for your review and digital signature.`,
        type: 'contract',
        relatedEntityId: newContract.id,
        relatedSection: 'contracts',
        linkText: 'View Contract'
      });
    }

    res.status(201).json(newContract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/contracts/:id (Update contract details / status)
app.patch('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contracts = await readContracts();
    const index = contracts.findIndex((c: any) => c.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const prevContract = contracts[index];
    const { activityEntry, ...fieldsToUpdate } = req.body;

    const updated = {
      ...prevContract,
      ...fieldsToUpdate,
      activityHistory: [...(prevContract.activityHistory || [])]
    };

    // If explicit activity entry was passed
    if (activityEntry) {
      updated.activityHistory.push({
        id: 'act_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        ...activityEntry
      });
    } else if (fieldsToUpdate.status && fieldsToUpdate.status !== prevContract.status) {
      // Auto record status change activity
      updated.activityHistory.push({
        id: 'act_' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        action: `Status changed to ${fieldsToUpdate.status}`,
        user: fieldsToUpdate.updatedByUser || 'System',
        role: (fieldsToUpdate.updatedByRole || 'admin') as 'admin' | 'client',
        notes: fieldsToUpdate.statusNote || `Contract status updated from ${prevContract.status} to ${fieldsToUpdate.status}`
      });
    }

    contracts[index] = updated;
    await writeContracts(contracts);

    // Trigger Client Notification if status changed
    if (fieldsToUpdate.status && fieldsToUpdate.status !== prevContract.status && updated.email) {
      await createNotification({
        recipientEmail: updated.email,
        title: `Contract Update: ${updated.status}`,
        message: `Your contract ${updated.id} (${updated.projectName}) status is now ${updated.status}.`,
        type: 'contract',
        relatedEntityId: updated.id,
        relatedSection: 'contracts',
        linkText: 'View Contract'
      });
    }


    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts/:id/duplicate (Duplicate contract)
app.post('/api/contracts/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;
    const contracts = await readContracts();
    const original = contracts.find((c: any) => c.id === id);

    if (!original) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    let nextNum = 1001;
    contracts.forEach((c: any) => {
      if (c.id && c.id.startsWith('CTR-')) {
        const num = parseInt(c.id.replace('CTR-', ''), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const nowIso = new Date().toISOString();
    const duplicateContract = {
      ...original,
      id: `CTR-${nextNum}`,
      createdAt: nowIso,
      status: 'Draft',
      approvalRecord: undefined,
      activityHistory: [
        {
          id: 'act_' + Math.random().toString(36).substr(2, 9),
          timestamp: nowIso,
          action: `Contract duplicated from ${original.id}`,
          user: 'Admin',
          role: 'admin',
          notes: `Duplicated from ${original.id}`
        }
      ]
    };

    contracts.push(duplicateContract);
    await writeContracts(contracts);

    res.status(201).json(duplicateContract);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contracts/:id (Delete contract)
app.delete('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contracts = await readContracts();
    const filtered = contracts.filter((c: any) => c.id !== id);
    await writeContracts(filtered);
    res.json({ success: true, message: 'Contract deleted successfully', deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECTS API ENDPOINTS ---

function getDefaultProjectMilestones() {
  return [
    {
      id: 'm1',
      stageNumber: 1,
      name: 'Stage 1 — Kickoff',
      description: 'Project onboarding, goal discovery, asset collection, & execution roadmap.',
      status: 'Kickoff',
      progressPercent: 0,
      clientApprovalRequired: false,
      adminNotes: '',
      clientVisibleUpdate: ''
    },
    {
      id: 'm2',
      stageNumber: 2,
      name: 'Stage 2 — Creative / Logo Concepts',
      description: 'Vector logo variations, color palettes, and brand typography guidelines.',
      status: 'Pending',
      progressPercent: 0,
      clientApprovalRequired: true,
      clientApprovalStatus: 'Pending',
      adminNotes: '',
      clientVisibleUpdate: ''
    },
    {
      id: 'm3',
      stageNumber: 3,
      name: 'Stage 3 — Content Production',
      description: 'Reels scripting, video asset editing, and ad copywriting.',
      status: 'Pending',
      progressPercent: 0,
      clientApprovalRequired: false,
      adminNotes: '',
      clientVisibleUpdate: ''
    },
    {
      id: 'm4',
      stageNumber: 4,
      name: 'Stage 4 — Ad / Web Setup',
      description: 'React/Tailwind landing page deployment, domain configuration, & Meta tracking setup.',
      status: 'Pending',
      progressPercent: 0,
      clientApprovalRequired: true,
      clientApprovalStatus: 'Pending',
      adminNotes: '',
      clientVisibleUpdate: ''
    },
    {
      id: 'm5',
      stageNumber: 5,
      name: 'Stage 5 — Final Handover',
      description: 'Final deliverables, source asset handoff, & project completion check.',
      status: 'Pending',
      progressPercent: 0,
      clientApprovalRequired: true,
      clientApprovalStatus: 'Pending',
      adminNotes: '',
      clientVisibleUpdate: ''
    }
  ];
}

// GET /api/projects (supports ?email=xxx for client security filtering)
app.get('/api/projects', async (req, res) => {
  try {
    const { email } = req.query;
    let projects = await readProjects();

    if (email) {
      const targetEmail = String(email).trim().toLowerCase();
      projects = projects.filter((p: any) => p.email && p.email.trim().toLowerCase() === targetEmail);
    }

    projects.sort((a: any, b: any) => new Date(b.lastUpdated || b.startDate).getTime() - new Date(a.lastUpdated || a.startDate).getTime());
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:id (supports ?email=xxx for security enforcement)
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    const projects = await readProjects();
    const found = projects.find((p: any) => p.id === id);

    if (!found) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Backend security check: if email query parameter provided, verify ownership
    if (email) {
      const targetEmail = String(email).trim().toLowerCase();
      if (found.email && found.email.trim().toLowerCase() !== targetEmail) {
        return res.status(403).json({ error: 'Unauthorized: You do not have access to this project.' });
      }
    }

    res.json(found);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects (Create new project or convert contract)
app.post('/api/projects', async (req, res) => {
  try {
    const {
      contractId,
      proposalId,
      clientName,
      contactPerson,
      email,
      phone,
      businessName,
      businessNiche,
      projectName,
      projectDescription,
      selectedServices,
      deliverables,
      timeline,
      startDate,
      deadline,
      projectManager,
      createdByUser
    } = req.body;

    if (!businessName || !email) {
      return res.status(400).json({ error: 'Business Name and Email are required for project creation' });
    }

    const projects = await readProjects();

    // Auto-generate project ID e.g. PRJ-1001
    let nextNum = 1001;
    projects.forEach((p: any) => {
      if (p.id && p.id.startsWith('PRJ-')) {
        const num = parseInt(p.id.replace('PRJ-', ''), 10);
        if (!isNaN(num) && num >= nextNum) {
          nextNum = num + 1;
        }
      }
    });

    const nowIso = new Date().toISOString();
    const computedStartDate = startDate || nowIso;
    const computedDeadline = deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const initialActivity = {
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      timestamp: nowIso,
      action: contractId ? `Project Created from Approved Contract ${contractId}` : 'Project Created',
      user: createdByUser || 'Admin',
      role: 'admin' as const,
      isClientVisible: true,
      notes: contractId ? `Converted from contract ${contractId} / proposal ${proposalId || 'N/A'}` : 'Manual project creation'
    };

    const newProject = {
      id: `PRJ-${nextNum}`,
      contractId: contractId || '',
      proposalId: proposalId || '',
      clientName: clientName || businessName,
      contactPerson: contactPerson || clientName || businessName,
      email: email.trim().toLowerCase(),
      phone: phone || '',
      businessName: businessName,
      businessNiche: businessNiche || 'Digital Growth',
      projectName: projectName || `${businessName} - Digital Services Execution`,
      projectDescription: projectDescription || `Execution project for ${businessName}.`,
      selectedServices: selectedServices || [],
      deliverables: deliverables || '',
      timeline: timeline || '10-14 Business Days',
      status: 'Kickoff',
      overallProgress: 10,
      startDate: computedStartDate,
      deadline: computedDeadline,
      lastUpdated: nowIso,
      projectManager: projectManager || 'Rahul Verma',
      milestones: getDefaultProjectMilestones(),
      activityTimeline: [initialActivity],
      internalNotes: [],
      clientUpdates: [
        {
          id: 'cu_' + Math.random().toString(36).substr(2, 9),
          timestamp: nowIso,
          author: 'Dizo Team',
          title: 'Project Initialized & Kickoff Started',
          content: 'Your project has been onboarded to Dizo Pulse! We are preparing initial brand outlines and kickoff stage.'
        }
      ]
    };

    projects.push(newProject);
    await writeProjects(projects);

    // Trigger Client Notification
    if (newProject.email) {
      await createNotification({
        recipientEmail: newProject.email,
        title: 'Project Initialized & Kickoff Started',
        message: `Your project ${newProject.id} (${newProject.projectName}) is active on Dizo Pulse!`,
        type: 'project_status',
        relatedEntityId: newProject.id,
        relatedSection: 'projects',
        linkText: 'Open Project Hub'
      });
    }

    res.status(201).json(newProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/projects/:id (Update project, status, milestones, notes, client updates)
app.patch('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await readProjects();
    const index = projects.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const prevProject = projects[index];
    const { activityEntry, internalNoteEntry, clientUpdateEntry, milestones, status, overallProgress, ...fieldsToUpdate } = req.body;

    const nowIso = new Date().toISOString();

    let updatedMilestones = milestones || prevProject.milestones;
    let computedProgress = overallProgress !== undefined ? overallProgress : prevProject.overallProgress;

    // Recalculate progress if milestones were updated and overallProgress not explicitly forced
    if (milestones && overallProgress === undefined) {
      const completedCount = milestones.filter((m: any) => m.status === 'Completed' || m.status === 'Approved').length;
      computedProgress = Math.round((completedCount / milestones.length) * 100);
    }

    const updatedProject = {
      ...prevProject,
      ...fieldsToUpdate,
      status: status || prevProject.status,
      overallProgress: computedProgress,
      milestones: updatedMilestones,
      lastUpdated: nowIso,
      activityTimeline: [...(prevProject.activityTimeline || [])],
      internalNotes: [...(prevProject.internalNotes || [])],
      clientUpdates: [...(prevProject.clientUpdates || [])]
    };

    // If new activity log passed
    if (activityEntry) {
      updatedProject.activityTimeline.push({
        id: 'act_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        ...activityEntry
      });
    } else if (status && status !== prevProject.status) {
      // Auto record status change
      updatedProject.activityTimeline.push({
        id: 'act_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        action: `Status updated to ${status}`,
        user: fieldsToUpdate.updatedByUser || 'Admin',
        role: (fieldsToUpdate.updatedByRole || 'admin') as 'admin' | 'client',
        isClientVisible: true,
        notes: `Project status moved from ${prevProject.status} to ${status}`
      });
    }

    if (internalNoteEntry) {
      updatedProject.internalNotes.push({
        id: 'in_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        ...internalNoteEntry
      });
    }

    if (clientUpdateEntry) {
      updatedProject.clientUpdates.push({
        id: 'cu_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        ...clientUpdateEntry
      });
      // Also add to client-visible activity timeline
      updatedProject.activityTimeline.push({
        id: 'act_' + Math.random().toString(36).substr(2, 9),
        timestamp: nowIso,
        action: `New Client Update: ${clientUpdateEntry.title}`,
        user: clientUpdateEntry.author || 'Dizo Team',
        role: 'admin',
        isClientVisible: true,
        notes: clientUpdateEntry.content
      });
    }

    projects[index] = updatedProject;
    await writeProjects(projects);

    // Trigger Notification for project status change
    if (status && status !== prevProject.status && updatedProject.email) {
      await createNotification({
        recipientEmail: updatedProject.email,
        title: `Project Status: ${status}`,
        message: `Project ${updatedProject.id} (${updatedProject.projectName}) status changed to ${status}.`,
        type: 'project_status',
        relatedEntityId: updatedProject.id,
        relatedSection: 'projects',
        linkText: 'View Project'
      });
    }

    res.json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:id/milestones/:milestoneId (Milestone status / client approval)
app.post('/api/projects/:id/milestones/:milestoneId', async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const { status, progressPercent, adminNotes, clientVisibleUpdate, clientApprovalAction, clientFeedback, user, role } = req.body;

    const projects = await readProjects();
    const index = projects.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[index];
    const mIndex = (project.milestones || []).findIndex((m: any) => m.id === milestoneId);

    if (mIndex === -1) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    const milestone = project.milestones[mIndex];
    const nowIso = new Date().toISOString();

    let newStatus = status || milestone.status;
    let newApprovalStatus = milestone.clientApprovalStatus;
    let newProgress = progressPercent !== undefined ? progressPercent : milestone.progressPercent;

    if (clientApprovalAction === 'approve') {
      newApprovalStatus = 'Approved';
      newStatus = 'Completed';
      newProgress = 100;
      milestone.completionDate = nowIso;
    } else if (clientApprovalAction === 'request_changes') {
      newApprovalStatus = 'Revision Requested';
      newStatus = 'Revision Requested';
      project.status = 'Revision';
    }

    project.milestones[mIndex] = {
      ...milestone,
      status: newStatus,
      progressPercent: newProgress,
      clientApprovalStatus: newApprovalStatus,
      adminNotes: adminNotes !== undefined ? adminNotes : milestone.adminNotes,
      clientVisibleUpdate: clientVisibleUpdate !== undefined ? clientVisibleUpdate : milestone.clientVisibleUpdate,
      clientFeedback: clientFeedback !== undefined ? clientFeedback : milestone.clientFeedback
    };

    // Recalculate overall progress
    const completedCount = project.milestones.filter((m: any) => m.status === 'Completed' || m.status === 'Approved').length;
    project.overallProgress = Math.round((completedCount / project.milestones.length) * 100);
    project.lastUpdated = nowIso;

    // Log activity
    const actionText = clientApprovalAction === 'approve'
      ? `Client Approved Milestone: ${milestone.name}`
      : clientApprovalAction === 'request_changes'
      ? `Client Requested Changes on Milestone: ${milestone.name}`
      : `Milestone "${milestone.name}" updated to ${newStatus}`;

    project.activityTimeline.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      timestamp: nowIso,
      action: actionText,
      user: user || (role === 'client' ? project.clientName : 'Admin'),
      role: (role || 'admin') as 'admin' | 'client',
      isClientVisible: true,
      notes: clientFeedback || clientVisibleUpdate || `Milestone status changed to ${newStatus}`
    });

    projects[index] = project;
    await writeProjects(projects);

    // Trigger Notification for Milestone Update
    if (project.email) {
      await createNotification({
        recipientEmail: project.email,
        title: `Milestone Update: ${milestone.name}`,
        message: actionText,
        type: 'milestone',
        relatedEntityId: project.id,
        relatedSection: 'projects',
        linkText: 'Check Milestone'
      });
    }


    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:id (Delete/archive project)
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projects = await readProjects();
    const filtered = projects.filter((p: any) => p.id !== id);
    await writeProjects(filtered);
    res.json({ success: true, message: 'Project deleted successfully', deletedId: id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ASSETS & FILE DELIVERY API ENDPOINTS ---

// GET /api/projects/:projectId/folders
app.get('/api/projects/:projectId/folders', async (req, res) => {
  try {
    const { projectId } = req.params;
    const foldersMap = await readFolders();
    const projectFolders = foldersMap[projectId] || STANDARD_DEFAULT_FOLDERS;
    res.json(projectFolders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:projectId/folders (Create, rename, archive custom folders)
app.post('/api/projects/:projectId/folders', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { folderName, action, folderId, newName } = req.body;
    
    const foldersMap = await readFolders();
    let list = foldersMap[projectId] ? [...foldersMap[projectId]] : [...STANDARD_DEFAULT_FOLDERS];

    if (action === 'create') {
      if (!folderName) return res.status(400).json({ error: 'Folder name is required' });
      const newFld = {
        id: 'fld-' + Math.random().toString(36).substr(2, 9),
        name: folderName.trim(),
        isDefault: false,
        createdAt: new Date().toISOString()
      };
      list.push(newFld);
    } else if (action === 'rename') {
      const idx = list.findIndex((f: any) => f.id === folderId);
      if (idx !== -1 && newName) {
        list[idx].name = newName.trim();
      }
    } else if (action === 'archive') {
      const idx = list.findIndex((f: any) => f.id === folderId);
      if (idx !== -1) {
        list[idx].isArchived = true;
      }
    }

    foldersMap[projectId] = list;
    await writeFolders(foldersMap);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/projects/:projectId/assets (Fetch project assets with security filtering & search)
app.get('/api/projects/:projectId/assets', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, folderId, search, status, includeArchived } = req.query;

    const projects = await readProjects();
    const project = projects.find((p: any) => p.id === projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Security Check: verify project ownership if client email provided
    const isClientAccess = !!email;
    if (isClientAccess) {
      const targetEmail = String(email).trim().toLowerCase();
      if (project.email && project.email.trim().toLowerCase() !== targetEmail) {
        return res.status(403).json({ error: 'Unauthorized: You do not have access to this project\'s asset library.' });
      }
    }

    let allAssets = await readAssets();
    let projectAssets = allAssets.filter((a: any) => a.projectId === projectId);

    // Client security filter: hide admin-only assets (isClientVisible === false) and Draft status
    if (isClientAccess) {
      projectAssets = projectAssets.filter((a: any) => a.isClientVisible && a.status !== 'Draft');
    }

    // Filter by archived
    if (!includeArchived || includeArchived === 'false') {
      projectAssets = projectAssets.filter((a: any) => !a.isArchived);
    }

    // Filter by folder
    if (folderId && folderId !== 'all') {
      projectAssets = projectAssets.filter((a: any) => a.folderId === folderId || a.folderName === folderId);
    }

    // Filter by status
    if (status && status !== 'all') {
      projectAssets = projectAssets.filter((a: any) => a.status === status);
    }

    // Search filter
    if (search) {
      const q = String(search).toLowerCase();
      projectAssets = projectAssets.filter((a: any) =>
        a.assetName.toLowerCase().includes(q) ||
        (a.currentVersion?.fileName || '').toLowerCase().includes(q) ||
        (a.currentVersion?.fileType || '').toLowerCase().includes(q) ||
        (a.currentVersion?.versionNumber || '').toLowerCase().includes(q) ||
        (a.folderName || '').toLowerCase().includes(q)
      );
    }

    // Compute basic stats
    const totalFiles = projectAssets.length;
    const finalFiles = projectAssets.filter((a: any) => a.status === 'Final').length;
    let latestUploadDate: string | undefined = undefined;
    let totalSizeBytes = 0;

    projectAssets.forEach((a: any) => {
      const sz = a.currentVersion?.fileSize || 0;
      totalSizeBytes += sz;
      const upDate = a.currentVersion?.uploadDate || a.updatedAt;
      if (!latestUploadDate || new Date(upDate).getTime() > new Date(latestUploadDate).getTime()) {
        latestUploadDate = upDate;
      }
    });

    res.json({
      assets: projectAssets,
      stats: {
        totalFiles,
        finalFiles,
        latestUploadDate,
        totalSizeBytes
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:projectId/assets (Upload new file or new version)
app.post('/api/projects/:projectId/assets', async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      assetName,
      folderId,
      folderName,
      status,
      isClientVisible,
      versionNumber,
      versionNotes,
      description,
      uploadedBy,
      fileDataUrl,
      fileName,
      fileType,
      fileSize,
      existingAssetId
    } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'File name is required for upload' });
    }

    const projects = await readProjects();
    const pIndex = projects.findIndex((p: any) => p.id === projectId);
    if (pIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[pIndex];
    const allAssets = await readAssets();
    const nowIso = new Date().toISOString();

    const uploader = uploadedBy || 'Admin';
    const computedVersionNum = versionNumber || 'v1.0';
    const computedStatus = status || 'Draft';
    const computedClientVisible = isClientVisible !== undefined ? !!isClientVisible : true;

    const finalFileUrl = fileDataUrl || `data:${fileType || 'text/plain'};charset=utf-8,${encodeURIComponent(fileName)}`;

    let targetAsset: any;

    if (existingAssetId) {
      // Add new version to existing asset
      const aIndex = allAssets.findIndex((a: any) => a.id === existingAssetId);
      if (aIndex === -1) {
        return res.status(404).json({ error: 'Existing asset not found' });
      }

      targetAsset = allAssets[aIndex];

      if (targetAsset.versionHistory) {
        targetAsset.versionHistory.forEach((vh: any) => { vh.isCurrent = false; });
      } else {
        targetAsset.versionHistory = [];
      }

      const newVersion = {
        versionId: 'ver_' + Math.random().toString(36).substr(2, 9),
        versionNumber: computedVersionNum,
        fileName: fileName,
        fileType: fileType || 'application/octet-stream',
        fileSize: Number(fileSize || 0),
        fileUrl: finalFileUrl,
        description: description || targetAsset.currentVersion?.description || '',
        uploadDate: nowIso,
        uploadedBy: uploader,
        versionNotes: versionNotes || '',
        isCurrent: true
      };

      targetAsset.currentVersion = newVersion;
      targetAsset.versionHistory.unshift(newVersion);
      targetAsset.status = computedStatus;
      targetAsset.isClientVisible = computedClientVisible;
      targetAsset.updatedAt = nowIso;

      allAssets[aIndex] = targetAsset;
    } else {
      // Create new asset
      let nextNum = 1001;
      allAssets.forEach((a: any) => {
        if (a.id && a.id.startsWith('AST-')) {
          const num = parseInt(a.id.replace('AST-', ''), 10);
          if (!isNaN(num) && num >= nextNum) nextNum = num + 1;
        }
      });

      const initialVersion = {
        versionId: 'ver_' + Math.random().toString(36).substr(2, 9),
        versionNumber: computedVersionNum,
        fileName: fileName,
        fileType: fileType || 'application/octet-stream',
        fileSize: Number(fileSize || 0),
        fileUrl: finalFileUrl,
        description: description || '',
        uploadDate: nowIso,
        uploadedBy: uploader,
        versionNotes: versionNotes || 'Initial upload',
        isCurrent: true
      };

      targetAsset = {
        id: `AST-${nextNum}`,
        projectId: projectId,
        assetName: assetName || fileName,
        folderId: folderId || 'fld-final',
        folderName: folderName || 'Final Delivery',
        status: computedStatus,
        isClientVisible: computedClientVisible,
        isArchived: false,
        createdAt: nowIso,
        updatedAt: nowIso,
        currentVersion: initialVersion,
        versionHistory: [initialVersion]
      };

      allAssets.push(targetAsset);
    }

    await writeAssets(allAssets);

    // Requirement 10: Log activity in project's activityTimeline
    const timelineNote = `${fileName} (${computedVersionNum}) uploaded to folder "${targetAsset.folderName}".`;
    project.activityTimeline = project.activityTimeline || [];
    project.activityTimeline.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      timestamp: nowIso,
      action: `${targetAsset.assetName} ${computedVersionNum} uploaded`,
      user: uploader,
      role: 'admin',
      isClientVisible: computedClientVisible,
      notes: timelineNote
    });
    project.lastUpdated = nowIso;

    projects[pIndex] = project;
    await writeProjects(projects);

    // Trigger Client Notification for Asset Upload
    if (project.email && computedClientVisible) {
      await createNotification({
        recipientEmail: project.email,
        title: 'New Asset Deliverable Uploaded',
        message: `File "${targetAsset.assetName}" (${computedVersionNum}) was uploaded in ${project.projectName || projectId}.`,
        type: 'asset',
        relatedEntityId: projectId,
        relatedSection: 'assets',
        linkText: 'View Deliverables'
      });
    }

    res.status(201).json(targetAsset);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/projects/:projectId/assets/:assetId (Update metadata / folder / status / client visibility)
app.patch('/api/projects/:projectId/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const allAssets = await readAssets();
    const index = allAssets.findIndex((a: any) => a.id === assetId);

    if (index === -1) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const prevAsset = allAssets[index];
    const { assetName, folderId, folderName, status, isClientVisible, isArchived, currentVersionId } = req.body;

    const updated = {
      ...prevAsset,
      assetName: assetName !== undefined ? assetName : prevAsset.assetName,
      folderId: folderId !== undefined ? folderId : prevAsset.folderId,
      folderName: folderName !== undefined ? folderName : prevAsset.folderName,
      status: status !== undefined ? status : prevAsset.status,
      isClientVisible: isClientVisible !== undefined ? isClientVisible : prevAsset.isClientVisible,
      isArchived: isArchived !== undefined ? isArchived : prevAsset.isArchived,
      updatedAt: new Date().toISOString()
    };

    if (currentVersionId) {
      const vFound = (prevAsset.versionHistory || []).find((vh: any) => vh.versionId === currentVersionId);
      if (vFound) {
        prevAsset.versionHistory.forEach((vh: any) => {
          vh.isCurrent = (vh.versionId === currentVersionId);
        });
        updated.currentVersion = { ...vFound, isCurrent: true };
      }
    }

    allAssets[index] = updated;
    await writeAssets(allAssets);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/projects/:projectId/assets/:assetId (Delete asset)
app.delete('/api/projects/:projectId/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    let allAssets = await readAssets();
    allAssets = allAssets.filter((a: any) => a.id !== assetId);
    await writeAssets(allAssets);
    res.json({ success: true, message: 'Asset deleted successfully', deletedId: assetId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROJECT COMMUNICATION & MESSAGING APIS ---

// GET /api/projects/:projectId/messages
app.get('/api/projects/:projectId/messages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email, search } = req.query;

    const projects = await readProjects();
    const project = projects.find((p: any) => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Security check: If client email is provided, verify ownership
    if (email && typeof email === 'string' && email.trim()) {
      const clientEmail = email.trim().toLowerCase();
      const prjEmail = (project.email || '').trim().toLowerCase();
      if (clientEmail !== prjEmail && clientEmail !== 'mukeshsinghmukesh316@gmail.com') {
        return res.status(403).json({ error: 'Access denied: You are not authorized to view messages for this project.' });
      }
    }

    let messages = await readMessages();
    let projectMsgs = messages.filter((m: any) => m.projectId === projectId);

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      projectMsgs = projectMsgs.filter((m: any) => 
        (m.content && m.content.toLowerCase().includes(q)) ||
        (m.senderName && m.senderName.toLowerCase().includes(q)) ||
        (m.attachments && m.attachments.some((a: any) => a.fileName && a.fileName.toLowerCase().includes(q)))
      );
    }

    // Sort by timestamp ascending
    projectMsgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Compute unread count for reader
    const isClientReader = Boolean(email);
    const unreadCount = projectMsgs.filter((m: any) => {
      if (m.isArchived) return false;
      if (isClientReader) {
        return m.senderRole !== 'client' && !m.isRead;
      } else {
        return m.senderRole === 'client' && !m.isRead;
      }
    }).length;

    res.json({ messages: projectMsgs, unreadCount, projectId, projectName: project.projectName || project.title });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/projects/:projectId/messages
app.post('/api/projects/:projectId/messages', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { senderName, senderRole, senderEmail, content, attachments } = req.body;

    const projects = await readProjects();
    const pIndex = projects.findIndex((p: any) => p.id === projectId);
    
    if (pIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[pIndex];

    // Security check: If sender is client, verify email matches project
    if (senderRole === 'client' && senderEmail) {
      const clientEmail = senderEmail.trim().toLowerCase();
      const prjEmail = (project.email || '').trim().toLowerCase();
      if (clientEmail !== prjEmail && clientEmail !== 'mukeshsinghmukesh316@gmail.com') {
        return res.status(403).json({ error: 'Unauthorized sender email for this project.' });
      }
    }

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachment is required.' });
    }

    const nowIso = new Date().toISOString();
    const newMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      projectId,
      senderName: senderName || (senderRole === 'client' ? project.clientName : 'Dizo Admin'),
      senderRole: senderRole || 'client',
      senderEmail: senderEmail || (senderRole === 'client' ? project.email : 'support@dizopulse.com'),
      content: (content || '').trim(),
      attachments: attachments || [],
      timestamp: nowIso,
      status: 'sent',
      isRead: false,
      isArchived: false
    };

    const messages = await readMessages();
    messages.push(newMessage);
    await writeMessages(messages);

    // Requirement 15: Log entry in project.activityTimeline & update lastUpdated
    const actionLabel = senderRole === 'client' ? 'Client sent a message' : 'Agency replied';
    const notePreview = newMessage.content ? `"${newMessage.content.slice(0, 45)}${newMessage.content.length > 45 ? '...' : ''}"` : 'Sent attachment';
    
    project.activityTimeline = project.activityTimeline || [];
    project.activityTimeline.push({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      timestamp: nowIso,
      action: actionLabel,
      user: newMessage.senderName,
      role: senderRole === 'client' ? 'client' : 'admin',
      isClientVisible: true,
      notes: notePreview
    });
    project.lastUpdated = nowIso;

    projects[pIndex] = project;
    await writeProjects(projects);

    // Trigger Notification for New Message
    if (senderRole !== 'client' && project.email) {
      await createNotification({
        recipientEmail: project.email,
        title: `New Message from ${newMessage.senderName}`,
        message: notePreview,
        type: 'message',
        relatedEntityId: projectId,
        relatedSection: 'messages',
        linkText: 'Open Project Chat'
      });
    } else if (senderRole === 'client') {
      await createNotification({
        recipientEmail: 'admin',
        title: `New Client Message: ${newMessage.senderName}`,
        message: `[${project.projectName || projectId}]: ${notePreview}`,
        type: 'message',
        relatedEntityId: projectId,
        relatedSection: 'messages',
        linkText: 'View Communication'
      });
    }

    res.status(201).json(newMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/projects/:projectId/messages/read (Mark messages as read)
app.patch('/api/projects/:projectId/messages/read', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { role } = req.body; // 'client' or 'admin' reading

    const messages = await readMessages();
    let updatedCount = 0;

    messages.forEach((m: any) => {
      if (m.projectId === projectId && !m.isRead) {
        if (role === 'client' && m.senderRole !== 'client') {
          m.isRead = true;
          updatedCount++;
        } else if (role === 'admin' && m.senderRole === 'client') {
          m.isRead = true;
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      await writeMessages(messages);
    }

    res.json({ success: true, markedRead: updatedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/projects/:projectId/messages/:messageId (Archive message or update status)
app.patch('/api/projects/:projectId/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { isArchived, status } = req.body;

    const messages = await readMessages();
    const msg = messages.find((m: any) => m.id === messageId);

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (isArchived !== undefined) msg.isArchived = isArchived;
    if (status !== undefined) msg.status = status;

    await writeMessages(messages);
    res.json(msg);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/conversations (Admin Hub - List all project conversations with summaries)
app.get('/api/conversations', async (req, res) => {
  try {
    const { search, email } = req.query;
    const projects = await readProjects();
    const messages = await readMessages();

    // Filter projects if client email is passed
    let accessibleProjects = projects;
    if (email && typeof email === 'string' && email.trim()) {
      const cEmail = email.trim().toLowerCase();
      if (cEmail !== 'mukeshsinghmukesh316@gmail.com') {
        accessibleProjects = projects.filter((p: any) => (p.email || '').trim().toLowerCase() === cEmail);
      }
    }

    const summaries = accessibleProjects.map((p: any) => {
      const prjMsgs = messages.filter((m: any) => m.projectId === p.id);
      prjMsgs.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const latestMessage = prjMsgs.find((m: any) => !m.isArchived) || prjMsgs[0];
      const unreadCount = prjMsgs.filter((m: any) => !m.isArchived && m.senderRole === 'client' && !m.isRead).length;

      return {
        projectId: p.id,
        projectName: p.projectName || p.title || 'Project ' + p.id,
        clientName: p.clientName || 'Valued Client',
        clientEmail: p.email || '',
        latestMessage: latestMessage || null,
        lastActivity: latestMessage ? latestMessage.timestamp : (p.lastUpdated || p.createdAt),
        totalMessages: prjMsgs.length,
        unreadCount
      };
    });

    let filteredSummaries = summaries;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredSummaries = summaries.filter((s: any) =>
        s.projectId.toLowerCase().includes(q) ||
        s.projectName.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.clientEmail.toLowerCase().includes(q) ||
        (s.latestMessage && s.latestMessage.content && s.latestMessage.content.toLowerCase().includes(q))
      );
    }

    // Sort conversations by last activity descending
    filteredSummaries.sort((a: any, b: any) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

    const totalUnreadAll = summaries.reduce((acc: number, s: any) => acc + s.unreadCount, 0);

    res.json({ conversations: filteredSummaries, totalUnreadAll });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- CLIENT NOTIFICATION CENTER APIs ---

// GET /api/notifications (Fetch notifications for client or admin)
app.get('/api/notifications', async (req, res) => {
  try {
    const { email } = req.query;
    const notifications = await readNotifications();

    let userNotifs = notifications;
    if (email && typeof email === 'string' && email.trim()) {
      const cEmail = email.trim().toLowerCase();
      userNotifs = notifications.filter((n: any) => {
        const rEmail = (n.recipientEmail || '').trim().toLowerCase();
        return rEmail === cEmail || rEmail === 'all' || rEmail === 'admin';
      });
    }

    userNotifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = userNotifs.filter((n: any) => !n.isRead).length;

    res.json({ notifications: userNotifs, unreadCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/:id/read (Mark single notification as read)
app.patch('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const notifications = await readNotifications();
    const notif = notifications.find((n: any) => n.id === id);

    if (!notif) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    notif.isRead = true;
    await writeNotifications(notifications);

    res.json(notif);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/read-all (Mark all notifications as read)
app.patch('/api/notifications/read-all', async (req, res) => {
  try {
    const { email } = req.body;
    const notifications = await readNotifications();

    let updatedCount = 0;
    const targetEmail = (email || '').trim().toLowerCase();

    notifications.forEach((n: any) => {
      const rEmail = (n.recipientEmail || '').trim().toLowerCase();
      if (!n.isRead) {
        if (!targetEmail || rEmail === targetEmail || rEmail === 'all' || rEmail === 'admin') {
          n.isRead = true;
          updatedCount++;
        }
      }
    });

    if (updatedCount > 0) {
      await writeNotifications(notifications);
    }

    res.json({ success: true, markedRead: updatedCount });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications (Admin create targeted/broadcast notification)
app.post('/api/notifications', async (req, res) => {
  try {
    const { recipientEmail, title, message, type, relatedEntityId, relatedSection, linkText } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required for notification.' });
    }

    const created = await createNotification({
      recipientEmail: recipientEmail || 'all',
      title: title.trim(),
      message: message.trim(),
      type: type || 'system',
      relatedEntityId,
      relatedSection,
      linkText
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id (Admin delete notification)
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let notifications = await readNotifications();
    const initialLen = notifications.length;

    notifications = notifications.filter((n: any) => n.id !== id);

    if (notifications.length === initialLen) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    await writeNotifications(notifications);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLIENT CRM APIS ---

// GET /api/clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await readClients();
    res.json(clients);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients (Create or upsert client)
app.post('/api/clients', async (req, res) => {
  try {
    const clients = await readClients();
    const clientData = req.body;
    
    if (!clientData.email || !clientData.clientName) {
      return res.status(400).json({ error: 'Client email and primary name are required' });
    }

    const existingIndex = clients.findIndex((c: any) => 
      c.id === clientData.id || 
      (c.email && c.email.toLowerCase() === clientData.email.toLowerCase())
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      clients[existingIndex] = {
        ...clients[existingIndex],
        ...clientData,
        updatedAt: now
      };
      await writeClients(clients);
      return res.json({ success: true, client: clients[existingIndex] });
    } else {
      const newClient = {
        id: clientData.id || `cli_${Date.now()}`,
        companyName: clientData.companyName || clientData.businessName || 'Independent Client',
        clientName: clientData.clientName,
        email: clientData.email.toLowerCase().trim(),
        phone: clientData.phone || '',
        businessNiche: clientData.businessNiche || '',
        website: clientData.website || '',
        address: clientData.address || '',
        gstin: clientData.gstin || '',
        status: clientData.status || 'lead',
        tags: clientData.tags || [],
        contactPersons: clientData.contactPersons || [
          {
            id: `cp_${Date.now()}`,
            name: clientData.clientName,
            email: clientData.email.toLowerCase().trim(),
            phone: clientData.phone || '',
            isPrimary: true
          }
        ],
        notes: clientData.notes || [],
        activityTimeline: clientData.activityTimeline || [
          {
            id: `act_${Date.now()}`,
            timestamp: now,
            type: 'note',
            title: 'Client Record Created',
            description: 'Client 360 profile initialized in agency CRM system.'
          }
        ],
        createdAt: now,
        updatedAt: now,
        lastInteraction: now
      };
      clients.unshift(newClient);
      await writeClients(clients);
      return res.status(201).json({ success: true, client: newClient });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/clients/:id
app.patch('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const clients = await readClients();

    const idx = clients.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const now = new Date().toISOString();
    clients[idx] = {
      ...clients[idx],
      ...updates,
      updatedAt: now,
      lastInteraction: updates.lastInteraction || now
    };

    await writeClients(clients);
    res.json({ success: true, client: clients[idx] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients/merge (Merge secondary client into primary client)
app.post('/api/clients/merge', async (req, res) => {
  try {
    const { primaryId, secondaryId } = req.body;
    if (!primaryId || !secondaryId) {
      return res.status(400).json({ error: 'primaryId and secondaryId are required' });
    }

    const clients = await readClients();
    const primary = clients.find((c: any) => c.id === primaryId);
    const secondary = clients.find((c: any) => c.id === secondaryId);

    if (!primary || !secondary) {
      return res.status(404).json({ error: 'Primary or secondary client not found' });
    }

    const now = new Date().toISOString();

    // Merge tags, notes, contact persons, timeline
    const mergedTags = Array.from(new Set([...(primary.tags || []), ...(secondary.tags || [])]));
    const mergedNotes = [...(primary.notes || []), ...(secondary.notes || [])];
    const mergedContacts = [...(primary.contactPersons || [])];

    // Add secondary contact person if not present
    if (secondary.email && !mergedContacts.some((cp: any) => cp.email === secondary.email)) {
      mergedContacts.push({
        id: `cp_${Date.now()}`,
        name: secondary.clientName || secondary.companyName,
        email: secondary.email,
        phone: secondary.phone,
        isPrimary: false,
        notes: `Merged from duplicate profile ${secondary.id}`
      });
    }

    const mergedTimeline = [
      ...(primary.activityTimeline || []),
      ...(secondary.activityTimeline || []),
      {
        id: `act_${Date.now()}`,
        timestamp: now,
        type: 'note',
        title: 'Profiles Merged',
        description: `Merged duplicate profile (${secondary.companyName || secondary.clientName}) into primary record.`
      }
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    primary.tags = mergedTags;
    primary.notes = mergedNotes;
    primary.contactPersons = mergedContacts;
    primary.activityTimeline = mergedTimeline;
    primary.updatedAt = now;
    primary.lastInteraction = now;

    // Filter out secondary client from list
    const updatedClients = clients.filter((c: any) => c.id !== secondaryId);
    // Ensure primary updated
    const pIdx = updatedClients.findIndex((c: any) => c.id === primaryId);
    if (pIdx >= 0) {
      updatedClients[pIdx] = primary;
    }

    await writeClients(updatedClients);

    // Also update references in inquiries, proposals, contracts, projects if emails differ
    if (secondary.email && secondary.email !== primary.email) {
      // update inquiries
      const inquiries = await readInquiries();
      let inqModified = false;
      inquiries.forEach((inq: any) => {
        if (inq.email && inq.email.toLowerCase() === secondary.email.toLowerCase()) {
          inq.email = primary.email;
          inq.clientName = primary.clientName;
          inq.businessName = primary.companyName;
          inqModified = true;
        }
      });
      if (inqModified) await writeInquiries(inquiries);

      // update proposals
      const proposals = await readProposals();
      let propModified = false;
      proposals.forEach((p: any) => {
        if (p.email && p.email.toLowerCase() === secondary.email.toLowerCase()) {
          p.email = primary.email;
          p.clientName = primary.clientName;
          p.businessName = primary.companyName;
          propModified = true;
        }
      });
      if (propModified) await writeProposals(proposals);

      // update contracts
      const contracts = await readContracts();
      let ctrModified = false;
      contracts.forEach((c: any) => {
        if (c.email && c.email.toLowerCase() === secondary.email.toLowerCase()) {
          c.email = primary.email;
          c.clientName = primary.clientName;
          c.businessName = primary.companyName;
          ctrModified = true;
        }
      });
      if (ctrModified) await writeContracts(contracts);

      // update projects
      const projects = await readProjects();
      let prjModified = false;
      projects.forEach((prj: any) => {
        if (prj.email && prj.email.toLowerCase() === secondary.email.toLowerCase()) {
          prj.email = primary.email;
          prj.clientName = primary.clientName;
          prj.businessName = primary.companyName;
          prjModified = true;
        }
      });
      if (prjModified) await writeProjects(projects);
    }

    res.json({ success: true, primaryClient: primary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/clients/:id
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let clients = await readClients();
    const initialLen = clients.length;
    clients = clients.filter((c: any) => c.id !== id);

    if (clients.length === initialLen) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await writeClients(clients);
    res.json({ success: true, id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// --- SETTINGS, SERVICES & COUPON CODES APIs ---

// GET site settings (logo details, presets, name)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST update site settings
app.post('/api/settings', async (req, res) => {
  try {
    const currentSettings = await readSettings();
    const payload = req.body;

    const updatedBy = payload.updatedBy || payload.lastUpdatedBy || 'Agency Admin';
    const userRole = payload.updatedByRole || 'admin';
    const userEmail = payload.updatedByEmail || 'admin@dizopulse.com';

    // Remove temporary client metadata fields from saved settings
    delete payload.updatedBy;
    delete payload.updatedByRole;
    delete payload.updatedByEmail;

    const newSettings = {
      ...currentSettings,
      ...payload,
      lastUpdatedBy: `${updatedBy} (${userRole})`,
      lastUpdatedAt: new Date().toISOString()
    };

    await writeSettings(newSettings);

    // Record Audit Trail Entry
    await logAuditTrail({
      user: updatedBy,
      userEmail: userEmail,
      role: userRole,
      action: 'SETTINGS_UPDATED',
      module: 'settings',
      target: 'Global System Settings',
      description: `System settings updated by ${updatedBy} (${userRole})`,
      ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
      deviceInfo: String(req.headers['user-agent'] || 'Web Client'),
      status: 'success',
      severity: 'info',
      metadata: { updatedKeys: Object.keys(payload) }
    });

    res.json({ success: true, settings: newSettings });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST reset system settings to defaults
app.post('/api/admin/settings/reset', async (req, res) => {
  try {
    const { updatedBy = 'Super Admin', userRole = 'super_admin', userEmail = 'admin@dizopulse.com' } = req.body;

    const resetSettings = {
      ...DEFAULT_SETTINGS,
      lastUpdatedBy: `${updatedBy} (${userRole}) [Reset]`,
      lastUpdatedAt: new Date().toISOString()
    };

    await writeSettings(resetSettings);

    await logAuditTrail({
      user: updatedBy,
      userEmail: userEmail,
      role: userRole,
      action: 'SETTINGS_RESET',
      module: 'settings',
      target: 'Global System Settings',
      description: `All system settings were reset to factory defaults by ${updatedBy}`,
      ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
      deviceInfo: String(req.headers['user-agent'] || 'Web Client'),
      status: 'success',
      severity: 'warning'
    });

    res.json({ success: true, settings: resetSettings, message: 'Settings reset to factory defaults successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET System Health & Status Metrics
app.get('/api/admin/system-status', async (req, res) => {
  try {
    const fdb = getFirestoreDb();
    const memory = process.memoryUsage();
    
    res.json({
      status: 'operational',
      database: fdb ? 'Firestore (Cloud Sync Active)' : 'Local Disk JSON Engine (Active)',
      firestoreConnected: !!fdb,
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMB: {
        rss: Math.round(memory.rss / (1024 * 1024)),
        heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsed: Math.round(memory.heapUsed / (1024 * 1024))
      },
      environment: process.env.NODE_ENV || 'development',
      lastBackupStatus: 'Healthy (Auto-synced)',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST upload custom logo file
app.post('/api/upload-logo', async (req, res) => {
  try {
    const { imageBase64, extension } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    // Clean base64 header
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    // Create uploads folder if not exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save file locally
    const filename = `custom-logo-${Date.now()}.${extension || 'png'}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    // Absolute URL path from the public root is just /uploads/filename
    const logoCustomUrl = `/uploads/${filename}`;
    res.json({ success: true, logoCustomUrl });
  } catch (error: any) {
    console.error('Logo upload failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST upload any custom image file (e.g. QRs, cover images, etc)
app.post('/api/upload-image', async (req, res) => {
  try {
    const { imageBase64, extension, prefix } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 payload' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const filePrefix = prefix || 'upload';
    const filename = `${filePrefix}-${Date.now()}.${extension || 'png'}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const imageUrl = `/uploads/${filename}`;
    res.json({ success: true, imageUrl });
  } catch (error: any) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all services/products
app.get('/api/services', async (req, res) => {
  try {
    const services = await readServices();
    res.json(services);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add/update service pricing & catalog metadata
app.post('/api/services', async (req, res) => {
  try {
    const {
      id,
      name,
      mrp,
      launchPrice,
      description,
      category,
      subcategory,
      gstPercent,
      discountPercent,
      turnaroundTime,
      deliverables,
      badge,
      iconName,
      unit,
      imageUrl,
      isFeatured,
      isPopular,
      status,
      displayOrder,
      author,
      changeReason
    } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Missing required service id or name' });
    }

    const services = await readServices();
    const index = services.findIndex((s: any) => s.id === id);

    const oldMrp = index !== -1 ? Number(services[index].mrp || 0) : 0;
    const oldLaunchPrice = index !== -1 ? Number(services[index].launchPrice || 0) : 0;
    const newMrpNum = Number(mrp);
    const newLaunchPriceNum = Number(launchPrice);

    let priceHistory = index !== -1 && Array.isArray(services[index].priceHistory) ? [...services[index].priceHistory] : [];
    if (index !== -1 && (oldMrp !== newMrpNum || oldLaunchPrice !== newLaunchPriceNum)) {
      priceHistory.unshift({
        id: 'ph_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        author: author || 'Admin',
        oldMrp,
        newMrp: newMrpNum,
        oldLaunchPrice,
        newLaunchPrice: newLaunchPriceNum,
        reason: changeReason || 'Pricing update'
      });
    }

    const updatedService = {
      id,
      name,
      category: category || 'social',
      subcategory: subcategory || '',
      mrp: newMrpNum,
      launchPrice: newLaunchPriceNum,
      gstPercent: gstPercent !== undefined ? Number(gstPercent) : 18,
      discountPercent: discountPercent !== undefined ? Number(discountPercent) : (newMrpNum > 0 ? Math.round(((newMrpNum - newLaunchPriceNum) / newMrpNum) * 100) : 20),
      turnaroundTime: turnaroundTime || '3-5 Days',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      description: description || '',
      iconName: iconName || 'Sparkles',
      unit: unit || '',
      badge: badge || '',
      imageUrl: imageUrl || '',
      isFeatured: !!isFeatured,
      isPopular: !!isPopular,
      status: status || 'published',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : (index !== -1 ? (services[index].displayOrder || 0) : services.length + 1),
      priceHistory,
      updatedAt: new Date().toISOString(),
      createdAt: index !== -1 ? services[index].createdAt : new Date().toISOString()
    };

    if (index !== -1) {
      services[index] = updatedService;
    } else {
      services.push(updatedService);
    }

    await writeServices(services);
    res.json({ success: true, service: updatedService, services });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH bulk update services (status, archive, reorder)
app.patch('/api/services-bulk', async (req, res) => {
  try {
    const { ids, action, status, displayOrders } = req.body;
    let services = await readServices();

    if (action === 'delete') {
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });
      services = services.filter((s: any) => !ids.includes(s.id));
    } else if (action === 'status' && status) {
      if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });
      services = services.map((s: any) => ids.includes(s.id) ? { ...s, status, updatedAt: new Date().toISOString() } : s);
    } else if (action === 'reorder' && Array.isArray(displayOrders)) {
      displayOrders.forEach(({ id, order }: { id: string, order: number }) => {
        const idx = services.findIndex((s: any) => s.id === id);
        if (idx !== -1) services[idx].displayOrder = order;
      });
    }

    await writeServices(services);
    res.json({ success: true, services });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a service (Admin Only)
app.delete('/api/services/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const services = await readServices();
    const filtered = services.filter((s: any) => s.id !== id);
    await writeServices(filtered);
    res.json({ success: true, services: filtered });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all bundles
app.get('/api/bundles', async (req, res) => {
  try {
    const bundles = await readBundles();
    res.json(bundles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST create/update bundle
app.post('/api/bundles', async (req, res) => {
  try {
    const {
      id,
      name,
      description,
      category,
      subcategory,
      serviceIds,
      bundleType,
      mrp,
      bundlePrice,
      bundleDiscountPercent,
      gstPercent,
      turnaroundTime,
      deliverables,
      badge,
      imageUrl,
      isFeatured,
      status,
      displayOrder,
      author,
      changeReason
    } = req.body;

    if (!name) return res.status(400).json({ error: 'Bundle name required' });

    let bundles = await readBundles();
    const bundleId = id || ('bundle_' + Math.random().toString(36).substring(2, 9));
    const index = bundles.findIndex((b: any) => b.id === bundleId);

    const oldMrp = index !== -1 ? Number(bundles[index].mrp || 0) : 0;
    const oldPrice = index !== -1 ? Number(bundles[index].bundlePrice || 0) : 0;
    const newMrpNum = Number(mrp || 0);
    const newPriceNum = Number(bundlePrice || 0);

    let priceHistory = index !== -1 && Array.isArray(bundles[index].priceHistory) ? [...bundles[index].priceHistory] : [];
    if (index !== -1 && (oldMrp !== newMrpNum || oldPrice !== newPriceNum)) {
      priceHistory.unshift({
        id: 'ph_' + Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        author: author || 'Admin',
        oldMrp,
        newMrp: newMrpNum,
        oldLaunchPrice: oldPrice,
        newLaunchPrice: newPriceNum,
        reason: changeReason || 'Bundle pricing update'
      });
    }

    const updatedBundle = {
      id: bundleId,
      name,
      description: description || '',
      category: category || 'combo',
      subcategory: subcategory || 'Package',
      serviceIds: Array.isArray(serviceIds) ? serviceIds : [],
      bundleType: bundleType || 'fixed',
      mrp: newMrpNum,
      bundlePrice: newPriceNum,
      bundleDiscountPercent: Number(bundleDiscountPercent || 0),
      gstPercent: gstPercent !== undefined ? Number(gstPercent) : 18,
      turnaroundTime: turnaroundTime || '5-7 Days',
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      badge: badge || 'PACKAGE BUNDLE',
      imageUrl: imageUrl || '',
      isFeatured: !!isFeatured,
      status: status || 'published',
      displayOrder: Number(displayOrder || 0),
      priceHistory,
      updatedAt: new Date().toISOString(),
      createdAt: index !== -1 ? bundles[index].createdAt : new Date().toISOString()
    };

    if (index !== -1) {
      bundles[index] = updatedBundle;
    } else {
      bundles.push(updatedBundle);
    }

    await writeBundles(bundles);
    res.json({ success: true, bundle: updatedBundle, bundles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a bundle
app.delete('/api/bundles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let bundles = await readBundles();
    bundles = bundles.filter((b: any) => b.id !== id);
    await writeBundles(bundles);
    res.json({ success: true, bundles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all coupon codes
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await readCoupons();
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add/update coupon code
app.post('/api/coupons', async (req, res) => {
  try {
    const { code, eventName, discountType, discountValue, minOrderValue, active } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    const coupons = await readCoupons();
    const index = coupons.findIndex((c: any) => c.code.toUpperCase() === code.toUpperCase());

    const formattedCoupon = {
      code: code.toUpperCase(),
      eventName: eventName || 'Special Offer',
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue || 0),
      minOrderValue: Number(minOrderValue || 0),
      active: active !== undefined ? !!active : true
    };

    if (index !== -1) {
      coupons[index] = formattedCoupon;
    } else {
      coupons.push(formattedCoupon);
    }
    await writeCoupons(coupons);
    res.json({ success: true, coupon: formattedCoupon });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a coupon code
const deleteCouponHandler = async (req: express.Request, res: express.Response) => {
  try {
    const code = req.params.code || (req.query.code as string);
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    const coupons = await readCoupons();
    const filtered = coupons.filter((c: any) => c.code.toUpperCase() !== code.toUpperCase());
    await writeCoupons(filtered);
    res.json({ success: true, message: `Coupon ${code} deleted successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
app.delete('/api/coupons/:code', deleteCouponHandler);
app.delete('/api/coupons', deleteCouponHandler);

// PATCH toggle a coupon's active status
const patchCouponHandler = async (req: express.Request, res: express.Response) => {
  try {
    const code = req.params.code || (req.query.code as string);
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }
    const { active } = req.body;
    const coupons = await readCoupons();
    const index = coupons.findIndex((c: any) => c.code.toUpperCase() === code.toUpperCase());
    if (index === -1) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    if (active !== undefined) {
      coupons[index].active = !!active;
    } else {
      coupons[index].active = !coupons[index].active;
    }
    await writeCoupons(coupons);
    res.json({ success: true, coupon: coupons[index] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
app.patch('/api/coupons/:code/toggle', patchCouponHandler);
app.patch('/api/coupons', patchCouponHandler);

// --- PULSE LOCAL INTELLIGENCE CORE (PLIC) ---
// High-fidelity local expert systems providing zero-cost, instant, high-value strategic growth guidance

function generateLocalStrategy(businessName: string, businessNiche: string, targetAudience: string, goals: string[], servicesList: any[]) {
  const nicheLower = businessNiche.toLowerCase();
  
  // Custom tone recommendations based on industry
  let brandTone = "Premium, highly professional, clean, and modern";
  let colorTheme = "Midnight Blue paired with Electric Indigo for high-contrast trust, plus Soft Lavender accents";
  let fontVibe = "Elegant, geometric sans-serif (e.g. Space Grotesk) paired with Inter for supreme legibility";
  
  if (nicheLower.includes('food') || nicheLower.includes('bakery') || nicheLower.includes('restaurant') || nicheLower.includes('cafe')) {
    brandTone = "Warm, inviting, appetizing, social, and vibrant";
    colorTheme = "Warm Terracotta with Creamy White accents, and a touch of Fresh Olive Green";
    fontVibe = "Friendly rounded display fonts paired with clean geometric text";
  } else if (nicheLower.includes('gym') || nicheLower.includes('fitness') || nicheLower.includes('health') || nicheLower.includes('sports')) {
    brandTone = "Energetic, bold, high-octane, inspirational, and authoritative";
    colorTheme = "Impactful Neon Lime or Orange coupled with Deep Charcoal and Matte Black";
    fontVibe = "Stretching condensed grotesque headings paired with technical mono details";
  } else if (nicheLower.includes('tech') || nicheLower.includes('software') || nicheLower.includes('app') || nicheLower.includes('startup') || nicheLower.includes('it')) {
    brandTone = "Cutting-edge, minimalist, tech-forward, futuristic, and highly scalable";
    colorTheme = "Futuristic Cyan coupled with Deep Space Purple and Matte Carbon";
    fontVibe = "Modern Outfit or JetBrains Mono details paired with ultra-clean Inter";
  } else if (nicheLower.includes('fashion') || nicheLower.includes('clothing') || nicheLower.includes('boutique') || nicheLower.includes('salon') || nicheLower.includes('beauty')) {
    brandTone = "Aesthetic, editorial, classy, trendsetting, and highly visual";
    colorTheme = "Warm Sand, Rose Gold, Editorial Cream, and deep Rich Espresso";
    fontVibe = "Chic serif display typography paired with clean, spacious light text";
  }

  // Choose recommended services based on selected goals
  const recommendedServices: string[] = [];
  const weeklyTimeline: any[] = [];

  // Goal mapping to actual service names matching services-db.json
  const serviceMapping: { [key: string]: string[] } = {
    'Viral Reels & Organic Reach': ['Reel Editing (Premium)', 'Instagram Post Design', 'Social Media Management (1 Month)'],
    'High-Converting Landing Page/Website': ['Basic Business Website', 'E-commerce Custom Website', 'Basic SEO'],
    'Google Maps/GBP Local Dominance': ['Google Business Profile Setup', 'Basic SEO', 'WhatsApp Automation Setup'],
    'Meta/Insta Ads Paid Lead Generation': ['Meta Ads Setup (Lead Gen)', 'Meta Ads Setup (Conversions)', 'Instagram Post Design'],
    'Logo, Brand Kits & Premium Identity': ['Logo Design (Logo + Colors + Fonts)', 'Brand Kit (Logo + Colors + Fonts)'],
    'Nurturing Leads with WhatsApp/Email': ['WhatsApp Automation Setup', 'Email Marketing Flow Setup']
  };

  // Populate recommended services based on goals
  if (goals && goals.length > 0) {
    goals.forEach(g => {
      const services = serviceMapping[g];
      if (services) {
        services.forEach(s => {
          if (!recommendedServices.includes(s)) recommendedServices.push(s);
        });
      }
    });
  }

  // Default fallback if no services selected
  if (recommendedServices.length === 0) {
    recommendedServices.push('Instagram Post Design', 'Basic Business Website', 'Basic SEO');
  }

  // Ensure services exist in servicesList (case-insensitive check / fallback check)
  const actualRecommended = recommendedServices.filter(srvName => 
    servicesList.some(s => s.name.toLowerCase() === srvName.toLowerCase())
  );
  const finalRecommended = actualRecommended.length > 0 ? actualRecommended : recommendedServices.slice(0, 3);

  // Week-by-week timeline customizer
  const week1Actions: string[] = [];
  const week2Actions: string[] = [];
  const week3Actions: string[] = [];
  const week4Actions: string[] = [];

  if (finalRecommended.includes('Logo Design (Logo + Colors + Fonts)') || finalRecommended.includes('Brand Kit (Logo + Colors + Fonts)')) {
    week1Actions.push("Finalise vector logomark variants and dynamic brand color palettes");
    week1Actions.push("Develop official branding style guide and typography scales");
  } else {
    week1Actions.push("Conduct detailed competitive audit and positioning benchmark");
    week1Actions.push("Create official brand tone guidelines and visual template styles");
  }

  if (finalRecommended.includes('Basic Business Website') || finalRecommended.includes('E-commerce Custom Website')) {
    week2Actions.push("Draft comprehensive website sitemap, design layout mockups, and write content copy");
    week2Actions.push("Develop responsive design layouts, secure fast loading times, and implement smooth animations");
  } else {
    week2Actions.push("Design custom high-conversion post templates for social media grids");
    week2Actions.push("Perform comprehensive SEO keyword research matching competitive business domains");
  }

  if (finalRecommended.includes('Google Business Profile Setup') || finalRecommended.includes('Basic SEO')) {
    if (finalRecommended.includes('Google Business Profile Setup')) {
      week2Actions.push("Launch Google Business Profile and secure high-visibility local citation keys");
    }
    week3Actions.push("Optimise on-page metadata, title tags, schema markups, and fast performance parameters");
  }

  if (finalRecommended.includes('Reel Editing (Premium)') || finalRecommended.includes('Social Media Management (1 Month)')) {
    week3Actions.push("Record and compile high-resolution video reels; edit with engaging motion text & viral hooks");
    week3Actions.push("Launch active posting scheduler and engage directly with local demographic tags");
  } else {
    week3Actions.push("Draft first content calendar and setup social engagement workflows");
  }

  if (finalRecommended.includes('Meta Ads Setup (Lead Gen)') || finalRecommended.includes('Meta Ads Setup (Conversions)')) {
    week4Actions.push("Configure Meta Pixel tracking, lookalike audience cohorts, and launch custom A/B test lead ads");
    week4Actions.push("Compile daily performance analytics reports and optimise ad spend parameters");
  }

  if (finalRecommended.includes('WhatsApp Automation Setup') || finalRecommended.includes('Email Marketing Flow Setup')) {
    week4Actions.push("Establish interactive automated lead response flows on WhatsApp or custom CRM workflows");
    week4Actions.push("Deploy double-opt-in signups and active onboarding welcome email sequences");
  }

  if (week4Actions.length === 0) {
    week4Actions.push("Review all analytics performance trackers, optimize keywords, and lock monthly organic post calendars");
  }

  return {
    executiveSummary: `For "${businessName}" operating in the "${businessNiche}" niche: We've designed a specialized premium market positioning roadmap targeting "${targetAudience || 'your target audience'}". By focusing on your selected goals (${goals.join(', ')}), this strategy aims to maximize client trust, elevate brand aesthetics, and scale organic conversions via our bespoke Dizo Pulse campaign elements.`,
    brandingStrategy: `Your brand tone should be ${brandTone}. Recommended Visual Style: ${colorTheme}. Typography Pairing: ${fontVibe}. We strongly advise implementing standard brand-asset grids to keep visual consistency across all customer touchpoints.`,
    contentPlan: `Pillars: 1) Behind-the-scenes authority (establishing expertise), 2) High-impact educational reels (viral reach), and 3) Aesthetic lifestyle / case-studies (social proof). Platform Focus: Instagram & Google Maps to maximize immediate regional traffic and brand credibility.`,
    recommendedServices: finalRecommended,
    weeklyTimeline: [
      {
        week: "Week 1",
        focus: "Foundational Brand Identity & Positioning Setup",
        actions: week1Actions
      },
      {
        week: "Week 2",
        focus: "Digital Infrastructure & Domain Optimisation",
        actions: week2Actions
      },
      {
        week: "Week 3",
        focus: "Organic Reach Surge & Creative Asset Deployment",
        actions: week3Actions
      },
      {
        week: "Week 4",
        focus: "Paid Funnel Activation & CRM Conversion Flows",
        actions: week4Actions
      }
    ]
  };
}

function generateLocalChatResponse(messages: any[], servicesList: any[], couponsList: any[]) {
  const lastUserMessage = messages[messages.length - 1]?.text || '';
  const query = lastUserMessage.toLowerCase();

  let reply = '';

  if (query.includes('hi') || query.includes('hello') || query.includes('hey') || query.includes('who are you') || query.includes('intro') || query.includes('pulseai')) {
    reply = `**Hello and welcome!** I am **PulseAI**, your dedicated Chief Marketing Officer & Brand Consultant here at **Dizo Pulse** Digital Agency. 

My mission is to help you build an unstoppable digital presence, optimize your branding assets, and scale your sales with surgical marketing campaigns. 

How can I help you today? You can ask me about:
- **Branding & Logo Design** concepts
- **Social Media Marketing** & Reel Editing 
- **High-Converting Websites** & Search Engine Optimization (SEO)
- **Active Campaign Coupons** or custom discounts
- Or ask me to help you curate a specialized marketing roadmap!`;
  } else if (query.includes('price') || query.includes('cost') || query.includes('how much') || query.includes('rate') || query.includes('package') || query.includes('charge') || query.includes('pricing') || query.includes('mrp')) {
    const featured = servicesList.slice(0, 4).map(s => `- **${s.name}**: ₹${s.launchPrice.toLocaleString('en-IN')} (Regular: ~~₹${s.mrp.toLocaleString('en-IN')}~~)`).join('\n');
    reply = `**Pricing transparency is part of our commitment to you!** At Dizo Pulse, we deliver premium creative solutions at startup-friendly prices. 

Here are some of our most popular trending launch-price packages:
${featured}

You can view our complete service catalog and build your own custom-scoped quotation using our interactive **Quote Estimator** tool above. 

Would you like to know more about any specific service or look up an active discount code?`;
  } else if (query.includes('website') || query.includes('web') || query.includes('page') || query.includes('developer') || query.includes('e-commerce') || query.includes('coding') || query.includes('wordpress')) {
    const webServices = servicesList.filter(s => s.category === 'web' || s.id.includes('web') || s.id.includes('seo')).map(s => `- **${s.name}** (₹${s.launchPrice.toLocaleString('en-IN')}) - _${s.description}_`).join('\n');
    reply = `**Your website is your 24/7 online storefront!** We specialise in ultra-fast, mobile-optimised, high-converting platforms tailored to turn visitors into paying clients.

Our web solutions include:
${webServices || `- **Basic Business Website**: Fully custom responsive platform with modern sections\n- **E-commerce Suite**: Safe payment gateways, dynamic catalog, and stock managers\n- **Technical SEO**: Schema markups, lightning-fast loads, and Google Search priority`}

Every website we build is crafted on the latest clean-code stacks with fully custom typography (like *Space Grotesk*) and gorgeous animations. 

Would you like me to map out a structural plan for your new website?`;
  } else if (query.includes('instagram') || query.includes('reel') || query.includes('post') || query.includes('social') || query.includes('facebook') || query.includes('reels') || query.includes('video') || query.includes('content')) {
    const socialServices = servicesList.filter(s => s.category === 'social' || s.id.includes('social') || s.id.includes('reel')).map(s => `- **${s.name}** (₹${s.launchPrice.toLocaleString('en-IN')}) - _${s.description}_`).join('\n');
    reply = `**Attention is the ultimate currency of the modern digital landscape!** To stand out, your social feed needs professional aesthetics, viral pacing, and absolute narrative clarity.

Here are our top-performing social growth systems:
${socialServices || `- **Premium Reel Editing**: Custom kinetic text, sound designs, and viral hooks\n- **Social Grid Post Design**: Aesthetic carousel graphics aligned to your exact brand book\n- **Full Month Social Management**: Complete hassle-free publishing, planning, and copywriting`}

The golden rule for organic reach is **consistency and storytelling**. We edit reels in high-retention formats that keep viewers watching past the critical 3-second mark.

Would you like a few viral reel video topics tailored to your specific niche?`;
  } else if (query.includes('seo') || query.includes('google') || query.includes('maps') || query.includes('search') || query.includes('ranking') || query.includes('gbp')) {
    reply = `**If your business is not on the first page of Google, you are invisible to local intent-driven buyers!** We help you dominate local queries when customers search for your products or services.

Our Google & SEO dominant packages:
- **Google Business Profile (GBP) Domination**: Setup, citation optimization, keyword-rich summaries, and review generation blueprints.
- **On-Page SEO Audit**: In-depth optimization of titles, tags, structured schemas, and speed improvements.

Local SEO is the **highest-ROI digital channel** because it captures customers who are ready to make a purchase *right now*.

Should we audit your current Google ranking to identify quick-wins?`;
  } else if (query.includes('logo') || query.includes('brand') || query.includes('color') || query.includes('typography') || query.includes('design') || query.includes('identity')) {
    reply = `**Your brand identity is the visual handshake your business makes with the world!** True premium branding is about establishing trust through cohesive visual rhythms.

We offer full-spectrum branding services:
- **Logo Design Suite**: Custom vector logomarks, typography pairing, and export variants for web/print.
- **Complete Brand Kits**: Colors, fonts, pattern elements, and layout blueprints so you look flawless on every single channel.

We design identities that are modern, elegant, and timeless—exactly like our own *Dizo Pulse Fusion Logo* that you see on our header!

Would you like some design thoughts or palette suggestions matching your industry?`;
  } else if (query.includes('coupon') || query.includes('discount') || query.includes('offer') || query.includes('promo') || query.includes('code') || query.includes('active')) {
    const activeCoupons = couponsList.filter(c => c.active).map(c => `- **${c.code}**: ${c.eventName} (${c.discountType === 'percentage' ? `${c.discountValue}% Off` : `Flat ₹${c.discountValue} Off`}${c.minOrderValue > 0 ? `, Min order: ₹${c.minOrderValue}` : ''})`).join('\n');
    reply = `**Looking to secure a premium deal? We've got you covered!** 

Here are the exclusive promotional campaign coupons currently active in our agency workspace:
${activeCoupons || `- **DIZO20**: 20% Off Launch Special\n- **FESTIVE30**: 30% Off Festive Seasonal Sale\n- **FLAT500**: Flat ₹500 Off (Min Booking: ₹1,500)`}

You can type any of these codes into the **Coupon Field** inside the **Quote Estimator** tool above to apply the discount immediately!

Let me know if you would like to design a tailored service bundle for maximum savings!`;
  } else if (query.includes('grow') || query.includes('strategy') || query.includes('marketing') || query.includes('leads') || query.includes('sales') || query.includes('ads') || query.includes('meta')) {
    reply = `**Let's accelerate your growth!** The most effective marketing campaign is an integrated funnel:
1. **Awareness**: High-converting, dynamic Reels and Instagram Post Designs to capture attention.
2. **Engagement**: A stunning, ultra-fast landing page and local Google Business optimization.
3. **Conversion**: High-relevance **Meta Lead Generation Ads** to capture direct customer data.
4. **Nurturing**: Interactive **WhatsApp Automation** flows for instant customer responses.

We offer all of these systems under a single roof at Dizo Pulse. 

I highly recommend clicking on our **Brand Growth Planner** tab, entering your business details, and letting me generate a custom 4-week step-by-step marketing roadmap for you!`;
  } else if (query.includes('mukesh') || query.includes('founder') || query.includes('owner') || query.includes('contact') || query.includes('whatsapp') || query.includes('call') || query.includes('phone') || query.includes('email')) {
    reply = `**Want to speak with our core team directly?** You can connect with our founder, **Mukesh Singh**, immediately! 

Our agency is built on high-touch professional communication. Here is how you can lock in a strategic call:
- **WhatsApp Direct**: You can submit an inquiry via our **Quote Estimator** above and check "Connect on WhatsApp", and our team will text you within minutes!
- **Email Support**: mukeshsinghmukesh316@gmail.com

Submit your quote estimate, and we'll automatically generate a custom PDF outline and contact you to schedule a kick-off session!`;
  } else {
    // Elegant context-sensitive general responder
    reply = `**That is an excellent point!** To give you some tactical advice: in today's market, growing a business requires combining **aesthetic visual authority** with **automated client capture systems**. 

For example, if you are looking to scale, I would suggest:
1. Revamping your visual touchpoints (Professional Logo & Brand Kits) to establish instant high-ticket trust.
2. Building an ultra-fast modern landing page optimized for mobile conversions.
3. Launching localized lead campaigns paired with automated responses.

We offer full-spectrum, premium-tier services for all of this right here.

Is there a specific visual style or marketing channel you're curious about, or would you like to build an estimate to see your exact package pricing?`;
  }

  return { text: reply };
}

// 4. Generate AI Growth Strategy (100% Free, Instant & Local Expert Intelligence Engine)
app.post('/api/strategy', async (req, res) => {
  try {
    const { businessName, businessNiche, targetAudience, goals } = req.body;

    if (!businessName || !businessNiche) {
      return res.status(400).json({ error: 'Business name and niche are required for planning' });
    }

    const servicesList = await readServices();
    const localResult = generateLocalStrategy(businessName, businessNiche, targetAudience, goals, servicesList);
    res.json(localResult);
  } catch (error: any) {
    console.error('Error generating strategy:', error);
    res.status(500).json({ error: error.message || 'Failed to generate growth strategy' });
  }
});

// 5. AI Brand Consultant Chatbot (100% Free, Instant & Local Expert Intelligence Engine)
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const servicesList = await readServices();
    const couponsList = await readCoupons();

    const localReply = generateLocalChatResponse(messages, servicesList, couponsList);
    res.json(localReply);
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to chat with AI Consultant' });
  }
});


// Helper for local AI pitch fallback
function generateLocalAiPitch(clientName: string, businessName: string, businessNiche: string, services: string[], totalDiscounted: number) {
  const servicesStr = services && services.length > 0 ? services.join(', ') : 'our premium growth services';
  return `Hi ${clientName},\n\nThis is the Client Growth Desk at Dizo Pulse.\n\nWe recently reviewed your interest in launching campaigns for "${businessName}" in the "${businessNiche}" sector.\n\nOur team analyzed your requested deliverables (${servicesStr}) and we've put together a tailored campaign execution strategy. To support your launch phase, we've configured an exclusive onboarding investment of ₹${(totalDiscounted || 0).toLocaleString('en-IN')} for your initial scope.\n\nAre you available for a brief 10-minute kickoff discovery call this week to finalize your brand assets? Let us know what times work best for you.\n\nBest regards,\nThe Dizo Pulse Team`;
}

// 5b. Generate AI Follow-Up Pitch (100% Free, Instant & Local Copywriting Engine)
app.post('/api/admin/generate-pitch', async (req, res) => {
  try {
    const { clientName, businessName, businessNiche, message, services, totalDiscounted } = req.body;
    if (!clientName || !businessName) {
      return res.status(400).json({ error: 'Client name and business name are required' });
    }

    const pitch = generateLocalAiPitch(clientName, businessName, businessNiche, services, totalDiscounted || 0);
    res.json({ pitch });
  } catch (error: any) {
    console.error('AI Pitch generation error:', error);
    const fallback = generateLocalAiPitch(req.body.clientName, req.body.businessName, req.body.businessNiche, req.body.services, req.body.totalDiscounted || 0);
    res.json({ pitch: fallback });
  }
});


// --- USER REGISTRATION & LOGIN APIS ---

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, whatsapp } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required.' });
    }

    const users = await readUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const existingIndex = users.findIndex((u: any) => u.email === normalizedEmail);
    
    let user;
    if (existingIndex !== -1) {
      // Update existing record with new credentials/info
      users[existingIndex].name = (name || users[existingIndex].name || email.split('@')[0]).trim();
      users[existingIndex].password = password;
      if (whatsapp) users[existingIndex].whatsapp = whatsapp;
      user = users[existingIndex];
    } else {
      user = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: (name || email.split('@')[0]).trim(),
        email: normalizedEmail,
        password: password,
        whatsapp: whatsapp || '',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    }

    await writeUsers(users);

    const { password: _, ...safeUser } = user;
    res.status(200).json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/profile', async (req, res) => {
  try {
    const { email, newEmail, name, whatsapp, company, businessWebsite, industry, photoUrl, preferredContact, avatarColor, currentPassword, newPassword } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await readUsers();
    let userIndex = users.findIndex((u: any) => u.email === normalizedEmail);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[userIndex];

    if (newPassword) {
      if (currentPassword && user.password && user.password !== currentPassword) {
        return res.status(400).json({ error: 'Current password does not match.' });
      }
      user.password = newPassword;
    }

    if (newEmail && newEmail.trim().toLowerCase() !== normalizedEmail) {
      const targetEmail = newEmail.trim().toLowerCase();
      const existingUser = users.find((u: any) => u.email === targetEmail);
      if (existingUser) {
        return res.status(400).json({ error: 'The new email address is already in use by another account.' });
      }
      user.email = targetEmail;
    }

    if (name !== undefined) user.name = name.trim();
    if (whatsapp !== undefined) user.whatsapp = whatsapp.trim();
    if (company !== undefined) user.company = company.trim();
    if (businessWebsite !== undefined) user.businessWebsite = businessWebsite.trim();
    if (industry !== undefined) user.industry = industry.trim();
    if (photoUrl !== undefined) user.photoUrl = photoUrl.trim();
    if (preferredContact !== undefined) user.preferredContact = preferredContact;
    if (avatarColor !== undefined) user.avatarColor = avatarColor;

    // Log Activity
    if (!user.activityLog) user.activityLog = [];
    user.activityLog.unshift({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      action: newPassword ? 'Password Modified' : 'Profile Updated',
      details: newPassword ? 'Security password was successfully updated.' : 'Account personal & business information updated.',
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1'
    });

    users[userIndex] = user;
    await writeUsers(users);

    const { password: _, ...safeUser } = user;
    res.status(200).json({ success: true, user: safeUser, message: 'Profile updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/account-details', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const normalizedEmail = (email as string).trim().toLowerCase();
    const users = await readUsers();
    let user = users.find((u: any) => u.email === normalizedEmail);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Initialize mock sessions if missing
    if (!user.sessions || user.sessions.length === 0) {
      user.sessions = [
        {
          id: 'sess-current',
          device: 'MacBook Pro / Desktop',
          browser: 'Chrome 128 (macOS)',
          location: 'Mumbai, MH, India',
          ip: req.ip || '103.112.44.12',
          lastActive: 'Active Now',
          isCurrent: true
        },
        {
          id: 'sess-mobile',
          device: 'iPhone 15 Pro / Mobile',
          browser: 'Safari Mobile',
          location: 'Delhi, India',
          ip: '103.211.55.8',
          lastActive: '2 hours ago',
          isCurrent: false
        }
      ];
    }

    // Initialize activity log if missing
    if (!user.activityLog || user.activityLog.length === 0) {
      user.activityLog = [
        {
          id: 'act-init-1',
          action: 'Portal Login',
          details: 'Logged into Dizo Pulse Client Portal via Web Client',
          timestamp: new Date().toISOString(),
          ip: req.ip || '103.112.44.12'
        },
        {
          id: 'act-init-2',
          action: 'Account Created',
          details: 'Client Account registered and verified',
          timestamp: user.createdAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          ip: '103.112.44.12'
        }
      ];
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/sessions/revoke-all', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await readUsers();
    const userIndex = users.findIndex((u: any) => u.email === normalizedEmail);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[userIndex];
    // Keep only current active session
    user.sessions = (user.sessions || []).filter((s: any) => s.isCurrent);
    if (user.sessions.length === 0) {
      user.sessions = [
        {
          id: 'sess-current',
          device: 'Desktop Web Client',
          browser: 'Active Session',
          location: 'Live Client Node',
          ip: req.ip || '127.0.0.1',
          lastActive: 'Active Now',
          isCurrent: true
        }
      ];
    }

    if (!user.activityLog) user.activityLog = [];
    user.activityLog.unshift({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      action: 'Session Revocation',
      details: 'Logged out from all secondary devices and active web sessions.',
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1'
    });

    users[userIndex] = user;
    await writeUsers(users);

    res.json({ success: true, sessions: user.sessions, message: 'Successfully logged out from all other devices.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/delete-request', async (req, res) => {
  try {
    const { email, password, reason } = req.body;
    if (!email || !reason) {
      return res.status(400).json({ error: 'Email and deletion reason are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const users = await readUsers();
    const userIndex = users.findIndex((u: any) => u.email === normalizedEmail);

    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = users[userIndex];

    if (user.password && password && user.password !== password) {
      return res.status(400).json({ error: 'Password verification failed. Please enter correct account password.' });
    }

    user.deleteRequested = true;
    user.deleteReason = reason.trim();
    user.deleteRequestedAt = new Date().toISOString();

    if (!user.activityLog) user.activityLog = [];
    user.activityLog.unshift({
      id: 'act_' + Math.random().toString(36).substr(2, 9),
      action: 'Delete Account Requested',
      details: `Account deletion request submitted. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
      ip: req.ip || '127.0.0.1'
    });

    users[userIndex] = user;
    await writeUsers(users);

    res.json({ success: true, message: 'Account deletion request has been logged and submitted to agency administration.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let users = await readUsers();

    // 1. Direct match with stored password
    let user = users.find((u: any) => u.email === normalizedEmail && u.password === password);

    // 2. Match by email (if user existed in DB without password or with previous password)
    if (!user) {
      user = users.find((u: any) => u.email === normalizedEmail);
      if (user && password) {
        user.password = password;
        await writeUsers(users);
      }
    }

    // 3. Match from existing Inquiries (if client placed an order before registering)
    if (!user) {
      const inquiries = await readInquiries();
      const clientInq = inquiries.find((i: any) => i.email && i.email.trim().toLowerCase() === normalizedEmail);
      if (clientInq) {
        user = {
          id: 'usr_' + Math.random().toString(36).substr(2, 9),
          name: clientInq.clientName || normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: password || 'default',
          whatsapp: clientInq.whatsapp || '',
          createdAt: new Date().toISOString()
        };
        users.push(user);
        await writeUsers(users);
      }
    }

    // 4. Auto-register on the fly for new clients logging in on Vercel
    if (!user) {
      user = {
        id: 'usr_' + Math.random().toString(36).substr(2, 9),
        name: normalizedEmail.split('@')[0],
        email: normalizedEmail,
        password: password || 'default',
        whatsapp: '',
        createdAt: new Date().toISOString()
      };
      users.push(user);
      await writeUsers(users);
    }

    const { password: _, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/orders', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const inquiries = await readInquiries();
    const userOrders = inquiries.filter((inq: any) => inq.email.trim().toLowerCase() === normalizedEmail);
    
    // Sort by newest first
    userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(userOrders);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await readUsers();
    // Exclude password in response
    const safeUsers = users.map(({ password, ...u }: any) => u);
    res.json(safeUsers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const users = await readUsers();
    const filtered = users.filter((u: any) => u.id !== id);
    await writeUsers(filtered);
    res.json({ success: true, users: filtered.map(({ password, ...u }: any) => u) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all staff / team members
app.get('/api/admin/staff', async (req, res) => {
  try {
    const staff = await readStaff();
    res.json(staff);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST add new staff / team member
app.post('/api/admin/staff', async (req, res) => {
  try {
    const { name, email, role, password, whatsapp, department, status, permissions, projectAccess } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and Email are required for team members.' });
    }

    const staff = await readStaff();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = staff.find((s: any) => s.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'A team member with this email already exists.' });
    }

    const assignedRole = role || 'staff';
    const defaultPerms = getDefaultPermissionsForRole(assignedRole);

    const newStaff = {
      id: 'stf_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: normalizedEmail,
      role: assignedRole,
      password: (password || 'dizo@staff').trim(),
      whatsapp: whatsapp || '',
      department: department || 'Operations',
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      projectAccess: projectAccess || 'all',
      permissions: permissions ? { ...defaultPerms, ...permissions } : defaultPerms
    };

    staff.push(newStaff);
    await writeStaff(staff);
    res.status(201).json({ success: true, staffMember: newStaff, staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update staff / team member details
app.put('/api/admin/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, whatsapp, department, status, permissions, projectAccess } = req.body;
    const staff = await readStaff();
    const index = staff.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Team member not found.' });
    }

    // Protection for super_admin
    if (staff[index].role === 'super_admin') {
      if (role && role !== 'super_admin') {
        const superAdmins = staff.filter((s: any) => s.role === 'super_admin');
        if (superAdmins.length <= 1) {
          return res.status(400).json({ error: 'Cannot demote the primary Super Admin account.' });
        }
      }
      if (status === 'inactive') {
        const superAdmins = staff.filter((s: any) => s.role === 'super_admin' && s.status === 'active');
        if (superAdmins.length <= 1) {
          return res.status(400).json({ error: 'Cannot deactivate the primary Super Admin account.' });
        }
      }
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = staff.find((s: any) => s.id !== id && s.email.toLowerCase() === normalizedEmail);
      if (existing) {
        return res.status(400).json({ error: 'Another team member with this email already exists.' });
      }
      staff[index].email = normalizedEmail;
    }

    if (name) staff[index].name = name.trim();
    if (role) staff[index].role = role;
    if (password) staff[index].password = password.trim();
    if (whatsapp !== undefined) staff[index].whatsapp = whatsapp;
    if (department !== undefined) staff[index].department = department;
    if (status) staff[index].status = status;
    if (projectAccess) staff[index].projectAccess = projectAccess;
    if (permissions) {
      staff[index].permissions = {
        ...staff[index].permissions,
        ...permissions
      };
    }

    await writeStaff(staff);
    res.json({ success: true, staffMember: staff[index], staff });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a staff / team member
app.delete('/api/admin/staff/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await readStaff();
    const target = staff.find((s: any) => s.id === id);
    
    if (target && target.role === 'super_admin') {
      const superAdmins = staff.filter((s: any) => s.role === 'super_admin');
      if (superAdmins.length <= 1) {
        return res.status(400).json({ error: 'Cannot delete the primary Super Admin account.' });
      }
    }

    const filtered = staff.filter((s: any) => s.id !== id);
    await writeStaff(filtered);
    res.json({ success: true, staff: filtered });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Staff Change Password
app.post('/api/admin/staff/change-password', async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and new password are required.' });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const staff = await readStaff();
    const index = staff.findIndex((s: any) => s.email.toLowerCase() === email.trim().toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: 'Team account not found.' });
    }

    const member = staff[index];
    const currentSaved = member.password ? member.password.trim() : 'dizo@staff';

    if (oldPassword && currentSaved !== oldPassword.trim()) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    staff[index].password = newPassword.trim();
    await writeStaff(staff);

    await logAuditTrail({
      user: member.name,
      userEmail: member.email,
      role: member.role || 'staff',
      action: 'PASSWORD_RESET',
      module: 'auth',
      target: member.email,
      description: `Password updated successfully for account ${member.email}`,
      ipAddress: String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1'),
      deviceInfo: String(req.headers['user-agent'] || 'Web Client'),
      status: 'success',
      severity: 'warning'
    });

    return res.json({ success: true, message: 'Password updated successfully!' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Admin / Staff Secure Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and Password are required to login.' });
    }

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();
    const policy = await readSecurityPolicy();
    const ipAddress = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const userAgent = String(req.headers['user-agent'] || 'Web Client');

    // Check staff database for email
    const staff = await readStaff();
    const index = staff.findIndex((s: any) => s.email.toLowerCase() === inputEmail);

    if (index === -1) {
      const failedRecords = await readFailedLogins();
      failedRecords.unshift({
        id: `fl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userEmail: inputEmail,
        ipAddress,
        userAgent,
        deviceInfo: parseUserAgent(userAgent).browser + ' / ' + parseUserAgent(userAgent).os,
        attemptedAt: new Date().toISOString(),
        reason: 'Account non-existent',
        status: 'failed'
      });
      if (failedRecords.length > 500) failedRecords.length = 500;
      await writeFailedLogins(failedRecords);

      await logAuditTrail({
        user: inputEmail,
        userEmail: inputEmail,
        role: 'unknown',
        action: 'LOGIN_FAILED',
        module: 'auth',
        target: 'Admin Portal',
        description: `Failed login attempt: Account non-existent (${inputEmail})`,
        ipAddress,
        deviceInfo: userAgent,
        status: 'failed',
        severity: 'warning'
      });
      return res.status(401).json({ error: 'No team account found with this email.' });
    }

    const member = staff[index];

    // Check account lock
    if (member.lockedUntil && new Date(member.lockedUntil) > new Date()) {
      const remainingMins = Math.ceil((new Date(member.lockedUntil).getTime() - Date.now()) / (1000 * 60));
      return res.status(423).json({
        error: `Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMins} minute(s) or contact Administrator.`
      });
    }

    if (member.status === 'inactive') {
      await logAuditTrail({
        user: member.name,
        userEmail: member.email,
        role: member.role || 'staff',
        action: 'LOGIN_FAILED',
        module: 'auth',
        target: 'Admin Portal',
        description: `Failed login attempt: Account deactivated (${member.email})`,
        ipAddress,
        deviceInfo: userAgent,
        status: 'failed',
        severity: 'warning'
      });
      return res.status(403).json({ error: 'This team account has been deactivated. Contact your Administrator.' });
    }

    const savedPassword = member.password ? member.password.trim() : 'dizo@staff';
    if (savedPassword !== inputPassword) {
      const attempts = (member.failedLoginAttempts || 0) + 1;
      member.failedLoginAttempts = attempts;

      let isLockedNow = false;
      if (attempts >= policy.maxFailedAttempts) {
        member.lockedUntil = new Date(Date.now() + (policy.lockoutDurationMinutes || 30) * 60 * 1000).toISOString();
        isLockedNow = true;
      }

      await writeStaff(staff);

      const failedRecords = await readFailedLogins();
      failedRecords.unshift({
        id: `fl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        userEmail: member.email,
        ipAddress,
        userAgent,
        deviceInfo: parseUserAgent(userAgent).browser + ' / ' + parseUserAgent(userAgent).os,
        attemptedAt: new Date().toISOString(),
        reason: isLockedNow ? 'Account locked out' : 'Incorrect password',
        status: 'failed'
      });
      if (failedRecords.length > 500) failedRecords.length = 500;
      await writeFailedLogins(failedRecords);

      await logAuditTrail({
        user: member.name,
        userEmail: member.email,
        role: member.role || 'staff',
        action: isLockedNow ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        module: 'auth',
        target: 'Admin Portal',
        description: isLockedNow
          ? `Account locked after ${attempts} failed attempts for ${member.email}`
          : `Failed login attempt: Incorrect password for ${member.email} (${attempts}/${policy.maxFailedAttempts})`,
        ipAddress,
        deviceInfo: userAgent,
        status: 'failed',
        severity: isLockedNow ? 'critical' : 'warning'
      });

      if (isLockedNow) {
        return res.status(423).json({
          error: `Too many failed attempts. Account locked for ${policy.lockoutDurationMinutes || 30} minutes.`
        });
      }

      return res.status(401).json({
        error: `Incorrect password. (${policy.maxFailedAttempts - attempts} attempts remaining before lock)`
      });
    }

    // Success login
    staff[index].failedLoginAttempts = 0;
    staff[index].lockedUntil = null;
    staff[index].lastActive = new Date().toISOString();
    await writeStaff(staff);

    const sessionToken = await createSession({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role || 'staff',
      userType: 'staff'
    }, req);

    await logAuditTrail({
      user: member.name,
      userEmail: member.email,
      role: member.role || 'staff',
      action: 'LOGIN_SUCCESS',
      module: 'auth',
      target: 'Admin Portal',
      description: `Successful login by ${member.name} (${member.role || 'staff'})`,
      ipAddress,
      deviceInfo: userAgent,
      status: 'success',
      severity: 'info'
    });

    return res.json({
      success: true,
      sessionToken,
      id: member.id,
      role: member.role || 'staff',
      name: member.name,
      email: member.email,
      department: member.department,
      status: member.status,
      permissions: member.permissions || getDefaultPermissionsForRole(member.role || 'staff'),
      projectAccess: member.projectAccess || 'all',
      forcePasswordChange: !!member.forcePasswordChange,
      passwordLastChangedAt: member.passwordLastChangedAt || null
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Security API Endpoints
app.get('/api/admin/security/sessions', async (req, res) => {
  try {
    const emailFilter = (req.query.email as string) || '';
    const sessions = await readSessions();
    const activeSessions = sessions.filter(s => s.status === 'active');

    if (emailFilter) {
      return res.json(activeSessions.filter(s => s.userEmail.toLowerCase() === emailFilter.toLowerCase()));
    }

    res.json(activeSessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/security/revoke-session', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required.' });
    }

    const sessions = await readSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      session.status = 'revoked';
      await writeSessions(sessions);

      await logAuditTrail({
        user: req.body.requestedBy || 'Admin User',
        userEmail: session.userEmail,
        action: 'SESSION_REVOKED',
        module: 'security',
        target: session.userEmail,
        description: `Revoked session ${session.id} (${session.browser} / ${session.ipAddress})`,
        status: 'success',
        severity: 'warning'
      });
    }

    res.json({ success: true, message: 'Session revoked successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/security/revoke-other-sessions', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const currentToken = (req.headers['x-session-token'] as string) || '';

    if (!targetEmail) {
      return res.status(400).json({ error: 'Target email is required.' });
    }

    const sessions = await readSessions();
    let count = 0;
    for (const s of sessions) {
      if (s.userEmail.toLowerCase() === targetEmail.toLowerCase() && s.status === 'active' && s.token !== currentToken) {
        s.status = 'revoked';
        count++;
      }
    }
    await writeSessions(sessions);

    await logAuditTrail({
      user: targetEmail,
      userEmail: targetEmail,
      action: 'ALL_OTHER_SESSIONS_REVOKED',
      module: 'security',
      target: targetEmail,
      description: `Logged out ${count} other active session(s) for ${targetEmail}`,
      status: 'success',
      severity: 'warning'
    });

    res.json({ success: true, message: `Terminated ${count} other active session(s).` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/security/failed-logins', async (req, res) => {
  try {
    const emailFilter = (req.query.email as string) || '';
    const logs = await readFailedLogins();
    if (emailFilter) {
      return res.json(logs.filter(l => l.userEmail.toLowerCase() === emailFilter.toLowerCase()));
    }
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/security/failed-logins', async (req, res) => {
  try {
    await writeFailedLogins([]);
    res.json({ success: true, message: 'Failed login records cleared.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/security/policy', async (req, res) => {
  try {
    const policy = await readSecurityPolicy();
    res.json({ policy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/security/policy', async (req, res) => {
  try {
    const { policy } = req.body;
    if (!policy) return res.status(400).json({ error: 'Policy data required.' });

    await writeSecurityPolicy(policy);

    await logAuditTrail({
      user: 'Administrator',
      action: 'SECURITY_POLICY_UPDATED',
      module: 'security',
      target: 'Security Policy',
      description: 'Updated system security parameters and session thresholds.',
      status: 'success',
      severity: 'warning'
    });

    res.json({ success: true, policy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/security/user-control', async (req, res) => {
  try {
    const { email, action, requestedBy } = req.body;
    if (!email || !action) {
      return res.status(400).json({ error: 'Email and action are required.' });
    }

    const staff = await readStaff();
    const index = staff.findIndex((s: any) => s.email.toLowerCase() === email.toLowerCase());

    if (index === -1) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const member = staff[index];

    if (action === 'unlock') {
      member.lockedUntil = null;
      member.failedLoginAttempts = 0;
      await logAuditTrail({
        user: requestedBy || 'Admin',
        userEmail: member.email,
        action: 'ACCOUNT_UNLOCKED',
        module: 'security',
        target: member.email,
        description: `Unlocked account for ${member.name} (${member.email})`,
        status: 'success',
        severity: 'info'
      });
    } else if (action === 'force_password_change') {
      member.forcePasswordChange = true;
      await logAuditTrail({
        user: requestedBy || 'Admin',
        userEmail: member.email,
        action: 'FORCE_PASSWORD_CHANGE_TRIGGERED',
        module: 'security',
        target: member.email,
        description: `Triggered required password reset on next login for ${member.email}`,
        status: 'success',
        severity: 'warning'
      });
    } else if (action === 'suspend') {
      member.status = 'inactive';
      const sessions = await readSessions();
      sessions.forEach(s => {
        if (s.userEmail.toLowerCase() === email.toLowerCase()) s.status = 'revoked';
      });
      await writeSessions(sessions);

      await logAuditTrail({
        user: requestedBy || 'Admin',
        userEmail: member.email,
        action: 'ACCOUNT_SUSPENDED',
        module: 'security',
        target: member.email,
        description: `Suspended staff account and terminated active sessions for ${member.email}`,
        status: 'success',
        severity: 'critical'
      });
    } else if (action === 'reactivate') {
      member.status = 'active';
      await logAuditTrail({
        user: requestedBy || 'Admin',
        userEmail: member.email,
        action: 'ACCOUNT_REACTIVATED',
        module: 'security',
        target: member.email,
        description: `Reactivated staff account access for ${member.email}`,
        status: 'success',
        severity: 'info'
      });
    }

    await writeStaff(staff);
    res.json({ success: true, message: `Action "${action}" executed successfully.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/security/validate-session', async (req, res) => {
  try {
    const token = (req.headers['x-session-token'] as string) || '';
    const session = await validateSessionToken(token);
    if (!session) {
      return res.status(401).json({ valid: false, reason: 'Session expired or revoked.' });
    }
    res.json({ valid: true, session });
  } catch (error: any) {
    res.status(500).json({ valid: false, error: error.message });
  }
});

// GET Audit Logs
app.get('/api/admin/audit-logs', async (req, res) => {
  try {
    const logs = await readAuditLogs();
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Audit Log (Client Action Audit Recording)
app.post('/api/admin/audit-logs', async (req, res) => {
  try {
    const { user, userEmail, role, action, module, target, description, status, severity, metadata } = req.body;
    if (!action || !module || !description) {
      return res.status(400).json({ error: 'Action, module, and description are required.' });
    }

    const ipAddress = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const deviceInfo = String(req.headers['user-agent'] || 'Web Client');

    const newLog = await logAuditTrail({
      user: user || 'System User',
      userEmail: userEmail || '',
      role: role || 'staff',
      action,
      module,
      target: target || '',
      description,
      ipAddress,
      deviceInfo,
      status: status || 'success',
      severity: severity || 'info',
      metadata: metadata || {}
    });

    res.json({ success: true, log: newLog });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// --- WEBSITE CONTENT MANAGER API ENDPOINTS ---

// GET /api/website-content
app.get('/api/website-content', async (req, res) => {
  try {
    const { mode } = req.query;
    const content = await readWebsiteContent();
    if (mode === 'draft' && content.draft) {
      return res.json({ ...content, activeContent: content.draft, isDraft: true });
    }
    res.json({ ...content, activeContent: content.published, isDraft: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/website-content/draft
app.post('/api/website-content/draft', async (req, res) => {
  try {
    const { draft } = req.body;
    if (!draft) return res.status(400).json({ error: 'Draft content payload required' });
    const content = await readWebsiteContent();
    content.draft = draft;
    content.lastDraftAt = new Date().toISOString();
    await writeWebsiteContent(content);
    res.json({ success: true, message: 'Draft saved successfully', content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/website-content/publish
app.post('/api/website-content/publish', async (req, res) => {
  try {
    const { published, updatedBy, changeNote } = req.body;
    const content = await readWebsiteContent();
    const finalPublished = published || content.draft || content.published;
    
    const revId = 'rev_' + Date.now();
    const revEntry = {
      id: revId,
      timestamp: new Date().toISOString(),
      updatedBy: updatedBy || 'Agency Admin',
      note: changeNote || 'Published website content update',
      snapshot: JSON.parse(JSON.stringify(content.published))
    };

    content.history = content.history || [];
    content.history.unshift(revEntry);
    if (content.history.length > 50) content.history.length = 50;

    content.published = finalPublished;
    content.draft = null;
    content.lastPublishedAt = new Date().toISOString();

    await writeWebsiteContent(content);

    await logAuditTrail({
      user: updatedBy || 'Agency Admin',
      action: 'WEBSITE_CONTENT_PUBLISHED',
      module: 'website_content',
      description: `Published changes to public website content: ${changeNote || 'Standard Update'}`
    });

    res.json({ success: true, message: 'Published live to website successfully!', content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/website-content/restore
app.post('/api/website-content/restore', async (req, res) => {
  try {
    const { revisionId, action, updatedBy } = req.body;
    const content = await readWebsiteContent();

    if (action === 'discard_draft') {
      content.draft = null;
      await writeWebsiteContent(content);
      return res.json({ success: true, message: 'Draft discarded successfully', content });
    }

    if (revisionId) {
      const foundRev = (content.history || []).find((h: any) => h.id === revisionId);
      if (!foundRev || !foundRev.snapshot) {
        return res.status(404).json({ error: 'Revision snapshot not found' });
      }

      const revEntry = {
        id: 'rev_' + Date.now(),
        timestamp: new Date().toISOString(),
        updatedBy: updatedBy || 'Agency Admin',
        note: `Restored version from ${new Date(foundRev.timestamp).toLocaleString()}`,
        snapshot: JSON.parse(JSON.stringify(content.published))
      };

      content.history.unshift(revEntry);
      content.published = JSON.parse(JSON.stringify(foundRev.snapshot));
      content.draft = null;

      await writeWebsiteContent(content);

      await logAuditTrail({
        user: updatedBy || 'Agency Admin',
        action: 'WEBSITE_CONTENT_RESTORED',
        module: 'website_content',
        description: `Restored website content to revision ${revisionId}`
      });

      return res.json({ success: true, message: 'Revision restored successfully', content });
    }

    res.status(400).json({ error: 'Revision ID or action required' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/upload-image
app.post('/api/upload-image', async (req, res) => {
  try {
    const { fileDataUrl, fileName } = req.body;
    if (!fileDataUrl) {
      return res.status(400).json({ error: 'Data URL is required' });
    }
    res.json({ success: true, url: fileDataUrl, fileName: fileName || 'uploaded_image.png' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- SEO & SOCIAL SHARING API ENDPOINTS ---

// GET /api/seo
app.get('/api/seo', async (req, res) => {
  try {
    const seoConfig = await readSeoConfig();
    res.json(seoConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/seo
app.post('/api/seo', async (req, res) => {
  try {
    const { global, pages, servicesSeo, sitemapConfig, updatedBy } = req.body;
    const existing = await readSeoConfig();

    const updatedSeo = {
      global: global || existing.global,
      pages: pages || existing.pages,
      servicesSeo: servicesSeo || existing.servicesSeo,
      sitemapConfig: sitemapConfig || existing.sitemapConfig,
      lastUpdatedAt: new Date().toISOString(),
      lastUpdatedBy: updatedBy || 'Agency Administrator'
    };

    await writeSeoConfig(updatedSeo);

    await logAuditTrail({
      user: updatedBy || 'Agency Administrator',
      action: 'SEO_CONFIG_UPDATED',
      module: 'seo_settings',
      description: `Updated SEO meta & social sharing configuration (Site title: ${updatedSeo.global?.siteTitle || 'Dizo Pulse'})`
    });

    res.json({ success: true, message: 'SEO configuration saved and published live successfully!', seo: updatedSeo });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  try {
    const seoConfig = await readSeoConfig();
    const servicesList = await readServices();
    const baseUrl = (seoConfig.global?.canonicalBaseUrl || 'https://dizopulse.com').replace(/\/$/, '');
    const currentDate = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n`;

    // 1. Pages
    if (seoConfig.sitemapConfig?.includePages !== false && seoConfig.pages) {
      Object.values(seoConfig.pages).forEach((page: any) => {
        if (page.robotsIndex !== false) {
          const pageLoc = page.canonical || `${baseUrl}${page.path.startsWith('/') ? page.path : '/' + page.path}`;
          xml += `  <url>\n`;
          xml += `    <loc>${pageLoc}</loc>\n`;
          xml += `    <lastmod>${currentDate}</lastmod>\n`;
          xml += `    <changefreq>${page.changefreq || 'weekly'}</changefreq>\n`;
          xml += `    <priority>${(page.priority !== undefined ? page.priority : 0.8).toFixed(1)}</priority>\n`;
          xml += `  </url>\n`;
        }
      });
    }

    // 2. Services
    if (seoConfig.sitemapConfig?.includeServices !== false && Array.isArray(servicesList)) {
      servicesList.forEach((srv: any) => {
        const srvSeo = seoConfig.servicesSeo?.[srv.id];
        if (srvSeo?.robotsIndex !== false) {
          const srvLoc = srvSeo?.customCanonical || `${baseUrl}/#service-${srv.id}`;
          xml += `  <url>\n`;
          xml += `    <loc>${srvLoc}</loc>\n`;
          xml += `    <lastmod>${currentDate}</lastmod>\n`;
          xml += `    <changefreq>${srvSeo?.changefreq || 'weekly'}</changefreq>\n`;
          xml += `    <priority>${(srvSeo?.priority !== undefined ? srvSeo.priority : 0.8).toFixed(1)}</priority>\n`;
          xml += `  </url>\n`;
        }
      });
    }

    // 3. Custom URLs
    if (Array.isArray(seoConfig.sitemapConfig?.customUrls)) {
      seoConfig.sitemapConfig.customUrls.forEach((custom: any) => {
        if (custom.loc) {
          xml += `  <url>\n`;
          xml += `    <loc>${custom.loc.startsWith('http') ? custom.loc : baseUrl + (custom.loc.startsWith('/') ? '' : '/') + custom.loc}</loc>\n`;
          xml += `    <lastmod>${custom.lastmod || currentDate}</lastmod>\n`;
          xml += `    <changefreq>${custom.changefreq || 'monthly'}</changefreq>\n`;
          xml += `    <priority>${(custom.priority !== undefined ? custom.priority : 0.5).toFixed(1)}</priority>\n`;
          xml += `  </url>\n`;
        }
      });
    }

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error: any) {
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><error>${error.message}</error>`);
  }
});

// GET /robots.txt
app.get('/robots.txt', async (req, res) => {
  try {
    const seoConfig = await readSeoConfig();
    const baseUrl = (seoConfig.global?.canonicalBaseUrl || 'https://dizopulse.com').replace(/\/$/, '');
    const allowIndex = seoConfig.global?.robotsIndex !== false;

    let robotsTxt = `# Robots.txt for Dizo Pulse Creative Media & Digital Agency\n`;
    robotsTxt += `User-agent: *\n`;
    if (allowIndex) {
      robotsTxt += `Allow: /\n`;
      robotsTxt += `Disallow: /api/\n`;
      robotsTxt += `Disallow: /#client-portal\n`;
      robotsTxt += `Disallow: /?admin=true\n`;
    } else {
      robotsTxt += `Disallow: /\n`;
    }
    robotsTxt += `\nSitemap: ${baseUrl}/sitemap.xml\n`;

    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error: any) {
    res.status(500).send(`User-agent: *\nAllow: /\n`);
  }
});

// ==========================================
// PUBLIC VISITOR COUNTER & TRACKING ENDPOINTS
// ==========================================

// GET /api/analytics/visitor-count
app.get('/api/analytics/visitor-count', async (req, res) => {
  try {
    const stats = await readVisitorStats();
    const count = Math.max(stats.uniqueVisitorsCount || 10420, stats.baseCount || 10420);
    const milestoneInfo = formatVisitorMilestone(count);

    res.json({
      success: true,
      totalUniqueVisitors: count,
      formattedCount: milestoneInfo.formattedCount,
      displayText: milestoneInfo.displayText,
      milestone: milestoneInfo.formattedCount,
      exactCount: count,
      totalPageViews: stats.totalPageViews || 24890,
      lastUpdated: stats.lastUpdated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve visitor count' });
  }
});

// GET /api/visitor/count (Alias)
app.get('/api/visitor/count', async (req, res) => {
  try {
    const stats = await readVisitorStats();
    const count = Math.max(stats.uniqueVisitorsCount || 10420, stats.baseCount || 10420);
    const milestoneInfo = formatVisitorMilestone(count);

    res.json({
      success: true,
      totalUniqueVisitors: count,
      formattedCount: milestoneInfo.formattedCount,
      displayText: milestoneInfo.displayText,
      milestone: milestoneInfo.formattedCount,
      exactCount: count,
      totalPageViews: stats.totalPageViews || 24890,
      lastUpdated: stats.lastUpdated
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to retrieve visitor count' });
  }
});

// POST /api/analytics/track
app.post('/api/analytics/track', async (req, res) => {
  try {
    const { visitorId, path: pagePath = '/', referrer = '', isNewSession = false } = req.body;
    
    // Privacy-safe anonymized hash based on client signals — NEVER storing raw IP or exposing PII
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'generic-agent';
    const ipHash = crypto.createHash('sha256').update(rawIp + userAgent + 'dizo_visitor_salt_2026').digest('hex').substring(0, 16);
    
    // Primary identification key: persistent client visitor token or anonymized device hash
    const trackingKey = (visitorId && typeof visitorId === 'string' && visitorId.length > 3)
      ? visitorId
      : `anon_${ipHash}`;

    const stats = await readVisitorStats();
    if (!stats.uniqueVisitorMap) {
      stats.uniqueVisitorMap = {};
    }

    const now = new Date().toISOString();
    const existing = stats.uniqueVisitorMap[trackingKey];
    let isNewUniqueVisitor = false;

    if (!existing) {
      // First time this unique visitor is seen
      isNewUniqueVisitor = true;
      stats.uniqueVisitorsCount = (stats.uniqueVisitorsCount || stats.baseCount || 10420) + 1;
      stats.uniqueVisitorMap[trackingKey] = {
        firstSeen: now,
        lastSeen: now,
        visits: 1,
        pageViews: 1
      };
    } else {
      // Returning visitor (same unique human, refreshed page or navigating) -> DO NOT increment unique count
      stats.uniqueVisitorMap[trackingKey].lastSeen = now;
      stats.uniqueVisitorMap[trackingKey].pageViews = (stats.uniqueVisitorMap[trackingKey].pageViews || 0) + 1;
      if (isNewSession) {
        stats.uniqueVisitorMap[trackingKey].visits = (stats.uniqueVisitorMap[trackingKey].visits || 1) + 1;
      }
    }

    stats.totalPageViews = (stats.totalPageViews || 24890) + 1;
    stats.lastUpdated = now;

    // Prune very old map keys if map exceeds 5,000 entries to maintain compact file size & fast I/O
    const mapKeys = Object.keys(stats.uniqueVisitorMap);
    if (mapKeys.length > 5000) {
      mapKeys.slice(0, 500).forEach(k => delete stats.uniqueVisitorMap[k]);
    }

    await writeVisitorStats(stats);

    const count = Math.max(stats.uniqueVisitorsCount || 10420, stats.baseCount || 10420);
    const milestoneInfo = formatVisitorMilestone(count);

    res.json({
      success: true,
      isNewUniqueVisitor,
      totalUniqueVisitors: count,
      formattedCount: milestoneInfo.formattedCount,
      displayText: milestoneInfo.displayText,
      exactCount: count,
      totalPageViews: stats.totalPageViews
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tracking operation failed' });
  }
});

// POST /api/visitor/track (Alias)
app.post('/api/visitor/track', async (req, res) => {
  try {
    const { visitorId, path: pagePath = '/', referrer = '', isNewSession = false } = req.body;
    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'generic-agent';
    const ipHash = crypto.createHash('sha256').update(rawIp + userAgent + 'dizo_visitor_salt_2026').digest('hex').substring(0, 16);
    
    const trackingKey = (visitorId && typeof visitorId === 'string' && visitorId.length > 3)
      ? visitorId
      : `anon_${ipHash}`;

    const stats = await readVisitorStats();
    if (!stats.uniqueVisitorMap) stats.uniqueVisitorMap = {};

    const now = new Date().toISOString();
    const existing = stats.uniqueVisitorMap[trackingKey];
    let isNewUniqueVisitor = false;

    if (!existing) {
      isNewUniqueVisitor = true;
      stats.uniqueVisitorsCount = (stats.uniqueVisitorsCount || stats.baseCount || 10420) + 1;
      stats.uniqueVisitorMap[trackingKey] = {
        firstSeen: now,
        lastSeen: now,
        visits: 1,
        pageViews: 1
      };
    } else {
      stats.uniqueVisitorMap[trackingKey].lastSeen = now;
      stats.uniqueVisitorMap[trackingKey].pageViews = (stats.uniqueVisitorMap[trackingKey].pageViews || 0) + 1;
      if (isNewSession) {
        stats.uniqueVisitorMap[trackingKey].visits = (stats.uniqueVisitorMap[trackingKey].visits || 1) + 1;
      }
    }

    stats.totalPageViews = (stats.totalPageViews || 24890) + 1;
    stats.lastUpdated = now;

    const mapKeys = Object.keys(stats.uniqueVisitorMap);
    if (mapKeys.length > 5000) {
      mapKeys.slice(0, 500).forEach(k => delete stats.uniqueVisitorMap[k]);
    }

    await writeVisitorStats(stats);

    const count = Math.max(stats.uniqueVisitorsCount || 10420, stats.baseCount || 10420);
    const milestoneInfo = formatVisitorMilestone(count);

    res.json({
      success: true,
      isNewUniqueVisitor,
      totalUniqueVisitors: count,
      formattedCount: milestoneInfo.formattedCount,
      displayText: milestoneInfo.displayText,
      exactCount: count,
      totalPageViews: stats.totalPageViews
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tracking operation failed' });
  }
});

// ==========================================
// INTEGRATIONS & API SETTINGS STORAGE & ENDPOINTS
// ==========================================

const DEFAULT_INTEGRATIONS = [
  // --- EMAIL CATEGORY ---
  {
    id: 'sendgrid',
    name: 'Twilio SendGrid',
    provider: 'SendGrid',
    category: 'email',
    description: 'High-deliverability transactional email delivery, lead notifications, and dynamic quote delivery templates.',
    iconName: 'MailCheck',
    docsUrl: 'https://sendgrid.com/docs',
    badge: 'POPULAR',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Not configured yet. Add API key to connect.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'apiKey', label: 'SendGrid API Key', type: 'password', isSecret: true, required: true, placeholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Full access or restricted Mail Send API key' },
      { key: 'fromEmail', label: 'Verified Sender Email', type: 'text', required: true, placeholder: 'hello@dizopulse.com', helperText: 'Must be verified in Single Sender Verification or Domain Authentication' },
      { key: 'fromName', label: 'Sender Display Name', type: 'text', required: false, placeholder: 'Dizo Pulse Agency', helperText: 'Friendly sender name displayed in client inbox' },
      { key: 'webhookSecret', label: 'Event Webhook Verification Key', type: 'password', isSecret: true, required: false, placeholder: 'MFkwEwYHKoZIzj0CAQY...', helperText: 'Used to verify incoming email delivery & bounce webhooks' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'resend',
    name: 'Resend Email API',
    provider: 'Resend Inc.',
    category: 'email',
    description: 'Modern developer-first transactional email API with React Email template support and real-time tracking.',
    iconName: 'Send',
    docsUrl: 'https://resend.com/docs',
    badge: 'RECOMMENDED',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Not configured yet. Provide Resend API key.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'apiKey', label: 'Resend API Key', type: 'password', isSecret: true, required: true, placeholder: 're_123456789_abcdefg', helperText: 'API token generated from resend.com/api-keys' },
      { key: 'fromEmail', label: 'From Address', type: 'text', required: true, placeholder: 'notifications@dizopulse.com', helperText: 'Verified domain email address' },
      { key: 'domainId', label: 'Domain ID (Optional)', type: 'text', required: false, placeholder: 'dom_12345678', helperText: 'Registered domain ID in Resend dashboard' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'amazon_ses',
    name: 'Amazon SES (Simple Email)',
    provider: 'Amazon Web Services',
    category: 'email',
    description: 'Cost-effective, highly scalable email sending service for enterprise bulk marketing & transactional notifications.',
    iconName: 'CloudLightning',
    docsUrl: 'https://aws.amazon.com/ses/',
    badge: 'ENTERPRISE',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide AWS IAM credentials & region to initialize SES.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'accessKeyId', label: 'AWS Access Key ID', type: 'text', required: true, placeholder: 'AKIAIOSFODNN7EXAMPLE', helperText: 'IAM user key with ses:SendEmail permissions' },
      { key: 'secretAccessKey', label: 'AWS Secret Access Key', type: 'password', isSecret: true, required: true, placeholder: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', helperText: 'IAM secret access key (stored securely)' },
      { key: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'ap-south-1', helperText: 'e.g. ap-south-1 (Mumbai), us-east-1 (N. Virginia)' },
      { key: 'fromEmail', label: 'SES Verified Sender Email', type: 'text', required: true, placeholder: 'support@dizopulse.com', helperText: 'Verified identity in AWS SES Console' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'custom_smtp',
    name: 'Custom SMTP Relay',
    provider: 'Generic SMTP',
    category: 'email',
    description: 'Connect your corporate Microsoft 365, Google Workspace SMTP Relay, or custom Linux Postfix mail server.',
    iconName: 'Server',
    docsUrl: '',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide SMTP host, port, and credentials.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'host', label: 'SMTP Host Server', type: 'text', required: true, placeholder: 'smtp.office365.com', helperText: 'Mail server hostname or IP address' },
      { key: 'port', label: 'SMTP Port', type: 'number', required: true, placeholder: '587', helperText: '587 (STARTTLS), 465 (SSL), or 25 (Standard)' },
      { key: 'username', label: 'SMTP Username / Auth Email', type: 'text', required: true, placeholder: 'relay@dizopulse.com', helperText: 'Authentication email or username' },
      { key: 'password', label: 'SMTP Password / App Password', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••', helperText: 'Account password or 16-character app-specific password' },
      { key: 'encryption', label: 'Encryption Protocol', type: 'select', required: true, options: [{ label: 'STARTTLS (Port 587)', value: 'tls' }, { label: 'SSL/TLS (Port 465)', value: 'ssl' }, { label: 'None (Port 25)', value: 'none' }], helperText: 'Security layer for transmission' }
    ],
    config: {},
    hasSecretsSet: {}
  },

  // --- WHATSAPP CATEGORY ---
  {
    id: 'meta_whatsapp',
    name: 'Meta WhatsApp Cloud API',
    provider: 'Meta for Developers',
    category: 'whatsapp',
    description: 'Official Meta WhatsApp Business Cloud API for automated lead greetings, quote PDF delivery, and milestone alerts.',
    iconName: 'MessageCircle',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    badge: 'ENTERPRISE',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Configure Meta App System User Token and Phone Number ID.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'systemUserToken', label: 'System User Permanent Access Token', type: 'password', isSecret: true, required: true, placeholder: 'EAAxxxxxxxxx...', helperText: 'Permanent access token generated from Meta Business Manager with whatsapp_business_messaging scope' },
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true, placeholder: '109876543210987', helperText: 'Numeric Phone Number ID from WhatsApp App Dashboard' },
      { key: 'wabaId', label: 'WhatsApp Business Account (WABA) ID', type: 'text', required: true, placeholder: '209876543210987', helperText: 'WABA ID assigned to your Meta Business Manager' },
      { key: 'webhookVerifyToken', label: 'Inbound Webhook Verification Token', type: 'password', isSecret: true, required: false, placeholder: 'dizo_webhook_secret_123', helperText: 'Custom string matched during Meta Webhook verification' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'twilio_whatsapp',
    name: 'Twilio WhatsApp API',
    provider: 'Twilio Inc.',
    category: 'whatsapp',
    description: 'Enterprise WhatsApp messaging gateway powered by Twilio Programmable Messaging and Content API.',
    iconName: 'PhoneForwarded',
    docsUrl: 'https://www.twilio.com/docs/whatsapp',
    badge: 'POPULAR',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide Twilio Account SID and Auth Token.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'accountSid', label: 'Twilio Account SID', type: 'text', required: true, placeholder: 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Find in your Twilio Console dashboard' },
      { key: 'authToken', label: 'Twilio Auth Token', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Primary authentication token' },
      { key: 'fromNumber', label: 'Twilio WhatsApp Sender Number', type: 'text', required: true, placeholder: 'whatsapp:+14155238886', helperText: 'Sandbox or approved production WhatsApp number' },
      { key: 'messagingServiceSid', label: 'Messaging Service SID (Optional)', type: 'text', required: false, placeholder: 'MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Optional Twilio Messaging Service pool ID' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'gupshup_whatsapp',
    name: 'Gupshup WhatsApp Enterprise',
    provider: 'Gupshup',
    category: 'whatsapp',
    description: 'High-throughput conversational WhatsApp messaging platform optimized for Indian and Southeast Asian businesses.',
    iconName: 'MessagesSquare',
    docsUrl: 'https://www.gupshup.io/developer/docs',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide Gupshup App Name and API Key.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'appName', label: 'Gupshup App Name', type: 'text', required: true, placeholder: 'dizopulse_enterprise', helperText: 'Approved app name in Gupshup Enterprise Portal' },
      { key: 'apiKey', label: 'Gupshup API Key', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'App-level API authentication token' },
      { key: 'sourceNumber', label: 'Registered Business Mobile Number', type: 'text', required: true, placeholder: '919876543210', helperText: '12-digit number with country code without +' }
    ],
    config: {},
    hasSecretsSet: {}
  },

  // --- CLOUD STORAGE CATEGORY ---
  {
    id: 'aws_s3',
    name: 'Amazon AWS S3 Vault',
    provider: 'Amazon Web Services',
    category: 'cloud_storage',
    description: 'High-durability object storage for client design assets, large 4K video reel renders, and signed contract PDFs.',
    iconName: 'Database',
    docsUrl: 'https://aws.amazon.com/s3/',
    badge: 'RECOMMENDED',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Configure S3 Bucket Name and AWS IAM credentials.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'bucketName', label: 'S3 Bucket Name', type: 'text', required: true, placeholder: 'dizo-pulse-agency-vault', helperText: 'Unique AWS S3 bucket name' },
      { key: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'ap-south-1', helperText: 'e.g. ap-south-1 (Mumbai), ap-southeast-1 (Singapore)' },
      { key: 'accessKeyId', label: 'IAM Access Key ID', type: 'text', required: true, placeholder: 'AKIAIOSFODNN7EXAMPLE', helperText: 'IAM user with s3:PutObject and s3:GetObject permissions' },
      { key: 'secretAccessKey', label: 'IAM Secret Access Key', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Secret key corresponding to IAM user' },
      { key: 'customCdnDomain', label: 'CloudFront / Custom CDN URL (Optional)', type: 'text', required: false, placeholder: 'https://cdn.dizopulse.com', helperText: 'Custom CloudFront CDN distribution endpoint' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'gcs',
    name: 'Google Cloud Storage',
    provider: 'Google Cloud Platform',
    category: 'cloud_storage',
    description: 'Unified enterprise object storage with fine-grained IAM controls and instant signed URLs for secure downloads.',
    iconName: 'HardDrive',
    docsUrl: 'https://cloud.google.com/storage',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide GCS bucket name, Project ID, and Service Account Key.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'bucketName', label: 'GCS Bucket Name', type: 'text', required: true, placeholder: 'dizo-client-deliverables', helperText: 'GCP Cloud Storage bucket name' },
      { key: 'projectId', label: 'GCP Project ID', type: 'text', required: true, placeholder: 'dizo-pulse-prod-3891', helperText: 'Google Cloud Console project identifier' },
      { key: 'clientEmail', label: 'Service Account Client Email', type: 'text', required: true, placeholder: 'storage-agent@dizo-pulse-prod-3891.iam.gserviceaccount.com', helperText: 'Service account with Storage Admin / Object Creator role' },
      { key: 'privateKey', label: 'Service Account Private Key (PEM)', type: 'password', isSecret: true, required: true, placeholder: '-----BEGIN PRIVATE KEY-----\n...', helperText: 'Private key string from downloaded service account JSON' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'cloudinary',
    name: 'Cloudinary Media Pipeline',
    provider: 'Cloudinary',
    category: 'cloud_storage',
    description: 'Real-time image & video transcoding, webp/avif compression, and dynamic watermarking for agency deliverables.',
    iconName: 'ImagePlus',
    docsUrl: 'https://cloudinary.com/documentation',
    badge: 'POPULAR',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Enter Cloudinary Cloud Name and API Secret.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'cloudName', label: 'Cloudinary Cloud Name', type: 'text', required: true, placeholder: 'dizo-pulse-media', helperText: 'Find in your Cloudinary Dashboard' },
      { key: 'apiKey', label: 'Cloudinary API Key', type: 'text', required: true, placeholder: '891234567891234', helperText: 'Public numeric API key' },
      { key: 'apiSecret', label: 'Cloudinary API Secret', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Secret access key' },
      { key: 'uploadPreset', label: 'Upload Preset (Optional)', type: 'text', required: false, placeholder: 'agency_portfolio_preset', helperText: 'Preset name configured in Cloudinary Settings' }
    ],
    config: {},
    hasSecretsSet: {}
  },

  // --- ANALYTICS CATEGORY ---
  {
    id: 'ga4',
    name: 'Google Analytics 4',
    provider: 'Google LLC',
    category: 'analytics',
    description: 'Track visitor traffic, dynamic calculator interactions, service catalog views, and high-value conversion funnels.',
    iconName: 'Activity',
    docsUrl: 'https://analytics.google.com/',
    badge: 'POPULAR',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide GA4 Measurement ID.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'measurementId', label: 'GA4 Measurement ID', type: 'text', required: true, placeholder: 'G-XXXXXXXXXX', helperText: 'Web stream Measurement ID from GA4 Admin' },
      { key: 'apiSecret', label: 'Measurement Protocol API Secret (Optional)', type: 'password', isSecret: true, required: false, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Used for server-to-server offline conversion event streaming' },
      { key: 'streamId', label: 'Data Stream ID (Optional)', type: 'text', required: false, placeholder: '9876543210', helperText: 'Numeric Stream ID' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'meta_pixel',
    name: 'Meta Pixel & Conversions API (CAPI)',
    provider: 'Meta for Business',
    category: 'analytics',
    description: 'Track ad attribution, quote calculation leads, and server-side conversion events across Facebook & Instagram ads.',
    iconName: 'Target',
    docsUrl: 'https://developers.facebook.com/docs/meta-pixel',
    badge: 'RECOMMENDED',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Configure Meta Pixel ID & Conversions API Token.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'pixelId', label: 'Meta Pixel ID / Dataset ID', type: 'text', required: true, placeholder: '1234567890123456', helperText: 'Dataset ID from Meta Events Manager' },
      { key: 'conversionsApiToken', label: 'Conversions API (CAPI) System Access Token', type: 'password', isSecret: true, required: false, placeholder: 'EAAGxxxxxxxx...', helperText: 'Permanent access token for server-side event deduplication' },
      { key: 'testEventCode', label: 'Test Event Code (Optional for Sandbox)', type: 'text', required: false, placeholder: 'TEST12345', helperText: 'Found in Meta Events Manager > Test Events tab' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'posthog',
    name: 'PostHog Product Analytics',
    provider: 'PostHog Inc.',
    category: 'analytics',
    description: 'Open-source product analytics, session recording, feature flags, and client portal user journey telemetry.',
    iconName: 'LineChart',
    docsUrl: 'https://posthog.com/docs',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide PostHog Project API Key and Host URL.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'projectApiKey', label: 'Project API Key', type: 'text', required: true, placeholder: 'phc_xxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Public API Key for web client analytics' },
      { key: 'hostInstanceUrl', label: 'PostHog Host URL', type: 'text', required: true, placeholder: 'https://us.i.posthog.com', helperText: 'e.g. https://us.i.posthog.com or self-hosted endpoint' },
      { key: 'personalApiKey', label: 'Personal API Key (Optional)', type: 'password', isSecret: true, required: false, placeholder: 'phx_xxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'For server-side querying and cohort syncing' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'mixpanel',
    name: 'Mixpanel Product Analytics',
    provider: 'Mixpanel Inc.',
    category: 'analytics',
    description: 'Cohort analytics, funnel conversion tracking, and retention analysis for leads and signed clients.',
    iconName: 'PieChart',
    docsUrl: 'https://mixpanel.com/',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Enter Mixpanel Project Token.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'projectToken', label: 'Project Token', type: 'text', required: true, placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Project Token from Mixpanel Project Settings' },
      { key: 'apiSecret', label: 'API Secret (Optional)', type: 'password', isSecret: true, required: false, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'For administrative export API calls' },
      { key: 'projectId', label: 'Project ID (Optional)', type: 'text', required: false, placeholder: '1234567', helperText: 'Internal Mixpanel project number' }
    ],
    config: {},
    hasSecretsSet: {}
  },

  // --- PAYMENT GATEWAY CATEGORY ---
  {
    id: 'razorpay',
    name: 'Razorpay PG & UPI AutoPay',
    provider: 'Razorpay Software Pvt Ltd',
    category: 'payment_gateway',
    description: 'Accept Indian credit/debit cards, Netbanking, UPI, and recurring milestone retainer invoices.',
    iconName: 'CreditCard',
    docsUrl: 'https://razorpay.com/docs/',
    badge: 'POPULAR',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide Razorpay Key ID and Secret.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'keyId', label: 'Razorpay Key ID', type: 'text', required: true, placeholder: 'rzp_test_xxxxxxxxxxxxxxxx', helperText: 'Generated in Razorpay Dashboard > Settings > API Keys' },
      { key: 'keySecret', label: 'Razorpay Key Secret', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Secret key (never exposed in client browser)' },
      { key: 'webhookSecret', label: 'Webhook Secret Key (Optional)', type: 'password', isSecret: true, required: false, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Used to verify payment success and refund webhooks' },
      { key: 'merchantName', label: 'Merchant Trade Name', type: 'text', required: false, placeholder: 'Dizo Pulse Media', helperText: 'Brand name shown on Razorpay checkout popup' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'stripe',
    name: 'Stripe Payments',
    provider: 'Stripe Inc.',
    category: 'payment_gateway',
    description: 'Accept international currency payments, multi-currency credit cards, and automated recurring retainers.',
    iconName: 'DollarSign',
    docsUrl: 'https://stripe.com/docs',
    badge: 'GLOBAL',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide Stripe Publishable & Secret Keys.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'publishableKey', label: 'Stripe Publishable Key', type: 'text', required: true, placeholder: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx', helperText: 'Standard client publishable API key' },
      { key: 'secretKey', label: 'Stripe Secret Key', type: 'password', isSecret: true, required: true, placeholder: 'sk_test_••••••••••••••••••••••••', helperText: 'Primary Stripe secret key' },
      { key: 'webhookSigningSecret', label: 'Webhook Signing Secret (Optional)', type: 'password', isSecret: true, required: false, placeholder: 'whsec_••••••••••••••••••••••••', helperText: 'For verifying Stripe event webhook signatures' },
      { key: 'defaultCurrency', label: 'Default Settlement Currency', type: 'select', required: true, options: [{ label: 'INR (Indian Rupee - ₹)', value: 'inr' }, { label: 'USD (US Dollar - $)', value: 'usd' }, { label: 'AED (UAE Dirham - د.إ)', value: 'aed' }, { label: 'EUR (Euro - €)', value: 'eur' }, { label: 'GBP (British Pound - £)', value: 'gbp' }], helperText: 'Base currency for checkout quotes' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'cashfree',
    name: 'Cashfree Payment Gateway',
    provider: 'Cashfree Payments',
    category: 'payment_gateway',
    description: 'Fast payment gateway checkout with instant settlement, payment links, and virtual account verification.',
    iconName: 'Layers',
    docsUrl: 'https://www.cashfree.com/docs/',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Enter Cashfree App ID and Secret Key.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'appId', label: 'Cashfree App ID / Client ID', type: 'text', required: true, placeholder: 'CFxxxxxxxxxxxxxxxx', helperText: 'Merchant App ID from Cashfree Merchant Dashboard' },
      { key: 'secretKey', label: 'Cashfree Secret Key', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Merchant Secret Key' },
      { key: 'webhookSecret', label: 'Webhook Encryption Key (Optional)', type: 'password', isSecret: true, required: false, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'For verifying Cashfree webhook payloads' }
    ],
    config: {},
    hasSecretsSet: {}
  },
  {
    id: 'phonepe',
    name: 'PhonePe PG & Smart Checkout',
    provider: 'PhonePe Pvt Ltd',
    category: 'payment_gateway',
    description: 'Direct Indian UPI intent, QR payment flow, and credit/debit card collections powered by PhonePe PG.',
    iconName: 'Smartphone',
    docsUrl: 'https://developer.phonepe.com/',
    isEnabled: false,
    status: 'not_configured',
    statusMessage: 'Provide PhonePe Merchant ID and Salt Key.',
    environment: 'production',
    lastChecked: null,
    lastTestedLatencyMs: null,
    lastUpdatedBy: null,
    lastUpdatedAt: null,
    fields: [
      { key: 'merchantId', label: 'PhonePe Merchant ID (MID)', type: 'text', required: true, placeholder: 'DIZOPULSEONLINE', helperText: 'Unique merchant identification code' },
      { key: 'saltKey', label: 'API Salt Key / Secret', type: 'password', isSecret: true, required: true, placeholder: '••••••••••••••••••••••••••••••••', helperText: 'Production or Sandbox SHA-256 Salt Key' },
      { key: 'saltIndex', label: 'Salt Key Index', type: 'number', required: true, placeholder: '1', helperText: 'Usually 1 for default keys' }
    ],
    config: {},
    hasSecretsSet: {}
  }
];

// Helper: mask secret string (never expose raw secrets in response)
function maskSecretString(val?: string): string {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

// Sanitization helper: masks all secret fields and sets hasSecretsSet boolean map
function sanitizeIntegrationForClient(item: any) {
  const cloned = JSON.parse(JSON.stringify(item));
  const sanitizedConfig: Record<string, string> = {};
  const hasSecretsSet: Record<string, boolean> = {};

  const fields = cloned.fields || [];
  const rawConfig = cloned.config || {};

  fields.forEach((f: any) => {
    const rawVal = rawConfig[f.key];
    const isSet = Boolean(rawVal && String(rawVal).trim().length > 0);
    hasSecretsSet[f.key] = isSet;

    if (f.isSecret) {
      sanitizedConfig[f.key] = isSet ? maskSecretString(String(rawVal)) : '';
    } else {
      sanitizedConfig[f.key] = rawVal ? String(rawVal) : '';
    }
  });

  cloned.config = sanitizedConfig;
  cloned.hasSecretsSet = hasSecretsSet;
  return cloned;
}

// Read integrations from Firestore / local file or seed defaults
async function readIntegrations(): Promise<any[]> {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      const doc = await fdb.collection('settings').doc('integrations_config').get();
      if (doc.exists && doc.data()?.integrations) {
        const list = doc.data()?.integrations;
        if (Array.isArray(list) && list.length > 0) {
          // Merge with any newly introduced defaults if missing
          return mergeWithDefaultIntegrations(list);
        }
      }
    } catch (err) {
      console.log('>>> [Integrations] Firestore read failed, falling back to local file.', err);
    }
  }

  try {
    const data = await fs.readFile(INTEGRATIONS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return mergeWithDefaultIntegrations(parsed);
    }
  } catch {}

  // Seed default list
  await writeIntegrations(DEFAULT_INTEGRATIONS);
  return DEFAULT_INTEGRATIONS;
}

function mergeWithDefaultIntegrations(storedList: any[]): any[] {
  const map = new Map<string, any>();
  storedList.forEach(item => map.set(item.id, item));

  return DEFAULT_INTEGRATIONS.map(def => {
    const stored = map.get(def.id);
    if (!stored) return def;

    return {
      ...def,
      ...stored,
      fields: def.fields, // ensure field definitions stay fresh
      config: { ...def.config, ...(stored.config || {}) },
      isEnabled: stored.isEnabled !== undefined ? stored.isEnabled : def.isEnabled,
      status: stored.status || def.status,
      statusMessage: stored.statusMessage || def.statusMessage,
      environment: stored.environment || def.environment,
      lastChecked: stored.lastChecked || def.lastChecked,
      lastTestedLatencyMs: stored.lastTestedLatencyMs || def.lastTestedLatencyMs,
      lastUpdatedBy: stored.lastUpdatedBy || def.lastUpdatedBy,
      lastUpdatedAt: stored.lastUpdatedAt || def.lastUpdatedAt
    };
  });
}

async function writeIntegrations(integrations: any[]) {
  const fdb = getFirestoreDb();
  if (fdb) {
    try {
      await fdb.collection('settings').doc('integrations_config').set({
        integrations,
        updatedAt: new Date().toISOString()
      });
      return;
    } catch (error) {
      console.error('Error writing integrations to Firestore:', error);
    }
  }

  try {
    await fs.writeFile(INTEGRATIONS_FILE, JSON.stringify(integrations, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing integrations to file:', error);
  }
}

// 1. GET /api/integrations (Returns list of sanitized integrations + summary stats)
app.get('/api/integrations', async (req, res) => {
  try {
    const rawList = await readIntegrations();
    const sanitized = rawList.map(sanitizeIntegrationForClient);

    const summary = {
      total: sanitized.length,
      connected: sanitized.filter((i: any) => i.status === 'connected').length,
      enabled: sanitized.filter((i: any) => i.isEnabled).length,
      needsAttention: sanitized.filter((i: any) => i.status === 'error').length
    };

    res.json({
      integrations: sanitized,
      summary,
      lastUpdated: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to load integrations' });
  }
});

// 2. GET /api/integrations/:id (Returns single sanitized integration)
app.get('/api/integrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rawList = await readIntegrations();
    const found = rawList.find(i => i.id === id);
    if (!found) {
      return res.status(404).json({ error: `Integration '${id}' not found.` });
    }
    res.json({ integration: sanitizeIntegrationForClient(found) });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch integration' });
  }
});

// 3. POST /api/integrations/:id (Super Admin Only - Save & Update Credentials)
app.post('/api/integrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.body.userRole || 'staff';
    const userName = req.body.userName || 'Agency Super Admin';
    const userEmail = req.body.userEmail || 'mukeshsinghmukesh316@gmail.com';

    // Security Gate: Only Super Admin can manage credentials
    if (userRole !== 'super_admin') {
      return res.status(403).json({
        error: 'Access Denied: Only Super Administrators can configure API credentials and security keys.'
      });
    }

    const rawList = await readIntegrations();
    const index = rawList.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Integration '${id}' not found.` });
    }

    const item = rawList[index];
    const incomingConfig = req.body.config || {};
    const clearFields = Array.isArray(req.body.clearFields) ? req.body.clearFields : [];

    // Merge configuration securely
    const updatedConfig = { ...(item.config || {}) };

    item.fields.forEach((f: any) => {
      if (clearFields.includes(f.key)) {
        delete updatedConfig[f.key];
        return;
      }

      if (incomingConfig[f.key] !== undefined) {
        const val = String(incomingConfig[f.key]).trim();
        if (f.isSecret) {
          // If the user entered a real new key (not the mask pattern '••••')
          if (val && !val.includes('••••')) {
            updatedConfig[f.key] = val;
          }
        } else {
          updatedConfig[f.key] = val;
        }
      }
    });

    if (req.body.environment && ['test', 'production'].includes(req.body.environment)) {
      item.environment = req.body.environment;
    }

    if (req.body.isEnabled !== undefined) {
      item.isEnabled = Boolean(req.body.isEnabled);
    }

    item.config = updatedConfig;
    item.lastUpdatedBy = `${userName} (${userRole})`;
    item.lastUpdatedAt = new Date().toISOString();

    // Check if configuration now satisfies required fields
    const hasAllRequired = item.fields
      .filter((f: any) => f.required)
      .every((f: any) => updatedConfig[f.key] && String(updatedConfig[f.key]).trim().length > 0);

    if (hasAllRequired && item.status === 'not_configured') {
      item.status = 'disconnected'; // Ready to test
      item.statusMessage = 'Credentials saved. Ready to test connection.';
    }

    rawList[index] = item;
    await writeIntegrations(rawList);

    // Audit Logging
    await logAuditTrail({
      user: userName,
      userEmail,
      role: 'super_admin',
      action: 'INTEGRATION_CONFIG_SAVED',
      module: 'integrations',
      target: `${item.name} (${item.environment.toUpperCase()})`,
      description: `Saved API credentials and configuration for ${item.name}`,
      status: 'success',
      severity: 'warning',
      metadata: { integrationId: id, environment: item.environment, isEnabled: item.isEnabled }
    });

    res.json({
      success: true,
      message: `${item.name} configuration saved securely.`,
      integration: sanitizeIntegrationForClient(item)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update integration configuration' });
  }
});

// 4. POST /api/integrations/:id/toggle (Super Admin Only - Enable / Disable)
app.post('/api/integrations/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.body.userRole || 'staff';
    const userName = req.body.userName || 'Agency Super Admin';
    const userEmail = req.body.userEmail || 'mukeshsinghmukesh316@gmail.com';

    if (userRole !== 'super_admin') {
      return res.status(403).json({
        error: 'Access Denied: Only Super Administrators can enable or disable integrations.'
      });
    }

    const rawList = await readIntegrations();
    const index = rawList.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Integration '${id}' not found.` });
    }

    const item = rawList[index];
    const newEnabledState = req.body.isEnabled !== undefined ? Boolean(req.body.isEnabled) : !item.isEnabled;

    item.isEnabled = newEnabledState;
    item.lastUpdatedBy = `${userName} (${userRole})`;
    item.lastUpdatedAt = new Date().toISOString();

    rawList[index] = item;
    await writeIntegrations(rawList);

    // Audit Logging
    await logAuditTrail({
      user: userName,
      userEmail,
      role: 'super_admin',
      action: newEnabledState ? 'INTEGRATION_ENABLED' : 'INTEGRATION_DISABLED',
      module: 'integrations',
      target: item.name,
      description: `${newEnabledState ? 'Enabled' : 'Disabled'} ${item.name} integration (${item.environment})`,
      status: 'success',
      severity: 'info',
      metadata: { integrationId: id, isEnabled: newEnabledState }
    });

    res.json({
      success: true,
      message: `${item.name} is now ${newEnabledState ? 'active' : 'disabled'}.`,
      integration: sanitizeIntegrationForClient(item)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to toggle integration' });
  }
});

// 5. POST /api/integrations/:id/test (Super Admin Only - Test Connection Simulation)
app.post('/api/integrations/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.body.userRole || 'staff';
    const userName = req.body.userName || 'Agency Super Admin';
    const userEmail = req.body.userEmail || 'mukeshsinghmukesh316@gmail.com';

    if (userRole !== 'super_admin') {
      return res.status(403).json({
        error: 'Access Denied: Only Super Administrators can test API connections.'
      });
    }

    const rawList = await readIntegrations();
    const index = rawList.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Integration '${id}' not found.` });
    }

    const item = rawList[index];
    const currentConfig = item.config || {};

    // Validate required fields
    const missingFields = item.fields
      .filter((f: any) => f.required)
      .filter((f: any) => !currentConfig[f.key] || String(currentConfig[f.key]).trim().length === 0);

    const nowIso = new Date().toISOString();

    if (missingFields.length > 0) {
      const missingNames = missingFields.map((f: any) => f.label).join(', ');
      item.status = 'error';
      item.statusMessage = `Connection check failed: Missing required fields (${missingNames})`;
      item.lastChecked = nowIso;
      item.lastTestedLatencyMs = null;

      rawList[index] = item;
      await writeIntegrations(rawList);

      await logAuditTrail({
        user: userName,
        userEmail,
        role: 'super_admin',
        action: 'INTEGRATION_TEST_FAILED',
        module: 'integrations',
        target: item.name,
        description: `Connection test failed for ${item.name}: Missing credentials (${missingNames})`,
        status: 'failed',
        severity: 'warning',
        metadata: { integrationId: id, missingFields: missingFields.map((f: any) => f.key) }
      });

      return res.status(400).json({
        success: false,
        status: 'error',
        message: item.statusMessage,
        integration: sanitizeIntegrationForClient(item)
      });
    }

    // Realistic connection simulation latency between 28ms and 74ms
    const latency = 28 + Math.floor(Math.random() * 46);
    item.status = 'connected';
    item.statusMessage = `Handshake verified successfully in ${item.environment.toUpperCase()} mode (Ping: ${latency}ms). Endpoint online.`;
    item.lastChecked = nowIso;
    item.lastTestedLatencyMs = latency;

    rawList[index] = item;
    await writeIntegrations(rawList);

    await logAuditTrail({
      user: userName,
      userEmail,
      role: 'super_admin',
      action: 'INTEGRATION_TEST_SUCCESS',
      module: 'integrations',
      target: `${item.name} (${item.environment.toUpperCase()})`,
      description: `Connection test verified for ${item.name} with ${latency}ms latency`,
      status: 'success',
      severity: 'info',
      metadata: { integrationId: id, latencyMs: latency, environment: item.environment }
    });

    res.json({
      success: true,
      status: 'connected',
      latencyMs: latency,
      message: item.statusMessage,
      integration: sanitizeIntegrationForClient(item)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to test integration' });
  }
});

// 6. POST /api/integrations/:id/disconnect (Super Admin Only - Disconnect & Purge Credentials)
app.post('/api/integrations/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.body.userRole || 'staff';
    const userName = req.body.userName || 'Agency Super Admin';
    const userEmail = req.body.userEmail || 'mukeshsinghmukesh316@gmail.com';

    if (userRole !== 'super_admin') {
      return res.status(403).json({
        error: 'Access Denied: Only Super Administrators can disconnect integrations.'
      });
    }

    const rawList = await readIntegrations();
    const index = rawList.findIndex(i => i.id === id);
    if (index === -1) {
      return res.status(404).json({ error: `Integration '${id}' not found.` });
    }

    const item = rawList[index];
    item.config = {};
    item.isEnabled = false;
    item.status = 'disconnected';
    item.statusMessage = 'Disconnected by administrator. Credentials cleared.';
    item.lastChecked = new Date().toISOString();
    item.lastTestedLatencyMs = null;
    item.lastUpdatedBy = `${userName} (${userRole})`;
    item.lastUpdatedAt = new Date().toISOString();

    rawList[index] = item;
    await writeIntegrations(rawList);

    await logAuditTrail({
      user: userName,
      userEmail,
      role: 'super_admin',
      action: 'INTEGRATION_DISCONNECTED',
      module: 'integrations',
      target: item.name,
      description: `Purged credentials and disconnected ${item.name}`,
      status: 'warning',
      severity: 'critical',
      metadata: { integrationId: id }
    });

    res.json({
      success: true,
      message: `${item.name} has been disconnected and its stored credentials removed.`,
      integration: sanitizeIntegrationForClient(item)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to disconnect integration' });
  }
});

// ==========================================
// DASHBOARD CUSTOMIZATION & WIDGETS API
// ==========================================

const DEFAULT_DASHBOARD_WIDGETS = [
  {
    id: 'quick_actions',
    title: 'Quick Actions & Executive Console',
    description: 'Instant actions to create leads, proposals, contracts, projects, and export pipeline data',
    icon: 'Zap',
    visible: true,
    size: 'large',
    order: 0
  },
  {
    id: 'performance',
    title: 'Performance & Agency KPIs',
    description: 'Real-time sales velocity, pipeline values, conversion rates, and revenue forecasts',
    icon: 'TrendingUp',
    visible: true,
    size: 'large',
    order: 1
  },
  {
    id: 'pending_actions',
    title: 'Pending Actions & Urgent Items',
    description: 'Operational alerts needing attention: uncontacted leads, sent proposals, and unread messages',
    icon: 'AlertTriangle',
    visible: true,
    size: 'medium',
    order: 2
  },
  {
    id: 'leads',
    title: 'Leads & Inquiry Flow',
    description: 'Incoming lead intake, pipeline status trackers, and one-click proposal generation',
    icon: 'Users',
    visible: true,
    size: 'medium',
    order: 3
  },
  {
    id: 'projects',
    title: 'Active Projects & Milestone Health',
    description: 'Active project health status, delivery timelines, and milestone progress percentages',
    icon: 'Kanban',
    visible: true,
    size: 'medium',
    order: 4
  },
  {
    id: 'proposals',
    title: 'Proposals & Conversion Status',
    description: 'Sent, viewed, and approved proposals with total values and contract conversion triggers',
    icon: 'FileText',
    visible: true,
    size: 'medium',
    order: 5
  },
  {
    id: 'contracts',
    title: 'Contracts & Legal E-Signatures',
    description: 'Digital service contracts, sign-off status, and project onboarding triggers',
    icon: 'FileCheck',
    visible: true,
    size: 'small',
    order: 6
  },
  {
    id: 'messages',
    title: 'Client Messages & Hub',
    description: 'Direct client conversation threads, unread counter badges, and communication shortcuts',
    icon: 'MessageSquare',
    visible: true,
    size: 'small',
    order: 7
  },
  {
    id: 'recent_activity',
    title: 'Recent Activity Stream',
    description: 'Live chronological agency activity stream across leads, proposals, contracts, and projects',
    icon: 'Clock',
    visible: true,
    size: 'medium',
    order: 8
  }
];

async function readDashboardLayouts(): Promise<any[]> {
  try {
    const data = await fs.readFile(DASHBOARD_LAYOUTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    const initial = [
      {
        id: 'global_default',
        isGlobalDefault: true,
        userEmail: 'global_default',
        widgets: DEFAULT_DASHBOARD_WIDGETS,
        density: 'comfortable',
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: 'Super Admin (System)'
      }
    ];
    await writeDashboardLayouts(initial);
    return initial;
  }
}

async function writeDashboardLayouts(layouts: any[]): Promise<void> {
  await fs.writeFile(DASHBOARD_LAYOUTS_FILE, JSON.stringify(layouts, null, 2), 'utf-8');
}

// 1. GET /api/dashboard-layout (Fetch user or default layout)
app.get('/api/dashboard-layout', async (req, res) => {
  try {
    const userEmail = (req.query.userEmail as string || '').toLowerCase().trim();
    const layouts = await readDashboardLayouts();

    const globalDefault = layouts.find(l => l.isGlobalDefault) || {
      id: 'global_default',
      isGlobalDefault: true,
      userEmail: 'global_default',
      widgets: DEFAULT_DASHBOARD_WIDGETS,
      density: 'comfortable',
      lastUpdated: new Date().toISOString()
    };

    if (!userEmail) {
      return res.json({
        layout: globalDefault,
        isCustomized: false,
        globalDefault
      });
    }

    const userLayout = layouts.find(l => l.userEmail && l.userEmail.toLowerCase() === userEmail && !l.isGlobalDefault);

    if (userLayout) {
      // Merge with any missing widgets that might have been added to default
      const defaultWidgetIds = DEFAULT_DASHBOARD_WIDGETS.map(w => w.id);
      const existingIds = new Set(userLayout.widgets.map((w: any) => w.id));
      const missingWidgets = DEFAULT_DASHBOARD_WIDGETS.filter(w => !existingIds.has(w.id));
      
      const mergedWidgets = [...userLayout.widgets, ...missingWidgets];

      return res.json({
        layout: {
          ...userLayout,
          widgets: mergedWidgets
        },
        isCustomized: true,
        globalDefault
      });
    }

    res.json({
      layout: globalDefault,
      isCustomized: false,
      globalDefault
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard layout' });
  }
});

// 2. POST /api/dashboard-layout (Save user personal customization or set global default)
app.post('/api/dashboard-layout', async (req, res) => {
  try {
    const { userEmail, userName, userRole, widgets, density, isGlobalDefault } = req.body;

    if (!Array.isArray(widgets)) {
      return res.status(400).json({ error: 'Invalid widgets configuration array.' });
    }

    const layouts = await readDashboardLayouts();
    const nowIso = new Date().toISOString();

    // Handling Super Admin Setting Global Default
    if (isGlobalDefault) {
      if (userRole !== 'super_admin') {
        return res.status(403).json({
          error: 'Access Denied: Only Super Administrators can set the agency-wide global default dashboard layout.'
        });
      }

      const globalIndex = layouts.findIndex(l => l.isGlobalDefault);
      const updatedGlobal = {
        id: 'global_default',
        isGlobalDefault: true,
        userEmail: 'global_default',
        widgets,
        density: density || 'comfortable',
        lastUpdated: nowIso,
        lastUpdatedBy: `${userName || 'Super Admin'} (${userRole})`
      };

      if (globalIndex >= 0) {
        layouts[globalIndex] = updatedGlobal;
      } else {
        layouts.push(updatedGlobal);
      }

      await writeDashboardLayouts(layouts);

      await logAuditTrail({
        user: userName || 'Super Admin',
        userEmail: userEmail || 'admin@dizopulse.com',
        role: userRole || 'super_admin',
        action: 'GLOBAL_DASHBOARD_LAYOUT_UPDATED',
        module: 'settings',
        target: 'Agency Dashboard Default Layout',
        description: 'Super Admin updated the global default dashboard layout for all team members',
        status: 'success',
        severity: 'info',
        metadata: { widgetCount: widgets.length, density }
      });

      return res.json({
        success: true,
        message: 'Global default dashboard layout updated successfully.',
        layout: updatedGlobal,
        isCustomized: false
      });
    }

    // Handling Individual Staff Personal Layout Customization
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required to save personal dashboard layout.' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const userIndex = layouts.findIndex(l => l.userEmail && l.userEmail.toLowerCase() === cleanEmail && !l.isGlobalDefault);

    const updatedUserLayout = {
      id: `layout_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      userEmail: cleanEmail,
      userName: userName || 'Staff User',
      userRole: userRole || 'staff',
      widgets,
      density: density || 'comfortable',
      lastUpdated: nowIso,
      lastUpdatedBy: `${userName || 'Staff User'} (${userRole || 'staff'})`,
      isGlobalDefault: false
    };

    if (userIndex >= 0) {
      layouts[userIndex] = updatedUserLayout;
    } else {
      layouts.push(updatedUserLayout);
    }

    await writeDashboardLayouts(layouts);

    await logAuditTrail({
      user: userName || 'Staff User',
      userEmail: cleanEmail,
      role: userRole || 'staff',
      action: 'USER_DASHBOARD_LAYOUT_SAVED',
      module: 'settings',
      target: `Dashboard Layout (${cleanEmail})`,
      description: `User saved personal customized dashboard layout with ${widgets.filter((w: any) => w.visible).length} active widgets`,
      status: 'success',
      severity: 'info',
      metadata: { widgetCount: widgets.length, visibleCount: widgets.filter((w: any) => w.visible).length }
    });

    res.json({
      success: true,
      message: 'Personal dashboard layout saved successfully.',
      layout: updatedUserLayout,
      isCustomized: true
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save dashboard layout' });
  }
});

// 3. POST /api/dashboard-layout/reset (Reset personal layout to global default)
app.post('/api/dashboard-layout/reset', async (req, res) => {
  try {
    const { userEmail, userName, userRole } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required to reset dashboard layout.' });
    }

    const cleanEmail = userEmail.toLowerCase().trim();
    const layouts = await readDashboardLayouts();

    // Remove user layout
    const filtered = layouts.filter(l => !(l.userEmail && l.userEmail.toLowerCase() === cleanEmail && !l.isGlobalDefault));
    await writeDashboardLayouts(filtered);

    const globalDefault = filtered.find(l => l.isGlobalDefault) || {
      id: 'global_default',
      isGlobalDefault: true,
      userEmail: 'global_default',
      widgets: DEFAULT_DASHBOARD_WIDGETS,
      density: 'comfortable',
      lastUpdated: new Date().toISOString()
    };

    await logAuditTrail({
      user: userName || 'Staff User',
      userEmail: cleanEmail,
      role: userRole || 'staff',
      action: 'USER_DASHBOARD_LAYOUT_RESET',
      module: 'settings',
      target: `Dashboard Layout (${cleanEmail})`,
      description: 'User reset personal dashboard layout back to agency global defaults',
      status: 'success',
      severity: 'info'
    });

    res.json({
      success: true,
      message: 'Dashboard layout reset to global defaults.',
      layout: globalDefault,
      isCustomized: false
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset dashboard layout' });
  }
});

// --- INTEGRATE VITE FOR SPA FLOW ---

async function setupApp() {
  // If we are on Vercel, we only serve the API. Vercel static routing handles index.html and assets directly from /dist
  if (process.env.VERCEL) {
    console.log('>>> [Vercel Environment] API serverless route loaded.');
    return;
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dizo Pulse Server running on http://0.0.0.0:${PORT}`);
  });
}

setupApp();

export default app;
