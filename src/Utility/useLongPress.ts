import { useRef, useEffect } from 'preact/hooks';

type UseLongPressOptions = {
  onClick: () => void;
  onHold?: () => void;
  repeat?: boolean;
  delay?: number;     // ms before starting hold
  interval?: number;  // repeat interval
};

export function useLongPress({
  onClick,
  onHold,
  repeat = true,
  delay = 500,
  interval = 100,
}: UseLongPressOptions) {
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const triggered = useRef<boolean | null>(false);

  const start = () => {
    triggered.current = false;

    if (!timerRef.current) {
      timerRef.current = window.setTimeout(() => {
        triggered.current = true;
        if (onHold) onHold();
        if (repeat && onHold) {
          intervalRef.current = window.setInterval(onHold, interval);
        }
      }, delay);
    }
  };

  const stop = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePointerDown = (e: PointerEvent | TouchEvent) => {
    if (e instanceof PointerEvent && e.button !== 0) return; // only left click
    start();
  };

  const handlePointerUp = () => {
    if (triggered.current == false) {
      onClick(); // short press
      triggered.current = null;
    }
    stop();
  };

  useEffect(() => {
    return stop; // cleanup on unmount
  }, []);

  return {
    onPointerDown: handlePointerDown,
    onPointerUp: handlePointerUp,
    onTouchStart: handlePointerDown,
    onTouchEnd: handlePointerUp,
    onPointerLeave: stop,
    onPointerCancel: stop,
  };
}
