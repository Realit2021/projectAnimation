 
// ================= CANVAS =================

let canvas;
let gridOverlay;

function initCanvas() {
    canvas = new fabric.Canvas('c', {
        backgroundColor: '#ffffff',
        preserveObjectStacking: true
    });

    const canvasContainer = document.querySelector('.canvas-container');
    gridOverlay = document.createElement('div');
    gridOverlay.id = 'grid-overlay';
    canvasContainer.appendChild(gridOverlay);
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
