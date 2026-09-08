export type ContributionDay = { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 };

export type ContributionYear = {
  days: ContributionDay[];
  total: number;
  /** Whether the numbers include private repositories. Only GitHub's own API
   *  can see those, and only with a token belonging to the account. */
  includesPrivate: boolean;
};

/** GitHub's own buckets are relative to the user's busiest day; these fixed
 *  thresholds are close enough for a decorative chart and don't need a second
 *  pass over the data. */
function levelFor(count: number): ContributionDay["level"] {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const CALENDAR_QUERY = `
  query ($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks { contributionDays { date contributionCount } }
        }
      }
    }
  }
`;

/**
 * One calendar year of contributions, January 1st to December 31st.
 *
 * Two sources, in order of preference:
 *
 * 1. GitHub's GraphQL API, when GITHUB_TOKEN is set. This is the only source
 *    that can see private contributions, so it's the only one that matches
 *    what the profile page shows its owner.
 * 2. A public mirror, which sees public repository activity only. For an
 *    account whose work is mostly in private repos this reports a small
 *    fraction of the real figure — accurate, but not the whole picture.
 *
 * Runs on the server, so the token is never shipped to the browser. Returns
 * null on any failure; the caller renders nothing rather than a broken chart.
 */
export async function getYearContributions(
  login: string,
  year: number,
): Promise<ContributionYear | null> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;
  const token = process.env.GITHUB_TOKEN;

  if (token) {
    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: CALENDAR_QUERY,
          variables: { login, from, to },
        }),
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        const calendar =
          json?.data?.user?.contributionsCollection?.contributionCalendar;
        if (calendar?.weeks) {
          const days: ContributionDay[] = calendar.weeks.flatMap(
            (week: { contributionDays: { date: string; contributionCount: number }[] }) =>
              week.contributionDays.map((d) => ({
                date: d.date,
                count: d.contributionCount,
                level: levelFor(d.contributionCount),
              })),
          );
          return {
            days,
            total: calendar.totalContributions ?? 0,
            includesPrivate: true,
          };
        }
      }
    } catch {
      // fall through to the public mirror
    }
  }

  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${login}?y=${year}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const days: ContributionDay[] = (json?.contributions ?? []).map(
      (d: { date: string; count: number }) => ({
        date: d.date,
        count: d.count,
        level: levelFor(d.count),
      }),
    );
    if (!days.length) return null;
    const total =
      typeof json.total === "object"
        ? (json.total?.[String(year)] ?? 0)
        : (json.total ?? 0);
    return { days, total, includesPrivate: false };
  } catch {
    return null;
  }
}
