 
// ================= УПРАВЛЕНИЕ ОБЪЕКТАМИ =================

let objectCounter = 0;

function addImageFromFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            fabric.Image.fromURL(evt.target.result, (img) => {
                objectCounter++;
                img.scaleToWidth(200);
                img.set({ left: 100, top: 100, visible: true });
                img.keyframes = {};
                img.objId = 'obj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
                img.objName = `${file.name.replace(/\.[^/.]+$/, '')} ${objectCounter}`;
                img.objColor = TRACK_COLORS[(objectCounter - 1) % TRACK_COLORS.length];
                img.objType = 'image';
                img.originalFileName = file.name;
                img._sourceDataURL = evt.target.result;
                canvas.add(img);
                canvas.setActiveObject(img);
                renderTimeline();
                updateInspector();
                resolve(img);
            });
        };
        reader.readAsDataURL(file);
    });
}

function duplicateActiveObject() {
    const obj = canvas.getActiveObject();
    if (!obj) { toast('Нет выделенного объекта', 'info'); return; }
    if (obj.isBackgroundImage) { toast('Фоновое изображение дублировать нельзя', 'info'); return; }
    obj.clone(c => {
        objectCounter++;
        c.set({ left: obj.left+20, top: obj.top+20, visible: true });
        c.objId = 'obj_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
        c.objName = (obj.objName||'Object')+' copy';
        c.objColor = TRACK_COLORS[(objectCounter-1)%TRACK_COLORS.length];
        c._sourceDataURL = obj._sourceDataURL;
        c.keyframes = JSON.parse(JSON.stringify(obj.keyframes || {}));
        canvas.add(c); canvas.setActiveObject(c); canvas.renderAll();
        renderTimeline(); updateInspector();
        toast('Объект дублирован', 'success', 1200);
    });
}

function deleteActiveObject() {
    const obj = canvas.getActiveObject();
    if (!obj) { toast('Нет выделенного объекта', 'info'); return; }
    if (obj.isBackgroundImage) { toast('Фоновое изображение нельзя удалить', 'info'); return; }
    if (!confirm(`Удалить "${obj.objName}"?`)) return;
    canvas.remove(obj); canvas.renderAll();
    renderTimeline(); updateInspector();
}
