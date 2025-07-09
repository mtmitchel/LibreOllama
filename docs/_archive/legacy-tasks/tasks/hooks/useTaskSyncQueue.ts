import { useState, useRef, useCallback, useEffect } from "react";
import { useGoogleStore } from "../../../stores/googleStore";

type ToastFn = (variant: 'error', title: string, message: string) => void;

export function useTaskSyncQueue(addToast: ToastFn) {
    const pendingOperations = useRef<any[]>([]);
    const [isSyncing, setIsSyncing] = useState<boolean>(false);
    const workerRef = useRef<Worker | null>(null);
    const toastFnRef = useRef(addToast);

    // Keep the toast function ref updated without causing re-renders
    useEffect(() => {
        toastFnRef.current = addToast;
    }, [addToast]);

    useEffect(() => {
        // Initialize the worker with error handling
        try {
            workerRef.current = new Worker(new URL('../workers/taskSync.worker.ts', import.meta.url), {
                type: 'module',
            });

            // Handle messages from the worker - extract to avoid stale closure
            const messageHandler = (event: MessageEvent<any>) => {
                const { type, payload } = event.data;
                const store = useGoogleStore.getState();

                switch (type) {
                    case 'sync-started':
                        setIsSyncing(true);
                        break;
                    case 'operation-success':
                        console.log(`Task ${payload.taskId} synced successfully (Operation ID: ${payload.operationId}).`);
                        // Remove successful operation from queue
                        pendingOperations.current = pendingOperations.current.filter(op => op.operationId !== payload.operationId);
                        // Only mark as synced if this was the expected operation
                        const syncState = store.taskSyncState.get(payload.taskId);
                        if (syncState && syncState.status === 'pending') {
                            // Update the task's list mapping
                            if (payload.targetListId) {
                                store.taskIdToListId.set(payload.taskId, payload.targetListId);
                            }
                            // Mark as synced in store (don't trigger another move operation)
                            store.optimisticUpdateTask('', payload.taskId, { unsynced: false });
                            // Update sync state
                            store.taskSyncState.set(payload.taskId, {
                                ...syncState,
                                status: 'synced',
                                operationId: payload.operationId
                            });
                        }
                        break;
                    case 'operation-failure':
                        console.error(`Failed to sync task ${payload.taskId}:`, payload.error);
                        // Keep failed operation in queue for retry - don't remove it from pendingOperations
                        // Use the stable ref to call the toast function
                        toastFnRef.current('error', 'Sync Failed', `Could not move task "${payload.originalTaskTitle}". Click to retry.`);
                        // Mark sync state as failed but keep operation in queue
                        const failedSyncState = store.taskSyncState.get(payload.taskId);
                        if (failedSyncState) {
                            store.taskSyncState.set(payload.taskId, {
                                ...failedSyncState,
                                status: 'failed',
                                operationId: payload.operationId
                            });
                        }
                        break;
                    case 'sync-finished':
                        // Use functional update to avoid stale closure
                        setIsSyncing(false);
                        // Check if there are remaining operations to process (failed operations)
                        if (pendingOperations.current.length > 0) {
                            // Use requestAnimationFrame for smoother performance
                            requestAnimationFrame(() => {
                                // Call processQueue directly to avoid circular dependency
                                if (!workerRef.current || pendingOperations.current.length === 0) {
                                    return;
                                }
                                const operationsToProcess = [...pendingOperations.current];
                                workerRef.current.postMessage(operationsToProcess);
                            });
                        }
                        break;
                }
            };

            const errorHandler = (error: ErrorEvent) => {
                console.error('Worker error:', error);
                setIsSyncing(false);
                toastFnRef.current('error', 'Sync Error', 'Task synchronization worker encountered an error');
            };

            workerRef.current.onmessage = messageHandler;
            workerRef.current.onerror = errorHandler;

        } catch (error) {
            console.error('Failed to initialize worker:', error);
            // Gracefully handle worker initialization failure
            workerRef.current = null;
            toastFnRef.current('error', 'Sync Unavailable', 'Task synchronization is temporarily unavailable');
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.onmessage = null; // Clear handler to prevent stale closure
                workerRef.current.onerror = null;
                workerRef.current.terminate();
            }
        };
    }, []); // No dependencies needed since we inline the queue processing

    const processQueue = () => {
        if (!workerRef.current || pendingOperations.current.length === 0) {
            return;
        }

        const operationsToProcess = [...pendingOperations.current];
        // Don't clear the queue immediately - wait for worker to process operations
        // The queue will be cleared when operations succeed or fail
        
        // Set syncing state when starting to process
        setIsSyncing(true);
        workerRef.current.postMessage(operationsToProcess);
    };

    return {
        pendingOperations,
        isSyncing,
        processQueue,
    };
} 