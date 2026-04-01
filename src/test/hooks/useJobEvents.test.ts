import { act, renderHook, waitFor } from '@testing-library/react';
import { useJobEvents } from '../../hooks/useJobEvents';

jest.mock('../../services/apiCalls', () => ({
  getJobEventsUrl: jest.fn((jobId: string) => `http://localhost:8000/api/jobs/${jobId}/events`),
}));

type Listener = (event: MessageEvent<string>) => void;

class MockEventSource {
  static instances: MockEventSource[] = [];

  public onerror: ((this: EventSource, ev: Event) => unknown) | null = null;
  private listeners = new Map<string, Listener[]>();
  public closed = false;

  constructor(public readonly url: string) {
    MockEventSource.instances.push(this);
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
    const normalized = listener as unknown as Listener;
    const existing = this.listeners.get(type) ?? [];
    existing.push(normalized);
    this.listeners.set(type, existing);
  }

  close(): void {
    this.closed = true;
  }

  emit(type: string, payload: unknown): void {
    const handlers = this.listeners.get(type) ?? [];
    const event = { data: JSON.stringify(payload) } as MessageEvent<string>;
    handlers.forEach((handler) => handler(event));
  }

  emitMalformed(type: string, rawData: string): void {
    const handlers = this.listeners.get(type) ?? [];
    const event = { data: rawData } as MessageEvent<string>;
    handlers.forEach((handler) => handler(event));
  }

  triggerError(): void {
    if (this.onerror) {
      this.onerror.call({} as EventSource, new Event('error'));
    }
  }
}

describe('useJobEvents', () => {
  beforeEach(() => {
    MockEventSource.instances = [];
    Object.defineProperty(globalThis, 'EventSource', {
      value: MockEventSource,
      configurable: true,
      writable: true,
    });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns empty state when no job id is provided', () => {
    const { result } = renderHook(() => useJobEvents(null));

    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(MockEventSource.instances).toHaveLength(0);
  });

  test('subscribes and appends parsed events', async () => {
    const { result } = renderHook(() => useJobEvents('job-1'));

    const source = MockEventSource.instances[0];
    act(() => {
      source.emit('job:started', {
        type: 'job:started',
        jobId: 'job-1',
        state: 'running',
      });
      source.emit('job:completed', {
        type: 'job:completed',
        jobId: 'job-1',
        state: 'completed',
      });
    });

    await waitFor(() => {
      expect(result.current.events).toHaveLength(2);
    });

    expect(result.current.events[0]).toEqual(
      expect.objectContaining({
        type: 'job:started',
      }),
    );
    expect(result.current.events[1]).toEqual(
      expect.objectContaining({
        type: 'job:completed',
      }),
    );
  });

  test('surfaces connection errors', async () => {
    const { result } = renderHook(() => useJobEvents('job-2'));

    act(() => {
      MockEventSource.instances[0].triggerError();
    });

    await waitFor(() => {
      expect(result.current.error).toBe('SSE connection interrupted.');
    });
  });

  test('ignores malformed payloads without crashing', async () => {
    const { result } = renderHook(() => useJobEvents('job-3'));

    act(() => {
      MockEventSource.instances[0].emitMalformed('job:snapshot', '{bad json');
    });

    await waitFor(() => {
      expect(result.current.events).toEqual([]);
    });

    expect(console.error).toHaveBeenCalled();
  });

  test('closes previous EventSource when job id changes', () => {
    const { rerender } = renderHook(({ jobId }: { jobId: string | null }) => useJobEvents(jobId), {
      initialProps: { jobId: 'job-10' },
    });

    const firstSource = MockEventSource.instances[0];

    rerender({ jobId: 'job-11' });

    expect(firstSource.closed).toBe(true);
    expect(MockEventSource.instances).toHaveLength(2);
  });
});
