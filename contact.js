const STORAGE_KEY_MESSAGES = 'notflixx_messages';

function saveMessageLocally(entry) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    const list = raw ? JSON.parse(raw) : [];
    list.push(entry);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const message = document.getElementById('message').value.trim();

    saveMessageLocally({
      id: Date.now().toString(),
      name,
      email,
      subject,
      message,
      createdAt: Date.now(),
      pinned: false,
      archived: false,
      trashed: false,
      read: false
    });

    form.reset();
  });
});

