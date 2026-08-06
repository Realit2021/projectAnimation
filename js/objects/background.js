// ================= ФОН =================
let bgMode = 'color';
let bgColor = '#ffffff';

let bgImageObj = null;
let bgImageDataURL = null;

let bgVideoObj = null;
let bgVideoEl = null;
let bgVideoDataURL = null;
let bgVideoLoop = true;

let hiddenVideoContainer = null;

function ensureHiddenVideoContainer() {
  if (!hiddenVideoContainer) {
    hiddenVideoContainer = document.createElement('div');
    hiddenVideoContainer.style.cssText =
      'position:fixed;left:-99999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
    document.body.appendChild(hiddenVideoContainer);
  }
  return hiddenVideoContainer;
}

function clearBackground() {
  if (bgImageObj) {
    canvas.remove(bgImageObj);
    bgImageObj = null;
    bgImageDataURL = null;
  }

  if (bgVideoObj) {
    canvas.remove(bgVideoObj);
    bgVideoObj = null;
  }

  if (bgVideoEl) {
    bgVideoEl.pause();
    bgVideoEl.removeAttribute('src');
    bgVideoEl.load();

    if (bgVideoEl.parentNode) {
      bgVideoEl.parentNode.removeChild(bgVideoEl);
    }

    bgVideoEl = null;
    bgVideoDataURL = null;
  }
}

async function applyBackground(mode, color, file, videoOpts = {}) {
  clearBackground();

  bgMode = mode;

  if (mode === 'color') {
    canvas.backgroundColor = color;
    bgColor = color;
  } else if (mode === 'transparent') {
    canvas.backgroundColor = null;
  } else if (mode === 'image' && file) {
    canvas.backgroundColor = null;

    await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (evt) => {
        fabric.Image.fromURL(evt.target.result, (img) => {
          const scaleX = canvas.getWidth() / img.width;
          const scaleY = canvas.getHeight() / img.height;
          const scale = Math.max(scaleX, scaleY);

          img.set({
            left: 0,
            top: 0,
            scaleX: scale,
            scaleY: scale,
            selectable: false,
            evented: false,
            hasControls: false,
            hasBorders: false,
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            isBackgroundImage: true
          });

          bgImageObj = img;
          bgImageDataURL = evt.target.result;

          canvas.add(img);
          canvas.sendToBack(img);
          canvas.renderAll();

          resolve();
        });
      };

      reader.readAsDataURL(file);
    });
  } else if (mode === 'video' && videoOpts.file) {
    canvas.backgroundColor = null;
    bgVideoLoop = videoOpts.loop !== undefined ? videoOpts.loop : true;
    await loadBackgroundVideoFromFile(videoOpts.file);
  }

  canvas.renderAll();
}

async function loadBackgroundVideoFromFile(file) {
  const url = URL.createObjectURL(file);
  await createBackgroundVideoElement(url, file);
}

async function loadBackgroundVideoFromBlob(blob) {
  const url = URL.createObjectURL(blob);
  await createBackgroundVideoElement(url, blob);
}

async function createBackgroundVideoElement(url, sourceBlobOrFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.loop = false;
    video.src = url;
    video.load();

    const container = ensureHiddenVideoContainer();
    container.appendChild(video);

    const cleanupOnError = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', cleanupOnError);

      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }

      reject(new Error('Не удалось загрузить фоновое видео'));
    };

    const onMeta = () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('error', cleanupOnError);

      video.width = video.videoWidth;
      video.height = video.videoHeight;

      const scaleX = canvas.getWidth() / video.videoWidth;
      const scaleY = canvas.getHeight() / video.videoHeight;
      const scale = Math.max(scaleX, scaleY);

      const img = new fabric.Image(video, {
        left: 0,
        top: 0,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
        lockMovementX: true,
        lockMovementY: true,
        lockScalingX: true,
        lockScalingY: true,
        lockRotation: true,
        isBackgroundImage: true,
        isBackgroundVideo: true,
        objectCaching: false
      });

      bgVideoObj = img;
      bgVideoEl = video;

      video.addEventListener('seeked', () => {
        if (canvas) {
          canvas.renderAll();
        }
      });

      canvas.add(img);
      canvas.sendToBack(img);

      const reader = new FileReader();
      reader.onload = () => {
        bgVideoDataURL = reader.result;
      };
      reader.readAsDataURL(sourceBlobOrFile);

      const onData = () => {
        video.removeEventListener('loadeddata', onData);
        canvas.renderAll();
        resolve();
      };

      if (video.readyState >= 2) {
        onData();
      } else {
        video.addEventListener('loadeddata', onData);
      }
    };

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('error', cleanupOnError);
  });
}

function syncBackgroundVideo(time) {
  if (bgMode !== 'video' || !bgVideoEl || !bgVideoEl.duration) return;

  // Во время воспроизведения видео крутится само,
  // не нужно каждый кадр делать seek.
  if (typeof isPlaying !== 'undefined' && isPlaying && !bgVideoEl.paused) {
    return;
  }

  let t;

  if (bgVideoLoop) {
    t = time % bgVideoEl.duration;
  } else {
    t = Math.min(time, bgVideoEl.duration);
  }

  if (Math.abs(bgVideoEl.currentTime - t) > 0.02) {
    bgVideoEl.currentTime = t;
  }
}

function syncBackgroundVideoAsync(time) {
  return new Promise((resolve) => {
    if (bgMode !== 'video' || !bgVideoEl || !bgVideoEl.duration) {
      resolve();
      return;
    }

    const t = bgVideoLoop
      ? time % bgVideoEl.duration
      : Math.min(time, bgVideoEl.duration);

    if (Math.abs(bgVideoEl.currentTime - t) < 0.02) {
      resolve();
      return;
    }

    let done = false;

    const finish = () => {
      if (done) return;
      done = true;

      bgVideoEl.removeEventListener('seeked', finish);

      if (canvas) {
        canvas.renderAll();
      }

      resolve();
    };

    bgVideoEl.addEventListener('seeked', finish);
    bgVideoEl.currentTime = t;

    setTimeout(finish, 400);
  });
}
