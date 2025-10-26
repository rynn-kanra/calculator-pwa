let macroChannel: MessageChannel;
let macroPromise: Promise<void> | undefined = undefined;
let macroPromiseResolve: (() => void) | undefined = undefined;
function yieldMacro() {
    if (!macroChannel) {
        macroChannel = new MessageChannel();
        macroChannel.port1.onmessage = () => {
            const resolve = macroPromiseResolve;
            macroPromise = undefined;
            resolve?.();
        };
    }
    if (!macroPromise) {
        macroPromise = new Promise<void>((r: () => void) => {
            macroPromiseResolve = r;
            macroChannel.port2.postMessage(0);
        });
    }
    return macroPromise;
}
let microPromise = Promise.resolve();
type CheckpointOption = {
    microMs: number;
    macroMs: number;
    abort?: AbortSignal;
}

export type CoopYielder = {
    /**
     * Resets the internal timers and iteration counters of the cooperative yielder.
     * 
     * Use this if you want to restart timing and estimation (for example,
     * when beginning a new batch of work). It clears the micro/macro timers,
     * iteration counters, and yield estimates.
     */
    reset(): void;
    
    /**
     * Checks whether it is time to yield based on elapsed time and iteration estimates.
     * 
     * Call this periodically inside a long-running loop. If it returns `true`,
     * you should `await yielder.yield` to allow the event loop to continue.
     * 
     * @param {number} [iter=1] - Number of iterations completed since the last check.
     * @returns {boolean | undefined} 
     * - Returns `true` if a yield is scheduled (you should await `yielder.yield`).
     * - Returns `false` if no yield is needed yet.
     * @throws {Error} If the associated AbortSignal is aborted.
     */
    check(iter?: number): boolean;
    
    /**
     * A promise that resolves after a cooperative yield completes.
     * 
     * This property is assigned whenever a yield is scheduled by {@link check}.
     * 
     * - If a **microtask** yield is scheduled, it resolves on the next tick (using `Promise.resolve()`).
     * - If a **macrotask** yield is scheduled, it resolves on the next macrotask (scheduled via `MessageChannel`).
     * 
     * @type {Promise<void> | undefined}
     * 
     * @example
     * ```js
     * yielder.check() && await yielder.yield; // resumes after yielding
     * ```
     */
    yield?: Promise<void>;
}

/**
 * Creates a cooperative yielder that helps prevent long-running loops from blocking
 * the event loop by yielding control periodically.
 * 
 * The yielder estimates iteration speed and decides when to yield using microtasks
 * (via `Promise.resolve()`) or macrotasks (via `MessageChannel`).
 * 
 * Example:
 * ```js
 * const yielder = createCoopYield();
 * 
 * for (let i = 0; i < bigArray.length; i++) {
 *   // ... heavy work ...
 *   yielder.check() && await yielder.yield;
 * }
 * ```
 * 
 * @param {CheckpointOption} [options]
 * @param {number} [options.microMs=8] - Target duration (ms) before scheduling a microtask yield.
 * @param {number} [options.macroMs=50] - Target duration (ms) before scheduling a macrotask yield.
 * @param {AbortSignal} [options.abort] - Optional signal to cancel execution early.
 * @returns {CoopYielder} A cooperative yielder object that can be used in loops to yield periodically.
 */
export function createCoopYield({ microMs, macroMs, abort }: CheckpointOption = { microMs: 8, macroMs: 50 }): CoopYielder {
    let microTime = Date.now();
    let macroTime = microTime;
    let iterCount = 0;
    let lastIterCount = 0;
    let estimatedIterPerMs = 1;
    let estimatedIterTillYield: number | undefined;

    function updateEstimate(microElapsed: number, macroElapsed: number) {
        const elapsed = microElapsed > 0 ? microElapsed : 0.01;
        const alpha = estimatedIterTillYield ? 1 : 0.75;
        const estimate = (alpha * lastIterCount / elapsed) + (1 - alpha) * estimatedIterPerMs;
        estimatedIterPerMs = Math.floor(estimatedIterTillYield ? estimate : Math.min(estimate, estimatedIterPerMs * 2));

        const remaining = Math.min(microMs > microElapsed ? microMs - microElapsed : microMs, macroMs > macroElapsed ? macroMs - macroElapsed : macroMs);
        estimatedIterTillYield = Math.max(remaining * estimatedIterPerMs, 1);
        iterCount = 0;
    }

    const coopYielder: CoopYielder = {
        reset: function () {
            macroTime = microTime = Date.now();
            lastIterCount = iterCount = 0;
            estimatedIterTillYield = undefined;
        },
        check: function (iter = 1) {
            if (abort?.aborted) {
                throw abort.reason ?? new Error("aborted");
            }

            iterCount += iter;
            if (!estimatedIterTillYield) {
                const microElapsed = Date.now() - microTime;
                if (microElapsed < 1) {
                    return false;
                }
            }
            else if (iterCount < estimatedIterTillYield) {
                return false;
            }

            lastIterCount += iterCount;
            const now = Date.now();
            const macroElapsed = now - macroTime;
            const microElapsed = now - microTime;
            updateEstimate(microElapsed, macroElapsed);
            if (macroElapsed >= macroMs) {
                // schedule macrotask
                coopYielder.yield = yieldMacro().then(() => {
                    macroTime = microTime = Date.now();
                    lastIterCount = iterCount = 0;
                });
                return true;
            }
            if (microElapsed >= microMs) {
                // schedule microtask
                coopYielder.yield = microPromise.then(() => {
                    microTime = Date.now();
                    lastIterCount = iterCount = 0;
                });
                return true;
            }

            return false;
        },
        yield: undefined
    };

    return coopYielder;
}
