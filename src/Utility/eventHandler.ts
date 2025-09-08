import { TargetedEvent } from "preact/compat";

export class EventSubscription<
    TTarget extends EventTarget,
    T extends Event,
    THandler extends ((this: TTarget, event: TargetedEvent<TTarget, T>) => void) = (this: TTarget, event: TargetedEvent<TTarget, T>) => void
> {
    private stopped?: boolean;
    private handler?: EventHandler;
    private subscribers? = new Set<THandler>();
    private iterators? = new Set<{
        queue: TargetedEvent<TTarget, T>[];
        resolve?: () => void;
    }>();

    constructor(
        private target: TTarget,
        private event: string,
        private options?: AddEventListenerOptions | boolean
    ) { }

    async *[Symbol.asyncIterator](): AsyncIterator<TargetedEvent<TTarget, T>> {
        if (this.stopped) {
            return;
        }

        this.init();
        if (!this.iterators) {
            this.iterators = new Set();
        }

        const q = { queue: [] as TargetedEvent<TTarget, T>[], resolve: undefined as (() => void) | undefined };
        this.iterators.add(q);

        try {
            do {
                while (q.queue.length > 0) {
                    yield q.queue.shift()!;
                }

                if (this.stopped) {
                    break;
                }

                await new Promise<void>((res) => {
                    q.resolve = res;
                });
                q.resolve = undefined;
            } while (true);
        }
        finally {
            this.iterators?.delete(q);
            if (!this.iterators?.size && !this.subscribers?.size) {
                this.unsubscribe();
            }
        }
    }
    protected init() {
        if (this.handler) {
            return;
        }

        this.handler = ((event: TargetedEvent<TTarget, T>) => {
            if (this.stopped) return;

            if (this.iterators) {
                for (const q of this.iterators) {
                    q.queue.push(event);
                    q.resolve?.();
                }
            }

            if (this.subscribers) {
                for (const sub of this.subscribers) {
                    try { sub.call(this.target, event); } catch (err) { console.log(err); }
                }
            }
        }) as EventHandler;

        if ((this.options as AddEventListenerOptions)?.signal) {
            const signal = (this.options as AddEventListenerOptions)?.signal;
            signal?.addEventListener("abort", () => {
                this.stop();
            }, { once: true });
        }
        this.target.addEventListener(this.event, this.handler!, this.options);
    }
    public subscribe(handler: THandler, signal?: AbortSignal): void {
        if (this.stopped) {
            return;
        }

        this.init();
        if (!this.subscribers) {
            this.subscribers = new Set();
        }

        this.subscribers.add(handler);
        if (signal) {
            signal.addEventListener("abort", () => {
                this.unsubscribe(handler);
            }, { once: true });
        }
    }
    public unsubscribe(handler?: THandler) {
        if (this.stopped || !this.handler) {
            return;
        }

        if (handler) {
            this.subscribers?.delete(handler);
        }
        else {
            this.subscribers = undefined;
        }

        if (!this.iterators?.size && !this.subscribers?.size) {
            this.stop();
        }
    }
    public stop() {
        if (this.stopped || !this.handler) {
            return;
        }

        this.stopped = true;
        this.target.removeEventListener(this.event, this.handler, this.options);
        if (this.iterators) {
            for (const q of this.iterators) {
                q.resolve?.(); // Wake all iterators to let them exit
            }
        }

        this.subscribers = undefined;
        this.iterators = undefined;
        this.handler = undefined;
        this.options = undefined;
    }
}

export function listen<TTarget extends EventTarget, T extends Event>(
    target: TTarget,
    event: string,
    options?: boolean | AddEventListenerOptions
) {
    return new EventSubscription<TTarget, T>(target, event, options);
}