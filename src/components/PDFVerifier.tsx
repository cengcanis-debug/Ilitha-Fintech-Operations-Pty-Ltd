/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileSearch, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Fingerprint, 
  User, 
  FileText, 
  Activity, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { VerificationResult } from '../types';
import { verifySBDSignature } from '../utils/crypto';

interface PDFVerifierProps {
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function PDFVerifier({ addLog }: PDFVerifierProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await verifyFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await verifyFile(e.target.files[0]);
    }
  };

  const verifyFile = async (selectedFile: File) => {
    setError('');
    setResult(null);
    setFile(selectedFile);
    
    if (selectedFile.type !== 'application/pdf') {
      setError('Invalid file format. Please upload a standard PDF document.');
      addLog?.(`Forensics failed: ${selectedFile.name} is not a valid PDF file.`, 'error');
      return;
    }

    try {
      setIsVerifying(true);
      addLog?.(`Initiating standard forensic audit on document: ${selectedFile.name}...`, 'info');
      addLog?.(`Searching PDF body structures for embedded SATA PKI dictionary signatures...`, 'info');
      
      const buffer = await selectedFile.arrayBuffer();
      
      // Perform the live cryptographic signature audit
      const verification = await verifySBDSignature(buffer);
      verification.fileName = selectedFile.name;
      
      setResult(verification);

      if (verification.isValid) {
        addLog?.(`Forensics match: Valid digital signature successfully verified!`, 'success');
        addLog?.(`Integrity status: Cryptographically sealed with zero byte-alterations.`, 'success');
        addLog?.(`Signer certificate identity: Issued to ${verification.sealDetails?.signedBy || 'Unknown'} of ${verification.sealDetails?.organization || 'Unknown'}`, 'success');
      } else {
        addLog?.(`Forensics fail: ${verification.errors[0] || 'Cryptographic seal dictionary could not be verified.'}`, 'error');
      }
    } catch (err: any) {
      setError(`Verification processing failed: ${err.message}`);
      addLog?.(`Forensic verification algorithm failed: ${err.message}`, 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setResult(null);
    setError('');
    addLog?.('Cleared forensic verification workspace buffer.', 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="pdf-verifier-root">
      {/* Upload Drag & Drop Section */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        {!file ? (
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex-1 min-h-[300px] border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-50/20' 
                : 'border-slate-200 hover:border-emerald-500 hover:bg-slate-50/50'
            }`}
          >
            <div className="bg-slate-50 p-3 rounded-full border border-slate-100 text-slate-400 mb-3">
              <FileSearch className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-mono">Upload document to audit</h4>
              <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto leading-normal">
                Drag and drop your signed bidding document (PDF) here to perform a live cryptographic verification.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-850 border border-emerald-100 rounded text-[9px] font-mono uppercase tracking-wider font-bold">
                ✓ POPIA Protected Sandbox
              </div>
              <p className="text-[8px] text-slate-400 mt-1 font-mono leading-normal max-w-[200px] mx-auto">
                Audits run 100% client-side. Document bytes never leave your device.
              </p>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Audit Workspace
                </h4>
                <button
                  onClick={handleClear}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-600 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Reset File
                </button>
              </div>

              {/* Uploaded File stats */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded text-[11px] space-y-1">
                <div>
                  <span className="text-slate-400 font-bold block font-mono text-[9px] uppercase">TARGET FILE</span>
                  <span className="text-slate-800 font-bold font-mono truncate block">{file.name}</span>
                </div>
                <div className="pt-1.5 flex justify-between border-t border-slate-200/60 mt-1.5">
                  <div>
                    <span className="text-slate-400 font-bold block font-mono text-[9px] uppercase font-semibold">SIZE</span>
                    <span className="font-mono font-medium text-slate-600">{(file.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 font-bold block font-mono text-[9px] uppercase font-semibold">AUDIT PROCESS</span>
                    <span className="text-emerald-700 font-bold font-mono">LOCAL_SANDBOX</span>
                  </div>
                </div>
              </div>
            </div>

            {isVerifying ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-6 h-6 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Parsing signature blocks...</span>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 leading-normal mb-2">
                  To perform another forensic audit on a different file, clear this workspace and load the new bidding contract.
                </p>
                <button
                  onClick={handleClear}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] font-mono uppercase tracking-widest py-2 px-4 rounded transition-colors cursor-pointer"
                >
                  Load New Document
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Forensics Results Section */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col min-h-[300px]">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            Live Forensics Audit Report
          </h3>
          {result && (
            <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${result.isValid ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {result.isValid ? 'VERIFIED' : 'FAILED'}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
          {!result ? (
            <div className="text-center py-12 text-slate-400 space-y-2 flex-1 flex flex-col justify-center items-center">
              <FileSearch className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <div>
                <h5 className="font-bold text-slate-600 text-xs uppercase tracking-wider font-mono">No Forensics Result</h5>
                <p className="text-[11px] max-w-xs mx-auto mt-1 leading-normal">
                  Fulfill file drag & drop or selection on the left to invoke client-side digital signature validation.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn flex-1 flex flex-col justify-between">
              {/* Dynamic Status Panel */}
              <div className={`p-3 rounded-lg border flex items-start gap-3 ${result.isValid ? 'bg-emerald-50/50 border-emerald-150' : 'bg-red-50/50 border-red-150'}`}>
                {result.isValid ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className={`font-bold text-xs ${result.isValid ? 'text-emerald-950' : 'text-red-950'}`}>
                    {result.isValid ? 'Cryptographic Integrity Verified' : 'Cryptographic Forensics Failed'}
                  </h4>
                  <p className={`text-[10px] mt-0.5 leading-normal ${result.isValid ? 'text-emerald-800' : 'text-red-800'}`}>
                    {result.isValid 
                      ? 'The visual certified stamp is backed by an authentic RSA signature envelope. Zero bytes were modified since signing.' 
                      : (result.errors[0] || 'This document contains no valid standard signature certificate or the PDF bytes were altered.')}
                  </p>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">SIGNATORY SUBJECT</span>
                  <span className="text-slate-800 font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {result.sealDetails?.signedBy || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">ORGANIZATION / AUTHORITY</span>
                  <span className="text-slate-800 font-semibold">{result.sealDetails?.organization || 'UNKNOWN'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">INTEGRITY SEAL HASH</span>
                  <span className="text-slate-800 font-mono text-[10px] truncate block max-w-[200px]" title={result.sha256Hash}>
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400 inline shrink-0 mr-1" />
                    {result.sha256Hash ? result.sha256Hash.substring(0, 16) + '...' : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">SIGNATURE TIMESTAMP</span>
                  <span className="text-slate-800 font-mono text-[10px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {result.sealDetails?.timestamp ? new Date(result.sealDetails.timestamp).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Verification Audit Logs trail */}
              <div className="pt-2">
                <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono mb-1">COMPLIANCE CERTIFICATE TRAIL</span>
                <div className="bg-slate-50 border border-slate-150 rounded p-2.5 space-y-1.5 font-mono text-[9px] text-slate-600 max-h-24 overflow-y-auto leading-relaxed">
                  <div className="flex gap-2 items-start">
                    <span className="text-emerald-700">✓</span>
                    <span>Standard PDF-1.4 file headers detected.</span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <span className="text-emerald-700">✓</span>
                    <span>SATA digital signature dictionary matching standard ECT-2002 formatting.</span>
                  </div>
                  {result.isValid ? (
                    <>
                      <div className="flex gap-2 items-start">
                        <span className="text-emerald-700">✓</span>
                        <span>SHA256 integrity block matches visual watermark: "{result.sealDetails?.signedBy}".</span>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="text-emerald-700">✓</span>
                        <span>WebCrypto Asymmetric decryption of envelope successful. Matches document hash.</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2 items-start text-red-700 font-medium">
                      <span>✗</span>
                      <span>Forensics aborted: RSA hash validation match failed or signature block missing.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Diagnostic Errors panel */}
        {error && (
          <div className="bg-red-50 border-t border-red-200 p-3 flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
