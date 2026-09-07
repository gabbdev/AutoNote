const coverView = document.querySelector('#coverView');
const notebookView = document.querySelector('#notebookView');
const storageKey = 'autonote-pages';
let storageReadFailed = false;
let recoveryRaw = null;
let recoveryMessage = '';
let unsavedChanges = false;
const recoveryKey = 'autonote-recovery-' + Date.now();
const blankPage = () => ({ title: 'Um recadinho especial', prefix: '55', phone: '', text: '' });
const pages = loadPages();
let currentPage = 0;
const deletedPages = [];

function loadPages() {
  let raw;
  try {
    raw = localStorage.getItem(storageKey);
  } catch {
    storageReadFailed = true;
    return [blankPage()];
  }
  if (raw === null) return [blankPage()];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Invalid notebook');
    let repaired = false;
    const normalized = data.filter(page => {
      const valid = page !== null && typeof page === 'object' && !Array.isArray(page);
      if (!valid) repaired = true;
      return valid;
    }).map((page, index) => {
      const field = (key, fallback) => {
        if (typeof page[key] === 'string') return page[key];
        // Older records may store a phone or prefix as a number.
        repaired = true;
        return typeof page[key] === 'number' && Number.isFinite(page[key]) ? String(page[key]) : fallback;
      };
      return {
        title: field('title', 'Folha ' + (index + 1)),
        prefix: field('prefix', '55'),
        phone: field('phone', ''),
        text: field('text', '')
      };
    });
    if (repaired) {
      recoveryRaw = raw;
      recoveryMessage = 'Algumas folhas tinham dados incompletos. Recuperamos os campos legíveis; confira seu caderno.';
    }
    return normalized.length ? normalized : [blankPage()];
  } catch {
    recoveryRaw = raw;
    recoveryMessage = 'Não foi possível ler o conteúdo do caderno salvo. Ele será preservado em uma cópia local antes de salvar novas notas.';
    return [blankPage()];
  }
}

const title = document.querySelector('#pageTitle');
const pageNumber = document.querySelector('#pageNumber');
const pageCounter = document.querySelector('#pageCounter');
const phone = document.querySelector('#telefone');
const prefix = document.querySelector('#prefixo');
const noteText = document.querySelector('#mensagem');
const dots = document.querySelector('#pageDots');
const toast = document.querySelector('#toast');
const pagesMenu = document.querySelector('#pagesMenu');
const menuBackdrop = document.querySelector('#menuBackdrop');
const pagesList = document.querySelector('#pagesList');
const toggleTheme = document.querySelector('#toggleTheme');
const themeKey = 'autonote-theme';
const saveStatus = document.querySelector('#saveStatus');
const storageNotice = document.querySelector('#storageNotice');
const storageNoticeText = document.querySelector('#storageNoticeText');
const retrySave = document.querySelector('#retrySave');
const undoDelete = document.querySelector('#undoDelete');
const form = document.querySelector('#noteForm');
form.noValidate = true;

function showStorageNotice(message, canRetry = false) {
  storageNoticeText.textContent = message;
  storageNotice.hidden = !message;
  retrySave.hidden = !canRetry;
}

function persistPages() {
  unsavedChanges = true;
  if (storageReadFailed) {
    saveStatus.textContent = 'Alterações apenas nesta sessão — não salvas';
    saveStatus.dataset.state = 'error';
    showStorageNotice('O navegador bloqueou a leitura das notas salvas. Você pode escrever nesta sessão, mas copie suas anotações antes de fechar a página. Para carregar o caderno anterior, permita o armazenamento e recarregue.');
    return false;
  }
  try {
    // Preserve malformed originals before replacing the primary record.
    if (recoveryRaw !== null) {
      localStorage.setItem(recoveryKey, recoveryRaw);
      recoveryRaw = null;
      recoveryMessage = 'Os dados antigos foram preservados em uma cópia local. Confira as folhas recuperadas.';
    }
    localStorage.setItem(storageKey, JSON.stringify(pages));
    unsavedChanges = false;
    saveStatus.textContent = '✓ Notas salvas neste navegador';
    saveStatus.dataset.state = 'saved';
    showStorageNotice(recoveryMessage);
    return true;
  } catch {
    saveStatus.textContent = 'Alterações ainda não salvas';
    saveStatus.dataset.state = 'error';
    showStorageNotice('Não foi possível salvar as alterações neste navegador. O armazenamento pode estar cheio ou bloqueado. Mantenha esta página aberta ou copie suas notas antes de sair.', true);
    return false;
  }
}

retrySave.addEventListener('click', () => saveCurrentPage());
window.addEventListener('beforeunload', event => {
  if (!unsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
});

function clearValidation() {
  [prefix, phone, noteText].forEach(input => {
    input.setCustomValidity('');
    input.removeAttribute('aria-invalid');
  });
}

function validateMessage() {
  clearValidation();
  const code = prefix.value.trim().replace(/\s/g, '');
  const digits = phone.value.replace(/\D/g, '');
  const country = code.replace(/^\+/, '');
  const invalid = (input, message) => {
    input.setCustomValidity(message);
    input.setAttribute('aria-invalid', 'true');
    input.reportValidity();
    return false;
  };
  if (!/^\+?[1-9]\d{0,2}$/.test(code)) {
    return invalid(prefix, 'Digite o prefixo do país com 1 a 3 dígitos, por exemplo +55, +1 ou +351.');
  }
  if (!/^[\d()\s.-]+$/.test(phone.value) || digits.length < 4) {
    return invalid(phone, 'Digite o telefone completo, com código de área, sem repetir o prefixo do país.');
  }
  if (country.length + digits.length > 15) {
    return invalid(phone, 'Prefixo e telefone devem somar no máximo 15 dígitos. Confira se o prefixo não foi repetido.');
  }
  if (country === '55' && !/^[1-9]\d{9,10}$/.test(digits)) {
    return invalid(phone, 'Para o Brasil, digite o DDD e o telefone com 10 ou 11 dígitos, sem repetir +55.');
  }
  if (!noteText.value.trim()) return invalid(noteText, 'Escreva uma mensagem antes de enviar.');
  return true;
}

function enviarMensagem() {
  if (!validateMessage()) return false;
  const numeroLocal = phone.value.replace(/\D/g, '');
  const prefixo = prefix.value.replace(/\D/g, '');
  const numero = `${prefixo}${numeroLocal}`;
  const recado = noteText.value.trim();

  if (!numero || !recado) return false;

  window.open(`https://wa.me/${numero}?text=${encodeURIComponent(recado)}`, '_blank', 'noopener');
  return true;
}

function formatarTelefone(value) {
  const digits = String(value).replace(/\D/g, '');
  // Do not truncate pasted numbers or apply the Brazilian mask to other countries.
  if (prefix.value.replace(/\D/g, '') !== '55' || digits.length > 11) return digits;

  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
}

function saveCurrentPage() {
  pages[currentPage].phone = phone.value;
  pages[currentPage].prefix = prefix.value;
  pages[currentPage].text = noteText.value;
  return persistPages();
}

function renderPage() {
  const page = pages[currentPage];
  title.textContent = page.title;
  pageNumber.textContent = String(currentPage + 1).padStart(2, '0');
  pageCounter.textContent = `folha ${String(currentPage + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  prefix.value = page.prefix;
  phone.value = formatarTelefone(page.phone);
  phone.placeholder = prefix.value.replace(/\D/g, '') === '55' ? '(00) 00000-0000' : 'Telefone com código de área';
  noteText.value = page.text;
  clearValidation();
  document.querySelector('#previousPage').disabled = currentPage === 0;
  document.querySelector('#nextPage').disabled = currentPage === pages.length - 1;
  const firstDot = Math.max(0, Math.min(currentPage - 2, pages.length - 5));
  dots.innerHTML = pages.slice(firstDot, firstDot + 5).map((_, offset) => {
    const index = firstDot + offset;
    return `<button class="page-dot ${index === currentPage ? 'active' : ''}" type="button" aria-label="Ir para folha ${index + 1}" aria-current="${index === currentPage ? 'page' : 'false'}" data-page="${index}"></button>`;
  }).join('');
  renderPagesMenu();
}

function renderPagesMenu() {
  const escapeText = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
  pagesList.innerHTML = pages.map((page, index) => `<div class="page-menu-item ${index === currentPage ? 'selected' : ''}"><button class="page-menu-open" type="button" data-menu-page="${index}"><span class="menu-page-number">${String(index + 1).padStart(2, '0')}</span><span class="menu-page-copy"><strong>${escapeText(page.title)}</strong><small>${escapeText(page.text ? page.text.slice(0, 42) : 'folha em branco')}</small></span></button><button class="delete-page" type="button" data-delete-page="${index}" aria-label="Excluir folha ${index + 1}">⌫</button></div>`).join('');
}

function setMenu(open) {
  if (open) renderPagesMenu();
  pagesMenu.classList.toggle('open', open);
  menuBackdrop.classList.toggle('open', open);
  pagesMenu.setAttribute('aria-hidden', String(!open));
  pagesMenu.inert = !open;
  document.body.classList.toggle('menu-is-open', open);
  document.querySelector('#openPagesMenu').setAttribute('aria-expanded', String(open));
  document.querySelector(open ? '#closePagesMenu' : '#openPagesMenu').focus();
}

pagesMenu.inert = true;
document.addEventListener('keydown', event => {
  if (!pagesMenu.classList.contains('open')) return;
  if (event.key === 'Escape') setMenu(false);
  if (event.key === 'Tab') {
    const buttons = [...pagesMenu.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus();
    }
  }
});

function deletePage(index) {
  if (!Number.isInteger(index) || index < 0 || index >= pages.length) return;
  saveCurrentPage();
  const selectedPage = pages[currentPage];
  const [removed] = pages.splice(index, 1);
  const placeholder = pages.length === 0 ? blankPage() : null;
  if (placeholder) pages.push(placeholder);
  deletedPages.push({ page: removed, index, placeholder });
  // Keep the latest 20 deletions available for undo during this session.
  if (deletedPages.length > 20) deletedPages.shift();
  const selectedIndex = pages.indexOf(selectedPage);
  currentPage = selectedIndex >= 0 ? selectedIndex : Math.min(index, pages.length - 1);
  persistPages();
  renderPage();
  undoDelete.disabled = false;
  undoDelete.focus();
  showToast('Folha removida. Você pode desfazer pelo menu.');
}

undoDelete.addEventListener('click', () => {
  const deleted = deletedPages.pop();
  if (!deleted) return;
  saveCurrentPage();
  const placeholderIndex = pages.indexOf(deleted.placeholder);
  // Remove only an untouched placeholder; preserve any notes written after deletion.
  if (placeholderIndex >= 0 && JSON.stringify(pages[placeholderIndex]) === JSON.stringify(blankPage())) {
    pages.splice(placeholderIndex, 1);
  }
  currentPage = Math.min(deleted.index, pages.length);
  pages.splice(currentPage, 0, deleted.page);
  persistPages();
  renderPage();
  undoDelete.disabled = deletedPages.length === 0;
  if (undoDelete.disabled) pagesList.querySelector('[data-menu-page="' + currentPage + '"]').focus();
  showToast('Folha restaurada.');
});

function openNotebook() {
  coverView.classList.remove('is-visible');
  notebookView.classList.add('is-visible');
  renderPage();
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
}

document.querySelector('#openNotebook').addEventListener('click', openNotebook);
document.querySelector('#backToCover').addEventListener('click', () => {
  saveCurrentPage();
  notebookView.classList.remove('is-visible');
  coverView.classList.add('is-visible');
});
document.querySelector('#previousPage').addEventListener('click', () => { if (currentPage > 0) { saveCurrentPage(); currentPage -= 1; renderPage(); } });
document.querySelector('#nextPage').addEventListener('click', () => { if (currentPage < pages.length - 1) { saveCurrentPage(); currentPage += 1; renderPage(); } });
document.querySelector('#newPage').addEventListener('click', () => {
  saveCurrentPage();
  pages.push({ title: pages.length === 1 ? 'Uma nova ideia' : `Folha ${pages.length + 1}`, prefix: '55', phone: '', text: '' });
  currentPage = pages.length - 1;
  renderPage();
  saveCurrentPage();
  showToast('Uma nova folha foi aberta ✦');
  noteText.focus();
});
document.querySelector('#openPagesMenu').addEventListener('click', () => setMenu(true));
document.querySelector('#closePagesMenu').addEventListener('click', () => setMenu(false));
menuBackdrop.addEventListener('click', () => setMenu(false));
pagesList.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-menu-page]');
  const deleteButton = event.target.closest('[data-delete-page]');
  if (deleteButton) {
    deletePage(Number(deleteButton.dataset.deletePage));
    return;
  }
  if (openButton) {
    saveCurrentPage();
    currentPage = Number(openButton.dataset.menuPage);
    renderPage();
    setMenu(false);
  }
});
document.querySelector('#menuNewPage').addEventListener('click', () => {
  document.querySelector('#newPage').click();
  setMenu(false);
});
dots.addEventListener('click', (event) => {
  const target = event.target.closest('[data-page]');
  if (!target) return;
  saveCurrentPage();
  currentPage = Number(target.dataset.page);
  renderPage();
});
document.querySelector('#noteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  saveCurrentPage();
  if (enviarMensagem()) showToast('Recado enviado com carinho! ☼');
});
phone.addEventListener('input', () => {
  const cursor = phone.selectionStart ?? phone.value.length;
  const digitCount = phone.value.slice(0, cursor).replace(/\D/g, '').length;
  phone.value = formatarTelefone(phone.value);
  // Keep the cursor by the same digit when formatting edits in the middle.
  let position = 0, seen = 0;
  while (position < phone.value.length && seen < digitCount) {
    if (/\d/.test(phone.value[position])) seen += 1;
    position += 1;
  }
  phone.setSelectionRange(position, position);
  clearValidation();
  saveCurrentPage();
});
noteText.addEventListener('input', () => {
  clearValidation();
  saveCurrentPage();
});
prefix.addEventListener('input', () => {
  clearValidation();
  phone.value = formatarTelefone(phone.value);
  phone.placeholder = prefix.value.replace(/\D/g, '') === '55' ? '(00) 00000-0000' : 'Telefone com código de área';
  saveCurrentPage();
});

function updateThemeButton() {
  const dark = document.body.classList.contains('dark-mode');
  toggleTheme.textContent = dark ? '☀' : '☾';
  toggleTheme.setAttribute('aria-label', dark ? 'Ativar modo dia' : 'Ativar modo noite');
  toggleTheme.setAttribute('aria-pressed', String(dark));
}
try {
  if (localStorage.getItem(themeKey) === 'dark') document.body.classList.add('dark-mode');
} catch {
  // The notebook remains usable even when browser storage is unavailable.
}
toggleTheme.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  updateThemeButton();
  try {
    localStorage.setItem(themeKey, document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  } catch {
    showToast('O tema foi alterado, mas não pôde ser salvo para a próxima visita.');
  }
});
updateThemeButton();
if (storageReadFailed) {
  saveStatus.textContent = 'Alterações apenas nesta sessão — não salvas';
  saveStatus.dataset.state = 'error';
  showStorageNotice('Não foi possível acessar o armazenamento deste navegador. As notas anteriores não foram carregadas. Novas anotações ficarão apenas nesta sessão.');
} else if (recoveryMessage) {
  showStorageNotice(recoveryMessage);
}
