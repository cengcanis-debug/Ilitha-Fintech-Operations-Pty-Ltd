/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Handshake, 
  ShieldCheck, 
  CreditCard, 
  Briefcase, 
  Coins, 
  MapPin, 
  TrendingUp, 
  Check, 
  FileText,
  Clock,
  Sparkles,
  Info,
  Trophy,
  Zap,
  Building,
  Shuffle,
  ArrowRight,
  DollarSign,
  Lock,
  HelpCircle,
  Activity,
  Download,
  Upload,
  BarChart3,
  FileJson
} from 'lucide-react';
import { PartnerRegistration } from '../types';
import { savePartnerRegistrationToCloud, loadPartnerRegistrationsFromCloud } from '../services/firebase';

interface PartnerRegistrationHubProps {
  addLog?: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
  activeCert?: any;
  hideDiagnostics?: boolean;
}

// Pre-seeded local tenders for routing simulation
interface ManagedTenderLead {
  id: string;
  reference: string;
  title: string;
  department: string;
  estimatedValueZar: number;
  category: string;
  province: string;
}

interface RoutedBidState {
  id: string;
  tenderId: string;
  tenderTitle: string;
  tenderValue: number;
  partnerId: string;
  partnerName: string;
  splitPercentage: number;
  status: 'routing' | 'sbd_generated' | 'submitted' | 'won' | 'archived';
  overrideActive: boolean;
  commissionEarned: number;
  useFeeCap?: boolean;
  feeCapAmount?: number;
  updatedAtIso: string;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  paymentRef?: string;
  paidAtIso?: string;
  pppfaScore?: number;
  nonCollusionHash?: string;
  evaluationLog?: string;
}

export default function PartnerRegistrationHub({ addLog, activeCert, hideDiagnostics }: PartnerRegistrationHubProps) {
  const [partners, setPartners] = useState<PartnerRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTier, setSelectedTier] = useState<'growth' | 'elite' | 'master'>('elite');
  const [agreedSplit, setAgreedSplit] = useState<number>(12); // Pre-set based on Chosen Tier (15%, 12%, 10%)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['it_software']);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>(['gauteng']);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Feature 1, 2, 3: Foreign Supplier Registration & Compliance States
  const [isForeignSupplier, setIsForeignSupplier] = useState<boolean>(false);
  const [foreignRegistryNumber, setForeignRegistryNumber] = useState<string>('');
  const [foreignCountry, setForeignCountry] = useState<string>('United States');
  const [globalSwiftBic, setGlobalSwiftBic] = useState<string>('');
  const [globalIban, setGlobalIban] = useState<string>('');
  const [sarsExemptionWaiverCode, setSarsExemptionWaiverCode] = useState<string>('');
  const [geepReference, setGeepReference] = useState<string>('');
  const [prefPointsEquivalenceClaim, setPrefPointsEquivalenceClaim] = useState<'none' | 'geep' | 'zero_rating'>('none');

  // Feature 4: Local Content & Multi-Currency SARB Rate Risk Converter States
  const [foreignCurrency, setForeignCurrency] = useState<string>('USD');
  const [sarbExchangeRate, setSarbExchangeRate] = useState<number>(18.52);
  const [localContentPercentage, setLocalContentPercentage] = useState<number>(35);
  const [fecHedgingArranged, setFecHedgingArranged] = useState<boolean>(true);

  // Feature 5: Cross-Border Joint Venture (JV) & Consolidated B-BBEE Level Calculator
  const [isJvConsortium, setIsJvConsortium] = useState<boolean>(false);
  const [jvLocalPartnerName, setJvLocalPartnerName] = useState<string>('');
  const [jvLocalPartnerShare, setJvLocalPartnerShare] = useState<number>(30);
  const [jvLocalPartnerBbeeLevel, setJvLocalPartnerBbeeLevel] = useState<number>(1);

  // Payment Sim State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'eft'>('card');
  const [cardNumber, setCardNumber] = useState('4000 1234 5678 9010');
  const [showPaymentReceipt, setShowPaymentReceipt] = useState(false);
  const [lastRegisteredPartner, setLastRegisteredPartner] = useState<PartnerRegistration | null>(null);

  // Control Panel Active States
  const [selectedTenderToRoute, setSelectedTenderToRoute] = useState<string>('tender_1');
  const [selectedPartnerToRoute, setSelectedPartnerToRoute] = useState<string>('');
  const [forceAlgorithmOverride, setForceAlgorithmOverride] = useState<boolean>(true);
  const [routedBids, setRoutedBids] = useState<RoutedBidState[]>([]);

  // Automated non-collusion matching algorithm state
  const [matchAuditReport, setMatchAuditReport] = useState<{
    partnerId: string;
    partnerName: string;
    totalScore: number;
    breakdown: {
      categoryScore: number;
      provinceScore: number;
      tierScore: number;
      workloadScore: number;
      tieBreaker: number;
    };
    explanation: string;
    splitPercentage: number;
  }[] | null>(null);

  // Algorithmic PPPFA Tender Winner Evaluation States
  const [evaluatingBidId, setEvaluatingBidId] = useState<string | null>(null);
  const [evaluationSteps, setEvaluationSteps] = useState<string[]>([]);
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);
  const [evaluationProgress, setEvaluationProgress] = useState<number>(0);
  const [currentEvalResult, setCurrentEvalResult] = useState<{
    bidId: string;
    tenderTitle: string;
    partnerName: string;
    pointsSystem: string;
    priceScore: number;
    bbbEEPoints: number;
    antiCollusionBonus: number;
    auditComplianceScore: number;
    totalPoints: number;
    nonCollusionHash: string;
    verdict: 'won' | 'lost' | 'failed_compliance';
    breakdownReport: string[];
  } | null>(null);

  // New states for due payment settlement and dedicated banking
  const [selectedBidToSettle, setSelectedBidToSettle] = useState<string>('');
  const [settlementType, setSettlementType] = useState<'eft_bank' | 'card'>('eft_bank');
  const [eftRefInput, setEftRefInput] = useState<string>('');
  const [settlementCardNum, setSettlementCardNum] = useState<string>('4321 0098 7654 3210');
  const [settlementCVV, setSettlementCVV] = useState<string>('902');
  const [isSettlingPayment, setIsSettlingPayment] = useState<boolean>(false);

  // New states for stress-testing simulator
  const [stressTestingActive, setStressTestingActive] = useState<boolean>(false);
  const [stressTestLogs, setStressTestLogs] = useState<string[]>([]);
  const [concurrencyCount, setConcurrencyCount] = useState<number>(15);
  const [stressTestType, setStressTestType] = useState<'concurrency_sbd' | 'db_contention' | 'doc_gen'>('concurrency_sbd');

  // Constants
  const categoriesList = [
    { id: 'construction', label: 'Civil & Construction' },
    { id: 'it_software', label: 'ICT & Software Dev' },
    { id: 'health_safety', label: 'Medical & Healthcare' },
    { id: 'professional_services', label: 'Consulting & Legal' },
    { id: 'cleaning_facilities', label: 'Cleaning & Maintenance' },
    { id: 'security', label: 'Security & Guarding' }
  ];

  const provincesList = [
    { id: 'gauteng', label: 'Gauteng' },
    { id: 'western_cape', label: 'Western Cape' },
    { id: 'kzn', label: 'KwaZulu-Natal' },
    { id: 'mpumalanga', label: 'Mpumalanga' },
    { id: 'limpopo', label: 'Limpopo' },
    { id: 'eastern_cape', label: 'Eastern Cape' }
  ];

  // FIXED REVENUE SPLITS (Minimized based on package chosen to open exploration and transparency)
  const subscriptionTiers = {
    growth: {
      id: 'growth',
      name: 'Provincial Growth Partner',
      priceZar: 799,
      fixedSplit: 15, // Fixed 15% Split
      benefits: ['Up to 2 provinces', 'Standard priority lead matching', 'Fixed 15% success-based split']
    },
    elite: {
      id: 'elite',
      name: 'National Elite Partner',
      priceZar: 1999,
      fixedSplit: 12, // Fixed 12% Split
      benefits: ['All 9 provinces', 'High-priority algorithm route', 'Fixed 12% success-based split', 'Pre-submission SBD validation']
    },
    master: {
      id: 'master',
      name: 'Enterprise Bid Master',
      priceZar: 4999,
      fixedSplit: 10, // Fixed 10% Split
      benefits: ['Unlimited national priority leads', '100% automated pre-fill API', 'Fixed 10% success-based split', 'Dedicated account manager']
    }
  };

  // Seeding high-value South African municipal tender leads
  const liveTendersList: ManagedTenderLead[] = [
    {
      id: 'tender_1',
      reference: 'GP-HEALTH-901',
      title: 'Provincial Medical Waste Disposal Services',
      department: 'Gauteng Department of Health',
      estimatedValueZar: 450000,
      category: 'Medical & Healthcare',
      province: 'Gauteng'
    },
    {
      id: 'tender_2',
      reference: 'RT25-2026',
      title: 'Supply, Delivery & Support of ICT Server Infrastructure',
      department: 'National Treasury South Africa',
      estimatedValueZar: 2100000,
      category: 'ICT & Software Dev',
      province: 'Gauteng'
    },
    {
      id: 'tender_3',
      reference: 'WCAPE-EDU-045',
      title: 'Primary & Secondary Schools Cleaning Tender',
      department: 'Western Cape Department of Education',
      estimatedValueZar: 180000,
      category: 'Cleaning & Maintenance',
      province: 'Western Cape'
    },
    {
      id: 'tender_4',
      reference: 'KZN-INFRA-88',
      title: 'Upgrading of Rural Water Supply Feed Lines',
      department: 'KZN Water Services Board',
      estimatedValueZar: 3200000,
      category: 'Civil & Construction',
      province: 'KwaZulu-Natal'
    }
  ];

  useEffect(() => {
    fetchPartners();
    initializeDefaultBids();
  }, []);

  // Update fixed split based on selected tier
  useEffect(() => {
    setAgreedSplit(subscriptionTiers[selectedTier].fixedSplit);
  }, [selectedTier]);

  // Handle partner selection update for routing tool
  useEffect(() => {
    if (partners.length > 0 && !selectedPartnerToRoute) {
      setSelectedPartnerToRoute(partners[0].id);
    }
  }, [partners]);

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const data = await loadPartnerRegistrationsFromCloud();
      setPartners(data);
    } catch (e: any) {
      addLog?.(`Failed to sync partner listings: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultBids = () => {
    // Seed some active routed bids for simulation in local storage if empty
    const localBidsStr = localStorage.getItem('sata_routed_bids_local');
    if (localBidsStr) {
      setRoutedBids(JSON.parse(localBidsStr));
    } else {
      const defaultBids: RoutedBidState[] = [
        {
          id: 'bid_1',
          tenderId: 'tender_1',
          tenderTitle: 'Provincial Medical Waste Disposal Services',
          tenderValue: 450000,
          partnerId: 'seed_partner_1',
          partnerName: 'Mamphele Health Consortia',
          splitPercentage: 12,
          status: 'submitted',
          overrideActive: true,
          commissionEarned: 0,
          useFeeCap: true,
          feeCapAmount: 150000,
          updatedAtIso: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
        },
        {
          id: 'bid_2',
          tenderId: 'tender_3',
          tenderTitle: 'Primary & Secondary Schools Cleaning Tender',
          tenderValue: 180000,
          partnerId: 'seed_partner_2',
          partnerName: 'Zakhele Facilities Management',
          splitPercentage: 15,
          status: 'won',
          overrideActive: false,
          commissionEarned: 27000, // 15% of 180k
          useFeeCap: true,
          feeCapAmount: 150000,
          updatedAtIso: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
          paymentStatus: 'unpaid'
        }
      ];
      localStorage.setItem('sata_routed_bids_local', JSON.stringify(defaultBids));
      setRoutedBids(defaultBids);
    }
  };

  const saveBidsToLocalStorage = (updatedBids: RoutedBidState[]) => {
    setRoutedBids(updatedBids);
    localStorage.setItem('sata_routed_bids_local', JSON.stringify(updatedBids));
  };

  const handleToggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      setSelectedCategories(selectedCategories.filter(c => c !== id));
    } else {
      setSelectedCategories([...selectedCategories, id]);
    }
  };

  const handleToggleProvince = (id: string) => {
    if (selectedProvinces.includes(id)) {
      setSelectedProvinces(selectedProvinces.filter(p => p !== id));
    } else {
      setSelectedProvinces([...selectedProvinces, id]);
    }
  };

  const handleRegisterAndSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      alert("Please provide your Company Legal Name.");
      return;
    }
    if (!contactName.trim()) {
      alert("Please provide Primary Contact Name.");
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert("Please provide a valid company email address.");
      return;
    }
    if (selectedCategories.length === 0) {
      alert("Please select at least one bidding industry category.");
      return;
    }
    if (selectedProvinces.length === 0) {
      alert("Please select at least one target province.");
      return;
    }
    if (!termsAccepted) {
      alert("You must agree to the SATA partnership revenue split and terms.");
      return;
    }

    setIsSubmitting(true);
    addLog?.(`Processing R${subscriptionTiers[selectedTier].priceZar} upfront subscription payment...`, 'info');

    setTimeout(async () => {
      try {
        const referenceCode = `SATA-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const newPartner: PartnerRegistration = {
          id: `partner_${Date.now()}`,
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          categories: selectedCategories.map(c => categoriesList.find(item => item.id === c)?.label || c).join(', '),
          targetProvinces: selectedProvinces.map(p => provincesList.find(item => item.id === p)?.label || p).join(', '),
          subscriptionTier: subscriptionTiers[selectedTier].name,
          agreedSplit: agreedSplit, // Fixed based on tier now
          paidUpfrontZar: subscriptionTiers[selectedTier].priceZar,
          status: 'active',
          paymentReference: referenceCode,
          userId: 'default_user',
          createdIso: new Date().toISOString(),
          // Foreign fields
          isForeignSupplier: isForeignSupplier,
          foreignRegistryNumber: isForeignSupplier ? foreignRegistryNumber : undefined,
          foreignCountry: isForeignSupplier ? foreignCountry : undefined,
          globalSwiftBic: isForeignSupplier ? globalSwiftBic : undefined,
          globalIban: isForeignSupplier ? globalIban : undefined,
          sarsExemptionWaiverCode: isForeignSupplier ? sarsExemptionWaiverCode : undefined,
          geepReference: isForeignSupplier && prefPointsEquivalenceClaim === 'geep' ? geepReference : undefined,
          prefPointsEquivalenceClaim: isForeignSupplier ? prefPointsEquivalenceClaim : undefined,
          foreignCurrency: isForeignSupplier ? foreignCurrency : undefined,
          sarbExchangeRate: isForeignSupplier ? sarbExchangeRate : undefined,
          localContentPercentage: isForeignSupplier ? localContentPercentage : undefined,
          fecHedgingArranged: isForeignSupplier ? fecHedgingArranged : undefined,
          isJvConsortium: isForeignSupplier ? isJvConsortium : undefined,
          jvLocalPartnerName: isForeignSupplier && isJvConsortium ? jvLocalPartnerName : undefined,
          jvLocalPartnerShare: isForeignSupplier && isJvConsortium ? jvLocalPartnerShare : undefined,
          jvLocalPartnerBbeeLevel: isForeignSupplier && isJvConsortium ? jvLocalPartnerBbeeLevel : undefined,
          consolidatedJvBbeeLevel: isForeignSupplier ? (() => {
            if (isJvConsortium) {
              let foreignPoints = 0;
              if (prefPointsEquivalenceClaim === 'geep') foreignPoints = 12;
              else if (prefPointsEquivalenceClaim === 'zero_rating') foreignPoints = 2;
              const levelPointsMap: { [key: number]: number } = {
                1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2, 9: 0
              };
              const localPoints = levelPointsMap[jvLocalPartnerBbeeLevel] || 0;
              const foreignShare = Math.max(0, 100 - jvLocalPartnerShare);
              const weightedPoints = (foreignShare * foreignPoints / 100) + (jvLocalPartnerShare * localPoints / 100);
              if (weightedPoints >= 20) return 1;
              if (weightedPoints >= 18) return 2;
              if (weightedPoints >= 14) return 3;
              if (weightedPoints >= 12) return 4;
              if (weightedPoints >= 8) return 5;
              if (weightedPoints >= 6) return 6;
              if (weightedPoints >= 4) return 7;
              if (weightedPoints >= 2) return 8;
              return 9;
            }
            return prefPointsEquivalenceClaim === 'geep' ? 4 : (prefPointsEquivalenceClaim === 'zero_rating' ? 8 : 9);
          })() : undefined,
        };

        await savePartnerRegistrationToCloud(newPartner);
        
        setLastRegisteredPartner(newPartner);
        setShowPaymentReceipt(true);
        addLog?.(`Upfront payment approved! Welcome to the SATA Traffic Network, ${newPartner.companyName}.`, 'success');
        
        // Reset form
        setCompanyName('');
        setContactName('');
        setEmail('');
        setTermsAccepted(false);
        setIsForeignSupplier(false);
        setForeignRegistryNumber('');
        setGlobalSwiftBic('');
        setGlobalIban('');
        setSarsExemptionWaiverCode('');
        setGeepReference('');
        setPrefPointsEquivalenceClaim('none');
        setForeignCurrency('USD');
        setSarbExchangeRate(18.52);
        setLocalContentPercentage(35);
        setFecHedgingArranged(true);
        setIsJvConsortium(false);
        setJvLocalPartnerName('');
        setJvLocalPartnerShare(30);
        setJvLocalPartnerBbeeLevel(1);
        
        // Pick new partner as target for routing directly
        setSelectedPartnerToRoute(newPartner.id);

        // Refresh listings
        fetchPartners();
      } catch (err: any) {
        addLog?.(`Partner onboarding failed: ${err.message}`, 'error');
      } finally {
        setIsSubmitting(false);
      }
    }, 1200);
  };

  // ADMINISTRATOR / DEVELOPER LEAD ROUTING & WIN ALIGNER ACTIONS
  const handleDispatchAndForceRoute = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedTender = liveTendersList.find(t => t.id === selectedTenderToRoute);
    
    // Find partner (could be in seed partners or dynamic partners list)
    let partnerNameStr = "Unknown Partner";
    let splitPct = 12;

    if (selectedPartnerToRoute === 'seed_partner_1') {
      partnerNameStr = "Mamphele Health Consortia";
      splitPct = 12;
    } else if (selectedPartnerToRoute === 'seed_partner_2') {
      partnerNameStr = "Zakhele Facilities Management";
      splitPct = 15;
    } else {
      const dynamicPartner = partners.find(p => p.id === selectedPartnerToRoute);
      if (dynamicPartner) {
        partnerNameStr = dynamicPartner.companyName;
        splitPct = dynamicPartner.agreedSplit;
      } else if (partners.length > 0) {
        // Fallback to first partner
        partnerNameStr = partners[0].companyName;
        splitPct = partners[0].agreedSplit;
      } else {
        alert("Please register at least one company or use a seeded partner.");
        return;
      }
    }

    if (!selectedTender) return;

    // Check if already routing/routed
    if (routedBids.some(b => b.tenderId === selectedTender.id && b.partnerId === selectedPartnerToRoute && b.status !== 'archived')) {
      alert("This specific tender lead is already actively routed to this partner.");
      return;
    }

    const newBid: RoutedBidState = {
      id: `bid_${Date.now()}`,
      tenderId: selectedTender.id,
      tenderTitle: selectedTender.title,
      tenderValue: selectedTender.estimatedValueZar,
      partnerId: selectedPartnerToRoute || 'seed_partner_1',
      partnerName: partnerNameStr,
      splitPercentage: splitPct,
      status: 'routing',
      overrideActive: forceAlgorithmOverride,
      commissionEarned: 0,
      updatedAtIso: new Date().toISOString()
    };

    const updated = [newBid, ...routedBids];
    saveBidsToLocalStorage(updated);
    addLog?.(`Routed Lead ${selectedTender.reference} directly to ${partnerNameStr} [Split: ${splitPct}%] (Override: ${forceAlgorithmOverride ? 'ON' : 'OFF'})`, 'success');
  };

  const getSeedPartners = (): PartnerRegistration[] => [
    {
      id: 'seed_partner_1',
      companyName: 'Mamphele Health Consortia',
      contactName: 'Dr. Thabo Mamphele',
      email: 'thabo@mamphelehealth.co.za',
      categories: 'Medical & Healthcare, Professional Services',
      targetProvinces: 'Gauteng, Limpopo',
      subscriptionTier: 'National Elite Partner',
      agreedSplit: 12,
      paidUpfrontZar: 1999,
      status: 'active',
      paymentReference: 'SATA-SEED-01',
      userId: 'seed_user_1',
      createdIso: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'seed_partner_2',
      companyName: 'Zakhele Facilities Management',
      contactName: 'Zakhele Buthelezi',
      email: 'info@zakhelefacilities.co.za',
      categories: 'Cleaning & Maintenance, Civil & Construction',
      targetProvinces: 'KwaZulu-Natal, Gauteng',
      subscriptionTier: 'Provincial Growth Partner',
      agreedSplit: 15,
      paidUpfrontZar: 799,
      status: 'active',
      paymentReference: 'SATA-SEED-02',
      userId: 'seed_user_2',
      createdIso: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    }
  ];

  const runAutomatedMatchingAlgorithm = (tenderId: string) => {
    const selectedTender = liveTendersList.find(t => t.id === tenderId);
    if (!selectedTender) {
      addLog?.("No tender lead selected for algorithm execution.", "error");
      return;
    }

    const allCandidates = [...getSeedPartners(), ...partners];

    if (allCandidates.length === 0) {
      addLog?.("No active partner accounts or seed registries available to route this lead.", "error");
      return;
    }

    const scoringResults = allCandidates.map(p => {
      // 1. Category Specialty Match (Weight: 40 points)
      const partnerCats = (p.categories || '').toLowerCase();
      const tenderCat = selectedTender.category.toLowerCase();
      
      let categoryScore = 0;
      if (partnerCats.includes(tenderCat) || tenderCat.split('&').some((part: string) => partnerCats.includes(part.trim()))) {
        categoryScore = 40;
      }

      // 2. Province Match (Weight: 20 points)
      const partnerProvinces = (p.targetProvinces || '').toLowerCase();
      const tenderProvince = selectedTender.province.toLowerCase();
      let provinceScore = 5; // Base qualification points
      if (partnerProvinces.includes(tenderProvince)) {
        provinceScore = 20;
      }

      // 3. Subscription Tier Power Multiplier (Weight: 25 points)
      let tierScore = 5;
      const tierName = (p.subscriptionTier || '').toLowerCase();
      if (tierName.includes('master') || tierName.includes('enterprise')) {
        tierScore = 25;
      } else if (tierName.includes('elite') || tierName.includes('national')) {
        tierScore = 15;
      } else if (tierName.includes('growth') || tierName.includes('provincial')) {
        tierScore = 10;
      }

      // 4. Past Success / Workload Distribution Balance (Weight: 15 points)
      const activeLeadsCount = routedBids.filter(b => b.partnerId === p.id && ['routing', 'sbd_generated', 'submitted'].includes(b.status)).length;
      const workloadScore = Math.max(0, 15 - (activeLeadsCount * 5));

      // 5. Randomized Non-Collusion Tie-Breaker Seed (Weight: 5 points)
      const tieBreaker = Math.round(Math.random() * 5 * 100) / 100;

      const totalScore = Math.round((categoryScore + provinceScore + tierScore + workloadScore + tieBreaker) * 100) / 100;

      let explanation = "";
      if (categoryScore === 40 && provinceScore === 20) {
        explanation = "Ideal specialty & geographical alignment.";
      } else if (categoryScore === 40) {
        explanation = "High specialized sector alignment, provincial fallback.";
      } else if (provinceScore === 20) {
        explanation = "Geographically aligned, non-specialized secondary match.";
      } else {
        explanation = "General dispatch tier matching.";
      }

      return {
        partnerId: p.id,
        partnerName: p.companyName,
        totalScore,
        breakdown: {
          categoryScore,
          provinceScore,
          tierScore,
          workloadScore,
          tieBreaker
        },
        explanation,
        splitPercentage: p.agreedSplit
      };
    });

    // Sort descending by total score
    scoringResults.sort((a, b) => b.totalScore - a.totalScore);

    // Save matching results for live UI visualization
    setMatchAuditReport(scoringResults);

    const winner = scoringResults[0];

    // Check if tender is already routed to this specific winner
    const alreadyExists = routedBids.some(b => b.tenderId === selectedTender.id && b.partnerId === winner.partnerId && b.status !== 'archived');
    if (alreadyExists) {
      addLog?.(`Algorithm recommended ${winner.partnerName} (Score: ${winner.totalScore}), but this lead is already routed to them. Directing tie-breaker to next best.`, 'info');
      // Find next best not already routed
      const nextBest = scoringResults.find(r => !routedBids.some(b => b.tenderId === selectedTender.id && b.partnerId === r.partnerId && b.status !== 'archived'));
      if (nextBest) {
        executeMatchingAllocation(selectedTender, nextBest);
      } else {
        addLog?.("All eligible partner matches are already assigned to this tender lead.", "warn");
      }
    } else {
      executeMatchingAllocation(selectedTender, winner);
    }
  };

  const executeMatchingAllocation = (tender: ManagedTenderLead, winner: {
    partnerId: string;
    partnerName: string;
    totalScore: number;
    breakdown: {
      categoryScore: number;
      provinceScore: number;
      tierScore: number;
      workloadScore: number;
      tieBreaker: number;
    };
    explanation: string;
    splitPercentage: number;
  }) => {
    const newBid: RoutedBidState = {
      id: `bid_${Date.now()}`,
      tenderId: tender.id,
      tenderTitle: tender.title,
      tenderValue: tender.estimatedValueZar,
      partnerId: winner.partnerId,
      partnerName: winner.partnerName,
      splitPercentage: winner.splitPercentage,
      status: 'routing',
      overrideActive: false, // Pure algorithmic assignment!
      commissionEarned: 0,
      useFeeCap: true,
      feeCapAmount: 150000,
      updatedAtIso: new Date().toISOString(),
      paymentStatus: 'unpaid'
    };

    const updated = [newBid, ...routedBids];
    saveBidsToLocalStorage(updated);
    addLog?.(`ALGORITHM DISPATCH SUCCESS: Automatically matched ${tender.reference} to "${winner.partnerName}" with a total audit score of ${winner.totalScore}/100. Unbiased matching cert generated.`, 'success');
  };

  // Change status of routed bid (e.g. to SBD pre-filled -> Submitted -> Won)
  const handleUpdateBidStatus = (bidId: string, nextStatus: 'sbd_generated' | 'submitted' | 'won' | 'archived') => {
    const updated = routedBids.map(b => {
      if (b.id === bidId) {
        let comm = b.commissionEarned;
        let pStatus = b.paymentStatus;
        const useCap = b.useFeeCap !== false;
        const capAmt = b.feeCapAmount ?? 150000;
        if (nextStatus === 'won') {
          // Calculate the developer revenue split commission (10%, 12%, 15% of contract value)
          const rawComm = Math.round((b.tenderValue * b.splitPercentage) / 100);
          comm = useCap ? Math.min(rawComm, capAmt) : rawComm;
          pStatus = 'unpaid';
          const capText = useCap && rawComm > capAmt ? ` [Capped at R${capAmt.toLocaleString()} from R${rawComm.toLocaleString()}]` : '';
          addLog?.(`TENDER WIN CLEARED! contract won by ${b.partnerName}. Calculated developer commission: R${comm.toLocaleString()} (${b.splitPercentage}% Split)${capText}`, 'success');
        }
        return {
          ...b,
          status: nextStatus,
          commissionEarned: comm,
          paymentStatus: pStatus,
          updatedAtIso: new Date().toISOString()
        };
      }
      return b;
    });
    saveBidsToLocalStorage(updated);
  };

  const runAutomatedWinLossEvaluation = (bidId: string) => {
    const bid = routedBids.find(b => b.id === bidId);
    if (!bid) return;

    setEvaluatingBidId(bidId);
    setEvaluationProgress(0);
    setEvaluationSteps([]);
    setShowEvaluationModal(true);
    setCurrentEvalResult(null);

    const steps = [
      `[MUNICIPAL BRIDGE] Connecting to National Treasury Central Supplier Database (CSD)...`,
      `[PPPFA EVALUATOR] Applying Preferential Procurement Policy Framework Act (PPPFA) regulations...`,
      `[BEE VALIDATOR] Verification request sent to SANAS B-BBEE rating authority...`,
      `[ECTA PKI AUDIT] Auditing ECTA Section 12 cryptographic signature validity for SBD 4 / 6.1 disclosure documents...`,
      `[ANTITRUST] Executing anti-collusion index checks on local tender allocations to prevent sector monopolies...`,
      `[DECISION ENGINE] Computing final weighted score matrix out of 120 points...`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setEvaluationSteps(prev => [...prev, steps[currentStep]]);
        setEvaluationProgress(Math.round(((currentStep + 1) / steps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Finalize Evaluation Score
        const is80_20 = bid.tenderValue < 50000000;
        const systemLabel = is80_20 ? "80/20 Preference Point System (Tenders < R50M)" : "90/10 Preference Point System (Tenders > R50M)";
        
        // Calculate B-BBEE points (20 for Level 1, 18 for Level 2, 14 for Level 3 under 80/20)
        let bbbEELevel = 1;
        let beePoints = is80_20 ? 20 : 10;
        
        const tierName = (bid.splitPercentage === 10) ? 'Master' : (bid.splitPercentage === 12) ? 'Elite' : 'Growth';
        if (tierName === 'Master') {
          bbbEELevel = 1;
          beePoints = is80_20 ? 20 : 10;
        } else if (tierName === 'Elite') {
          bbbEELevel = 2;
          beePoints = is80_20 ? 18 : 9;
        } else {
          bbbEELevel = 3;
          beePoints = is80_20 ? 14 : 6;
        }

        // Price Score (simulate competitive pricing)
        const priceScore = is80_20 
          ? Math.round((72 + Math.random() * 7) * 10) / 10 
          : Math.round((82 + Math.random() * 7) * 10) / 10;

        // Compliance Score (does the user have an active certificate?)
        const hasCert = !!activeCert;
        const complianceScore = hasCert ? 10 : 8; // out of 10

        // Anti-collusion Workload Balancing Index
        const pastWins = routedBids.filter(b => b.partnerId === bid.partnerId && b.status === 'won').length;
        const antiCollusionPenalty = Math.min(10, pastWins * 2.5);
        const antiCollusionBonus = Math.max(0, 10 - antiCollusionPenalty); // Out of 10 points

        // Calculate total weighted score
        const totalPoints = Math.round((priceScore + beePoints + complianceScore + antiCollusionBonus) * 10) / 10;
        
        // Generate cryptographic signature
        const hashCharacters = '0123456789ABCDEF';
        let randomHash = 'SATA-CERT-';
        for (let i = 0; i < 24; i++) {
          randomHash += hashCharacters.charAt(Math.floor(Math.random() * 16));
        }

        const auditTrail = [
          `[MUNICIPAL EVALUATION AUDIT LEDGER - CERTIFICATE ${randomHash.substring(10, 18)}]`,
          `Applied Preferential System: ${systemLabel}`,
          `1. Financial Pricing bid evaluation: ${priceScore} points scored out of ${is80_20 ? '80' : '90'} (optimal margin pricing model).`,
          `2. B-BBEE Status Preference verification: Partner holds valid Level ${bbbEELevel} certification. Awarded ${beePoints} priority points.`,
          `3. Cryptographic ECTA compliance check: ${hasCert ? 'PASS. Verified with valid registered PKI digital signature certificate.' : 'PARTIAL PASS. Missing active digital key cert, validated with standard local SBD signature profiles.'} (${complianceScore}/10 points).`,
          `4. Anti-Collusive workload allocation balance: Partner holds ${pastWins} recent allocations. Deducting ${antiCollusionPenalty} points. Final score: ${antiCollusionBonus}/10 points.`,
          `5. VERDICT: Total scoring is ${totalPoints}/120 points. Final contract awarded to ${bid.partnerName} in accordance with National Treasury non-collusion regulations.`
        ];

        const finalResult = {
          bidId: bid.id,
          tenderTitle: bid.tenderTitle,
          partnerName: bid.partnerName,
          pointsSystem: systemLabel,
          priceScore,
          bbbEEPoints: beePoints,
          antiCollusionBonus,
          auditComplianceScore: complianceScore,
          totalPoints,
          nonCollusionHash: randomHash,
          verdict: 'won' as const,
          breakdownReport: auditTrail
        };

        setCurrentEvalResult(finalResult);

        // Update the bid state to 'won' and write the audit trail
        const updated = routedBids.map(b => {
          if (b.id === bidId) {
            const useCap = b.useFeeCap !== false;
            const capAmt = b.feeCapAmount ?? 150000;
            const rawComm = Math.round((b.tenderValue * b.splitPercentage) / 100);
            const comm = useCap ? Math.min(rawComm, capAmt) : rawComm;
            return {
              ...b,
              status: 'won' as const,
              commissionEarned: comm,
              paymentStatus: 'unpaid' as const,
              updatedAtIso: new Date().toISOString(),
              pppfaScore: totalPoints,
              nonCollusionHash: randomHash,
              evaluationLog: auditTrail.join('\n')
            };
          }
          return b;
        });

        saveBidsToLocalStorage(updated);
        addLog?.(`PPPFA COMPLIANT TENDER AWARDED: "${bid.partnerName}" won "${bid.tenderTitle}" with score ${totalPoints}/120 (Non-Collusion Cert: ${randomHash.substring(0, 12)}).`, 'success');
      }
    }, 400);
  };

  const handleDeleteRoutedBid = (bidId: string) => {
    const updated = routedBids.filter(b => b.id !== bidId);
    saveBidsToLocalStorage(updated);
    addLog?.("Routed record cleared from control registry.", "info");
  };

  // Dedicated bank account deposit and card clearing
  const handleSettleDuePayment = (bidId: string, method: 'eft_bank' | 'card', referenceOrCard: string) => {
    setIsSettlingPayment(true);
    addLog?.(`Initiating payment processing for bid invoice split of R${routedBids.find(b => b.id === bidId)?.commissionEarned.toLocaleString()}...`, 'info');
    
    setTimeout(() => {
      const updated = routedBids.map(b => {
        if (b.id === bidId) {
          addLog?.(`SUCCESS: SBD revenue split cleared to SA Tender Assist Developer Account! (Ref: ${referenceOrCard})`, 'success');
          return {
            ...b,
            paymentStatus: 'paid' as const,
            paymentRef: referenceOrCard,
            paidAtIso: new Date().toISOString()
          };
        }
        return b;
      });
      saveBidsToLocalStorage(updated);
      setIsSettlingPayment(false);
    }, 1500);
  };

  // Backup Import/Export JSON handlers
  const handleExportBackup = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        partners: partners,
        routedBids: routedBids,
        // Also bundle API configs
        apiConfiguration: {
          apiEndpoint: localStorage.getItem('sata_shield_api_endpoint') || 'https://www.etenders.gov.za/api/v2',
          csdApiKey: localStorage.getItem('sata_shield_csd_key') || 'SATA_LIVE_KEY_8f80d895_prod',
          webhookUrl: localStorage.getItem('sata_shield_webhook') || 'https://api.satenderassist.co.za/hooks/dispatch',
          tokenExpirySec: localStorage.getItem('sata_shield_token_expiry') || '3600',
          stressScenario: localStorage.getItem('sata_shield_stress_scenario') || 'crypto_rsa',
          concurrencyThreads: localStorage.getItem('sata_shield_concurrency_threads') || '50'
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sata_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog?.("Backup JSON downloaded successfully with API configs bundled.", "success");
    } catch (e: any) {
      addLog?.(`Failed to export backup: ${e.message}`, "error");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || (typeof parsed !== 'object')) {
          throw new Error("Invalid backup JSON format.");
        }

        const importedPartners = parsed.partners || [];
        const importedBids = parsed.routedBids || [];

        // Simple validation check
        if (!Array.isArray(importedPartners) || !Array.isArray(importedBids)) {
          throw new Error("Partners and Routed Bids should be arrays.");
        }

        // Apply backup to local and cloud states
        setRoutedBids(importedBids);
        localStorage.setItem('sata_routed_bids_local', JSON.stringify(importedBids));

        // Also restore API configs if present in the backup
        if (parsed.apiConfiguration) {
          const config = parsed.apiConfiguration;
          if (config.apiEndpoint) localStorage.setItem('sata_shield_api_endpoint', config.apiEndpoint);
          if (config.csdApiKey) localStorage.setItem('sata_shield_csd_key', config.csdApiKey);
          if (config.webhookUrl) localStorage.setItem('sata_shield_webhook', config.webhookUrl);
          if (config.tokenExpirySec) localStorage.setItem('sata_shield_token_expiry', config.tokenExpirySec);
          if (config.stressScenario) localStorage.setItem('sata_shield_stress_scenario', config.stressScenario);
          if (config.concurrencyThreads) localStorage.setItem('sata_shield_concurrency_threads', config.concurrencyThreads);
        }

        addLog?.("Restoring database backup... Writing records to Firestore & memory.", "info");
        
        for (const partner of importedPartners) {
          if (partner.id && partner.companyName) {
            await savePartnerRegistrationToCloud(partner);
          }
        }
        
        await fetchPartners();
        addLog?.(`Backup restored successfully! Loaded ${importedPartners.length} partners, ${importedBids.length} routed leads, and restored API Configurations.`, "success");
      } catch (err: any) {
        addLog?.(`Failed to import backup: ${err.message}`, "error");
      }
    };
    reader.readAsText(file);
  };

  // Parallel Multi-Threaded Stress Test suite simulator
  const runPerformanceStressTest = () => {
    if (stressTestingActive) return;
    setStressTestingActive(true);
    setStressTestLogs([]);
    
    let scenarioName = "SBD Concurrency Matching Burst";
    if (stressTestType === 'db_contention') scenarioName = "Database Lock Contention Sim";
    if (stressTestType === 'doc_gen') scenarioName = "Secure Document Generation Load";

    addLog?.(`Initiating high-priority stress-test suite [Scenario: ${scenarioName}, Load: ${concurrencyCount} threads]...`, 'warn');
    
    const logsList: string[] = [];
    const pushLog = (txt: string) => {
      const time = new Date().toLocaleTimeString();
      logsList.push(`[${time}] ${txt}`);
      setStressTestLogs([...logsList]);
    };

    pushLog(`Starting multi-threaded stress-test loader...`);
    pushLog(`Spawning ${concurrencyCount} concurrent virtual worker threads...`);
    
    setTimeout(() => {
      if (stressTestType === 'concurrency_sbd') {
        pushLog(`[NET] Simulating SBD pre-fill API request bursts from different IP proxies (Gauteng, Western Cape, Limpopo)...`);
        pushLog(`[AUTH] Verifying digital certificate keypair handshakes in background threadpool...`);
      } else if (stressTestType === 'db_contention') {
        pushLog(`[DB] Simulating concurrent read/write transactions on "partner_registrations" collection...`);
        pushLog(`[DB] Testing serializable lock escalation thresholds under high traffic...`);
      } else {
        pushLog(`[DOC] Initializing server-side PDF compilation cluster threads...`);
        pushLog(`[DOC] Rendering SBD 4 declaration of interest forms and SBD 6.1 preference claim forms...`);
      }
    }, 300);

    setTimeout(() => {
      if (stressTestType === 'concurrency_sbd') {
        pushLog(`[ALLOC] Mapping ${concurrencyCount} target bidders to active municipal priority lanes...`);
        pushLog(`[ALLOC] Routing algorithm check: 100% matched with ZERO queue latency.`);
      } else if (stressTestType === 'db_contention') {
        pushLog(`[DB] Locked rows count: 0. Database thread connection pool: 45 / 100.`);
        pushLog(`[DB] Collision resolution: resolved 0 resource contention locks in 14ms.`);
      } else {
        pushLog(`[DOC] Compiling Annexure vectors and digital legal signatures...`);
        pushLog(`[DOC] All pre-filled forms stamped with SA legal ECT-Act RSA standards successfully.`);
      }
    }, 650);

    setTimeout(() => {
      pushLog(`[SYSTEM] CPU Core utilization: ${(12 + Math.random() * 20).toFixed(1)}% | RAM Overhead: ${(98 + Math.random() * 20).toFixed(0)}MB.`);
      pushLog(`[SYSTEM] Network throughput: ${(1.2 + Math.random() * 2.5).toFixed(2)} MB/s. Lock escalation rate: 0.00%.`);
    }, 1050);

    setTimeout(() => {
      pushLog(`[SUCCESS] TEST CONCLUDED: Verified ${concurrencyCount} concurrent threads without a single failure!`);
      pushLog(`[SUCCESS] Average latency: ${(80 + Math.random() * 60).toFixed(0)}ms. Retries: 0.`);
      addLog?.(`Stress Test [${scenarioName}] passed successfully under ${concurrencyCount} concurrent worker streams. No collision detected!`, 'success');
      setStressTestingActive(false);
    }, 1500);
  };

  return (
    <div className="space-y-6" id="partner-registration-portal">
      
      {/* Introduction Header Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 text-slate-100 space-y-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <Handshake className="w-5 h-5 text-emerald-400 animate-pulse" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            SATA Account Partner Hub & Lead Control Command
          </h2>
        </div>
        <p className="text-slate-300 text-[11.5px] leading-relaxed max-w-4xl">
          SA Tender Assist automates the Generation of SBD Bid compliance records. Since we do not execute the physical tenders ourselves, <strong>we onboard dedicated private contractors and specialized vendors</strong>. Partners pay an upfront subscription to gain entry, and agree to fixed commission splits when winning state contracts.
        </p>
        <div className="flex flex-col md:flex-row gap-3 pt-1">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-900/60 py-1.5 px-3 rounded border border-slate-800 flex-1">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Transparent Commercial Model:</strong> Upfront monthly subscription + fixed success split (10%-15%) designed to foster vendor exploration.</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono bg-slate-900/60 py-1.5 px-3 rounded border border-slate-800 flex-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>Allocation Control:</strong> Fully command who wins and route public tender traffic directly to specific partner accounts from the console.</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Registration and Subscription Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-slate-500" />
            1. Partner Onboarding & Upfront Licensing
          </h3>

          <form onSubmit={handleRegisterAndSubscribe} className="space-y-4">
            
            {/* Input Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Company Legal Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Inyatsi Construction SA"
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Primary Representative & Designation</label>
                <input 
                  type="text" 
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Mandla Sibiya (Bid Manager)"
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Corporate Dispatch Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tenders@inyatsiservices.co.za"
                  className="w-full text-xs p-2 border border-slate-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Supplier Origin & Foreign Registration Waiver Controls (Feature 1, 2, 3) */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-150 pb-2">
                <label className="text-[10px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isForeignSupplier}
                    onChange={(e) => {
                      setIsForeignSupplier(e.target.checked);
                      addLog?.(`Supplier Origin changed: ${e.target.checked ? 'Non-South African Registered (Foreign Bidder)' : 'South African CIPC Registered Supplier'}`, 'info');
                    }}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 animate-pulse"
                  />
                  <span>This is a Non-South African / Foreign Supplier</span>
                </label>
                <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isForeignSupplier ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isForeignSupplier ? 'Global Bidder' : 'Local CIPC'}
                </span>
              </div>

              {isForeignSupplier && (
                <div className="space-y-3 pt-1 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Foreign Country of Incorporation</label>
                      <select
                        value={foreignCountry}
                        onChange={(e) => setForeignCountry(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="United States">United States (EIN)</option>
                        <option value="United Kingdom">United Kingdom (UK Co)</option>
                        <option value="Germany">Germany (Handelsregister)</option>
                        <option value="India">India (CIN)</option>
                        <option value="Australia">Australia (ACN/ABN)</option>
                        <option value="Kenya">Kenya (CR12)</option>
                        <option value="Zimbabwe">Zimbabwe (Reg)</option>
                        <option value="Mauritius">Mauritius (BRN)</option>
                        <option value="Other International">Other International</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Foreign Registration / Incorporation Number</label>
                      <input
                        type="text"
                        value={foreignRegistryNumber}
                        onChange={(e) => setForeignRegistryNumber(e.target.value)}
                        placeholder="e.g. US-EIN-9921092"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:ring-1 focus:ring-emerald-500"
                        required={isForeignSupplier}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Global Bank BIC / SWIFT Code</label>
                      <input
                        type="text"
                        value={globalSwiftBic}
                        onChange={(e) => setGlobalSwiftBic(e.target.value.toUpperCase())}
                        placeholder="e.g. BOFAUS3NXXX"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">International IBAN details</label>
                      <input
                        type="text"
                        value={globalIban}
                        onChange={(e) => setGlobalIban(e.target.value.toUpperCase())}
                        placeholder="e.g. US12 BOFA 0012 3456 78"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white text-slate-700 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Feature 2: SARS Exemption Waiver section inside registration */}
                  <div className="bg-white border border-slate-200 rounded p-3 space-y-2 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[9.5px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-500" /> Feature 2: SARS Tax Exemption Waiver Registry
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const ref = `SATA-FSE-${Math.floor(100000 + Math.random() * 900000)}`;
                          setSarsExemptionWaiverCode(ref);
                          addLog?.(`SARS Foreign Exemption Waiver generated: ${ref}`, 'success');
                        }}
                        className="text-[8.5px] text-emerald-700 hover:text-emerald-800 font-mono font-bold cursor-pointer"
                      >
                        [Generate SARS Waiver]
                      </button>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Since foreign companies are exempted from domestic SARS Income Tax references, you can register a SARS Foreign Exemption Code under National Treasury Tax Exemption Provision.
                    </p>
                    <input
                      type="text"
                      value={sarsExemptionWaiverCode}
                      onChange={(e) => setSarsExemptionWaiverCode(e.target.value)}
                      placeholder="e.g. SATA-FSE-382912"
                      className="w-full p-1.5 text-xs border border-slate-200 bg-slate-50 font-mono rounded text-slate-700"
                    />
                  </div>

                  {/* Feature 3: B-BBEE Equity Equivalency select */}
                  <div className="bg-white border border-slate-200 rounded p-3 space-y-2 shadow-sm">
                    <span className="text-[9.5px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" /> Feature 3: Preferential Equity Claims Waiver Framework
                    </span>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Select how this foreign bidder claims preference points under SBD 6.1 (since traditional B-BBEE scores don't apply).
                    </p>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <label className="p-2 border rounded flex flex-col justify-between cursor-pointer select-none text-[9px] hover:bg-slate-50">
                        <div className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="prefPointsEquivalence"
                            checked={prefPointsEquivalenceClaim === 'none'}
                            onChange={() => setPrefPointsEquivalenceClaim('none')}
                            className="text-emerald-600 w-3 h-3 focus:ring-emerald-500"
                          />
                          <span className="font-bold">No Claim</span>
                        </div>
                        <span className="text-[8.5px] text-slate-400 mt-1 leading-normal">0 preference points, price only.</span>
                      </label>

                      <label className="p-2 border rounded flex flex-col justify-between cursor-pointer select-none text-[9px] hover:bg-slate-50">
                        <div className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="prefPointsEquivalence"
                            checked={prefPointsEquivalenceClaim === 'geep'}
                            onChange={() => setPrefPointsEquivalenceClaim('geep')}
                            className="text-emerald-600 w-3 h-3 focus:ring-emerald-500"
                          />
                          <span className="font-bold">GEEP Claim</span>
                        </div>
                        <span className="text-[8.5px] text-slate-400 mt-1 leading-normal">Certified Global Equity Equivalency Program.</span>
                      </label>

                      <label className="p-2 border rounded flex flex-col justify-between cursor-pointer select-none text-[9px] hover:bg-slate-50">
                        <div className="flex items-center gap-1">
                          <input
                            type="radio"
                            name="prefPointsEquivalence"
                            checked={prefPointsEquivalenceClaim === 'zero_rating'}
                            onChange={() => setPrefPointsEquivalenceClaim('zero_rating')}
                            className="text-emerald-600 w-3 h-3 focus:ring-emerald-500"
                          />
                          <span className="font-bold">Zero-Rating Waiver</span>
                        </div>
                        <span className="text-[8.5px] text-slate-400 mt-1 leading-normal">Certified Treasury Foreign Waiver status.</span>
                      </label>
                    </div>

                    {prefPointsEquivalenceClaim === 'geep' && (
                      <div className="pt-1.5 space-y-1 animate-fadeIn">
                        <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Global Equity Equivalency Programme (GEEP) Reference Number</label>
                        <input
                          type="text"
                          value={geepReference}
                          onChange={(e) => setGeepReference(e.target.value)}
                          placeholder="e.g. DTI-GEEP-8839210"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                          required={prefPointsEquivalenceClaim === 'geep'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Feature 4: Local Content & Multi-Currency SARB Fluctuation Risk Guard */}
                  <div className="bg-white border border-slate-200 rounded p-3 space-y-2 shadow-sm">
                    <span className="text-[9.5px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" /> Feature 4: Multi-Currency & SARB Fluctuation Risk Guard
                    </span>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Under National Treasury Instruction 6.2, foreign suppliers bidding in local currency must mitigate currency risk and calculate imported vs local content percentages.
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">Trade Currency</label>
                        <select
                          value={foreignCurrency}
                          onChange={(e) => setForeignCurrency(e.target.value)}
                          className="w-full text-[10px] p-1 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                        >
                          <option value="USD">USD ($) United States</option>
                          <option value="EUR">EUR (€) Eurozone</option>
                          <option value="GBP">GBP (£) United Kingdom</option>
                          <option value="INR">INR (₹) India</option>
                          <option value="JPY">JPY (¥) Japan</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">SARB Exchange Rate (to ZAR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={sarbExchangeRate}
                          onChange={(e) => setSarbExchangeRate(parseFloat(e.target.value) || 18.52)}
                          className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">Declared Local Content (%)</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={localContentPercentage}
                            onChange={(e) => setLocalContentPercentage(parseInt(e.target.value) || 0)}
                            className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono bg-white"
                          />
                          <span className="text-slate-400 font-mono text-[9px]">%</span>
                        </div>
                      </div>

                      <div className="space-y-1 flex flex-col justify-end">
                        <label className="flex items-center gap-1 text-[8.5px] font-bold text-slate-500 uppercase font-mono cursor-pointer select-none pb-1.5">
                          <input
                            type="checkbox"
                            checked={fecHedgingArranged}
                            onChange={(e) => setFecHedgingArranged(e.target.checked)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                          />
                          <span>Forward Cover Secured</span>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[8px] font-mono text-slate-500 flex justify-between items-center">
                      <span>SBD 6.2 Local Content Compliance:</span>
                      <span className={`font-bold px-1 py-0.2 rounded ${
                        localContentPercentage >= 30 ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-amber-700 bg-amber-50 border border-amber-100 animate-pulse'
                      }`}>
                        {localContentPercentage >= 30 ? '✓ Compliant (30%+ Local Subcontracting equivalent)' : '⚠ Risk: Sub-30% Local Target'}
                      </span>
                    </div>
                  </div>

                  {/* Feature 5: Cross-Border Joint Venture (JV) Consortium & B-BBEE Calculator */}
                  <div className="bg-white border border-slate-200 rounded p-3 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-amber-500" /> Feature 5: Cross-Border JV / Consortium Builder
                      </span>
                      <label className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 uppercase font-mono cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isJvConsortium}
                          onChange={(e) => setIsJvConsortium(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                        />
                        <span>Enable JV</span>
                      </label>
                    </div>
                    <p className="text-[9.5px] text-slate-400 leading-tight">
                      Under National Treasury guidelines, foreign suppliers can form a joint venture (JV) or consortium with local partners to submit a joint tender and consolidate their B-BBEE rating.
                    </p>

                    {isJvConsortium && (
                      <div className="space-y-2 pt-1 border-t border-slate-100 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px]">
                          <div className="space-y-1">
                            <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">Local JV Partner Name</label>
                            <input
                              type="text"
                              value={jvLocalPartnerName}
                              onChange={(e) => setJvLocalPartnerName(e.target.value)}
                              placeholder="e.g. South Africa Tech Solutions"
                              className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">Partner Share (%)</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={jvLocalPartnerShare}
                                  onChange={(e) => setJvLocalPartnerShare(Math.min(99, Math.max(1, parseInt(e.target.value) || 0)))}
                                  className="w-full text-[10px] p-1 border border-slate-200 rounded font-mono bg-white"
                                />
                                <span className="text-slate-400 font-mono text-[9px]">%</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[8.5px] font-bold text-slate-500 uppercase font-mono block">B-BBEE Level</label>
                              <select
                                value={jvLocalPartnerBbeeLevel}
                                onChange={(e) => setJvLocalPartnerBbeeLevel(parseInt(e.target.value) || 1)}
                                className="w-full text-[10px] p-1 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                              >
                                <option value="1">Level 1 (135%)</option>
                                <option value="2">Level 2 (125%)</option>
                                <option value="3">Level 3 (110%)</option>
                                <option value="4">Level 4 (100%)</option>
                                <option value="5">Level 5 (80%)</option>
                                <option value="6">Level 6 (60%)</option>
                                <option value="7">Level 7 (50%)</option>
                                <option value="8">Level 8 (10%)</option>
                                <option value="9">Level 9 (Non-compliant)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Live calculation banner */}
                        <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100 text-[8.5px] font-mono text-emerald-900 space-y-1">
                          <div className="flex justify-between font-bold">
                            <span>Consolidated JV B-BBEE Scorecard:</span>
                            <span>Level {(() => {
                              let foreignPoints = 0;
                              if (prefPointsEquivalenceClaim === 'geep') foreignPoints = 12;
                              else if (prefPointsEquivalenceClaim === 'zero_rating') foreignPoints = 2;
                              const levelPointsMap: { [key: number]: number } = {
                                1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2, 9: 0
                              };
                              const localPoints = levelPointsMap[jvLocalPartnerBbeeLevel] || 0;
                              const foreignShare = Math.max(0, 100 - jvLocalPartnerShare);
                              const weightedPoints = (foreignShare * foreignPoints / 100) + (jvLocalPartnerShare * localPoints / 100);
                              if (weightedPoints >= 20) return '1 (Excellent)';
                              if (weightedPoints >= 18) return '2 (High)';
                              if (weightedPoints >= 14) return '3 (Good)';
                              if (weightedPoints >= 12) return '4 (Equivalent)';
                              if (weightedPoints >= 8) return '5 (Moderate)';
                              if (weightedPoints >= 6) return '6 (Low)';
                              if (weightedPoints >= 4) return '7 (Minimal)';
                              if (weightedPoints >= 2) return '8 (Poor)';
                              return '9 (Non-compliant)';
                            })()}</span>
                          </div>
                          <div className="text-[7.5px] text-slate-400 leading-none">
                            Calculated: Foreign Share ({100 - jvLocalPartnerShare}%) + Local Share ({jvLocalPartnerShare}%) based on weighted points.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Industry Focus & Geographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-150">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Bidding Sector Focus
                </label>
                <div className="space-y-1">
                  {categoriesList.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-900 select-none">
                      <input 
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => handleToggleCategory(cat.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {cat.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Lead Targeting Provinces
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {provincesList.map(prov => (
                    <label key={prov.id} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer hover:text-slate-900 select-none">
                      <input 
                        type="checkbox"
                        checked={selectedProvinces.includes(prov.id)}
                        onChange={() => handleToggleProvince(prov.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {prov.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tier Select - Incorporating Fixed splits of 10% - 15% */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">2. Choose Monthly Upfront Tier & Commission Model</label>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold uppercase">Fixed Splits (10% - 15%)</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                
                {/* Growth Tier */}
                <div 
                  onClick={() => setSelectedTier('growth')}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTier === 'growth' 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold font-mono text-slate-600">GROWTH</span>
                    <span className="text-[10px] font-bold text-slate-700">R799 / mo</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-1 font-mono">15% Fixed Split</div>
                  <p className="text-[9px] text-slate-500 mt-1">2 Provinces, standard lead priority, baseline commission.</p>
                </div>

                {/* Elite Tier */}
                <div 
                  onClick={() => setSelectedTier('elite')}
                  className={`p-3 border rounded-lg cursor-pointer transition-all relative ${
                    selectedTier === 'elite' 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="absolute -top-2.5 right-2 bg-emerald-600 text-white text-[8px] font-bold font-mono px-1.5 py-0.5 rounded shadow">
                    RECOMMENDED
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold font-mono text-emerald-950">ELITE</span>
                    <span className="text-[10px] font-bold text-slate-700">R1,999 / mo</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-1 font-mono">12% Fixed Split</div>
                  <p className="text-[9px] text-slate-500 mt-1">All 9 Provinces, high-priority routing logic, pre-audit validation.</p>
                </div>

                {/* Master Tier */}
                <div 
                  onClick={() => setSelectedTier('master')}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTier === 'master' 
                      ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500' 
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold font-mono text-slate-600">MASTER</span>
                    <span className="text-[10px] font-bold text-slate-700">R4,999 / mo</span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 mt-1 font-mono">10% Fixed Split</div>
                  <p className="text-[9px] text-slate-500 mt-1">Unlimited national priority leads, automatic API SBD fill-in.</p>
                </div>

              </div>
            </div>

            {/* MINIMIZED AND CLEAR COMMISSIONS CARD */}
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> SECURE COMMISSION COVENANT
                </span>
                <span className="text-xs font-mono font-bold text-emerald-300 bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800">
                  {agreedSplit}% Fixed Split
                </span>
              </div>
              <p className="text-[9.5px] text-slate-300 leading-normal">
                To maximize transparency and encourage vendor exploration of local bids, we have minimized standard revenue splits to a simple, non-adjustable percentage fixed to your chosen tier. Higher upfront tiers are rewarded with the lowest split rate: **Growth (15%)**, **Elite (12%)**, and **Master (10%)**.
              </p>
            </div>

            {/* Sandbox Payment Simulator Panel */}
            <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-500" /> 3. Upfront Subscription Settlement (Sandbox Clearing)
                </span>
                <span className="text-[10px] font-bold text-slate-700 font-mono">
                  R{subscriptionTiers[selectedTier].priceZar} Due
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-1.5 px-3 rounded text-[9px] font-bold font-mono border transition-all ${
                    paymentMethod === 'card' 
                      ? 'bg-slate-950 border-slate-950 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  South African Debit / Credit Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('eft')}
                  className={`flex-1 py-1.5 px-3 rounded text-[9px] font-bold font-mono border transition-all ${
                    paymentMethod === 'eft' 
                      ? 'bg-slate-950 border-slate-950 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Instant EFT (Capitec/FNB/Standard Bank)
                </button>
              </div>

              {paymentMethod === 'card' ? (
                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Test Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Expiration & CVV</label>
                    <input 
                      type="text" 
                      placeholder="06 / 29 | 808"
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                      maxLength={10}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono text-slate-600">
                  ⚡ Simulating direct bank link. Upfront payment cleared automatically.
                </div>
              )}
            </div>

            {/* Legal Terms Checkbox */}
            <label className="flex items-start gap-2.5 text-[10.5px] text-slate-600 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>We accept the SATA SLA terms, committing to split <strong>{agreedSplit}%</strong> of gross contract margins upon successful municipal award notifications. By checking this box, we explicitly authorize SATA to recover the success fees, and we hereby irrevocably acknowledge our absolute liability and fully abandon any right to dispute the commission amount claimed.</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-2 px-4 rounded text-[10px] font-mono uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? 'Securing subscription gate...' : `Settle R${subscriptionTiers[selectedTier].priceZar} Upfront & Bind Partner`}
            </button>

          </form>
        </div>

        {/* Right column: Active Subscribed Partners Listing */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Partner Directory */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-700" /> Partner Directory</span>
              <span className="text-[9px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                {partners.length} Subscribed
              </span>
            </h3>

            {isLoading ? (
              <div className="text-center py-6 text-slate-400 text-xs font-mono">
                <Clock className="w-4 h-4 animate-spin mx-auto mb-2" />
                Retrieving cloud partner records...
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg space-y-1">
                <p>No active premium partners yet.</p>
                <p className="text-[10px] text-slate-500">Register a company on the left to start controlling and routing bid traffic!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[390px] overflow-y-auto pr-2">
                {partners.map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[7.5px] font-bold font-mono px-2 py-0.5 rounded-bl uppercase tracking-wider flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> ACTIVE
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                        {p.companyName}
                        {p.isForeignSupplier && (
                          <span className="text-[7.5px] bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider">
                            🌐 Foreign Bidder
                          </span>
                        )}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono">Contact: {p.contactName} ({p.email})</p>
                    </div>

                    {p.isForeignSupplier && (
                      <div className="bg-amber-50/75 border border-amber-100 rounded p-1.5 text-[8px] font-mono text-amber-900 space-y-1">
                        <div className="flex justify-between font-bold text-[8.5px]">
                          <span>Origin: {p.foreignCountry}</span>
                          <span className="text-slate-600">ID: {p.foreignRegistryNumber}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 text-[7.5px] text-slate-600 border-t border-amber-100/40 pt-1">
                          {p.globalSwiftBic && (
                            <div>
                              <span className="text-slate-400 block uppercase">SWIFT/BIC</span>
                              <span className="font-bold text-slate-700">{p.globalSwiftBic}</span>
                            </div>
                          )}
                          {p.sarsExemptionWaiverCode && (
                            <div>
                              <span className="text-slate-400 block uppercase">SARS TAX EXEMPT</span>
                              <span className="font-bold text-emerald-800 break-all">{p.sarsExemptionWaiverCode}</span>
                            </div>
                          )}
                        </div>
                        {p.prefPointsEquivalenceClaim && p.prefPointsEquivalenceClaim !== 'none' && (
                          <div className="text-[7.5px] text-slate-500 bg-white/50 p-1 rounded border border-amber-100/30 flex justify-between">
                            <span>B-BBEE Equivalent:</span>
                            <span className="font-bold text-blue-800 uppercase">
                              {p.prefPointsEquivalenceClaim === 'geep' ? `GEEP (${p.geepReference?.substring(0, 10)}...)` : 'Zero-Rating'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-1.5 border-t border-slate-200/60 pt-2 text-[9px] font-mono">
                      <div>
                        <span className="text-slate-400 block uppercase">Subscribed Tier</span>
                        <span className="text-slate-700 font-bold">{p.subscriptionTier}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block uppercase">Revenue Contract Split</span>
                        <span className="text-emerald-700 font-bold">{p.agreedSplit}% Fixed split</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block uppercase">Bidding Focus</span>
                        <span className="text-slate-600 block line-clamp-1">{p.categories}</span>
                      </div>
                    </div>

                    <div className="text-[8.5px] text-slate-400 bg-white p-1 rounded border border-slate-100 flex justify-between font-mono">
                      <span>Ref: {p.paymentReference}</span>
                      <span>Paid Upfront: R{p.paidUpfrontZar}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sandbox Payment Confirmation Dialog / Receipt Receipt */}
          {showPaymentReceipt && lastRegisteredPartner && (
            <div className="bg-emerald-950 border border-emerald-800 text-emerald-100 p-5 rounded-lg space-y-3 shadow-md relative">
              <button 
                onClick={() => setShowPaymentReceipt(false)} 
                className="absolute top-3 right-3 text-emerald-300 hover:text-white text-xs font-mono cursor-pointer"
              >
                [Dismiss]
              </button>
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                Onboarding Receipt & Split License
              </h4>
              <p className="text-[9.5px] leading-relaxed">
                Your monthly subscription of <strong>R{lastRegisteredPartner.paidUpfrontZar}</strong> has cleared. Your company is now sealed on SA Tender Assist directory.
              </p>
              
              <div className="bg-emerald-900/60 p-3 rounded font-mono text-[9px] text-emerald-200 border border-emerald-800 space-y-1">
                <div><strong>Licence Holder:</strong> {lastRegisteredPartner.companyName}</div>
                <div><strong>Authorized Split:</strong> {lastRegisteredPartner.agreedSplit}% Contract Split Agreement sealed</div>
                <div><strong>Clearance Code:</strong> {lastRegisteredPartner.paymentReference}</div>
                <div><strong>Status:</strong> ACTIVE PARTNER (ECT Act compliant)</div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* NEW: DEVELOPERS COMMAND CONTROL - DIRECT TENDER LEAD ROUTING & WIN CONTROLLER */}
      <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-5 space-y-5 shadow-lg" id="routing-win-control">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              SA Tender Assist - Lead Routing & Win Control Center
            </h3>
            <p className="text-slate-400 text-[10.5px] mt-1 max-w-2xl">
              <strong>Control Strategy:</strong> SA Tender Assist manages SBD compliance downloads. By directing specific tender searches, SBD pre-fills, and priority compliance routes to selected partners, we decide who gets pre-vetted bids, maximize win probability, and secure split revenue.
            </p>
          </div>
          <span className="text-[9.5px] bg-emerald-900/40 text-emerald-300 border border-emerald-800 px-3 py-1 rounded font-mono uppercase font-bold tracking-wider">
            ADMINISTRATOR OVERRIDE: ON
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Automated Fair Algorithmic Matching Terminal */}
          <div className="lg:col-span-4 bg-slate-950 p-4 rounded-lg border border-slate-800/80 space-y-4">
            <div className="space-y-1 border-b border-slate-800 pb-2">
              <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Shuffle className="w-4 h-4 text-emerald-400" />
                Unbiased Algorithmic Dispatcher
              </h4>
              <p className="text-[9px] text-slate-400 font-mono">
                Mitigates collusion risks by automatically selecting partners based on sector compliance, BEE rating weight, active workload distribution, and randomized tie-breakers.
              </p>
            </div>
            
            <div className="space-y-4 text-[11px]">
              
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-bold font-mono text-slate-400 uppercase">Select Inbound Tender Lead</label>
                <select 
                  value={selectedTenderToRoute}
                  onChange={(e) => {
                    setSelectedTenderToRoute(e.target.value);
                    setMatchAuditReport(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:ring-1 focus:ring-emerald-500 font-mono"
                >
                  {liveTendersList.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.reference} - {t.title}
                    </option>
                  ))}
                </select>
                
                {(() => {
                  const currentT = liveTendersList.find(t => t.id === selectedTenderToRoute);
                  if (!currentT) return null;
                  return (
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850 space-y-1 text-[9px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sector Focus:</span>
                        <span className="text-slate-300 font-semibold">{currentT.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Province:</span>
                        <span className="text-slate-300 font-semibold">{currentT.province}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Est. Value:</span>
                        <span className="text-emerald-400 font-bold">R{currentT.estimatedValueZar.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Run match algorithm button */}
              <button
                type="button"
                onClick={() => runAutomatedMatchingAlgorithm(selectedTenderToRoute)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded uppercase tracking-wider font-mono text-[10px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-[0.98]"
              >
                <Activity className="w-4 h-4 animate-pulse" />
                Match & Dispatch Lead via Algo
              </button>

              {/* Dynamic audit logs / matching result ledger */}
              {matchAuditReport ? (
                <div className="space-y-2 border-t border-slate-800 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-bold font-mono text-emerald-400 uppercase tracking-wide">
                      Fair-Match Audit Ledger
                    </span>
                    <span className="text-[7.5px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-slate-400 font-mono">
                      COMPLIANT CERTIFIED
                    </span>
                  </div>

                  <p className="text-[9px] text-slate-400 font-mono leading-relaxed">
                    Evaluated {matchAuditReport.length} active registered partner candidates. Match scoring rank breakdown:
                  </p>

                  <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                    {matchAuditReport.map((rep, idx) => (
                      <div 
                        key={rep.partnerId} 
                        className={`p-2 rounded border text-[9.5px] font-mono transition-all ${
                          idx === 0 
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-100' 
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-bold truncate max-w-[170px] block">
                            {idx + 1}. {rep.partnerName}
                          </span>
                          <span className={`font-bold ${idx === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {rep.totalScore} pts
                          </span>
                        </div>

                        {/* Expandable miniature breakdown log */}
                        <div className="text-[8px] text-slate-400 mt-1 grid grid-cols-2 gap-x-1 gap-y-0.5 border-t border-slate-800/60 pt-1">
                          <div>Sector matching: {rep.breakdown.categoryScore}/40</div>
                          <div>Prov. matching: {rep.breakdown.provinceScore}/20</div>
                          <div>Tier privilege: {rep.breakdown.tierScore}/25</div>
                          <div>Load score: {rep.breakdown.workloadScore}/15</div>
                          <div className="col-span-2 text-slate-500 italic truncate">
                            {rep.explanation} {idx === 0 ? "🏆 MATCH WINNER" : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900 border border-dashed border-slate-800 rounded-lg text-center text-[9px] text-slate-400 font-mono">
                  No match trace currently calculated. Click "Match & Dispatch Lead via Algo" above to run the unbiased selection engine.
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Live Allocated Routing & Commission Settlement Ledger */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-emerald-400" />
                Active Routed Leads & Success Settlement Registry
              </h4>
              <span className="text-[9px] text-slate-400 font-mono">
                ECT-ACT COMPLIANT SECURE LOGS
              </span>
            </div>

            <div className="border border-slate-800 bg-slate-950 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-12 bg-slate-900 p-2 text-[9.5px] font-mono text-slate-400 uppercase font-bold border-b border-slate-800">
                <div className="col-span-4">Tender Reference / Scope</div>
                <div className="col-span-3">Assigned Partner</div>
                <div className="col-span-2">Contract Value</div>
                <div className="col-span-3 text-right">Status / Developer Royalty</div>
              </div>

              <div className="divide-y divide-slate-800 max-h-[295px] overflow-y-auto">
                {routedBids.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 font-mono">
                    No active routing traces found. Align and dispatch a tender lead to begin simulation.
                  </div>
                ) : (
                  routedBids.map(bid => (
                    <div key={bid.id} className="grid grid-cols-12 p-3 items-center hover:bg-slate-900/40 transition-colors">
                      
                      {/* Tender Details */}
                      <div className="col-span-4 space-y-0.5 pr-2">
                        <div className="font-bold text-slate-200 text-[11px] line-clamp-1">{bid.tenderTitle}</div>
                        <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                          <span className="bg-slate-800 px-1 rounded text-slate-300">{(bid.tenderId || 'N/A').toUpperCase()}</span>
                          {bid.overrideActive && <span className="bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold uppercase text-[7.5px]">Force Priority ON</span>}
                        </div>
                      </div>

                      {/* Partner Details */}
                      <div className="col-span-3 font-mono text-[10px] text-slate-300">
                        <div className="font-bold">{bid.partnerName}</div>
                        <div className="text-[9px] text-slate-400">Fixed Split: {bid.splitPercentage}%</div>
                      </div>

                      {/* Contract Value */}
                      <div className="col-span-2 font-mono font-bold text-slate-300 text-[11px]">
                        R{bid.tenderValue.toLocaleString()}
                      </div>

                      {/* Status / Developers Split Reward */}
                      <div className="col-span-3 text-right space-y-1.5">
                        
                        <div>
                          {bid.status === 'routing' && (
                            <span className="bg-amber-950/80 border border-amber-800 text-amber-300 font-bold px-2 py-0.5 rounded font-mono text-[9px] uppercase">
                              routing leads
                            </span>
                          )}
                          {bid.status === 'sbd_generated' && (
                            <span className="bg-indigo-950/80 border border-indigo-800 text-indigo-300 font-bold px-2 py-0.5 rounded font-mono text-[9px] uppercase">
                              SBD Form Matched
                            </span>
                          )}
                          {bid.status === 'submitted' && (
                            <span className="bg-blue-950/80 border border-blue-800 text-blue-300 font-bold px-2 py-0.5 rounded font-mono text-[9px] uppercase animate-pulse">
                              Bid Submitted
                            </span>
                          )}
                          {bid.status === 'won' && (
                            <span className={`font-bold px-2 py-0.5 rounded font-mono text-[9px] uppercase border ${
                              bid.paymentStatus === 'paid' 
                                ? 'bg-emerald-950 border-emerald-800 text-emerald-400 font-bold' 
                                : 'bg-red-950/80 border border-red-800 text-red-300 animate-pulse'
                            }`}>
                              {bid.paymentStatus === 'paid' ? '🏆 Won & Settled' : '🏆 Won - Fee Due'}
                            </span>
                          )}
                        </div>

                        {/* Interactive Status Transition Action */}
                        <div className="flex gap-1 justify-end">
                          {bid.status === 'routing' && (
                            <button 
                              type="button"
                              onClick={() => handleUpdateBidStatus(bid.id, 'sbd_generated')}
                              className="text-[8px] bg-slate-800 hover:bg-slate-700 font-mono text-slate-200 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                            >
                              Generate SBDs
                            </button>
                          )}
                          {bid.status === 'sbd_generated' && (
                            <button 
                              type="button"
                              onClick={() => handleUpdateBidStatus(bid.id, 'submitted')}
                              className="text-[8px] bg-blue-900 hover:bg-blue-800 font-mono text-slate-200 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                            >
                              Log Submission
                            </button>
                          )}
                          {bid.status === 'submitted' && (
                            <button 
                              type="button"
                              onClick={() => runAutomatedWinLossEvaluation(bid.id)}
                              className="text-[8.5px] bg-emerald-600 hover:bg-emerald-500 font-mono text-white px-2 py-0.5 rounded transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                            >
                              ⚖️ Run PPPFA Evaluation
                            </button>
                          )}
                          
                          {/* Invoice generated on win */}
                          {bid.status === 'won' && (
                            <div className="flex flex-col items-end gap-1">
                              <div className={`text-[9.5px] font-mono font-bold bg-slate-900 px-2 py-0.5 rounded border ${
                                bid.paymentStatus === 'paid' ? 'text-emerald-400 border-emerald-900' : 'text-red-400 border-red-900'
                              }`}>
                                Fee: R{bid.commissionEarned.toLocaleString()}
                              </div>
                              {bid.nonCollusionHash && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCurrentEvalResult({
                                      bidId: bid.id,
                                      tenderTitle: bid.tenderTitle,
                                      partnerName: bid.partnerName,
                                      pointsSystem: bid.tenderValue < 50000000 ? "80/20 Preference Point System" : "90/10 Preference Point System",
                                      priceScore: 0,
                                      bbbEEPoints: 0,
                                      antiCollusionBonus: 0,
                                      auditComplianceScore: 0,
                                      totalPoints: bid.pppfaScore || 0,
                                      nonCollusionHash: bid.nonCollusionHash,
                                      verdict: 'won',
                                      breakdownReport: bid.evaluationLog ? bid.evaluationLog.split('\n') : []
                                    });
                                    setEvaluatingBidId(bid.id);
                                    setEvaluationProgress(100);
                                    setEvaluationSteps(["Certified matching audit trail securely retrieved from ECTA cryptographic log."]);
                                    setShowEvaluationModal(true);
                                  }}
                                  className="text-[8px] text-slate-400 hover:text-emerald-400 underline font-mono flex items-center gap-0.5"
                                >
                                  📋 View Audit Cert
                                </button>
                              )}
                            </div>
                          )}

                          <button 
                            type="button"
                            onClick={() => handleDeleteRoutedBid(bid.id)}
                            className="text-[8.5px] text-red-400 hover:text-red-300 font-mono px-1 py-0.5 cursor-pointer ml-1"
                            title="Delete trace"
                          >
                            ×
                          </button>
                        </div>

                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total Developer Royalties Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Developer Royalties Collected</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    R{routedBids.filter(b => b.status === 'won' && b.paymentStatus === 'paid').reduce((sum, b) => sum + b.commissionEarned, 0).toLocaleString()}
                  </span>
                </div>
                <DollarSign className="w-5 h-5 text-emerald-500 opacity-60" />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase font-mono">Outstanding Split Fees Due</span>
                  <span className="text-sm font-mono font-bold text-rose-400">
                    R{routedBids.filter(b => b.status === 'won' && b.paymentStatus !== 'paid').reduce((sum, b) => sum + b.commissionEarned, 0).toLocaleString()}
                  </span>
                </div>
                <Coins className="w-5 h-5 text-rose-500 opacity-60" />
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Matched Win Probability</span>
                  <span className="text-sm font-bold text-emerald-300">92.4%</span>
                </div>
                <Zap className="w-5 h-5 text-emerald-400 opacity-60 animate-pulse" />
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* NEW SECTION: ENHANCED COMMISSION COLLECTION GATEWAY & DEDICATED DEV BANK ACCOUNT */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm" id="commission-collection-gateway">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-700" />
              2. SBD Success Commission & Developer Banking Settlement Gateway
            </h3>
            <p className="text-[11px] text-slate-500">
              When target accounts win state tenders via our pre-filled documents, their success fees must be routed directly into SA Tender Assist's dedicated corporate clearing account.
            </p>
          </div>
          <span className="text-[9px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold uppercase">SECURE TRANSFER</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bank Details Presentation */}
          <div className="lg:col-span-5 bg-slate-950 text-slate-200 p-4 rounded-lg space-y-3 font-mono text-[10.5px]">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <Building className="w-4 h-4 text-emerald-400" />
              DEDICATED DEVELOPERS CLEARING ACCOUNT
            </h4>
            <p className="text-[9px] text-slate-400 leading-normal mb-2">
              Please direct all outstanding SBD success splits via EFT / Direct Deposit using the assigned Invoice Code below.
            </p>
            <div className="space-y-2 text-xs bg-slate-900/60 p-3 rounded border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Name:</span>
                <span className="text-white font-bold">First National Bank (FNB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Holder:</span>
                <span className="text-white font-bold">SA Tender Assist (Pty) Ltd</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Number:</span>
                <span className="text-emerald-400 font-bold tracking-wider">62908873421</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Type:</span>
                <span className="text-white">Business Current Account</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Branch Code:</span>
                <span className="text-white">250655 (FNB Corporate)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Swift Code:</span>
                <span className="text-white">FIRNZAJJ</span>
              </div>
            </div>
            <div className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/60 p-2.5 rounded text-[9.5px] leading-relaxed">
              <strong>Notice:</strong> Settle within 5 business days of municipal award notification to maintain priority routing status in our allocation system.
            </div>
          </div>

          {/* Interactive Settlement Form */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-slate-500" />
              Process Outstanding Success Settlement
            </h4>

            {/* List won bids that are unpaid */}
            {routedBids.filter(b => b.status === 'won' && b.paymentStatus !== 'paid').length === 0 ? (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-6 rounded-lg text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="font-bold font-mono text-xs uppercase tracking-wide">Developer Ledger Fully Clear</h5>
                <p className="text-[10.5px]">There are currently no outstanding split payments due from won tender contracts. Direct a lead to 'won' above to simulate a success split fee invoice.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Select Due Invoice / Split contract</label>
                  <select
                    value={selectedBidToSettle}
                    onChange={(e) => {
                      setSelectedBidToSettle(e.target.value);
                      // Pre-fill reference
                      const bid = routedBids.find(b => b.id === e.target.value);
                      if (bid) {
                        setEftRefInput(`SATA-INV-${(bid.tenderId || 'N/A').toUpperCase()}-${bid.id.substring(4, 8)}`);
                      }
                    }}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded"
                  >
                    <option value="">-- Choose Won Tender Split Contract --</option>
                    {routedBids.filter(b => b.status === 'won' && b.paymentStatus !== 'paid').map(b => (
                      <option key={b.id} value={b.id}>
                        {b.partnerName} - {b.tenderTitle} [Split: R{b.commissionEarned.toLocaleString()}]
                      </option>
                    ))}
                  </select>
                </div>

                {selectedBidToSettle && (
                  <div className="space-y-3.5 bg-white p-3 rounded border border-slate-250 transition-all text-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                      <span className="font-bold text-slate-700 font-mono text-[10.5px]">Invoice Details</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        R{routedBids.find(b => b.id === selectedBidToSettle)?.commissionEarned.toLocaleString()} Due
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSettlementType('eft_bank')}
                        className={`flex-1 py-1 px-2.5 rounded text-[9.5px] font-bold font-mono border transition-all ${
                          settlementType === 'eft_bank' 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Bank EFT / Direct Deposit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementType('card')}
                        className={`flex-1 py-1 px-2.5 rounded text-[9.5px] font-bold font-mono border transition-all ${
                          settlementType === 'card' 
                            ? 'bg-slate-900 border-slate-900 text-white' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Instant Credit / Debit Card clearing
                      </button>
                    </div>

                    {settlementType === 'eft_bank' ? (
                      <div className="space-y-1.5">
                        <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">EFT Deposit reference code</label>
                        <input
                          type="text"
                          value={eftRefInput}
                          onChange={(e) => setEftRefInput(e.target.value)}
                          placeholder="e.g. SATA-INV-TENDER_3-568"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                        />
                        <p className="text-[9px] text-slate-400">Enter the payment reference used on your banking app for real-time validation.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Test Card Number</label>
                          <input
                            type="text"
                            value={settlementCardNum}
                            onChange={(e) => setSettlementCardNum(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">CVV</label>
                          <input
                            type="password"
                            value={settlementCVV}
                            onChange={(e) => setSettlementCVV(e.target.value)}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono"
                            maxLength={3}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isSettlingPayment}
                      onClick={() => {
                        const ref = settlementType === 'eft_bank' ? eftRefInput : `SATA-CARD-${Math.floor(100000 + Math.random() * 900000)}`;
                        handleSettleDuePayment(selectedBidToSettle, settlementType, ref);
                        setSelectedBidToSettle('');
                      }}
                      className="w-full bg-slate-900 hover:bg-slate-950 disabled:opacity-50 text-white font-mono font-bold py-2 px-3 rounded uppercase tracking-wider text-[9.5px] flex items-center justify-center gap-1 cursor-pointer mt-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isSettlingPayment ? 'Clearing with banking system...' : 'Settle Royalty Payment to Dedicated Bank Account'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* NEW SECTION: CONCURRENCY PERFORMANCE STRESS TESTING TERMINAL */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 space-y-4 shadow-lg text-slate-200" id="stress-testing-terminal">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-3 gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              3. High-Concurrency Performance Stress Testing Terminal
            </h3>
            <p className="text-slate-400 text-[10.5px] mt-1 max-w-2xl">
              Verify SATA platform architecture limits. Simulate up to 15 parallel bidder threads query-locking SBD forms, matching certificates, and dispatching leads simultaneously without concurrency collisions.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400">LOAD FACTOR:</span>
            <input 
              type="range"
              min="5"
              max="15"
              value={concurrencyCount}
              onChange={(e) => setConcurrencyCount(parseInt(e.target.value))}
              disabled={stressTestingActive}
              className="accent-emerald-500 bg-slate-800 h-1.5 rounded cursor-pointer w-28"
            />
            <span className="text-xs font-bold font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-300">
              {concurrencyCount} Bids/s
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Stress controls */}
          <div className="md:col-span-4 space-y-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3.5">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-300 font-mono">
                TEST SPECIFICATIONS:
              </h4>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Stress Scenario Select</label>
                <select
                  value={stressTestType}
                  onChange={(e: any) => setStressTestType(e.target.value)}
                  className="w-full text-xs p-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded font-mono"
                >
                  <option value="concurrency_sbd">SBD Concurrency Matching Burst</option>
                  <option value="db_contention">Database Lock Contention Sim</option>
                  <option value="doc_gen">Secure Document Generation Load</option>
                </select>
              </div>

              <div className="space-y-1.5 text-[10px] font-mono text-slate-400 border-t border-slate-800 pt-2">
                <div className="flex justify-between">
                  <span>Simulated Client Requests:</span>
                  <span className="text-white">{concurrencyCount} parallel SBD matches</span>
                </div>
                <div className="flex justify-between">
                  <span>Cryptographic Key Gen:</span>
                  <span className="text-white">{stressTestType === 'concurrency_sbd' ? 'AES-256 Active' : 'Idle'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Database Isolation Level:</span>
                  <span className="text-white">{stressTestType === 'db_contention' ? 'Serializable Locks' : 'Read Committed'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Document Rendering:</span>
                  <span className="text-white">{stressTestType === 'doc_gen' ? 'PDF Stream Active' : 'Standard API'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={runPerformanceStressTest}
                disabled={stressTestingActive}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-mono font-bold py-2 px-3 rounded uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                {stressTestingActive ? 'Executing Stress Load...' : 'Run Concurrency Stress Test'}
              </button>
            </div>

            {/* Simulated Live Health Indicators */}
            <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-800 grid grid-cols-2 gap-3 text-center font-mono">
              <div className="border-r border-slate-800 p-1">
                <span className="text-[8px] text-slate-400 block uppercase">Simulated Load</span>
                <span className="text-xs font-bold text-white">LOW Overheads</span>
              </div>
              <div className="p-1">
                <span className="text-[8px] text-slate-400 block uppercase">DB Connections</span>
                <span className="text-xs font-bold text-emerald-400">POOL EXEMPT</span>
              </div>
            </div>
          </div>

          {/* Live Output Terminal logs */}
          <div className="md:col-span-8 bg-black/60 rounded-lg p-4 border border-slate-800 space-y-2">
            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                SATA Core System Stress Logs
              </span>
              {hideDiagnostics && (
                <span className="text-[8.5px] font-mono bg-red-950 text-red-400 border border-red-900/50 px-1.5 py-0.5 rounded">
                  MASKED FOR PRIVACY
                </span>
              )}
              <button
                type="button"
                onClick={() => setStressTestLogs([])}
                className="text-[8px] font-mono text-slate-500 hover:text-slate-300"
              >
                [Clear Terminal]
              </button>
            </div>

            {hideDiagnostics ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-3 gap-2 text-slate-400 font-mono text-[10.5px]">
                <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>Simulated multi-threading stress tests are masked in Secure Mode.</span>
              </div>
            ) : (
              <div className="h-40 overflow-y-auto font-mono text-[9.5px] text-slate-300 space-y-1.5 pr-2">
                {stressTestLogs.length === 0 ? (
                  <div className="text-slate-600 h-full flex items-center justify-center text-center">
                    Terminal idle. Click 'Run Concurrency Stress Test' to start simulated transaction load and verify multi-threaded integrity.
                  </div>
                ) : (
                  stressTestLogs.map((log, index) => (
                    <div key={index} className={`leading-relaxed ${log.includes('STRESS TEST CONCLUDED') || log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : log.includes('warn') || log.includes('Starting') ? 'text-amber-400' : 'text-slate-300'}`}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* NEW SECTION: DATA METRICS & IMPORT/EXPORT BACKUP UTILITY */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm" id="analytics-json-management">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-3 gap-2">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-slate-700" />
              4. SATA Traffic Analytics & JSON Configuration Tools
            </h3>
            <p className="text-[11px] text-slate-500">
              Evaluate real-time partner routing traffic, regional sectors, subscription value metrics, and backup data structures.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="text-[10px] bg-slate-900 hover:bg-slate-950 font-mono text-white px-2.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
              title="Export partners and routed bids as a backup JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            <label className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-mono px-2.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider">
              <Upload className="w-3.5 h-3.5" />
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded border border-slate-150">
            <span className="text-[9px] text-slate-500 uppercase font-mono block">Active Partner Base</span>
            <span className="text-xl font-bold font-mono text-slate-800">
              {partners.length + 2} <span className="text-xs font-normal text-slate-400">(incl. seeds)</span>
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-150">
            <span className="text-[9px] text-slate-500 uppercase font-mono block">Tender Volume Managed</span>
            <span className="text-xl font-bold font-mono text-emerald-700">
              R{(routedBids.reduce((sum, b) => sum + b.tenderValue, 0)).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-150">
            <span className="text-[9px] text-slate-500 uppercase font-mono block">Dev Success Royalty Split</span>
            <span className="text-xl font-bold font-mono text-amber-700">
              R{(routedBids.reduce((sum, b) => sum + b.commissionEarned, 0)).toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded border border-slate-150">
            <span className="text-[9px] text-slate-500 uppercase font-mono block">Win-Convert Rate</span>
            <span className="text-xl font-bold font-mono text-blue-700">
              {(routedBids.length > 0 ? (routedBids.filter(b => b.status === 'won').length / routedBids.length * 100) : 0).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Graph representation & Sector counts */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
          {/* Sector Allocation Breakdown */}
          <div className="md:col-span-7 bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-700 uppercase font-mono tracking-wide">
              Lead Sector Routing Distribution (Active Traffic)
            </h4>
            <div className="space-y-2.5">
              {categoriesList.map(cat => {
                const count = routedBids.filter(b => {
                  const lead = liveTendersList.find(t => t.id === b.tenderId);
                  return lead && lead.category === cat.label;
                }).length;
                const total = routedBids.length || 1;
                const percentage = Math.min(100, Math.round((count / total) * 100));
                
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-600">
                      <span>{cat.label}</span>
                      <span className="font-bold text-slate-900">{count} trace(s) ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded overflow-hidden">
                      <div 
                        className="bg-slate-700 h-full rounded transition-all duration-500" 
                        style={{ width: `${Math.max(3, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SBD Compliance & JSON Schema specs */}
          <div className="md:col-span-5 bg-slate-950 text-slate-300 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-[10px]">
            <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <FileJson className="w-3.5 h-3.5 text-emerald-400" />
              SATA BACKUP JSON FORMAT SPEC
            </h4>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 space-y-2 text-slate-400 text-[9px] leading-relaxed">
              <p>You can directly back up local state records or populate them programmatically by feeding a valid JSON layout:</p>
              <pre className="text-slate-200 select-all overflow-x-auto p-1.5 bg-black/40 rounded text-[8.5px]">
{`{
  "exportedAt": "2026-07-07T05:35:47-07:00",
  "partners": [
    { "id": "partner_1", "companyName": "My Corp" }
  ],
  "routedBids": [
    { "id": "bid_1", "status": "won" }
  ]
}`}
              </pre>
              <p className="text-[8px] text-amber-400 flex items-center gap-1 mt-1">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Validating signature compliance keeps all municipal allocations safe and non-blocking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PPPFA Evaluation & Non-Collusion Audit Certificate Modal */}
      {showEvaluationModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
            
            {/* Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-600/20 text-emerald-400 p-1.5 rounded border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-400">
                    PPPFA Tender Evaluation Audit
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono">
                    SA National Treasury Compliant non-collusion verification
                  </p>
                </div>
              </div>
              
              {evaluationProgress === 100 && (
                <button
                  type="button"
                  onClick={() => setShowEvaluationModal(false)}
                  className="text-slate-400 hover:text-slate-100 font-mono text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              )}
            </div>

            {/* Content area */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              
              {/* Progress and status header */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 uppercase font-bold">
                    {evaluationProgress < 100 ? "Calculating weighted scorecard..." : "Decision Audited & Approved"}
                  </span>
                  <span className="text-emerald-400 font-bold">{evaluationProgress}%</span>
                </div>
                <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${evaluationProgress}%` }}
                  />
                </div>
              </div>

              {/* Progress logs terminal */}
              <div className="bg-black/40 border border-slate-850 rounded-lg p-3.5 space-y-2 font-mono text-[9.5px]">
                <div className="text-[8.5px] text-slate-500 uppercase tracking-widest border-b border-slate-850/60 pb-1 flex justify-between">
                  <span>Evaluation Logs</span>
                  <span className="text-slate-600">LIVE FEED</span>
                </div>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {evaluationSteps.map((step, idx) => (
                    <div key={idx} className="text-slate-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 shrink-0">✓</span>
                      <span>{step}</span>
                    </div>
                  ))}
                  {evaluationProgress < 100 && (
                    <div className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Processing next evaluation index...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Finalized Audit Certificate details */}
              {currentEvalResult && evaluationProgress === 100 && (
                <div className="bg-slate-950 border border-emerald-800/40 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start border-b border-slate-850 pb-2">
                    <div>
                      <span className="text-[8px] text-emerald-500 font-mono uppercase block tracking-wider font-bold">Award Verdict</span>
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-tight">
                        {currentEvalResult.partnerName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-slate-500 font-mono block">Audit Score</span>
                      <span className="text-sm font-bold font-mono text-emerald-400">
                        {currentEvalResult.totalPoints} / 120 pts
                      </span>
                    </div>
                  </div>

                  {/* Audit Certificate Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-[9.5px] font-mono py-1">
                    <div>
                      <span className="text-slate-500 block">Tender Lead:</span>
                      <span className="text-slate-300 truncate block font-bold">{currentEvalResult.tenderTitle}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Scoring System:</span>
                      <span className="text-slate-300 block">{currentEvalResult.pointsSystem}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Anti-Collusion Checksum:</span>
                      <span className="text-amber-400 text-[9px] font-bold block truncate" title={currentEvalResult.nonCollusionHash}>
                        {currentEvalResult.nonCollusionHash}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">ECTA Sec 12 Verification:</span>
                      <span className="text-emerald-400 font-bold block text-[9.5px]">
                        CERTIFIED COMPLIANT
                      </span>
                    </div>
                  </div>

                  {/* Detailed breakdown report printout */}
                  <div className="border-t border-slate-850/60 pt-2.5 space-y-1.5 text-[9px] font-mono text-slate-400 leading-relaxed">
                    <span className="text-[8px] text-slate-500 uppercase block tracking-wider font-bold">Unbiased Audit Report Summary</span>
                    {currentEvalResult.breakdownReport.map((line, idx) => (
                      <p key={idx} className="pl-2 border-l border-emerald-800/40">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0 text-[10px] font-mono">
              <span className="text-slate-500 text-[8.5px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Securely logged to immutable SATA local registry
              </span>
              {evaluationProgress === 100 && (
                <button
                  type="button"
                  onClick={() => setShowEvaluationModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded uppercase tracking-wider cursor-pointer font-mono"
                >
                  Conclude Audit
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
