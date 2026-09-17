const crypto = require('node:crypto');

const PROJECT = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACCESS_KEY = process.env.ARCHIVE_ACCESS_KEY;

function reply(res, code, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function db(path, options = {}) {
  const response = await fetch(`${PROJECT}/rest/v1/${path}`, {
    ...options,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Archive database returned ${response.status}: ${body.slice(0, 160)}`);
  return { data: body ? JSON.parse(body) : null, count: response.headers.get('content-range') };
}

function authorized(req) {
  const supplied = req.headers['x-archive-key'];
  if (!ACCESS_KEY || typeof supplied !== 'string') return false;
  const a = crypto.createHash('sha256').update(supplied).digest();
  const b = crypto.createHash('sha256').update(ACCESS_KEY).digest();
  return crypto.timingSafeEqual(a, b);
}

function normalize(line) {
  return String(line).normalize('NFKC').toUpperCase()
    .replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = async function handler(req, res) {
  if (!PROJECT || !SERVICE_KEY || !ACCESS_KEY) return reply(res, 503, { error: 'Archive connection needs Vercel environment settings.' });
  if (!authorized(req)) return reply(res, 401, { error: 'Enter your archive access key.' });
  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const letter = (url.searchParams.get('letter') || '').toUpperCase();
      const q = (url.searchParams.get('q') || '').trim().toUpperCase().replace(/[^A-Z\s]/g, '').slice(0, 80);
      if (letter && !/^[A-Z]$/.test(letter)) return reply(res, 400, { error: 'Choose A through Z.' });
      const filters = ['select=clean_text,letter,status,source_file,created_at', 'order=clean_text.asc', 'limit=100', 'status=eq.APPROVED', 'word_count=gte.3'];
      if (letter) filters.push(`letter=eq.${letter}`);
      if (q) filters.push(`clean_text=ilike.*${encodeURIComponent(q)}*`);
      const {data} = await db(`entries?${filters.join('&')}`);
      return reply(res, 200, { entries: data });
    }
    if (req.method === 'POST') {
      const lines = req.body?.lines;
      if (!Array.isArray(lines) || lines.length < 1 || lines.length > 20) return reply(res, 400, { error: 'Send 1 to 20 lines per batch.' });
      const source = String(req.body?.source || 'WEBSITE_PASTE').slice(0, 120);
      const unique = [...new Set(lines.map(normalize).filter(Boolean))];
      const result = { received: lines.length, added: 0, existing: 0, review: 0, rejected: 0 };
      for (const clean of unique) {
        const words = clean.split(' ');
        if (!/^[A-Z]/.test(clean)) { result.rejected++; continue; }
        const status = words.length >= 3 ? 'APPROVED' : 'REVIEW';
        const hash = crypto.createHash('sha256').update(clean).digest('hex');
        const previous = await db(`entries?select=id&clean_text=eq.${encodeURIComponent(clean)}&limit=1`);
        if (previous.data.length) { result.existing++; continue; }
        const { data } = await db('entries?on_conflict=content_hash', {
          method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
          body: JSON.stringify({ original_text: String(lines.find(s => normalize(s) === clean)),
            clean_text: clean, content_hash: hash, word_count: words.length,
            letter: clean[0], status, source_file: source, source_batch: 'rhymeweaver_website' })
        });
        if (data.length) { result.added++; if (status === 'REVIEW') result.review++; }
        else result.existing++;
      }
      result.existing += lines.length - unique.length;
      return reply(res, 200, result);
    }
    res.setHeader('Allow', 'GET, POST');
    return reply(res, 405, { error: 'Method not allowed' });
  } catch (error) {
    console.error('Archive request failed', error);
    return reply(res, 500, { error: 'Archive request failed. No source file was changed.' });
  }
};
