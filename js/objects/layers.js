 
// ================= Z-ПОРОДОК (СЛОИ) =================

function bringToFront() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) return;
    canvas.bringToFront(obj);
    canvas.renderAll();
    saveState();
    toast('На передний план', 'success', 1000);
}

function sendToBack() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) return;
    canvas.sendToBack(obj);

    // Гарантируем, что фон всегда остается самым нижним (индекс 0)
    const bg = canvas.getObjects().find(o => o.isBackgroundImage);
    if (bg) {
        canvas.sendToBack(bg);
    }
    canvas.renderAll();
    saveState();
    toast('На задний план', 'success', 1000);
}

function bringForward() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) return;
    canvas.bringForward(obj);
    canvas.renderAll();
    saveState();
}

function sendBackward() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) return;
    canvas.sendBackwards(obj);

    const bg = canvas.getObjects().find(o => o.isBackgroundImage);
    if (bg && canvas.getObjects().indexOf(obj) === 0) {
        canvas.bringForward(obj); // Не даем уйти ниже фона
    }
    canvas.renderAll();
    saveState();
}
