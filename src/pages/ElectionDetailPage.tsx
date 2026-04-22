import React, { useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useVoting } from "../features/voting/application/useVoting";
import { ChevronLeft, Info, Loader2, Camera, TrendingUp } from "lucide-react";
import Markdown from "react-markdown";
import { useUser } from "@clerk/clerk-react";
import { useLiveVotesSubscription } from "../features/voting/infrastructure/useLiveVotes";
import { useApiClient } from "../api/client";

export default function ElectionDetailPage() {
  useApiClient();
  const { id } = useParams<{ id: string }>();
  const { useElectionDetails, useUpdateCandidateImage, useLiveResults } = useVoting();
  const { data: election, isLoading } = useElectionDetails(id!);
  const { data: resultsData, refetch: refetchResults } = useLiveResults(id!);
  const updateCandidateImage = useUpdateCandidateImage();
  const { user } = useUser();

  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.primaryEmailAddress?.emailAddress === "mulondoandrew.waik@gmail.com";

  useLiveVotesSubscription(id!, () => {
    refetchResults();
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, candidateId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (id) {
        updateCandidateImage.mutate({
          electionId: id,
          candidateId,
          imageUrl: base64String
        });
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="animate-spin text-[#34d399]" size={48} />
        <p className="text-[#94a3b8]">Loading election details...</p>
      </div>
    );
  }

  if (!election) {
    return <div className="text-center text-red-400 mt-20 glass-panel p-8">Election not found.</div>;
  }

  const fallbackImage = "https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=1200&auto=format&fit=crop";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Banner Image */}
      <div className="h-64 w-full rounded-3xl overflow-hidden relative border border-white/10">
        <img 
          src={election.coverImage || election.imageUrl || fallbackImage} 
          alt={election.title} 
          className="w-full h-full object-cover opacity-40 grayscale-[0.3]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>
        <div className="absolute bottom-8 left-8 right-8">
           <div className="flex items-center gap-3 mb-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-3 py-1 rounded-md border border-white/20 text-white">
               {election.category}
             </span>
             {election.status === "ACTIVE" && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34d399]"></span>
                </span>
              )}
           </div>
           <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">{election.title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-white/10 pb-6 shrink-0 relative z-10">
        <Link to="/" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/50 hover:text-white shrink-0">
          <ChevronLeft size={20} />
        </Link>
        <div>
          <p className="text-white/50 text-sm font-mono tracking-widest uppercase">Election Overview & Deep Dive</p>
          <div className="flex items-center gap-6 mt-2 text-[10px] font-mono text-white/30 uppercase tracking-widest">
            <div className="flex flex-col gap-1">
              <span>Opens</span>
              <span className="text-white/60">{election.startTime ? new Date(election.startTime).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="w-[1px] h-6 bg-white/5"></div>
            <div className="flex flex-col gap-1">
              <span>Closes</span>
              <span className="text-white/60">{election.endTime ? new Date(election.endTime).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel p-8 text-white/80 leading-relaxed shadow-[0_0_30px_rgba(255,255,255,0.02)]">
        {election.description}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <span className="text-[#22d3ee]"><Info size={24} /></span>
          Candidates & Manifestos
        </h2>

        <div className="grid gap-6">
          {election.candidates.map((candidate) => {
            const votes = resultsData?.results?.[candidate.id] || 0;
            const totalVotes = resultsData?.totalVotes || 0;
            const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;

            return (
            <div key={candidate.id} className="glass-panel p-0 overflow-hidden flex flex-col md:flex-row group transition-all border-white/5 hover:border-white/20">
              <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-white/5 bg-black/40 flex flex-col items-center justify-center text-center shrink-0 relative">
                <div className="absolute top-4 left-4 right-4 flex justify-between tracking-widest text-[10px] uppercase font-bold">
                   <span className="text-white/40">Current Lean</span>
                   <span className="text-[#34d399] drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                     {percentage.toFixed(1)}%
                   </span>
                </div>
                <div className="w-full absolute top-0 left-0 h-1 bg-white/5">
                   <div className="h-full bg-gradient-to-r from-[#34d399] to-[#22d3ee] transition-all duration-1000" style={{width: `${percentage}%`}} />
                </div>
                <div className="relative mb-4 group/image mt-4">
                  {(candidate.photo || candidate.avatar || candidate.imageUrl) ? (
                    <img src={candidate.photo || candidate.avatar || candidate.imageUrl} alt={candidate.name} className="w-24 h-24 rounded-full border-2 border-white/10 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-white/10 flex items-center justify-center bg-white/5 text-xs text-white/40">No Image</div>
                  )}
                  {isAdmin && (
                    <label className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/image:opacity-100 cursor-pointer transition-opacity">
                      <Camera size={20} className="text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleImageUpload(e, candidate.id)} 
                        disabled={updateCandidateImage.isPending}
                      />
                    </label>
                  )}
                </div>
                {updateCandidateImage.isPending && updateCandidateImage.variables?.candidateId === candidate.id && (
                  <span className="text-[10px] text-[#34d399] tracking-widest uppercase font-bold animate-pulse mb-2">Uploading...</span>
                )}
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#22d3ee] transition-colors">{candidate.name}</h3>
                <span className="text-xs font-bold uppercase tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full">Candidate</span>
              </div>
              
              <div className="p-6 md:w-2/3 prose prose-invert prose-emerald prose-sm max-w-none text-white/70">
                {candidate.manifesto ? (
                  <Markdown>{candidate.manifesto}</Markdown>
                ) : (
                  <div className="text-white/30 italic flex items-center h-full">No detailed manifesto provided for this candidate.</div>
                )}
              </div>
            </div>
          );})}
          {(!election.candidates || election.candidates.length === 0) && (
            <div className="glass-panel p-12 text-center text-white/40">
              No candidates have been registered for this election yet.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
