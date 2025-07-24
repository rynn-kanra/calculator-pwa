import { DeepPartial } from "./DeepPartial";

export function copy<T extends object>(target: DeepPartial<T>, source: T, isSet: boolean = false): T {
  if (!target || !source) {
    return (target || source) as T;
  }

  for (const prop in source) {
    const curVal = target[prop];
    switch (true) {
      case Array.isArray(curVal): {
        if (isSet) {
          target[prop] = source[prop];
        }
        break;
      }
      case curVal instanceof Date: {
        if (isSet) {
          target[prop] = source[prop];
        }
        break;
      }
      case curVal === undefined:
      case curVal === null: {
        target[prop] = source[prop];
        break;
      }
      case typeof curVal === "object": {
        copy(curVal, source[prop]);
        break;
      }
      default: {
        if (isSet) {
          target[prop] = source[prop];
        }
      }
    }
  }

  return target as T;
}