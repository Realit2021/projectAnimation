
// ================= ГЛАВНЫЙ ФАЙЛ =================
// Точка входа приложения. Инициализирует все модули после загрузки DOM.

document.addEventListener('DOMContentLoaded', () => {
  // ===== 1. ИНИЦИАЛИЗАЦИЯ ЯДРА =====
  initCanvas();
  initHistory();
  initParentingEvents();
  initPivotEvents(); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
    // ===== 2. ИНИЦИАЛИЗАЦИЯ UI =====
    initMenu();
    initModals();
    initScrub();

    // ===== 3. ОБРАБОТЧИКИ КНОПОК TIMELINE =====
    document.getElementById('btn-play').onclick = togglePlay;
    document.getElementById('btn-go-start').onclick = goToStart;
    document.getElementById('btn-go-end').onclick = goToEnd;

    // ===== 3b. КНОПКИ МАСШТАБА =====
    document.getElementById('btn-zoom-in').onclick = zoomIn;
    document.getElementById('btn-zoom-out').onclick = zoomOut;
    document.getElementById('btn-zoom-reset').onclick = zoomReset;

    // ===== 4. СЕТКА И МАГНИТ =====
    document.getElementById('btn-grid').onclick = () => {
        gridEnabled = !gridEnabled;
        document.getElementById('btn-grid').classList.toggle('active', gridEnabled);
        updateGridOverlay();
    };
    // ===== UNDO / REDO КНОПКИ =====
    document.getElementById('btn-undo').onclick = undo;
    document.getElementById('btn-redo').onclick = redo;

    document.getElementById('btn-snap').onclick = () => {
        snapEnabled = !snapEnabled;
        document.getElementById('btn-snap').classList.toggle('active', snapEnabled);
        toast(snapEnabled ? 'Магнит включён' : 'Магнит выключен', 'info', 1500);
    };

    document.getElementById('inp-grid-size').onchange = (e) => {
        let v = parseInt(e.target.value);
        if (isNaN(v) || v < 5) v = 5;
        if (v > 200) v = 200;
        gridSize = v;
        e.target.value = gridSize;
        updateGridOverlay();
    };

    // ===== 5. ДЛИТЕЛЬНОСТЬ И ШАГ =====
    document.getElementById('inp-duration').addEventListener('change', () => {
        let v = parseFloat(document.getElementById('inp-duration').value);
        if (isNaN(v) || v < 1) v = 1;
        if (v > 120) v = 120;
        v = Math.round(v);
        DURATION = v;
        document.getElementById('inp-duration').value = DURATION;
        if (currentTime > DURATION) {
            currentTime = DURATION;
            updatePlayhead();
            applyStateAtTime(currentTime);
        }
        renderTimeline();
    });

    document.getElementById('inp-step').addEventListener('change', () => {
        let v = parseFloat(document.getElementById('inp-step').value);
        if (isNaN(v) || v < 0.01) v = 0.01;
        if (v > 1) v = 1;
        TIME_STEP = Math.round(v * 100) / 100;
        document.getElementById('inp-step').value = TIME_STEP.toFixed(2);
        currentTime = roundToStep(currentTime);
        updatePlayhead();
        applyStateAtTime(currentTime);
    });

    // ===== 6. СОЗДАНИЕ НОВОГО ПРОЕКТА =====
    document.getElementById('btn-create-project').onclick = async () => {
        if (canvas.getObjects().filter(o => !o.isBackgroundImage).length > 0) {
            if (!confirm('Создание нового проекта очистит текущую сцену. Продолжить?')) {
                return;
            }
        }

        const name = document.getElementById('np-name').value || 'Без названия';
        const width = parseInt(document.getElementById('np-width').value) || 800;
        const height = parseInt(document.getElementById('np-height').value) || 500;
        const duration = parseInt(document.getElementById('np-duration').value) || 5;
        const mode = document.getElementById('modal-new-project').dataset.currentMode || 'color';
        const color = document.getElementById('np-bg-color').value;
        const bgFile = document.getElementById('np-bg-drop')._getPendingFile();
        const bgVideoFile = document.getElementById('np-bg-video-drop')._getPendingFile();
        const bgVideoLoop = document.getElementById('np-bg-video-loop').checked;

        await createNewProject({
          name,
          width,
          height,
          duration,
          bgMode: mode,
          bgColor: color,
          bgFile,
          bgVideoFile,
          bgVideoLoop
        });

        closeModal('modal-new-project');

        document.getElementById('np-bg-drop')._clearPendingFile();
        document.getElementById('np-bg-video-drop')._clearPendingFile();
    };

    // ===== 7. ПРИМЕНЕНИЕ НАСТРОЕК ПРОЕКТА =====
    document.getElementById('btn-apply-settings').onclick = async () => {
        const name = document.getElementById('ps-name').value || 'Без названия';
        const width = parseInt(document.getElementById('ps-width').value) || 800;
        const height = parseInt(document.getElementById('ps-height').value) || 500;
        const mode = document.getElementById('modal-project-settings').dataset.currentMode || 'color';
        const color = document.getElementById('ps-bg-color').value;
        const bgFile = document.getElementById('ps-bg-drop')._getPendingFile();
        const bgVideoFile = document.getElementById('ps-bg-video-drop')._getPendingFile();
        const bgVideoLoop = document.getElementById('ps-bg-video-loop').checked;

        projectName = name;
        document.getElementById('project-name').textContent = projectName;

        canvas.setWidth(width);
        canvas.setHeight(height);

        const imageFileToApply = bgFile || (bgImageObj && bgImageDataURL
          ? dataURLtoFile(bgImageDataURL, 'bg.png')
          : null);

        const videoFileToApply = bgVideoFile || (bgVideoEl && bgVideoDataURL
          ? dataURLtoFile(bgVideoDataURL, 'bg-video.bin')
          : null);

        await applyBackground(mode, color, imageFileToApply, {
          file: videoFileToApply,
          loop: bgVideoLoop
        });

        canvas.calcOffset();
        canvas.renderAll();
        renderTimeline();
        updateGridOverlay();

        closeModal('modal-project-settings');

        document.getElementById('ps-bg-drop')._clearPendingFile();
        document.getElementById('ps-bg-video-drop')._clearPendingFile();

        toast('Настройки проекта применены', 'success');
    };

    // ===== 8. ЭКСПОРТ =====
    document.getElementById('btn-start-export').onclick = async () => {
        const format = document.getElementById('export-format').value;
        const fps = parseInt(document.getElementById('export-fps').value);
        const quality = parseInt(document.getElementById('export-quality').value);
        const width = parseInt(document.getElementById('export-width').value);
        const height = Math.round(canvas.getHeight() * (width / canvas.getWidth()));

        const progressBar = document.getElementById('export-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');

        progressBar.classList.add('show');
        closeModal('modal-export');

        try {
            const onProgress = (progress) => {
                progressFill.style.width = `${progress}%`;
                const label = format === 'gif' ? 'GIF' : format.toUpperCase();
                progressText.textContent = `Создание ${label}: ${Math.round(progress)}%`;
            };

            if (format === 'gif') {
                await exportToGIF(fps, quality, width, height, onProgress);
            } else {
                await exportToVideo(format, fps, quality, width, height, onProgress);
            }
            toast('Экспорт завершён!', 'success');
        } catch (err) {
            console.error(err);
            toast('Ошибка экспорта: ' + err.message, 'error', 5000);
        } finally {
            progressBar.classList.remove('show');
            progressFill.style.width = '0%';
            progressText.textContent = '';
        }
    };

    // ===== 9. ЗАГРУЗКА ПРОЕКТА =====
    document.getElementById('load-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (canvas.getObjects().filter(o => !o.isBackgroundImage).length > 0) {
            if (!confirm('Загрузка проекта заменит текущую сцену. Продолжить?')) {
                e.target.value = '';
                return;
            }
        }
        loadProject(file);
        e.target.value = '';
    };

    // ===== 10. ДОБАВЛЕНИЕ ИЗОБРАЖЕНИЯ =====
    document.getElementById('file-input').onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        addImageFromFile(file);
        e.target.value = '';
    };

    // ===== 11. RESIZE HANDLES =====
    (function initResize() {
        const handleV = document.getElementById('resize-inspector');
        const inspector = document.getElementById('inspector');
        const handleH = document.getElementById('resize-timeline');
        const timeline = document.getElementById('timeline');

        let isResizingV = false, startX = 0, startW = 0;
        let isResizingH = false, startY = 0, startH = 0;

        handleV.addEventListener('mousedown', e => {
            isResizingV = true;
            startX = e.clientX;
            startW = inspector.offsetWidth;
            handleV.classList.add('active');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        handleH.addEventListener('mousedown', e => {
            isResizingH = true;
            startY = e.clientY;
            startH = timeline.offsetHeight;
            handleH.classList.add('active');
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', e => {
            if (isResizingV) {
                const dx = startX - e.clientX;
                const newW = Math.max(180, Math.min(500, startW + dx));
                inspector.style.width = newW + 'px';
                canvas.calcOffset();
            }
            if (isResizingH) {
                const dy = startY - e.clientY;
                const newH = Math.max(80, Math.min(window.innerHeight * 0.6, startH + dy));
                timeline.style.height = newH + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            if (isResizingV) {
                isResizingV = false;
                handleV.classList.remove('active');
                document.body.style.cursor = '';
                canvas.calcOffset();
            }
            if (isResizingH) {
                isResizingH = false;
                handleH.classList.remove('active');
                document.body.style.cursor = '';
            }
        });
    })();

    // ===== 12. СОБЫТИЯ CANVAS =====
    canvas.on('selection:created', () => {
        renderTrackLabels();
        renderTracks();
        updateInspector();
        updateKfStatus();
        updateTimelineKfButton(); // <-- ДОБАВИТЬ
    });
    canvas.on('selection:updated', () => {
        renderTrackLabels();
        renderTracks();
        updateInspector();
        updateKfStatus();
        updateTimelineKfButton(); // <-- ДОБАВИТЬ
    });
    canvas.on('selection:cleared', () => {
        renderTrackLabels();
        renderTracks();
        updateInspector();
        updateKfStatus();
        updateTimelineKfButton(); // <-- ДОБАВИТЬ
    });
    canvas.on('object:modified', updateInspector);

    canvas.on('object:moving', (e) => {
        const o = e.target;
        if (o.isBackgroundImage) return;
        if (snapEnabled && gridSize > 0) {
            o.set({
                left: Math.round(o.left / gridSize) * gridSize,
                top: Math.round(o.top / gridSize) * gridSize
            });
        }
        const x = document.getElementById('inp-x');
        const y = document.getElementById('inp-y');
        if (x && document.activeElement !== x) x.value = Math.round(o.left);
        if (y && document.activeElement !== y) y.value = Math.round(o.top);
    });

    canvas.on('object:scaling', (e) => {
        const o = e.target;
        if (o.isBackgroundImage) return;
        if (snapEnabled && gridSize > 0) {
            const curW = o.width * o.scaleX;
            const curH = o.height * o.scaleY;
            const newW = Math.max(gridSize, Math.round(curW / gridSize) * gridSize);
            const newH = Math.max(gridSize, Math.round(curH / gridSize) * gridSize);
            o.set({
                scaleX: newW / o.width,
                scaleY: newH / o.height
            });
        }
        const m = {
            'inp-w': Math.round(o.width * o.scaleX),
            'inp-h': Math.round(o.height * o.scaleY),
            'inp-sx': o.scaleX.toFixed(2),
            'inp-sy': o.scaleY.toFixed(2)
        };
        for (const [id, v] of Object.entries(m)) {
            const el = document.getElementById(id);
            if (el && document.activeElement !== el) el.value = v;
        }
    });

    canvas.on('object:rotating', (e) => {
        const o = e.target;
        if (o.isBackgroundImage) return;
        if (snapEnabled) {
            const SNAP_ANGLE = 15;
            o.set({
                angle: Math.round(o.angle / SNAP_ANGLE) * SNAP_ANGLE
            });
        }
        const el = document.getElementById('inp-angle');
        if (el && document.activeElement !== el) el.value = Math.round(o.angle);
    });

    // ===== 13. ГОРЯЧИЕ КЛАВИШИ =====
    document.addEventListener('keydown', (e) => {
        const inInput = e.target.tagName === 'INPUT'
            || e.target.tagName === 'TEXTAREA'
            || e.target.tagName === 'SELECT';

        // Ctrl+S работает даже в input
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы')) {
            e.preventDefault();
            saveProject();
            return;
        }

        if (inInput) return;

        // Ctrl+N — новый проект
        if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N' || e.key === 'т' || e.key === 'Т')) {
            e.preventDefault();
            openNewProjectDialog();
            return;
        }
        // L — показать/скрыть привязки
if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') {
    e.preventDefault();
    toggleParentingLinks();
    return;
}
        // Ctrl+O — открыть
        if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O' || e.key === 'щ' || e.key === 'Щ')) {
            e.preventDefault();
            document.getElementById('load-input').click();
            return;
        }
        // Ctrl+E — экспорт
        if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У')) {
            e.preventDefault();
            openExportModal();
            return;
        }

        // Ctrl+P — привязать к объекту
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 'з' || e.key === 'З')) {
            e.preventDefault();
            setParent();
            return;
        }

        // Ctrl+I — добавить изображение
        if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I' || e.key === 'ш' || e.key === 'Ш')) {
            e.preventDefault();
            document.getElementById('file-input').click();
            return;
        }
        // Ctrl+D — дублировать
        if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В')) {
            e.preventDefault();
            duplicateActiveObject();
            return;
        }

        // F6 — записать кадр
        if (e.key === 'F6') {
            e.preventDefault();
            addKeyframe();
            return;
        }

        // Space — Play/Pause
        if (e.code === 'Space') {
            e.preventDefault();
            togglePlay();
            return;
        }
        // Home — в начало
        if (e.key === 'Home') {
            e.preventDefault();
            goToStart();
            return;
        }
        // End — в конец
        if (e.key === 'End') {
            e.preventDefault();
            goToEnd();
            return;
        }

        // H — видимость
        if (e.key === 'h' || e.key === 'H' || e.key === 'р' || e.key === 'Р') {
            toggleActiveVisibility();
            return;
        }
        // G — сетка
        if (e.key === 'g' || e.key === 'G' || e.key === 'п' || e.key === 'П') {
            e.preventDefault();
            document.getElementById('btn-grid').click();
            return;
        }
        // S — магнит (без Ctrl)
        if ((e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы')
            && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            document.getElementById('btn-snap').click();
            return;
        }

        // Delete/Backspace — удалить кадр или объект
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedKeyframe) {
                e.preventDefault();
                const { obj, time } = selectedKeyframe;
                if (confirm(`Удалить ключевой кадр @ ${time.toFixed(2)}s?`)) {
                    deleteKeyframe(obj, time);
                }
            } else if (canvas.getActiveObject() && !canvas.getActiveObject().isBackgroundImage) {
                e.preventDefault();
                deleteActiveObject();
            }
        }
                // Ctrl+Z — Undo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я')) {
            e.preventDefault();
            undo();
            return;
        }
        // Ctrl+Y или Ctrl+Shift+Z — Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y' || e.key === 'н' || e.key === 'Н' || e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'я' || e.key === 'Я'))) {
            e.preventDefault();
            redo();
            return;
        }

    });

    // ===== 14. ЗАКРЫТИE EASING POPUP =====
    document.addEventListener('click', (e) => {
        const popup = document.getElementById('easing-popup');
        if (popup.classList.contains('show')
            && !popup.contains(e.target)
            && !e.target.closest('.animation-segment')) {
            popup.classList.remove('show');
        }

        const menu = document.getElementById('context-menu');
        if (menu && menu.style.display === 'block' && !menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // ===== 15. ПЕРВИЧНЫЙ РЕНДЕР =====
    renderTimeline();
    updatePlayhead();
    updateInspector();
    updateGridOverlay();

    console.log('%c✔ Minimal Animation Studio загружен', 'color:#50c878;font-weight:bold;');
});
