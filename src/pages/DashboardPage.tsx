import { useAuth, useUser } from '@clerk/clerk-react';
import { AlertCircle, Clock, Megaphone, Send, Timer, TrendingUp, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { useVoting } from '../features/voting/application/useVoting';
import { Election } from '../features/voting/domain/voting.types';
import { useApiClient } from '../api/client';

export default function DashboardPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const api = useApiClient();
  const { useElectionsList, useRegistrationStatus, useFeed, useRegisterVoter } = useVoting();

  const { data: elections, isLoading } = useElectionsList();
  const { data: activeElections, isLoading: activeLoading } = useElectionsList('ACTIVE');
  const { data: upcomingElections, isLoading: upcomingLoading } = useElectionsList('UPCOMING');
  const { data: pastElections, isLoading: pastLoading } = useElectionsList('PAST');
  const { data: isRegistered, isLoading: isRegLoading } = useRegistrationStatus();
  const { data: feed } = useFeed();
  const registerVoter = useRegisterVoter();
  const { usePostFeed, useSetReminder } = useVoting();
  const postFeed = usePostFeed();
  const setReminderMutation = useSetReminder();

  const [feedInput, setFeedInput] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  // Ensure elections is an array
  const electionsArray = Array.isArray(elections) ? elections : [];
  const activeElectionsArray = Array.isArray(activeElections) ? activeElections : [];
  const upcomingElectionsArray = Array.isArray(upcomingElections) ? upcomingElections : [];
  const pastElectionsArray = Array.isArray(pastElections) ? pastElections : [];

  // Get current elections based on active tab
  const getCurrentElections = () => {
    switch (activeTab) {
      case 'active':
        return activeElectionsArray;
      case 'upcoming':
        return upcomingElectionsArray;
      case 'past':
        return pastElectionsArray;
      default:
        return electionsArray;
    }
  };

  const getCurrentLoading = () => {
    switch (activeTab) {
      case 'active':
        return activeLoading;
      case 'upcoming':
        return upcomingLoading;
      case 'past':
        return pastLoading;
      default:
        return isLoading;
    }
  };

  const currentElections = getCurrentElections();
  const currentLoading = getCurrentLoading();

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedInput.trim() || !user) return;

    postFeed.mutate(
      {
        content: feedInput,
        authorName: user.fullName || undefined,
        authorImageUrl: user.imageUrl || undefined,
      },
      {
        onSuccess: () => setFeedInput(''),
      }
    );
  };

  // Find closing soon elections (less than 2 hours)
  const isClosingSoon = (endTime?: string) => {
    if (!endTime) return false;
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diffHours = (end - now) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 2;
  };

  const closingSoonElections = electionsArray.filter(
    e => e.status === 'ACTIVE' && isClosingSoon(e.endTime)
  );

  const handleOnboarding = () => {
    registerVoter.mutate({
      studentId: `STU-${Math.floor(Math.random() * 10000)}`,
      faculty: 'Undeclared',
      yearOfStudy: 1,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Registration Banner */}
      {isSignedIn && !isRegLoading && !isRegistered && (
        <div className="glass-panel p-6 border-[#fbbf24]/30 bg-[#fbbf24]/5 flex items-start gap-4 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
          <div className="mt-1 text-[#fbbf24] animate-pulse">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-[#fbbf24] font-bold text-lg mb-1 tracking-tight">
              Voter Registration Required
            </h3>
            <p className="text-white/60 text-sm mb-4">
              You are not registered in the VoterRegistrations registry. Complete onboarding to
              participate in elections.
            </p>
            <button
              onClick={handleOnboarding}
              disabled={registerVoter.isPending}
              className="bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-[#000000] rounded-lg px-6 py-2 text-sm font-bold uppercase tracking-widest transition-transform hover:scale-105 shadow-[0_0_15px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registerVoter.isPending ? 'Registering...' : 'Begin Onboarding'}
            </button>
          </div>
        </div>
      )}

      {/* Emergency Priority Banner - Last Call */}
      {isSignedIn && closingSoonElections.length > 0 && (
        <div className="glass-panel p-6 border-red-500/30 bg-red-500/10 flex items-start gap-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          <div className="mt-1 text-red-400 p-2 bg-red-500/20 rounded-full animate-pulse-glow">
            <Timer size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-red-500 text-[#000000] text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                Priority Alert
              </span>
              <h3 className="text-red-400 font-bold text-lg tracking-tight">
                Elections Closing Soon!
              </h3>
            </div>
            <p className="text-white/70 text-sm mb-3">
              You have {closingSoonElections.length} active election(s) closing in less than 2
              hours. Submit your vote before the ledger locks.
            </p>
            <div className="flex flex-wrap gap-2">
              {closingSoonElections.map(el => (
                <Link
                  key={el.id}
                  to={`/vote/${el.id}`}
                  className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 rounded px-4 py-1.5 text-xs font-bold transition"
                >
                  {el.title} <TrendingUp size={12} className="inline ml-1" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Elections Area */}
        <div className="xl:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Elections</h2>
            <span className="bg-white/5 text-white/50 text-xs px-3 py-1 rounded-full uppercase tracking-widest font-bold font-mono border border-white/10">
              {currentElections.length} TOTAL
            </span>
          </div>

          {/* Election Status Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All Elections', count: electionsArray.length },
              { key: 'active', label: 'Live', count: activeElectionsArray.length },
              { key: 'upcoming', label: 'Upcoming', count: upcomingElectionsArray.length },
              { key: 'past', label: 'Past', count: pastElectionsArray.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {currentLoading ? (
            <div className="grid md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-56 glass-panel animate-pulse bg-white/5"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentElections.map(election => (
                <ElectionCard key={election.id} election={election} />
              ))}
              {currentElections.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-center text-white/40 glass-panel">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle size={24} />
                  </div>
                  No elections found in this category.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Civic Buzz Feed Area */}
        <div className="xl:col-span-1 space-y-6">
          <h2 className="text-2xl font-bold tracking-tight mb-4 flex items-center gap-2">
            <span className="text-[#22d3ee] animate-pulse">
              <Megaphone size={20} />
            </span>{' '}
            Civic Buzz
          </h2>
          <div className="glass-panel p-0 h-[600px] flex flex-col relative overflow-hidden">
            {/* Feed Header */}
            <div className="p-4 border-b border-white/5 bg-white/5 shrink-0 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-[#22d3ee]">
                Live Feed
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3ee] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22d3ee]"></span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {isSignedIn && (
                <form
                  onSubmit={handlePostSubmit}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-3 mb-4 shrink-0 transition-colors focus-within:border-[#22d3ee]/50 focus-within:bg-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#22d3ee] to-[#34d399] flex items-center justify-center border border-white/10 shrink-0 overflow-hidden">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={14} className="text-[#000000]" />
                    )}
                  </div>
                  <div className="flex-1 flex flex-col">
                    <textarea
                      value={feedInput}
                      onChange={e => setFeedInput(e.target.value)}
                      placeholder="Share your thoughts... supports **markdown**"
                      className="bg-transparent border-none focus:ring-0 text-sm text-white resize-none placeholder:text-white/30 h-16"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-white/30 font-mono">
                        Use **text** for bold
                      </span>
                      <button
                        type="submit"
                        disabled={!feedInput.trim() || postFeed.isPending}
                        className="bg-[#22d3ee]/20 text-[#22d3ee] hover:bg-[#22d3ee]/30 transition-colors rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        {postFeed.isPending ? (
                          <Timer size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}{' '}
                        Post
                      </button>
                    </div>
                  </div>
                </form>
              )}
              {feed?.length === 0 ? (
                <div className="text-center text-white/30 text-sm mt-10">
                  No recent activity. Be the first to vote!
                </div>
              ) : (
                feed?.map(post => {
                  const isCurrentUser = post.authorId === user?.id;
                  const authorName =
                    post.authorName ||
                    (isCurrentUser ? user?.fullName || 'You' : 'Anonymous Voter');
                  const authorImage =
                    post.authorImageUrl || (isCurrentUser ? user?.imageUrl : null);

                  return (
                    <div
                      key={post.id}
                      className="bg-black/30 border border-white/5 rounded-xl p-4 slide-in-from-right-4 animate-in duration-300"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {authorImage ? (
                          <img
                            src={authorImage}
                            alt={authorName}
                            className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A78BFA] to-[#34D399] flex items-center justify-center border border-white/10 shrink-0">
                            <User size={14} className="text-[#000000]" />
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-bold text-white/80">{authorName}</div>
                          <div className="text-[10px] text-white/40 font-mono">
                            {new Date(post.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-white/90 leading-relaxed font-medium prose prose-invert prose-emerald prose-sm max-w-none">
                        <Markdown>{post.content}</Markdown>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-white/5 shrink-0 bg-gradient-to-b from-transparent to-black/50 absolute bottom-0 left-0 right-0 pointer-events-none h-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElectionCard({ election }: { election: Election; key?: React.Key }) {
  const isLive = election.status === 'ACTIVE';

  // Fallback image if election.imageUrl is missing
  const fallbackImage = "https://images.unsplash.com/photo-1560523160-754a9e25c68f?q=80&w=800&auto=format&fit=crop";

  // Calculate time remaining for live elections
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (!isLive || !election.endTime) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(election.endTime!).getTime();
      const distance = end - now;

      if (distance < 0) {
        setIsClosed(true);
        setTimeLeft(null);
        return true; // Stop interval
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
      return false;
    };

    const isDone = calculateTimeLeft();
    if (isDone) return;

    const interval = setInterval(() => {
      const done = calculateTimeLeft();
      if (done) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive, election.endTime]);

  const { useSetReminder } = useVoting();
  const setReminderMutation = useSetReminder();
  const [reminderSet, setReminderSet] = useState(false);

  const handleToggleReminder = () => {
    const newState = !reminderSet;
    setReminderSet(newState);
    setReminderMutation.mutate(
      { electionId: election.id, set: newState },
      {
        onError: () => {
          setReminderSet(!newState);
        },
      }
    );
  };

  return (
    <div
      className={`glass-panel p-0 flex flex-col justify-between transition-all group overflow-hidden ${isLive ? 'border-[#34d399]/20 hover:border-[#34d399]/40 hover:bg-white/[0.04]' : 'hover:bg-white/[0.04]'}`}
    >
      <Link to={`/election/${election.id}`} className="block flex-1">
        {/* Banner Image */}
        <div className="h-32 w-full overflow-hidden relative">
           <img 
            src={election.coverImage || election.imageUrl || fallbackImage} 
            alt={election.title} 
            className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 opacity-60"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] to-transparent"></div>
           
           <div className="absolute top-4 left-4 flex gap-2">
             <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-black/60 backdrop-blur-md px-3 py-1 rounded-md border border-white/10 text-white/80">
               {election.category}
             </span>
           </div>

           {isLive && (
            <div className="absolute top-4 right-4">
              <span className="relative flex items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34d399] opacity-30"></span>
                <span className="text-[#34d399] text-[10px] px-2 py-0.5 bg-[#34d399]/20 backdrop-blur-md rounded border border-[#34d399]/30 font-bold uppercase relative z-10 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                  Live
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="p-6 pt-2 pb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-lg leading-tight pr-4 transition-colors group-hover:text-[#22d3ee]">
              {election.title}
            </h3>
            {!isLive && election.status === 'UPCOMING' && (
              <span className="text-[#fbbf24] text-[10px] px-2 py-0.5 bg-[#fbbf24]/10 rounded font-bold uppercase shrink-0">
                Pending
              </span>
            )}
            {!isLive && election.status === 'PAST' && (
              <span className="text-white/40 text-[10px] px-2 py-0.5 bg-white/5 rounded font-bold uppercase shrink-0">
                Closed
              </span>
            )}
          </div>

          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-4">
            {election.description}
          </p>

          <div className="space-y-3">
            {/* Timeline Info */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/30 uppercase tracking-widest border-t border-white/5 pt-4">
               <div className="flex flex-col gap-1">
                 <span>Starts</span>
                 <span className="text-white/60">{election.startTime ? new Date(election.startTime).toLocaleDateString() : 'N/A'}</span>
               </div>
               <div className="w-[1px] h-6 bg-white/5"></div>
               <div className="flex flex-col gap-1">
                 <span>Ends</span>
                 <span className="text-white/60">{election.endTime ? new Date(election.endTime).toLocaleDateString() : 'N/A'}</span>
               </div>
            </div>

            {isLive && timeLeft && !isClosed && (
              <div className="flex items-center gap-2 text-xs font-mono bg-black/60 border border-white/5 w-fit px-3 py-1.5 rounded flex items-center shadow-inner mt-2">
                <Clock
                  size={12}
                  className={
                    timeLeft.days === 0 && timeLeft.hours < 2
                      ? 'text-red-400 animate-pulse'
                      : 'text-[#34d399]'
                  }
                />
                <div className="flex gap-1 text-white tracking-widest font-black">
                  <span>{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-white/30">:</span>
                  <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-white/30">:</span>
                  <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-white/30">:</span>
                  <span
                    className={
                      timeLeft.days === 0 && timeLeft.hours < 2 ? 'text-red-400' : 'text-[#22d3ee]'
                    }
                  >
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}
            {isClosed && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-mono bg-red-400/10 border border-red-400/20 w-fit px-2 py-1 rounded mt-2 uppercase font-bold tracking-widest">
                Closed
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="flex gap-3 px-6 pb-6 mt-auto relative z-10 w-full">
        {isLive ? (
          <>
            <Link
              to={`/vote/${election.id}`}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#34d399] to-[#22d3ee] text-[#000000] font-black uppercase tracking-widest text-xs flex items-center justify-center shadow-[0_10px_30px_rgba(52,211,153,0.2)] hover:opacity-90 transition transform hover:scale-[1.02]"
            >
              Vote Now
            </Link>
            <Link
              to={`/live/${election.id}`}
              className="w-12 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors flex items-center justify-center shrink-0"
              title="Live Tracker"
            >
              <TrendingUp size={16} />
            </Link>
          </>
        ) : election.status === 'PAST' ? (
          <Link
            to={`/live/${election.id}`}
            className="w-full py-3 bg-white/5 hover:bg-white/10 transition border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center text-[#a78bfa]"
          >
            View Results
          </Link>
        ) : (
          <button
            onClick={handleToggleReminder}
            disabled={setReminderMutation.isPending}
            className={`w-full py-3 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${reminderSet ? 'bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/30' : 'bg-white/5 text-white/80 hover:bg-white/10'} ${setReminderMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {setReminderMutation.isPending
              ? 'Setting...'
              : reminderSet
                ? 'Reminder Set ✅'
                : 'Set Reminder'}
          </button>
        )}
      </div>
    </div>
  );
}
