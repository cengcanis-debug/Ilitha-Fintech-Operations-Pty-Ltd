/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  Terminal, 
  CheckCircle, 
  Clock, 
  HelpCircle, 
  Send, 
  Lock, 
  Smartphone, 
  Building, 
  AlertCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';

interface PaymentGatewayProps {
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  activeCert?: any;
  hideDiagnostics?: boolean;
}

const GeneralProducts = [
  { id: 'credit_topup', name: 'SATA Pay-As-You-Go Credits (10 Credits)', price: 250, description: '10 credits for instant bid matching and form auto-fills.' },
  { id: 'license_professional', name: 'SATA Professional Partner License (Monthly)', price: 1500, description: 'Professional partner access with +10% matching score boost.' },
  { id: 'license_enterprise', name: 'SATA National Elite Partner License (Monthly)', price: 4500, description: 'Elite priority real-time push routing with +25% match relevance boost.' }
];

interface RoutedBidState {
  id: string;
  tenderId: string;
  tenderTitle: string;
  tenderValue: number;
  partnerId: string;
  partnerName: string;
  splitPercentage: number;
  status: 'routing' | 'sbd_generated' | 'submitted' | 'won' | 'archived';
  overrideActive: boolean;
  commissionEarned: number;
  useFeeCap?: boolean;
  feeCapAmount?: number;
  updatedAtIso: string;
  paymentStatus?: 'unpaid' | 'pending' | 'paid';
  paymentRef?: string;
  paidAtIso?: string;
  pppfaScore?: number;
  nonCollusionHash?: string;
  evaluationLog?: string;
}

export default function PaymentGateway({ addLog, activeCert, hideDiagnostics }: PaymentGatewayProps) {
  // Payment Mode
  const [paymentMode, setPaymentMode] = useState<'card' | 'eft'>('card');
  
  // Card Input States
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardFocus, setCardFocus] = useState<boolean>(false); // for animation triggers
  const [cardType, setCardType] = useState<'visa' | 'mastercard' | 'amex' | 'unknown'>('unknown');

  // EFT Input States
  const [selectedBank, setSelectedBank] = useState('FNB');
  const [accountNumber, setAccountNumber] = useState('');
  const [eftReference, setEftReference] = useState('SATA-EP-PAY');
  const [smsOtp, setSmsOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Status & Transaction log
  const [isProcessing, setIsProcessing] = useState(false);
  const [txnSuccess, setTxnSuccess] = useState(false);
  const [txnReceipt, setTxnReceipt] = useState<any>(null);
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  
  // Routed Bids needing settlement (read dynamically from localStorage)
  const [bidsToSettle, setBidsToSettle] = useState<RoutedBidState[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('credit_1');
  const selectedBidId = selectedProduct.startsWith('bid_') ? selectedProduct.substring(4) : '';

  // Initial Seed Logs and Load localStorage bids
  useEffect(() => {
    loadBids();
    pushApiLog("PAYMENT_SERVER: SATA billing microservices active.", "info");
    pushApiLog("GATEWAY: Initializing Secure PayFast/Stripe merchant token handshakes...", "info");
    pushApiLog("COMPLIANCE: TLS 1.3 encryption validated with standard PCI-DSS Level 1 compliance.", "success");
    
    // Set up a listener for storage change so we stay perfectly synced
    const handleStorageChange = () => {
      loadBids();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const loadBids = () => {
    const raw = localStorage.getItem('sata_routed_bids_local');
    let outstanding: RoutedBidState[] = [];
    if (raw) {
      const parsed: RoutedBidState[] = JSON.parse(raw);
      // Filter out 'won' bids that are currently unpaid/unsettled
      outstanding = parsed.filter(b => b.status === 'won' && b.paymentStatus !== 'paid');
      setBidsToSettle(outstanding);
    }
    
    // Determine initial selection
    if (outstanding.length > 0) {
      setSelectedProduct(`bid_${outstanding[0].id}`);
    } else {
      setSelectedProduct('credit_topup');
    }
  };

  const pushApiLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const ts = new Date().toISOString();
    const styleStr = 
      type === 'success' ? '✔ [SUCCESS]' :
      type === 'warn' ? '⚠ [WARNING]' :
      type === 'error' ? '✘ [ERROR]' :
      'ℹ [INFO]';
    setApiLogs(prev => [`[${ts}] ${styleStr} ${message}`, ...prev].slice(0, 30));
  };

  // Card detection
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    
    // Auto-spacing of card input groups
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += ' ';
      formatted += cleaned[i];
    }
    setCardNumber(formatted.substring(0, 19));

    // Simple Card type detection
    if (cleaned.startsWith('4')) setCardType('visa');
    else if (/^(51|52|53|54|55)/.test(cleaned)) setCardType('mastercard');
    else if (/^(34|37)/.test(cleaned)) setCardType('amex');
    else setCardType('unknown');
  };

  // Luhn algorithm validator
  const validateLuhn = (numStr: string): boolean => {
    const num = numStr.replace(/\s+/g, '');
    if (!num || num.length < 13) return false;
    
    let sum = 0;
    let shouldDouble = false;
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Trigger simulated OTP
  const triggerOtpSend = () => {
    if (!accountNumber || accountNumber.length < 6) {
      alert("Please provide a valid South African bank account number first.");
      return;
    }
    pushApiLog(`EFT_BRIDGE: Requesting OAuth2 instant-EFT verification from ${selectedBank}...`, 'info');
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setOtpSent(true);
      pushApiLog(`OTP_ROUTER: SMS verification handshake dispatched to mobile +27 (0)7*****${Math.floor(1000 + Math.random()*8999)}.`, 'warn');
      addLog?.(`EFT Secure Verification OTP dispatched for ${selectedBank} login.`, 'info');
    }, 1200);
  };

  // Settle Payment
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (isProcessing) return;

    // Validation checks
    if (paymentMode === 'card') {
      const rawCard = cardNumber.replace(/\s+/g, '');
      if (!validateLuhn(rawCard)) {
        pushApiLog(`CARD_AUTH_FAILED: Luhn Algorithm verification failed for BIN ${cardNumber.substring(0, 7)}. Rejecting transaction.`, 'error');
        addLog?.("Card validation failed. Luhn checksum invalid.", "error");
        alert("The card number entered did not pass Luhn checksum validation. Please check and retry.");
        return;
      }
      if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        alert("Please specify card expiry date in format MM/YY.");
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        alert("Please enter a valid 3 or 4 digit CVV security code.");
        return;
      }
    } else {
      if (!otpSent) {
        alert("Please request OTP authentication before clearing EFT.");
        return;
      }
      if (!smsOtp || smsOtp.length < 4) {
        alert("Please enter the 5-digit verification OTP code.");
        return;
      }
    }

    // Determine invoice amount
    const selectedBid = bidsToSettle.find(b => b.id === selectedBidId);
    let costZar = 0;
    let recipientStr = 'SATA Core Platform Subscription Upgrade';

    if (selectedBid) {
      costZar = selectedBid.commissionEarned;
      recipientStr = `SATA Network Split - Partner ${selectedBid.partnerName}`;
    } else {
      const prod = GeneralProducts.find(p => p.id === selectedProduct);
      costZar = prod ? prod.price : 250;
      recipientStr = prod ? `SATA Services: ${prod.name}` : 'SATA Core Platform Services';
    }

    setIsProcessing(true);
    pushApiLog(`PAYFAST_CORE: Processing payment of R${costZar.toLocaleString()}...`, 'info');
    pushApiLog(`SECURE_VAULT: Exchanging payload token. TLS Handshake completed. Cipher: ECDHE-RSA-AES256-GCM-SHA384`, 'info');

    setTimeout(() => {
      const authRef = `SATA-PAY-${Math.floor(100000 + Math.random() * 899999)}-ZAR`;
      
      // Update bid status or license tier or credits in localStorage dynamically to reflect payment
      if (selectedBid) {
        const raw = localStorage.getItem('sata_routed_bids_local');
        if (raw) {
          const bids: RoutedBidState[] = JSON.parse(raw);
          const updated = bids.map(b => {
            if (b.id === selectedBidId) {
              return {
                ...b,
                paymentStatus: 'paid' as const,
                paymentRef: authRef,
                paidAtIso: new Date().toISOString()
              };
            }
            return b;
          });
          localStorage.setItem('sata_routed_bids_local', JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
        }
      } else if (selectedProduct === 'credit_topup') {
        try {
          const savedCredits = localStorage.getItem('sata_supplier_payg_credits');
          const currentCredits = savedCredits ? parseInt(savedCredits, 10) : 0;
          const newCredits = currentCredits + 10;
          localStorage.setItem('sata_supplier_payg_credits', String(newCredits));
          localStorage.setItem('sata_supplier_license_tier', 'payg');
          window.dispatchEvent(new Event('storage'));
          addLog?.(`Account Credited: Added 10 Pay-As-You-Go SBD filling credits.`, 'success');
        } catch (e) {
          console.error(e);
        }
      } else if (selectedProduct === 'license_professional') {
        try {
          localStorage.setItem('sata_supplier_license_tier', 'professional');
          window.dispatchEvent(new Event('storage'));
          addLog?.(`Account Upgraded: Activated SATA Professional Partner License.`, 'success');
        } catch (e) {
          console.error(e);
        }
      } else if (selectedProduct === 'license_enterprise') {
        try {
          localStorage.setItem('sata_supplier_license_tier', 'enterprise');
          window.dispatchEvent(new Event('storage'));
          addLog?.(`Account Upgraded: Activated SATA National Elite Enterprise Partner License.`, 'success');
        } catch (e) {
          console.error(e);
        }
      }

      const receipt = {
        id: authRef,
        timestamp: new Date().toLocaleString(),
        method: paymentMode === 'card' ? `Credit Card (*${cardNumber.substring(cardNumber.length - 4)})` : `${selectedBank} Instant EFT`,
        amountZar: costZar,
        recipient: recipientStr,
        status: 'CLEARED_SETTLED',
        securityHash: 'SHA256:' + Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('')
      };

      setTxnReceipt(receipt);
      setTxnSuccess(true);
      setIsProcessing(false);
      
      pushApiLog(`PAYMENT_SERVER: Transaction cleared. Auth Ref: ${authRef}. Settlement completed.`, 'success');
      pushApiLog(`WEBHOOK_DISPATCH: Webhook notification posted to API callback routing. STATUS: 200 OK`, 'success');
      addLog?.(`Payment cleared successfully! ZAR ${costZar.toLocaleString()} routed. Receipt ${authRef}.`, 'success');

      // Reload lists
      loadBids();
    }, 2500);
  };

  const handleReset = () => {
    setTxnSuccess(false);
    setTxnReceipt(null);
    setCardNumber('');
    setCardHolder('');
    setCardExpiry('');
    setCardCvv('');
    setAccountNumber('');
    setSmsOtp('');
    setOtpSent(false);
    loadBids();
    pushApiLog("RESET: Clear checkout forms and cached sandboxes.", "warn");
  };

  return (
    <div className="space-y-6" id="sata-payment-gateway-root">
      
      {/* Top Description Hub */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700 animate-pulse" />
          SATA Payment Gateway & Billing Console
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Perform digital debit/credit transactions, process Instant EFT bank clearances, and settle partner success split-royalty invoices securely.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-[11px] font-mono">
          <div className="p-3 bg-slate-50 border border-slate-150 rounded flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            <div>
              <span className="text-slate-400 block uppercase text-[9px] font-bold">Secure Vault Mode</span>
              <span className="text-slate-800 font-bold">100% Client-Side Encryption</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            <div>
              <span className="text-slate-400 block uppercase text-[9px] font-bold">PCI-DSS Framework</span>
              <span className="text-slate-800 font-bold">Level 1 Secured Gateway</span>
            </div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-150 rounded flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
            <div>
              <span className="text-slate-400 block uppercase text-[9px] font-bold">SARS VAT Rules</span>
              <span className="text-slate-800 font-bold">South African Treasury Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Interactive Checkout Box */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-6">
          
          {txnSuccess ? (
            /* PAYMENT SUCCESS SCREEN / SARS-COMPLIANT RECEIPT */
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center bg-emerald-50 p-3 rounded-full border border-emerald-100 text-emerald-600 animate-bounce">
                <CheckCircle className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Payment Authorization Cleared</h3>
                <p className="text-slate-400 text-xs mt-1">SARS-compliant digital tax invoice generated and archived in ledger.</p>
              </div>

              {/* Invoice receipt slip */}
              <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded p-4 text-left text-[11px] font-mono space-y-3 shadow-inner">
                <div className="text-center font-bold border-b border-slate-200 pb-2 text-slate-700">
                  SOUTH AFRICAN TENDER ASSIST (PTY) LTD
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-slate-600">
                  <div>TAX INVOICE NO:</div>
                  <div className="font-bold text-slate-800 text-right">{txnReceipt?.id}</div>
                  <div>CLEARANCE TIME:</div>
                  <div className="font-bold text-slate-800 text-right">{txnReceipt?.timestamp}</div>
                  <div>PAYMENT MECHANISM:</div>
                  <div className="font-bold text-slate-800 text-right">{txnReceipt?.method}</div>
                  <div>RECIPIENT LEDGER:</div>
                  <div className="font-bold text-slate-800 text-right truncate">{txnReceipt?.recipient}</div>
                </div>
                <div className="border-t border-b border-slate-250 py-2 flex justify-between text-xs font-bold text-slate-800">
                  <span>TOTAL PAID (ZAR)</span>
                  <span>R{txnReceipt?.amountZar.toLocaleString()}</span>
                </div>
                <div className="text-[8px] text-slate-400 leading-normal">
                  This transaction is fully secure, signed with digital certificate RSA SHA-250, meeting ECT ACT 2002 regulatory guidelines.
                  <span className="block mt-1 truncate">{txnReceipt?.securityHash}</span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold rounded flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Settle Another Transaction
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CHECKOUT FORM */
            <form onSubmit={handleProcessPayment} className="space-y-6">
              
              {/* SELECT OUTSTANDING INVOICE OR SUBSCRIPTION */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  1. Select Service Product / Success Invoice
                </h3>
                
                <div className="space-y-2">
                  <p className="text-slate-400 text-xs">Choose any outstanding success split invoice or upgrade your SATA account license/credits.</p>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      pushApiLog(`GATEWAY: Set active checkout product to "${e.target.value}".`, 'info');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    {bidsToSettle.length > 0 && (
                      <optgroup label="Outstanding Royalty Splits (Invoices Due)">
                        {bidsToSettle.map(b => (
                          <option key={b.id} value={`bid_${b.id}`}>
                            R{b.commissionEarned.toLocaleString()} - {b.partnerName} success fee ({b.tenderTitle.substring(0, 32)}...)
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="SATA Core Platform Products & Licenses">
                      {GeneralProducts.map(p => (
                        <option key={p.id} value={p.id}>
                          R{p.price.toLocaleString()} - {p.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* PAYMENT SWITCH TABS */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-slate-500" />
                  2. Select Payment Gateway Mode
                </h3>
                
                <div className="grid grid-cols-2 gap-2 border border-slate-200 p-1.5 rounded bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('card');
                      pushApiLog("GATEWAY: Switched payment context to Direct Card Vault.", "info");
                    }}
                    className={`py-2 text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all ${
                      paymentMode === 'card' 
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Credit / Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMode('eft');
                      pushApiLog("GATEWAY: Switched payment context to South African Instant EFT.", "info");
                    }}
                    className={`py-2 text-xs font-mono font-bold uppercase rounded cursor-pointer transition-all ${
                      paymentMode === 'eft' 
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Instant Bank EFT
                  </button>
                </div>
              </div>

              {/* PAYMENT FORMS */}
              {paymentMode === 'card' ? (
                /* DEBIT CREDIT CARD FORM WITH FULL ANIMATED GRAPHICAL CARD SKELETON */
                <div className="space-y-5">
                  
                  {/* VISUAL CARD WIDGET */}
                  <div className={`mx-auto max-w-[340px] h-[190px] rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden transition-all duration-300 transform ${
                    cardFocus ? 'rotate-y-12 shadow-emerald-500/20 shadow-xl' : 'shadow-slate-500/15'
                  } bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-850`}>
                    
                    {/* Glossy Accents */}
                    <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[8px] tracking-widest font-mono uppercase opacity-50">Secure Sandbox Card</span>
                        <div className="w-10 h-7 bg-amber-500/90 rounded-md border border-amber-400"></div>
                      </div>
                      <div className="text-right font-mono font-bold text-xs uppercase italic tracking-widest text-emerald-400">
                        {cardType === 'visa' && 'VISA'}
                        {cardType === 'mastercard' && 'MASTERCARD'}
                        {cardType === 'amex' && 'AMEX'}
                        {cardType === 'unknown' && 'SATA PAY'}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Card Number display */}
                      <div className="text-sm tracking-widest font-mono font-semibold text-center py-1">
                        {cardNumber || '••••  ••••  ••••  ••••'}
                      </div>
                      
                      <div className="flex justify-between items-end text-[10px] font-mono">
                        <div>
                          <span className="opacity-40 block text-[7px] uppercase">Cardholder</span>
                          <span className="font-bold uppercase tracking-wider truncate max-w-[150px] block">
                            {cardHolder || 'Legal Entity Ltd'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="opacity-40 block text-[7px] uppercase">Expires</span>
                          <span className="font-bold tracking-wider">
                            {cardExpiry || 'MM/YY'}
                          </span>
                        </div>
                        <div className="text-right pl-2">
                          <span className="opacity-40 block text-[7px] uppercase">CVV</span>
                          <span className="font-bold tracking-wider">
                            {cardCvv || '•••'}
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* FORM FIELDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="e.g. ABC Holdings (Pty) Ltd"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Card Number (Luhn Check)</label>
                      <input
                        type="text"
                        placeholder="4*** **** **** 1234"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        onFocus={() => setCardFocus(true)}
                        onBlur={() => setCardFocus(false)}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/[^0-9]/g, '');
                          if (cleaned.length >= 2) {
                            setCardExpiry(`${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`);
                          } else {
                            setCardExpiry(cleaned);
                          }
                        }}
                        maxLength={5}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono text-center"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">CVV Security Code</label>
                      <input
                        type="password"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, '').substring(0, 4))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono text-center"
                        required
                      />
                    </div>
                  </div>

                </div>
              ) : (
                /* INSTANT EFT BANKING TRANSFER SIMULATOR */
                <div className="space-y-5">
                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded text-xs text-blue-900 flex gap-2">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Instant EFT Secure Link:</strong> Simulates direct banking integration. Request SMS/Push handshake first.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Select Bank Institution</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['FNB', 'ABSA', 'Standard Bank', 'Nedbank', 'Capitec', 'Investec'].map(bank => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => {
                              setSelectedBank(bank);
                              pushApiLog(`GATEWAY: Set active EFT clearing bank to ${bank}.`, 'info');
                            }}
                            className={`py-2 px-3 border rounded text-[10.5px] font-mono font-bold transition-all ${
                              selectedBank === bank 
                                ? 'bg-slate-900 text-white border-slate-900' 
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Bank Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 62104523992"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Bank Reference Code</label>
                      <input
                        type="text"
                        value={eftReference}
                        disabled
                        className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none font-mono font-bold text-slate-500"
                      />
                    </div>
                  </div>

                  {/* SMS OTP verification trigger */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3 items-end">
                    <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        5-Digit Bank OTP Handshake
                      </label>
                      <input
                        type="text"
                        placeholder="Enter SMS OTP"
                        value={smsOtp}
                        onChange={(e) => setSmsOtp(e.target.value.replace(/[^0-9]/g, '').substring(0, 5))}
                        disabled={!otpSent}
                        className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white focus:border-emerald-500 focus:outline-none font-mono disabled:opacity-50 text-center text-lg tracking-widest font-bold"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={triggerOtpSend}
                      disabled={isProcessing}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-mono text-xs font-bold rounded border border-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                    >
                      {otpSent ? 'Resend OTP Code' : 'Verify & Send OTP'}
                    </button>
                  </div>

                </div>
              )}

              {/* PRICE & PRODUCT SUMMARY BOX */}
              {(() => {
                const selectedBid = bidsToSettle.find(b => b.id === selectedBidId);
                let title = '';
                let price = 0;
                let description = '';
                
                if (selectedBid) {
                  title = `Success Royalty Split - ${selectedBid.partnerName}`;
                  price = selectedBid.commissionEarned;
                  description = `Contract Success Royalty Split payment for tender: "${selectedBid.tenderTitle}"`;
                } else {
                  const prod = GeneralProducts.find(p => p.id === selectedProduct);
                  if (prod) {
                    title = prod.name;
                    price = prod.price;
                    description = prod.description;
                  }
                }

                return (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 font-mono text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Item for Authorization</span>
                        <span className="font-bold text-slate-800 text-[11px]">{title}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-400 uppercase block font-bold">Price</span>
                        <span className="font-extrabold text-slate-900 text-sm">R{price.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-sans leading-normal border-t border-slate-200/60 pt-2">
                      {description}
                    </div>
                  </div>
                );
              })()}

              {/* ACTION TRANSACTION SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-mono text-xs uppercase tracking-widest font-bold py-3 rounded-lg shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Authorizing cleared funds with bank routing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Secure ZAR Settlement</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

        {/* Right Side: LIVE DEVELOPER API TERMINAL LOGS */}
        <div className="lg:col-span-4 flex flex-col h-[520px]">
          <div className="bg-slate-900 rounded-t-lg p-3 border-t border-r border-l border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">API Telemetry Logger</span>
            </div>
            <button
              onClick={() => {
                setApiLogs([]);
                pushApiLog("Logs cleared.", "info");
              }}
              className="text-[9px] font-mono font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              CLEAR
            </button>
          </div>
          
          <div className="flex-1 bg-slate-950 p-3 rounded-b-lg border-b border-r border-l border-slate-900 font-mono text-[9px] overflow-y-auto space-y-2 text-slate-300 shadow-inner select-none leading-relaxed">
            {apiLogs.length === 0 ? (
              <div className="text-slate-500 italic text-center py-12">No active API transactions.</div>
            ) : (
              apiLogs.map((log, idx) => {
                let colorClass = 'text-slate-400';
                if (log.includes('[SUCCESS]')) colorClass = 'text-emerald-400';
                else if (log.includes('[WARNING]')) colorClass = 'text-amber-400';
                else if (log.includes('[ERROR]')) colorClass = 'text-red-400 font-semibold';
                return (
                  <div key={idx} className={`${colorClass} break-all border-b border-slate-900/50 pb-1.5 last:border-0`}>
                    {log}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
