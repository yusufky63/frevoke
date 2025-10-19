"use client";

interface ScanButtonProps {
  onScan: () => void;
  isScanning: boolean;
  chainName: string;
}

export function ScanButton({ onScan, isScanning, chainName }: ScanButtonProps) {
  return (
    <div className="text-center my-4">
      <button
        onClick={onScan}
        disabled={isScanning}
        className="inline-flex items-center space-x-2 px-6 py-2 shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
      >
        {/* Scan icon */}
        <svg
          className={`w-5 h-5 ${isScanning ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 7V5a2 2 0 012-2h2M21 7V5a2 2 0 00-2-2h-2M3 17v2a2 2 0 002 2h2M21 17v2a2 2 0 01-2 2h-2M8 12h8"
          />
        </svg>
        <span>{isScanning ? "Scanning..." : "Refresh Approvals"}</span>
      </button>
    </div>
  );
}

