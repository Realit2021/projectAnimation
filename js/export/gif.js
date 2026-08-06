// ================= ЭКСПОРТ GIF =================
async function exportToGIF(fps, quality, width, height, onProgress) {
  const gif = new GIF({
    workers: 2,
    quality: 11 - quality,
    width: width,
    height: height,
    workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js'
  });

  const totalFrames = Math.ceil(DURATION * fps);
  const frameDuration = 1000 / fps;

  const savedTime = currentTime;
  const savedPlaying = isPlaying;

  isPlaying = false;

  if (bgMode === 'video' && bgVideoEl) {
    bgVideoEl.pause();
  }

  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;

    currentTime = time;
    applyStateAtTime(time);

    await syncBackgroundVideoAsync(time);

    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: width / canvas.getWidth()
    });

    await new Promise(resolve => {
      const img = new Image();

      img.onload = () => {
        gif.addFrame(img, { delay: frameDuration });
        resolve();
      };

      img.src = dataURL;
    });

    onProgress((i / totalFrames) * 100);

    await new Promise(r => setTimeout(r, 10));
  }

  currentTime = savedTime;
  isPlaying = savedPlaying;

  applyStateAtTime(currentTime);

  return new Promise((resolve, reject) => {
    gif.on('finished', (blob) => {
      saveAs(blob, `${projectName}_${Date.now()}.gif`);
      resolve();
    });

    gif.on('error', reject);

    gif.render();
  });
}
