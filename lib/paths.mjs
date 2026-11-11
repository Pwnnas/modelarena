import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// `--v2` (or ARENA_SUITE=v2) switches to the second suite, which keeps its own
// tasks, submissions and results under v2/ so the two never mix. It is read
// here, before any module uses a path.
export const SUITE = process.argv.includes('--v2') || process.env.ARENA_SUITE === 'v2' ? 'v2' : 'v1';
const SUITE_DIR = SUITE === 'v2' ? path.join(ROOT, 'v2') : ROOT;
export const TASKS_DIR = path.join(SUITE_DIR, 'tasks');
export const SUBMISSIONS_DIR = path.join(SUITE_DIR, 'submissions');
export const RESULTS_DIR = path.join(SUITE_DIR, 'results');
export const DASHBOARD_DIR = path.join(ROOT, 'dashboard');
export const VOTES_FILE = path.join(RESULTS_DIR, 'votes.json');

// Model names become folder names and URL segments, so keep them boring.
export const MODEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
