import teamsByPerson from './teams-by-person.json'

// teams-by-person.json is ordered to reflect the snake draft: the
// people are listed in round-1 draft order, and each person's teams
// are listed in the order they picked them (one per round). In a
// snake draft, round order reverses every other round (1, 2, 3, ...
// then 10, 9, 8, ... then 1, 2, 3, ... again), so pick numbers can't
// be read off directly and have to be computed.
function computeDraftPickNumbers(
  byPerson: Record<string, string[]>,
): Record<string, number> {
  const people = Object.keys(byPerson)
  const numPeople = people.length
  const numRounds = Math.max(...people.map((p) => byPerson[p].length))
  const picks: Record<string, number> = {}

  for (let round = 0; round < numRounds; round++) {
    const order = round % 2 === 0 ? people : [...people].reverse()
    order.forEach((person, index) => {
      const team = byPerson[person][round]
      if (team) picks[team] = round * numPeople + index + 1
    })
  }

  return picks
}

const draftPickByTeam = computeDraftPickNumbers(
  teamsByPerson as Record<string, string[]>,
)

export function getDraftPick(team: string): number | null {
  return draftPickByTeam[team] ?? null
}
