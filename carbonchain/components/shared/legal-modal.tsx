"use client";

export type LegalDoc = "terms" | "privacy" | null;

export function LegalLinks({
  onOpen,
  className = "",
}: {
  onOpen: (doc: LegalDoc) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button type="button" onClick={() => onOpen("terms")} className="text-carbon-300 hover:text-brand-400 underline transition-colors">
        Terms &amp; Conditions
      </button>
      <button type="button" onClick={() => onOpen("privacy")} className="text-carbon-300 hover:text-brand-400 underline transition-colors">
        Privacy Policy
      </button>
    </div>
  );
}

const TITLES: Record<Exclude<LegalDoc, null>, string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
};

export function LegalModal({ doc, onClose }: { doc: LegalDoc; onClose: () => void }) {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
      <div className="bg-carbon-850 border border-carbon-750 rounded-3xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-carbon-750 shrink-0">
          <h3 className="text-base font-bold text-white">{TITLES[doc]}</h3>
          <button onClick={onClose} className="text-carbon-300 hover:text-white text-xl leading-none">
            ✕
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto text-sm text-carbon-300 space-y-4 leading-relaxed">
          {doc === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>

        <div className="px-6 py-4 border-t border-carbon-750 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-carbon-750 hover:bg-carbon-700 text-xs font-medium text-slate-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TermsContent() {
  return (
    <>
      <p>
        <strong className="text-white">Last updated:</strong> August 2026
      </p>
      <p>
        CarbonChain is a hackathon prototype demonstrating MRV, carbon-credit registry, provenance, and marketplace
        workflows modeled loosely on India&apos;s emerging Carbon Credit Trading Scheme (CCTS). By creating an
        account or using this application, you acknowledge and agree to the following.
      </p>
      <div>
        <p className="text-white font-semibold mb-1">1. Prototype status</p>
        <p>
          This platform is not an official government registry. It is not affiliated with, endorsed by, or
          connected to the Bureau of Energy Efficiency (BEE), the Ministry of Power, or any official CCTS-compatible
          scheme. Nothing issued, traded, or retired on this platform constitutes a legally recognized carbon
          credit.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">2. Demonstration data</p>
        <p>
          Organizations, plants, emissions figures, and carbon credits shown in seed or demo data are fictional and
          created solely for demonstration purposes.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">3. Account provisioning</p>
        <p>
          Creating an account does not grant automatic access to registry functions. A registry administrator must
          assign a role and organization before an account can perform any action within the platform.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">4. No warranty</p>
        <p>
          This software is provided &quot;as is&quot;, without warranty of any kind, express or implied, for a
          hackathon demonstration. It should not be relied upon for real compliance, financial, or regulatory
          decisions.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">5. Acceptable use</p>
        <p>
          You agree not to misuse this prototype to misrepresent its data as official, to attempt unauthorized
          access to accounts or data outside your assigned organization, or to interfere with the platform&apos;s
          normal operation.
        </p>
      </div>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <p>
        <strong className="text-white">Last updated:</strong> August 2026
      </p>
      <p>This Privacy Policy explains what information CarbonChain collects and how it is used, for this prototype.</p>
      <div>
        <p className="text-white font-semibold mb-1">1. What we collect</p>
        <p>
          Account information you provide directly: email address and password (handled by Supabase Auth, never
          stored in plaintext by this application). Once a registry administrator provisions your account, we also
          store your full name, assigned role, and organization.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">2. What we don&apos;t collect</p>
        <p>
          We do not collect payment information, government identification numbers, or precise device/location
          tracking data. This prototype does not run third-party advertising or analytics trackers.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">3. How data is used</p>
        <p>
          Your account data is used solely to authenticate you and enforce role-based access to registry, MRV,
          verification, marketplace, and audit functions within the platform. Actions you take (uploads, approvals,
          trades, retirements) are recorded in an append-only audit log as part of the platform&apos;s core
          integrity design.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">4. Data storage</p>
        <p>
          Data is stored in a Supabase-hosted PostgreSQL database with row-level security policies restricting
          access by organization and role.
        </p>
      </div>
      <div>
        <p className="text-white font-semibold mb-1">5. Your rights</p>
        <p>
          As this is a demonstration prototype, you may request account deletion at any time by contacting your
          registry administrator.
        </p>
      </div>
    </>
  );
}
