import { readFile } from 'node:fs/promises';
import path from 'node:path';

export type CaseCandidate = {
  id: string;
  number: string;
  court: string;
  category: string;
  topics: string[];
  uid?: string;
  official_case_url: string;
  verification: string;
  act_reviewed: boolean;
};

export async function loadCandidates(): Promise<CaseCandidate[]> {
  // apps/web runs from this directory; Docker deployment must mount/copy data/.
  const filename = path.resolve(process.cwd(), '../../data/court-catalog.jsonl');
  try {
    const raw = await readFile(filename, 'utf8');
    return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
      const item = JSON.parse(line) as CaseCandidate;
      if (!item.id || !item.number || !item.court ||
          !item.official_case_url?.startsWith('https://') ||
          item.act_reviewed || item.verification !== 'case_metadata_only') return [];
      return [item];
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}
