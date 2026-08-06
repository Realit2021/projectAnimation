// ================= МОДАЛЬНЫЕ ОКНА =================
function openModal(id) {
  document.getElementById(id).classList.add('show');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });

  setupBgModeTabs('modal-new-project');
  setupBgModeTabs('modal-project-settings');

  setupFileDrop('np-bg-drop', 'np-bg-file', 'image');
  setupFileDrop('ps-bg-drop', 'ps-bg-file', 'image');

  setupFileDrop('np-bg-video-drop', 'np-bg-video-file', 'video');
  setupFileDrop('ps-bg-video-drop', 'ps-bg-video-file', 'video');
}

function setupBgModeTabs(modalId) {
  const modal = document.getElementById(modalId);
  const tabs = modal.querySelectorAll('.bg-mode-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setBgModeInModal(modalId, tab.dataset.mode);
    });
  });
}

function setBgModeInModal(modalId, mode) {
  const modal = document.getElementById(modalId);

  modal.querySelectorAll('.bg-mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });

  modal.querySelectorAll('.bg-mode-panel').forEach(p => {
    p.classList.toggle('active', p.dataset.panel === mode);
  });

  modal.dataset.currentMode = mode;
}

function setupFileDrop(dropId, fileId, kind = 'image') {
  const drop = document.getElementById(dropId);
  const fileInput = document.getElementById(fileId);

  let pendingFile = null;

  const acceptFile = (file) => {
    if (!file) return false;

    if (kind === 'video') {
      return file.type.startsWith('video/');
    }

    return file.type.startsWith('image/');
  };

  drop.addEventListener('click', () => fileInput.click());

  drop.addEventListener('dragover', (e) => {
    e.preventDefault();
    drop.style.borderColor = 'var(--accent)';
  });

  drop.addEventListener('dragleave', () => {
    drop.style.borderColor = '';
  });

  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.style.borderColor = '';

    const file = e.dataTransfer.files[0];

    if (acceptFile(file)) {
      pendingFile = file;
      drop.classList.add('has-file');
      drop.textContent = `✓ ${file.name}`;
      drop._pendingFile = file;
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (acceptFile(file)) {
      pendingFile = file;
      drop.classList.add('has-file');
      drop.textContent = `✓ ${file.name}`;
      drop._pendingFile = file;
    }

    e.target.value = '';
  });

  drop._getPendingFile = () => pendingFile;

  drop._clearPendingFile = () => {
    pendingFile = null;
    drop.classList.remove('has-file');
    drop.textContent = kind === 'video'
      ? '📁 Кликните или перетащите видео'
      : '📁 Кликните или перетащите изображение';
    drop._pendingFile = null;
  };
}

function openExportModal() {
  document.getElementById('export-width').value = canvas.getWidth();
  openModal('modal-export');
}
