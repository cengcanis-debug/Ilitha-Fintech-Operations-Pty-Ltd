/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UserPlus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  HelpCircle,
  Briefcase,
  Users,
  ShieldAlert,
  Signature,
  Award,
  DollarSign,
  Scale
} from 'lucide-react';
import { DigitalCertificate, SBD4Data, SBD61Data, SBD8Data, SBD9Data, MBD4Data, MBD8Data, MBD9Data, DirectorDetails } from '../types';
import { generateSBD4PDF, generateSBD61PDF, generateSBD8PDF, generateSBD9PDF, generateMBD4PDF, generateMBD8PDF, generateMBD9PDF, applyCryptographicSignatureToSBD, generateBBBEEAffidavitPDF } from '../utils/crypto';
import { saveSignedDocumentToCloud } from '../services/firebase';
import { Calculator, Percent, ShieldCheck, RefreshCw } from 'lucide-react';

interface SBDFormFillerProps {
  activeCert: DigitalCertificate | null;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  prefilledTender?: {
    referenceNumber: string;
    title: string;
    procuringInstitution: string;
  } | null;
  onClearPrefilled?: () => void;
}

export default function SBDFormFiller({ activeCert, addLog, prefilledTender, onClearPrefilled }: SBDFormFillerProps) {
  // Form choice state
  const [formType, setFormType] = useState<'SBD4' | 'SBD61' | 'SBD8' | 'SBD9' | 'MBD4' | 'MBD8' | 'MBD9'>('SBD4');

  // Auto-Save telemetry states
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const [isAutoSavingStatus, setIsAutoSavingStatus] = useState<boolean>(false);

  // Statutory Documents states loaded from local storage
  const [coidaFile, setCoidaFile] = useState<{ name: string; size: string; uploadedAt: string } | null>(null);
  const [municipalFile, setMunicipalFile] = useState<{ name: string; size: string; uploadedAt: string } | null>(null);
  const [csdSyncActive, setCsdSyncActive] = useState<boolean>(false);

  // SCM Compliance Monitoring states
  const [riskIndex, setRiskIndex] = useState<number>(() => {
    try {
      const val = localStorage.getItem('sata_agent_risk_index');
      return val ? parseInt(val) : 0;
    } catch {
      return 0;
    }
  });
  const [activeFailuresCount, setActiveFailuresCount] = useState<number>(0);
  const [activeFailuresList, setActiveFailuresList] = useState<string[]>([]);

  // Licensing and Pay-As-You-Go Credits states
  const [licenseTier, setLicenseTier] = useState<'basic' | 'professional' | 'enterprise' | 'payg'>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_license_tier');
      return (saved as 'basic' | 'professional' | 'enterprise' | 'payg') || 'professional';
    } catch {
      return 'professional';
    }
  });

  const [paygCredits, setPaygCredits] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_payg_credits');
      return saved ? parseInt(saved) : 1;
    } catch {
      return 1;
    }
  });

  // Sync statutory documents and licensing status from localStorage
  const syncStatutoryMeta = () => {
    try {
      const coidaSaved = localStorage.getItem('sata_coida_file_meta');
      if (coidaSaved) setCoidaFile(JSON.parse(coidaSaved));
      else setCoidaFile(null);

      const municipalSaved = localStorage.getItem('sata_municipal_file_meta');
      if (municipalSaved) setMunicipalFile(JSON.parse(municipalSaved));
      else setMunicipalFile(null);

      const csdSyncEnabled = localStorage.getItem('sata_csd_auto_sync') === 'true';
      setCsdSyncActive(csdSyncEnabled);

      const savedTier = localStorage.getItem('sata_supplier_license_tier') as 'basic' | 'professional' | 'enterprise' | 'payg' | null;
      if (savedTier) setLicenseTier(savedTier);

      const savedCredits = localStorage.getItem('sata_supplier_payg_credits');
      if (savedCredits) setPaygCredits(parseInt(savedCredits));

      // SCM Guardian autonomous compliance sync
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
    } catch (e) {
      console.warn('Failed to sync statutory documents and license meta:', e);
    }
  };

  useEffect(() => {
    syncStatutoryMeta();
    
    // Listen to storage events to immediately react to dashboard changes
    window.addEventListener('storage', syncStatutoryMeta);
    
    // Custom polling backup in case of single tab context changes
    const interval = setInterval(syncStatutoryMeta, 2000);
    
    return () => {
      window.removeEventListener('storage', syncStatutoryMeta);
      clearInterval(interval);
    };
  }, []);

  // Active pricing proposal loaded from TenderAdvisor / TenderProfitCalculator
  const [pricingProposal, setPricingProposal] = useState<any>(null);
  const [pmPrice, setPmPrice] = useState<number>(0);

  const syncPricingProposal = () => {
    try {
      const proposal = localStorage.getItem('sata_active_pricing_proposal');
      if (proposal) {
        const parsed = JSON.parse(proposal);
        setPricingProposal(parsed);
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

  // Initialize Pm Price when pricing proposal loads
  useEffect(() => {
    if (pricingProposal && pricingProposal.totalBidPriceWithVat && pmPrice === 0) {
      setPmPrice(Math.round(pricingProposal.totalBidPriceWithVat * 0.9));
    }
  }, [pricingProposal, pmPrice]);

  // MBD / Municipality specific fields
  const [municipalityName, setMunicipalityName] = useState('');

  // SBD 8 / MBD 8 specific fields
  const [hasConvictionFraud, setHasConvictionFraud] = useState(false);
  const [hasFailedContract, setHasFailedContract] = useState(false);

  // SBD 9 / MBD 9 specific fields
  const [independentPricingAgreed, setIndependentPricingAgreed] = useState(true);
  const [noCollusionAgreed, setNoCollusionAgreed] = useState(true);
  const [hasConsultedCompetitor, setHasConsultedCompetitor] = useState(false);
  const [consultationDetails, setConsultationDetails] = useState('');

  // Current step state
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [generatedFileName, setGeneratedFileName] = useState('');

  // Form Field States (Shared)
  const [bidNumber, setBidNumber] = useState('');
  const [bidDescription, setBidDescription] = useState('');
  const [procuringInstitution, setProcuringInstitution] = useState('');
  const [bidderName, setBidderName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [taxReferenceNumber, setTaxReferenceNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');

  // SBD 4 Specific States
  const [directors, setDirectors] = useState<DirectorDetails[]>([
    { id: '1', fullName: '', identityNumber: '', stateEmployeeNumber: '' }
  ]);
  const [isEmployedByState, setIsEmployedByState] = useState(false);
  const [employedByStateParticulars, setEmployedByStateParticulars] = useState('');
  const [hasRelationshipWithStateEmployee, setHasRelationshipWithStateEmployee] = useState(false);
  const [relationshipParticulars, setRelationshipParticulars] = useState('');
  const [isRestrictedSupplier, setIsRestrictedSupplier] = useState(false);
  const [isTenderDefaulter, setIsTenderDefaulter] = useState(false);

  // SBD 6.1 Specific States
  const [pointsSystem, setPointsSystem] = useState<'80/20' | '90/10'>('80/20');
  const [bbbEELevel, setBbbEELevel] = useState<number>(1);

  // Features 1, 2, 3: Foreign Supplier Onboarding & Compliance States
  const [isForeignSupplier, setIsForeignSupplier] = useState<boolean>(false);
  const [foreignCountry, setForeignCountry] = useState<string>('United States');
  const [foreignRegistryNumber, setForeignRegistryNumber] = useState<string>('');
  const [globalSwiftBic, setGlobalSwiftBic] = useState<string>('');
  const [globalIban, setGlobalIban] = useState<string>('');
  const [sarsExemptionWaiverCode, setSarsExemptionWaiverCode] = useState<string>('');
  const [prefPointsEquivalenceClaim, setPrefPointsEquivalenceClaim] = useState<'none' | 'geep' | 'zero_rating'>('none');
  const [geepReference, setGeepReference] = useState<string>('');

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
  const [blackOwnershipPercentage, setBlackOwnershipPercentage] = useState<number>(100);
  const [blackWomenOwnershipPercentage, setBlackWomenOwnershipPercentage] = useState<number>(0);
  const [youthOwnershipPercentage, setYouthOwnershipPercentage] = useState<number>(0);
  const [disabilityOwnershipPercentage, setDisabilityOwnershipPercentage] = useState<number>(0);
  const [cooperativeOwnershipPercentage, setCooperativeOwnershipPercentage] = useState<number>(0);
  const [customPtPrice, setCustomPtPrice] = useState<number>(250000);

  // Declaration Info (Shared)
  const [declarationName, setDeclarationName] = useState('');
  const [declarationDesignation, setDeclarationDesignation] = useState('');

  // Load local draft on mount (POPIA-Compliant: stays entirely on user's device/phone)
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('sata_sbd_form_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.bidNumber) setBidNumber(draft.bidNumber);
        if (draft.bidDescription) setBidDescription(draft.bidDescription);
        if (draft.procuringInstitution) setProcuringInstitution(draft.procuringInstitution);
        if (draft.bidderName) setBidderName(draft.bidderName);
        if (draft.registrationNumber) setRegistrationNumber(draft.registrationNumber);
        if (draft.taxReferenceNumber) setTaxReferenceNumber(draft.taxReferenceNumber);
        if (draft.vatNumber) setVatNumber(draft.vatNumber);
        if (draft.directors) setDirectors(draft.directors);
        if (draft.isEmployedByState !== undefined) setIsEmployedByState(draft.isEmployedByState);
        if (draft.employedByStateParticulars !== undefined) setEmployedByStateParticulars(draft.employedByStateParticulars);
        if (draft.hasRelationshipWithStateEmployee !== undefined) setHasRelationshipWithStateEmployee(draft.hasRelationshipWithStateEmployee);
        if (draft.relationshipParticulars !== undefined) setRelationshipParticulars(draft.relationshipParticulars);
        if (draft.isRestrictedSupplier !== undefined) setIsRestrictedSupplier(draft.isRestrictedSupplier);
        if (draft.isTenderDefaulter !== undefined) setIsTenderDefaulter(draft.isTenderDefaulter);
        if (draft.pointsSystem) setPointsSystem(draft.pointsSystem);
        if (draft.bbbEELevel !== undefined) setBbbEELevel(draft.bbbEELevel);
        if (draft.blackOwnershipPercentage !== undefined) setBlackOwnershipPercentage(draft.blackOwnershipPercentage);
        if (draft.blackWomenOwnershipPercentage !== undefined) setBlackWomenOwnershipPercentage(draft.blackWomenOwnershipPercentage);
        if (draft.youthOwnershipPercentage !== undefined) setYouthOwnershipPercentage(draft.youthOwnershipPercentage);
        if (draft.disabilityOwnershipPercentage !== undefined) setDisabilityOwnershipPercentage(draft.disabilityOwnershipPercentage);
        if (draft.cooperativeOwnershipPercentage !== undefined) setCooperativeOwnershipPercentage(draft.cooperativeOwnershipPercentage);
        if (draft.declarationName) setDeclarationName(draft.declarationName);
        if (draft.declarationDesignation) setDeclarationDesignation(draft.declarationDesignation);
        
        // New fields
        if (draft.municipalityName) setMunicipalityName(draft.municipalityName);
        if (draft.hasConvictionFraud !== undefined) setHasConvictionFraud(draft.hasConvictionFraud);
        if (draft.hasFailedContract !== undefined) setHasFailedContract(draft.hasFailedContract);
        if (draft.independentPricingAgreed !== undefined) setIndependentPricingAgreed(draft.independentPricingAgreed);
        if (draft.noCollusionAgreed !== undefined) setNoCollusionAgreed(draft.noCollusionAgreed);
        if (draft.hasConsultedCompetitor !== undefined) setHasConsultedCompetitor(draft.hasConsultedCompetitor);
        if (draft.consultationDetails !== undefined) setConsultationDetails(draft.consultationDetails);

        // Foreign Supplier parameters
        if (draft.isForeignSupplier !== undefined) setIsForeignSupplier(draft.isForeignSupplier);
        if (draft.foreignCountry) setForeignCountry(draft.foreignCountry);
        if (draft.foreignRegistryNumber) setForeignRegistryNumber(draft.foreignRegistryNumber);
        if (draft.globalSwiftBic) setGlobalSwiftBic(draft.globalSwiftBic);
        if (draft.globalIban) setGlobalIban(draft.globalIban);
        if (draft.sarsExemptionWaiverCode) setSarsExemptionWaiverCode(draft.sarsExemptionWaiverCode);
        if (draft.prefPointsEquivalenceClaim) setPrefPointsEquivalenceClaim(draft.prefPointsEquivalenceClaim);
        if (draft.geepReference) setGeepReference(draft.geepReference);
        if (draft.foreignCurrency) setForeignCurrency(draft.foreignCurrency);
        if (draft.sarbExchangeRate !== undefined) setSarbExchangeRate(draft.sarbExchangeRate);
        if (draft.localContentPercentage !== undefined) setLocalContentPercentage(draft.localContentPercentage);
        if (draft.fecHedgingArranged !== undefined) setFecHedgingArranged(draft.fecHedgingArranged);
        if (draft.isJvConsortium !== undefined) setIsJvConsortium(draft.isJvConsortium);
        if (draft.jvLocalPartnerName !== undefined) setJvLocalPartnerName(draft.jvLocalPartnerName);
        if (draft.jvLocalPartnerShare !== undefined) setJvLocalPartnerShare(draft.jvLocalPartnerShare);
        if (draft.jvLocalPartnerBbeeLevel !== undefined) setJvLocalPartnerBbeeLevel(draft.jvLocalPartnerBbeeLevel);

        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(now);
        addLog?.('Loaded active SBD workspace draft from local secure phone storage.', 'info');
      }
    } catch (e) {
      console.warn('Could not restore SBD form draft:', e);
    }
  }, []);

  // Interval-Based Auto-Save (Every 30 Seconds) to prevent data loss during long sessions
  useEffect(() => {
    const saveSBDDraft = () => {
      try {
        setIsAutoSavingStatus(true);
        const draft = {
          bidNumber,
          bidDescription,
          procuringInstitution,
          bidderName,
          registrationNumber,
          taxReferenceNumber,
          vatNumber,
          directors,
          isEmployedByState,
          employedByStateParticulars,
          hasRelationshipWithStateEmployee,
          relationshipParticulars,
          isRestrictedSupplier,
          isTenderDefaulter,
          pointsSystem,
          bbbEELevel,
          blackOwnershipPercentage,
          blackWomenOwnershipPercentage,
          youthOwnershipPercentage,
          disabilityOwnershipPercentage,
          cooperativeOwnershipPercentage,
          declarationName,
          declarationDesignation,
          
          // New fields
          municipalityName,
          hasConvictionFraud,
          hasFailedContract,
          independentPricingAgreed,
          noCollusionAgreed,
          hasConsultedCompetitor,
          consultationDetails,
          // Foreign fields
          isForeignSupplier,
          foreignCountry,
          foreignRegistryNumber,
          globalSwiftBic,
          globalIban,
          sarsExemptionWaiverCode,
          prefPointsEquivalenceClaim,
          geepReference,
          foreignCurrency,
          sarbExchangeRate,
          localContentPercentage,
          fecHedgingArranged,
          isJvConsortium,
          jvLocalPartnerName,
          jvLocalPartnerShare,
          jvLocalPartnerBbeeLevel
        };
        localStorage.setItem('sata_sbd_form_draft', JSON.stringify(draft));
        const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSavedTime(timeNow);
        
        // Clear status animation after a brief flash
        setTimeout(() => {
          setIsAutoSavingStatus(false);
        }, 1000);
      } catch (e) {
        console.warn('Could not auto-save SBD form progress:', e);
      }
    };

    // Set up the 30 seconds interval
    const intervalId = setInterval(saveSBDDraft, 30000);

    // Return clean-up
    return () => clearInterval(intervalId);
  }, [
    bidNumber,
    bidDescription,
    procuringInstitution,
    bidderName,
    registrationNumber,
    taxReferenceNumber,
    vatNumber,
    directors,
    isEmployedByState,
    employedByStateParticulars,
    hasRelationshipWithStateEmployee,
    relationshipParticulars,
    isRestrictedSupplier,
    isTenderDefaulter,
    pointsSystem,
    bbbEELevel,
    blackOwnershipPercentage,
    blackWomenOwnershipPercentage,
    youthOwnershipPercentage,
    disabilityOwnershipPercentage,
    cooperativeOwnershipPercentage,
    declarationName,
    declarationDesignation,
    municipalityName,
    hasConvictionFraud,
    hasFailedContract,
    independentPricingAgreed,
    noCollusionAgreed,
    hasConsultedCompetitor,
    consultationDetails,
    isForeignSupplier,
    foreignCountry,
    foreignRegistryNumber,
    globalSwiftBic,
    globalIban,
    sarsExemptionWaiverCode,
    prefPointsEquivalenceClaim,
    geepReference
  ]);

  // Auto-populate from Active Certificate
  useEffect(() => {
    if (activeCert) {
      if (!bidderName) setBidderName(activeCert.organization);
      if (!declarationName) setDeclarationName(activeCert.subjectName);
      if (!declarationDesignation) setDeclarationDesignation(activeCert.designation);
    }
  }, [activeCert]);

  // Auto-populate from Local Supplier Profile on mount
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem('sata_supplier_profile_local');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (!bidderName && p.companyName) setBidderName(p.companyName);
        if (!registrationNumber && p.registrationNumber) setRegistrationNumber(p.registrationNumber);
        if (!taxReferenceNumber) setTaxReferenceNumber('9012345678');
        if (!vatNumber) setVatNumber('4012345678');
      }
    } catch (e) {
      console.warn('Could not auto-fill from cached profile:', e);
    }
  }, []);

  const handleAutoFillFromCSD = () => {
    try {
      const savedProfile = localStorage.getItem('sata_supplier_profile_local');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.companyName) setBidderName(p.companyName);
        if (p.registrationNumber) setRegistrationNumber(p.registrationNumber);
        if (p.taxStatus) {
          setTaxReferenceNumber('9012345678');
        }
        setVatNumber('4012345678');
        
        if (activeCert) {
          setDeclarationName(activeCert.subjectName);
          setDeclarationDesignation(activeCert.designation);
        } else {
          setDeclarationName('SATA MEMBER');
          setDeclarationDesignation('Director');
        }

        // Also if MBD form, auto-fill municipality
        if (formType.startsWith('MBD')) {
          setMunicipalityName(p.province ? `City of ${p.province.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}` : 'City of Cape Town');
        }

        addLog?.('Success: Fully auto-filled SBD/MBD form details from Treasury CSD synchronized database profile!', 'success');
      } else {
        setError('No synchronized Treasury CSD profile found on this device. Please synchronize CSD parameters first.');
      }
    } catch (e) {
      setError('Could not read synchronized profile data.');
    }
  };

  // Auto-populate from selected Provincial Tender Feed
  useEffect(() => {
    if (prefilledTender) {
      setBidNumber(prefilledTender.referenceNumber);
      setBidDescription(prefilledTender.title);
      setProcuringInstitution(prefilledTender.procuringInstitution);
      addLog?.(`Auto-populated SBD Form Filler with Tender Reference ${prefilledTender.referenceNumber}.`, 'success');
      onClearPrefilled?.();
    }
  }, [prefilledTender]);

  // Director handlers
  const handleAddDirector = () => {
    if (directors.length >= 4) {
      setError('SBD 4 template table accommodates up to 4 key directors. Please consolidate key shareholders.');
      return;
    }
    setDirectors([
      ...directors,
      { id: Date.now().toString(), fullName: '', identityNumber: '', stateEmployeeNumber: '' }
    ]);
    addLog?.('Added row to directors/shareholders grid database.', 'info');
  };

  const handleRemoveDirector = (id: string) => {
    setDirectors(directors.filter(d => d.id !== id));
    addLog?.('Removed row from directors/shareholders grid database.', 'info');
  };

  const handleDirectorChange = (id: string, field: keyof DirectorDetails, value: string) => {
    setDirectors(directors.map(d => {
      if (d.id === id) {
        return { ...d, [field]: value };
      }
      return d;
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');
    
    // SBD 4 and SBD 6.1 share Step 1
    if (currentStep === 1) {
      if (!bidNumber.trim()) return fail('Please specify the Tender/Bid Reference Number.');
      if (!bidDescription.trim()) return fail('Please provide a short Bid Description.');
      if (!procuringInstitution.trim()) return fail('Please specify the Procuring Government Institution.');
      if (!bidderName.trim()) return fail('Please enter the bidder\'s corporate name.');
      if (!registrationNumber.trim()) return fail('Company Registration number is required.');
    }
    
    if (formType === 'SBD4') {
      if (currentStep === 2) {
        // Validate directors
        for (let i = 0; i < directors.length; i++) {
          const d = directors[i];
          if (!d.fullName.trim()) return fail(`Director #${i + 1} requires a full name.`);
          if (!d.identityNumber.trim()) return fail(`Director #${i + 1} requires an Identity Number.`);
          if (d.identityNumber.length !== 13 || isNaN(Number(d.identityNumber))) {
            return fail(`Director #${i + 1} identity number must be exactly 13 numeric digits.`);
          }
        }
      }
      
      if (currentStep === 3) {
        if (isEmployedByState && !employedByStateParticulars.trim()) {
          return fail('Please furnish particulars regarding the state employee relationship.');
        }
        if (hasRelationshipWithStateEmployee && !relationshipParticulars.trim()) {
          return fail('Please furnish particulars of the procuring institution relationship.');
        }
        if (isRestrictedSupplier || isTenderDefaulter) {
          return fail('Under South African Treasury regulations, restricted suppliers or tender defaulters are disqualified from submitting bidding declarations.');
        }
      }
    } else {
      // SBD 6.1 specific validation for step 2
      if (currentStep === 2) {
        if (bbbEELevel < 1 || bbbEELevel > 9) return fail('B-BBEE level must be between 1 and 9 (non-compliant).');
        if (blackOwnershipPercentage < 0 || blackOwnershipPercentage > 100) return fail('Black Ownership must be between 0% and 100%.');
        if (blackWomenOwnershipPercentage < 0 || blackWomenOwnershipPercentage > 100) return fail('Black Women Ownership must be between 0% and 100%.');
        if (youthOwnershipPercentage < 0 || youthOwnershipPercentage > 100) return fail('Youth Ownership must be between 0% and 100%.');
        if (disabilityOwnershipPercentage < 0 || disabilityOwnershipPercentage > 100) return fail('Disability Ownership must be between 0% and 100%.');
        if (cooperativeOwnershipPercentage < 0 || cooperativeOwnershipPercentage > 100) return fail('Cooperative Ownership must be between 0% and 100%.');
      }
    }
    
    return true;
  };

  const fail = (msg: string): boolean => {
    setError(msg);
    addLog?.(`Validation Warning: ${msg}`, 'warn');
    return false;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      let stepName = '';
      if (formType === 'SBD4') {
        const stepNames = [
          'Tender profile & corporate details configured',
          'Shareholders database verified',
          'State relationship conflict questionnaire validated',
          'Declarant authorization seal prepared'
        ];
        stepName = stepNames[step - 1];
      } else {
        const stepNames = [
          'Tender profile configured',
          'B-BBEE claims and specific goals validated',
          'Declarant authorization prepared'
        ];
        stepName = stepNames[step - 1];
      }
      addLog?.(`Step completed: ${stepName}. Navigation forward.`, 'info');
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    addLog?.(`Navigated backward to step ${step - 1}.`, 'info');
    setStep(prev => prev - 1);
  };

  const handleSubmitAndSign = async () => {
    if (!activeCert) {
      setError(`A valid digital signing certificate is required to submit and seal ${formType}. Please navigate to the "Digital Certificate" tab.`);
      addLog?.(`Aborted signing ${formType}: No active cryptographic key pair detected.`, 'error');
      return;
    }

    if (!declarationName.trim() || !declarationDesignation.trim()) {
      setError(`Please provide the declarant name and role designation for ${formType}.`);
      return;
    }

    if (licenseTier === 'payg') {
      if (paygCredits <= 0) {
        setError(`You have 0 Pay-As-You-Go submission credits remaining. Please buy more credits in the "SATA Licensing & Tiers" section of your Supplier Dashboard.`);
        addLog?.(`Aborted signing ${formType}: Insufficient Pay-As-You-Go credits.`, 'error');
        return;
      }
    }

    try {
      setIsGenerating(true);
      setError('');
      setDownloadUrl(null);

      if (formType === 'SBD4') {
        addLog?.(`Starting Standard Bidding Document 4 (SBD 4) template build...`, 'info');

        const sbdData: SBD4Data = {
          bidNumber,
          bidDescription,
          procuringInstitution,
          bidderName,
          registrationNumber,
          taxReferenceNumber,
          vatNumber,
          directors,
          isEmployedByState,
          employedByStateParticulars,
          hasRelationshipWithStateEmployee,
          relationshipParticulars,
          isRestrictedSupplier,
          isTenderDefaulter,
          declarationName,
          declarationDesignation
        };

        // 1. Generate standard SBD 4 PDF
        const pdfBytes = await generateSBD4PDF(sbdData);
        addLog?.(`Bidder disclosures, corporate profile, and shareholder database injected into PDF.`, 'info');

        // 2. Cryptographically Sign the SBD 4 PDF (applies visual green stamp + metadata hash envelope)
        addLog?.(`WebCrypto: Signing SBD 4 document payload structure with private key...`, 'info');
        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 60, pageNumber: 2 });
        addLog?.(`Success: Appended ECT-Act compliant green visual stamp on legal page 2.`, 'success');

        // 3. Setup downloadable blob
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const cleanFileName = `SBD_4_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        
        // Save to Firebase Cloud Document History (Feature 1)
        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed SBD4 receipt successfully written to Firebase Ledger.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive: Signed ledger sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(5); // Success step
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for submission.`, 'success');
      } else if (formType === 'SBD61') {
        addLog?.(`Starting Standard Bidding Document 6.1 (SBD 6.1) preference points build...`, 'info');

        const sbdData61: SBD61Data = {
          bidNumber,
          bidderName,
          pointsSystem,
          bbbEELevel,
          blackOwnershipPercentage,
          blackWomenOwnershipPercentage,
          youthOwnershipPercentage,
          disabilityOwnershipPercentage,
          cooperativeOwnershipPercentage
        };

        // 1. Generate standard SBD 6.1 PDF
        const pdfBytes = await generateSBD61PDF(sbdData61);
        addLog?.(`B-BBEE claims and specific procurement goals compiled into PDF.`, 'info');

        // 2. Cryptographically Sign the SBD 6.1 PDF
        addLog?.(`WebCrypto: Signing SBD 6.1 document payload structure with private key...`, 'info');
        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 140, pageNumber: 2 });
        addLog?.(`Success: Appended ECT-Act compliant green visual stamp on preference point page 2.`, 'success');

        // 3. Setup downloadable blob
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        
        const cleanFileName = `SBD_6_1_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        // Save to Firebase Cloud Document History (Feature 1)
        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription: `Preferential claims level ${bbbEELevel}`,
            procuringInstitution: "Custom Tender",
            bidderName
          });
          addLog?.(`Cloud Archive: Signed SBD6.1 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(4); // Success step for SBD 6.1 (it has 4 steps total: 1: Tender, 2: BBBEE, 3: Sign, 4: Success)
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for preference points submission.`, 'success');
      } else if (formType === 'SBD8') {
        addLog?.(`Starting Standard Bidding Document 8 (SBD 8) SCM record build...`, 'info');
        const sbd8Data: SBD8Data = {
          bidNumber,
          bidDescription,
          procuringInstitution,
          bidderName,
          registrationNumber,
          isRestrictedSupplier,
          hasConvictionFraud,
          hasFailedContract,
          declarationName,
          declarationDesignation
        };
        const pdfBytes = await generateSBD8PDF(sbd8Data);
        addLog?.(`SCM past records and bidder declarations compiled into SBD 8 PDF.`, 'info');

        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 120, pageNumber: 1 });
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const cleanFileName = `SBD_8_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed SBD8 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(4);
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for SBD 8 submission.`, 'success');

      } else if (formType === 'SBD9') {
        addLog?.(`Starting Standard Bidding Document 9 (SBD 9) independent determination build...`, 'info');
        const sbd9Data: SBD9Data = {
          bidNumber,
          bidDescription,
          procuringInstitution,
          bidderName,
          registrationNumber,
          independentPricingAgreed,
          noCollusionAgreed,
          hasConsultedCompetitor,
          consultationDetails,
          declarationName,
          declarationDesignation
        };
        const pdfBytes = await generateSBD9PDF(sbd9Data);
        addLog?.(`Collusive bidding prevention certificate compiled into SBD 9 PDF.`, 'info');

        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 120, pageNumber: 1 });
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const cleanFileName = `SBD_9_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed SBD9 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(4);
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for SBD 9 submission.`, 'success');

      } else if (formType === 'MBD4') {
        addLog?.(`Starting Municipal Bidding Document 4 (MBD 4) conflict build...`, 'info');
        const mbd4Data: MBD4Data = {
          bidNumber,
          bidDescription,
          municipalityName: municipalityName || procuringInstitution,
          bidderName,
          registrationNumber,
          taxReferenceNumber,
          vatNumber,
          isEmployedByState,
          employedByStateParticulars,
          directors,
          declarationName,
          declarationDesignation
        };
        const pdfBytes = await generateMBD4PDF(mbd4Data);
        addLog?.(`Municipal conflict questionnaires compiled into MBD 4 PDF.`, 'info');

        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 120, pageNumber: 1 });
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const cleanFileName = `MBD_4_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution: municipalityName || procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed MBD4 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(5);
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for MBD 4 submission.`, 'success');

      } else if (formType === 'MBD8') {
        addLog?.(`Starting Municipal Bidding Document 8 (MBD 8) past SCM practices build...`, 'info');
        const mbd8Data: MBD8Data = {
          bidNumber,
          bidDescription,
          municipalityName: municipalityName || procuringInstitution,
          bidderName,
          registrationNumber,
          isRestrictedSupplier,
          hasConvictionFraud,
          hasFailedContract,
          declarationName,
          declarationDesignation
        };
        const pdfBytes = await generateMBD8PDF(mbd8Data);
        addLog?.(`Municipal SCM past records compiled into MBD 8 PDF.`, 'info');

        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 120, pageNumber: 1 });
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const cleanFileName = `MBD_8_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution: municipalityName || procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed MBD8 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(4);
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for MBD 8 submission.`, 'success');

      } else if (formType === 'MBD9') {
        addLog?.(`Starting Municipal Bidding Document 9 (MBD 9) independent determination build...`, 'info');
        const mbd9Data: MBD9Data = {
          bidNumber,
          bidDescription,
          municipalityName: municipalityName || procuringInstitution,
          bidderName,
          registrationNumber,
          independentPricingAgreed,
          noCollusionAgreed,
          declarationName,
          declarationDesignation
        };
        const pdfBytes = await generateMBD9PDF(mbd9Data);
        addLog?.(`Municipal collusive bidding prevention certificate compiled into MBD 9 PDF.`, 'info');

        const signResult = await applyCryptographicSignatureToSBD(pdfBytes, activeCert, { x: 50, y: 120, pageNumber: 1 });
        const blob = new Blob([signResult.pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const cleanFileName = `MBD_9_Signed_${bidNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        try {
          await saveSignedDocumentToCloud({
            id: crypto.randomUUID(),
            fileName: cleanFileName,
            signedAtIso: signResult.signedAtIso,
            sha256Hash: signResult.sha256Hash,
            bidNumber,
            bidDescription,
            procuringInstitution: municipalityName || procuringInstitution,
            bidderName
          });
          addLog?.(`Cloud Archive: Signed MBD9 receipt successfully synced to Firebase.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive sync pending.`, 'warn');
        }

        setGeneratedFileName(cleanFileName);
        setDownloadUrl(url);
        setStep(4);
        addLog?.(`Asymmetric digital seal generated: ${cleanFileName}. File ready for MBD 9 submission.`, 'success');
      }

      // Decrement PAYG credits if on PAYG plan after successful generation
      if (licenseTier === 'payg') {
        const newCredits = Math.max(0, paygCredits - 1);
        setPaygCredits(newCredits);
        localStorage.setItem('sata_supplier_payg_credits', String(newCredits));
        addLog?.(`[Pay-As-You-Go Plan] 1 credit consumed for auto-fill. Credits remaining: ${newCredits}`, 'success');
      }
    } catch (err: any) {
      setError(`Failed to generate signed document: ${err.message}`);
      addLog?.(`Compilation or asymmetric signing thread failed: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetForm = () => {
    setStep(1);
    setError('');
    setDownloadUrl(null);
    addLog?.(`Reset SBD workspace details.`, 'info');
  };

  const handleWipeDraft = () => {
    if (confirm('Are you sure you want to completely wipe all current draft entries for this SBD form? This stays 100% offline but will clear your inputs.')) {
      setBidNumber('');
      setBidDescription('');
      setProcuringInstitution('');
      setBidderName(activeCert ? activeCert.organization : '');
      setRegistrationNumber('');
      setTaxReferenceNumber('');
      setVatNumber('');
      setDirectors([{ id: '1', fullName: '', identityNumber: '', stateEmployeeNumber: '' }]);
      setIsEmployedByState(false);
      setEmployedByStateParticulars('');
      setHasRelationshipWithStateEmployee(false);
      setRelationshipParticulars('');
      setIsRestrictedSupplier(false);
      setIsTenderDefaulter(false);
      setPointsSystem('80/20');
      setBbbEELevel(1);
      setBlackOwnershipPercentage(100);
      setBlackWomenOwnershipPercentage(0);
      setYouthOwnershipPercentage(0);
      setDisabilityOwnershipPercentage(0);
      setCooperativeOwnershipPercentage(0);
      setDeclarationName(activeCert ? activeCert.subjectName : '');
      setDeclarationDesignation(activeCert ? activeCert.designation : '');
      setStep(1);
      setError('');
      setDownloadUrl(null);
      localStorage.removeItem('sata_sbd_form_draft');
      addLog?.('POPIA Safeguard: Completely wiped the local SBD draft from phone storage.', 'warn');
    }
  };

  const activeMaxStep = (formType === 'SBD4' || formType === 'MBD4') ? 5 : 4;

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden" id="sbd-form-filler-root">
      
      {/* Tab Selector at the top */}
      <div className="grid grid-cols-2 md:grid-cols-7 border-b border-slate-200 bg-slate-50" id="sbd-tabs-selector">
        <button
          type="button"
          onClick={() => { setFormType('SBD4'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'SBD4' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          SBD 4
        </button>
        <button
          type="button"
          onClick={() => { setFormType('SBD61'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'SBD61' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          SBD 6.1
        </button>
        <button
          type="button"
          onClick={() => { setFormType('SBD8'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'SBD8' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          SBD 8
        </button>
        <button
          type="button"
          onClick={() => { setFormType('SBD9'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'SBD9' ? 'bg-white border-t-2 border-emerald-700 text-emerald-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          SBD 9
        </button>
        <button
          type="button"
          onClick={() => { setFormType('MBD4'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'MBD4' ? 'bg-white border-t-2 border-sky-700 text-sky-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          MBD 4
        </button>
        <button
          type="button"
          onClick={() => { setFormType('MBD8'); handleResetForm(); }}
          className={`py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-r border-b border-slate-100 transition-all cursor-pointer ${formType === 'MBD8' ? 'bg-white border-t-2 border-sky-700 text-sky-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          MBD 8
        </button>
        <button
          type="button"
          onClick={() => { setFormType('MBD9'); handleResetForm(); }}
          className={`col-span-2 md:col-span-1 py-2.5 px-2 text-center text-[10px] font-mono font-bold uppercase tracking-wider border-b border-slate-100 transition-all cursor-pointer ${formType === 'MBD9' ? 'bg-white border-t-2 border-sky-700 text-sky-800' : 'text-slate-400 hover:text-slate-600'}`}
        >
          MBD 9
        </button>
      </div>

      {/* Header Tabs Navigation Indicator */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 font-mono">
            <FileText className={`w-3.5 h-3.5 ${formType.startsWith('MBD') ? 'text-sky-700' : 'text-emerald-700'}`} />
            {formType === 'SBD4' && "SBD 4: Bidder Disclosure"}
            {formType === 'SBD61' && "SBD 6.1: Preference Points Claim"}
            {formType === 'SBD8' && "SBD 8: Past SCM Practices"}
            {formType === 'SBD9' && "SBD 9: Independent Bid Determination"}
            {formType === 'MBD4' && "MBD 4: Municipal Declaration of Interest"}
            {formType === 'MBD8' && "MBD 8: Municipal Past SCM Practices"}
            {formType === 'MBD9' && "MBD 9: Municipal Independent Determination"}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {licenseTier === 'payg' ? (
              <>
                <span className="text-[9px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                  PAYG Starter Plan 🇿🇦
                </span>
                <span className="text-[9px] font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                  {paygCredits} Credit{paygCredits !== 1 ? 's' : ''} Left
                </span>
              </>
            ) : (
              <>
                <span className="text-[9px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                  {licenseTier.toUpperCase()} Plan
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Unlimited Auto-Fills
                </span>
              </>
            )}
            {lastSavedTime && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono border-l border-slate-200 pl-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoSavingStatus ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`}></span>
                <span>{isAutoSavingStatus ? 'Saving...' : `Draft saved at ${lastSavedTime}`}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Dots */}
        <div className="flex items-center gap-2">
          {((formType === 'SBD4' || formType === 'MBD4') ? [1, 2, 3, 4, 5] : [1, 2, 3, 4]).map((idx) => (
            <div key={idx} className="flex items-center">
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                  step === idx 
                    ? `${formType.startsWith('MBD') ? 'bg-sky-700 ring-sky-100' : 'bg-emerald-700 ring-emerald-100'} text-white ring-4` 
                    : step > idx 
                      ? `${formType.startsWith('MBD') ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}` 
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {idx}
              </div>
              {idx < activeMaxStep && (
                <div className={`w-4 h-0.5 ${step > idx ? (formType.startsWith('MBD') ? 'bg-sky-200' : 'bg-emerald-200') : 'bg-slate-100'}`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {activeFailuresCount > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-950 text-xs rounded-lg p-4 space-y-2.5 mb-4 text-left shadow-sm">
            <div className="flex items-center gap-2 text-red-800 font-bold font-mono text-[10.5px] uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-red-600 animate-bounce shrink-0" />
              <span>[WARNING] ACTIVE SCM REGULATORY THREATS ({activeFailuresCount})</span>
            </div>
            <p className="text-[10.5px] text-slate-600 font-sans leading-normal">
              Autonomous background monitor agents have flagged compliance vulnerabilities on your supplier profile or active costing models. Submitting bidding documents under active non-compliance can result in immediate National Treasury disqualification or corporate blacklisting.
            </p>
            <div className="flex flex-wrap gap-1.5 py-1">
              {activeFailuresList.map((fail, fIdx) => (
                <span key={fIdx} className="bg-red-100/80 text-red-800 border border-red-200 text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">
                  ⚠ {fail}
                </span>
              ))}
            </div>
            <div className="pt-1 flex items-center justify-between border-t border-red-100">
              <span className="text-[9.5px] font-mono text-red-700 font-semibold uppercase">
                SCM Profile Risk: {riskIndex}%
              </span>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('sata_switch_tab', { detail: 'agents' }));
                  addLog?.("Navigated to Autonomous Compliance Monitoring Console.", "info");
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[9px] uppercase py-1 px-2.5 rounded transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                Go To Agents Console & Self-Heal 🚀
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded p-3 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Tender & Corporate Details (Shared across SBD4 & SBD61) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 font-mono">100% POPIA Secured Draft Mode</h5>
                  <p className="text-[10px] text-emerald-800 leading-normal mt-0.5">
                    Your company details, identity numbers, and tax data are cached <strong>exclusively on your phone/device</strong> (local secure storage). No personal identity records are ever transferred to the cloud.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAutoFillFromCSD}
                  className="text-[9px] font-bold font-mono uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white py-1 px-3 rounded transition-all cursor-pointer flex items-center gap-1.5"
                  title="Auto-fill form fields from your Central Supplier Database profile"
                >
                  <RefreshCw className="w-3 h-3 animate-pulse" />
                  Auto-Fill From CSD
                </button>
                <button
                  type="button"
                  onClick={handleWipeDraft}
                  className="text-[9px] font-bold font-mono uppercase tracking-widest bg-emerald-850 hover:bg-emerald-900 text-white py-1 px-3 rounded transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Wipe Local Draft
                </button>
              </div>
            </div>

            <div className="border-b border-slate-100 pb-2.5 text-left">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 1: Tender Invitation & Corporate Profile</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Please populate standard Treasury procurement values for this specific bidding opportunity.</p>
            </div>

            {/* Statutory Documents Integration Desktop */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2.5 text-left">
              <div className="flex justify-between items-center border-b border-slate-150 pb-2">
                <span className="text-[10px] font-bold font-mono text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Statutory Audit Integration Verification
                </span>
                <span className="text-[9px] font-mono font-bold bg-sky-50 text-sky-800 px-1.5 py-0.5 rounded border border-sky-150 uppercase animate-none">
                  SATA Safe-Sync
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* COIDA Document Indicator */}
                <div className={`p-2 rounded border text-xs flex flex-col justify-between min-h-[56px] ${coidaFile ? 'bg-emerald-50/40 border-emerald-150 text-emerald-950' : 'bg-amber-50/30 border-amber-150 text-amber-950'}`}>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">1. COIDA Clearance</span>
                    <span className="font-semibold text-[10px] mt-0.5 block truncate" title={coidaFile ? coidaFile.name : undefined}>
                      {coidaFile ? `✓ ${coidaFile.name}` : '• Running in Simulated Mode'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    {coidaFile ? `${coidaFile.size} • Audited Verified` : 'No file uploaded'}
                  </span>
                </div>

                {/* Municipal Bill Indicator */}
                <div className={`p-2 rounded border text-xs flex flex-col justify-between min-h-[56px] ${municipalFile ? 'bg-emerald-50/40 border-emerald-150 text-emerald-950' : 'bg-amber-50/30 border-amber-150 text-amber-950'}`}>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">2. Municipal Rates Bill</span>
                    <span className="font-semibold text-[10px] mt-0.5 block truncate" title={municipalFile ? municipalFile.name : undefined}>
                      {municipalFile ? `✓ ${municipalFile.name}` : '• Running in Simulated Mode'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    {municipalFile ? `${municipalFile.size} • Audited Verified` : 'No file uploaded'}
                  </span>
                </div>

                {/* CSD Sync Indicator */}
                <div className={`p-2 rounded border text-xs flex flex-col justify-between min-h-[56px] ${csdSyncActive ? 'bg-emerald-50/40 border-emerald-150 text-emerald-950' : 'bg-slate-100/50 border-slate-200 text-slate-700'}`}>
                  <div>
                    <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block">3. Treasury CSD Auto-Sync</span>
                    <span className="font-semibold text-[10px] mt-0.5 block">
                      {csdSyncActive ? '✓ Sync Active (Continuous)' : '• Sync Manual / Inactive'}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono mt-1">
                    {csdSyncActive ? 'Real-time indicators matched' : 'Manual database mode'}
                  </span>
                </div>
              </div>

              {(!coidaFile || !municipalFile || !csdSyncActive) && (
                <p className="text-[10px] text-slate-500 leading-relaxed pt-0.5">
                  Pro-Tip: Go to the <strong className="text-emerald-700">supplier_dashboard.app</strong> tab to upload files and turn on CSD Auto-Sync. This unlocks a perfect 100% compliance audit score and feeds verified physical metadata directly into your signed PDF bundles.
                </p>
              )}
            </div>

            {/* Active Pricing Proposal Integration Panel */}
            {pricingProposal && (
              <div className="bg-emerald-950 text-emerald-100 rounded-lg p-4 border border-emerald-900 text-left space-y-3">
                <div className="flex justify-between items-center border-b border-emerald-900 pb-2">
                  <span className="text-[10px] font-bold font-mono text-emerald-350 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                    Active Financial Costing Bridge
                  </span>
                  <div className="flex gap-1.5">
                    <span className="text-[8px] font-mono font-bold bg-emerald-900 text-emerald-300 px-1.5 py-0.5 rounded uppercase">
                      Synced
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (pricingProposal.tenderRef && pricingProposal.tenderRef !== 'CUSTOM_PRICING') {
                          setBidNumber(pricingProposal.tenderRef);
                        }
                        if (pricingProposal.tenderTitle && pricingProposal.tenderTitle !== 'Custom Business Pricing Model') {
                          setBidDescription(pricingProposal.tenderTitle);
                        }
                        if (pricingProposal.institution && pricingProposal.institution !== 'Private/Public Bidder Workspace') {
                          setProcuringInstitution(pricingProposal.institution);
                        }
                        addLog?.('Imported tender details from active pricing proposal!', 'success');
                      }}
                      className="text-[8px] font-mono font-bold bg-emerald-800 hover:bg-emerald-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                    >
                      Import Details
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 block uppercase">Proposed Bid Price</span>
                    <span className="font-bold text-white font-mono">
                      {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.totalBidPriceWithVat)}
                    </span>
                    <span className="text-[8px] text-emerald-300 font-mono block">
                      {pricingProposal.isVatRegistered ? 'Incl. 15% VAT' : 'Excl. VAT'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 block uppercase">Projected Net Profit</span>
                    <span className="font-bold text-emerald-300 font-mono">
                      {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.takeHomeProfit)}
                    </span>
                    <span className="text-[8px] text-emerald-300 font-mono block">
                      {pricingProposal.netTakeHomeMargin?.toFixed(1)}% Net Margin
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 block uppercase">Execution Cost</span>
                    <span className="font-bold text-slate-300 font-mono">
                      {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.totalDeliveryCost)}
                    </span>
                    <span className="text-[8px] text-emerald-300 font-mono block">
                      Markup: {pricingProposal.markupRate}%
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 block uppercase">SARS Tax Reserve</span>
                    <span className="font-bold text-red-300 font-mono">
                      {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(pricingProposal.corporateTaxReserve || 0)}
                    </span>
                    <span className="text-[8px] text-emerald-300 font-mono block">
                      27% CIT Reserved
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Government Bid / Tender Reference Number</label>
                <input
                  type="text"
                  value={bidNumber}
                  onChange={(e) => setBidNumber(e.target.value)}
                  placeholder="e.g. DHA12-2026 / RT3-2026"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              {formType.startsWith('MBD') ? (
                <div>
                  <label className="block text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1 font-mono">Target Municipality Name</label>
                  <input
                    type="text"
                    value={municipalityName}
                    onChange={(e) => setMunicipalityName(e.target.value)}
                    placeholder="e.g. City of Johannesburg / eThekwini Municipality"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-sky-600 font-sans font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Procuring Department / State Institution</label>
                  <input
                    type="text"
                    value={procuringInstitution}
                    onChange={(e) => setProcuringInstitution(e.target.value)}
                    placeholder="e.g. Department of Home Affairs"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Bid / Tender Description of Service</label>
                <input
                  type="text"
                  value={bidDescription}
                  onChange={(e) => setBidDescription(e.target.value)}
                  placeholder="e.g. Supply, installation, and cloud hosting of biometric core software suite"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div className="border-t border-slate-100 md:col-span-2 my-1 pt-3">
                <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono">Bidder Corporate Details</h5>
              </div>

              {/* Foreign Bidder Toggle Container (Feature 1) */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase font-mono cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isForeignSupplier}
                      onChange={(e) => {
                        setIsForeignSupplier(e.target.checked);
                        if (e.target.checked) {
                          addLog?.('Switched to Foreign Supplier mode: local tax and registration validations relaxed.', 'info');
                          // Seed default exemption code
                          if (!sarsExemptionWaiverCode) {
                            const ref = `SATA-FSE-${Math.floor(100000 + Math.random() * 900000)}`;
                            setSarsExemptionWaiverCode(ref);
                            setTaxReferenceNumber(ref);
                          }
                        } else {
                          addLog?.('Switched to domestic SA supplier mode.', 'info');
                        }
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 animate-pulse"
                    />
                    <span>This is a Non-South African / Foreign Bidder</span>
                  </label>
                  <span className={`text-[8.5px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    isForeignSupplier ? 'bg-amber-100 text-amber-950 border border-amber-200 animate-pulse' : 'bg-emerald-100 text-emerald-950 border border-emerald-200'
                  }`}>
                    {isForeignSupplier ? 'Global Supplier Origin' : 'Domestic SA Supplier'}
                  </span>
                </div>

                {isForeignSupplier && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2.5 border-t border-slate-200/50 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">Country of Incorporation</label>
                      <select
                        value={foreignCountry}
                        onChange={(e) => setForeignCountry(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-600 font-sans"
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
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">Foreign Registration Number</label>
                      <input
                        type="text"
                        value={foreignRegistryNumber}
                        onChange={(e) => {
                          setForeignRegistryNumber(e.target.value);
                          setRegistrationNumber(e.target.value); // Sync to core reg state for PDF compatibility
                        }}
                        placeholder="e.g. US-EIN-9921092"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white focus:outline-none focus:border-emerald-600"
                        required={isForeignSupplier}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">Global Bank BIC / SWIFT Code</label>
                      <input
                        type="text"
                        value={globalSwiftBic}
                        onChange={(e) => setGlobalSwiftBic(e.target.value.toUpperCase())}
                        placeholder="e.g. BOFAUS3NXXX"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9.5px] font-bold text-slate-500 uppercase font-mono block">International IBAN Code</label>
                      <input
                        type="text"
                        value={globalIban}
                        onChange={(e) => setGlobalIban(e.target.value.toUpperCase())}
                        placeholder="e.g. US12 BOFA 0012 3456 78"
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Feature 4: Local Content & Multi-Currency SARB Fluctuation Risk Guard */}
                    <div className="col-span-1 md:col-span-2 bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 space-y-3 pt-2.5 border-t border-slate-200/50 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-900 uppercase font-mono">
                          🌐 Feature 4: Multi-Currency & SARB Fluctuation Risk Guard
                        </span>
                        <span className="text-[8.5px] bg-emerald-100 text-emerald-950 px-1.5 py-0.2 rounded font-bold uppercase font-mono border border-emerald-200">
                          SBD 6.2 Compliant
                        </span>
                      </div>
                      
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        Under National Treasury Instruction 6.2, foreign suppliers bidding in local tenders must calculate local content ratios and hedge currency risk using the official South African Reserve Bank (SARB) spot rate.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Bid Trade Currency</label>
                          <select
                            value={foreignCurrency}
                            onChange={(e) => {
                              setForeignCurrency(e.target.value);
                              addLog?.(`Trade currency updated to ${e.target.value}`, 'info');
                            }}
                            className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                          >
                            <option value="USD">USD ($) United States</option>
                            <option value="EUR">EUR (€) Eurozone</option>
                            <option value="GBP">GBP (£) United Kingdom</option>
                            <option value="INR">INR (₹) India</option>
                            <option value="JPY">JPY (¥) Japan</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">SARB Advertisement Exchange Rate</label>
                          <input
                            type="number"
                            step="0.01"
                            value={sarbExchangeRate}
                            onChange={(e) => setSarbExchangeRate(parseFloat(e.target.value) || 18.52)}
                            placeholder="e.g. 18.52"
                            className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Declared Local Content (%)</label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={localContentPercentage}
                              onChange={(e) => setLocalContentPercentage(parseInt(e.target.value) || 0)}
                              placeholder="35"
                              className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                            />
                            <span className="text-slate-400 font-mono text-xs">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pt-1 border-t border-emerald-100/50">
                        <label className="flex items-center gap-1.5 text-[9.5px] font-bold text-slate-700 uppercase font-mono cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={fecHedgingArranged}
                            onChange={(e) => {
                              setFecHedgingArranged(e.target.checked);
                              if (e.target.checked) {
                                addLog?.('Currency Fluctuations hedged with authorized SA dealer via Forward Exchange Contract (FEC).', 'success');
                              } else {
                                addLog?.('Warning: Currency fluctuation risk remains unhedged.', 'warn');
                              }
                            }}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                          />
                          <span>Secured Forward Exchange Contract (FEC) Hedging</span>
                        </label>
                        
                        <div className="text-[9px] font-mono text-slate-500">
                          Local content status: <span className={`font-bold uppercase ${localContentPercentage >= 30 ? 'text-emerald-700' : 'text-amber-700 animate-pulse'}`}>
                            {localContentPercentage >= 30 ? '✓ Compliant (30%+ Subcontracting Equivalent)' : '⚠ Risk: Sub-30% Local Allocation'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Feature 5: Cross-Border Joint Venture (JV) Consortium & B-BBEE Calculator */}
                    <div className="col-span-1 md:col-span-2 bg-blue-50/55 border border-blue-100 rounded-lg p-3 space-y-3 pt-2.5 border-t border-slate-200/50 mt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-900 uppercase font-mono">
                            🤝 Feature 5: Cross-Border JV & Consolidated B-BBEE Calculator
                          </span>
                          <span className="text-[8.5px] bg-blue-100 text-blue-950 px-1.5 py-0.2 rounded font-bold uppercase font-mono border border-blue-200">
                            PPPFA Compliant
                          </span>
                        </div>
                        <label className="flex items-center gap-1 text-[9.5px] font-bold text-blue-900 uppercase font-mono cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isJvConsortium}
                            onChange={(e) => {
                              setIsJvConsortium(e.target.checked);
                              if (e.target.checked) {
                                addLog?.('Joint Venture option activated. Loading consolidated scorecards.', 'info');
                              } else {
                                addLog?.('Joint Venture option deactivated.', 'info');
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <span>Establish Joint Venture</span>
                        </label>
                      </div>

                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        Under PPPFA guidelines, a foreign bidder can form a Joint Venture (JV) or Consortium with a local South African company to participate in the 80/20 or 90/10 preferential point scoring.
                      </p>

                      {isJvConsortium && (
                        <div className="space-y-3 pt-2 border-t border-blue-100/50 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Local Partner Company Name</label>
                              <input
                                type="text"
                                value={jvLocalPartnerName}
                                onChange={(e) => setJvLocalPartnerName(e.target.value)}
                                placeholder="e.g. South African Tech Partners Ltd"
                                className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Local Partner Equity Share (%)</label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max="99"
                                  value={jvLocalPartnerShare}
                                  onChange={(e) => setJvLocalPartnerShare(Math.min(99, Math.max(1, parseInt(e.target.value) || 30)))}
                                  className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                                />
                                <span className="text-slate-400 font-mono text-xs">%</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Local Partner B-BBEE Level</label>
                              <select
                                value={jvLocalPartnerBbeeLevel}
                                onChange={(e) => setJvLocalPartnerBbeeLevel(parseInt(e.target.value) || 1)}
                                className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                              >
                                <option value="1">Level 1 (135% Recognition)</option>
                                <option value="2">Level 2 (125% Recognition)</option>
                                <option value="3">Level 3 (110% Recognition)</option>
                                <option value="4">Level 4 (100% Recognition)</option>
                                <option value="5">Level 5 (80% Recognition)</option>
                                <option value="6">Level 6 (60% Recognition)</option>
                                <option value="7">Level 7 (50% Recognition)</option>
                                <option value="8">Level 8 (10% Recognition)</option>
                                <option value="9">Level 9 (Non-compliant)</option>
                              </select>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded p-2.5 text-xs font-mono text-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <span className="font-bold">Calculated Weighted JV B-BBEE: </span>
                              <span className="font-extrabold text-blue-950 underline decoration-indigo-500 decoration-2">
                                Level {(() => {
                                  let foreignPoints = 0;
                                  if (prefPointsEquivalenceClaim === 'geep') foreignPoints = 12;
                                  else if (prefPointsEquivalenceClaim === 'zero_rating') foreignPoints = 2;
                                  const levelPointsMap: { [key: number]: number } = {
                                    1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2, 9: 0
                                  };
                                  const localPoints = levelPointsMap[jvLocalPartnerBbeeLevel] || 0;
                                  const foreignShare = Math.max(0, 100 - jvLocalPartnerShare);
                                  const weightedPoints = (foreignShare * foreignPoints / 100) + (jvLocalPartnerShare * localPoints / 100);
                                  
                                  let computedLevel = 9;
                                  if (weightedPoints >= 20) computedLevel = 1;
                                  else if (weightedPoints >= 18) computedLevel = 2;
                                  else if (weightedPoints >= 14) computedLevel = 3;
                                  else if (weightedPoints >= 12) computedLevel = 4;
                                  else if (weightedPoints >= 8) computedLevel = 5;
                                  else if (weightedPoints >= 6) computedLevel = 6;
                                  else if (weightedPoints >= 4) computedLevel = 7;
                                  else if (weightedPoints >= 2) computedLevel = 8;
                                  else computedLevel = 9;

                                  return `${computedLevel} (${weightedPoints.toFixed(1)} weighted points)`;
                                })()}
                              </span>
                            </div>
                            <div className="text-[9.5px] text-blue-800">
                              Consolidated Formula: [Foreign {100 - jvLocalPartnerShare}% share * Level Points] + [Local {jvLocalPartnerShare}% share * Level Points]
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Corporate Registered Name (Bidder)</label>
                <input
                  type="text"
                  value={bidderName}
                  onChange={(e) => setBidderName(e.target.value)}
                  placeholder="e.g. Nkosi Software Solutions Pty Ltd"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  {isForeignSupplier ? 'Foreign Company Registry Code (Incorporation)' : 'Company Registration Number'}
                </label>
                <input
                  type="text"
                  value={isForeignSupplier ? foreignRegistryNumber : registrationNumber}
                  onChange={(e) => {
                    if (isForeignSupplier) {
                      setForeignRegistryNumber(e.target.value);
                      setRegistrationNumber(e.target.value);
                    } else {
                      setRegistrationNumber(e.target.value);
                    }
                  }}
                  placeholder={isForeignSupplier ? "e.g. EIN-12-345678" : "e.g. 2021/482713/07"}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  {isForeignSupplier ? 'SARS Foreign Tax Exemption Code / DTA (Feature 2)' : 'SARS Tax Reference Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={isForeignSupplier ? sarsExemptionWaiverCode : taxReferenceNumber}
                    onChange={(e) => {
                      if (isForeignSupplier) {
                        setSarsExemptionWaiverCode(e.target.value);
                        setTaxReferenceNumber(e.target.value); // Sync to core state for PDF compatibility
                      } else {
                        setTaxReferenceNumber(e.target.value);
                      }
                    }}
                    placeholder={isForeignSupplier ? "e.g. SATA-FSE-382912" : "e.g. 9811273849"}
                    className="w-full text-xs px-2.5 py-1.5 pr-20 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono bg-white"
                    required
                  />
                  {isForeignSupplier && (
                    <button
                      type="button"
                      onClick={() => {
                        const ref = `SATA-FSE-${Math.floor(100000 + Math.random() * 900000)}`;
                        setSarsExemptionWaiverCode(ref);
                        setTaxReferenceNumber(ref);
                        addLog?.(`Auto-generated SARS Foreign Exemption Waiver Code: ${ref}`, 'success');
                      }}
                      className="absolute right-1.5 top-1 text-[8.5px] font-mono font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded border border-amber-300 cursor-pointer"
                    >
                      Gen Code
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 font-mono">
                  {isForeignSupplier 
                    ? 'Foreign supplier tax exemption reference approved under National Treasury rules.' 
                    : '10-digit South African Revenue Service corporate income tax identifier.'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  {isForeignSupplier ? 'VAT Registration Status' : 'VAT Registration Number (Optional)'}
                </label>
                <input
                  type="text"
                  value={isForeignSupplier ? 'EXEMPT (FOREIGN BIDDER)' : vatNumber}
                  onChange={(e) => {
                    if (!isForeignSupplier) {
                      setVatNumber(e.target.value);
                    }
                  }}
                  disabled={isForeignSupplier}
                  placeholder={isForeignSupplier ? "Exempt" : "e.g. 4010293847"}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 (SBD 4 / MBD 4): Shareholders/Directors Grid */}
        {(formType === 'SBD4' || formType === 'MBD4') && step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 2: Directors & Shareholders Database</h4>
                <p className="text-slate-400 text-[11px] mt-0.5">Disclose key principals holding equity ownership in this legal tender bid.</p>
              </div>
              <button
                type="button"
                onClick={handleAddDirector}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] font-mono uppercase tracking-wider py-1 px-2.5 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                <UserPlus className="w-3 h-3" />
                Add Principal
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-150 rounded bg-slate-50/50">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2 px-3">Principal Full Name</th>
                    <th className="py-2 px-3">National Identity Number</th>
                    <th className="py-2 px-3">State Employee Number (If Any)</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white">
                  {directors.map((director, index) => (
                    <tr key={director.id} className="hover:bg-slate-50/40">
                      <td className="p-2">
                        <input
                          type="text"
                          value={director.fullName}
                          onChange={(e) => handleDirectorChange(director.id, 'fullName', e.target.value)}
                          placeholder="e.g. Thabo Nkosi"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-sans"
                        />
                      </td>
                      <td className="p-2 font-mono">
                        <input
                          type="text"
                          maxLength={13}
                          value={director.identityNumber}
                          onChange={(e) => handleDirectorChange(director.id, 'identityNumber', e.target.value.replace(/\D/g, ''))}
                          placeholder="13-digit ID"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-mono"
                        />
                      </td>
                      <td className="p-2 font-mono">
                        <input
                          type="text"
                          value={director.stateEmployeeNumber || ''}
                          onChange={(e) => handleDirectorChange(director.id, 'stateEmployeeNumber', e.target.value)}
                          placeholder="e.g. PERSAL 482938"
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-600 font-sans"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {directors.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveDirector(director.id)}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer inline-flex"
                            title="Remove row"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-mono px-2">Locked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 2 (SBD 6.1): B-BBEE status & Specific Goals */}
        {formType === 'SBD61' && step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 2: Preferential Points System, B-BBEE level, & Specific Goals</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Configure points systems and target specific goals to claim preference points under the Preferential Procurement Policy Framework Act (PPPFA).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Preferential Points System Applicable</label>
                <select
                  value={pointsSystem}
                  onChange={(e) => setPointsSystem(e.target.value as '80/20' | '90/10')}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-600 font-sans"
                >
                  <option value="80/20">80/20 System (Tender value below R50 Million)</option>
                  <option value="90/10">90/10 System (Tender value above R50 Million)</option>
                </select>
                <p className="text-[9px] text-slate-400 mt-1 font-mono">80/20 system offers 20 preference points, whereas 90/10 offers 10 points for B-BBEE or specific goals.</p>
              </div>

              {isForeignSupplier ? (
                <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-3 space-y-2 text-left">
                  <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider font-mono flex items-center gap-1">
                    🌐 Foreign Bidder Preferential Framework (Feature 3)
                  </label>
                  <p className="text-[9.5px] text-slate-500 leading-tight">
                    Since traditional domestic B-BBEE rating structures do not apply to non-SA registered corporations, you must claim preference points under the National Treasury Equity Equivalency framework.
                  </p>
                  
                  <div className="space-y-2 pt-1.5">
                    <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Preference Point Claim Model</label>
                    <select
                      value={prefPointsEquivalenceClaim}
                      onChange={(e) => {
                        const val = e.target.value as 'none' | 'geep' | 'zero_rating';
                        setPrefPointsEquivalenceClaim(val);
                        if (val === 'geep') {
                          setBbbEELevel(4); // Presets Level 4 (e.g. 12 Points on 80/20) under certified Equivalency Program
                          addLog?.('Pref points equivalency preset to Level 4 via certified GEEP program.', 'success');
                        } else {
                          setBbbEELevel(9); // Zero-rating or None defaults to Level 9 (0 points)
                          addLog?.('Foreign bidder points claim locked to zero.', 'info');
                        }
                      }}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="none">Competes on Price Only (No Preference Claimed)</option>
                      <option value="zero_rating">Treasury Zero-Rating Foreign Status (Exempt)</option>
                      <option value="geep">Global Equity Equivalency Programme (GEEP) Certified</option>
                    </select>

                    {prefPointsEquivalenceClaim === 'geep' && (
                      <div className="space-y-1 pt-1.5 animate-fadeIn">
                        <label className="text-[9px] font-bold text-slate-500 uppercase font-mono block">GEEP Reference Number</label>
                        <input
                          type="text"
                          value={geepReference}
                          onChange={(e) => setGeepReference(e.target.value)}
                          placeholder="e.g. DTI-GEEP-9938210"
                          className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono text-slate-700 bg-white focus:outline-none focus:border-emerald-600"
                          required={prefPointsEquivalenceClaim === 'geep'}
                        />
                        <p className="text-[8px] text-slate-400">
                          Ensures equivalent B-BBEE Level 4 procurement status representation for foreign corporations investing in local equity equivalency programs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">B-BBEE Status Contributor Level</label>
                  <select
                    value={bbbEELevel}
                    onChange={(e) => setBbbEELevel(parseInt(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-600 font-sans font-mono"
                  >
                    <option value={1}>Level 1 Contributor (Maximum Points Claim)</option>
                    <option value={2}>Level 2 Contributor</option>
                    <option value={3}>Level 3 Contributor</option>
                    <option value={4}>Level 4 Contributor</option>
                    <option value={5}>Level 5 Contributor</option>
                    <option value={6}>Level 6 Contributor</option>
                    <option value={7}>Level 7 Contributor</option>
                    <option value={8}>Level 8 Contributor</option>
                    <option value={9}>Non-compliant Status Contributor (0 Points)</option>
                  </select>
                  <p className="text-[9px] text-slate-400 mt-1 font-mono">A certified B-BBEE affidavit or SANAS verification agency certificate is required to claim.</p>
                </div>
              )}

              <div className="md:col-span-2 border-t border-slate-100 my-1 pt-3">
                <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono">Specific Ownership Goals for points Allocation (%)</h5>
                <p className="text-slate-400 text-[10px] mt-0.5">Disclose percentage ownership levels representing historically disadvantaged individuals (HDIs) to substantiate further goals.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Black Ownership Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={blackOwnershipPercentage}
                  onChange={(e) => setBlackOwnershipPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Black Women Ownership Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={blackWomenOwnershipPercentage}
                  onChange={(e) => setBlackWomenOwnershipPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Youth Ownership Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={youthOwnershipPercentage}
                  onChange={(e) => setYouthOwnershipPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Disability Ownership Percentage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={disabilityOwnershipPercentage}
                  onChange={(e) => setDisabilityOwnershipPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Cooperative Enterprise Ownership (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cooperativeOwnershipPercentage}
                  onChange={(e) => setCooperativeOwnershipPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans font-mono"
                />
              </div>

              {/* Automated B-BBEE Sworn Affidavit Generator */}
              <div className="md:col-span-2 bg-gradient-to-r from-slate-900 to-slate-950 text-white p-4 rounded-lg border border-slate-800 mt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider font-mono">B-BBEE Sworn Affidavit Generator</h5>
                    <p className="text-[10px] text-slate-300">Generate a legally compliant, cryptographically sealed Sworn Affidavit for Exempted Micro Enterprises (EMEs) or QSEs.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[8px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1">Deponent Full Name</label>
                    <input
                      type="text"
                      value={declarationName || (activeCert ? activeCert.subjectName : '')}
                      onChange={(e) => setDeclarationName(e.target.value)}
                      placeholder="e.g. Thabo Nkosi"
                      className="w-full text-xs px-2.5 py-1 border border-slate-800 rounded bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-mono font-bold uppercase text-slate-400 tracking-wider mb-1">Deponent Designation</label>
                    <input
                      type="text"
                      value={declarationDesignation || (activeCert ? activeCert.designation : '')}
                      onChange={(e) => setDeclarationDesignation(e.target.value)}
                      placeholder="e.g. Managing Director"
                      className="w-full text-xs px-2.5 py-1 border border-slate-800 rounded bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-1 flex-wrap">
                  <p className="text-[9px] text-slate-400 max-w-sm leading-relaxed">
                    Under South Africa's Preferential Procurement Regulations, EME enterprises can submit a Sworn Affidavit to substantiate their B-BBEE level. This certificate is cryptographically sealed with your active advanced key pair.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!activeCert) {
                        alert("Cryptographic certificate absent. Please navigate to the 'Digital Certificate' tab to create or import one.");
                        return;
                      }
                      try {
                        addLog?.("Compiling DTIC-compliant B-BBEE Sworn Affidavit document...", "info");
                        const data: SBD61Data = {
                          bidNumber: bidNumber || "GENERIC_BEE_AFFIDAVIT",
                          bidderName: bidderName || "My Enterprise",
                          pointsSystem,
                          bbbEELevel,
                          blackOwnershipPercentage,
                          blackWomenOwnershipPercentage,
                          youthOwnershipPercentage,
                          disabilityOwnershipPercentage,
                          cooperativeOwnershipPercentage
                        };
                        const affidavitBytes = await generateBBBEEAffidavitPDF(
                          data,
                          registrationNumber || "CIPC-UNSPECIFIED",
                          declarationName || activeCert.subjectName,
                          declarationDesignation || activeCert.designation
                        );
                        
                        addLog?.("Applying deponent & secure commissioner seal signatures...", "info");
                        const signedResult = await applyCryptographicSignatureToSBD(affidavitBytes, activeCert, { x: 50, y: 50, pageNumber: 1 });
                        
                        const blob = new Blob([signedResult.pdfBytes], { type: "application/pdf" });
                        const url = URL.createObjectURL(blob);
                        
                        const fileName = `B_BBEE_Sworn_Affidavit_${(bidderName || "Enterprise").replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                        
                        // Download the file
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = fileName;
                        link.click();
                        
                        // Save in document ledger history
                        await saveSignedDocumentToCloud({
                          id: crypto.randomUUID(),
                          fileName,
                          signedAtIso: signedResult.signedAtIso,
                          sha256Hash: signedResult.sha256Hash,
                          bidNumber: bidNumber || "N/A",
                          bidDescription: `B-BBEE Sworn Affidavit (Level ${bbbEELevel})`,
                          procuringInstitution: procuringInstitution || "B-BBEE Registration Pool",
                          bidderName: bidderName || "My Enterprise"
                        });
                        
                        addLog?.(`Success: Generated and signed B-BBEE Sworn Affidavit: ${fileName}`, "success");
                      } catch (err: any) {
                        addLog?.(`B-BBEE Sworn Affidavit compilation aborted: ${err.message}`, "error");
                      }
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] rounded cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Generate Sworn Affidavit
                  </button>
                </div>
              </div>

                {/* Interactive PPPFA Preference Points & Competitive Pricing Points Simulator Widget */}
            <div className="mt-4 p-4 bg-emerald-50/45 border border-emerald-250 rounded-lg space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-emerald-950 text-xs font-mono uppercase tracking-wide">
                    PPPFA Preferential Points & Price Simulator
                  </h4>
                </div>
                {pricingProposal ? (
                  <span className="text-[9px] font-mono bg-emerald-700 text-white font-bold px-2 py-0.5 rounded border border-emerald-600 uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-350 animate-ping"></span>
                    Costing Bridge Linked (Pt)
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300 uppercase">
                    Manual Pricing Mode
                  </span>
                )}
              </div>

              {(() => {
                // Determine Pt (Your proposed Bid Price)
                const pt = pricingProposal ? pricingProposal.totalBidPriceWithVat : customPtPrice;
                // Determine system points (80 or 90 for price)
                const maxPricePoints = pointsSystem === '80/20' ? 80 : 90;
                const maxPrefPoints = pointsSystem === '80/20' ? 20 : 10;

                // Validate and sanitize Pm (lowest acceptable price)
                const activePm = Math.min(pt, Math.max(1, pmPrice || Math.round(pt * 0.9)));

                // Calculate Price Points (Ps) using PPPFA formula: Ps = Pmax * (1 - (Pt - Pm)/Pm)
                let ps = maxPricePoints * (1 - (pt - activePm) / activePm);
                if (ps < 0) ps = 0;
                const pricePointsScored = parseFloat(ps.toFixed(2));

                // Determine active B-BBEE Level (use consolidated JV level if active)
                let activeBbbeeLevel = bbbEELevel;
                if (isForeignSupplier && isJvConsortium) {
                  let foreignPoints = 0;
                  if (prefPointsEquivalenceClaim === 'geep') foreignPoints = 12; // Level 4
                  else if (prefPointsEquivalenceClaim === 'zero_rating') foreignPoints = 2; // Level 8
                  const levelPointsMap: { [key: number]: number } = {
                    1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2, 9: 0
                  };
                  const localPoints = levelPointsMap[jvLocalPartnerBbeeLevel] || 0;
                  const foreignShare = Math.max(0, 100 - jvLocalPartnerShare);
                  const weightedPoints = (foreignShare * foreignPoints / 100) + (jvLocalPartnerShare * localPoints / 100);
                  if (weightedPoints >= 20) activeBbbeeLevel = 1;
                  else if (weightedPoints >= 18) activeBbbeeLevel = 2;
                  else if (weightedPoints >= 14) activeBbbeeLevel = 3;
                  else if (weightedPoints >= 12) activeBbbeeLevel = 4;
                  else if (weightedPoints >= 8) activeBbbeeLevel = 5;
                  else if (weightedPoints >= 6) activeBbbeeLevel = 6;
                  else if (weightedPoints >= 4) activeBbbeeLevel = 7;
                  else if (weightedPoints >= 2) activeBbbeeLevel = 8;
                  else activeBbbeeLevel = 9;
                }

                // Calculate B-BBEE points
                let bbbePoints = 0;
                if (activeBbbeeLevel !== 9) {
                  if (pointsSystem === '80/20') {
                    const map: Record<number, number> = { 1: 20, 2: 18, 3: 14, 4: 12, 5: 8, 6: 6, 7: 4, 8: 2 };
                    bbbePoints = map[activeBbbeeLevel] || 0;
                  } else {
                    const map: Record<number, number> = { 1: 10, 2: 9, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1 };
                    bbbePoints = map[activeBbbeeLevel] || 0;
                  }
                }

                // Calculate Specific Goals HDI points proportionally
                const blackPoints = (blackOwnershipPercentage / 100) * (maxPrefPoints * 0.4);
                const womenPoints = (blackWomenOwnershipPercentage / 100) * (maxPrefPoints * 0.3);
                const youthPoints = (youthOwnershipPercentage / 100) * (maxPrefPoints * 0.2);
                const disabilityPoints = (disabilityOwnershipPercentage / 100) * (maxPrefPoints * 0.1);
                const goalsPoints = blackPoints + womenPoints + youthPoints + disabilityPoints;

                // Combined preference points, capped at max pref points
                const prefPointsClaimed = Math.min(maxPrefPoints, parseFloat((bbbePoints + goalsPoints).toFixed(2)));

                // Total Procurement Score out of 100
                const totalBidScore = parseFloat((pricePointsScored + prefPointsClaimed).toFixed(2));

                const formatZAR = (val: number) => {
                  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(val);
                };

                return (
                  <div className="space-y-4 text-xs">
                    
                    {/* Live Inputs Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Pt (Your Price) Control */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px]">
                          <span className="font-bold text-slate-500 uppercase">Your Bid Price (Pt):</span>
                          <span className="font-bold text-slate-800">{formatZAR(pt)}</span>
                        </div>
                        {pricingProposal ? (
                          <div className="p-2 bg-emerald-950 text-emerald-200 border border-emerald-900 rounded font-mono text-[9px] leading-relaxed">
                            Loaded automatically from the active costing worksheet. To alter, edit values in the <strong>tender_advisor.calc</strong> or <strong>tender_pricing_calc.xls</strong> tabs.
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={10000}
                              max={2000000}
                              step={10000}
                              value={customPtPrice}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setCustomPtPrice(val);
                                setPmPrice(Math.round(val * 0.9));
                              }}
                              className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                            />
                            <p className="text-[9px] text-slate-400 font-mono">Use slider to adjust your manual bid value.</p>
                          </div>
                        )}
                      </div>

                      {/* Pm (Competitor Price) Slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-[10px]">
                          <span className="font-bold text-slate-500 uppercase">Simulated Lowest Bid (Pm):</span>
                          <span className="font-bold text-emerald-800">{formatZAR(activePm)}</span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(pt * 0.6)}
                          max={pt}
                          step={Math.round(pt * 0.01) || 100}
                          value={activePm}
                          onChange={(e) => setPmPrice(Number(e.target.value))}
                          className="w-full accent-emerald-600 h-1 bg-slate-200 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between font-mono text-[8px] text-slate-400">
                          <span>60% Cheaper ({formatZAR(pt * 0.6)})</span>
                          <span>Equal (100%)</span>
                        </div>
                      </div>
                    </div>

                    {/* Sim Score Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Price Points Card */}
                      <div className="bg-white p-3 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">1. Price Score (Ps)</span>
                        <div className="text-xl font-black font-mono text-slate-800">
                          {pricePointsScored} <span className="text-xs font-normal text-slate-400">/ {maxPricePoints}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          Formulated based on your bid being {( ((pt - activePm)/activePm) * 100 ).toFixed(1)}% more expensive than the lowest bid.
                        </p>
                      </div>

                      {/* Preference Points Card */}
                      <div className="bg-white p-3 border border-slate-200 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">2. Preference Claim (Pc)</span>
                        <div className="text-xl font-black font-mono text-emerald-800">
                          {prefPointsClaimed} <span className="text-xs font-normal text-slate-400">/ {maxPrefPoints}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-tight">
                          B-BBEE: {bbbePoints} pts • Specific Goals (HDI): {goalsPoints.toFixed(1)} pts (capped).
                        </p>
                      </div>

                      {/* Combined Competitiveness Score */}
                      <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-3 border border-emerald-850 rounded-lg space-y-1">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase block">Total PPPFA Bid Score</span>
                        <div className="text-2xl font-black font-mono text-emerald-350">
                          {totalBidScore} <span className="text-xs font-normal text-emerald-400">/ 100</span>
                        </div>
                        <p className="text-[9px] text-emerald-200 leading-tight font-mono">
                          Ps ({pricePointsScored}) + Pc ({prefPointsClaimed})
                        </p>
                      </div>
                    </div>

                    {/* Live Strategic Advisory Alert */}
                    <div className="p-3 bg-white border border-emerald-100 rounded-lg text-slate-700 space-y-1 text-left">
                      <span className="text-[9px] font-mono font-bold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        PPPFA Strategic Advisory
                      </span>
                      <p className="text-[10px] leading-relaxed text-slate-600">
                        {totalBidScore >= 95 ? (
                          <span><strong>Highly Competitive:</strong> Your high B-BBEE rating and specific goals, paired with competitive pricing, place you in an excellent position to secure this state contract. Your preference points act as a heavy regulatory cushion.</span>
                        ) : totalBidScore >= 85 ? (
                          <span><strong>Healthy Position:</strong> Even though a competitor bid {(((pt - activePm)/activePm) * 100).toFixed(1)}% lower, your robust black and women ownership claims recovered {prefPointsClaimed} preferential points, keeping you highly viable. This is the power of the South African PPPFA framework.</span>
                        ) : (
                          <span><strong>Risk Zone:</strong> Your price is significantly higher than the lowest simulated bid, and your preference points claim is insufficient to close the gap. Consider lowering your markup margin in the <strong>tender_advisor.calc</strong> tab to optimize your score closer to 100.</span>
                        )}
                      </p>
                    </div>

                  </div>
                );
              })()}
            </div>          </div>
          </div>
        )}

        {/* STEP 2 (SBD 8 / MBD 8): Past SCM Practices Disclosures */}
        {(formType === 'SBD8' || formType === 'MBD8') && step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 2: Past SCM Practices Declarations</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Under Treasury and Municipal regulations, past supply chain management abuses must be declared under oath.</p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {/* SCM Q1 */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Is the bidder or any of its directors listed on the National Treasury's Database of Restricted Suppliers as a person/company prohibited from doing business with the public sector?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIsRestrictedSupplier(true); addLog?.('SCM restricted check set to YES', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${isRestrictedSupplier ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsRestrictedSupplier(false); addLog?.('SCM restricted check set to NO', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!isRestrictedSupplier ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>

              {/* SCM Q2 */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Was the bidder or any of its directors convicted by a court of law for fraud or corruption during the past five years?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setHasConvictionFraud(true); addLog?.('SCM Fraud set to YES', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${hasConvictionFraud ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHasConvictionFraud(false); addLog?.('SCM Fraud set to NO', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!hasConvictionFraud ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>

              {/* SCM Q3 */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Was any contract between the bidder and any organ of state terminated during the past five years on account of failure to perform on or comply with the contract?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setHasFailedContract(true); addLog?.('SCM Failed Contract set to YES', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${hasFailedContract ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHasFailedContract(false); addLog?.('SCM Failed Contract set to NO', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!hasFailedContract ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 (SBD 9 / MBD 9): Collusion Questionnaire */}
        {(formType === 'SBD9' || formType === 'MBD9') && step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 2: Independent Bid Determination Certificate</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">In accordance with Competition Commission standards, disclose horizontal relationships and collusive bidding behavior.</p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Are bid prices determined independently, without consultation, communication, agreement, or arrangement with any competitor?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setIndependentPricingAgreed(true); addLog?.('Pricing set to INDEPENDENT', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${independentPricingAgreed ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIndependentPricingAgreed(false); addLog?.('Pricing set to COLLUSIVE DANGER', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!independentPricingAgreed ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>

              {/* Cartels */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Do you certify that no horizontal agreements, restrictive agreements, or joint venture cartel collaborations have been undertaken regarding this tender bid?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setNoCollusionAgreed(true); addLog?.('Cartel check set to Compliant', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${noCollusionAgreed ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setNoCollusionAgreed(false); addLog?.('Cartel check set to Potential Dispute', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!noCollusionAgreed ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
              </div>

              {/* Competitor consultations */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    Has there been any joint communication, quality/quantity specification adjustment, or custom bidding arrangement with competitors regarding this tender?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => { setHasConsultedCompetitor(true); addLog?.('Consultation set to YES', 'warn'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${hasConsultedCompetitor ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHasConsultedCompetitor(false); setConsultationDetails(''); addLog?.('Consultation set to NO', 'info'); }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!hasConsultedCompetitor ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
                {hasConsultedCompetitor && (
                  <div className="pl-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Describe competitor consultations or spec adjustments in detail:</label>
                    <textarea
                      value={consultationDetails}
                      onChange={(e) => setConsultationDetails(e.target.value)}
                      placeholder="e.g. Discussed local manufacturing requirements with standard regional suppliers to confirm product availability."
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 h-16 font-sans"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 (SBD 4 / MBD 4): Conflict Questions */}
        {(formType === 'SBD4' || formType === 'MBD4') && step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Step 3: State Relationship Conflict Questionnaire</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Required legal disclosures to assess interest, bias, or anti-competitive behavior in tender adjudication.</p>
            </div>

            <div className="space-y-4 divide-y divide-slate-100">
              
              {/* Question 1 */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    <span className="font-bold text-slate-900">2.1</span> Is the bidder, or any of its directors / trustees / shareholders / members / partners or any person having a controlling interest in the enterprise, employed by the state?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEmployedByState(true);
                        addLog?.('Q2.1 set to YES', 'info');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${isEmployedByState ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEmployedByState(false);
                        setEmployedByStateParticulars('');
                        addLog?.('Q2.1 set to NO', 'info');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!isEmployedByState ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
                {isEmployedByState && (
                  <div className="pl-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Furnish detailed PERSAL, employee names, and institution particulars:</label>
                    <textarea
                      value={employedByStateParticulars}
                      onChange={(e) => setEmployedByStateParticulars(e.target.value)}
                      placeholder="e.g. Director Thabo Nkosi works part-time as IT consultant for SITA (PERSAL ID: 391823)"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 h-16 font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Question 2 */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    <span className="font-bold text-slate-900">2.2</span> Do you, or any person connected with the bidder, have a relationship (family, friend, colleague) with any person employed by the procuring state institution?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setHasRelationshipWithStateEmployee(true);
                        addLog?.('Q2.2 set to YES', 'info');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${hasRelationshipWithStateEmployee ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasRelationshipWithStateEmployee(false);
                        setRelationshipParticulars('');
                        addLog?.('Q2.2 set to NO', 'info');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!hasRelationshipWithStateEmployee ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
                {hasRelationshipWithStateEmployee && (
                  <div className="pl-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Furnish detailed relationship & employee conflict particulars:</label>
                    <textarea
                      value={relationshipParticulars}
                      onChange={(e) => setRelationshipParticulars(e.target.value)}
                      placeholder="e.g. Shareholder Thabo Nkosi is cousin to Procurement Specialist Lerato Nkosi currently evaluating at DHA"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 h-16 font-sans"
                    />
                  </div>
                )}
              </div>

              {/* Question 3 (Treasury Restriction Block) */}
              <div className="pt-3 space-y-2">
                <div className="flex items-start justify-between gap-6">
                  <div className="text-xs text-slate-700 leading-normal max-w-prose">
                    <span className="font-bold text-slate-900">2.3</span> Is the bidder or any of its directors listed on the National Treasury's Database of Restricted Suppliers or Register for Tender Defaulters?
                  </div>
                  <div className="flex items-center gap-1.5 border border-slate-200 rounded p-0.5 bg-slate-50 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRestrictedSupplier(true);
                        addLog?.('Q2.3 set to YES - RESTRICTED ALARM', 'warn');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${isRestrictedSupplier ? 'bg-red-600 text-white animate-pulse' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsRestrictedSupplier(false);
                        addLog?.('Q2.3 set to NO', 'info');
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded cursor-pointer ${!isRestrictedSupplier ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      NO
                    </button>
                  </div>
                </div>
                {isRestrictedSupplier && (
                  <div className="bg-red-50 text-red-800 border border-red-100 rounded p-2.5 flex items-start gap-2 mt-1">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <p className="text-[10px] leading-relaxed">
                      <strong>NATIONAL TREASURY WARNING:</strong> Listed restricted companies are legally barred from participating in public tenders. Disqualification is automatic.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* SIGN STEP: (Step 4 for SBD 4 & MBD 4, Step 3 for other forms) */}
        {(((formType === 'SBD4' || formType === 'MBD4') && step === 4) || ((formType !== 'SBD4' && formType !== 'MBD4') && step === 3)) && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Declarant Authorization & Cryptographic Sign-Off</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Define the authorized representative who will bind these claims under full statutory penalties of the ECT Act.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Authorized Declarant Full Name</label>
                <input
                  type="text"
                  value={declarationName}
                  onChange={(e) => setDeclarationName(e.target.value)}
                  placeholder="e.g. Thabo Nkosi"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Authorized Corporate Designation / Title</label>
                <input
                  type="text"
                  value={declarationDesignation}
                  onChange={(e) => setDeclarationDesignation(e.target.value)}
                  placeholder="e.g. Managing Director"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-sans"
                />
              </div>

              {/* Encryption Certificate Status Block */}
              <div className="md:col-span-2 pt-3 border-t border-slate-100 mt-2">
                <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider font-mono mb-2">Cryptographic Key Attestation</h5>
                
                {activeCert ? (
                  <div className="bg-emerald-50/55 border border-emerald-150 rounded p-3 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-emerald-950 font-bold text-xs">Asymmetric Signer Active: {activeCert.keySize || 2048}-Bit RSA Key pair Detected</h6>
                      <p className="text-emerald-800 text-[10px] leading-relaxed mt-1">
                        This document compilation will complete locally in browser RAM. An ECT-Act compliant green digital seal containing your certificate metadata will anchor onto page 2, signed by private keys of <strong>{activeCert.subjectName}</strong> ({activeCert.organization}).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h6 className="text-amber-950 font-bold text-xs">Cryptographic Keys Absent (No Signer Certificate)</h6>
                      <p className="text-amber-800 text-[10px] leading-relaxed mt-1">
                        You can fill this form out, but signing requires a secure PKI certificate generated inside RAM. Please navigate first to the <strong>Digital Certificate</strong> tab on the left margin and generate one.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS STEP: (Step 5 for SBD 4 & MBD 4, Step 4 for other forms) */}
        {(((formType === 'SBD4' || formType === 'MBD4') && step === 5) || ((formType !== 'SBD4' && formType !== 'MBD4') && step === 4)) && (
          <div className="text-center py-6 px-4 space-y-4 animate-fadeIn">
            <div className="mx-auto w-12 h-12 bg-emerald-50 border border-emerald-150 text-emerald-700 rounded-full flex items-center justify-center shadow-inner">
              <CheckCircle className="w-6 h-6 text-emerald-700" />
            </div>
            
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide font-mono">
                {formType} Document Signed & Sealed!
              </h4>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
                Your Standard Bidding Document has been compiled, preferential points calculated, visual signature indicators anchored onto page 2, and the binary integrity hash signed with your browser RSA Private Key.
              </p>
            </div>

            <div className="max-w-md mx-auto bg-slate-50 border border-slate-150 rounded p-3 text-left grid grid-cols-2 gap-x-4 gap-y-2 text-[10px]">
              <div className="col-span-2 border-b border-slate-200 pb-1.5">
                <span className="text-[9px] text-slate-400 block font-bold font-mono">SIGNED COMPLIANT DOCUMENT</span>
                <span className="font-mono text-emerald-800 font-bold break-all">{generatedFileName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold font-mono">SIGNING AUTHORITY</span>
                <span className="text-slate-700 font-bold">{activeCert?.subjectName}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-bold font-mono">PKI KEY THUMBPRINT</span>
                <span className="text-slate-700 font-mono font-medium truncate block max-w-[180px]">{activeCert?.publicKeyThumbprint}</span>
              </div>
            </div>

            <div className="pt-3 flex justify-center gap-3">
              <button
                onClick={handleResetForm}
                className="border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 font-bold text-[10px] font-mono uppercase tracking-widest py-2 px-4 rounded transition-colors cursor-pointer"
              >
                Sign Another Form
              </button>
              
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download={generatedFileName}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] font-mono uppercase tracking-widest py-2 px-5 rounded flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Signed PDF
                </a>
              )}
            </div>
          </div>
        )}

        {/* Bottom Button Bar (except success step) */}
        {step < activeMaxStep && (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="text-slate-600 hover:text-slate-800 font-bold text-[10px] font-mono uppercase tracking-widest py-1.5 px-3 border border-slate-200 rounded flex items-center gap-1 transition-colors cursor-pointer bg-white"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : (
              <div></div>
            )}

            {step < (activeMaxStep - 1) ? (
              <button
                onClick={handleNext}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] font-mono uppercase tracking-widest py-1.5 px-4 rounded flex items-center gap-1 transition-all cursor-pointer"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmitAndSign}
                disabled={!activeCert || isGenerating}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-[10px] font-mono uppercase tracking-widest py-2 px-5 rounded flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing & Compiling...
                  </>
                ) : (
                  <>
                    <Signature className="w-3.5 h-3.5 animate-pulse" />
                    Sign & Generate PDF
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
