import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import KpiCard from '../components/KpiCard'

describe('KpiCard', () => {
  it('renders title and value', () => {
    render(<KpiCard title="Total Incidents" value="1,234" />)
    expect(screen.getByText('Total Incidents')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('renders sub text when provided', () => {
    render(<KpiCard title="Avg" value="2.5 days" sub="From open to last update" />)
    expect(screen.getByText('From open to last update')).toBeInTheDocument()
  })

  it('does not render sub text when omitted', () => {
    const { queryByText } = render(<KpiCard title="T" value="0" />)
    expect(queryByText('From open to last update')).not.toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<KpiCard title="Critical" value="5" badge="P1" />)
    expect(screen.getByText('P1')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<KpiCard title="Speed" value="1.5 h" icon="⏱" />)
    expect(screen.getByText('⏱')).toBeInTheDocument()
  })

  it('renders trend label when provided', () => {
    render(<KpiCard title="T" value="0" trend={{ label: '+12% vs last month', up: true }} />)
    expect(screen.getByText(/\+12% vs last month/)).toBeInTheDocument()
  })

  it('uses up arrow for positive trend', () => {
    render(<KpiCard title="T" value="0" trend={{ label: 'up', up: true }} />)
    expect(screen.getByText(/▲/)).toBeInTheDocument()
  })

  it('uses down arrow for negative trend', () => {
    render(<KpiCard title="T" value="0" trend={{ label: 'down', up: false }} />)
    expect(screen.getByText(/▼/)).toBeInTheDocument()
  })

  it('renders without crashing with default color', () => {
    const { container } = render(<KpiCard title="T" value="0" />)
    expect(container.firstChild).toBeTruthy()
  })

  it.each(['blue', 'red', 'green', 'yellow', 'purple'])(
    'renders without crashing with color="%s"',
    (color) => {
      const { container } = render(<KpiCard title="T" value="0" color={color} />)
      expect(container.firstChild).toBeTruthy()
    }
  )
})
