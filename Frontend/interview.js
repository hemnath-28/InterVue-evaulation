document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('resumeFile');
    const uploadForm = document.getElementById('uploadForm');
    const dropZone = document.getElementById('dropZone');
    const selectedFileName = document.getElementById('selectedFileName');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const resumeList = document.getElementById('resumeList');
    const noResumesMsg = document.getElementById('noResumesMsg');

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });

    // Handle file selection via input
    fileInput.addEventListener('change', handleFileSelect);

    function handleFileSelect() {
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            selectedFileName.textContent = file.name;
            uploadBtn.disabled = false;
        } else {
            selectedFileName.textContent = '';
            uploadBtn.disabled = true;
        }
    }

    // Handle form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (fileInput.files.length === 0) return;

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('resume', file);

        uploadBtn.disabled = true;
        uploadStatus.innerHTML = '<span style="color: #3b82f6;">Uploading and parsing document with AI... Please wait.</span>';

        try {
            const response = await fetch('/api/resume/upload', {
                method: 'POST',
                // Important to include credentials to send the session cookie
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                if (response.status === 201) {
                    uploadStatus.innerHTML = '<span style="color: #10b981;">Resume successfully parsed and saved!</span>';
                    // Add to list
                    addResumeToList(data.resume);
                } else if (response.status === 202) {
                    uploadStatus.innerHTML = `<span style="color: #f59e0b;">${data.message}</span>`;
                }
            } else {
                uploadStatus.innerHTML = `<span style="color: #ef4444;">Error: ${data.message || 'Failed to upload'}</span>`;
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.innerHTML = '<span style="color: #ef4444;">Network error occurred during upload.</span>';
        } finally {
            uploadBtn.disabled = false;
            fileInput.value = ''; // clear input
            selectedFileName.textContent = '';
        }
    });

    // Function to add a resume to the DOM list
    function addResumeToList(resume) {
        if (noResumesMsg) {
            noResumesMsg.style.display = 'none';
        }

        const item = document.createElement('div');
        item.className = 'flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary transition-colors';
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'selectedResume';
        radio.value = resume._id;
        radio.id = `resume_${resume._id}`;
        radio.className = 'w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary cursor-pointer';

        // Auto-select if it's the first one
        if (document.querySelectorAll('input[name="selectedResume"]').length === 0) {
            radio.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = `resume_${resume._id}`;
        label.className = 'flex-1 cursor-pointer';
        
        const nameText = resume.name ? `Resume: ${resume.name}` : `Resume ID: ${resume._id.substring(0, 8)}...`;
        label.innerHTML = `<strong class="text-gray-900 font-medium">${nameText}</strong><br><span class="text-xs text-gray-500 mt-1 block">Skills: ${resume.skills && resume.skills.length > 0 ? resume.skills.join(', ') : 'None'}</span>`;

        item.appendChild(radio);
        item.appendChild(label);
        
        resumeList.appendChild(item);
    }

    // Optional: Fetch existing user resumes on load
    // This assumes there is an endpoint like GET /api/auth/profile that populates resumes
    async function loadUserResumes() {
        try {
            const response = await fetch('/api/auth/profile', { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                if (data.user && data.user.resumes && data.user.resumes.length > 0) {
                    // We need full resume details, not just IDs, so the backend /profile endpoint 
                    // should preferably populate the resumes array.
                    // For now, if they are populated, we render them:
                    data.user.resumes.forEach(resume => {
                        if (typeof resume === 'object') {
                            addResumeToList(resume);
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load profile/resumes', err);
        }
    }

    // Call on load
    loadUserResumes();

    // Start Interview Logic
    const startInterviewBtn = document.getElementById('startInterviewBtn');
    const startStatus = document.getElementById('startStatus');
    const targetRoleSelect = document.getElementById('targetRole');
    const experienceLevelSelect = document.getElementById('experienceLevel');

    if (startInterviewBtn) {
        startInterviewBtn.addEventListener('click', async () => {
            const selectedResumeRadio = document.querySelector('input[name="selectedResume"]:checked');
            
            if (!selectedResumeRadio) {
                startStatus.innerHTML = '<span style="color: #ef4444;">Please select a resume first.</span>';
                return;
            }

            const resumeId = selectedResumeRadio.value;
            const targetRole = targetRoleSelect.value;
            const experienceLevel = experienceLevelSelect.value;

            // Read the selected interview mode (coding / voice / both)
            const selectedModeRadio = document.querySelector('input[name="interviewMode"]:checked');
            const mode = selectedModeRadio ? selectedModeRadio.value : 'voice';

            startInterviewBtn.disabled = true;
            startStatus.innerHTML = '<span style="color: #3b82f6;">Generating AI Interview Questions...</span>';

            try {
                const response = await fetch('/api/interviews/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ resumeId, targetRole, experienceLevel, mode })
                });

                const data = await response.json();

                if (response.ok) {
                    const sessionId = data.interviewSessionId;

                    // Store everything needed by CodingRoom + InterviewRoom in sessionStorage
                    sessionStorage.setItem('interviewSessionId', sessionId);
                    sessionStorage.setItem('interviewMode', mode);
                    sessionStorage.setItem('targetRole', targetRole);
                    sessionStorage.setItem('experienceLevel', experienceLevel);

                    if (mode === 'coding') {
                        // Coding only → go straight to CodingRoom
                        startStatus.innerHTML = '<span style="color: #10b981;">Ready! Redirecting to Coding Room...</span>';
                        setTimeout(() => {
                            window.location.href = `CodingRoom.html?sessionId=${sessionId}`;
                        }, 800);

                    } else if (mode === 'both') {
                        // Both → start with Coding Round first
                        startStatus.innerHTML = '<span style="color: #10b981;">Ready! Starting with Coding Round...</span>';
                        setTimeout(() => {
                            window.location.href = `CodingRoom.html?sessionId=${sessionId}`;
                        }, 800);

                    } else {
                        // Voice only → go to InterviewRoom as before
                        startStatus.innerHTML = '<span style="color: #10b981;">Ready! Redirecting to Interview Room...</span>';
                        setTimeout(() => {
                            window.location.href = `InterviewRoom.html?sessionId=${sessionId}`;
                        }, 800);
                    }

                } else {
                    startStatus.innerHTML = `<span style="color: #ef4444;">Error: ${data.message}</span>`;
                    startInterviewBtn.disabled = false;
                }
            } catch (error) {
                console.error('Start Interview Error:', error);
                startStatus.innerHTML = '<span style="color: #ef4444;">Network error occurred.</span>';
                startInterviewBtn.disabled = false;
            }
        });
    }
});
