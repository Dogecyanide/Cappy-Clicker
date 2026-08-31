export function createNotifications(container) {
  const queue = [];
  const maxVisible = 4;

  function show(message, options = {}) {
    const item = document.createElement('div');
    item.className = `toast toast--${options.tone ?? 'info'}`;
    item.setAttribute('role', options.tone === 'danger' ? 'alert' : 'status');
    item.innerHTML = `${options.icon ? `<span class="toast__icon">${options.icon}</span>` : ''}<div><strong>${escapeHtml(options.title ?? '')}</strong><p>${escapeHtml(message)}</p></div>`;
    container.append(item);
    queue.push(item);
    while (queue.length > maxVisible) queue.shift().remove();
    requestAnimationFrame(() => item.classList.add('is-visible'));
    window.setTimeout(() => {
      item.classList.remove('is-visible');
      window.setTimeout(() => item.remove(), 300);
    }, options.duration ?? 4_500);
  }

  return { show };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

