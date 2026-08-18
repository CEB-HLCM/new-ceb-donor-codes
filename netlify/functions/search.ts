import type { Context } from "@netlify/functions";

const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/CEB-HLCM/FS-Public-Codes/refs/heads/main";
const DONORS_CSV_URL = `${GITHUB_RAW_BASE}/DONORS.csv`;
const CONTRIBUTOR_TYPES_CSV_URL = `${GITHUB_RAW_BASE}/CONTRIBUTOR_TYPES.csv`;

interface Donor {
  NAME: string;
  TYPE: string;
  "CEB CODE": string;
  "CONTRIBUTOR TYPE": string;
}

interface ContributorType {
  NAME: string;
  TYPE: string;
  DEFINITION: string;
}

interface DonorWithType extends Donor {
  contributorTypeInfo?: ContributorType;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCSV<T>(csvText: string): T[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0]
    .replace(/^\uFEFF/, "")
    .split(",")
    .map((h) => h.trim());

  const result: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;

    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim() || "";
    });
    result.push(obj as T);
  }

  return result;
}

async function fetchCSV(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "text/csv,text/plain,*/*" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const text = await response.text();
      if (!text.trim()) throw new Error("Empty response");
      return text;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error("Unexpected error");
}

function linkDonorsWithTypes(
  donors: Donor[],
  contributorTypes: ContributorType[]
): DonorWithType[] {
  const map = new Map<string, ContributorType>();
  contributorTypes.forEach((t) => map.set(t.TYPE, t));
  return donors.map((d) => ({
    ...d,
    contributorTypeInfo: map.get(d["CONTRIBUTOR TYPE"]),
  }));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function scoreMatch(query: string, code: string, name: string, threshold: number): number {
  const q = query.toUpperCase();
  const c = code.toUpperCase();
  const n = name.toUpperCase();

  if (c === q) return 100;
  if (c.startsWith(q)) return 95;
  if (c.includes(q)) return 85;

  const dist = levenshtein(q, c);
  const maxLen = Math.max(q.length, c.length);
  const similarity = 1 - dist / maxLen;
  if (similarity >= 1 - threshold) {
    return Math.round(similarity * 80);
  }

  if (n.includes(q)) return 60;
  const nameWords = n.split(/\s+/);
  if (nameWords.some((w) => w.startsWith(q))) return 55;

  return 0;
}

function searchDonors(
  query: string,
  donors: DonorWithType[],
  threshold: number
) {
  return donors
    .map((donor) => ({
      NAME: donor.NAME,
      "CEB CODE": donor["CEB CODE"],
      TYPE: donor.TYPE,
      "CONTRIBUTOR TYPE": donor["CONTRIBUTOR TYPE"],
      contributorTypeInfo: donor.contributorTypeInfo,
      score: scoreMatch(query, donor["CEB CODE"], donor.NAME, threshold),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

let cachedDonors: DonorWithType[] | null = null;

async function getDonors(): Promise<DonorWithType[]> {
  if (cachedDonors) return cachedDonors;

  const [donorsText, typesText] = await Promise.all([
    fetchCSV(DONORS_CSV_URL),
    fetchCSV(CONTRIBUTOR_TYPES_CSV_URL),
  ]);

  const donors = parseCSV<Donor>(donorsText);
  const types = parseCSV<ContributorType>(typesText);
  cachedDonors = linkDonorsWithTypes(donors, types);
  return cachedDonors;
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const codesParam = url.searchParams.get("codes");
  const thresholdParam = url.searchParams.get("threshold");

  if (!codesParam) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Missing "codes" parameter. Use ?codes=CODE1,CODE2&threshold=0.4',
        documentation: {
          description: "Search CEB donor codes and return matching candidates with a score.",
          parameters: {
            codes: "Comma-separated list of donor codes to search (required)",
            threshold: "Fuzzy matching threshold from 0 (strict) to 1 (permissive). Default: 0.4",
          },
          example: "/api/search?codes=UNIPD,CH&threshold=0.3",
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const codes = codesParam
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  if (codes.length === 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "No valid codes provided",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const threshold = thresholdParam
    ? Math.min(1, Math.max(0, parseFloat(thresholdParam)))
    : 0.4;

  try {
    const donors = await getDonors();

    const results = codes.map((code) => ({
      code,
      query: code,
      matches: searchDonors(code, donors, threshold),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/search",
};
