import { apiClient } from '../../../api/client';
import {
  Election,
  FeedPost,
  SubmitVotePayload,
  SubmitVoteResponse,
  UserProfile,
  VoteReceipt,
  VoterRegistrationPayload,
} from '../domain/voting.types';

export const VotingApi = {
  // Check if voter is registered
  checkRegistration: async (): Promise<boolean> => {
    const { data } = await apiClient.get<{ success: boolean; data: { isRegistered: boolean } }>(
      '/elections/registration'
    );
    return data.data.isRegistered;
  },

  // Register Voter
  registerVoter: async (payload: VoterRegistrationPayload): Promise<void> => {
    await apiClient.post('/elections/register', payload);
  },

  // Get User Profile
  getUserProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<{ success: boolean; data: UserProfile }>(
      '/users/me/profile'
    );
    return data.data;
  },

  // Fetch Elections
  getElections: async (status?: 'ACTIVE' | 'UPCOMING' | 'PAST'): Promise<Election[]> => {
    try {
      const url = `/elections${status ? `?status=${status.toLowerCase()}` : ''}`;
      const response = await apiClient.get<{ 
        success: boolean; 
        data: { elections: Election[]; total: number; page: number; limit: number } 
      }>(url);
      
      const elections = response.data.data.elections.map(el => {
        // Normalise status: server returns CLOSED/COMPLETED, frontend only knows PAST
        const rawStatus = (el.status as string) || '';
        const normalisedStatus =
          rawStatus === 'CLOSED' || rawStatus === 'COMPLETED' ? 'PAST' : rawStatus;

        return {
          ...el,
          status: normalisedStatus as Election['status'],
          // Map server date field names to the frontend field names
          startTime: el.startTime ?? (el as any).startDate,
          endTime: el.endTime ?? (el as any).endDate,
          candidates: el.candidates || (el.positions && el.positions[0]?.candidates) || [],
        };
      });

      return elections;
    } catch (error) {
      console.error('API: Error fetching elections:', error);
      throw error;
    }
  },

  // Get Election Details
  getElectionDetails: async (id: string): Promise<Election> => {
    const { data } = await apiClient.get<{ success: boolean; data: Election }>(`/elections/${id}`);
    const raw = data.data;
    const rawStatus = (raw.status as string) || '';
    const election: Election = {
      ...raw,
      status: (rawStatus === 'CLOSED' || rawStatus === 'COMPLETED' ? 'PAST' : rawStatus) as Election['status'],
      startTime: raw.startTime ?? (raw as any).startDate,
      endTime: raw.endTime ?? (raw as any).endDate,
      candidates:
        raw.candidates?.length
          ? raw.candidates
          : (raw.positions?.[0]?.candidates ?? []),
    };
    return election;
  },

  // Update Candidate Image
  updateCandidateImage: async (
    electionId: string,
    candidateId: string,
    imageUrl: string
  ): Promise<void> => {
    await apiClient.post(`/elections/${electionId}/candidates/${candidateId}/image`, { imageUrl });
  },

  // Set Reminder
  setReminder: async (electionId: string, set: boolean): Promise<boolean> => {
    const { data } = await apiClient.post<{ success: boolean; data: { set: boolean } }>(
      `/elections/${electionId}/reminders`,
      { set }
    );
    return data.data.set;
  },

  // Check Eligibility
  checkEligibility: async (electionId: string): Promise<{ eligible: boolean; reason?: string }> => {
    const { data } = await apiClient.get<{ success: boolean; data: { eligible: boolean; reason?: string } }>(
      `/elections/${electionId}/eligibility`
    );
    return data.data;
  },

  // Submit Vote
  submitVote: async (payload: SubmitVotePayload): Promise<SubmitVoteResponse> => {
    const { data } = await apiClient.post<{
      success: boolean;
      data: {
        confirmationCode: string;
        pointsEarned: number;
        badgeUnlocked: boolean;
        totalPoints: number;
      }
    }>('/elections/vote', payload);
    return data.data;
  },

  // Fetch vote history
  getMyVotes: async (): Promise<VoteReceipt[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: VoteReceipt[] }>('/votes/me');
    return data.data;
  },

  // Real-time live results
  getLiveResults: async (
    electionId: string
  ): Promise<{
    totalVotes: number;
    results: Record<string, number>;
    demographics?: Record<string, number>;
  }> => {
    const { data } = await apiClient.get<{
      success: boolean;
      data: {
        totalVotes: number;
        results: Record<string, number>;
        demographics: Record<string, number>;
      }
    }>(`/elections/${electionId}/results`);
    return data.data;
  },

  // Verify Vote Confirmation Code
  verifyVote: async (confirmationCode: string): Promise<{ valid: boolean; timestamp?: string }> => {
    const { data } = await apiClient.post<{ success: boolean; data: { valid: boolean; timestamp?: string } }>(
      '/votes/verify',
      { confirmationCode }
    );
    return data.data;
  },

  // Get Feed
  getFeed: async (): Promise<FeedPost[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: FeedPost[] }>('/posts/feed');
    return data.data;
  },

  // Post to Feed
  postFeed: async (params: {
    content: string;
    authorName?: string;
    authorImageUrl?: string;
  }): Promise<FeedPost> => {
    const { data } = await apiClient.post<{ success: boolean; data: FeedPost }>('/posts/feed', params);
    return data.data;
  },
};
