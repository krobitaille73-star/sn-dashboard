import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useIncidents } from '../hooks/useIncidents'

const SAMPLE_ROWS = [
  {
    Number: 'INC001',
    Opened: '2026-01-01 08:00:00',
    'Assigned to': 'Alice',
    'Opened by': 'Bob',
    Updated: '2026-01-02 08:00:00',
    'Updated by': 'Alice',
    'Work notes': '',
    'Short description': 'Test',
    'Reassignment count': 0,
    'Assignment group': 'Group A',
    Priority: '4 - Low',
    State: 'Closed',
    Store: 'Store 1',
  },
]

describe('useIncidents', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('starts in loading state', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => new Promise(() => {}), // never resolves
    })
    const { result } = renderHook(() => useIncidents('/data/incidents.json'))
    expect(result.current.loading).toBe(true)
    expect(result.current.incidents).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('parses and returns incidents on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(SAMPLE_ROWS)),
    })
    const { result } = renderHook(() => useIncidents('/data/incidents.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.incidents).toHaveLength(1)
    expect(result.current.incidents[0].number).toBe('INC001')
    expect(result.current.error).toBeNull()
  })

  it('sets error and clears loading on HTTP error', async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 404, url: '/data/incidents.json' })
    const { result } = renderHook(() => useIncidents('/data/incidents.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.error.message).toMatch(/404/)
    expect(result.current.incidents).toEqual([])
  })

  it('sets error and clears loading on network failure', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useIncidents('/data/incidents.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
    expect(result.current.error.message).toBe('Network error')
  })

  it('sets error on invalid JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve('not valid json'),
    })
    const { result } = renderHook(() => useIncidents('/data/incidents.json'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeTruthy()
  })

  it('does not fetch when url is falsy', () => {
    renderHook(() => useIncidents(null))
    expect(fetch).not.toHaveBeenCalled()
  })
})
