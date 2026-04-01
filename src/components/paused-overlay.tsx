'use client';

interface PausedOverlayProps {
  details?: Record<string, unknown>;
}

export function PausedOverlay({ details }: PausedOverlayProps) {
  const apps = (details?.apps as string[]) ?? [];
  const isCompanionClosed = details?.reason === 'companion-app-closed';
  const reason =
    apps.length > 0
      ? apps.join(', ')
      : ((details?.reason as string) ?? 'a prohibited application');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-destructive">
          Assessment Paused
        </h2>
        {isCompanionClosed ? (
          <>
            <p className="text-muted-foreground">
              The <strong>Integrity Companion App</strong> has been closed.
              Please reopen it before proceeding with the assessment.
            </p>
            <p className="text-sm text-muted-foreground">
              The assessment will automatically resume once the Integrity
              Companion App is running and reconnected.
            </p>
          </>
        ) : (
          <>
            <p className="text-muted-foreground">
              Our system detected <strong>{reason}</strong> running on your
              device. Please close {apps.length === 1 ? 'it' : 'them'} and check
              the Integrity Companion App for details.
            </p>
            <p className="text-sm text-muted-foreground">
              The assessment will automatically resume once the issue is
              resolved.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
