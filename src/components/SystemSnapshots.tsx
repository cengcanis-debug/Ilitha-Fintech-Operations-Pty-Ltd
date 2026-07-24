import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  Plus, 
  ChevronRight, 
  Search, 
  FileText, 
  AlertTriangle, 
  Gauge
} from 'lucide-react';
import { 
  createSnapshot, 
  getAllSnapshots, 
  deleteSnapshot, 
  restoreSnapshot, 
  clearAllSnapshots, 
  SystemSnapshot 
} from '../utils/indexedDb';

interface SystemSnapshotsProps {
  addLog: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export default function SystemSnapshots({ addLog }: SystemSnapshotsProps) {
  const [snapshots, setSnapshots] = useState<SystemSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSnapshot, setSelectedSnapshot] = useState<SystemSnapshot | null>(null);

  // Auto-snapshot configuration
  const [autoEnabled, setAutoEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('sata_tm_auto_enabled');
      return val === 'true';
    } catch {
      return true; // Enabled by default
    }
  });

  const [intervalSec, setIntervalSec] = useState<number>(() => {
    try {
      const val = localStorage.getItem('sata_tm_interval_sec');
      return val ? parseInt(val, 10) : 60; // 60s default
    } catch {
      return 60;
    }
  });

  const [countdown, setCountdown] = useState(intervalSec);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Storage metrics
  const [totalSizeKB, setTotalSizeKB] = useState(0);

  // Load snapshots from IndexedDB
  const fetchSnapshots = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAllSnapshots();
      setSnapshots(data);
      
      // Calculate total size
      const totalBytes = data.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
      setTotalSizeKB(parseFloat((totalBytes / 1024).toFixed(2)));
    } catch (err: any) {
      console.error(err);
      addLog(`Failed to fetch snapshots from IndexedDB: ${err.message}`, 'error');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  // Save auto config changes
  useEffect(() => {
    localStorage.setItem('sata_tm_auto_enabled', String(autoEnabled));
    localStorage.setItem('sata_tm_interval_sec', String(intervalSec));
    setCountdown(intervalSec);
  }, [autoEnabled, intervalSec]);

  // Periodic Auto-Snapshot logic
  useEffect(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    if (!autoEnabled) return;

    countdownTimerRef.current = setInterval(async () => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Trigger snapshot
          (async () => {
            try {
              const snap = await createSnapshot('Periodic Auto-Snapshot', true);
              addLog(`Time Machine: Created periodic auto-snapshot (${snap.id}).`, 'success');
              fetchSnapshots(true);
            } catch (err: any) {
              console.error(err);
              addLog(`Time Machine: Auto-snapshot failed: ${err.message}`, 'error');
            }
          })();
          return intervalSec; // Reset countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [autoEnabled, intervalSec]);

  // Create manual snapshot
  const handleCreateManual = async () => {
    try {
      const label = customLabel.trim() || 'Manual Workspace Snapshot';
      const snap = await createSnapshot(label, false);
      addLog(`Time Machine: Created manual snapshot "${label}" (${snap.id}).`, 'success');
      setCustomLabel('');
      await fetchSnapshots();
    } catch (err: any) {
      addLog(`Time Machine: Manual snapshot failed: ${err.message}`, 'error');
    }
  };

  // Restore snapshot
  const handleRestore = async (id: string) => {
    if (!confirm('Are you sure you want to restore the entire workspace to this snapshot? All current un-saved changes in current tabs will be overwritten!')) {
      return;
    }
    try {
      const snap = await restoreSnapshot(id);
      addLog(`Time Machine: Workspace successfully restored to timestamp: ${new Date(snap.timestamp).toLocaleTimeString()}`, 'success');
      alert('Workspace state successfully restored! Reloding page to update state...');
      window.location.reload();
    } catch (err: any) {
      addLog(`Time Machine: State restoration failed: ${err.message}`, 'error');
    }
  };

  // Delete snapshot
  const handleDelete = async (id: string) => {
    try {
      await deleteSnapshot(id);
      addLog(`Time Machine: Snapshot ${id} removed from IndexedDB database.`, 'info');
      if (selectedSnapshot?.id === id) {
        setSelectedSnapshot(null);
      }
      await fetchSnapshots();
    } catch (err: any) {
      addLog(`Time Machine: Failed to delete snapshot: ${err.message}`, 'error');
    }
  };

  // Wipe all snapshots
  const handleWipeAll = async () => {
    if (!confirm('CRITICAL ACTION: This will permanently wipe all local system snapshots stored in IndexedDB. Are you sure?')) {
      return;
    }
    try {
      await clearAllSnapshots();
      addLog('Time Machine: All system snapshots permanently wiped from IndexedDB.', 'warn');
      setSelectedSnapshot(null);
      await fetchSnapshots();
    } catch (err: any) {
      addLog(`Time Machine: Failed to clear database: ${err.message}`, 'error');
    }
  };

  // Download snapshot file
  const handleDownloadFile = (snap: SystemSnapshot) => {
    try {
      const fileContent = JSON.stringify(snap, null, 2);
      const blob = new Blob([fileContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SATA_TimeMachine_${snap.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addLog(`Downloaded snapshot file for backup ID ${snap.id}`, 'success');
    } catch (err: any) {
      addLog(`Failed to download snapshot: ${err.message}`, 'error');
    }
  };

  // Upload/Import snapshot file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.id || !parsed.timestamp || !parsed.data) {
          throw new Error('Invalid file format. Missing snapshot ID, timestamp, or state payload.');
        }

        // Restore immediately
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sata_') || key.includes('cert') || key.includes('tender') || key.includes('compliance'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        Object.entries(parsed.data).forEach(([key, val]) => {
          localStorage.setItem(key, val as string);
        });

        addLog(`Successfully imported offline backup snapshot and restored workspace state.`, 'success');
        alert('Offline recovery snapshot successfully applied! Reloading workspace...');
        window.location.reload();
      } catch (err: any) {
        addLog(`Failed to import backup file: ${err.message}`, 'error');
        alert(`Error importing backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Crash Simulator
  const handleSimulateCrash = () => {
    if (!confirm('DANGER ZONE: This will simulate a complete client-side crash by wiping local RAM cache variables. This is designed to let you test the Time Machine restoration. Proceed?')) {
      return;
    }
    
    // Wipe everything
    const keysToWipe = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sata_') || key.includes('cert') || key.includes('tender') || key.includes('compliance'))) {
        keysToWipe.push(key);
      }
    }
    keysToWipe.forEach(k => localStorage.removeItem(k));
    
    addLog('CRITICAL: Catastrophic client-side state wipe executed!', 'error');
    alert('Simulated crash successful! All local session states have been wiped. Use Time Machine below to select a snapshot and restore.');
    window.location.reload();
  };

  // Filter snapshots
  const filteredSnapshots = snapshots.filter(snap => 
    snap.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    snap.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 text-slate-100 space-y-6">
      
      {/* HUD Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-2.5 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">System Snapshots & Time Machine</h3>
            <p className="text-[11px] text-slate-400">IndexedDB-driven automated recovery ledger for SCM workspace configurations.</p>
          </div>
        </div>

        {/* HUD Stats */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-slate-950/60 border border-slate-850 rounded p-2 text-center min-w-[75px]">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Snapshots</div>
            <div className="text-sm font-bold text-white font-mono mt-0.5">{snapshots.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 rounded p-2 text-center min-w-[75px]">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Storage</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{totalSizeKB} KB</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 rounded p-2 text-center min-w-[75px]">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase">Database</div>
            <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">Ready</div>
          </div>
        </div>
      </div>

      {/* Main Grid Options */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Controller Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Section 1: Create Snapshot Card */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-400" />
              Manual Snapshot Seal
            </h4>
            
            <div className="space-y-2">
              <input 
                type="text"
                placeholder="e.g. Before major tender prefill..."
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded px-2.5 py-1.5 text-[11px] font-sans text-slate-100 focus:outline-none focus:border-slate-500 placeholder:text-slate-500"
              />
              <button
                onClick={handleCreateManual}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-[10.5px] font-bold uppercase py-2 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Database className="w-3.5 h-3.5" />
                Snapshot System State
              </button>
            </div>
          </div>

          {/* Section 2: Periodic Scheduler Card */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-sky-400" />
                Time Machine Scheduler
              </h4>
              <button
                onClick={() => setAutoEnabled(!autoEnabled)}
                className={`p-1 rounded text-[9px] font-mono font-bold tracking-wider px-2 transition-all flex items-center gap-1 cursor-pointer ${
                  autoEnabled ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {autoEnabled ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5" />}
                {autoEnabled ? 'RUNNING' : 'PAUSED'}
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px] font-sans text-slate-400">
                <span>Backup Interval:</span>
                <div className="flex gap-1">
                  {[30, 60, 120, 300].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setIntervalSec(sec)}
                      className={`px-1.5 py-0.5 font-mono text-[9.5px] rounded border transition-all cursor-pointer ${
                        intervalSec === sec 
                          ? 'bg-sky-500/10 text-sky-400 border-sky-500/40 font-bold' 
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {autoEnabled ? (
                <div className="flex items-center justify-between text-[10.5px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/50">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                    Next Auto-Snapshot:
                  </span>
                  <span className="text-sky-400 font-bold">{countdown}s</span>
                </div>
              ) : (
                <div className="text-center py-2 text-[10.5px] font-mono text-slate-500 italic">
                  Automated periodic snapshot scheduler is paused.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Crisis Testing Centre */}
          <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-4 space-y-3">
            <div>
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Time Machine Crisis Sandbox
              </h4>
              <p className="text-[10px] text-red-300 font-sans mt-0.5 leading-normal">
                Wipe active workspace RAM variables and simulate a full platform failure to audit how system recovery restores parameters.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-red-900/20 pt-3">
              <button
                onClick={handleSimulateCrash}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-mono text-[10px] font-bold uppercase py-1.5 px-3 rounded transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Wipe RAM (Simulate Crash)
              </button>

              <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] font-bold uppercase py-1.5 px-3 rounded transition-all flex items-center justify-center gap-1 border border-slate-700 cursor-pointer text-center shadow-sm">
                <Upload className="w-3.5 h-3.5" />
                Upload Capsule
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportFile}
                  className="hidden" 
                />
              </label>
            </div>
          </div>

        </div>

        {/* Right Side: Snapshots Registry Ledger (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-950/30 border border-slate-800/80 rounded-lg p-4 space-y-4 flex flex-col h-[480px]">
          
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Snapshots Ledger Registry</h4>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Retrieve or restore compiled local memory files.</p>
            </div>
            
            <button
              onClick={handleWipeAll}
              className="text-[9.5px] font-mono text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/60 px-2 py-1 rounded border border-red-900/40 cursor-pointer"
            >
              Wipe Ledger DB
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by snapshot ID or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-[10.5px] font-mono text-slate-200 focus:outline-none focus:border-slate-700 placeholder:text-slate-500"
            />
          </div>

          {/* Snapshot list scroll container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span className="text-xs font-mono">Scanning IndexedDB stores...</span>
              </div>
            ) : filteredSnapshots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded py-12 text-center text-slate-500 font-mono">
                <FileText className="w-8 h-8 opacity-40 mb-2" />
                <span className="text-[11px]">No matching snapshots found.</span>
              </div>
            ) : (
              filteredSnapshots.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                const sizeKB = (snap.sizeBytes / 1024).toFixed(2);
                
                return (
                  <div 
                    key={snap.id} 
                    className={`border rounded p-3 transition-all space-y-2.5 cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20' 
                        : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80'
                    }`}
                    onClick={() => setSelectedSnapshot(snap)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold text-white flex items-center gap-1.5 font-sans leading-tight">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${snap.isAuto ? 'bg-sky-400' : 'bg-emerald-400'}`}></span>
                          {snap.label}
                        </div>
                        <div className="text-[9.5px] font-mono text-slate-400 flex items-center gap-2">
                          <span>{snap.id}</span>
                          <span>•</span>
                          <span>{new Date(snap.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[8.5px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                          snap.isAuto 
                            ? 'bg-sky-950 text-sky-400 border border-sky-900/60' 
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-900/60'
                        }`}>
                          {snap.isAuto ? 'Auto' : 'Manual'}
                        </span>
                        <span className="text-[9.5px] font-mono font-bold text-slate-300">
                          {sizeKB} KB
                        </span>
                      </div>
                    </div>

                    {/* Collapsible State Payload Details */}
                    {isSelected && (
                      <div className="border-t border-slate-800/60 pt-2.5 space-y-2.5 animate-fadeIn">
                        <div className="text-[10px] font-mono text-slate-400 space-y-1 bg-slate-950/80 p-2 rounded">
                          <span className="font-bold text-slate-300 block uppercase tracking-wider text-[9px] mb-1">State Envelope Keys:</span>
                          <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                            {Object.keys(snap.data).map(key => (
                              <span key={key} className="bg-slate-900 border border-slate-800 px-1 py-0.2 rounded text-[9px] text-slate-400 font-semibold select-all">
                                {key}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Restore/Download/Delete bar */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestore(snap.id); }}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-mono text-[9.5px] font-bold uppercase py-1 rounded transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 font-bold" />
                            Restore state
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownloadFile(snap); }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded font-mono text-[9.5px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title="Export offline JSON file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(snap.id); }}
                            className="bg-red-950/40 hover:bg-red-900/40 text-red-400 border border-red-900/30 px-2 py-1 rounded transition-all flex items-center justify-center cursor-pointer"
                            title="Delete Snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
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
