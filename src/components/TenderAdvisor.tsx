/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Percent, 
  DollarSign, 
  ShieldAlert, 
  Info, 
  ArrowRight, 
  Download, 
  CheckCircle,
  PiggyBank,
  Briefcase,
  FileText,
  AlertTriangle,
  Lightbulb,
  Server,
  Coins,
  Users,
  Award,
  ShieldCheck,
  Activity,
  Zap,
  Cloud,
  Database
} from 'lucide-react';
import { DigitalCertificate } from '../types';
import DeveloperAdvisorPanel from './DeveloperAdvisorPanel';

interface TenderAdvisorProps {
  prefilledTender: {
    referenceNumber: string;
    title: string;
    procuringInstitution: string;
  } | null;
  activeCert: DigitalCertificate | null;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  onNavigateToFiller?: () => void;
}

export default function TenderAdvisor({ prefilledTender, activeCert, addLog, onNavigateToFiller }: TenderAdvisorProps) {
  // Navigation Mode Toggle
  const [activeMode, setActiveMode] = useState<'supplier' | 'developer'>('supplier');

  // Developer Strategy Simulator State
  const [monthlyActiveSuppliers, setMonthlyActiveSuppliers] = useState<number>(120);
  const [pkiSigningSurcharge, setPkiSigningSurcharge] = useState<number>(150); // R150 ZAR
  const [pkiSignPercentage, setPkiSignPercentage] = useState<number>(75); // 75% sign certificates
  const [premiumSaaSPrice, setPremiumSaaSPrice] = useState<number>(850); // R850/month
  const [premiumSaaSPenetration, setPremiumSaaSPenetration] = useState<number>(15); // 15% penetration
  const [jvMatchmakingFee, setJvMatchmakingFee] = useState<number>(2500); // R2,500/match
  const [jvMatchmakingCount, setJvMatchmakingCount] = useState<number>(5); // 5 matches/month
  const [buyerAuditDeskPrice, setBuyerAuditDeskPrice] = useState<number>(5000); // R5,000/month
  const [buyerAuditDeskCount, setBuyerAuditDeskCount] = useState<number>(2); // 2 departments

  // Financial State
  const [tenderRef, setTenderRef] = useState(prefilledTender?.referenceNumber || '');
  const [tenderTitle, setTenderTitle] = useState(prefilledTender?.title || '');
  const [institution, setInstitution] = useState(prefilledTender?.procuringInstitution || '');
  const [estimatedBudget, setEstimatedBudget] = useState<number>(250000); // Default R250,000

  // Cost to deliver inputs
  const [materialsCost, setMaterialsCost] = useState<number>(80000);
  const [laborCost, setLaborCost] = useState<number>(50000);
  const [logisticsCost, setLogisticsCost] = useState<number>(15000);
  const [contingencyRate, setContingencyRate] = useState<number>(10); // 10%

  // Markup state
  const [markupRate, setMarkupRate] = useState<number>(25); // Default 25% markup
  
  // Tax & Business reserves config
  const [isVatRegistered, setIsVatRegistered] = useState<boolean>(true);
  const [businessReserveRate, setBusinessReserveRate] = useState<number>(20); // 20% of net profits set aside to run business
  
  // Update state if prefilledTender changes
  useEffect(() => {
    if (prefilledTender) {
      setTenderRef(prefilledTender.referenceNumber);
      setTenderTitle(prefilledTender.title);
      setInstitution(prefilledTender.procuringInstitution);
      addLog?.(`Financial Advisor loaded tender profile: ${prefilledTender.referenceNumber}`, 'info');
    }
  }, [prefilledTender]);

  // Derived calculations
  const directCosts = materialsCost + laborCost + logisticsCost;
  const contingencyAmount = Math.round(directCosts * (contingencyRate / 100));
  const totalDeliveryCost = directCosts + contingencyAmount;

  // Pricing Proposal
  const proposedMarkupAmount = Math.round(totalDeliveryCost * (markupRate / 100));
  const proposedBidPriceBeforeVat = totalDeliveryCost + proposedMarkupAmount;
  
  // VAT handling (15% in South Africa)
  const vatAmount = isVatRegistered ? Math.round(proposedBidPriceBeforeVat * 0.15) : 0;
  const totalBidPriceWithVat = proposedBidPriceBeforeVat + vatAmount;

  // Profit breakdown
  const grossProfit = proposedMarkupAmount;
  const corporateTaxReserve = Math.round(grossProfit * 0.27); // 27% SA corporate tax
  const operationalBusinessReserve = Math.round(grossProfit * (businessReserveRate / 100));
  const takeHomeProfit = grossProfit - corporateTaxReserve - operationalBusinessReserve;

  // Profit margin metrics
  const grossProfitMargin = proposedBidPriceBeforeVat > 0 ? (grossProfit / proposedBidPriceBeforeVat) * 100 : 0;
  const netTakeHomeMargin = proposedBidPriceBeforeVat > 0 ? (takeHomeProfit / proposedBidPriceBeforeVat) * 100 : 0;

  // Formatted currencies (South African Rand - ZAR)
  const formatZAR = (num: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(num);
  };

  // Sync pricing proposal calculations to localStorage
  useEffect(() => {
    try {
      const proposalObj = {
        tenderRef,
        tenderTitle,
        institution,
        estimatedBudget,
        materialsCost,
        laborCost,
        logisticsCost,
        contingencyRate,
        contingencyAmount,
        totalDeliveryCost,
        markupRate,
        proposedMarkupAmount,
        proposedBidPriceBeforeVat,
        isVatRegistered,
        vatAmount,
        totalBidPriceWithVat,
        grossProfit,
        corporateTaxReserve,
        operationalBusinessReserve,
        takeHomeProfit,
        grossProfitMargin,
        netTakeHomeMargin,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('sata_active_pricing_proposal', JSON.stringify(proposalObj));
    } catch (e) {
      console.warn('Failed to save active pricing proposal from TenderAdvisor:', e);
    }
  }, [
    tenderRef,
    tenderTitle,
    institution,
    estimatedBudget,
    materialsCost,
    laborCost,
    logisticsCost,
    contingencyRate,
    contingencyAmount,
    totalDeliveryCost,
    markupRate,
    proposedMarkupAmount,
    proposedBidPriceBeforeVat,
    isVatRegistered,
    vatAmount,
    totalBidPriceWithVat,
    grossProfit,
    corporateTaxReserve,
    operationalBusinessReserve,
    takeHomeProfit,
    grossProfitMargin,
    netTakeHomeMargin
  ]);

  const handlePrintWorksheet = () => {
    window.print();
    addLog?.('Printed or exported Tender Financial Feasibility Worksheet.', 'success');
  };

  // Dynamically generated narrative advice
  const getMarkupGuideline = () => {
    if (markupRate < 10) {
      return {
        text: 'Ultra-competitive but high-risk. Your profit margins are extremely thin. Any unexpected delay or cost spike could turn this tender into a loss-making project.',
        status: 'danger'
      };
    } else if (markupRate <= 20) {
      return {
        text: 'Highly competitive and compliant. Suitable for high-volume general supplies or commoditized logistics tenders where pricing is the primary deciding factor.',
        status: 'info'
      };
    } else if (markupRate <= 35) {
      return {
        text: 'Balanced & highly sustainable. Ideal for professional services, IT development, custom fabrications, and specialized technical consultancies.',
        status: 'success'
      };
    } else {
      return {
        text: 'Premium margins. Generous profit opportunity, but ensure your quality of proposal, B-BBEE rating, and local content compliance justify this pricing tier.',
        status: 'warning'
      };
    }
  };

  const advice = getMarkupGuideline();

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0" id="tender-advisor-root">
      
      {/* Visual Header Panel */}
      <div className="bg-slate-900 border border-slate-950 rounded-xl p-6 text-white relative overflow-hidden shadow-md print:bg-white print:text-slate-900 print:border-none print:shadow-none">
        <div className="flex flex-col md:flex-row items-start justify-between gap-4 relative z-10">
          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-emerald-600 font-mono font-bold uppercase tracking-wider text-white">
              <Calculator className="w-3.5 h-3.5" />
              Tender Financial Advisor & Cost Estimator
            </div>
            <h2 className="text-xl font-bold font-display tracking-tight">
              Tender Bid Feasibility & Profit Maximization Planner
            </h2>
            <p className="text-slate-400 text-xs max-w-2xl print:text-slate-600">
              Evaluate real execution costs, apply strategic South African market markups, model SARS corporate tax reserves, and configure business reinvestment buffers to submit a financially healthy, sustainable bid.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 print:hidden">
            <button
              onClick={handlePrintWorksheet}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export PDF / Print
            </button>
          </div>
        </div>

        {/* Decorative background visual */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-10 translate-y-10">
          <TrendingUp className="w-64 h-64 text-emerald-400" />
        </div>
      </div>

      {/* Strategic Mode Selector Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-lg border border-slate-300 max-w-lg print:hidden" id="advisor-strategic-tabs">
        <button
          onClick={() => {
            setActiveMode('supplier');
            addLog?.('Loaded Supplier Bid Feasibility Workspace', 'info');
          }}
          className={`flex-1 py-1.5 px-3 rounded text-[10.5px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMode === 'supplier' 
              ? 'bg-slate-900 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          id="tab-supplier-feasibility"
        >
          <Calculator className="w-3.5 h-3.5" />
          Supplier Feasibility Planner
        </button>
        <button
          onClick={() => {
            setActiveMode('developer');
            addLog?.('Loaded Zero-Cost Developer Deployment & Monetization Blueprint', 'success');
          }}
          className={`flex-1 py-1.5 px-3 rounded text-[10.5px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMode === 'developer' 
              ? 'bg-emerald-700 text-white shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
          id="tab-developer-monetization"
        >
          <Coins className="w-3.5 h-3.5" />
          Developer SaaS Strategy
        </button>
      </div>

      {activeMode === 'supplier' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Input Configuration Panel (Cols 7) */}
        <div className="lg:col-span-7 space-y-6 print:col-span-12">
          
          {/* Section A: Tender Profile Information */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono">
                1. Target Tender Profile
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Tender Reference Number
                </label>
                <input
                  type="text"
                  value={tenderRef}
                  onChange={(e) => setTenderRef(e.target.value)}
                  placeholder="e.g. WCG 045/2026"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Procuring Organ of State
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Western Cape Department of Health"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Tender Title / Scope of Work
                </label>
                <input
                  type="text"
                  value={tenderTitle}
                  onChange={(e) => setTenderTitle(e.target.value)}
                  placeholder="e.g. Provision of specialized consulting and systems integration services"
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Estimated Tender Budget (Max Value)
                  </label>
                  <span className="text-xs font-bold font-mono text-emerald-800">{formatZAR(estimatedBudget)}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={5000000}
                  step={50000}
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[8px] text-slate-400 font-mono mt-1">
                  <span>R50K</span>
                  <span>R1.5M</span>
                  <span>R3M</span>
                  <span>R5M Max</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Delivery & Execution Cost Breakdown */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                2. Real Execution Costs to Deliver
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Materials Cost Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-500 uppercase">Materials & Supplies</span>
                  <span className="font-bold text-slate-700">{formatZAR(materialsCost)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={5000}
                  value={materialsCost}
                  onChange={(e) => setMaterialsCost(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-slate-400">Inventory, raw materials, subcontracted vendor quotes.</p>
              </div>

              {/* Labor Cost Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-500 uppercase">Staff & Labor Wages</span>
                  <span className="font-bold text-slate-700">{formatZAR(laborCost)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1000000}
                  step={5000}
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-slate-400">Payroll, hourly wages, site supervisors, technical experts.</p>
              </div>

              {/* Logistics Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-500 uppercase">Logistics & Site Costs</span>
                  <span className="font-bold text-slate-700">{formatZAR(logisticsCost)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={2000}
                  value={logisticsCost}
                  onChange={(e) => setLogisticsCost(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-slate-400">Vehicle rental, fuel, specialized transport, permit acquisitions.</p>
              </div>

              {/* Contingency Rate Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-500 uppercase">Risk Contingency Buffer</span>
                  <span className="font-bold text-slate-700">{contingencyRate}% ({formatZAR(contingencyAmount)})</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={25}
                  step={1}
                  value={contingencyRate}
                  onChange={(e) => setContingencyRate(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-slate-400">Reserve for price hikes, site adjustments or delivery slippage.</p>
              </div>
            </div>

            {/* Total Delivery cost block */}
            <div className="mt-3 p-3.5 bg-slate-50 border border-slate-100 rounded flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">TOTAL ESTIMATED EXECUTION COST</span>
                <p className="text-[9px] text-slate-400 mt-0.5">Sum of materials, labor, logistics + contingency</p>
              </div>
              <span className="text-lg font-black font-mono text-slate-800">{formatZAR(totalDeliveryCost)}</span>
            </div>
          </div>

          {/* Section C: Markup Strategizer & Proposal */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                3. Market Markup & Profit Optimizer
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Proposed Profit Markup Percentage
                  </label>
                  <p className="text-[9px] text-slate-400">Adjust the margin to balance competitiveness and reward.</p>
                </div>
                <span className="text-base font-black font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  {markupRate}%
                </span>
              </div>

              <input
                type="range"
                min={5}
                max={60}
                step={1}
                value={markupRate}
                onChange={(e) => setMarkupRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg appearance-none"
              />

              {/* Dynamic Markup Guidance Context Card */}
              <div className={`p-3.5 rounded-lg border flex items-start gap-2.5 text-xs ${
                advice.status === 'danger' ? 'bg-red-50/75 border-red-200 text-red-900' :
                advice.status === 'warning' ? 'bg-amber-50/75 border-amber-200 text-amber-900' :
                advice.status === 'success' ? 'bg-emerald-50/75 border-emerald-200 text-emerald-900' :
                'bg-blue-50/75 border-blue-200 text-blue-900'
              }`}>
                <Lightbulb className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[9px] font-mono">Markup Health-Check Advisor:</span>
                  <p className="leading-relaxed text-[11px]">{advice.text}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section D: Taxes & Business Reserves Alignment */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-slate-400" />
                4. Statutory Deductions & Business Reserves
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* VAT Registration Status Switch */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-slate-400" /> SARS VAT Registration
                  </span>
                  <p className="text-[9px] text-slate-400">Is your business a registered VAT vendor?</p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isVatRegistered}
                    onChange={(e) => setIsVatRegistered(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Business Running Capital Reserve Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="font-bold text-slate-500 uppercase">Operational Reserve</span>
                  <span className="font-bold text-slate-700">{businessReserveRate}% ({formatZAR(operationalBusinessReserve)})</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={40}
                  step={5}
                  value={businessReserveRate}
                  onChange={(e) => setBusinessReserveRate(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1 bg-slate-100 rounded-lg appearance-none"
                />
                <p className="text-[9px] text-slate-400">Put aside to run the business, pay overheads, buy tools.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Proposal Summary Sheet & Dynamic Financial Dashboard (Cols 5) */}
        <div className="lg:col-span-5 space-y-6 print:col-span-12">
          
          {/* Bid Summary Matrix Display */}
          <div className="bg-slate-950 text-white rounded-xl border border-slate-800 shadow-lg p-5 space-y-5 print:text-slate-900 print:bg-white print:border-none print:shadow-none">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Pricing Proposal Proposal Summary</span>
              <h3 className="text-sm font-bold tracking-tight text-white mt-1 print:text-slate-800">Tender Financial Projections Worksheet</h3>
            </div>

            {/* Price Cards */}
            <div className="grid grid-cols-1 gap-3">
              
              {/* Proposed Bid Price (Excl VAT) */}
              <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 print:border-slate-200">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Proposed Bid Price (Excl. VAT)</span>
                <div className="text-2xl font-black font-mono text-white mt-1 print:text-slate-900">
                  {formatZAR(proposedBidPriceBeforeVat)}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Budget limit comparison: {proposedBidPriceBeforeVat > estimatedBudget ? (
                    <span className="text-red-400 font-semibold flex items-center gap-0.5 mt-0.5"><AlertTriangle className="w-3 h-3" /> Exceeds estimated budget of {formatZAR(estimatedBudget)}</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-0.5 mt-0.5"><CheckCircle className="w-3 h-3" /> Complies with budget threshold</span>
                  )}
                </p>
              </div>

              {/* VAT component & Total including VAT */}
              {isVatRegistered && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80 text-xs">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">15% VAT Collected</span>
                    <span className="font-bold font-mono text-slate-300 block mt-1">{formatZAR(vatAmount)}</span>
                  </div>
                  <div className="bg-slate-900/50 p-2.5 rounded border border-slate-800/80 text-xs">
                    <span className="text-[9px] font-mono text-slate-500 uppercase block">Total Bid (Incl. VAT)</span>
                    <span className="font-bold font-mono text-emerald-400 block mt-1">{formatZAR(totalBidPriceWithVat)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Health bars / visual breakdown */}
            <div className="space-y-2.5 bg-slate-900 p-4 rounded-lg border border-slate-850">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block">Financial Allocations (Pre-VAT Bid Value)</span>
              
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-slate-400 h-full transition-all duration-300" 
                  style={{ width: `${(totalDeliveryCost / proposedBidPriceBeforeVat) * 100}%` }}
                  title={`Cost: ${Math.round((totalDeliveryCost / proposedBidPriceBeforeVat) * 100)}%`}
                ></div>
                <div 
                  className="bg-red-500 h-full transition-all duration-300" 
                  style={{ width: `${(corporateTaxReserve / proposedBidPriceBeforeVat) * 100}%` }}
                  title={`SARS Tax: ${Math.round((corporateTaxReserve / proposedBidPriceBeforeVat) * 100)}%`}
                ></div>
                <div 
                  className="bg-blue-500 h-full transition-all duration-300" 
                  style={{ width: `${(operationalBusinessReserve / proposedBidPriceBeforeVat) * 100}%` }}
                  title={`Business Reserve: ${Math.round((operationalBusinessReserve / proposedBidPriceBeforeVat) * 100)}%`}
                ></div>
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${(takeHomeProfit / proposedBidPriceBeforeVat) * 100}%` }}
                  title={`Take home: ${Math.round((takeHomeProfit / proposedBidPriceBeforeVat) * 100)}%`}
                ></div>
              </div>

              {/* Legend with percentages and absolute values */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] font-mono">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="w-2.5 h-2.5 bg-slate-400 rounded-sm"></div>
                    <span>Delivery Cost</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{formatZAR(totalDeliveryCost)} ({Math.round((totalDeliveryCost / proposedBidPriceBeforeVat) * 100)}%)</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div>
                    <span>SARS CIT Tax</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{formatZAR(corporateTaxReserve)} (27% profit)</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-sm"></div>
                    <span>Biz Buffer</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{formatZAR(operationalBusinessReserve)} ({businessReserveRate}%)</span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div>
                    <span>Net Take-home</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-semibold">{formatZAR(takeHomeProfit)} ({Math.round(netTakeHomeMargin)}%)</span>
                </div>
              </div>
            </div>

            {/* Profit Margin Breakdown Metrics */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Profitability Matrix</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                
                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Gross Profit Margin</span>
                  <div className="text-xl font-bold font-mono text-slate-100 mt-1">{grossProfitMargin.toFixed(1)}%</div>
                  <p className="text-[8px] text-slate-500 mt-1">Revenue minus direct execution costs.</p>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-800 flex flex-col justify-between">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">Net Discretionary Margin</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{netTakeHomeMargin.toFixed(1)}%</div>
                  <p className="text-[8px] text-slate-500 mt-1">Take-home funds after tax & operations.</p>
                </div>

              </div>
            </div>

            {/* VAT registration compliance warning */}
            {proposedBidPriceBeforeVat > 1000000 && !isVatRegistered && (
              <div className="p-3 bg-red-950/40 border border-red-900 rounded-lg flex items-start gap-2 text-xs text-red-200">
                <ShieldAlert className="w-4.5 h-4.5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-[8px] font-mono block">SARS Threshold Alert:</span>
                  <p className="leading-relaxed text-[10px]">
                    Your bid exceeds R1,000,000. Under South African law, any business generating over R1M in taxable supplies is legally required to register for VAT. Turn on VAT registration in Section 4.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Compliance Guidelines Card */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 font-mono flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              National Treasury Compliance Guide
            </h4>
            <ul className="space-y-2 text-[11px] text-slate-500 font-sans">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                <p>
                  <strong>ECT Act 2002 Compliant Signing:</strong> Once you determine the bid price, prefill your SBD disclosure documents and sign them using your digital PKI certificate.
                </p>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5"></span>
                <p>
                  <strong>B-BBEE Preference Allocation:</strong> Apply your SBD 6.1 preference points claims to maximize your competitive score under 80/20 or 90/10 regulations.
                </p>
              </li>
              {onNavigateToFiller && (
                <li className="pt-2">
                  <button
                    onClick={onNavigateToFiller}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold font-mono text-[9px] uppercase tracking-wider py-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Proceed to Fill SBD Forms
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </li>
              )}
            </ul>
          </div>

        </div>

      </div>
      ) : (
        <DeveloperAdvisorPanel addLog={addLog} />
      )}

    </div>
  );
}
