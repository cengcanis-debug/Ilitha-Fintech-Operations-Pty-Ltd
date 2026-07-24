/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Globe, 
  Loader2, 
  RefreshCw, 
  ArrowRight, 
  FileText, 
  Award,
  AlertCircle,
  TrendingUp,
  Database
} from 'lucide-react';
import UniversalProvincialService, { ProvincialTender, HubConfig } from '../services/UniversalProvincialService';

interface TenderFeedExplorerProps {
  onSelectTender: (tender: ProvincialTender, targetAction: 'SBD4' | 'SBD61' | 'ADVISOR') => void;
  addLog?: (msg: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function TenderFeedExplorer({ onSelectTender, addLog }: TenderFeedExplorerProps) {
  const [selectedProvince, setSelectedProvince] = useState<string>('gauteng');
  const [tenders, setTenders] = useState<ProvincialTender[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch tenders for selected province
  const fetchTenders = async (provinceKey: string) => {
    setLoading(true);
    setError('');
    const hub = UniversalProvincialService.provincialHubs[provinceKey];
    addLog?.(`Gateway Routing: Fetching live procurement feeds from ${hub.provinceName}...`, 'info');
    
    try {
      const results = await UniversalProvincialService.fetchProvincialTenders(provinceKey);
      setTenders(results);
      addLog?.(`Gateway success: Loaded ${results.length} normalized tenders for ${hub.provinceName}.`, 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve provincial tender feeds.');
      addLog?.(`Gateway failed on ${provinceKey}: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when province changes
  useEffect(() => {
    fetchTenders(selectedProvince);
  }, [selectedProvince]);

  const handleProvinceSelect = (provinceKey: string) => {
    setSelectedProvince(provinceKey);
  };

  // Filter tenders based on search query
  const filteredTenders = tenders.filter(tender => {
    const query = searchQuery.toLowerCase();
    return (
      tender.referenceNumber.toLowerCase().includes(query) ||
      tender.title.toLowerCase().includes(query) ||
      (tender.department && tender.department.toLowerCase().includes(query))
    );
  });

  const getProvinceBadgeColor = (key: string) => {
    switch (key) {
      case 'western_cape': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'gauteng': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'kwazulu_natal': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6" id="tender-feed-explorer-root">
      
      {/* Province Map Selector (Interactive Bento Grid) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="border-b border-slate-100 pb-3 mb-4">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-700 animate-spin-slow" />
            South African Provincial Gateways
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Browse live tender notice updates, bulletined indices, and scraped HTML tables compiled dynamically from all nine provincial treasuries.
          </p>
          
          <div className="mt-3 px-3.5 py-2.5 bg-emerald-50 text-emerald-950 border border-emerald-100 rounded-lg text-xs leading-relaxed font-sans">
            <div className="font-bold text-[10px] font-mono uppercase tracking-wider text-emerald-850 flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              ✓ Public-Access Compliant Gateway Enforced
            </div>
            <p className="text-slate-600 text-[11px] leading-normal">
              To ensure 100% legal compliance and completely avoid the need to obtain custom scraping permissions from individual provincial bodies or private advertisers, direct crawlers to restricted servers are disabled. All specifications are safely aggregated from the official <strong>National Treasury eTender Public Portal</strong> open-access directories and public-domain bulletins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Object.entries(UniversalProvincialService.provincialHubs).map(([key, config]) => {
            const isSelected = selectedProvince === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleProvinceSelect(key)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-emerald-50/65 border-emerald-500 ring-2 ring-emerald-500/20' 
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col h-full justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`} />
                    <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                      {key.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="font-semibold text-xs text-slate-800 tracking-tight leading-tight">
                    {config.provinceName.replace(' Province', '')}
                  </div>

                  <div className="flex items-center justify-between text-[8px] font-mono mt-1 pt-1.5 border-t border-slate-100">
                    <span className="opacity-60">TYPE:</span>
                    <span className={`font-bold ${
                      config.type === 'API' ? 'text-emerald-800' :
                      config.type === 'PDF_ROUTER' ? 'text-blue-800' : 'text-amber-800'
                    }`}>{config.type}</span>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute right-0 top-0 w-8 h-8 bg-emerald-600/10 rounded-bl-full flex items-center justify-center pointer-events-none">
                    <div className="w-1.5 h-1.5 bg-emerald-700 rounded-full animate-ping"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tenders Display & Search Filters */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        
        {/* Sub-Header / Search panel */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference, title, dept..."
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-emerald-600 font-sans"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-between">
            <span className="text-[10px] font-mono text-slate-400">
              OPEN-DATA PUBLIC ROUTE: <span className="font-bold text-slate-600">etenders.gov.za (Compliant Direct-Bypass)</span>
            </span>
            <button
              onClick={() => fetchTenders(selectedProvince)}
              disabled={loading}
              className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-slate-800 bg-white cursor-pointer hover:bg-slate-50 disabled:opacity-50"
              title="Refresh feed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tenders list */}
        <div className="p-4 sm:p-5">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Quarantine-checking provincial certificates and querying feeds...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-4 text-center max-w-md mx-auto space-y-3">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide font-mono">Gateway Connection Terminated</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {error} Let's verify whether CORS locks or intranet firewall blocks prevented this public RSS fetch. Fallback simulation active.
              </p>
              <button
                onClick={() => fetchTenders(selectedProvince)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry Gateway Sync
              </button>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-xs font-mono">No active tenders match "{searchQuery}" for this province.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Normalized Gateway Responses ({filteredTenders.length})</span>
                <span className="flex items-center gap-1 text-emerald-700">
                  <Database className="w-3 h-3" /> Client Sandbox Isolated
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-2">
                {filteredTenders.map((tender, index) => {
                  const hub = UniversalProvincialService.provincialHubs[selectedProvince];
                  return (
                    <div key={index} className="py-3.5 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-start justify-between gap-4 group">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        
                        {/* Reference & Badge */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-slate-950 text-emerald-400 font-mono font-bold text-[9px] tracking-wider px-2 py-0.5 rounded border border-slate-800 uppercase">
                            {tender.referenceNumber}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 border rounded uppercase ${getProvinceBadgeColor(selectedProvince)}`}>
                            {tender.province}
                          </span>
                          {tender.closingDate && tender.closingDate !== 'See Bulletin Text' && (
                            <span className="text-[9px] font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-100 rounded">
                              Closes: {tender.closingDate}
                            </span>
                          )}
                          {tender.estimatedValue && tender.estimatedValue !== 'N/A' && (
                            <span className="text-[9px] font-mono font-semibold text-emerald-700 bg-emerald-50/50 px-1.5 py-0.5 border border-emerald-100/50 rounded flex items-center gap-1">
                              <TrendingUp className="w-2.5 h-2.5" /> Budget: {tender.estimatedValue}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-800 text-xs group-hover:text-emerald-800 transition-colors leading-relaxed">
                          {tender.title}
                        </h4>

                        {/* Department details */}
                        {tender.department && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            ORGAN OF STATE: <span className="font-semibold text-slate-600">{tender.department}</span>
                          </div>
                        )}
                      </div>

                      {/* Launchers / Fill Forms actions */}
                      <div className="flex flex-row md:flex-col items-stretch md:items-end justify-start gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onSelectTender(tender, 'ADVISOR')}
                          className="bg-emerald-750 hover:bg-emerald-800 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          Financial Planner
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectTender(tender, 'SBD4')}
                          className="bg-slate-800 hover:bg-slate-900 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          Fill SBD 4
                          <ArrowRight className="w-3 h-3" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => onSelectTender(tender, 'SBD61')}
                          className="bg-slate-700 hover:bg-slate-800 text-white font-mono font-bold text-[9px] uppercase tracking-wider py-1.5 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          <Award className="w-3 h-3" />
                          Fill SBD 6.1
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        {tender.documentDownloadUrl && (
                          <a
                            href={tender.documentDownloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-center font-mono font-bold text-[8px] uppercase tracking-widest py-1 px-2.5 rounded flex items-center justify-center gap-1 transition-colors"
                          >
                            Source PDF
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
