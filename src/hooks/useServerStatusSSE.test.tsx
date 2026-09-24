import React from 'react';
import { describe, test, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServerStatusSSE } from './useServerStatusSSE';
import { MockEventSource } from '../setupTests';

describe('useServerStatusSSE', () => {
  test('captures status and ping events', () => {
    const { result } = renderHook(() => useServerStatusSSE());

    const es = (global as any).EventSource.last as MockEventSource;

    act(() => {
      es.emit('status', { server: 1, name: 'srv', status: 'up', last_check: new Date().toISOString() });
      es.emit('ping', { server: 1, name: 'srv', status: 'success', response_time: 42.5, status_code: 200, check_timestamp: new Date().toISOString() });
    });

    expect(result.current.statuses[1]).toBeTruthy();
    expect(result.current.statuses[1].status).toBe('up');
    expect(result.current.pings[1]).toBeTruthy();
    expect(result.current.pings[1].response_time).toBe(42.5);
  });

  test('sets error and closes on error event', () => {
    const { result } = renderHook(() => useServerStatusSSE());
    const es = (global as any).EventSource.last as MockEventSource;

    act(() => {
      // Trigger error event
      (es as any).listeners['error'].forEach((cb: Function) => cb(new Event('error')));
    });

    expect(result.current.error).toBe('Connection lost');
  });
});
