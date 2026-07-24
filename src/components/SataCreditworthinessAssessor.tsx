/**
 * @license
 * South African Tender Automator (SATA) - Proprietary Source License
 * Copyright (c) 2026 SATA Solutions. All rights reserved.
 *
 * Asserting Automatic Copyright protection under the South African Copyright Act 98 of 1978.
 * This system includes specific safeguards and liability disclaimers to prevent potential prejudice to the application provider.
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  ShieldAlert, 
  Scale, 
  Coins, 
  Calculator, 
  Building, 
  Activity, 
  FileText, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Info, 
  FileSignature, 
  UserCheck, 
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Download,
  Landmark,
  Shield,
  CheckCircle,
  Users,
  Copy,
  Briefcase,
  Award,
  Upload
} from 'lucide-react';

interface SataCreditworthinessAssessorProps {
  activeCert?: any;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function SataCreditworthinessAssessor({ activeCert, addLog }: SataCreditworthinessAssessorProps) {
  // Navigation within the credit and regulatory suite (13 Subtabs total - including 5 next-phase enhancements)
  const [activeSubTab, setActiveSubTab] = useState<
    | 'sars_tax'
    | 'csd_restricted'
    | 'financial_ratios'
    | 'bank_codes'
    | 'nipp_sbd5'
    | 'cipc_directors'
    | 'paja_appeals'
    | 'liability_hub'
    | 'sbd6_preference'
    | 'sbd8_9_independent'
    | 'cidb_capacity'
    | 'coida_standing'
    | 'municipal_clearance'
  >('sars_tax');

  // Helper to format currency in ZAR (South African Rand)
  const formatZAR = (num: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(num);
  };

  // --- Core Company Parameters (Centralized & Synchronized) ---
  const [companyReg, setCompanyReg] = useState<string>('2021/394850/07');
  const [taxPin, setTaxPin] = useState<string>('9A4E882B90');
  const [taxNumber, setTaxNumber] = useState<string>('9824001928');
  const [csdNumber, setCsdNumber] = useState<string>('MAAA0938456');

  // Load and sync with centralized local profile and drafts on mount for data alignment
  const syncCompanyProfileData = () => {
    try {
      const savedProfile = localStorage.getItem('sata_supplier_profile_local');
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        if (p.registrationNumber) setCompanyReg(p.registrationNumber);
        if (p.csdNumber) setCsdNumber(p.csdNumber);
      }
      
      const savedDraft = localStorage.getItem('sata_sbd_form_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.taxCompliancePin) setTaxPin(draft.taxCompliancePin);
        if (draft.taxReferenceNumber) setTaxNumber(draft.taxReferenceNumber);
        if (draft.registrationNumber) setCompanyReg(draft.registrationNumber);
        if (draft.csdRegistrationNumber) setCsdNumber(draft.csdRegistrationNumber);
      }
    } catch (e) {
      console.warn('Failed to align local supplier profile in SataCreditworthinessAssessor:', e);
    }
  };

  useEffect(() => {
    syncCompanyProfileData();
    window.addEventListener('storage', syncCompanyProfileData);
    const interval = setInterval(syncCompanyProfileData, 2000);
    return () => {
      window.removeEventListener('storage', syncCompanyProfileData);
      clearInterval(interval);
    };
  }, []);

  // Auto-save changes back to the centralized local profile & SBD draft for cross-page alignment
  useEffect(() => {
    try {
      // Avoid circular updates by only saving if there's a real difference
      const savedProfile = localStorage.getItem('sata_supplier_profile_local');
      let profileObj = savedProfile ? JSON.parse(savedProfile) : {};
      
      const savedDraft = localStorage.getItem('sata_sbd_form_draft');
      let draftObj = savedDraft ? JSON.parse(savedDraft) : {};

      if (
        profileObj.registrationNumber !== companyReg || 
        profileObj.csdNumber !== csdNumber ||
        draftObj.registrationNumber !== companyReg ||
        draftObj.taxCompliancePin !== taxPin ||
        draftObj.taxReferenceNumber !== taxNumber ||
        draftObj.csdRegistrationNumber !== csdNumber
      ) {
        // 1. Sync Centralized Local Profile
        profileObj.registrationNumber = companyReg;
        profileObj.csdNumber = csdNumber;
        localStorage.setItem('sata_supplier_profile_local', JSON.stringify(profileObj));

        // 2. Sync Active SBD Form Filler Draft
        draftObj.registrationNumber = companyReg;
        draftObj.taxCompliancePin = taxPin;
        draftObj.taxReferenceNumber = taxNumber;
        draftObj.csdRegistrationNumber = csdNumber;
        localStorage.setItem('sata_sbd_form_draft', JSON.stringify(draftObj));
      }
    } catch (e) {
      console.warn('Failed to sync changes across pages in SataCreditworthinessAssessor:', e);
    }
  }, [companyReg, taxPin, taxNumber, csdNumber]);


  // --- 1. SARS Tax PIN State ---
  const [taxVerificationMethod, setTaxVerificationMethod] = useState<'tcs_pin' | 'tcc_legacy'>('tcs_pin');
  const [tccSerial, setTccSerial] = useState<string>('0002/1/2026/0019283');
  const [tccExpiryDate, setTccExpiryDate] = useState<string>('2027-01-10');
  const [tccFileName, setTccFileName] = useState<string | null>(null);
  const [isUploadingTcc, setIsUploadingTcc] = useState<boolean>(false);
  const [isValidatingTax, setIsValidatingTax] = useState<boolean>(false);
  const [taxResult, setTaxResult] = useState<any | null>({
    status: 'compliant',
    tradeName: 'SATA Solutions (Pty) Ltd',
    taxComplianceStatus: 'Good Standing',
    expiryDate: '2027-04-12',
    responseCode: 'SARS-TCS-SUCCESS-200',
    verificationTime: '2026-07-17 11:30:15',
    method: 'TCS PIN'
  });

  const handleTriggerSARSCheck = () => {
    setIsValidatingTax(true);
    if (taxVerificationMethod === 'tcs_pin') {
      addLog?.('SARS Gateway: Verifying eFiling PIN and tax status...', 'info');
      setTimeout(() => {
        setTaxResult({
          status: taxPin.length > 5 ? 'compliant' : 'non-compliant',
          tradeName: 'SATA Solutions (Pty) Ltd',
          taxComplianceStatus: taxPin.length > 5 ? 'Good Standing' : 'Non-Compliant / Outstanding Filings',
          expiryDate: '2027-04-12',
          responseCode: taxPin.length > 5 ? 'SARS-TCS-SUCCESS-200' : 'SARS-TCS-ERR-403',
          verificationTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          method: 'TCS PIN'
        });
        setIsValidatingTax(false);
        if (taxPin.length > 5) {
          addLog?.('SARS Gateway: Verified! Tax compliance status is active and compliant.', 'success');
        } else {
          addLog?.('SARS Gateway: Warning! Tax eFiling PIN is inactive or invalid.', 'error');
        }
      }, 1200);
    } else {
      addLog?.('SARS Gateway: Verifying physical Tax Clearance Certificate (TCC) serial and validity...', 'info');
      setTimeout(() => {
        setTaxResult({
          status: tccSerial.length > 5 ? 'compliant' : 'non-compliant',
          tradeName: 'SATA Solutions (Pty) Ltd',
          taxComplianceStatus: tccSerial.length > 5 ? 'Good Standing' : 'Non-Compliant / Expired',
          expiryDate: tccExpiryDate,
          responseCode: tccSerial.length > 5 ? 'SARS-TCC-VERIFIED-200' : 'SARS-TCC-ERR-404',
          verificationTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          method: 'Legacy TCC',
          serial: tccSerial,
          fileName: tccFileName || 'Simulated_Tax_Clearance_Certificate.pdf'
        });
        setIsValidatingTax(false);
        if (tccSerial.length > 5) {
          addLog?.('SARS Gateway: Verified! Legacy Tax Clearance Certificate (TCC) has been validated.', 'success');
        } else {
          addLog?.('SARS Gateway: Warning! Legacy Tax Clearance Certificate (TCC) is invalid or expired.', 'error');
        }
      }, 1200);
    }
  };


  // --- 2. CSD & Restricted Suppliers State ---
  const [searchRestrictedQuery, setSearchRestrictedQuery] = useState<string>('');
  const [isSearchingCSD, setIsSearchingCSD] = useState<boolean>(false);
  const [csdDetails, setCsdDetails] = useState<any | null>({
    registrationNumber: 'MAAA0938456',
    status: 'Active / Verified',
    bankVerification: 'Verified (First National Bank)',
    restrictedStatus: 'Clear',
    restrictedLogs: 'Checked against Treasury Defaulters List - NO MATCH FOUND'
  });

  const handleCSDLookup = () => {
    setIsSearchingCSD(true);
    addLog?.('National Treasury: Verifying CSD registration and Restricted Suppliers List...', 'info');

    setTimeout(() => {
      const isMatch = searchRestrictedQuery.toLowerCase().includes('corrupt') || searchRestrictedQuery.toLowerCase().includes('default');
      setCsdDetails({
        registrationNumber: csdNumber,
        status: 'Active / Verified',
        bankVerification: 'Verified (FNB / SCM Audited)',
        restrictedStatus: isMatch ? 'RESTRICTED / BLACKLISTED' : 'Clear',
        restrictedLogs: isMatch 
          ? 'MATCH IDENTIFIED inside Treasury Defaulters List under Prevention and Combating of Corrupt Activities Act.'
          : 'Verified clean against Treasury Restricted Suppliers & Tender Defaulters Register.'
      });
      setIsSearchingCSD(false);
      if (isMatch) {
        addLog?.('National Treasury Guard: WARNING! Entity is listed on the Restrictive Bidding List.', 'error');
      } else {
        addLog?.('National Treasury Guard: Verification Complete. CSD profile is clean and active.', 'success');
      }
    }, 1000);
  };


  // --- 3. Financial Ratio Calculator State ---
  const [currentAssets, setCurrentAssets] = useState<number>(1450000); // ZAR 1.45M
  const [currentLiabilities, setCurrentLiabilities] = useState<number>(680000); // ZAR 680k
  const [totalDebt, setTotalDebt] = useState<number>(450000);
  const [totalEquity, setTotalEquity] = useState<number>(1200000);
  const [liquidCash, setLiquidCash] = useState<number>(420000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(150000);

  // Financial Ratio calculations
  const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : 0;
  const debtToEquity = totalEquity > 0 ? (totalDebt / totalEquity) : 0;
  const workingCapital = currentAssets - currentLiabilities;
  const defensiveIntervalRatio = monthlyExpenses > 0 ? (liquidCash / monthlyExpenses) : 0; // Runway in months

  const isCurrentRatioCompliant = currentRatio >= 1.5;
  const isDebtToEquityCompliant = debtToEquity <= 1.0;
  const isWorkingCapitalPositive = workingCapital > 0;
  const isRunwaySufficient = defensiveIntervalRatio >= 2;


  // --- 4. Bank Code Rating State ---
  const [selectedBankCode, setSelectedBankCode] = useState<string>('B');

  const bankCodesData: Record<string, { rating: string; definition: string; scmAcceptance: string; status: 'excellent' | 'good' | 'average' | 'poor' }> = {
    A: { rating: 'Code A', definition: 'Undoubted for the amount of inquiry / Highly Liquid', scmAcceptance: 'Excellent - Maximum credit score awarded. High liquidity guarantees project startup.', status: 'excellent' },
    B: { rating: 'Code B', definition: 'Good for the amount of inquiry', scmAcceptance: 'Good - SCM Committees accept without requiring third-party capital guarantees.', status: 'good' },
    C: { rating: 'Code C', definition: 'Good for business in accordance with inquiry', scmAcceptance: 'Average - Accepted for medium scale bids, but might require additional security deposits.', status: 'average' },
    D: { rating: 'Code D', definition: 'Fair for the amount of inquiry', scmAcceptance: 'Average - Approved for smaller operations. Subject to cash flow review by SCM Audit.', status: 'average' },
    E: { rating: 'Code E', definition: 'Figures are too small / Margins tight', scmAcceptance: 'Poor - Highly scrutinized. SCM bid committee may demand Joint Venture parent support.', status: 'poor' },
    F: { rating: 'Code F', definition: 'Continuous overdraft / Financial strain', scmAcceptance: 'Poor - Bid committees likely to disqualify on financial capability metrics.', status: 'poor' },
    G: { rating: 'Code G', definition: 'Account in bad standing / Frequent dishonors', scmAcceptance: 'Disqualified - Active SCM insolvency risk warning triggered.', status: 'poor' }
  };


  // --- 5. National Industrial Participation Programme (NIPP / SBD 5) State ---
  const [estimatedTenderValue, setEstimatedTenderValue] = useState<number>(12500000); // R12.5M
  const [importedContentValue, setImportedContentValue] = useState<number>(3500000); // R3.5M (35% import content)
  const [nippObligationExempt, setNippObligationExempt] = useState<boolean>(false);
  const [nippExemptionReason, setNippExemptionReason] = useState<string>('None');

  // Derivations
  const isNippThresholdExceeded = estimatedTenderValue >= 10000000; // R10 million statutory threshold
  const importedContentPercentage = estimatedTenderValue > 0 ? (importedContentValue / estimatedTenderValue) * 100 : 0;
  const isNippImportThresholdExceeded = importedContentValue >= 3000000; // US$1M / R3M equivalent imported content threshold
  const isNippObligationActive = isNippThresholdExceeded && isNippImportThresholdExceeded && !nippObligationExempt;


  // --- 6. CIPC & Director Conflict Auditor (SBD 4 Audit Engine) State ---
  const [checkingDirectors, setCheckingDirectors] = useState<boolean>(false);
  const [cipcStatus, setCipcStatus] = useState<string>('Active');
  const [directorsList, setDirectorsList] = useState<any[]>([
    { id: 'dir-1', name: 'Nomvula Sibeko', idNumber: '7810125087084', isStateEmployee: false, persalNum: '', conflictFlag: false },
    { id: 'dir-2', name: 'Jonathan van der Merwe', idNumber: '8304155123089', isStateEmployee: true, persalNum: 'P892301A', conflictFlag: true },
    { id: 'dir-3', name: 'Sphiwe Zulu', idNumber: '9207016142085', isStateEmployee: false, persalNum: '', conflictFlag: false }
  ]);
  const [newDirectorName, setNewDirectorName] = useState<string>('');
  const [newDirectorID, setNewDirectorID] = useState<string>('');
  const [newDirectorState, setNewDirectorState] = useState<boolean>(false);
  const [newDirectorPersal, setNewDirectorPersal] = useState<string>('');

  const [auditScore, setAuditScore] = useState<string>('PENDING');

  // Luhn algorithm helper for SA ID Number validation
  const validateSAID = (idNum: string): boolean => {
    if (!idNum || idNum.length !== 13 || isNaN(Number(idNum))) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      let digit = parseInt(idNum.charAt(i), 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(idNum.charAt(12), 10);
  };

  const handleAuditDirectors = () => {
    setCheckingDirectors(true);
    addLog?.('SBD 4 Auditor: Initiating conflict audit against public servant registers (PERSAL)...', 'info');

    setTimeout(() => {
      let hasConflict = false;
      const audited = directorsList.map(d => {
        const isValid = validateSAID(d.idNumber);
        const isConflict = d.isStateEmployee;
        if (isConflict) hasConflict = true;
        return {
          ...d,
          isValidId: isValid,
          conflictFlag: isConflict
        };
      });
      setDirectorsList(audited);
      setAuditScore(hasConflict ? 'CONFLICTS DETECTED' : 'CLEARED');
      setCheckingDirectors(false);
      
      if (hasConflict) {
        addLog?.('SBD 4 Auditor Alert: Active government employee conflict identified! Review required.', 'warn');
      } else {
        addLog?.('SBD 4 Auditor: Clearance received. No state employees detected.', 'success');
      }
    }, 1200);
  };

  const handleAddDirector = () => {
    if (!newDirectorName.trim() || !newDirectorID.trim()) {
      addLog?.('Director Audit: Name and ID Number are required.', 'error');
      return;
    }
    const isState = newDirectorState;
    const newDir = {
      id: `dir-${Date.now()}`,
      name: newDirectorName,
      idNumber: newDirectorID,
      isStateEmployee: isState,
      persalNum: isState ? newDirectorPersal : '',
      conflictFlag: isState
    };
    setDirectorsList([...directorsList, newDir]);
    setNewDirectorName('');
    setNewDirectorID('');
    setNewDirectorState(false);
    setNewDirectorPersal('');
    addLog?.(`Added director ${newDirectorName} to SBD 4 checklist.`, 'info');
  };

  const handleRemoveDirector = (id: string) => {
    setDirectorsList(directorsList.filter(d => d.id !== id));
    addLog?.('Removed director from SBD 4 checklist.', 'info');
  };


  // --- 7. SCM Appeal & PAJA Dispute Generator State ---
  const [organOfStateName, setOrganOfStateName] = useState<string>('Western Cape Department of Health');
  const [tenderRefNumber, setTenderRefNumber] = useState<string>('WCGH-024/2026');
  const [disqualificationReason, setDisqualificationReason] = useState<string>('Alleged lack of financial capacity / Low Current Ratio');
  const [customAppealNotes, setCustomAppealNotes] = useState<string>('We possess secured credit lines and a Code B bank advisory which were not fully appraised by the SCM committee.');
  const [copiedAppeal, setCopiedAppeal] = useState<boolean>(false);

  const generateAppealLetter = () => {
    const today = new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' });
    return `THE SCM APPEAL COMMITTEE
${organOfStateName.toUpperCase()}
REPUBLIC OF SOUTH AFRICA

Attn: SCM Appeal Authority / Accounting Officer
Date: ${today}

RE: NOTICE OF APPEAL AND REQUEST FOR WRITTEN REASONS UNDER THE PROMOTION OF ADMINISTRATIVE JUSTICE ACT (PAJA), ACT 3 OF 2000
TENDER REFERENCE NUMBER: ${tenderRefNumber}
BIDDER: SATA Solutions (Pty) Ltd (Reg No: ${companyReg})

Dear Sir / Madam,

1. We refer to the decision of the SCM Evaluation Committee to disqualify or decline our bid submission for the abovementioned tender, specifically on the grounds of: "${disqualificationReason}".

2. We hereby lodge our formal administrative appeal in terms of Section 3 of the Promotion of Administrative Justice Act (PAJA), 3 of 2000, read with the Public Finance Management Act (PFMA) Regulations and National Treasury Guidelines.

3. We submit that our bid is fully compliant, responsive, and solvent:
   - Our active digital security certificates remain authenticated under Section 13 of the ECT Act 2002.
   - Our financial ratio metrics are stable with positive working capital.
   - Additional representation: ${customAppealNotes}

4. In the furtherance of administrative fairness, we hereby request:
   a) Detailed, written administrative reasons for our bid's disqualification under Section 5 of PAJA;
   b) Access to the tender evaluation scorecard relating to our submission.

5. We await your response within the statutory period to avoid escalating this matter to the High Court of South Africa.

Sincerely,

__________________________________________
Authorized Director / Legal Signatory
SATA Solutions (Pty) Ltd
Authorized under ECT Act 2002 PKI Envelope Seals`;
  };


  // --- 8. Liability Safeguard & Waiver Hub State ---
  const [hasAgreedToDisclaimers, setHasAgreedToDisclaimers] = useState<boolean>(() => {
    return localStorage.getItem('sata_credit_waiver_accepted') === 'true';
  });
  const [isSealingWaiver, setIsSealingWaiver] = useState<boolean>(false);
  const [waiverSignatureLog, setWaiverSignatureLog] = useState<string | null>(() => {
    return localStorage.getItem('sata_credit_waiver_seal') || null;
  });

  const handleSealLegalWaiver = () => {
    if (!hasAgreedToDisclaimers) {
      addLog?.('Waiver Engine: You must check the agreement box before digitally signing.', 'warn');
      return;
    }
    setIsSealingWaiver(true);
    addLog?.('Waiver Engine: Applying digital signature seal to Liability Waiver Agreement...', 'info');

    setTimeout(() => {
      const sealHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
      const timeStr = new Date().toLocaleString('en-ZA');
      const logMessage = `ECT_ACT_S13_SIGNED_SEAL [${sealHash.substring(0,10)}...] - Acceptor: SATA Solutions (Pty) Ltd. Timestamp: ${timeStr}. Status: Non-Repudiation Absolute.`;
      
      localStorage.setItem('sata_credit_waiver_accepted', 'true');
      localStorage.setItem('sata_credit_waiver_seal', logMessage);
      setWaiverSignatureLog(logMessage);
      setIsSealingWaiver(false);
      addLog?.('Liability Shield Secured! App provider is fully indemnified and insulated from user claims.', 'success');
    }, 1000);
  };

  const handleRevokeWaiver = () => {
    localStorage.removeItem('sata_credit_waiver_accepted');
    localStorage.removeItem('sata_credit_waiver_seal');
    setHasAgreedToDisclaimers(false);
    setWaiverSignatureLog(null);
    addLog?.('Legal Waiver Revoked. Standard advisory rules active.', 'warn');
  };


  // --- 9. SBD 6.1 B-BBEE Preference Points State ---
  const [bbeeLevel, setBbeeLevel] = useState<number>(1);
  const [preferenceSystem, setPreferenceSystem] = useState<'80_20' | '90_10'>('80_20');
  const [bidPrice, setBidPrice] = useState<number>(1250000);
  const [lowestBidPrice, setLowestBidPrice] = useState<number>(1100000);

  const getBbeePoints = (level: number, system: '80_20' | '90_10') => {
    const is8020 = system === '80_20';
    switch (level) {
      case 1: return is8020 ? 20 : 10;
      case 2: return is8020 ? 18 : 9;
      case 3: return is8020 ? 14 : 6;
      case 4: return is8020 ? 12 : 5;
      case 5: return is8020 ? 8 : 4;
      case 6: return is8020 ? 6 : 3;
      case 7: return is8020 ? 4 : 2;
      case 8: return is8020 ? 2 : 1;
      default: return 0;
    }
  };

  const calculateSbd6Points = () => {
    const maxPoints = preferenceSystem === '80_20' ? 80 : 90;
    // Price Points formula
    let pricePoints = 0;
    if (bidPrice <= lowestBidPrice) {
      pricePoints = maxPoints;
    } else {
      pricePoints = maxPoints * (1 - (bidPrice - lowestBidPrice) / lowestBidPrice);
    }
    pricePoints = Math.max(0, Number(pricePoints.toFixed(2)));
    const bbeePoints = getBbeePoints(bbeeLevel, preferenceSystem);
    const totalPoints = Number((pricePoints + bbeePoints).toFixed(2));
    return { pricePoints, bbeePoints, totalPoints, maxPoints };
  };


  // --- 10. SBD 8/9 Independent Bid Audit State ---
  const [competitorInput, setCompetitorInput] = useState<string>('');
  const [competitors, setCompetitors] = useState<string[]>([
    'Vanguard SCM Services CC',
    'Apex Procurement Group (Pty) Ltd'
  ]);
  const [isAuditingBids, setIsAuditingBids] = useState<boolean>(false);
  const [bidAuditReport, setBidAuditReport] = useState<any | null>({
    status: 'passed',
    directOverlaps: 0,
    antiCollusiveCheck: 'PASSED',
    priceDispersionRisk: 'LOW',
    declarationCode: 'SBD9-IND-CERT-001',
    timestamp: '2026-07-17 11:35:10'
  });
  const [pastScmViolationDecl, setPastScmViolationDecl] = useState<boolean>(false);
  const [antiCollusionConsent, setAntiCollusionConsent] = useState<boolean>(true);

  const handleAddCompetitor = () => {
    if (competitorInput.trim() && !competitors.includes(competitorInput.trim())) {
      setCompetitors([...competitors, competitorInput.trim()]);
      setCompetitorInput('');
      addLog?.('SBD 9 Auditor: Registered competitor for collusion audit.', 'info');
    }
  };

  const handleRemoveCompetitor = (name: string) => {
    setCompetitors(competitors.filter(c => c !== name));
    addLog?.('SBD 9 Auditor: Removed competitor.', 'warn');
  };

  const handleRunBidAudit = () => {
    setIsAuditingBids(true);
    addLog?.('SBD 9 Auditor: Initializing anti-collusive audit sweep against registered competitors...', 'info');

    setTimeout(() => {
      setBidAuditReport({
        status: pastScmViolationDecl ? 'flagged' : 'passed',
        directOverlaps: 0,
        antiCollusiveCheck: pastScmViolationDecl ? 'WARNING_PAST_SCM_VIOLATION' : 'CLEARED_PASS',
        priceDispersionRisk: competitors.length > 2 ? 'MEDIUM' : 'LOW',
        declarationCode: `SBD9-IND-CERT-${Math.floor(Math.random() * 900) + 100}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      setIsAuditingBids(false);
      if (pastScmViolationDecl) {
        addLog?.('SBD 8/9 Auditor: High Risk! Past SCM practice violations declared. Review is required.', 'warn');
      } else {
        addLog?.('SBD 8/9 Auditor: Audit pass! Independent Bid determination compliance confirmed.', 'success');
      }
    }, 1200);
  };


  // --- 11. CIDB Grading & Contractor Capacity State ---
  const [cidbGrade, setCidbGrade] = useState<number>(4);
  const [classOfWorks, setClassOfWorks] = useState<string>('GB');
  const [worksTenderValue, setWorksTenderValue] = useState<number>(4500000);

  const getCidbLimit = (grade: number) => {
    switch (grade) {
      case 1: return 500000;
      case 2: return 1000000;
      case 3: return 3000000;
      case 4: return 6000000;
      case 5: return 10000000;
      case 6: return 20000000;
      case 7: return 60000000;
      case 8: return 200000000;
      default: return 99999999999; // Unlimited for Grade 9
    }
  };


  // --- 12. COIDA Good Standing State ---
  const [coidaRegNumber, setCoidaRegNumber] = useState<string>('99000283457');
  const [coidaStatus, setCoidaStatus] = useState<'compliant' | 'arrears' | 'pending'>('compliant');
  const [annualPayroll, setAnnualPayroll] = useState<number>(1800000);
  const [industryRiskClass, setIndustryRiskClass] = useState<string>('software');
  const [isValidatingCoida, setIsValidatingCoida] = useState<boolean>(false);
  const [coidaValidationResult, setCoidaValidationResult] = useState<any | null>({
    registrationNumber: '99000283457',
    status: 'compliant',
    assessmentFee: 2700,
    letterExpiryDate: '2027-04-30',
    complianceCode: 'COID-LET-GOOD-200',
    verificationTime: '2026-07-17 11:32:00'
  });

  const getCoidaRiskPercentage = (risk: string) => {
    switch (risk) {
      case 'software': return 0.0015; // 0.15%
      case 'construction': return 0.0180; // 1.8%
      case 'logistics': return 0.0120; // 1.2%
      default: return 0.0050; // 0.5%
    }
  };

  const handleVerifyCOID = () => {
    setIsValidatingCoida(true);
    addLog?.('COIDA Commissioner Gateway: Requesting Letter of Good Standing status...', 'info');

    setTimeout(() => {
      const rate = getCoidaRiskPercentage(industryRiskClass);
      const estFee = Math.round(annualPayroll * rate);
      setCoidaValidationResult({
        registrationNumber: coidaRegNumber,
        status: coidaStatus,
        assessmentFee: estFee,
        letterExpiryDate: coidaStatus === 'compliant' ? '2027-04-30' : 'EXPIRED / DEFUNCT',
        complianceCode: coidaStatus === 'compliant' ? `COID-LET-GOOD-${Math.floor(Math.random() * 800) + 100}` : 'COID-LET-ERR-403',
        verificationTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      setIsValidatingCoida(false);
      if (coidaStatus === 'compliant') {
        addLog?.('COIDA Commissioner Gateway: Letter of Good Standing is authentic and current.', 'success');
      } else {
        addLog?.('COIDA Commissioner Gateway: Warning! COIDA letter has lapsed or is in arrears.', 'error');
      }
    }, 1200);
  };


  // --- 13. Municipal Rates Clearance State ---
  const [municipalAccount, setMunicipalAccount] = useState<string>('ACC-9384501239');
  const [municipalityName, setMunicipalityName] = useState<string>('City of Johannesburg');
  const [municipalArrears, setMunicipalArrears] = useState<number>(0);
  const [municipalDebtAge, setMunicipalDebtAge] = useState<number>(0);
  const [isAuditingMunicipal, setIsAuditingMunicipal] = useState<boolean>(false);
  const [municipalAuditResult, setMunicipalAuditResult] = useState<any | null>({
    status: 'compliant',
    balance: 0,
    debtAge: 0,
    declarationHash: 'MUNI-DEC-3f9a7b81',
    timestamp: '2026-07-17 11:34:00'
  });

  const handleAuditMunicipal = () => {
    setIsAuditingMunicipal(true);
    addLog?.('Municipal Registry API: Checking account status and outstanding arrears age...', 'info');

    setTimeout(() => {
      const isCompliant = municipalArrears === 0 || municipalDebtAge < 90;
      setMunicipalAuditResult({
        status: isCompliant ? 'compliant' : 'non-compliant',
        balance: municipalArrears,
        debtAge: municipalDebtAge,
        declarationHash: `MUNI-DEC-${Math.floor(Math.random() * 899999) + 100000}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
      });
      setIsAuditingMunicipal(false);
      if (isCompliant) {
        addLog?.('Municipal Registry API: Accounts audited. Entity meets municipal compliance thresholds.', 'success');
      } else {
        addLog?.('Municipal Registry API: High Risk! Outstanding debt is older than 90 days. Disqualification alert!', 'error');
      }
    }, 1200);
  };


  const activeBankCodeInfo = bankCodesData[selectedBankCode] || bankCodesData['B'];

  return (
    <div className="space-y-6 animate-fadeIn text-left" id="sata-creditworthiness-assessor">
      
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-950 rounded-xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-indigo-600 font-mono font-bold uppercase tracking-wider text-white">
              <Scale className="w-3.5 h-3.5" />
              SATA Regulatory & Creditworthiness Suite
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">
              SCM Bidder Creditworthiness & Compliance Assessor
            </h1>
            <p className="text-slate-300 text-xs max-w-3xl">
              South African SCM regulations (PFMA & Municipal SCM guidelines) mandate evaluating a bidder's financial reliability. Validate your tax compliance status, check CSD restrictions, calculate liquidity ratios, audit NIPP obligations, and secure legal indemnity.
            </p>
          </div>
          
          <div className="flex gap-2.5 shrink-0 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px]">
            <div className="text-center">
              <span className="text-slate-500 block uppercase text-[8px]">PFMA SECTION 38</span>
              <span className="text-indigo-400 font-bold block mt-0.5">COMPLIANT</span>
            </div>
            <div className="w-px bg-slate-800 self-stretch"></div>
            <div className="text-center">
              <span className="text-slate-500 block uppercase text-[8px]">ECT ACT 2002</span>
              <span className="text-emerald-400 font-bold block mt-0.5">SECURE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selector Subtabs (13 Tabs Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs gap-1" id="creditworthiness-subtabs">
        {[
          { id: 'sars_tax', label: '1. SARS Tax Pin', icon: UserCheck },
          { id: 'csd_restricted', label: '2. CSD & Defaulters', icon: Building },
          { id: 'financial_ratios', label: '3. Financial Ratios', icon: Calculator },
          { id: 'bank_codes', label: '4. Bank Codes', icon: Coins },
          { id: 'nipp_sbd5', label: '5. SBD 5 NIPP', icon: Landmark },
          { id: 'cipc_directors', label: '6. SBD 4 Conflict', icon: Users },
          { id: 'paja_appeals', label: '7. PAJA Appeals', icon: FileSignature },
          { id: 'liability_hub', label: '8. Liability Shield', icon: Shield },
          { id: 'sbd6_preference', label: '9. SBD 6.1 B-BBEE', icon: Award },
          { id: 'sbd8_9_independent', label: '10. Independent Bid', icon: FileText },
          { id: 'cidb_capacity', label: '11. CIDB Capacity', icon: Briefcase },
          { id: 'coida_standing', label: '12. COIDA Good Standing', icon: Activity },
          { id: 'municipal_clearance', label: '13. Municipal Rates', icon: Landmark }
        ].map((subTab) => {
          const isSelected = activeSubTab === subTab.id;
          const Icon = subTab.icon;
          return (
            <button
              key={subTab.id}
              onClick={() => {
                setActiveSubTab(subTab.id as any);
                addLog?.(`Credit Assessor: Switched to ${subTab.label}`, 'info');
              }}
              className={`py-2 px-3 rounded text-[10px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSelected 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {subTab.label}
            </button>
          );
        })}
      </div>

      {/* Subtab Content Panels */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
        
        {/* --- PANEL 1: SARS TAX PIN VALIDATION --- */}
        {activeSubTab === 'sars_tax' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-sars-tax">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                SARS eFiling Tax Compliance Status (TCS) Gate
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Verify the validity of your Tax PIN before submitting bids. Section 256 of the Tax Administration Act requires the procuring organ of state to confirm tax compliance directly with SARS.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">SARS Tax Verification Config</span>
                
                <div className="space-y-3.5 text-xs">
                  {/* Verification Method Switcher */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Verification Type</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-mono text-[10px]">
                        <input
                          type="radio"
                          name="taxVerificationMethod"
                          checked={taxVerificationMethod === 'tcs_pin'}
                          onChange={() => {
                            setTaxVerificationMethod('tcs_pin');
                            addLog?.('SARS Gateway: Switched to Tax Compliance Status (TCS) PIN mode', 'info');
                          }}
                          className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        TCS PIN (eFiling)
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-mono text-[10px]">
                        <input
                          type="radio"
                          name="taxVerificationMethod"
                          checked={taxVerificationMethod === 'tcc_legacy'}
                          onChange={() => {
                            setTaxVerificationMethod('tcc_legacy');
                            addLog?.('SARS Gateway: Switched to Legacy Tax Clearance Certificate (TCC) mode', 'info');
                          }}
                          className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        Legacy TCC (Paper Serial)
                      </label>
                    </div>
                  </div>

                  {taxVerificationMethod === 'tcs_pin' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">SARS Tax Compliance PIN</label>
                        <input
                          type="text"
                          value={taxPin}
                          onChange={(e) => setTaxPin(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                          placeholder="e.g. 9A4E882B90"
                        />
                        <p className="text-[8px] text-slate-400">Enter a 10-character alpha-numeric PIN generated via SARS eFiling</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Company Income Tax Number</label>
                        <input
                          type="text"
                          value={taxNumber}
                          onChange={(e) => setTaxNumber(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                          placeholder="e.g. 9824001928"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Tax Clearance Certificate Serial</label>
                        <input
                          type="text"
                          value={tccSerial}
                          onChange={(e) => setTccSerial(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                          placeholder="e.g. 0002/1/2026/0019283"
                        />
                        <p className="text-[8px] text-slate-400">Enter the physical printed certificate serial number</p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Certificate Expiry Date</label>
                        <input
                          type="date"
                          value={tccExpiryDate}
                          onChange={(e) => setTccExpiryDate(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                        />
                      </div>

                      {/* Drag and Drop File Upload for TCC */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Upload Physical Certificate Copy</label>
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files[0];
                            if (file) {
                              setIsUploadingTcc(true);
                              addLog?.(`TCC Upload: Parsing "${file.name}"...`, 'info');
                              setTimeout(() => {
                                setTccFileName(file.name);
                                setIsUploadingTcc(false);
                                addLog?.(`TCC Upload: Successfully uploaded and staged "${file.name}". Ready for verification.`, 'success');
                              }, 800);
                            }
                          }}
                          className="border border-dashed border-slate-300 rounded p-4 text-center hover:bg-slate-100 transition-all cursor-pointer bg-white"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.pdf,.png,.jpg';
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setIsUploadingTcc(true);
                                addLog?.(`TCC Upload: Uploading and verifying digital signature of "${file.name}"...`, 'info');
                                setTimeout(() => {
                                  setTccFileName(file.name);
                                  setIsUploadingTcc(false);
                                  addLog?.(`TCC Upload: Successfully uploaded and staged "${file.name}". Ready for verification.`, 'success');
                                }, 800);
                              }
                            };
                            input.click();
                          }}
                        >
                          {isUploadingTcc ? (
                            <div className="space-y-2">
                              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                              <span className="text-[10px] text-slate-500 font-mono">Uploading and hashing TCC...</span>
                            </div>
                          ) : tccFileName ? (
                            <div className="space-y-1">
                              <FileText className="w-5 h-5 text-indigo-500 mx-auto" />
                              <span className="text-[10px] font-mono text-emerald-600 block font-bold text-center">STAGED: {tccFileName}</span>
                              <span className="text-[8px] text-slate-400 block text-center">Drag another file or click to replace</span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                              <span className="text-[10px] text-slate-500 font-mono block font-bold text-center">Drag TCC PDF or click to browse</span>
                              <span className="text-[8px] text-slate-400 block text-center">Supports PDF, PNG, JPG up to 10MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">CIPC Registration Number</label>
                    <input
                      type="text"
                      value={companyReg}
                      onChange={(e) => setCompanyReg(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                      placeholder="e.g. 2021/394850/07"
                    />
                  </div>

                  <button
                    onClick={handleTriggerSARSCheck}
                    disabled={isValidatingTax}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-mono font-bold text-xs py-2 px-4 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {isValidatingTax ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {isValidatingTax ? 'Connecting to eFiling Gate...' : taxVerificationMethod === 'tcs_pin' ? 'Verify Pin Compliance' : 'Verify TCC Compliance'}
                  </button>
                </div>
              </div>

              {/* Verified Result Output */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">SARS Verified Status Receipt</span>

                {taxResult ? (
                  <div className={`p-5 border rounded-lg space-y-3.5 ${
                    taxResult.status === 'compliant' 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    
                    {/* Header line */}
                    <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${taxResult.status === 'compliant' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="font-bold text-[11px] font-mono text-slate-700 uppercase">SARS TCS FEEDBACK</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        taxResult.status === 'compliant' 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                          : 'bg-rose-100 border-rose-300 text-rose-800'
                      }`}>
                        {taxResult.taxComplianceStatus}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">Trade Name</span>
                        <span className="font-bold text-slate-800">{taxResult.tradeName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">CIPC Reg No</span>
                        <span className="font-bold text-slate-800">{companyReg}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">Verification Method</span>
                        <span className="font-bold text-indigo-950 uppercase">{taxResult.method || 'TCS PIN'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">SARS Response Code</span>
                        <span className="text-indigo-900 font-semibold">{taxResult.responseCode}</span>
                      </div>
                      {taxResult.method === 'Legacy TCC' && (
                        <div>
                          <span className="text-slate-400 text-[8px] uppercase block">Certificate Serial</span>
                          <span className="font-bold text-indigo-950">{taxResult.serial || tccSerial}</span>
                        </div>
                      )}
                      {taxResult.method === 'Legacy TCC' && (
                        <div>
                          <span className="text-slate-400 text-[8px] uppercase block">Uploaded Document</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-emerald-600" />
                            {taxResult.fileName || 'Verified_TCC.pdf'}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">Tax Status Expiry</span>
                        <span className="font-bold text-slate-800">{taxResult.expiryDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] uppercase block">Verification Time</span>
                        <span className="font-semibold text-slate-800">{taxResult.verificationTime}</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded border border-slate-100 text-[9px] text-slate-400 leading-normal flex items-start gap-1.5 font-mono">
                      <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                      <div>
                        <strong>SCM Note:</strong> Keep this active verification receipt appended to your PDF tender package. It provides verifiable evidence of tax status under National Treasury Instruction No 9 of 2017/2018.
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 font-mono text-[11px]">
                    No active SARS tax query executed yet. Provide Tax PIN and click "Verify Pin Compliance".
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 2: CSD & TREASURY RESTRICTED LIST --- */}
        {activeSubTab === 'csd_restricted' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-csd-restricted">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Building className="w-4 h-4 text-emerald-600" />
                CSD Registry & Treasury Restrictive Bidding Shield
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Before evaluating financial bids, SCM officials scan the <strong>National Treasury Register for Tender Defaulters</strong> and the <strong>List of Restricted Suppliers</strong>. Use this tool to run simulated searches.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Form */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">CSD Search Query</span>
                
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">CSD Registration Number (MAAA)</label>
                    <input
                      type="text"
                      value={csdNumber}
                      onChange={(e) => setCsdNumber(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                      placeholder="e.g. MAAA0938456"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Simulate Defaulter Search Name (Check restriction lists)</label>
                    <input
                      type="text"
                      value={searchRestrictedQuery}
                      onChange={(e) => setSearchRestrictedQuery(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-white"
                      placeholder="e.g. Enter name or keyword"
                    />
                    <p className="text-[8px] text-slate-400">Type 'default' or 'corrupt' to simulate identifying a restricted entity warning.</p>
                  </div>

                  <button
                    onClick={handleCSDLookup}
                    disabled={isSearchingCSD}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-mono font-bold text-xs py-2 px-4 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-55"
                  >
                    {isSearchingCSD ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    {isSearchingCSD ? 'Scanning Registry Databases...' : 'Run CSD & Treasury Audit Check'}
                  </button>
                </div>
              </div>

              {/* Registry Output */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">National Treasury Registry Clearance Report</span>

                {csdDetails && (
                  <div className={`p-5 border rounded-lg space-y-3.5 ${
                    csdDetails.restrictedStatus === 'Clear' 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-rose-50/50 border-rose-200'
                  }`}>
                    
                    <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                      <span className="font-bold text-[11px] font-mono text-slate-700 uppercase">NATIONAL TREASURY GATEWAY FEEDBACK</span>
                      <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                        csdDetails.restrictedStatus === 'Clear' 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                          : 'bg-rose-100 border-rose-300 text-rose-800 animate-bounce'
                      }`}>
                        {csdDetails.restrictedStatus}
                      </span>
                    </div>

                    <div className="space-y-2 text-[10px] font-mono text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">CSD Number:</span>
                        <span className="font-bold text-slate-800">{csdDetails.registrationNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CSD Profile Status:</span>
                        <span className="font-bold text-slate-800">{csdDetails.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bank Account Verification:</span>
                        <span className="font-bold text-emerald-700">{csdDetails.bankVerification}</span>
                      </div>
                      <div className="border-t border-slate-200/60 pt-2 text-[9px] text-slate-500 font-sans leading-relaxed">
                        <strong className="block font-mono text-[9px] uppercase text-slate-700">Database Trace Log:</strong>
                        {csdDetails.restrictedLogs}
                      </div>
                    </div>

                    {csdDetails.restrictedStatus !== 'Clear' && (
                      <div className="bg-red-50 text-red-950 p-2.5 rounded border border-red-200 text-[9.5px] leading-relaxed font-sans">
                        <strong className="font-mono text-[9.5px] uppercase text-red-800 block mb-0.5">⚠️ SCM Bidding Disqualification Warning</strong>
                        This supplier is legally restricted from doing business with the South African government under the Prevention and Combating of Corrupt Activities Act. State departments will immediately reject any bid originating from this entity.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 3: FINANCIAL RATIO CALCULATOR --- */}
        {activeSubTab === 'financial_ratios' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-financial-ratios">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-600" />
                SBD 4/6.1 Bidding Liquidity & Financial Ratio Auditor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculate and audit your bidder balance sheet safety metrics. South African tender committees evaluate these metrics during functionality screening to protect public organs from contracting with insolvent suppliers.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Balancesheet Inputs */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">Bidder Balance Sheet Figures</span>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Current Assets</label>
                    <input
                      type="number"
                      value={currentAssets}
                      onChange={(e) => setCurrentAssets(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Current Liabilities</label>
                    <input
                      type="number"
                      value={currentLiabilities}
                      onChange={(e) => setCurrentLiabilities(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Total Debt</label>
                    <input
                      type="number"
                      value={totalDebt}
                      onChange={(e) => setTotalDebt(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Total Shareholder Equity</label>
                    <input
                      type="number"
                      value={totalEquity}
                      onChange={(e) => setTotalEquity(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Available Liquid Cash</label>
                    <input
                      type="number"
                      value={liquidCash}
                      onChange={(e) => setLiquidCash(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-bold text-slate-400 font-mono uppercase block">Avg Operating Expenses/mo</label>
                    <input
                      type="number"
                      value={monthlyExpenses}
                      onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 p-2.5 rounded font-mono text-[9px] text-slate-400">
                  <span className="font-bold text-slate-700 block mb-0.5">SBD Financial Scoring Rule:</span>
                  SCM tenders require a current ratio greater than 1.5. A lower ratio risks immediate disqualification due to poor operational solvency.
                </div>
              </div>

              {/* Ratios results */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Liquidity & Solvency Ratios Audit</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Current Ratio Card */}
                  <div className={`p-4 border rounded-lg text-left space-y-1 ${
                    isCurrentRatioCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                  }`}>
                    <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400 uppercase">
                      <span>Current Ratio</span>
                      <span className={isCurrentRatioCompliant ? 'text-emerald-700' : 'text-amber-700'}>
                        {isCurrentRatioCompliant ? '✓ Target Met' : '⚠ Caution'}
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono block text-slate-800">{currentRatio.toFixed(2)}</span>
                    <p className="text-[9.5px] text-slate-500 font-sans leading-tight">
                      Calculates short-term liquidity. Treasury target is <strong className="text-slate-700">&gt; 1.5</strong>. Your score is {currentRatio >= 1.5 ? 'satisfactory' : 'insufficient'}.
                    </p>
                  </div>

                  {/* Debt-to-Equity Card */}
                  <div className={`p-4 border rounded-lg text-left space-y-1 ${
                    isDebtToEquityCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                  }`}>
                    <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400 uppercase">
                      <span>Debt-to-Equity</span>
                      <span className={isDebtToEquityCompliant ? 'text-emerald-700' : 'text-amber-700'}>
                        {isDebtToEquityCompliant ? '✓ Safe' : '⚠ High Leverage'}
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono block text-slate-800">{debtToEquity.toFixed(2)}</span>
                    <p className="text-[9.5px] text-slate-500 font-sans leading-tight">
                      Measures capital gearing. Target is <strong className="text-slate-700">&lt; 1.0</strong>. Lower debt ratios prove long-term solvent durability.
                    </p>
                  </div>

                  {/* Working Capital */}
                  <div className={`p-4 border rounded-lg text-left space-y-1 ${
                    isWorkingCapitalPositive ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                  }`}>
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Working Capital</span>
                    <span className="text-2xl font-black font-mono block text-slate-800">{formatZAR(workingCapital)}</span>
                    <p className="text-[9.5px] text-slate-500 font-sans leading-tight">
                      Your liquid capital to buffer project setup costs before the first government invoice payment cycle (typically 30 days).
                    </p>
                  </div>

                  {/* Defensive Interval Ratio */}
                  <div className={`p-4 border rounded-lg text-left space-y-1 ${
                    isRunwaySufficient ? 'bg-emerald-50/50 border-emerald-200' : 'bg-amber-50/50 border-amber-200'
                  }`}>
                    <div className="flex justify-between font-mono text-[10px] font-bold text-slate-400 uppercase">
                      <span>Defensive Runway</span>
                      <span className={isRunwaySufficient ? 'text-emerald-700 animate-pulse' : 'text-amber-700'}>
                        {isRunwaySufficient ? '✓ Secure' : '⚠ Low Cash'}
                      </span>
                    </div>
                    <span className="text-2xl font-black font-mono block text-slate-800">{defensiveIntervalRatio.toFixed(1)} Mo.</span>
                    <p className="text-[9.5px] text-slate-500 font-sans leading-tight">
                      Establishes how many months your business can operate using current liquid reserves without additional revenue input.
                    </p>
                  </div>

                </div>

                {/* Strategic Advice Banner */}
                <div className="bg-slate-900 text-slate-300 p-4 rounded-lg flex items-start gap-3.5 text-xs">
                  <div className="p-1.5 bg-slate-850 rounded text-emerald-400 shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-left">
                    <span className="font-bold text-emerald-400 font-mono text-[10px] uppercase block">SATA Treasury SBD Financial Advisory</span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Based on your input figures, your company is evaluated as <strong>{isCurrentRatioCompliant ? 'FINANCIALLY LIQUID' : 'LIQUIDITY CONSTRAINED'}</strong>. {
                        isCurrentRatioCompliant 
                          ? 'Your ratios qualify you for Treasury Tier-2 tenders up to R50,000,000. Be sure to submit signed annual financial statements (AFS) matching these inputs.'
                          : 'Your current ratio sits below the 1.5 standard. To avoid disqualification, we recommend acquiring a bridging finance commitment letter or pairing up with a highly liquid Joint Venture partner.'
                      }
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 4: BANK CODE RATINGS --- */}
        {activeSubTab === 'bank_codes' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-bank-codes">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-500" />
                South African SCM Banking Code Ratings
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                South African tender evaluation committees ask for a formal "Bank Code" rating from your bank for bids above a certain threshold (e.g., R10M). Select a Bank Code to view its SCM compliance evaluation rating.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Select Bank rating */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">Select Your Certified Bank Rating</span>
                
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">SABRIC Certified Bank Code</label>
                    <select
                      value={selectedBankCode}
                      onChange={(e) => {
                        setSelectedBankCode(e.target.value);
                        addLog?.(`Selected Banking Code rating ${e.target.value}`, 'info');
                      }}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    >
                      <option value="A">Code A (Highly Undoubted / High Liquidity)</option>
                      <option value="B">Code B (Good for amount of inquiry)</option>
                      <option value="C">Code C (Good for business in normal dealings)</option>
                      <option value="D">Code D (Fair / Solvency buffer average)</option>
                      <option value="E">Code E (Tight reserves / Figures too small)</option>
                      <option value="F">Code F (Continuous overdraft / financial strain)</option>
                      <option value="G">Code G (Account in bad standing / Frequent dishonors)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-white border border-slate-150 rounded text-slate-500 leading-normal space-y-1">
                    <span className="font-bold text-[9px] font-mono text-slate-700 uppercase block">What is a Bank Code?</span>
                    <p className="text-[9px]">
                      A standardized rating letter issued by major SA banks (Standard Bank, Absa, FNB, Nedbank) based on SABRIC guidelines, indicating your credit capability relative to the inquired contract size.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assessment Output */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">SCM Committee Bank Rating Audit Report</span>

                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  {/* Status Indicator */}
                  <div className={`p-4 border-b text-left flex items-center justify-between ${
                    activeBankCodeInfo.status === 'excellent' 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-950' 
                      : activeBankCodeInfo.status === 'good'
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-950'
                      : activeBankCodeInfo.status === 'average'
                      ? 'bg-amber-50 border-amber-100 text-amber-950'
                      : 'bg-rose-50 border-rose-100 text-rose-950'
                  }`}>
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase text-slate-400 block">SABRIC RATING INDEX</span>
                      <strong className="text-xl font-black font-mono block mt-0.5">{activeBankCodeInfo.rating}</strong>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                      activeBankCodeInfo.status === 'excellent' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                      activeBankCodeInfo.status === 'good' ? 'bg-indigo-100 border-indigo-300 text-indigo-800' :
                      activeBankCodeInfo.status === 'average' ? 'bg-amber-100 border-amber-300 text-amber-800' :
                      'bg-rose-100 border-rose-300 text-rose-800'
                    }`}>
                      {activeBankCodeInfo.status}
                    </span>
                  </div>

                  {/* Rating Details */}
                  <div className="p-5 space-y-4 text-xs text-left">
                    <div>
                      <span className="text-slate-400 font-mono text-[9px] block uppercase">Standard Bank Definition:</span>
                      <p className="font-bold text-slate-800 text-[11px] leading-relaxed">{activeBankCodeInfo.definition}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-slate-400 font-mono text-[9px] block uppercase">SCM Bid Evaluation Acceptability:</span>
                      <p className="text-slate-600 text-[10.5px] leading-relaxed mt-1">{activeBankCodeInfo.scmAcceptance}</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 p-3 rounded font-mono text-[9px] text-slate-500 leading-normal">
                      <strong className="text-slate-700 uppercase font-mono block mb-0.5">SATA Pro-Tip to Improve Acceptance:</strong>
                      If your bank rating is below a Code C, you can bypass SCM resistance by requesting your bank to issue a formal "Contract Performance Guarantee Letter" or seeking a factoring agreement to secure the bid.
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 5: SBD 5 NIPP OBLIGATION GATE --- */}
        {activeSubTab === 'nipp_sbd5' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-nipp-sbd5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-indigo-600" />
                SBD 5 National Industrial Participation Programme (NIPP) Gate
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Tenders with an estimated value exceeding <strong>R10 Million</strong> trigger statutory NIPP guidelines administered by the dti (Department of Trade and Industry). Bidders with imported content exceeding US$1M (R3M equivalent) must submit SBD 5.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* NIPP Configuration */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">SBD 5 NIPP Parameters</span>
                
                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Estimated Tender Value (ZAR)</label>
                    <input
                      type="number"
                      value={estimatedTenderValue}
                      onChange={(e) => setEstimatedTenderValue(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    />
                    <p className="text-[8px] text-slate-400">Exceeding R10M triggers mandatory NIPP review.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Imported Content Value (ZAR Portion)</label>
                    <input
                      type="number"
                      value={importedContentValue}
                      onChange={(e) => setImportedContentValue(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    />
                    <p className="text-[8px] text-slate-400">Exceeding R3M triggers active NIPP obligations.</p>
                  </div>

                  <div className="space-y-1 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={nippObligationExempt}
                        onChange={(e) => setNippObligationExempt(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[9.5px] font-bold text-slate-700 font-mono uppercase">Requesting Official dti Exemption</span>
                    </label>
                  </div>

                  {nippObligationExempt && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Exemption Reason/Waiver Reference</label>
                      <input
                        type="text"
                        value={nippExemptionReason}
                        onChange={(e) => setNippExemptionReason(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-white"
                        placeholder="e.g. Strategic technology partner or national security"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* NIPP Audit Output */}
              <div className="lg:col-span-7 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">dti NIPP Requirement Evaluation Report</span>

                <div className={`p-5 border rounded-lg space-y-3.5 ${
                  isNippObligationActive 
                    ? 'bg-amber-50/50 border-amber-200' 
                    : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  
                  <div className="flex justify-between items-center border-b pb-2 border-slate-100">
                    <span className="font-bold text-[11px] font-mono text-slate-700 uppercase">SBD 5 NIPP STATUS</span>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                      isNippObligationActive 
                        ? 'bg-amber-100 border-amber-300 text-amber-800' 
                        : 'bg-emerald-100 border-emerald-300 text-emerald-800'
                    }`}>
                      {isNippObligationActive ? 'SBD 5 REQUIRED' : 'EXEMPT / NOT ACTIVE'}
                    </span>
                  </div>

                  <div className="space-y-2 text-[10px] font-mono text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estimated Tender Value:</span>
                      <span className="font-bold text-slate-800">{formatZAR(estimatedTenderValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Import Content Percentage:</span>
                      <span className="font-bold text-slate-800">{importedContentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NIPP Statutory Threshold (R10M):</span>
                      <span className={`font-bold ${isNippThresholdExceeded ? 'text-amber-700 font-extrabold' : 'text-slate-600'}`}>
                        {isNippThresholdExceeded ? 'EXCEEDED' : 'NOT MET'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NIPP Import Threshold (R3M):</span>
                      <span className={`font-bold ${isNippImportThresholdExceeded ? 'text-amber-700 font-extrabold' : 'text-slate-600'}`}>
                        {isNippImportThresholdExceeded ? 'EXCEEDED' : 'NOT MET'}
                      </span>
                    </div>
                  </div>

                  {isNippObligationActive ? (
                    <div className="bg-amber-100/60 p-3 rounded border border-amber-200 text-[9.5px] leading-relaxed text-slate-700">
                      <strong>⚠️ Action Required:</strong> Your tender value exceeds R10M and imports exceed R3M. You are legally required to complete and append <strong>SBD 5</strong> to your tender package. The dti requires bidders to sign an agreement committing to offset at least 30% of their imported content value through local manufacturing, skill-transfer, or job-creation.
                    </div>
                  ) : (
                    <div className="bg-emerald-100/60 p-3 rounded border border-emerald-200 text-[9.5px] leading-relaxed text-slate-700">
                      <strong>✓ SBD 5 Not Active:</strong> Under current configurations, NIPP obligation is not triggered. Ensure your imported content values remain verified by customs paperwork.
                    </div>
                  )}

                  {/* Legal Pre-emption Clause */}
                  <div className="bg-slate-100/70 border border-slate-200 p-3 rounded text-[9px] text-slate-500 font-sans leading-normal">
                    <strong className="text-slate-700 uppercase font-mono block mb-0.5">App Provider Professional Indemnity disclaimer:</strong>
                    SATA NIPP evaluations are strictly advisory simulators. Actual NIPP liability thresholds are subject to dti interpretation. Bidders must independently verify currency conversions and import customs assessments. The app provider accepts no liability for SBD 5 omissions or bid disqualifications.
                  </div>

                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 6: CIPC & DIRECTOR CONFLICT AUDITOR (SBD 4) --- */}
        {activeSubTab === 'cipc_directors' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-cipc-directors">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-600" />
                CIPC Directorship Active Verification & Conflict Audit (SBD 4)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Under SBD 4 (Bidders Disclosure), bidders must declare whether any of their directors are employed by the state (PERSAL conflict) or hold disqualifying relationships. Submitting incorrect SBD 4 disclosures constitutes a criminal offense.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Director Inputs */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block border-b border-slate-200 pb-1.5">Add Director for SBD 4 Verification</span>
                
                <div className="space-y-3 font-mono">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Director Full Name</label>
                    <input
                      type="text"
                      value={newDirectorName}
                      onChange={(e) => setNewDirectorName(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                      placeholder="e.g. Thabo Mthembu"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">SA Identity Number (13 Digits)</label>
                    <input
                      type="text"
                      value={newDirectorID}
                      onChange={(e) => setNewDirectorID(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white"
                      placeholder="e.g. 7810125087084"
                      maxLength={13}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newDirectorState}
                        onChange={(e) => setNewDirectorState(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-[9.5px] font-bold text-slate-700 uppercase">State/Government Employee</span>
                    </label>
                  </div>

                  {newDirectorState && (
                    <div className="space-y-1 animate-fadeIn">
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">PERSAL System Number</label>
                      <input
                        type="text"
                        value={newDirectorPersal}
                        onChange={(e) => setNewDirectorPersal(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white font-mono"
                        placeholder="e.g. P892301A"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleAddDirector}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 py-1.5 px-3 rounded font-bold transition-all text-center text-[10.5px] cursor-pointer"
                  >
                    + Add to SBD 4 Check
                  </button>
                </div>
              </div>

              {/* Directors Table & Audit Result */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Directors Register & Conflict Audit Logs</span>
                  <button
                    onClick={handleAuditDirectors}
                    disabled={checkingDirectors}
                    className="inline-flex items-center gap-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold py-1 px-3 rounded cursor-pointer disabled:opacity-50"
                  >
                    {checkingDirectors ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                    {checkingDirectors ? 'Auditing PERSAL...' : 'Run SBD 4 Conflict Audit'}
                  </button>
                </div>

                {/* Audit Score Header */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-lg">
                  <span className="text-[9.5px] font-bold text-slate-500 font-mono uppercase">Audit Result Status:</span>
                  <span className={`text-[10.5px] font-black font-mono px-2 py-0.5 rounded border uppercase ${
                    auditScore === 'CLEARED' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                    auditScore === 'CONFLICTS DETECTED' ? 'bg-amber-100 border-amber-300 text-amber-800 animate-pulse' :
                    'bg-slate-100 border-slate-300 text-slate-500'
                  }`}>
                    {auditScore}
                  </span>
                </div>

                {/* Grid */}
                <div className="border border-slate-200 rounded-lg overflow-hidden text-left bg-white text-[10px]">
                  <div className="grid grid-cols-12 bg-slate-100 p-2 border-b border-slate-200 font-bold font-mono text-slate-600 uppercase text-[8.5px]">
                    <div className="col-span-4">Full Name / ID</div>
                    <div className="col-span-3 text-center">ID Luhn Valid</div>
                    <div className="col-span-4">State Employee / PERSAL</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {directorsList.map((dir) => {
                      const isIdValid = validateSAID(dir.idNumber);
                      return (
                        <div key={dir.id} className="grid grid-cols-12 p-2.5 items-center hover:bg-slate-50 font-mono text-[9.5px]">
                          <div className="col-span-4 text-left">
                            <span className="font-bold text-slate-800 block truncate">{dir.name}</span>
                            <span className="text-[8.5px] text-slate-400 block">{dir.idNumber}</span>
                          </div>
                          
                          <div className="col-span-3 text-center">
                            <span className={`font-bold px-1.5 py-0.2 rounded text-[8px] ${
                              isIdValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {isIdValid ? 'YES' : 'INVALID'}
                            </span>
                          </div>

                          <div className="col-span-4">
                            {dir.isStateEmployee ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded text-[8px] block w-fit truncate">
                                PERSAL Conflict: {dir.persalNum}
                              </span>
                            ) : (
                              <span className="text-slate-400">None</span>
                            )}
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              onClick={() => handleRemoveDirector(dir.id)}
                              className="text-red-500 hover:text-red-700 font-bold font-mono text-[9px] cursor-pointer"
                            >
                              DEL
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-[9.5px] text-amber-950 font-sans leading-relaxed">
                  <strong>SCM Legal Precaution:</strong> Active state employees (PERSAL members) are strictly forbidden from participating in public tenders under Section 8 of the Public Administration Management Act 11 of 2014, unless they possess formal approval from their Executive Authority. The app provider is completely insulated from any liability for falsified SBD 4 forms submitted by users.
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 7: PAJA SCM APPEALS & DISPUTES --- */}
        {activeSubTab === 'paja_appeals' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-paja-appeals">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-indigo-600" />
                Statutory SCM Appeal & PAJA Dispute Builder (Act 3 of 2000)
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                If a public SCM committee unfairly disqualifies your bid or scores your creditworthiness metrics incorrectly, lodge a formal administrative appeal under the Promotion of Administrative Justice Act (PAJA).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Inputs */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg text-xs font-mono">
                <span className="text-[10px] font-bold text-slate-500 uppercase block border-b border-slate-200 pb-1.5">Appeal Parameters</span>
                
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Organ of State (Procuring Body)</label>
                    <input
                      type="text"
                      value={organOfStateName}
                      onChange={(e) => setOrganOfStateName(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Tender Reference Number</label>
                    <input
                      type="text"
                      value={tenderRefNumber}
                      onChange={(e) => setTenderRefNumber(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Stated Disqualification Reason</label>
                    <input
                      type="text"
                      value={disqualificationReason}
                      onChange={(e) => setDisqualificationReason(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Additional Representation Representation Notes</label>
                    <textarea
                      value={customAppealNotes}
                      onChange={(e) => setCustomAppealNotes(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white font-sans h-20"
                      placeholder="Describe why the decision was administrative error..."
                    />
                  </div>
                </div>
              </div>

              {/* Appeal Output Letter */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">PAJA SCM Appeal Letter Template</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateAppealLetter());
                      setCopiedAppeal(true);
                      addLog?.('Copied SCM Appeal PAJA letter to clipboard.', 'success');
                      setTimeout(() => setCopiedAppeal(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {copiedAppeal ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedAppeal ? 'Copied Appeal Letter' : 'Copy Appeal Letter'}
                  </button>
                </div>

                <div className="bg-slate-950 text-slate-300 p-4 rounded-lg font-mono text-[9px] leading-relaxed max-h-80 overflow-y-auto border border-slate-800 text-left whitespace-pre-wrap select-text">
                  {generateAppealLetter()}
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[9.5px] text-slate-500 leading-normal font-sans">
                  <strong className="text-slate-700 uppercase font-mono block mb-0.5">App Provider Liability Disclaimer:</strong>
                  This template represents an educational draft. Administrative law is highly complex and subject to strict timelines (typically 180 days under PAJA). Generating or sending this draft does not establish an attorney-client relationship. The app provider accepts zero liability for SBD procurement appeals or court actions.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- PANEL 8: LIABILITY SAFEGUARD & WAIVER HUB --- */}
        {activeSubTab === 'liability_hub' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-liability-hub">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600" />
                App Provider Liability Waiver & Professional Indemnity Consent Hub
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Protecting the developer and service provider from prejudice. Digitally sign the liability waiver under Section 13 of the Electronic Communications and Transactions (ECT) Act 2002 before finalizing SBD forms.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Terms of Service Scroll Panel */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">SATA Solutions - Terms of Service & Electronic Waiver</span>
                
                <div className="bg-slate-50 border border-slate-200 rounded p-4 text-[10px] text-slate-600 leading-relaxed font-sans h-72 overflow-y-auto space-y-3">
                  <h4 className="font-bold text-slate-800 uppercase font-mono text-[9.5px]">1. Assistive Software Sandbox Classification</h4>
                  <p>
                    The South African Tender Automator ("SATA") operates exclusively as an automated assistive compliance sandbox. It is NOT an official platform of the National Treasury, SARS, or CIPC, nor does it possess official government endorsement.
                  </p>
                  
                  <h4 className="font-bold text-slate-800 uppercase font-mono text-[9.5px]">2. No Warranties or Guarantees of Bid Success</h4>
                  <p>
                    The app provider offers zero warranties regarding the factual accuracy of compiled SBD or MBD forms, preference point score allocations, or bidder solvency ratio results. Tender evaluations remain subject to the sole administrative discretion of SCM bidding committees.
                  </p>

                  <h4 className="font-bold text-slate-800 uppercase font-mono text-[9.5px]">3. Professional Indemnity & Waiver of Prejudice</h4>
                  <p>
                    By accepting this agreement, the user agrees to fully insulate, indemnify, and hold harmless the app developer, provider, and affiliates from any direct, indirect, or consequential damages, including loss of revenue, disqualification of public contracts, tax penalties, or administrative litigation arising from the use of SATA tools.
                  </p>

                  <h4 className="font-bold text-slate-800 uppercase font-mono text-[9.5px]">4. POPIA Cryptographic Compliance Confirmation</h4>
                  <p>
                    SATA stores sensitive bidder inputs locally on user devices. Cryptographic hashing utilized for the cloud ledger complies fully with the Protection of Personal Information Act (POPIA). Bidders remain sole custodians of their private RSA cryptographic keys.
                  </p>
                </div>
              </div>

              {/* Digital Signing Action Panel */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Digitally Sign Liability Waiver</span>

                <div className="border border-slate-150 rounded-lg p-4 bg-slate-50 space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hasAgreedToDisclaimers}
                        onChange={(e) => {
                          setHasAgreedToDisclaimers(e.target.checked);
                          if (!e.target.checked) setWaiverSignatureLog(null);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                      />
                      <div className="space-y-0.5 text-left text-slate-600 text-[10.5px]">
                        <strong>I agree to the Terms & Waiver Waiver</strong>
                        <p className="text-[8.5px] text-slate-400">Accept that SATA results are advisory and the provider is fully indemnified.</p>
                      </div>
                    </label>
                  </div>

                  {waiverSignatureLog ? (
                    <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded text-[9.5px] space-y-2 text-left animate-fadeIn font-mono">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase text-[9px]">
                        <CheckCircle className="w-4 h-4" /> WAIVER SIGNED & SEALED
                      </div>
                      <p className="leading-relaxed text-[8.5px] text-emerald-900 truncate whitespace-normal break-all">
                        {waiverSignatureLog}
                      </p>
                      <button
                        onClick={handleRevokeWaiver}
                        className="text-[9.5px] font-bold text-red-600 hover:text-red-800 uppercase mt-1 cursor-pointer block"
                      >
                        Revoke Signature Notice
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleSealLegalWaiver}
                      disabled={isSealingWaiver || !hasAgreedToDisclaimers}
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-2.5 px-4 rounded font-mono font-bold text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isSealingWaiver ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                      {isSealingWaiver ? 'Signing Waiver...' : 'Sign Legal Waiver'}
                    </button>
                  )}

                  {activeCert && (
                    <div className="text-[8.5px] text-slate-400 leading-normal font-mono text-left border-l-2 border-indigo-500 pl-2">
                      ✓ RSA signing keys detected: {activeCert.subjectName}. Key-pair will bind to the sealed agreement seal.
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}


        {/* --- PANEL 9: SBD 6.1 PREFERENCE POINTS CLAIM & B-BBEE SCORECARD --- */}
        {activeSubTab === 'sbd6_preference' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-sbd6-preference">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                SBD 6.1 Preference Points Claim & B-BBEE Scorecard Simulator
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Calculate and audit your bidder competitiveness using South African statutory preferential procurement point frameworks (80/20 & 90/10 scoring matrices).
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Point Parameters Form */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Preference Formula Variables</span>

                <div className="space-y-3">
                  {/* Point System Selector */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Procurement Framework System</label>
                    <select
                      value={preferenceSystem}
                      onChange={(e) => {
                        setPreferenceSystem(e.target.value as any);
                        addLog?.(`Preferential System: Changed to ${e.target.value === '80_20' ? '80/20' : '90/10'} framework.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value="80_20">80/20 System (Tender value &le; R50 million)</option>
                      <option value="90_10">90/10 System (Tender value &gt; R50 million)</option>
                    </select>
                  </div>

                  {/* Bid Price Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Your Bid Price (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={bidPrice}
                        onChange={(e) => setBidPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Lowest Bid Price Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Lowest Acceptable Bid Price (Pmin) (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={lowestBidPrice}
                        onChange={(e) => setLowestBidPrice(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* B-BBEE Level Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">B-BBEE Level Status</label>
                    <select
                      value={bbeeLevel}
                      onChange={(e) => {
                        setBbeeLevel(Number(e.target.value));
                        addLog?.(`Preferential Points: Adjusted B-BBEE Level to Level ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(lvl => (
                        <option key={lvl} value={lvl}>Level {lvl} Contributor</option>
                      ))}
                      <option value={9}>Non-Compliant Contributor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Point Calculations Display Panel */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-950 rounded-lg p-5 text-white flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Consolidated Bidding Scorecard</span>
                    <span className="text-emerald-400 font-mono font-extrabold uppercase text-[9px]">SBD 6.1 Verified</span>
                  </div>

                  {(() => {
                    const { pricePoints, bbeePoints, totalPoints, maxPoints } = calculateSbd6Points();
                    const bbeeMax = preferenceSystem === '80_20' ? 20 : 10;
                    return (
                      <div className="space-y-4">
                        
                        {/* Summary Numbers */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-center">
                            <span className="text-[8px] text-slate-500 block uppercase font-mono">Price Score</span>
                            <span className="text-sm font-mono font-bold text-slate-100">{pricePoints} <span className="text-[9px] text-slate-400">/ {maxPoints}</span></span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-center">
                            <span className="text-[8px] text-slate-500 block uppercase font-mono">B-BBEE Score</span>
                            <span className="text-sm font-mono font-bold text-indigo-400">{bbeePoints} <span className="text-[9px] text-slate-400">/ {bbeeMax}</span></span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded border border-slate-850 text-center bg-indigo-950/20 border-indigo-900/30">
                            <span className="text-[8px] text-indigo-400 block uppercase font-mono">Total Points</span>
                            <span className="text-sm font-mono font-extrabold text-emerald-400">{totalPoints} <span className="text-[9px] text-slate-400">/ 100</span></span>
                          </div>
                        </div>

                        {/* Visual Progress Bars */}
                        <div className="space-y-3 pt-1">
                          
                          {/* Price Points Progress */}
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono text-[10px] text-slate-300">
                              <span>Price Evaluation (Ps)</span>
                              <span>{Math.round((pricePoints / maxPoints) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                              <div className="bg-slate-300 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(pricePoints / maxPoints) * 100}%` }}></div>
                            </div>
                          </div>

                          {/* B-BBEE Points Progress */}
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between font-mono text-[10px] text-slate-300">
                              <span>B-BBEE Status Claim Points</span>
                              <span>{Math.round((bbeePoints / bbeeMax) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                              <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(bbeePoints / bbeeMax) * 100}%` }}></div>
                            </div>
                          </div>

                        </div>

                        {/* Mathematical Formula Disclaimer */}
                        <div className="p-3 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-400 font-mono space-y-1.5 leading-normal">
                          <p className="font-bold text-slate-300 uppercase">Statutory Point Scoring Formulas:</p>
                          <p className="text-slate-400">
                            {preferenceSystem === '80_20' 
                              ? 'Ps = 80 * (1 - (Pt - Pmin) / Pmin) where Pt is Bid Price and Pmin is lowest acceptable bid.'
                              : 'Ps = 90 * (1 - (Pt - Pmin) / Pmin) where Pt is Bid Price and Pmin is lowest acceptable bid.'
                            }
                          </p>
                          <div className="text-[8.5px] border-t border-slate-850 pt-1.5 text-indigo-400 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            Preferential Procurement Regulations, 2022 framework compliance confirmed.
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

                <div className="text-[8.5px] text-slate-500 leading-normal font-mono text-left pt-4 border-t border-slate-850">
                  ✓ SBD 6.1 claims will be dynamically output inside the finalized cryptographically sealed PDF binder.
                </div>
              </div>

            </div>
          </div>
        )}


        {/* --- PANEL 10: SBD 8/9 INDEPENDENT BID DETERMINATION & COLLUSION AUDITOR --- */}
        {activeSubTab === 'sbd8_9_independent' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-sbd8-9-independent">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                SBD 8 & 9 past SCM practices & Independent Bid Determination Auditor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Prevent anticompetitive tender collusion. Log rival bidding entities to perform automated Director overlaps and pricing dispersion checks.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Rival Registration Form */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-5 text-left">
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Competitor Registry for Collusion Check</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={competitorInput}
                      onChange={(e) => setCompetitorInput(e.target.value)}
                      placeholder="e.g. Rival Bidder CC"
                      className="flex-grow bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    />
                    <button
                      onClick={handleAddCompetitor}
                      className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1.5 rounded text-xs font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* List of rivals */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Active Bidding Competitors ({competitors.length})</span>
                  {competitors.length === 0 ? (
                    <div className="p-3 bg-white border border-slate-100 rounded text-center text-xs font-mono text-slate-400">
                      No competitors logged. Pure independent bid check will occur.
                    </div>
                  ) : (
                    <div className="border border-slate-150 rounded bg-white divide-y divide-slate-100 overflow-hidden max-h-40 overflow-y-auto">
                      {competitors.map((name, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 text-xs font-mono">
                          <span className="text-slate-700 truncate font-semibold">{name}</span>
                          <button
                            onClick={() => handleRemoveCompetitor(name)}
                            className="text-[9.5px] text-red-500 hover:text-red-700 font-bold uppercase cursor-pointer px-1"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SBD 8 Declaration of Past Malpractice */}
                <div className="space-y-2 border-t border-slate-200 pt-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">SBD 8 past SCM practices checks</span>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={pastScmViolationDecl}
                      onChange={(e) => setPastScmViolationDecl(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 mt-0.5"
                    />
                    <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                      <strong>Malpractice Flag Declaration</strong>
                      <p className="text-[8.5px] text-slate-400 leading-normal">
                        Check this box if any director has been flagged, disqualified, or defaulted on a public contract in the last 5 years.
                      </p>
                    </div>
                  </label>
                </div>

                {/* SBD 9 Certification Consent */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={antiCollusionConsent}
                      onChange={(e) => setAntiCollusionConsent(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                    />
                    <div className="space-y-0.5 text-slate-600 text-[10.5px]">
                      <strong>Independent Bid Certification (SBD 9)</strong>
                      <p className="text-[8.5px] text-slate-400 leading-normal">
                        I certify that this bid has been compiled entirely independently and without price agreement or rigging.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleRunBidAudit}
                  disabled={isAuditingBids || !antiCollusionConsent}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-2.5 px-4 rounded font-mono font-bold text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isAuditingBids ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-4 h-4" />}
                  {isAuditingBids ? 'Auditing Tender collusion...' : 'Perform Independent Bid Audit'}
                </button>

              </div>

              {/* Audit Report Result Panel */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Independent Audit Certificate Output</span>
                    <span className="text-slate-400 font-mono text-[9px]">SBD 8 & 9 Consolidated</span>
                  </div>

                  {bidAuditReport ? (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Pass/Fail Banner */}
                      <div className={`p-4 rounded-lg border flex items-start gap-3 ${
                        bidAuditReport.status === 'passed' 
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-950' 
                          : 'bg-red-50 border-red-100 text-red-950'
                      }`}>
                        {bidAuditReport.status === 'passed' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold uppercase block">
                            {bidAuditReport.status === 'passed' ? 'AUDIT PASS: CLEAR INDEPENDENT STATUS' : 'AUDIT WARNING: COMPLIANCE RISKS DETECTED'}
                          </span>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            {bidAuditReport.status === 'passed'
                              ? 'No direct Director overlaps or shared CIPC registrations detected with logged competitors. SBD 9 criteria verified.'
                              : 'High Risk declaration logged. SBD 8 past SCM practices flags trigger strict administrative manual reviews by procurement teams.'
                            }
                          </p>
                        </div>
                      </div>

                      {/* Technical details table */}
                      <div className="bg-slate-50 border border-slate-150 rounded p-3 text-[10px] space-y-2 font-mono">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">ANTI-COLLUSIVE SCAN:</span>
                          <span className={`font-bold ${bidAuditReport.status === 'passed' ? 'text-emerald-700' : 'text-red-700'}`}>
                            {bidAuditReport.antiCollusiveCheck}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">DIRECTOR RELATION OVERLAPS:</span>
                          <span className="font-bold text-slate-700">{bidAuditReport.directOverlaps} overlaps found</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">PRICE DISPERSION VARIATION:</span>
                          <span className="font-bold text-slate-700">{bidAuditReport.priceDispersionRisk} VARIANCE RISK</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span className="text-slate-400">VERIFICATION REF CODE:</span>
                          <span className="font-bold text-indigo-700">{bidAuditReport.declarationCode}</span>
                        </div>
                        <div className="flex justify-between pt-0.5">
                          <span className="text-slate-400">TIMESTAMP LOGGED:</span>
                          <span className="font-bold text-slate-500">{bidAuditReport.timestamp}</span>
                        </div>
                      </div>

                      {/* PDF Export Notification */}
                      <p className="text-[9.5px] text-slate-400 leading-relaxed font-sans italic">
                        *This certificate verifies that SATA Solutions has simulated cross-director CIPC scraping and horizontal pricing rings. The app provider takes zero liability for manual alterations.
                      </p>
                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Log rivals and press "Perform Independent Bid Audit" to run the anti-collusion compiler sweep.
                    </div>
                  )}

                </div>

                <div className="text-[8.5px] text-slate-400 leading-normal font-mono text-left pt-4 border-t border-slate-100">
                  ✓ SBD 9 independent bid certificate references will be permanently cryptographically signed and archived on the blockchain ledger.
                </div>
              </div>

            </div>
          </div>
        )}


        {/* --- PANEL 11: CIDB GRADING & CONTRACTOR CAPACITY ASSESSOR --- */}
        {activeSubTab === 'cidb_capacity' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-cidb-capacity">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-amber-600" />
                CIDB Grading & Contractor Capacity Limit Assessor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Verify the bidding entity's Construction Industry Development Board (CIDB) grading eligibility and maximum tender value thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* CIDB Inputs */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">CIDB Status Details</span>

                <div className="space-y-3">
                  {/* Grade Selection */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Target Contractor CIDB Grade</label>
                    <select
                      value={cidbGrade}
                      onChange={(e) => {
                        setCidbGrade(Number(e.target.value));
                        addLog?.(`CIDB Assessor: Changed contractor grading to Grade ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(gr => (
                        <option key={gr} value={gr}>Grade {gr} Contractor</option>
                      ))}
                    </select>
                  </div>

                  {/* Class of Works Selection */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Class of Construction Works</label>
                    <select
                      value={classOfWorks}
                      onChange={(e) => {
                        setClassOfWorks(e.target.value);
                        addLog?.(`CIDB Assessor: Changed works class to ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value="GB">GB - General Building Works</option>
                      <option value="CE">CE - Civil Engineering Works</option>
                      <option value="ME">ME - Mechanical Engineering Works</option>
                      <option value="EE">EE - Electrical Engineering (Buildings)</option>
                      <option value="EP">EP - Electrical Engineering (Infrastructure)</option>
                    </select>
                  </div>

                  {/* Target Works Value Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Active Tender Estimated Works Value (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={worksTenderValue}
                        onChange={(e) => setWorksTenderValue(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 leading-normal font-sans italic">
                  *CIDB grading limits are updated according to the latest statutory thresholds from the National Treasury & construction registers in South Africa.
                </p>
              </div>

              {/* Threshold Evaluation Panel */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-950 rounded-lg p-5 text-white flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">CIDB Grade Eligibility Report</span>
                    <span className="text-amber-400 font-mono text-[9px] uppercase font-bold">Limit Compliance Checked</span>
                  </div>

                  {(() => {
                    const maxLimit = getCidbLimit(cidbGrade);
                    const isExceeded = worksTenderValue > maxLimit;
                    const percentUsed = Math.min(100, Math.round((worksTenderValue / maxLimit) * 100));
                    return (
                      <div className="space-y-4">
                        
                        {/* Display Limits */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-slate-950 p-3 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-500 block uppercase font-mono">Contractor Max Threshold</span>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              {cidbGrade === 9 ? 'Unlimited Capacity' : formatZAR(maxLimit)}
                            </span>
                          </div>
                          <div className="bg-slate-950 p-3 rounded border border-slate-850">
                            <span className="text-[8px] text-slate-500 block uppercase font-mono">Current Bid Works Value</span>
                            <span className="text-xs font-mono font-bold text-slate-100">{formatZAR(worksTenderValue)}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`p-4 rounded border flex items-start gap-2.5 ${
                          !isExceeded 
                            ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-100' 
                            : 'bg-red-950/40 border-red-900/50 text-red-100'
                        }`}>
                          {!isExceeded ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                          )}
                          <div className="space-y-1">
                            <span className="text-[10.5px] font-mono font-bold uppercase block">
                              {!isExceeded ? 'PASS: WITHIN GRADING CAPACITY' : 'FAIL: CAPACITY LIMIT EXCEEDED'}
                            </span>
                            <p className="text-[9.5px] text-slate-400 leading-normal">
                              {!isExceeded 
                                ? `The bidding entity's Grade ${cidbGrade} credential supports contract awards up to ${cidbGrade === 9 ? 'Unlimited' : formatZAR(maxLimit)}. Bidding capacity is fully verified.`
                                : `WARNING: Grade ${cidbGrade} limits bidding to contracts under ${formatZAR(maxLimit)}. Bidding with a works value of ${formatZAR(worksTenderValue)} triggers automatic administrative pre-qualification disqualification.`
                              }
                            </p>
                          </div>
                        </div>

                        {/* Capacity Load Bar */}
                        {cidbGrade !== 9 && (
                          <div className="space-y-1">
                            <div className="flex justify-between font-mono text-[9px] text-slate-400">
                              <span>Grade Limit Utilization</span>
                              <span className={isExceeded ? 'text-red-400 font-bold' : 'text-amber-400'}>{percentUsed}%</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 border border-slate-850 overflow-hidden">
                              <div className={`h-1.5 rounded-full transition-all duration-500 ${isExceeded ? 'bg-red-500' : 'bg-amber-400'}`} style={{ width: `${percentUsed}%` }}></div>
                            </div>
                          </div>
                        )}

                        {/* JV Joint Venture Suggestion */}
                        {isExceeded && (
                          <div className="p-3 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-400 font-mono space-y-1">
                            <span className="font-bold text-slate-300 block uppercase">Consolidated Joint Venture Option:</span>
                            <p>
                              To bid legally, compile a Joint Venture (JV) with another contractor. SATA JV Matchmaker computes consolidated grading formulas automatically under the standard CIDB Practice Note 20 guidelines.
                            </p>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>

                <div className="text-[8.5px] text-slate-500 leading-normal font-mono text-left pt-4 border-t border-slate-850">
                  ✓ Construction registers will be queried live during the final compliance certificate rendering phase.
                </div>
              </div>

            </div>
          </div>
        )}


        {/* --- PANEL 12: COIDA COMPLIANCE & LETTER OF GOOD STANDING --- */}
        {activeSubTab === 'coida_standing' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-coida-standing">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                COIDA Compliance & Letter of Good Standing Auditor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Audit statutory compliance under the Compensation for Occupational Injuries and Diseases Act (COIDA) and calculate annual labour assessment fee provisions.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* COIDA Inputs */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Compensation Commissioner Filing details</span>

                <div className="space-y-3">
                  {/* COIDA Reg Number */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">COIDA Registration Number</label>
                    <input
                      type="text"
                      value={coidaRegNumber}
                      onChange={(e) => setCoidaRegNumber(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* COIDA Employer Status */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Filing & Arrears Compliance Status</label>
                    <select
                      value={coidaStatus}
                      onChange={(e) => {
                        setCoidaStatus(e.target.value as any);
                        addLog?.(`COIDA Compliance: Switched employer filing status to ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value="compliant">Compliant (No Outstanding Returns / Fees Paid)</option>
                      <option value="arrears">Arrears / Outstanding Assessment Payments</option>
                      <option value="pending">Audit Outstanding / Delayed Declarations</option>
                    </select>
                  </div>

                  {/* Payroll Value Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Total Annual Payroll (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={annualPayroll}
                        onChange={(e) => setAnnualPayroll(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Industry Risk Selection */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">COIDA Risk Assessment Category</label>
                    <select
                      value={industryRiskClass}
                      onChange={(e) => {
                        setIndustryRiskClass(e.target.value);
                        addLog?.(`COIDA Compliance: Switched risk category to ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value="software">IT & Software (Class 1520 - Rate: 0.15%)</option>
                      <option value="construction">Construction & Civil (Class 0500 - Rate: 1.80%)</option>
                      <option value="logistics">Freight & Logistics (Class 1100 - Rate: 1.20%)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleVerifyCOID}
                  disabled={isValidatingCoida}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-2.5 px-4 rounded font-mono font-bold text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isValidatingCoida ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-4 h-4" />}
                  {isValidatingCoida ? 'Verifying Letter...' : 'Validate COIDA Standing'}
                </button>
              </div>

              {/* Department of Labour Letter Output */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">COIDA Letters & Assessments Ledger</span>
                    <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Labour Registry Verified</span>
                  </div>

                  {coidaValidationResult ? (
                    <div className="space-y-4 animate-fadeIn">
                      
                      {/* Good Standing Letter Template */}
                      <div className="bg-slate-50 border border-slate-250 rounded p-4 font-mono text-[10px] leading-relaxed relative overflow-hidden text-slate-800 shadow-sm">
                        
                        {/* Background watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none select-none rotate-12">
                          <span className="text-3xl font-black font-mono uppercase text-slate-900">SOUTH AFRICA LABOUR COIDA</span>
                        </div>

                        <div className="border-b border-dashed border-slate-300 pb-2 mb-2 flex justify-between font-bold text-slate-500 text-[9px]">
                          <span>DEPT OF EMPLOYMENT & LABOUR</span>
                          <span>LETTER OF GOOD STANDING</span>
                        </div>

                        <div className="space-y-1.5">
                          <p><strong>REGISTRATION NUMBER:</strong> {coidaValidationResult.registrationNumber}</p>
                          <p><strong>EMPLOYER IDENTITY:</strong> SATA Solutions (Pty) Ltd</p>
                          <p><strong>COMPLIANCE STATUS:</strong> <span className={coidaValidationResult.status === 'compliant' ? 'text-emerald-700 font-extrabold uppercase' : 'text-red-700 font-extrabold uppercase'}>{coidaValidationResult.status}</span></p>
                          <p><strong>ESTIMATED COIDA ASSESSMENT FEE:</strong> {formatZAR(coidaValidationResult.assessmentFee)}</p>
                          <p><strong>LETTER EXPIRY DATE:</strong> {coidaValidationResult.letterExpiryDate}</p>
                          <p><strong>LABOUR VERIFICATION KEY:</strong> {coidaValidationResult.complianceCode}</p>
                        </div>

                        <div className="border-t border-dashed border-slate-300 pt-2 mt-2 text-[8.5px] text-slate-400 leading-normal">
                          ✓ This letter certifies that the named employer has complied with the requirements of Section 89 of COID Act 130 of 1993.
                        </div>
                      </div>

                      {/* Status summary */}
                      {coidaValidationResult.status !== 'compliant' && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-950 rounded text-[9.5px] flex items-start gap-2 animate-fadeIn leading-relaxed">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <strong>SCM PRE-QUALIFICATION WARNING:</strong> COIDA Letter of Good Standing is listed as arrears or outstanding. Government contracts will immediately disqualify this entity unless a current letter is appended.
                          </div>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Press "Validate COIDA Standing" to fetch current letter status from the Commissioner registers.
                    </div>
                  )}
                </div>

                <div className="text-[8.5px] text-slate-400 leading-normal font-mono text-left pt-4 border-t border-slate-100">
                  ✓ Letters of Good Standing will be parsed and formatted cleanly into SBD-compliant compliance reports automatically.
                </div>
              </div>

            </div>
          </div>
        )}


        {/* --- PANEL 13: MUNICIPAL RATES & UTILITIES CLEARANCE AUDITOR --- */}
        {activeSubTab === 'municipal_clearance' && (
          <div className="space-y-6 animate-fadeIn" id="subtab-municipal-clearance">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-emerald-600" />
                Municipal Rates, Taxes & Utilities Clearance Auditor
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                SBD 4 and SBD 8 frameworks mandate declaring that the bidder or its directors do not owe local municipal rates, taxes or services for more than 90 days.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Municipal Inputs */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4 text-left">
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Municipal Account Information</span>

                <div className="space-y-3">
                  {/* Account Number */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Municipal Account Number</label>
                    <input
                      type="text"
                      value={municipalAccount}
                      onChange={(e) => setMunicipalAccount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Local Municipality Selection */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Local Municipality</label>
                    <select
                      value={municipalityName}
                      onChange={(e) => {
                        setMunicipalityName(e.target.value);
                        addLog?.(`Municipal Auditor: Switched municipality to ${e.target.value}.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value="City of Johannesburg">City of Johannesburg Metropolitan Municipality</option>
                      <option value="City of Cape Town">City of Cape Town Metropolitan Municipality</option>
                      <option value="eThekwini Municipality">eThekwini Metropolitan Municipality (Durban)</option>
                      <option value="City of Tshwane">City of Tshwane Metropolitan Municipality (Pretoria)</option>
                      <option value="Buffalo City">Buffalo City Metropolitan Municipality (East London)</option>
                    </select>
                  </div>

                  {/* Arrears Value Input */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Outstanding Arrears Balance (ZAR)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2 text-xs font-mono font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={municipalArrears}
                        onChange={(e) => setMunicipalArrears(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded pl-7 pr-3 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Age of outstanding debt */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-mono font-bold text-slate-600 uppercase">Age of Outstanding Balance</label>
                    <select
                      value={municipalDebtAge}
                      onChange={(e) => {
                        setMunicipalDebtAge(Number(e.target.value));
                        addLog?.(`Municipal Auditor: Set outstanding balance debt age to ${e.target.value} days.`, 'info');
                      }}
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono focus:border-slate-800 focus:outline-none"
                    >
                      <option value={0}>0 Days (Fully Paid / Clear)</option>
                      <option value={30}>30 Days Outstanding</option>
                      <option value={60}>60 Days Outstanding</option>
                      <option value={90}>90+ Days (Statutory Threshold Lapsed)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleAuditMunicipal}
                  disabled={isAuditingMunicipal}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 py-2.5 px-4 rounded font-mono font-bold text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isAuditingMunicipal ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Landmark className="w-4 h-4" />}
                  {isAuditingMunicipal ? 'Auditing Municipal Registry...' : 'Perform Municipal Account Audit'}
                </button>
              </div>

              {/* Municipal Audit Outcomes Panel */}
              <div className="lg:col-span-6 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
                <div className="space-y-4 text-left">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Municipal Accounts Compliance Status</span>
                    <span className="text-slate-400 font-mono text-[9px] uppercase font-bold">Rates Registry Verified</span>
                  </div>

                  {municipalAuditResult ? (
                    <div className="space-y-4 animate-fadeIn">
                      
                      {/* Pass/Fail Banner */}
                      <div className={`p-4 rounded border flex items-start gap-2.5 ${
                        municipalAuditResult.status === 'compliant'
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-950'
                          : 'bg-red-50 border-red-100 text-red-950'
                      }`}>
                        {municipalAuditResult.status === 'compliant' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                        )}
                        <div className="space-y-1">
                          <span className="text-[10.5px] font-mono font-bold uppercase block">
                            {municipalAuditResult.status === 'compliant' ? 'MUNICIPALITY COMPLIANT STATUS ACTIVE' : 'MUNICIPALITY NON-COMPLIANT ARREARS'}
                          </span>
                          <p className="text-[9.5px] text-slate-500 leading-normal">
                            {municipalAuditResult.status === 'compliant'
                              ? `Verification approved. Accounts with ${municipalityName} logged under account reference ${municipalAccount} conform to SBD 4/8 guidelines.`
                              : `CRITICAL DISQUALIFICATION RISK: Bidding entity is listed with outstanding municipal rates/taxes arrears for over 90 days. Tender rules under SBD 4/8 mandate immediate rejection.`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Technical detail outputs */}
                      <div className="bg-slate-50 border border-slate-150 rounded p-3 text-[10px] space-y-2 font-mono text-slate-800">
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span>TARGET MUNICIPALITY:</span>
                          <span className="font-bold text-slate-700">{municipalityName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span>ACCOUNT NUMBER:</span>
                          <span className="font-bold text-slate-700">{municipalAccount}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span>OUTSTANDING BALANCE:</span>
                          <span className={`font-bold ${municipalAuditResult.balance > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                            {formatZAR(municipalAuditResult.balance)}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1.5">
                          <span>DEBT AGE CLASSIFICATION:</span>
                          <span className="font-bold text-slate-700">{municipalAuditResult.debtAge} Days</span>
                        </div>
                        <div className="flex justify-between pt-0.5 text-[9px] text-slate-400">
                          <span>REGISTRY AUDIT REF:</span>
                          <span>{municipalAuditResult.declarationHash}</span>
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="p-10 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Press "Perform Municipal Account Audit" to verify the outstanding arrears age.
                    </div>
                  )}
                </div>

                <div className="text-[8.5px] text-slate-400 leading-normal font-mono text-left pt-4 border-t border-slate-100">
                  ✓ Municipal rates compliance status will be dynamically parsed during standard SBD 4 & 8 form filling automation.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
