import React, { useState, useEffect, useMemo, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Proposal, Inquiry, Service } from '../types';
import { showToast } from './UIPolish';

interface ProposalBuilderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  initialProposal?: Partial<Proposal> | null;
  initialInquiry?: Inquiry | null;
  editingProposalId?: string | null;
  onSaveSuccess: (proposal: Proposal) => void;
}

interface DeliverableItem {
  id: string;
  title: string;
  description: string;
  included: boolean;
}

interface MilestonePhase {
  id: string;
  name: string;
  duration: string;
  percentage: number;
  description: string;
}

const DRAFT_STORAGE_KEY = 'dizopulse_proposal_builder_draft_v1';

const DEFAULT_TERMS_TEMPLATES = {
  standard: `1. Payment Schedule: 50% advance upon proposal approval to initiate project, 50% upon final deliverable review prior to source code/asset release.\n2. Revisions: Up to 2 rounds of revisions included per deliverable package.\n3. Intellectual Property: Full ownership transfers upon final payment settlement.\n4. Client Collaboration: Timely feedback within 48-72 hours required to maintain target timeline.`,
  milestone: `1. Milestone 1 (30%): Upon proposal acceptance and project discovery kickoff.\n2. Milestone 2 (40%): Upon design signoff and prototype demo approval.\n3. Milestone 3 (30%): Upon final deployment, quality testing, and source handover.\n4. Revisions: 3 structured review rounds included per milestone phase.\n5. Intellectual Property: Full commercial rights transfer upon final invoice clearance.`,
  retainer: `1. Monthly Retainer billing in advance on the 1st of each calendar month.\n2. Minimum commitment term: 3 months with 30-day exit notice.\n3. SLA: Dedicated project manager with guaranteed 4-hour communication SLA on business days.\n4. Unused hours/deliverables do not roll over to subsequent billing cycles.`,
};

const INDUSTRY_PRESETS = [
  'General Growth',
  'E-Commerce & D2C',
  'SaaS & Technology',
  'Real Estate & Infrastructure',
  'Healthcare & Wellness',
  'Education & EdTech',
  'Food, Beverage & Hospitality',
  'Financial Services & Fintech',
  'Fashion & Lifestyle',
  'Media & Entertainment',
  'Professional Services'
];

const TIMELINE_PRESETS = [
  '5 - 7 Business Days',
  '7 - 10 Business Days',
  '14 - 21 Business Days',
  '30 Calendar Days',
  '6 - 8 Weeks',
  '2 - 3 Months'
];

export const ProposalBuilderWizard: React.FC<ProposalBuilderWizardProps> = ({
  isOpen,
  onClose,
  initialProposal,
  initialInquiry,
  editingProposalId,
  onSaveSuccess,
}) => {
  // Step navigation (1: Client & Scope, 2: Milestones & Pricing, 3: Review & Dispatch)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([1]));

  // Accidental data loss prevention & draft states
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [draftBannerAvailable, setDraftBannerAvailable] = useState<boolean>(false);
  const [savedDraftTimestamp, setSavedDraftTimestamp] = useState<string | null>(null);

  // Available remote catalogs
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [availableInquiries, setAvailableInquiries] = useState<Inquiry[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState<boolean>(false);

  // ----------------------------------------------------
  // STEP 1 FIELDS: Client & Scope
  // ----------------------------------------------------
  const [selectedInquiryId, setSelectedInquiryId] = useState<string>('');
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [businessNiche, setBusinessNiche] = useState<string>('General Growth');
  const [websiteUrl, setWebsiteUrl] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customServiceInput, setCustomServiceInput] = useState<string>('');
  const [projectScope, setProjectScope] = useState<string>('');
  const [clientRequirements, setClientRequirements] = useState<string>('');

  // ----------------------------------------------------
  // STEP 2 FIELDS: Milestones & Pricing
  // ----------------------------------------------------
  const [deliverablesList, setDeliverablesList] = useState<DeliverableItem[]>([
    { id: 'del-1', title: 'High-Converting Digital Assets / Brand Suite', description: 'Comprehensive design vectors, logos, and digital branding assets', included: true },
    { id: 'del-2', title: 'Production-Ready Web / App Implementation', description: 'Fully responsive UI, mobile-optimized experience with high-speed performance', included: true },
    { id: 'del-3', title: 'Targeted Marketing & Conversion Funnels', description: 'Social creatives, high-retention content, and lead generation tracking setup', included: true },
  ]);
  const [deliverablesText, setDeliverablesText] = useState<string>('');
  const [deliverableMode, setDeliverableMode] = useState<'structured' | 'raw'>('structured');
  const [newDeliverableTitle, setNewDeliverableTitle] = useState<string>('');

  const [milestones, setMilestones] = useState<MilestonePhase[]>([
    { id: 'm-1', name: 'Discovery, Strategy & Wireframing', duration: '2-3 Days', percentage: 30, description: 'Brand audit, scope alignment, UX architecture, and initial moodboards.' },
    { id: 'm-2', name: 'Design Systems & Core Build', duration: '4-5 Days', percentage: 40, description: 'High-fidelity visual design, development, and iterative component assembly.' },
    { id: 'm-3', name: 'QA Testing, Final Review & Deployment', duration: '2-3 Days', percentage: 30, description: 'Device testing, client revisions, domain connection, and handover.' },
  ]);

  const [timeline, setTimeline] = useState<string>('7 - 10 Business Days');
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [basePrice, setBasePrice] = useState<number>(15000);
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [enableGst, setEnableGst] = useState<boolean>(true);
  const [gstRate, setGstRate] = useState<number>(18);

  // ----------------------------------------------------
  // STEP 3 FIELDS: Review, Terms & Dispatch
  // ----------------------------------------------------
  const [termsTemplateKey, setTermsTemplateKey] = useState<'standard' | 'milestone' | 'retainer'>('standard');
  const [terms, setTerms] = useState<string>(DEFAULT_TERMS_TEMPLATES.standard);
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Processing / Validation State
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch catalogs on mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchCatalogs = async () => {
      setIsLoadingCatalogs(true);
      try {
        const [clientsRes, inqRes, servRes, setRes] = await Promise.all([
          fetch('/api/clients').catch(() => null),
          fetch('/api/inquiries').catch(() => null),
          fetch('/api/services').catch(() => null),
          fetch('/api/settings').catch(() => null),
        ]);

        if (isMounted) {
          if (clientsRes && clientsRes.ok) {
            const data = await clientsRes.json();
            setAvailableClients(Array.isArray(data) ? data : []);
          }
          if (inqRes && inqRes.ok) {
            const data = await inqRes.json();
            setAvailableInquiries(Array.isArray(data) ? data : []);
          }
          if (servRes && servRes.ok) {
            const data = await servRes.json();
            setAvailableServices(Array.isArray(data) ? data : []);
          }
          if (setRes && setRes.ok) {
            const set = await setRes.json();
            if (set.defaultGstRate !== undefined) {
              setGstRate(Number(set.defaultGstRate));
            }
            if (set.enableGstBilling !== undefined) {
              setEnableGst(Boolean(set.enableGstBilling));
            }
          }
        }
      } catch (err) {
        console.error('Failed to load auxiliary catalogs for proposal builder:', err);
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    };

    fetchCatalogs();
    return () => { isMounted = false; };
  }, [isOpen]);

  // Check for saved local draft when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (!editingProposalId && !initialProposal && !initialInquiry) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.businessName && parsed.timestamp) {
            setDraftBannerAvailable(true);
            setSavedDraftTimestamp(new Date(parsed.timestamp).toLocaleString('en-IN'));
          }
        }
      } catch (e) {
        console.error('Failed reading draft from localStorage:', e);
      }
    }
  }, [isOpen, editingProposalId, initialProposal, initialInquiry]);

  // Populate data when editing existing proposal or converting inquiry
  useEffect(() => {
    if (!isOpen) return;

    if (editingProposalId && initialProposal) {
      // Editing Mode
      setSelectedInquiryId(initialProposal.inquiryId || '');
      setBusinessName(initialProposal.businessName || '');
      setContactPerson(initialProposal.contactPerson || initialProposal.clientName || '');
      setEmail(initialProposal.email || '');
      setPhone(initialProposal.phone || '');
      setBusinessNiche(initialProposal.businessNiche || 'General Growth');
      setSelectedServices(initialProposal.selectedServices || []);
      
      const delText = initialProposal.deliverables || '';
      setDeliverablesText(delText);
      // Attempt to parse deliverables into list if formatted with bullets
      if (delText.includes('•') || delText.includes('\n')) {
        const lines = delText.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean);
        if (lines.length > 0) {
          setDeliverablesList(lines.map((line, idx) => ({
            id: `del-${idx + 1}`,
            title: line,
            description: '',
            included: true
          })));
        }
      }

      setTimeline(initialProposal.timeline || '7 - 10 Business Days');
      setBasePrice(initialProposal.totalAmount || 15000);
      setTerms(initialProposal.termsAndConditions || DEFAULT_TERMS_TEMPLATES.standard);
      setExpiryDate(
        initialProposal.expiryDate ? initialProposal.expiryDate.split('T')[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      );
      setInternalNotes(initialProposal.internalNotes || '');
      setCurrentStep(1);
      setIsDirty(false);
    } else if (initialInquiry) {
      // Converted from Inquiry Mode
      setSelectedInquiryId(initialInquiry.id);
      setBusinessName(initialInquiry.businessName || '');
      setContactPerson(initialInquiry.clientName || '');
      setEmail(initialInquiry.email || '');
      setPhone(initialInquiry.whatsapp || '');
      setBusinessNiche(initialInquiry.businessNiche || 'General Growth');
      setSelectedServices(initialInquiry.services || []);
      setProjectScope(initialInquiry.message || 'Complete client digital campaign & creative build');
      setClientRequirements(`Budget target: ${initialInquiry.budgetTier || 'Growth Tier'}. Key goal: ${initialInquiry.businessNiche || 'Business scaling'}`);
      setBasePrice(initialInquiry.totalDiscounted || initialInquiry.totalOriginal || 15000);
      setInternalNotes(`Converted from Inquiry ID ${initialInquiry.id}`);
      setCurrentStep(1);
      setIsDirty(true);
    }
  }, [isOpen, editingProposalId, initialProposal, initialInquiry]);

  // Auto-save draft to localStorage whenever fields change (only in creation mode)
  useEffect(() => {
    if (!isOpen || editingProposalId) return;

    if (businessName || contactPerson || email || selectedServices.length > 0) {
      setIsDirty(true);
      const draftData = {
        timestamp: new Date().toISOString(),
        selectedInquiryId,
        selectedClientId,
        businessName,
        contactPerson,
        email,
        phone,
        businessNiche,
        websiteUrl,
        selectedServices,
        projectScope,
        clientRequirements,
        deliverablesList,
        deliverablesText,
        deliverableMode,
        milestones,
        timeline,
        expiryDate,
        basePrice,
        discountType,
        discountValue,
        enableGst,
        gstRate,
        terms,
        internalNotes
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
      } catch (e) {
        // storage overflow fallback
      }
    }
  }, [
    isOpen,
    editingProposalId,
    selectedInquiryId,
    selectedClientId,
    businessName,
    contactPerson,
    email,
    phone,
    businessNiche,
    websiteUrl,
    selectedServices,
    projectScope,
    clientRequirements,
    deliverablesList,
    deliverablesText,
    deliverableMode,
    milestones,
    timeline,
    expiryDate,
    basePrice,
    discountType,
    discountValue,
    enableGst,
    gstRate,
    terms,
    internalNotes
  ]);

  // Restore draft handler
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!saved) return;
      const data = JSON.parse(saved);

      if (data.businessName !== undefined) setBusinessName(data.businessName);
      if (data.contactPerson !== undefined) setContactPerson(data.contactPerson);
      if (data.email !== undefined) setEmail(data.email);
      if (data.phone !== undefined) setPhone(data.phone);
      if (data.businessNiche !== undefined) setBusinessNiche(data.businessNiche);
      if (data.websiteUrl !== undefined) setWebsiteUrl(data.websiteUrl);
      if (data.selectedServices !== undefined) setSelectedServices(data.selectedServices);
      if (data.projectScope !== undefined) setProjectScope(data.projectScope);
      if (data.clientRequirements !== undefined) setClientRequirements(data.clientRequirements);
      if (data.deliverablesList !== undefined) setDeliverablesList(data.deliverablesList);
      if (data.deliverablesText !== undefined) setDeliverablesText(data.deliverablesText);
      if (data.deliverableMode !== undefined) setDeliverableMode(data.deliverableMode);
      if (data.milestones !== undefined) setMilestones(data.milestones);
      if (data.timeline !== undefined) setTimeline(data.timeline);
      if (data.expiryDate !== undefined) setExpiryDate(data.expiryDate);
      if (data.basePrice !== undefined) setBasePrice(data.basePrice);
      if (data.discountType !== undefined) setDiscountType(data.discountType);
      if (data.discountValue !== undefined) setDiscountValue(data.discountValue);
      if (data.enableGst !== undefined) setEnableGst(data.enableGst);
      if (data.gstRate !== undefined) setGstRate(data.gstRate);
      if (data.terms !== undefined) setTerms(data.terms);
      if (data.internalNotes !== undefined) setInternalNotes(data.internalNotes);

      setDraftBannerAvailable(false);
      showToast('Draft Restored', 'Your previous proposal draft was restored successfully.', 'success');
    } catch (e) {
      showToast('Restore Failed', 'Unable to parse saved draft.', 'error');
    }
  };

  const handleDiscardSavedDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftBannerAvailable(false);
    showToast('Draft Cleared', 'Unsaved draft was cleared from your browser.', 'info');
  };

  // Client Selection Autofill
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;

    const matched = availableClients.find(c => c.id === clientId);
    if (matched) {
      setBusinessName(matched.companyName || matched.clientName || '');
      setContactPerson(matched.clientName || '');
      setEmail(matched.email || '');
      setPhone(matched.phone || '');
      if (matched.businessNiche) setBusinessNiche(matched.businessNiche);
      if (matched.website) setWebsiteUrl(matched.website);
      showToast('Client Linked', `Auto-filled details for ${matched.companyName || matched.clientName}`, 'info');
    }
  };

  // Inquiry Selection Autofill
  const handleInquirySelect = (inqId: string) => {
    setSelectedInquiryId(inqId);
    if (!inqId) return;

    const inq = availableInquiries.find(i => i.id === inqId);
    if (inq) {
      setBusinessName(inq.businessName || '');
      setContactPerson(inq.clientName || '');
      setEmail(inq.email || '');
      setPhone(inq.whatsapp || '');
      if (inq.businessNiche) setBusinessNiche(inq.businessNiche);
      if (inq.services && inq.services.length > 0) setSelectedServices(inq.services);
      if (inq.message) setProjectScope(inq.message);
      if (inq.totalDiscounted || inq.totalOriginal) {
        setBasePrice(inq.totalDiscounted || inq.totalOriginal);
      }
      showToast('Inquiry Linked', `Imported details from Inquiry #${inq.id}`, 'info');
    }
  };

  // Toggle Service Selection
  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName) ? prev.filter(s => s !== serviceName) : [...prev, serviceName]
    );
  };

  const handleAddCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (!trimmed) return;
    if (!selectedServices.includes(trimmed)) {
      setSelectedServices(prev => [...prev, trimmed]);
    }
    setCustomServiceInput('');
  };

  // Add Deliverable
  const handleAddDeliverable = () => {
    const trimmed = newDeliverableTitle.trim();
    if (!trimmed) return;
    setDeliverablesList(prev => [
      ...prev,
      { id: `del-${Date.now()}`, title: trimmed, description: '', included: true }
    ]);
    setNewDeliverableTitle('');
  };

  const handleToggleDeliverable = (id: string) => {
    setDeliverablesList(prev =>
      prev.map(d => (d.id === id ? { ...d, included: !d.included } : d))
    );
  };

  const handleRemoveDeliverable = (id: string) => {
    setDeliverablesList(prev => prev.filter(d => d.id !== id));
  };

  // Financial Calculations
  const calculations = useMemo(() => {
    const rawSubtotal = Math.max(0, Number(basePrice) || 0);
    const rawDiscount = Number(discountValue) || 0;
    const discountAmount =
      discountType === 'percentage'
        ? Math.round((rawSubtotal * Math.min(100, Math.max(0, rawDiscount))) / 100)
        : Math.min(rawSubtotal, Math.max(0, rawDiscount));

    const taxableAmount = Math.max(0, rawSubtotal - discountAmount);
    const gstPercent = enableGst ? (Number(gstRate) || 18) : 0;
    const gstAmount = enableGst ? Math.round((taxableAmount * gstPercent) / 100) : 0;
    const grandTotal = taxableAmount + gstAmount;

    return {
      subtotal: rawSubtotal,
      discountAmount,
      taxableAmount,
      gstPercent,
      gstAmount,
      grandTotal,
    };
  }, [basePrice, discountType, discountValue, enableGst, gstRate]);

  // Compiled Deliverables String
  const compiledDeliverables = useMemo(() => {
    if (deliverableMode === 'raw') {
      return deliverablesText;
    }
    const included = deliverablesList.filter(d => d.included);
    if (included.length === 0) return deliverablesText;
    return included.map(d => `• ${d.title}${d.description ? ` - ${d.description}` : ''}`).join('\n');
  }, [deliverableMode, deliverablesList, deliverablesText]);

  // Validation Rules
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!businessName.trim()) errors.businessName = 'Business or Brand Name is required';
    if (!contactPerson.trim()) errors.contactPerson = 'Contact Person name is required';
    if (!email.trim()) {
      errors.email = 'Client email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (selectedServices.length === 0 && !projectScope.trim()) {
      errors.services = 'Please select at least one service or enter project scope';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Validation Incomplete', 'Please fill in required client & scope fields.', 'warning');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!basePrice || basePrice <= 0) errors.basePrice = 'Quoted price must be greater than ₹0';
    if (!timeline.trim()) errors.timeline = 'Project execution timeline is required';
    if (!compiledDeliverables.trim()) errors.deliverables = 'Please specify at least one deliverable package item';

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Validation Incomplete', 'Please verify pricing and deliverables.', 'warning');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
        setVisitedSteps(prev => new Set([...prev, 2]));
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
        setVisitedSteps(prev => new Set([...prev, 3]));
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleGoToStep = (step: 1 | 2 | 3) => {
    if (step === currentStep) return;
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step === 2 && validateStep1()) {
      setCurrentStep(2);
      setVisitedSteps(prev => new Set([...prev, 2]));
    } else if (step === 3 && validateStep1() && validateStep2()) {
      setCurrentStep(3);
      setVisitedSteps(prev => new Set([...prev, 3]));
    }
  };

  // Unified Save / Dispatch Function
  const handleSaveProposal = async (targetStatus: 'Draft' | 'Sent') => {
    // Validate all steps before final submission
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        inquiryId: selectedInquiryId || '',
        clientName: contactPerson.trim() || businessName.trim(),
        contactPerson: contactPerson.trim() || businessName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        businessName: businessName.trim(),
        businessNiche: businessNiche.trim() || 'General Growth',
        selectedServices,
        deliverables: compiledDeliverables || '• Full Digital Solution & Handover',
        timeline: timeline.trim() || '7 - 10 Business Days',
        totalAmount: calculations.grandTotal,
        termsAndConditions: terms,
        expiryDate: new Date(expiryDate).toISOString(),
        internalNotes: internalNotes.trim(),
        status: targetStatus,
      };

      const url = editingProposalId ? `/api/proposals/${editingProposalId}` : '/api/proposals';
      const method = editingProposalId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Server rejected proposal save request');
      }

      const savedResult = await res.json();

      // Clear local storage draft after successful save
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setIsDirty(false);

      showToast(
        targetStatus === 'Sent' ? 'Proposal Dispatched!' : 'Draft Saved!',
        `Proposal #${savedResult.id || editingProposalId} was ${editingProposalId ? 'updated' : 'created'} successfully as ${targetStatus}.`,
        'success'
      );

      onSaveSuccess(savedResult);
      onClose();
    } catch (err: any) {
      showToast('Save Failed', err.message || 'Error saving proposal to system', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Close with Dirty Check
  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        
        {/* TOP HEADER & STEP INDICATOR */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
                <Icons.FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>{editingProposalId ? `Edit Proposal (${editingProposalId})` : 'Proposal Builder'}</span>
                  <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    3-Step Engine
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Configure client scope, milestones, pricing and review commercial proposal</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSaveProposal('Draft')}
                disabled={isSaving}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
                title="Save current progress as a draft proposal"
              >
                <Icons.Save className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleRequestClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Wizard"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* DRAFT RESTORATION BANNER */}
          {draftBannerAvailable && !editingProposalId && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <Icons.History className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  Unsaved draft from <strong>{savedDraftTimestamp}</strong> found in your browser session.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRestoreDraft}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  Restore Draft
                </button>
                <button
                  type="button"
                  onClick={handleDiscardSavedDraft}
                  className="px-2 py-1 text-slate-400 hover:text-slate-200 text-[11px] rounded-lg cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* STEP PROGRESS BAR */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { num: 1, label: 'Client & Scope', icon: Icons.Building2, desc: 'Client, niche, services' },
              { num: 2, label: 'Milestones & Pricing', icon: Icons.Calculator, desc: 'Deliverables, GST, timeline' },
              { num: 3, label: 'Review & Dispatch', icon: Icons.Send, desc: 'Summary, terms & send' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isCompleted = visitedSteps.has(step.num) && currentStep > step.num;

              return (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => handleGoToStep(step.num as any)}
                  className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                      : isCompleted
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      : 'bg-slate-950/30 border-slate-850 text-slate-500 hover:border-slate-800'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Icons.Check className="w-4 h-4" /> : step.num}
                  </div>
                  <div className="min-w-0 hidden xs:block sm:block">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{step.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{step.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* WIZARD STEP BODY */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* STEP 1: CLIENT & SCOPE */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Quick-Link Client or Inquiry Bar */}
              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <Icons.Link2 className="w-4 h-4" />
                    Quick Auto-Fill from CRM Directory or Inquiries
                  </span>
                  <span className="text-[10px] font-normal text-slate-500">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Existing Client Profile
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Choose Existing Client Profile --</option>
                      {availableClients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName || c.clientName} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Convert Pending Inquiry
                    </label>
                    <select
                      value={selectedInquiryId}
                      onChange={(e) => handleInquirySelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="">-- Select Pending Lead Inquiry --</option>
                      {availableInquiries.map((inq) => (
                        <option key={inq.id} value={inq.id}>
                          #{inq.id} - {inq.businessName || inq.clientName} ({inq.services?.join(', ') || 'General'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Primary Business Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Icons.Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Business & Client Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Business / Brand Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Apex Dynamics Group"
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all ${
                        validationErrors.businessName
                          ? 'border-rose-500/80 ring-1 ring-rose-500/40'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {validationErrors.businessName && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Key Contact Person <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all ${
                        validationErrors.contactPerson
                          ? 'border-rose-500/80 ring-1 ring-rose-500/40'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {validationErrors.contactPerson && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.contactPerson}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Client Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@company.com"
                      className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden transition-all ${
                        validationErrors.email
                          ? 'border-rose-500/80 ring-1 ring-rose-500/40'
                          : 'border-slate-800 focus:border-indigo-500'
                      }`}
                    />
                    {validationErrors.email && (
                      <p className="text-[10px] text-rose-400 mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Industry / Business Niche
                    </label>
                    <select
                      value={businessNiche}
                      onChange={(e) => setBusinessNiche(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      {INDUSTRY_PRESETS.map((ind) => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Service Selection & Catalog Picker */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icons.Layers className="w-3.5 h-3.5 text-indigo-400" />
                    Target Services & Solutions <span className="text-rose-400">*</span>
                  </h4>
                  <span className="text-[10px] text-slate-500">{selectedServices.length} Selected</span>
                </div>

                {validationErrors.services && (
                  <p className="text-[10px] text-rose-400">{validationErrors.services}</p>
                )}

                {/* Popular / Catalog Service Badges */}
                <div className="flex flex-wrap gap-2">
                  {availableServices.length > 0
                    ? availableServices.map((srv) => {
                        const isSelected = selectedServices.includes(srv.name);
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => toggleService(srv.name)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span>{srv.name}</span>
                            {isSelected ? <Icons.Check className="w-3 h-3" /> : <Icons.Plus className="w-3 h-3 text-slate-500" />}
                          </button>
                        );
                      })
                    : [
                        'Web & Full-Stack Engineering',
                        'Brand Identity & Vector Logos',
                        'High-Retention Video & Reels',
                        'Performance Ads (Meta & Google)',
                        'Social Media Management (SMM)',
                        'SEO & Conversion Optimization',
                        'Custom CRM & Automation Setup'
                      ].map((srvName) => {
                        const isSelected = selectedServices.includes(srvName);
                        return (
                          <button
                            key={srvName}
                            type="button"
                            onClick={() => toggleService(srvName)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span>{srvName}</span>
                            {isSelected ? <Icons.Check className="w-3 h-3" /> : <Icons.Plus className="w-3 h-3 text-slate-500" />}
                          </button>
                        );
                      })}
                </div>

                {/* Add Custom Service input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customServiceInput}
                    onChange={(e) => setCustomServiceInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomService(); } }}
                    placeholder="Add bespoke custom service..."
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomService}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer"
                  >
                    Add Service
                  </button>
                </div>
              </div>

              {/* Project Scope & Client Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Project Scope & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={projectScope}
                    onChange={(e) => setProjectScope(e.target.value)}
                    placeholder="High-level objectives, expected milestones, and digital transformation goals..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Specific Requirements & Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clientRequirements}
                    onChange={(e) => setClientRequirements(e.target.value)}
                    placeholder="Client specific constraints, design preferences, integrations, or tech stack..."
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: MILESTONES & PRICING */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Deliverables Management */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icons.PackageCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Deliverables Package Specifications <span className="text-rose-400">*</span>
                  </h4>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setDeliverableMode('structured')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        deliverableMode === 'structured' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Checklist Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeliverablesText(compiledDeliverables);
                        setDeliverableMode('raw');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        deliverableMode === 'raw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Raw Text Mode
                    </button>
                  </div>
                </div>

                {deliverableMode === 'structured' ? (
                  <div className="space-y-2.5">
                    <div className="space-y-2">
                      {deliverablesList.map((del) => (
                        <div
                          key={del.id}
                          className="flex items-center justify-between gap-3 p-3 bg-slate-950 border border-slate-800 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={del.included}
                              onChange={() => handleToggleDeliverable(del.id)}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                            />
                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-bold block truncate ${del.included ? 'text-white' : 'text-slate-500 line-through'}`}>
                                {del.title}
                              </span>
                              {del.description && (
                                <span className="text-[10px] text-slate-400 block truncate">{del.description}</span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(del.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Remove deliverable item"
                          >
                            <Icons.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add new deliverable line */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newDeliverableTitle}
                        onChange={(e) => setNewDeliverableTitle(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDeliverable(); } }}
                        placeholder="Add specific deliverable line item (e.g. 15 High-Retention Instagram Reels)..."
                        className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddDeliverable}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Icons.Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <textarea
                      rows={4}
                      value={deliverablesText}
                      onChange={(e) => setDeliverablesText(e.target.value)}
                      placeholder="Bullet-point list of deliverables included in this proposal..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}
                {validationErrors.deliverables && (
                  <p className="text-[10px] text-rose-400">{validationErrors.deliverables}</p>
                )}
              </div>

              {/* Milestones & Execution Roadmap */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icons.Milestone className="w-3.5 h-3.5 text-indigo-400" />
                    Phased Milestones & Payment Split
                  </h4>
                  <span className="text-[10px] font-mono text-indigo-400 font-bold">
                    Total Split: {milestones.reduce((acc, m) => acc + m.percentage, 0)}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {milestones.map((milestone, idx) => (
                    <div
                      key={milestone.id}
                      className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                          Phase 0{idx + 1}
                        </span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold rounded">
                          {milestone.percentage}% (₹{Math.round((calculations.grandTotal * milestone.percentage) / 100).toLocaleString('en-IN')})
                        </span>
                      </div>
                      <input
                        type="text"
                        value={milestone.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, name: val } : m));
                        }}
                        className="w-full bg-transparent border-b border-slate-800 text-xs font-bold text-white focus:outline-hidden focus:border-indigo-500 pb-1"
                      />
                      <input
                        type="text"
                        value={milestone.duration}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, duration: val } : m));
                        }}
                        placeholder="Estimated duration..."
                        className="w-full bg-transparent text-[11px] text-slate-400 focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Execution Timeline <span className="text-rose-400">*</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      placeholder="e.g. 7-10 Business Days"
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {TIMELINE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setTimeline(preset)}
                          className={`px-2 py-0.5 text-[10px] rounded-lg border transition-colors cursor-pointer ${
                            timeline === preset
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                    Proposal Validity / Expiry Date
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Client can review & accept before this validity window.</p>
                </div>
              </div>

              {/* Pricing, Discount & GST Engine */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Icons.Calculator className="w-3.5 h-3.5 text-emerald-400" />
                  Financial Engine & GST Breakdown
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Base / Subtotal (₹) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      Discount Value
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold text-amber-400 focus:outline-hidden focus:border-indigo-500"
                      />
                      <select
                        value={discountType}
                        onChange={(e) => setDiscountType(e.target.value as any)}
                        className="px-2 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 focus:outline-hidden cursor-pointer"
                      >
                        <option value="percentage">%</option>
                        <option value="flat">₹</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                      GST Tax Config
                    </label>
                    <div className="flex items-center gap-2 h-10">
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableGst}
                          onChange={(e) => setEnableGst(e.target.checked)}
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700"
                        />
                        <span>Apply GST ({gstRate}%)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Card */}
                <div className="p-3.5 bg-slate-900/90 border border-slate-800/80 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Subtotal</span>
                    <span className="font-bold text-white font-mono">₹{calculations.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Discount</span>
                    <span className="font-bold text-amber-400 font-mono">- ₹{calculations.discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">GST ({enableGst ? `${gstRate}%` : '0%'})</span>
                    <span className="font-bold text-indigo-400 font-mono">+ ₹{calculations.gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">Final Quoted Value</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      ₹{calculations.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: REVIEW & DISPATCH */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Comprehensive Proposal Review Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-4">
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono font-bold rounded-md uppercase">
                      Document Preview
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">{businessName}</h3>
                    <p className="text-xs text-slate-400">
                      {contactPerson} • {email} {phone ? `• ${phone}` : ''}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Total Quoted Investment</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{calculations.grandTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {enableGst ? `Inclusive of ${gstRate}% GST` : 'Zero GST / Net Valuation'}
                    </span>
                  </div>
                </div>

                {/* Scope & Services */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Selected Services</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedServices.length > 0 ? (
                        selectedServices.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-indigo-300 font-bold rounded-md text-[11px]"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-xs">General Digital Transformation</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Execution Timeline</span>
                    <p className="text-slate-300 font-bold">{timeline} (Valid till {expiryDate})</p>
                  </div>
                </div>

                {/* Deliverables Overview */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Deliverables Package</span>
                  <div className="p-3.5 bg-slate-900/80 border border-slate-850 rounded-2xl text-xs text-slate-300 whitespace-pre-line font-mono">
                    {compiledDeliverables || '• Full Solution Handover as per agency specifications'}
                  </div>
                </div>

                {/* Milestones Road */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Milestones & Payment Tranches</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {milestones.map((m, idx) => (
                      <div key={m.id} className="p-2.5 bg-slate-900 border border-slate-850 rounded-xl text-xs">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-black">
                          <span>PHASE 0{idx + 1} ({m.percentage}%)</span>
                          <span className="text-emerald-400 font-mono">
                            ₹{Math.round((calculations.grandTotal * m.percentage) / 100).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="font-bold text-white mt-0.5 truncate">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.duration}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Commercial Terms & Conditions Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Icons.FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Commercial Terms & Payment Conditions
                  </h4>

                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setTermsTemplateKey('standard');
                        setTerms(DEFAULT_TERMS_TEMPLATES.standard);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        termsTemplateKey === 'standard' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      50/50 Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTermsTemplateKey('milestone');
                        setTerms(DEFAULT_TERMS_TEMPLATES.milestone);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        termsTemplateKey === 'milestone' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      30/40/30 Milestone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTermsTemplateKey('retainer');
                        setTerms(DEFAULT_TERMS_TEMPLATES.retainer);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                        termsTemplateKey === 'retainer' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Monthly Retainer
                    </button>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              {/* Internal Agency Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1">
                  <Icons.Lock className="w-3 h-3 text-slate-500" />
                  Internal Team Notes (Not visible on client document)
                </label>
                <input
                  type="text"
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Approved special discount on account of multi-service bundle..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* WIZARD FOOTER CONTROLS */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/90 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSaveProposal('Draft')}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Icons.Save className="w-3.5 h-3.5 text-slate-400" />
              <span>Save as Draft</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRequestClose}
              disabled={isSaving}
              className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Continue to Step {currentStep + 1}</span>
                <Icons.ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSaveProposal('Sent')}
                disabled={isSaving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Icons.Send className="w-4 h-4" />
                    <span>Send Proposal (Dispatch)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* DISCARD CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDiscardModal && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <Icons.AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Unsaved Changes</h4>
              </div>
              <p className="text-xs text-slate-400">
                You have unsaved changes in this proposal. Do you want to save as a draft or discard?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardModal(false);
                    handleSaveProposal('Draft');
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Save as Draft & Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardModal(false);
                    localStorage.removeItem(DRAFT_STORAGE_KEY);
                    setIsDirty(false);
                    onClose();
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardModal(false)}
                  className="w-full py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Keep Editing
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProposalBuilderWizard;
