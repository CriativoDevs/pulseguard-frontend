import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockEventSource } from '../setupTests';
import { Dashboard } from './Dashboard';

vi.mock('../api/client', () => {
  return {
    client: {
      get: vi.fn(async () => ({ data: { results: [
        { id: 1, name: 'API', protocol: 'https', host: 'example.com', port: 443 },
      ] } })),
      post: vi.fn(async () => ({ data: { count: 1 } })),
    },
    baseURL: 'http://localhost:8000/api',
  };
});

describe('Dashboard', () => {
  test('runs checks and shows SSE-updated server info', async () => {
    render(<Dashboard />);

    // Server list loads
    expect(await screen.findByText('API')).toBeInTheDocument();

    // Click Run Checks Now button
    const button = screen.getByRole('button', { name: /Run Checks Now/i });
    await userEvent.click(button);

    const mockedClient = (await import('../api/client')).client as any;
    expect(mockedClient.post).toHaveBeenCalledWith('/checks/run/');

    // Emit SSE status + ping for server 1
    const es = (global as any).EventSource.last as MockEventSource;
    await act(async () => {
      es.emit('status', { server: 1, name: 'API', status: 'up', last_check: new Date().toISOString(), message: 'OK' });
      es.emit('ping', { server: 1, name: 'API', status: 'success', response_time: 21.37, status_code: 200, check_timestamp: new Date().toISOString() });
    });

    // Badge and response time appear
    await waitFor(() => {
      expect(screen.getByText(/OK/)).toBeInTheDocument();
      expect(screen.getByText(/21\.37ms/)).toBeInTheDocument();
    });
  });
});
