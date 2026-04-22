import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ChatMessage } from './chat.types';

export function useLiveChat(electionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'connecting' | 'joined' | 'closed' | 'error'>('connecting');
  const [error, setError] = useState<string | null>(null);

  // We use a ref to track messages so our subscription callback always has the latest
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Initial fetch
  useEffect(() => {
    const fetchInitialMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('election_id', electionId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        
        // Reverse so the oldest of the 50 is first, and newest is last based on array order
        const initialMessages = data ? data.reverse() : [];
        setMessages(initialMessages);
      } catch (err: any) {
        // Fallback for missing/stubbed variables without crashing the app loop
        console.warn('Initial chat fetch failed (Supabase not fully configured):', err.message);
        setStatus('error');
        setError(err.message);
      }
    };

    fetchInitialMessages();
  }, [electionId]);

  // Real-time subscription
  useEffect(() => {
    // Determine the channel scope
    const channelName = `chat_messages:election_id=eq.${electionId}`;
    
    const channel = supabase.channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `election_id=eq.${electionId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          // Deduplication: Ensure we don't insert a message we optimisticly added
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe((subscribeStatus, err) => {
        if (subscribeStatus === 'SUBSCRIBED') {
          setStatus('joined');
          setError(null);
        } else if (subscribeStatus === 'TIMED_OUT' || subscribeStatus === 'CHANNEL_ERROR') {
          setStatus('error');
          setError('Lost connection to chat server.');
        } else if (subscribeStatus === 'CLOSED') {
          setStatus('closed');
        }
      });

    return () => {
      // Cleanup: remove the channel gracefully to prevent memory leaks
      supabase.removeChannel(channel);
    };
  }, [electionId]);

  // Expose a helper to add an optimistic UI message locally
  const addOptimisticMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      // Prevent duplicates just in case
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return { messages, status, error, addOptimisticMessage };
}
