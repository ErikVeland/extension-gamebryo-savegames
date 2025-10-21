/*
 * Bluebird to Native Promise Migration Helpers
 * 
 * This file provides helper functions to replace Bluebird-specific methods
 * with native Promise equivalents or custom implementations.
 */

// === Parallel Promise Mapping ===
// Parallel promise mapping implementation
// Original: Promise.map(array, mapperFunction, options)
// Replace with:
export const promiseMap = async <T, U>(array: T[], mapperFunction: (value: T, index: number, array: T[]) => Promise<U> | U, options: any = {}): Promise<U[]> => {
  if (options.concurrency) {
    // Implement concurrency control if needed
    const results: U[] = [];
    for (let i = 0; i < array.length; i += options.concurrency) {
      const chunk = array.slice(i, i + options.concurrency);
      const chunkResults = await Promise.all(chunk.map(mapperFunction));
      results.push(...chunkResults as U[]);
    }
    return results;
  } else {
    return Promise.all(array.map(mapperFunction)) as Promise<U[]>;
  }
};

// === Sequential Promise Mapping ===
// Sequential promise mapping implementation
// Original: Promise.mapSeries(array, mapperFunction)
// Replace with:
export const promiseMapSeries = async <T, U>(array: T[], mapperFunction: (value: T, index: number, array: T[]) => Promise<U> | U): Promise<U[]> => {
  const results: U[] = [];
  for (let i = 0; i < array.length; i++) {
    results.push(await mapperFunction(array[i], i, array));
  }
  return results;
};

// === Sequential Promise Iteration ===
// Sequential promise iteration implementation
// Original: Promise.each(array, iteratorFunction)
// Replace with:
export const promiseEach = async <T>(array: T[], iteratorFunction: (value: T, index: number, array: T[]) => Promise<void> | void): Promise<T[]> => {
  for (let i = 0; i < array.length; i++) {
    await iteratorFunction(array[i], i, array);
  }
  return array;
};

// === Promise-based Filtering ===
// Promise-based filtering implementation
// Original: Promise.filter(array, filterFunction, options)
// Replace with:
export const promiseFilter = async <T>(array: T[], filterFunction: (value: T, index: number, array: T[]) => Promise<boolean> | boolean, options: any = {}): Promise<T[]> => {
  if (options.concurrency) {
    // For concurrency control, process in chunks
    const results: T[] = [];
    const includeFlags: boolean[] = [];
    for (let i = 0; i < array.length; i += options.concurrency) {
      const chunk = array.slice(i, i + options.concurrency);
      const chunkFlags = await Promise.all(chunk.map(filterFunction));
      includeFlags.push(...chunkFlags);
    }
    for (let i = 0; i < array.length; i++) {
      if (includeFlags[i]) {
        results.push(array[i]);
      }
    }
    return results;
  } else {
    const includeFlags = await Promise.all(array.map(filterFunction));
    return array.filter((_, index) => includeFlags[index]);
  }
};

// === Promise-based Reduction ===
// Promise-based reduction implementation
// Original: Promise.reduce(array, reducerFunction, initialValue)
// Replace with:
export const promiseReduce = async <T, U>(array: T[], reducerFunction: (accumulator: U, currentValue: T, currentIndex: number, array: T[]) => Promise<U> | U, initialValue: U): Promise<U> => {
  let accumulator = initialValue;
  for (let i = 0; i < array.length; i++) {
    accumulator = await reducerFunction(accumulator, array[i], i, array);
  }
  return accumulator;
};

// === Promise-based Object Property Resolution ===
// Promise-based object property resolution implementation
// Original: Promise.props(object)
// Replace with:
export const promiseProps = async <T extends Record<string, any>>(object: T): Promise<{[K in keyof T]: Awaited<T[K]>}> => {
  const keys = Object.keys(object);
  const values = await Promise.all(keys.map(key => object[key]));
  const result = {} as {[K in keyof T]: Awaited<T[K]>};
  keys.forEach((key, index) => {
    result[key as keyof T] = values[index];
  });
  return result;
};

// === Promise-based Any Resolution ===
// Promise-based any resolution implementation
// Original: Promise.any(array)
// Replace with:
export const promiseAny = <T>(array: T[]): Promise<T> => {
  // Fallback implementation for environments that don't support Promise.any
  return new Promise((resolve, reject) => {
    if (array.length === 0) {
      reject(new Error('AggregateError: All promises were rejected'));
      return;
    }
    
    let rejectedCount = 0;
    const errors: any[] = [];
    
    array.forEach((promise, index) => {
      Promise.resolve(promise).then(resolve).catch(error => {
        errors[index] = error;
        rejectedCount++;
        if (rejectedCount === array.length) {
          reject(new Error('AggregateError: All promises were rejected'));
        }
      });
    });
  }) as Promise<T>;
};

// === Promise-based Some Resolution ===
// Promise-based some resolution implementation
// Original: Promise.some(array, count)
// Replace with:
export const promiseSome = async <T>(array: T[], count: number): Promise<T[]> => {
  if (count <= 0) return [];
  if (count > array.length) throw new RangeError('count must be less than or equal to array length');
  
  const results: T[] = [];
  const errors: any[] = [];
  let resolvedCount = 0;
  let rejectedCount = 0;
  
  return new Promise((resolve, reject) => {
    array.forEach((promise, index) => {
      Promise.resolve(promise).then(value => {
        if (resolvedCount < count) {
          results[index] = value;
          resolvedCount++;
          if (resolvedCount === count) {
            resolve(results.filter(r => r !== undefined) as T[]);
          }
        }
      }).catch(error => {
        errors[index] = error;
        rejectedCount++;
        if (rejectedCount > array.length - count) {
          reject(new Error('AggregateError: Too many promises rejected'));
        }
      });
    });
  }) as Promise<T[]>;
};

// === Promise-based Joining ===
// Promise-based joining implementation
// Original: Promise.join(promise1, promise2, ..., combinerFunction)
// Replace with:
export const promiseJoin = <T extends any[]>(...args: [...T, (...values: any[]) => any]): Promise<any> => {
  const combinerFunction = args.pop() as (...values: any[]) => any;
  return Promise.all(args).then(values => combinerFunction(...values));
};

// === Promise-based Try ===
// Promise-based try implementation
// Original: Promise.try(function)
// Replace with:
export const promiseTry = <T>(functionOrValue: (() => T) | T): Promise<T> => {
  try {
    return Promise.resolve(typeof functionOrValue === 'function' ? (functionOrValue as () => T)() : functionOrValue);
  } catch (error) {
    return Promise.reject(error);
  }
};

// === Promise-based Delay ===
// Promise-based delay implementation
// Original: Promise.delay(ms) or Promise.delay(ms, value)
// Replace with:
export const promiseDelay = <T>(ms: number, value?: T): Promise<T> => {
  return new Promise(resolve => setTimeout(() => resolve(value as T), ms));
};

// === Promise-based Timeout ===
// Promise-based timeout implementation
// Original: Promise.timeout(promise, ms)
// Replace with:
export const promiseTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Promise timed out')), ms))
  ]);
};