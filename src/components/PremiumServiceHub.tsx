/**
 * @license
 * South African Tender Automator (SATA) - Proprietary Source License
 * Copyright (c) 2026 SATA Solutions. All rights reserved.
 *
 * Asserting Automatic Copyright protection under the South African Copyright Act 98 of 1978.
 * Asserting unregistered Common Law Trademark & Trade Dress rights in "SATA" & "South African Tender Automator".
 */

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Coins, 
  Search, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight, 
  FileCheck, 
  TrendingUp, 
  Percent, 
  Layers, 
  Users, 
  Globe, 
  Activity, 
  Info,
  Server,
  Zap,
  Mail,
  Smartphone,
  CheckCircle,
  Clock,
  ShieldAlert,
  FileText
} from 'lucide-react';

interface PremiumServiceHubProps {
  activeCert?: any;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function PremiumServiceHub({ activeCert, addLog }: PremiumServiceHubProps) {
  const [activeTab, setActiveTab] = useState<'scraper' | 'local_content' | 'jv_matchmaker' | 'audit_desk'>('scraper');

  // Helper to format currency in ZAR (South African Rand)
  const formatZAR = (num: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(num);
  };

  // --- Feature 1: Live Tender Scraper & Alerts State ---
  const [scraperKeywords, setScraperKeywords] = useState<string>('Software, Consulting');
  const [alertMethod, setAlertMethod] = useState<'sms' | 'email' | 'both'>('both');
  const [userContact, setUserContact] = useState<string>('cengcanis@gmail.com');
  const [scrapedTenders, setScrapedTenders] = useState<any[]>([
    { id: 'sc-1', ref: 'WCGH-024/2026', title: 'Implementation of Enterprise Cloud EHR System', dept: 'WC Dept of Health', value: 3400000, industry: 'Software', matchScore: 98, scrapedAt: 'Just Now' },
    { id: 'sc-2', ref: 'GDE-843/2026', title: 'Provision of Secure Cyber-Security Auditing Services', dept: 'Gauteng Dept of Education', value: 1250000, industry: 'Security', matchScore: 85, scrapedAt: '5 mins ago' },
    { id: 'sc-3', ref: 'NTR-009/2026', title: 'Consulting Services for Automated Compliance Systems', dept: 'National Treasury', value: 4800000, industry: 'Consulting', matchScore: 94, scrapedAt: '12 mins ago' },
  ]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  // Trigger Live Scraper Simulation
  const handleTriggerScraper = () => {
    setIsScraping(true);
    addLog?.('SATA Scraper Engine: Initiating multi-gateway sweep for new tenders...', 'info');
    setSimulationLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] Contacting Western Cape and Gauteng provincial treasuries...`]);

    setTimeout(() => {
      setSimulationLog(prev => [
        ...prev, 
        `[${new Date().toLocaleTimeString()}] Parsing HTML indices and applying POPIA-compliant text categorization...`,
        `[${new Date().toLocaleTimeString()}] Match identified: WCGH-024/2026 with 98% supplier alignment score.`
      ]);
      setIsScraping(false);
      addLog?.('SATA Scraper Engine: Sweep complete. 3 matches detected. Instant alerts dispatched.', 'success');
      
      // Dispatch alerts
      if (alertMethod === 'email' || alertMethod === 'both') {
        setSimulationLog(prev => [...prev, `[ALERT] Email notification dispatched to ${userContact}`]);
      }
      if (alertMethod === 'sms' || alertMethod === 'both') {
        setSimulationLog(prev => [...prev, `[ALERT] SMS priority notification dispatched to SCM manager cell`]);
      }
    }, 1500);
  };

  // --- Feature 2: Local Content Risk & Fluctuation Engine State ---
  const [selectedSector, setSelectedSector] = useState<string>('steel_products');
  const [localContentSteelValue, setLocalContentSteelValue] = useState<number>(85); // 85% local raw material
  const [importedComponentValue, setImportedComponentValue] = useState<number>(15); // 15% import
  const [rawSteelCostIndex, setRawSteelCostIndex] = useState<number>(112.5); // base index 100
  const [currencyExchangeRate, setCurrencyExchangeRate] = useState<number>(18.42); // USD to ZAR

  // Sector Rules database for SBD 6.2 / local content
  const sectorThresholds: Record<string, { name: string; statutoryMin: number; fluctuationRisk: 'low' | 'medium' | 'high' }> = {
    steel_products: { name: 'Structural Steel Products', statutoryMin: 100, fluctuationRisk: 'high' },
    solar_panels: { name: 'Solar PV Components / Inverters', statutoryMin: 70, fluctuationRisk: 'high' },
    textiles_apparel: { name: 'Textiles, Clothing & Leather Footwear', statutoryMin: 100, fluctuationRisk: 'medium' },
    power_pylons: { name: 'Electrical Power Lines / Pylons', statutoryMin: 90, fluctuationRisk: 'high' },
    office_furniture: { name: 'School & Office Steel Furniture', statutoryMin: 85, fluctuationRisk: 'low' },
  };

  const selectedSectorRule = sectorThresholds[selectedSector];
  const meetsLocalContentMinimum = localContentSteelValue >= selectedSectorRule.statutoryMin;

  // --- Feature 3: Cross-Border Joint Venture B-BBEE Scorecard Calculator State ---
  const [partnerLocalLevel, setPartnerLocalLevel] = useState<number>(1); // B-BBEE Level 1
  const [partnerLocalShare, setPartnerLocalShare] = useState<number>(51); // 51% ownership share
  const [partnerLocalBlackShare, setPartnerLocalBlackShare] = useState<number>(100); // 100% black ownership
  const [partnerForeignSkill, setPartnerForeignSkill] = useState<string>('Specialized Medical Imaging Hardware / Asymmetric Crypto Sealing SDK');
  const [partnerForeignShare, setPartnerForeignShare] = useState<number>(49); // 49% ownership share

  // B-BBEE Score Matrix to Points
  const getBbeePointsByLevel = (level: number) => {
    switch (level) {
      case 1: return 100;
      case 2: return 95;
      case 3: return 90;
      case 4: return 80;
      case 5: return 75;
      case 6: return 60;
      case 7: return 50;
      case 8: return 40;
      default: return 0;
    }
  };

  // Consolidated Joint Venture Score calculation (weighted based on ownership share)
  const localPoints = getBbeePointsByLevel(partnerLocalLevel);
  // Foreign partners generally have Level 8/Non-compliant (0 points) unless otherwise structured
  const foreignPoints = 0; 
  
  // Weighted Points formula
  const weightedPoints = (localPoints * (partnerLocalShare / 100)) + (foreignPoints * (partnerForeignShare / 100));
  
  // Convert points back to Consolidated JV B-BBEE level
  const getConsolidatedBbeeLevel = (pts: number) => {
    if (pts >= 95) return 1;
    if (pts >= 90) return 2;
    if (pts >= 85) return 3;
    if (pts >= 75) return 4;
    if (pts >= 70) return 5;
    if (pts >= 60) return 6;
    if (pts >= 50) return 7;
    if (pts >= 40) return 8;
    return 'Non-Compliant';
  };

  const consolidatedBbeeLevel = getConsolidatedBbeeLevel(weightedPoints);

  // --- Feature 4: SCM Buyer Audit Verification State ---
  const [auditorDept, setAuditorDept] = useState<string>('Western Cape Provincial Treasury');
  const [searchDocHash, setSearchDocHash] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [auditLog, setAuditLog] = useState<any[]>([
    { id: 'al-1', time: '09:24:12', user: 'SCM Auditor 1', action: 'Verified Envelope SBD 4 + SBD 6.1 Integrity Hash', ref: 'WCGH-024/2026', status: 'pass' },
    { id: 'al-2', time: '10:15:45', user: 'Department Head', action: 'Reviewed Digital Certificate Revocation Status', ref: 'GDE-843/2026', status: 'pass' },
    { id: 'al-3', time: '11:02:11', user: 'National Treasury Inspector', action: 'Audited Formula Weights for local content', ref: 'NTR-009/2026', status: 'pass' }
  ]);

  const handleSimulateAuditVerification = () => {
    setIsValidating(true);
    addLog?.('SCM Audit: Re-verifying digital envelope seals and certificate ancestry...', 'info');
    
    setTimeout(() => {
      setVerificationResult({
        docName: 'SBD_4_Signed_Final.pdf',
        referenceNumber: 'WCGH-024/2026',
        signingDate: '2026-07-17',
        certificateIssuer: 'SATA Root CA - South Africa',
        subjectName: 'SATA Authorized Bidder',
        integrityHash: 'SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        ectActCompliance: 'ECT Act 25 of 2002 Sect 13 (Valid Electronic Signature)',
        popiaConsentPassed: 'POPIA Compliant Redaction Active'
      });
      setIsValidating(false);
      addLog?.('SCM Audit Verification: Document is 100% Authentic and Legally Binding under ECT Act 2002.', 'success');
      
      // Add new log to trace table
      setAuditLog(prev => [
        {
          id: `al-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          user: `${auditorDept} Inspector`,
          action: 'Asymmetric Integrity Check Passed (SHA-256 Verification)',
          ref: 'WCGH-024/2026',
          status: 'pass'
        },
        ...prev
      ]);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="premium-service-suite-root">
      
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-6 text-white relative overflow-hidden shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] bg-emerald-600 font-mono font-bold uppercase tracking-wider text-white">
              <Zap className="w-3.5 h-3.5" />
              SATA Premium Enterprise Services
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">
              SATA Core Premium Enhancements Hub
            </h1>
            <p className="text-slate-300 text-xs max-w-2xl">
              Access the four identified premium modules designed to elevate your bidding success, secure state procurement trust, and unlock high-yielding software revenue streams.
            </p>
          </div>
          
          <div className="flex gap-2.5 shrink-0 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px]">
            <div className="text-center">
              <span className="text-slate-500 block uppercase text-[8px]">PROVINCIAL PORTS</span>
              <span className="text-emerald-400 font-bold block mt-0.5">9/9 ONLINE</span>
            </div>
            <div className="w-px bg-slate-800 self-stretch"></div>
            <div className="text-center">
              <span className="text-slate-500 block uppercase text-[8px]">ECT COMPLIANCE</span>
              <span className="text-indigo-400 font-bold block mt-0.5">100% CERTIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Selector Tabs */}
      <div className="flex flex-wrap bg-white p-1.5 rounded-lg border border-slate-200 shadow-xs gap-1.5" id="premium-features-nav-bar">
        {[
          { id: 'scraper', label: '1. Scraper Alert Feed', icon: Search, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
          { id: 'local_content', label: '2. Local Content Risk Safeguard', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-100' },
          { id: 'jv_matchmaker', label: '3. Cross-Border JV Matchmaker', icon: Users, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
          { id: 'audit_desk', label: '4. SCM Buyer Audit Portal', icon: ShieldCheck, color: 'text-blue-600 bg-blue-50 border-blue-100' }
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                addLog?.(`Switched to Premium Suite: ${tab.label}`, 'info');
              }}
              className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-md text-xs font-mono font-bold uppercase transition-all flex items-center gap-2 cursor-pointer border ${
                isSelected 
                  ? 'bg-slate-900 text-white border-slate-950 shadow-sm' 
                  : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Feature Content Wrapper */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs min-h-[400px]">
        
        {/* --- Feature 1: Scraper Alert Feed --- */}
        {activeTab === 'scraper' && (
          <div className="space-y-6 animate-fadeIn" id="premium-feature-scraper">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-indigo-600" />
                  Premium Feed: Smart Real-Time Scraping Alert Engine
                </h2>
                <p className="text-xs text-slate-500">
                  Monitors municipal and provincial treasury websites, compiling daily bidding requirements matching your custom keyword matrix.
                </p>
              </div>
              <button
                onClick={handleTriggerScraper}
                disabled={isScraping}
                className="bg-indigo-600 text-white hover:bg-indigo-700 font-mono font-bold text-xs py-2 px-4 rounded transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-55"
              >
                {isScraping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isScraping ? 'Scraping Gateways...' : 'Trigger Scraper Sweep'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Alert Subscription Config */}
              <div className="lg:col-span-4 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono border-b border-slate-200 pb-2">
                  Alert Trigger Setup
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block">SATA Keyword Matrix (Comma-Separated)</label>
                    <input
                      type="text"
                      value={scraperKeywords}
                      onChange={(e) => setScraperKeywords(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                      placeholder="e.g. Software, Security"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Alert Dispatch Mode</label>
                    <select
                      value={alertMethod}
                      onChange={(e: any) => setAlertMethod(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    >
                      <option value="both">SMS & Email Alerts (ZAR 1.50/alert)</option>
                      <option value="email">Email Notification Only</option>
                      <option value="sms">SMS Text Alert Only</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Primary Contact Handle</label>
                    <input
                      type="text"
                      value={userContact}
                      onChange={(e) => setUserContact(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="bg-indigo-50/50 border border-indigo-100 rounded p-3 text-[10px] text-indigo-950 font-mono leading-relaxed space-y-1">
                  <div className="font-bold uppercase text-[9px] flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    Premium SaaS Service Level
                  </div>
                  <p className="text-[9px] text-slate-600">
                    SaaS subscription charges R850/mo baseline to keep active background scraping cron tasks running, providing immediate competitive advantage on new tenders before public gazetting.
                  </p>
                </div>
              </div>

              {/* Live Alerts Stream Output */}
              <div className="lg:col-span-8 space-y-4">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  Live Matched Tenders Stream
                </h3>

                <div className="space-y-3">
                  {scrapedTenders.map((tender) => (
                    <div key={tender.id} className="border border-slate-150 rounded-lg p-3.5 bg-white hover:border-indigo-400 transition-all text-left relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      
                      {/* Left Block */}
                      <div className="space-y-1 max-w-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
                            {tender.ref}
                          </span>
                          <span className="text-[9.5px] text-slate-400 font-mono">
                            Scraped: {tender.scrapedAt}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-800">{tender.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{tender.dept} • Budget: {formatZAR(tender.value)}</p>
                      </div>

                      {/* Right Block */}
                      <div className="flex items-center gap-4 shrink-0 font-mono text-right w-full md:w-auto justify-between md:justify-end">
                        <div>
                          <span className="text-[8px] text-slate-400 block uppercase">ALIGNMENT SCORE</span>
                          <span className="text-xs font-black text-emerald-600">{tender.matchScore}% Match</span>
                        </div>
                        <button className="bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-[9.5px] font-bold uppercase py-1.5 px-3 rounded-md transition-all font-mono">
                          View details
                        </button>
                      </div>

                      {/* Subtle green top-bar for high match score */}
                      {tender.matchScore >= 90 && (
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Scraper System Logs Output */}
                <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 text-left">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase block mb-1">Scraper Engine Console Trace Logs</span>
                  <div className="font-mono text-[9px] text-slate-300 space-y-1">
                    {simulationLog.length === 0 ? (
                      <span className="text-slate-500">No active trace log session initialized. Click "Trigger Scraper Sweep" above to inspect.</span>
                    ) : (
                      simulationLog.map((logStr, i) => (
                        <p key={i} className={logStr.includes('[ALERT]') ? 'text-emerald-400 font-bold' : ''}>
                          {logStr}
                        </p>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- Feature 2: Local Content Risk Warning --- */}
        {activeTab === 'local_content' && (
          <div className="space-y-6 animate-fadeIn" id="premium-feature-local-content">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Premium Module: Local Content Risk & Price Fluctuation Guard
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Calculates your statutory local-content declaration thresholds (SBD 6.2 formulas) and triggers cost escalation alarms mapped to macroeconomic index volatility.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Calculator Inputs */}
              <div className="lg:col-span-5 space-y-5 bg-slate-50 p-4 border border-slate-100 rounded-lg">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono border-b border-slate-200 pb-2">
                  Threshold Inputs & Config
                </h3>

                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block">SBD 6.2 Designated Sector</label>
                    <select
                      value={selectedSector}
                      onChange={(e) => setSelectedSector(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-mono bg-white"
                    >
                      {Object.entries(sectorThresholds).map(([key, item]) => (
                        <option key={key} value={key}>{item.name} ({item.statutoryMin}% Required)</option>
                      ))}
                    </select>
                  </div>

                  {/* Range Slider for Local Content value */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="font-bold text-slate-500 uppercase">Local Raw Material Sourcing</span>
                      <span className="font-bold text-slate-800">{localContentSteelValue}% Local</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={localContentSteelValue}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setLocalContentSteelValue(val);
                        setImportedComponentValue(100 - val);
                      }}
                      className="w-full accent-amber-600 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Statutory Min: {selectedSectorRule.statutoryMin}%</span>
                      <span>Target: {localContentSteelValue}%</span>
                    </div>
                  </div>

                  {/* Imported percentage */}
                  <div className="p-3 bg-white border border-slate-100 rounded">
                    <div className="flex justify-between text-[10px] font-mono text-slate-500">
                      <span>IMPORTED MATERIAL PORTION:</span>
                      <span className="font-bold text-red-600">{importedComponentValue}%</span>
                    </div>
                    <p className="text-[8.5px] text-slate-400 mt-1 leading-tight">
                      SBD 6.2 strictly requires all imported materials to use SARS customs exchange rates calculated 48 hours prior to bid closure.
                    </p>
                  </div>

                  {/* Macro inputs */}
                  <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-[10.5px]">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[8.5px] block uppercase">Raw Steel Price Index</span>
                      <input 
                        type="number"
                        step="0.1"
                        value={rawSteelCostIndex}
                        onChange={(e) => setRawSteelCostIndex(Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[8.5px] block uppercase">Exchange Rate (USD/ZAR)</span>
                      <input 
                        type="number"
                        step="0.01"
                        value={currencyExchangeRate}
                        onChange={(e) => setCurrencyExchangeRate(Number(e.target.value))}
                        className="w-full p-1.5 border border-slate-200 rounded bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Warning Indicators Output */}
              <div className="lg:col-span-7 space-y-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  SATA SCM Compliance Risk Assessment
                </h3>

                {/* SBD 6.2 Scorebox Status */}
                <div className={`p-4 border rounded-lg flex items-start gap-4 text-left ${
                  meetsLocalContentMinimum 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}>
                  <div className={`p-2 rounded shrink-0 ${meetsLocalContentMinimum ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {meetsLocalContentMinimum ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold uppercase font-mono">
                      {meetsLocalContentMinimum ? '✓ Statutory Compliance Standard Cleared' : '❌ CRITICAL COMPLIANCE FAILURE'}
                    </h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {meetsLocalContentMinimum 
                        ? `Your sourcing ratio of ${localContentSteelValue}% local material satisfies the minimum requirement of ${selectedSectorRule.statutoryMin}% for ${selectedSectorRule.name}. Bid meets SBD 6.2 compliance guidelines.`
                        : `Your sourcing ratio of ${localContentSteelValue}% local material falls below the mandatory ${selectedSectorRule.statutoryMin}% minimum. SCM auditors will immediately disqualify this SBD submission.`
                      }
                    </p>
                    {!meetsLocalContentMinimum && (
                      <p className="text-[10px] text-rose-700 font-bold font-mono mt-1">
                        Remediation suggestion: Sourced steel component must be fully manufactured in SA. Adjust supply agreements.
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Fluctuation Index Warnings */}
                <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-white text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">Macroscopic Price Volatility Warnings</span>
                    <span className="text-[9.5px] bg-red-100 text-red-800 font-mono font-bold px-1.5 rounded uppercase">HIGH VOLATILITY ALERT</span>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                    
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono text-[10px] font-bold text-slate-700">
                        <span>Steel Commodity Index Peak</span>
                        <span className="text-red-600">+{((rawSteelCostIndex - 100)).toFixed(1)}% Spike</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Global raw material prices are fluctuating significantly. With the commodity index sitting at {rawSteelCostIndex}, your estimated margins on SBD 4 bidding could shrink by up to 12% if pre-quoted.
                      </p>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-50">
                      <div className="flex justify-between font-mono text-[10px] font-bold text-slate-700">
                        <span>ZAR Exchange Fluctuation Warning</span>
                        <span className="text-amber-600">USD/ZAR at {currencyExchangeRate}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        If bid submission is delayed, import portion costs ({importedComponentValue}%) will expand. We advise building a 4.5% FX hedging buffer inside the SBD Pricing Calculator.
                      </p>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- Feature 3: Cross-Border JV Partner Matchmaker --- */}
        {activeTab === 'jv_matchmaker' && (
          <div className="space-y-6 animate-fadeIn" id="premium-feature-jv-matchmaker">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Premium Engine: B-BBEE Joint Venture Partner Matchmaker & Scorecard
                </h2>
                <p className="text-xs text-slate-500">
                  Enables foreign bidders to instantly pair up with local Level 1 partners, automatically computing consolidated B-BBEE weighted average scores.
                </p>
              </div>
              <span className="text-[9.5px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded font-mono font-bold uppercase shrink-0">
                Level 1 Partner Finder Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Parameter Settings */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg text-left">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono border-b border-slate-200 pb-2">
                  JV Joint Venture Share Settings
                </h3>

                <div className="space-y-3.5 text-xs">
                  
                  {/* Share % Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="font-bold text-slate-500 uppercase">Partner A (Local SA Partner) Share</span>
                      <span className="font-bold text-slate-900">{partnerLocalShare}% Share</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={partnerLocalShare}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPartnerLocalShare(val);
                        setPartnerForeignShare(100 - val);
                      }}
                      className="w-full accent-slate-800 cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-400">
                      <span>Min: 10%</span>
                      <span>Max: 90%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Local Partner BEE Level</label>
                      <select
                        value={partnerLocalLevel}
                        onChange={(e) => setPartnerLocalLevel(Number(e.target.value))}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                      >
                        {[1,2,3,4,5,6,7,8].map((lvl) => (
                          <option key={lvl} value={lvl}>Level {lvl} ({getBbeePointsByLevel(lvl)} pts)</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Black Ownership Share</label>
                      <select
                        value={partnerLocalBlackShare}
                        onChange={(e) => setPartnerLocalBlackShare(Number(e.target.value))}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded font-mono bg-white"
                      >
                        <option value={100}>100% Black Owned</option>
                        <option value={51}>51% Black Owned</option>
                        <option value={30}>30% Black Owned</option>
                        <option value={0}>0% (White Owned)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1.5 border-t border-slate-100">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Foreign Partner Technical Asset Contribution</label>
                    <input
                      type="text"
                      value={partnerForeignSkill}
                      onChange={(e) => setPartnerForeignSkill(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-white"
                    />
                  </div>

                </div>
              </div>

              {/* Calculated Results Panel */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Consolidated JV Scorecard Output
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Big metrics */}
                  <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 text-center font-mono">
                    <span className="text-[9px] text-slate-400 block uppercase">Weighted points</span>
                    <span className="text-3xl font-black text-emerald-400 block mt-1.5">{weightedPoints.toFixed(1)}</span>
                    <span className="text-[8px] text-slate-500 block mt-1">SA Treasury Weighted formula</span>
                  </div>

                  <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 text-center font-mono">
                    <span className="text-[9px] text-slate-400 block uppercase">CONSOLIDATED B-BBEE LEVEL</span>
                    <span className="text-3xl font-black text-indigo-400 block mt-1.5">Level {consolidatedBbeeLevel}</span>
                    <span className="text-[8px] text-emerald-500 block mt-1">Eligible for SBD 6.1 preference</span>
                  </div>

                </div>

                <div className="border border-slate-200 rounded-lg p-4 space-y-2.5 bg-slate-50 text-xs">
                  <span className="font-bold text-slate-600 uppercase font-mono block text-[9.5px]">Weighted Formula Audit trail</span>
                  <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                    <div className="flex justify-between">
                      <span>Partner A Points ({partnerLocalShare}% Share):</span>
                      <span className="text-slate-800 font-bold">{(getBbeePointsByLevel(partnerLocalLevel) * (partnerLocalShare / 100)).toFixed(1)} pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partner B Points ({partnerForeignShare}% Share):</span>
                      <span className="text-slate-800 font-bold">0.0 pts</span>
                    </div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between text-slate-900 font-bold">
                      <span>Consolidated B-BBEE Points:</span>
                      <span>{weightedPoints.toFixed(1)} pts</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 text-emerald-950 rounded-lg text-[10px] leading-relaxed border border-emerald-100">
                  <div className="font-bold text-[9px] font-mono uppercase text-emerald-800 flex items-center gap-1.5 mb-1">
                    <Globe className="w-3.5 h-3.5" /> Optimal JV Structure Approved
                  </div>
                  Our matchmaking analyzer confirms: Sponsoring a local Level {partnerLocalLevel} Black-Owned partner with {partnerLocalShare}% equity guarantees high-speed SBD 6.1 preference allocation without sacrificing foreign majority operational control of proprietary medical/software technologies.
                </div>

              </div>

            </div>
          </div>
        )}

        {/* --- Feature 4: SCM Buyer Audit Desk --- */}
        {activeTab === 'audit_desk' && (
          <div className="space-y-6 animate-fadeIn" id="premium-feature-audit-desk">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Premium Seat: Organs of State (SCM Buyer) Audit Desk
                </h2>
                <p className="text-xs text-slate-500">
                  A high-security, authenticated portal enabling government procurement auditors to audit asymmetric PKI seals and verify bidder POPIA consent.
                </p>
              </div>
              <span className="text-[9.5px] bg-indigo-950 text-white border border-indigo-900 px-2.5 py-1 rounded font-mono font-bold uppercase shrink-0">
                SCM Audit Seat Active
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Search & Audit box */}
              <div className="lg:col-span-5 space-y-4 bg-slate-50 p-4 border border-slate-100 rounded-lg text-left">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono border-b border-slate-200 pb-2">
                  Verify Envelope Cryptography
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 font-mono uppercase block">Auditing Department</label>
                    <input
                      type="text"
                      value={auditorDept}
                      onChange={(e) => setAuditorDept(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded font-sans bg-white"
                    />
                  </div>

                  {/* Simulated Upload drag/drop area */}
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center bg-white hover:border-indigo-500 transition-all cursor-pointer">
                    <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-[10.5px] font-bold text-slate-700 block">Drag & Drop Signed SBD Package</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Or click to select signed PDF</span>
                  </div>

                  <button
                    onClick={handleSimulateAuditVerification}
                    disabled={isValidating}
                    className="w-full bg-slate-900 text-white hover:bg-slate-800 font-mono font-bold text-xs py-2 px-4 rounded transition-all text-center flex items-center justify-center gap-1 cursor-pointer disabled:opacity-55"
                  >
                    {isValidating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    {isValidating ? 'Verifying Signature Seals...' : 'Validate Bidder Authenticity'}
                  </button>

                </div>
              </div>

              {/* Audit Verification Log results */}
              <div className="lg:col-span-7 space-y-4 text-left">
                <h3 className="text-xs font-bold text-slate-700 uppercase font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  SCM Integrity Verification Ledger
                </h3>

                {verificationResult ? (
                  <div className="border border-slate-200 rounded-lg p-4 bg-indigo-50/20 text-xs space-y-2.5 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                      <span className="font-bold text-slate-800 font-mono text-[10px]">Verification Shield: VALID</span>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 rounded font-mono">100% ECT Act Compliant</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono text-slate-600">
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Document Name</span>
                        <span className="font-bold text-slate-800">{verificationResult.docName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Tender Reference</span>
                        <span className="font-bold text-slate-800">{verificationResult.referenceNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Signing Certificate Issuer</span>
                        <span className="font-bold text-slate-800">{verificationResult.certificateIssuer}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[8px] block uppercase">Subject / Legal Signatory</span>
                        <span className="font-bold text-slate-800">{verificationResult.subjectName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 text-[8px] block uppercase">Cryptographic Integrity SHA-256 Hash</span>
                        <span className="font-mono text-[8.5px] text-indigo-900 bg-white p-1 rounded border border-slate-200 block truncate">{verificationResult.integrityHash}</span>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200 flex justify-between text-[9px] font-mono text-slate-400">
                      <span>ECT Act Ref: Sect 13 (SATA Signature)</span>
                      <span className="text-emerald-700 font-bold">✓ POPIA Certified Passed</span>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center text-slate-400 font-mono text-[10.5px]">
                    No envelope scanned. Click "Validate Bidder Authenticity" to run verification audits.
                  </div>
                )}

                {/* Historic Auditor Log table */}
                <div className="border border-slate-150 rounded-lg overflow-hidden bg-white text-[10px]">
                  <div className="bg-slate-100 p-2 border-b border-slate-200">
                    <span className="font-bold text-slate-600 uppercase font-mono block text-[8px]">Historic Verification Trails (Western Cape SCM Portal)</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto font-mono">
                    {auditLog.map((log) => (
                      <div key={log.id} className="p-2 flex justify-between items-center text-slate-600 hover:bg-slate-50">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block text-[9.5px]">{log.action}</span>
                          <span className="text-[8.5px] text-slate-400">{log.time} • Dept: {log.user} • Ref: {log.ref}</span>
                        </div>
                        <span className="text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 rounded">
                          PASS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
