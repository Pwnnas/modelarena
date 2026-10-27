import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TASKS_DIR = path.join(ROOT, 'tasks');
export const SUBMISSIONS_DIR = path.join(ROOT, 'submissions');
export const RESULTS_DIR = path.join(ROOT, 'results');
export const DASHBOARD_DIR = path.join(ROOT, 'dashboard');
export const VOTES_FILE = path.join(RESULTS_DIR, 'votes.json');

// Model names become folder names and URL segments, so keep them boring.
export const MODEL_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
