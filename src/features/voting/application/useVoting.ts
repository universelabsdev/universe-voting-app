import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SubmitVotePayload, VoterRegistrationPayload } from '../domain/voting.types';
import { VotingApi } from '../infrastructure/voting.api';

export const useVoting = () => {
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();

  const isReady = isLoaded && !!isSignedIn;

  // Registration Status
  const useRegistrationStatus = () =>
    useQuery({
      queryKey: ['voting', 'registration'],
      queryFn: async () => {
        try {
          const data = await VotingApi.checkRegistration();
          return data ?? false;
        } catch {
          return false;
        }
      },
      enabled: isReady,
      retry: false,
    });

  const useRegisterVoter = () =>
    useMutation({
      mutationFn: (payload: VoterRegistrationPayload) => VotingApi.registerVoter(payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['voting', 'registration'] });
        queryClient.invalidateQueries({ queryKey: ['voting', 'profile'] });
      },
    });

  // User Profile
  const useUserProfile = () =>
    useQuery({
      queryKey: ['voting', 'profile'],
      queryFn: async () => {
        try {
          const data = await VotingApi.getUserProfile();
          return data ?? { points: 0, badges: [], isRegistered: false };
        } catch {
          return { points: 0, badges: [], isRegistered: false };
        }
      },
      enabled: isReady,
      retry: false,
    });

  // Elections
  const useElectionsList = (status?: 'ACTIVE' | 'UPCOMING' | 'PAST') =>
    useQuery({
      queryKey: ['voting', 'elections', status || 'ALL'],
      queryFn: async () => {
        console.log('useVoting: Fetching elections with status:', status);
        try {
          const data = await VotingApi.getElections(status?.toLowerCase() as any);
          console.log('useVoting: Received data:', data);
          return Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('useVoting: Error in queryFn:', error);
          return [];
        }
      },
      enabled: isLoaded,
    });

  const useElectionDetails = (id: string) =>
    useQuery({
      queryKey: ['voting', 'election', id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const data = await VotingApi.getElectionDetails(id);
          return data ?? null;
        } catch {
          return null;
        }
      },
      enabled: isLoaded && !!id,
    });

  const useEligibility = (id: string) =>
    useQuery({
      queryKey: ['voting', 'eligibility', id],
      queryFn: async () => {
        if (!id) return { eligible: false, reason: 'INVALID_ELECTION' };
        try {
          const data = await VotingApi.checkEligibility(id);
          return data ?? { eligible: false };
        } catch {
          return { eligible: false };
        }
      },
      enabled: isReady && !!id,
      retry: false,
    });

  // Vote Submission
  const useSubmitVote = () =>
    useMutation({
      mutationFn: (payload: SubmitVotePayload) => VotingApi.submitVote(payload),
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: ['voting', 'eligibility', variables.electionId],
        });
        queryClient.invalidateQueries({ queryKey: ['voting', 'history'] });
        queryClient.invalidateQueries({ queryKey: ['voting', 'profile'] });
      },
    });

  // History
  const useMyHistory = () =>
    useQuery({
      queryKey: ['voting', 'history'],
      queryFn: async () => {
        try {
          const data = await VotingApi.getMyVotes();
          return data ?? [];
        } catch {
          return [];
        }
      },
      enabled: isReady,
    });

  const useVerifyVote = () =>
    useMutation({
      mutationFn: (confirmationCode: string) => VotingApi.verifyVote(confirmationCode),
    });

  // Live Results (Initial Load)
  const useLiveResults = (id: string) =>
    useQuery({
      queryKey: ['voting', 'results', id],
      queryFn: async () => {
        if (!id) return null;
        try {
          const data = await VotingApi.getLiveResults(id);
          return data ?? null;
        } catch {
          return null;
        }
      },
      enabled: isLoaded && !!id,
      refetchInterval: 5000, // Fallback to polling if Supabase Realtime isn't configured
    });

  // Feed
  const useFeed = () =>
    useQuery({
      queryKey: ['voting', 'feed'],
      queryFn: async () => {
        try {
          const data = await VotingApi.getFeed();
          return data ?? [];
        } catch {
          return [];
        }
      },
      enabled: isLoaded,
      refetchInterval: 10000, // Refresh feed periodically
    });

  const usePostFeed = () =>
    useMutation({
      mutationFn: (params: { content: string; authorName?: string; authorImageUrl?: string }) =>
        VotingApi.postFeed(params),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['voting', 'feed'] });
      },
    });

  const useSetReminder = () =>
    useMutation({
      mutationFn: ({ electionId, set }: { electionId: string; set: boolean }) =>
        VotingApi.setReminder(electionId, set),
    });

  const useUpdateCandidateImage = () =>
    useMutation({
      mutationFn: ({
        electionId,
        candidateId,
        imageUrl,
      }: {
        electionId: string;
        candidateId: string;
        imageUrl: string;
      }) => VotingApi.updateCandidateImage(electionId, candidateId, imageUrl),
      onSuccess: (_, { electionId }) => {
        queryClient.invalidateQueries({ queryKey: ['voting', 'elections'] });
        queryClient.invalidateQueries({ queryKey: ['voting', 'electionDetails', electionId] });
      },
    });

  return {
    useRegistrationStatus,
    useRegisterVoter,
    useUserProfile,
    useElectionsList,
    useElectionDetails,
    useUpdateCandidateImage,
    useEligibility,
    useSubmitVote,
    useMyHistory,
    useVerifyVote,
    useLiveResults,
    useFeed,
    usePostFeed,
    useSetReminder,
  };
};
