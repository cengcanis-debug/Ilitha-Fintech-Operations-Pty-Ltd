/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Server, 
  Coins, 
  Users, 
  Award, 
  ShieldCheck, 
  Activity, 
  Zap, 
  Cloud, 
  Database,
  Info,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  Cpu,
  Lock,
  FileCode,
  Check,
  Copy,
  Scale,
  Globe,
  Building2
} from 'lucide-react';

interface DeveloperAdvisorPanelProps {
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function DeveloperAdvisorPanel({ addLog }: DeveloperAdvisorPanelProps) {
  // Simulator State
  const [monthlyActiveSuppliers, setMonthlyActiveSuppliers] = useState<number>(150);
  const [pkiSigningSurcharge, setPkiSigningSurcharge] = useState<number>(150); // ZAR 150
  const [pkiSignPercentage, setPkiSignPercentage] = useState<number>(80); // 80% sign
  const [premiumSaaSPrice, setPremiumSaaSPrice] = useState<number>(850); // ZAR 850/mo
  const [premiumSaaSPenetration, setPremiumSaaSPenetration] = useState<number>(20); // 20% subscribe
  const [jvMatchmakingFee, setJvMatchmakingFee] = useState<number>(2500); // ZAR 2500
  const [jvMatchmakingCount, setJvMatchmakingCount] = useState<number>(6); // 6 matches/mo
  const [buyerAuditDeskPrice, setBuyerAuditDeskPrice] = useState<number>(4500); // ZAR 4500/mo
  const [buyerAuditDeskCount, setBuyerAuditDeskCount] = useState<number>(3); // 3 buying departments

  // Intellectual Property & Trademark Protection States
  const [devOwnerName, setDevOwnerName] = useState<string>('SATA Solutions');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([9, 42]); // Default CIPC classes: Class 9 (Software) and Class 42 (SaaS)
  const [copiedLicense, setCopiedLicense] = useState<boolean>(false);
  const [copiedTakedown, setCopiedTakedown] = useState<boolean>(false);
  const [showTakedownGenerator, setShowTakedownGenerator] = useState<boolean>(false);

  // Helper to format currency in ZAR (South African Rand)
  const formatZAR = (num: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(num);
  };

  const generateLicenseText = () => {
    return `/**
 * @license
 * South African Tender Automator (SATA) - Proprietary Source License
 * Copyright (c) 2026 ${devOwnerName}. All rights reserved.
 *
 * Asserting Automatic Copyright protection under the South African Copyright Act 98 of 1978.
 * Asserting unregistered Common Law Trademark & Trade Dress rights in "SATA" & "South African Tender Automator".
 *
 * PROPRIETARY AND CONFIDENTIAL:
 * 1. This software source code, assets, schemas, and scoring formulas are the sole property of the owner.
 * 2. Reverse-engineering, decompiling, cloning, or distributing this code in any format is strictly prohibited.
 * 3. Use of the SATA name, logo, or trade dress without written authorization constitutes Trademark Infringement
 *    and Common Law "Passing Off."
 * 4. All personal data collected inside SBD compliance modules is protected by POPIA (Act No. 4 of 2013).
 */`;
  };

  const generateTakedownTemplate = () => {
    return `SUBJECT: URGENT: Trademark Infringement & Copyright Takedown Request - South African Tender Automator (SATA)

Dear Abuse Team,

We are writing to report a severe violation of intellectual property on a website hosted within your network.

Infringing URL: [INSERT INFRINGING WEBSITES HOSTED LINK HERE]
Infringing Material: [Specify: Code clone / Logo copy / SATA Brand hijacking]

OWNERSHIP CLAIMS:
1. COPYRIGHT CLAIM: The source code, assets, and database schemas of the South African Tender Automator (SATA) application are protected AUTOMATICALLY upon creation under the South African Copyright Act 98 of 1978. We are the exclusive developers and owners of this work.
2. TRADEMARK/COMMON LAW CLAIM: We own exclusive Common Law Trademark and trade dress rights in the name "South African Tender Automator" and the acronym "SATA", as well as its unique logo layout, protected against "Passing Off" in South Africa.

INFRINGEMENT DETAILS:
The reported site has cloned our proprietary front-end layout, automated B-BBEE scoring formulas, SBD forms filling assets, and is misleading local suppliers by passing themselves off as our official platform.

REQUESTED ACTION:
Pursuant to the copyright laws of the Republic of South Africa and international IP treaties, we demand that you immediately disable access to the infringing server/material.

I confirm under penalty of perjury that the information in this notification is accurate and that I am the intellectual property owner or authorized representative.

Kind regards,
[Your Name]
${devOwnerName}
Contact Email: [Your Email]`;
  };

  // Calculations
  const pkiRevenue = Math.round(monthlyActiveSuppliers * (pkiSignPercentage / 100) * pkiSigningSurcharge);
  const saasRevenue = Math.round(monthlyActiveSuppliers * (premiumSaaSPenetration / 100) * premiumSaaSPrice);
  const jvRevenue = Math.round(jvMatchmakingCount * jvMatchmakingFee);
  const buyerRevenue = Math.round(buyerAuditDeskCount * buyerAuditDeskPrice);
  const grossMonthlyRevenue = pkiRevenue + saasRevenue + jvRevenue + buyerRevenue;
  const developerCloudCost = 0; // Serverless Free Tier limits are R0
  const netMonthlyProfit = grossMonthlyRevenue - developerCloudCost;
  const annualizedProfit = netMonthlyProfit * 12;

  // Trigger diagnostic log
  const handleLogSimulation = () => {
    addLog?.(`Running developer profitability projections: ZAR ${grossMonthlyRevenue.toLocaleString()} monthly revenue simulated.`, 'success');
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="developer-advisor-panel">
      
      {/* Monetization Executive Summary Banner */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-emerald-600 font-mono font-bold uppercase tracking-wider text-white">
              <Coins className="w-3.5 h-3.5" />
              SATA Zero-Cost SaaS Monetization Blueprint
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight">
              Developer Profitability Strategist & Free Tier Deployment Engine
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              Explore how to deploy the South African Tender Automator app in a production-ready cloud container environment for **ZAR 0.00** while attending to high-yielding revenue streams built directly into your compliance features.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto font-mono text-center shrink-0">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[9px] text-slate-400 uppercase block">EST. MONTHLY PROFIT</span>
              <span className="text-xl font-black text-emerald-400 block mt-1">{formatZAR(netMonthlyProfit)}</span>
              <span className="text-[8px] text-slate-500 block">Cloud Cost: ZAR 0</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
              <span className="text-[9px] text-slate-400 uppercase block">ANNUALIZED PROJECTION</span>
              <span className="text-xl font-black text-white block mt-1">{formatZAR(annualizedProfit)}</span>
              <span className="text-[8px] text-emerald-500 block">100% Net Profit</span>
            </div>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none translate-x-10 translate-y-10">
          <TrendingUp className="w-72 h-72 text-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Revenue Parameter Tuning (Col 7) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-2.5 flex justify-between items-center">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              1. SaaS Revenue Tuning Parameters
            </h3>
            <button 
              onClick={handleLogSimulation}
              className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 py-1 px-2.5 rounded transition-colors"
            >
              Verify Projections
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Slider: Monthly Active Suppliers */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="font-bold text-slate-600 uppercase flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" /> Active Monthly Suppliers
                </span>
                <span className="font-bold text-slate-900">{monthlyActiveSuppliers} suppliers</span>
              </div>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={monthlyActiveSuppliers}
                onChange={(e) => setMonthlyActiveSuppliers(Number(e.target.value))}
                className="w-full accent-slate-800 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />
              <p className="text-[9px] text-slate-400">Target supplier base actively compiling and signing South African SBD bids.</p>
            </div>

            {/* Grid for Surcharges & Penetration Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              
              {/* PKI Signing Surcharge */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="font-bold text-slate-600 uppercase">PKI Seal Surcharge</span>
                  <span className="font-bold text-slate-800">{formatZAR(pkiSigningSurcharge)}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={500}
                  step={10}
                  value={pkiSigningSurcharge}
                  onChange={(e) => setPkiSigningSurcharge(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                  <span>Sign Rate: {pkiSignPercentage}%</span>
                  <span className="font-bold text-emerald-700">+{formatZAR(pkiRevenue)}/mo</span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-tight">Convenience fee charged to cryptographically seal the finalized envelope (SBD 4 + SBD 6.1 + Certificate).</p>
              </div>

              {/* Premium monthly recurring */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="font-bold text-slate-600 uppercase">SATA Premium Sub</span>
                  <span className="font-bold text-slate-800">{formatZAR(premiumSaaSPrice)}/mo</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2500}
                  step={50}
                  value={premiumSaaSPrice}
                  onChange={(e) => setPremiumSaaSPrice(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                  <span>Converts: {premiumSaaSPenetration}%</span>
                  <span className="font-bold text-indigo-700">+{formatZAR(saasRevenue)}/mo</span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-tight">Includes automated daily tender scraping feeds, local content risk triggers, and early fluctuation warnings.</p>
              </div>

              {/* Joint Venture Partner Matchmaker Fee */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="font-bold text-slate-600 uppercase">JV Matchmaker Fee</span>
                  <span className="font-bold text-slate-800">{formatZAR(jvMatchmakingFee)}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={250}
                  value={jvMatchmakingFee}
                  onChange={(e) => setJvMatchmakingFee(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                  <span>Matches/mo: {jvMatchmakingCount}</span>
                  <span className="font-bold text-amber-700">+{formatZAR(jvRevenue)}/mo</span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-tight">Paid by foreign bidders seeking B-BBEE level 1 partners using the newly built Cross-Border JV consolidated calculator.</p>
              </div>

              {/* Organs of State / SCM Buyer Audit seats */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                <div className="flex justify-between text-[10.5px] font-mono">
                  <span className="font-bold text-slate-600 uppercase">SCM Audit Desk seat</span>
                  <span className="font-bold text-slate-800">{formatZAR(buyerAuditDeskPrice)}/mo</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={15000}
                  step={500}
                  value={buyerAuditDeskPrice}
                  onChange={(e) => setBuyerAuditDeskPrice(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                  <span>Buying Depts: {buyerAuditDeskCount}</span>
                  <span className="font-bold text-blue-700">+{formatZAR(buyerRevenue)}/mo</span>
                </div>
                <p className="text-[8.5px] text-slate-400 leading-tight">Charged to government procurement departments (Western Cape Health, etc.) for high-speed audit logs and validation portals.</p>
              </div>

            </div>

            {/* Income Streams Summary Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2 text-xs font-mono">
              <span className="font-bold text-slate-500 uppercase block text-[9px]">SATA Profitability Breakdown (Monthly Gross ZAR)</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] text-slate-600">
                <div className="p-2 bg-white border border-slate-100 rounded text-center">
                  <span className="text-slate-400 block text-[8px]">PKI SEALING</span>
                  <span className="font-bold font-mono text-emerald-700">{formatZAR(pkiRevenue)}</span>
                </div>
                <div className="p-2 bg-white border border-slate-100 rounded text-center">
                  <span className="text-slate-400 block text-[8px]">PREMIUM SAAS</span>
                  <span className="font-bold font-mono text-indigo-700">{formatZAR(saasRevenue)}</span>
                </div>
                <div className="p-2 bg-white border border-slate-100 rounded text-center">
                  <span className="text-slate-400 block text-[8px]">JV MATCHMAKER</span>
                  <span className="font-bold font-mono text-amber-700">{formatZAR(jvRevenue)}</span>
                </div>
                <div className="p-2 bg-white border border-slate-100 rounded text-center">
                  <span className="text-slate-400 block text-[8px]">SCM AUDIT DESK</span>
                  <span className="font-bold font-mono text-blue-700">{formatZAR(buyerRevenue)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Free Tier Strategy & 5 Security Features Audit (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 2: Zero-Cost Google Cloud Architecture */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm text-white space-y-4">
            <div className="border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-emerald-400 tracking-wider font-mono flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" />
                2. R0.00 Serverless Infrastructure Strategy
              </h3>
            </div>

            <div className="space-y-3.5 text-[11px] leading-relaxed">
              
              <div className="space-y-1">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" /> Google Cloud Run (Compute)
                </span>
                <p className="text-slate-400 text-[10px]">
                  Hosts the Express backend server inside Docker container. Features **Scale-To-Zero** – when there are no bids being compiled, container stops and costs **R0.00**. Generous free tier of 2,000,000 requests per month.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Firebase Cloud Firestore (Database)
                </span>
                <p className="text-slate-400 text-[10px]">
                  Stores supplier data, encrypted SBD drafts, and signature histories. Free Tier covers **50,000 reads** and **20,000 writes** per day, supporting up to 1,500 monthly suppliers with zero database fees.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" /> GitHub Actions & Artifact Registry
                </span>
                <p className="text-slate-400 text-[10px]">
                  Automatic build & deployment triggers on pushing code to GitHub. Runs fully on **2,000 free runner minutes/month** and 500MB free container registry storage.
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-400" /> Google Cloud KMS Root (Asymmetric Trust)
                </span>
                <p className="text-slate-400 text-[10px]">
                  Initial public/private trust anchor keys. Under 5 keys, Key Management Service charges **R0.00** monthly baseline fee, enabling corporate PKI with zero up-front overhead.
                </p>
              </div>

            </div>
          </div>

          {/* Section 3: The 5 Core Security Safeguards in Action */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                3. The 5 Security Safeguards in Action
              </h3>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight">
              To earn trust from government procurement directors and multinational bidders, the platform integrates 5 state-of-the-art browser and data compliance defenses:
            </p>

            <div className="space-y-3.5 text-[10.5px]">
              
              <div className="flex items-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-mono px-1.5 py-0.2 shrink-0 font-bold">F1</span>
                <div>
                  <h4 className="font-bold text-slate-800">Clickjacking & Ancestry Guard</h4>
                  <p className="text-slate-500 text-[9.5px]">Ensures SBD form fillers cannot be loaded in hidden frames or malicious overlapping overlays, keeping active PKI operations safe.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-mono px-1.5 py-0.2 shrink-0 font-bold">F2</span>
                <div>
                  <h4 className="font-bold text-slate-800">Secure postMessage Gateway</h4>
                  <p className="text-slate-500 text-[9.5px]">Filters cross-origin iframe communication strictly by domain origin and matching regex headers to block unauthorized document reads.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-mono px-1.5 py-0.2 shrink-0 font-bold">F3</span>
                <div>
                  <h4 className="font-bold text-slate-800">Strict CSP & XSS Sanitizer</h4>
                  <p className="text-slate-500 text-[9.5px]">Escapes all text inputs in local storage drafts, preventing cross-site scripting payload injections during SCM portal transmission.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-mono px-1.5 py-0.2 shrink-0 font-bold">F4</span>
                <div>
                  <h4 className="font-bold text-slate-800">Local Memory Integrity Scanners</h4>
                  <p className="text-slate-500 text-[9.5px]">Constantly checks LocalStorage integrity hashes using active WebCrypto validation routines, automatically self-healing if tampering is detected.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-mono px-1.5 py-0.2 shrink-0 font-bold">F5</span>
                <div>
                  <h4 className="font-bold text-slate-800">POPIA Cryptographic Redaction Shield</h4>
                  <p className="text-slate-500 text-[9.5px]">Instantly redacts and one-way SHA-256 hashes sensitive fields (SARS pins, direct ID numbers) before Firestore storage to comply fully with POPIA data laws.</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Section 4: Trademark, Copyright & Brand Protection Shield (South Africa) */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5" id="developer-ip-shield">
        <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-bold uppercase text-slate-800 tracking-wider font-mono flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              4. IP Safeguard & Brand Protection (CIPC & Copyright Shield)
            </h3>
            <p className="text-[11px] text-slate-400">
              SATA has not yet registered its trademark or logo. Use these tools to protect your intellectual property under South African law before official CIPC filing.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="text-[9.5px] bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold px-2 py-0.5 rounded uppercase">
              Common Law Active
            </span>
            <span className="text-[9.5px] bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold px-2 py-0.5 rounded uppercase">
              SA Copyright Act Compliant
            </span>
          </div>
        </div>

        {/* IP Educational Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Automatic Copyright Warning */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-700 uppercase">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Automatic Copyright Safeguard
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Under the <strong className="text-slate-700">South African Copyright Act 98 of 1978</strong>, your software source code is protected <span className="underline decoration-indigo-500 font-semibold text-slate-700">automatically upon creation</span> as a "literary work." No CIPC registration is required to assert ownership of the SATA platform.
            </p>
            <div className="text-[9px] bg-white border border-slate-200 p-2 rounded text-slate-400 font-mono text-center">
              Copyright © 2026. All Rights Reserved.
            </div>
          </div>

          {/* Trademark Protection (Passing Off) */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-700 uppercase">
              <Scale className="w-4 h-4 text-indigo-500" />
              The "Passing Off" Protection
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Even without a registered trademark, the SATA brand name and logos are protected under <strong className="text-slate-700">Common Law</strong> against competitor plagiarism via the doctrine of <strong className="text-slate-700">"Passing Off."</strong> Once you establish active market presence and reputation, other developers cannot copy your brand.
            </p>
            <div className="text-[9px] bg-indigo-50/50 border border-indigo-100 text-indigo-800 p-2 rounded font-mono text-center font-bold">
              Goodwill & Reputation protected in SA courts.
            </div>
          </div>

          {/* CIPC Trademark Class Filing Guide */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-slate-700 uppercase">
              <Building2 className="w-4 h-4 text-emerald-500" />
              CIPC Official Filing Fees
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Official registration of your trade name & logo with the <strong className="text-slate-700">CIPC</strong> protects your brand nationwide. Online filing is available via <strong className="text-slate-700">CIPC BizPortal</strong>. Fees are calculated on a per-class basis.
            </p>
            <div className="text-[9px] bg-emerald-50/50 border border-emerald-100 text-emerald-800 p-2 rounded font-mono text-center font-bold">
              Filing Cost: ZAR 590 per selected class.
            </div>
          </div>

        </div>

        {/* Dynamic Tooling: CIPC Calculator & Legal Generator */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Left Column: CIPC Trademark Class Selector & Fee Calculator */}
          <div className="space-y-4 border border-slate-100 rounded-lg p-4 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-xs font-bold uppercase text-slate-600 font-mono">
                CIPC Official Class Calculator
              </span>
              <span className="text-xs font-mono font-extrabold text-emerald-600">
                Total Fees: {formatZAR(selectedClasses.length * 590)}
              </span>
            </div>

            <p className="text-[10px] text-slate-400">
              Select the classes of goods and services to register for SATA. Each selected class provides legally exclusive rights to the SATA name and logo in that sector.
            </p>

            <div className="space-y-2.5">
              {[
                { id: 9, title: "Class 9: Computer Software & Applications", desc: "Covers downloadable code, desktop widgets, mobile apps, and cryptographic PKI sealing modules." },
                { id: 35, title: "Class 35: Business Administration & Tender Services", desc: "Covers procurement advisory, tender matchmaking, public bidding assistance, and supplier analytics." },
                { id: 42, title: "Class 42: Software-as-a-Service (SaaS)", desc: "Covers hosting cloud computing, non-downloadable web applications, online document verifiers, and API feeds." }
              ].map((cls) => {
                const isSelected = selectedClasses.includes(cls.id);
                return (
                  <label 
                    key={cls.id}
                    className={`flex items-start gap-3 p-2.5 rounded border transition-all cursor-pointer select-none text-left ${
                      isSelected 
                        ? 'bg-slate-50 border-slate-800' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedClasses(selectedClasses.filter(x => x !== cls.id));
                        } else {
                          setSelectedClasses([...selectedClasses, cls.id]);
                        }
                      }}
                      className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-800 w-3.5 h-3.5"
                    />
                    <div className="space-y-0.5">
                      <span className="text-[10.5px] font-bold text-slate-800 block">{cls.title}</span>
                      <p className="text-[9px] text-slate-400 leading-tight">{cls.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded text-[9.5px] text-amber-900 leading-tight flex items-start gap-2 font-mono">
              <Info className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
              <div>
                <strong>Developer Notice:</strong> Official filing must be submitted via the CIPC IP portal. The R590 fee is paid directly to CIPC using your customer deposit reference.
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Legal Notice / Header Generator */}
          <div className="space-y-4 border border-slate-100 rounded-lg p-4 bg-white shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                <span className="text-xs font-bold uppercase text-slate-600 font-mono">
                  SATA South African Code Header / LICENSE Generator
                </span>
                <button
                  onClick={() => {
                    const txt = generateLicenseText();
                    navigator.clipboard.writeText(txt);
                    setCopiedLicense(true);
                    addLog?.('Copied Proprietary Licensing Header to clipboard.', 'success');
                    setTimeout(() => setCopiedLicense(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono cursor-pointer"
                >
                  {copiedLicense ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  {copiedLicense ? 'Copied Notice' : 'Copy Notice'}
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Developer / Company Owner Entity</label>
                <input
                  type="text"
                  value={devOwnerName}
                  onChange={(e) => setDevOwnerName(e.target.value)}
                  placeholder="e.g. South African Tender Automator Developer"
                  className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                />
              </div>

              <div className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-[9px] leading-relaxed max-h-48 overflow-y-auto border border-slate-800 text-left whitespace-pre-wrap">
                {generateLicenseText()}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setShowTakedownGenerator(!showTakedownGenerator);
                  addLog?.(showTakedownGenerator ? 'Closed Takedown Generator' : 'Opened DMCA/Passing-Off Takedown Notice Generator', 'info');
                }}
                className="flex-1 text-[10px] font-bold uppercase font-mono py-1.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded text-center transition-colors flex items-center justify-center gap-1"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                {showTakedownGenerator ? 'Hide Takedown Notice' : 'Generate Takedown Notice'}
              </button>
            </div>
          </div>

        </div>

        {/* Expandable Section: DMCA & Common Law Brand Takedown Generator */}
        {showTakedownGenerator && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase font-mono">
                  ⚖️ DMCA & Common Law "Passing Off" Takedown Template Generator
                </span>
                <span className="text-[8.5px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold font-mono border border-red-200">
                  URGENT ACTIONS
                </span>
              </div>
              <button
                onClick={() => {
                  const txt = generateTakedownTemplate();
                  navigator.clipboard.writeText(txt);
                  setCopiedTakedown(true);
                  addLog?.('Copied Takedown Notice template to clipboard.', 'success');
                  setTimeout(() => setCopiedTakedown(false), 2000);
                }}
                className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-600 hover:text-indigo-800 font-mono cursor-pointer"
              >
                {copiedTakedown ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copiedTakedown ? 'Copied Template' : 'Copy Template'}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              If another developer or competitor clones your app, copies your unregistered SATA logo, or launches an identical site, send this formal notice to their cloud provider (e.g. Google Cloud, AWS, DigitalOcean) to get their server shut down immediately.
            </p>

            <div className="bg-slate-900 text-slate-300 p-3.5 rounded font-mono text-[9px] leading-relaxed max-h-56 overflow-y-auto border border-slate-800 text-left whitespace-pre-wrap">
              {generateTakedownTemplate()}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
