/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  Percent, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle, 
  Download, 
  Upload, 
  Trash2, 
  Info,
  Scale,
  Plus,
  Trash,
  Sparkles,
  AlertTriangle,
  RefreshCcw,
  Layers,
  Activity,
  Coins,
  ArrowRight,
  ShieldAlert,
  Award,
  Calendar,
  Clock
} from 'lucide-react';

interface ProfitCalculatorProps {
  addLog?: (message: string, type: 'info' | 'success' | 'warn' | 'error') => void;
}

interface CostItem {
  id: string;
  description: string;
  category: 'materials' | 'labor' | 'subcontractors' | 'overhead' | 'other';
  amount: number;
  milestoneId?: string; // Links cost item to milestone
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  weight: number; // payment percentage of bidValue (cumulative must sum to 100)
  startDate?: string; // YYYY-MM-DD
  durationDays?: number;
}

export default function TenderProfitCalculator({ addLog }: ProfitCalculatorProps) {
  const [bidValue, setBidValue] = useState<number>(500000);
  const [isVatRegistered, setIsVatRegistered] = useState<boolean>(true);
  const [targetMargin, setTargetMargin] = useState<number>(20); // target gross percentage
  
  // Custom cost breakdown list with prefilled milestone IDs matching defaults
  const [costItems, setCostItems] = useState<CostItem[]>([
    { id: '1', description: 'Direct Materials & Equipment procurement', category: 'materials', amount: 200000, milestoneId: 'm2' },
    { id: '2', description: 'Skilled labor & project engineering staff', category: 'labor', amount: 120000, milestoneId: 'm3' },
    { id: '3', description: 'Site logistics, transport & travel allowance', category: 'overhead', amount: 30000, milestoneId: 'm1' },
    { id: '4', description: 'Performance insurance bond & surety fee', category: 'other', amount: 15000, milestoneId: 'm1' }
  ]);

  // Project milestones configuration (Defaults align with standard municipal infrastructure / delivery contracts)
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 'm1', title: 'Mobilization & Assessment', description: 'Site setup, initial logistics, and health/safety plan approvals.', weight: 15, startDate: '2026-08-01', durationDays: 15 },
    { id: 'm2', title: 'Procurement & Site Delivery', description: 'Procuring hardware, core equipment, and bulk delivery to site.', weight: 45, startDate: '2026-08-16', durationDays: 30 },
    { id: 'm3', title: 'Installation & Technical Setup', description: 'Engineering setups, assembly, physical installation, and integration.', weight: 25, startDate: '2026-09-15', durationDays: 20 },
    { id: 'm4', title: 'Commissioning & Training Closeout', description: 'System sign-offs, training, closeout reports, and handover.', weight: 15, startDate: '2026-10-05', durationDays: 10 }
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState<'ledger' | 'milestones' | 'proposer' | 'timeline'>('ledger');

  // New cost form fields
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<'materials' | 'labor' | 'subcontractors' | 'overhead' | 'other'>('materials');
  const [newAmount, setNewAmount] = useState<number>(0);
  const [newMilestoneId, setNewMilestoneId] = useState<string>('unassigned');

  // Load calculator state from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sata_tender_profit_calc');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.bidValue !== undefined) setBidValue(parsed.bidValue);
        if (parsed.isVatRegistered !== undefined) setIsVatRegistered(parsed.isVatRegistered);
        if (parsed.targetMargin !== undefined) setTargetMargin(parsed.targetMargin);
        if (parsed.costItems !== undefined) setCostItems(parsed.costItems);
        if (parsed.milestones !== undefined) setMilestones(parsed.milestones);
      }
    } catch (e) {
      console.error('Error loading profit calculator state:', e);
    }
  }, []);

  // Save calculator state on change
  const saveCalculatorState = (
    updatedBid: number, 
    updatedVat: boolean, 
    updatedMargin: number, 
    updatedCosts: CostItem[],
    updatedMilestones?: Milestone[]
  ) => {
    try {
      const stateObj = {
        bidValue: updatedBid,
        isVatRegistered: updatedVat,
        targetMargin: updatedMargin,
        costItems: updatedCosts,
        milestones: updatedMilestones || milestones
      };
      localStorage.setItem('sata_tender_profit_calc', JSON.stringify(stateObj));
    } catch (e) {
      console.error('Error saving profit calculator state:', e);
    }
  };

  // Add cost item
  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || newAmount <= 0) return;

    const newItem: CostItem = {
      id: Date.now().toString(),
      description: newDesc.trim(),
      category: newCat,
      amount: newAmount,
      milestoneId: newMilestoneId === 'unassigned' ? undefined : newMilestoneId
    };

    const updated = [...costItems, newItem];
    setCostItems(updated);
    saveCalculatorState(bidValue, isVatRegistered, targetMargin, updated);
    
    // Reset inputs
    setNewDesc('');
    setNewAmount(0);
    setNewMilestoneId('unassigned');
    addLog?.(`Added cost component: "${newItem.description}" (R${newItem.amount.toLocaleString()})`, 'success');
  };

  // Delete cost item
  const handleDeleteCost = (id: string, name: string) => {
    const updated = costItems.filter(item => item.id !== id);
    setCostItems(updated);
    saveCalculatorState(bidValue, isVatRegistered, targetMargin, updated);
    addLog?.(`Removed cost component: "${name}"`, 'warn');
  };

  // Update inline milestone assignment
  const handleUpdateCostMilestone = (itemId: string, mId: string) => {
    const updated = costItems.map(item => {
      if (item.id === itemId) {
        return { ...item, milestoneId: mId === 'unassigned' ? undefined : mId };
      }
      return item;
    });
    setCostItems(updated);
    saveCalculatorState(bidValue, isVatRegistered, targetMargin, updated);
    addLog?.(`Reallocated cost to another milestone.`, 'info');
  };

  // Update individual milestone weight
  const handleUpdateMilestoneWeight = (mId: string, weight: number) => {
    const updated = milestones.map(m => {
      if (m.id === mId) {
        return { ...m, weight: Math.max(0, weight) };
      }
      return m;
    });
    setMilestones(updated);
    saveCalculatorState(bidValue, isVatRegistered, targetMargin, costItems, updated);
  };

  // Standard Calculations
  const totalDirectCosts = costItems.reduce((acc, item) => acc + item.amount, 0);
  const vatRate = 0.15;
  const rawVatAmount = isVatRegistered ? (bidValue * vatRate) : 0;
  const grossBidInclVat = bidValue + rawVatAmount;

  // Gross profit details
  const grossProfit = bidValue - totalDirectCosts;
  const actualMarginPercent = bidValue > 0 ? (grossProfit / bidValue) * 100 : 0;

  // Projected Income Tax (SA Corporate Income Tax is 27%)
  const corporateTaxRate = 0.27;
  const projectedIncomeTax = grossProfit > 0 ? (grossProfit * corporateTaxRate) : 0;
  const netProjectedProfit = grossProfit - projectedIncomeTax;
  const netMarginPercent = bidValue > 0 ? (netProjectedProfit / bidValue) * 100 : 0;

  const isMarginMeetingTarget = actualMarginPercent >= targetMargin;

  // Milestone Cumulative weight check
  const totalMilestoneWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const isWeightsValid = totalMilestoneWeight === 100;

  // Compute precise financials per milestone
  const getMilestoneFinancials = (m: Milestone) => {
    // 1. Direct assigned costs
    const assignedCostsList = costItems.filter(item => item.milestoneId === m.id);
    const assignedCostTotal = assignedCostsList.reduce((sum, item) => sum + item.amount, 0);

    // 2. Unassigned costs distributed proportionally based on milestone weight
    const unassignedCostsList = costItems.filter(item => !item.milestoneId || !milestones.some(ms => ms.id === item.milestoneId));
    const totalUnassignedCost = unassignedCostsList.reduce((sum, item) => sum + item.amount, 0);
    const unassignedShare = (m.weight / 100) * totalUnassignedCost;

    const totalAllocatedCost = assignedCostTotal + unassignedShare;
    const allocatedRevenue = (m.weight / 100) * bidValue;
    const netProfitOrLoss = allocatedRevenue - totalAllocatedCost;
    const marginPercent = allocatedRevenue > 0 ? (netProfitOrLoss / allocatedRevenue) * 100 : 0;

    return {
      assignedCostTotal,
      unassignedShare,
      totalAllocatedCost,
      allocatedRevenue,
      netProfitOrLoss,
      marginPercent,
      assignedCostsList
    };
  };

  // Pricing Proposal Engine Calculations
  const baselineRiskFactor = 0.10; // Recommended 10% Risk Contingency
  const baselineOverheadFactor = 0.10; // Recommended 10% Administrative Overheads
  
  const recommendedContingency = totalDirectCosts * baselineRiskFactor;
  const recommendedOverhead = totalDirectCosts * baselineOverheadFactor;
  const breakEvenBaselinePrice = totalDirectCosts + recommendedContingency + recommendedOverhead;
  
  // Formula for target gross profit pricing: Sustainable Price = Baseline Cost / (1 - targetMargin%)
  const proposedSustainablePrice = targetMargin < 100 
    ? (breakEvenBaselinePrice / (1 - (targetMargin / 100))) 
    : breakEvenBaselinePrice * 1.30;

  const proposedVat = proposedSustainablePrice * 0.15;
  const proposedTotalWithVat = proposedSustainablePrice + proposedVat;

  // Compute Optimized Cash-Flow Weights (Tranches are set proportional to costs to eliminate milestone deficits)
  const calculateOptimizedWeights = () => {
    if (totalDirectCosts === 0) {
      return milestones.map(() => 25);
    }

    let rawWeights = milestones.map(m => {
      const assignedCostTotal = costItems.filter(item => item.milestoneId === m.id).reduce((sum, item) => sum + item.amount, 0);
      const unassignedCostsList = costItems.filter(item => !item.milestoneId || !milestones.some(ms => ms.id === item.milestoneId));
      const totalUnassignedCost = unassignedCostsList.reduce((sum, item) => sum + item.amount, 0);
      const unassignedShare = (m.weight / 100) * totalUnassignedCost;
      const totalAllocated = assignedCostTotal + unassignedShare;
      return {
        id: m.id,
        percentage: (totalAllocated / totalDirectCosts) * 100
      };
    });

    let roundedWeights = rawWeights.map(rw => ({
      id: rw.id,
      weight: Math.round(rw.percentage)
    }));

    // Adjust rounding diff to sum to 100% exactly
    const sum = roundedWeights.reduce((s, w) => s + w.weight, 0);
    if (sum !== 100) {
      const diff = 100 - sum;
      let maxIdx = 0;
      let maxW = -1;
      roundedWeights.forEach((w, idx) => {
        if (w.weight > maxW) {
          maxW = w.weight;
          maxIdx = idx;
        }
      });
      roundedWeights[maxIdx].weight += diff;
    }

    return roundedWeights;
  };

  // Apply proposed pricing values directly to inputs
  const handleApplyProposals = () => {
    const optimized = calculateOptimizedWeights();
    const newBid = Math.round(proposedSustainablePrice);
    
    const updatedMilestones = milestones.map(m => {
      const opt = optimized.find(o => o.id === m.id);
      return {
        ...m,
        weight: opt ? opt.weight : m.weight
      };
    });

    setBidValue(newBid);
    setMilestones(updatedMilestones);
    saveCalculatorState(newBid, isVatRegistered, targetMargin, costItems, updatedMilestones);
    
    addLog?.(`Applied recommended sustainable bid price (R${newBid.toLocaleString()}) & cash-flow optimized milestone weights.`, 'success');
  };

  // Sync state to pricing proposal (SATA core storage)
  useEffect(() => {
    try {
      const materialsTotal = costItems.filter(i => i.category === 'materials').reduce((sum, i) => sum + i.amount, 0);
      const laborTotal = costItems.filter(i => i.category === 'labor').reduce((sum, i) => sum + i.amount, 0);
      const logisticsTotal = costItems.filter(i => i.category === 'overhead').reduce((sum, i) => sum + i.amount, 0);

      const proposalObj = {
        tenderRef: 'CUSTOM_PRICING',
        tenderTitle: 'Custom Business Pricing Model',
        institution: 'Private/Public Bidder Workspace',
        estimatedBudget: bidValue * 1.25,
        materialsCost: materialsTotal,
        laborCost: laborTotal,
        logisticsCost: logisticsTotal,
        contingencyRate: 0,
        contingencyAmount: 0,
        totalDeliveryCost: totalDirectCosts,
        markupRate: Math.round(actualMarginPercent),
        proposedMarkupAmount: grossProfit,
        proposedBidPriceBeforeVat: bidValue,
        isVatRegistered,
        vatAmount: rawVatAmount,
        totalBidPriceWithVat: grossBidInclVat,
        grossProfit,
        corporateTaxReserve: projectedIncomeTax,
        operationalBusinessReserve: 0,
        takeHomeProfit: netProjectedProfit,
        grossProfitMargin: actualMarginPercent,
        netTakeHomeMargin: netMarginPercent,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('sata_active_pricing_proposal', JSON.stringify(proposalObj));
    } catch (e) {
      console.warn('Failed to save active pricing proposal from TenderProfitCalculator:', e);
    }
  }, [
    bidValue,
    isVatRegistered,
    targetMargin,
    costItems,
    totalDirectCosts,
    grossProfit,
    actualMarginPercent,
    projectedIncomeTax,
    netProjectedProfit,
    netMarginPercent,
    rawVatAmount,
    grossBidInclVat
  ]);

  // Export only the cost ledger items as CSV
  const handleExportCostLedgerCsv = () => {
    try {
      const headers = ['ID', 'Description', 'Category', 'Amount (ZAR)', 'Assigned Milestone'];
      const rows = costItems.map(item => {
        const milestone = milestones.find(m => m.id === item.milestoneId);
        const milestoneTitle = milestone ? milestone.title : 'General Overhead';
        return [
          item.id,
          `"${item.description.replace(/"/g, '""')}"`,
          item.category,
          item.amount,
          `"${milestoneTitle.replace(/"/g, '""')}"`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SATA_Cost_Ledger_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog?.('Exported cost ledger components to CSV spreadsheet.', 'success');
    } catch (e: any) {
      addLog?.(`Failed to export cost ledger: ${e.message}`, 'error');
    }
  };

  // Export current model
  const handleExportProfitModel = () => {
    try {
      const model = {
        modelMeta: {
          title: 'SA Tender Assist (SATA) Cost & Margin Profit Model',
          generatedAtIso: new Date().toISOString(),
          currency: 'ZAR (R)',
          vatRateUsed: '15%',
          corporateTaxRateUsed: '27%'
        },
        inputs: {
          tenderBidAmountExclVat: bidValue,
          vatRegistered: isVatRegistered,
          vatAmount: rawVatAmount,
          bidAmountInclVat: grossBidInclVat,
          targetMarginPercentage: targetMargin
        },
        costBreakdown: costItems,
        milestones: milestones,
        results: {
          totalDirectCosts: totalDirectCosts,
          grossProfit: grossProfit,
          grossMarginPercentage: actualMarginPercent.toFixed(2) + '%',
          projectedTaxProvision: projectedIncomeTax,
          netProjectedProfit: netProjectedProfit,
          netMarginPercentage: netMarginPercent.toFixed(2) + '%'
        }
      };

      const blob = new Blob([JSON.stringify(model, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SATA_Profit_Model_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog?.('Exported current tender profit calculation model to JSON file.', 'success');
    } catch (e: any) {
      addLog?.(`Failed to export profit model: ${e.message}`, 'error');
    }
  };

  // Import model
  const handleImportProfitModel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.inputs || !parsed.costBreakdown) {
          throw new Error('Incompatible JSON format. Missing SBD cost inputs or cost breakdown arrays.');
        }

        setBidValue(parsed.inputs.tenderBidAmountExclVat);
        setIsVatRegistered(parsed.inputs.vatRegistered);
        setTargetMargin(parsed.inputs.targetMarginPercentage);
        setCostItems(parsed.costBreakdown);
        if (parsed.milestones) setMilestones(parsed.milestones);

        saveCalculatorState(
          parsed.inputs.tenderBidAmountExclVat,
          parsed.inputs.vatRegistered,
          parsed.inputs.targetMarginPercentage,
          parsed.costBreakdown,
          parsed.milestones
        );

        addLog?.('Loaded external tender costing and profit estimation model.', 'success');
      } catch (err: any) {
        addLog?.(`Import failed: ${err.message}`, 'error');
        alert(`Error importing profit model: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="tender-profit-calculator-root">
      
      {/* Overview Header Block */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-700 animate-pulse" />
            Tender Costing & Margin Profit Calculator
          </h2>
          <p className="text-slate-500 text-[11px] leading-relaxed max-w-xl">
            Estimate direct bid costs, model multi-stage payment tranches, track milestone profitability/loss margins, and dynamically configure treasury-compliant pricing structures.
          </p>
        </div>
        
        <div className="flex gap-2 shrink-0 self-stretch sm:self-auto">
          <button
            onClick={handleExportProfitModel}
            className="flex-1 sm:flex-none text-[9.5px] font-bold font-mono uppercase tracking-wider bg-slate-900 hover:bg-slate-950 text-white py-2 px-3 rounded cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Model (JSON)
          </button>
          <label className="flex-1 sm:flex-none text-center text-[9.5px] font-bold font-mono uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 py-2 px-3 rounded cursor-pointer flex items-center justify-center gap-1.5 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import Model
            <input
              type="file"
              accept=".json"
              onChange={handleImportProfitModel}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Main Form + Profit Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Input Parameters Panel (Left 5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm">
          <h3 className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-widest border-b border-slate-100 pb-2.5">
            1. Pricing & Target Settings
          </h3>

          <div className="space-y-3 font-mono text-[10px] text-slate-600">
            
            {/* Bid Amount Excl VAT */}
            <div className="space-y-1">
              <label className="text-slate-400 block uppercase">YOUR CONTRACT BID VALUE (ZAR, EXCL. VAT):</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-[11px] font-bold">R</span>
                <input
                  type="number"
                  value={bidValue}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setBidValue(val);
                    saveCalculatorState(val, isVatRegistered, targetMargin, costItems);
                  }}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[8.5px] text-slate-400 block leading-tight">
                This represents your base bid price evaluated on the 80/20 or 90/10 pricing matrices.
              </span>
            </div>

            {/* VAT Registered Switch */}
            <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded">
              <div>
                <span className="text-slate-700 font-bold block uppercase text-[9px]">Company VAT Registered?</span>
                <span className="text-slate-400 text-[8px] leading-tight font-sans block">Adds statutory 15% South African VAT for compliant public tenders.</span>
              </div>
              <input
                type="checkbox"
                checked={isVatRegistered}
                onChange={(e) => {
                  const val = e.target.checked;
                  setIsVatRegistered(val);
                  saveCalculatorState(bidValue, val, targetMargin, costItems);
                  addLog?.(val ? 'VAT accounting activated at 15% (ZAR).' : 'VAT accounting deactivated.', 'info');
                }}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Target Margin Percentage */}
            <div className="space-y-1">
              <label className="text-slate-400 block uppercase">TARGET GROSS PROFIT MARGIN (%):</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetMargin}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTargetMargin(val);
                    saveCalculatorState(bidValue, isVatRegistered, val, costItems);
                  }}
                  className="w-full pr-7 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2 text-slate-500 text-[11px] font-bold">%</span>
              </div>
              <span className="text-[8.5px] text-slate-400 block leading-tight">
                Typical target gross profit margin for secure SMME public contracts is 15% - 30%.
              </span>
            </div>

          </div>

          {/* Add Cost Form with Milestone Mapping Dropdown */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-[9.5px] font-bold uppercase text-slate-400 font-mono tracking-widest mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Add Project Cost Component
            </h4>
            
            <form onSubmit={handleAddCost} className="space-y-2.5 font-mono text-[9.5px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block uppercase mb-1">Category:</label>
                  <select
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value as any)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="materials">Materials & Supply</option>
                    <option value="labor">Specialist Payroll</option>
                    <option value="subcontractors">Subcontractors</option>
                    <option value="overhead">Site Logistics/Rentals</option>
                    <option value="other">Guarantees/Insurances</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block uppercase mb-1">Direct Cost (ZAR):</label>
                  <input
                    type="number"
                    value={newAmount || ''}
                    placeholder="e.g. 45000"
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="text-slate-400 block uppercase mb-1">Assign to Milestone Tranche:</label>
                  <select
                    value={newMilestoneId}
                    onChange={(e) => setNewMilestoneId(e.target.value)}
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="unassigned">General Overhead (Unassigned)</option>
                    {milestones.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.weight}%] {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block uppercase mb-1">Scope / Description:</label>
                <input
                  type="text"
                  placeholder="e.g. Electrical cabling & safety certification"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-1.5 px-3 rounded uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Cost Component
              </button>
            </form>
          </div>

        </div>

        {/* Output Financial Dashboard (Right 7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Stats Banner Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono block">CONTRACT EXCL-VAT</span>
              <span className="text-base font-bold text-slate-700 font-mono">
                R {bidValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[8px] text-slate-400 font-mono block">
                {isVatRegistered ? `+ R ${rawVatAmount.toLocaleString()} VAT` : 'No VAT Registered'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-1">
              <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono block">TOTAL DIRECT COSTS</span>
              <span className="text-base font-bold text-slate-700 font-mono">
                R {totalDirectCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[8px] text-slate-400 font-mono block">
                {costItems.length} Cost Components Map
              </span>
            </div>

            <div className={`border rounded-lg p-3.5 space-y-1 ${isMarginMeetingTarget ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
              <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono block">ESTIMATED GROSS PROFIT</span>
              <span className={`text-base font-bold font-mono ${isMarginMeetingTarget ? 'text-emerald-700' : 'text-rose-700'}`}>
                R {grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`text-[8.5px] font-bold font-mono block ${isMarginMeetingTarget ? 'text-emerald-600' : 'text-rose-600'}`}>
                {actualMarginPercent.toFixed(1)}% Margin ({isMarginMeetingTarget ? '✓ Meets Target' : `✗ Target: ${targetMargin}%`})
              </span>
            </div>

          </div>

          {/* Navigation Tabs for Outputs */}
          <div className="flex border-b border-slate-200 font-mono text-[10px] gap-1">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-2 -mb-px font-bold uppercase border-t-2 border-x rounded-t cursor-pointer transition-colors ${
                activeTab === 'ledger' 
                  ? 'border-t-slate-800 border-x-slate-200 bg-white text-slate-800' 
                  : 'border-t-transparent border-x-transparent bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
            >
              1. Ledger & Reserves
            </button>
            <button
              onClick={() => setActiveTab('milestones')}
              className={`px-3 py-2 -mb-px font-bold uppercase border-t-2 border-x rounded-t cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'milestones' 
                  ? 'border-t-emerald-700 border-x-slate-200 bg-white text-emerald-800' 
                  : 'border-t-transparent border-x-transparent bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              2. Milestone Profitability Breakdown
            </button>
            <button
              onClick={() => setActiveTab('proposer')}
              className={`px-3 py-2 -mb-px font-bold uppercase border-t-2 border-x rounded-t cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'proposer' 
                  ? 'border-t-violet-700 border-x-slate-200 bg-white text-violet-800' 
                  : 'border-t-transparent border-x-transparent bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-bounce" />
              3. Smart Pricing Proposer
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 -mb-px font-bold uppercase border-t-2 border-x rounded-t cursor-pointer transition-colors flex items-center gap-1 ${
                activeTab === 'timeline' 
                  ? 'border-t-blue-700 border-x-slate-200 bg-white text-blue-800' 
                  : 'border-t-transparent border-x-transparent bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              4. Project Timeline (Gantt View)
            </button>
          </div>

          {/* TAB CONTENT 1: LEDGER & RESERVES */}
          {activeTab === 'ledger' && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-sm font-mono text-[10px]">
              <h3 className="text-[10px] font-bold uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span>Detailed Financial Breakdown & Tax Safe-Harbor</span>
                <span className="text-slate-400 lowercase italic text-[9px] font-normal">SARS corporate tax reserve calculated at 27%</span>
              </h3>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-1.5">
                  <span>Contract Bid Value (Gross Exclusive of VAT):</span>
                  <span className="font-bold text-slate-800">R {bidValue.toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3">
                  <span className="text-slate-400 italic">Less: Cost of Sales / Material procurement:</span>
                  <span className="text-red-600 font-semibold">- R {costItems.filter(c => c.category === 'materials').reduce((a,b)=>a+b.amount, 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3">
                  <span className="text-slate-400 italic">Less: Specialized labor & project personnel:</span>
                  <span className="text-red-600 font-semibold">- R {costItems.filter(c => c.category === 'labor').reduce((a,b)=>a+b.amount, 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3">
                  <span className="text-slate-400 italic">Less: Sub-contractors & auxiliary agents:</span>
                  <span className="text-red-600 font-semibold">- R {costItems.filter(c => c.category === 'subcontractors').reduce((a,b)=>a+b.amount, 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3">
                  <span className="text-slate-400 italic">Less: Office overheads, admin & transport:</span>
                  <span className="text-red-600 font-semibold">- R {costItems.filter(c => c.category === 'overhead').reduce((a,b)=>a+b.amount, 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3">
                  <span className="text-slate-400 italic">Less: Other costs, guarantees & insurances:</span>
                  <span className="text-red-600 font-semibold">- R {costItems.filter(c => c.category === 'other').reduce((a,b)=>a+b.amount, 0).toLocaleString()}</span>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-2 bg-slate-50 p-2 rounded">
                  <span className="font-bold text-slate-700">Gross Estimated Project Profit:</span>
                  <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    R {grossProfit.toLocaleString()} ({actualMarginPercent.toFixed(1)}% Gross)
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-100 pb-1.5 pl-3 text-slate-500">
                  <span>South African Corporate Income Tax (Est. 27%):</span>
                  <span>R {projectedIncomeTax.toLocaleString()}</span>
                </div>

                <div className="flex justify-between bg-emerald-50 text-emerald-950 p-2.5 rounded border border-emerald-150">
                  <span className="font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    Net Estimated Post-Tax Project Profit:
                  </span>
                  <span className="font-bold text-emerald-800">
                    R {netProjectedProfit.toLocaleString()} ({netMarginPercent.toFixed(1)}% Net Margin)
                  </span>
                </div>
              </div>

              {/* Editable Cost Item List with inline mapping selectors */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 uppercase text-[8.5px] block font-bold">Active Cost Ledger & Milestone Allocations</span>
                  {costItems.length > 0 && (
                    <button
                      onClick={handleExportCostLedgerCsv}
                      className="text-[8.5px] font-bold font-mono bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-all"
                      title="Export cost ledger items as standard spreadsheet CSV file"
                    >
                      <Download className="w-3 h-3" />
                      Export Cost Ledger (CSV)
                    </button>
                  )}
                </div>
                <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                  {costItems.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 italic">No cost items entered. Use the form to start building your ledger.</div>
                  ) : (
                    costItems.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-50 p-2.5 rounded border border-slate-150 gap-2 text-[9.5px]">
                        <div className="truncate flex-1">
                          <span className="font-bold text-slate-400 uppercase text-[8px] tracking-wider block">
                            {item.category}
                          </span>
                          <span className="text-slate-700 font-medium truncate block">{item.description}</span>
                        </div>
                        
                        {/* Interactive Milestone Dropdown */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-slate-400">Tranche:</span>
                          <select
                            value={item.milestoneId || 'unassigned'}
                            onChange={(e) => handleUpdateCostMilestone(item.id, e.target.value)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[9px] text-slate-600 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="unassigned">Overhead (Unallocated)</option>
                            {milestones.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.title.slice(0, 20)}... ({m.weight}%)
                              </option>
                            ))}
                          </select>

                          <span className="font-bold text-slate-800 ml-2">R {item.amount.toLocaleString()}</span>
                          <button
                            onClick={() => handleDeleteCost(item.id, item.description)}
                            className="text-slate-300 hover:text-red-500 transition-colors cursor-pointer pl-1"
                            title="Delete item"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: MILESTONE PROFITABILITY BREAKDOWN */}
          {activeTab === 'milestones' && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm font-mono text-[10px]">
              
              {/* Dynamic Warning Alert for Cumulated Weights */}
              {!isWeightsValid && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded flex items-start gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold uppercase text-[9px] block">Treasury Compliance Alert:</span>
                    <p className="leading-relaxed text-[11px]">
                      The cumulative payment weights of your contract milestones must equal exactly 100% for bid submission. Currently: <strong>{totalMilestoneWeight}%</strong>. Correct the weights below to resolve compliance errors.
                    </p>
                  </div>
                </div>
              )}

              {/* Milestone Weight Controller */}
              <div className="space-y-2 border-b border-slate-100 pb-3">
                <div className="flex justify-between items-center text-slate-500 text-[9px] uppercase tracking-wider font-bold">
                  <span>Interactive Payment Tranche Weights (Adjust to model Cash-Flow)</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold ${isWeightsValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    Sum: {totalMilestoneWeight}% / 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block truncate">{idx+1}. {m.title}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={m.weight}
                          onChange={(e) => handleUpdateMilestoneWeight(m.id, Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700 text-center"
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestones Profitability Grid */}
              <div className="space-y-4">
                <span className="text-slate-400 uppercase text-[8.5px] block font-bold">Projected Milestone Ledger</span>
                
                <div className="space-y-3">
                  {milestones.map((m) => {
                    const fin = getMilestoneFinancials(m);
                    const isLoss = fin.netProfitOrLoss < 0;

                    return (
                      <div 
                        key={m.id} 
                        className={`border rounded-lg p-4 transition-all ${
                          isLoss 
                            ? 'bg-rose-50/70 border-rose-200 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse' 
                            : fin.marginPercent < targetMargin 
                              ? 'bg-amber-50/50 border-amber-200' 
                              : 'bg-slate-50/50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-800 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {m.weight}% Tranche
                              </span>
                              <h4 className="font-bold text-slate-800 text-[11px]">{m.title}</h4>
                            </div>
                            <p className="text-slate-500 text-[9px] max-w-lg font-sans leading-relaxed">{m.description}</p>
                          </div>

                          {/* Tranche Profitability Badge */}
                          <div className="shrink-0 text-right">
                            {isLoss ? (
                              <span className="inline-flex items-center gap-1 bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                                <AlertTriangle className="w-3 h-3" /> Critical Loss
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-700 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wide uppercase">
                                <CheckCircle2 className="w-3 h-3" /> Healthy Margin
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Financial Metrics Split */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-150/60 font-mono text-[9.5px]">
                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase">TRANCH PAYMENT (REV)</span>
                            <span className="font-bold text-slate-700">R {fin.allocatedRevenue.toLocaleString()}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase">ALLOCATED COST</span>
                            <span className="font-bold text-slate-700 flex flex-col">
                              <span>R {fin.totalAllocatedCost.toLocaleString()}</span>
                              {fin.unassignedShare > 0 && (
                                <span className="text-[8px] text-slate-400 font-normal italic">
                                  (incl. R{Math.round(fin.unassignedShare).toLocaleString()} overheads)
                                </span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase">STAGE NET PROFIT</span>
                            <span className={`font-bold ${isLoss ? 'text-red-600 font-black' : 'text-emerald-700'}`}>
                              R {fin.netProfitOrLoss.toLocaleString()}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[8px] uppercase">STAGE MARGIN %</span>
                            <span className={`font-bold ${isLoss ? 'text-red-600 font-black' : 'text-emerald-700'}`}>
                              {fin.marginPercent.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Micro visualization progress bars */}
                        <div className="mt-3.5 space-y-1">
                          <div className="flex justify-between text-[8px] text-slate-400 uppercase">
                            <span>TRANCH EXPENDITURE RATE</span>
                            <span>{fin.allocatedRevenue > 0 ? Math.round((fin.totalAllocatedCost / fin.allocatedRevenue) * 100) : 0}% of payout</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${isLoss ? 'bg-red-500' : 'bg-emerald-600'}`} 
                              style={{ width: `${Math.min(100, fin.allocatedRevenue > 0 ? (fin.totalAllocatedCost / fin.allocatedRevenue) * 100 : 0)}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Explanatory Callout Banner for Loss Stage */}
                        {isLoss && (
                          <div className="mt-3 p-2 bg-red-100/50 border border-red-200 rounded text-[9px] text-red-950 flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <p className="leading-relaxed font-sans">
                              <strong>Cash Flow Lockup Hazard:</strong> You will spend more capital delivering this stage than you receive on compliance sign-off. If you lack cash reserves, you cannot finish this stage. Adjust Tranche Weights to match execution costs or click <strong>Smart Pricing Proposer</strong> to balance cash-flow.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 3: SMART PRICING PROPOSER */}
          {activeTab === 'proposer' && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-5 shadow-sm font-mono text-[10px]">
              
              <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-700 animate-pulse" />
                  SATA Dynamic Pricing Advisor
                </h3>
                <span className="text-[8.5px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                  National Treasury Preferred Standards
                </span>
              </div>

              {/* Pricing Alert comparison callout */}
              {bidValue < proposedSustainablePrice ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-950">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase text-[9px] block">Financial Hazard: Your Bid is Underpriced</span>
                    <p className="leading-relaxed text-[11px] font-sans">
                      Your current bid of <strong>R {bidValue.toLocaleString()}</strong> does not safely absorb direct costs alongside standard operational buffers (10% overhead, 10% contingency) to preserve your <strong>{targetMargin}% target margin</strong>. To operate sustainably without risking liquidation, apply the recommended fully functional pricing structures.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3 text-emerald-950">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold uppercase text-[9px] block">Financial Feasibility: Bid Pricing Sustainable</span>
                    <p className="leading-relaxed text-[11px] font-sans">
                      Your current bid price safely cushions all direct ledger expenses, handles contingency reserves, covers operational overheads, and meets or exceeds your {targetMargin}% target margin safely.
                    </p>
                  </div>
                </div>
              )}

              {/* Comparative pricing breakdown card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block">Current Bid Structure</span>
                  
                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span>Direct Ledger Costs:</span>
                      <span className="font-bold">R {totalDirectCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span>Risk & Contingency:</span>
                      <span className="text-slate-400 italic">Unbuffered</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span>Admin Overheads:</span>
                      <span className="text-slate-400 italic">Unbuffered</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-slate-800 font-bold">
                      <span>Current Bid Base:</span>
                      <span>R {bidValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-800">
                      <span>SARS VAT (15%):</span>
                      <span>R {rawVatAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-1.5 text-slate-900 font-black text-[11px] bg-slate-100 p-1.5 rounded">
                      <span>Total Bid (Incl. VAT):</span>
                      <span>R {grossBidInclVat.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-violet-50/50 border border-violet-200 rounded-lg space-y-3">
                  <span className="text-[8.5px] font-bold text-violet-600 uppercase tracking-widest block flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-violet-700" />
                    SATA Proposed Fully Functional Price
                  </span>
                  
                  <div className="space-y-2 text-violet-950">
                    <div className="flex justify-between border-b border-violet-100/50 pb-1">
                      <span>Direct Ledger Costs:</span>
                      <span className="font-bold">R {totalDirectCosts.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-violet-100/50 pb-1">
                      <span>Contingency Buffer (10%):</span>
                      <span className="font-bold text-slate-700">+ R {recommendedContingency.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-violet-100/50 pb-1">
                      <span>Overhead Buffer (10%):</span>
                      <span className="font-bold text-slate-700">+ R {recommendedOverhead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-violet-200 pt-1 font-bold text-violet-900">
                      <span>Recommended Bid Base:</span>
                      <span>R {Math.round(proposedSustainablePrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SARS VAT (15%):</span>
                      <span>R {Math.round(proposedVat).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-violet-800 pt-1.5 text-violet-900 font-black text-[11px] bg-violet-100 p-1.5 rounded">
                      <span>Total Bid (Incl. VAT):</span>
                      <span>R {Math.round(proposedTotalWithVat).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Cash-Flow Optimized Milestone Weights Proposal */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest">
                    Milestone Cash-Flow Weights Optimization Proposal
                  </span>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                    Deficit Elimination Engine
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    SATA has analyzed your milestone costs and compiled an optimized payment tranche structure. By adjusting weights directly proportional to your milestone-assigned direct and indirect costs, you avoid cash flow lockups and ensure each stage has a healthy profit:
                  </p>

                  <div className="border border-slate-200 rounded overflow-hidden">
                    <table className="w-full text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-500 font-bold uppercase border-b border-slate-200">
                          <th className="p-2 font-mono">Milestone Tranche</th>
                          <th className="p-2 font-mono text-center">Current Weight</th>
                          <th className="p-2 font-mono text-center text-emerald-800 font-bold">Proposed Weight</th>
                          <th className="p-2 font-mono text-right">Proposed Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milestones.map((m, idx) => {
                          const optWeights = calculateOptimizedWeights();
                          const opt = optWeights.find(o => o.id === m.id);
                          const proposedWeight = opt ? opt.weight : m.weight;
                          const proposedPayout = (proposedWeight / 100) * proposedSustainablePrice;

                          return (
                            <tr key={m.id} className="border-b border-slate-150 last:border-b-0 hover:bg-slate-100/50">
                              <td className="p-2">
                                <span className="font-bold text-slate-700">{idx+1}. {m.title}</span>
                              </td>
                              <td className="p-2 text-center text-slate-500 font-bold">{m.weight}%</td>
                              <td className="p-2 text-center text-emerald-700 font-black bg-emerald-50/50">{proposedWeight}%</td>
                              <td className="p-2 text-right text-slate-700 font-bold">R {Math.round(proposedPayout).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Action Trigger Button to Overwrite State Compliantly */}
              <div className="pt-2">
                <button
                  onClick={handleApplyProposals}
                  className="w-full bg-violet-700 hover:bg-violet-800 text-white font-mono font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_12px_rgba(109,40,217,0.25)] hover:shadow-[0_4px_16px_rgba(109,40,217,0.35)]"
                >
                  <RefreshCcw className="w-4 h-4 text-violet-200 animate-spin" />
                  Apply Proposed Pricing & Optimized Cash-Flow Weights
                </button>
                <p className="text-[8.5px] text-slate-400 mt-1.5 text-center font-sans">
                  *This will update your Excl-VAT bid price to R {Math.round(proposedSustainablePrice).toLocaleString()} and balance all milestone payment tranches safely.
                </p>
              </div>

            </div>
          )}

          {/* TAB CONTENT 4: INTERACTIVE PROJECT TIMELINE & GANTT VIEW */}
          {activeTab === 'timeline' && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-6 shadow-sm font-mono text-[10px]">
              
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  SATA Project Delivery Timeline & Gantt Chart
                </h3>
                <span className="text-[8.5px] bg-blue-50 px-2 py-0.5 rounded text-blue-700 font-bold uppercase">
                  Gantt Engine Active
                </span>
              </div>

              {/* Interactive Milestone Date/Duration Editors */}
              <div className="space-y-3.5">
                <span className="text-slate-400 uppercase text-[8.5px] block font-bold">Configure Milestones Scheduling Parameters</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestones.map((m) => (
                    <div key={m.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-[10.5px]">{m.title}</span>
                        <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold font-mono">
                          {m.weight}% weight
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold">Start Date</label>
                          <input
                            type="date"
                            value={m.startDate || '2026-08-01'}
                            onChange={(e) => {
                              const updated = milestones.map(ms => ms.id === m.id ? { ...ms, startDate: e.target.value } : ms);
                              setMilestones(updated);
                              saveCalculatorState(bidValue, isVatRegistered, targetMargin, costItems, updated);
                              addLog?.(`Updated "${m.title}" start date to ${e.target.value}.`, 'info');
                            }}
                            className="w-full bg-white border border-slate-250 rounded p-1 text-[10px] font-mono font-bold text-slate-700 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8.5px] text-slate-400 uppercase block font-bold flex justify-between">
                            <span>Duration</span>
                            <span className="text-blue-700 font-black">{m.durationDays || 10} days</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="60"
                            value={m.durationDays || 10}
                            onChange={(e) => {
                              const updated = milestones.map(ms => ms.id === m.id ? { ...ms, durationDays: parseInt(e.target.value, 10) } : ms);
                              setMilestones(updated);
                              saveCalculatorState(bidValue, isVatRegistered, targetMargin, costItems, updated);
                            }}
                            className="w-full accent-blue-600 h-1 mt-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt Visual Chart Wrapper */}
              <div className="space-y-3.5 border-t border-slate-100 pt-5">
                <span className="text-slate-400 uppercase text-[8.5px] block font-bold">Interactive Gantt Timeline Chart</span>
                
                {/* Gantt Board */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-950 text-slate-300 shadow-inner">
                  {/* Calendar Ruler Headers */}
                  <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-900 text-slate-400 font-bold uppercase text-[8px] py-2 text-center select-none font-mono">
                    <div className="col-span-3 border-r border-slate-800 text-left pl-3 text-slate-300 font-bold">Milestone Phase</div>
                    <div className="col-span-3 border-r border-slate-800">August 2026</div>
                    <div className="col-span-3 border-r border-slate-800">September 2026</div>
                    <div className="col-span-3">October 2026</div>
                  </div>

                  {/* Gantt Rows */}
                  <div className="divide-y divide-slate-900 relative">
                    {/* Vertical timeline tick marks (Week indicators) */}
                    <div className="absolute inset-y-0 left-[25%] right-0 grid grid-cols-9 pointer-events-none select-none opacity-10">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className="border-r border-dashed border-white h-full last:border-r-0"></div>
                      ))}
                    </div>

                    {milestones.map((m, idx) => {
                      const anchorStart = new Date('2026-08-01').getTime();
                      const totalDaysSpan = 92; // Aug 1 to Oct 31
                      const mStart = new Date(m.startDate || '2026-08-01').getTime();
                      const daysFromStart = Math.max(0, (mStart - anchorStart) / (24 * 60 * 60 * 1000));
                      const duration = m.durationDays || 10;
                      
                      // Calculate positions
                      const leftPercent = Math.min(100, Math.max(0, (daysFromStart / totalDaysSpan) * 100));
                      const widthPercent = Math.min(100 - leftPercent, Math.max(1, (duration / totalDaysSpan) * 100));

                      // Gradient colors per stage
                      const gradients = [
                        'from-cyan-500 to-blue-600',
                        'from-blue-500 to-indigo-600',
                        'from-indigo-500 to-violet-600',
                        'from-purple-500 to-emerald-600'
                      ];

                      return (
                        <div key={m.id} className="grid grid-cols-12 py-3.5 items-center hover:bg-slate-900/40 relative z-10">
                          {/* Left Title */}
                          <div className="col-span-3 pl-3 pr-2 border-r border-slate-900 font-bold truncate">
                            <span className="text-slate-500 mr-1">#{idx+1}</span>
                            <span className="text-slate-200">{m.title}</span>
                            <span className="block text-[7.5px] font-normal text-slate-400 mt-0.5 font-mono">
                              {m.startDate} ({duration}d)
                            </span>
                          </div>

                          {/* Right Gantt Track */}
                          <div className="col-span-9 h-6 relative px-2">
                            <div 
                              style={{ 
                                left: `${leftPercent}%`, 
                                width: `${widthPercent}%`,
                                minWidth: '8%'
                              }}
                              className={`absolute h-6 bg-gradient-to-r ${gradients[idx % gradients.length]} rounded-full flex items-center justify-between px-3 text-[8.5px] font-bold text-white shadow-lg shadow-blue-500/10 cursor-pointer hover:brightness-110 hover:scale-y-105 transition-all truncate`}
                              title={`${m.title}: ${m.startDate} to ${new Date(mStart + duration * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)}`}
                            >
                              <span className="truncate">{m.title}</span>
                              <span className="font-sans text-[7.5px] opacity-90 tracking-wide shrink-0 font-bold">{duration}d</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timeline Sequence & Compliance Intelligence Rules */}
                <div className="space-y-2 border-t border-slate-100 pt-4 font-mono text-[9.5px]">
                  <span className="text-slate-400 uppercase text-[8.5px] block font-bold">Sequence & Delivery Risk Audit</span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Schedule Conflict Check */}
                    {(() => {
                      let conflicts: string[] = [];
                      for (let i = 0; i < milestones.length - 1; i++) {
                        const m1 = milestones[i];
                        const m2 = milestones[i + 1];
                        const m1End = new Date(m1.startDate || '2026-08-01').getTime() + (m1.durationDays || 10) * 24 * 60 * 60 * 1000;
                        const m2Start = new Date(m2.startDate || '2026-08-01').getTime();
                        
                        if (m2Start < m1End) {
                          const overlapDays = Math.round((m1End - m2Start) / (24 * 60 * 60 * 1000));
                          conflicts.push(`"${m2.title}" begins ${overlapDays} days before "${m1.title}" concludes.`);
                        }
                      }

                      return conflicts.length > 0 ? (
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-950 rounded-lg space-y-1">
                          <span className="font-bold uppercase text-[9px] text-amber-800 block flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Parallel Operations (Resource Hazard)
                          </span>
                          <p className="leading-relaxed font-sans text-[11px] text-slate-600">
                            You have configured multiple simultaneous delivery phases:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 font-mono text-[9px] text-slate-700">
                            {conflicts.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-lg flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold uppercase text-[9px] text-emerald-800 block">Linear Sequence Validated</span>
                            <p className="leading-relaxed font-sans text-[11px] text-slate-600">
                              All project milestones are perfectly structured in an end-to-end sequential pipeline. No workforce scheduling overlap hazards detected.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Total Duration calculation */}
                    {(() => {
                      const dates = milestones.map(m => new Date(m.startDate || '2026-08-01').getTime());
                      const endDates = milestones.map(m => new Date(m.startDate || '2026-08-01').getTime() + (m.durationDays || 10) * 24 * 60 * 60 * 1000);
                      const minStart = Math.min(...dates);
                      const maxEnd = Math.max(...endDates);
                      const totalProjectDays = Math.round((maxEnd - minStart) / (24 * 60 * 60 * 1000));

                      return (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-slate-700">
                          <span className="font-bold uppercase text-[9px] block text-slate-800">Total Delivery Span</span>
                          <div className="flex justify-between font-mono text-xs font-bold text-slate-800 border-b border-slate-200/50 pb-1">
                            <span>Duration:</span>
                            <span className="text-blue-700">{totalProjectDays} Calendar Days</span>
                          </div>
                          <div className="flex justify-between font-mono text-[9px] text-slate-500 pt-1">
                            <span>Project Start:</span>
                            <span>{new Date(minStart).toISOString().substring(0, 10)}</span>
                          </div>
                          <div className="flex justify-between font-mono text-[9px] text-slate-500">
                            <span>Project Completion:</span>
                            <span>{new Date(maxEnd).toISOString().substring(0, 10)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
