 
// ================= CANVAS =================

let canvas;
let gridOverlay;
let currentZoom = 1; // Текущий масштаб (1 = 100%)
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

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
}

// Функция установки масштаба
function setZoom(zoom) {
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    
    const workspace = document.getElementById('workspace');
    const canvasEl = document.getElementById('c');
    const canvasContainer = document.querySelector('.canvas-container');
    
    // Устанавливаем масштаб для canvas
    canvasEl.style.transform = `scale(${currentZoom})`;
    canvasEl.style.transformOrigin = 'center center';
    
    // Обновляем размеры контейнера с учётом масштаба для отображения объектов за пределами холста
    const scaledWidth = canvas.getWidth() * currentZoom;
    const scaledHeight = canvas.getHeight() * currentZoom;
    canvasContainer.style.width = scaledWidth + 'px';
    canvasContainer.style.height = scaledHeight + 'px';
    
    // Обновляем текст кнопки сброса
    const resetBtn = document.getElementById('btn-zoom-reset');
    if (resetBtn) {
        resetBtn.textContent = Math.round(currentZoom * 100) + '%';
    }
    
    // Пересчитываем offset для корректной работы мыши
    setTimeout(() => {
        canvas.calcOffset();
    }, 10);
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
    if (!gridEnabled) {
        gridOverlay.classList.remove('show');
        return;
    }
    gridOverlay.classList.add('show');
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    gridOverlay.style.width = w + 'px';
    gridOverlay.style.height = h + 'px';
    gridOverlay.style.backgroundImage = `
        linear-gradient(to right, rgba(100, 150, 255, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(100, 150, 255, 0.3) 1px, transparent 1px)
    `;
    gridOverlay.style.backgroundSize = `${gridSize}px ${gridSize}px`;
}
