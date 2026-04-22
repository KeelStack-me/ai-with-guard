import { filterNullable } from '@ai-sdk/provider-utils';

/**
 * Merges multiple abort sources into a single `AbortSignal`.
 * The returned signal will abort when any input signal aborts or when any
 * numeric timeout elapses, using the reason from the first source to abort.
 *
 * @param signals - Abort signals or timeout durations in milliseconds.
 * `null` and `undefined` values are ignored.
 * @returns An `AbortSignal` that aborts when any valid source aborts,
 * or `undefined` if no valid sources are provided.
 */
export function mergeAbortSignals(
  ...signals: (AbortSignal | null | undefined | number)[]
): AbortSignal | undefined {
  const validSignals = filterNullable(...signals).map(signal =>
    signal instanceof AbortSignal ? signal : AbortSignal.timeout(signal),
  );

  if (validSignals.length === 0) {
    return undefined;
  }

  if (validSignals.length === 1) {
    return validSignals[0];
  }

  const controller = new AbortController();

  // Preserve input ordering when multiple signals are already aborted.
  for (const signal of validSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
  }

  const cleanupCallbacks: Array<() => void> = [];

  const abortFromSignal = (signal: AbortSignal) => {
    if (!controller.signal.aborted) {
      controller.abort(signal.reason);
    }

    for (const cleanup of cleanupCallbacks) {
      cleanup();
    }
  };

  for (const signal of validSignals) {
    const onAbort = () => abortFromSignal(signal);
    signal.addEventListener('abort', onAbort, { once: true });
    cleanupCallbacks.push(() => signal.removeEventListener('abort', onAbort));
  }

  return controller.signal;
}
