"use client";

import { useCallback, useRef } from "react";

interface UseAutoScanProps {
  refetch: () => void | Promise<unknown>;
  delay?: number;
}

/**
 * Debounced auto-scan hook
 * Prevents multiple simultaneous scans
 * Loading state is handled by the hook that calls refetch (e.g., useApprovalsAlchemy)
 */
export function useAutoScan({ refetch, delay = 1000 }: UseAutoScanProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningRef = useRef(false);

  const triggerAutoScan = useCallback(async () => {
    // Clear any pending scans
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Prevent overlapping scans
    if (isScanningRef.current) {
      return;
    }

    // Schedule scan after delay
    timeoutRef.current = setTimeout(async () => {
      try {
        isScanningRef.current = true;
        await refetch();
      } catch (error) {
        // Error handled by the hook that calls refetch
      } finally {
        isScanningRef.current = false;
      }
    }, delay);
  }, [refetch, delay]);

  return { triggerAutoScan };
}

