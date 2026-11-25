/* 제미나이 스킬 메이커 - app.js (no build step, no network calls) */
(function () {
  'use strict';

  const APP_VERSION = '1.0.0';
  const STORAGE_KEY = 'gemskill.gems.v1';
  const DRAFT_KEY = 'gemskill.draft.v1';
  const GEMINI_GEM_URL = 'https://gemini.google.com/gems/create';

  /* ---------- 템플릿 ---------- */
  const TEMPLATES = [
    {
      id: 'blank',
      emoji: '📝',
      label: '빈 양식',
      gem: { name: '', persona: '', goal: '', audience: '', tone: '', rules: [''], forbidden: [''], format: '', exampleIn: '', exampleOut: '', references: '' }
    },
    {
      id: 'novel-polish',
      emoji: '✒️',
      label: '소설 문장 다듬기',
      gem: {
        name: '소설 문장 다듬기',
        persona: '20년 경력의 한국 소설 편집자. 작가의 고유한 문체와 목소리를 최대한 존중하면서, 문장을 더 매끄럽고 생생하게 다듬는 전문가.',
        goal: '사용자가 보낸 소설 원고(문장, 문단, 장면)를 뜻과 분위기는 그대로 두고 더 읽기 좋게 고친다. 어색한 표현, 불필요한 반복, 번역투, 주어-서술어 불일치, 시점 혼란을 바로잡는다.',
        audience: '한국어 웹소설·장편소설 독자',
        tone: '정중한 존댓말. 평가는 솔직하되 작가를 존중하는 태도로.',
        rules: [
          '원문의 줄거리, 설정, 인물의 말투는 절대 바꾸지 않는다.',
          '고친 이유는 짧고 구체적으로 설명한다.',
          '문장을 대폭 줄이거나 늘리지 않는다. 길이는 원문의 ±20% 안에서 유지한다.',
          '사용자가 "가볍게"라고 하면 맞춤법과 띄어쓰기, 명백한 비문만 고친다.',
          '애매한 부분은 추측하지 말고 작가에게 질문한다.'
        ],
        forbidden: [
          '작가의 의도를 무시하고 내용을 새로 창작하지 않는다.',
          '한자어·외래어를 과하게 섞지 않는다.',
          '이모지를 사용하지 않는다.'
        ],
        format: '1. **다듬은 글**: 고친 전체 문장을 먼저 보여 준다.\n2. **바꾼 점**: 바꾼 부분과 이유를 bullet로 3~7개.\n3. **다른 제안**: 더 강렬하거나 다른 분위기의 표현 1~2개(선택).',
        exampleIn: '그녀는 매우 슬픈 마음으로 창밖을 바라보았고, 비가 내리고 있었고, 그녀의 눈에서는 눈물이 흘러내리고 있었다.',
        exampleOut: '**다듬은 글**\n그녀는 창밖을 바라보았다. 비가 내리고 있었다. 뺨 위로 눈물이 흘렀다.\n\n**바꾼 점**\n- "매우 슬픈 마음으로"를 삭제: 눈물로 이미 슬픔이 드러나 중복됨.\n- 한 문장을 세 문장으로 분리: 리듬을 만들고 감정을 강조.\n- "눈에서는 눈물이 흘러내리고" → "뺨 위로 눈물이 흘렀다": 번역투 완화.',
        references: ''
      }
    },
    {
      id: 'summarizer',
      emoji: '📄',
      label: '요약가',
      gem: {
        name: '핵심 요약가',
        persona: '긴 글을 빠르게 읽고 핵심만 정확하게 뽑아내는 전문 리서처. 중요한 사실과 숫자를 놓치지 않는다.',
        goal: '사용자가 붙여 넣은 글(기사, 보고서, 회의록, 영상 스크립트 등)을 한국어로 요약한다. 글의 주장, 근거, 결론, 다음 행동을 구분해서 정리한다.',
        audience: '바쁜 직장인. 1분 안에 내용을 파악하고 싶은 사람',
        tone: '간결한 존댓말. 군더더기 없이 핵심만.',
        rules: [
          '원문에 없는 내용을 추가하거나 추측하지 않는다.',
          '숫자, 날짜, 고유명사는 원문 그대로 정확하게 옮긴다.',
          '원문이 외국어여도 요약은 한국어로 쓴다.',
          '사용자가 길이를 지정하면(예: 3줄, 200자) 반드시 지킨다.',
          '원문이 너무 짧거나 요약할 내용이 없으면 그 사실을 알린다.'
        ],
        forbidden: [
          '개인적인 의견이나 평가를 덧붙이지 않는다.',
          '"이 글은 ~에 대해 다룹니다" 같은 서론을 쓰지 않는다.'
        ],
        format: '**한 줄 요약**: (한 문장)\n\n**핵심 내용**:\n- bullet 3~5개\n\n**중요한 숫자·날짜**: (있을 때만)\n\n**다음 행동 / 시사점**: (있을 때만)',
        exampleIn: '',
        exampleOut: '',
        references: ''
      }
    },
    {
      id: 'translator',
      emoji: '🌐',
      label: '번역가',
      gem: {
        name: '자연스러운 번역가',
        persona: '한국어와 영어에 모두 능통한 전문 번역가. 직역이 아니라 원문의 뉘앙스와 의도를 살려 현지인이 쓴 것처럼 자연스럽게 옮긴다.',
        goal: '사용자가 보낸 글을 번역한다. 한국어가 들어오면 영어로, 다른 언어가 들어오면 한국어로 번역한다. 사용자가 목표 언어를 지정하면 그 언어로 번역한다.',
        audience: '이메일, 메시지, 문서를 외국어로 주고받아야 하는 일반 사용자',
        tone: '원문의 격식 수준(존댓말/반말, 공식/비공식)을 그대로 유지한다.',
        rules: [
          '원문의 의미를 빠뜨리거나 더하지 않는다.',
          '관용구나 문화적 표현은 목표 언어에서 자연스러운 표현으로 바꾼다.',
          '고유명사, 제품명, 코드, URL은 번역하지 않는다.',
          '번역이 여러 가지로 가능하면 가장 자연스러운 것을 먼저 주고, 대안을 짧게 덧붙인다.',
          '원문에 오탈자나 모호한 표현이 있으면 번역 뒤에 짧게 알려 준다.'
        ],
        forbidden: [
          '번역 외의 설명이나 잡담을 길게 하지 않는다.',
          '요청하지 않은 요약이나 내용 수정을 하지 않는다.'
        ],
        format: '번역문만 먼저 출력한다. 필요할 때만 그 아래에 "참고:"로 시작하는 짧은 메모(대안 표현, 주의할 점)를 붙인다.',
        exampleIn: '회의 일정 조정 부탁드립니다. 다음 주 화요일 오후는 어떠신지요?',
        exampleOut: 'Could we reschedule the meeting? Would next Tuesday afternoon work for you?\n\n참고: 좀 더 격식 있게 쓰려면 "I would appreciate it if we could reschedule the meeting."도 가능합니다.',
        references: ''
      }
    },
    {
      id: 'study-coach',
      emoji: '📚',
      label: '공부 코치',
      gem: {
        name: '공부 코치',
        persona: '학생의 수준에 맞춰 설명하고 스스로 답을 찾도록 이끄는 친절한 개인 과외 선생님. 답을 바로 알려 주기보다 이해를 돕는 데 집중한다.',
        goal: '사용자가 공부하는 주제를 이해하도록 돕는다. 개념을 쉬운 말로 설명하고, 예시를 들고, 확인 문제를 내서 이해했는지 점검한다. 학습 계획을 요청하면 현실적인 계획을 짜 준다.',
        audience: '중·고등학생 또는 새로운 분야를 독학하는 성인',
        tone: '따뜻하고 격려하는 존댓말. 어려운 용어는 꼭 풀어서 설명.',
        rules: [
          '먼저 사용자의 현재 수준과 목표를 한두 가지 질문으로 파악한다.',
          '한 번에 한 가지 개념만 설명하고, 이해했는지 확인한 뒤 넘어간다.',
          '설명은 "비유 → 정의 → 예시 → 확인 문제" 순서로 한다.',
          '틀린 답에는 왜 틀렸는지 짚고, 다시 시도할 기회를 준다.',
          '숙제나 시험 문제는 바로 답을 주지 말고 풀이 과정을 함께 밟는다.'
        ],
        forbidden: [
          '사용자를 무시하거나 비교하는 말을 하지 않는다.',
          '확실하지 않은 사실을 단정하지 않는다. 모르면 모른다고 말한다.'
        ],
        format: '짧은 문단과 bullet를 섞어 읽기 쉽게. 수식은 필요할 때만. 마지막에는 항상 확인 문제 1개 또는 다음 단계 제안을 붙인다.',
        exampleIn: '',
        exampleOut: '',
        references: ''
      }
    },
    {
      id: 'blog-writer',
      emoji: '✍️',
      label: '블로그 글쓰기',
      gem: {
        name: '블로그 글쓰기 도우미',
        persona: '검색 유입과 완독률을 모두 잘 아는 한국어 블로그 콘텐츠 작가. 정보성 글을 읽기 쉽고 신뢰감 있게 쓴다.',
        goal: '사용자가 주는 주제, 키워드, 메모를 바탕으로 블로그 글을 쓴다. 제목 후보, 목차, 본문, 마무리(CTA)까지 완성한다. 사용자가 초안을 주면 구조와 문장을 다듬는다.',
        audience: '네이버·티스토리 블로그 독자. 해당 주제를 검색해서 들어온 일반인',
        tone: '친근한 존댓말("~해요" 체). 과장 없이 솔직하게.',
        rules: [
          '글을 쓰기 전에 주제, 독자, 글의 목적(정보/후기/홍보), 원하는 길이를 모르면 먼저 묻는다.',
          '도입부 3문장 안에 독자가 얻을 것을 분명히 말한다.',
          '소제목(H2/H3)을 사용해 훑어 읽어도 내용이 파악되게 한다.',
          '핵심 키워드는 제목, 첫 문단, 소제목 중 한 곳 이상에 자연스럽게 넣는다.',
          '사실 확인이 필요한 수치나 주장은 [확인 필요]라고 표시한다.'
        ],
        forbidden: [
          '근거 없는 과장("무조건", "100%", "최고")을 쓰지 않는다.',
          '같은 표현을 반복하지 않는다.',
          'AI가 썼다는 느낌이 나는 상투적 문장("이 글에서는 ~에 대해 알아보겠습니다")을 쓰지 않는다.'
        ],
        format: '1. 제목 후보 3개\n2. 목차\n3. 본문 (Markdown, 소제목 포함)\n4. 마무리 한 문단 + 독자에게 던지는 질문 또는 행동 제안\n5. 해시태그 5~8개',
        exampleIn: '',
        exampleOut: '',
        references: ''
      }
    }
  ];

  /* ---------- 유틸 ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'g-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() { return new Date().toISOString(); }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function cleanList(arr) {
    return (Array.isArray(arr) ? arr : []).map((s) => String(s || '').trim()).filter(Boolean);
  }

  function safeFilename(name, ext) {
    const base = String(name || 'gem').replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 60) || 'gem';
    return `${base}.${ext}`;
  }

  function emptyGem() {
    return { id: '', name: '', persona: '', goal: '', audience: '', tone: '', rules: [''], forbidden: [''], format: '', exampleIn: '', exampleOut: '', references: '', createdAt: '', updatedAt: '' };
  }

  function normalizeGem(raw) {
    const g = emptyGem();
    if (!raw || typeof raw !== 'object') return g;
    g.id = typeof raw.id === 'string' ? raw.id : '';
    ['name', 'persona', 'goal', 'audience', 'tone', 'format', 'exampleIn', 'exampleOut', 'references', 'createdAt', 'updatedAt'].forEach((k) => {
      g[k] = typeof raw[k] === 'string' ? raw[k] : '';
    });
    g.rules = Array.isArray(raw.rules) ? raw.rules.map((s) => String(s || '')) : (typeof raw.rules === 'string' ? raw.rules.split('\n') : []);
    g.forbidden = Array.isArray(raw.forbidden) ? raw.forbidden.map((s) => String(s || '')) : (typeof raw.forbidden === 'string' ? raw.forbidden.split('\n') : []);
    return g;
  }

  /* ---------- 지침 생성 ---------- */
  function buildInstruction(g) {
    const name = (g.name || '').trim();
    const persona = (g.persona || '').trim();
    const goal = (g.goal || '').trim();
    const audience = (g.audience || '').trim();
    const tone = (g.tone || '').trim();
    const rules = cleanList(g.rules);
    const forbidden = cleanList(g.forbidden);
    const format = (g.format || '').trim();
    const exIn = (g.exampleIn || '').trim();
    const exOut = (g.exampleOut || '').trim();
    const refs = (g.references || '').trim();

    if (!name && !persona && !goal && !audience && !tone && !rules.length && !forbidden.length && !format && !exIn && !exOut && !refs) {
      return '';
    }

    const out = [];

    // 역할 (페르소나)
    const role = [];
    if (name) role.push(`당신은 「${name}」입니다.`);
    if (persona) role.push(persona);
    if (tone) role.push(`말투와 문체: ${tone}`);
    out.push('# 역할\n' + (role.length ? role.join('\n') : '(역할을 입력하세요)'));

    // 목표 (할 일)
    out.push('# 목표\n' + (goal || '(목표를 입력하세요)'));

    // 맥락 (대상 독자)
    if (audience) out.push(`# 대상 독자\n${audience}\n위 독자가 이해하기 쉽고 유용하다고 느끼도록 답변합니다.`);

    // 규칙
    if (rules.length) out.push('# 규칙\n' + rules.map((r, i) => `${i + 1}. ${r}`).join('\n'));

    // 금지
    if (forbidden.length) out.push('# 금지\n' + forbidden.map((r) => `- ${r}`).join('\n'));

    // 출력 형식
    if (format) out.push('# 출력 형식\n' + format);

    // 예시
    if (exIn || exOut) {
      const ex = [];
      if (exIn) ex.push('## 입력 예시\n' + exIn);
      if (exOut) ex.push('## 출력 예시\n' + exOut);
      out.push('# 예시\n' + ex.join('\n\n'));
    }

    // 참고 자료
    if (refs) out.push('# 참고 자료\n' + refs);

    return out.join('\n\n') + '\n';
  }

  function buildRefinePrompt(g) {
    const instruction = buildInstruction(g).trim();
    const name = (g.name || '').trim() || '(이름 미정)';
    return [
      '당신은 Google Gemini의 Gem(맞춤 지침) 작성 전문가입니다.',
      `아래는 제가 만들고 있는 Gem 「${name}」의 지침 초안입니다. 이 초안을 더 명확하고 효과적인 지침으로 다듬어 주세요.`,
      '',
      '## 다듬을 때 지킬 것',
      '1. Google의 Gem 작성 가이드(페르소나 · 할 일 · 맥락 · 형식)에 맞춰 구조를 점검하고 빠진 요소를 보완합니다.',
      '2. 모호하거나 서로 충돌하는 규칙은 구체적이고 측정 가능한 문장으로 고칩니다.',
      '3. 제가 적은 의도와 핵심 내용은 유지하고, 임의로 새로운 목적을 추가하지 않습니다.',
      '4. 한국어로 작성하고, 기존처럼 Markdown 제목(# 역할, # 목표, # 규칙, # 금지, # 출력 형식, # 예시)을 유지합니다.',
      '5. 예시가 없거나 약하면 실제 입력/출력 예시를 1쌍 추가합니다.',
      '6. 전체 길이는 원문의 2배를 넘지 않게 합니다.',
      '',
      '## 출력 방법',
      '- 먼저 "## 개선 포인트"에 무엇을 왜 바꿨는지 bullet 3~6개로 짧게 설명합니다.',
      '- 그다음 "## 완성된 지침" 아래에 바로 복사해서 쓸 수 있는 지침 전문을 코드 블록 없이 출력합니다.',
      '',
      '---',
      '## 지침 초안',
      instruction || '(아직 내용이 없습니다. 아래 정보를 바탕으로 지침을 처음부터 작성해 주세요.)',
      '---'
    ].join('\n');
  }

  /* ---------- 저장소 ---------- */
  function loadGems() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.map(normalizeGem).filter((g) => g.id);
    } catch (e) {
      console.warn('보관함 불러오기 실패', e);
      return [];
    }
  }

  function saveGems(gems) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gems));
      return true;
    } catch (e) {
      console.error('보관함 저장 실패', e);
      toast('저장에 실패했어요. 저장 공간이 부족할 수 있어요.');
      return false;
    }
  }

  function saveDraft(g) {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(g)); } catch (e) { /* ignore */ }
  }
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? normalizeGem(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  /* ---------- 상태 ---------- */
  let gems = loadGems();
  let searchQuery = '';
  let deferredInstallPrompt = null;

  /* ---------- DOM ---------- */
  const form = $('#gem-form');
  const fields = {
    id: $('#f-id'),
    name: $('#f-name'),
    persona: $('#f-persona'),
    goal: $('#f-goal'),
    audience: $('#f-audience'),
    tone: $('#f-tone'),
    format: $('#f-format'),
    exampleIn: $('#f-example-in'),
    exampleOut: $('#f-example-out'),
    references: $('#f-references')
  };
  const rulesList = $('#rules-list');
  const forbiddenList = $('#forbidden-list');
  const previewEl = $('#preview');
  const previewCount = $('#preview-count');
  const saveStatus = $('#save-status');
  const toastEl = $('#toast');

  /* ---------- 폼 <-> 모델 ---------- */
  function readForm() {
    const g = emptyGem();
    g.id = fields.id.value || '';
    g.name = fields.name.value;
    g.persona = fields.persona.value;
    g.goal = fields.goal.value;
    g.audience = fields.audience.value;
    g.tone = fields.tone.value;
    g.format = fields.format.value;
    g.exampleIn = fields.exampleIn.value;
    g.exampleOut = fields.exampleOut.value;
    g.references = fields.references.value;
    g.rules = $$('textarea', rulesList).map((t) => t.value);
    g.forbidden = $$('textarea', forbiddenList).map((t) => t.value);
    return g;
  }

  function writeForm(g) {
    const n = normalizeGem(g);
    fields.id.value = n.id || '';
    fields.name.value = n.name;
    fields.persona.value = n.persona;
    fields.goal.value = n.goal;
    fields.audience.value = n.audience;
    fields.tone.value = n.tone;
    fields.format.value = n.format;
    fields.exampleIn.value = n.exampleIn;
    fields.exampleOut.value = n.exampleOut;
    fields.references.value = n.references;
    renderList(rulesList, n.rules.length ? n.rules : [''], '규칙');
    renderList(forbiddenList, n.forbidden.length ? n.forbidden : [''], '금지 사항');
    // 선택 섹션에 내용이 있으면 펼침
    $$('details.collapsible').forEach((d) => {
      const has = $$('textarea', d).some((t) => t.value.trim());
      if (has) d.open = true;
    });
    autoGrowAll();
    updatePreview();
  }

  function renderList(container, items, placeholder) {
    container.innerHTML = '';
    items.forEach((val) => container.appendChild(makeListItem(val, placeholder)));
    renumber(container);
  }

  function makeListItem(value, placeholder) {
    const row = document.createElement('div');
    row.className = 'list-item';
    const idx = document.createElement('span');
    idx.className = 'idx';
    const ta = document.createElement('textarea');
    ta.rows = 1;
    ta.value = value || '';
    ta.placeholder = `${placeholder} 입력`;
    ta.addEventListener('input', () => autoGrow(ta));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        const next = makeListItem('', placeholder);
        row.after(next);
        renumber(row.parentElement);
        $('textarea', next).focus();
        onFormChange();
      }
    });
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'remove';
    rm.title = '삭제';
    rm.setAttribute('aria-label', '항목 삭제');
    rm.textContent = '×';
    rm.addEventListener('click', () => {
      const parent = row.parentElement;
      if (parent.children.length === 1) {
        ta.value = '';
        autoGrow(ta);
      } else {
        row.remove();
      }
      renumber(parent);
      onFormChange();
    });
    row.append(idx, ta, rm);
    return row;
  }

  function renumber(container) {
    $$('.list-item .idx', container).forEach((el, i) => { el.textContent = String(i + 1); });
  }

  function autoGrow(ta) {
    ta.style.height = 'auto';
    ta.style.height = Math.max(42, ta.scrollHeight + 2) + 'px';
  }
  function autoGrowAll() {
    $$('.list-item textarea').forEach(autoGrow);
  }

  /* ---------- 미리보기 ---------- */
  function updatePreview() {
    const g = readForm();
    const text = buildInstruction(g);
    previewEl.textContent = text;
    previewCount.textContent = text ? `${text.length.toLocaleString()}자` : '';
    return text;
  }

  let draftTimer = null;
  function onFormChange() {
    updatePreview();
    saveStatus.textContent = '';
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => saveDraft(readForm()), 300);
  }

  /* ---------- 클립보드 / 다운로드 ---------- */
  async function copyText(text) {
    if (!text) { toast('복사할 내용이 없어요.'); return false; }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('clipboard API unavailable');
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        return ok;
      } catch (e2) {
        return false;
      }
    }
  }

  function download(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------- 토스트 ---------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- 템플릿 ---------- */
  function renderTemplates() {
    const wrap = $('#template-list');
    wrap.innerHTML = '';
    TEMPLATES.forEach((t) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.setAttribute('role', 'listitem');
      b.dataset.template = t.id;
      b.innerHTML = `<span class="emoji">${t.emoji}</span><span>${t.label}</span>`;
      b.addEventListener('click', () => applyTemplate(t));
      wrap.appendChild(b);
    });
  }

  function formHasContent() {
    const g = readForm();
    return !!buildInstruction(g).trim();
  }

  function applyTemplate(t) {
    if (formHasContent() && !confirm(`현재 작성 중인 내용을 「${t.label}」 템플릿으로 바꿀까요?\n(보관함에 저장한 Gem은 그대로 남아요.)`)) return;
    const g = normalizeGem(Object.assign({}, t.gem));
    g.id = '';
    writeForm(g);
    saveDraft(readForm());
    saveStatus.textContent = t.id === 'blank' ? '' : `「${t.label}」 템플릿을 불러왔어요. 자유롭게 수정하세요.`;
    toast(t.id === 'blank' ? '빈 양식으로 시작해요.' : `「${t.label}」 템플릿 적용`);
    fields.name.focus({ preventScroll: true });
    $('#gem-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- 보관함 ---------- */
  function upsertGem(g) {
    const now = nowIso();
    const idx = gems.findIndex((x) => x.id === g.id);
    if (idx >= 0) {
      g.createdAt = gems[idx].createdAt || now;
      g.updatedAt = now;
      gems[idx] = g;
    } else {
      g.id = g.id || uid();
      g.createdAt = now;
      g.updatedAt = now;
      gems.unshift(g);
    }
    saveGems(gems);
    return g;
  }

  function renderLibrary() {
    const list = $('#library-list');
    const empty = $('#library-empty');
    const q = searchQuery.trim().toLowerCase();
    const sorted = gems.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const filtered = q
      ? sorted.filter((g) => [g.name, g.persona, g.goal, g.audience, g.tone].join(' ').toLowerCase().includes(q))
      : sorted;

    $('#library-count').textContent = gems.length ? `${filtered.length} / ${gems.length}개` : '';
    list.innerHTML = '';
    empty.hidden = gems.length > 0;
    if (gems.length && !filtered.length) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.textContent = '검색 결과가 없어요.';
      list.appendChild(li);
      return;
    }

    filtered.forEach((g) => {
      const li = document.createElement('li');
      li.className = 'lib-item';
      li.dataset.id = g.id;
      const title = document.createElement('div');
      title.className = 'title';
      title.textContent = g.name || '(이름 없음)';
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `수정 ${fmtDate(g.updatedAt)} · 규칙 ${cleanList(g.rules).length}개`;
      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = (g.goal || g.persona || '').trim();
      const actions = document.createElement('div');
      actions.className = 'actions';
      actions.innerHTML = `
        <button type="button" class="btn btn-small btn-primary" data-act="edit">편집</button>
        <button type="button" class="btn btn-small btn-outline" data-act="copy">복사</button>
        <button type="button" class="btn btn-small btn-outline" data-act="dup">복제</button>
        <button type="button" class="btn btn-small btn-outline" data-act="md">.md</button>
        <button type="button" class="btn btn-small btn-outline" data-act="txt">.txt</button>
        <button type="button" class="btn btn-small btn-outline btn-danger" data-act="del">삭제</button>`;
      li.append(title, meta, desc, actions);
      list.appendChild(li);
    });
  }

  function onLibraryClick(e) {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const li = btn.closest('.lib-item');
    const g = gems.find((x) => x.id === li.dataset.id);
    if (!g) return;
    const act = btn.dataset.act;
    if (act === 'edit') {
      writeForm(g);
      saveDraft(readForm());
      showView('builder');
      saveStatus.textContent = `「${g.name}」을(를) 불러왔어요.`;
      window.scrollTo({ top: 0 });
    } else if (act === 'copy') {
      copyText(buildInstruction(g)).then((ok) => toast(ok ? '지침을 복사했어요.' : '복사에 실패했어요.'));
    } else if (act === 'dup') {
      const copy = normalizeGem(JSON.parse(JSON.stringify(g)));
      copy.id = uid();
      copy.name = (g.name || '') + ' (복사본)';
      upsertGem(copy);
      renderLibrary();
      toast('복제했어요.');
    } else if (act === 'md' || act === 'txt') {
      download(safeFilename(g.name, act), buildInstruction(g), act === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
    } else if (act === 'del') {
      if (!confirm(`「${g.name || '이름 없음'}」을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
      gems = gems.filter((x) => x.id !== g.id);
      saveGems(gems);
      if (fields.id.value === g.id) fields.id.value = '';
      renderLibrary();
      toast('삭제했어요.');
    }
  }

  /* ---------- 백업 ---------- */
  function exportAll() {
    if (!gems.length) { toast('내보낼 Gem이 없어요.'); return; }
    const payload = { app: 'gemskill', version: 1, exportedAt: nowIso(), gems: gems };
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    download(`gemskill-backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    toast(`${gems.length}개를 내보냈어요.`);
  }

  function importFromText(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { toast('JSON 파일을 읽을 수 없어요.'); return; }
    let incoming = Array.isArray(data) ? data : (data && Array.isArray(data.gems) ? data.gems : null);
    if (!incoming) { toast('이 앱의 백업 파일이 아니에요.'); return; }
    incoming = incoming.map(normalizeGem).filter((g) => g.name || g.persona || g.goal);
    if (!incoming.length) { toast('가져올 Gem이 없어요.'); return; }

    let replace = false;
    if (gems.length > 0) {
      const merge = confirm(`${incoming.length}개의 Gem을 찾았어요.\n\n[확인] 기존 보관함에 합치기 (같은 Gem은 덮어씀)\n[취소] 다른 방법 선택`);
      if (!merge) {
        replace = confirm('기존 보관함을 모두 지우고 백업 내용으로 교체할까요?\n(되돌릴 수 없어요)');
        if (!replace) { toast('가져오기를 취소했어요.'); return; }
      }
    }
    let added = 0, updated = 0;
    if (replace) gems = [];
    incoming.forEach((g) => {
      if (!g.id) g.id = uid();
      if (!g.createdAt) g.createdAt = nowIso();
      if (!g.updatedAt) g.updatedAt = g.createdAt;
      const idx = gems.findIndex((x) => x.id === g.id);
      if (idx >= 0) { gems[idx] = g; updated++; } else { gems.push(g); added++; }
    });
    saveGems(gems);
    renderLibrary();
    toast(replace ? `${incoming.length}개로 교체했어요.` : `추가 ${added}개, 갱신 ${updated}개`);
  }

  /* ---------- 화면 전환 ---------- */
  function showView(name) {
    $$('.view').forEach((v) => { v.hidden = v.dataset.view !== name; });
    $$('.nav-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.nav === name));
    if (name === 'library') renderLibrary();
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ }
  }

  /* ---------- 이벤트 ---------- */
  function bind() {
    form.addEventListener('input', onFormChange);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = readForm();
      if (!g.name.trim()) { fields.name.focus(); toast('Gem 이름을 입력해 주세요.'); return; }
      if (!g.persona.trim() && !g.goal.trim()) { fields.persona.focus(); toast('역할이나 목표 중 하나는 적어 주세요.'); return; }
      g.rules = cleanList(g.rules);
      g.forbidden = cleanList(g.forbidden);
      const saved = upsertGem(g);
      fields.id.value = saved.id;
      saveDraft(readForm());
      saveStatus.textContent = `보관함에 저장했어요 (${fmtDate(saved.updatedAt)})`;
      toast('보관함에 저장했어요.');
    });

    $$('button[data-add]').forEach((b) => {
      b.addEventListener('click', () => {
        const which = b.dataset.add;
        const container = which === 'rules' ? rulesList : forbiddenList;
        const item = makeListItem('', which === 'rules' ? '규칙' : '금지 사항');
        container.appendChild(item);
        renumber(container);
        $('textarea', item).focus();
        onFormChange();
      });
    });

    $('#new-btn').addEventListener('click', () => {
      if (formHasContent() && !confirm('작성 중인 내용을 지우고 새로 시작할까요?\n(보관함에 저장한 Gem은 그대로 남아요.)')) return;
      writeForm(emptyGem());
      saveDraft(readForm());
      saveStatus.textContent = '';
      fields.name.focus();
    });

    $('#copy-btn').addEventListener('click', async () => {
      const text = updatePreview();
      const ok = await copyText(text);
      toast(ok ? '지침을 복사했어요. Gemini에 붙여 넣으세요.' : '복사에 실패했어요. 미리보기를 길게 눌러 복사해 주세요.');
    });

    $('#export-md-btn').addEventListener('click', () => {
      const g = readForm();
      const text = buildInstruction(g);
      if (!text) { toast('내보낼 내용이 없어요.'); return; }
      download(safeFilename(g.name, 'md'), text, 'text/markdown;charset=utf-8');
    });
    $('#export-txt-btn').addEventListener('click', () => {
      const g = readForm();
      const text = buildInstruction(g);
      if (!text) { toast('내보낼 내용이 없어요.'); return; }
      download(safeFilename(g.name, 'txt'), text, 'text/plain;charset=utf-8');
    });

    const refineDialog = $('#refine-dialog');
    $('#refine-btn').addEventListener('click', () => {
      $('#refine-text').textContent = buildRefinePrompt(readForm());
      if (typeof refineDialog.showModal === 'function') refineDialog.showModal();
      else refineDialog.setAttribute('open', '');
    });
    $('#refine-copy-btn').addEventListener('click', async () => {
      const ok = await copyText($('#refine-text').textContent);
      toast(ok ? '다듬기 프롬프트를 복사했어요.' : '복사에 실패했어요.');
    });
    refineDialog.addEventListener('click', (e) => { if (e.target === refineDialog) refineDialog.close(); });

    $('#library-list').addEventListener('click', onLibraryClick);
    $('#search').addEventListener('input', (e) => { searchQuery = e.target.value; renderLibrary(); });
    $('#export-all-btn').addEventListener('click', exportAll);
    $('#import-btn').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => importFromText(String(reader.result || ''));
      reader.onerror = () => toast('파일을 읽을 수 없어요.');
      reader.readAsText(file, 'utf-8');
      e.target.value = '';
    });

    $$('.nav-btn').forEach((b) => b.addEventListener('click', () => showView(b.dataset.nav)));

    // 설치 버튼
    const installBtn = $('#install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      installBtn.hidden = false;
    });
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch (e) { /* ignore */ }
      deferredInstallPrompt = null;
      installBtn.hidden = true;
    });
    window.addEventListener('appinstalled', () => { installBtn.hidden = true; toast('홈 화면에 설치됐어요.'); });

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) { gems = loadGems(); renderLibrary(); }
    });
  }

  /* ---------- 서비스 워커 ---------- */
  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener('statechange', () => {
            if (nw.state === 'installed' && navigator.serviceWorker.controller) {
              toast('새 버전이 준비됐어요. 다시 열면 적용돼요.');
            }
          });
        });
      }).catch((err) => console.warn('SW 등록 실패', err));
    });
  }

  /* ---------- 시작 ---------- */
  function init() {
    $('#app-version').textContent = APP_VERSION;
    renderTemplates();
    const draft = loadDraft();
    writeForm(draft || emptyGem());
    bind();
    const hash = (location.hash || '').replace('#', '');
    showView(['builder', 'library', 'help'].includes(hash) ? hash : 'builder');
    registerSW();
  }

  // 테스트/디버그용 최소 노출
  window.GemSkill = { buildInstruction, buildRefinePrompt, TEMPLATES, version: APP_VERSION };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
