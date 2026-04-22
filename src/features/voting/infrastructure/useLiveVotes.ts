import { useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase";

export const useLiveVotesSubscription = (electionId: string, onVoteReceived: () => void) => {
  useEffect(() => {
    if (!supabase || !import.meta.env.VITE_SUPABASE_URL) return;

    const channel: RealtimeChannel = supabase
      .channel(`election_${electionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Votes", // As requested: "table 'Votes'"
          filter: `electionId=eq.${electionId}`
        },
        () => {
          onVoteReceived();
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [electionId, onVoteReceived]);
};
