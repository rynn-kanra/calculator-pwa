export function lazy<T>(init: () => T) {
  let val: T | undefined;
  return {
    get value() {
      if (val === undefined) {
        val = init();
      }

      return val;
    }
  }
};
