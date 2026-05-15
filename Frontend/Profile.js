document.addEventListener('DOMContentLoaded', async () => {
    const loadingState = document.getElementById('loadingState');
    const profileContent = document.getElementById('profileContent');

    // ─── Auth Guard ───────────────────────────────────────────────────────────
    let profileData;
    try {
        const res = await fetch('/api/auth/profile', { credentials: 'include' });
        if (!res.ok) {
            window.location.href = 'login.html';
            return;
        }
        profileData = await res.json();
    } catch (e) {
        window.location.href = 'login.html';
        return;
    }

    const { user, sessions = [] } = profileData;

    // ─── 1. Hero Card ─────────────────────────────────────────────────────────
    // Avatar initials
    const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('avatarInitials').textContent = initials;

    // If user has a profile picture, show it instead of initials
    if (user.profilePic) {
        const avatarEl = document.getElementById('avatarEl');
        avatarEl.innerHTML = `<img src="${user.profilePic}" alt="Profile" class="w-full h-full object-cover rounded-full">`;
    }

    document.getElementById('userName').textContent = user.name || 'Unknown User';
    document.getElementById('userEmail').textContent = user.email || '—';

    // Member since date
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        document.getElementById('memberSince').textContent = `Member since ${date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    // Provider badge
    if (user.provider) {
        const pb = document.getElementById('providerBadge');
        const icons = { google: '🔵', github: '⚫', local: '🔐' };
        pb.textContent = `${icons[user.provider] || ''} ${user.provider}`;
        pb.classList.remove('hidden');
    }

    // Role badge
    if (user.role) {
        const rb = document.getElementById('roleBadge');
        rb.textContent = user.role;
        rb.classList.remove('hidden');
    }

    // ─── 2. Stats ─────────────────────────────────────────────────────────────
    const resumes = user.resumes || [];
    document.getElementById('statResumes').textContent = resumes.length;
    document.getElementById('statSessions').textContent = sessions.length;

    const completedSessions = sessions.filter(s => s.status === 'Completed' && s.overallScore > 0);
    if (completedSessions.length > 0) {
        const avg = (completedSessions.reduce((sum, s) => sum + s.overallScore, 0) / completedSessions.length).toFixed(1);
        document.getElementById('statAvgScore').textContent = avg;
    }

    // ─── 3. Grab resume data (use first resume if multiple) ──────────────────
    const resume = resumes.length > 0 ? resumes[0] : null;

    // SKILLS
    const skillsEl = document.getElementById('skillsContainer');
    if (resume && resume.skills && resume.skills.length > 0) {
        skillsEl.innerHTML = resume.skills.map(skill =>
            `<span class="skill-chip inline-block px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold cursor-default">${escHtml(skill)}</span>`
        ).join('');
    } else {
        skillsEl.innerHTML = `<p class="text-sm text-gray-400 italic">Upload a resume to see skills.</p>`;
    }

    // EDUCATION
    const educationEl = document.getElementById('educationContainer');
    if (resume && resume.education && resume.education.length > 0) {
        educationEl.innerHTML = resume.education.map(edu => `
            <div class="flex gap-3">
                <div class="flex-shrink-0 w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center mt-0.5">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"></path></svg>
                </div>
                <div>
                    <p class="font-semibold text-gray-900 text-sm">${escHtml(edu.institution || '—')}</p>
                    <p class="text-gray-500 text-xs">${escHtml(edu.degree || '')} ${edu.field ? '· ' + escHtml(edu.field) : ''}</p>
                    ${edu.year ? `<p class="text-gray-400 text-xs mt-0.5">${escHtml(edu.year)}</p>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        educationEl.innerHTML = `<p class="text-sm text-gray-400 italic">No education data found.</p>`;
    }

    // ACHIEVEMENTS + CERTIFICATIONS
    const achEl = document.getElementById('achievementsContainer');
    const allAch = [
        ...(resume && resume.achievements ? resume.achievements : []),
        ...(resume && resume.certifications ? resume.certifications : [])
    ];
    if (allAch.length > 0) {
        achEl.innerHTML = allAch.map(a => `
            <div class="flex items-start gap-2">
                <span class="flex-shrink-0 mt-1 text-emerald-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                </span>
                <span class="text-sm text-gray-700">${escHtml(a)}</span>
            </div>
        `).join('');
    } else {
        achEl.innerHTML = `<p class="text-sm text-gray-400 italic">No achievements or certifications found.</p>`;
    }

    // EXPERIENCE
    const expEl = document.getElementById('experienceContainer');
    if (resume && resume.experience && resume.experience.length > 0) {
        expEl.innerHTML = resume.experience.map((exp, i) => `
            <div class="relative pl-8 ${i < resume.experience.length - 1 ? 'pb-5 border-l-2 border-gray-100 ml-3' : ''}">
                <div class="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center -ml-3">
                    <span class="w-2 h-2 rounded-full bg-blue-500 block"></span>
                </div>
                <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div class="flex flex-wrap justify-between items-start gap-2 mb-1">
                        <p class="font-bold text-gray-900 text-sm">${escHtml(exp.role || '—')}</p>
                        ${exp.duration ? `<span class="text-xs text-gray-400 font-medium bg-white border border-gray-200 px-2 py-0.5 rounded-full">${escHtml(exp.duration)}</span>` : ''}
                    </div>
                    <p class="text-sm font-semibold text-primary mb-2">${escHtml(exp.company || '—')}</p>
                    ${exp.description ? `<p class="text-xs text-gray-600 leading-relaxed">${escHtml(exp.description)}</p>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        expEl.innerHTML = `<p class="text-sm text-gray-400 italic">No experience data found.</p>`;
    }

    // PROJECTS
    const projEl = document.getElementById('projectsContainer');
    if (resume && resume.projects && resume.projects.length > 0) {
        projEl.innerHTML = resume.projects.map(proj => `
            <div class="rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                <p class="font-bold text-gray-900 text-sm mb-1">${escHtml(proj.name || '—')}</p>
                ${proj.description ? `<p class="text-xs text-gray-500 mb-2 leading-relaxed">${escHtml(proj.description)}</p>` : ''}
                ${proj.technologies && proj.technologies.length > 0
                    ? `<div class="flex flex-wrap gap-1">${proj.technologies.map(t => `<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px] font-medium">${escHtml(t)}</span>`).join('')}</div>`
                    : ''
                }
            </div>
        `).join('');
    } else {
        projEl.innerHTML = `<p class="text-sm text-gray-400 italic">No projects found.</p>`;
    }

    // ─── 4. Interview History ─────────────────────────────────────────────────
    const sessEl = document.getElementById('sessionsContainer');
    if (sessions.length > 0) {
        const rows = sessions.map(s => {
            const scoreNum = s.overallScore || 0;
            const scoreColor = scoreNum >= 7 ? 'text-emerald-600 bg-emerald-50' : scoreNum >= 4 ? 'text-amber-600 bg-amber-50' : 'text-red-500 bg-red-50';
            const statusColor = s.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : s.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';
            const date = new Date(s.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

            return `
                <div class="session-row flex items-center justify-between px-6 py-4 border-b border-gray-100 last:border-b-0 gap-4">
                    <div class="flex-grow min-w-0">
                        <p class="font-semibold text-gray-900 text-sm truncate">${escHtml(s.targetRole || 'Unknown Role')}</p>
                        <p class="text-xs text-gray-400 mt-0.5">${escHtml(s.experienceLevel || '—')} · ${date}</p>
                    </div>
                    <span class="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}">${s.status}</span>
                    ${s.status === 'Completed'
                        ? `<div class="flex-shrink-0 w-12 h-12 rounded-xl ${scoreColor} flex flex-col items-center justify-center font-extrabold">
                               <span class="text-lg leading-none">${scoreNum}</span>
                               <span class="text-[9px] font-bold opacity-60">/10</span>
                           </div>`
                        : `<div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 font-extrabold text-lg">—</div>`
                    }
                    ${s.status === 'Completed'
                        ? `<a href="Dashboard.html?sessionId=${s._id}" class="flex-shrink-0 text-xs font-semibold text-primary hover:underline">View</a>`
                        : `<span class="flex-shrink-0 text-xs text-gray-300 w-8"></span>`
                    }
                </div>
            `;
        }).join('');

        sessEl.innerHTML = rows;
    }

    // ─── Show Profile ─────────────────────────────────────────────────────────
    loadingState.classList.add('hidden');
    profileContent.classList.remove('hidden');

    // Helper: escape HTML to prevent XSS
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
});
