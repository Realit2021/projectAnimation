 
// ================= ВИДИМОСТЬ =================

function toggleActiveVisibility() {
    const obj = canvas.getActiveObject();
    if (!obj) { toast('Нет выделенного объекта', 'info'); return; }
    if (obj.isBackgroundImage) return;
    obj.visible = !obj.visible;
    canvas.renderAll();
    updateInspector();
    renderTrackLabels();
    renderTracks();
}
