// ================= НОВЫЙ ПРОЕКТ =================
let projectName = 'Без названия';
let DURATION = DEFAULT_DURATION;
let TIME_STEP = DEFAULT_TIME_STEP;

function openNewProjectDialog() {
  document.getElementById('np-name').value = projectName;
  document.getElementById('np-width').value = canvas.getWidth();
  document.getElementById('np-height').value = canvas.getHeight();
  document.getElementById('np-duration').value = DURATION;
  document.getElementById('np-bg-color').value = bgColor || '#ffffff';

  setBgModeInModal('modal-new-project', 'color');

  document.getElementById('np-bg-drop')._clearPendingFile();
  document.getElementById('np-bg-video-drop')._clearPendingFile();

  document.getElementById('np-bg-video-loop').checked = true;

  openModal('modal-new-project');
}

async function createNewProject(opts) {
  canvas.clear();

  objectCounter = 0;
  selectedKeyframe = null;
  currentTime = 0;
  isPlaying = false;

  document.getElementById('btn-play').innerText = '▶';

  projectName = opts.name;
  document.getElementById('project-name').textContent = projectName;

  canvas.setWidth(opts.width);
  canvas.setHeight(opts.height);

  DURATION = opts.duration;
  document.getElementById('inp-duration').value = DURATION;

  bgMode = opts.bgMode;
  bgColor = opts.bgColor;

  bgImageObj = null;
  bgImageDataURL = null;

  bgVideoObj = null;
  bgVideoEl = null;
  bgVideoDataURL = null;

  await applyBackground(opts.bgMode, opts.bgColor, opts.bgFile, {
    file: opts.bgVideoFile,
    loop: opts.bgVideoLoop
  });

  canvas.renderAll();
  renderTimeline();
  updatePlayhead();
  updateInspector();
  updateGridOverlay();

  toast(`Проект "${projectName}" создан`, 'success');
}

function openProjectSettings() {
  document.getElementById('ps-name').value = projectName;
  document.getElementById('ps-width').value = canvas.getWidth();
  document.getElementById('ps-height').value = canvas.getHeight();
  document.getElementById('ps-bg-color').value = bgColor || '#ffffff';

  setBgModeInModal('modal-project-settings', bgMode);

  const imageDrop = document.getElementById('ps-bg-drop');

  if (bgImageObj && bgImageDataURL) {
    imageDrop.classList.add('has-file');
    imageDrop.textContent = '✓ Текущее фоновое изображение (кликните чтобы заменить)';
    imageDrop._pendingFile = null;
  } else {
    imageDrop._clearPendingFile();
  }

  const videoDrop = document.getElementById('ps-bg-video-drop');

  if (bgVideoEl && bgVideoDataURL) {
    videoDrop.classList.add('has-file');
    videoDrop.textContent = '✓ Текущее фоновое видео (кликните чтобы заменить)';
    videoDrop._pendingFile = null;
  } else {
    videoDrop._clearPendingFile();
  }

  document.getElementById('ps-bg-video-loop').checked = bgVideoLoop;

  openModal('modal-project-settings');
}
