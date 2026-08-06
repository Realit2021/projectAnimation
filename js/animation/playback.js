// ================= ВОСПРОИЗВЕДЕНИЕ =================
let isPlaying = false;
let lastTimestamp = 0;

function togglePlay() {
  isPlaying = !isPlaying;

  document.getElementById('btn-play').innerText = isPlaying ? '⏸' : '▶';

  if (isPlaying) {
    if (currentTime >= DURATION) {
      currentTime = 0;
    }

    if (bgMode === 'video' && bgVideoEl) {
      const t = bgVideoLoop
        ? currentTime % bgVideoEl.duration
        : Math.min(currentTime, bgVideoEl.duration);

      bgVideoEl.currentTime = t;
      bgVideoEl.play().catch(() => {});
    }

    lastTimestamp = 0;
    requestAnimationFrame(animate);
  } else {
    if (bgMode === 'video' && bgVideoEl) {
      bgVideoEl.pause();
      syncBackgroundVideo(currentTime);
    }
  }
}

function goToStart() {
  currentTime = 0;

  updatePlayhead();
  applyStateAtTime(currentTime);
  renderTracks();
  updateInspector();
  updateKfStatus();
}

function goToEnd() {
  currentTime = DURATION;

  updatePlayhead();
  applyStateAtTime(currentTime);
  renderTracks();
  updateInspector();
  updateKfStatus();
}

function animate(timestamp) {
  if (!isPlaying) return;

  if (!lastTimestamp) {
    lastTimestamp = timestamp;
  }

  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  currentTime += delta;

  if (currentTime > DURATION) {
    currentTime = 0;
  }

  // Мягкая подсинхронизация фонового видео,
  // если оно вдруг убежало от таймлайна.
  if (bgMode === 'video' && bgVideoEl && !bgVideoEl.paused && bgVideoEl.duration) {
    const expected = bgVideoLoop
      ? currentTime % bgVideoEl.duration
      : Math.min(currentTime, bgVideoEl.duration);

    if (Math.abs(bgVideoEl.currentTime - expected) > 0.25) {
      bgVideoEl.currentTime = expected;
    }
  }

  updatePlayhead(false);
  applyStateAtTime(currentTime);

  if (!animate._lastRender || timestamp - animate._lastRender > 100) {
    animate._lastRender = timestamp;
    renderTracks();
    updateKfStatus();
    updateInspector();
  }

  requestAnimationFrame(animate);
}
