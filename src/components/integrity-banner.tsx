"use client";

interface IntegrityBannerProps {
  score: number;
  signalCount: number;
}

export function IntegrityBanner({ score, signalCount }: IntegrityBannerProps) {
  const color =
    score > 70
      ? "bg-green-500/10 text-green-600 border-green-500/20"
      : score > 40
        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
        : "bg-red-500/10 text-red-600 border-red-500/20";

  const label =
    score > 70
      ? "Monitoring Active"
      : score > 40
        ? "Suspicious Activity Detected"
        : "Integrity Compromised";

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 text-sm border-b ${color}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${
            score > 70
              ? "bg-green-500"
              : score > 40
                ? "bg-yellow-500"
                : "bg-red-500 animate-pulse"
          }`}
        />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>
          Score: <strong>{score}</strong>
        </span>
        <span>
          Signals: <strong>{signalCount}</strong>
        </span>
      </div>
    </div>
  );
}
