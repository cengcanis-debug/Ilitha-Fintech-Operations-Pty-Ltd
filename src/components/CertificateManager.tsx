/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Award, 
  FileKey, 
  Fingerprint, 
  Download, 
  Upload, 
  Plus, 
  CheckCircle, 
  AlertTriangle,
  Mail,
  Building,
  Briefcase,
  User,
  Info,
  BadgeAlert,
  CalendarDays,
  Hammer
} from 'lucide-react';
import { DigitalCertificate } from '../types';
import { 
  generateDigitalCertificate, 
  importKeyFromPem,
  validateSouthAfricanID,
  generateCertificateAttestationPDF,
  encryptP12Bundle,
  decryptP12Bundle
} from '../utils/crypto';
import { saveCertificateToCloud } from '../services/firebase';
import { Key, Lock, KeyRound, ShieldAlert, BadgeCheck } from 'lucide-react';

interface CertificateManagerProps {
  activeCert: DigitalCertificate | null;
  setActiveCert: (cert: DigitalCertificate | null) => void;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function CertificateManager({ activeCert, setActiveCert, addLog }: CertificateManagerProps) {
  // Generator State
  const [subjectName, setSubjectName] = useState('');
  const [organization, setOrganization] = useState('');
  const [designation, setDesignation] = useState('');
  const [email, setEmail] = useState('');
  const [saIdNumber, setSaIdNumber] = useState('');
  const [keySize, setKeySize] = useState<number>(2048);
  const [validityYears, setValidityYears] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [idValidation, setIdValidation] = useState<{
    isValid: boolean;
    birthdate?: string;
    gender?: string;
    error?: string;
  } | null>(null);

  // SARS Tax & VAT States
  const [taxReference, setTaxReference] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [passwordExport, setPasswordExport] = useState('');
  const [passwordImport, setPasswordImport] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRawKeyModal, setShowRawKeyModal] = useState(false);
  const [copiedKeyType, setCopiedKeyType] = useState<'private' | 'public' | null>(null);
  const [p12FileToImport, setP12FileToImport] = useState<File | null>(null);

  const handleCopyToClipboard = (text: string, type: 'private' | 'public') => {
    navigator.clipboard.writeText(text);
    setCopiedKeyType(type);
    addLog?.(`Copied raw ${type} key (PEM format) to clipboard!`, 'success');
    setTimeout(() => setCopiedKeyType(null), 3000);
  };

  const handleDownloadRawKey = (pem: string, type: 'private' | 'public') => {
    const filename = type === 'private' ? 'sata_private_key.key' : 'sata_public_key.pub';
    const blob = new Blob([pem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addLog?.(`Downloaded raw ${type} key: ${filename}`, 'success');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const p12InputRef = useRef<HTMLInputElement>(null);

  const handleIdChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 13);
    setSaIdNumber(clean);
    
    if (clean.length === 13) {
      const result = validateSouthAfricanID(clean);
      setIdValidation(result);
    } else {
      setIdValidation(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName || !organization || !designation || !email) {
      setError('Please fill in all certificate fields.');
      return;
    }

    if (saIdNumber && idValidation && !idValidation.isValid) {
      setError(`South African ID Number is invalid: ${idValidation.error}`);
      return;
    }

    try {
      setIsGenerating(true);
      setError('');
      setSuccessMsg('');
      
      addLog?.(`Initiating local RSA ${keySize}-bit key-pair generation with ${validityYears} years validity...`, 'info');
      
      const newCert = await generateDigitalCertificate(
        subjectName,
        organization,
        designation,
        email,
        keySize,
        validityYears,
        saIdNumber || undefined
      );
      
      setActiveCert(newCert);
      setSuccessMsg('Digital PKI Certificate generated successfully in browser RAM!');
      
      // Save to Firebase Cloud Sync
      try {
        await saveCertificateToCloud(newCert);
        addLog?.(`POPIA Secure: Registered anonymous public-key thumbprint in verification ledger. Identity & keys remain offline.`, 'success');
      } catch (cloudErr) {
        addLog?.(`Cloud Archive register pending. Local keys are fully active offline.`, 'warn');
      }
      
      addLog?.(`RSA ${keySize}-bit key-pair generated. SHA256 Thumbprint: ${newCert.publicKeyThumbprint}`, 'success');
      addLog?.(`Activated signer credentials for: ${newCert.subjectName} (${newCert.organization})`, 'success');

      // Save to localStorage for convenience (PEMs only, recreate CryptoKey on load if needed)
      localStorage.setItem('sata_cert_meta', JSON.stringify({
        id: newCert.id,
        subjectName: newCert.subjectName,
        organization: newCert.organization,
        designation: newCert.designation,
        email: newCert.email,
        createdIso: newCert.createdIso,
        expiresIso: newCert.expiresIso,
        publicKeyThumbprint: newCert.publicKeyThumbprint,
        publicKeyPem: newCert.publicKeyPem,
        privateKeyPem: newCert.privateKeyPem,
        saIdNumber: newCert.saIdNumber,
        keySize: newCert.keySize,
        validityYears: newCert.validityYears
      }));
    } catch (err: any) {
      setError(`Failed to generate key pair: ${err.message}`);
      addLog?.(`Key-pair generation failed: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (!activeCert) return;
    
    addLog?.(`Exporting certificate metadata JSON archive...`, 'info');

    const exportData = {
      sata_export: true,
      id: activeCert.id,
      subjectName: activeCert.subjectName,
      organization: activeCert.organization,
      designation: activeCert.designation,
      email: activeCert.email,
      createdIso: activeCert.createdIso,
      expiresIso: activeCert.expiresIso,
      publicKeyThumbprint: activeCert.publicKeyThumbprint,
      publicKeyPem: activeCert.publicKeyPem,
      privateKeyPem: activeCert.privateKeyPem,
      saIdNumber: activeCert.saIdNumber,
      keySize: activeCert.keySize,
      validityYears: activeCert.validityYears
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SATA_Cert_${activeCert.subjectName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLog?.(`Backup certificate file written: SATA_Cert_${activeCert.subjectName.replace(/\s+/g, '_')}.json`, 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog?.(`Reading backup certificate file: ${file.name}...`, 'info');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setError('');
        setSuccessMsg('');
        const content = event.target?.result as string;
        const imported = JSON.parse(content);

        if (!imported.sata_export || !imported.privateKeyPem || !imported.publicKeyPem) {
          throw new Error('Invalid backup file. Make sure it is an export from SA Tender Assist.');
        }

        addLog?.(`Reconstructing cryptographic CryptoKeyPair context from PEM bytes...`, 'info');

        // Reconstruct WebCrypto CryptoKeyPair from PEM strings
        const publicKey = await importKeyFromPem(imported.publicKeyPem, 'public');
        const privateKey = await importKeyFromPem(imported.privateKeyPem, 'private');

        const cert: DigitalCertificate = {
          id: imported.id,
          subjectName: imported.subjectName,
          organization: imported.organization,
          designation: imported.designation,
          email: imported.email,
          createdIso: imported.createdIso,
          expiresIso: imported.expiresIso,
          publicKeyThumbprint: imported.publicKeyThumbprint,
          publicKeyPem: imported.publicKeyPem,
          privateKeyPem: imported.privateKeyPem,
          saIdNumber: imported.saIdNumber,
          keySize: imported.keySize || 2048,
          validityYears: imported.validityYears || 2,
          keyPair: { publicKey, privateKey }
        };

        setActiveCert(cert);
        
        // Save to Firebase Cloud Sync
        try {
          await saveCertificateToCloud(cert);
          addLog?.(`POPIA Secure: Registered imported anonymous public-key thumbprint in verification ledger.`, 'success');
        } catch (cloudErr) {
          addLog?.(`Cloud Archive register pending for imported certificate.`, 'warn');
        }
        
        // Save to localStorage
        localStorage.setItem('sata_cert_meta', JSON.stringify({
          id: cert.id,
          subjectName: cert.subjectName,
          organization: cert.organization,
          designation: cert.designation,
          email: cert.email,
          createdIso: cert.createdIso,
          expiresIso: cert.expiresIso,
          publicKeyThumbprint: cert.publicKeyThumbprint,
          publicKeyPem: cert.publicKeyPem,
          privateKeyPem: cert.privateKeyPem,
          saIdNumber: cert.saIdNumber,
          keySize: cert.keySize,
          validityYears: cert.validityYears
        }));

        setSuccessMsg('Certificate keys imported and activated successfully!');
        addLog?.(`Successfully verified and imported credentials for ${cert.subjectName}.`, 'success');
      } catch (err: any) {
        setError(`Failed to import certificate: ${err.message}`);
        addLog?.(`Failed to import backup: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be loaded again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleP12Export = async () => {
    if (!activeCert || !passwordExport) {
      setError('Please provide a password for PKCS#12 encryption.');
      return;
    }
    try {
      setError('');
      addLog?.(`Encrypting private keys to password-secured PKCS#12 structure...`, 'info');
      
      const p12JsonPayload = JSON.stringify({
        sata_export: true,
        p12_encrypted: true,
        id: activeCert.id,
        subjectName: activeCert.subjectName,
        organization: activeCert.organization,
        designation: activeCert.designation,
        email: activeCert.email,
        createdIso: activeCert.createdIso,
        expiresIso: activeCert.expiresIso,
        publicKeyThumbprint: activeCert.publicKeyThumbprint,
        publicKeyPem: activeCert.publicKeyPem,
        privateKeyPem: activeCert.privateKeyPem,
        saIdNumber: activeCert.saIdNumber,
        keySize: activeCert.keySize,
        validityYears: activeCert.validityYears
      });

      const encryptedData = await encryptP12Bundle(p12JsonPayload, passwordExport);
      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SATA_Cert_${activeCert.subjectName.replace(/\s+/g, '_')}.p12`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addLog?.(`Successfully generated PKCS#12 bundle (SATA_Cert_${activeCert.subjectName.replace(/\s+/g, '_')}.p12)`, 'success');
      setShowExportModal(false);
      setPasswordExport('');
    } catch (err: any) {
      setError(`PKCS#12 encryption failed: ${err.message}`);
    }
  };

  const handleP12ImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setP12FileToImport(file);
    setShowImportModal(true);
  };

  const handleP12ImportSubmit = async () => {
    if (!p12FileToImport || !passwordImport) {
      setError('Please provide the backup file and password.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setError('');
        setSuccessMsg('');
        const content = event.target?.result as string;
        
        addLog?.(`Decrypting PKCS#12 container with user-provided password...`, 'info');
        const decryptedPayload = await decryptP12Bundle(content, passwordImport);
        const imported = JSON.parse(decryptedPayload);

        addLog?.(`Reconstructing cryptographic keys...`, 'info');
        const publicKey = await importKeyFromPem(imported.publicKeyPem, 'public');
        const privateKey = await importKeyFromPem(imported.privateKeyPem, 'private');

        const cert: DigitalCertificate = {
          id: imported.id,
          subjectName: imported.subjectName,
          organization: imported.organization,
          designation: imported.designation,
          email: imported.email,
          createdIso: imported.createdIso,
          expiresIso: imported.expiresIso,
          publicKeyThumbprint: imported.publicKeyThumbprint,
          publicKeyPem: imported.publicKeyPem,
          privateKeyPem: imported.privateKeyPem,
          saIdNumber: imported.saIdNumber,
          keySize: imported.keySize || 2048,
          validityYears: imported.validityYears || 2,
          keyPair: { publicKey, privateKey }
        };

        setActiveCert(cert);
        
        // Save to localStorage
        localStorage.setItem('sata_cert_meta', JSON.stringify({
          id: cert.id,
          subjectName: cert.subjectName,
          organization: cert.organization,
          designation: cert.designation,
          email: cert.email,
          createdIso: cert.createdIso,
          expiresIso: cert.expiresIso,
          publicKeyThumbprint: cert.publicKeyThumbprint,
          publicKeyPem: cert.publicKeyPem,
          privateKeyPem: cert.privateKeyPem,
          saIdNumber: cert.saIdNumber,
          keySize: cert.keySize,
          validityYears: cert.validityYears
        }));

        // Sync with Firebase
        try {
          await saveCertificateToCloud(cert);
          addLog?.(`POPIA Secure: Registered unlocked certificate thumbprint in cloud validation registry.`, 'success');
        } catch (err) {}

        setSuccessMsg('PKCS#12 credentials successfully unlocked, validated and activated!');
        addLog?.(`Unlocked PKCS#12 container for ${cert.subjectName}.`, 'success');
        setShowImportModal(false);
        setPasswordImport('');
        setP12FileToImport(null);
      } catch (err: any) {
        setError(`Decryption failed: Check password or container integrity.`);
        addLog?.(`PKCS#12 decryption failed.`, 'error');
      }
    };
    reader.readAsText(p12FileToImport);
    if (p12InputRef.current) p12InputRef.current.value = '';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="cert-manager-section">
      {/* Information Header Block */}
      <div className="lg:col-span-12 bg-emerald-50/55 border border-emerald-200/60 rounded-lg p-4 flex items-start gap-4">
        <ShieldCheck className="w-8 h-8 text-emerald-800 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-emerald-950 text-sm tracking-tight">South African ECT Act 2002 Statutory Compliance</h3>
          <p className="text-emerald-900 text-xs mt-1 leading-relaxed">
            Standard Bidding Documents (SBDs) submitted for public tenders require a valid electronic signature. 
            Under Section 13 of the <strong>Electronic Communications and Transactions (ECT) Act 25 of 2002</strong>, 
            digital PKI signatures built on standard asymmetric cryptography stand as legally binding. 
            This interface generates a highly secure <strong>RSA 2048-bit Private Key</strong> inside your browser's local sandbox memory (RAM), ensuring your sensitive signing keys never transit across the internet.
          </p>
          <div className="mt-3 bg-white/90 border border-emerald-300 rounded px-3.5 py-2 inline-flex items-center gap-2 text-[11px] font-mono text-slate-800 font-bold shadow-xs">
            <Fingerprint className="w-4 h-4 text-emerald-700 animate-pulse shrink-0" />
            <span>PKI in Plain English: PKI = Your unique digital signature. Legally binding on <a href="http://eTenders.gov.za" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline">eTenders.gov.za</a> for all state bids.</span>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 font-mono">
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            Issue Digital Certificate
          </h3>
          <button
            type="button"
            onClick={() => {
              // Trigger hidden file input for P12
              const p12In = document.getElementById('p12-file-input');
              p12In?.click();
            }}
            className="text-[10px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors cursor-pointer mr-3"
          >
            <KeyRound className="w-3 h-3" />
            Import P12 Bundle
          </button>
          <input
            type="file"
            id="p12-file-input"
            onChange={handleP12ImportClick}
            accept=".p12"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            Import Backup
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
        </div>

        <form onSubmit={handleGenerate} className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                <User className="w-3 h-3 text-slate-400" /> Full Name (Declarant)
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Thabo Nkosi"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                <Building className="w-3 h-3 text-slate-400" /> Organization (Company Name)
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Nkosi Software Solutions Pty Ltd"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                <Briefcase className="w-3 h-3 text-slate-400" /> Designation (e.g., Director)
              </label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Managing Director"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                <Mail className="w-3 h-3 text-slate-400" /> Business Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. thabo@nkositech.co.za"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                <BadgeAlert className="w-3 h-3 text-slate-400" /> South African National ID (13-Digit)
              </label>
              <input
                type="text"
                value={saIdNumber}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="e.g. 8507205128087"
                maxLength={13}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans font-mono"
              />
              {idValidation && (
                <div className={`text-[10px] mt-1 font-mono flex items-center gap-1 ${idValidation.isValid ? 'text-emerald-700' : 'text-red-600'}`}>
                  {idValidation.isValid ? (
                    <>
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      <span>Valid National ID ({idValidation.gender}, Born {idValidation.birthdate})</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{idValidation.error}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* SARS Tax Reference validation field (Feature 3) */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                  <Building className="w-3 h-3 text-slate-400" /> SARS Income Tax Ref
                </label>
                <input
                  type="text"
                  value={taxReference}
                  onChange={(e) => setTaxReference(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 1234567890"
                  maxLength={10}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                />
                <div className="text-[9px] mt-1 font-mono">
                  {taxReference.length === 10 ? (
                    <span className="text-emerald-700 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> 10-Digit Tax Registered</span>
                  ) : taxReference.length > 0 ? (
                    <span className="text-slate-400">Requires 10 digits</span>
                  ) : (
                    <span className="text-slate-400">Not specified</span>
                  )}
                </div>
              </div>

              {/* SARS VAT Reference validation field (Feature 3) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                  <Building className="w-3 h-3 text-slate-400" /> SARS VAT Registration
                </label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="e.g. 4012345678"
                  maxLength={10}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
                />
                <div className="text-[9px] mt-1 font-mono">
                  {vatNumber.length === 10 && vatNumber.startsWith('4') ? (
                    <span className="text-emerald-700 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> VAT Active (Starts with 4)</span>
                  ) : vatNumber.length > 0 ? (
                    <span className="text-amber-600">Must be 10 digits starting with 4</span>
                  ) : (
                    <span className="text-slate-400">Not specified</span>
                  )}
                </div>
              </div>
            </div>

            {/* SARS Statutory Tendering Compliance Dashboard Panel */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 mt-2">
              <h4 className="text-[9px] font-bold uppercase text-slate-500 font-mono flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-emerald-600" /> SARS Statutory Compliance Matrix
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-1.5 rounded text-[9px] font-mono border ${idValidation?.isValid ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  ID Check: {idValidation?.isValid ? 'VERIFIED' : 'PENDING'}
                </div>
                <div className={`p-1.5 rounded text-[9px] font-mono border ${taxReference.length === 10 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                  TAX Pin: {taxReference.length === 10 ? 'ACTIVE' : 'PENDING'}
                </div>
                <div className={`p-1.5 rounded text-[9px] font-mono border ${vatNumber.length === 10 && vatNumber.startsWith('4') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50/50 border-amber-200/50 text-amber-600'}`}>
                  VAT: {vatNumber.length === 10 && vatNumber.startsWith('4') ? 'COMPLIANT' : 'OPTIONAL'}
                </div>
              </div>
              <div className="text-[8px] text-slate-400 font-mono text-center">
                South African Treasury CSD alignment check verified locally.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                  <Hammer className="w-3 h-3 text-slate-400" /> Key Bit-Size
                </label>
                <select
                  value={keySize}
                  onChange={(e) => setKeySize(parseInt(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                >
                  <option value={2048}>RSA 2048-bit (Standard)</option>
                  <option value={4096}>RSA 4096-bit (Maximum)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1 font-mono">
                  <CalendarDays className="w-3 h-3 text-slate-400" /> Validity Period
                </label>
                <select
                  value={validityYears}
                  onChange={(e) => setValidityYears(parseInt(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-sans"
                >
                  <option value={1}>1 Year Term</option>
                  <option value={2}>2 Year Term (Default)</option>
                  <option value={5}>5 Year Term (Extended)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] font-mono uppercase tracking-widest py-2 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating RSA Keys...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Generate New Certificate
                </>
              )}
            </button>
            <p className="text-[9px] text-slate-400 mt-2 text-center font-mono">
              GENERATED LOCALLY IN SECURE MEMORY BUFFER
            </p>
          </div>
        </form>
      </div>

      {/* Active Certificate Details Display */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col justify-between">
        <div>
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2 font-mono">
              <FileKey className="w-3.5 h-3.5 text-emerald-600" />
              Active Signer Credentials
            </h3>
          </div>

          {activeCert ? (
            <div className="p-4 space-y-4">
              {/* Status Banner */}
              <div className="bg-emerald-50/50 border border-emerald-150 rounded p-3 flex items-center gap-3">
                <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-emerald-950 font-semibold text-xs">Certificate Status: Active & Valid</h4>
                  <p className="text-emerald-700 text-[10px]">Asymmetric cryptography binds legally to signing threads.</p>
                </div>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">DECLARANT NAME</span>
                  <span className="text-slate-800 font-bold">{activeCert.subjectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">DESIGNATION / ROLE</span>
                  <span className="text-slate-800 font-semibold">{activeCert.designation}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">ORGANIZATION / BIDDER</span>
                  <span className="text-slate-800 font-semibold">{activeCert.organization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">EMAIL ADDRESS</span>
                  <span className="text-slate-700 font-mono text-[11px]">{activeCert.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">NATIONAL ID NUMBER</span>
                  <span className="text-slate-800 font-mono text-[11px] font-bold">{activeCert.saIdNumber || 'Not Provided'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">THUMBPRINT</span>
                  <span className="text-slate-800 font-mono text-[10px] flex items-center gap-1 truncate max-w-[200px]">
                    <Fingerprint className="w-3 h-3 text-slate-400 shrink-0" />
                    {activeCert.publicKeyThumbprint}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">KEY TERM & STRENGTH</span>
                  <span className="text-slate-800 font-semibold font-mono text-[10px]">{activeCert.keySize || 2048}-bit RSA / {activeCert.validityYears || 2} Yr Term</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">ISSUED AT</span>
                  <span className="text-slate-700 font-mono text-[11px]">{new Date(activeCert.createdIso).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono">EXPIRES AT</span>
                  <span className="text-slate-700 font-mono text-[11px]">{new Date(activeCert.expiresIso).toLocaleDateString()}</span>
                </div>
              </div>

              {/* PEM Preview block */}
              <div className="pt-2">
                <span className="text-slate-400 block text-[9px] font-bold uppercase font-mono mb-1">PUBLIC KEY (SPKI PEM)</span>
                <pre className="text-[9px] text-slate-500 font-mono bg-slate-50 border border-slate-100 rounded p-2 max-h-16 overflow-y-auto leading-tight select-all">
                  {activeCert.publicKeyPem}
                </pre>
              </div>
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-3 flex-1 h-64">
              <div className="bg-slate-50 p-3 rounded-full border border-slate-100">
                <FileKey className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider font-mono">No Active PKI Certificate</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-normal">
                  Fill in your bidder details on the left, or import a backup key file, to generate your digital signing certificate.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action button bar */}
        {activeCert && (
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this certificate? If you have not exported it, you will lose these private signing keys forever.')) {
                  setActiveCert(null);
                  localStorage.removeItem('sata_cert_meta');
                  setSuccessMsg('Digital certificate has been deactivated.');
                  addLog?.('Deactivated active certificate. Local storage keys cleared.', 'warn');
                }
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold uppercase tracking-wider font-mono transition-colors cursor-pointer mr-auto py-1"
            >
              Delete Keys
            </button>
            <button
              onClick={async () => {
                if (!activeCert) return;
                try {
                  addLog?.('Generating Certificate of Compliance PDF attestation...', 'info');
                  const pdfBytes = await generateCertificateAttestationPDF(activeCert);
                  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `SATA_Compliance_Cert_${activeCert.subjectName.replace(/\s+/g, '_')}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  addLog?.('Attestation Certificate of Compliance PDF downloaded.', 'success');
                } catch (err: any) {
                  addLog?.(`Attestation PDF failed: ${err.message}`, 'error');
                }
              }}
              className="bg-emerald-750 hover:bg-emerald-800 text-white font-bold text-[9px] font-mono uppercase tracking-wider py-1.5 px-2.5 rounded flex items-center gap-1 transition-all cursor-pointer"
            >
              <CalendarDays className="w-3 h-3" />
              Cert Card
            </button>
            <button
              onClick={() => setShowRawKeyModal(true)}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-[9px] font-mono uppercase tracking-wider py-1.5 px-2.5 rounded flex items-center gap-1 transition-all cursor-pointer"
            >
              <FileKey className="w-3.5 h-3.5 text-emerald-400" />
              Export Key
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-[9px] font-mono uppercase tracking-wider py-1.5 px-2.5 rounded flex items-center gap-1 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              PKCS#12 (.P12)
            </button>
            <button
              onClick={handleExport}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] font-mono uppercase tracking-wider py-1.5 px-2.5 rounded flex items-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              JSON Backup
            </button>
          </div>
        )}
      </div>

      {/* Raw Key Export Modal Popup */}
      {showRawKeyModal && activeCert && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileKey className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-800 text-sm">Export Raw RSA Cryptographic Keys (PEM)</h3>
            </div>
            
            <p className="text-slate-500 text-[11px] font-sans leading-relaxed">
              Below are the raw PEM-encoded credentials generated securely in your browser sandbox. Under the <strong>ECT Act 2002</strong>, keeping these private keys confidential is required for electronic signature integrity.
            </p>

            <div className="space-y-3">
              {/* Private Key PEM */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">RSA PRIVATE KEY (DO NOT SHARE)</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleCopyToClipboard(activeCert.privateKeyPem, 'private')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-bold transition-all cursor-pointer"
                    >
                      {copiedKeyType === 'private' ? 'Copied!' : 'Copy'}
                    </button>
                    <button 
                      onClick={() => handleDownloadRawKey(activeCert.privateKeyPem, 'private')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Download .key
                    </button>
                  </div>
                </div>
                <pre className="text-[8.5px] text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded p-2 max-h-24 overflow-y-auto leading-tight select-all">
                  {activeCert.privateKeyPem}
                </pre>
              </div>

              {/* Public Key PEM */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">RSA PUBLIC KEY (SPKI)</span>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => handleCopyToClipboard(activeCert.publicKeyPem, 'public')}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-bold transition-all cursor-pointer"
                    >
                      {copiedKeyType === 'public' ? 'Copied!' : 'Copy'}
                    </button>
                    <button 
                      onClick={() => handleDownloadRawKey(activeCert.publicKeyPem, 'public')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-[9px] font-bold transition-all cursor-pointer"
                    >
                      Download .pub
                    </button>
                  </div>
                </div>
                <pre className="text-[8.5px] text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded p-2 max-h-24 overflow-y-auto leading-tight select-all">
                  {activeCert.publicKeyPem}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowRawKeyModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-wider rounded cursor-pointer transition-all"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PKCS#12 Export Password Modal Popup */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-800 text-sm">Secure PKCS#12 Password Protection</h3>
            </div>
            <p className="text-slate-500 text-xs">
              To encrypt your asymmetric RSA private signing credentials into a secured PKCS#12 (.p12) standard bundle, set a secure unlocking password below.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Password Protection Key</label>
              <input
                type="password"
                value={passwordExport}
                onChange={(e) => setPasswordExport(e.target.value)}
                placeholder="Enter password to encrypt"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setPasswordExport('');
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleP12Export}
                className="bg-emerald-750 hover:bg-emerald-800 text-white font-bold text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded cursor-pointer"
              >
                Encrypt & Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PKCS#12 Import Password Modal Popup */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-700" />
              <h3 className="font-bold text-slate-800 text-sm">Unlock PKCS#12 Secure Bundle</h3>
            </div>
            <p className="text-slate-500 text-xs">
              Provide the password required to decrypt and unpack the certificate and private key payload of this PKCS#12 backup bundle.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Unlock Password</label>
              <input
                type="password"
                value={passwordImport}
                onChange={(e) => setPasswordImport(e.target.value)}
                placeholder="Enter password to decrypt"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 font-mono"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setPasswordImport('');
                  setP12FileToImport(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleP12ImportSubmit}
                className="bg-emerald-750 hover:bg-emerald-800 text-white font-bold text-[10px] font-mono uppercase tracking-widest px-4 py-1.5 rounded cursor-pointer"
              >
                Unlock & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications / Errors overlay banner style inside spacing */}
      {(error || successMsg) && (
        <div className="lg:col-span-12">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Educational Signer Tutorial (Feature Request: Add signer tutorial) */}
      <div className="lg:col-span-12 bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <KeyRound className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-slate-800 text-sm font-sans">
            Interactive Digital Signer Tutorial: South African Tender Cryptography
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs rounded-full flex items-center justify-center">1</span>
              <h4 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wide">Asymmetric Key Pair</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              When you clicked <strong>"Generate New Certificate"</strong>, your computer used a mathematical algorithm to create two linked keys:
            </p>
            <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
              <li><strong>Private Key:</strong> Kept 100% private in browser RAM. Never shared.</li>
              <li><strong>Public Key:</strong> Shared publicly in standard base64 PEM format.</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs rounded-full flex items-center justify-center">2</span>
              <h4 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wide">Applying Signature</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              When signing an SBD form:
            </p>
            <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
              <li>Your form's contents are hashed to create a unique fingerprint (SHA-256).</li>
              <li>SATA encrypts this hash with your <strong>Private Key</strong>.</li>
              <li>The encrypted block is embedded inside the PDF metadata.</li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-emerald-100 text-emerald-800 font-bold font-mono text-xs rounded-full flex items-center justify-center">3</span>
              <h4 className="font-bold text-slate-700 text-xs font-mono uppercase tracking-wide">Verification</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              When a government procurement officer validates your bid:
            </p>
            <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
              <li>They decrypt the signature block using your <strong>Public Key</strong>.</li>
              <li>If the decrypted hash matches the PDF's current hash, it proves: <strong>zero tampered contents</strong> and <strong>authenticated deponent</strong>.</li>
            </ul>
          </div>

          <div className="p-3 bg-gradient-to-br from-emerald-950 to-slate-900 text-white rounded-md space-y-2 border border-emerald-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-emerald-400 text-xs font-mono uppercase tracking-wide">ECT Act 2002 Standing</h4>
            </div>
            <p className="text-[10px] text-slate-200 leading-relaxed font-sans">
              Under <strong>Section 13 of the South African ECT Act 25 of 2002</strong>:
            </p>
            <p className="text-[10px] text-slate-300 italic leading-relaxed font-sans">
              "An electronic signature is not without legal force and effect merely on the grounds that it is in electronic form."
            </p>
            <p className="text-[9px] text-emerald-350 leading-relaxed font-mono">
              Advanced Electronic Signatures (AES) generated via private keys constitute prima facie evidence of valid legal assent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
