/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Download, 
  FileCheck, 
  ListTodo, 
  Fingerprint, 
  ArrowRight, 
  Search, 
  Info,
  Scale,
  Brain,
  Cpu,
  Lock,
  Compass,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { DigitalCertificate } from '../types';

interface DirectoryHubProps {
  activeCert: DigitalCertificate | null;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  onNavigateToTab: (tabId: string) => void;
}

export default function DirectoryHub({ activeCert, addLog, onNavigateToTab }: DirectoryHubProps) {
  const [isDownloadingPack, setIsDownloadingPack] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // SBD Pack elements
  const packContents = [
    { name: 'SBD 1: Invitation to Bid (Prefilled)', status: 'COMPLETED & COMPILED' },
    { name: 'SBD 4: Declaration of Interest (Prefilled)', status: 'COMPLETED & COMPILED' },
    { name: 'SBD 5: National Industrial Participation Program', status: 'NOT_APPLICABLE_UNDER_R10M' },
    { name: 'SBD 6.1: Preference Points Claim Form', status: 'COMPLETED & COMPILED' },
    { name: 'SBD 6.2: Local Content Declaration (Schedules C, D, E)', status: 'COMPLETED & COMPILED' },
    { name: 'SBD 8: Declaration of Past SCM Practices', status: 'COMPLETED & COMPILED' },
    { name: 'SBD 9: Certificate of Independent Bid Determination', status: 'COMPLETED & COMPILED' },
    { name: 'RSA-2048 Cryptographic PKI Signature Seal (ECT Act 2002)', status: 'SIGNED & SEALED' },
    { name: 'SATA Pre-Submission Compliance Audit Attestation PDF', status: 'COMPILED' },
    { name: 'National Treasury eTenders Delivery Checklist', status: 'COMPILED' }
  ];

  // Feature directory items
  const directoryCategories = [
    {
      title: '💼 Bidder Onboarding & Credentials',
      color: 'border-emerald-200 bg-emerald-50/30',
      items: [
        { id: 'cert', label: 'cert_keys.json', desc: 'Create and manage your RSA-2048 PKI signing certificate.', targetName: 'Digital Certificate Manager' },
        { id: 'supplier', label: 'supplier_dashboard.app', desc: 'SCM Supplier profile, municipal utility bill uploader, and CSD links.', targetName: 'SCM Supplier Dashboard' },
        { id: 'payment', label: 'payment_gateway.api', desc: 'SATA Subscription and credit management console.', targetName: 'SATA Payment Gateway' },
        { id: 'partners', label: 'sata_partner_hub.pkg', desc: 'Partner Registration & Subscription Portal for local SCM agencies.', targetName: 'SATA Partner Hub' }
      ]
    },
    {
      title: '🔍 Tender Intelligence & Costing',
      color: 'border-blue-200 bg-blue-50/30',
      items: [
        { id: 'tenders', label: 'provincial_tenders.db', desc: 'Browse and query live tenders from South African Provincial Treasuries.', targetName: 'Provincial Tender Feed' },
        { id: 'advisor', label: 'tender_advisor.calc', desc: 'AI-assisted tender fee analysis and pricing advisor.', targetName: 'Tender Financial Advisor' },
        { id: 'calculator', label: 'tender_pricing_calc.xls', desc: 'Costing, VAT, and gross profit margin simulator.', targetName: 'Tender Profit Calculator' },
        { id: 'analytics', label: 'tender_analytics.json', desc: 'Historical award analytics, win-rates, and pricing trends.', targetName: 'Tender Analytics Dashboard' }
      ]
    },
    {
      title: '📝 SBD Compilation & Signing',
      color: 'border-indigo-200 bg-indigo-50/30',
      items: [
        { id: 'filler', label: 'SBD_4_Disclosure.pdf', desc: 'Step-by-step Standard Bidding Document (SBD 4 & SBD 6.1) filler.', targetName: 'SBD Form Filler' },
        { id: 'signer', label: 'Custom_Contract_Sign.pdf', desc: 'Asymmetric cryptographic PDF signer for any custom agreement.', targetName: 'Custom PDF Asymmetric Signer' },
        { id: 'verifier', label: 'Verify_Integrity_Seal.sig', desc: 'Verify ECT Act signature seals on any signed tender package.', targetName: 'Cryptographic Signature Verifier' },
        { id: 'history', label: 'registry_history.log', desc: 'View local asymmetric signing archives, hash receipts, and transaction records.', targetName: 'Document Signing Registry' }
      ]
    },
    {
      title: '🛡️ Audit, Compliance & Agents',
      color: 'border-red-200 bg-red-50/30',
      items: [
        { id: 'audit', label: 'compliance_audit.sh', desc: 'SCM Pre-submission validator, scoring optimizer, and security scan.', targetName: 'SBD Compliance Audit' },
        { id: 'agents', label: 'agents_console.sys', desc: 'Autonomous monitoring agents validating workspace security.', targetName: 'SCM Autonomous Agents' },
        { id: 'shield', label: 'regulatory_shield.sys', desc: 'Simulate MITM cyber intercepts and self-heal network channels.', targetName: 'Regulatory Shield' },
        { id: 'snapshots', label: 'system_snapshots.db', desc: 'WORM-based local compliance state backups (Time Machine).', targetName: 'System Snapshots Registry' }
      ]
    },
    {
      title: '🌟 Premium Services & Lab',
      color: 'border-amber-200 bg-amber-50/30',
      items: [
        { id: 'premium_hub', label: 'premium_services.sys', desc: 'Cross-border JV matchmaking, live scrapers, and local content models.', targetName: 'Premium Services Hub' },
        { id: 'creditworthiness', label: 'creditworthiness.sys', desc: 'Assess commercial risk rating, liquidity ratios, and tax status.', targetName: 'Creditworthiness Assessor' },
        { id: 'dev_protection', label: 'dev_protection.sys', desc: 'Secure diagnostics masking, and legal developer defense desk.', targetName: 'Developer Protection Hub' },
        { id: 'buying', label: 'buying_public.gov', desc: 'SCM Buyer Audit portal for state organs to verify signatures.', targetName: 'SCM Buying Public & Audit Portal' },
        { id: 'lab', label: 'pwa_enterprise_lab.sys', desc: 'Test offline worker states, background alert streams, and PWA speed diagnostics.', targetName: 'Enterprise Offline & Diagnostics Lab' }
      ]
    }
  ];

  // One-click tender pack download logic
  const handleDownloadTenderPack = () => {
    setIsDownloadingPack(true);
    addLog?.('One-Click Tender Pack: Bundling standard bidding forms, PKI certificates, audit receipts, and submission checklists...', 'info');

    setTimeout(() => {
      try {
        const activeOrg = activeCert ? activeCert.organization : 'Nkosi Software Solutions Pty Ltd';
        const activeSigner = activeCert ? activeCert.subjectName : 'Thabo Nkosi';
        const activeThumbprint = activeCert ? activeCert.publicKeyThumbprint : 'SATA_RSA2048_DEMO_THUMBPRINT';

        // Compile metadata bundle
        const tenderPackBundle = {
          compilationVersion: 'v2.4.0-Stable',
          compiledAtIso: new Date().toISOString(),
          complianceMandate: 'South African National Treasury eTenders Framework & ECT Act 2002 Section 13 Compliant',
          contractDetails: {
            referenceNumber: 'GT/GDOH/PPE-092/2026',
            description: 'Gauteng Dept of Health - Emergency PPE Supplies & Logistics Contract',
            estimatedValue: 'R 2,300,000.00',
            procuringInstitution: 'Gauteng Department of Health'
          },
          bidderCredentials: {
            legalEntity: activeOrg,
            signatoryName: activeSigner,
            saIdNumber: activeCert?.saIdNumber || '8507205123084',
            pkiThumbprint: activeThumbprint,
            legalStatus: 'ECT_ACT_COMPLIANT_AES_SEALED'
          },
          auditAttestation: {
            auditScore: '96%',
            auditStatus: 'PASSED_SCM_COMPLIANT',
            auditedBy: 'SATA Automated pre-submission compliance audit engine',
            verificationUrl: 'http://localhost:3000/buying_public.gov'
          },
          documentsManifest: packContents
        };

        const blob = new Blob([JSON.stringify(tenderPackBundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SATA_Complete_SBD_Tender_Pack_GT-GDOH-PPE-092.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        addLog?.('One-Click Tender Pack: Success! Bundled file downloaded (JSON/SBD package manifest).', 'success');
        addLog?.('Ready for immediate upload to eTenders.gov.za portal.', 'success');
      } catch (err: any) {
        addLog?.(`Tender Pack compilation failed: ${err.message}`, 'error');
      } finally {
        setIsDownloadingPack(false);
      }
    }, 1500);
  };

  // Filter features by query
  const filteredCategories = directoryCategories.map(cat => {
    const matchingItems = cat.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.targetName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...cat, items: matchingItems };
  }).filter(cat => cat.items.length > 0);

  return (
    <div className="space-y-8 text-left animate-fadeIn" id="directory-hub-section">
      
      {/* LANDING PAGE HERO HEADER */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="relative space-y-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-emerald-950/85 border border-emerald-800 text-emerald-400 text-[10px] font-bold font-mono px-3 py-1 rounded-full uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            100% Local Procurement Automation Gateway
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-display text-white">
            Win Government Tenders. <span className="text-emerald-400">Without The Headaches.</span>
          </h1>
          
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans font-medium max-w-3xl">
            Automated SBD checks, PKI signing, and 80/20 scoring. 100% Local. POPIA Compliant. 
            Eliminate compliance errors, secure legal asymmetric electronic seals, and claim priority preference points instantly.
          </p>

          <div className="pt-4 flex flex-wrap gap-3">
            <button 
              onClick={() => onNavigateToTab('filler')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs py-2.5 px-5 rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              Start SBD Form Filler
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onNavigateToTab('tenders')}
              className="bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 font-mono text-xs py-2.5 px-5 rounded-lg transition-all cursor-pointer"
            >
              Browse Live Feed
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ONE-CLICK TENDER PACK MODULE */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black font-mono text-emerald-600 uppercase tracking-widest block">Hero Feature</span>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-slate-800" />
                  One-Click Tender Pack
                </h2>
              </div>
              <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-800 font-bold font-mono py-1 px-2.5 rounded-full uppercase shrink-0">
                Worth R999/mo
              </span>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Why hunt down 14 separate South African SBD forms? Our automated system bundles all statutory bidding disclosures, B-BBEE preferences, local content declarations, active PKI signatures, and pre-submission audit reports into a single, cohesive tender package file.
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2">
              <span className="text-[9px] font-black text-slate-400 font-mono uppercase block tracking-wider">What’s Included in Your Pack</span>
              <div className="divide-y divide-slate-200/60 font-mono text-[9.5px]">
                {packContents.slice(0, 6).map((doc, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between items-center text-slate-600">
                    <span className="truncate max-w-[200px]">{doc.name}</span>
                    <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 rounded">{doc.status}</span>
                  </div>
                ))}
                <div className="py-1.5 flex justify-between items-center text-slate-400 italic text-[9px]">
                  <span>+ 4 more SBD forms & Audit PDF...</span>
                  <span>READY</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 pt-4">
            <button
              onClick={handleDownloadTenderPack}
              disabled={isDownloadingPack}
              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-mono font-bold text-xs py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-800"
            >
              {isDownloadingPack ? 'Compiling Complete SBD Pack...' : 'Download Complete SBD Pack'}
              <Download className={`w-4 h-4 ${isDownloadingPack ? 'animate-bounce' : ''}`} />
            </button>
            <span className="text-[10px] text-slate-400 font-mono block text-center">
              POPIA Certified secure package outputted directly to device.
            </span>
          </div>
        </div>

        {/* INTERACTIVE DIRECTORY HUB / MAP */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Compass className="w-5 h-5 text-slate-800" />
                  SATA Workspace Interactive Map
                </h2>
                <p className="text-xs text-slate-500">
                  Quickly find and navigate to any of the 20 SATA tools and compliance components.
                </p>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search tools, SBD filenames, functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-slate-50/50"
              />
            </div>
          </div>

          {/* Map Grid */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {filteredCategories.map((category, idx) => (
              <div key={idx} className={`p-4 border rounded-lg ${category.color} space-y-2.5`}>
                <h3 className="text-[11px] font-bold text-slate-800 font-mono uppercase tracking-wide">
                  {category.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                  {category.items.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        onNavigateToTab(item.id);
                        addLog?.(`Navigated to: ${item.targetName} via Interactive Map`, 'info');
                      }}
                      className="bg-white border border-slate-100 hover:border-slate-350 p-2.5 rounded-md hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between text-left group"
                    >
                      <div className="space-y-1">
                        <span className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block">
                          {item.label}
                        </span>
                        <p className="text-[10px] text-slate-500 leading-normal">
                          {item.desc}
                        </p>
                      </div>
                      <div className="text-[9px] font-mono font-black text-slate-400 group-hover:text-slate-800 pt-2 flex items-center justify-between border-t border-slate-100/60 mt-2">
                        <span>LAUNCH TOOL</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 text-slate-400 font-mono text-xs italic border border-dashed border-slate-200 rounded-lg">
                No matching tools or SBD filenames found in our workspace directory.
              </div>
            )}
          </div>

          <div className="bg-blue-50/50 border border-blue-150 p-3.5 rounded-lg flex gap-3 text-left">
            <Info className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <p className="text-[10.5px] text-slate-600 leading-normal">
              <strong>Demo Instruction:</strong> Click any tool in the list to navigate directly to it. Run your digital certificate generation on <strong>cert_keys.json</strong> and perform compliance audits on <strong>compliance_audit.sh</strong> to witness dynamic updates.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
