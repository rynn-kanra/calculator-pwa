interface ScreenOrientation {
    lock(type: OrientationType): Promise<void>;
}