// ================= ЭКСПОРТ ВИДЕО =================

async function exportToVideo(format, fps, quality, width, height, onProgress) {
    const canvasEl = document.createElement('canvas');
    canvasEl.width = width;
    canvasEl.height = height;
    const ctx = canvasEl.getContext('2d');

    // ИСПРАВЛЕНИЕ 1: Браузеры плохо поддерживают 'video/mp4' в MediaRecorder.
    // Мы проверяем поддерживаемые форматы и выбираем лучший доступный (обычно video/webm).
    // Файл всё равно будет работать в большинстве плееров.
    const supportedMimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
    ];

    let mimeType = 'video/webm';
    for (const type of supportedMimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
        }
    }

    const stream = canvasEl.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: quality * 100000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
            chunks.push(e.data);
        }
    };

    const savedTime = currentTime;
    const savedPlaying = isPlaying;

    isPlaying = false;

    if (bgMode === 'video' && bgVideoEl) {
      bgVideoEl.pause();
    }

    const totalFrames = Math.ceil(DURATION * fps);
    const frameDuration = 1000 / fps;

    mediaRecorder.start();

    for (let i = 0; i < totalFrames; i++) {
        const time = (i / fps);
        currentTime = time;
        applyStateAtTime(time);

        await syncBackgroundVideoAsync(time);

        const dataURL = canvas.toDataURL({ format: 'png' });

        // ИСПРАВЛЕНИЕ 2: Добавлен onerror, чтобы промис не зависал навсегда при сбое картинки
        await new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height);
                resolve();
            };
            img.onerror = () => {
                console.warn('Ошибка загрузки кадра для видео, пропускаем...');
                resolve();
            };
            img.src = dataURL;
        });

        onProgress(Math.round((i / totalFrames) * 100));

        // ИСПРАВЛЕНИЕ 3: Небольшая защита от слишком быстрого цикла
        await new Promise(r => setTimeout(r, Math.max(10, frameDuration - 10)));
    }

    // Возвращаем исходное состояние холста
    currentTime = savedTime;
    isPlaying = savedPlaying;
    applyStateAtTime(currentTime);

    return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
            // ИСПРАВЛЕНИЕ 4: Проверка на пустой результат, чтобы не сохранять битый файл
            if (chunks.length === 0) {
                reject(new Error('Не удалось записать видео: поток данных пуст. Попробуйте другой браузер или формат WebM.'));
                return;
            }

            const blob = new Blob(chunks, { type: mimeType });

            // Определяем финальное расширение. Если браузер не смог в mp4, сохраняем как webm
            const finalFormat = (format === 'mp4' && mimeType.includes('mp4')) ? 'mp4' : 'webm';

            saveAs(blob, `${projectName}_${Date.now()}.${finalFormat}`);
            resolve();
        };

        mediaRecorder.onerror = (e) => {
            console.error('MediaRecorder error:', e);
            reject(new Error('Ошибка записи видео: ' + e.message));
        };

        mediaRecorder.stop();
    });
}
