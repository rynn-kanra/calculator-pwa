interface IdleStartOption {
  threshold?: number;
  signal?: AbortSignal;
}

interface IdleDetector extends EventTarget {
  start(option?: IdleStartOption): Promise<void>;
  stop(): void;
  userState: "active" | "idle";
  screenState: "locked" | "unlocked";
  onchange: ((this: IdleDetector, ev: Event) => any) | null;
}

declare var IdleDetector: {
  prototype: IdleDetector;
  new(): IdleDetector;
  requestPermission(): Promise<NotificationPermission>;
};
