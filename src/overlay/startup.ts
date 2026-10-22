export function createStartupQueue(onError: (error: unknown) => void) {
    const pending: Array<() => void> = [];
    let ready = false;
    let draining = false;

    function drain() {
        if (!ready || draining) return;
        draining = true;
        try {
            while (pending.length > 0) {
                const callback = pending.shift();
                if (!callback) continue;
                try {
                    callback();
                } catch (error) {
                    onError(error);
                }
            }
        } finally {
            draining = false;
        }
    }

    return {
        enqueue(callback: () => void) {
            pending.push(callback);
            drain();
        },
        release() {
            ready = true;
            drain();
        },
    };
}
