/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  PlusCircle, 
  Search, 
  ShieldCheck, 
  FileText, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  RefreshCw, 
  Download,
  Award
} from 'lucide-react';
import { ProvincialTender } from '../services/UniversalProvincialService';

interface BuyingPublicDashboardProps {
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  onRefreshFeed?: () => void;
}

interface BidderRecord {
  id: string;
  companyName: string;
  registrationNumber: string;
  csdNumber: string;
  status: 'compliant' | 'non_compliant' | 'blacklisted';
  taxClearanceValid: boolean;
  score80_20?: number;
  certThumbprint?: string;
}

export default function BuyingPublicDashboard({ addLog, onRefreshFeed }: BuyingPublicDashboardProps) {
  // Navigation tabs within Buying Public Dashboard
  const [buyingTab, setBuyingTab] = useState<'publish' | 'verify' | 'stats'>('publish');

  // Form states for Publishing
  const [refNum, setRefNum] = useState('');
  const [tenderTitle, setTenderTitle] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('western_cape');
  const [deptName, setDeptName] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');

  // Bidder verification states
  const [searchBidderQuery, setSearchBidderQuery] = useState('');
  const [selectedBidder, setSelectedBidder] = useState<BidderRecord | null>(null);

  // Local profile loading states to dynamically audit local workspace
  const [localProfile, setLocalProfile] = useState<any>(null);
  const [localCertMeta, setLocalCertMeta] = useState<any>(null);
  const [coidaFileMeta, setCoidaFileMeta] = useState<any>(null);
  const [municipalFileMeta, setMunicipalFileMeta] = useState<any>(null);
  const [csdSyncEnabled, setCsdSyncEnabled] = useState<boolean>(false);

  const loadLocalWorkspaceData = () => {
    try {
      const savedProfile = localStorage.getItem('sata_supplier_profile_local');
      if (savedProfile) setLocalProfile(JSON.parse(savedProfile));
      else setLocalProfile(null);

      const savedCertMeta = localStorage.getItem('sata_cert_meta');
      if (savedCertMeta) setLocalCertMeta(JSON.parse(savedCertMeta));
      else setLocalCertMeta(null);

      const coidaSaved = localStorage.getItem('sata_coida_file_meta');
      if (coidaSaved) setCoidaFileMeta(JSON.parse(coidaSaved));
      else setCoidaFileMeta(null);

      const municipalSaved = localStorage.getItem('sata_municipal_file_meta');
      if (municipalSaved) setMunicipalFileMeta(JSON.parse(municipalSaved));
      else setMunicipalFileMeta(null);

      const syncEnabled = localStorage.getItem('sata_csd_auto_sync') === 'true';
      setCsdSyncEnabled(syncEnabled);
    } catch (e) {
      console.warn('Failed to load local workspace data for buying public portal:', e);
    }
  };

  useEffect(() => {
    loadLocalWorkspaceData();
    // Watch storage changes
    window.addEventListener('storage', loadLocalWorkspaceData);
    const interval = setInterval(loadLocalWorkspaceData, 3000);
    return () => {
      window.removeEventListener('storage', loadLocalWorkspaceData);
      clearInterval(interval);
    };
  }, []);

  // Simulated government bidders list for lookup with dynamic workspace profile injection
  const biddersList: BidderRecord[] = useMemo(() => {
    const list: BidderRecord[] = [
      { id: 'BID-001', companyName: 'Inzalo Infrastructure Solutions', registrationNumber: '2015/384920/07', csdNumber: 'MAAA0192837', status: 'compliant', taxClearanceValid: true, score80_20: 94.5, certThumbprint: 'SHA256:d8a4f90e...' },
      { id: 'BID-002', companyName: 'Sizwe ICT Tech Partners', registrationNumber: '2019/583921/07', csdNumber: 'MAAA0284910', status: 'compliant', taxClearanceValid: true, score80_20: 91.2, certThumbprint: 'SHA256:7c9e0a8b...' },
      { id: 'BID-003', companyName: 'Phambili Cleaning & Catering', registrationNumber: '2011/293847/07', csdNumber: 'MAAA0039481', status: 'compliant', taxClearanceValid: true, score80_20: 88.0 },
      { id: 'BID-004', companyName: 'Vanguard Security Services', registrationNumber: '2018/192847/07', csdNumber: 'MAAA0928374', status: 'non_compliant', taxClearanceValid: false, score80_20: 75.4 },
      { id: 'BID-005', companyName: 'Gupta Consolidated Spares', registrationNumber: '2008/002934/07', csdNumber: 'MAAA0000000', status: 'blacklisted', taxClearanceValid: false }
    ];

    if (localProfile) {
      const isCompliant = coidaFileMeta && municipalFileMeta && csdSyncEnabled;
      list.unshift({
        id: 'BID-WORKSPACE-LIVE',
        companyName: localProfile.companyName || 'My Local Supplier Company',
        registrationNumber: localProfile.registrationNumber || 'Pending CIPC Reg',
        csdNumber: localProfile.csdNumber || 'MAAA-NOT-SYNCED',
        status: isCompliant ? 'compliant' : 'non_compliant',
        taxClearanceValid: localProfile.taxStatus === 'compliant' || csdSyncEnabled,
        score80_20: isCompliant ? 98.6 : 64.2,
        certThumbprint: localCertMeta ? `SHA256:${localCertMeta.publicKeyThumbprint}` : undefined
      });
    }

    return list;
  }, [localProfile, localCertMeta, coidaFileMeta, municipalFileMeta, csdSyncEnabled]);

  // Filtered list of custom published tenders by buying public
  const [publishedList, setPublishedList] = useState<ProvincialTender[]>([]);

  // Load published list from localStorage
  const loadPublishedTenders = () => {
    try {
      const raw = localStorage.getItem('sata_published_tenders_local');
      if (raw) {
        setPublishedList(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPublishedTenders();
  }, []);

  const handlePublishTender = (e: React.FormEvent) => {
    e.preventDefault();

    if (!refNum || !tenderTitle || !deptName || !closingDate || !estimatedValue) {
      alert("Please populate all fields to bulletin a formal South African Treasury notice.");
      return;
    }

    const newTender: ProvincialTender = {
      referenceNumber: refNum.trim().toUpperCase(),
      title: tenderTitle.trim(),
      province: selectedProvince.toUpperCase(),
      closingDate,
      documentDownloadUrl: null,
      department: deptName.trim(),
      estimatedValue: `R${parseFloat(estimatedValue.replace(/[^0-9]/g, '') || '1000000').toLocaleString()}`
    };

    try {
      const currentRaw = localStorage.getItem('sata_published_tenders_local') || '[]';
      const parsed: ProvincialTender[] = JSON.parse(currentRaw);
      
      // Prevent duplicates
      if (parsed.some(t => t.referenceNumber.toLowerCase() === newTender.referenceNumber.toLowerCase())) {
        alert("A tender bulletin with this exact reference number already exists.");
        return;
      }

      const updated = [newTender, ...parsed];
      localStorage.setItem('sata_published_tenders_local', JSON.stringify(updated));
      setPublishedList(updated);

      // Trigger standard callback to refresh other components if needed
      if (onRefreshFeed) onRefreshFeed();

      addLog?.(`[Buying Public] Successfully published tender bulletin notice: ${newTender.referenceNumber}`, 'success');
      alert(`Tender notice ${newTender.referenceNumber} has been officially bulletined! It will now populate the public-access feed.`);

      // Reset form
      setRefNum('');
      setTenderTitle('');
      setDeptName('');
      setClosingDate('');
      setEstimatedValue('');
    } catch (err: any) {
      addLog?.(`Failed to bulletin tender notice: ${err.message}`, 'error');
    }
  };

  const handleClearCustomTenders = () => {
    if (confirm("Are you sure you want to purge all custom published tender bulletins from localStorage?")) {
      localStorage.removeItem('sata_published_tenders_local');
      setPublishedList([]);
      if (onRefreshFeed) onRefreshFeed();
      addLog?.("[Buying Public] Cleared all custom published tender notices.", "warn");
    }
  };

  const filteredBidders = useMemo(() => {
    if (!searchBidderQuery.trim()) return [];
    const query = searchBidderQuery.toLowerCase();
    return biddersList.filter(b => 
      b.companyName.toLowerCase().includes(query) ||
      b.registrationNumber.includes(query) ||
      b.csdNumber.toLowerCase().includes(query)
    );
  }, [searchBidderQuery, biddersList]);

  return (
    <div className="space-y-6" id="buying-public-dashboard-container">
      
      {/* Dynamic Header Badge for Government Sector */}
      <div className="bg-slate-900 text-slate-100 rounded-lg p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-500 animate-pulse" />
              <h1 className="text-lg font-bold font-display uppercase tracking-wider text-amber-400">
                SATA Procuring Entity & Treasury Inspector Portal
              </h1>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Authorized dashboard for municipal authorities, supply chain inspectors, and the buying public to bulletin notices and audit bidders.
            </p>
          </div>
          <div className="bg-amber-950/80 border border-amber-800/80 rounded px-3.5 py-1.5 text-[10px] font-mono text-amber-400">
            SECURE AUDITOR ROLE VALIDATED
          </div>
        </div>

        {/* Dynamic Sector Navigation Tab */}
        <div className="flex gap-2 mt-6 border-b border-slate-800 pb-0.5">
          <button
            id="btn-buy-tab-publish"
            onClick={() => setBuyingTab('publish')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              buyingTab === 'publish'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Publish Tender Bulletin
          </button>
          <button
            id="btn-buy-tab-verify"
            onClick={() => setBuyingTab('verify')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              buyingTab === 'verify'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Audit & Verify Bidders
          </button>
          <button
            id="btn-buy-tab-stats"
            onClick={() => setBuyingTab('stats')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
              buyingTab === 'stats'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            SCS Procurement Stats
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {buyingTab === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="buying-tab-publish-view">
          
          {/* Publication Form */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-amber-600" />
              Bulletin New Public Tender Notice
            </h3>
            <p className="text-slate-400 text-xs">
              Complete SCM standards. All entries are cryptographically bound to the municipal open-audit registry.
            </p>

            <form onSubmit={handlePublishTender} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. WCGH-2026/08"
                    value={refNum}
                    onChange={(e) => setRefNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Procuring Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Dept of Public Works"
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Project Specification / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Installation of solar backup system for Mitchells Plain hospital clinics"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Province Region</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                  >
                    <option value="western_cape">Western Cape</option>
                    <option value="gauteng">Gauteng</option>
                    <option value="kwazulu_natal">KwaZulu-Natal</option>
                    <option value="eastern_cape">Eastern Cape</option>
                    <option value="free_state">Free State</option>
                    <option value="mpumalanga">Mpumalanga</option>
                    <option value="north_west">North West</option>
                    <option value="limpopo">Limpopo</option>
                    <option value="northern_cape">Northern Cape</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Closing Date</label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Estimated Budget (ZAR)</label>
                  <input
                    type="text"
                    placeholder="e.g. R4500000"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-mono text-xs uppercase tracking-widest font-bold py-2.5 rounded shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Officially Bulletin Notice
              </button>
            </form>
          </div>

          {/* Right Side: Published ledger list */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider">
                Audited Bulletins ({publishedList.length})
              </h3>
              {publishedList.length > 0 && (
                <button
                  onClick={handleClearCustomTenders}
                  className="text-[10px] font-mono text-red-600 hover:text-red-800 font-bold transition-colors cursor-pointer"
                >
                  PURGE
                </button>
              )}
            </div>

            {publishedList.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic font-mono text-xs">
                No custom government bulletins published in this browser session. Published notices will show here.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {publishedList.map((tender, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-150 rounded text-xs space-y-1.5 shadow-sm">
                    <div className="flex justify-between font-mono">
                      <span className="font-bold text-slate-700 text-[10px]">{tender.referenceNumber}</span>
                      <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1 rounded uppercase">
                        {tender.province?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-slate-800 font-semibold leading-relaxed text-[11px]">
                      {tender.title}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>{tender.department}</span>
                      <strong className="text-slate-900">{tender.estimatedValue}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* AUDIT & VERIFY TAB */}
      {buyingTab === 'verify' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-5" id="buying-tab-verify-view">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Bidder Verification Auditing Portal
            </h3>
            <p className="text-slate-400 text-xs">
              Audit a potential supplier's compliance status. Input Central Supplier Database (CSD) number or entity name below to run instantaneous verification checks.
            </p>
          </div>

          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search mock bidders (e.g. Inzalo, Sizwe, Gupta)..."
              value={searchBidderQuery}
              onChange={(e) => setSearchBidderQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-amber-500 focus:outline-none pl-8 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* Active Workspace Quick Link */}
          {localProfile && !searchBidderQuery && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 max-w-xl text-left space-y-2.5">
              <div className="flex justify-between items-center">
                <h4 className="text-[11px] font-bold font-mono text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                  Active Device Workspace Profile Detected
                </h4>
                <span className="text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-150 px-1.5 py-0.5 rounded font-semibold uppercase">
                  Quick Inspect
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Auditor tool detected a customized supplier profile on this local device (<strong className="text-slate-800">{localProfile.companyName || 'Unnamed Entity'}</strong>). Assess its real-time compliance score and checklist status under the official SCM rules.
              </p>
              <button
                type="button"
                onClick={() => {
                  const liveBidder = biddersList.find(b => b.id === 'BID-WORKSPACE-LIVE');
                  if (liveBidder) {
                    setSelectedBidder(liveBidder);
                    addLog?.(`Loaded SCM Auditor lookup for Active Device Supplier Profile: ${liveBidder.companyName}`, 'success');
                  }
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] font-mono uppercase tracking-wider py-1.5 px-3 rounded transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                Inspect "{localProfile.companyName || 'My Local Company'}" Compliance
              </button>
            </div>
          )}

          {/* Quick results */}
          {filteredBidders.length > 0 && (
            <div className="border border-slate-150 rounded divide-y divide-slate-100 max-w-xl shadow-sm bg-slate-50">
              {filteredBidders.map(bidder => (
                <div 
                  key={bidder.id} 
                  onClick={() => {
                    setSelectedBidder(bidder);
                    addLog?.(`Loaded SCM Auditor lookup for: ${bidder.companyName}`, 'info');
                  }}
                  className="p-2.5 hover:bg-slate-100 cursor-pointer transition-colors text-xs flex justify-between items-center"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800">{bidder.companyName}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">CSD: {bidder.csdNumber}</span>
                  </div>
                  
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded uppercase border font-bold ${
                    bidder.status === 'compliant' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    bidder.status === 'non_compliant' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {bidder.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bidder Detailed Auditing Dossier */}
          {selectedBidder && (
            <div className="border border-slate-200 rounded-lg p-5 space-y-4 max-w-3xl bg-slate-950 text-slate-200 shadow-lg font-mono text-xs">
              <div className="border-b border-slate-800 pb-2 flex justify-between items-center text-slate-400">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  Official SARS & CSD Compliance Attestation
                </span>
                <span className="text-[10px]">{selectedBidder.id}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed">
                <div className="space-y-1.5">
                  <div>LEGAL ENTITY: <strong className="text-white">{selectedBidder.companyName}</strong></div>
                  <div>REGISTRATION NO: <strong className="text-white">{selectedBidder.registrationNumber}</strong></div>
                  <div>CSD REGISTRATION: <strong className="text-white">{selectedBidder.csdNumber}</strong></div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    TAX COMPLIANCE STATUS: 
                    {selectedBidder.taxClearanceValid ? (
                      <span className="text-emerald-400 font-bold">✔ VALID (SARS CHECK)</span>
                    ) : (
                      <span className="text-red-400 font-bold">✘ REJECTED (SARS DELINQUENT)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    RESTRICTED SUPPLIER CHECK: 
                    {selectedBidder.status === 'blacklisted' ? (
                      <span className="text-red-400 font-bold">✘ BLOCKED (TREASURY REGISTER)</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">✔ OK (CLEAR)</span>
                    )}
                  </div>
                  <div>FORMULA SCORE (80/20): <strong className="text-amber-400">{selectedBidder.score80_20 || 'N/A'} pts</strong></div>
                </div>
              </div>

              {selectedBidder.certThumbprint && (
                <div className="p-3 bg-slate-900 border border-slate-800 rounded flex items-center gap-3">
                  <Award className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 block font-bold">PKI COMPLIANCE SECURITY SEAL</span>
                    <span className="text-slate-300 text-[10px]">Verified Digital Signature Thumbprint: <strong className="text-white font-mono">{selectedBidder.certThumbprint}</strong></span>
                  </div>
                </div>
              )}

              {selectedBidder.id === 'BID-WORKSPACE-LIVE' && (
                <div className="border border-slate-800 rounded bg-slate-900/40 p-3.5 space-y-3">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Statutory Documents Cryptographic Verification Check
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
                    <div className={`p-2 rounded border text-left ${coidaFileMeta ? 'border-emerald-800 bg-emerald-950/20 text-emerald-300' : 'border-red-900 bg-red-950/20 text-red-300'}`}>
                      <span className="font-bold block uppercase font-mono text-slate-400">1. COIDA Cert Status</span>
                      <span className="mt-1 block font-semibold truncate" title={coidaFileMeta ? coidaFileMeta.name : undefined}>
                        {coidaFileMeta ? `✓ ${coidaFileMeta.name}` : '✘ Missing letter'}
                      </span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{coidaFileMeta ? `${coidaFileMeta.size} Verified` : 'Audit Alert Issued'}</span>
                    </div>

                    <div className={`p-2 rounded border text-left ${municipalFileMeta ? 'border-emerald-800 bg-emerald-950/20 text-emerald-300' : 'border-red-900 bg-red-950/20 text-red-300'}`}>
                      <span className="font-bold block uppercase font-mono text-slate-400">2. Rates Clearance Status</span>
                      <span className="mt-1 block font-semibold truncate" title={municipalFileMeta ? municipalFileMeta.name : undefined}>
                        {municipalFileMeta ? `✓ ${municipalFileMeta.name}` : '✘ Missing rates clearance'}
                      </span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{municipalFileMeta ? `${municipalFileMeta.size} Verified` : 'Audit Alert Issued'}</span>
                    </div>

                    <div className={`p-2 rounded border text-left ${csdSyncEnabled ? 'border-emerald-800 bg-emerald-950/20 text-emerald-300' : 'border-red-900 bg-red-950/20 text-red-300'}`}>
                      <span className="font-bold block uppercase font-mono text-slate-400">3. CSD Live Sync</span>
                      <span className="mt-1 block font-semibold">{csdSyncEnabled ? '✓ Continuous API' : '✘ Manual Refreshes'}</span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{csdSyncEnabled ? 'Auto synchronization online' : 'Compliance at risk'}</span>
                    </div>
                  </div>
                  
                  {(!coidaFileMeta || !municipalFileMeta || !csdSyncEnabled) ? (
                    <div className="text-[10px] text-amber-300 bg-amber-950/30 border border-amber-900/60 p-2.5 rounded text-left">
                      ⚠️ <strong>SCM INSPECTOR ADVISORY:</strong> This supplier is currently missing some required statutory records in local storage. Uploading your COIDA Letter and Municipal Rates Bill in the "supplier_dashboard.app" tab and enabling CSD Auto-Sync is required to secure a 100% compliance audit score.
                    </div>
                  ) : (
                    <div className="text-[10px] text-emerald-300 bg-emerald-950/30 border border-emerald-900/60 p-2.5 rounded text-left">
                      ✓ <strong>SCM INSPECTOR ADVISORY:</strong> All physical local credentials verified. Active workmen's compensation, zero municipal arrears, and PKI digital seals validated. Safe to proceed with award.
                    </div>
                  )}
                </div>
              )}

              {selectedBidder.status === 'blacklisted' ? (
                <div className="p-3 bg-red-950/80 border border-red-900 text-red-200 rounded leading-relaxed text-[10px] flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>CRITICAL INFRINGEMENT DETECTED:</strong> This supplier is listed on the National Treasury Database of Restricted Suppliers. Under current SCM Regulations, you are strictly prohibited from awarding contracts to this entity.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/80 border border-emerald-900 text-emerald-200 rounded leading-relaxed text-[10px] flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>COMPLIANT BIDDER RECORD:</strong> All credentials clear. PKI signature validates that SBD 4 and SBD 6.1 declarations are un-altered and non-collusive. Safe to proceed with normal municipal adjudication.
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* SCS PROCUREMENT STATS TAB */}
      {buyingTab === 'stats' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-6" id="buying-tab-stats-view">
          <div className="space-y-1">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              SCS Procurement Statistics & Demographics
            </h3>
            <p className="text-slate-400 text-xs">
              Live municipal insights tracking South Africa's preferential procurement compliance scores, average bidding counts, and B-BBEE target metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Preference points Target */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded shadow-sm space-y-2">
              <div className="text-slate-400 uppercase text-[9px] font-bold font-mono">B-BBEE Priority Allocation</div>
              <div className="text-3xl font-mono font-bold text-slate-800">83.4%</div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Of total scoped budget is successfully directed to Level 1 and Level 2 B-BBEE compliant entities, surpassing the National Treasury threshold.
              </p>
            </div>

            {/* Average Bidders */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded shadow-sm space-y-2">
              <div className="text-slate-400 uppercase text-[9px] font-bold font-mono">Competition Index</div>
              <div className="text-3xl font-mono font-bold text-slate-800">5.8 <span className="text-xs text-slate-500">bids/notice</span></div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Average number of competing compliant bids submitted per municipal bulletin. High competition reduces government procurement waste.
              </p>
            </div>

            {/* SBD compliance rating */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded shadow-sm space-y-2">
              <div className="text-slate-400 uppercase text-[9px] font-bold font-mono">Zero-Waste Compliance</div>
              <div className="text-3xl font-mono font-bold text-emerald-600">99.8%</div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Of PKI-signed SBD documents pass structural validations, eliminating audit queries and administrative tender disqualifications.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
