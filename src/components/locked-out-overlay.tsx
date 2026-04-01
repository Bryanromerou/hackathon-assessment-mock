'use client';

export function LockedOutOverlay() {
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
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-destructive">
          Assessment Locked
        </h2>

        <p className="text-muted-foreground">
          You have received <strong>5 hard warnings</strong>. Your assessment
          has been permanently locked.
        </p>

        <p className="text-sm text-muted-foreground">
          Please contact your administrator for further assistance.
        </p>
      </div>
    </div>
  );
}
