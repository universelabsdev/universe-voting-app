import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLiveChat } from './useLiveChat';
import { ChatMessage } from './chat.types';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Send, AlertCircle, ArrowDown, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';
import { format } from 'date-fns';

// Helper to generate a deterministic color based on user ID
const getUserColor = (userId: string) => {
  const colors = [
    'text-red-400', 'text-blue-400', 'text-green-400', 
    'text-yellow-400', 'text-purple-400', 'text-pink-400', 
    'text-indigo-400', 'text-cyan-400', 'text-orange-400'
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function LiveChat({ electionId }: { electionId: string }) {
  const { messages, status, addOptimisticMessage } = useLiveChat(electionId);
  const { user } = useUser();
  const { getToken } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Auto-scroll management
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Check if user is scrolled to bottom
  const checkScroll = () => {
    if (!scrollRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Threshold of 100px to be considered "at bottom"
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setIsAtBottom(isBottom);
    if (isBottom) {
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  // Effect to handle autoscroll when new messages arrive
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    } else if (!isAtBottom && messages.length > 0) {
      setShowScrollButton(true);
    }
  }, [messages, isAtBottom]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || isSending) return;

    const content = inputValue.trim();
    setIsSending(true);
    setInputValue('');

    const tempId = crypto.randomUUID();

    // 1. Optimistic Update
    const optimisticMsg: ChatMessage = {
      id: tempId,
      election_id: electionId,
      user_id: user.id,
      content,
      created_at: new Date().toISOString(),
      author_name: user.fullName || user.username || 'Anonymous',
      author_image_url: user.imageUrl,
    };
    
    addOptimisticMessage(optimisticMsg);
    
    // Ensure we scroll to bottom for our own message
    setTimeout(scrollToBottom, 50);

    // 2. Perform DB Insertion with Clerk Auth
    try {
      // Get a Supabase JWT from Clerk (requires Supabase template in Clerk)
      // Fallback to anon if template is not configured
      let token;
      try {
        token = await getToken({ template: 'supabase' });
      } catch (err) {
        console.warn("Clerk Supabase template not found, using default session");
      }

      if (token) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        });
      }

      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          id: tempId,
          election_id: electionId,
          user_id: user.id,
          content,
          author_name: user.fullName || user.username || 'Anonymous',
          author_image_url: user.imageUrl,
        }]);

      if (error) {
        console.error("Error inserting chat message:", error);
      }
    } catch (err) {
      console.error("Chat insertion failed:", err);
    } finally {
      // Throttle slightly
      setTimeout(() => setIsSending(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-[550px] glass-panel border border-white/10 relative overflow-hidden bg-black/40 shadow-2xl rounded-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/5 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#34d399]/10 flex items-center justify-center border border-[#34d399]/20">
            <Zap size={16} className="text-[#34d399] fill-[#34d399]/20" />
          </div>
          <div>
            <h3 className="font-black text-xs tracking-[0.2em] uppercase text-white/90">
              Live Discussion
            </h3>
            <p className="text-[9px] text-white/40 font-mono tracking-tighter uppercase">
              Real-time Peer-to-Peer Channel
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-black/40 rounded-full border border-white/5">
          <span className={clsx(
            "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]",
            status === 'joined' ? 'bg-[#34d399] animate-pulse' : 
            status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          )}></span>
          <span className="text-[10px] font-mono tracking-widest uppercase text-white/60">
            {status}
          </span>
        </div>
      </div>

      {/* Message List */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.03)_0%,transparent_100%)]"
      >
         {messages.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full space-y-3 text-white/20 animate-pulse">
             <AlertCircle size={32} strokeWidth={1} />
             <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest">Channel Empty</p>
                <p className="text-[10px] opacity-50 mt-1">Be the first to speak in this election.</p>
             </div>
           </div>
         ) : (
           messages.map((ms) => {
             const isMe = ms.user_id === user?.id;
             const userColor = isMe ? 'text-[#34d399]' : getUserColor(ms.user_id);
             
             return (
               <div key={ms.id} className="group animate-in fade-in slide-in-from-bottom-1 duration-300">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      {ms.author_image_url ? (
                        <img 
                          src={ms.author_image_url} 
                          alt="" 
                          className="w-5 h-5 rounded-md object-cover border border-white/10" 
                        />
                      ) : (
                         <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/30">
                            {ms.author_name?.charAt(0) || '?'}
                         </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={clsx("text-[11px] font-black tracking-wide truncate", userColor)}>
                          {ms.author_name || 'Anonymous'}
                        </span>
                        <span className="text-[9px] text-white/20 font-mono shrink-0">
                          {format(new Date(ms.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <div className="text-sm text-white/80 leading-relaxed break-words font-medium selection:bg-[#22d3ee]/30">
                        {ms.content}
                      </div>
                    </div>
                  </div>
               </div>
             );
           })
         )}
      </div>

      {/* Auto-Scroll Snapper */}
      {showScrollButton && (
        <button 
          onClick={scrollToBottom}
          className="absolute bottom-[85px] left-1/2 -translate-x-1/2 bg-[#22d3ee] text-[#000000] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all hover:scale-105 active:scale-95 z-20"
        >
          <ArrowDown size={14} /> New Messages
        </button>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-black/60 backdrop-blur-xl">
        {!user ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
              Please sign in to participate
            </p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="relative group/form">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#34d399]/0 via-[#22d3ee]/0 to-[#34d399]/0 group-focus-within/form:from-[#34d399]/20 group-focus-within/form:via-[#22d3ee]/20 group-focus-within/form:to-[#34d399]/20 rounded-xl blur transition-all duration-500"></div>
            <div className="relative flex bg-black/40 border border-white/10 rounded-xl focus-within:border-[#34d399]/50 transition-all overflow-hidden">
              <input 
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-white placeholder-white/20 font-medium"
                placeholder="Message the channel..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isSending}
                maxLength={200}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isSending}
                className="px-4 text-[#34d399] hover:text-white transition-colors disabled:opacity-20 disabled:grayscale relative group/btn"
              >
                 {isSending ? (
                   <div className="w-4 h-4 rounded-full border-2 border-[#34d399] border-t-transparent animate-spin"></div>
                 ) : (
                   <>
                    <div className="absolute inset-0 bg-[#34d399]/0 group-hover/btn:bg-[#34d399]/10 transition-colors"></div>
                    <Send size={18} className="relative z-10" />
                   </>
                 )}
              </button>
            </div>
            <div className="mt-2 flex justify-between items-center px-1">
              <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                {inputValue.length}/200
              </span>
              <span className="text-[9px] text-white/20 font-mono uppercase tracking-widest">
                Press Enter to Send
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
