document.addEventListener('DOMContentLoaded', async () => {
    const fileInput = document.getElementById('resumeFile');
    const atsForm = document.getElementById('atsForm');
    const dropZone = document.getElementById('dropZone');
    const selectedFileName = document.getElementById('selectedFileName');
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');

    const placeholderState = document.getElementById('placeholderState');
    const loaderState = document.getElementById('loaderState');
    const resultsContent = document.getElementById('resultsContent');

    // ─── Helper: escape HTML to prevent XSS ───
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ─── Auth Guard ───────────────────────────────────────────────────────────
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, { credentials: 'include' });
        if (!res.ok) {
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    // ─── Drag and Drop Handlers ──────────────────────────────────────────────
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-blue-50/50');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-blue-50/50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-blue-50/50');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    fileInput.addEventListener('change', handleFileSelect);

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            selectedFileName.textContent = `SELECTED: ${file.name.toUpperCase()}`;
            selectedFileName.classList.remove('hidden');
            submitBtn.disabled = false;
            statusMessage.innerHTML = '';
        } else {
            selectedFileName.textContent = '';
            selectedFileName.classList.add('hidden');
            submitBtn.disabled = true;
        }
    }

    // ─── Form Submission & API Call ──────────────────────────────────────────
    atsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (fileInput.files.length === 0) return;

        const file = fileInput.files[0];
        const targetRole = document.getElementById('targetRole').value;

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('targetRole', targetRole);

        // UI Transition to Loading State
        placeholderState.classList.add('hidden');
        resultsContent.classList.add('hidden');
        loaderState.classList.remove('hidden');

        submitBtn.disabled = true;
        statusMessage.innerHTML = '<span class="text-primary font-mono text-xs">UPLOADING DOCUMENT DIRECTIVE...</span>';

        try {
            const response = await fetch(`${API_BASE_URL}/api/ats/analyze`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                statusMessage.innerHTML = '<span class="text-emerald-600 font-mono text-xs">DIAGNOSTIC COMPLETED SUCCESSFULLY.</span>';
                renderATSResults(data.analysis);
            } else {
                statusMessage.innerHTML = `<span class="text-red-500 font-mono text-xs">ERROR: ${data.message.toUpperCase()}</span>`;
                loaderState.classList.add('hidden');
                placeholderState.classList.remove('hidden');
            }
        } catch (error) {
            console.error('ATS upload error:', error);
            statusMessage.innerHTML = '<span class="text-red-500 font-mono text-xs">FATAL ERROR: NETWORK INTERRUPT.</span>';
            loaderState.classList.add('hidden');
            placeholderState.classList.remove('hidden');
        } finally {
            submitBtn.disabled = false;
        }
    });

    // ─── Render Results to DOM ───────────────────────────────────────────────
    function renderATSResults(analysis) {
        // 1. Overall Score Circle
        const scoreCircle = document.getElementById('scoreCircle');
        const scoreVal = document.getElementById('scoreVal');
        const score = analysis.atsScore || 0;

        scoreCircle.style.setProperty('--progress', score);
        scoreVal.textContent = `${score}%`;

        // Style the circle color dynamically depending on the score
        if (score >= 80) {
            scoreCircle.className = 'cyber-progress-green w-40 h-40 rounded-full flex items-center justify-center relative shadow-inner';
        } else {
            scoreCircle.className = 'cyber-progress w-40 h-40 rounded-full flex items-center justify-center relative shadow-inner';
        }

        // 2. Metrics Breakdown
        const metrics = {
            Keywords: analysis.keywordMatch || 0,
            Skills: analysis.skillsMatch || 0,
            Exp: analysis.experienceMatch || 0,
            Edu: analysis.educationMatch || 0,
            Format: analysis.formattingScore || 0
        };

        for (const [key, val] of Object.entries(metrics)) {
            document.getElementById(`breakdown${key}Val`).textContent = `${val}%`;
            document.getElementById(`breakdown${key}Bar`).style.width = `${val}%`;
        }

        // 3. Missing Keywords
        const keywordsContainer = document.getElementById('missingKeywordsList');
        keywordsContainer.innerHTML = '';
        if (analysis.missingKeywords && analysis.missingKeywords.length > 0) {
            analysis.missingKeywords.forEach(kw => {
                const tag = document.createElement('span');
                tag.className = 'px-3 py-1.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-xs font-mono font-bold tracking-wider';
                tag.textContent = kw;
                keywordsContainer.appendChild(tag);
            });
        } else {
            keywordsContainer.innerHTML = '<p class="text-xs text-gray-400 italic">No critical keywords missing.</p>';
        }

        // 4. Suggestions
        const suggestionsContainer = document.getElementById('suggestionsList');
        suggestionsContainer.innerHTML = '';
        if (analysis.suggestions && analysis.suggestions.length > 0) {
            analysis.suggestions.forEach(sug => {
                const li = document.createElement('li');
                li.className = 'flex items-start gap-2.5';
                li.innerHTML = `
                    <span class="text-amber-500 font-bold shrink-0">&raquo;</span>
                    <span>${escHtml(sug)}</span>
                `;
                suggestionsContainer.appendChild(li);
            });
        } else {
            suggestionsContainer.innerHTML = '<li class="text-xs text-gray-400 italic">No specific improvements suggested.</li>';
        }

        // 5. Strengths
        const strengthsContainer = document.getElementById('strengthsList');
        strengthsContainer.innerHTML = '';
        if (analysis.strengths && analysis.strengths.length > 0) {
            analysis.strengths.forEach(str => {
                const li = document.createElement('li');
                li.className = 'flex items-start gap-3 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 text-xs text-gray-700 font-medium';
                li.innerHTML = `
                    <span class="text-emerald-600 mt-0.5 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </span>
                    <span>${escHtml(str)}</span>
                `;
                strengthsContainer.appendChild(li);
            });
        } else {
            strengthsContainer.innerHTML = '<p class="text-xs text-gray-400 italic">No strengths highlighted.</p>';
        }

        // Show Results, Hide Loading
        loaderState.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    }
});
