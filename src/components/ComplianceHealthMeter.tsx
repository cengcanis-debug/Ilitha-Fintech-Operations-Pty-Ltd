/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Building,
  DollarSign,
  FileCheck2,
  Scale
} from 'lucide-react';

interface ComplianceHealthMeterProps {
  score?: number; // 0 to 100 (Optional for direct control)
  initialFormData?: {
    sars_pin: boolean;
    bbbee_level: boolean;
    local_content: boolean;
    company_reg: boolean;
  };
  onScoreChange?: (score: number) => void;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function ComplianceHealthMeter({ 
  score,
  initialFormData = { sars_pin: true, bbbee_level: true, local_content: false, company_reg: false },
  onScoreChange,
  addLog
}: ComplianceHealthMeterProps) {
  
  // Local state for the 4 identified compliance fields
  const [formData, setFormData] = useState(initialFormData);
  const [localScore, setLocalScore] = useState(0);

  // Sync initialFormData updates if they change at the parent level
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData.sars_pin, initialFormData.bbbee_level, initialFormData.local_content, initialFormData.company_reg]);

  // Core calculation logic based on the 4 key fields
  useEffect(() => {
    const fields = ['sars_pin', 'bbbee_level', 'local_content', 'company_reg'] as const;
    const completed = fields.filter(field => formData[field]).length;
    const computed = Math.round((completed / fields.length) * 100);
    setLocalScore(computed);
    if (onScoreChange) {
      onScoreChange(computed);
    }
  }, [formData, onScoreChange]);

  // Resolve the active score: use explicit score prop if defined, else local computed score
  const activeScore = score !== undefined ? score : localScore;

  const getColor = (s: number) => {
    if (s < 50) return '#ef4444'; // Red
    if (s < 90) return '#f59e0b'; // Amber
    return '#22c55e'; // Green
  };

  const toggleField = (field: keyof typeof formData) => {
    const newVal = !formData[field];
    setFormData(prev => {
      const updated = { ...prev, [field]: newVal };
      addLog?.(`Toggled SCM field [${String(field)}] to: ${newVal ? 'COMPLIANT' : 'NON-COMPLIANT'}`, newVal ? 'success' : 'warn');
      return updated;
    });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl shadow-lg border border-slate-800 space-y-4" id="compliance-health-meter-widget">
      
      {/* Title & Score Indicator */}
      <div className="flex justify-between items-center">
        <h3 className="text-slate-200 font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          Compliance Health Score
        </h3>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
          {activeScore}%
        </span>
      </div>

      {/* Progress Bar styled precisely to user specification */}
      <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-950/40">
        <div 
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${activeScore}%`, backgroundColor: getColor(activeScore) }}
        />
      </div>

      {/* Narrative Status Message */}
      <p className="text-xs text-slate-400 leading-relaxed">
        {activeScore === 100 
          ? "Ready for Submission!" 
          : `You are ${activeScore}% compliant. Complete your remaining fields to avoid disqualification.`}
      </p>

      {/* If score prop is not supplied, render the interactive SBD checklist matrix */}
      {score === undefined && (
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider block">
            National Treasury Verification Matrix
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { 
                key: 'sars_pin' as const, 
                label: 'SARS Tax Compliance', 
                desc: '13-digit SBD 4 Tax PIN',
                icon: FileCheck2
              },
              { 
                key: 'bbbee_level' as const, 
                label: 'B-BBEE Score Claim', 
                desc: 'SBD 6.1 preference proof',
                icon: Scale
              },
              { 
                key: 'local_content' as const, 
                label: 'Local Content Cert', 
                desc: 'SBD 6.2 industrial thresholds',
                icon: DollarSign
              },
              { 
                key: 'company_reg' as const, 
                label: 'CIPC Active Standing', 
                desc: 'CSD aligned registration',
                icon: Building
              }
            ].map((item) => {
              const isChecked = formData[item.key];
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => toggleField(item.key)}
                  className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between select-none cursor-pointer ${
                    isChecked 
                      ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200 shadow-inner' 
                      : 'bg-slate-950/40 border-dashed border-slate-800 hover:bg-slate-900 text-slate-500'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex gap-1.5 items-center">
                      <Icon className={`w-3.5 h-3.5 ${isChecked ? 'text-emerald-400' : 'text-slate-600'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate max-w-[150px]">
                      {item.desc}
                    </span>
                  </div>
                  <div className="pl-2 shrink-0">
                    {isChecked ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4.5 h-4.5 text-slate-700" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
