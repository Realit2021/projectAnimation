 
// ================= CANVAS =================

let canvas;
let gridOverlay;
let currentZoom = 1; // Текущий масштаб (1 = 100%)
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

// Переменные для панорамирования камеры
let isPanning = false;
let lastPanX = 0;
let lastPanY = 0;

function initCanvas() {
    canvas = new fabric.Canvas('c', {
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
        selection: true
    });

    // Отключаем ограничение объектов рамками холста - теперь объекты за пределами холста видны и доступны для редактирования
    canvas.clipPath = undefined;
    
    // Разрешаем объектам выходить за пределы холста
    canvas.selection = true;
    
    const canvasContainer = document.querySelector('.canvas-container');
    gridOverlay = document.createElement('div');
    gridOverlay.id = 'grid-overlay';
    canvasContainer.appendChild(gridOverlay);

    // ===== ОБРАБОТЧИКИ ДЛЯ ПАНОРАМИРОВАНИЯ КАМЕРЫ (КОЛЕСИКО МЫШИ) =====
    canvas.on('mouse:down', (e) => {
        // Если нажато среднее колесико мыши (button === 1)
        if (e.e.button === 1) {
            isPanning = true;
            lastPanX = e.e.clientX;
            lastPanY = e.e.clientY;
            canvas.defaultCursor = 'grabbing';
            canvas.selection = false; // Отключаем выделение при панорамировании
            e.e.preventDefault();
        }
    });

    canvas.on('mouse:move', (e) => {
        if (!isPanning) return;
        
        const deltaX = e.e.clientX - lastPanX;
        const deltaY = e.e.clientY - lastPanY;
        
        lastPanX = e.e.clientX;
        lastPanY = e.e.clientY;
        
        // Используем viewportTransform для панорамирования камеры
        const zoom = canvas.getZoom();
        const vpt = canvas.viewportTransform;
        vpt[4] += deltaX / zoom;
        vpt[5] += deltaY / zoom;
        canvas.setViewportTransform(vpt);
        canvas.renderAll();
        
        // Обновляем позицию сетки при панорамировании
        updateGridOverlay();
    });

    canvas.on('mouse:up', (e) => {
        if (e.e.button === 1) {
            isPanning = false;
            canvas.defaultCursor = 'default';
            canvas.selection = true; // Включаем выделение обратно
        }
    });

    // Также останавливаем панорамирование если мышь ушла с канваса
    canvas.on('mouse:out', () => {
        if (isPanning) {
            isPanning = false;
            canvas.defaultCursor = 'default';
            canvas.selection = true;
        }
    });
}

// Функция установки масштаба
function setZoom(zoom) {
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    
    // Устанавливаем масштаб через viewportTransform для правильной работы с камерой
    canvas.setZoom(currentZoom);
    
    // Обновляем текст кнопки сброса
    const resetBtn = document.getElementById('btn-zoom-reset');
    if (resetBtn) {
        resetBtn.textContent = Math.round(currentZoom * 100) + '%';
    }
    
    // Обновляем сетку при изменении масштаба
    updateGridOverlay();
}

// Увеличить масштаб
function zoomIn() {
    setZoom(currentZoom * 1.25);
}

// Уменьшить масштаб
function zoomOut() {
    setZoom(currentZoom / 1.25);
}

// Сбросить масштаб
function zoomReset() {
    setZoom(1);
}

function updateGridOverlay() {
    if (!gridOverlay) return;
    
    if (!gridEnabled) {
        gridOverlay.classList.remove('show');
        return;
    }
    gridOverlay.classList.add('show');
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    gridOverlay.style.width = w + 'px';
    gridOverlay.style.height = h + 'px';
    
    // Учитываем масштаб для сетки
    const scaledGridSize = gridSize * canvas.getZoom();
    
    gridOverlay.style.backgroundImage = `
        linear-gradient(to right, rgba(100, 150, 255, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(100, 150, 255, 0.3) 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    
    // Обновляем позицию сетки с учётом панорамирования
    const vpt = canvas.viewportTransform;
    if (vpt) {
        gridOverlay.style.transform = `translate(${vpt[4]}px, ${vpt[5]}px)`;
        gridOverlay.style.transformOrigin = 'top left';
    }
}
