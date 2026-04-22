-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create the chat_messages table
create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  election_id text not null,
  user_id text not null,
  content text not null,
  author_name text,
  author_image_url text,
  created_at timestamptz default now() not null
);

-- Note: We use `text` for user_id because Clerk UUIDs are passed cleanly as strings, 
-- and `text` for election_id as the application's mock IDs are strings (e.g., 'e1').

-- Set up Row Level Security (RLS)
alter table public.chat_messages enable row level security;

-- Policy: Allow anyone to read messages (for public live tracking)
create policy "Anyone can view chat messages"
  on public.chat_messages for select
  using (true);

-- Policy: Allow authenticated users to insert their own messages
-- Note: Requires configuring Supabase JWT template to match the Auth provider (Clerk),
-- or handling identity cleanly on the app-side. If decoding a Clerk JWT, `auth.uid()` might need custom parsing.
-- For a strict setup, replace `auth.uid()::text` with your custom claim path.
create policy "Authenticated users can insert messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    -- Matches the token's subject identifier
    -- Depending on your Clerk JWT template: auth.jwt()->>'sub'
    user_id = auth.jwt()->>'sub'
  );

-- Create an index to quickly filter by election_id and order by created_at
create index idx_chat_messages_election_created on public.chat_messages (election_id, created_at desc);

-- Enable Replication for Realtime Subscriptions
alter publication supabase_realtime add table public.chat_messages;
