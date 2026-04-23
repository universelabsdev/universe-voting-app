import React from "react";
import { useParams } from "react-router-dom";
import { useVoting } from "../features/voting/application/useVoting";
import { useLiveVotesSubscription } from "../features/voting/infrastructure/useLiveVotes";
import { Loader2, Users } from "lucide-react";
import { LiveChat } from "../features/chat/LiveChat";

export default function LiveTrackerPage() {
  const { id } = useParams<{ id: string }>();
  const { useElectionDetails, useLiveResults } = useVoting();
  
  const { data: election, isLoading: isLoadingElection } = useElectionDetails(id!);
  const { data: resultsData, refetch, isLoading: isLoadingResults } = useLiveResults(id!);

  // Subscribe to realtime supabase
  useLiveVotesSubscription(id!, () => {
    refetch(); // Refetch when new vote is inserted via Supabase
  });

  if (isLoadingElection || isLoadingResults) {
    return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-[#22d3ee]" size={40} /></div>;
  }

  if (!election || !resultsData) {
    return <div className="text-center text-[#94a3b8] mt-20">Unable to load live results.</div>;
  }

  const totalVotes = resultsData?.totalVotes || 0;
  const results = resultsData?.results || {};
  const demographics = resultsData?.demographics;

  // Calculate percentages
  const candidatesWithResults = election.candidates.map(candidate => {
    const votes = results?.[candidate.id] || 0;
    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
    return { ...candidate, votes, percentage };
  }).sort((a, b) => b.votes - a.votes);

  const totalEligible = election.totalEligibleVoters || 1000;
  const turnoutPercentage = (totalVotes / totalEligible) * 100;

  const fallbackImage = "https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative z-10 pb-20">
      
      <div className="h-48 w-full rounded-3xl overflow-hidden relative border border-white/10 mb-8 shadow-2xl">
        <img 
          src={election.coverImage || election.imageUrl || fallbackImage} 
          alt={election.title} 
          className="w-full h-full object-cover opacity-30 grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>
        <div className="absolute bottom-6 left-8">
           <div className="flex items-center gap-3 mb-1">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-[#34d399]/20 backdrop-blur-md px-3 py-1 rounded-md border border-[#34d399]/30 text-[#34d399] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" /> Live Analysis
             </span>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/5 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-white/60">
               {election.category}
             </span>
           </div>
           <h1 className="text-3xl font-black tracking-tighter text-white uppercase">{election.title}</h1>
        </div>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden mb-8">
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-6">
          <div className="flex-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#34d399] mb-3 block flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse-glow" /> Active Election
            </span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight mb-3">{election.title}</h1>
            <p className="text-white/50 text-sm max-w-xl italic line-clamp-2">{election.description}</p>
          </div>
          
          <div className="w-full md:w-64 bg-black/40 border border-white/5 p-5 rounded-2xl shrink-0">
             <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 uppercase font-bold tracking-widest flex items-center gap-1.5"><Users size={12} /> Turnout</span>
                <span className="text-sm font-mono text-[#22d3ee] font-bold">{turnoutPercentage.toFixed(1)}%</span>
             </div>
             <div className="h-2 flex w-full bg-white/5 rounded-full overflow-hidden mb-3">
                <div className="bg-gradient-to-r from-[#22d3ee] to-[#34d399] h-full transition-all duration-1000" style={{ width: `${turnoutPercentage}%`}}></div>
             </div>
             <div className="flex justify-between text-[10px] font-mono text-white/30 uppercase">
                <span>{totalVotes.toLocaleString()} CAST</span>
                <span>{totalEligible.toLocaleString()} ELIGIBLE</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Top Demographics */}
        <div className="glass-panel p-8 flex flex-col lg:col-span-1 min-h-[350px]">
          <h3 className="text-lg font-bold mb-6 w-full uppercase tracking-widest text-sm border-b border-white/10 pb-4">Voter Demographics</h3>
          {demographics ? (
             <div className="space-y-4 flex-1 flex flex-col justify-center">
                {Object.entries(demographics).sort((a,b) => b[1] - a[1]).map(([group, count], idx) => {
                   const pct = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
                   return (
                     <div key={group} className="space-y-1.5">
                       <div className="flex justify-between text-xs font-bold">
                          <span className="text-white/80 tracking-wide">{group}</span>
                          <span className="text-white/40 font-mono">{pct.toFixed(0)}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="bg-white/30 h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, opacity: 1 - (idx * 0.2) }}></div>
                       </div>
                     </div>
                   )
                })}
             </div>
          ) : (
             <div className="flex-1 flex items-center justify-center text-white/30 text-sm">Waiting for data...</div>
          )}
        </div>

        {/* Bar Charts Widget */}
        <div className="glass-panel p-8 lg:col-span-2 space-y-8 flex flex-col justify-center">
           <h3 className="text-lg font-bold mb-2 uppercase tracking-widest text-sm border-b border-white/10 pb-4">Current Standings</h3>
           
           {candidatesWithResults.length === 0 && (
             <div className="text-white/50 py-10">No candidates available.</div>
           )}

           <div className="space-y-6 pt-2">
             {candidatesWithResults.map((candidate, i) => {
               const colors = ["from-[#34d399] to-[#22d3ee]", "from-[#a78bfa] to-[#22d3ee]", "from-[#fbbf24] to-[#f59e0b]", "from-[#22d3ee] to-[#3b82f6]"];
               const gradient = colors[i % colors.length];
               const hasVotes = candidate.votes > 0;
               
               return (
                 <div key={candidate.id} className="space-y-3 relative group">
                   <div className="absolute top-2 -left-3 w-1 h-10 rounded-r-lg bg-white/10 group-hover:bg-white/30 transition-colors"></div>
                   <div className="flex justify-between items-end pl-2">
                     <span className="text-xl font-bold tracking-tight">{candidate.name}</span>
                     <div className="text-right">
                       <div className="text-2xl font-mono font-black tracking-tighter text-[#34d399]">{candidate.percentage.toFixed(1)}%</div>
                       <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{candidate.votes.toLocaleString()} Votes</div>
                     </div>
                   </div>
                   <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden relative shadow-inner pl-2">
                     <div 
                       className={`absolute top-0 left-0 h-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-out`}
                       style={{ width: `${hasVotes ? candidate.percentage : 0}%` }}
                     />
                   </div>
                 </div>
               );
             })}
           </div>
        </div>

      </div>
      
      {/* Real-time Twitch-style Live Chat */}
      <div className="mt-8 pt-8 border-t border-white/5">
        <LiveChat electionId={election.id} />
      </div>
      
    </div>
  );
}
