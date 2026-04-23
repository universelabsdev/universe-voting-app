import React, { ReactNode, useState } from "react";
import { ClerkProvider, SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export function AuthGate({ children }: { children: ReactNode }) {
  const [showSwitchInfo, setShowSwitchInfo] = useState(false);

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="min-h-screen bg-[#0F0F0F] text-[#f8fafc] flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4">
            {showSwitchInfo && (
              <div className="bg-[#1a3a3a] border border-[#34d399]/30 rounded-2xl p-4">
                <p className="text-sm text-[#34d399] mb-3">
                  <strong>Using the wrong Google account?</strong> Try these steps:
                </p>
                <ol className="text-xs text-[#94a3b8] space-y-2 mb-2 list-decimal list-inside">
                  <li>Sign out of Google in your browser</li>
                  <li>Click "Continue with Google" below</li>
                  <li>Sign in with your Cavendish email account</li>
                </ol>
              </div>
            )}

            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  formButtonPrimary: "bg-[#34d399] hover:bg-[#2dd689] text-black",
                  card: "bg-[#1a1a1a] border border-white/10 shadow-2xl",
                  headerTitle: "text-white",
                  headerSubtitle: "text-[#94a3b8]",
                  formFieldLabel: "text-[#94a3b8]",
                  formFieldInput: "bg-[#0F0F0F] border-white/10 text-white",
                  footerActionLink: "text-[#34d399] hover:text-[#2dd689]",
                  identityPreviewEditButton: "text-[#34d399]",
                  dividerLine: "bg-white/10",
                  dividerText: "text-white/30",
                  socialButtonsBlockButton: "border-white/10 bg-white/5 hover:bg-white/10 text-white",
                  socialButtonsBlockButtonText: "text-white",
                },
              }}
            />

            <button
              type="button"
              onClick={() => setShowSwitchInfo(v => !v)}
              className="w-full text-center text-xs text-[#94a3b8] hover:text-[#34d399] py-2 border-t border-white/10 transition-colors"
            >
              {showSwitchInfo ? "Hide" : "Can't sign in with your Cavendish account?"}
            </button>
          </div>
        </div>
      </SignedOut>
    </>
  );
}

export const ClerkWrapper = ({ children }: { children: ReactNode }) => {
  if (!PUBLISHABLE_KEY || PUBLISHABLE_KEY === "pk_test_...") {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-[#f8fafc] flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-[#34d399]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#34d399]/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4 font-sans tracking-tight">Missing Clerk API Key</h1>
          <p className="text-[#94a3b8] mb-6 text-sm leading-relaxed">
            UniVerse Voting uses <strong>Clerk</strong> for secure authentication. Please add your{" "}
            <code className="bg-black/50 px-2 py-1 rounded text-[#22d3ee] border border-white/10">
              VITE_CLERK_PUBLISHABLE_KEY
            </code>{" "}
            to the environment variables to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
};
