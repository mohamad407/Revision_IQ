export default function SocialAuthRow({ onGoogleClick, loading }) {
  return (
    <div>
      <button
        type="button"
        onClick={onGoogleClick}
        disabled={loading}
        className="btn-secondary"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div
          className="group relative flex cursor-not-allowed items-center justify-center gap-2 rounded-sm border-2 border-paper-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-faint opacity-60"
          title="Coming soon"
        >
          <AppleIcon />
          Apple
          <Tooltip text="Coming soon" />
        </div>
        <div
          className="group relative flex cursor-not-allowed items-center justify-center gap-2 rounded-sm border-2 border-paper-line bg-paper px-4 py-2.5 text-sm font-medium text-ink-faint opacity-60"
          title="Coming soon"
        >
          <MicrosoftIcon />
          Microsoft
          <Tooltip text="Coming soon" />
        </div>
      </div>
    </div>
  );
}

function Tooltip({ text }) {
  return (
    <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-ink px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-paper opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      {text}
    </span>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.474 2.19-1.15 2.96-.766.85-2.02 1.5-3.03 1.42-.14-1.13.417-2.29 1.14-3.02.75-.79 2.02-1.38 3.04-1.36Zm2.85 17.05c-.44 1.02-.65 1.48-1.22 2.38-.79 1.25-1.9 2.81-3.28 2.82-1.22.02-1.54-.8-3.2-.79-1.66.01-2.02.8-3.24.78-1.38-.02-2.43-1.42-3.22-2.67-2.21-3.5-2.44-7.6-1.08-9.79.97-1.55 2.5-2.46 3.93-2.46 1.46 0 2.38.8 3.59.8 1.17 0 1.88-.8 3.57-.8 1.28 0 2.63.7 3.6 1.9-3.17 1.74-2.66 6.28.55 7.83Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}
