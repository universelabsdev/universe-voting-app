import { SignedIn, SignedOut, UserButton, useClerk } from '@clerk/clerk-react';
import { Award, Moon, Sun } from 'lucide-react';
import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useApiClient } from './api/client';
import { useVoting } from './features/voting/application/useVoting';
import DashboardPage from './pages/DashboardPage';
import ElectionDetailPage from './pages/ElectionDetailPage';
import HistoryPage from './pages/HistoryPage';
import LiveTrackerPage from './pages/LiveTrackerPage';
import SecureVotingBoothPage from './pages/SecureVotingBoothPage';
import { AppProviders } from './providers/AppProviders';
import { AuthGate } from './providers/ClerkWrapper';
import { useTheme } from './providers/ThemeProvider';

const SignInWithAccountSwitch = () => {
  const { openSignIn } = useClerk();
  const [showAccountSwitch, setShowAccountSwitch] = React.useState(false);

  return (
    <>
      {showAccountSwitch && (
        <div className="absolute top-24 right-10 bg-[#1a1a1a] border border-[#34d399]/30 rounded-2xl p-4 w-72 shadow-2xl z-50">
          <p className="text-sm text-[#94a3b8] mb-3">
            If you're trying to sign in with a different Google account:
          </p>
          <ol className="text-xs text-[#94a3b8] space-y-2 mb-4 list-decimal list-inside">
            <li>Click "Sign In" below</li>
            <li>Click your email to select a different account</li>
            <li>Choose your Cavendish email account</li>
            <li>If you don't see it, click "Use another account" and enter your Cavendish email</li>
          </ol>
          <button
            onClick={() => {
              setShowAccountSwitch(false);
              openSignIn();
            }}
            className="w-full px-4 py-2 bg-[#34d399] text-[#0F0F0F] rounded-xl hover:bg-[#2dd689] transition-colors text-sm font-bold"
          >
            Open Sign In
          </button>
          <button
            onClick={() => setShowAccountSwitch(false)}
            className="w-full mt-2 px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      )}

      <button
        onClick={() => setShowAccountSwitch(!showAccountSwitch)}
        className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition border border-white/10"
        title="Click if you need to use a different Google account"
      >
        Sign In
      </button>
    </>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  useApiClient(); // Register auth interceptor once at the top level
  const { useUserProfile } = useVoting();
  const { data: profile } = useUserProfile();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden fixed z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-glow"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-cyan-glow"></div>
      </div>

      <header className="flex items-center justify-between px-6 md:px-10 h-20 relative z-10 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34d399] to-[#22d3ee] flex items-center justify-center font-black text-[#000000] text-xl">
              U
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">
              UNIVERSE <span className="text-white/40 font-light">VOTING</span>
            </h1>
          </Link>
          <nav className="hidden md:flex ml-8 space-x-6 text-white/50 text-xs font-bold uppercase tracking-widest">
            <Link to="/" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/history" className="hover:text-white transition-colors">
              History
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInWithAccountSwitch />
          </SignedOut>
          <SignedIn>
            {profile && profile.badges?.includes('First Vote') && (
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 glass-panel !rounded-full text-xs font-bold text-[#fbbf24] border-[#fbbf24]/20 bg-[#fbbf24]/5">
                <Award size={14} /> VIP VOTER
              </div>
            )}
            {profile !== undefined && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 glass-panel !rounded-full text-xs font-medium">
                <span className="text-[#34d399] font-bold">{profile.points || 0}</span> pts
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 glass-panel !rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#34d399]"></span>
              VERIFIED
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-white"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="group relative">
              <UserButton
                appearance={{ elements: { avatarBox: 'w-10 h-10 border border-white/20' } }}
              />
              <div className="absolute -bottom-16 right-0 hidden group-hover:block bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-[10px] text-[#94a3b8] w-48 z-50">
                <p className="font-bold text-white mb-1">Tip: To switch Google accounts</p>
                <p>
                  Click your avatar above → Sign Out → Click Sign In and select your Cavendish email
                </p>
              </div>
            </div>
          </SignedIn>
        </div>
      </header>

      <main className="flex-1 w-full p-4 md:p-8 relative z-10 max-w-[1400px] mx-auto">
        {children}
      </main>

      <footer className="h-12 shrink-0 border-t border-white/5 flex items-center justify-between px-4 md:px-10 text-[10px] font-mono text-white/30 uppercase tracking-widest relative z-10">
        <div>NODE SYNC: STABLE</div>
        <div className="hidden md:block">VOTER_HASH: SECURE • CLERK: ACTIVE</div>
        <div>SESSION: {new Date().toISOString().split('T')[0]}</div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProviders>
      <AuthGate>
        <AppLayout>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/election/:id" element={<ElectionDetailPage />} />
            <Route path="/vote/:id" element={<SecureVotingBoothPage />} />
            <Route path="/live/:id" element={<LiveTrackerPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </AuthGate>
    </AppProviders>
  );
}
