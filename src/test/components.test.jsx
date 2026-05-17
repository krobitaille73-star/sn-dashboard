import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import CloseTimeDistribution from '../components/CloseTimeDistribution'
import Top20SlowTickets from '../components/Top20SlowTickets'
import TeamInactivity from '../components/TeamInactivity'
import IncidentsByMonthChart from '../components/IncidentsByMonthChart'
import PriorityChart from '../components/PriorityChart'
import StateChart from '../components/StateChart'
import AssignmentGroupChart from '../components/AssignmentGroupChart'

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
    expect(screen.getByText('Top 20 — Longest Time to Close')).toBeInTheDocument()
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

  it('shows the sort dropdown', () => {
    render(<Top20SlowTickets tickets={[makeTicket()]} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('highlights reassignment count > 3 (renders the value)', () => {
    render(<Top20SlowTickets tickets={[makeTicket({ reassignmentCount: 5 })]} />)
    expect(screen.getByText('5')).toBeInTheDocument()
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
