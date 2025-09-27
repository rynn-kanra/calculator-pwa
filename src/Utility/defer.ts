export type DeferPromise<T> = Promise<T> & {
  resolve: (data: T) => void;
  reject: (reason?: any) => void;
}

export const defer = <T>(): DeferPromise<T> => {
  let resolve!: (data: T) => void;
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  }) as DeferPromise<T>;

  promise.resolve = resolve;
  promise.reject = reject;

  return promise;
};