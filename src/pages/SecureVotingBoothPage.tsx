import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useVoting } from "../features/voting/application/useVoting";
import { generateVoterHash } from "../features/voting/application/voterHash";
import { useUser } from "@clerk/clerk-react";
import { CheckCircle, AlertTriangle, ShieldCheck, ArrowRight, Loader2, Award, Share2, Info, X } from "lucide-react";
import Markdown from 'react-markdown';

export default function SecureVotingBoothPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { useElectionDetails, useEligibility, useSubmitVote, usePostFeed } = useVoting();
  
  const { data: election, isLoading: isLoadingElection } = useElectionDetails(id!);
  const { data: eligibility, isLoading: isLoadingEligibility } = useEligibility(id!);
  const submitVote = useSubmitVote();
  const postFeed = usePostFeed();

  const [step, setStep] = useState<"VERIFY" | "SELECT" | "CONFIRM">("VERIFY");
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [comparingCandidate, setComparingCandidate] = useState<string | null>(null);
  const [voterHash, setVoterHash] = useState<string>("");
  const [receipt, setReceipt] = useState<string | null>(null);
  const [gamification, setGamification] = useState<{ points: number; badge: boolean } | null>(null);

  useEffect(() => {
    generateVoterHash().then(setVoterHash);
  }, []);

  const handleVoteSubmit = async () => {
    if (!selectedCandidate || !election) return;
    
    // The backend specifies that each election contains a positions array, 
    // and for this implementation, we use the first one.
    const positionId = election.positions?.[0]?.id || election.id;

    submitVote.mutate({
      electionId: election.id,
      selections: [{
        positionId: positionId,
        candidateIds: [selectedCandidate],
        abstain: false,
        none: false
      }]
    }, {
      onSuccess: (data) => {
        setReceipt(data.confirmationCode);
        setGamification({ points: data.pointsEarned, badge: data.badgeUnlocked });
        setStep("CONFIRM");
      }
    });
  };

  const { user } = useUser();

  const handleShareToFeed = () => {
    postFeed.mutate({
      content: `I just securely cast my vote in the "${election?.title}"! 🗳️ Participate now before the ledger locks.`,
      authorName: user?.fullName || undefined,
      authorImageUrl: user?.imageUrl || undefined
    }, {
      onSuccess: () => alert("Successfully shared to Civic Buzz feed!")
    });
  };

  if (isLoadingElection || isLoadingEligibility) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-[#34d399]" size={48} />
        <p className="text-[#94a3b8]">Securing connection to voting ledger...</p>
      </div>
    );
  }

  if (!election) {
    return <div className="text-center text-red-400 mt-20 glass-panel p-8">Election not found.</div>;
  }

  if (eligibility && !eligibility.eligible) {
    return (
      <div className="max-w-xl mx-auto mt-20 glass-panel border-red-500/20 p-8 text-center text-red-300">
        <AlertTriangle size={48} className="mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Not Eligible</h2>
        <p className="opacity-80 mb-6 text-sm">
          {eligibility.reason === "ALREADY_VOTED" ? "You have already cast a secure vote in this election. Double voting is cryptographically prevented." : "You are not registered in the voting registry."}
        </p>
        <button onClick={() => navigate("/")} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-6 py-2 transition tracking-wider text-xs uppercase font-bold">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const fallbackImage = "https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-20 relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[300px] opacity-10 pointer-events-none overflow-hidden blur-sm">
        <img 
          src={election.coverImage || election.imageUrl || fallbackImage} 
          alt="" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f0f]"></div>
      </div>

      <div className="flex items-center justify-between border-b border-white/10 pb-6 shrink-0 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">{election.title}</h1>
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">Secure Voting Booth</p>
        </div>
        <ShieldCheck size={40} className="text-[#34d399] opacity-50" />
      </div>

      {step === "VERIFY" && (
        <div className="glass-panel p-8 md:p-12 text-center space-y-6 max-w-2xl mx-auto mt-10 shadow-[0_0_50px_rgba(52,211,153,0.05)] relative z-10">
          <div className="w-20 h-20 bg-[#34d399]/10 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(52,211,153,0.2)] border border-[#34d399]/30">
            <CheckCircle size={36} className="text-[#34d399]" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Identity Verified</h2>
          <p className="text-white/60 max-w-sm mx-auto text-sm leading-relaxed">
            Your eligibility for this election has been cryptographically confirmed via Clerk JWT & Supabase policies. You may proceed.
          </p>
          <div className="text-xs font-mono text-white/30 bg-black/40 py-3 px-4 rounded-lg max-w-sm mx-auto overflow-hidden text-ellipsis border border-white/5">
            SESSION HASH: {voterHash || "Generating..."}
          </div>
          <div className="pt-4">
            <button 
              onClick={() => setStep("SELECT")}
              className="w-full sm:w-auto bg-gradient-to-r from-[#34d399] to-[#22d3ee] text-[#000000] font-black uppercase tracking-widest text-xs py-3 px-8 rounded-xl transition-transform hover:scale-105 flex items-center justify-center gap-2 mx-auto shadow-[0_0_20px_rgba(52,211,153,0.2)]"
            >
              Enter Voting Booth <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === "SELECT" && (
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-3 mb-6 bg-white/5 p-4 rounded-xl border border-white/5 w-fit">
            <span className="bg-[#22d3ee]/20 text-[#22d3ee] px-3 py-1 rounded-full text-xs font-bold border border-[#22d3ee]/30 uppercase tracking-widest">Single Choice</span>
            <span className="text-white/60 text-sm">Select one candidate for this position</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-bold tracking-tight uppercase text-white/80">Candidates</h3>
              {election.candidates.map(candidate => (
                <div key={candidate.id} className={`glass-panel p-6 text-left transition-all relative overflow-hidden group ${selectedCandidate === candidate.id ? 'border-[#34d399]/50 bg-[#34d399]/5 shadow-[0_0_25px_rgba(52,211,153,0.15)] ring-1 ring-[#34d399]/50' : 'hover:border-white/20'}`}>
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => setSelectedCandidate(candidate.id)}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 ${selectedCandidate === candidate.id ? 'border-[#34d399]' : 'border-white/20 group-hover:border-white/40'}`}>
                        {selectedCandidate === candidate.id && <div className="w-3 h-3 bg-[#34d399] rounded-full animate-pulse-glow"></div>}
                      </div>
                      <div className="flex items-center gap-3">
                        {(candidate.photo || candidate.avatar || candidate.imageUrl) && <img src={candidate.photo || candidate.avatar || candidate.imageUrl} alt={candidate.name} className="w-10 h-10 rounded-full border border-white/10 object-cover" referrerPolicy="no-referrer" />}
                        <h3 className={`text-xl font-bold transition-colors ${selectedCandidate === candidate.id ? 'text-[#34d399]' : 'text-white'}`}>{candidate.name}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setComparingCandidate(candidate.id); }}
                      className="text-xs font-bold uppercase tracking-widest text-[#22d3ee] hover:text-white transition flex items-center gap-1"
                    >
                      <Info size={14} /> View Manifesto
                    </button>
                    {selectedCandidate === candidate.id && <span className="text-[10px] font-mono text-[#34d399]/50 uppercase tracking-widest">Selected</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Manifesto / Deep Dive Panel */}
            <div className="hidden md:block glass-panel p-6 border-white/5 h-[500px] overflow-y-auto custom-scrollbar sticky top-10">
              {comparingCandidate ? (() => {
                 const cand = election.candidates.find(c => c.id === comparingCandidate);
                 return (
                   <div className="animate-in fade-in duration-300">
                     <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                       <h3 className="text-xl font-bold">{cand?.name}</h3>
                       <button onClick={() => setComparingCandidate(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
                     </div>
                     <div className="prose prose-invert prose-emerald prose-sm max-w-none">
                       <Markdown>{cand?.manifesto || "*No detailed manifesto provided.*"}</Markdown>
                     </div>
                   </div>
                 );
              })() : (
                 <div className="h-full flex flex-col items-center justify-center text-white/30 text-center space-y-4">
                   <Info size={48} className="opacity-50" />
                   <p className="text-sm max-w-[200px]">Select "View Manifesto" on a candidate to dive deep into their policies.</p>
                 </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <button onClick={() => setStep("VERIFY")} className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition">← Cancel</button>
            <button 
              onClick={handleVoteSubmit}
              disabled={!selectedCandidate || submitVote.isPending}
              className={`px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg ${selectedCandidate && !submitVote.isPending ? 'bg-gradient-to-r from-[#34d399] to-[#22d3ee] text-[#000000] hover:scale-105 shadow-[0_10px_30px_rgba(52,211,153,0.3)]' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}
            >
              {submitVote.isPending ? <Loader2 className="animate-spin" size={16} /> : "Cast Vote"}
            </button>
          </div>
        </div>
      )}

      {step === "CONFIRM" && (
        <div className="glass-panel p-8 md:p-12 text-center space-y-8 max-w-2xl mx-auto mt-10 relative overflow-hidden z-10 shadow-[0_0_50px_rgba(34,211,238,0.1)]">
           <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-glow pointer-events-none"></div>
           
           <div className="w-24 h-24 bg-black/50 border-2 border-[#34d399] rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(52,211,153,0.4)] relative z-10">
             <CheckCircle size={48} className="text-[#34d399] animate-pulse-glow" />
           </div>
           
           <div className="relative z-10">
             <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Vote securely recorded</h2>
             <p className="text-white/60">Your vote has been written to the immutable ledger.</p>
           </div>
           
           {gamification && (
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 animate-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
               <div className="bg-[#fbbf24]/10 border border-[#fbbf24]/30 px-4 py-2 rounded-xl flex items-center gap-2">
                 <span className="text-[#fbbf24] font-bold text-lg">+{gamification.points}</span>
                 <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Civic Pts</span>
               </div>
               {gamification.badge && (
                 <div className="bg-gradient-to-r from-[#A78BFA] to-[#ec4899] p-[1px] rounded-xl flex items-center shadow-[0_0_20px_rgba(167,139,250,0.3)]">
                   <div className="bg-[#0f0f0f] px-4 py-2 rounded-xl flex items-center gap-2 h-full">
                     <Award size={18} className="text-[#A78BFA]" />
                     <span className="text-white text-xs font-bold uppercase tracking-widest">Badge Unlocked: First Vote</span>
                   </div>
                 </div>
               )}
             </div>
           )}
           
           <div className="bg-black/40 border border-white/10 rounded-2xl p-6 text-center max-w-sm mx-auto relative z-10 backdrop-blur-md">
             <p className="text-[#22d3ee] text-[10px] font-bold uppercase tracking-widest mb-2">Digital Receipt Code</p>
             <div className="font-mono text-white text-2xl font-black select-all tracking-wider">
               {receipt}
             </div>
           </div>

           <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
             <button onClick={handleShareToFeed} className="bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 border border-[#22d3ee]/50 text-[#22d3ee] font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-xl transition-all text-center flex items-center justify-center gap-2">
               <Share2 size={16} /> Share to Feed
             </button>
             <Link to="/" className="bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs py-3 px-6 rounded-xl transition-all text-center border border-white/10">
               Return to Dashboard
             </Link>
           </div>
        </div>
      )}

    </div>
  );
}
