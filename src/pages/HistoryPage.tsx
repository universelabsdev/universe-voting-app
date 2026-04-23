import React, { useState, useRef } from "react";
import { useVoting } from "../features/voting/application/useVoting";
import { Receipt, Calendar, ExternalLink, Download, Search, CheckCircle, XCircle } from "lucide-react";
import html2canvas from "html2canvas";

export default function HistoryPage() {
  const { useMyHistory, useVerifyVote } = useVoting();
  const { data: history, isLoading } = useMyHistory();
  const verifyVote = useVerifyVote();

  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; timestamp?: string } | null>(null);

  const receiptRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownload = async (receiptId: string) => {
    const node = receiptRefs.current[receiptId];
    if (!node) return;
    
    try {
      const canvas = await html2canvas(node, {
        backgroundColor: "#0f0f0f",
        scale: 2
      });
      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `universe-vote-receipt-${receiptId.substring(0,8)}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate receipt image", err);
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyCode) return;
    
    verifyVote.mutate(verifyCode, {
      onSuccess: (data) => setVerifyResult(data),
      onError: () => setVerifyResult({ valid: false })
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Voting Ledger</h1>
        <p className="text-white/60 text-sm font-mono tracking-widest uppercase">Verified, immutable records of your participation</p>
      </div>

      {/* Verification Portal */}
      <div className="glass-panel p-6 sm:p-8 bg-gradient-to-br from-black/60 to-black border-white/10 relative overflow-hidden group">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#a78bfa]/10 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 flex flex-col sm:flex-row gap-8 items-start sm:items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Public Verification Portal</h2>
            <p className="text-sm text-white/50 mb-4">Enter a confirmation code to publicly verify a vote's inclusion in the ledger.</p>
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                placeholder="VOTE-XXXX-YYYY"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                className="bg-black/50 border border-white/20 rounded-xl px-4 py-3 font-mono text-[#a78bfa] focus:outline-none focus:border-[#a78bfa]/50 w-full md:w-64 tracking-widest placeholder:text-white/20 transition-colors"
                maxLength={14}
              />
              <button 
                type="submit" 
                disabled={verifyVote.isPending || !verifyCode}
                className="bg-[#a78bfa]/20 hover:bg-[#a78bfa]/30 border border-[#a78bfa]/30 text-[#a78bfa] font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifyVote.isPending ? "Connecting..." : <><Search size={16} /> Verify Node</>}
              </button>
            </form>
          </div>

          {/* Verification Result Canvas */}
          <div className="w-full sm:w-64 h-32 bg-black/60 rounded-xl border border-white/5 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
             {verifyResult === null ? (
               <div className="text-white/20 text-xs font-mono text-center px-4 uppercase tracking-widest">Awaiting Verification Parameters</div>
             ) : verifyResult.valid ? (
               <div className="text-center animate-in zoom-in duration-300">
                 <div className="flex items-center justify-center gap-2 text-[#34d399] font-bold tracking-widest mb-1">
                   <CheckCircle size={18} /> VALID HASH
                 </div>
                 <div className="text-[10px] text-white/50 font-mono mt-2 bg-black/40 px-2 py-1 rounded border border-[#34d399]/20">
                   SYNCED: {verifyResult.timestamp ? new Date(verifyResult.timestamp).toLocaleString() : 'N/A'}
                 </div>
               </div>
             ) : (
               <div className="text-center animate-in zoom-in duration-300">
                 <div className="flex items-center justify-center gap-2 text-red-400 font-bold tracking-widest mb-1">
                   <XCircle size={18} /> INVALID HASH
                 </div>
                 <div className="text-xs text-white/50 mt-1">Record not found in ledger.</div>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="relative">
        <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">Cryptographic Receipts</h2>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="glass-panel h-32 animate-pulse w-full bg-white/5" />
            ))}
          </div>
        ) : history && history.length > 0 ? (
          <div className="grid gap-6">
            {history.map((receipt, index) => (
              <div key={index} className="glass-panel p-0 relative overflow-hidden group">
                {/* Downloadable Wrapper */}
                <div 
                  ref={(el) => { receiptRefs.current[receipt.confirmationCode] = el; }} 
                  className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10 bg-[#0f0f0f]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                     <Receipt size={120} />
                  </div>
                  
                  <div className="flex items-center gap-5 w-full md:w-auto relative z-10">
                    <div className="p-4 bg-gradient-to-br from-[#a78bfa]/20 to-transparent rounded-2xl border border-[#a78bfa]/30 shadow-[0_0_20px_rgba(167,139,250,0.1)]">
                      <Receipt className="text-[#a78bfa]" size={28} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg tracking-tight mb-1">Election Header #{receipt.electionId.substring(0,8)}</h3>
                      <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
                        <span className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded"><Calendar size={12} /> {new Date(receipt.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end w-full md:w-auto gap-3 relative z-10 p-4 md:p-0 bg-black/20 md:bg-transparent rounded-xl border md:border-none border-white/5">
                    <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Immutable Confirmation Code</div>
                    <div className="font-mono font-bold text-xl text-[#34d399] tracking-wider select-all break-all text-center md:text-right">
                      {receipt.confirmationCode}
                    </div>
                  </div>
                </div>

                {/* Actions Ribbon */}
                <div className="bg-black/80 border-t border-white/10 px-6 py-3 flex justify-end gap-4 relative z-20">
                    <button 
                      onClick={() => { setVerifyCode(receipt.confirmationCode); window.scrollTo(0, 0); }}
                      className="text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={14} /> Audit Trace
                    </button>
                    <button 
                      onClick={() => handleDownload(receipt.confirmationCode)}
                      className="text-xs text-[#a78bfa] hover:text-[#c4b5fd] uppercase font-bold tracking-widest flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={14} /> Save Digital Receipt
                    </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-16 text-center text-white/30 border-dashed border-2 border-white/10">
            <Receipt size={64} className="mx-auto mb-6 opacity-20" />
            <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Ledger Empty</h3>
            <p className="text-sm max-w-sm mx-auto">You haven't participated in any elections yet. Secure cast receipts will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
