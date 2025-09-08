type ConstrainMode = "none" | "manual" | "single-shot" | "continuous";
interface MediaTrackConstraintSet {
    focusMode?: ConstrainMode;
    exposureMode?: ConstrainMode;
    whiteBalanceMode?: ConstrainMode;
    zoom?: ConstrainDouble;
    torch?: boolean;
    sharpness?: ConstrainDouble;
    focusDistance?: ConstrainDouble;
}

interface MediaTrackCapabilities {
    focusMode?: string[];
    torch?: boolean;
    focusDistance?: MediaSettingsRange;
}