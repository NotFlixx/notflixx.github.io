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
const STORAGE_KEY_INVITES = 'notflixx_invites';
const STORAGE_KEY_USER_MESSAGES = 'notflixx_user_messages';

// Invitation system
function getInvites() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVITES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveInvites(invites) {
  localStorage.setItem(STORAGE_KEY_INVITES, JSON.stringify(invites));
}

// User-to-user messaging
function getUserMessages() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY_USER_MESSAGES) || '[]'); } catch { return []; }
}

function saveUserMessages(msgs) {
  localStorage.setItem(STORAGE_KEY_USER_MESSAGES, JSON.stringify(msgs));
}

function sendUserMessage(toUsername, content) {
  const me = getCurrentUser();
  if (!me || !content.trim()) return false;
  // don't allow messaging yourself
  if (toUsername === me.username) { showToast('You cannot message yourself'); return false; }
  const msgs = getUserMessages();
  msgs.push({
    id: genId(),
    from: me.username,
    to: toUsername,
    content: content.trim(),
    time: Date.now(),
    // delivered = reached recipient (local app); read = seen by recipient
    delivered: true,
    read: false
  });
  saveUserMessages(msgs);
  return true;
}

function getUserInbox(username) {
  return getUserMessages().filter(m => m.to === username);
}

function getUserSent(username) {
  return getUserMessages().filter(m => m.from === username);
}

function markMessageRead(id) {
  const msgs = getUserMessages();
  const idx = msgs.findIndex(m => m.id === id);
  if (idx !== -1) {
    // only update if not already marked read — record seen timestamp
    if (!msgs[idx].read) {
      msgs[idx].read = true;
      msgs[idx].seenAt = Date.now();
      saveUserMessages(msgs);
    }
  }
}

function generateInviteLink(role) {
  const me = getCurrentUser();
  if (!me || me.role !== 'owner') {
    showToast('Only owners can create invitation links!');
    return null;
  }
  const invites = getInvites();
  const code = 'inv_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  const invite = {
    code,
    role,
    createdAt: Date.now(),
    createdBy: me.username,
    used: false
  };
  invites.push(invite);
  saveInvites(invites);
  return code;
}

function useInvite(code, usedByUsername) {
  const invites = getInvites();
  const invite = invites.find(i => i.code === code);
  if (invite && !invite.used) {
    invite.used = true;
    invite.usedAt = Date.now();
    invite.usedBy = usedByUsername || 'someone';
    saveInvites(invites);
    return invite.role;
  }
  return null;
}

function deleteInvite(code) {
  const invites = getInvites().filter(i => i.code !== code);
  saveInvites(invites);
}

function renderInvites() {
  const container = document.getElementById('invitesList');
  if (!container) return;
  
  const invites = getInvites();
  if (invites.length === 0) {
    // keep the panel height consistent so it remains beside the users list
    container.innerHTML = `
      <div class="empty-placeholder" style="padding:18px;">
        <div style="text-align:center;">
          <div style="font-weight:600;margin-bottom:6px;opacity:0.9;">No invitation links yet</div>
          <div style="font-size:12px;opacity:0.6;">Generate an invite to share with others</div>
        </div>
      </div>
    `;
    return;
  }
  
  container.innerHTML = invites.map(inv => {
    const link = window.location.origin + window.location.pathname + '?invite=' + inv.code;
    const date = new Date(inv.createdAt).toLocaleDateString();
    const copyBtn = inv.used ? '' : `<button class="btn small-btn" onclick="navigator.clipboard.writeText('${link}');showToast('Copied!')">Copy</button>`;
    return `
      <div class="user-row" style="flex-wrap:wrap; gap:8px;">
        <div class="user-meta">
          <span class="role-badge">${inv.role}</span>
          <span style="font-size:11px;opacity:0.7;">${inv.used ? 'Used by ' + (inv.usedBy || 'someone') : 'Active'}</span>
          <span style="font-size:10px;opacity:0.5;">by ${inv.createdBy} • ${date}</span>
        </div>
        <div class="user-actions">
          ${copyBtn}
          <button class="btn small-btn" style="background:#ff5050;" onclick="deleteInvite('${inv.code}');renderInvites()">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

// Auto-refresh invites list every 5 seconds
setInterval(() => {
  if (document.getElementById('invitesList')) {
    renderInvites();
  }
}, 5000);

// Check for invite code on page load and show registration if found
function checkInviteAndRegister() {
  const params = new URLSearchParams(window.location.search);
  const inviteCode = params.get('invite');
  
  if (inviteCode) {
    const invites = getInvites();
    const invite = invites.find(i => i.code === inviteCode);
    
    if (!invite) {
      showToast('Invalid invitation link.');
      return;
    }
    
    if (invite.used) {
      showToast('This invitation link has already been used.');
      return;
    }
    
    // Show registration modal
    const regForm = `
      <div id="inviteRegisterModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">
        <div class="admin-card" style="max-width:360px;width:100%;animation:fadeUp 0.3s ease;box-shadow:0 25px 80px rgba(0,0,0,0.9);">
          <h2 style="margin-bottom:8px;">Create Account</h2>
          <p class="contact-sub">You're invited to join as: <strong style="color:#a855f7;font-size:16px;">${invite.role}</strong></p>
          <p style="font-size:13px;opacity:0.8;margin-bottom:20px;padding:10px;background:rgba(168,85,247,0.15);border-radius:8px;border:1px solid rgba(168,85,247,0.3);">👤 Invited by: <strong>${invite.createdBy}</strong></p>
          <form id="inviteRegisterForm">
            <div class="field">
              <label>Username</label>
              <input id="regUsername" type="text" placeholder="Username" required style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;font-size:14px;" />
            </div>
            <div class="field">
              <label>Password</label>
              <input id="regPassword" type="password" placeholder="Password" required style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;font-size:14px;" />
            </div>
            <button class="btn full-width" type="submit" style="margin-top:10px;">Create Account</button>
          </form>
          <button type="button" class="btn full-width btn-ghost" style="margin-top:10px;" onclick="window.location.href=window.location.pathname">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', regForm);
    
    document.getElementById('inviteRegisterForm').addEventListener('submit', e => {
      e.preventDefault();
      
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      
      if (!username || !password) {
        showToast('Please fill in all fields');
        return;
      }
      
      const users = getUsers();
      if (users.find(u => u.username === username)) {
        showToast('Username already exists');
        return;
      }
      
      // Create user with the role from invite
      const newUser = {
        id: 'u_' + Date.now(),
        username,
        passwordHash: hashPassword(password),
        role: invite.role,
        active: true,
        createdAt: Date.now()
      };
      
      users.push(newUser);
      saveUsers(users);
      
      // Mark invite as used
      useInvite(inviteCode, username);
      
      // Login as new user (store username in session)
      setCurrentUser(username);
      
      showToast('Account created successfully!');
      
      // Remove invite param and reload to show logged in state
      window.location.href = window.location.pathname;
    });
  }
}

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
  renderContentPanel();
  logActivity('content', `Added category: ${name}`);
  return true;
}

function deleteCategory(id) {
  showConfirm('Delete Category', 'Delete this category? Projects in this category will need to be reassigned.', (confirmed) => {
    if (!confirmed) return;
    const cats = getCategories().filter(c => c.id !== id);
    saveCategories(cats);
    renderContentPanel();
    logActivity('content', `Deleted category: ${id}`);
  });
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
  renderContentPanel();
  return true;
}

function promptEditCategory(id, currentName) {
  showPrompt('Edit Category', 'Enter new category name:', 'Category name', currentName, (newName) => {
    if (!newName || newName.trim() === '') return;
    const trimmed = newName.trim();
    if (trimmed === currentName) return;
    if (updateCategory(id, trimmed)) {
      renderContentPanel();
      logActivity('content', `Updated category: ${id} -> ${trimmed}`);
    } else {
      showToast('Category name already exists or invalid!');
    }
  });
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

function addProject(project, projectId) {
  const content = getContent();
  console.log('Adding project:', project);
  console.log('Current content:', content);
  const finalId = projectId || 'p_' + Date.now();
  content.projects.push({ id: finalId, ...project });
  console.log('Updated content:', content);
  saveContent(content);
  return finalId;
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
  
  showPrompt('Edit Project', 'Enter new title:', 'Title', project.title, (newTitle) => {
    if (newTitle === null) return;
    
    showPrompt('Edit Project', 'Enter new description:', 'Description', project.description, (newDesc) => {
      if (newDesc === null) return;
      
      showPrompt('Edit Project', 'Enter category:', 'Category', project.category, (newCategory) => {
        if (newCategory === null) return;
        
        showPrompt('Edit Project', 'Enter tags (comma separated):', 'Tags', project.tags.join(', '), (newTags) => {
          if (newTags === null) return;
          
          showPrompt('Edit Project', 'Enter link:', 'Link', project.link, (newLink) => {
            if (newLink === null) return;
            
            project.title = newTitle.trim();
            project.description = newDesc.trim();
            project.category = newCategory.trim();
            project.tags = newTags.split(',').map(t => t.trim()).filter(t => t);
            project.link = newLink.trim();
            
            saveContent(content);
            renderContentPanel();
            logActivity('content', `Edited project: ${project.title}`);
          });
        });
      });
    });
  });
}

function editSkill(name) {
  const content = getContent();
  const decodedName = decodeURIComponent(name);
  const skill = content.skills.find(s => s.name === decodedName);
  if (!skill) return;
  
  showPrompt('Edit Skill', 'Enter skill name:', 'Skill name', skill.name, (newName) => {
    if (newName === null) return;
    
    showPrompt('Edit Skill', 'Enter percentage:', 'Percentage', skill.percent, (newPercent) => {
      if (newPercent === null) return;
      
      skill.name = newName.trim();
      skill.percent = parseInt(newPercent);
      
      saveContent(content);
      renderContentPanel();
      logActivity('content', `Edited skill: ${skill.name}`);
    });
  });
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
    showConfirm('Empty Trash', 'Permanently delete all messages in Trash?', (confirmed) => {
      if (!confirmed) return;
      const remaining = messages.filter(m => !m.trashed);
      saveMessages(remaining);
      renderMessages();
    });
    return;
  }

  if (currentView === 'archived') {
    showConfirm('Clear Archived', 'Delete all archived messages? (this is permanent)', (confirmed) => {
      if (!confirmed) return;
      const remaining = messages.filter(m => !m.archived);
      saveMessages(remaining);
      renderMessages();
    });
    return;
  }

  if (currentView === 'pinned') {
    showConfirm('Clear Pinned', 'Unpin all pinned messages?', (confirmed) => {
      if (!confirmed) return;
      messages.forEach(m => { if (m.pinned) m.pinned = false; });
      saveMessages(messages);
      renderMessages();
    });
    return;
  }

  if (currentView === 'all') {
    showConfirm('Clear All Messages', 'Clear all messages? This will permanently delete everything stored on this device.', (confirmed) => {
      if (!confirmed) return;
      localStorage.removeItem(STORAGE_KEY_MESSAGES);
      renderMessages();
    });
    return;
  }

  // default: clear inbox (remove non-trashed messages)
  showConfirm('Clear Inbox', 'Clear inbox messages from this device?', (confirmed) => {
    if (!confirmed) return;
    const remaining = messages.filter(m => m.trashed);
    saveMessages(remaining);
    renderMessages();
  });
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

    // Deduplicate users by username (case-insensitive) to avoid rendering duplicates
    const seen = new Set();
    arr = arr.filter(u => {
      const key = (u.username || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ensure the built‑in admin account always exists and is OWNER
    const ownerHash = hashPassword(PASSWORD);
    const existing = arr.find(u => u.username === USERNAME);
    if (!existing) {
      arr.push({
        id: 'u_owner',
        username: USERNAME,
        passwordHash: ownerHash,
        role: 'owner',
        active: true,
        createdAt: Date.now()
      });
    } else {
      existing.role = 'owner';
      existing.active = true;
      if (!existing.passwordHash) existing.passwordHash = ownerHash;
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
  if (u.passwordHash === hashPassword(password)) return u;
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
  const me = getCurrentUser();
  if (me) {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === me.username);
    if (idx !== -1) {
      users[idx].lastOnline = Date.now();
      users[idx].isOnline = false;
      saveUsers(users);
    }
  }
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

function removeAvatar(username) {
  try {
    const map = getAvatarMap();
    const keyExact = Object.prototype.hasOwnProperty.call(map, username) ? username : null;
    // try case-insensitive match if exact not found
    let keyFound = keyExact;
    if (!keyFound) {
      const lower = (username || '').toLowerCase();
      for (const k of Object.keys(map)) {
        if ((k || '').toLowerCase() === lower) { keyFound = k; break; }
      }
    }

    if (keyFound) {
      delete map[keyFound];
      saveAvatarMap(map);
      console.log('removeAvatar: removed avatar for', username, '(matched key:', keyFound + ')');
      return true;
    }

    console.log('removeAvatar: no avatar to remove for', username);
    return false;
  } catch (err) {
    console.error('removeAvatar error', err);
    return false;
  }
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
  const initials = escapeHtml((me.username || '?')[0] || '?');
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
        <button id="logoutBtn" class="btn btn-ghost small-ghost">Logout</button>
      </div>
    </div>
  `;

  const lb = document.getElementById('logoutBtn');
  if (lb) lb.addEventListener('click', logoutCurrentUser);

  // populate profile panel (if present)
  const profileAvatarEl = document.getElementById('profileAvatarDisplay');
  const profileNameEl = document.getElementById('profileDisplayName');
  const profileRoleEl = document.getElementById('profileRole');
  const youBadge = document.getElementById('youBadge');
  const newUsernameInput = document.getElementById('profileNewUsername');
  const avatarUrl2 = getAvatar(me.username);
  if (profileAvatarEl) {
    if (avatarUrl2) profileAvatarEl.innerHTML = `<img src="${avatarUrl2}" alt="${escapeHtml(me.username)}">`;
    else profileAvatarEl.textContent = (me.username[0] || '?');
  }
  if (profileNameEl) profileNameEl.textContent = me.username;
  if (profileRoleEl) profileRoleEl.textContent = describePermissions(me.role);
  if (youBadge) youBadge.style.display = 'inline-flex';
  if (newUsernameInput) newUsernameInput.value = me.username;
  const clearAvatarBtn = document.getElementById('clearAvatarBtn');
  if (clearAvatarBtn) clearAvatarBtn.style.display = avatarUrl2 ? 'inline-flex' : 'none';
}

function renderUsers() {
  const list = document.getElementById('usersList');
  const form = document.getElementById('createUserForm');
  if (!list) return;
  const users = getUsers();
  const me = getCurrentUser();

  // Helper to format last online
  function formatLastOnline(user) {
    if (user.isOnline) return '<span style="color:#00ff88;">● Online</span>';
    if (!user.lastOnline) return '<span style="opacity:0.6;">Never</span>';
    const diff = Date.now() - user.lastOnline;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return '<span style="opacity:0.6;">Just now</span>';
    if (mins < 60) return `<span style="opacity:0.6;">${mins}m ago</span>`;
    if (hours < 24) return `<span style="opacity:0.6;">${hours}h ago</span>`;
    if (days < 7) return `<span style="opacity:0.6;">${days}d ago</span>`;
    return `<span style="opacity:0.6;">${new Date(user.lastOnline).toLocaleDateString()}</span>`;
  }

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
          <div style="opacity:0.85; font-size:13px;">${formatLastOnline(u)}</div>
        </div>
      </div>
    `).join('');

    // allow clicking a user to open chat
    list.querySelectorAll('.user-row').forEach(row => {
      const username = row.dataset.username;
      if (!username) return;
      // don't allow opening chat for the current logged-in user
      if (username === me.username) { row.style.cursor = 'default'; return; }
      row.style.cursor = 'pointer';
      row.addEventListener('click', (e) => {
        // ignore clicks on interactive controls inside the row
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[data-action]')) return;
        openChatWith(username);
      });
    });

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
            <div style="font-size:11px;opacity:0.7;margin-top:4px;">${formatLastOnline(u)}</div>
          </div>
        </div>
        <div class="user-actions">
          ${!isCurrentUser ? `<button class="btn" data-action="editUser" data-username="${u.username}">Edit</button>` : ''}
        </div>
      </div>
    `;
  }).join('');

  // allow clicking a user to open chat (ignore clicks on buttons/edit controls)
  list.querySelectorAll('.user-row').forEach(row => {
    const username = row.dataset.username;
    if (!username) return;
    if (username === me.username) { row.style.cursor = 'default'; return; }
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[data-action]')) return;
      openChatWith(username);
    });
  });
}

function renderUserInbox() {
  const inboxEl = document.getElementById('userInbox');
  const toSelect = document.getElementById('messageTo');
  if (!inboxEl) return;
  
  const me = getCurrentUser();
  if (!me) {
    inboxEl.innerHTML = '<p style="opacity:0.6;">Log in to view messages.</p>';
    return;
  }
  
  const messages = getUserInbox(me.username);
  const users = getUsers();
  
  // Populate the "To" dropdown with other users
  if (toSelect) {
    toSelect.innerHTML = users
      .filter(u => u.username !== me.username)
      .map(u => `<option value="${escapeHtml(u.username)}">${escapeHtml(u.username)}</option>`)
      .join('');
  }
  
  if (messages.length === 0) {
    inboxEl.innerHTML = '<p style="opacity:0.6;">No messages yet.</p>';
    return;
  }
  
  inboxEl.innerHTML = messages.map(m => `
    <div class="user-row" data-username="${escapeHtml(m.from)}" style="flex-direction:column;align-items:flex-start;">
      <div style="display:flex;justify-content:space-between;width:100%;margin-bottom:4px;">
        <strong>${escapeHtml(m.from)}</strong>
        <span style="font-size:11px;opacity:0.6;">${new Date(m.time).toLocaleString()}</span>
      </div>
      <p style="margin:0;font-size:13px;opacity:0.9;">${escapeHtml(m.content)}</p>
    </div>
  `).join('');

  // clicking an inbox entry opens the chat with that user
  inboxEl.querySelectorAll('.user-row').forEach(row => {
    row.style.cursor = 'pointer';
    row.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('[data-action]')) return;
      const username = row.dataset.username;
      if (username) openChatWith(username);
    });
  });
}

// Chat / Direct Messaging
function openChatWith(username) {
  if (!username) return;
  const me = getCurrentUser();
  if (me && username === me.username) { showToast('You cannot message yourself'); return; }
  currentChatUser = username;
  // switch to Chat main tab (re-uses existing tab handler)
  const chatTabBtn = document.querySelector('.main-tab-btn[data-main="chat"]');
  if (chatTabBtn) chatTabBtn.click();
  // show focused chat layout
  const chatSection = document.getElementById('chatSection');
  if (chatSection) chatSection.classList.add('chat-open');
  renderChatUserList();
  renderChat();
  const input = document.getElementById('chatMessageInput');
  if (input) input.focus();
}

let currentChatUser = null;

function renderChatUserList() {
  const listEl = document.getElementById('chatUserList');
  if (!listEl) return;
  
  const me = getCurrentUser();
  if (!me) {
    listEl.innerHTML = '<p style="opacity:0.6;">Log in to chat.</p>';
    return;
  }
  
  const users = getUsers().filter(u => u.username !== me.username);
  const messages = getUserMessages();
  
  // Get last message for each user
  const userLastMsg = {};
  messages.forEach(m => {
    if (m.from === me.username || m.to === me.username) {
      const other = m.from === me.username ? m.to : m.from;
      if (!userLastMsg[other] || m.time > userLastMsg[other].time) {
        userLastMsg[other] = m;
      }
    }
  });
  
  if (users.length === 0) {
    listEl.innerHTML = '<p style="opacity:0.6;">No other users.</p>';
    return;
  }
  
  listEl.innerHTML = users.map(u => {
    const avatarUrl = getAvatar(u.username);
    const initials = (u.username[0] || '?');
    const lastMsg = userLastMsg[u.username];
    const isSelected = currentChatUser === u.username;
    const isOnline = u.isOnline;
    
    return `
      <div class="user-row ${isSelected ? 'active' : ''}" data-username="${escapeHtml(u.username)}" style="cursor:pointer;${isSelected ? 'background:rgba(0,200,255,0.1);' : ''}">
        <div style="display:flex;align-items:center;gap:10px;">
          <div class="avatar-circle" style="width:36px;height:36px;font-size:14px;">
            ${avatarUrl ? `<img src="${avatarUrl}" alt="${escapeHtml(u.username)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}
          </div>
          <div>
            <div style="font-weight:600;display:flex;align-items:center;gap:6px;">
              ${escapeHtml(u.username)}
              ${isOnline ? '<span style="color:#00ff88;font-size:10px;">●</span>' : ''}
            </div>
            <div style="font-size:11px;opacity:0.6;">
              ${lastMsg ? (lastMsg.from === me.username ? 'You: ' : '') + escapeHtml(lastMsg.content.substring(0, 20)) + (lastMsg.content.length > 20 ? '...' : '') : 'No messages'}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  listEl.querySelectorAll('.user-row').forEach(row => {
    row.addEventListener('click', () => {
      const username = row.dataset.username;
      currentChatUser = username;
      // switch to focused chat view (hide user list)
      const chatSection = document.getElementById('chatSection');
      if (chatSection) chatSection.classList.add('chat-open');
      renderChatUserList();
      renderChat();
      // focus the message input for faster typing
      const input = document.getElementById('chatMessageInput');
      if (input) input.focus();
    });
  });
}

function renderChat() {
  const headerEl = document.getElementById('chatWithUser');
  const statusEl = document.getElementById('chatUserStatus');
  const messagesEl = document.getElementById('chatMessages');
  const inputArea = document.getElementById('chatInputArea');
  
  const me = getCurrentUser();
  if (!me) {
    if (headerEl) headerEl.textContent = 'Log in to chat';
    return;
  }
  
  if (!currentChatUser) {
    if (headerEl) headerEl.textContent = 'Select a conversation';
    if (statusEl) statusEl.innerHTML = '';
    if (messagesEl) messagesEl.innerHTML = '<p style="opacity:0.6;text-align:center;">Click a user to start chatting</p>';
    if (inputArea) inputArea.style.display = 'none';
    const cs = document.getElementById('chatSection');
    if (cs) cs.classList.remove('chat-open');
    const backBtn = document.getElementById('chatBackBtn');
    if (backBtn) backBtn.style.display = 'none';
    return;
  }
  
  if (inputArea) inputArea.style.display = 'flex';
  // show back button when viewing a selected conversation
  const backBtn = document.getElementById('chatBackBtn');
  if (backBtn) backBtn.style.display = 'inline-flex';
  
  const otherUser = getUsers().find(u => u.username === currentChatUser);
  if (headerEl) headerEl.textContent = currentChatUser;
  
  if (statusEl && otherUser) {
    if (otherUser.isOnline) {
      statusEl.innerHTML = '<span style="color:#00ff88;">● Online</span>';
    } else if (otherUser.lastOnline) {
      const diff = Date.now() - otherUser.lastOnline;
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      let timeStr = '';
      if (mins < 1) timeStr = 'Last seen just now';
      else if (mins < 60) timeStr = `Last seen ${mins}m ago`;
      else if (hours < 24) timeStr = `Last seen ${hours}h ago`;
      else if (days < 7) timeStr = `Last seen ${days}d ago`;
      else timeStr = `Last seen ${new Date(otherUser.lastOnline).toLocaleDateString()}`;
      statusEl.innerHTML = `<span style="opacity:0.6;">${timeStr}</span>`;
    } else {
      statusEl.innerHTML = '';
    }
  }
  
  // load conversation messages
  let messages = getUserMessages().filter(m => 
    (m.from === me.username && m.to === currentChatUser) || 
    (m.from === currentChatUser && m.to === me.username)
  ).sort((a, b) => a.time - b.time);

  // mark incoming messages as read (seen) when this conversation is opened
  messages.filter(m => m.to === me.username && !m.read).forEach(m => markMessageRead(m.id));

  // refresh messages after marking as read
  messages = getUserMessages().filter(m => 
    (m.from === me.username && m.to === currentChatUser) || 
    (m.from === currentChatUser && m.to === me.username)
  ).sort((a, b) => a.time - b.time);

  if (messagesEl) {
    if (messages.length === 0) {
      messagesEl.innerHTML = '<p style="opacity:0.6;text-align:center;">No messages yet. Say hi!</p>';
    } else {
      messagesEl.innerHTML = messages.map(m => {
        const isMine = m.from === me.username;
        const avatarUrl = getAvatar(isMine ? me.username : currentChatUser);
        const initials = ((isMine ? me.username : currentChatUser)[0] || '?');

        // SVG double-check (uses currentColor)
        const checkSvg = `<svg viewBox="0 0 24 18" width="16" height="12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><path d="M1.5 9.5L6.5 14.5L10.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.85"></path><path d="M7.5 9.5L12.5 14.5L21 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"></path></svg>`;

        // status (outgoing only)
        let statusHtml = '';
        if (isMine) {
          if (m.read) {
            const seenTime = m.seenAt ? new Date(m.seenAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '';
            statusHtml = `<span class="msg-status"><span class="msg-ticks seen">${checkSvg}</span><span class="msg-status-text">Seen ${seenTime}</span></span>`;
          } else if (m.delivered) {
            statusHtml = `<span class="msg-status"><span class="msg-ticks delivered">${checkSvg}</span><span class="msg-status-text">Delivered</span></span>`;
          }
        }

        return `
          <div style="display:flex;gap:8px;align-items:flex-end;${isMine ? 'flex-direction:row-reverse;' : ''}">
            <div class="avatar-circle" style="width:28px;height:28px;font-size:11px;flex-shrink:0;">
              ${avatarUrl ? `<img src="${avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : initials}
            </div>
            <div style="max-width:85%;${isMine ? 'background:rgba(0,200,255,0.2);' : 'background:rgba(255,255,255,0.05);'}padding:8px 12px;border-radius:12px;">
              <div style="font-size:12px;word-wrap:break-word;">${escapeHtml(m.content)}</div>
              <div style="font-size:10px;opacity:0.5;text-align:right;margin-top:6px;display:flex;justify-content:flex-end;align-items:center;gap:8px;">
                <span>${new Date(m.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                ${statusHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
}

function sendChatMessage() {
  const input = document.getElementById('chatMessageInput');
  const content = input ? input.value.trim() : '';
  if (!content || !currentChatUser) return;
  const me = getCurrentUser();
  if (me && currentChatUser === me.username) { showToast('You cannot message yourself'); return; }
  
  sendUserMessage(currentChatUser, content);
  input.value = '';
  renderChatUserList();
  renderChat();
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

function editUser(username) {
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return;
  
  const me = getCurrentUser();
  const isOwner = me && me.role === 'owner';
  
  // Build edit modal HTML
  const modalHtml = `
    <div id="editUserModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);backdrop-filter:blur(40px);"></div>
      <div style="position:relative;z-index:10000;display:flex;align-items:center;justify-content:center;min-height:100%;padding:20px;">
        <div class="admin-card" style="max-width:400px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,0.9);animation:fadeUp 0.3s ease;">
          <h2 style="margin-bottom:16px;">Edit User: ${escapeHtml(u.username)}</h2>
          
          <div class="field" style="margin-bottom:12px;">
            <label>Username</label>
            <input id="editUserName" type="text" value="${escapeHtml(u.username)}" ${!isOwner ? 'disabled' : ''} style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;">
          </div>
          
          ${isOwner ? `
          <div class="field" style="margin-bottom:12px;">
            <label>Role</label>
            <select id="editUserRole" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;">
              <option value="viewer" ${u.role==='viewer'?'selected':''}>Viewer</option>
              <option value="mod" ${u.role==='mod'?'selected':''}>Moderator</option>
              <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
              <option value="owner" ${u.role==='owner'?'selected':''}>Owner</option>
            </select>
          </div>
          
          <div class="field" style="margin-bottom:12px;">
            <label>New Password (leave blank to keep)</label>
            <input id="editUserPassword" type="password" placeholder="New password" style="width:100%;padding:12px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;">
          </div>
          
          <div style="margin-bottom:16px;">
            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
              <input type="checkbox" id="editUserActive" ${u.active ? 'checked' : ''} style="width:18px;height:18px;">
              <span>Account Active</span>
            </label>
          </div>
          
          <div style="margin-bottom:16px;">
            <button id="loginAsUser" type="button" class="btn btn-ghost" style="width:100%;">Login as this user</button>
          </div>
          ` : ''}
          
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button id="saveEditUser" class="btn">Save Changes</button>
            ${isOwner && username !== USERNAME ? `<button id="deleteEditUser" class="btn btn-ghost" style="color:#ff5c7a;">Delete User</button>` : ''}
            <button id="closeEditUser" class="btn btn-ghost">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existing = document.getElementById('editUserModal');
  if (existing) existing.remove();
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Show modal
  setTimeout(() => {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.style.display = 'block';
  }, 10);
  
  // Close handler
  document.getElementById('closeEditUser').addEventListener('click', () => {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
  });
  
  // Save handler
  document.getElementById('saveEditUser').addEventListener('click', () => {
    const newName = document.getElementById('editUserName').value.trim();
    if (!newName) {
      showToast('Username cannot be empty');
      return;
    }
    
    const users = getUsers();
    const idx = users.findIndex(x => x.username === username);
    if (idx === -1) return;
    
    // Check for duplicate username
    if (newName !== username && users.find(x => x.username.toLowerCase() === newName.toLowerCase())) {
      showToast('Username already exists');
      return;
    }
    
    users[idx].username = newName;
    
    if (isOwner) {
      users[idx].role = document.getElementById('editUserRole').value;
      users[idx].active = document.getElementById('editUserActive').checked;
      const newPass = document.getElementById('editUserPassword').value;
      if (newPass) {
        users[idx].passwordHash = hashPassword(newPass);
      }
    }
    
    saveUsers(users);
    logActivity('user', `Edited user ${username} → ${newName}`);
    showToast('User updated');
    
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
    renderUsers();
  });
  
  // Delete handler
  const deleteBtn = document.getElementById('deleteEditUser');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm(`Delete user "${username}"? This cannot be undone.`)) {
        deleteUser(username);
        const modal = document.getElementById('editUserModal');
        if (modal) modal.remove();
      }
    });
  }
  
  // Login as user handler
  const loginAsBtn = document.getElementById('loginAsUser');
  if (loginAsBtn) {
    loginAsBtn.addEventListener('click', () => {
      if (confirm(`Login as ${username}? This will log you out from your current account.`)) {
        loginAsUser(username);
      }
    });
  }
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
  showToast(`Password changed for ${username}`);
  renderUsers();
}

function loginAsUser(username) {
  const me = getCurrentUser();
  if (!me || me.role !== 'owner') return; // only owner can login as other users
  const users = getUsers();
  const u = users.find(x => x.username === username);
  if (!u) return;
  if (!u.active) { showToast('Cannot login as disabled user'); return; }
  setCurrentUser(username);
  logActivity('auth', `Owner logged in as ${username}`);
  location.reload();
}

/* ----------------- attach events + integrate permissions + logging ----------------- */

// Custom Modal Functions
function showToast(message) {
  const existing = document.getElementById('customToast');
  if (existing) existing.remove();
  
  const toast = document.createElement('div');
  toast.id = 'customToast';
  toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#a855f7,#6366f1);color:white;padding:14px 28px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 10px 40px rgba(0,0,0,0.5);z-index:10000;animation:fadeUp 0.3s ease;';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function showModal(message, callback) {
  const overlay = document.createElement('div');
  overlay.id = 'customModal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  const box = document.createElement('div');
  box.className = 'admin-card';
  box.style.cssText = 'max-width:380px;width:100%;animation:fadeUp 0.3s ease;box-shadow:0 30px 100px rgba(0,0,0,0.9);';
  box.innerHTML = `
    <h2 style="margin-bottom:12px;">Notice</h2>
    <p class="contact-sub" style="margin-bottom:20px;">${message}</p>
    <button class="btn full-width" id="modalOk">OK</button>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
  document.getElementById('modalOk').onclick = () => {
    overlay.remove();
    if (callback) callback();
  };
}

function showConfirm(message, onConfirm) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'customConfirm';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    const box = document.createElement('div');
    box.className = 'admin-card';
    box.style.cssText = 'max-width:380px;width:100%;animation:fadeUp 0.3s ease;box-shadow:0 30px 100px rgba(0,0,0,0.9);';
    box.innerHTML = `
      <h2 style="margin-bottom:12px;">Confirm</h2>
      <p class="contact-sub" style="margin-bottom:20px;">${message}</p>
      <div style="display:flex;gap:10px;">
        <button class="btn full-width btn-ghost" id="confirmCancel">Cancel</button>
        <button class="btn full-width" id="confirmOk" style="background:#ef4444;">Confirm</button>
      </div>
    `;
    
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    
    const btnCancel = document.getElementById('confirmCancel');
    const btnOk = document.getElementById('confirmOk');

    const cleanup = () => {
      document.removeEventListener('keydown', onKeyDown);
      overlay.remove();
    };

    function done(result) {
      try { if (onConfirm) onConfirm(result); } catch (err) { console.error('showConfirm callback error', err); }
      resolve(result);
    }

    function onKeyDown(e) {
      if (e.key === 'Escape') { done(false); cleanup(); }
      if (e.key === 'Enter') { done(true); cleanup(); }
    }

    btnCancel.onclick = () => { done(false); cleanup(); };
    btnOk.onclick = () => { done(true); cleanup(); };

    // focus the confirm button for keyboard users
    setTimeout(() => { try { btnOk.focus(); } catch (e) {} }, 0);
    document.addEventListener('keydown', onKeyDown);
  });
}

function showPrompt(title, message, placeholder, defaultValue, onSubmit) {
  const overlay = document.createElement('div');
  overlay.id = 'customPrompt';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
  
  const box = document.createElement('div');
  box.className = 'admin-card';
  box.style.cssText = 'max-width:380px;width:100%;animation:fadeUp 0.3s ease;box-shadow:0 30px 100px rgba(0,0,0,0.9);';
  box.innerHTML = `
    <h2 style="margin-bottom:8px;">${title}</h2>
    <p class="contact-sub" style="margin-bottom:16px;">${message}</p>
    <input id="promptInput" type="text" value="${defaultValue || ''}" placeholder="${placeholder}" style="width:100%;padding:14px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;font-size:14px;margin-bottom:16px;box-sizing:border-box;">
    <div style="display:flex;gap:10px;">
      <button class="btn full-width btn-ghost" id="promptCancel">Cancel</button>
      <button class="btn full-width" id="promptOk">OK</button>
    </div>
  `;
  
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  
  const input = document.getElementById('promptInput');
  input.focus();
  input.select();
  
  document.getElementById('promptCancel').onclick = () => overlay.remove();
  document.getElementById('promptOk').onclick = () => {
    overlay.remove();
    if (onSubmit) onSubmit(input.value);
  };
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      overlay.remove();
      if (onSubmit) onSubmit(input.value);
    }
  });
}

// Forgot Password Functions
const RESET_CODE = '826470';

function showForgotPassword() {
  const modal = document.getElementById('forgotPasswordModal');
  const loginCard = document.getElementById('loginCard');
  if (modal) {
    modal.style.display = 'flex';
  }
  if (loginCard) {
    loginCard.style.display = 'none';
  }
}

function closeForgotPassword() {
  const modal = document.getElementById('forgotPasswordModal');
  const loginCard = document.getElementById('loginCard');
  if (modal) {
    modal.style.display = 'none';
  }
  if (loginCard) {
    loginCard.style.display = 'block';
  }
}

// Initialize forgot password handler
document.addEventListener('DOMContentLoaded', () => {
  // Check for invite code and show registration if needed
  checkInviteAndRegister();
  
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
        // Update last online
        const users = getUsers();
        const userIdx = users.findIndex(u => u.username === res.username);
        if (userIdx !== -1) {
          users[userIdx].lastOnline = Date.now();
          users[userIdx].isOnline = true;
          saveUsers(users);
        }
        if (loginStatus) { loginStatus.textContent = ''; }
        if (loginCard) loginCard.style.display = 'none';
        if (messagesPanel) messagesPanel.style.display = 'block';
        renderCurrentUser();
        renderUsers();
        renderChatUserList();
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

  // Forgot Password Form Handler
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', e => {
      e.preventDefault();
      const code = document.getElementById('resetCode').value.trim();
      const username = document.getElementById('resetUsername').value.trim();
      const newPass = document.getElementById('newPassword').value;
      
      if (code !== RESET_CODE) {
        showToast('Invalid reset code!');
        return;
      }
      
      const users = getUsers();
      const userIdx = users.findIndex(u => u.username === username);
      
      if (userIdx === -1) {
        showToast('User not found!');
        return;
      }
      
      users[userIdx].passwordHash = hashPassword(newPass);
      saveUsers(users);
      
      showToast('Password reset successful! You can now log in with your new password.');
      closeForgotPassword();
      document.getElementById('forgotPasswordForm').reset();
    });
  }

  if (tabs) {
    tabs.forEach(t => t.addEventListener('click', () => { setView(t.dataset.view); renderAnalytics(); }));
  }

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!canPerform('delete')) { showToast('Insufficient permissions'); return; }
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
        case 'togglePin': if (!canPerform('moderate')) { showToast('Insufficient permissions'); return; } togglePin(id); logActivity('msg', `${me.username} toggled pin ${id}`); break;
        case 'toggleArchive': if (!canPerform('moderate')) { showToast('Insufficient permissions'); return; } toggleArchive(id); logActivity('msg', `${me.username} toggled archive ${id}`); break;
        case 'trash': if (!canPerform('moderate')) { showToast('Insufficient permissions'); return; } moveToTrash(id); logActivity('msg', `${me.username} moved to trash ${id}`); break;
        case 'restore': if (!canPerform('moderate')) { showToast('Insufficient permissions'); return; } restoreMessage(id); logActivity('msg', `${me.username} restored ${id}`); break;
        case 'deletePermanent': if (!canPerform('delete')) { showToast('Insufficient permissions'); return; } deletePermanent(id); logActivity('msg', `${me.username} deleted ${id}`); break;
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
      if (!me) { showToast('You must be logged in'); return; }
      
      // Only owners can create users
      if (me.role !== 'owner') {
        showToast('Only owners can create users');
        return;
      }
      
      const myRank = userRoleRank(me.role);
      const username = document.getElementById('newUsername').value.trim();
      const password = document.getElementById('newPassword').value;
      const role = document.getElementById('newRole').value;
      const targetRank = userRoleRank(role);

      // basic validation + uniqueness check
      if (!username) { showToast('Enter a username'); return; }
      const existing = getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
      if (existing) { showToast('Username already exists'); return; }
      
      // If trying to create owner rank, require code verification FIRST
      if (role === 'owner') {
        // Check if locked out
        const lockKey = 'owner_create_lock';
        const lockUntil = sessionStorage.getItem(lockKey);
        if (lockUntil && Date.now() < parseInt(lockUntil)) {
          const remaining = Math.ceil((parseInt(lockUntil) - Date.now()) / 1000);
          showToast(`Too many failed attempts. Try again in ${remaining} seconds.`);
          return;
        }
        
        // Prompt for code FIRST
        const attemptsKey = 'owner_create_attempts';
        let attempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');
        showPrompt('Owner Verification', `You are creating an OWNER account. Enter verification code (${3 - attempts} attempts remaining):`, 'Verification Code', '', (code) => {
          if (code === null) return; // User cancelled
          
          if (code !== '826470') {
            attempts++;
            sessionStorage.setItem(attemptsKey, attempts.toString());
            
            if (attempts >= 3) {
              // Lock out for 1 minute
              sessionStorage.setItem(lockKey, (Date.now() + 60000).toString());
              sessionStorage.removeItem(attemptsKey);
              showToast('Too many failed attempts. Locked for 1 minute.');
              return;
            }
            
            showToast(`Invalid code. ${3 - attempts} attempts remaining.`);
            return;
          }
          
          // Code correct - proceed to create user
          createUserAccount(username, password, role, me);
        });
        return;
      }

      // For non-owner ranks, use the rank check
      if (targetRank >= myRank) {
        showToast(`You cannot create users with rank '${role}' (your rank: ${me.role})`);
        return;
      }

      try {
        createUser(username, password, role);

        // clear inputs
        document.getElementById('newUsername').value = '';
        document.getElementById('newPassword').value = '';

        renderUsers();
        renderActivity();
      } catch (err) { showToast(err.message); }
    });
  }

  // Invite links form
  const createInviteForm = document.getElementById('createInviteForm');
  if (createInviteForm) {
    createInviteForm.addEventListener('submit', e => {
      e.preventDefault();
      
      const me = getCurrentUser();
      if (!me) { showToast('You must be logged in'); return; }
      
      // Check hierarchy - need to be at least one level above the target role
      const myRank = userRoleRank(me.role);
      const role = document.getElementById('inviteRole').value;
      const targetRank = userRoleRank(role);
      
      if (myRank <= targetRank) {
        showToast(`You need a higher rank to create ${role} invites`);
        return;
      }
      
      const code = generateInviteLink(role);
      const link = window.location.origin + window.location.pathname + '?invite=' + code;
      
      // Copy to clipboard
      navigator.clipboard.writeText(link).then(() => {
        showToast('Invitation link copied to clipboard!');
        showModal('Invitation Link', `<p style="margin-bottom:12px;">Link: <code style="background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;">${link}</code></p>`);
      }).catch(() => {
        showModal('Invitation Link', `<p style="margin-bottom:12px;">Copy this link manually:</p><code style="background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;word-break:break-all;">${link}</code>`);
      });
      
      renderInvites();
      logActivity('invite', `Generated ${role} invite`);
    });
  }

  // Render invites on page load
  renderInvites();

  if (usersList) {
    usersList.addEventListener('change', e => {
      const sel = e.target.closest('.role-select');
      if (!sel) return;

      const me = getCurrentUser();
      // prevent users from modifying their own role
      if (me && sel.dataset.username === me.username) {
        showToast('You cannot change your own role');
        renderUsers();
        return;
      }

      // Only owners can change user roles
      if (!me || me.role !== 'owner') {
        showToast('Only owners can change user roles');
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
          showToast(`Too many failed attempts. Try again in ${remaining} seconds.`);
          renderUsers();
          return;
        }
        
        // Prompt for code FIRST
        const attemptsKey = 'owner_promote_attempts';
        let attempts = parseInt(sessionStorage.getItem(attemptsKey) || '0');
        showPrompt('Owner Promotion', `You are promoting a user to OWNER. Enter verification code (${3 - attempts} attempts remaining):`, 'Verification Code', '', (code) => {
          if (code === null) {
            renderUsers();
            return;
          }
          
          if (code !== '826470') {
            attempts++;
            sessionStorage.setItem(attemptsKey, attempts.toString());
            
            if (attempts >= 3) {
              sessionStorage.setItem(lockKey, (Date.now() + 60000).toString());
              sessionStorage.removeItem(attemptsKey);
              showToast('Too many failed attempts. Locked for 1 minute.');
            } else {
              showToast('Incorrect code.');
            }
            renderUsers();
            return;
          }
          
          sessionStorage.removeItem(attemptsKey);
          
          updateUserRole(sel.dataset.username, sel.value);
          renderActivity();
        });
        return;
      }
      
      // For non-owner ranks, use the rank check
      if (targetRank >= myRank) {
        showToast(`You cannot set rank to '${sel.value}' (your rank: ${me.role})`);
        renderUsers();
        return;
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
        showToast('You cannot modify your own account');
        return;
      }

      // Only owners can delete or toggle users
      if (me.role !== 'owner') {
        showToast('Only owners can delete or disable users');
        return;
      }

      if (act === 'toggleActive') {
        const targetUser = getUsers().find(u => u.username === uname);
        if (targetUser && userRoleRank(targetUser.role) >= userRoleRank(me.role)) {
          showToast(`You cannot modify users with rank '${targetUser.role}' or higher`);
          return;
        }
        toggleUserActive(uname); renderActivity();
      }
      if (act === 'editUser') {
        editUser(uname);
      }
      if (act === 'deleteUser') {
        const targetUser = getUsers().find(u => u.username === uname);
        if (targetUser && userRoleRank(targetUser.role) >= userRoleRank(me.role)) {
          showToast(`You cannot delete users with rank '${targetUser.role}' or higher`);
          return;
        }
        showConfirm('Delete User', 'Delete user ' + uname + '?', (confirmed) => {
          if (!confirmed) return;
          deleteUser(uname); renderActivity();
        });
      }
      if (act === 'loginAs') {
        showConfirm('Login As User', 'Login as ' + uname + '? This will log you out from your current account.', (confirmed) => {
          if (!confirmed) return;
          loginAsUser(uname);
        });
      }
      if (act === 'changePassword') {
        showPrompt('Change Password', 'Enter new password for ' + uname + ':', 'New Password', '', (newPass) => {
          if (!newPass || !newPass.trim()) return;
          const modal = document.createElement('div');
          modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
          modal.innerHTML = `
            <div class="admin-card" style="max-width:320px;width:100%;box-shadow:0 25px 80px rgba(0,0,0,0.9);">
              <h3>Confirm Password</h3>
              <p class="contact-sub">Re-enter your new password</p>
              <input id="confirmPassInput" type="password" placeholder="Confirm password" style="width:100%;padding:14px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);background:rgba(0,20,40,0.9);color:white;margin-bottom:12px;box-sizing:border-box;">
              <button class="btn full-width" id="confirmPassBtn">Confirm</button>
              <button class="btn full-width btn-ghost" id="cancelPassBtn" style="margin-top:8px;">Cancel</button>
            </div>
          `;
          document.body.appendChild(modal);
          document.getElementById('cancelPassBtn').onclick = () => modal.remove();
          document.getElementById('confirmPassBtn').onclick = () => {
            const confirmPass = document.getElementById('confirmPassInput').value;
            if (newPass.trim() !== confirmPass.trim()) {
              showToast('Passwords do not match');
              return;
            }
            modal.remove();
            changeUserPassword(uname, newPass);
          };
        });
      }
    });
  }

  if (clearActivityBtn) clearActivityBtn.addEventListener('click', () => { showConfirm('Clear Activity Log', 'Clear activity log?', (confirmed) => { if (!confirmed) return; clearActivity(); }); });

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
  const projCategorySelect = document.getElementById('projCategory');
  const staffStatusRow = document.getElementById('staffStatusRow');
  
  // Show/hide staff status dropdown based on category
  if (projCategorySelect && staffStatusRow) {
    projCategorySelect.addEventListener('change', () => {
      staffStatusRow.style.display = projCategorySelect.value === 'staff' ? 'flex' : 'none';
    });
  }
  
  if (addProjectForm) {
    addProjectForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me || me.role !== 'owner') { showToast('Only owners can manage content'); return; }
      const project = {
        title: document.getElementById('projTitle').value.trim(),
        category: document.getElementById('projCategory').value,
        description: document.getElementById('projDesc').value.trim(),
        tags: document.getElementById('projTags').value.split(',').map(t => t.trim()).filter(t => t),
        link: document.getElementById('projLink').value.trim()
      };
      
      // Add staff status for staff category
      const staffStatusSelect = document.getElementById('projStaffStatus');
      if (staffStatusSelect && staffStatusSelect.value) {
        project.staffStatus = staffStatusSelect.value;
      }
      
      // Generate ID first so we can use it for the banner
      const projectId = 'p_' + Date.now();
      addProject(project, projectId);
      
      // Handle banner upload if a file was selected
      const bannerInput = document.getElementById('projBanner');
      if (bannerInput && bannerInput.files && bannerInput.files[0]) {
        const file = bannerInput.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          setProjectImage(projectId, reader.result);
          logActivity('content', `Added project with banner: ${project.title}`);
          renderContentPanel();
        };
        reader.readAsDataURL(file);
      } else {
        logActivity('content', `Added project: ${project.title}`);
        renderContentPanel();
      }
      
      addProjectForm.reset();
      // Reset staff status row visibility
      if (staffStatusRow) staffStatusRow.style.display = 'none';
    });
  }

  // Add skill form
  const addSkillForm = document.getElementById('addSkillForm');
  if (addSkillForm) {
    addSkillForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me || me.role !== 'owner') { showToast('Only owners can manage content'); return; }
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
      if (!me || me.role !== 'owner') { showToast('Only owners can manage content'); return; }
      const name = document.getElementById('categoryName').value.trim();
      if (addCategory(name)) {
        addCategoryForm.reset();
        renderContentPanel();
        logActivity('content', `Added category: ${name}`);
      } else {
        showToast('Category already exists!');
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
    if (!me || me.role !== 'owner') { showToast('Only owners can manage content'); return; }
    if (btn.dataset.action === 'deleteProject') {
      showConfirm('Delete Project', 'Delete this project?', (confirmed) => {
        if (!confirmed) return;
        deleteProject(btn.dataset.id);
        renderContentPanel();
        logActivity('content', 'Deleted project');
      });
    }
    if (btn.dataset.action === 'deleteSkill') {
      showConfirm('Delete Skill', 'Delete this skill?', (confirmed) => {
        if (!confirmed) return;
        deleteSkill(btn.dataset.name);
        renderContentPanel();
        logActivity('content', `Deleted skill: ${btn.dataset.name}`);
      });
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
      const next = document.getElementById('profileNewPassword').value;
      const confirmPw = document.getElementById('profileConfirmPassword').value;
      if (next.trim() !== confirmPw.trim()) {
        if (profileStatus) { profileStatus.textContent = 'New passwords do not match.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      const users = getUsers();
      const u = users.find(x => x.username === me.username);
      if (!u || u.passwordHash !== hashPassword(current)) {
        if (profileStatus) { profileStatus.textContent = 'Current password is incorrect.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      u.passwordHash = hashPassword(next);
      saveUsers(users);
      logActivity('user', `${me.username} changed their password`);
      if (profileStatus) { profileStatus.textContent = 'Password updated.'; profileStatus.style.color = '#6cffb2'; }
      passwordForm.reset();
    });
  }

  // Username change form
  const usernameForm = document.getElementById('usernameForm');
  if (usernameForm) {
    usernameForm.addEventListener('submit', e => {
      e.preventDefault();
      const me = getCurrentUser();
      if (!me) return;
      const newUsernameInput = document.getElementById('profileNewUsername');
      const newUsername = newUsernameInput ? newUsernameInput.value.trim() : '';
      if (!newUsername) {
        if (profileStatus) { profileStatus.textContent = 'Enter a username.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      const users = getUsers();
      const idx = users.findIndex(u => u.id === me.id);
      if (idx === -1) return;
      // Check if username already exists
      if (users.find(u => u.username.toLowerCase() === newUsername.toLowerCase() && u.id !== me.id)) {
        if (profileStatus) { profileStatus.textContent = 'Username already taken.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      const oldUsername = me.username;
      users[idx].username = newUsername;
      saveUsers(users);
      // Update current user session (use sessionStorage username string)
      setCurrentUser(newUsername);
      // Update avatar storage key if needed
      const oldAvatars = JSON.parse(localStorage.getItem(STORAGE_KEY_AVATARS) || '{}');
      if (oldAvatars[oldUsername]) {
        oldAvatars[newUsername] = oldAvatars[oldUsername];
        delete oldAvatars[oldUsername];
        localStorage.setItem(STORAGE_KEY_AVATARS, JSON.stringify(oldAvatars));
      }

      // Update any stored user-to-user messages so history follows the new username
      try {
        const msgs = getUserMessages();
        let msgsChanged = false;
        msgs.forEach(m => {
          if (m.from === oldUsername) { m.from = newUsername; msgsChanged = true; }
          if (m.to === oldUsername) { m.to = newUsername; msgsChanged = true; }
        });
        if (msgsChanged) saveUserMessages(msgs);
      } catch (e) { console.error('Failed updating messages for username change', e); }

      // Update invites metadata (creator / usedBy)
      try {
        const invites = getInvites();
        let invitesChanged = false;
        invites.forEach(inv => {
          if (inv.createdBy === oldUsername) { inv.createdBy = newUsername; invitesChanged = true; }
          if (inv.usedBy === oldUsername) { inv.usedBy = newUsername; invitesChanged = true; }
        });
        if (invitesChanged) saveInvites(invites);
      } catch (e) { console.error('Failed updating invites for username change', e); }

      renderCurrentUser();
      renderUsers();
      renderChatUserList();
      logActivity('user', `${oldUsername} changed username to ${newUsername}`);
      if (profileStatus) { profileStatus.textContent = 'Username updated.'; profileStatus.style.color = '#6cffb2'; }
      usernameForm.reset();
    });
  }

  if (avatarForm) {
    const avatarFileInput = document.getElementById('avatarFile');
    const avatarPreviewModal = document.getElementById('avatarPreviewModal');
    const avatarPreviewImg = document.getElementById('avatarPreviewImg');
    const confirmAvatarBtn = document.getElementById('confirmAvatarBtn');
    const cancelAvatarBtn = document.getElementById('cancelAvatarBtn');

    // Show preview modal immediately when a file is chosen
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        if (!file.type || !file.type.startsWith('image/')) {
          if (profileStatus) { profileStatus.textContent = 'Please select an image file.'; profileStatus.style.color = '#ff7aa2'; }
          avatarFileInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          if (avatarPreviewImg) avatarPreviewImg.src = reader.result;
          if (avatarPreviewModal) avatarPreviewModal.style.display = 'block';
          // disable confirm until preview is initialized
          if (confirmAvatarBtn) confirmAvatarBtn.disabled = true;
        };
        reader.readAsDataURL(file);
      });
    }

    // Prevent default immediate save; require confirmation via modal
    avatarForm.addEventListener('submit', e => {
      e.preventDefault();
      const file = avatarFileInput && avatarFileInput.files[0];
      if (!file) {
        if (profileStatus) { profileStatus.textContent = 'Choose a picture first.'; profileStatus.style.color = '#ff7aa2'; }
        return;
      }
      // if user presses Save, show the preview modal (confirm flow)
      if (avatarPreviewModal) avatarPreviewModal.style.display = 'block';
      // ensure preview is initialized
      initAvatarPreview && initAvatarPreview();
    });

    // Cancel preview
    if (cancelAvatarBtn) {
      cancelAvatarBtn.addEventListener('click', () => {
        if (avatarPreviewModal) avatarPreviewModal.style.display = 'none';
        if (avatarFileInput) avatarFileInput.value = '';
        // reset zoom/translate state
        previewState = null;
      });
    }

    // Clear existing avatar (if any)
    const clearAvatarBtn = document.getElementById('clearAvatarBtn');
    if (clearAvatarBtn) {
      clearAvatarBtn.addEventListener('click', async () => {
        const me = getCurrentUser();
        if (!me) return;
        console.log('clearAvatarBtn clicked for', me.username);

        try {
          // await the site popup (acts like browser confirm)
          const confirmed = await showConfirm('Remove profile picture', 'Remove your profile picture?');
          console.log('clearAvatar: confirmed ->', confirmed);
          if (!confirmed) return;

          console.log('clearAvatar: avatars (before) ->', getAvatarMap());
          const removed = removeAvatar(me.username);
          console.log('clearAvatar: removed?', removed, 'avatars (after) ->', getAvatarMap());

          // refresh UI
          renderCurrentUser();
          renderUsers();
          renderChatUserList();
          renderChat();
          if (avatarFileInput) avatarFileInput.value = '';
          if (profileStatus) { profileStatus.textContent = removed ? 'Profile picture removed.' : 'Failed to remove picture.'; profileStatus.style.color = removed ? '#ffb3b3' : '#ff7aa2'; }
          logActivity('user', `${me.username} removed their avatar`);
        } catch (err) {
          console.error('clearAvatar handler error', err);
          if (profileStatus) { profileStatus.textContent = 'Error removing avatar'; profileStatus.style.color = '#ff7aa2'; }
        }
      });
    }

    // --- Pan & zoom preview implementation ---
    const avatarPreviewContainer = document.getElementById('avatarPreviewContainer');
    const zoomRange = document.getElementById('avatarZoomRange');
    let previewState = null; // { naturalW, naturalH, containerSize, baseScale, scale, translateX, translateY }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    function updatePreviewImage() {
      if (!previewState || !avatarPreviewImg) return;
      const s = previewState;
      const displayW = s.naturalW * s.scale;
      const displayH = s.naturalH * s.scale;
      // clamp so image always covers the container
      s.translateX = clamp(s.translateX, s.containerSize - displayW, 0);
      s.translateY = clamp(s.translateY, s.containerSize - displayH, 0);
      avatarPreviewImg.style.width = Math.round(displayW) + 'px';
      avatarPreviewImg.style.height = Math.round(displayH) + 'px';
      avatarPreviewImg.style.left = Math.round(s.translateX) + 'px';
      avatarPreviewImg.style.top = Math.round(s.translateY) + 'px';
    }

    function initAvatarPreview() {
      if (!avatarPreviewImg || !avatarPreviewContainer) return;
      if (!avatarPreviewImg.src) return;
      // wait for natural size
      if (!avatarPreviewImg.naturalWidth) {
        avatarPreviewImg.onload = () => initAvatarPreview();
        return;
      }
      const naturalW = avatarPreviewImg.naturalWidth;
      const naturalH = avatarPreviewImg.naturalHeight;
      const containerSize = avatarPreviewContainer.clientWidth;
      const baseScale = Math.max(containerSize / naturalW, containerSize / naturalH);
      const displayW = naturalW * baseScale;
      const displayH = naturalH * baseScale;
      previewState = {
        naturalW, naturalH, containerSize,
        baseScale, scale: baseScale,
        translateX: (containerSize - displayW) / 2,
        translateY: (containerSize - displayH) / 2
      };
      if (zoomRange) zoomRange.value = '1';
      updatePreviewImage();
      // enable confirm now preview is ready
      if (confirmAvatarBtn) confirmAvatarBtn.disabled = false;
    }

    // pointer drag
    let isDragging = false, dragStartX = 0, dragStartY = 0, dragStartTX = 0, dragStartTY = 0;
    if (avatarPreviewContainer) {
      avatarPreviewContainer.addEventListener('pointerdown', e => {
        if (!previewState) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragStartTX = previewState.translateX;
        dragStartTY = previewState.translateY;
        avatarPreviewImg.classList.add('dragging');
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        e.preventDefault();
      });
      avatarPreviewContainer.addEventListener('wheel', e => {
        if (!previewState || !zoomRange) return;
        e.preventDefault();
        const delta = -e.deltaY;
        let v = parseFloat(zoomRange.value || '1');
        v += delta > 0 ? 0.04 : -0.04;
        v = clamp(v, 1, 3);
        zoomRange.value = v.toFixed(2);
        onZoomInput();
      }, { passive: false });
    }

    function onPointerMove(e) {
      if (!isDragging || !previewState) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      previewState.translateX = dragStartTX + dx;
      previewState.translateY = dragStartTY + dy;
      updatePreviewImage();
    }
    function onPointerUp() {
      isDragging = false;
      if (avatarPreviewImg) avatarPreviewImg.classList.remove('dragging');
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    // zoom slider
    if (zoomRange) {
      zoomRange.addEventListener('input', onZoomInput);
    }
    function onZoomInput() {
      if (!previewState || !zoomRange) return;
      const prevScale = previewState.scale;
      const mult = parseFloat(zoomRange.value || '1');
      const newScale = previewState.baseScale * mult;
      // keep center point stable
      const containerCenterX = previewState.containerSize / 2;
      const containerCenterY = previewState.containerSize / 2;
      const prevDisplayW = previewState.naturalW * prevScale;
      const prevDisplayH = previewState.naturalH * prevScale;
      const centerRatioX = (containerCenterX - previewState.translateX) / prevDisplayW;
      const centerRatioY = (containerCenterY - previewState.translateY) / prevDisplayH;
      previewState.scale = newScale;
      const newDisplayW = previewState.naturalW * previewState.scale;
      const newDisplayH = previewState.naturalH * previewState.scale;
      previewState.translateX = containerCenterX - centerRatioX * newDisplayW;
      previewState.translateY = containerCenterY - centerRatioY * newDisplayH;
      updatePreviewImage();
    }

    // Initialize when image changes
    if (avatarPreviewImg) {
      avatarPreviewImg.addEventListener('load', () => {
        initAvatarPreview();
      });
    }

    // Confirm preview: use current pan/zoom to crop and save
    if (confirmAvatarBtn) {
      confirmAvatarBtn.addEventListener('click', () => {
        if (!avatarPreviewImg || !previewState) {
          if (profileStatus) { profileStatus.textContent = 'Preview not ready yet.'; profileStatus.style.color = '#ff7aa2'; }
          return;
        }
        try {
          const s = previewState;
          const imgEl = avatarPreviewImg;
          const naturalW = imgEl.naturalWidth;
          const naturalH = imgEl.naturalHeight;
          // source rectangle in natural pixels
          const srcX = clamp((-s.translateX) / s.scale, 0, naturalW);
          const srcY = clamp((-s.translateY) / s.scale, 0, naturalH);
          const srcSize = clamp(s.containerSize / s.scale, 0, Math.min(naturalW - srcX, naturalH - srcY));
          const size = 256;
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imgEl, srcX, srcY, srcSize, srcSize, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/png');
          const me = getCurrentUser();
          if (!me) { if (profileStatus) { profileStatus.textContent = 'Not signed in'; profileStatus.style.color = '#ff7aa2'; } return; }
          setAvatar(me.username, dataUrl);
          renderCurrentUser();
          renderUsers();
          logActivity('user', `${me.username} updated their avatar`);
          if (profileStatus) { profileStatus.textContent = 'Profile picture updated.'; profileStatus.style.color = '#6cffb2'; }
          if (avatarPreviewModal) avatarPreviewModal.style.display = 'none';
          if (avatarFileInput) avatarFileInput.value = '';
          previewState = null;
        } catch (err) {
          console.error('confirmAvatar error', err);
          if (profileStatus) { profileStatus.textContent = 'Failed to update avatar'; profileStatus.style.color = '#ff7aa2'; }
        }
      });
    }
  }

  // Chat functionality
  const chatMsgInput = document.getElementById('chatMessageInput');
  const sendChatBtn = document.getElementById('sendChatMsg');
  if (chatMsgInput) {
    chatMsgInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }
  if (sendChatBtn) {
    sendChatBtn.addEventListener('click', sendChatMessage);
  }

  // Initial chat render
  renderChatUserList();
  renderChat();

  // render on load
  renderUsers();
  renderChatUserList();
  renderChat();
  renderActivity();
  renderAnalytics();

  // back button (focused chat view)
  const chatBackBtn = document.getElementById('chatBackBtn');
  if (chatBackBtn) {
    chatBackBtn.addEventListener('click', () => {
      currentChatUser = null;
      const cs = document.getElementById('chatSection');
      if (cs) cs.classList.remove('chat-open');
      renderChatUserList();
      renderChat();
    });
  }

  // render on load if already logged in
  if (messagesPanel && messagesPanel.style.display === 'block') renderMessages();
});

