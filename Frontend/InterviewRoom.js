document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const container = document.getElementById('interviewContainer');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMsg = document.getElementById('errorMsg');
    
    const progressBar = document.getElementById('progressBar');
    const roundBadge = document.getElementById('roundBadge');
    const questionCounter = document.getElementById('questionCounter');
    const questionTextEl = document.getElementById('questionText');
    const transcriptBox = document.getElementById('transcriptBox');
    
    const recordBtn = document.getElementById('recordBtn');
    const recordBtnText = document.getElementById('recordBtnText');
    const nextBtn = document.getElementById('nextBtn');
    const sessionStatus = document.getElementById('sessionStatus');

    // State variables
    let sessionId = null;
    let allQuestions = [];
    let currentQuestionIndex = 0;
    
    let socket = null;
    let mediaRecorder = null;
    let isRecording = false;
    let finalTranscript = "";

    // ─── FIX #1: Auth Guard ───────────────────────────────────────────────────
    // Check if the user is logged in before anything else.
    try {
        const authCheck = await fetch(`${API_BASE_URL}/api/auth/profile`, { credentials: 'include' });
        if (!authCheck.ok) {
            window.location.href = 'login.html';
            return;
        }
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    // 1. Get Session ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    sessionId = urlParams.get('sessionId');
    if (sessionId) {
        sessionId = sessionId.trim().replace(/^['"]|['"]$/g, '');
    }

    if (!sessionId) {
        showError("No session ID found in URL. Please go back to setup.");
        return;
    }

    // 2. Fetch Session Data
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
        
        // Flatten questions from all rounds into a single ordered array
        if (!data.session || !Array.isArray(data.session.rounds)) {
            throw new Error("Invalid session data returned from server");
        }
        
        data.session.rounds.forEach((round, rIndex) => {
            if (round.questions && Array.isArray(round.questions)) {
                round.questions.forEach((q, qIndex) => {
                    allQuestions.push({
                        roundIndex: rIndex,
                        questionIndex: qIndex,
                        roundType: round.roundType,
                        questionText: q.questionText
                    });
                });
            }
        });

        if (allQuestions.length === 0) {
            showError("No questions found for this session.");
            return;
        }

        initSocket();

    } catch (err) {
        console.error("Failed to load interview session:", err);
        showError(`Could not retrieve interview data: ${err.message}. Make sure you are logged in.`);
    }

    function showError(msg) {
        loadingState.classList.add('hidden');
        container.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorState.classList.add('flex');
        errorMsg.textContent = msg;
    }

    // 3. Initialize Socket.IO
    function initSocket() {
        // Connect to backend /interview namespace with credentials
        socket = io(`${API_BASE_URL}/interview`, { withCredentials: true });

        socket.on('connect', () => {
            sessionStatus.innerHTML = `
                <span class="relative flex h-3 w-3">
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span class="text-sm font-medium text-emerald-600">Live</span>
            `;
            
            // Tell backend we are ready to start STT stream
            socket.emit('interview:start', { sessionId });
            
            // Show UI and load first question
            loadingState.classList.add('hidden');
            container.classList.remove('hidden');
            loadQuestion(currentQuestionIndex);
        });

        socket.on('connect_error', (err) => {
            console.error('[Socket] Connection error:', err.message);
            sessionStatus.innerHTML = `
                <span class="relative flex h-3 w-3">
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span class="text-sm font-medium text-red-600">Connection Failed</span>
            `;
        });

        socket.on('disconnect', () => {
            sessionStatus.innerHTML = `
                <span class="relative flex h-3 w-3">
                  <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span class="text-sm font-medium text-red-600">Disconnected</span>
            `;
            if (isRecording) stopRecording();
        });

        socket.on('interview:error', (data) => {
            console.error("Socket Error:", data.message);
        });

        // ─── FIX #3: Correctly handle MP3 audio buffer from Deepgram TTS ─────
        // The backend sends a Node.js Buffer (binary). We need to convert it
        // to an ArrayBuffer for the Web Audio API to decode.
        socket.on('question:audio', async (data) => {
            if (!data || !data.audio) return;
            try {
                // data.audio arrives as a Buffer object with a .data array property
                const rawBytes = data.audio.data || data.audio;
                const uint8 = new Uint8Array(rawBytes);
                const arrayBuffer = uint8.buffer;

                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.start(0);
                console.log('[TTS] Playing audio successfully.');
            } catch (e) {
                // Audio decode can fail if no audio permission or invalid buffer.
                // Silently fail — the text is already shown on screen.
                console.warn('[TTS] Could not play audio:', e.message);
            }
        });

        // Handle live transcript from Deepgram
        socket.on('transcript:partial', (data) => {
            updateTranscriptUI(data.text, false);
        });

        socket.on('transcript:final', (data) => {
            if (data.text) {
                finalTranscript += (finalTranscript ? " " : "") + data.text;
            }
            updateTranscriptUI("", true);
        });
    }

    function updateTranscriptUI(partialText, isFinal) {
        if (!transcriptBox) return;
        
        let html = '';
        if (finalTranscript) {
            html += `<span class="text-gray-900">${finalTranscript}</span> `;
        }
        if (partialText) {
            html += `<span class="text-gray-400 italic">${partialText}</span>`;
        }
        
        if (!html) {
            html = `<p class="text-gray-400 text-center italic mt-10">Listening...</p>`;
        }
        
        transcriptBox.innerHTML = html;
        transcriptBox.scrollTop = transcriptBox.scrollHeight;
    }

    // 4. Load a specific question
    function loadQuestion(index) {
        const q = allQuestions[index];
        
        // Update Progress
        const percent = (index / allQuestions.length) * 100;
        progressBar.style.width = `${percent}%`;
        
        roundBadge.textContent = q.roundType;
        questionCounter.textContent = `Q ${index + 1} / ${allQuestions.length}`;
        questionTextEl.textContent = q.questionText;
        
        // Reset state for the new question
        finalTranscript = "";
        recordBtnText.textContent = "Start Speaking";
        recordBtn.classList.replace('text-white', 'text-red-600');
        recordBtn.classList.replace('bg-red-600', 'bg-red-100');
        recordBtn.classList.replace('hover:bg-red-700', 'hover:bg-red-200');
        recordBtn.classList.remove('animate-pulse');

        transcriptBox.innerHTML = `<p class="text-gray-400 text-center italic mt-10">Listen to the question, then click "Start Speaking" to answer.</p>`;
        
        // Reset next button
        nextBtn.disabled = false;
        if (index === allQuestions.length - 1) {
            nextBtn.innerHTML = `Finish Interview <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
            nextBtn.classList.replace('bg-primary', 'bg-emerald-600');
            nextBtn.classList.replace('hover:bg-primaryHover', 'hover:bg-emerald-700');
        } else {
            nextBtn.innerHTML = `Submit Answer <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
            nextBtn.classList.replace('bg-emerald-600', 'bg-primary');
            nextBtn.classList.replace('hover:bg-emerald-700', 'hover:bg-primaryHover');
        }

        // Request TTS to read the question out loud
        socket.emit('question:request', { text: q.questionText });
    }

    // 5. Microphone Handling — using Web Speech API (SpeechRecognition)
    // This works natively in Chrome/Edge with no API key needed.
    // It provides live interim results and final transcripts directly in the browser.

    let speechRecognition = null;

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        recordBtn.disabled = true;
        recordBtnText.textContent = 'Mic not supported (use Chrome/Edge)';
    }

    recordBtn.addEventListener('click', async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    });

    async function startRecording() {
        if (!SpeechRecognition) {
            alert('Your browser does not support Speech Recognition. Please use Chrome or Edge.');
            return;
        }

        // Request mic permission first so user sees the permission prompt
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            alert('Microphone access denied. Please allow microphone permissions and try again.');
            return;
        }

        finalTranscript = '';
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;       // Keep listening until we stop it
        speechRecognition.interimResults = true;   // Show live partial results
        speechRecognition.lang = 'en-US';
        speechRecognition.maxAlternatives = 1;

        speechRecognition.onstart = () => {
            isRecording = true;
            console.log('[SpeechRecognition] Started listening.');

            // Update UI to recording state
            recordBtn.classList.replace('text-red-600', 'text-white');
            recordBtn.classList.replace('bg-red-100', 'bg-red-600');
            recordBtn.classList.replace('hover:bg-red-200', 'hover:bg-red-700');
            recordBtn.classList.add('animate-pulse');
            recordBtnText.textContent = 'Stop Speaking';
            transcriptBox.innerHTML = `<p class="text-gray-400 text-center italic mt-10">Listening... speak now.</p>`;
        };

        // Called repeatedly as the user speaks — shows live words
        speechRecognition.onresult = (event) => {
            let interimText = '';
            let newFinalText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    newFinalText += result[0].transcript + ' ';
                } else {
                    interimText += result[0].transcript;
                }
            }

            if (newFinalText) {
                finalTranscript += newFinalText;
                console.log('[SpeechRecognition] Final chunk:', newFinalText.trim());
            }

            // Update transcript box with confirmed text + live preview
            let html = '';
            if (finalTranscript) {
                html += `<span class="text-gray-900 font-medium">${finalTranscript}</span>`;
            }
            if (interimText) {
                html += `<span class="text-gray-400 italic"> ${interimText}</span>`;
            }
            transcriptBox.innerHTML = html || `<p class="text-gray-400 text-center italic mt-10">Listening...</p>`;
            transcriptBox.scrollTop = transcriptBox.scrollHeight;
        };

        speechRecognition.onerror = (event) => {
            console.error('[SpeechRecognition] Error:', event.error);
            if (event.error === 'no-speech') {
                // Silent — user just hasn't spoken yet
            } else if (event.error === 'not-allowed') {
                alert('Microphone permission was denied. Please allow access in your browser settings.');
                stopRecording();
            } else {
                console.warn('[SpeechRecognition] Non-fatal error:', event.error);
            }
        };

        speechRecognition.onend = () => {
            // If still supposed to be recording (not manually stopped), restart
            // Chrome stops recognition after ~60s of silence
            if (isRecording) {
                console.log('[SpeechRecognition] Auto-restarting after browser timeout...');
                try { speechRecognition.start(); } catch(e) { /* ignore */ }
            }
        };

        try {
            speechRecognition.start();
        } catch (err) {
            console.error('SpeechRecognition start error:', err);
        }
    }

    function stopRecording() {
        isRecording = false;

        if (speechRecognition) {
            try { speechRecognition.stop(); } catch(e) { /* ignore */ }
            speechRecognition = null;
        }

        // Reset UI to idle state
        recordBtn.classList.replace('text-white', 'text-red-600');
        recordBtn.classList.replace('bg-red-600', 'bg-red-100');
        recordBtn.classList.replace('hover:bg-red-700', 'hover:bg-red-200');
        recordBtn.classList.remove('animate-pulse');
        recordBtnText.textContent = 'Re-record Answer';
    }

    // 6. Submit Answer & Navigate
    nextBtn.addEventListener('click', async () => {
        if (isRecording) stopRecording();

        const q = allQuestions[currentQuestionIndex];
        const cleanAnswer = finalTranscript.trim();
        
        nextBtn.disabled = true;
        nextBtn.innerHTML = `<svg class="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Saving...`;

        try {
            // Save answer to DB
            const saveRes = await fetch(`${API_BASE_URL}/api/interviews/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    roundIndex: q.roundIndex,
                    questionIndex: q.questionIndex,
                    userAnswer: cleanAnswer || "[No answer recorded]"
                })
            });

            if (!saveRes.ok) {
                console.error("Failed to save answer:", await saveRes.text());
            }

            currentQuestionIndex++;

            if (currentQuestionIndex < allQuestions.length) {
                // Load the next question
                loadQuestion(currentQuestionIndex);
            } else {
                // All questions answered — trigger evaluation
                progressBar.style.width = `100%`;
                nextBtn.innerHTML = `<svg class="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> AI is evaluating your answers...`;
                
                questionTextEl.textContent = "Interview complete! The AI is evaluating all your answers...";

                await fetch(`${API_BASE_URL}/api/interviews/${sessionId}/evaluate`, {
                    method: 'POST',
                    credentials: 'include'
                });

                window.location.href = `Dashboard.html?sessionId=${sessionId}`;
            }
        } catch (error) {
            console.error("Submit answer error", error);
            alert("A network error occurred. Please check your connection.");
            nextBtn.disabled = false;
            nextBtn.innerHTML = `Submit Answer <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>`;
        }
    });

});
