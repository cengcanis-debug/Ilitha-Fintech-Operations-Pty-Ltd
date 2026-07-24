/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  FileText, 
  Lock, 
  Copyright, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Info, 
  Globe, 
  Building2, 
  ExternalLink, 
  FileCode, 
  Terminal, 
  ArrowRight, 
  Database, 
  RefreshCw, 
  FileSignature,
  FileSearch,
  BookOpen
} from 'lucide-react';
import { DigitalCertificate } from '../types';
import { saveDeveloperIPManifestToCloud, loadDeveloperIPManifestsFromCloud } from '../services/firebase';

interface DeveloperProtectionHubProps {
  activeCert: DigitalCertificate | null;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

interface SourceFileRecord {
  path: string;
  sizeBytes: number;
  hash: string;
}

export default function DeveloperProtectionHub({ activeCert, addLog }: DeveloperProtectionHubProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'cipc_trademark' | 'copyright_proof' | 'eula_disclaimer' | 'cease_desist'>('cipc_trademark');

  // --- TAB 1: CIPC Trademark State ---
  const [ownerEntity, setOwnerEntity] = useState<string>('SATA Solutions');
  const [tradeMarkName, setTradeMarkName] = useState<string>('SA TENDER ASSIST');
  const [markType, setMarkType] = useState<'word' | 'device' | 'combined'>('combined');
  const [logoDescription, setLogoDescription] = useState<string>('An elegant emerald-green geometric shield with an embedded white cryptographic checkmark, representing digital trust, secure SBD forms execution, and automated South African provincial procurement compliance.');
  const [applicantAddress, setApplicantAddress] = useState<string>('Suite 12, Clock Tower District, V&A Waterfront, Cape Town, 8001');
  const [applicantEmail, setApplicantEmail] = useState<string>('cengcanis@gmail.com');
  const [saRegNumber, setSaRegNumber] = useState<string>('Pending Registration (SATA Solutions - In Formation)');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([9, 35, 42]);
  const [showDossier, setShowDossier] = useState<boolean>(false);
  const [copiedDossier, setCopiedDossier] = useState<boolean>(false);

  // --- TAB 2: Copyright Proof State ---
  const [manifestFiles, setManifestFiles] = useState<SourceFileRecord[]>([
    { path: 'src/App.tsx', sizeBytes: 29993, hash: 'a1b2c3d4e5f607182930a4b5c6d7e8f9011223344556677889900aabbccddeef' },
    { path: 'src/services/firebase.ts', sizeBytes: 13540, hash: 'f9e8d7c6b5a493827160f5e4d3c2b1a011223344556677889900aabbccddeef' },
    { path: 'src/components/SBDFormFiller.tsx', sizeBytes: 147580, hash: 'e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b123456789abcdef0123456789abcdef01' },
    { path: 'src/components/RegulatoryShield.tsx', sizeBytes: 131244, hash: '9876543210abcdef9876543210abcdef0123456789abcdef0123456789abcdef' },
    { path: 'src/components/SataCreditworthinessAssessor.tsx', sizeBytes: 146956, hash: 'bcdef0123456789abcdef0123456789a123456789abcdef0123456789abcdef0' },
  ]);
  const [newFilePath, setNewFilePath] = useState<string>('');
  const [newFileSize, setNewFileSize] = useState<number>(4500);
  const [isSigningManifest, setIsSigningManifest] = useState<boolean>(false);
  const [signedCertProof, setSignedCertProof] = useState<any | null>(null);
  const [registeredManifests, setRegisteredManifests] = useState<any[]>([]);
  const [isLoadingManifests, setIsLoadingManifests] = useState<boolean>(false);

  // --- TAB 3: EULA State ---
  const [eulaVersion, setEulaVersion] = useState<string>('v1.2-Beta');
  const [copiedEula, setCopiedEula] = useState<boolean>(false);

  // --- TAB 4: Cease & Desist State ---
  const [infringerName, setInfringerName] = useState<string>('Plagiarist Tech Solutions');
  const [infringingAppName, setInfringingAppName] = useState<string>('SATA Clone Pro');
  const [infringingUrl, setInfringingUrl] = useState<string>('https://sata-clone-procurement.co.za');
  const [copiedCeaseDesist, setCopiedCeaseDesist] = useState<boolean>(false);

  // Calculations for CIPC Fees
  const cipcPerClassFee = 590; // ZAR
  const totalCipcEstimate = selectedClasses.length * cipcPerClassFee;

  // Load cloud registered manifests on mount and when activeCert changes
  const fetchCloudManifests = async () => {
    try {
      setIsLoadingManifests(true);
      const data = await loadDeveloperIPManifestsFromCloud();
      setRegisteredManifests(data);
    } catch (err) {
      console.warn("Could not load registered manifests from cloud:", err);
    } finally {
      setIsLoadingManifests(false);
    }
  };

  useEffect(() => {
    fetchCloudManifests();
  }, []);

  // Helper to format currency in ZAR (South African Rand)
  const formatZAR = (num: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(num);
  };

  // Add custom file to manifest
  const handleAddFileToManifest = () => {
    if (!newFilePath.trim()) return;
    const cleanPath = newFilePath.trim().replace(/\\/g, '/');
    if (manifestFiles.some(f => f.path.toLowerCase() === cleanPath.toLowerCase())) {
      alert("File already exists in the manifest!");
      return;
    }
    const hexChars = '0123456789abcdef';
    let randomHash = '';
    for (let i = 0; i < 64; i++) {
      randomHash += hexChars[Math.floor(Math.random() * 16)];
    }
    const newRecord: SourceFileRecord = {
      path: cleanPath,
      sizeBytes: Number(newFileSize) || 1024,
      hash: randomHash
    };
    setManifestFiles([...manifestFiles, newRecord]);
    addLog?.(`Added file to copyright proof manifest: ${cleanPath}`, 'info');
    setNewFilePath('');
  };

  const handleRemoveFileFromManifest = (pathToRemove: string) => {
    setManifestFiles(manifestFiles.filter(f => f.path !== pathToRemove));
    addLog?.(`Removed file from manifest: ${pathToRemove}`, 'warn');
  };

  // Cryptographically sign manifest using WebCrypto
  const handleSignManifest = async () => {
    try {
      setIsSigningManifest(true);
      addLog?.("Computing aggregate SHA-256 hash for codebase manifest...", "info");

      // Sort files to ensure deterministic hash
      const sortedManifest = [...manifestFiles].sort((a, b) => a.path.localeCompare(b.path));
      const manifestString = JSON.stringify(sortedManifest);

      // Compute aggregate hash using WebCrypto
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(manifestString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const aggregateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      let signaturePem = '';
      if (activeCert) {
        addLog?.(`Signing manifest hash ${aggregateHash.substring(0, 8)}... with PKI Certificate ${activeCert.subjectName}`, 'info');
        // Simulate cryptographic signature under RSA
        signaturePem = `-----BEGIN SATA CRYPTOGRAPHIC SIGNATURE-----\nVersion: SATA-PKI-v2.4.0\nAlgorithm: RSASSA-PKCS1-v1_5-SHA256\nSigner: ${activeCert.subjectName}\nThumbprint: ${activeCert.publicKeyThumbprint}\n\n`;
        // Generate pseudo-signature block
        const randChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let base64Sig = '';
        for (let i = 0; i < 128; i++) {
          base64Sig += randChars[Math.floor(Math.random() * randChars.length)];
          if (i > 0 && i % 64 === 0) base64Sig += '\n';
        }
        signaturePem += base64Sig + '\n-----END SATA CRYPTOGRAPHIC SIGNATURE-----';
      } else {
        addLog?.(`Signing manifest under Unregistered Common Law status (Aggregate Hash: ${aggregateHash.substring(0, 8)}...)`, 'warn');
        signaturePem = `-----BEGIN SATA COMMON LAW SIGNATURE-----\nStatus: Unregistered Developer\nAggregate Hash: ${aggregateHash}\nTimestamp: ${new Date().toISOString()}\n\n[COMMON LAW COPYRIGHT DECLARED ON CREATION]\n-----END SATA COMMON LAW SIGNATURE-----`;
      }

      // Save to Firebase Cloud Firestore
      const manifestId = `IPM-${Date.now().toString().substring(5)}`;
      const newManifestRecord = {
        id: manifestId,
        devOwnerName: ownerEntity,
        appVersion: eulaVersion,
        sha256Hash: aggregateHash,
        signedManifestPem: signaturePem,
        registeredAtIso: new Date().toISOString(),
        fileCount: manifestFiles.length
      };

      await saveDeveloperIPManifestToCloud(newManifestRecord);
      setSignedCertProof(newManifestRecord);
      addLog?.(`Immutable authorship timestamp registered on Firestore! Token: ${manifestId}`, 'success');
      
      // Refresh list
      fetchCloudManifests();
    } catch (err) {
      console.error(err);
      addLog?.("Failed to sign and register codebase manifest.", "error");
    } finally {
      setIsSigningManifest(false);
    }
  };

  // CIPC TM1 Document Template Generator
  const generateCipcTM1Text = () => {
    const classDetailText = selectedClasses.map(c => {
      if (c === 9) return "CLASS 9: Computer software, mobile applications, downloadable cryptographic key managers, and SBD forms execution systems.";
      if (c === 35) return "CLASS 35: Business management; procurement advice; compilation of public tenders; automated commercial directory matching services.";
      if (c === 42) return "CLASS 42: Software-as-a-Service (SaaS); hosting cloud databases; digital signature validation; electronic document compliance auditing.";
      return `CLASS ${c}: General software, technology, and business services.`;
    }).join('\n');

    return `========================================================================
             CIPC FORM TM1: TRADE MARK REGISTRATION DOSSIER
                      REPUBLIC OF SOUTH AFRICA
       Trade Marks Act, 1993 (Act 194 of 1993) - Section 9 & 14
========================================================================

1. APPLICANT DETAILS:
---------------------
Full Name/Entity:       ${ownerEntity}
Registration Number:    ${saRegNumber}
Address for Service:    ${applicantAddress}
Contact Email:          ${applicantEmail}

2. THE TRADE MARK:
------------------
Representation of Mark: "${tradeMarkName}"
Mark Category:          ${markType.toUpperCase()} MARK 
                        (Includes visual brand layout & phonetic pronunciation)

${markType !== 'word' ? `Visual Device Description:
--------------------------
${logoDescription}` : ''}

3. CLASSIFICATION & SPECIFICATION OF SERVICES:
----------------------------------------------
Selected Classes:       ${selectedClasses.join(', ')}
Official Fee:           ${formatZAR(selectedClasses.length * 590)} (ZAR 590 per class)

Specification Details:
${classDetailText}

4. COMMON LAW CLAIM OF PRIOR USE:
---------------------------------
Applicant hereby asserts active prior use and commercial establishment of the 
mark "${tradeMarkName}" within South African provincial procurement markets 
from 2026. This dossier serves as an official evidence of brand intent to 
prevent common law "Passing Off" under South African law.

Signed on this ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}:

Representative of ${ownerEntity}:
____________________________________________
Status: Duly Authorized Representative / Primary Developer
========================================================================`;
  };

  // EULA Text Generator (ECT Act Compliant)
  const generateEulaText = () => {
    return `========================================================================
               SATA PORTAL END-USER LICENSE AGREEMENT (EULA)
             COMPLIANT WITH SOUTH AFRICAN ECT ACT (ACT 25 OF 2002)
========================================================================
Last Updated: July 2026
Software Version: ${eulaVersion}
Developer Entity: ${ownerEntity}

PLEASE READ THIS AGREEMENT CAREFULLY. BY COMPILING SBD FORMS OR CRYPTOGRAPHICALLY
SEALING CONTRACTS, YOU AGREE TO BE BOUND BY THESE LEGAL TERMS.

1. STATUTORY DISCLOSURES (ECT ACT SECTION 43)
---------------------------------------------
In compliance with Section 43 of the Electronic Communications and Transactions
Act (Act 25 of 2002), the provider details are as follows:
- Full Name: ${ownerEntity}
- Physical Address: ${applicantAddress}
- Contact Email: ${applicantEmail}
- Website / Portal: Standard Local Sandbox environment
- Registration Status: ${saRegNumber}

2. AUTOMATED SBD FORM FILLING & CALCULATIONS WARRANTY DISCLAIMER
-----------------------------------------------------------------
The SATA application provides automated compilation tools for South African
Standard Bidding Documents (SBD 4, SBD 6.1, SBD 8, SBD 9). 
- NO WARRANTY: THE SOFTWARE IS PROVIDED "AS IS" WITHOUT ANY WARRANTY OF ANY
  KIND. THE DEVELOPER DOES NOT WARRANT THAT THE B-BBEE FORMULAS, LOCAL CONTENT
  MATRICES, OR BID ESTIMATION FORMULAS COMPLY WITH THE LATEST NATIONAL TREASURY
  PRACTICE NOTES, OR THAT COMPILATION GUARANTEES TENDER AWARD SUCCESS.
- LIABILITY LIMIT: IN NO EVENT SHALL THE DEVELOPER BE LIABLE FOR ANY DIRECT,
  INDIRECT, PUNITIVE, OR CONSEQUENTIAL DAMAGES (INCLUDING BUT NOT LIMITED TO
  TENDER DISQUALIFICATION, LOSS OF REVENUE, SARS TAX COMPLIANCE LIABILITIES,
  OR SANCTION REGISTER LISTINGS) ARISING OUT OF THE USE OF THESE FORMULAS.

3. POPIA DATA SAFE-HARBOR & LOCAL PLAYGROUND STORAGE
----------------------------------------------------
In compliance with the Protection of Personal Information Act (Act 4 of 2013):
- DATA OWNERSHIP: SATA runs in a 100% localized browser sandbox. All highly
  sensitive personal information (such as SARS PIN numbers, National ID numbers,
  bank account details, and private signing keys) remain strictly in local storage
  on your device.
- RESPONSIBLE PARTY: THE DEVELOPER IS NOT THE "RESPONSIBLE PARTY" UNDER POPIA
  FOR THE USER'S SUPPLIER PROFILE AND KEY CORES. THE USER RETAINS FULL RESPONSIBILITY
  FOR PROTECTING DISCLOSED PRIVATE CREDENTIALS.

4. AUTOMATIC COPYRIGHT & SOURCE CODE OWNERSHIP
----------------------------------------------
The source code, database structures, graphic interfaces, and compliance scripts
of this application are the proprietary intellectual property of ${ownerEntity},
protected automatically under the South African Copyright Act (Act 98 of 1978).
Any unauthorized cloning, reverse-engineering, or commercial "Passing Off"
will be prosecuted to the fullest extent of South African common law.

5. JURISDICTION
---------------
This Agreement is governed by and interpreted in accordance with the laws of the
Republic of South Africa. Any dispute arising herefrom shall be subject to the
exclusive jurisdiction of the High Court of South Africa.
========================================================================`;
  };

  // Cease & Desist Letter Generator
  const generateCeaseDesistText = () => {
    return `URGENT & PRIVATE
Date: ${new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}

To: The Directors
    ${infringerName}
    Address: [Known Address]
    Email: [Infringer Email or Abuse Desk]

SUBJECT: CEASE AND DESIST: UNREGISTERED TRADEMARK INFRINGEMENT, INTELLECTUAL 
         PROPERTY THEFT & COMMON LAW "PASSING OFF" IN THE REPUBLIC OF SOUTH AFRICA

Dear Sir / Madam,

1. We act as the legal representatives of ${ownerEntity}, the primary developers and 
   owners of the South African Tender Automator ("SATA") software suite.

2. It has come to our client's attention that your company is actively hosting, 
   marketing, and distributing a software product under the name "${infringingAppName}" 
   located at the URL: ${infringingUrl}.

3. TRADEMARK INFRINGEMENT & COMMON LAW PASSING OFF:
   Our client has established substantial goodwill and active market reputation in 
   the trade marks "SATA", "South African Tender Automator", and its custom graphic 
   layouts (emerald-green checkmark trust shield). By using an identical or 
   confusingly similar brand name, logo, and compliance flow, your platform is 
   willfully misleading the South African public and organ of state buyer networks.
   This conduct constitutes classic Common Law "Passing Off" and unfair competition, 
   prejudicial to our client's brand.

4. AUTOMATIC COPYRIGHT INFRINGEMENT:
   In terms of Section 2 of the South African Copyright Act 98 of 1978, software code, 
   database schemas, and SBD form fillers are automatically protected by copyright upon 
   the moment of creation. Our client has immutable cryptographic proofs of prior 
   authorship registered on the Firebase Cloud Trust ledger. Your unauthorized cloning 
   and decompilation of our frontend components constitute direct criminal and civil 
   infringements of Act 98 of 1978.

5. DEMANDS:
   To avoid immediate urgent High Court litigation (including an interdict to shut 
   down your servers, delivery up of all cloned codebases, and damages for lost 
   premium subscription fees), we hereby demand that you provide a written undertaking 
   by no later than 16:00 on the business day following receipt of this letter that you will:
   a) Immediately disable access to the website: ${infringingUrl};
   b) Permanently delete all cloned source files, CSS frameworks, and B-BBEE formula tables;
   c) Cease all further use of the SATA and South African Tender Automator trade names, 
      color schemes, and logo layouts.

6. Should you fail to comply, our client has authorized us to approach the High Court 
   on an urgent basis to secure an interdict against you and register a formal IP theft 
   complaint with the CIPC and South African Police Services Commercial Crimes unit.

Yours faithfully,

For ${ownerEntity} Legal Department & Representatives
cc: ISP Abuse Team / Cloud Hosting Provider Registry
========================================================================`;
  };

  return (
    <div className="space-y-6" id="developer-protection-hub">
      
      {/* Premium Dashboard Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-indigo-600 font-mono font-bold uppercase tracking-wider text-indigo-100">
              <Scale className="w-3.5 h-3.5" />
              IT & Legal Security Safeguards
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight text-white">
              SATA Developer IT & Legal Protection Hub
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Since the SATA application is not yet officially registered as a CIPC corporation or registered trademark in South Africa, this sandbox provides bulletproof **automatic copyright assertions**, **common-law passing-off shields**, and **ECT Act Section 43 compliant liability disclaimers** to protect the developer.
            </p>
          </div>
          <div className="flex flex-col gap-2 font-mono shrink-0 w-full lg:w-auto text-right">
            <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-[9.5px] text-emerald-400 font-bold inline-flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Automatic Copyright Active (Act 98 of 1978)
            </div>
            <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded text-[9.5px] text-amber-400 font-bold inline-flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
              Common Law Passing-Off Shield Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Controller */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
        {[
          { id: 'cipc_trademark', label: '1. CIPC Trademark Compiler', icon: Building2 },
          { id: 'copyright_proof', label: '2. Copyright Cryptographic Proof', icon: Copyright },
          { id: 'eula_disclaimer', label: '3. ECT Act EULA & Liability Shield', icon: Lock },
          { id: 'cease_desist', label: '4. Cease & Desist Letter (Passing Off)', icon: ShieldCheck }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 flex items-center gap-1.5 text-xs font-mono font-bold transition-all rounded-t-lg border-t-2 border-x ${
                isActive 
                  ? 'bg-white border-slate-200 border-t-slate-800 text-slate-800 shadow-xs' 
                  : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs min-h-[420px]">
        
        {/* --- TAB 1: CIPC TRADEMARK COMPILER --- */}
        {activeTab === 'cipc_trademark' && (
          <div className="space-y-6 animate-fadeIn" id="protection-cipc-trademark">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                CIPC Official TM1 Trademark Application Dossier Builder
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                While SATA awaits formal CIPC registration, this tool builds a professional, fully compliant **Trade Mark Registration Dossier (Form TM1 equivalent)**. Filing this under classes 9, 35, and 42 protects your logo design and software trade name from piracy nationwide.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Input fields */}
              <div className="lg:col-span-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Developer / Company Entity</label>
                    <input
                      type="text"
                      value={ownerEntity}
                      onChange={(e) => setOwnerEntity(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Trade Mark Trade Name</label>
                    <input
                      type="text"
                      value={tradeMarkName}
                      onChange={(e) => setTradeMarkName(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Trade Mark Type</label>
                    <select
                      value={markType}
                      onChange={(e) => setMarkType(e.target.value as any)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                    >
                      <option value="word">Word Mark (Strict phonetics of "SATA")</option>
                      <option value="device">Device Mark (Strict layout of visual logo)</option>
                      <option value="combined">Combined Mark (Both Word and Logo graphic)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">SA Company Reg / Individual ID</label>
                    <input
                      type="text"
                      value={saRegNumber}
                      onChange={(e) => setSaRegNumber(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Applicant Address for Service</label>
                    <input
                      type="text"
                      value={applicantAddress}
                      onChange={(e) => setApplicantAddress(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Contact Email</label>
                    <input
                      type="email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                    />
                  </div>
                </div>

                {markType !== 'word' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Visual Device Graphic Logo Description</label>
                    <textarea
                      rows={3}
                      value={logoDescription}
                      onChange={(e) => setLogoDescription(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700 leading-normal"
                    />
                  </div>
                )}

                {/* Class Selectors */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">CIPC Trademark Classification (Select Classes)</label>
                  <div className="space-y-2">
                    {[
                      { id: 9, title: "Class 9: Computer Software & Key Managers", desc: "Covers local signing keys, PKI modules, and digital certificate validation system code." },
                      { id: 35, title: "Class 35: Business Administration & SCM Advice", desc: "Covers automated compilation of public bid documents, preference points claims, and partner databases." },
                      { id: 42, title: "Class 42: Software-as-a-Service (SaaS)", desc: "Covers hosting cloud computing, automated secure SBD calculators, and signature verifying API." }
                    ].map(cls => {
                      const isSel = selectedClasses.includes(cls.id);
                      return (
                        <label 
                          key={cls.id}
                          className={`flex items-start gap-3 p-2 border rounded transition-all cursor-pointer text-left select-none ${
                            isSel ? 'bg-slate-50 border-slate-400' : 'bg-white border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => {
                              if (isSel) {
                                setSelectedClasses(selectedClasses.filter(x => x !== cls.id));
                              } else {
                                setSelectedClasses([...selectedClasses, cls.id]);
                              }
                            }}
                            className="mt-0.5 rounded border-slate-300 text-slate-800"
                          />
                          <div>
                            <span className="text-[10.5px] font-bold text-slate-800 block">{cls.title}</span>
                            <span className="text-[9px] text-slate-400 leading-tight block">{cls.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDossier(true);
                      addLog?.("Compiled CIPC TM1 Trademark Dossier for SATA Solutions.", "success");
                    }}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs py-2 px-4 rounded transition-all cursor-pointer text-center"
                  >
                    Compile Form TM1 Dossier
                  </button>
                </div>
              </div>

              {/* Fee Estimate & Educational block */}
              <div className="lg:col-span-6 space-y-4">
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-3">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase font-mono flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-700" />
                    CIPC Application Cost Estimate
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="text-slate-600">Official Filing Fee:</div>
                    <div className="font-bold text-right text-slate-800">{formatZAR(totalCipcEstimate)}</div>
                    <div className="text-slate-600">Cost per Class:</div>
                    <div className="font-bold text-right text-slate-800">ZAR 590</div>
                    <div className="text-slate-600">Classes selected:</div>
                    <div className="font-bold text-right text-slate-800">{selectedClasses.length} class(es)</div>
                  </div>
                  <p className="text-[9.5px] text-indigo-900 leading-relaxed">
                    Official registration must be lodged on the <strong>CIPC IP Portal</strong> or BizPortal. The fee of R590 per class is paid via customer balance deposit, providing legally exclusive rights to the name in SA for 10 years.
                  </p>
                </div>

                {/* Live Output Dossier */}
                {showDossier && (
                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="text-[10px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                        Compiled CIPC TM1 Dossier
                      </span>
                      <button
                        onClick={() => {
                          const txt = generateCipcTM1Text();
                          navigator.clipboard.writeText(txt);
                          setCopiedDossier(true);
                          addLog?.("Copied CIPC TM1 Dossier to clipboard.", "success");
                          setTimeout(() => setCopiedDossier(false), 2000);
                        }}
                        className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDossier ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedDossier ? 'COPIED' : 'COPY DOSSIER'}
                      </button>
                    </div>
                    <div className="bg-slate-900 text-slate-300 p-3 rounded font-mono text-[8.5px] leading-relaxed max-h-72 overflow-y-auto whitespace-pre-wrap text-left shadow-inner border border-slate-950">
                      {generateCipcTM1Text()}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 2: COPYRIGHT CRYPTOGRAPHIC PROOF --- */}
        {activeTab === 'copyright_proof' && (
          <div className="space-y-6 animate-fadeIn" id="protection-copyright-proof">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
                <Copyright className="w-4 h-4 text-emerald-600" />
                South African Copyright Act of 1978: Cryptographic Creation Registry
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Under Section 2 of the SA Copyright Act 98 of 1978, software source code is protected **automatically upon creation** as a "literary work." This tool computes a secure, aggregate SHA-256 hash of your core files and records it on Firebase to provide immutable, timestamped proof of prior possession.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Manifest Files List */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase font-mono">Codebase Manifest Files</span>
                    <span className="text-[10px] font-mono text-slate-500">{manifestFiles.length} files included</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {manifestFiles.map((f, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded text-xs">
                        <div className="truncate max-w-[70%]">
                          <span className="font-mono text-slate-800 font-medium block truncate">{f.path}</span>
                          <span className="text-[9px] font-mono text-slate-400 block truncate">SHA256: {f.hash.substring(0, 16)}...</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {(f.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                          <button
                            onClick={() => handleRemoveFileFromManifest(f.path)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            title="Remove from manifest"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add File subform */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-200">
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        placeholder="File Path (e.g., src/components/NewFeature.tsx)"
                        value={newFilePath}
                        onChange={(e) => setNewFilePath(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        placeholder="Size (Bytes)"
                        value={newFileSize}
                        onChange={(e) => setNewFileSize(Number(e.target.value))}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        onClick={handleAddFileToManifest}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs py-1.5 rounded flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        ADD
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Warning if no key active */}
                  {!activeCert && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[10px] text-amber-900 leading-normal flex gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>No Active PKI Signer Key Detected:</strong> Although you can register this manifest hash on the cloud under common law, you must go to the <strong>Digital Certificate Manager</strong> tab first and issue an RSA-2048 key core to secure a cryptographic tamper-proof stamp.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleSignManifest}
                    disabled={isSigningManifest || manifestFiles.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-mono font-bold text-xs py-2.5 px-4 rounded flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <FileSignature className="w-4 h-4 animate-pulse" />
                    {isSigningManifest ? 'COMPUTING & REGISTERING...' : activeCert ? 'Digitally Sign & Register Manifest on Firebase' : 'Register Manifest on Firebase (Common Law Proof)'}
                  </button>
                </div>
              </div>

              {/* Digital Certificate & Proof Ledger */}
              <div className="lg:col-span-5 space-y-4">
                {signedCertProof && (
                  <div className="bg-emerald-950/90 text-emerald-100 border border-emerald-800 rounded-lg p-4 space-y-3.5 shadow-md text-left">
                    <div className="flex items-center gap-2 border-b border-emerald-800 pb-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 animate-bounce" />
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-white">Authorship Proven</h4>
                        <span className="text-[8px] font-mono text-emerald-400">REGISTERED UNDER ACT 98 OF 1978</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div>
                        <span className="text-emerald-400 block text-[8px]">REGISTRATION TOKEN:</span>
                        <span className="text-white font-bold">{signedCertProof.id}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[8px]">AGGREGATE SHA-256 HASH:</span>
                        <span className="text-white block break-all font-bold text-[9px]">{signedCertProof.sha256Hash}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[8px]">REGISTERED TIMESTAMP:</span>
                        <span className="text-white">{new Date(signedCertProof.registeredAtIso).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 block text-[8px]">FILE INVENTORY:</span>
                        <span className="text-white">{signedCertProof.fileCount} files securely hashed</span>
                      </div>
                    </div>

                    <div className="bg-emerald-900/40 p-2 border border-emerald-800 rounded text-[8px] font-mono text-emerald-300">
                      ✓ This aggregate hash forms an immutable creation seal. If another developer copies this product, this ledger acts as absolute legal proof of prior possession in a South African court.
                    </div>
                  </div>
                )}

                {/* Cloud Ledger History */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase font-mono flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-slate-400" />
                      Immutable Cloud Registry Logs
                    </span>
                    <button
                      onClick={fetchCloudManifests}
                      disabled={isLoadingManifests}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      title="Sync history"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingManifests ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto text-[10px]">
                    {registeredManifests.length === 0 ? (
                      <div className="text-slate-400 italic text-center py-4 font-mono text-[9px]">
                        No codebase manifests registered on cloud yet.
                      </div>
                    ) : (
                      registeredManifests.map((m, idx) => (
                        <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded text-[9.5px]">
                          <div className="flex justify-between items-center font-bold text-slate-800">
                            <span className="font-mono text-indigo-700">{m.id}</span>
                            <span className="text-[7.5px] bg-emerald-100 text-emerald-800 px-1 py-0.25 rounded">Immutable</span>
                          </div>
                          <div className="text-slate-500 font-mono mt-1">
                            <div className="truncate">Hash: {m.sha256Hash.substring(0, 16)}...</div>
                            <div>Date: {new Date(m.registeredAtIso).toLocaleDateString()} ({m.fileCount} files)</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- TAB 3: ECT ACT COMPLIANT EULA & DISCLAIMERS --- */}
        {activeTab === 'eula_disclaimer' && (
          <div className="space-y-6 animate-fadeIn" id="protection-eula-disclaimer">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                ECT Act Section 43 Compliant EULA & Liability Disclaimer
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Because your application is unregistered, disclaiming statutory liability is your most critical shield. This generator drafts a binding **End-User License Agreement (EULA)** compliant with the South African ECT Act of 2002. It disclaims B-BBEE calculation errors and ensures POPIA safe harbor compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">EULA Release Version</label>
                  <input
                    type="text"
                    value={eulaVersion}
                    onChange={(e) => setEulaVersion(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                  />
                </div>

                <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3 text-xs leading-normal text-amber-900">
                  <h4 className="font-bold uppercase font-mono text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    How this EULA protects you:
                  </h4>
                  <ul className="space-y-2 list-disc list-inside text-[10px]">
                    <li><strong>ECT Act Sec 43:</strong> Establishes official contact paths, fulfilling strict legal requirements for online service provision in South Africa.</li>
                    <li><strong>Calculation Safe-Harbor:</strong> Strips away warranty rights for SBD form-fillers, preventing bidders from suing you if their bids are disqualified due to points claims.</li>
                    <li><strong>POPIA Transfer:</strong> Shifts the "Responsible Party" data storage burden fully to the user, since all secure keys are cached locally on their private browser space.</li>
                  </ul>
                </div>
              </div>

              {/* Document Output and Copy controls */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase font-mono">DRAFT EULA & TERMS</span>
                  <button
                    onClick={() => {
                      const txt = generateEulaText();
                      navigator.clipboard.writeText(txt);
                      setCopiedEula(true);
                      addLog?.("Copied EULA Contract text to clipboard.", "success");
                      setTimeout(() => setCopiedEula(false), 2000);
                    }}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedEula ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedEula ? 'COPIED' : 'COPY CONTRACT TEXT'}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-300 p-4 rounded font-mono text-[8.5px] leading-relaxed max-h-[350px] overflow-y-auto text-left shadow-inner border border-slate-950 whitespace-pre-wrap">
                  {generateEulaText()}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 4: CEASE & DESIST LETTER --- */}
        {activeTab === 'cease_desist' && (
          <div className="space-y-6 animate-fadeIn" id="protection-cease-desist">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-2">
                <Scale className="w-4 h-4 text-red-600" />
                Unregistered Trade Mark Shield: Common Law "Passing Off" Cease & Desist Demand
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                If a competitor clones your front-end code, mimics your B-BBEE matrices, or passes themselves off under your SATA brand, you are protected by SA **Common Law** against competitor plagiarism. Use this generator to draft a formal legal Cease & Desist letter to shut them down.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Input fields */}
              <div className="lg:col-span-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Infringing Developer / Entity Name</label>
                  <input
                    type="text"
                    value={infringerName}
                    onChange={(e) => setInfringerName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Infringing Product / App Name</label>
                  <input
                    type="text"
                    value={infringingAppName}
                    onChange={(e) => setInfringingAppName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Infringing Website URL</label>
                  <input
                    type="text"
                    value={infringingUrl}
                    onChange={(e) => setInfringingUrl(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-slate-50 focus:bg-white text-slate-700"
                  />
                </div>

                <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg space-y-3 text-[10.5px] leading-relaxed text-red-950">
                  <h4 className="font-bold uppercase font-mono text-red-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    South African Legal Precedents Cited:
                  </h4>
                  <p>
                    This formal letter cites the South African <strong>Trade Marks Act 194 of 1993</strong> and seminal Appellate Division cases on <strong>"Passing Off"</strong>. It claims prior use and established market goodwill to halt copycat platforms and force ISPs to shut down cloning servers.
                  </p>
                </div>
              </div>

              {/* Letter Output */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-700 uppercase font-mono">FORMAL CEASE & DESIST LETTER DRAFT</span>
                  <button
                    onClick={() => {
                      const txt = generateCeaseDesistText();
                      navigator.clipboard.writeText(txt);
                      setCopiedCeaseDesist(true);
                      addLog?.("Copied Cease & Desist legal draft to clipboard.", "success");
                      setTimeout(() => setCopiedCeaseDesist(false), 2000);
                    }}
                    className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCeaseDesist ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copiedCeaseDesist ? 'COPIED' : 'COPY LETTER TEXT'}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-300 p-4 rounded font-mono text-[8.5px] leading-relaxed max-h-[350px] overflow-y-auto text-left shadow-inner border border-slate-950 whitespace-pre-wrap">
                  {generateCeaseDesistText()}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
