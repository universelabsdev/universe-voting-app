/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AppProviders } from "./providers/AppProviders";
import DashboardPage from "./pages/DashboardPage";
import SecureVotingBoothPage from "./pages/SecureVotingBoothPage";
import LiveTrackerPage from "./pages/LiveTrackerPage";
import HistoryPage from "./pages/HistoryPage";
import ElectionDetailPage from "./pages/ElectionDetailPage";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import { useVoting } from "./features/voting/application/useVoting";
import { Award, Moon, Sun } from "lucide-react";
import { useTheme } from "./providers/ThemeProvider";

const AppLayout = ({ children }: { children: React.ReactNode }) => {
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
            <h1 className="text-xl font-bold tracking-tight text-white hidden sm:block">UNIVERSE <span className="text-white/40 font-light">VOTING</span></h1>
          </Link>
          <nav className="hidden md:flex ml-8 space-x-6 text-white/50 text-xs font-bold uppercase tracking-widest">
            <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/history" className="hover:text-white transition-colors">History</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition border border-white/10">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            {profile && profile.badges?.includes("First Vote") && (
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
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors text-white"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <UserButton appearance={{ elements: { avatarBox: "w-10 h-10 border border-white/20" } }} />
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
    </AppProviders>
  );
}
