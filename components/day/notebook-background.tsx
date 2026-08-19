export function NotebookBackground() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full text-secondary"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern
          id="notebook-doodles"
          width="170"
          height="170"
          patternUnits="userSpaceOnUse"
        >
          <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4">
            {/* wavy line */}
            <path d="M6 34 Q18 20 30 34 T54 34" />
            {/* small heart */}
            <path
              d="M120 24 C120 20 124 20 125 23 C126 20 130 20 130 24 C130 28 125 32 125 32 C125 32 120 28 120 24 Z"
              fill="currentColor"
              stroke="none"
              opacity="0.55"
            />
            {/* sparkle */}
            <path
              d="M40 100 L41.3 96.3 L45 95 L41.3 93.7 L40 90 L38.7 93.7 L35 95 L38.7 96.3 Z"
              fill="currentColor"
              stroke="none"
              opacity="0.55"
            />
            {/* second wavy line */}
            <path d="M95 140 Q107 126 119 140 T143 140" />
            {/* small dot cluster */}
            <circle cx="150" cy="60" r="2" fill="currentColor" stroke="none" opacity="0.5" />
            <circle cx="18" cy="130" r="2" fill="currentColor" stroke="none" opacity="0.5" />
            {/* tiny star outline */}
            <path d="M75 55 l3 3 M78 55 l-3 3" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#notebook-doodles)" />
    </svg>
  );
}
