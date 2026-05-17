import { describe, it, expect } from 'vitest'
import {
  parseIncidents,
  groupBy,
  incidentsByMonth,
  closeMinutes,
  formatDuration,
  closeTimeDistribution,
  top20SlowestTickets,
  teamInactivity,
} from '../utils/parseIncidents'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeRow(overrides = {}) {
  return {
    Number: 'INC0000001',
    Opened: '2026-01-01 08:00:00',
    'Assigned to': 'Alice',
    'Opened by': 'Bob',
    Updated: '2026-01-02 08:00:00',
    'Updated by': 'Alice',
    'Work notes': '',
    'Short description': 'Test incident',
    'Reassignment count': 0,
    'Assignment group': 'Group A',
    Priority: '4 - Low',
    State: 'Closed',
    Store: 'Store 1',
    ...overrides,
  }
}

function makeInc(overrides = {}) {
  return parseIncidents([makeRow(overrides)])[0]
}

// ── parseIncidents ─────────────────────────────────────────────────────────────

describe('parseIncidents', () => {
  it('maps all fields correctly', () => {
    const inc = makeInc()
    expect(inc.number).toBe('INC0000001')
    expect(inc.assignedTo).toBe('Alice')
    expect(inc.openedBy).toBe('Bob')
    expect(inc.priority).toBe('4 - Low')
    expect(inc.state).toBe('Closed')
    expect(inc.store).toBe('Store 1')
    expect(inc.assignmentGroup).toBe('Group A')
    expect(inc.reassignmentCount).toBe(0)
  })

  it('converts Opened and Updated to Date objects', () => {
    const inc = makeInc()
    expect(inc.opened).toBeInstanceOf(Date)
    expect(inc.updated).toBeInstanceOf(Date)
    expect(inc.opened.getFullYear()).toBe(2026)
  })

  it('defaults missing optional fields to empty string', () => {
    const inc = parseIncidents([{
      Number: 'INC0000002',
      Opened: '2026-01-01 08:00:00',
      Updated: '2026-01-01 09:00:00',
    }])[0]
    expect(inc.assignedTo).toBe('')
    expect(inc.assignmentGroup).toBe('')
    expect(inc.store).toBe('')
    expect(inc.priority).toBe('')
    expect(inc.workNotes).toBe('')
  })

  it('converts reassignmentCount to a number', () => {
    const inc = makeInc({ 'Reassignment count': '3' })
    expect(inc.reassignmentCount).toBe(3)
  })

  it('defaults reassignmentCount to 0 when missing', () => {
    const inc = parseIncidents([{
      Number: 'INC0000003',
      Opened: '2026-01-01 08:00:00',
      Updated: '2026-01-01 09:00:00',
    }])[0]
    expect(inc.reassignmentCount).toBe(0)
  })

  it('returns an empty array for empty input', () => {
    expect(parseIncidents([])).toEqual([])
  })

  it('handles multiple rows', () => {
    const rows = [makeRow({ Number: 'INC001' }), makeRow({ Number: 'INC002' })]
    const result = parseIncidents(rows)
    expect(result).toHaveLength(2)
    expect(result[0].number).toBe('INC001')
    expect(result[1].number).toBe('INC002')
  })
})

// ── groupBy ───────────────────────────────────────────────────────────────────

describe('groupBy', () => {
  it('counts incidents by key', () => {
    const incidents = [
      makeInc({ Priority: '4 - Low' }),
      makeInc({ Priority: '4 - Low' }),
      makeInc({ Priority: '3 - Moderate' }),
    ]
    const result = groupBy(incidents, 'priority')
    expect(result['4 - Low']).toBe(2)
    expect(result['3 - Moderate']).toBe(1)
  })

  it('groups nullish values as "Unknown"', () => {
    const inc = { ...makeInc(), assignmentGroup: null }
    const result = groupBy([inc], 'assignmentGroup')
    expect(result['Unknown']).toBe(1)
  })

  it('returns an empty object for empty input', () => {
    expect(groupBy([], 'priority')).toEqual({})
  })
})

// ── incidentsByMonth ──────────────────────────────────────────────────────────

describe('incidentsByMonth', () => {
  it('groups incidents by YYYY-MM and sorts chronologically', () => {
    const incidents = [
      makeInc({ Opened: '2026-03-15 10:00:00' }),
      makeInc({ Opened: '2026-01-05 10:00:00' }),
      makeInc({ Opened: '2026-01-20 10:00:00' }),
    ]
    const result = incidentsByMonth(incidents)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ month: '2026-01', count: 2 })
    expect(result[1]).toEqual({ month: '2026-03', count: 1 })
  })

  it('returns empty array for empty input', () => {
    expect(incidentsByMonth([])).toEqual([])
  })

  it('pads single-digit months with a leading zero', () => {
    const result = incidentsByMonth([makeInc({ Opened: '2026-05-01 00:00:00' })])
    expect(result[0].month).toBe('2026-05')
  })
})

// ── closeMinutes ──────────────────────────────────────────────────────────────

describe('closeMinutes', () => {
  it('returns 0 when opened equals updated', () => {
    const inc = makeInc({ Opened: '2026-01-01 10:00:00', Updated: '2026-01-01 10:00:00' })
    expect(closeMinutes(inc)).toBe(0)
  })

  it('returns 60 for a 1-hour gap', () => {
    const inc = makeInc({ Opened: '2026-01-01 10:00:00', Updated: '2026-01-01 11:00:00' })
    expect(closeMinutes(inc)).toBe(60)
  })

  it('returns 1440 for a 24-hour gap', () => {
    const inc = makeInc({ Opened: '2026-01-01 00:00:00', Updated: '2026-01-02 00:00:00' })
    expect(closeMinutes(inc)).toBe(1440)
  })

  it('returns a negative value when updated is before opened', () => {
    const inc = makeInc({ Opened: '2026-01-02 00:00:00', Updated: '2026-01-01 00:00:00' })
    expect(closeMinutes(inc)).toBeLessThan(0)
  })
})

// ── formatDuration ────────────────────────────────────────────────────────────

describe('formatDuration', () => {
  it('formats values under 60 minutes as "X min"', () => {
    expect(formatDuration(0)).toBe('0 min')
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(59)).toBe('59 min')
  })

  it('formats values 60–1439 minutes as hours', () => {
    expect(formatDuration(60)).toBe('1.0 h')
    expect(formatDuration(90)).toBe('1.5 h')
    expect(formatDuration(1439)).toBe('24.0 h')
  })

  it('formats values ≥ 1440 minutes as days', () => {
    expect(formatDuration(1440)).toBe('1.0 days')
    expect(formatDuration(2880)).toBe('2.0 days')
    expect(formatDuration(10080)).toBe('7.0 days')
  })
})

// ── closeTimeDistribution ────────────────────────────────────────────────────

describe('closeTimeDistribution', () => {
  it('returns exactly 6 buckets', () => {
    expect(closeTimeDistribution([])).toHaveLength(6)
  })

  it('counts only Closed and Resolved incidents', () => {
    const incidents = [
      makeInc({ State: 'Closed',   Opened: '2026-01-01 00:00:00', Updated: '2026-01-01 00:30:00' }),
      makeInc({ State: 'Resolved', Opened: '2026-01-01 00:00:00', Updated: '2026-01-01 00:45:00' }),
    ]
    const dist = closeTimeDistribution(incidents)
    expect(dist.find(b => b.label === '< 1 h').count).toBe(2)
    expect(dist.reduce((s, b) => s + b.count, 0)).toBe(2)
  })

  it('ignores negative close times (updated before opened)', () => {
    const inc = makeInc({ Opened: '2026-01-02 00:00:00', Updated: '2026-01-01 00:00:00', State: 'Closed' })
    const dist = closeTimeDistribution([inc])
    expect(dist.reduce((s, b) => s + b.count, 0)).toBe(0)
  })

  it('places a 3-day ticket in the "1–3 days" bucket', () => {
    // 3 days = 4320 minutes — boundary: < 4320 → "1–3 days"
    const inc = makeInc({
      State: 'Closed',
      Opened: '2026-01-01 00:00:00',
      Updated: '2026-01-03 23:59:00',
    })
    const dist = closeTimeDistribution([inc])
    expect(dist.find(b => b.label === '1–3 days').count).toBe(1)
  })
})

// ── top20SlowestTickets ───────────────────────────────────────────────────────

describe('top20SlowestTickets', () => {
  function makeSlowInc(number, days) {
    const opened = new Date('2026-01-01T00:00:00')
    const updated = new Date(opened.getTime() + days * 86_400_000)
    return makeInc({
      Number: number,
      Opened: opened.toISOString(),
      Updated: updated.toISOString(),
      State: 'Closed',
    })
  }

  it('returns at most N tickets (default 20)', () => {
    const incidents = Array.from({ length: 30 }, (_, i) => makeSlowInc(`INC${i}`, i + 1))
    expect(top20SlowestTickets(incidents)).toHaveLength(20)
  })

  it('sorts by closeMinutes descending', () => {
    const incidents = [makeSlowInc('INC1', 1), makeSlowInc('INC5', 5), makeSlowInc('INC2', 2)]
    const result = top20SlowestTickets(incidents)
    expect(result[0].number).toBe('INC5')
    expect(result[1].number).toBe('INC2')
    expect(result[2].number).toBe('INC1')
  })

  it('excludes tickets with negative close times', () => {
    const good = makeInc({ State: 'Closed', Opened: '2026-01-01 00:00:00', Updated: '2026-01-02 00:00:00' })
    const bad  = makeInc({ State: 'Closed', Opened: '2026-01-02 00:00:00', Updated: '2026-01-01 00:00:00' })
    const result = top20SlowestTickets([good, bad])
    expect(result).toHaveLength(1)
  })

  it('returns empty array when no closed/resolved incidents', () => {
    const inc = makeInc({ State: 'Open' })
    expect(top20SlowestTickets([inc])).toHaveLength(0)
  })

  it('attaches closeMinutes to each result', () => {
    const result = top20SlowestTickets([
      makeInc({ State: 'Closed', Opened: '2026-01-01 00:00:00', Updated: '2026-01-01 01:00:00' }),
    ])
    expect(result[0].closeMinutes).toBe(60)
  })
})

// ── teamInactivity ────────────────────────────────────────────────────────────

describe('teamInactivity', () => {
  function makeGroupInc(group, updatedDaysAgo, refDate) {
    const updated = new Date(refDate.getTime() - updatedDaysAgo * 86_400_000)
    return {
      ...makeInc({ 'Assignment group': group }),
      updated,
      assignmentGroup: group,
    }
  }

  it('returns at most 10 groups', () => {
    const refDate = new Date('2026-05-16')
    const incidents = Array.from({ length: 15 }, (_, i) =>
      Array.from({ length: 5 }, () => makeGroupInc(`Group ${i}`, i, refDate))
    ).flat()
    expect(teamInactivity(incidents)).toHaveLength(10)
  })

  it('filters out groups with fewer than 5 tickets', () => {
    const refDate = new Date('2026-05-16')
    const small = [makeGroupInc('SmallGroup', 10, refDate)]  // only 1 ticket
    const large = Array.from({ length: 5 }, () => makeGroupInc('LargeGroup', 5, refDate))
    const result = teamInactivity([...small, ...large])
    expect(result.map(g => g.name)).not.toContain('SmallGroup')
    expect(result.map(g => g.name)).toContain('LargeGroup')
  })

  it('sorts by avgDays descending', () => {
    const refDate = new Date('2026-05-16')
    const slowGroup = Array.from({ length: 5 }, () => makeGroupInc('Slow', 30, refDate))
    const fastGroup = Array.from({ length: 5 }, () => makeGroupInc('Fast', 2, refDate))
    const result = teamInactivity([...slowGroup, ...fastGroup])
    expect(result[0].name).toBe('Slow')
    expect(result[1].name).toBe('Fast')
  })

  it('computes avgDays relative to the latest updated date in the dataset', () => {
    const refDate = new Date('2026-05-16T00:00:00')
    // Group G updated 10 days before refDate
    const groupG = Array.from({ length: 5 }, () => makeGroupInc('G', 10, refDate))
    // One anchor incident AT refDate — establishes the max updated for the function.
    // Its group only has 1 ticket so it's filtered out of results, but it sets refDate.
    const anchor = { ...makeInc(), updated: refDate, assignmentGroup: 'Anchor' }
    const result = teamInactivity([...groupG, anchor])
    expect(result.find(g => g.name === 'G').avgDays).toBeCloseTo(10, 0)
  })

  it('returns empty array when all groups have fewer than 5 tickets', () => {
    const refDate = new Date('2026-05-16')
    const incidents = [makeGroupInc('Tiny', 5, refDate)]
    expect(teamInactivity(incidents)).toHaveLength(0)
  })
})
