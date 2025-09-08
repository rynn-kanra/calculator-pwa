import { DeepPartial } from "./DeepPartial";

function isWritable<T extends object, KP extends keyof T>(obj: T, prop: KP) {
  while (obj) {
    const desc = Object.getOwnPropertyDescriptor(obj, prop);
    if (desc) {
      return !(typeof desc.get === 'function' && typeof desc.set === 'undefined');
    }
    obj = Object.getPrototypeOf(obj);
  }

  return true;
}

export function copy<T extends object>(target?: DeepPartial<T>, source?: T, isSet: boolean = false, isClone: boolean = false): T {
  if (!target || !source) {
    return (target || source) as T;
  }

  for (const prop in source) {
    if (prop === "__proto__" || prop === "constructor") {
      continue;
    }
    
    if (!isWritable(target, prop)) {
      continue;
    }

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
        if (isClone) {
          target[prop] = structuredClone(source[prop]);
        }
        else {
          target[prop] = source[prop];
        }
        break;
      }
      case typeof curVal === "object": {
        copy(curVal!, source[prop]!, isSet, isClone);
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