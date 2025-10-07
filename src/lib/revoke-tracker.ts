/**
 * Revoke operation tracking utilities
 * Provides enhanced tracking and logging for revoke operations
 */

export interface RevokeOperation {
  id: string;
  timestamp: number;
  chainId: number;
  approvalCount: number;
  transactionHash?: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error?: string;
}

export class RevokeTracker {
  private static operations: Map<string, RevokeOperation> = new Map();
  private static listeners: Set<(operation: RevokeOperation) => void> = new Set();

  /**
   * Start tracking a revoke operation
   */
  static startTracking(chainId: number, approvalCount: number): string {
    const id = `revoke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const operation: RevokeOperation = {
      id,
      timestamp: Date.now(),
      chainId,
      approvalCount,
      status: 'PENDING'
    };

    this.operations.set(id, operation);
    this.notifyListeners(operation);
    
    return id;
  }

  /**
   * Mark operation as successful
   */
  static markSuccess(operationId: string, transactionHash: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'SUCCESS';
      operation.transactionHash = transactionHash;
      this.operations.set(operationId, operation);
      this.notifyListeners(operation);
    }
  }

  /**
   * Mark operation as failed
   */
  static markFailed(operationId: string, error: string): void {
    const operation = this.operations.get(operationId);
    if (operation) {
      operation.status = 'FAILED';
      operation.error = error;
      this.operations.set(operationId, operation);
      this.notifyListeners(operation);
    }
  }

  /**
   * Get operation by ID
   */
  static getOperation(operationId: string): RevokeOperation | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get all operations
   */
  static getAllOperations(): RevokeOperation[] {
    return Array.from(this.operations.values());
  }

  /**
   * Get recent operations (last 10)
   */
  static getRecentOperations(): RevokeOperation[] {
    return this.getAllOperations()
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }

  /**
   * Subscribe to operation updates
   */
  static subscribe(listener: (operation: RevokeOperation) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners
   */
  private static notifyListeners(operation: RevokeOperation): void {
    this.listeners.forEach(listener => {
      try {
        listener(operation);
      } catch (error) {
        console.error('Error in revoke tracker listener:', error);
      }
    });
  }

  /**
   * Clear old operations (older than 1 hour)
   */
  static clearOldOperations(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [id, operation] of this.operations.entries()) {
      if (operation.timestamp < oneHourAgo) {
        this.operations.delete(id);
      }
    }
  }

  /**
   * Get operation statistics
   */
  static getStats(): {
    total: number;
    successful: number;
    failed: number;
    pending: number;
  } {
    const operations = this.getAllOperations();
    return {
      total: operations.length,
      successful: operations.filter(op => op.status === 'SUCCESS').length,
      failed: operations.filter(op => op.status === 'FAILED').length,
      pending: operations.filter(op => op.status === 'PENDING').length,
    };
  }
}

// Auto-cleanup old operations every 5 minutes
setInterval(() => {
  RevokeTracker.clearOldOperations();
}, 5 * 60 * 1000);
