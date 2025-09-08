interface NotificationAction {
    action: string;      // Identifier for the action (used in click handler)
    title: string;       // Visible label
    icon?: string;       // Icon URL
}

interface NotificationOptions {
    actions?: NotificationAction[];
    renotify?: boolean;
    timestamp?: number;
    vibrate?: number | number[];
}
