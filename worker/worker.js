// Daleel AI proxy: a Cloudflare Worker that keeps your API key off the website.
// Setup (Cloudflare dashboard > Workers & Pages > Create > Worker > paste this file):
//   Settings > Variables and secrets:
//     ANTHROPIC_API_KEY  (type: Secret)  your key
//     ALLOWED_ORIGIN     (type: Text)    your site origin, e.g. https://daleel.pages.dev  (no trailing slash, no path)
//     MODEL              (optional)      defaults to claude-haiku-5-5
// Then copy the worker URL into AI_ENDPOINT in index.html.

const LANG_NAMES = {en:'English', ur:'Urdu', te:'Telugu', hi:'Hindi', ar:'Arabic', es:'Spanish'};

function buildPrompt(q, passages, code) {
  const system =
`You are a research assistant inside an app that searches Islamic sources. You explain what the PROVIDED passages say, for an ordinary reader.
Rules:
1. Use ONLY the numbered passages. Never quote or cite Quran, hadith or scholars from memory, and never invent references.
2. Support every claim with the passage ids in square brackets, such as [Q2] or [H1][H3]. Use only ids that appear in the passages.
3. If the passages do not really answer the question, say so plainly instead of stretching them.
4. Hadith grades are given where known. Mention the grade when it affects how much weight a hadith carries. If no grade is given, say the grade is not given.
5. Scholars' opinions and the schools of law (madhhabs) are NOT in the passages. Do not state what any school or scholar holds. You may say that jurists have discussed the topic and that the reader should consult the scholar links on the page.
6. Do not issue a fatwa or tell the reader what is permitted or forbidden in their personal situation. Describe what the texts say.
7. Write in ${LANG_NAMES[code]}. Keep the passage ids exactly as given, in Latin letters.
Format: short sections whose headings start with "## ": Summary; What the Quran says; What the hadith say; Things to keep in mind. Leave out a section if there is nothing for it. Under 350 words. Plain text only, no bold.`;
  const user = 'Question: ' + q + '\n\nPassages:\n' + passages.map(p =>
    '[' + p.id + '] ' + p.ref + (p.grade ? ' (grade: ' + p.grade + ')' : '') + '\n' + p.text).join('\n\n');
  return {system, user};
}

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };
    const reply = (obj, status = 200) => new Response(JSON.stringify(obj), {status, headers: {...cors, 'Content-Type': 'application/json'}});

    if (request.method === 'OPTIONS') return new Response(null, {status: 204, headers: cors});
    if (request.method !== 'POST') return reply({error: 'POST only'}, 405);
    if (env.ALLOWED_ORIGIN && request.headers.get('Origin') !== env.ALLOWED_ORIGIN) return reply({error: 'Origin not allowed'}, 403);

    let b;
    try { b = await request.json(); } catch (e) { return reply({error: 'Bad JSON'}, 400); }
    const {query, language, passages} = b || {};
    if (typeof query !== 'string' || !query.trim() || query.length > 300) return reply({error: 'Bad query'}, 400);
    if (!LANG_NAMES[language]) return reply({error: 'Bad language'}, 400);
    if (!Array.isArray(passages) || !passages.length || passages.length > 12) return reply({error: 'Bad passages'}, 400);
    const clean = [];
    for (const p of passages) {
      if (!p || !/^[QH]\d{1,2}$/.test(p.id) || typeof p.text !== 'string' || typeof p.ref !== 'string') return reply({error: 'Bad passage'}, 400);
      clean.push({id: p.id, ref: p.ref.slice(0, 120), grade: typeof p.grade === 'string' ? p.grade.slice(0, 200) : null, text: p.text.slice(0, 800)});
    }

    const {system, user} = buildPrompt(query.trim(), clean, language);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01'},
      body: JSON.stringify({model: env.MODEL || 'claude-haiku-5-5', max_tokens: 900, system, messages: [{role: 'user', content: user}]})
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return reply({error: (d.error && d.error.message) || 'AI service error'}, 502);
    return reply({text: (d.content || []).filter(x => x.type === 'text').map(x => x.text).join('\n')});
  }
};
