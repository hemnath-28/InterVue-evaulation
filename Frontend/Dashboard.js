document.addEventListener('DOMContentLoaded', async () => {
    const loadingState      = document.getElementById('loadingState');
    const dashboardContent  = document.getElementById('dashboardContent');
    const overallScore      = document.getElementById('overallScore');
    const targetRoleText    = document.getElementById('targetRoleText');
    const expLevelText      = document.getElementById('expLevelText');
    const overallFeedback   = document.getElementById('overallFeedback');
    const questionsContainer= document.getElementById('questionsContainer');

    // ─── Get Session ID ────────────────────────────────────────────────────────
    const urlParams = new URLSearchParams(window.location.search);
    let sessionId = urlParams.get('sessionId');
    if (sessionId) sessionId = sessionId.trim().replace(/^['\"]|['\"]$/g, '');

    if (!sessionId) { showError("No session ID provided."); return; }

    // ─── Auth Guard ────────────────────────────────────────────────────────────
    try {
        const authCheck = await fetch(`${API_BASE_URL}/api/auth/profile`, { credentials: 'include' });
        if (!authCheck.ok) { window.location.href = 'login.html'; return; }
    } catch { window.location.href = 'login.html'; return; }

    // ─── Fetch Session Results ─────────────────────────────────────────────────
    try {
        const response = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}/results`, {
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `HTTP error ${response.status}`);
        }

        const data = await response.json();
        const session = data.session;
        if (!session) throw new Error("Invalid session data returned from server");

        const mode = session.mode || 'voice';

        // ── Header Info ─────────────────────────────────────────────────────────
        targetRoleText.textContent = session.targetRole || 'Unknown';
        expLevelText.textContent   = session.experienceLevel || 'Unknown';

        // ── Main Score Circle ───────────────────────────────────────────────────
        // Shows finalScore if available, otherwise overallScore
        const displayScore = session.finalScore ?? session.overallScore ?? 0;
        overallScore.textContent = displayScore || '--';

        if (session.status !== 'Completed') {
            overallFeedback.innerHTML = `<span class="text-amber-600 font-semibold">Session is still pending evaluation. Check back later.</span>`;
            overallScore.textContent = "-";
        } else {
            // Show finalFeedback if exists (both mode), else overallFeedback
            overallFeedback.textContent = session.finalFeedback || session.overallFeedback || 'No feedback available.';
        }

        // ── Score Breakdown Section ─────────────────────────────────────────────
        const hasCoding = session.codingRound && session.codingRound.status === 'Completed';
        const hasVoice  = session.overallScore !== undefined && session.rounds?.length > 0;

        if (hasCoding || mode === 'both') {
            document.getElementById('scoreBreakdown').classList.remove('hidden');

            // Coding score card
            if (hasCoding) {
                const coding = session.codingRound;
                document.getElementById('codingScoreCard').classList.remove('hidden');
                document.getElementById('codingScoreVal').textContent   = coding.rawScore?.toFixed(1) || '0.0';
                document.getElementById('codingTestDetail').textContent = `${coding.testCasesPassed}/${coding.totalTestCases} test cases passed`;
            }

            // Voice score card
            if (hasVoice) {
                document.getElementById('voiceScoreCard').classList.remove('hidden');
                document.getElementById('voiceScoreVal').textContent = session.overallScore?.toFixed(1) || '--';
            }

            // Final score card (only in both mode)
            if (mode === 'both' && hasCoding && hasVoice) {
                const codingScore = session.codingRound.rawScore || 0;
                const voiceScore  = session.overallScore || 0;
                document.getElementById('finalScoreCard').classList.remove('hidden');
                document.getElementById('finalScoreVal').textContent    = session.finalScore?.toFixed(2) || '--';
                document.getElementById('finalScoreFormula').textContent = `(${codingScore.toFixed(1)}×40%) + (${voiceScore.toFixed(1)}×60%)`;
            }
        }

        // ── Coding Round Summary Section ────────────────────────────────────────
        if (hasCoding) {
            const coding = session.codingRound;
            document.getElementById('codingRoundSection').classList.remove('hidden');
            document.getElementById('codingProblemTitle').textContent  = coding.problemTitle || 'Unknown';
            document.getElementById('codingLanguage').textContent      = coding.language     || 'Unknown';
            document.getElementById('codingTestCases').textContent     = `${coding.testCasesPassed} / ${coding.totalTestCases} passed`;
            document.getElementById('codingFinalScore').textContent    = `${coding.rawScore?.toFixed(1) || 0} / 10`;
            document.getElementById('codingSubmittedCode').textContent = coding.submittedCode || '// No code submitted';
        }

        // ── Voice Round Q&A Breakdown ───────────────────────────────────────────
        if (hasVoice && session.rounds?.length > 0) {
            document.getElementById('voiceRoundSection').classList.remove('hidden');

            let html = '';
            let qCount = 1;

            session.rounds.forEach((round) => {
                html += `
                    <div class="mb-6">
                        <h3 class="text-lg font-bold text-gray-800 mb-4 border-b pb-2">${round.roundType} Round</h3>
                        <div class="space-y-4">`;

                round.questions.forEach((q) => {
                    const scoreColor = q.score >= 7 ? 'bg-emerald-400' : (q.score >= 4 ? 'bg-amber-400' : 'bg-red-400');
                    html += `
                        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden hover:border-blue-200 transition-colors">
                            <div class="absolute top-0 left-0 w-1 h-full ${scoreColor}"></div>

                            <div class="flex justify-between items-start mb-3">
                                <h4 class="text-md font-bold text-gray-900 pr-8">Q${qCount}. ${q.questionText}</h4>
                                <div class="flex-shrink-0 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1 text-center">
                                    <span class="block text-xl font-bold text-primary">${q.score || '-'}</span>
                                    <span class="block text-[10px] font-bold text-gray-400 uppercase">/ 10</span>
                                </div>
                            </div>

                            <div class="mb-4">
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Your Answer</span>
                                <p class="text-gray-600 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100">${q.userAnswer || '<i class="text-gray-400">No answer recorded.</i>'}</p>
                            </div>

                            <div>
                                <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">AI Feedback</span>
                                <p class="text-gray-800 text-sm">${q.feedback || 'No specific feedback.'}</p>
                            </div>
                        </div>`;
                    qCount++;
                });

                html += `   </div>
                          </div>`;
            });

            questionsContainer.innerHTML = html;
        }

        // Show UI
        loadingState.classList.add('hidden');
        dashboardContent.classList.remove('hidden');
        dashboardContent.classList.add('flex');

    } catch (err) {
        console.error("Dashboard error:", err);
        showError(`Could not load interview results: ${err.message}. Ensure you are logged in.`);
    }

    function showError(msg) {
        loadingState.innerHTML = `
            <svg class="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p class="text-gray-500">${msg}</p>
            <a href="Interview.html" class="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">Return to Setup</a>
        `;
    }
});
