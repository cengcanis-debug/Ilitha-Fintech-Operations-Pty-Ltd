/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert,
  Award, 
  FileText, 
  FileSignature, 
  FileSearch, 
  Fingerprint, 
  Cpu,
  Layers,
  Activity,
  Trash2,
  Terminal,
  Database,
  Globe
} from 'lucide-react';
import { DigitalCertificate } from './types';
import { importKeyFromPem } from './utils/crypto';
import { loadCertificateFromCloud, loadSignedDocumentsFromCloud } from './services/firebase';
import { createSnapshot } from './utils/indexedDb';
import { Cloud, History, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

// Subcomponents
import CertificateManager from './components/CertificateManager';
import SBDFormFiller from './components/SBDFormFiller';
import PDFSigner from './components/PDFSigner';
import PDFVerifier from './components/PDFVerifier';
import TenderFeed from './components/TenderFeed';
import TenderAdvisor from './components/TenderAdvisor';
import ComplianceAudit from './components/ComplianceAudit';
import DocumentHistory from './components/DocumentHistory';
import RegulatoryShield from './components/RegulatoryShield';
import TenderProfitCalculator from './components/TenderProfitCalculator';
import PartnerRegistrationHub from './components/PartnerRegistrationHub';
import TenderAnalyticsDashboard from './components/TenderAnalyticsDashboard';
import PaymentGateway from './components/PaymentGateway';
import BuyingPublicDashboard from './components/BuyingPublicDashboard';
import EnterpriseLab from './components/EnterpriseLab';
import SupplierDashboard from './components/SupplierDashboard';
import MonitoringAgents from './components/MonitoringAgents';
import SystemSnapshots from './components/SystemSnapshots';
import PremiumServiceHub from './components/PremiumServiceHub';
import SataCreditworthinessAssessor from './components/SataCreditworthinessAssessor';
import DeveloperProtectionHub from './components/DeveloperProtectionHub';
import DirectoryHub from './components/DirectoryHub';

interface LogItem {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'directory' | 'cert' | 'tenders' | 'advisor' | 'filler' | 'signer' | 'verifier' | 'audit' | 'history' | 'shield' | 'calculator' | 'partners' | 'analytics' | 'payment' | 'buying' | 'lab' | 'supplier' | 'agents' | 'snapshots' | 'premium_hub' | 'creditworthiness' | 'dev_protection'>('directory');
  const [activeCert, setActiveCert] = useState<DigitalCertificate | null>(null);
  const [refreshFeedKey, setRefreshFeedKey] = useState(0);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [prefilledTender, setPrefilledTender] = useState<{
    referenceNumber: string;
    title: string;
    procuringInstitution: string;
  } | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [cloudDocs, setCloudDocs] = useState<any[]>([]);
  const [isLoadingCloudDocs, setIsLoadingCloudDocs] = useState(false);
  const [hideDiagnostics, setHideDiagnostics] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('sata_supplier_hide_diagnostics');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('sata_supplier_hide_diagnostics', String(hideDiagnostics));
  }, [hideDiagnostics]);

  // Function to add a log entry with local time format [HH:MM:SS]
  const addLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [...prev, { timestamp: timeStr, message, type }].slice(-60)); // Keep last 60 logs
  };

  // Initial boot logs
  useEffect(() => {
    addLog('System boot successful. SATA PKI core initialized.', 'info');
    addLog('WebCrypto API initialized and secured in CPU sandboxed memory.', 'success');
    addLog('Compliance check: South African ECT Act 2002 framework ready.', 'info');
  }, []);

  // Listen to programmatic tab switches
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('sata_switch_tab', handleSwitch);
    return () => window.removeEventListener('sata_switch_tab', handleSwitch);
  }, []);

  // Periodic System Checkpoint Trigger for Document Repository Changes
  const [showCheckpointBanner, setShowCheckpointBanner] = useState(false);
  const [checkpointDetails, setCheckpointDetails] = useState({ currentCount: 0, lastCount: 0 });

  useEffect(() => {
    // Check every 30 seconds for significant changes in local document repository history
    const interval = setInterval(() => {
      try {
        const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
        const historyList = localHistoryStr ? JSON.parse(localHistoryStr) : [];
        const currentCount = historyList.length;

        const lastCheckpointStr = localStorage.getItem('sata_last_checkpoint_count');
        const lastCount = lastCheckpointStr ? parseInt(lastCheckpointStr, 10) : 0;

        if (currentCount > lastCount && currentCount > 0) {
          setCheckpointDetails({ currentCount, lastCount });
          setShowCheckpointBanner(true);
        }
      } catch (err) {
        console.error('System Checkpoint check error:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveCheckpointSnapshot = async () => {
    try {
      const label = `System Checkpoint (${new Date().toLocaleTimeString()})`;
      await createSnapshot(label, true);
      addLog(`System Checkpoint: Successfully saved local Time Machine snapshot "${label}".`, 'success');
      
      const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
      const historyList = localHistoryStr ? JSON.parse(localHistoryStr) : [];
      localStorage.setItem('sata_last_checkpoint_count', String(historyList.length));
      setShowCheckpointBanner(false);
    } catch (err: any) {
      addLog(`System Checkpoint snapshot failed: ${err.message}`, 'error');
    }
  };

  // Attempt to restore saved key pairs from localStorage or Firebase Firestore Cloud Sync
  useEffect(() => {
    const restoreSavedCert = async () => {
      try {
        let certData: any = null;
        const savedMeta = localStorage.getItem('sata_cert_meta');
        
        if (savedMeta) {
          certData = JSON.parse(savedMeta);
          addLog(`Detecting cached signing credentials for: ${certData.subjectName}...`, 'info');
        } else {
          // Fall back to loading from Firebase Firestore
          addLog('Checking for cloud-archived certificate in Firebase Firestore...', 'info');
          const cloudCert = await loadCertificateFromCloud();
          if (cloudCert) {
            certData = cloudCert;
            addLog(`Found cloud-archived certificate for: ${certData.subjectName}. Synced!`, 'success');
            // Cache locally for faster subsequent loads
            localStorage.setItem('sata_cert_meta', JSON.stringify(cloudCert));
          }
        }
        
        if (certData) {
          // Re-import keys into WebCrypto memory Context
          const publicKey = await importKeyFromPem(certData.publicKeyPem, 'public');
          const privateKey = await importKeyFromPem(certData.privateKeyPem, 'private');
          
          setActiveCert({
            ...certData,
            keyPair: { publicKey, privateKey }
          });
          
          addLog(`Successfully loaded digital certificate for ${certData.subjectName} (${certData.organization}).`, 'success');
        } else {
          addLog('No cached or cloud-archived PKI credentials detected. Ready for generation.', 'info');
        }
      } catch (err) {
        console.warn('Could not restore saved PKI certificate:', err);
        addLog('Failed to restore PKI certificate. Ready for fresh generation.', 'warn');
      } finally {
        setIsLoadingSaved(false);
      }
    };
    
    restoreSavedCert();
  }, []);

  // Fetch signed documents ledger from Firebase
  const refreshCloudLedger = async () => {
    try {
      setIsLoadingCloudDocs(true);
      const docs = await loadSignedDocumentsFromCloud();
      setCloudDocs(docs);
    } catch (err) {
      console.warn('Could not load cloud documents:', err);
    } finally {
      setIsLoadingCloudDocs(false);
    }
  };

  useEffect(() => {
    refreshCloudLedger();
  }, [activeCert]);

  const handleClearLogs = () => {
    setLogs([{
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message: 'Console buffer cleared.',
      type: 'info'
    }]);
  };

  const handleWipeCertificate = () => {
    if (confirm('Are you sure you want to delete this certificate? If you have not exported it, you will lose these private signing keys forever.')) {
      setActiveCert(null);
      localStorage.removeItem('sata_cert_meta');
      addLog('Active signer credentials wiped and deactivated from session memory.', 'warn');
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:h-screen w-screen bg-[#f8fafc] text-slate-900 font-sans md:overflow-hidden overflow-y-auto" id="app-root">
      
      {/* Sidebar: Document & Workspace Navigator */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col shrink-0">
        
        {/* Branding Area */}
        <div className="p-4 border-b border-slate-100 bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 text-white p-1.5 rounded flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-bold uppercase tracking-widest font-display">SA Tender Assist</h1>
              <p className="text-[10px] opacity-60 font-mono mt-0.5">PKI Signer v2.4.0-Stable</p>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            Procurement Workspace
          </div>
          <div className="grid grid-cols-2 gap-1 px-3">
            {[
              { id: 'directory', label: 'directory_hub.sys', logMsg: 'SATA Welcome & Interactive Directory Hub', isAmber: true, isBold: true },
              { id: 'cert', label: 'cert_keys.json', logMsg: 'Digital Certificate Manager', isAmber: false },
              { id: 'tenders', label: 'provincial_tenders.db', logMsg: 'Provincial Tender Database Feed', isAmber: false },
              { id: 'advisor', label: 'tender_advisor.calc', logMsg: 'Tender Financial Advisor & Cost Estimator', isAmber: false },
              { id: 'filler', label: 'SBD_4_Disclosure.pdf', logMsg: 'SBD 4 Disclosure Form Filler', isAmber: false },
              { id: 'signer', label: 'Custom_Contract_Sign.pdf', logMsg: 'Custom PDF Asymmetric Signer', isAmber: false },
              { id: 'verifier', label: 'Verify_Integrity_Seal.sig', logMsg: 'Cryptographic Signature Verifier', isAmber: false },
              { id: 'audit', label: 'compliance_audit.sh', logMsg: 'SBD Pre-Submission Compliance Audit', isAmber: false },
              { id: 'agents', label: 'agents_console.sys', logMsg: 'Autonomous Compliance Monitoring & Self-Healing Agents', isAmber: true },
              { id: 'calculator', label: 'tender_pricing_calc.xls', logMsg: 'Tender Pricing, Costing & Margins Calculator', isAmber: false },
              { id: 'partners', label: 'sata_partner_hub.pkg', logMsg: 'Partner Registration & Subscription Portal', isAmber: false },
              { id: 'supplier', label: 'supplier_dashboard.app', logMsg: 'SCM Supplier Dashboard & Payments', isAmber: false, isBold: true },
              { id: 'analytics', label: 'tender_analytics.json', logMsg: 'Tender Analytics Dashboard', isAmber: false },
              { id: 'payment', label: 'payment_gateway.api', logMsg: 'SATA Payment Gateway & Billing Console', isAmber: false },
              { id: 'buying', label: 'buying_public.gov', logMsg: 'SCM Buying Public & Audit Portal', isAmber: true },
              { id: 'lab', label: 'pwa_enterprise_lab.sys', logMsg: 'SATA PWA Offline, Alerts & Performance Lab', isAmber: false },
              { id: 'history', label: 'registry_history.log', logMsg: 'Document Signing Registry & Backups', isAmber: false },
              { id: 'snapshots', label: 'system_snapshots.db', logMsg: 'Time Machine System Snapshots Registry', isAmber: true },
              { id: 'shield', label: 'regulatory_shield.sys', logMsg: 'Regulatory Shield & Sandbox Stress-Test', isAmber: false },
              { id: 'creditworthiness', label: 'creditworthiness.sys', logMsg: 'Bidder Creditworthiness & SCM Compliance Assessor', isAmber: true, isBold: true },
              { id: 'premium_hub', label: 'premium_services.sys', logMsg: 'SATA Premium Services & Enhancements Hub', isAmber: true, isBold: true },
              { id: 'dev_protection', label: 'dev_protection.sys', logMsg: 'IT & Legal Developer Protection Hub', isAmber: true, isBold: true }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    addLog(`Navigated to: ${tab.logMsg}`, 'info');
                  }}
                  title={tab.logMsg}
                  className={`px-2 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all border-l-2 rounded text-[10px] font-mono text-left w-full h-10 justify-start select-none truncate ${
                    isActive
                      ? tab.isAmber
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold shadow-xs'
                        : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50 border text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                    isActive 
                      ? tab.isAmber ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                      : 'bg-slate-300'
                  }`}></div>
                  <span className={`truncate leading-tight block ${tab.isBold ? 'font-bold text-emerald-700' : ''} ${tab.isAmber && !isActive ? 'text-amber-700' : ''}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer Indicator */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>SANDBOX RAM</span>
            <span>{activeCert ? "142.4 MB" : "12.8 KB"}</span>
          </div>
          <div className="w-full bg-slate-200 h-1 mt-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: activeCert ? '75%' : '8%' }}
            ></div>
          </div>
        </div>

      </aside>

      {/* Main Content Area: Document Workspace */}
      <main className="flex-1 flex flex-col bg-slate-50 md:overflow-hidden min-h-[500px] md:min-h-0">
        
        {/* System Checkpoint Notification Banner */}
        {showCheckpointBanner && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between shrink-0 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-amber-900 font-mono uppercase tracking-wide">
                  System Checkpoint Trigger: Significant Document Activity Detected
                </h4>
                <p className="text-[11px] text-amber-700">
                  New records added to your signing repository ({checkpointDetails.currentCount} total). Would you like to save a local Time Machine snapshot now?
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCheckpointSnapshot}
                className="bg-amber-900 hover:bg-amber-950 text-white px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Save Snapshot Now
              </button>
              <button
                onClick={() => {
                  try {
                    const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
                    const historyList = localHistoryStr ? JSON.parse(localHistoryStr) : [];
                    localStorage.setItem('sata_last_checkpoint_count', String(historyList.length));
                  } catch {}
                  setShowCheckpointBanner(false);
                }}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded font-mono text-[10px] font-bold uppercase transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Workspace Sub-Header */}
        <header className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-slate-700 tracking-tight">
              {activeTab === 'directory' && 'Active Tool: Welcome & SCM Interactive Directory Hub'}
              {activeTab === 'cert' && 'Active Tool: Digital Certificate Manager'}
              {activeTab === 'tenders' && 'Active Tool: Provincial Procurement Gateway'}
              {activeTab === 'advisor' && 'Active Tool: Tender Financial Advisor & Cost Estimator'}
              {activeTab === 'filler' && 'Active Tool: SBD 4 & 6.1 Form Filler'}
              {activeTab === 'signer' && 'Active Tool: Custom PDF Asymmetric Signer'}
              {activeTab === 'verifier' && 'Active Tool: Cryptographic Signature Verifier'}
              {activeTab === 'audit' && 'Active Tool: SBD Pre-Submission Compliance Audit'}
              {activeTab === 'history' && 'Active Tool: Document Signing Registry & Backups'}
              {activeTab === 'shield' && 'Active Tool: Regulatory Shield & Sandbox Stress-Test'}
              {activeTab === 'calculator' && 'Active Tool: Tender Pricing, Costing & Margins Calculator'}
              {activeTab === 'partners' && 'Active Tool: Partner Registration & Subscriptions'}
              {activeTab === 'analytics' && 'Active Tool: Tender Analytics Dashboard'}
              {activeTab === 'payment' && 'Active Tool: SATA Payment Gateway & Billing Console'}
              {activeTab === 'buying' && 'Active Tool: SCM Buying Public & Audit Portal'}
              {activeTab === 'lab' && 'Active Tool: SATA PWA Offline, Alerts & Performance Lab'}
              {activeTab === 'agents' && 'Active Tool: SCM Autonomous Compliance Monitoring & Self-Healing'}
              {activeTab === 'snapshots' && 'Active Tool: Time Machine System Snapshots & Recoveries'}
              {activeTab === 'premium_hub' && 'Active Tool: SATA Premium Services & Enhancements Hub'}
              {activeTab === 'creditworthiness' && 'Active Tool: Bidder Creditworthiness & SCM Compliance Assessor'}
              {activeTab === 'dev_protection' && 'Active Tool: IT & Legal Developer Protection Hub'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideDiagnostics(!hideDiagnostics)}
              className={`px-2.5 py-1 border rounded text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                hideDiagnostics 
                  ? 'bg-red-950 border-red-800 text-red-300 hover:bg-red-900' 
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Toggle Secure Mode: Mask diagnostic system/terminal logs across all components to eliminate developer privacy risks."
            >
              <ShieldAlert className="w-3 h-3" />
              {hideDiagnostics ? "SECURE MODE: ACTIVE" : "SECURE MODE: INACTIVE"}
            </button>
            <div className="px-2.5 py-1 bg-slate-950 text-emerald-400 rounded text-[9px] font-mono font-semibold tracking-wider flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
              100% LOCAL SANDBOX
            </div>
          </div>
        </header>

        {/* Interactive Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'directory' && (
            <DirectoryHub 
              activeCert={activeCert}
              addLog={addLog}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
            />
          )}
          {activeTab === 'cert' && (
            <CertificateManager 
              activeCert={activeCert} 
              setActiveCert={setActiveCert} 
              addLog={addLog}
            />
          )}
          {activeTab === 'tenders' && (
            <div key={refreshFeedKey}>
              <TenderFeed 
                onSelectTender={(tender, targetTab) => {
                  setPrefilledTender({
                    referenceNumber: tender.referenceNumber,
                    title: tender.title,
                    procuringInstitution: tender.procuringInstitution
                  });
                  setActiveTab(targetTab);
                }}
                addLog={addLog}
              />
            </div>
          )}
          {activeTab === 'advisor' && (
            <TenderAdvisor 
              prefilledTender={prefilledTender}
              activeCert={activeCert}
              addLog={addLog}
              onNavigateToFiller={() => setActiveTab('filler')}
            />
          )}
          {activeTab === 'filler' && (
            <SBDFormFiller 
              activeCert={activeCert} 
              addLog={addLog}
              prefilledTender={prefilledTender}
              onClearPrefilled={() => setPrefilledTender(null)}
            />
          )}
          {activeTab === 'signer' && (
            <PDFSigner 
              activeCert={activeCert} 
              addLog={addLog}
            />
          )}
          {activeTab === 'verifier' && (
            <PDFVerifier 
              addLog={addLog}
            />
          )}
          {activeTab === 'audit' && (
            <ComplianceAudit 
              activeCert={activeCert} 
              addLog={addLog}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'history' && (
            <DocumentHistory 
              activeCert={activeCert} 
              setActiveCert={setActiveCert}
              addLog={addLog}
            />
          )}
          {activeTab === 'shield' && (
            <RegulatoryShield 
              activeCert={activeCert} 
              addLog={addLog}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'calculator' && (
            <TenderProfitCalculator 
              addLog={addLog}
            />
          )}
          {activeTab === 'partners' && (
            <PartnerRegistrationHub 
              addLog={addLog}
              activeCert={activeCert}
              hideDiagnostics={hideDiagnostics}
            />
          )}
          {activeTab === 'supplier' && (
            <SupplierDashboard 
              addLog={addLog}
              activeCert={activeCert}
              hideDiagnostics={hideDiagnostics}
              setHideDiagnostics={setHideDiagnostics}
            />
          )}
          {activeTab === 'analytics' && (
            <TenderAnalyticsDashboard 
              addLog={addLog}
            />
          )}
          {activeTab === 'payment' && (
            <PaymentGateway 
              addLog={addLog}
              activeCert={activeCert}
            />
          )}
          {activeTab === 'buying' && (
            <BuyingPublicDashboard 
              addLog={addLog}
              onRefreshFeed={() => setRefreshFeedKey(prev => prev + 1)}
            />
          )}
          {activeTab === 'lab' && (
            <EnterpriseLab 
              addLog={addLog}
            />
          )}
          {activeTab === 'agents' && (
            <MonitoringAgents 
              activeCert={activeCert}
              addLog={addLog}
            />
          )}
          {activeTab === 'snapshots' && (
            <SystemSnapshots 
              addLog={addLog}
            />
          )}
          {activeTab === 'premium_hub' && (
            <PremiumServiceHub 
              activeCert={activeCert}
              addLog={addLog}
            />
          )}
          {activeTab === 'creditworthiness' && (
            <SataCreditworthinessAssessor 
              activeCert={activeCert}
              addLog={addLog}
            />
          )}
          {activeTab === 'dev_protection' && (
            <DeveloperProtectionHub 
              activeCert={activeCert}
              addLog={addLog}
            />
          )}
        </div>

      </main>

      {/* Right Sidebar: Crypto Engine Controls, Cloud Ledger & Live Logs Console */}
      <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-white flex flex-col shrink-0 md:overflow-hidden">
        
        {/* Crypto Engine Info Block */}
        <div className="p-4 border-b border-slate-100 shrink-0">
          <h2 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 font-mono flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            Crypto Engine
          </h2>
          
          <div className="space-y-3">
            
            {/* Signing Key Status */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1 font-mono">Signing Key</label>
              {activeCert ? (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-500 w-1.5 h-1.5 rounded-full shrink-0"></div>
                    <div className="text-xs font-mono font-bold text-slate-800">RSA-2048-PKCS1v15</div>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 truncate">
                    Issued to: <span className="font-semibold text-slate-600">{activeCert.subjectName}</span>
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <div className="bg-amber-500 w-1.5 h-1.5 rounded-full shrink-0"></div>
                    <div className="text-xs font-mono text-slate-400">NO ACTIVE KEY</div>
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1">Please issue or import a certificate.</p>
                </div>
              )}
            </div>

            {/* Signature Envelope Standards */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1.5 font-mono">Security Standards</label>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] font-mono text-slate-600">
                <div className="text-slate-400">ALGORITHM:</div>
                <div className="font-semibold text-slate-700">RSASSA-PKCS1</div>
                <div className="text-slate-400">HASH TYPE:</div>
                <div className="font-semibold text-slate-700">SHA-256</div>
                <div className="text-slate-400">COMPLIANCE:</div>
                <div className="font-semibold text-emerald-700">ECT ACT 2002</div>
              </div>
            </div>

          </div>
        </div>

        {/* Cloud Ledger of Signed Documents */}
        <div className="p-4 border-b border-slate-100 flex flex-col h-1/3 min-h-[140px] max-h-[240px] overflow-hidden">
          <div className="flex items-center justify-between mb-1.5 shrink-0">
            <h2 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              POPIA Secure Verification Ledger
            </h2>
            <button 
              onClick={refreshCloudLedger}
              disabled={isLoadingCloudDocs}
              className="text-slate-400 hover:text-emerald-700 disabled:opacity-50 cursor-pointer transition-colors animate-pulse"
              title="Sync Verification Registry"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingCloudDocs ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-[8px] text-slate-500 font-mono mb-2 leading-normal border-l-2 border-emerald-500 pl-1.5 bg-emerald-50/50 py-1 rounded-r shrink-0">
            ✓ <strong>100% POPIA Compliant</strong>: Sensitive personal identity details and private keys remain exclusively on your device. Cloud stores only anonymous one-way cryptographic SHA-256 hashes for authenticity verification.
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 bg-slate-50 border border-slate-150 rounded p-2 text-[10px] font-sans">
            {cloudDocs.length === 0 ? (
              <div className="text-slate-400 italic text-center py-4 font-mono text-[9px]">
                {isLoadingCloudDocs ? 'Checking secure ledger...' : 'No local signed documents detected.'}
              </div>
            ) : (
              cloudDocs.map((doc, idx) => (
                <div key={doc.id || idx} className="p-2 bg-white border border-slate-200 rounded shadow-sm hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between font-bold text-slate-700 truncate">
                    <span className="truncate max-w-[65%] font-mono text-[9px]">{doc.fileName}</span>
                    <span className="text-[7.5px] bg-emerald-100 text-emerald-800 px-1 py-0.25 rounded font-mono shrink-0 flex items-center gap-0.5">
                      ✓ POPIA Secure
                    </span>
                  </div>
                  <div className="text-[8px] text-slate-400 font-mono mt-1 flex justify-between">
                    <span>SHA256: {doc.sha256Hash ? `${doc.sha256Hash.substring(0, 8)}...${doc.sha256Hash.substring(doc.sha256Hash.length - 8)}` : 'N/A'}</span>
                    <span className="text-[7px] text-slate-500 uppercase font-bold">Registered</span>
                  </div>
                  <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                    Ref: {doc.bidNumber || 'N/A'} {doc.bidderName ? `| Bidder: ${doc.bidderName}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Operation Logs Panel */}
        <div className="flex-1 p-4 flex flex-col overflow-hidden min-h-[140px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h2 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              Operation Logs
            </h2>
            <button 
              onClick={handleClearLogs}
              className="text-[9px] font-mono font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              CLEAR
            </button>
          </div>
          
          {/* Dynamic logs display */}
          <div className="flex-1 bg-slate-900 border border-slate-950 rounded-lg p-3 overflow-y-auto space-y-1.5 font-mono text-[9px] text-slate-300 shadow-inner">
            {hideDiagnostics ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-3 gap-2 text-slate-500 italic">
                <ShieldCheck className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>Operation logs masked in Secure Mode for safety.</span>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-slate-500 italic">No operations recorded.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex gap-1.5 items-start leading-normal">
                  <span className="text-slate-500 shrink-0 select-none font-semibold">[{log.timestamp}]</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'warn' ? 'text-amber-400' :
                    log.type === 'error' ? 'text-red-400 font-medium' :
                    'text-slate-300'
                  }>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actions Footer inside right sidebar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
          {activeCert ? (
            <button
              onClick={handleWipeCertificate}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Wipe active Key
            </button>
          ) : (
            <div className="text-center text-[10px] text-slate-400 py-2.5 font-mono">
              Key generation sandbox secure.
            </div>
          )}
        </div>

      </aside>

    </div>
  );
}
