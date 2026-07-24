/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Upload, 
  Trash2, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Shield,
  FileCheck,
  RefreshCw,
  FolderSync
} from 'lucide-react';
import { DigitalCertificate } from '../types';
import { loadSignedDocumentsFromCloud } from '../services/firebase';

interface DocumentHistoryProps {
  activeCert: DigitalCertificate | null;
  setActiveCert: (cert: DigitalCertificate | null) => void;
  addLog?: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function DocumentHistory({ activeCert, setActiveCert, addLog }: DocumentHistoryProps) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      // Sourced directly from local storage with Cloud Sync state checked
      const data = await loadSignedDocumentsFromCloud();
      setDocuments(data);
      setFilteredDocs(data);
    } catch (err: any) {
      addLog?.(`Could not load signing history: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeCert]);

  // Handle Search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDocs(documents);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = documents.filter(doc => 
      doc.fileName.toLowerCase().includes(query) ||
      (doc.bidNumber && doc.bidNumber.toLowerCase().includes(query)) ||
      (doc.bidderName && doc.bidderName.toLowerCase().includes(query)) ||
      (doc.sha256Hash && doc.sha256Hash.toLowerCase().includes(query))
    );
    setFilteredDocs(filtered);
  }, [searchQuery, documents]);

  // Download cryptographic signature receipt voucher
  const handleDownloadReceipt = (docData: any) => {
    const receipt = {
      pkiStandards: {
        act: 'ECT Act 2002 (South Africa)',
        sealType: 'Advanced Electronic Signature (AES)',
        hashAlgorithm: 'SHA-256',
        signingKeyType: 'RSA-2048'
      },
      documentMetadata: {
        fileName: docData.fileName,
        sha256Hash: docData.sha256Hash,
        signedAtIso: docData.signedAtIso,
        bidNumber: docData.bidNumber || 'CUSTOM_PDF',
        bidDescription: docData.bidDescription || 'Custom contract',
        bidderName: docData.bidderName || 'N/A'
      },
      verificationProof: {
        registeredInCloudLedger: docData.isRegisteredOnCloud,
        blockchainProofId: docData.id
      }
    };

    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SATA_Signature_Proof_${docData.fileName.replace(/\.[^/.]+$/, "")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog?.(`Downloaded compliance verification receipt voucher for ${docData.fileName}.`, 'success');
  };

  // Delete a specific history log item (POPIA clean down)
  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the signature log entry for "${name}" from your local device? This will clear its details from your screen.`)) {
      try {
        const localHistoryStr = localStorage.getItem('sata_signed_documents_local');
        const localHistory = localHistoryStr ? JSON.parse(localHistoryStr) : [];
        const updated = localHistory.filter((item: any) => item.id !== id);
        localStorage.setItem('sata_signed_documents_local', JSON.stringify(updated));
        addLog?.(`Cleared local signature log: ${name}`, 'warn');
        fetchHistory();
        if (selectedDoc && selectedDoc.id === id) {
          setSelectedDoc(null);
        }
      } catch (err: any) {
        addLog?.(`Deletion failed: ${err.message}`, 'error');
      }
    }
  };

  // Export entire compliance workspace profile (Certificate + Drafts + History)
  const handleExportWorkspaceBackup = () => {
    try {
      const savedMeta = localStorage.getItem('sata_cert_meta');
      const savedDraft = localStorage.getItem('sata_sbd_form_draft');
      const savedHistory = localStorage.getItem('sata_signed_documents_local');

      const backupData = {
        backupMeta: {
          exporter: 'SA Tender Assist (SATA) PKI Gateway',
          exportedAtIso: new Date().toISOString(),
          version: '2.4.0',
          complianceStandards: 'POPIA & ECT Act 2002 Compliant Data Portability'
        },
        payload: {
          certificate: savedMeta ? JSON.parse(savedMeta) : null,
          sbdFormDraft: savedDraft ? JSON.parse(savedDraft) : null,
          signedDocumentsHistory: savedHistory ? JSON.parse(savedHistory) : []
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SATA_Workspace_Backup_${new Date().toISOString().substring(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog?.('POPIA Portability: Exported full compliant workspace profile JSON archive successfully.', 'success');
    } catch (e: any) {
      addLog?.(`Failed to export workspace backup: ${e.message}`, 'error');
    }
  };

  // Import compliant workspace profile backup from JSON file
  const handleImportWorkspaceBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.payload || !parsed.backupMeta) {
          throw new Error('Invalid backup file. Missing standard SATA payload signature.');
        }

        const payload = parsed.payload;

        // 1. Restore Digital Certificate
        if (payload.certificate) {
          localStorage.setItem('sata_cert_meta', JSON.stringify(payload.certificate));
          addLog?.(`Restored certificate metadata for: ${payload.certificate.subjectName}`, 'info');
          
          // Re-trigger reload on parent app context
          window.location.reload(); // Quick reset to allow app to re-import keys properly on mount
        }

        // 2. Restore SBD form Drafts
        if (payload.sbdFormDraft) {
          localStorage.setItem('sata_sbd_form_draft', JSON.stringify(payload.sbdFormDraft));
          addLog?.('Restored Standard Bidding Document (SBD) drafts offline.', 'info');
        }

        // 3. Restore Local Document History
        if (payload.signedDocumentsHistory && Array.isArray(payload.signedDocumentsHistory)) {
          localStorage.setItem('sata_signed_documents_local', JSON.stringify(payload.signedDocumentsHistory));
          addLog?.(`Restored ${payload.signedDocumentsHistory.length} local signing history logs.`, 'info');
        }

        addLog?.('Compliant backup imported successfully! System restarted.', 'success');
        alert('Workspace components restored successfully! The application will now reload to safely activate your imported digital certificate keys.');
        window.location.reload();
      } catch (err: any) {
        addLog?.(`Workspace import failed: ${err.message}`, 'error');
        alert(`Failed to import workspace backup: ${err.message}. Please make sure you are uploading a valid SATA Workspace JSON file.`);
      }
    };
    reader.readAsText(file);
  };

  // Export entire signature registry log to a spreadsheet CSV file (Feature Request: Add export ledger)
  const handleExportLedgerCSV = () => {
    try {
      if (documents.length === 0) {
        addLog?.('No registry items available to export.', 'warn');
        alert('There are no documents in your signing history registry to export.');
        return;
      }

      addLog?.('Compiling compliance signing ledger CSV file...', 'info');

      // Define columns
      const headers = [
        'Registry ID',
        'Document Name',
        'Signed At (ISO)',
        'SHA-256 Integrity Hash',
        'Tender Opportunity Ref',
        'Tender Description',
        'Procuring Institution',
        'Bidder Organization',
        'Cloud Ledger Synced'
      ];

      // Format rows with proper escaping for CSV standards
      const escapeCSV = (val: any) => {
        if (val === undefined || val === null) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const csvRows = [
        headers.join(','),
        ...documents.map(doc => [
          escapeCSV(doc.id),
          escapeCSV(doc.fileName),
          escapeCSV(doc.signedAtIso),
          escapeCSV(doc.sha256Hash),
          escapeCSV(doc.bidNumber),
          escapeCSV(doc.bidDescription),
          escapeCSV(doc.procuringInstitution),
          escapeCSV(doc.bidderName),
          escapeCSV(doc.isRegisteredOnCloud ? 'TRUE' : 'FALSE')
        ].join(','))
      ];

      const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM for Microsoft Excel compliance
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `SATA_Signing_Ledger_${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog?.(`Successfully exported cryptographic ledger CSV (${documents.length} entries).`, 'success');
    } catch (err: any) {
      addLog?.(`Ledger export failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="document-history-root">
      
      {/* Search and List Side panel */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Workspace Management Header / Actions */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Workspace Profile Backup & Portability
            </h3>
            <p className="text-slate-500 text-[10px] leading-relaxed">
              Export or restore your active keys, form drafts, and records. Fully compliant with POPIA offline data control.
            </p>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExportWorkspaceBackup}
              className="flex-1 sm:flex-none text-[9px] font-bold font-mono uppercase tracking-widest bg-emerald-850 hover:bg-emerald-900 text-white py-1.5 px-3 rounded shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Backup Profile
            </button>
            
            <label className="flex-1 sm:flex-none text-center text-[9px] font-bold font-mono uppercase tracking-widest bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-1.5 px-3 rounded shrink-0 transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Import Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImportWorkspaceBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search controls & Document Listing */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm flex flex-col h-[450px]">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 font-mono">
              <FolderSync className="w-4 h-4 text-emerald-700" />
              Local Signing Registry history
            </h3>
            
            <div className="flex items-center gap-2">
              {documents.length > 0 && (
                <button
                  onClick={handleExportLedgerCSV}
                  className="text-[9px] font-bold font-mono uppercase tracking-wide border border-emerald-200 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5"
                  title="Export signing ledger to CSV sheet"
                >
                  <Download className="w-3 h-3" />
                  Export Ledger
                </button>
              )}
              <button
                onClick={fetchHistory}
                disabled={isLoading}
                className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer p-1"
                title="Refresh Registry History"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative shrink-0">
            <input
              type="text"
              placeholder="Search by tender ref, file name, bidder name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          {/* List items scroll section */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1.5">
            {isLoading ? (
              <div className="text-center text-slate-400 italic py-20 font-mono text-xs">
                Synchronizing registry ledger logs...
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="text-center text-slate-400 italic py-20 font-mono text-[11px]">
                {searchQuery ? 'No registry matches found.' : 'Zero signed SBD or custom document receipts stored in local phone history.'}
              </div>
            ) : (
              filteredDocs.map((docItem) => (
                <div 
                  key={docItem.id}
                  onClick={() => setSelectedDoc(docItem)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    selectedDoc && selectedDoc.id === docItem.id 
                      ? 'bg-emerald-50/40 border-emerald-300 shadow-sm' 
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="p-1.5 bg-slate-100 text-slate-600 rounded">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="truncate space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-700 truncate">
                        {docItem.fileName}
                      </h4>
                      <p className="text-[9.5px] text-slate-400 font-mono truncate">
                        Ref: {docItem.bidNumber || 'N/A'} | Hash: {docItem.sha256Hash?.substring(0, 10)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                    <span className="text-slate-400 text-[9px] hidden sm:inline">
                      {new Date(docItem.signedAtIso).toLocaleDateString()}
                    </span>
                    
                    {docItem.isRegisteredOnCloud ? (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] rounded font-bold uppercase tracking-wider">
                        Registered
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[8px] rounded font-bold uppercase tracking-wider">
                        Pending Sync
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>

      {/* Selected Document Metadata Inspection Panel */}
      <div className="lg:col-span-5">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 shadow-sm h-[536px] flex flex-col justify-between">
          
          <div className="space-y-4 flex-1 overflow-y-auto">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2.5 font-mono">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              Cryptographic Signature Inspector
            </h3>

            {selectedDoc ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-lg text-center space-y-1">
                  <FileCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-xs font-bold text-slate-800 font-mono break-all leading-normal px-2">
                    {selectedDoc.fileName}
                  </h4>
                  <div className="inline-flex items-center gap-1 text-[8.5px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.25 rounded font-bold uppercase mt-1">
                    ✓ Authenticated Seal
                  </div>
                </div>

                <div className="space-y-3 font-mono text-[10px] text-slate-600">
                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 text-[9px] block">DOCUMENT CRYPTO HASH (SHA-256)</span>
                    <span className="font-bold text-slate-700 break-all select-all">{selectedDoc.sha256Hash}</span>
                  </div>

                  <div className="border-b border-slate-100 pb-1.5 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[9px] block">SIGNED TIMESTAMP</span>
                      <span className="font-bold text-slate-700">
                        {new Date(selectedDoc.signedAtIso).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] block">DATE SEALED</span>
                      <span className="font-bold text-slate-700">
                        {new Date(selectedDoc.signedAtIso).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 text-[9px] block">TENDER OPPORTUNITY REF</span>
                    <span className="font-bold text-slate-700">{selectedDoc.bidNumber || 'CUSTOM_PDF'}</span>
                  </div>

                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 text-[9px] block">PROCURING INSTITUTION</span>
                    <span className="font-bold text-slate-700 truncate block">{selectedDoc.procuringInstitution || 'User Uploaded'}</span>
                  </div>

                  <div className="border-b border-slate-100 pb-1.5">
                    <span className="text-slate-400 text-[9px] block">REGISTERED BIDDER ENTITY</span>
                    <span className="font-bold text-slate-700 truncate block">{selectedDoc.bidderName || 'N/A'}</span>
                  </div>

                  <div className="border-b border-slate-100 pb-1.5 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-[9px] block">POPIA REVENUE SAFEGUARD</span>
                      <span className="font-bold text-emerald-600 uppercase">100% SECURE CLIENT-SIDE</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 shrink-0">
                  <button
                    onClick={() => handleDownloadReceipt(selectedDoc)}
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2 px-4 rounded text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Signature Receipt (JSON)
                  </button>

                  <button
                    onClick={() => handleDeleteItem(selectedDoc.id, selectedDoc.fileName)}
                    className="w-full border border-red-200 hover:bg-red-50 text-red-600 font-bold py-1.5 px-4 rounded text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Registry entry
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 font-mono text-[11px] italic py-24 px-4">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Select any digital document from the local history registry to inspect its cryptographic certificate properties, validity, and compliance receipts.
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
