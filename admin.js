const USERNAME = 'admin';
const PASSWORD = 'hussainA5387';
const STORAGE_KEY_MESSAGES = 'notflixx_messages';
const STORAGE_KEY_USERS = 'notflixx_users';
const STORAGE_KEY_ACTIVITY = 'notflixx_activity';
const STORAGE_KEY_CURRENT = 'notflixx_current_user';
const STORAGE_KEY_AVATARS = 'notflixx_avatars';
const STORAGE_KEY_CONTENT = 'notflixx_content';
const STORAGE_KEY_PROJECT_IMAGES = 'notflixx_project_images';
const STORAGE_KEY_CATEGORIES = 'notflixx_categories';

// Default content
const DEFAULT_PROJECTS = [
  { id: 'p1', title: 'Game Project 1', category: 'games', description: 'A fun browser game with interactive gameplay.', tags: ['JavaScript', 'Canvas'], link: '#' },
  { id: 'p2', title: 'Game Project 2', category: 'games', description: 'Puzzle game with smooth animations.', tags: ['React', 'Game'], link: '#' },
  { id: 's1', title: 'Minecraft Server', category: 'servers', description: 'Custom survival server with unique features.', tags: ['Java', 'Spigot'], link: '#' },
  { id: 's2', title: 'Discord Bot', category: 'servers', description: 'Multi-purpose bot for Discord servers.', tags: ['Python', 'Discord.py'], link: '#' },
  { id: 'st1', title: 'Flix', category: 'staff', description: 'Owner & Developer', tags: ['Founder', 'Admin'], link: '' },
  { id: 'st2', title: 'Staff Member 2', category: 'staff', description: 'Moderator', tags: ['Moderator'], link: '' }
];

const DEFAULT_SKILLS = [
  { name: 'JavaScript', percent: 90 },
  { name: 'CSS / UI', percent: 92 },
  { name: 'React', percent: 80 },
  { name: 'Node / APIs', percent: 72 },
  { name: 'Design', percent: 85 }
];

const DEFAULT_CATEGORIES = [
  { id: 'games', name: 'Games', icon: '🎮' },
  { id: 'servers', name: 'Servers', icon: '🖥️' },
  { id: 'staff', name: 'Staff', icon: '👥' }
];

function getCategories() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (raw) return JSON.parse(raw);
    return DEFAULT_CATEGORIES;
  } catch { return DEFAULT_CATEGORIES; }
}

function saveCategories(cats) {
  localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
}

function addCategory(name) {
  const cats = getCategories();
  const id = name.toLowerCase().replace(/\s+/g, '-');
  if (cats.find(c => c.id === id)) return false;
  cats.push({ id, name, icon: '' });
  saveCategories(cats);
  return true;
}

function deleteCategory(id) {
  const cats = getCategories().filter(c => c.id !== id);
  saveCategories(cats);
}

function updateCategory(id, newName) {
  const cats = getCategories();
  const idx = cats.findIndex(c => c.id === id);
  if (idx === -1) return false;
  const newId = newName.toLowerCase().replace(/\s+/g, '-');
  // If ID changed, check for conflicts
  if (newId !== id && cats.find(c => c.id === newId)) return false;
  cats[idx] = { id: newId, name: newName, icon: '' };
  saveCategories(cats);
  return true;
}

function promptEditCategory(id, currentName) {
  const newName = prompt('Edit category name:', currentName);
  if (!newName || newName.trim() === '') return;
  const trimmed = newName.trim();
  if (trimmed === currentName) return;
  if (updateCategory(id, trimmed)) {
    renderContentPanel();
    logActivity('content', `Updated category: ${id} -> ${trimmed}`);
  } else {
    alert('Category name already exists or invalid!');
  }
}

// Content management functions
function getContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONTENT);
    if (raw) return JSON.parse(raw);
    return { projects: DEFAULT_PROJECTS, skills: DEFAULT_SKILLS };
  } catch { return { projects: DEFAULT_PROJECTS, skills: DEFAULT_SKILLS }; }
}

function saveContent(data) {
  localStorage.setItem(STORAGE_KEY_CONTENT, JSON.stringify(data));
}

function getProjectImages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_PROJECT_IMAGES) || '{}'); } catch { return {}; }
}

function saveProjectImages(map) {
  localStorage.setItem(STORAGE_KEY_PROJECT_IMAGES, JSON.stringify(map));
}

function setProjectImage(projectId, imageData) {
  const map = getProjectImages();
  map[projectId] = imageData;
  saveProjectImages(map);
}

function getProjectImage(projectId) {
  const map = getProjectImages();
  return map[projectId] || null;
}

function uploadProjectImage(projectId, input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    setProjectImage(projectId, reader.result);
    renderContentPanel();
    logActivity('content', `Uploaded image for project`);
  };
  reader.readAsDataURL(file);
}

function addProject(project) {
  const content = getContent();
  console.log('Adding project:', project);
  console.log('Current content:', content);
  content.projects.push({ id: 'p_' + Date.now(), ...project });
  console.log('Updated content:', content);
  saveContent(content);
}

function deleteProject(id) {
  const content = getContent();
  content.projects = content.projects.filter(p => p.id !== id);
  saveContent(content);
  renderContentPanel();
  logActivity('content', 'Deleted project');
}

function addSkill(name, percent) {
  const content = getContent();
  content.skills.push({ name, percent: parseInt(percent) });
  saveContent(content);
}

function deleteSkill(name) {
  const content = getContent();
  const decodedName = decodeURIComponent(name);
  content.skills = content.skills.filter(s => s.name !== decodedName);
  saveContent(content);
  renderContentPanel();
  logActivity('content', `Deleted skill: ${decodedName}`);
}

// Edit functions
function editProject(id) {
  const content = getContent();
  const project = content.projects.find(p => p.id === id);
  if (!project) return;
  
  const newTitle = prompt('Edit title:', project.title);
  if (newTitle === null) return;
  
  const newDesc = prompt('Edit description:', project.description);
  if (newDesc === null) return;
  
  const newCategory = prompt('Edit category (games/servers/staff):', project.category);
  if (newCategory === null) return;
  
  const newTags = prompt('Edit tags (comma separated):', project.tags.join(', '));
  if (newTags === null) return;
  
  const newLink = prompt('Edit link:', project.link);
  if (newLink === null) return;
  
  project.title = newTitle.trim();
  project.description = newDesc.trim();
  project.category = newCategory.trim();
  project.tags = newTags.split(',').map(t => t.trim()).filter(t => t);
  project.link = newLink.trim();
  
  saveContent(content);
  renderContentPanel();
  logActivity('content', `Edited project: ${project.title}`);
}

function editSkill(name) {
  const content = getContent();
  const decodedName = decodeURIComponent(name);
  const skill = content.skills.find(s => s.name === decodedName);
  if (!skill) return;
  
  const newName = prompt('Edit skill name:', skill.name);
  if (newName === null) return;
  
  const newPercent = prompt('Edit percentage:', skill.percent);
  if (newPercent === null) return;
  
  skill.name = newName.trim();
  skill.percent = parseInt(newPercent);
  
  saveContent(content);
  renderContentPanel();
  logActivity('content', `Edited skill: ${skill.name}`);
}



let currentView = 'inbox';

function genId() {
  return 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeMessage(m) {
  // ensure id is always a string (legacy data used numbers)
  const id = m.id != null ? String(m.id) : genId();

  // robustly parse createdAt (accept numbers or ISO strings)
  let createdAt = Date.now();
  if (m.createdAt != null) {
    const asNum = Number(m.createdAt);
    if (!Number.isNaN(asNum) && isFinite(asNum)) createdAt = asNum;
    else {
      const parsed = Date.parse(m.createdAt);
      createdAt = Number.isNaN(parsed) ? Date.now() : parsed;
    }
  }

  return {
    id,
    name: m.name || m.from || 'Anonymous',
    email: m.email || '',
    subject: m.subject || '',
    message: m.message || '',
    createdAt,
    pinned: !!m.pinned,
    archived: !!m.archived,
    trashed: !!m.trashed,
    read: !!m.read,
  };
}

function getMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const arr = raw ? JSON.parse(raw) : [];
    const normalized = arr.map(normalizeMessage);
    // persist normalized back to storage so legacy entries get ids/defaults
    saveMessages(normalized);
    return normalized;
  } catch (err) {
    console.error('read messages error', err);
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
}

function sortMessages(arr) {
  return arr.slice().sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });
}

function getFilteredMessages(messages, view) {
  switch (view) {
    case 'pinned':
      return messages.filter(m => m.pinned && !m.trashed);
    case 'archived':
      return messages.filter(m => m.archived && !m.trashed);
    case 'trash':
      return messages.filter(m => m.trashed);
    case 'all':
      return messages.slice();
    case 'inbox':
    default:
      return messages.filter(m => !m.archived && !m.trashed);
  }
}

function updateCounts(messages) {
  const inbox = messages.filter(m => !m.archived && !m.trashed).length;
  const pinned = messages.filter(m => m.pinned && !m.trashed).length;
  const archived = messages.filter(m => m.archived && !m.trashed).length;
  const trash = messages.filter(m => m.trashed).length;
  document.getElementById('countInbox').textContent = inbox;
  document.getElementById('countPinned').textContent = pinned;
  document.getElementById('countArchived').textContent = archived;
  document.getElementById('countTrash').textContent = trash;
  document.getElementById('countAll').textContent = messages.length;
}

function setView(view) {
  currentView = view;
  document.querySelectorAll('.inbox-tabs .tab').forEach(t => {
    t.classList.toggle('active', t.dataset.view === view);
  });
  const clearBtn = document.getElementById('clearMessages');
  if (clearBtn) {
    if (view === 'trash') clearBtn.textContent = 'Empty Trash';
    else if (view === 'archived') clearBtn.textContent = 'Clear Archived';
    else if (view === 'pinned') clearBtn.textContent = 'Clear Pinned';
    else if (view === 'all') clearBtn.textContent = 'Clear All';
    else if (view === 'content') clearBtn.textContent = '';
    else clearBtn.textContent = 'Clear Inbox';
  }

  // Handle content panel
  const messagesPanel = document.getElementById('messagesPanel');
  const contentPanel = document.getElementById('contentPanel');
  if (view === 'content') {
    if (messagesPanel) messagesPanel.style.display = 'none';
    if (contentPanel) contentPanel.style.display = 'block';
    renderContentPanel();
  } else {
    if (messagesPanel) messagesPanel.style.display = 'block';
    if (contentPanel) contentPanel.style.display = 'none';
    renderMessages();
  }
}

function renderMessages() {
  const panel = document.getElementById('messagesPanel');
  const list = document.getElementById('messagesList');
  if (!panel || !list) return;

  // Don't show messages panel if we're on content view
  if (currentView === 'content') return;

  const messages = getMessages();
  panel.style.display = 'block';

  const filtered = sortMessages(getFilteredMessages(messages, currentView));
  const header = document.querySelector('.admin-messages-header h2');
  if (header) header.textContent = `${currentView[0].toUpperCase() + currentView.slice(1)} (${filtered.length})`;

  updateCounts(messages);

  const me = getCurrentUser();
  const roleRank = (r) => ({ viewer:1, mod:2, admin:3, owner:4 }[r] || 0);
  const canDelete = me && roleRank(me.role) >= 3; // admin+
  const canModerate = me && roleRank(me.role) >= 2; // mod+

  if (!filtered.length) {
    list.innerHTML = '<p class="contact-sub">No messages in this view.</p>';
    return;
  }

  list.innerHTML = filtered
    .map(m => {
      const stateClasses = [m.read ? 'read' : 'unread', m.pinned ? 'pinned' : '', m.archived ? 'archived' : '', m.trashed ? 'trashed' : ''].filter(Boolean).join(' ');

      // action buttons respect simple permission rules
      const readBtn = `<button class="msg-btn" data-action="toggleRead" data-id="${m.id}" title="${m.read ? 'Mark unread' : 'Mark read'}">${m.read ? '📪' : '📬'}</button>`;
      const pinBtn = `<button class="msg-btn" data-action="togglePin" data-id="${m.id}" title="${m.pinned ? 'Unpin' : 'Pin'}">📌</button>`;
      const archiveBtn = `<button class="msg-btn" data-action="toggleArchive" data-id="${m.id}" title="${m.archived ? 'Unarchive' : 'Archive'}">${m.archived ? '📤' : '🗄️'}</button>`;
      const trashBtn = `<button class="msg-btn" data-action="trash" data-id="${m.id}" title="Move to trash">🗑️</button>`;
      const restoreBtn = `<button class="msg-btn" data-action="restore" data-id="${m.id}" title="Restore">↩️</button>`;
      const delBtn = canDelete ? `<button class="msg-btn" data-action="deletePermanent" data-id="${m.id}" title="Delete permanently">🗑️</button>` : `<button class="msg-btn" disabled title="Requires admin">🗑️</button>`;

      const actions = [];
      if (canModerate) actions.push(readBtn, pinBtn, archiveBtn);
      else actions.push(readBtn);
      if (m.trashed) actions.push(canDelete ? delBtn : `<button class="msg-btn" disabled title="Requires admin">🗑️</button>`, restoreBtn);
      else actions.push(trashBtn);

      return `
      <div class="message-card ${stateClasses}" data-id="${m.id}">
        <div class="message-header">
          <strong>${escapeHtml(m.name)}</strong>
          <span>${escapeHtml(m.email)}</span>
        </div>
        <div class="message-meta">
          <span>${escapeHtml(m.subject || '(no subject)')}</span>
          <span>${new Date(m.createdAt).toLocaleString()}</span>
        </div>
        <p class="message-body">${escapeHtml(m.message).replace(/\n/g, '<br>')}</p>
        <div class="message-actions">
          ${actions.join('\n')}
        </div>
      </div>`;
    })
    .join('\n');
}

function updateMessage(id, patch) {
  const messages = getMessages();
  const sId = String(id);
  const idx = messages.findIndex(m => String(m.id) === sId);
  if (idx === -1) return;
  messages[idx] = Object.assign({}, messages[idx], patch);
  saveMessages(messages);
  renderMessages();
}

function togglePin(id) {
  const messages = getMessages();
  const m = messages.find(x => String(x.id) === String(id));
  if (!m) return;
  updateMessage(id, { pinned: !m.pinned });
}

function toggleArchive(id) {
  const messages = getMessages();
  const m = messages.find(x => x.id === id);
  if (!m) return;
  // archiving should also unpin
  updateMessage(id, { archived: !m.archived, pinned: m.archived ? m.pinned : false });
}

function toggleRead(id) {
  const messages = getMessages();
  const m = messages.find(x => x.id === id);
  if (!m) return;
  updateMessage(id, { read: !m.read });
}

function moveToTrash(id) {
  updateMessage(id, { trashed: true, archived: false, pinned: false });
}

function restoreMessage(id) {
  updateMessage(id, { trashed: false, archived: false });
}

function deletePermanent(id) {
  const sId = String(id);
  const messages = getMessages().filter(m => String(m.id) !== sId);
  saveMessages(messages);
  renderMessages();
}

function clearCurrentView() {
  const messages = getMessages();
  if (currentView === 'trash') {
    if (!confirm('Permanently delete all messages in Trash?')) return;
    const remaining = messages.filter(m => !m.trashed);
    saveMessages(remaining);
    renderMessages();
    return;
  }

  if (currentView === 'archived') {
    if (!confirm('Delete all archived messages? (this is permanent)')) return;
    const remaining = messages.filter(m => !m.archived);
    saveMessages(remaining);
    renderMessages();
    return;
  }

  if (currentView === 'pinned') {
    if (!confirm('Unpin all pinned messages?')) return;
    messages.forEach(m => { if (m.pinned) m.pinned = false; });
    saveMessages(messages);
    renderMessages();
    return;
  }

  if (currentView === 'all') {
    if (!confirm('Clear all messages? This will permanently delete everything stored on this device.')) return;
    localStorage.removeItem(STORAGE_KEY_MESSAGES);
    renderMessages();
    return;
  }

  // default: clear inbox (remove non-trashed messages)
  if (!confirm('Clear inbox messages from this device?')) return;
  const remaining = messages.filter(m => m.trashed);
  saveMessages(remaining);
  renderMessages();
}

/* ---------- event wiring ---------- */

/* ----------------- user & analytics helpers ----------------- */

function hashPassword(pw) {
  try { return btoa(String(pw)); } catch { return String(pw); }
}

function getUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    let arr = raw ? JSON.parse(raw) : [];

    // ensure the built‑in admin account always exists and is OWNER
    const ownerHash = hashPassword(PASSWORD);
    const existing = arr.find(u => u.username === USERNAME);
    if (!existing) {
      arr.push({
        id: 'u_owner',
        username: USERNAME,
        password: ownerHash,
        role: 'owner',
        active: true,
        createdAt: Date.now()
      });
    } else {
      existing.role = 'owner';
      existing.active = true;
      if (!existing.password) existing.password = ownerHash;
    }

    // ensure each user has a displayName
    arr = arr.map(u => {
      u.displayName = u.displayName || u.username;
      return u;
    });

    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(arr));
    return arr;
  } catch (err) {
    console.error('getUsers', err);
    return [];
  }
}

function saveUsers(list) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(list));
}

function authenticateUser(username, password) {
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return null;
  if (!u.active) return { error: 'Account disabled' };
  if (u.password === hashPassword(password)) return u;
  return null;
}

function setCurrentUser(username) {
  sessionStorage.setItem(STORAGE_KEY_CURRENT, username);
}

function getCurrentUser() {
  const name = sessionStorage.getItem(STORAGE_KEY_CURRENT);
  if (!name) return null;
  return getUsers().find(u => u.username === name) || null;
}

function logoutCurrentUser() {
  sessionStorage.removeItem(STORAGE_KEY_CURRENT);
  location.reload();
}

function logActivity(kind, text) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ id: genId(), time: Date.now(), kind, text });
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(list.slice(0, 200)));
  } catch (e) { console.error(e); }
}

function getActivity() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_ACTIVITY) || '[]'); } catch { return []; }
}

function clearActivity() { localStorage.removeItem(STORAGE_KEY_ACTIVITY); renderActivity(); }

function userRoleRank(role) { return ({ viewer:1, mod:2, admin:3, owner:4 }[role] || 0); }
function describePermissions(role) {
  switch (role) {
    case 'owner':
      return 'Owner';
    case 'admin':
      return 'Admin';
    case 'mod':
      return 'Moderator';
    case 'viewer':
    default:
      return 'Viewer';
  }
}

function getAvatarMap() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_AVATARS) || '{}'); } catch { return {}; }
}

function saveAvatarMap(map) {
  localStorage.setItem(STORAGE_KEY_AVATARS, JSON.stringify(map));
}

function getAvatar(username) {
  const map = getAvatarMap();
  return map[username] || null;
}

function setAvatar(username, dataUrl) {
  const map = getAvatarMap();
  map[username] = dataUrl;
  saveAvatarMap(map);
}
function canPerform(action) {
  const me = getCurrentUser();
  if (!me) return false;
  const rank = userRoleRank(me.role);
  switch (action) {
    case 'manageUsers': return rank >= 4; // owner only
    case 'delete': return rank >= 4; // owner only
    case 'moderate': return rank >= 2; // mod+
    case 'view': return rank >= 1;
    default: return false;
  }
}

/* ----------------- UI renderers for users/activity/analytics ----------------- */
function renderCurrentUser() {
  const info = document.getElementById('currentUserInfo');
  const me = getCurrentUser();
  if (!info) return;
  if (!me) { info.textContent = 'Not signed in'; return; }

  const avatarUrl = getAvatar(me.username);
  const initials = escapeHtml((me.username || '?')[0].toUpperCase());
  const permsText = describePermissions(me.role);

  info.innerHTML = `
    <div class="current-user-card">
      <div class="current-user-main">
        <div class="avatar-circle ${avatarUrl ? 'has-image' : ''}">
          ${avatarUrl ? `<img src="${avatarUrl}" alt="${escapeHtml(me.username)}">` : initials}
        </div>
        <div class="current-user-text">
          <div class="current-user-name">${escapeHtml(me.username)}</div>
          <div class="current-user-perms">${escapeHtml(permsText)}</div>
        </div>
      </div>
      <div class="current-user-actions">
        <button id="openProfile" class="btn btn-ghost small-ghost">Profile</button>
        <button id="logoutBtn" class="btn btn-ghost small-ghost">Logout</button>
      </div>
    </div>
  `;

  const lb = document.getElementById('logoutBtn');
  if (lb) lb.addEventListener('click', logoutCurrentUser);

  const openProfile = document.getElementById('openProfile');
  const profilePanel = document.getElementById('profilePanel');
  if (openProfile && profilePanel) {
    openProfile.addEventListener('click', () => {
      profilePanel.classList.toggle('open');
    });
  }
}

function renderUsers() {
  const list = document.getElementById('usersList');
  const form = document.getElementById('createUserForm');
  if (!list) return;
  const users = getUsers();
  const me = getCurrentUser();

  if (!canPerform('manageUsers')) {
    // hide creation UI and show a read-only list
    if (form) form.style.display = 'none';
    list.innerHTML = users.map(u => `
      <div class="user-row" data-username="${u.username}">
        <div class="user-meta">
          <strong>${escapeHtml(u.username)}</strong>
          <div class="role-badge">${escapeHtml(describePermissions(u.role))}</div>
        </div>
        <div class="user-actions">
          <div style="opacity:0.85; font-size:13px;">${u.active ? 'Active' : 'Disabled'}</div>
        </div>
      </div>
    `).join('');
    return;
  }

  if (form) form.style.display = '';

  list.innerHTML = users.map(u => {
    const isOwnerAdmin = u.username === USERNAME;
    const me = getCurrentUser();
    const isOwner = me && me.role === 'owner';
    const isCurrentUser = me && u.username === me.username;

    if (isOwnerAdmin) {
      return `
        <div class="user-row" data-username="${u.username}">
          <div class="user-meta">
            <strong>${escapeHtml(u.username)}</strong>
            <div class="role-badge">Owner</div>
          </div>
          <div class="user-actions">
            <span style="font-size:12px;opacity:.8;">Cannot change built-in admin</span>
          </div>
        </div>
      `;
    }
    const avatarUrl = getAvatar(u.username);
    const avatarHtml = avatarUrl ? `<img src="${escapeHtml(avatarUrl)}" class="user-avatar user-avatar--lg" alt="${escapeHtml(u.username)}">` : `<div class="user-avatar user-avatar--lg">${escapeHtml((u.username||'')[0]||'N')}</div>`;

    return `
      <div class="user-row" data-username="${u.username}">
        <div class="user-meta">
          ${avatarHtml}
          <div style="margin-left:12px;">
            <strong>${escapeHtml(u.displayName || u.username)}</strong>
            <div class="role-badge">${escapeHtml(describePermissions(u.role))}</div>
          </div>
        </div>
        <div class="user-actions">
          <select class="role-select" data-username="${u.username}" ${isCurrentUser ? 'disabled' : ''}>
            <option value="viewer" ${u.role==='viewer'?'selected':''}>Viewer</option>
            <option value="mod" ${u.role==='mod'?'selected':''}>Moderator</option>
            <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
            <option value="owner" ${u.role==='owner'?'selected':''}>Owner</option>
          </select>

          ${isOwner && !isOwnerAdmin ? `<button class="btn btn-ghost" data-action="loginAs" data-username="${u.username}">Login</button>` : ''}
          ${isOwner && !isOwnerAdmin ? `<button class="btn btn-ghost" data-action="changePassword" data-username="${u.username}">Password</button>` : ''}

          ${!isCurrentUser ? `<button class="btn" data-action="toggleActive" data-username="${u.username}">${u.active? 'Disable':'Enable'}</button>` : ''}
          ${!isCurrentUser ? `<button class="btn btn-ghost" data-action="deleteUser" data-username="${u.username}">Delete</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderActivity() {
  const el = document.getElementById('activityLog');
  if (!el) return;
  const entries = getActivity();
  el.innerHTML = entries.slice(0, 50).map(en => `<div class="activity-entry"><strong>${new Date(en.time).toLocaleTimeString()}</strong> — ${escapeHtml(en.kind)}: ${escapeHtml(en.text)}</div>`).join('');
}

function renderContentPanel() {
  const me = getCurrentUser();
  const panel = document.getElementById('contentPanel');
  if (!panel) return;

  // Only owners can access content management
  if (!me || me.role !== 'owner') {
    panel.innerHTML = '<p class="contact-sub">Content management is only available for owners.</p>';
    return;
  }

  const content = getContent();
  const categories = getCategories();

  // Populate project category dropdown
  const categorySelect = document.getElementById('projCategory');
  if (categorySelect) {
    categorySelect.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  // Render projects
  const projList = document.getElementById('projectsList');
  const projectImages = getProjectImages();
  if (projList) {
    if (content.projects.length === 0) {
      projList.innerHTML = '<div class="empty-content"><div class="empty-content-icon">🌊</div><p>No projects yet. Add one above!</p></div>';
    } else {
      projList.innerHTML = content.projects.map(p => {
        const img = projectImages[p.id];
        return `
        <div class="content-item">
          ${img ? `<div class="content-item-image" style="height: 120px; border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: linear-gradient(135deg, rgba(0,200,255,0.2), rgba(0,255,136,0.1)); display: flex; align-items: center; justify-content: center;"><img src="${img}" style="width: 100%; height: 100%; object-fit: cover;"></div>` : ''}
          <div class="content-item-header">
            <span class="content-item-title">${escapeHtml(p.title)}</span>
            <span class="content-item-badge">${escapeHtml(p.category)}</span>
          </div>
          <p class="content-item-desc">${escapeHtml(p.description || 'No description')}</p>
          <div class="content-item-tags">
            ${(p.tags || []).map(t => `<span class="content-item-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
          <div class="content-item-actions">
            <button class="btn btn-ghost" onclick="document.getElementById('img-${p.id}').click()">📷 Image</button>
            <input type="file" id="img-${p.id}" accept="image/*" style="display:none" onchange="uploadProjectImage('${p.id}', this)">
            <button class="btn btn-ghost" onclick="editProject('${p.id}')">Edit</button>
            <button class="btn btn-ghost" style="color: #ff6b6b;" onclick="deleteProject('${p.id}')">Delete</button>
          </div>
        </div>
      `}).join('');
    }
  }

  // Render skills
  const skillList = document.getElementById('skillsList');
  if (skillList) {
    if (content.skills.length === 0) {
      skillList.innerHTML = '<div class="empty-content"><div class="empty-content-icon">🔱</div><p>No skills yet. Add one above!</p></div>';
    } else {
      skillList.innerHTML = content.skills.map(s => `
        <div class="content-item">
          <div class="content-item-header">
            <span class="content-item-title">${escapeHtml(s.name)}</span>
            <span class="content-item-percent">${s.percent}%</span>
          </div>
          <div class="bar" style="height: 8px; background: rgba(0,200,255,0.1); border-radius: 4px; overflow: hidden;">
            <div class="fill" data-percent="${s.percent}" style="width: ${s.percent}%; height: 100%; background: linear-gradient(90deg, #00d4ff, #00ff88); border-radius: 4px;"></div>
          </div>
          <div class="content-item-actions">
            <button class="btn btn-ghost" onclick="editSkill('${encodeURIComponent(s.name)}')">Edit</button>
            <button class="btn btn-ghost" style="color: #ff6b6b;" onclick="deleteSkill('${encodeURIComponent(s.name)}')">Delete</button>
          </div>
        </div>
      `).join('');
    }
  }

  // Render categories
  const categoriesList = document.getElementById('categoriesList');
  if (categoriesList) {
    if (categories.length === 0) {
      categoriesList.innerHTML = '<div class="empty-content"><div class="empty-content-icon">📁</div><p>No categories yet. Add one above!</p></div>';
    } else {
      categoriesList.innerHTML = categories.map(c => `
        <div class="content-item">
          <div class="content-item-header">
            <span class="content-item-title">${escapeHtml(c.name)}</span>
            <span class="content-item-badge">${c.id}</span>
          </div>
          <div class="content-item-actions">
            <button class="btn btn-ghost" onclick="promptEditCategory('${c.id}', '${escapeHtml(c.name)}')">Edit</button>
            <button class="btn btn-ghost" style="color: #ff6b6b;" onclick="deleteCategory('${c.id}')">Delete</button>
          </div>
        </div>
      `).join('');
    }
  }
}

function renderAnalytics() {
  const messages = getMessages();
  const total = messages.length;
  const unread = messages.filter(m => !m.read && !m.trashed).length;
  const pinned = messages.filter(m => m.pinned && !m.trashed).length;
  const archived = messages.filter(m => m.archived && !m.trashed).length;
  const trash = messages.filter(m => m.trashed).length;
  const today = messages.filter(m => (Date.now() - m.createdAt) < 1000*60*60*24).length;

  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('statTotal', total);
  setText('statUnread', unread);
  setText('statPinned', pinned);
  setText('statArchived', archived);
  setText('statTrash', trash);

  const chart = document.getElementById('statusChart');
  if (chart) {
    const colors = { unread:'#ff7aa2', pinned:'#ffd66b', archived:'#6fb3ff', trash:'#9b9bff' };
    const totalNonZero = Math.max(1, total);
    chart.innerHTML = `
      <div class="status-bar" title="status distribution">
        <div class="status-fill" style="width:${(unread/totalNonZero)*100}% ; background:${colors.unread}"></div>
        <div class="status-fill" style="width:${(pinned/totalNonZero)*100}% ; background:${colors.pinned}"></div>
        <div class="status-fill" style="width:${(archived/totalNonZero)*100}% ; background:${colors.archived}"></div>
        <div class="status-fill" style="width:${(trash/totalNonZero)*100}% ; background:${colors.trash}"></div>
      </div>
      <div class="status-labels"><span>Unread ${unread}</span><span>Pinned ${pinned}</span><span>Archived ${archived}</span><span>Trash ${trash}</span></div>
    `;
  }
}

/* ----------------- user management actions ----------------- */
function createUser(username, password, role = 'viewer') {
  if (username === USERNAME) throw new Error('Built-in admin is managed automatically.');
  const users = getUsers();
  if (users.find(u => u.username === username)) throw new Error('Username exists');
  const u = { id: 'u_' + Date.now().toString(36), username, password: hashPassword(password), role, active: true, createdAt: Date.now() };
  users.push(u); saveUsers(users); logActivity('user', `Created user ${username} (${role})`); renderUsers();
}

function deleteUser(username) {
  if (username === USERNAME) return; // cannot delete built-in owner
  let users = getUsers();
  users = users.filter(u => u.username !== username);
  saveUsers(users); logActivity('user', `Deleted user ${username}`); renderUsers();
}

function toggleUserActive(username) {
  if (username === USERNAME) return; // cannot disable built-in owner
  const users = getUsers(); const u = users.find(x => x.username === username); if (!u) return; u.active = !u.active; saveUsers(users); logActivity('user', `${u.active? 'Enabled':'Disabled'} ${username}`); renderUsers();
}

function updateUserRole(username, role) {
  if (username === USERNAME) return; // cannot change owner permissions
  const users = getUsers(); const u = users.find(x => x.username === username); if (!u) return; u.role = role; saveUsers(users); logActivity('user', `Set role ${username} → ${role}`); renderUsers();
}

function changeUserPassword(username, newPassword) {
  const me = getCurrentUser();
  if (!me || me.role !== 'owner') return; // only owner can change passwords
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return;
  u.password = hashPassword(newPassword);
  saveUsers(users);
  logActivity('user', `Changed password for ${username}`);
  alert(`Password changed for ${username}`);
  renderUsers();
}

function loginAsUser(username) {
  const me = getCurrentUser();
  if (!me || me.role !== 'owner') return; // only owner can login as other users
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return;
  if (!u.active) { alert('Cannot login as disabled user'); return; }
  setCurrentUser(username);
  logActivity('auth', `Owner logged in as ${username}`);
  location.reload();
}

/* ----------------- attach events + integrate permissions + logging ----------------- */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const loginCard = document.getElementById('loginCard');
  const messagesPanel = document.getElementById('messagesPanel');
  const clearBtn = document.getElementById('clearMessages');
  const tabs = document.querySelectorAll('.inbox-tabs .tab');
  const list = document.getElementById('messagesList');
  const createUserForm = document.getElementById('createUserForm');
  const usersList = document.getElementById('usersList');
  const clearActivityBtn = document.getElementById('clearActivity');
  const passwordForm = document.getElementById('passwordForm');
  const avatarForm = document.getElementById('avatarForm');
  const profileStatus = document.getElementById('profileStatus');

  // try session login
  const sessionUser = getCurrentUser();
  if (sessionUser) {
    if (loginCard) loginCard.style.display = 'none';
    if (messagesPanel) messagesPanel.style.display = 'block';
    renderCurrentUser();
    renderUsers();
    renderActivity();
    renderAnalytics();
    renderMessages();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      const res = authenticateUser(username, password);
      if (res && !res.error) {
        setCurrentUser(res.username);
        if (loginStatus) { loginStatus.textContent = ''; }
        if (loginCard) loginCard.style.display = 'none';
        if (messagesPanel) messagesPanel.style.display = 'block';
        renderCurrentUser();
        renderUsers();
        renderActivity();
        renderAnalytics();
        setView('inbox');
        logActivity('auth', `${res.username} signed in`);
      } else {
        if (loginStatus) {
          loginStatus.textContent = res && res.error ? res.error : 'Wrong username or password.';
          loginStatus.style.color = '#ff5c7a';
        }
      }
    });
  }

  if (tabs) {
    tabs.forEach(t => t.addEventListener('click', () => { setView(t.dataset.view); renderAnalytics(); }));
  }

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!canPerform('delete')) { alert('Insufficient permissions'); return; }
    clearCurrentView(); logActivity('messages', 'Cleared current view'); renderAnalytics();
  });

  const contentBtn = document.getElementById('contentBtn');
  if (contentBtn) {
    contentBtn.addEventListener('click', () => { setView('content'); });
  }

  if (list) {
    list.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const me = getCurrentUser();
      switch (action) {
        case 'togglePin': if (!canPerform('moderate')) { alert('Insufficient permissions'); return; } togglePin(id); logActivity('msg', `${me.username} toggled pin ${id}`); break;
        case 'toggleArchive': if (!canPerform('moderate')) { alert('Insufficient permissions'); return; } toggleArchive(id); logActivity('msg', `${me.username} toggled archive ${id}`); break;
        case 'trash': if (!canPerform('moderate')) { alert('Insufficient permissions'); return; } moveToTrash(id); logActivity('msg', `${me.username} moved to trash ${id}`); break;
        case 'restore': if (!canPerform('moderate')) { alert('Insufficient permissions'); return; } restoreMessage(id); logActivity('msg', `${me.username} restored ${id}`); break;
        case 'deletePermanent': if (!canPerform('delete')) { alert('Insufficient permissions'); return; } deletePermanent(id); logActivity('msg', `${me.username} deleted ${id}`); break;
        case 'toggleRead': toggleRead(id); logActivity('msg', `${me ? me.username : 'anon'} toggled read ${id}`); break;
      }
      renderAnalytics();
      renderActivity();
    });
  }

  if (createUserForm) {
    createUserForm.addEventListener('submit', e => {
      e.preventDefault();
      
      const me = getCurrentUser();
      if (!me) { alert('You must be logged in'); return; }
      
      // Only owners can create users
      if (me.role !== 'owner') {
        alert('Only owners can create users');
        return;
      }
      
      const myRank = userRoleRank(me.role);
      const username = document.getElementById('newUsername').value.trim();
      const password = document.getElementById('newPassword').value;
      const role = document.getElementById('newRole').value;
      const targetRank = userRoleRank(role);
      
      // If trying to create owner rank, require code verification FIRST
      if (role === 'owner') {
        // Check if locked out
        const lockKey = 'owner_create_lock';
        const lockUntil = sessionStorage.getItem(lockKey);
        if (lockUntil && Date.now() < parseInt(lockUntil)) {
          const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / 1000);
          alert(`Too many failed attempts. Try again in ${remaining} seconds.`);
          return;
        }
        
        // Prompt for code FIRST
        const attemptsKey = 'owner_create_attempts';
        let attempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');
        const code = prompt(`You are creating an OWNER account. Enter verification code (${3 - attempts} attempts remaining):`);
        
        if (code !== '826470') {
          attempts++;
          sessionStorage.setItem(attemptsKey, attempts.toString());
          
          if (attempts >= 3) {
            // Lock out for 1 minute
            sessionStorage.setItem(lockKey, (Date.now() + 60000).toString());
            sessionStorage.removeItem(attemptsKey);
            alert('Too many failed attempts. Locked for 1 minute.');
          } else {
            alert('Incorrect code.');
          }
          return;
        }
        
        // Code correct - reset attempts
        sessionStorage.removeItem(attemptsKey);
      } else {
        // For non-owner ranks, use the rank check
        if (targetRank >= myRank) {
          alert(`You cannot create users with rank '${role}' (your rank: ${me.role})`);
          return;
        }
      }

      try {
        createUser(username, password, role);

        // clear inputs
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';

        renderUsers();
        renderActivity();
      } catch (err) { alert(err.message); }
    });
  }

  if (usersList) {
    usersList.addEventListener('change', e => {
      const sel = e.target.closest('.role-select');
      if (!sel) return;

      const me = getCurrentUser();
      // prevent users from modifying their own role
      if (me && sel.dataset.username === me.username) {
        alert('You cannot change your own role');
        renderUsers();
        return;
      }

      // Only owners can change user roles
      if (!me || me.role !== 'owner') {
        alert('Only owners can change user roles');
        renderUsers();
        return;
      }
      
      const myRank = userRoleRank(me.role);
      const targetRank = userRoleRank(sel.value);
      
      // If promoting to owner, require code verification FIRST
      if (sel.value === 'owner') {
        // Check if locked out
        const lockKey = 'owner_promote_lock';
        const lockUntil = sessionStorage.getItem(lockKey);
        if (lockUntil && Date.now() < parseInt(lockUntil)) {
          const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / 1000);
          alert(`Too many failed attempts. Try again in ${remaining} seconds.`);
          renderUsers();
          return;
        }
        
        // Prompt for code FIRST
        const attemptsKey = 'owner_promote_attempts';
        let attempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');
        const code = prompt(`You are promoting a user to OWNER. Enter verification code (${3 - attempts} attempts remaining):`);
        
        if (code !== '826470') {
          attempts++;
          sessionStorage.setItem(attemptsKey, attempts.toString());
          
          if (attempts >= 3) {
            sessionStorage.setItem(lockKey, (Date.now() + 60000).toString());
            sessionStorage.removeItem(attemptsKey);
            alert('Too many failed attempts. Locked for 1 minute.');
          } else {
            alert('Incorrect code.');
          }
          renderUsers();
          return;
        }
        
        sessionStorage.removeItem(attemptsKey);
      } else {
        // For non-owner ranks, use the rank check
        if (targetRank >= myRank) {
          alert(`You cannot set rank to '${sel.value}' (your rank: ${me.role})`);
          renderUsers();
          return;
        }
      }
      
      updateUserRole(sel.dataset.username, sel.value);
      renderActivity();
    });

    usersList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const act = btn.dataset.action;
      const uname = btn.dataset.username;
      const me = getCurrentUser();

      // prevent users from modifying their own account
      if (me && uname === me.username) {
        alert('You cannot modify your own account');
        return;
      }

      // Only owners can delete or toggle users
      if (me.role !== 'owner') {
        alert('Only owners can delete or disable users');
        return;
      }

      if (act === 'toggleActive') {
        const targetUser = getUsers().find(u => u.username === uname);
        if (targetUser && userRoleRank(targetUser.role) >= userRoleRank(me.role)) {
          alert(`You cannot modify users with rank '${targetUser.role}' or higher`);
          return;
        }
        toggleUserActive(uname); renderActivity();
      }
      if (act === 'deleteUser') {
        const targetUser = getUsers().find(u => u.username === uname);
        if (targetUser && userRoleRank(targetUser.role) >= userRoleRank(me.role)) {
          alert(`You cannot delete users with rank '${targetUser.role}' or higher`);
          return;
        }
        if (!confirm('Delete user ' + uname + '?')) return;
        deleteUser(uname); renderActivity();
      }
      if (act === 'loginAs') {
        if (!confirm('Login as ' + uname + '? This will log you out from your current account.')) return;
        loginAsUser(uname);
      }
      if (act === 'changePassword') {
        const newPass = prompt('Enter new password for ' + uname + ':');
        if (!newPass || !newPass.trim()) return;
        const confirmPass = prompt('Confirm new password:');
        if (newPass !== confirmPass) { alert('Passwords do not match'); return; }
        changeUserPassword(uname, newPass);
      }
    });
  }

  if (clearActivityBtn) clearActivityBtn.addEventListener('click', () => { if (!confirm('Clear activity log?')) return; clearActivity(); });

  // Content tab switching (Projects/Skills)
  const contentTabs = document.querySelectorAll('.content-tabs .tab-btn');
  contentTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      contentTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const ctype = btn.dataset.ctype;
      document.getElementById('projectsContent').style.display = ctype === 'projects' ? 'block' : 'none';
      document.getElementById('skillsContent').style.display = ctype === 'skills' ? 'block' : 'none';
      document.getElementById('categoriesContent').style.display = ctype === 'categories' ? 'block' : 'none';
    });
  });

  // Add project form
  const addProjectForm = document.getElementById('addProjectForm');
  if (addProjectForm) {
    addProjectForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me || me.role !== 'owner') { alert('Only owners can manage content'); return; }
      const project = {
        title: document.getElementById('projTitle').value.trim(),
        category: document.getElementById('projCategory').value,
        description: document.getElementById('projDesc').value.trim(),
        tags: document.getElementById('projTags').value.split(',').map(t => t.trim()).filter(t => t),
        link: document.getElementById('projLink').value.trim()
      };
      addProject(project);
      addProjectForm.reset();
      renderContentPanel();
      logActivity('content', `Added project: ${project.title}`);
    });
  }

  // Add skill form
  const addSkillForm = document.getElementById('addSkillForm');
  if (addSkillForm) {
    addSkillForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me || me.role !== 'owner') { alert('Only owners can manage content'); return; }
      const name = document.getElementById('skillName').value.trim();
      const percent = document.getElementById('skillPercent').value;
      addSkill(name, percent);
      addSkillForm.reset();
      renderContentPanel();
      logActivity('content', `Added skill: ${name} (${percent}%)`);
    });
  }

  // Add category form
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me || me.role !== 'owner') { alert('Only owners can manage content'); return; }
      const name = document.getElementById('categoryName').value.trim();
      if (addCategory(name)) {
        addCategoryForm.reset();
        renderContentPanel();
        logActivity('content', `Added category: ${name}`);
      } else {
        alert('Category already exists!');
      }
    });
  }

  // Delete project/skill buttons
  const projectsList = document.getElementById('projectsList');
  const skillsList = document.getElementById('skillsList');

  const handleContentDelete = (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const me = getCurrentUser();
    if (!me || me.role !== 'owner') { alert('Only owners can manage content'); return; }
    if (btn.dataset.action === 'deleteProject') {
      if (!confirm('Delete this project?')) return;
      deleteProject(btn.dataset.id);
      renderContentPanel();
      logActivity('content', 'Deleted project');
    }
    if (btn.dataset.action === 'deleteSkill') {
      if (!confirm('Delete this skill?')) return;
      deleteSkill(btn.dataset.name);
      renderContentPanel();
      logActivity('content', `Deleted skill: ${btn.dataset.name}`);
    }
  };

  if (projectsList) projectsList.addEventListener('click', handleContentDelete);
  if (skillsList) skillsList.addEventListener('click', handleContentDelete);

  if (passwordForm) {
    passwordForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me) return;
      const current = document.getElementById('currentPassword').value;
      const next = document.getElementById('newPassword').value;
      const confirmPw = document.getElementById('confirmPassword').value;
      if (next !== confirmPw) {
        if (profileStatus) { profileStatus.textContent = 'New passwords do not match.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      const users = getUsers();
      const u = users.find(x => x.username === me.username);
      if (!u || u.password !== hashPassword(current)) {
        if (profileStatus) { profileStatus.textContent = 'Current password is incorrect.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      u.password = hashPassword(next);
      saveUsers(users);
      logActivity('user', `${me.username} changed their password`);
      if (profileStatus) { profileStatus.textContent = 'Password updated.'; profileStatus.style.color = '#6cffb2'; }
      passwordForm.reset();
    });
  }

  if (avatarForm) {
    avatarForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me) return;
      const fileInput = document.getElementById('avatarFile');
      const file = fileInput && fileInput.files[0];
      if (!file) {
        if (profileStatus) { profileStatus.textContent = 'Choose a picture first.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatar(me.username, reader.result);
        renderCurrentUser();
        logActivity('user', `${me.username} updated their avatar`);
        if (profileStatus) { profileStatus.textContent = 'Profile picture updated.'; profileStatus.style.color = '#6cffb2'; }
      };
      reader.readAsDataURL(file);
    });
  }

  // render on load
  renderUsers();
  renderActivity();
  renderAnalytics();

  // render on load if already logged in
  if (messagesPanel && messagesPanel.style.display === 'block') renderMessages();
});

