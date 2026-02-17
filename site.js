document.addEventListener('DOMContentLoaded', () => {
  // Storage keys
  const STORAGE_KEY_CONTENT = 'notflixx_content';
  const STORAGE_KEY_CATEGORIES = 'notflixx_categories';
  
  // Default content
  const DEFAULT_PROJECTS = [
    { id: 'p1', title: 'My First Game', category: 'games', description: 'A fun browser game.', tags: ['JavaScript'], link: '#' }
  ];
  const DEFAULT_SKILLS = [
    { name: 'JavaScript', percent: 90 },
    { name: 'CSS / UI', percent: 92 },
    { name: 'React', percent: 80 }
  ];
  const DEFAULT_CATEGORIES = [
    { id: 'games', name: 'Games' },
    { id: 'servers', name: 'Servers' },
    { id: 'staff', name: 'Staff' }
  ];

  // Get content from localStorage
  function getContent() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONTENT);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!parsed.projects || !Array.isArray(parsed.projects)) parsed.projects = DEFAULT_PROJECTS;
        if (!parsed.skills || !Array.isArray(parsed.skills)) parsed.skills = DEFAULT_SKILLS;
        return parsed;
      }
      return { projects: DEFAULT_PROJECTS, skills: DEFAULT_SKILLS };
    } catch {
      return { projects: DEFAULT_PROJECTS, skills: DEFAULT_SKILLS };
    }
  }

  // Get categories from localStorage
  function getCategories() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  // Escape HTML
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
  }

  // Get project images
  function getProjectImages() {
    try {
      return JSON.parse(localStorage.getItem('notflixx_project_images') || '{}');
    } catch {
      return {};
    }
  }

  // Load content
  const contentData = getContent();
  const categories = getCategories();
  const projectImages = getProjectImages();

  // Render skills on About page
  const skillsList = document.querySelector('.skills-list');
  if (skillsList && contentData.skills) {
    skillsList.innerHTML = contentData.skills.map(s => `
      <div class="skill">
        <div class="skill-head"><strong>${escapeHtml(s.name)}</strong><span>${s.percent}%</span></div>
        <div class="bar"><div class="fill" data-percent="${s.percent}"></div></div>
      </div>
    `).join('');
  }

  // Render projects on Projects page
  const projectTabsContainer = document.querySelector('.project-tabs');
  if (projectTabsContainer) {
    // Generate tabs
    projectTabsContainer.innerHTML = categories.map((cat, idx) => 
      `<button class="tab-btn ${idx === 0 ? 'active' : ''}" data-tab="${cat.id}">${cat.name}</button>`
    ).join('');

    // Generate tab content for each category
    let allTabContent = '';
    categories.forEach((cat, idx) => {
      const projectsInCat = contentData.projects.filter(p => p.category === cat.id);
      let html = '';
      
      if (projectsInCat.length === 0) {
        html = '<div class="empty-tab" style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);"><p>No ' + cat.name.toLowerCase() + ' yet.</p></div>';
      } else {
        html = projectsInCat.map(p => {
          const img = projectImages[p.id];
          return `
          <article class="project-card">
            <div class="project-media" ${img ? `style="background-image: url(${img}); background-size: cover; background-position: center;"` : 'style="background: linear-gradient(135deg, #00d4ff, #00ff88);"'}>
            </div>
            <div class="project-body">
              <h3>${escapeHtml(p.title)}</h3>
              <p>${escapeHtml(p.description || '')}</p>
              <div class="project-tags">${(p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
              ${p.link ? `<div class="project-actions"><a class="btn" href="${escapeHtml(p.link)}">View</a></div>` : ''}
            </div>
          </article>
          `;
        }).join('');
      }
      
      allTabContent += `<div id="tab-${cat.id}" class="tab-content ${idx === 0 ? 'active' : ''}"><div class="card-grid project-grid">${html}</div></div>`;
    });

    // Insert tab content after tabs
    projectTabsContainer.insertAdjacentHTML('afterend', allTabContent);

    // Tab click handler
    projectTabsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      
      projectTabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');
    });
  }

  // Skill bar animation
  const skillFills = document.querySelectorAll('.fill');
  skillFills.forEach(f => {
    const pct = f.dataset.percent;
    if (pct) {
      setTimeout(() => {
        f.style.width = pct + '%';
      }, 100);
    }
  });

  // Stat counters
  const statNumbers = document.querySelectorAll('.stat-number');
  statNumbers.forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    if (target > 0) {
      let start = 0;
      const interval = setInterval(() => {
        start += Math.ceil(target / 20);
        if (start >= target) {
          el.textContent = target;
          clearInterval(interval);
        } else {
          el.textContent = start;
        }
      }, 30);
    }
  });
});
