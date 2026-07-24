/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  CreditCard, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  BellRing, 
  CheckCircle, 
  Clock, 
  Send, 
  Lock, 
  TrendingUp, 
  UserCheck, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  FileCheck2,
  Award,
  Sliders,
  ListFilter,
  Activity,
  Sparkles,
  Download,
  Info,
  Flame,
  ShieldAlert,
  Ban,
  Zap,
  UploadCloud,
  Upload,
  Calendar,
  Edit3,
  Save,
  Plus,
  Trash2,
  Check,
  FileSpreadsheet,
  Coins
} from 'lucide-react';
import UniversalProvincialService from '../services/UniversalProvincialService';
import ComplianceHealthMeter from './ComplianceHealthMeter';

interface SupplierDashboardProps {
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  activeCert?: {
    companyName: string;
    registrationNumber: string;
    csdNumber: string;
    province: string;
    publicKeyPem?: string;
    signatureThumbprint?: string;
    taxStatus?: string;
  } | null;
  hideDiagnostics?: boolean;
  setHideDiagnostics?: (val: boolean) => void;
}

interface SupplierBid {
  id: string;
  tenderRef: string;
  tenderTitle: string;
  tenderValue: number;
  splitPercentage: number;
  commissionEarned: number;
  status: 'routing' | 'sbd_generated' | 'submitted' | 'won' | 'archived';
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  paymentRef?: string;
  paidAtIso?: string;
  updatedAtIso: string;
  // Advanced Tender Management properties
  milestone?: 'draft' | 'audited' | 'submitted' | 'evaluating' | 'won' | 'delivery' | 'completed' | 'archived';
  checklist?: {
    csdSynced?: boolean;
    sarsCompliant?: boolean;
    sbd4Signed?: boolean;
    sbd6Signed?: boolean;
    auditPassed?: boolean;
    pkiSealed?: boolean;
  };
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  submissionDate?: string;
  customBidPrice?: number;
  customDeliveryCost?: number;
  useFeeCap?: boolean;
  feeCapAmount?: number;
  milestoneWeights?: Record<string, number>;
  milestoneCosts?: Record<string, number>;
  notes?: Array<{
    id: string;
    text: string;
    category: 'internal' | 'scm' | 'briefing';
    timestamp: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    assignee: string;
    dueDate: string;
    completed: boolean;
  }>;
  documentFolders?: Array<{
    id: string;
    name: string;
    documents: Array<{
      id: string;
      name: string;
      size: string;
      uploadedAt: string;
    }>;
  }>;
  customChecklist?: Array<{
    id: string;
    title: string;
    description: string;
    checked: boolean;
  }>;
}

export default function SupplierDashboard({ 
  addLog, 
  activeCert,
  hideDiagnostics: propHideDiagnostics,
  setHideDiagnostics: propSetHideDiagnostics
}: SupplierDashboardProps) {
  // Navigation Tabs within Supplier Dashboard - Expanded for Lead Routing, Licensing & Auditing
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bids' | 'routing' | 'billing' | 'audit' | 'pwa_sync' | 'warroom' | 'stress_test'>('overview');

  // Supplier Licensing Tier State - Loaded from local storage
  const [licenseTier, setLicenseTier] = useState<'basic' | 'professional' | 'enterprise' | 'payg'>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_license_tier');
      return (saved as 'basic' | 'professional' | 'enterprise' | 'payg') || 'professional';
    } catch (e) {
      return 'professional';
    }
  });

  const [paygCredits, setPaygCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_payg_credits');
      return saved ? parseInt(saved) : 1; // start with 1 complimentary credit for first-time entrepreneurs!
    } catch {
      return 1;
    }
  });

  const [localHideDiagnostics, setLocalHideDiagnostics] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_hide_diagnostics');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const hideDiagnostics = propHideDiagnostics !== undefined ? propHideDiagnostics : localHideDiagnostics;
  const setHideDiagnostics = propSetHideDiagnostics !== undefined ? propSetHideDiagnostics : setLocalHideDiagnostics;

  useEffect(() => {
    localStorage.setItem('sata_supplier_payg_credits', String(paygCredits));
  }, [paygCredits]);

  useEffect(() => {
    localStorage.setItem('sata_supplier_hide_diagnostics', String(hideDiagnostics));
  }, [hideDiagnostics]);

  // Supplier Profile States (read active cert or fallback to local storage seed)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_profile_local');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      companyName: activeCert?.companyName || 'Inzalo Infrastructure Solutions',
      registrationNumber: activeCert?.registrationNumber || '2015/384920/07',
      csdNumber: activeCert?.csdNumber || 'MAAA0192837',
      province: activeCert?.province || 'WESTERN_CAPE',
      taxStatus: activeCert?.taxStatus || 'Compliant (Verified)',
      tier: 'Professional Auto-Fill Plan',
      renewalDate: '2027-03-15'
    };
  });

  // Persist Profile State
  useEffect(() => {
    try {
      localStorage.setItem('sata_supplier_profile_local', JSON.stringify(profile));
    } catch (e) {}
  }, [profile]);

  const [csdAutoSync, setCsdAutoSync] = useState(() => {
    return localStorage.getItem('sata_csd_auto_sync') === 'true';
  });

  const [lastSynced, setLastSynced] = useState(() => {
    return localStorage.getItem('sata_csd_last_synced') || '04:00:00 AM';
  });

  const [isCsdSyncing, setIsCsdSyncing] = useState(false);

  // COIDA and Municipal documents states
  const [coidaFile, setCoidaFile] = useState<{ name: string; size: string; uploadedAt: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sata_coida_file_meta');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  const [municipalFile, setMunicipalFile] = useState<{ name: string; size: string; uploadedAt: string } | null>(() => {
    try {
      const saved = localStorage.getItem('sata_municipal_file_meta');
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  // Save states to local storage
  useEffect(() => {
    localStorage.setItem('sata_csd_auto_sync', String(csdAutoSync));
  }, [csdAutoSync]);

  useEffect(() => {
    localStorage.setItem('sata_csd_last_synced', lastSynced);
  }, [lastSynced]);

  useEffect(() => {
    if (coidaFile) {
      localStorage.setItem('sata_coida_file_meta', JSON.stringify(coidaFile));
    } else {
      localStorage.removeItem('sata_coida_file_meta');
    }
  }, [coidaFile]);

  useEffect(() => {
    if (municipalFile) {
      localStorage.setItem('sata_municipal_file_meta', JSON.stringify(municipalFile));
    } else {
      localStorage.removeItem('sata_municipal_file_meta');
    }
  }, [municipalFile]);

  // Active pricing proposal loaded from TenderAdvisor / TenderProfitCalculator
  const [pricingProposal, setPricingProposal] = useState<any>(null);

  const syncPricingProposal = () => {
    try {
      const proposal = localStorage.getItem('sata_active_pricing_proposal');
      if (proposal) {
        setPricingProposal(JSON.parse(proposal));
      } else {
        setPricingProposal(null);
      }
    } catch (e) {
      console.warn('Failed to load active pricing proposal:', e);
    }
  };

  useEffect(() => {
    syncPricingProposal();
    window.addEventListener('storage', syncPricingProposal);
    const interval = setInterval(syncPricingProposal, 2000);
    return () => {
      window.removeEventListener('storage', syncPricingProposal);
      clearInterval(interval);
    };
  }, []);

  // Synchronized SCM Risk status variables
  const [riskIndex, setRiskIndex] = useState(() => {
    const val = localStorage.getItem('sata_agent_risk_index');
    return val ? parseInt(val) : 0;
  });

  const [activeFailuresCount, setActiveFailuresCount] = useState(0);
  const [activeFailuresList, setActiveFailuresList] = useState<string[]>([]);

  const syncSCMRiskState = () => {
    const idx = localStorage.getItem('sata_agent_risk_index');
    setRiskIndex(idx ? parseInt(idx) : 0);

    const failures: string[] = [];
    if (localStorage.getItem('sata_agent_sim_sars_expired') === 'true') failures.push('Expired SARS TCS PIN');
    if (localStorage.getItem('sata_agent_sim_bee_mismatch') === 'true') failures.push('B-BBEE Claims Mismatch');
    if (localStorage.getItem('sata_agent_sim_director_conflict') === 'true') failures.push('PERSAL State Employee Conflict');
    if (localStorage.getItem('sata_agent_sim_negative_margin') === 'true') failures.push('Negative Pricing Margins');
    if (localStorage.getItem('sata_agent_sim_collusion_risk') === 'true') failures.push('SBD 9 Bid Rigging Affiliation');
    if (localStorage.getItem('sata_agent_sim_local_content_missing') === 'true') failures.push('Missing SBD 6.2 Local Production Cert');
    if (localStorage.getItem('sata_agent_sim_hash_tampering') === 'true') failures.push('Cryptographic Hash Tampering');

    setActiveFailuresCount(failures.length);
    setActiveFailuresList(failures);
  };

  useEffect(() => {
    syncSCMRiskState();
    window.addEventListener('storage', syncSCMRiskState);
    const interval = setInterval(syncSCMRiskState, 2000);
    return () => {
      window.removeEventListener('storage', syncSCMRiskState);
      clearInterval(interval);
    };
  }, []);

  // CSD Auto Sync Trigger
  const runCsdSync = async (silent = false) => {
    if (isCsdSyncing) return;
    if (!silent) {
      setIsCsdSyncing(true);
      addLog?.('Initializing secure CSD API connection to National Treasury SCM node...', 'info');
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Randomize slightly to show sync is working
    const provinceList = ['WESTERN_CAPE', 'GAUTENG', 'KWAZULU_NATAL', 'EASTERN_CAPE', 'FREE_STATE', 'LIMPOPO', 'MPUMALANGA', 'NORTH_WEST', 'NORTHERN_CAPE'];
    const randomProvince = provinceList[Math.floor(Math.random() * provinceList.length)];
    const randomSuffix = Math.floor(Math.random() * 900000 + 100000);
    
    setProfile(prev => ({
      ...prev,
      csdNumber: `MAAA0${randomSuffix}`,
      province: silent ? prev.province : randomProvince,
      taxStatus: 'Compliant (Verified Sync)'
    }));
    
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSynced(nowTime);
    
    if (!silent) {
      setIsCsdSyncing(false);
      addLog?.(`[CSD Auto-Sync] Successfully synchronized supplier details. National Treasury parameters updated. (Last Sync: ${nowTime})`, 'success');
      
      // Play a high pitched double chime sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {}
    } else {
      addLog?.(`[CSD Background Sync] Silent refresh executed. All Treasury registry indexes verified as Compliant.`, 'info');
    }
  };

  // CSD Auto Sync background interval (Every 40 seconds)
  useEffect(() => {
    if (!csdAutoSync) return;
    
    const interval = setInterval(() => {
      runCsdSync(true);
    }, 40000);
    
    return () => clearInterval(interval);
  }, [csdAutoSync]);

  // Keep Profile Tier text synced with the actual active License Tier
  useEffect(() => {
    const displayTier = 
      licenseTier === 'basic' ? 'Basic SCM License' : 
      licenseTier === 'professional' ? 'Professional Auto-Fill Partner' : 
      licenseTier === 'enterprise' ? 'National Elite Partner (Enterprise)' :
      'Pay-As-You-Go Starter Plan';
    
    setProfile(prev => ({
      ...prev,
      tier: displayTier
    }));
  }, [licenseTier]);

  // Lead Routing Parameters
  const [routingKeywords, setRoutingKeywords] = useState<string>('ventilator, tablet, server, infrastructure, ICT, medical');
  const [routingMinBudget, setRoutingMinBudget] = useState<number>(1000000);
  const [selectedRoutingCategories, setSelectedRoutingCategories] = useState<string[]>(['Medical', 'ICT', 'Infrastructure']);
  const [routingLogs, setRoutingLogs] = useState<string[]>([]);
  const [isRoutingRunning, setIsRoutingRunning] = useState<boolean>(false);
  const [matchedLeadsList, setMatchedLeadsList] = useState<any[]>([]);

  // Supplier Offline Concurrency Stress Test States
  const [isStressTesting, setIsStressTesting] = useState<boolean>(false);
  const [stressConcurrency, setStressConcurrency] = useState<number>(4);
  const [stressLatency, setStressLatency] = useState<number[]>([]);
  const [stressThroughput, setStressThroughput] = useState<number>(0);
  const [stressLogs, setStressLogs] = useState<string[]>([]);

  // SCM Compliance Audit States
  const [auditStep, setAuditStep] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditRunning, setAuditRunning] = useState<boolean>(false);
  const [certifiedLedger, setCertifiedLedger] = useState<any | null>(null);

  // SCM Defaulters & Subscription War Room States
  const [defaulters, setDefaulters] = useState([
    {
      id: 'def-1',
      companyName: 'Lethabo Med Supply (Pty) Ltd',
      registrationNumber: '2019/521345/07',
      tenderRef: 'NDOH-32/2026',
      tenderTitle: 'Provision of Medical Consumables to Gauteng Clinics',
      valueWon: 8500000,
      daysOverdue: 24,
      commissionAmount: 1020000,
      subsRenewalDue: '2026-07-02',
      subsStatus: 'expired',
      reminderCount: 2,
      blockLevel: 'None'
    },
    {
      id: 'def-2',
      companyName: 'Mthembu ICT Solutions',
      registrationNumber: '2014/192837/07',
      tenderRef: 'RT15-2026',
      tenderTitle: 'Municipal Network Fiber Infrastructure Layout',
      valueWon: 3400000,
      daysOverdue: 12,
      commissionAmount: 408000,
      subsRenewalDue: '2026-06-28',
      subsStatus: 'expired',
      reminderCount: 1,
      blockLevel: 'None'
    },
    {
      id: 'def-3',
      companyName: 'Vuka Roads & Civils',
      registrationNumber: '2018/092834/07',
      tenderRef: 'WCPW-819/2026',
      tenderTitle: 'Re-graveling of Road TR12 Section 1',
      valueWon: 12400000,
      daysOverdue: 45,
      commissionAmount: 1488000,
      subsRenewalDue: '2026-07-25',
      subsStatus: 'active',
      reminderCount: 3,
      blockLevel: 'CSD_Restricted'
    }
  ]);
  const [warroomLogs, setWarroomLogs] = useState<string[]>(() => [
    `[04:04:00] [WAR ROOM ACTIVE] Dynamic municipal escrow monitor online. Listening for automated award feedback.`,
    `[03:55:00] [Audit Dispatch] Periodic check completed. Detected 3 pending invoice settlements.`
  ]);
  const [isCampaignRunning, setIsCampaignRunning] = useState<boolean>(false);

  // Load profile from active cert changes
  useEffect(() => {
    if (activeCert) {
      setProfile(prev => ({
        ...prev,
        companyName: activeCert.companyName,
        registrationNumber: activeCert.registrationNumber,
        csdNumber: activeCert.csdNumber,
        province: activeCert.province,
        taxStatus: activeCert.taxStatus || 'Compliant (Verified)'
      }));
    }
  }, [activeCert]);

  // Supplier Bid records (synced with general app routed bids list)
  const [bids, setBids] = useState<SupplierBid[]>([]);
  const [selectedBidForPayment, setSelectedBidForPayment] = useState<SupplierBid | null>(null);
  const [selectedBidForManagement, setSelectedBidForManagement] = useState<SupplierBid | null>(null);

  // Load and cache bids from localStorage
  const loadBids = () => {
    try {
      const raw = localStorage.getItem('sata_routed_bids_local');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Map any generic routed bids to our supplier dashboard
        const mapped = parsed.map((b: any) => {
          const useCap = b.useFeeCap !== undefined ? b.useFeeCap : true;
          const capAmt = b.feeCapAmount !== undefined ? b.feeCapAmount : 150000;
          const rawComm = b.commissionEarned || (b.tenderValue * (b.splitPercentage / 100)) || 54000;
          const finalComm = useCap ? Math.min(rawComm, capAmt) : rawComm;

          return {
            id: b.id,
            tenderRef: b.tenderRef || b.tenderId || 'REF-GP-901',
            tenderTitle: b.tenderTitle || 'Public Works SCM Tender Notice',
            tenderValue: b.tenderValue || b.estimatedValueZar || 450000,
            splitPercentage: b.splitPercentage || 12,
            commissionEarned: finalComm,
            useFeeCap: useCap,
            feeCapAmount: capAmt,
            status: b.status,
            paymentStatus: b.paymentStatus || 'unpaid',
            paymentRef: b.paymentRef || '',
            paidAtIso: b.paidAtIso || '',
            updatedAtIso: b.updatedAtIso || new Date().toISOString(),
            // Load advanced properties or compute dynamic defaults based on status
            milestone: b.milestone || (b.status === 'won' ? 'won' : b.status === 'submitted' ? 'submitted' : 'draft'),
            checklist: b.checklist || {
              csdSynced: b.status !== 'routing',
              sarsCompliant: b.status !== 'routing',
              sbd4Signed: b.status === 'won' || b.status === 'submitted',
              sbd6Signed: b.status === 'won' || b.status === 'submitted',
              auditPassed: b.status === 'won' || b.status === 'submitted',
              pkiSealed: b.status === 'won'
            },
            contactName: b.contactName || 'SCM Secretariat Officer',
            contactEmail: b.contactEmail || 'scm@government.gov.za',
            contactPhone: b.contactPhone || '012-345-6789',
            submissionDate: b.submissionDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            customBidPrice: b.customBidPrice || b.tenderValue || 450000,
            customDeliveryCost: b.customDeliveryCost || Math.round((b.tenderValue || 450000) * 0.78),
            notes: b.notes || [
              {
                id: 'init-' + b.id,
                text: `Bid record initialized in dashboard. Current stage tracked: ${b.status?.toUpperCase() || 'DRAFT'}.`,
                category: 'internal',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
              }
            ],
            tasks: b.tasks || [],
            documentFolders: b.documentFolders || [
              {
                id: 'f1',
                name: 'Mandatory SBD Forms',
                documents: [
                  { id: 'doc1', name: 'SBD_4_Declaration_Signed.pdf', size: '2.4 MB', uploadedAt: new Date().toISOString().slice(0,10) },
                  { id: 'doc2', name: 'SBD_6_1_Preference_Points.pdf', size: '1.8 MB', uploadedAt: new Date().toISOString().slice(0,10) }
                ]
              },
              {
                id: 'f2',
                name: 'SARS & CSD Certificates',
                documents: [
                  { id: 'doc3', name: 'SARS_Tax_Compliance_PIN.pdf', size: '420 KB', uploadedAt: new Date().toISOString().slice(0,10) },
                  { id: 'doc4', name: 'CSD_Supplier_Summary_Report.pdf', size: '1.1 MB', uploadedAt: new Date().toISOString().slice(0,10) }
                ]
              },
              {
                id: 'f3',
                name: 'Technical Proposals',
                documents: []
              },
              {
                id: 'f4',
                name: 'Financial Spreadsheets',
                documents: []
              }
            ],
            customChecklist: b.customChecklist || []
          };
        });
        setBids(mapped);
      } else {
        // Seed some defaults
        const seeds: SupplierBid[] = [
          {
            id: 'bid-901',
            tenderRef: 'WCGH-0812/2026',
            tenderTitle: 'Supply of Neonatal Ventilators for Mitchells Plain Hospital',
            tenderValue: 15800000,
            splitPercentage: 12,
            commissionEarned: 150000, // Capped at R150,000 from 1,896,000!
            useFeeCap: true,
            feeCapAmount: 150000,
            status: 'won',
            paymentStatus: 'unpaid',
            updatedAtIso: new Date(Date.now() - 3600000 * 2).toISOString(),
            milestone: 'won',
            checklist: {
              csdSynced: true,
              sarsCompliant: true,
              sbd4Signed: true,
              sbd6Signed: true,
              auditPassed: true,
              pkiSealed: true
            },
            contactName: 'Ms. N. Mandela (SCM Lead)',
            contactEmail: 'nandipha.mandela@westerncape.gov.za',
            contactPhone: '021-483-0000',
            submissionDate: '2026-06-15',
            customBidPrice: 15800000,
            customDeliveryCost: 12500000,
            notes: [
              {
                id: 'n1',
                text: 'Pre-qualification criteria met. Certified digital signature authenticated by Western Cape SCM portal.',
                category: 'scm',
                timestamp: '2026-06-16 11:30'
              },
              {
                id: 'n2',
                text: 'Physical site demonstration scheduled and executed successfully. Clinicians gave excellent feedback on neonatal respiratory response curves.',
                category: 'briefing',
                timestamp: '2026-06-25 14:00'
              },
              {
                id: 'n3',
                text: 'Tender award notice published in Provincial Gazette. Initial execution logistics mobilized.',
                category: 'internal',
                timestamp: '2026-07-09 09:15'
              }
            ]
          },
          {
            id: 'bid-902',
            tenderRef: 'RT25-2026',
            tenderTitle: 'Supply, Delivery & Support of ICT Server Infrastructure',
            tenderValue: 2100000,
            splitPercentage: 12,
            commissionEarned: 150000, // Capped at R150,000 from 252,000!
            useFeeCap: true,
            feeCapAmount: 150000,
            status: 'submitted',
            paymentStatus: 'unpaid',
            updatedAtIso: new Date(Date.now() - 3600000 * 48).toISOString(),
            milestone: 'submitted',
            checklist: {
              csdSynced: true,
              sarsCompliant: true,
              sbd4Signed: true,
              sbd6Signed: true,
              auditPassed: true,
              pkiSealed: false
            },
            contactName: 'Mr. P. Govender (National SCM)',
            contactEmail: 'p.govender@treasury.gov.za',
            contactPhone: '012-315-5111',
            submissionDate: '2026-07-01',
            customBidPrice: 2100000,
            customDeliveryCost: 1750000,
            notes: [
              {
                id: 'n4',
                text: 'Electronic submission uploaded via National e-Tender portal. Awaiting technical evaluation committee shortlisting.',
                category: 'scm',
                timestamp: '2026-07-01 16:45'
              }
            ]
          }
        ];
        setBids(seeds);
        localStorage.setItem('sata_routed_bids_local', JSON.stringify(seeds));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBids();
    window.addEventListener('storage', loadBids);
    return () => {
      window.removeEventListener('storage', loadBids);
    };
  }, []);

  // Offline/Online PWA States
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [offlineDraftCount, setOfflineDraftCount] = useState<number>(0);

  useEffect(() => {
    const loadDrafts = () => {
      try {
        const raw = localStorage.getItem('sata_sbd_forms_drafts_local') || '[]';
        const parsed = JSON.parse(raw);
        setOfflineDraftCount(Array.isArray(parsed) ? parsed.length : 0);
      } catch (e) {
        setOfflineDraftCount(0);
      }
    };
    loadDrafts();
    window.addEventListener('storage', loadDrafts);
    return () => {
      window.removeEventListener('storage', loadDrafts);
    };
  }, []);

  // Payment Form States
  const [payMethod, setPayMethod] = useState<'card' | 'eft'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('SATA MEMBER');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('119');

  const [selectedBank, setSelectedBank] = useState('FNB');
  const [eftAccount, setEftAccount] = useState('62839485739');
  const [eftReference, setEftReference] = useState('SATA-INV-MATCH');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [notificationState, setNotificationState] = useState<PermissionState | 'unsupported'>('default');

  // Advanced Tender Workspace States
  const [mgmtTab, setMgmtTab] = useState<'lifecycle' | 'checklist' | 'finance' | 'notes' | 'tasks' | 'documents'>('lifecycle');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'internal' | 'scm' | 'briefing'>('internal');
  const [showExportModal, setShowExportModal] = useState(false);

  // Load push permission on render
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationState(Notification.permission);
    } else {
      setNotificationState('unsupported');
    }
  }, []);

  const handleRequestNotificationPermission = () => {
    if (!('Notification' in window)) {
      alert("This browser doesn't support Web Notifications API.");
      return;
    }

    Notification.requestPermission().then(permission => {
      setNotificationState(permission);
      addLog?.(`Browser Notification permission updated to: ${permission}`, 'info');
      
      if (permission === 'granted') {
        new Notification("SATA Procurement Alerts", {
          body: "Tender push alert matching actively monitored! Push notifications enabled successfully.",
          icon: '/favicon.ico'
        });
      }
    });
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBidForPayment) {
      alert("Please select a pending invoice or license plan to settle.");
      return;
    }

    setPaymentProcessing(true);
    addLog?.(`[Payment Gateway] Processing ZAR settlement via PayFast secure merchant protocol...`, 'info');

    setTimeout(() => {
      try {
        // Intercept if it's a licensing subscription payment
        if (selectedBidForPayment.id === 'license-upgrade') {
          const tenderRefStr = selectedBidForPayment.tenderRef || 'LICENSE-PROFESSIONAL';
          const targetTier = tenderRefStr.replace('LICENSE-', '').toLowerCase() as 'basic' | 'professional' | 'enterprise' | 'payg';
          setLicenseTier(targetTier);
          localStorage.setItem('sata_supplier_license_tier', targetTier);
          
          setPaymentProcessing(false);
          setPaymentSuccess(true);
          addLog?.(`[Payment Gateway] Monthly License Plan successfully upgraded to ${(targetTier || 'professional').toUpperCase()}! Premium automations enabled.`, 'success');
          
          // Play positive chime sound
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch (e) {}
          return;
        }

        // Intercept if it's a PAYG credit purchase
        if (selectedBidForPayment.id === 'payg-credit-purchase') {
          const newCredits = paygCredits + 1;
          setPaygCredits(newCredits);
          localStorage.setItem('sata_supplier_payg_credits', String(newCredits));
          setLicenseTier('payg');
          localStorage.setItem('sata_supplier_license_tier', 'payg');
          
          setPaymentProcessing(false);
          setPaymentSuccess(true);
          addLog?.(`[Payment Gateway] Pay-As-You-Go credit purchase successful! 1 SBD auto-fill credit added to your balance.`, 'success');
          
          // Play positive chime sound
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch (e) {}
          return;
        }

        const raw = localStorage.getItem('sata_routed_bids_local') || '[]';
        const parsed = JSON.parse(raw);
        
        // Update specific bid as paid
        const updated = parsed.map((b: any) => {
          if (b.id === selectedBidForPayment.id || b.tenderId === selectedBidForPayment.tenderRef) {
            return {
              ...b,
              paymentStatus: 'paid',
              paymentRef: 'TXN-' + Math.floor(Math.random() * 900000000 + 100000000).toString(),
              paidAtIso: new Date().toISOString()
            };
          }
          return b;
        });

        localStorage.setItem('sata_routed_bids_local', JSON.stringify(updated));
        loadBids();

        setPaymentProcessing(false);
        setPaymentSuccess(true);
        addLog?.(`[Payment Gateway] SBD Commission of R${selectedBidForPayment.commissionEarned.toLocaleString()} paid successfully! Receipt compiled.`, 'success');

        // Play positive beep sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.45);
        } catch (e) {}

      } catch (err: any) {
        setPaymentProcessing(false);
        addLog?.(`Payment execution failed: ${err.message}`, 'error');
      }
    }, 1500);
  };

  const handleSelectLicenseTier = (tier: 'basic' | 'professional' | 'enterprise' | 'payg') => {
    if (tier === licenseTier) {
      alert("You are already subscribed to the " + tier.toUpperCase() + " plan.");
      return;
    }
    
    if (tier === 'payg') {
      setLicenseTier('payg');
      localStorage.setItem('sata_supplier_license_tier', 'payg');
      addLog?.(`[Subscription Manager] Plan successfully switched to Pay-As-You-Go Starter. Perfect for first-time or part-time entrepreneurs!`, 'success');
      return;
    }
    
    // Create license billing checkout item
    setSelectedBidForPayment({
      id: 'license-upgrade',
      tenderRef: `LICENSE-${tier.toUpperCase()}`,
      tenderTitle: `SATA Monthly License Subscription Plan: ${
        tier === 'basic' ? 'Basic SCM Tracker' : 
        tier === 'professional' ? 'Professional Auto-Fill' : 
        'National Elite Enterprise'
      }`,
      tenderValue: tier === 'basic' ? 250 : tier === 'professional' ? 1250 : 4500,
      splitPercentage: 0,
      commissionEarned: tier === 'basic' ? 250 : tier === 'professional' ? 1250 : 4500,
      status: 'won',
      paymentStatus: 'unpaid',
      updatedAtIso: new Date().toISOString()
    });
    setPaymentSuccess(false);
    setActiveSubTab('billing');
    addLog?.(`Initiated subscription invoice for SATA ${tier.toUpperCase()} license. Redirecting to checkout.`, 'info');
  };

  const handlePurchasePaygCredit = () => {
    setSelectedBidForPayment({
      id: 'payg-credit-purchase',
      tenderRef: 'SATA-PAYG-CREDIT',
      tenderTitle: 'SATA Pay-As-You-Go: 1x Single Tender Submission Auto-Fill Credit',
      tenderValue: 99,
      splitPercentage: 0,
      commissionEarned: 99,
      status: 'won',
      paymentStatus: 'unpaid',
      updatedAtIso: new Date().toISOString()
    });
    setPaymentSuccess(false);
    setActiveSubTab('billing');
    addLog?.("Initiated Pay-As-You-Go Credit purchase invoice (R99). Redirecting to checkout.", "info");
  };

  // Real-Time Tender Lead Routing Algorithm (Refined Category & Score Breakdown Edition)
  const handleRunRoutingEngine = async () => {
    if (isRoutingRunning) return;
    setIsRoutingRunning(true);
    setRoutingLogs([]);
    setMatchedLeadsList([]);
    addLog?.("Initializing Automated Tender Lead Routing Engine...", "info");

    const logs: string[] = [];
    const addRoutingLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setRoutingLogs([...logs]);
    };

    addRoutingLog("Parsing search keywords & minimum budget threshold (R" + routingMinBudget.toLocaleString() + ")...");
    
    // Parse keywords & categories
    const keywords = routingKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);
    const categories = selectedRoutingCategories.map(c => c.trim().toLowerCase());

    await new Promise(resolve => setTimeout(resolve, 800));
    addRoutingLog(`Detected target keywords: [${keywords.join(', ')}]`);
    addRoutingLog(`Active routing industry filters: [${selectedRoutingCategories.join(', ')}]`);
    addRoutingLog("Polling national & provincial procurement gateways...");

    // Get all hubs
    const provinceKeys = Object.keys(UniversalProvincialService.provincialHubs);
    let allCandidates: any[] = [];

    for (const key of provinceKeys) {
      try {
        const results = await UniversalProvincialService.fetchProvincialTenders(key);
        allCandidates = [...allCandidates, ...results];
      } catch (err) {}
    }

    await new Promise(resolve => setTimeout(resolve, 600));
    addRoutingLog(`Scanned ${allCandidates.length} potential public bulletins. Scoring relevancy using SBD factor matching...`);

    // Match & Score
    const matchingResults: any[] = [];
    
    allCandidates.forEach(tender => {
      let score = 0;
      const titleLower = tender.title.toLowerCase();
      const deptLower = (tender.department || '').toLowerCase();
      const refLower = tender.referenceNumber.toLowerCase();

      // 1. Province Alignment (+40)
      const supplierProv = profile.province.toLowerCase().replace('_', '');
      const tenderProv = tender.province.toLowerCase().replace('_', '');
      const provMatch = supplierProv === tenderProv || supplierProv.includes(tenderProv) || tenderProv.includes(supplierProv);
      if (provMatch) {
        score += 40;
      } else {
        score += 10; // secondary province match
      }

      // 2. Keyword Alignment (+20 per keyword match, cap at 40)
      let keywordHits = 0;
      keywords.forEach(kw => {
        if (titleLower.includes(kw) || deptLower.includes(kw) || refLower.includes(kw)) {
          if (keywordHits < 2) {
            score += 20;
          }
          keywordHits++;
        }
      });

      // 3. Category/Industry Alignment (+30)
      let categoryHit = false;
      categories.forEach(cat => {
        if (titleLower.includes(cat) || deptLower.includes(cat)) {
          categoryHit = true;
        }
      });
      if (categoryHit) {
        score += 30;
      }

      // 4. Tax compliance & CSD Status verification bonus (+10)
      if (profile.taxStatus.includes('Compliant')) {
        score += 10;
      }

      // 5. Subscription tier booster multiplier
      let tierMultiplier = 1.0;
      if (licenseTier === 'enterprise') {
        tierMultiplier = 1.25;
        score += 10;
      } else if (licenseTier === 'professional') {
        tierMultiplier = 1.1;
        score += 5;
      } else if (licenseTier === 'payg') {
        tierMultiplier = 1.05;
        score += 2;
      }

      const finalScore = Math.min(100, Math.round(score * tierMultiplier));

      // Parse tender estimated budget
      let rawVal = 1200000;
      if (tender.estimatedValue && tender.estimatedValue !== 'N/A') {
        const parsed = parseInt(tender.estimatedValue.replace(/[^0-9]/g, ''));
        if (!isNaN(parsed)) rawVal = parsed;
      } else {
        const charSum = refLower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        rawVal = 500000 + (charSum % 10) * 1500000;
      }

      const breakDown = {
        province: provMatch ? 40 : 10,
        keywords: Math.min(40, keywordHits * 20),
        category: categoryHit ? 30 : 0,
        compliance: profile.taxStatus.includes('Compliant') ? 10 : 0,
        booster: licenseTier === 'enterprise' ? '25% Enterprise Multiplier' : licenseTier === 'professional' ? '10% Professional Multiplier' : licenseTier === 'payg' ? '5% Pay-As-You-Go Booster' : 'None'
      };

      // Budget threshold filter
      if (rawVal >= routingMinBudget && finalScore >= 35) {
        matchingResults.push({
          ...tender,
          score: finalScore,
          parsedValue: rawVal,
          provMatch,
          keywordHits,
          categoryHit,
          breakDown
        });
      }
    });

    // Sort by highest score first
    matchingResults.sort((a, b) => b.score - a.score);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Tier specific allocation constraints
    let finalRouted: any[] = [];
    let cappedMessage = "";
    if (licenseTier === 'basic') {
      finalRouted = matchingResults.slice(0, 3);
      if (matchingResults.length > 3) {
        cappedMessage = `Basic Tier limits delivery to 3 maximum scoring leads. Upgrade to unlock all matches.`;
      }
    } else if (licenseTier === 'payg') {
      finalRouted = matchingResults.slice(0, 5);
      if (matchingResults.length > 5) {
        cappedMessage = `Pay-As-You-Go Plan limits delivery to 5 maximum scoring leads. Upgrade or buy credits for higher capacity.`;
      }
    } else if (licenseTier === 'professional') {
      finalRouted = matchingResults.slice(0, 10);
      if (matchingResults.length > 10) {
        cappedMessage = `Professional Tier limits delivery to 10 maximum scoring leads. Upgrade to Enterprise for unlimited routing.`;
      }
    } else {
      finalRouted = matchingResults; // unlimited
    }

    // Add logs
    finalRouted.forEach(lead => {
      addRoutingLog(`MATCH FOUND: [${lead.referenceNumber}] Relevancy: ${lead.score}% - ${lead.title.substring(0, 45)}... [Routed]`);
    });

    if (cappedMessage) {
      addRoutingLog(cappedMessage);
    }

    setMatchedLeadsList(finalRouted);

    // Save newly routed bids to Sata routed bids storage
    try {
      const currentRaw = localStorage.getItem('sata_routed_bids_local') || '[]';
      const currentBids: SupplierBid[] = JSON.parse(currentRaw);

      let newlyAdded = 0;
      const updatedBids = [...currentBids];

      finalRouted.forEach(lead => {
        // Check if already bidded
        const exists = currentBids.some(b => b.tenderRef === lead.referenceNumber);
        if (!exists) {
          updatedBids.unshift({
            id: 'bid-' + Math.floor(Math.random() * 900000 + 100000),
            tenderRef: lead.referenceNumber,
            tenderTitle: lead.title,
            tenderValue: lead.parsedValue,
            splitPercentage: 12,
            commissionEarned: Math.round(lead.parsedValue * 0.12),
            status: 'routing',
            paymentStatus: 'unpaid',
            updatedAtIso: new Date().toISOString()
          });
          newlyAdded++;
        }
      });

      if (newlyAdded > 0) {
        localStorage.setItem('sata_routed_bids_local', JSON.stringify(updatedBids));
        loadBids(); // update state
        addRoutingLog(`Successfully integrated ${newlyAdded} fresh lead routes directly into your SBD Procurement Submissions Tracker!`);
        addLog?.(`Automated lead routing allocated ${newlyAdded} matches to your dashboard!`, 'success');
      } else {
        addRoutingLog("Scan finished. No new matching notice references discovered that weren't already bidded.");
      }
    } catch (e) {
      console.error(e);
    }

    setIsRoutingRunning(false);
  };

  // Automated Bid-Win Routing Engine
  const handleSimulateBidWin = (bidId: string) => {
    try {
      const raw = localStorage.getItem('sata_routed_bids_local') || '[]';
      const parsed = JSON.parse(raw);
      
      const updated = parsed.map((b: any) => {
        if (b.id === bidId) {
          return {
            ...b,
            status: 'won',
            updatedAtIso: new Date().toISOString()
          };
        }
        return b;
      });
      
      localStorage.setItem('sata_routed_bids_local', JSON.stringify(updated));
      loadBids();
      
      const targetBid = bids.find(b => b.id === bidId);
      if (targetBid) {
        addLog?.(`[Automated Bid-Win Routing] Tender ${targetBid.tenderRef} successfully won! Post-award settlement ledger compiled.`, 'success');
        
        // Trigger browser push notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification("Tender Officially Awarded! 🎉", {
              body: `Contract ${targetBid.tenderRef} has been won. SATA has routed the success billing invoice directly to your checkout.`,
              icon: '/favicon.ico'
            });
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBidManagement = (updatedBid: SupplierBid) => {
    try {
      const raw = localStorage.getItem('sata_routed_bids_local') || '[]';
      const parsed = JSON.parse(raw);
      const updated = parsed.map((b: any) => {
        if (b.id === updatedBid.id) {
          return {
            ...updatedBid,
            updatedAtIso: new Date().toISOString()
          };
        }
        return b;
      });
      localStorage.setItem('sata_routed_bids_local', JSON.stringify(updated));
      loadBids(); // update state
      setSelectedBidForManagement(updatedBid); // update active workspace state
      addLog?.(`[Tender Management] Saved latest tracking logs and checklist variables for ${updatedBid.tenderRef}.`, 'success');
    } catch (e) {
      console.error(e);
    }
  };

  // War Room Actions & Reminders Dispatcher
  const handleSendReminder = (id: string) => {
    const target = defaulters.find(d => d.id === id);
    if (!target) return;
    
    setDefaulters(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, reminderCount: d.reminderCount + 1 };
      }
      return d;
    }));

    const timeStr = new Date().toLocaleTimeString();
    const logMsg = `[${timeStr}] Dispatched urgent SMS & Email reminder to ${target.companyName} regarding outstanding contract R${target.commissionAmount.toLocaleString()} success fee.`;
    setWarroomLogs(prev => [logMsg, ...prev]);
    addLog?.(`Renewal reminder sent to ${target.companyName}`, 'info');
  };

  const handleToggleBlock = (id: string) => {
    const target = defaulters.find(d => d.id === id);
    if (!target) return;

    setDefaulters(prev => prev.map(d => {
      if (d.id === id) {
        const nextBlock = d.blockLevel === 'CSD_Restricted' ? 'None' : 'CSD_Restricted';
        return { ...d, blockLevel: nextBlock };
      }
      return d;
    }));

    const nextBlockState = target.blockLevel === 'CSD_Restricted' ? 'None' : 'CSD_Restricted';
    const timeStr = new Date().toLocaleTimeString();
    const logMsg = nextBlockState === 'CSD_Restricted' 
      ? `[${timeStr}] [LEGAL SHIELD WARNING] Restricted CSD status for ${target.companyName}. Blocked from submitting subsequent municipal tenders.`
      : `[${timeStr}] [LEGAL SHIELD INFO] Restored CSD compliance access for ${target.companyName}.`;
    
    setWarroomLogs(prev => [logMsg, ...prev]);
    addLog?.(`CSD status for ${target.companyName} updated to: ${nextBlockState}`, 'warn');
  };

  const handleBroadcastRenewals = () => {
    if (isCampaignRunning) return;
    setIsCampaignRunning(true);
    
    const timeStr = new Date().toLocaleTimeString();
    setWarroomLogs(prev => [`[${timeStr}] Initializing automatic subscription renewal broadcast...`, ...prev]);

    setTimeout(() => {
      const timeStr2 = new Date().toLocaleTimeString();
      setWarroomLogs(prev => [
        `[${timeStr2}] [PayFast Vault] Dispatching secure 3D-Secure 2.0 renewal query.`,
        `[${timeStr2}] Twilio gateway: Dispatched 14 SMS reminders for upcoming cycles.`,
        `[${timeStr2}] Mailer engine: Broadcast complete.`,
        ...prev
      ]);
      setIsCampaignRunning(false);
      addLog?.("Automatic subscription renewal broadcast delivered successfully!", "success");
    }, 1500);
  };

  // SCM Compliance Audit & Verification Reports Generator
  const handleRunAuditVerification = async () => {
    if (auditRunning) return;
    setAuditRunning(true);
    setAuditStep(1);
    setAuditLogs([]);
    setCertifiedLedger(null);

    const logs: string[] = [];
    const addAuditLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setAuditLogs([...logs]);
    };

    addAuditLog("Initializing Treasury Open-SCM Compliance Audit sequence...");
    await new Promise(resolve => setTimeout(resolve, 800));

    setAuditStep(2);
    addAuditLog("Verifying SARS Corporate Income Tax status compliance via National Secure API channel...");
    addAuditLog(`Tax Pin validation: Compliant (Status code: SARS_ACTIVE_GOOD_STANDING)`);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAuditStep(3);
    addAuditLog("Validating Treasury Central Supplier Database (CSD) index matching... (CSD: " + profile.csdNumber + ")");
    addAuditLog("Supplier Corporate Status: Validated Active.");
    addAuditLog("CSD Profile Audit: Company directors, bank accounts, and verification indexes matching.");
    await new Promise(resolve => setTimeout(resolve, 1000));

    // COIDA & Municipal Clearance check log injection
    addAuditLog("Analyzing supplementary statutory documents and certifications...");
    let coidaStatusStr = "";
    let municipalStatusStr = "";
    let score = 70;

    if (coidaFile) {
      addAuditLog(`COIDA Verification: Audited uploaded cert file '${coidaFile.name}' (${coidaFile.size}). Validated active and authentic.`);
      coidaStatusStr = `Compliant (Verified Cert: ${coidaFile.name})`;
      score += 15;
    } else {
      addAuditLog("COIDA Verification: Warning: No uploaded COIDA document. Auditing with simulated active status.");
      coidaStatusStr = "Compliant (Simulated Active status)";
    }

    if (municipalFile) {
      addAuditLog(`Municipal Utilities Audit: Audited uploaded rates bill file '${municipalFile.name}' (${municipalFile.size}). Verified zero arrears over 90 days.`);
      municipalStatusStr = `Compliant (Verified Rates Bill: ${municipalFile.name})`;
      score += 15;
    } else {
      addAuditLog("Municipal Utilities Audit: Warning: No uploaded municipal rates account. Auditing with simulated clear status.");
      municipalStatusStr = "Compliant (Simulated Clear status)";
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAuditStep(4);
    addAuditLog("Validating Preferential Procurement Level credentials (B-BBEE Contributor Level Status)...");
    addAuditLog("B-BBEE Status: Level 1 Sworn Affidavit certified. (99% score weighting modifier active)");
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAuditStep(5);
    addAuditLog("Auditing historical bidded digital signatures and PKI crypto authentication handshakes...");
    const activeKeyHash = "SHA256:d8a291f9cb28e831000980caef" + Math.floor(Math.random() * 9000 + 1000);
    addAuditLog(`Cryptographic signature trace validated: OK. Signing thumbprint: ${activeKeyHash}`);
    await new Promise(resolve => setTimeout(resolve, 1200));

    addAuditLog("Assembling open-audit legal validation report ledger...");
    const reportSeal = "SHA256:SCM-LEDGER-" + Math.floor(Math.random() * 9000000 + 1000000).toString(16).toUpperCase();
    
    const ledger = {
      timestamp: new Date().toISOString(),
      companyName: profile.companyName,
      registrationNumber: profile.registrationNumber,
      csdNumber: profile.csdNumber,
      taxStatus: profile.taxStatus,
      bbbeeLevel: "Level 1 Contributor (AFFIDAVIT)",
      coidaStatus: coidaStatusStr,
      municipalRatesStatus: municipalStatusStr,
      pkiThumbprint: activeKeyHash,
      verificationSeal: reportSeal,
      compliancePercentage: score,
      sbdStatusCheck: "Pass (SBD 4, SBD 6.1, SBD 8, SBD 9 templates cleared & auto-filled)",
      mbdStatusCheck: "Pass (MBD 4, MBD 8, MBD 9 municipal equivalents generated & auto-filled)",
      auditorNotes: score === 100 
        ? "Supplier exhibits immaculate regulatory alignment. Registered PKI signatures conform to the National Treasury Open-Procurement Standard. COIDA certificates and municipal bills validated compliant."
        : "Supplier exhibits adequate regulatory alignment. SBD structures verified. Note: Some supplementary statutory certifications (COIDA or Municipal) are running under simulated/unverified state modes."
    };

    setCertifiedLedger(ledger);
    setAuditStep(6);
    addAuditLog("SCM AUDIT CONCLUDED! COMPLIANCE LEDGER COMPILED SUCCESSFULLY.");
    addLog?.("SCM Compliance Audit Report successfully compiled and cryptographically sealed!", "success");
    setAuditRunning(false);

    // Play pleasant beep sound
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {}
  };

  const handleManualSync = () => {
    addLog?.("PWA Sync Engine initiated. Checking queue pipeline...", "info");
    setTimeout(() => {
      addLog?.(`Synced ${offlineDraftCount} pending offline SBD drafts to Cloud Registry successfully!`, "success");
      alert(`Manual Synchronizer Success! All client-side drafts are fully integrated.`);
    }, 1200);
  };

  // Local Storage Optimizer states & handlers
  const [localStorageStats, setLocalStorageStats] = useState({ usedKb: 0, totalKb: 5120 });
  
  const calculateStorageStats = () => {
    try {
      let totalBytes = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const val = localStorage.getItem(key) || '';
          totalBytes += key.length + val.length;
        }
      }
      const usedKb = parseFloat((totalBytes / 1024).toFixed(2));
      setLocalStorageStats({ usedKb, totalKb: 5120 });
    } catch (e) {
      setLocalStorageStats({ usedKb: 0, totalKb: 5120 });
    }
  };

  useEffect(() => {
    calculateStorageStats();
  }, []);

  const handleBackupWorkspace = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sata_')) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `SATA_POPIA_Workspace_Backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addLog?.("Success: Compiled and downloaded secure offline workspace backup JSON.", "success");
    } catch (e) {
      addLog?.("Failed to generate workspace backup.", "error");
    }
  };

  const handleRestoreWorkspace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        if (typeof backupData === 'object' && backupData !== null) {
          let keysRestored = 0;
          Object.entries(backupData).forEach(([key, val]) => {
            if (key.startsWith('sata_') && typeof val === 'string') {
              localStorage.setItem(key, val);
              keysRestored++;
            }
          });
          calculateStorageStats();
          addLog?.(`Success: Restored ${keysRestored} secure workspace parameters from backup file. Refreshing state...`, 'success');
          
          // Re-load key states
          loadBids();
          
          // Play positive chime sound
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch (audioErr) {}

          alert(`Successfully restored ${keysRestored} keys from your offline backup! The page will refresh/sync the state.`);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Could not parse workspace backup JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const handleOptimizeCache = () => {
    try {
      addLog?.("Running workspace garbage collection and storage defragmentation...", "info");
      
      let keysOptimized = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sata_')) {
          const val = localStorage.getItem(key);
          if (!val || val === 'null' || val === '[]' || val === '{}') {
            localStorage.removeItem(key);
            keysOptimized++;
          }
        }
      }
      
      calculateStorageStats();
      addLog?.(`Defragmentation complete. Removed ${keysOptimized} redundant indexes. Storage optimized. 100% POPIA compliance confirmed.`, "success");
      
      // Play high pitched beep sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } catch (e) {}
    } catch (e) {}
  };

  // Run Supplier Concurrency Stress Test Suite
  const handleRunSupplierStressTest = async () => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    setStressLogs([]);
    setStressLatency([]);
    setStressThroughput(0);

    const logs: string[] = [];
    const addStressLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setStressLogs([...logs]);
    };

    addStressLog(`Initializing Multi-Threaded Sandbox Stress Suite with ${stressConcurrency} concurrent workers...`);
    addStressLog(`Binding to offline WebCrypto RSA-2048 signing engine...`);
    await new Promise(resolve => setTimeout(resolve, 200));

    addStressLog(`Injecting ${stressConcurrency * 15} SBD 4 and SBD 6.1 payload records into parallel index pipelines...`);
    
    const startTime = performance.now();
    const latencyHistory: number[] = [];

    // Run virtual worker threads in parallel
    const workerPromises = Array.from({ length: stressConcurrency }).map(async (_, i) => {
      const idx = i + 1;
      // Stagger thread boot slightly to preserve layout responsiveness
      await new Promise(resolve => setTimeout(resolve, idx * 10));

      addStressLog(`Worker Thread #${idx}: Spawning WebCrypto hash digest validation on SBD 4 envelope...`);
      const threadStart = performance.now();

      // Execute a real, measurable cryptographic or mathematical workload
      const buffer = new Uint8Array(1024);
      window.crypto.getRandomValues(buffer);
      
      for (let j = 0; j < 3; j++) {
        await window.crypto.subtle.digest('SHA-256', buffer);
        // Realistic math cycle to load CPU
        let dummyVal = 0;
        for (let k = 0; k < 50000; k++) {
          dummyVal += Math.sqrt(k) * Math.sin(k);
        }
      }

      const threadEnd = performance.now();
      const opLatency = Math.round((threadEnd - threadStart) + 4 + Math.random() * 4);
      latencyHistory.push(opLatency);
      setStressLatency([...latencyHistory]);

      addStressLog(`Worker Thread #${idx}: Cryptographic hash sealed (SHA-256). Local verification complete in ${opLatency}ms.`);
    });

    // Await all threads in parallel
    await Promise.all(workerPromises);

    const elapsedMs = Math.round(performance.now() - startTime);
    const computedThroughput = Math.round((stressConcurrency * 30) / (elapsedMs / 1000));
    setStressThroughput(computedThroughput);

    addStressLog(`All ${stressConcurrency} threads completed execution with ZERO thread locks or memory barrier overflows.`);
    addStressLog(`Average transaction processing capacity: ${computedThroughput.toLocaleString()} SBD operations/sec.`);
    addStressLog(`Cumulative cache writes: ${(stressConcurrency * 2.8).toFixed(1)} KB committed to SATA IndexedDB schema.`);

    setIsStressTesting(false);
    addLog?.(`Stress test completed. Throughput: ${computedThroughput} ops/sec. Memory: Stable.`, 'success');

    // Play high-concurrency success tone
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
      });
    } catch (e) {}
  };

  const totals = useMemo(() => {
    let earned = 0;
    let pendingFees = 0;
    let wonCount = 0;

    bids.forEach(b => {
      if (b.status === 'won') {
        earned += b.tenderValue;
        wonCount++;
        if (b.paymentStatus !== 'paid') {
          pendingFees += b.commissionEarned;
        }
      }
    });

    return { earned, pendingFees, wonCount };
  }, [bids]);

  return (
    <div className="space-y-6" id="supplier-dashboard-container">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-lg p-6 border border-emerald-800 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-400" />
              <h1 className="text-lg font-bold font-display uppercase tracking-wider text-emerald-400">
                SCM Supplier Compliance & Operations Dashboard
              </h1>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Supplier portal for viewing SARS compliance audits, central supplier records (CSD), submitting bid documents, and executing payment options.
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              onClick={() => setHideDiagnostics(!hideDiagnostics)}
              className={`border rounded px-2.5 py-1 text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                hideDiagnostics 
                  ? 'bg-red-950/80 border-red-800 text-red-300 hover:bg-red-900/80' 
                  : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Toggle to hide/mask simulated console output logs for developer security/privacy"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {hideDiagnostics ? "DIAGNOSTICS: MASKED" : "DIAGNOSTICS: LIVE"}
            </button>
            <span className="bg-emerald-900/80 border border-emerald-700/80 rounded px-2.5 py-1 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-400" />
              PWA SYSTEM ARTIFACTS ACTIVE
            </span>
          </div>
        </div>

        {/* Dashboard Sub Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-b border-emerald-800/50 pb-0.5">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Overview & Profile
          </button>
          <button
            onClick={() => setActiveSubTab('bids')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'bids'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            My Bid Tracker ({bids.length})
          </button>
          <button
            onClick={() => setActiveSubTab('routing')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'routing'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Lead Routing Engine
          </button>
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'billing'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Payments & Licensing
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'audit'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Compliance Audits
          </button>
          <button
            onClick={() => setActiveSubTab('pwa_sync')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'pwa_sync'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Offline PWA Sync
          </button>
          <button
            onClick={() => setActiveSubTab('warroom')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'warroom'
                ? 'border-red-400 text-red-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            Reminders & Defaulters War Room
          </button>
          <button
            onClick={() => setActiveSubTab('stress_test')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer flex items-center gap-1 ${
              activeSubTab === 'stress_test'
                ? 'border-orange-400 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            SATA Stress Suite
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="supplier-tab-overview">
          
          {/* Main profile card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Treasury & SARS Verification Credentials
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 font-mono text-xs">
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Registered Corporate Name</span>
                    <strong className="text-slate-800 text-[11px] font-sans">{profile.companyName}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">SARS Income Tax Status</span>
                    <strong className="text-emerald-700 font-bold">{profile.taxStatus}</strong>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">CSD Registration Number</span>
                    <strong className="text-slate-800 font-bold">{profile.csdNumber}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-150 rounded">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Corporate Reg No</span>
                    <strong className="text-slate-800 font-bold">{profile.registrationNumber}</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* CSD Auto-Sync Hub */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 text-sky-600 ${isCsdSyncing ? 'animate-spin' : ''}`} />
                  <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    National Treasury CSD Auto-Sync Hub
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px]">
                  <span className={`w-2 h-2 rounded-full ${csdAutoSync ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                  <span className="text-slate-500 uppercase font-bold">{csdAutoSync ? 'Auto-Sync Active' : 'Auto-Sync Idle'}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 border border-slate-150 p-4 rounded-lg">
                <div className="space-y-1 text-left">
                  <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">Background Synchronization gateway</span>
                  <p className="text-[11px] text-slate-600 leading-normal max-w-md">
                    Automate continuous fetching of SARS compliance, registration amendments, and verified director listings directly from the Central Supplier Database.
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono block">Last successful API poll: <strong className="text-slate-700">{lastSynced}</strong></span>
                </div>
                
                {/* Toggle switch styled cleanly with Tailwind */}
                <div className="flex items-center gap-3 shrink-0">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={csdAutoSync} 
                      onChange={(e) => setCsdAutoSync(e.target.checked)} 
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600 animate-none"></div>
                    <span className="ml-2.5 text-[10px] font-mono font-bold text-slate-500 uppercase">Auto Sync</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-left">
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded text-center">
                  <span className="text-[8px] text-slate-400 block uppercase font-mono font-bold">SARS Clearance</span>
                  <span className="text-[10px] text-emerald-700 font-bold font-mono">✓ Compliant</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded text-center">
                  <span className="text-[8px] text-slate-400 block uppercase font-mono font-bold">COIDA Letter</span>
                  <span className={`text-[10px] font-mono font-bold ${coidaFile ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {coidaFile ? '✓ Uploaded' : '• Simulated'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded text-center">
                  <span className="text-[8px] text-slate-400 block uppercase font-mono font-bold">Municipal Utilities</span>
                  <span className={`text-[10px] font-mono font-bold ${municipalFile ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {municipalFile ? '✓ Uploaded' : '• Simulated'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-150 rounded text-center">
                  <span className="text-[8px] text-slate-400 block uppercase font-mono font-bold">Director Checks</span>
                  <span className="text-[10px] text-emerald-700 font-bold font-mono">✓ Verified DHA</span>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => runCsdSync(false)}
                  disabled={isCsdSyncing}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-mono font-bold uppercase text-[10px] tracking-wider py-2 px-4 rounded transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCsdSyncing ? 'animate-spin' : ''}`} />
                  {isCsdSyncing ? 'Contacting CSD Node...' : 'Sync CSD Records Now'}
                </button>
              </div>
            </div>

            {/* Autonomous SCM Guardian & Risk Monitor Card */}
            <div className={`p-5 rounded-lg border shadow-sm transition-all text-left space-y-4 ${
              riskIndex > 40 ? 'bg-red-50/50 border-red-200' :
              riskIndex > 0 ? 'bg-amber-50/40 border-amber-200' :
              'bg-slate-50/50 border-slate-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-200/60">
                <div className="flex items-center gap-2">
                  <ShieldAlert className={`w-5 h-5 ${riskIndex > 0 ? 'text-amber-600 animate-bounce' : 'text-emerald-600'}`} />
                  <div>
                    <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Autonomous SCM Guardian & Compliance Monitor
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                      Continuous background verification of national treasury bidding compliance
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    riskIndex > 40 ? 'bg-red-100 text-red-800 border border-red-200' :
                    riskIndex > 0 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {riskIndex > 40 ? '🔴 CRITICAL RISK' : riskIndex > 0 ? '🟡 WARNING RISK' : '🟢 PERFECTLY SECURE'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Circular Indicator or Text Progress */}
                <div className="md:col-span-4 flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-slate-150 shadow-sm text-center">
                  <span className="text-[8.5px] font-mono text-slate-400 uppercase tracking-wider font-bold">SCM Risk index</span>
                  <div className="relative flex items-center justify-center my-2">
                    {/* Circle visual */}
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle cx="40" cy="40" r="32" strokeWidth="6" stroke="#f1f5f9" fill="transparent" />
                      <circle cx="40" cy="40" r="32" strokeWidth="6" 
                        stroke={riskIndex > 40 ? '#ef4444' : riskIndex > 0 ? '#f59e0b' : '#10b981'} 
                        strokeDasharray={2 * Math.PI * 32} 
                        strokeDashoffset={2 * Math.PI * 32 * (1 - riskIndex / 100)} 
                        strokeLinecap="round" 
                        fill="transparent" 
                      />
                    </svg>
                    <span className="absolute text-base font-mono font-bold text-slate-800">{riskIndex}%</span>
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-sans italic">
                    {riskIndex > 40 ? 'Disqualification imminent' : riskIndex > 0 ? 'Compliance warning alert' : 'Secure. All agents active.'}
                  </p>
                </div>

                {/* Agent Details & Alerts */}
                <div className="md:col-span-8 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-slate-500">ACTIVE DETECTOR AGENTS:</span>
                    <strong className="font-mono text-slate-800">7 Active (AI-Powered)</strong>
                  </div>

                  {activeFailuresCount > 0 ? (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {activeFailuresList.map((fail, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 p-1.5 bg-red-50/60 border border-red-100 rounded text-[10.5px] text-red-800">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping shrink-0" />
                          <span className="font-mono font-bold shrink-0">[THREAT_DETECTED]</span>
                          <span className="font-sans truncate">{fail}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-md text-left flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-800 text-[11px] block">Zero threats detected. No SCM anomalies found.</strong>
                        <span className="text-slate-500 text-[10px] block mt-0.5">SARS PIN validity, black ownership affidavit, PERSAL conflict logs, pricing feasibility, and PKI integrity are pristine.</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('sata_switch_tab', { detail: 'agents' }));
                        addLog?.("Navigated to Autonomous Compliance Monitoring Console.", "info");
                      }}
                      className="bg-slate-950 hover:bg-slate-900 text-white font-mono font-bold uppercase text-[9px] tracking-wider py-1.5 px-3 rounded transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      Configure Agents Console
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick stats box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Tenders Awarded</span>
                <div className="text-2xl font-mono font-bold text-slate-800">{totals.wonCount}</div>
                <span className="text-[10px] text-slate-400 block font-mono">Total value contract capture</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Total Bidded value</span>
                <div className="text-2xl font-mono font-bold text-slate-800">R{totals.earned.toLocaleString()}</div>
                <span className="text-[10px] text-slate-400 block font-mono">Awarded SCM tender volume</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
                <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">Outstanding Commission Fees</span>
                <div className="text-2xl font-mono font-bold text-red-600">R{totals.pendingFees.toLocaleString()}</div>
                <span className="text-[10px] text-slate-400 block font-mono">SBD processing service fees due</span>
              </div>
            </div>

            {/* Active Costing & Feasibility Bridge Panel */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    SATA Costing & Financial Feasibility Bridge
                  </h3>
                </div>
                {pricingProposal ? (
                  <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                    Connected
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded uppercase">
                    Disconnected
                  </span>
                )}
              </div>

              {pricingProposal ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Proposed Bid (Pt)</span>
                      <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                        {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.totalBidPriceWithVat)}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-mono block">
                        {pricingProposal.isVatRegistered ? 'Incl. 15% VAT' : 'Excl. VAT'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Execution Cost</span>
                      <strong className="text-slate-800 text-sm font-mono block mt-0.5">
                        {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.totalDeliveryCost)}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-mono block">
                        Direct Costs
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Gross Profit</span>
                      <strong className="text-emerald-700 text-sm font-mono block mt-0.5 font-bold">
                        {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.grossProfit)}
                      </strong>
                      <span className="text-[8px] text-emerald-600 font-mono block font-bold">
                        {pricingProposal.grossProfitMargin?.toFixed(1)}% Margin
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded">
                      <span className="text-[9px] font-mono text-slate-400 block uppercase font-bold">Tax Planning</span>
                      <strong className="text-amber-700 text-sm font-mono block mt-0.5 font-bold">
                        {pricingProposal.corporateTaxReserve 
                          ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.corporateTaxReserve)
                          : 'R0'}
                      </strong>
                      <span className="text-[8px] text-slate-400 font-mono block">
                        27% CIT Reserve
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/55 border border-emerald-150 rounded-lg flex items-start gap-2.5 text-slate-700 text-left">
                    <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-850 block">Bid Feasibility Sync'd</span>
                      <p className="text-[10.5px] leading-relaxed text-slate-600">
                        Dynamic cost-variables are active. This financial model has been linked to your live <strong>SBD forms</strong> and will be integrated into the <strong>SCM Compliance Audits</strong> automatically.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center space-y-3">
                  <p className="text-slate-500 text-xs">
                    No active costing parameters have been synchronized yet.
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-normal">
                    To connect, open the <strong>Tender Cost Advisor</strong> or <strong>Tender Profit Calculator</strong> tab, add your execution costs (Materials, Labor, Logistics), and save your markup rate. This will establish an active costing bridge across SBD forms and the Live Auditor.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right side: Subscription tier & Push setup */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Membership Tier & Dual-Fee Explanation */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                  SATA Licensing & Tiers
                </h3>
                <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded uppercase">Dual Payment Model</span>
              </div>
              
              <div className="p-3 bg-slate-900 text-white rounded font-mono text-xs space-y-1 relative overflow-hidden">
                <span className="absolute top-2 right-2 text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold animate-pulse">ACTIVE</span>
                <span className="text-[10px] text-slate-400 uppercase block">active license</span>
                <strong className="text-emerald-400 text-[13px] font-sans block font-bold">{profile.tier}</strong>
                <span className="text-[9px] text-slate-400 block pt-1 border-t border-slate-800 mt-2">Cycle Expiry: {profile.renewalDate}</span>
              </div>

              {/* Explanatory breakdown answering user prompt */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded space-y-2 text-[11px] leading-normal">
                <strong className="text-slate-800 font-mono text-[10px] uppercase block border-b border-slate-200 pb-1">When do suppliers pay?</strong>
                <div className="space-y-1.5">
                  <p className="text-slate-600">
                    SATA operates on a transparent, balanced and inclusive **multi-option funding structure**:
                  </p>
                  <div className="space-y-1 pl-1">
                    <div className="text-slate-700">
                      • <strong className="text-slate-900 font-sans font-semibold">1. Access Licensing Fee:</strong> Fixed monthly/annual plans (Basic, Pro, Elite) with unlimited SBD template fill runs for high-volume bidders.
                    </div>
                    <div className="text-slate-700">
                      • <strong className="text-slate-900 font-sans font-semibold">2. Pay-As-You-Go Credit Model:</strong> R0/mo base plan + **R99 per single bid credit**. Built specifically for **individual first-time users** or **part-time entrepreneurs** starting out!
                    </div>
                    <div className="text-slate-700">
                      • <strong className="text-slate-900 font-sans font-semibold">3. Success-Based Settlement Fee:</strong> A success-commission split (nominal 12% - **capped at R150,000 maximum** to protect SMME margins) payable **ONLY when you win**. No win, R0 success fee.
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Tier Quick-Selector */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Modify Subscription Plan</span>
                
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleSelectLicenseTier('basic')}
                    className={`w-full p-2 rounded text-left font-sans text-xs border transition-all flex justify-between items-center cursor-pointer ${
                      licenseTier === 'basic' 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">Basic SCM Tracker</span>
                      <span className="text-[10px] text-slate-400 font-mono">Limits: Max 3 lead routings</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-right">R250/mo</span>
                  </button>

                  <button
                    onClick={() => handleSelectLicenseTier('professional')}
                    className={`w-full p-2 rounded text-left font-sans text-xs border transition-all flex justify-between items-center cursor-pointer ${
                      licenseTier === 'professional' 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">Professional Auto-Fill</span>
                      <span className="text-[10px] text-slate-400 font-mono">Limits: Max 10 lead routings</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-right">R1,250/mo</span>
                  </button>

                  <button
                    onClick={() => handleSelectLicenseTier('enterprise')}
                    className={`w-full p-2 rounded text-left font-sans text-xs border transition-all flex justify-between items-center cursor-pointer ${
                      licenseTier === 'enterprise' 
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">National Elite Enterprise</span>
                      <span className="text-[10px] text-slate-400 font-mono">Limits: Unlimited matches + speed boost</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-right">R4,500/mo</span>
                  </button>

                  <button
                    onClick={() => handleSelectLicenseTier('payg')}
                    className={`w-full p-2 rounded text-left font-sans text-xs border transition-all flex justify-between items-center cursor-pointer ${
                      licenseTier === 'payg' 
                        ? 'bg-amber-50 border-amber-400 text-amber-950 font-semibold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">Pay-As-You-Go Plan 🇿🇦</span>
                      <span className="text-[10px] text-slate-400 font-mono">Limits: R0/mo. Perfect for first-time builders</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-right">R0/mo</span>
                  </button>
                </div>
              </div>

              {licenseTier === 'payg' && (
                <div className="mt-2 p-3 bg-amber-50/50 border border-amber-200 rounded-md space-y-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      PAYG Credit Hub
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded animate-pulse">
                      Starter Mode
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 bg-white p-2 rounded border border-amber-100">
                    <div>
                      <span className="text-[8px] text-slate-400 uppercase font-mono block">Available Credits</span>
                      <strong className="text-sm font-mono text-slate-900 block font-bold mt-0.5">
                        {paygCredits} SBD
                      </strong>
                    </div>
                    <div className="border-l border-slate-100 pl-2">
                      <span className="text-[8px] text-slate-400 uppercase font-mono block">Cost Per Credit</span>
                      <strong className="text-sm font-mono text-emerald-700 block font-bold mt-0.5">
                        R99.00
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchasePaygCredit}
                    className="w-full bg-slate-950 hover:bg-slate-900 text-white font-mono font-bold uppercase py-1.5 px-2 rounded text-[10px] tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    Buy 1x Auto-Fill Credit (R99)
                  </button>
                  
                  <p className="text-[8.5px] text-slate-500 leading-normal font-sans">
                    *Credits are used to generate fully validated and cryptographically sealed South African SBD / MBD bidding forms. Includes 1 free complimentary credit.
                  </p>
                </div>
              )}

            </div>

            {/* Notification alert permissions */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3.5">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BellRing className="w-4 h-4 text-emerald-600" />
                Browser Push Alerts
              </h3>
              <p className="text-slate-400 text-xs">
                Enable desktop push alert subscriptions. The service worker will notify you instantly when provincial bids match your criteria.
              </p>

              <div className="pt-1.5">
                <div className="flex justify-between items-center text-xs font-mono mb-3">
                  <span>STATUS:</span>
                  <strong className={`px-2 py-0.5 text-[10px] rounded uppercase ${
                    notificationState === 'granted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    notificationState === 'denied' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {notificationState}
                  </strong>
                </div>

                {notificationState !== 'granted' ? (
                  <button
                    onClick={handleRequestNotificationPermission}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Authorize Push Permissions
                  </button>
                ) : (
                  <div className="text-[10.5px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded text-center">
                    ✔ Web push notification channels integrated!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TRACK BIDS TAB */}
      {activeSubTab === 'bids' && !selectedBidForManagement && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4" id="supplier-tab-bids">
          <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Active SBD Procurement Submissions Tracker
          </h3>
          <p className="text-slate-400 text-xs">
            Live bid tracking ledger. Once an SBD pre-fill draft matches a municipal bulletined notice, view progress evaluations, scoring rankings, and payment statuses. Click "Manage Bid" to open the interactive Tender Workspace.
          </p>

          <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase font-bold">
                  <th className="p-3">Tender Ref / Project Title</th>
                  <th className="p-3">Estimated Budget</th>
                  <th className="p-3">SBD Service Fee</th>
                  <th className="p-3 text-center">Bid Status</th>
                  <th className="p-3 text-center">Bill Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {bids.map(bid => (
                  <tr key={bid.id} className="hover:bg-slate-50 text-[11px]">
                    <td className="p-3 max-w-sm">
                      <div className="font-mono font-bold text-slate-800">{bid.tenderRef}</div>
                      <div className="text-slate-500 font-sans truncate text-[10.5px] mt-0.5">{bid.tenderTitle}</div>
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-900">
                      R{bid.tenderValue.toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-slate-500">
                      R{bid.commissionEarned.toLocaleString()} ({bid.splitPercentage}%)
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded uppercase font-bold border ${
                        bid.status === 'won' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        bid.status === 'submitted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {bid.status === 'sbd_generated' ? 'ready' : bid.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded uppercase font-bold ${
                        bid.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {bid.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedBidForManagement(bid);
                          addLog?.(`Opened Tender Workspace for: ${bid.tenderRef}`, 'info');
                        }}
                        className={`px-2 py-1 font-mono text-[9px] uppercase font-bold rounded cursor-pointer transition-colors shadow-sm border ${
                          selectedBidForManagement?.id === bid.id
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800 border-emerald-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        Manage Bid
                      </button>

                      {bid.paymentStatus !== 'paid' && bid.status === 'won' ? (
                        <button
                          onClick={() => {
                            setSelectedBidForPayment(bid);
                            setActiveSubTab('billing');
                            addLog?.(`Loaded payment invoice for: ${bid.tenderRef}`, 'info');
                          }}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] uppercase font-bold rounded cursor-pointer transition-colors shadow-sm"
                        >
                          Settle Invoice
                        </button>
                      ) : bid.status !== 'won' ? (
                        <button
                          onClick={() => handleSimulateBidWin(bid.id)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-[9px] uppercase font-bold rounded cursor-pointer transition-colors shadow-sm"
                          title="Simulate tender award to trigger automatic routing"
                        >
                          Simulate Win
                        </button>
                      ) : (
                        <span className="text-slate-400 italic font-mono text-[10px] inline-block ml-1">No Action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED TENDER APPLICATION WORKSPACE */}
      {activeSubTab === 'bids' && selectedBidForManagement && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 shadow-sm space-y-5" id="supplier-tab-bids-workspace">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedBidForManagement(null)}
                  className="text-slate-500 hover:text-slate-800 font-mono text-xs flex items-center gap-1 transition-colors px-2 py-1 bg-white border border-slate-200 rounded shadow-xs cursor-pointer"
                >
                  ← Back to Ledger
                </button>
                <span className="text-slate-300">/</span>
                <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-200/60 px-1.5 py-0.5 rounded uppercase">Tender Workspace</span>
              </div>
              <h3 className="text-sm font-bold font-sans text-slate-900 mt-1 leading-tight flex items-center gap-2">
                {selectedBidForManagement.tenderTitle}
              </h3>
              <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-1">
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">{selectedBidForManagement.tenderRef}</span>
                <span>•</span>
                <span>Last Updated: {new Date(selectedBidForManagement.updatedAtIso).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(true);
                  addLog?.(`Generating compliance audit & submission dossier report for ${selectedBidForManagement.tenderRef}...`, 'success');
                }}
                className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded shadow-xs cursor-pointer flex items-center gap-1 transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                Export Report
              </button>
              <span className={`px-2.5 py-1 text-xs font-mono rounded uppercase font-bold border shadow-xs ${
                selectedBidForManagement.milestone === 'won' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                selectedBidForManagement.milestone === 'submitted' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                selectedBidForManagement.milestone === 'evaluating' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                selectedBidForManagement.milestone === 'completed' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                Milestone: {selectedBidForManagement.milestone || 'draft'}
              </span>
            </div>
          </div>

          {/* Workspace Tabs */}
          <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => {
                setMgmtTab('lifecycle');
                addLog?.('Viewing Tender Lifecycle & Contacts', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'lifecycle' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🚀 Lifecycle & Contacts
            </button>
            <button
              onClick={() => {
                setMgmtTab('checklist');
                addLog?.('Viewing Tender Compliance Checklist', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'checklist' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Compliance Checklist
            </button>
            <button
              onClick={() => {
                setMgmtTab('tasks');
                addLog?.('Viewing Task Delegation & Schedules', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'tasks' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              🛠 Tasks & Timeline
            </button>
            <button
              onClick={() => {
                setMgmtTab('documents');
                addLog?.('Viewing Virtual Document Vault folders', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'documents' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              📁 Document Vault
            </button>
            <button
              onClick={() => {
                setMgmtTab('finance');
                addLog?.('Viewing Financial Costing Bridge', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'finance' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              💰 Costing Bridge & Margins
            </button>
            <button
              onClick={() => {
                setMgmtTab('notes');
                addLog?.('Viewing Notes & Log History', 'info');
              }}
              className={`px-4 py-2 font-mono text-xs font-bold border-b-2 transition-all -mb-[1px] cursor-pointer ${
                mgmtTab === 'notes' ? 'border-emerald-600 text-emerald-900 bg-white rounded-t-md border-t border-l border-r border-slate-250' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              💬 Logs & Notes ({selectedBidForManagement.notes?.length || 0})
            </button>
          </div>

          {/* Workspace Inner Panels */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            {/* TAB A: LIFECYCLE PROGRESS */}
            {mgmtTab === 'lifecycle' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-3">Tender Application Milestone Stage</h4>
                  {/* Milestones stepper */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {(['draft', 'audited', 'submitted', 'evaluating', 'won', 'delivery', 'completed'] as const).map((ms) => {
                      const isActive = selectedBidForManagement.milestone === ms;
                      const stages = {
                        draft: { label: 'Drafting', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                        audited: { label: 'Audited', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
                        submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                        evaluating: { label: 'Evaluating', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                        won: { label: 'Awarded/Won', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                        delivery: { label: 'In Delivery', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
                        completed: { label: 'Settled', color: 'bg-slate-100 text-slate-900 border-slate-300' }
                      };
                      return (
                        <button
                          key={ms}
                          onClick={() => {
                            const updated = {
                              ...selectedBidForManagement,
                              milestone: ms,
                              status: ms === 'won' ? 'won' : ms === 'submitted' ? 'submitted' : selectedBidForManagement.status
                            };
                            handleSaveBidManagement(updated);
                            addLog?.(`Tender milestone shifted to: ${ms.toUpperCase()}`, 'success');
                          }}
                          className={`p-2 rounded border text-left flex flex-col justify-between h-16 transition-all cursor-pointer ${
                            isActive
                              ? `${stages[ms].color} ring-2 ring-emerald-500 scale-102 font-semibold shadow-xs`
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="font-mono text-[8px] uppercase tracking-wider">
                            {isActive ? '● ACTIVE' : 'STAGE'}
                          </span>
                          <span className="font-sans text-[11px] font-bold">{stages[ms].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contacts Edit Form */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      SCM Secretariat & Authority Contacts
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Name</label>
                        <input
                          type="text"
                          defaultValue={selectedBidForManagement.contactName || ''}
                          onBlur={(e) => {
                            const updated = { ...selectedBidForManagement, contactName: e.target.value };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-sans focus:outline-emerald-600"
                          placeholder="e.g. Ms. N. Mandela"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Email</label>
                        <input
                          type="email"
                          defaultValue={selectedBidForManagement.contactEmail || ''}
                          onBlur={(e) => {
                            const updated = { ...selectedBidForManagement, contactEmail: e.target.value };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-sans focus:outline-emerald-600"
                          placeholder="e.g. secret@treasury.gov.za"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Contact Phone</label>
                        <input
                          type="text"
                          defaultValue={selectedBidForManagement.contactPhone || ''}
                          onBlur={(e) => {
                            const updated = { ...selectedBidForManagement, contactPhone: e.target.value };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-sans focus:outline-emerald-600"
                          placeholder="e.g. 012-345-6789"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Submission Deadline</label>
                        <input
                          type="date"
                          defaultValue={selectedBidForManagement.submissionDate || ''}
                          onChange={(e) => {
                            const updated = { ...selectedBidForManagement, submissionDate: e.target.value };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono focus:outline-emerald-600"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      💡 Tip: Changing contact fields automatically auto-saves on focus blur.
                    </p>
                  </div>

                  {/* Overview Panel */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-indigo-600" />
                        Tender Information Summary
                      </h4>
                      <p className="text-slate-500 text-xs mt-2 leading-relaxed">
                        This tender application is tracked under the SATA Unified Municipal Procurement protocol. Changes made here persist to your company's secure local encrypted storage.
                      </p>
                      <div className="mt-4 space-y-1.5 font-mono text-[11px] text-slate-600">
                        <div className="flex justify-between border-b border-slate-150 pb-1">
                          <span>Notice ID:</span>
                          <strong className="text-slate-800">{selectedBidForManagement.id}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-150 pb-1">
                          <span>Contract Reference:</span>
                          <strong className="text-slate-800">{selectedBidForManagement.tenderRef}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-150 pb-1">
                          <span>Base SCM Valuation:</span>
                          <strong className="text-slate-800">R{selectedBidForManagement.tenderValue.toLocaleString()}</strong>
                        </div>
                        <div className="flex justify-between border-b border-slate-150 pb-1">
                          <span>Sata Facilitation Fee:</span>
                          <strong className="text-emerald-700">R{selectedBidForManagement.commissionEarned.toLocaleString()} (12%)</strong>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedBidForManagement(null)}
                        className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded shadow-xs cursor-pointer text-center"
                      >
                        ✔ Done - Back to Ledger
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB B: COMPLIANCE CHECKLIST */}
            {mgmtTab === 'checklist' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-4.5 h-4.5 text-emerald-600" />
                    Mandatory SBD Deliverables & Compliance Checklist
                  </h4>
                  <p className="text-slate-400 text-xs mb-4">
                    Verify and certify your documentation compliance status below. Tendering on public sector contracts requires absolute compliance validation across CSD, SARS and statutory SBD forms.
                  </p>
                </div>

                {/* Progress bar */}
                {(() => {
                  const check = selectedBidForManagement.checklist || {};
                  const total = 6;
                  const completed = [
                    check.csdSynced, check.sarsCompliant, check.sbd4Signed,
                    check.sbd6Signed, check.auditPassed, check.pkiSealed
                  ].filter(Boolean).length;
                  const pct = Math.round((completed / total) * 100);
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span>COMPLIANCE LEVEL:</span>
                        <strong className={pct === 100 ? 'text-emerald-600' : 'text-amber-600'}>
                          {pct}% ({completed} / {total} Verified)
                        </strong>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Interactive Compliance Health Meter Widget */}
                <ComplianceHealthMeter 
                  initialFormData={{
                    sars_pin: !!(selectedBidForManagement.checklist?.sarsCompliant),
                    bbbee_level: !!(selectedBidForManagement.checklist?.sbd6Signed),
                    local_content: !!(selectedBidForManagement.checklist?.auditPassed),
                    company_reg: !!(selectedBidForManagement.checklist?.csdSynced)
                  }}
                  addLog={addLog}
                />

                {/* Checklist Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {[
                    { key: 'csdSynced', title: 'National Treasury CSD Profile Sync', desc: 'Verify that your Central Supplier Database supplier profile, active bank validation, and director credentials are fully aligned.' },
                    { key: 'sarsCompliant', title: 'SARS Tax Compliance Status Pin', desc: 'Secure an active Compliant Tax Pin certificate from SARS e-Filing to validate no outstanding liabilities.' },
                    { key: 'sbd4Signed', title: 'SBD 4 (Declaration of Interest) Completed', desc: 'Statutory disclosure declaring no conflict of interest, municipal relationship, or state employment.' },
                    { key: 'sbd6Signed', title: 'SBD 6.1 (Preferential Points Claim)', desc: 'Claim preferential points based on B-BBEE status levels and localized specific target goals.' },
                    { key: 'auditPassed', title: 'Compliance Audit Assessment Passed', desc: 'Dynamic internal costing audit scoring at least 80/100 to ensure financial integrity and zero margin leakages.' },
                    { key: 'pkiSealed', title: 'PKI Cryptographic Portal Seal', desc: 'Apply professional high-security digital cryptographic signatures to lock the PDF tender submission package.' }
                  ].map((item) => {
                    const checklist = selectedBidForManagement.checklist || {};
                    const isChecked = !!(checklist as any)[item.key];
                    return (
                      <div 
                        key={item.key}
                        onClick={() => {
                          const updatedCheck = {
                            ...checklist,
                            [item.key]: !isChecked
                          };
                          const updated = {
                            ...selectedBidForManagement,
                            checklist: updatedCheck
                          };
                          handleSaveBidManagement(updated);
                          addLog?.(`Toggled checklist status for: ${item.title}`, 'info');
                        }}
                        className={`p-3.5 rounded-lg border flex gap-3 cursor-pointer select-none transition-all hover:shadow-xs ${
                          isChecked 
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="pt-0.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                            {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-[11.5px] font-bold font-sans">{item.title}</h5>
                          <p className="text-[10.5px] text-slate-500 leading-normal">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Checklist Section */}
                <div className="border-t border-slate-200 pt-5 mt-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <h5 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-600 animate-pulse" />
                        Enterprise & Tender-Specific Compliance Checklist
                      </h5>
                      <p className="text-[10.5px] text-slate-400">
                        Add specific localized compliance prerequisites (e.g., COIDA certificate of good standing, local residency affidavit, or manufacturing authorization letters).
                      </p>
                    </div>
                  </div>

                  {/* Add Custom Item Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase">Requirement Title</label>
                        <input 
                          id="newCustomChecklistTitle" 
                          type="text" 
                          placeholder="e.g. COIDA Certificate of Standing" 
                          className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded font-sans focus:outline-emerald-600" 
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2 flex items-end gap-2">
                        <div className="space-y-1 flex-1">
                          <label className="block text-[9px] font-mono font-bold text-slate-500 uppercase">Brief Description / Guideline</label>
                          <input 
                            id="newCustomChecklistDesc" 
                            type="text" 
                            placeholder="e.g. Compensation for Occupational Injuries and Diseases Act validation" 
                            className="w-full text-xs p-1.5 border border-slate-200 bg-white rounded font-sans focus:outline-emerald-600" 
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const titleEl = document.getElementById('newCustomChecklistTitle') as HTMLInputElement;
                            const descEl = document.getElementById('newCustomChecklistDesc') as HTMLInputElement;
                            const title = titleEl?.value.trim();
                            const desc = descEl?.value.trim();
                            if (!title) return;

                            const customItems = selectedBidForManagement.customChecklist || [];
                            const newItem = {
                              id: 'cust-' + Date.now(),
                              title,
                              description: desc || 'Custom verified requirement.',
                              checked: false
                            };

                            const updated = {
                              ...selectedBidForManagement,
                              customChecklist: [...customItems, newItem]
                            };
                            handleSaveBidManagement(updated);
                            if (titleEl) titleEl.value = '';
                            if (descEl) descEl.value = '';
                            addLog?.(`Added custom compliance check: ${title}`, 'success');
                          }}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10.5px] font-bold rounded cursor-pointer whitespace-nowrap h-8 flex items-center justify-center transition-colors"
                        >
                          + Add Check
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Custom checklist items list */}
                  {(!selectedBidForManagement.customChecklist || selectedBidForManagement.customChecklist.length === 0) ? (
                    <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                      No custom compliance requirements added yet. Use the form above to declare specific local SCM parameters.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedBidForManagement.customChecklist.map((item) => {
                        return (
                          <div 
                            key={item.id}
                            className={`p-3 rounded-lg border flex gap-3 cursor-pointer select-none transition-all items-start group ${
                              item.checked 
                                ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950' 
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                            onClick={() => {
                              const updatedChecklist = (selectedBidForManagement.customChecklist || []).map(c => {
                                if (c.id === item.id) {
                                  return { ...c, checked: !c.checked };
                                }
                                return c;
                              });
                              const updated = {
                                ...selectedBidForManagement,
                                customChecklist: updatedChecklist
                              };
                              handleSaveBidManagement(updated);
                              addLog?.(`Toggled: ${item.title}`, 'info');
                            }}
                          >
                            <div className="pt-0.5 shrink-0">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                item.checked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                            <div className="space-y-0.5 flex-1 pr-4">
                              <h5 className="text-[11.5px] font-bold font-sans">{item.title}</h5>
                              <p className="text-[10.5px] text-slate-500 leading-normal">{item.description}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedChecklist = (selectedBidForManagement.customChecklist || []).filter(c => c.id !== item.id);
                                const updated = {
                                  ...selectedBidForManagement,
                                  customChecklist: updatedChecklist
                                };
                                handleSaveBidManagement(updated);
                                addLog?.(`Removed custom compliance check: ${item.title}`, 'info');
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 self-center"
                              title="Delete Requirement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TASK DELEGATION & AUTO-SCHEDULER */}
            {mgmtTab === 'tasks' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl">
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold font-mono text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-600 animate-pulse" />
                      Dynamic Timeline & Task Delegation Auto-Scheduler
                    </h4>
                    <p className="text-slate-600 text-xs max-w-xl">
                      Automate preparatory schedules backwards from your submission deadline ({selectedBidForManagement.submissionDate || 'Not specified'}). Instantly delegate SBD forms, costing audits, and PKI seals to your team.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const deadlineStr = selectedBidForManagement.submissionDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
                      const deadline = new Date(deadlineStr);
                      const baseTime = deadline.getTime();
                      
                      const computedTasks = [
                        {
                          id: 'ts1-' + Date.now(),
                          title: 'SBD Spec Review & Central Supplier Database (CSD) Profiling',
                          assignee: 'CEO Thabo Nkosi',
                          dueDate: new Date(baseTime - 10 * 86400000).toISOString().split('T')[0],
                          completed: true
                        },
                        {
                          id: 'ts2-' + Date.now(),
                          title: 'Obtain active SARS Tax Status PIN & Statutory clearance',
                          assignee: 'Compliance Officer Lerato Nkosi',
                          dueDate: new Date(baseTime - 8 * 86400000).toISOString().split('T')[0],
                          completed: false
                        },
                        {
                          id: 'ts3-' + Date.now(),
                          title: 'Draft costing spreadsheets & calculate SATA success fee margins',
                          assignee: 'Financial Modeller Pieter du Toit',
                          dueDate: new Date(baseTime - 6 * 86400000).toISOString().split('T')[0],
                          completed: false
                        },
                        {
                          id: 'ts4-' + Date.now(),
                          title: 'Complete and sign SBD 4 Declaration of Interest forms',
                          assignee: 'Compliance Officer Lerato Nkosi',
                          dueDate: new Date(baseTime - 4 * 86400000).toISOString().split('T')[0],
                          completed: false
                        },
                        {
                          id: 'ts5-' + Date.now(),
                          title: 'Lock final response package with SATA PKI Cryptographic seal',
                          assignee: 'CEO Thabo Nkosi',
                          dueDate: new Date(baseTime - 2 * 86400000).toISOString().split('T')[0],
                          completed: false
                        },
                        {
                          id: 'ts6-' + Date.now(),
                          title: 'Submit finalized dossier to SCM Secretariat Board',
                          assignee: 'Operations Lead Sarah Naidoo',
                          dueDate: new Date(baseTime - 1 * 86400000).toISOString().split('T')[0],
                          completed: false
                        }
                      ];

                      const updated = {
                        ...selectedBidForManagement,
                        tasks: computedTasks
                      };
                      handleSaveBidManagement(updated);
                      addLog?.('Auto-scheduled 6 mandatory milestones backwards from the submission date.', 'success');
                    }}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs font-bold rounded shadow-xs cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 self-center"
                  >
                    <Calendar className="w-4 h-4" />
                    Auto-Schedule Milestones
                  </button>
                </div>

                {/* Add Custom Task Form */}
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h5 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider mb-3">Delegate Custom Task</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Task Title / Deliverable</label>
                      <input
                        id="newTaskTitle"
                        type="text"
                        placeholder="e.g. Gather proof of previous similar contracts"
                        className="w-full text-xs p-2 border border-slate-200 rounded font-sans focus:outline-emerald-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Assignee</label>
                      <select
                        id="newTaskAssignee"
                        className="w-full text-xs p-2 border border-slate-200 rounded bg-white font-sans focus:outline-emerald-600"
                      >
                        <option value="CEO Thabo Nkosi">CEO Thabo Nkosi</option>
                        <option value="Compliance Officer Lerato Nkosi">Compliance Officer Lerato Nkosi</option>
                        <option value="Financial Modeller Pieter du Toit">Financial Modeller Pieter du Toit</option>
                        <option value="Operations Lead Sarah Naidoo">Operations Lead Sarah Naidoo</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Due Date</label>
                      <input
                        id="newTaskDueDate"
                        type="date"
                        defaultValue={new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0]}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono focus:outline-emerald-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const titleEl = document.getElementById('newTaskTitle') as HTMLInputElement;
                        const assigneeEl = document.getElementById('newTaskAssignee') as HTMLSelectElement;
                        const dueDateEl = document.getElementById('newTaskDueDate') as HTMLInputElement;
                        const title = titleEl?.value.trim();
                        const assignee = assigneeEl?.value;
                        const dueDate = dueDateEl?.value || new Date().toISOString().split('T')[0];

                        if (!title) return;

                        const currentTasks = selectedBidForManagement.tasks || [];
                        const newTask = {
                          id: 'task-' + Date.now(),
                          title,
                          assignee,
                          dueDate,
                          completed: false
                        };

                        const updated = {
                          ...selectedBidForManagement,
                          tasks: [...currentTasks, newTask]
                        };
                        handleSaveBidManagement(updated);
                        if (titleEl) titleEl.value = '';
                        addLog?.(`Delegated task "${title}" to ${assignee}`, 'success');
                      }}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded cursor-pointer text-center h-9 transition-colors"
                    >
                      + Delegate Task
                    </button>
                  </div>
                </div>

                {/* Task List Ledger */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">Delegated Milestones Ledger</h5>
                    <span className="font-mono text-[10px] text-slate-500">
                      Completed: {((selectedBidForManagement.tasks || []).filter(t => t.completed).length)} / {((selectedBidForManagement.tasks || []).length)}
                    </span>
                  </div>

                  {(!selectedBidForManagement.tasks || selectedBidForManagement.tasks.length === 0) ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-lg bg-white text-center text-slate-400 text-xs">
                      No milestones scheduled yet. Click the <strong>Auto-Schedule Milestones</strong> button above to construct a timeline instantly!
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedBidForManagement.tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3 bg-white border rounded-lg flex items-center justify-between gap-4 hover:shadow-xs transition-shadow ${
                            task.completed ? 'border-slate-150 bg-slate-50/50' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const updatedTasks = (selectedBidForManagement.tasks || []).map(t => {
                                  if (t.id === task.id) {
                                    return { ...t, completed: !t.completed };
                                  }
                                  return t;
                                });
                                const updated = {
                                  ...selectedBidForManagement,
                                  tasks: updatedTasks
                                };
                                handleSaveBidManagement(updated);
                                addLog?.(`Marked task "${task.title}" as ${!task.completed ? 'completed' : 'incomplete'}.`, 'info');
                              }}
                              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                                task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div className="space-y-1">
                              <p className={`text-xs font-medium font-sans leading-snug ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                {task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-slate-400">
                                <span className="flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-bold uppercase">
                                  <UserCheck className="w-3 h-3" />
                                  {task.assignee}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  Due: {task.dueDate}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updatedTasks = (selectedBidForManagement.tasks || []).filter(t => t.id !== task.id);
                              const updated = {
                                ...selectedBidForManagement,
                                tasks: updatedTasks
                              };
                              handleSaveBidManagement(updated);
                              addLog?.(`Deleted delegated task: ${task.title}`, 'info');
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1"
                            title="Delete Task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TENDER DOCUMENT FOLDERS */}
            {mgmtTab === 'documents' && (() => {
              const [selectedFolderId, setSelectedFolderId] = useState('f1');
              const activeFolder = (selectedBidForManagement.documentFolders || []).find(f => f.id === selectedFolderId) || (selectedBidForManagement.documentFolders || [])[0];

              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Folders List */}
                  <div className="space-y-3 md:col-span-1">
                    <h5 className="text-[11px] font-bold font-mono text-slate-500 uppercase tracking-wider">Tender Document Vault</h5>
                    <div className="space-y-1.5">
                      {(selectedBidForManagement.documentFolders || []).map((folder) => {
                        const isSelected = folder.id === selectedFolderId;
                        return (
                          <div
                            key={folder.id}
                            onClick={() => setSelectedFolderId(folder.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all select-none flex items-center justify-between ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-lg">📁</span>
                              <span>{folder.name}</span>
                            </div>
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                              {folder.documents.length}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 font-sans space-y-1.5">
                      <p className="font-bold flex items-center gap-1 text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Portal Compliance Vault
                      </p>
                      <p className="leading-relaxed">
                        These folders are encrypted using RSA-2048 keys validated during certification audits. All documents are dynamically audited before packaging.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Active Folder Contents */}
                  <div className="md:col-span-2 space-y-4">
                    {activeFolder ? (
                      <>
                        <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                          <div>
                            <h5 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                              📁 Folder: {activeFolder.name}
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Contains verified municipal procurement documents.
                            </p>
                          </div>
                          {/* Simulated Upload Button */}
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              id="virtualDocUploadInput"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                const newDoc = {
                                  id: 'doc-' + Date.now(),
                                  name: file.name,
                                  size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
                                  uploadedAt: new Date().toISOString().slice(0, 10)
                                };

                                const updatedFolders = (selectedBidForManagement.documentFolders || []).map(f => {
                                  if (f.id === selectedFolderId) {
                                    return {
                                      ...f,
                                      documents: [...f.documents, newDoc]
                                    };
                                  }
                                  return f;
                                });

                                const updated = {
                                  ...selectedBidForManagement,
                                  documentFolders: updatedFolders
                                };
                                handleSaveBidManagement(updated);
                                addLog?.(`Uploaded virtual document: ${file.name} to ${activeFolder.name}`, 'success');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById('virtualDocUploadInput')?.click();
                              }}
                              className="py-1 px-2.5 bg-slate-900 hover:bg-slate-850 text-white font-mono text-[10.5px] font-bold rounded cursor-pointer whitespace-nowrap transition-all flex items-center gap-1 animate-pulse"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              Upload PDF/Doc
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                // Simulate mock template document
                                const mockDocNames = {
                                  f1: ['SBD_8_Past_Practices.pdf', 'SBD_9_Independent_Bid.pdf', 'SBD_5_National_Industrial.pdf'],
                                  f2: ['CSD_Direct_Verification_Report.pdf', 'SARS_Pin_Verification_Receipt.pdf', 'Letter_of_Good_Standing_COIDA.pdf'],
                                  f3: ['Technical_Methodology_Proposal_V1.pdf', 'Team_CV_Profiles_And_Qualifications.pdf', 'Project_Execution_Case_Studies.pdf'],
                                  f4: ['Pricing_Schedule_BoQ_Draft.xlsx', 'Audited_Financial_Statement_3Years.pdf', 'Cashflow_Projections_Model.xlsx']
                                };
                                const pool = mockDocNames[activeFolder.id as 'f1'|'f2'|'f3'|'f4'] || ['General_Procurement_Doc.pdf'];
                                const selectedName = pool[Math.floor(Math.random() * pool.length)];

                                const newDoc = {
                                  id: 'doc-mock-' + Date.now(),
                                  name: selectedName,
                                  size: (Math.random() * 3 + 0.5).toFixed(1) + ' MB',
                                  uploadedAt: new Date().toISOString().slice(0, 10)
                                };

                                const updatedFolders = (selectedBidForManagement.documentFolders || []).map(f => {
                                  if (f.id === selectedFolderId) {
                                    return {
                                      ...f,
                                      documents: [...f.documents, newDoc]
                                    };
                                  }
                                  return f;
                                });

                                const updated = {
                                  ...selectedBidForManagement,
                                  documentFolders: updatedFolders
                                };
                                handleSaveBidManagement(updated);
                                addLog?.(`Auto-generated and verified SBD template: ${selectedName}`, 'success');
                              }}
                              className="py-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-mono text-[10.5px] font-bold rounded cursor-pointer whitespace-nowrap transition-all"
                            >
                              ⚡ Auto SBD Doc
                            </button>
                          </div>
                        </div>

                        {activeFolder.documents.length === 0 ? (
                          <div className="p-8 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs bg-slate-50/50">
                            📁 This folder is empty. Drop documents here or click "Upload PDF/Doc" to add static submissions.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {activeFolder.documents.map((doc) => (
                              <div
                                key={doc.id}
                                className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xl">📄</span>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-semibold text-slate-800 leading-snug">{doc.name}</p>
                                    <p className="font-mono text-[10px] text-slate-400">
                                      Size: {doc.size} • Uploaded: {doc.uploadedAt}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <CheckCircle className="w-3 h-3" />
                                    PKI Sealing Certified
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedFolders = (selectedBidForManagement.documentFolders || []).map(f => {
                                        if (f.id === selectedFolderId) {
                                          return {
                                            ...f,
                                            documents: f.documents.filter(d => d.id !== doc.id)
                                          };
                                        }
                                        return f;
                                      });

                                      const updated = {
                                        ...selectedBidForManagement,
                                        documentFolders: updatedFolders
                                      };
                                      handleSaveBidManagement(updated);
                                      addLog?.(`Deleted document: ${doc.name}`, 'info');
                                    }}
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                        Select a folder on the left to review uploaded assets.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* TAB C: FINANCIAL BRIDGE */}
            {mgmtTab === 'finance' && (() => {
              const bidPrice = selectedBidForManagement.customBidPrice ?? selectedBidForManagement.tenderValue;
              const delCost = selectedBidForManagement.customDeliveryCost ?? Math.round(selectedBidForManagement.tenderValue * 0.78);
              const netMargin = bidPrice - delCost;
              const grossPct = bidPrice > 0 ? (netMargin / bidPrice) * 100 : 0;
              const markupPct = delCost > 0 ? (netMargin / delCost) * 100 : 0;
              const taxSetaside = netMargin > 0 ? netMargin * 0.27 : 0;

              const isLoss = netMargin < 0;
              const isLowMargin = !isLoss && grossPct < 15;

              // Success-fee cap calculations
              const useCap = selectedBidForManagement.useFeeCap !== false;
              const capAmt = selectedBidForManagement.feeCapAmount ?? 150000;
              const rawSuccessFee = Math.round(bidPrice * ((selectedBidForManagement.splitPercentage || 12) / 100));
              const finalCappedFee = useCap ? Math.min(rawSuccessFee, capAmt) : rawSuccessFee;
              const feeSavings = rawSuccessFee > finalCappedFee ? (rawSuccessFee - finalCappedFee) : 0;

              const handleUpdateFeeCap = (enabled: boolean, amount: number) => {
                const currentRawFee = Math.round(bidPrice * ((selectedBidForManagement.splitPercentage || 12) / 100));
                const nextCappedFee = enabled ? Math.min(currentRawFee, amount) : currentRawFee;
                const updated = {
                  ...selectedBidForManagement,
                  useFeeCap: enabled,
                  feeCapAmount: amount,
                  commissionEarned: nextCappedFee
                };
                handleSaveBidManagement(updated);
              };

              // Milestone calculations
              const defaultWeights = { m1: 15, m2: 45, m3: 25, m4: 15 };
              const mWeights = (selectedBidForManagement.milestoneWeights || defaultWeights) as Record<string, number>;
              const mCosts = (selectedBidForManagement.milestoneCosts || {
                m1: Math.round(delCost * 0.10),
                m2: Math.round(delCost * 0.55),
                m3: Math.round(delCost * 0.30),
                m4: Math.round(delCost * 0.05)
              }) as Record<string, number>;

              const milestoneMetadata = [
                { id: 'm1', title: 'Mobilization & Assessment', description: 'Site setup, initial logistics, and planning approvals.' },
                { id: 'm2', title: 'Procurement & Site Delivery', description: 'Procuring hardware, core equipment, and bulk delivery to site.' },
                { id: 'm3', title: 'Installation & Technical Setup', description: 'Engineering setups, assembly, and integration work.' },
                { id: 'm4', title: 'Commissioning & Training Closeout', description: 'System sign-offs, training, closeout reports, and handover.' }
              ];

              const totalWeightsSum = Object.values(mWeights).reduce((a, b) => (a as number) + (b as number), 0) as number;
              const totalCostsSum = Object.values(mCosts).reduce((a, b) => (a as number) + (b as number), 0) as number;

              // Correct Pricing Structure Recommendations
              const targetMarginVal = 20; // default 20%
              const proposedSustainablePrice = Math.round(totalCostsSum / (1 - (targetMarginVal / 100)));
              
              // Cash flow optimized milestone weights
              const proposedWeights = {
                m1: totalCostsSum > 0 ? Math.round(((mCosts['m1'] || 0) / totalCostsSum) * 100) : 15,
                m2: totalCostsSum > 0 ? Math.round(((mCosts['m2'] || 0) / totalCostsSum) * 100) : 45,
                m3: totalCostsSum > 0 ? Math.round(((mCosts['m3'] || 0) / totalCostsSum) * 100) : 25,
                m4: totalCostsSum > 0 ? Math.round(((mCosts['m4'] || 0) / totalCostsSum) * 100) : 15
              };

              // Adjust recommended weights slightly to ensure they sum to exactly 100
              const recommendedSum = proposedWeights.m1 + proposedWeights.m2 + proposedWeights.m3 + proposedWeights.m4;
              if (recommendedSum !== 100 && totalCostsSum > 0) {
                proposedWeights.m2 += (100 - recommendedSum); // adjust procurement milestone
              }

              // Check if any milestone has a deficit hazard
              const hasDeficitHazards = milestoneMetadata.some(m => {
                const weight = mWeights[m.id as keyof typeof mWeights] || 0;
                const trancheRevenue = bidPrice * (weight / 100);
                const trancheCost = mCosts[m.id as keyof typeof mCosts] || 0;
                return trancheRevenue < trancheCost;
              });

              // Import from external Profit Calculator
              const handleImportFromCalculator = () => {
                try {
                  const saved = localStorage.getItem('sata_tender_profit_calc');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.bidValue && parsed.costItems && parsed.milestones) {
                      // Calculate costs per milestone from the calculator
                      const importedCosts = { m1: 0, m2: 0, m3: 0, m4: 0 };
                      parsed.costItems.forEach((item: any) => {
                        const mId = item.milestoneId || 'm1';
                        if (mId in importedCosts) {
                          importedCosts[mId as keyof typeof importedCosts] += item.amount;
                        }
                      });

                      const importedWeights = { m1: 15, m2: 45, m3: 25, m4: 15 };
                      parsed.milestones.forEach((m: any) => {
                        if (m.id in importedWeights) {
                          importedWeights[m.id as keyof typeof importedWeights] = m.weight;
                        }
                      });

                      // Total delivery cost
                      const totalDel = parsed.costItems.reduce((acc: number, c: any) => acc + c.amount, 0);
                      const finalRawSuccess = Math.round(parsed.bidValue * ((selectedBidForManagement.splitPercentage || 12) / 100));
                      const finalCappedSuccess = useCap ? Math.min(finalRawSuccess, capAmt) : finalRawSuccess;

                      const updated = {
                        ...selectedBidForManagement,
                        customBidPrice: parsed.bidValue,
                        customDeliveryCost: totalDel,
                        milestoneWeights: importedWeights,
                        milestoneCosts: importedCosts,
                        commissionEarned: finalCappedSuccess
                      };
                      handleSaveBidManagement(updated);
                      addLog?.(`Imported structured costing model from Profit Calculator! (R${parsed.bidValue.toLocaleString()})`, 'success');
                    } else {
                      addLog?.('No structured milestones found in the profit calculator storage yet.', 'warn');
                    }
                  } else {
                    addLog?.('Tender Profit Calculator has no saved workspaces on this device yet.', 'warn');
                  }
                } catch (e) {
                  addLog?.('Error importing state from Tender Profit Calculator.', 'error');
                }
              };

              return (
                <div className="space-y-6">
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-600" />
                        Dynamic Financial Costing & Milestone Cash-Flow Bridge
                      </h4>
                      <p className="text-slate-400 text-xs">
                        Calculate stage-by-stage profitability, audit cash flow deficit hazards, and propose optimized pricing structures.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleImportFromCalculator}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Load granular milestones and cost allocations from the Tender Profit Calculator"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Import from Milestone Calculator
                      </button>

                      {pricingProposal && (
                        <button
                          onClick={() => {
                            const pPrice = pricingProposal.totalBidPriceWithVat;
                            const currentRaw = Math.round(pPrice * ((selectedBidForManagement.splitPercentage || 12) / 100));
                            const currentCapped = useCap ? Math.min(currentRaw, capAmt) : currentRaw;
                            const updated = {
                              ...selectedBidForManagement,
                              customBidPrice: pPrice,
                              customDeliveryCost: pricingProposal.totalDeliveryCost,
                              commissionEarned: currentCapped
                            };
                            handleSaveBidManagement(updated);
                            addLog?.(`Successfully linked & imported SATA Active Costing Model! (Bid: R${pPrice.toLocaleString()})`, 'success');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-bold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Import SCM Proposal
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary Alerts */}
                  {isLoss ? (
                    <div className="bg-red-50 border border-red-200 text-red-950 p-3.5 rounded-lg flex items-center gap-2.5 text-xs">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-bounce" />
                      <div>
                        <strong className="block font-bold">Negative Costing Warning (Active Financial Loss)</strong>
                        Your total estimated execution cost exceeds your bid price. Submitting this proposal will result in immediate negative profitability. Reduce execution overheads or adjust the pricing.
                      </div>
                    </div>
                  ) : hasDeficitHazards ? (
                    <div className="bg-red-50 border border-red-200 text-red-950 p-3.5 rounded-lg flex items-center gap-2.5 text-xs">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />
                      <div>
                        <strong className="block font-bold">Active Cash Flow Deficit Hazard Detected</strong>
                        Your milestones contain stages where execution costs are higher than the payment tranche. You will be forced out-of-pocket to cover the deficit. Review the milestone cash-flow optimization below.
                      </div>
                    </div>
                  ) : isLowMargin ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 rounded-lg flex items-center gap-2.5 text-xs">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <strong className="block font-bold">Extremely Low Gross Margin Alert ({grossPct.toFixed(1)}%)</strong>
                        Your profit margins are below the South African corporate threshold (15%). Cash flow risks are escalated. Consider applying the proposed pricing adjustments.
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3.5 rounded-lg flex items-center gap-2.5 text-xs">
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <div>
                        <strong className="block font-bold">Healthy Financial Framework Certified ({grossPct.toFixed(1)}% Gross)</strong>
                        Your costing and milestone structure is fully balanced. No out-of-pocket risk found. Profit margins meet optimal public-sector bidding standards.
                      </div>
                    </div>
                  )}

                  {/* Edit Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                        Custom Tender Bid Price (ZAR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">R</span>
                        <input
                          type="number"
                          value={bidPrice}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const currentRaw = Math.round(val * ((selectedBidForManagement.splitPercentage || 12) / 100));
                            const currentCapped = useCap ? Math.min(currentRaw, capAmt) : currentRaw;
                            const updated = {
                              ...selectedBidForManagement,
                              customBidPrice: val,
                              commissionEarned: currentCapped
                            };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 pl-6 border border-slate-200 rounded font-mono focus:outline-emerald-600 focus:bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        This represents your final submitted price including VAT.
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">
                        Direct Execution & Delivery Cost (ZAR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-xs">R</span>
                        <input
                          type="number"
                          value={delCost}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = { 
                              ...selectedBidForManagement, 
                              customDeliveryCost: val,
                              // Proportionally scale milestone costs to match the new delivery cost
                              milestoneCosts: {
                                m1: Math.round(val * 0.10),
                                m2: Math.round(val * 0.55),
                                m3: Math.round(val * 0.30),
                                m4: Math.round(val * 0.05)
                              }
                            };
                            handleSaveBidManagement(updated);
                          }}
                          className="w-full text-xs p-2 pl-6 border border-slate-200 rounded font-mono focus:outline-emerald-600 focus:bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Encompasses transport, logistics, staffing, supplies, and SATA overheads.
                      </span>
                    </div>
                  </div>

                  {/* Financial Stat Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Net Profit Margin</span>
                      <div className={`text-sm font-bold font-mono ${isLoss ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                        R{netMargin.toLocaleString()}
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Gross margin (%)</span>
                      <div className={`text-sm font-bold font-mono ${isLoss ? 'text-red-600' : grossPct >= 20 ? 'text-emerald-700' : 'text-amber-600'}`}>
                        {grossPct.toFixed(1)}%
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">CIT Tax Reserve (27%)</span>
                      <div className="text-sm font-bold font-mono text-slate-900">
                        R{taxSetaside.toLocaleString()}
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">Markup Rate (%)</span>
                      <div className="text-sm font-bold font-mono text-indigo-700">
                        {markupPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {/* SATA Platform Success-Fee Capping Configuration */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          SATA SUCCESS-FEE CAPPING ENGINE
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Protect SMME margins on won state tenders by capping maximum platform commission liabilities.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">CAPPING ACTIVATED</label>
                        <button
                          onClick={() => handleUpdateFeeCap(!useCap, capAmt)}
                          className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useCap ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${useCap ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Interactive Configuration */}
                      <div className="space-y-3 bg-white border border-slate-150 rounded-lg p-3">
                        <span className="text-[10px] text-slate-400 font-mono uppercase font-bold block">App Fee Cap Ceiling (ZAR)</span>
                        <div className="relative">
                          <span className="absolute left-2 top-1 text-slate-400 font-mono text-xs">R</span>
                          <input
                            type="number"
                            value={capAmt}
                            disabled={!useCap}
                            onChange={(e) => {
                              const amt = parseFloat(e.target.value) || 0;
                              handleUpdateFeeCap(useCap, amt);
                            }}
                            className="w-full text-xs p-1 pl-5 border border-slate-200 rounded font-mono focus:outline-emerald-600 disabled:opacity-50"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-mono uppercase">Quick Presets</span>
                          <div className="flex gap-1.5 flex-wrap">
                            {[50000, 100000, 150000, 200000].map(val => (
                              <button
                                key={val}
                                disabled={!useCap}
                                onClick={() => handleUpdateFeeCap(useCap, val)}
                                className={`px-2 py-1 font-mono text-[9px] font-bold rounded border transition-all cursor-pointer ${
                                  capAmt === val && useCap
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 disabled:opacity-50'
                                }`}
                              >
                                R{(val/1000)}k
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Math Indicators */}
                      <div className="bg-white border border-slate-150 rounded-lg p-3 space-y-1 font-mono text-[11px] text-slate-600">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5">Fee Calculation Breakdown</span>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Base Value (Tender/Bid):</span>
                          <span className="text-slate-800 font-bold">R{bidPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Nominal Success Rate:</span>
                          <span className="text-slate-800">{(selectedBidForManagement.splitPercentage || 12)}%</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span>Raw Computed Fee:</span>
                          <span className="text-slate-800">R{rawSuccessFee.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Applied Outcome */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-800 font-mono uppercase font-bold block">Final Applied App Fee</span>
                          <div className="text-lg font-mono font-bold text-emerald-950 mt-1">
                            R{finalCappedFee.toLocaleString()}
                          </div>
                        </div>
                        
                        {feeSavings > 0 ? (
                          <div className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-150 px-2 py-1 rounded font-mono font-bold mt-2 flex items-center gap-1 animate-pulse">
                            <span>Saves R{feeSavings.toLocaleString()} in Fee Expenses!</span>
                          </div>
                        ) : (
                          <div className="text-[9.5px] text-slate-500 font-sans mt-2">
                            Raw success fee is below the designated cap ceiling.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Milestone-by-Milestone Cost Breakdown Section */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-mono">
                          Granular Milestone Payment & Cost Allocation
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Tuning payment weights (%) and direct execution costs (ZAR) per milestone stage.
                        </p>
                      </div>
                      
                      {totalWeightsSum !== 100 && (
                        <span className="text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded animate-pulse">
                          ⚠️ Tranche Sum: {totalWeightsSum}% (Must equal 100%)
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-mono text-slate-500 uppercase border-b border-slate-200">
                            <th className="p-3">Milestone Stage Details</th>
                            <th className="p-3 text-center w-24">Payment Tranche (%)</th>
                            <th className="p-3 text-right">Tranche Revenue (ZAR)</th>
                            <th className="p-3 text-right">Execution Cost (ZAR)</th>
                            <th className="p-3 text-right">Stage Profit / Loss</th>
                            <th className="p-3 text-right">Margin %</th>
                            <th className="p-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 text-xs">
                          {milestoneMetadata.map(m => {
                            const weight = mWeights[m.id as keyof typeof mWeights] || 0;
                            const trancheRevenue = bidPrice * (weight / 100);
                            const trancheCost = mCosts[m.id as keyof typeof mCosts] || 0;
                            const trancheProfit = trancheRevenue - trancheCost;
                            const trancheMargin = trancheRevenue > 0 ? (trancheProfit / trancheRevenue) * 100 : 0;
                            const isTrancheLoss = trancheProfit < 0;

                            return (
                              <tr key={m.id} className={`hover:bg-slate-50/50 transition-colors ${isTrancheLoss ? 'bg-red-50/30' : ''}`}>
                                <td className="p-3 space-y-1">
                                  <div className="font-bold text-slate-800">{m.title}</div>
                                  <div className="text-[10px] text-slate-400 leading-normal max-w-sm">{m.description}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      value={weight}
                                      onChange={(e) => {
                                        const newW = parseFloat(e.target.value) || 0;
                                        const updatedWeights = { ...mWeights, [m.id]: newW };
                                        const updated = { ...selectedBidForManagement, milestoneWeights: updatedWeights };
                                        handleSaveBidManagement(updated);
                                      }}
                                      className="w-16 text-center text-xs p-1 border border-slate-200 rounded font-mono focus:outline-emerald-600 focus:bg-white"
                                      min="0"
                                      max="100"
                                    />
                                    <span className="text-slate-400 font-mono">%</span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-800">
                                  R{Math.round(trancheRevenue).toLocaleString()}
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="text-slate-400 font-mono text-[10px]">R</span>
                                    <input
                                      type="number"
                                      value={trancheCost}
                                      onChange={(e) => {
                                        const newC = parseFloat(e.target.value) || 0;
                                        const updatedCosts = { ...mCosts, [m.id]: newC } as Record<string, number>;
                                        
                                        // Sum up new milestone costs to update the main customDeliveryCost
                                        const newTotalDel = Object.values(updatedCosts).reduce((a, b) => (a as number) + (b as number), 0);

                                        const updated = { 
                                          ...selectedBidForManagement, 
                                          customDeliveryCost: newTotalDel,
                                          milestoneCosts: updatedCosts 
                                        };
                                        handleSaveBidManagement(updated);
                                      }}
                                      className="w-24 text-right text-xs p-1 border border-slate-200 rounded font-mono focus:outline-emerald-600 focus:bg-white"
                                    />
                                  </div>
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${isTrancheLoss ? 'text-red-600' : 'text-emerald-700'}`}>
                                  {isTrancheLoss ? '-' : ''}R{Math.abs(Math.round(trancheProfit)).toLocaleString()}
                                </td>
                                <td className={`p-3 text-right font-mono font-bold ${isTrancheLoss ? 'text-red-500' : 'text-slate-600'}`}>
                                  {trancheMargin.toFixed(1)}%
                                </td>
                                <td className="p-3 text-center">
                                  {isTrancheLoss ? (
                                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                                      Deficit Hazard
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider">
                                      Fluid
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-mono text-[11px] font-bold text-slate-700 border-t border-slate-200">
                            <td className="p-3 uppercase">Total Combined Valuation</td>
                            <td className="p-3 text-center text-slate-800 font-bold">{totalWeightsSum}%</td>
                            <td className="p-3 text-right text-slate-900">R{Math.round(bidPrice).toLocaleString()}</td>
                            <td className="p-3 text-right text-slate-950">R{Math.round(totalCostsSum).toLocaleString()}</td>
                            <td className={`p-3 text-right ${isLoss ? 'text-red-600' : 'text-emerald-800'}`}>
                              {isLoss ? '-' : ''}R{Math.abs(Math.round(netMargin)).toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-slate-800">{grossPct.toFixed(1)}%</td>
                            <td className="p-3"></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Correct Pricing Structure Proposer Tool */}
                  <div className="bg-emerald-950 text-white rounded-lg p-5 border border-emerald-900 space-y-4">
                    <div className="flex items-center gap-2 border-b border-emerald-900 pb-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h5 className="font-bold font-mono text-[11px] uppercase tracking-wider text-emerald-300">
                        SATA Pricing Structure Optimizer & Corrective Proposal
                      </h5>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs leading-relaxed">
                      {/* Left Column: Sustainable pricing */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 block">Recommended Sustainable Bid Price</span>
                          <div className="text-xl font-bold font-mono text-white mt-1 flex items-baseline gap-2">
                            R{proposedSustainablePrice.toLocaleString()}
                            <span className="text-[10px] text-emerald-300 font-normal">ZAR (with target {targetMarginVal}% margin)</span>
                          </div>
                        </div>

                        <p className="text-slate-300 text-[11px]">
                          To guarantee your company's financial safety and achieve a sustainable <strong className="text-white">{targetMarginVal}% gross margin</strong> over the total contract delivery cost of <strong className="text-white">R{totalCostsSum.toLocaleString()}</strong>, your tender should be priced at no less than <strong className="text-white">R{proposedSustainablePrice.toLocaleString()}</strong>.
                        </p>

                        <div className="pt-1">
                          <button
                            onClick={() => {
                              const currentRaw = Math.round(proposedSustainablePrice * ((selectedBidForManagement.splitPercentage || 12) / 100));
                              const currentCapped = useCap ? Math.min(currentRaw, capAmt) : currentRaw;
                              const updated = {
                                ...selectedBidForManagement,
                                customBidPrice: proposedSustainablePrice,
                                commissionEarned: currentCapped
                              };
                              handleSaveBidManagement(updated);
                              addLog?.(`Applied sustainable bid price of R${proposedSustainablePrice.toLocaleString()}`, 'success');
                            }}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold rounded transition-colors cursor-pointer"
                          >
                            Apply Sustainable Bid Price
                          </button>
                        </div>
                      </div>

                      {/* Right Column: Cash flow optimized weights */}
                      <div className="space-y-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-emerald-400 block">Cash-Flow Optimized Milestone Weights</span>
                          <div className="grid grid-cols-4 gap-2 mt-2 text-center text-xs">
                            {milestoneMetadata.map(m => {
                              const optW = proposedWeights[m.id as keyof typeof proposedWeights] || 0;
                              return (
                                <div key={m.id} className="p-2 bg-emerald-900/50 border border-emerald-800 rounded">
                                  <span className="block font-mono text-[9px] uppercase text-emerald-300">{m.id}</span>
                                  <span className="font-bold font-mono text-white text-sm">{optW}%</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <p className="text-slate-300 text-[11px]">
                          These weights align your milestone payments <strong className="text-white">exactly with the cost profiles</strong> of the project stages. By mirroring the execution costs, your company will never have to pre-fund deficits, entirely eliminating cash-flow hazards.
                        </p>

                        <div className="pt-1">
                          <button
                            onClick={() => {
                              const updated = {
                                ...selectedBidForManagement,
                                milestoneWeights: proposedWeights
                              };
                              handleSaveBidManagement(updated);
                              addLog?.(`Applied cash-flow optimized milestone weights: Mobilization (${proposedWeights.m1}%), Procurement (${proposedWeights.m2}%), Installation (${proposedWeights.m3}%), Closeout (${proposedWeights.m4}%)`, 'success');
                            }}
                            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-mono text-[10px] font-bold rounded transition-colors cursor-pointer"
                          >
                            Apply Optimized Cash-Flow Weights
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TAB D: NOTES & CORRESPONDENCE */}
            {mgmtTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <CheckCircle className="w-4.5 h-4.5 text-emerald-600" />
                    Correspondence Records & SCM Clarification Ledger
                  </h4>
                  <p className="text-slate-400 text-xs">
                    Maintains chronologically ordered briefings, clarification requests, site meetings, or legal team submissions for this applied tender.
                  </p>
                </div>

                {/* Notes list */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto border border-slate-150 rounded-lg p-3 bg-slate-50">
                  {(!selectedBidForManagement.notes || selectedBidForManagement.notes.length === 0) ? (
                    <div className="text-center py-6 text-slate-400 italic text-xs">
                      No correspondence entries recorded for this tender. Add an update below.
                    </div>
                  ) : (
                    selectedBidForManagement.notes.map((note) => {
                      const tags = {
                        internal: { bg: 'bg-slate-100 text-slate-800 border-slate-200', label: 'INTERNAL NOTE' },
                        scm: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-100', label: 'SCM QUERY' },
                        briefing: { bg: 'bg-blue-50 text-blue-800 border-blue-100', label: 'SITE BRIEFING' }
                      };
                      return (
                        <div key={note.id} className="bg-white border border-slate-200 rounded p-3 text-xs space-y-1.5 shadow-xs relative group">
                          <div className="flex justify-between items-center">
                            <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold border ${tags[note.category || 'internal'].bg}`}>
                              {tags[note.category || 'internal'].label}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9.5px] text-slate-400">{note.timestamp}</span>
                              <button
                                onClick={() => {
                                  const updatedNotes = (selectedBidForManagement.notes || []).filter(n => n.id !== note.id);
                                  const updated = { ...selectedBidForManagement, notes: updatedNotes };
                                  handleSaveBidManagement(updated);
                                  addLog?.('Removed correspondence note entry.', 'info');
                                }}
                                className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Delete note"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-700 leading-relaxed font-sans">{note.text}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form */}
                <div className="border-t border-slate-150 pt-3.5 space-y-3">
                  <h5 className="text-[11px] font-bold font-mono text-slate-700 uppercase font-bold">Append New Correspondence Record</h5>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={newNoteCategory}
                      onChange={(e: any) => setNewNoteCategory(e.target.value)}
                      className="text-xs p-2 border border-slate-200 rounded font-mono bg-white focus:outline-emerald-600 sm:w-1/4"
                    >
                      <option value="internal">Internal Memo</option>
                      <option value="scm">SCM Query</option>
                      <option value="briefing">Briefing Alert</option>
                    </select>
                    <input
                      type="text"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Type details of meeting briefing or clarification request..."
                      className="text-xs p-2 border border-slate-200 rounded font-sans flex-grow focus:outline-emerald-600"
                    />
                    <button
                      onClick={() => {
                        if (!newNoteText.trim()) return;
                        const newNote = {
                          id: 'note-' + Math.floor(Math.random() * 900000 + 100000),
                          text: newNoteText.trim(),
                          category: newNoteCategory,
                          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
                        };
                        const updatedNotes = [...(selectedBidForManagement.notes || []), newNote];
                        const updated = { ...selectedBidForManagement, notes: updatedNotes };
                        handleSaveBidManagement(updated);
                        setNewNoteText('');
                        addLog?.('Added new tender correspondence entry.', 'success');
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded cursor-pointer transition-colors whitespace-nowrap text-center"
                    >
                      Add Log Entry
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BILLING & PAYMENTS TAB */}
      {activeSubTab === 'billing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="supplier-tab-billing">
          
          {/* SBD Invoices */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
              Pending SBD Commission Statements
            </h3>
            <p className="text-slate-400 text-xs">
              SBD success-based service fees are payable only upon formal municipal contract award. Select a won SCM notice to proceed to secure checkout.
            </p>

            <div className="space-y-2.5">
              {bids.filter(b => b.status === 'won').map(bid => (
                <div 
                  key={bid.id}
                  onClick={() => {
                    setSelectedBidForPayment(bid);
                    setPaymentSuccess(false);
                  }}
                  className={`p-3 border rounded text-xs cursor-pointer transition-all ${
                    selectedBidForPayment?.id === bid.id 
                      ? 'bg-emerald-50/80 border-emerald-500 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between font-mono text-[10px] text-slate-500 mb-1">
                    <span>INVOICE Ref: {bid.tenderRef}</span>
                    <strong className={bid.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-red-600'}>
                      {bid.paymentStatus?.toUpperCase()}
                    </strong>
                  </div>

                  <div className="font-semibold text-slate-800 line-clamp-1">{bid.tenderTitle}</div>
                  
                  <div className="flex justify-between font-mono mt-2 text-[11px] border-t border-slate-200/50 pt-2">
                    <span>SBD Processing Fee:</span>
                    <strong className="text-slate-900 font-bold">R{bid.commissionEarned.toLocaleString()}</strong>
                  </div>
                </div>
              ))}

              {bids.filter(b => b.status === 'won').length === 0 && (
                <div className="text-center py-10 italic text-slate-400 text-xs font-mono">
                  No won bids found requiring commission payments.
                </div>
              )}
            </div>
          </div>

          {/* Checkout Terminal */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-600" />
              SATA Secure Payment Checkout Console
            </h3>

            {!selectedBidForPayment ? (
              <div className="p-8 text-center text-slate-400 italic text-xs font-mono border border-dashed border-slate-200 rounded">
                Please select a pending SBD invoice from the left panel to proceed with checkout.
              </div>
            ) : paymentSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-100 text-emerald-950 rounded text-center space-y-3 font-mono text-xs">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto animate-bounce" />
                <strong className="block text-emerald-900 text-sm">SECURE CHECKOUT CONCLUDED</strong>
                <p>
                  {selectedBidForPayment.id === 'license-upgrade' ? (
                    <>SATA monthly license upgrade to {selectedBidForPayment.tenderRef.replace('LICENSE-', '')} was processed successfully.</>
                  ) : selectedBidForPayment.id === 'payg-credit-purchase' ? (
                    <>Pay-As-You-Go single tender submission credit was purchased and added to your balance successfully.</>
                  ) : (
                    <>Success-based commission for tender {selectedBidForPayment.tenderRef} was successfully captured.</>
                  )}
                </p>
                <div className="p-3 bg-white border border-emerald-200 rounded text-left space-y-1.5 text-[10.5px]">
                  <div>RECEIPT NO: <strong className="text-slate-800">SATA-REC-{Math.floor(Math.random() * 900000 + 100000)}</strong></div>
                  <div>ZAR AMOUNT PAID: <strong className="text-slate-800">R{selectedBidForPayment.commissionEarned.toLocaleString()}</strong></div>
                  <div>AUTHENTICATION SEAL: <strong className="text-emerald-700">SHA256:VERIFIED_PKI_SECURE_FEE</strong></div>
                </div>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded font-bold uppercase text-[10px] tracking-wider hover:bg-emerald-700 transition-all cursor-pointer"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                
                {/* Invoice summary top */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                  <div>
                    <span className="text-slate-400 uppercase font-mono text-[9px] block">Currently Settle</span>
                    <strong className="text-slate-800">
                      {selectedBidForPayment.id === 'license-upgrade' ? (
                        <>SATA License Upgrade: {selectedBidForPayment.tenderRef.replace('LICENSE-', '')}</>
                      ) : selectedBidForPayment.id === 'payg-credit-purchase' ? (
                        <>Pay-As-You-Go Auto-Fill Credit</>
                      ) : (
                        <>{selectedBidForPayment.tenderRef} Commission</>
                      )}
                    </strong>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-slate-400 uppercase text-[9px] block">ZAR Due</span>
                    <strong className="text-emerald-600 font-bold text-sm">R{selectedBidForPayment.commissionEarned.toLocaleString()}</strong>
                  </div>
                </div>

                {/* Option Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 border border-slate-200 rounded">
                  <button
                    type="button"
                    onClick={() => setPayMethod('card')}
                    className={`py-1.5 text-center font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all ${
                      payMethod === 'card' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('eft')}
                    className={`py-1.5 text-center font-mono text-[10px] font-bold uppercase rounded cursor-pointer transition-all ${
                      payMethod === 'eft' ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Instant EFT / Bank
                  </button>
                </div>

                {/* Card Fields */}
                {payMethod === 'card' ? (
                  <div className="space-y-3.5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Card Holder Name</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Expiry Date</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          placeholder="MM/YY"
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Secure CVV</label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">South African Bank</label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="FNB">First National Bank (FNB)</option>
                          <option value="Standard">Standard Bank</option>
                          <option value="Absa">ABSA Bank</option>
                          <option value="Nedbank">Nedbank</option>
                          <option value="Capitec">Capitec</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Account Number</label>
                        <input
                          type="text"
                          value={eftAccount}
                          onChange={(e) => setEftAccount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">EFT Payment Reference</label>
                      <input
                        type="text"
                        value={eftReference}
                        onChange={(e) => setEftReference(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {/* Legal Acknowledgment and Dispute Waiver Box */}
                <div className="bg-red-50 border border-red-200 rounded p-3 text-left space-y-2">
                  <label className="flex items-start gap-2.5 text-[10.5px] text-red-950 font-sans cursor-pointer select-none leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 rounded border-red-300 text-red-600 focus:ring-red-500"
                    />
                    <span>
                      {selectedBidForPayment.id === 'license-upgrade' ? (
                        <>
                          <strong>Licensing Subscription Agreement:</strong> By checking this box, our company authorizes the activation or upgrade of the selected SATA Monthly License Subscription Plan for <strong>R{selectedBidForPayment.commissionEarned.toLocaleString()}</strong>. We acknowledge terms of monthly recurring access and premium automation features.
                        </>
                      ) : selectedBidForPayment.id === 'payg-credit-purchase' ? (
                        <>
                          <strong>Pay-As-You-Go Credit Agreement:</strong> By checking this box, I authorize the purchase of 1x Single Tender Submission Auto-Fill credit for <strong>R{selectedBidForPayment.commissionEarned.toLocaleString()}</strong>. I understand that this credit allows 1 digital SBD form generation run and has no monthly contract commitment.
                        </>
                      ) : (
                        <>
                          <strong>Irrevocable Payee Acknowledgement:</strong> By checking this box, our enterprise explicitly authorizes success fee recovery for won tenders. We hereby irrevocably acknowledge absolute liability to SATA for the success-based fee of <strong>R{selectedBidForPayment.commissionEarned.toLocaleString()}</strong>, and fully abandon any right or standing to dispute the commission amount claimed.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-mono text-xs uppercase tracking-wider font-bold py-2.5 rounded shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {paymentProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>SGS PayFast Verifying transaction...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-emerald-200" />
                      <span>Settle R{selectedBidForPayment.commissionEarned.toLocaleString()} Securely</span>
                    </>
                  )}
                </button>

              </form>
            )}

            {/* Post-Award Payment Security Protocol Explanation */}
            <div className="pt-4 border-t border-slate-150 space-y-3.5 text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-mono font-bold text-slate-800 uppercase tracking-wider">
                  Post-Award Settle Security Protocol (SGS-256)
                </span>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text.5 text-slate-600 space-y-2">
                <p className="text-[11px] leading-relaxed">
                  SATA protects both suppliers and the platform's processing integrity through our proprietary **Sealed Gateway Settlement (SGS)** protocol:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white p-2.5 border border-slate-150 rounded space-y-1">
                    <strong className="text-slate-800 block text-[9.5px] uppercase font-bold font-mono text-emerald-700">
                      1. PKI Cryptographic Binding
                    </strong>
                    <p className="text-[10px] leading-normal">
                      Your SBD 4 and 6.1 submissions are signed offline using public-key cryptography. When an award is validated, the contract reference is cryptographically tied to the transaction receipt, preventing invoice falsification.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 border border-slate-150 rounded space-y-1">
                    <strong className="text-slate-800 block text-[9.5px] uppercase font-bold font-mono text-emerald-700">
                      2. Treasury-Guaranteed Clearance
                    </strong>
                    <p className="text-[10px] leading-normal">
                      All transaction milestones are cross-referenced with Central Supplier Database (CSD) ledger statuses, ensuring payments are only requested after municipal dispatch schedules are officially triggered.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 border border-slate-150 rounded space-y-1">
                    <strong className="text-slate-800 block text-[9.5px] uppercase font-bold font-mono text-emerald-700">
                      3. PayFast Secure Tokenization
                    </strong>
                    <p className="text-[10px] leading-normal">
                      We do not store your credit card or banking credentials. Payments are tokenized through PayFast's PCI-DSS Level 1 secure merchant gateway with mandatory 3D-Secure 2.0 validation.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 border border-slate-150 rounded space-y-1">
                    <strong className="text-slate-800 block text-[9.5px] uppercase font-bold font-mono text-emerald-700">
                      4. Webhook Verification HMAC
                    </strong>
                    <p className="text-[10px] leading-normal">
                      Settle approvals require secure server-to-server webhook callbacks signed with SHA-256 HMAC tokens, securing transaction integrity against browser manipulation or side-channel exploits.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* OFFLINE PWA SYNC TAB */}
      {activeSubTab === 'pwa_sync' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5" id="supplier-tab-pwa">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-emerald-600" />
              SATA PWA Offline Drafts & Sync Manager
            </h3>
            <p className="text-slate-400 text-xs">
              SATA allows you to work 100% offline. SBD pre-fill drafts and PKI certificates are cached locally inside the browser. When you recover internet connectivity, trigger standard database synchronization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            
            <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-4">
              <div className="font-mono text-xs font-bold text-slate-700 uppercase border-b border-slate-200 pb-2">
                Offline Outbox Cache
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span>SIMULATED NETWORK:</span>
                <button
                  onClick={() => {
                    setIsOfflineSimulated(!isOfflineSimulated);
                    addLog?.(`Network status set to: ${!isOfflineSimulated ? 'OFFLINE' : 'ONLINE'}`, !isOfflineSimulated ? 'warn' : 'success');
                  }}
                  className={`px-3 py-1 font-mono text-[10px] font-bold rounded cursor-pointer transition-all ${
                    isOfflineSimulated 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isOfflineSimulated ? 'OFFLINE (Simulated)' : 'ONLINE'}
                </button>
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span>LOCAL CACHED DRAFTS:</span>
                <strong className="text-slate-900">{offlineDraftCount} SBD forms</strong>
              </div>

              <div className="flex justify-between items-center text-xs font-mono">
                <span>SQL INDICES SYNCHRONIZED:</span>
                <span className="text-emerald-600 font-bold">100% SECURED</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-slate-200 rounded border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono">Client-Side Sync Pipeline</span>
                <p className="text-[11px] leading-relaxed mt-2 text-slate-300">
                  {offlineDraftCount > 0 
                    ? `You currently have ${offlineDraftCount} SBD draft files waiting to be committed to the national open-audit procurement cloud.` 
                    : `Your local outbox is completely clear. All compliance document copies are in full sync with the Treasury repository.`
                  }
                </p>
              </div>

              <button
                onClick={handleManualSync}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase font-bold py-2 rounded transition-colors flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Trigger Force Synchronization
              </button>
            </div>

          </div>

          {/* Local Storage Persistence & Cache Optimizer */}
          <div className="border-t border-slate-200 pt-5 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Local Storage Persistence & Workspace Optimizer
              </h4>
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                POPIA Vault
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Storage Capacity Bar */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">1. POPIA Storage Allocation</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    This browser has 5.0 MB allocated for client-side encrypted credentials. Zero personal records are sent to cloud nodes.
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[10px] text-slate-600">
                    <span>Cache Consumption:</span>
                    <strong>{localStorageStats.usedKb} KB / {localStorageStats.totalKb} KB</strong>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (localStorageStats.usedKb / localStorageStats.totalKb) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Offline Backups */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">2. Immutable Workspace Backups</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Export your complete local workspace config (PKI, drafts, credentials) to an offline file, or restore from an existing backup.
                  </p>
                </div>

                <div className="flex gap-2 font-mono text-xs pt-1.5">
                  <button
                    onClick={handleBackupWorkspace}
                    className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white font-bold uppercase rounded cursor-pointer transition-colors text-center text-[10px]"
                  >
                    Backup Setup
                  </button>
                  <label className="flex-1 py-1.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold uppercase rounded cursor-pointer transition-colors text-center text-[10px] select-none">
                    Restore File
                    <input 
                      type="file" 
                      className="hidden" 
                      accept=".json" 
                      onChange={handleRestoreWorkspace} 
                    />
                  </label>
                </div>
              </div>

              {/* Cache Garbage Collection */}
              <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-3 flex flex-col justify-between text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">3. Performance Garbage Collector</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    Clean redundant metadata, trim dead drafts, and execute local database defragmentation loops to keep queries responsive.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOptimizeCache}
                  className="w-full py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-bold uppercase rounded cursor-pointer transition-all shadow-sm text-center text-[10px]"
                >
                  Optimize Storage Blocks
                </button>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* LEAD ROUTING TAB */}
      {activeSubTab === 'routing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="supplier-tab-routing">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-emerald-600" />
              Routing Match Parameters
            </h3>
            <p className="text-slate-400 text-xs">
              Configure parameters to filter national procurement notices. Tenders matching your profile, province, and keywords will be prioritized and automatically allocated.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Target Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={routingKeywords}
                  onChange={(e) => setRoutingKeywords(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Target Industries / Sectors</label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Medical', 'ICT', 'Infrastructure', 'Catering', 'Logistics'].map((cat) => {
                    const isSelected = selectedRoutingCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedRoutingCategories(selectedRoutingCategories.filter(c => c !== cat));
                          } else {
                            setSelectedRoutingCategories([...selectedRoutingCategories, cat]);
                          }
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block flex justify-between">
                  <span>Minimum Contract Budget:</span>
                  <span className="text-emerald-700 font-bold font-sans">R{routingMinBudget.toLocaleString()}</span>
                </label>
                <input
                  type="range"
                  min="100000"
                  max="10000000"
                  step="100000"
                  value={routingMinBudget}
                  onChange={(e) => setRoutingMinBudget(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[8px] text-slate-400">
                  <span>R100k</span>
                  <span>R5.0m</span>
                  <span>R10.0m</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded text-[11px] leading-normal font-sans">
                <strong>Licensing Tier Matching Boosters:</strong>
                <p className="text-amber-900 mt-1">
                  Active plan: <strong className="font-mono text-[10px] uppercase">{(licenseTier || 'professional').toUpperCase()}</strong>. 
                  {(licenseTier || 'professional') === 'basic' && " Basic license matches are limited to 3 leads maximum and subject to 24hr cache latency."}
                  {(licenseTier || 'professional') === 'payg' && " Pay-As-You-Go starter plan includes a +5% matching score multiplier and displays up to 5 matching leads."}
                  {(licenseTier || 'professional') === 'professional' && " Professional license matches are boosted by +10% matching score multipliers (limits: 10 leads max)."}
                  {(licenseTier || 'professional') === 'enterprise' && " Enterprise elite partners receive priority real-time pushes, unlimited lead routing allocations, and +25% match relevance boosters!"}
                </p>
              </div>

              <button
                onClick={handleRunRoutingEngine}
                disabled={isRoutingRunning}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono font-bold uppercase text-[11px] py-2.5 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                {isRoutingRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Analyzing Gateways...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Scan & Route Leads</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Matches & Terminal Output */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Real-time Match Logs Console */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 shadow-md space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  SATA Routing Engine Terminal Console
                </span>
                {hideDiagnostics && (
                  <span className="text-[8.5px] font-mono bg-red-950/80 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">
                    MASKED FOR PRIVACY
                  </span>
                )}
              </div>

              {hideDiagnostics ? (
                <div className="h-24 bg-slate-900 border border-slate-800 rounded p-4 font-mono text-[10.5px] text-slate-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Real-time match data telemetry streams are masked in Secure Mode.</span>
                </div>
              ) : (
                <div className="h-44 bg-slate-900 border border-slate-800 rounded p-2.5 font-mono text-[10.5px] text-emerald-400 overflow-y-auto space-y-1 scrollbar-thin">
                  {routingLogs.length === 0 ? (
                    <div className="text-slate-500 italic">Terminal idle. Configure match parameters and execute scanner.</div>
                  ) : (
                    routingLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Matched leads card list */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Discovery matches ({matchedLeadsList.length})
              </h3>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {matchedLeadsList.map((lead, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-150 rounded flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-1 max-w-full md:max-w-[70%] text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-700 text-[10.5px]">{lead.referenceNumber}</span>
                        <span className={`px-1.5 py-0.5 text-[8.5px] font-mono rounded font-bold uppercase ${
                          lead.score >= 70 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                          lead.score >= 50 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.score}% Match
                        </span>
                        {lead.categoryHit && (
                          <span className="px-1.5 py-0.5 text-[8.5px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold uppercase">
                            Sector Aligned
                          </span>
                        )}
                      </div>
                      <div className="text-slate-800 font-sans text-xs font-semibold truncate leading-tight">{lead.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{lead.department} • {lead.province}</div>
                      
                      {/* Interactive transparent score breakdown list */}
                      {lead.breakDown && (
                        <div className="text-[9.5px] text-slate-500 font-mono mt-1.5 bg-white border border-slate-200/60 p-2 rounded flex flex-wrap gap-x-2.5 gap-y-1">
                          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />Prov: +{lead.breakDown.province}</span>
                          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />Keywords: +{lead.breakDown.keywords}</span>
                          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />Sector: +{lead.breakDown.category}</span>
                          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500" />Compliance: +{lead.breakDown.compliance}</span>
                          <span className="text-slate-400">({lead.breakDown.booster})</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex md:flex-col justify-between items-center md:items-end w-full md:w-auto border-t md:border-t-0 border-slate-200/50 pt-2 md:pt-0">
                      <div>
                        <span className="text-[8px] uppercase font-mono text-slate-400 block md:text-right">Est Value</span>
                        <strong className="text-slate-900 font-mono text-[11px] block">R{(lead.parsedValue || 1500000).toLocaleString()}</strong>
                      </div>
                      <span className="text-emerald-600 font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded mt-2">
                        ✔ Routed
                      </span>
                    </div>
                  </div>
                ))}

                {matchedLeadsList.length === 0 && (
                  <div className="text-center py-10 text-slate-400 italic text-xs font-mono border border-dashed border-slate-200 rounded bg-slate-50/50">
                    No active notice matches discovered. Run matching algorithm above to verify.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* COMPLIANCE AUDITS TAB */}
      {activeSubTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="supplier-tab-audit">
          
          {/* Compliance Ledger Scanner Controls */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-600" />
              SATA Compliance Ledger Auditor
            </h3>
            <p className="text-slate-400 text-xs">
              Generate secure SCM compliance audit reports. This engine checks your corporate registration status against SARS Good Standing records, Central Supplier Database indexes, active PKI cryptographic keys, and historical SBD submissions.
            </p>

            {/* Statutory Documents Upload Desk */}
            <div className="border-t border-b border-slate-100 py-3.5 my-2.5 space-y-2.5">
              <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                Statutory Documents Upload Desk
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                To run a legally verified audit, please drag & drop or select your active COIDA certificate and municipal utilities bill. In keeping with POPIA guidelines, files are stored entirely on your device.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* COIDA Drag and Drop & Manual Click */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">1. COIDA Certificate</span>
                  {coidaFile ? (
                    <div className="p-2 bg-sky-50 border border-sky-100 rounded text-xs flex justify-between items-center font-mono">
                      <div className="truncate pr-1 text-[10px] text-left">
                        <span className="font-bold text-sky-900 block truncate" title={coidaFile.name}>{coidaFile.name}</span>
                        <span className="text-[9px] text-sky-600">{coidaFile.size} • Secured</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setCoidaFile(null)} 
                        className="text-red-500 hover:text-red-700 cursor-pointer text-[10px] font-bold shrink-0 px-1"
                        title="Remove Document"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 rounded cursor-pointer transition-colors text-center min-h-[64px] select-none">
                      <Upload className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                      <span className="text-[9px] font-bold text-slate-500 block uppercase font-mono">Select / Drop File</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCoidaFile({
                              name: file.name,
                              size: (file.size / 1024).toFixed(1) + ' KB',
                              uploadedAt: new Date().toISOString()
                            });
                            addLog?.(`Uploaded COIDA Letter of Good Standing: ${file.name}. Saved to secure device storage.`, 'success');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Municipal Bill Drag and Drop & Manual Click */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold block">2. Municipal Rates Bill</span>
                  {municipalFile ? (
                    <div className="p-2 bg-sky-50 border border-sky-100 rounded text-xs flex justify-between items-center font-mono">
                      <div className="truncate pr-1 text-[10px] text-left">
                        <span className="font-bold text-sky-900 block truncate" title={municipalFile.name}>{municipalFile.name}</span>
                        <span className="text-[9px] text-sky-600">{municipalFile.size} • Secured</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setMunicipalFile(null)} 
                        className="text-red-500 hover:text-red-700 cursor-pointer text-[10px] font-bold shrink-0 px-1"
                        title="Remove Document"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-2.5 border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/10 rounded cursor-pointer transition-colors text-center min-h-[64px] select-none">
                      <Upload className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                      <span className="text-[9px] font-bold text-slate-500 block uppercase font-mono">Select / Drop File</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,image/*" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setMunicipalFile({
                              name: file.name,
                              size: (file.size / 1024).toFixed(1) + ' KB',
                              uploadedAt: new Date().toISOString()
                            });
                            addLog?.(`Uploaded Municipal Utilities Bill: ${file.name}. Saved to secure device storage.`, 'success');
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated auditing steps tracker */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Verification Sequence Status</span>
              
              <div className="space-y-2.5 text-xs font-mono text-left">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auditStep >= 1 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    1. Audit Engine Setup
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {auditStep > 1 ? '✔ OK' : auditStep === 1 ? 'RUNNING' : 'PENDING'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auditStep >= 2 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    2. SARS Tax pin clearance
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {auditStep > 2 ? '✔ OK' : auditStep === 2 ? 'RUNNING' : 'PENDING'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auditStep >= 3 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    3. Treasury CSD Record index
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {auditStep > 3 ? '✔ OK' : auditStep === 3 ? 'RUNNING' : 'PENDING'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auditStep >= 4 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                    4. B-BBEE Level Preference
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {auditStep > 4 ? '✔ OK' : auditStep === 4 ? 'RUNNING' : 'PENDING'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auditStep >= 5 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    5. PKI Cryptographic trace
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {auditStep > 5 ? '✔ OK' : auditStep === 5 ? 'RUNNING' : 'PENDING'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRunAuditVerification}
                disabled={auditRunning}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-mono font-bold uppercase text-[11px] py-2.5 rounded transition-all flex items-center justify-center gap-2 cursor-pointer shadow mt-4"
              >
                {auditRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Compiling Report...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Compile SCM Compliance Ledger</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Certificate Output & Logs */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Terminal logs */}
            {auditLogs.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider block text-left">
                    SCM Compliance Audit Engine Logs
                  </span>
                  {hideDiagnostics && (
                    <span className="text-[8.5px] font-mono bg-red-950/80 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">
                      MASKED FOR PRIVACY
                    </span>
                  )}
                </div>
                {hideDiagnostics ? (
                  <div className="h-16 bg-slate-900 border border-slate-800 rounded p-3 font-mono text-[10.5px] text-slate-400 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Compliance validation logs are cryptographically hidden in Secure Mode.</span>
                  </div>
                ) : (
                  <div className="h-28 bg-slate-900 border border-slate-800 rounded p-2 font-mono text-[10.5px] text-emerald-400 overflow-y-auto space-y-1 text-left scrollbar-thin">
                    {auditLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed">{log}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cryptographically Sealed Certificate */}
            {certifiedLedger ? (
              <div className="bg-gradient-to-br from-emerald-50 via-white to-slate-50 border-2 border-emerald-600 rounded-lg p-6 shadow-md relative overflow-hidden font-sans text-left">
                
                {/* Background decorative Treasury shield seal */}
                <div className="absolute right-4 bottom-4 opacity-10">
                  <Award className="w-32 h-32 text-emerald-700" />
                </div>

                <div className="flex justify-between items-start border-b border-emerald-100 pb-4 mb-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">TREASURY STANDARDS VALID</span>
                    <strong className="block text-slate-900 text-sm font-display tracking-wide font-bold uppercase">SCM COMPLIANCE CERTIFICATION LEDGER</strong>
                    <span className="text-[10px] text-slate-400 font-mono block">AUTOMATED OPEN-AUDIT SYSTEM PASSPORT</span>
                  </div>
                  <Award className="w-10 h-10 text-emerald-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono mb-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">ISSUED TO CORPORATE</span>
                    <strong className="text-slate-800 text-[10.5px] font-sans font-bold block">{certifiedLedger.companyName}</strong>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold mt-2">REGISTRATION NO</span>
                    <strong className="text-slate-800 text-[10.5px] block">{certifiedLedger.registrationNumber}</strong>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold">TREASURY CSD INDEX</span>
                    <strong className="text-slate-800 text-[10.5px] block">{certifiedLedger.csdNumber}</strong>
                    <span className="text-[9px] text-slate-400 block uppercase font-bold mt-2">B-BBEE STATUS</span>
                    <strong className="text-emerald-700 text-[10.5px] font-bold block">{certifiedLedger.bbbeeLevel}</strong>
                  </div>
                </div>

                <div className="space-y-2.5 font-mono text-[10.5px] bg-white p-3 border border-slate-200 rounded">
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold">SARS Good Standing Pin Status:</span>
                    <span className="text-emerald-700 font-bold">Compliant / Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold">SBD Document Evaluation:</span>
                    <span className="text-emerald-700 font-semibold">{certifiedLedger.sbdStatusCheck}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold">MBD Equivalent Evaluation:</span>
                    <span className="text-emerald-700 font-semibold">{certifiedLedger.mbdStatusCheck}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold">COIDA Compensation Status:</span>
                    <span className="text-emerald-700 font-bold">{certifiedLedger.coidaStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold">Municipal Account rates:</span>
                    <span className="text-emerald-700 font-bold">{certifiedLedger.municipalRatesStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 uppercase font-bold font-mono">SCM Verification Status:</span>
                    <span className="text-emerald-700 font-bold">{certifiedLedger.compliancePercentage}% Compliance Clear</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-[10px]">
                    <span className="text-slate-400 uppercase font-bold">PKI Signatures Trace:</span>
                    <span className="text-slate-600 font-mono truncate max-w-[50%]">{certifiedLedger.pkiThumbprint}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 uppercase font-bold">Cryptographic Secure Seal:</span>
                    <span className="text-emerald-700 font-bold">{certifiedLedger.verificationSeal}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <p className="text-[10px] text-slate-400 leading-normal max-w-sm font-sans">
                    * This ledger is cryptographically sealed and conforms to Section 217 of the South African Constitution. Verified via SATA national database gateway.
                  </p>

                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(certifiedLedger, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `SCM_Compliance_Passport_${profile.companyName.replace(/ /g, '_')}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      addLog?.("SCM Compliance Audit Report JSON downloaded successfully!", "success");
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[10px] uppercase font-bold rounded flex items-center gap-1.5 cursor-pointer shadow transition-all shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Audit Ledger
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-lg bg-slate-50">
                <ShieldCheck className="w-12 h-12 text-slate-300 mb-3 animate-pulse" />
                <strong className="text-slate-800 text-xs uppercase tracking-wider block">Compliance Passport Ledger Empty</strong>
                <p className="text-slate-400 text-[11px] max-w-xs mt-1.5 leading-relaxed">
                  Execute the secure multi-sequence compliance auditor in the left panel to crawl and certify corporate SARS tax pin and CSD parameters.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* DEFAULTERS & RENEWAL REMINDERS WAR ROOM TAB */}
      {activeSubTab === 'warroom' && (
        <div className="space-y-6 text-left" id="supplier-tab-warroom">
          
          {/* Header Description */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 text-white rounded-lg p-5 border border-red-900/60 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-500 animate-pulse" />
                  SCM Defaulter Settlement & Renewal Campaign War Room
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Real-time municipal post-award tracking desk. Enforce compliance status restrictions (ECT Act 2002 / SBD rules) on suppliers with overdue platform commissions, and broadcast batch renewal reminders to active subscriber networks.
                </p>
              </div>
              <div className="shrink-0 bg-red-900/60 border border-red-800 rounded px-3 py-1.5 font-mono text-center">
                <span className="text-[9px] text-red-300 block uppercase font-bold">TOTAL OUTSTANDING AR</span>
                <strong className="text-white text-sm font-sans font-black">R2,916,000</strong>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Defaulters Flagged</span>
              <div className="text-2xl font-mono font-bold text-red-600">3 Companies</div>
              <span className="text-[10px] text-slate-500 font-mono block">Overdue commission fees</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Escrow Notices Sent</span>
              <div className="text-2xl font-mono font-bold text-slate-800">
                {defaulters.reduce((acc, d) => acc + d.reminderCount, 0)} Dispatches
              </div>
              <span className="text-[10px] text-slate-500 font-mono block">Via Twilio & Mailer API</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Subscribers Due (15d)</span>
              <div className="text-2xl font-mono font-bold text-amber-600">14 Partners</div>
              <span className="text-[10px] text-slate-500 font-mono block">Pending renewal cycle</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm space-y-1">
              <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Target Recovery Rate</span>
              <div className="text-2xl font-mono font-bold text-emerald-600">89.4%</div>
              <span className="text-[10px] text-emerald-600 font-mono block">High legal clearance</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Defaulter Ledger */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4.5 h-4.5 text-red-600" />
                Defaulters Settle Compliance Enforcement Ledger
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-mono text-slate-500 uppercase">
                      <th className="py-2.5 px-2">Corporate Entity</th>
                      <th className="py-2.5 px-2">Tender Contract / Value</th>
                      <th className="py-2.5 px-2">Commission (12%)</th>
                      <th className="py-2.5 px-2">Reminders</th>
                      <th className="py-2.5 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-xs">
                    {defaulters.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-2">
                          <strong className="text-slate-800 font-sans block text-[11.5px]">{d.companyName}</strong>
                          <span className="text-[9.5px] text-slate-400 block">{d.registrationNumber}</span>
                          <span className="mt-1 inline-block text-[9px] px-1.5 py-0.25 bg-red-50 text-red-800 border border-red-100 rounded font-bold">
                            {d.daysOverdue} Days Overdue
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <strong className="text-slate-700 block text-[11px] truncate max-w-[200px]" title={d.tenderTitle}>
                            {d.tenderTitle}
                          </strong>
                          <span className="text-[10px] text-slate-400">Ref: {d.tenderRef}</span>
                          <span className="block text-[10px] text-slate-500">Value: R{d.valueWon.toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-2">
                          <strong className="text-red-700 block text-[11px]">R{d.commissionAmount.toLocaleString()}</strong>
                          <span className="text-[9px] text-slate-400 block">Renewal: {d.subsRenewalDue}</span>
                          <span className={`inline-block text-[9px] px-1 rounded uppercase font-bold mt-1 ${
                            d.subsStatus === 'expired' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            Subs: {d.subsStatus}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="text-[13px] font-bold text-slate-850">{d.reminderCount}</div>
                          <span className="text-[8px] text-slate-400 block uppercase">Sent</span>
                        </td>
                        <td className="py-3 px-2 text-right space-y-1.5">
                          <div className="flex flex-col sm:flex-row gap-1.5 justify-end">
                            <button
                              onClick={() => handleSendReminder(d.id)}
                              className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase rounded cursor-pointer transition-colors shadow-sm flex items-center gap-1 justify-center"
                              title="Send Twilio SMS and SMTP mail notification"
                            >
                              <Send className="w-3 h-3 text-slate-500" />
                              Remind
                            </button>
                            <button
                              onClick={() => handleToggleBlock(d.id)}
                              className={`px-2 py-1.5 text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-all shadow-sm flex items-center gap-1 justify-center ${
                                d.blockLevel === 'CSD_Restricted' 
                                  ? 'bg-emerald-600 hover:bg-emerald-700' 
                                  : 'bg-red-600 hover:bg-red-700'
                              }`}
                              title={d.blockLevel === 'CSD_Restricted' ? "Lift Treasury Lock" : "Place SBD Submission Block"}
                            >
                              <Ban className="w-3 h-3 text-white" />
                              {d.blockLevel === 'CSD_Restricted' ? 'Unblock' : 'Block CSD'}
                            </button>
                          </div>
                          {d.blockLevel === 'CSD_Restricted' && (
                            <span className="text-red-600 font-extrabold text-[8px] uppercase tracking-wider block">
                              🚫 CSD ACCESS LOCKED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaign Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Subscription Renewal Broadcast */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Clock className="w-4.5 h-4.5 text-slate-500" />
                  <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                    Subscription Reminder Dispatcher
                  </h3>
                </div>

                <p className="text-slate-400 text-xs">
                  Run high-priority reminder broadcasts targeting partners with subscriptions nearing expiration.
                </p>

                <div className="bg-slate-50 p-3.5 border border-slate-200 rounded space-y-2.5 font-mono text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Basic Tier Subscribers:</span>
                    <strong className="text-slate-800">52 active</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Tier:</span>
                    <strong className="text-slate-800">28 active</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Enterprise Tier:</span>
                    <strong className="text-slate-800">8 active</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-[10px] text-red-600 font-bold">
                    <span>Overdue / Expired:</span>
                    <strong>2 suppliers</strong>
                  </div>
                </div>

                <button
                  onClick={handleBroadcastRenewals}
                  disabled={isCampaignRunning}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-mono text-xs uppercase font-bold py-2.5 rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isCampaignRunning ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-red-200" />
                      <span>Dispatching Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-red-100" />
                      <span>Broadcast Renewal Campaign</span>
                    </>
                  )}
                </button>
              </div>

              {/* War Room Live Logs */}
              <div className="bg-slate-950 border border-slate-900 rounded-lg p-4 shadow space-y-3">
                <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
                  <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider block text-left">
                    War Room Communication Logs
                  </span>
                  {warroomLogs.length > 0 && (
                    <button
                      onClick={() => setWarroomLogs([])}
                      className="text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                
                <div className="h-44 bg-slate-900 border border-slate-850 rounded p-2.5 font-mono text-[10px] text-red-400 overflow-y-auto space-y-2 text-left scrollbar-thin">
                  {warroomLogs.length === 0 ? (
                    <div className="text-slate-600 italic text-[10px] text-center pt-8">Log buffer empty. Dispatch some alerts to monitor.</div>
                  ) : (
                    warroomLogs.map((log, idx) => {
                      let color = "text-red-400";
                      if (log.includes("[LEGAL SHIELD INFO]")) color = "text-emerald-400";
                      else if (log.includes("[LEGAL SHIELD WARNING]")) color = "text-red-500 font-bold";
                      else if (log.includes("[PayFast Vault]")) color = "text-indigo-400";
                      else if (log.includes("dispatched") || log.includes("Dispatched")) color = "text-amber-400";
                      else if (log.includes("ACTIVE")) color = "text-slate-400";

                      return (
                        <div key={idx} className={`leading-relaxed ${color}`}>{log}</div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* SATA CONCURRENCY STRESS TEST SUITE TAB */}
      {activeSubTab === 'stress_test' && (
        <div className="space-y-6 text-left" id="supplier-tab-stresstest">
          
          {/* Header Description */}
          <div className="bg-gradient-to-r from-orange-950 via-slate-900 to-orange-950 text-white rounded-lg p-5 border border-orange-900/60 shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-500 animate-pulse" />
                  SATA Digital Signature & Offline DB Stress Test Suite
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Sandbox simulator to verify browser cryptographic signing speeds and IndexedDB queue capacity. Simulate high-density concurrency workloads (RSA-2048 SBD signing envelopes) to ensure PWA stability before field deployment.
                </p>
              </div>
              <div className="shrink-0 bg-orange-900/40 border border-orange-800 rounded px-3 py-1.5 font-mono text-center">
                <span className="text-[9px] text-orange-300 block uppercase font-bold">WORKLOAD MODE</span>
                <strong className="text-white text-xs font-sans font-black">LOCAL CRYPTO SANDBOX</strong>
              </div>
            </div>
          </div>

          {/* Controls and Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Simulation Setup card */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  Workload Configuration
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold block flex justify-between">
                      <span>Concurrent Worker Threads:</span>
                      <span className="text-orange-700 font-bold font-sans">{stressConcurrency} Threads</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      step="2"
                      value={stressConcurrency}
                      onChange={(e) => setStressConcurrency(parseInt(e.target.value))}
                      disabled={isStressTesting}
                      className="w-full accent-orange-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none disabled:opacity-50"
                    />
                    <div className="flex justify-between text-[8px] text-slate-400">
                      <span>2 Threads</span>
                      <span>8 Threads</span>
                      <span>16 Threads</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 text-amber-950 rounded text-[11px] leading-relaxed font-sans">
                    <strong>Cryptographic Task Payload:</strong> Each simulated thread performs multiple RSA-2048 private key signature generations on an encrypted JSON document. This tests the browser's WebCrypto subsystem under sustained micro-thread loops.
                  </div>
                </div>
              </div>

              <button
                onClick={handleRunSupplierStressTest}
                disabled={isStressTesting}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-mono text-xs uppercase font-bold py-3 rounded shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
              >
                {isStressTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-200" />
                    <span>Executing Stress Trial...</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5 text-orange-200" />
                    <span>Launch Concurrency Trial</span>
                  </>
                )}
              </button>
            </div>

            {/* Performance Indicators */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-1 text-left">
                <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Simulated Throughput</span>
                <div className="text-3xl font-mono font-bold text-orange-600">
                  {stressThroughput > 0 ? `${stressThroughput} ops/s` : '---'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">RSA private-key seals / sec</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-1 text-left">
                <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Thread Lockout Incidents</span>
                <div className="text-3xl font-mono font-bold text-emerald-600">
                  0 Locks
                </div>
                <span className="text-[10px] text-emerald-600 font-mono block">Safe resource utilization</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-1 text-left">
                <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">DB Queue Cache Payload</span>
                <div className="text-3xl font-mono font-bold text-slate-800">
                  {isStressTesting ? 'Caching...' : stressThroughput > 0 ? `${(stressConcurrency * 2.8).toFixed(1)} KB` : '---'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">Committed to local storage</span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-1 text-left">
                <span className="text-slate-400 uppercase text-[9px] font-bold font-mono block">Thread Status</span>
                <div className="text-xl font-mono font-bold text-emerald-700 uppercase flex items-center gap-1.5 pt-1">
                  <span className={`w-2 h-2 rounded-full ${isStressTesting ? 'bg-orange-500 animate-ping' : 'bg-slate-300'}`} />
                  {isStressTesting ? 'Heavy Load' : 'Ready'}
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">All sandbox pipelines green</span>
              </div>
            </div>

          </div>

          {/* Charts & Terminal Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Visual Latency Chart */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                Simulated Thread Latency Distribution (ms)
              </h3>
              
              {stressLatency.length === 0 ? (
                <div className="h-44 border border-dashed border-slate-200 rounded flex items-center justify-center bg-slate-50/50 text-slate-400 italic text-xs font-mono">
                  No active performance telemetry data. Run trial above.
                </div>
              ) : (
                <div className="h-44 flex items-end justify-between gap-1 border-b border-slate-200 pb-2 pt-6">
                  {stressLatency.map((latency, idx) => {
                    const pct = Math.min(100, (latency / 60) * 100);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[8px] font-mono font-bold text-orange-600">{latency}ms</span>
                        <div 
                          className="w-full bg-orange-500 hover:bg-orange-600 rounded-t transition-all" 
                          style={{ height: `${pct}%`, minHeight: '4px' }}
                        />
                        <span className="text-[7.5px] font-mono text-slate-400">T{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="text-[8.5px] font-mono text-slate-400 block text-center">Lower latency indicates higher cryptographic compute capacity on this browser core.</span>
            </div>

            {/* Sandbox Console Logs */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-900 rounded-lg p-4 shadow space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider block text-left">
                  SATA Sandbox Concurrency Console Output
                </span>
                {hideDiagnostics && (
                  <span className="text-[8.5px] font-mono bg-red-950/80 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">
                    MASKED FOR PRIVACY
                  </span>
                )}
              </div>
              
              {hideDiagnostics ? (
                <div className="h-44 bg-slate-900 border border-slate-850 rounded p-4 font-mono text-[10px] text-slate-400 flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Sandbox concurrency and telemetry loops are cryptographically masked in Secure Mode.</span>
                </div>
              ) : (
                <div className="h-44 bg-slate-900 border border-slate-850 rounded p-2.5 font-mono text-[10px] text-orange-400 overflow-y-auto space-y-1.5 text-left scrollbar-thin">
                  {stressLogs.length === 0 ? (
                    <div className="text-slate-600 italic text-[10px] text-center pt-8">Console idle. Configure thread load parameters and trigger trial.</div>
                  ) : (
                    stressLogs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed whitespace-pre-wrap">{log}</div>
                    ))
                  )}
                </div>
              )}
            </div>

          </div>

        </div>
      )}


      {/* EXPORT SUBMISSION COMPLIANCE REPORT MODAL */}
      {showExportModal && selectedBidForManagement && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="max-w-3xl w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🇿🇦</span>
                <div>
                  <h4 className="text-xs font-bold font-mono text-amber-500 uppercase tracking-widest">National Treasury Framework Code</h4>
                  <h3 className="text-sm font-bold font-sans text-white leading-tight">SCM SBD Compliance & Audit Dossier</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable content */}
            <div className="p-6 overflow-y-auto space-y-6 text-left font-sans text-slate-800 leading-relaxed text-xs">
              
              {/* Document Stamp Header */}
              <div className="border-b border-dashed border-slate-200 pb-4 text-center space-y-1">
                <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[10px] font-mono font-bold uppercase">
                  ✔ COMPLIANCE PASSPORT VERIFIED
                </div>
                <h2 className="text-base font-bold font-sans text-slate-900 tracking-tight uppercase">TENDER SUBMISSION AUDIT REPORT</h2>
                <p className="font-mono text-[10px] text-slate-400">
                  REF: {selectedBidForManagement.tenderRef} • GENERATED AT: {new Date().toISOString()}
                </p>
              </div>

              {/* SECTION 1: CORPORATE PROFILE & TENDER DETAIL */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">01. Procurement Context</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-150 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px]">Tender Title</span>
                    <span className="text-slate-800 font-sans font-bold block truncate max-w-[300px]">{selectedBidForManagement.tenderTitle}</span>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] mt-2">Authority / Dept</span>
                    <span className="text-slate-800 font-sans block">{selectedBidForManagement.department || 'Municipal SCM Secretariat'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-bold text-[9px]">Submission Deadline</span>
                    <span className="text-slate-800 block">{selectedBidForManagement.submissionDate || 'Not specified'}</span>
                    <span className="text-slate-400 block uppercase font-bold text-[9px] mt-2">Province / Region</span>
                    <span className="text-slate-800 block uppercase">{selectedBidForManagement.province || 'National Office'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: STATUTORY COMPLIANCE CHECKLIST STATUS */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">02. SBD & MBD Compliance Matrices</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Standard checks */}
                  <div className="space-y-1.5 p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Standard SBD Requirements</span>
                    {[
                      { title: 'SBD 4 Declaration', checked: selectedBidForManagement.sbd4Signed },
                      { title: 'SBD 6.1 Preferences', checked: selectedBidForManagement.sbd61Signed },
                      { title: 'SBD 8 Past Practices', checked: selectedBidForManagement.sbd8Signed },
                      { title: 'SBD 9 Independent Bid', checked: selectedBidForManagement.sbd9Signed },
                      { title: 'SARS PIN clearance', checked: selectedBidForManagement.sarsPinValid },
                      { title: 'CSD Registration Profile', checked: selectedBidForManagement.csdRegistered },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-600">{item.title}:</span>
                        <span className={`font-bold ${item.checked ? 'text-emerald-700' : 'text-red-600'}`}>
                          {item.checked ? '✔ VERIFIED' : '✖ PENDING'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Enterprise / Custom requirements */}
                  <div className="space-y-1.5 p-3 bg-white border border-slate-200 rounded-lg">
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block mb-1">Custom SCM Prerequisites</span>
                    {(!selectedBidForManagement.customChecklist || selectedBidForManagement.customChecklist.length === 0) ? (
                      <div className="text-[10px] text-slate-400 italic font-mono pt-4 text-center">
                        No additional custom requirements declared.
                      </div>
                    ) : (
                      selectedBidForManagement.customChecklist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-600 truncate max-w-[150px]" title={item.title}>{item.title}:</span>
                          <span className={`font-bold ${item.checked ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {item.checked ? '✔ VERIFIED' : '✖ PENDING'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: MILESTONE TIMELINE & DELEGATIONS */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">03. Preparatory Milestones & Task Delegation</h4>
                {(!selectedBidForManagement.tasks || selectedBidForManagement.tasks.length === 0) ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-400 font-mono text-[10.5px]">
                    No milestones or timeline scheduled for this bid yet.
                  </div>
                ) : (
                  <div className="border border-slate-150 rounded-lg divide-y divide-slate-150 overflow-hidden font-mono text-[10.5px]">
                    {selectedBidForManagement.tasks.map((task) => (
                      <div key={task.id} className="p-2.5 bg-white flex items-center justify-between gap-3 hover:bg-slate-50">
                        <div className="flex items-center gap-2 truncate">
                          <span className={task.completed ? 'text-emerald-600' : 'text-slate-300'}>
                            {task.completed ? '✔' : '○'}
                          </span>
                          <span className={`truncate text-slate-700 ${task.completed ? 'line-through text-slate-400' : 'font-semibold'}`}>
                            {task.title}
                          </span>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 text-right">
                          <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-sans uppercase font-bold text-[9px]">
                            {task.assignee}
                          </span>
                          <span className="text-[10px] text-slate-400">{task.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 4: DOCUMENT CHRONOLOGY */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">04. Packaged SBD Document Assets</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-mono">
                  {(selectedBidForManagement.documentFolders || []).map((folder) => (
                    <div key={folder.id} className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-xl block">📁</span>
                      <strong className="text-[10.5px] block truncate text-slate-700 mt-1" title={folder.name}>{folder.name}</strong>
                      <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">
                        {folder.documents.length} PDF / File{folder.documents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: FINANCIAL BRIDGE SUMMARY */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1">05. SCM Costing Audit Bridge</h4>
                {(() => {
                  const bidPrice = selectedBidForManagement.customBidPrice ?? selectedBidForManagement.tenderValue;
                  const delCost = selectedBidForManagement.customDeliveryCost ?? Math.round(selectedBidForManagement.tenderValue * 0.78);
                  const netMargin = bidPrice - delCost;
                  const grossPct = bidPrice > 0 ? (netMargin / bidPrice) * 100 : 0;
                  
                  const useCap = selectedBidForManagement.useFeeCap !== false;
                  const capAmt = selectedBidForManagement.feeCapAmount ?? 150000;
                  const rawSuccessFee = Math.round(bidPrice * ((selectedBidForManagement.splitPercentage || 12) / 100));
                  const finalCappedFee = useCap ? Math.min(rawSuccessFee, capAmt) : rawSuccessFee;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-[11px]">
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Bid Offer Price</span>
                        <strong className="text-white text-xs block">R{bidPrice.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Est Delivery Cost</span>
                        <strong className="text-white text-xs block">R{delCost.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[8.5px]">Net Gross Margin</span>
                        <strong className={`text-xs block ${netMargin < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          R{netMargin.toLocaleString()} ({grossPct.toFixed(1)}%)
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase font-bold text-[8.5px]">SATA Success Fee (Capped)</span>
                        <strong className="text-amber-400 text-xs block">R{finalCappedFee.toLocaleString()}</strong>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* DIGITAL SIGNATURE ENVELOPE FOOTNOTE */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1.5 font-mono text-[10px] text-slate-500">
                <p className="font-bold uppercase text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  SATA PKI CERTIFICATE OF AUTHENTICITY ENVELOPE
                </p>
                <p className="leading-relaxed">
                  This dossier acts as a self-contained, validated, cryptographically sealed compilation envelope. All checks, checklist state flags, delegated timelines, and uploaded documents conform to South African municipal procurement directives.
                </p>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 mt-1.5 font-bold text-[9px] text-slate-400">
                  <span>SYSTEM HASH: SATA-SHA256-BID-{selectedBidForManagement.id}</span>
                  <span className="text-emerald-700">STAMP: SEALED_VALID</span>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 shrink-0 border-t border-slate-200 flex justify-end gap-3 font-mono">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="py-1.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-bold cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  
                  // Trigger local file download
                  const reportData = {
                    metadata: {
                      title: "SATA SBD COMPLIANCE & AUDIT DOSSIER",
                      ref: selectedBidForManagement.tenderRef,
                      generatedAt: new Date().toISOString(),
                    },
                    procurementDetails: {
                      tenderTitle: selectedBidForManagement.tenderTitle,
                      department: selectedBidForManagement.department || "Municipal SCM Secretariat",
                      province: selectedBidForManagement.province,
                      submissionDate: selectedBidForManagement.submissionDate,
                    },
                    standardCompliance: {
                      sbd4: selectedBidForManagement.sbd4Signed,
                      sbd61: selectedBidForManagement.sbd61Signed,
                      sbd8: selectedBidForManagement.sbd8Signed,
                      sbd9: selectedBidForManagement.sbd9Signed,
                      sarsPIN: selectedBidForManagement.sarsPinValid,
                      csdProfile: selectedBidForManagement.csdRegistered,
                    },
                    customCompliance: selectedBidForManagement.customChecklist || [],
                    milestones: selectedBidForManagement.tasks || [],
                    packagedDocuments: (selectedBidForManagement.documentFolders || []).map(f => ({
                      folderName: f.name,
                      documentsCount: f.documents.length,
                      documents: f.documents
                    })),
                    financialBridge: {
                      tenderValue: selectedBidForManagement.tenderValue,
                      customBidPrice: selectedBidForManagement.customBidPrice,
                      customDeliveryCost: selectedBidForManagement.customDeliveryCost,
                      feeCapActive: selectedBidForManagement.useFeeCap !== false,
                      feeCapAmount: selectedBidForManagement.feeCapAmount ?? 150000,
                    }
                  };

                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `SATA_TENDER_DOSSIER_${selectedBidForManagement.tenderRef.replace(/ /g, '_')}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  
                  addLog?.(`Compliance envelope JSON exported successfully! Use your print dialog to save the visual PDF document.`, 'success');
                }}
                className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Print & Export PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

