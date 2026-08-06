// ================= КЛЮЧЕВЫЕ КАДРЫ =================

function addKeyframe() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) {
        toast('Выберите объект на холсте', 'info');
        return;
    }
    const existing = findNearestKeyframe(currentTime, obj);
    let targetTime = currentTime;
    if (existing && existing.distPx <= SNAP_PX) {
        targetTime = existing.time;
    } else {
        targetTime = roundToStep(currentTime);
    }
    const existingData = obj.keyframes[targetTime];

    // Вычисляем глобальные координаты pivot
    const px = obj.pivotX !== undefined ? obj.pivotX : 0.5;
    const py = obj.pivotY !== undefined ? obj.pivotY : 0.5;
    const localPivot = {
        x: (px - 0.5) * obj.width,
        y: (py - 0.5) * obj.height
    };
    const globalPivot = fabric.util.transformPoint(localPivot, obj.calcTransformMatrix());

    obj.keyframes[targetTime] = {
        left: obj.left,
        top: obj.top,
        angle: obj.angle,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        opacity: obj.opacity,
        visible: obj.visible,
        pivotGlobalX: globalPivot.x,
        pivotGlobalY: globalPivot.y,
        segment: existingData ? existingData.segment : { easing: 'linear' }
    };

    renderTimeline();
    updateKfStatus();
    updateTimelineKfButton();
    saveState();
    toast(`Кадр записан @ ${targetTime.toFixed(2)}s`, 'success', 1200);
}

function deleteKeyframe(obj, time) {
    if (!obj.keyframes || !obj.keyframes[time]) return;
    delete obj.keyframes[time];
    if (selectedKeyframe && selectedKeyframe.obj === obj && Math.abs(selectedKeyframe.time - time) < 0.001) {
        selectedKeyframe = null;
    }
    renderTimeline();
    updateKfStatus();
    updateTimelineKfButton();
    saveState();
}
