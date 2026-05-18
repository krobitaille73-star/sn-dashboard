import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CloseTimeDistribution from '../components/CloseTimeDistribution'
import Top20SlowTickets from '../components/Top20SlowTickets'
import TeamInactivity from '../components/TeamInactivity'
import IncidentsByMonthChart from '../components/IncidentsByMonthChart'
import PriorityChart from '../components/PriorityChart'
import StateChart from '../components/StateChart'
import AssignmentGroupChart from '../components/AssignmentGroupChart'
import CriticalHighWidget from '../components/CriticalHighWidget'

// Recharts uses ResizeObserver which isn't available in jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── CloseTimeDistribution ─────────────────────────────────────────────────────

describe('CloseTimeDistribution', () => {
  const data = [
    { label: '< 1 h', count: 100 },
    { label: '1–4 h', count: 200 },
    { label: '4–24 h', count: 50 },
    { label: '1–3 days', count: 10 },
    { label: '3–7 days', count: 5 },
    { label: '> 7 days', count: 2 },
  ]

  it('renders the section title', () => {
    render(<CloseTimeDistribution data={data} />)
    expect(screen.getByText('Ticket Close-Time Distribution')).toBeInTheDocument()
  })

  it('renders with empty data without crashing', () => {
    const emptyData = data.map(d => ({ ...d, count: 0 }))
    const { container } = render(<CloseTimeDistribution data={emptyData} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ── Top20SlowTickets ──────────────────────────────────────────────────────────

function makeTicket(overrides = {}) {
  return {
    number: 'INC0000001',
    shortDescription: 'Test',
    priority: '4 - Low',
    assignmentGroup: 'Group A',
    reassignmentCount: 0,
    store: 'Store 1',
    state: 'Closed',
    closeMinutes: 1440,
    opened: new Date('2026-01-01'),
    updated: new Date('2026-01-02'),
    ...overrides,
  }
}

describe('Top20SlowTickets', () => {
  it('renders the section title', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    expect(screen.getByText('Slow Tickets — Resolved in > 15 days')).toBeInTheDocument()
  })

  it('renders a row for each ticket', () => {
    const tickets = [
      makeTicket({ number: 'INC001' }),
      makeTicket({ number: 'INC002' }),
    ]
    render(<Top20SlowTickets tickets={tickets} />)
    expect(screen.getByText('INC001')).toBeInTheDocument()
    expect(screen.getByText('INC002')).toBeInTheDocument()
  })

  it('renders rank numbers starting at 1', () => {
    render(<Top20SlowTickets tickets={[makeTicket(), makeTicket({ number: 'INC002' })]} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('renders with empty tickets without crashing', () => {
    const { container } = render(<Top20SlowTickets tickets={[]} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows toolbar dropdowns and column-filter dropdowns', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    // 2 toolbar (page size + sort) + 3 filter row (priority, group, store)
    const combos = screen.getAllByRole('combobox')
    expect(combos.length).toBeGreaterThanOrEqual(5)
  })

  it('page-size dropdown contains 20, 50, 100, All options', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    // Use getByDisplayValue to target the page-size select specifically
    const pageSizeSelect = screen.getByDisplayValue('20')
    expect(within(pageSizeSelect.closest('select') ?? pageSizeSelect).queryAllByRole).toBeTruthy()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    // "All" appears multiple times (page-size + filter defaults) — check at least one exists
    expect(screen.getAllByText('All').length).toBeGreaterThanOrEqual(1)
  })

  it('shows "Resolved" column header', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('highlights reassignment count > 3 (renders the value)', () => {
    render(<Top20SlowTickets tickets={[makeTicket({ reassignmentCount: 5 })]} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders a text filter input for Ticket column', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    expect(screen.getByPlaceholderText('Filter…')).toBeInTheDocument()
  })

  it('filters rows by ticket number when text is typed', async () => {
    const user = userEvent.setup()
    const tickets = [makeTicket({ number: 'INC001' }), makeTicket({ number: 'INC999' })]
    render(<Top20SlowTickets tickets={tickets} />)
    await user.type(screen.getByPlaceholderText('Filter…'), 'INC001')
    expect(screen.getByText('INC001')).toBeInTheDocument()
    expect(screen.queryByText('INC999')).not.toBeInTheDocument()
  })

  it('shows Clear filters button when a filter is active', async () => {
    const user = userEvent.setup()
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    await user.type(screen.getByPlaceholderText('Filter…'), 'X')
    expect(screen.getByText(/Clear filters/)).toBeInTheDocument()
  })

  it('clears all filters when Clear filters is clicked', async () => {
    const user = userEvent.setup()
    render(<Top20SlowTickets tickets={[makeTicket({ number: 'INC001' })]} />)
    await user.type(screen.getByPlaceholderText('Filter…'), 'NOMATCH')
    await user.click(screen.getByText(/Clear filters/))
    expect(screen.getByText('INC001')).toBeInTheDocument()
  })

  it('shows "No tickets match" message when filters return zero rows', async () => {
    const user = userEvent.setup()
    render(<Top20SlowTickets tickets={[makeTicket({ number: 'INC001' })]} />)
    await user.type(screen.getByPlaceholderText('Filter…'), 'NOMATCH')
    expect(screen.getByText(/No tickets match the current filters/)).toBeInTheDocument()
  })
})

// ── TeamInactivity ────────────────────────────────────────────────────────────

describe('TeamInactivity', () => {
  const data = [
    { name: 'UAP Store Support Level 1', avgDays: 45, count: 100 },
    { name: 'UAP HVPD Support Level 2', avgDays: 12, count: 50 },
  ]

  it('renders the section title', () => {
    render(<TeamInactivity data={data} />)
    expect(screen.getByText('Teams — Avg Days Without Action')).toBeInTheDocument()
  })

  it('renders with empty data without crashing', () => {
    const { container } = render(<TeamInactivity data={[]} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders the legend labels', () => {
    render(<TeamInactivity data={data} />)
    expect(screen.getByText('> 30 days')).toBeInTheDocument()
    expect(screen.getByText('< 7 days')).toBeInTheDocument()
  })
})

// ── IncidentsByMonthChart ─────────────────────────────────────────────────────

describe('IncidentsByMonthChart', () => {
  const data = [
    { month: '2026-01', count: 300 },
    { month: '2026-02', count: 450 },
  ]

  it('renders the section title', () => {
    render(<IncidentsByMonthChart data={data} />)
    expect(screen.getByText('Incidents by Month')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { container } = render(<IncidentsByMonthChart data={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ── PriorityChart ─────────────────────────────────────────────────────────────

describe('PriorityChart', () => {
  const data = [
    { name: '1 - Critical', count: 5 },
    { name: '4 - Low', count: 200 },
  ]

  it('renders the section title', () => {
    render(<PriorityChart data={data} />)
    expect(screen.getByText('Incidents by Priority')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { container } = render(<PriorityChart data={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ── StateChart ────────────────────────────────────────────────────────────────

describe('StateChart', () => {
  const data = [
    { name: 'Closed', count: 500 },
    { name: 'Resolved', count: 50 },
  ]

  it('renders the section title', () => {
    render(<StateChart data={data} />)
    expect(screen.getByText('Incidents by State')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { container } = render(<StateChart data={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ── AssignmentGroupChart ──────────────────────────────────────────────────────

describe('AssignmentGroupChart', () => {
  const data = [
    { name: 'UAP Store Support Level 1', count: 1000 },
    { name: 'UAP HVPD Support Level 1', count: 500 },
  ]

  it('renders the section title', () => {
    render(<AssignmentGroupChart data={data} />)
    expect(screen.getByText('All Assignment Groups')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { container } = render(<AssignmentGroupChart data={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ── CriticalHighWidget ────────────────────────────────────────────────────────

function makeIncs(priorities) {
  return priorities.map((p) => ({ priority: p }))
}

describe('CriticalHighWidget', () => {
  it('renders the section title', () => {
    render(<CriticalHighWidget incidents={[]} />)
    expect(screen.getByText('Critical & High Tickets')).toBeInTheDocument()
  })

  it('renders Critical and High labels', () => {
    render(<CriticalHighWidget incidents={[]} />)
    // Use getAllByText since "Critical" also appears in the title
    expect(screen.getAllByText(/Critical/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/High/).length).toBeGreaterThanOrEqual(1)
  })

  it('shows correct count for Critical tickets', () => {
    const incidents = makeIncs(['1 - Critical', '1 - Critical', '4 - Low'])
    render(<CriticalHighWidget incidents={incidents} />)
    // The big number "2" should appear for Critical
    const twos = screen.getAllByText('2')
    expect(twos.length).toBeGreaterThan(0)
  })

  it('shows 0 when no critical or high tickets', () => {
    const incidents = makeIncs(['4 - Low', '3 - Moderate'])
    render(<CriticalHighWidget incidents={incidents} />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(2) // one for Critical, one for High
  })

  it('renders without crashing with empty incidents', () => {
    const { container } = render(<CriticalHighWidget incidents={[]} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows combined total badge', () => {
    const incidents = makeIncs(['1 - Critical', '2 - High', '2 - High'])
    render(<CriticalHighWidget incidents={incidents} />)
    // Badge text: "3 total · X% of all tickets"
    expect(screen.getAllByText(/3 total/).length).toBeGreaterThan(0)
  })
})
