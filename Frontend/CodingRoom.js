// ─────────────────────────────────────────────────────────────────────────────
// CodingRoom.js — Handles the full coding challenge flow
// ─────────────────────────────────────────────────────────────────────────────

let monacoEditor = null;
let currentProblem = null;
let timerInterval = null;
let timeLeft = 30 * 60; // 30 minutes in seconds

// ─────────────────────────────────────────────────────────────────────────────
// Role → DSA Topic map (mirrors problemSelectorService.js on backend)
// Used to pick a relevant problem from Code-Judger's problem list
// ─────────────────────────────────────────────────────────────────────────────
const ROLE_TOPIC_MAP = {
    "Frontend Developer":          ["Arrays", "Strings", "Recursion", "Sorting"],
    "Backend Developer":           ["Graphs", "Trees", "Hashing", "Sorting", "Greedy"],
    "Full Stack Developer":        ["Arrays", "Strings", "Trees", "Hashing"],
    "Software Engineer":           ["Dynamic Programming", "Graphs", "Trees", "Sorting"],
    "Node.js Developer":           ["Graphs", "Hashing", "Strings", "Queues"],
    "React Developer":             ["Arrays", "Strings", "Recursion"],
    "Mobile App Developer":        ["Arrays", "Trees", "Graphs"],
    "iOS Developer":               ["Arrays", "Strings", "Trees"],
    "Android Developer":           ["Arrays", "Graphs", "Dynamic Programming"],
    "AI Engineer":                 ["Dynamic Programming", "Math", "Graphs"],
    "Machine Learning Engineer":   ["Math", "Arrays", "Dynamic Programming"],
    "Data Engineer":               ["Graphs", "Sorting", "Hashing"],
    "Data Scientist":              ["Math", "Dynamic Programming", "Sorting"],
    "DevOps Engineer":             ["Graphs", "Trees", "Strings"],
    "Cloud Engineer":              ["Graphs", "Greedy", "Sorting"],
    "Security Engineer":           ["Bit Manipulation", "Strings", "Hashing"],
    "Cybersecurity Analyst":       ["Strings", "Hashing", "Bit Manipulation"],
    "QA Automation Engineer":      ["Arrays", "Strings", "Recursion"],
    "QA/Test Automation Engineer": ["Arrays", "Strings", "Recursion"],
    "Embedded Systems Engineer":   ["Bit Manipulation", "Arrays", "Math"],
    "UI/UX Designer":              ["Arrays", "Strings"]
};


// ─────────────────────────────────────────────────────────────────────────────
// Init Monaco Editor
// Monaco loads asynchronously. After it's ready, we check if the problem
// was already fetched and apply its starter code from the DB directly.
// This prevents the race condition where renderProblem runs before Monaco loads.
// ─────────────────────────────────────────────────────────────────────────────
function initMonaco(language = 'python') {
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
    require(['vs/editor/editor.main'], () => {
        monacoEditor = monaco.editor.create(document.getElementById('editorContainer'), {
            value: '',   // always start empty — DB starter code applied after problem loads
            language: language === 'cpp' ? 'cpp' : (language === 'java' ? 'java' : language),
            theme: 'vs-dark',
            fontSize: 14,
            fontFamily: '"JetBrains Mono", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            roundedSelection: true,
            padding: { top: 12, bottom: 12 }
        });

        // If problem was already fetched before Monaco finished loading,
        // apply the DB starter code now.
        const lang = document.getElementById('languageSelect').value;
        if (currentProblem?.starterCode?.[lang]) {
            monacoEditor.setValue(currentProblem.starterCode[lang]);
        }
        // If problem isn't loaded yet, renderProblem() will set it once it arrives.
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Timer
// ─────────────────────────────────────────────────────────────────────────────
function startTimer() {
    const timerEl = document.getElementById('timer');
    timerInterval = setInterval(() => {
        timeLeft--;
        const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
        const s = String(timeLeft % 60).padStart(2, '0');
        timerEl.textContent = `${m}:${s}`;

        if (timeLeft <= 300) timerEl.classList.add('text-red-400');  // red in last 5 min
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerEl.textContent = '00:00';
            submitCode(true); // auto-submit on timeout
        }
    }, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Render Problem
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Render Problem — handles Code-Judger schema
// Code-Judger problem shape:
//   { title, slug, difficulty, topic[], description, constraints[],
//     starterCode: { python, java, cpp }, ... }
// sampleCases shape (from TestCase collection):
//   [{ input, expectedOutput, order }]
// ─────────────────────────────────────────────────────────────────────────────
function renderProblem(problem, sampleCases = []) {
    currentProblem = problem;
    // Attach sampleCases to problem object so submitCode can access them
    currentProblem.sampleCases = sampleCases;

    document.getElementById('problemTitle').textContent = problem.title || 'Untitled Problem';

    // Difficulty badge
    const badge = document.getElementById('difficultyBadge');
    badge.textContent = problem.difficulty || 'Medium';
    badge.className = `text-xs font-bold px-2.5 py-1 rounded-full badge-${problem.difficulty || 'Medium'}`;

    document.getElementById('problemDescription').textContent = problem.description || '';

    // Examples — Code-Judger stores test cases separately as sampleCases
    // We display them in the Examples section
    const examplesSection = document.getElementById('examplesSection');
    const examplesList    = document.getElementById('examplesList');
    if (sampleCases && sampleCases.length > 0) {
        examplesList.innerHTML = sampleCases.map((tc, i) => `
            <div class="bg-gray-800 rounded-lg p-3 text-sm font-mono">
                <p class="text-gray-400 mb-1">Example ${i + 1}:</p>
                <p class="text-gray-200"><span class="text-gray-500">Input:</span>  ${tc.input || ''}</p>
                <p class="text-gray-200"><span class="text-gray-500">Output:</span> ${tc.expectedOutput || ''}</p>
            </div>
        `).join('');
    } else {
        examplesSection.classList.add('hidden');
    }

    // Constraints
    const constraintsSection = document.getElementById('constraintsSection');
    const constraintsList    = document.getElementById('constraintsList');
    if (problem.constraints && problem.constraints.length > 0) {
        constraintsList.innerHTML = problem.constraints.map(c =>
            `<li class="text-gray-400 text-xs">${c}</li>`
        ).join('');
    } else {
        constraintsSection.classList.add('hidden');
    }

    // Tags — Code-Judger uses 'topic' array instead of 'tags'
    const tagsSection = document.getElementById('tagsSection');
    const tagsList    = document.getElementById('tagsList');
    const topics = problem.topic || problem.tags || [];
    if (topics.length > 0) {
        tagsList.innerHTML = topics.map(t =>
            `<span class="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">${t}</span>`
        ).join('');
    } else {
        tagsSection.classList.add('hidden');
    }

    // Starter code — only use what comes from the DB (no generic fallbacks)
    // If Monaco is already ready → set immediately
    // If Monaco isn't ready yet → initMonaco's onReady callback handles it
    if (monacoEditor) {
        const lang = document.getElementById('languageSelect').value;
        monacoEditor.setValue(problem.starterCode?.[lang] || '');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Tests — POST /api/code/run/batch (visible sample test cases only)
// Code-Judger returns: { sampleResults: [...], customResults: [...] }
// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
    if (!monacoEditor || !currentProblem) return;

    const runBtn         = document.getElementById('runBtn');
    const testResults    = document.getElementById('testResults');
    const testResultsList= document.getElementById('testResultsList');
    const status         = document.getElementById('submissionStatus');

    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    status.textContent = 'Running visible test cases...';
    testResults.classList.remove('hidden');
    testResultsList.innerHTML = '<p class="text-gray-500 text-xs">Executing...</p>';

    const code     = monacoEditor.getValue();
    const language = document.getElementById('languageSelect').value;

    try {
        // ✅ Correct endpoint: POST /run/batch
        // Proxied: main backend /api/code/run/batch → Code-Judger /run/batch
        const response = await fetch('/api/code/run/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                problemId:   currentProblem._id,
                language,
                code,
                customCases: []  // no custom inputs for Run Tests
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Code-Judger unavailable');
        }

        // ✅ Correct response shape: { sampleResults, customResults }
        const data = await response.json();
        const results = data.sampleResults || [];

        // Normalise to { passed, expected, actual } for renderTestResults
        const normalised = results.map(r => ({
            passed:   r.passed,
            expected: r.expectedOutput ?? '',
            actual:   r.output ?? r.error ?? 'Error'
        }));

        renderTestResults(normalised);
        status.textContent = '';

    } catch (err) {
        testResultsList.innerHTML = `<p class="text-red-400 text-xs">⚠️ ${err.message}</p>`;
        status.textContent = '';
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = `
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Run Tests`;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Render test case results
// ─────────────────────────────────────────────────────────────────────────────
function renderTestResults(results) {
    const list = document.getElementById('testResultsList');
    if (!results.length) {
        list.innerHTML = '<p class="text-gray-500 text-xs">No test results.</p>';
        return;
    }
    list.innerHTML = results.map((r, i) => `
        <div class="flex items-center gap-3">
            <span class="${r.passed ? 'test-pass' : 'test-fail'} font-bold">${r.passed ? '✅' : '❌'}</span>
            <span class="text-gray-400 text-xs">Case ${i + 1}</span>
            <span class="text-gray-600 text-xs">
              → Expected: <span class="text-gray-300">${r.expected}</span>
              | Got: <span class="${r.passed ? 'text-emerald-400' : 'text-red-400'}">${r.actual}</span>
            </span>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Poll submission status until Completed (Code-Judger is async / queue-based)
// GET /api/code/submissions/status/:submissionId
// Returns: { status: 'Pending' } → ... → { status: 'Completed', result: {...} }
// ─────────────────────────────────────────────────────────────────────────────
async function pollSubmissionStatus(submissionId, statusEl, maxWaitMs = 30000) {
    const pollInterval = 1500; // poll every 1.5s
    const deadline     = Date.now() + maxWaitMs;

    return new Promise((resolve) => {
        const interval = setInterval(async () => {
            try {
                const res  = await fetch(`/api/code/submissions/status/${submissionId}`, {
                    credentials: 'include'
                });
                const data = await res.json();

                if (data.status === 'Completed') {
                    clearInterval(interval);
                    resolve(data.result || {});
                } else if (Date.now() >= deadline) {
                    clearInterval(interval);
                    statusEl.textContent = '⚠️ Judging timed out.';
                    resolve({});
                } else {
                    statusEl.textContent = `⏳ Judging... (${data.status})`;
                }
            } catch {
                if (Date.now() >= deadline) {
                    clearInterval(interval);
                    resolve({});
                }
            }
        }, pollInterval);
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Submit Code — POST /api/code/submit → async queue → poll for result
// Code-Judger flow:
//   Step 1: POST /submit → { submissionId, status: 'Pending' }
//   Step 2: Poll GET /submissions/status/:submissionId until 'Completed'
//   Step 3: Read result.passed + result.total
// ─────────────────────────────────────────────────────────────────────────────
async function submitCode(timedOut = false) {
    if (!monacoEditor || !currentProblem) return;

    // Stop the countdown timer
    clearInterval(timerInterval);

    const submitBtn = document.getElementById('submitBtn');
    const runBtn    = document.getElementById('runBtn');
    const status    = document.getElementById('submissionStatus');

    // Disable both buttons during submission
    submitBtn.disabled = true;
    runBtn.disabled    = true;
    submitBtn.textContent = 'Submitting...';
    status.textContent = timedOut ? '⏱ Time up! Auto-submitting...' : 'Submitting solution...';

    const code      = monacoEditor.getValue();
    const language  = document.getElementById('languageSelect').value;
    const sessionId = new URLSearchParams(window.location.search).get('sessionId');

    let testCasesPassed = 0;
    let totalTestCases  = 0;
    let submissionSuccess = false;

    try {
        // ✅ Step 1: POST /submit — queues the job, returns submissionId immediately
        const submitRes = await fetch('/api/code/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                problemId: currentProblem._id,
                language,
                code
            })
        });

        if (!submitRes.ok) {
            const errData = await submitRes.json().catch(() => ({}));
            throw new Error(errData.message || 'Code-Judger unavailable or submission failed.');
        }

        const { submissionId } = await submitRes.json();

        if (submissionId) {
            // ✅ Step 2: Poll until judging completes
            status.textContent = '⏳ Code submitted! Judging in progress...';
            const result = await pollSubmissionStatus(submissionId, status);

            // ✅ Step 3: Read passed/total from the completed result
            testCasesPassed = result.passed ?? 0;
            totalTestCases  = result.total  ?? 0;

            // Show verdict in results panel
            const verdictColor = result.verdict === 'Accepted' ? 'text-emerald-400' : 'text-red-400';
            document.getElementById('testResultsList').innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="${verdictColor} font-bold text-sm">${result.verdict || 'Unknown'}</span>
                    <span class="text-gray-400 text-xs">${testCasesPassed}/${totalTestCases} test cases passed</span>
                    ${result.runtimeMs ? `<span class="text-gray-500 text-xs">Runtime: ${result.runtimeMs}ms</span>` : ''}
                </div>
            `;
            document.getElementById('testResults').classList.remove('hidden');
            submissionSuccess = true;
        }

    } catch (err) {
        console.warn('[CodingRoom] Submit error:', err.message);
        status.textContent = `⚠️ ${err.message}`;
        // Re-enable buttons so user can retry
        submitBtn.disabled = false;
        runBtn.disabled    = false;
        submitBtn.textContent = 'Submit';
        return; // Don't show completion screen — let user retry
    }

    // Save result to InterviewSession regardless of judging outcome
    try {
        await fetch(`/api/interviews/${sessionId}/coding-result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                problemId:       currentProblem._id,
                problemTitle:    currentProblem.title,
                submittedCode:   code,
                language:        language,
                testCasesPassed: testCasesPassed,
                totalTestCases:  totalTestCases || 1
            })
        });
    } catch (err) {
        console.error('[CodingRoom] Failed to save coding result:', err.message);
    }

    // Compute score for display
    const rawScore = totalTestCases > 0
        ? ((testCasesPassed / totalTestCases) * 10).toFixed(1)
        : '0.0';

    status.textContent = '';
    showCompletionScreen(rawScore, testCasesPassed, totalTestCases);
}

// ─────────────────────────────────────────────────────────────────────────────
// Show Completion Screen
// ─────────────────────────────────────────────────────────────────────────────
function showCompletionScreen(score, passed, total) {
    const overlay    = document.getElementById('completionOverlay');
    const scoreEl    = document.getElementById('completionScore');
    const detailEl   = document.getElementById('completionDetail');
    const actionsEl  = document.getElementById('completionActions');
    const iconEl     = document.getElementById('completionIcon');
    const sessionId  = new URLSearchParams(window.location.search).get('sessionId');
    const mode       = sessionStorage.getItem('interviewMode') || 'coding';

    scoreEl.textContent = `${score}/10`;
    detailEl.textContent = `${passed} out of ${total} test cases passed`;
    iconEl.textContent   = parseFloat(score) >= 7 ? '🏆' : parseFloat(score) >= 4 ? '👍' : '💪';

    // Navigation buttons based on mode
    if (mode === 'both') {
        actionsEl.innerHTML = `
            <a href="InterviewRoom.html?sessionId=${sessionId}"
               class="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl transition-colors text-sm">
                Start Voice Interview →
            </a>
            <a href="Dashboard.html?sessionId=${sessionId}"
               class="w-full flex items-center justify-center gap-2 py-2 px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm">
                Skip Voice Round & View Results
            </a>
        `;
    } else {
        // Coding only
        actionsEl.innerHTML = `
            <a href="Dashboard.html?sessionId=${sessionId}"
               class="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl transition-colors text-sm">
                View Full Results →
            </a>
            <a href="Interview.html"
               class="w-full flex items-center justify-center gap-2 py-2 px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-colors text-sm">
                Start New Interview
            </a>
        `;
    }

    overlay.classList.remove('hidden');
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Init
// ─────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams  = new URLSearchParams(window.location.search);
    const sessionId  = urlParams.get('sessionId') || sessionStorage.getItem('interviewSessionId');
    const targetRole = sessionStorage.getItem('targetRole') || 'Software Engineer';

    // Show role in header
    document.getElementById('roleBadge').textContent = targetRole;

    // Auth guard
    try {
        const auth = await fetch('/api/auth/profile', { credentials: 'include' });
        if (!auth.ok) { window.location.href = 'login.html'; return; }
    } catch { window.location.href = 'login.html'; return; }

    // Init Monaco first — default to python (Code-Judger supports python/java/cpp)
    initMonaco('python');

    // ─── Fetch problem from Code-Judger API (via proxy) ──────────────────────
    // Step 1: GET /api/code/problems → full list with title, slug, difficulty, topic[]
    // Step 2: Filter by role-relevant topics, pick random
    // Step 3: GET /api/code/problems/:id → full problem details + sampleCases
    // Using Code-Judger as the single source of truth ensures the problemId
    // is valid for judging (submit/run/batch) since both share the same DB.
    try {
        // Step 1: Get all published problems from Code-Judger
        const listRes = await fetch('/api/code/problems', { credentials: 'include' });
        if (!listRes.ok) throw new Error('Could not fetch problems from Code-Judger.');
        const listData = await listRes.json();
        const allProblems = listData.problems || [];
        if (allProblems.length === 0) throw new Error('No problems available in Code-Judger.');

        // Step 2: Filter by role-relevant topics
        const preferredTopics = ROLE_TOPIC_MAP[targetRole] || ['Arrays'];
        let matched = [];

        // Try each preferred topic until we find matches
        for (const topic of preferredTopics) {
            matched = allProblems.filter(p =>
                (p.topic || []).some(t => t.toLowerCase() === topic.toLowerCase())
            );
            if (matched.length > 0) break;
        }

        // Fallback: use any random problem
        if (matched.length === 0) matched = allProblems;

        // Pick a random problem from matches
        const picked = matched[Math.floor(Math.random() * matched.length)];

        // Step 3: Get full problem details + sampleCases from Code-Judger
        const detailRes = await fetch(`/api/code/problems/${picked._id}`, { credentials: 'include' });
        if (!detailRes.ok) throw new Error('Could not load problem details.');
        const detailData = await detailRes.json();

        // detailData = { problem: {...}, sampleCases: [{input, expectedOutput, order}] }
        const problem     = detailData.problem;
        const sampleCases = detailData.sampleCases || [];

        if (!problem) throw new Error('Problem data missing.');

        renderProblem(problem, sampleCases);

        // Hide loader, show main layout
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('mainLayout').classList.remove('hidden');
        document.getElementById('mainLayout').classList.add('flex');

        // Start countdown timer
        startTimer();

    } catch (err) {
        document.getElementById('loadingState').innerHTML = `
            <svg class="w-14 h-14 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h3 class="text-xl font-bold text-white mb-2">Could not load problem</h3>
            <p class="text-gray-400 text-sm mb-4">${err.message}</p>
            <a href="Interview.html" class="px-6 py-2 bg-primary text-white rounded-lg font-medium">Return to Setup</a>
        `;
        return;
    }

    // Language switch → update editor and syntax highlighting
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        if (!monacoEditor) return;
        const lang = e.target.value;
        // Map language value to Monaco language id
        const monacoLangMap = { python: 'python', java: 'java', cpp: 'cpp' };
        const monacoLang = monacoLangMap[lang] || lang;
        monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLang);

        // Use only the DB starter code for the selected language
        const code = currentProblem?.starterCode?.[lang] || '';
        monacoEditor.setValue(code);
    });

    // Run Tests button
    document.getElementById('runBtn').addEventListener('click', runTests);

    // Submit button
    document.getElementById('submitBtn').addEventListener('click', () => submitCode(false));
});
