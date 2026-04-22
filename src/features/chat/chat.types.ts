export interface ChatMessage {
  id: string;
  election_id: string;
  user_id: string;
  content: string;
  created_at: string;
  
  // Extended fields for "Twitch-style" display
  author_name?: string;
  author_image_url?: string;
}
