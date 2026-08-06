// ================= ИНТЕРПОЛЯЦИЯ =================

function applyStateAtTime(time) {
    canvas.getObjects().forEach(obj => {
        if (obj.isBackgroundImage) return;
        if (!obj.keyframes) return;
        const times = Object.keys(obj.keyframes).map(Number).sort((a, b) => a - b);
        if (times.length === 0) return;

        const clamp = (kf) => {
            obj.set({
                left: kf.left !== undefined ? kf.left : obj.left,
                top: kf.top !== undefined ? kf.top : obj.top,
                angle: kf.angle !== undefined ? kf.angle : obj.angle,
                scaleX: kf.scaleX !== undefined ? kf.scaleX : obj.scaleX,
                scaleY: kf.scaleY !== undefined ? kf.scaleY : obj.scaleY,
                opacity: (kf.opacity !== undefined && kf.opacity !== null) ? kf.opacity : 1,
                visible: (kf.visible !== undefined && kf.visible !== null) ? kf.visible : true
            });

            // Компенсация pivot для крайних кадров
            if (kf.pivotGlobalX !== undefined && kf.pivotGlobalY !== undefined) {
                applyPivotCompensation(obj, kf.pivotGlobalX, kf.pivotGlobalY);
            }

            obj.setCoords();
        };

        if (time <= times[0]) { clamp(obj.keyframes[times[0]]); return; }
        if (time >= times[times.length - 1]) { clamp(obj.keyframes[times[times.length - 1]]); return; }

        const nextTime = times.find(t => t > time);
        const prevTime = times[times.indexOf(nextTime) - 1];
        const progress = (time - prevTime) / (nextTime - prevTime);
        const seg = obj.keyframes[nextTime].segment || { easing: 'linear' };
        const ep = EASINGS[seg.easing](progress);
        const p = obj.keyframes[prevTime], n = obj.keyframes[nextTime];

        const pOp = p.opacity ?? 1;
        const nOp = n.opacity ?? 1;

        obj.set({
            left: p.left !== undefined ? p.left + (n.left - p.left) * ep : obj.left,
            top: p.top !== undefined ? p.top + (n.top - p.top) * ep : obj.top,
            angle: p.angle !== undefined ? p.angle + (n.angle - p.angle) * ep : obj.angle,
            scaleX: p.scaleX !== undefined ? p.scaleX + (n.scaleX - p.scaleX) * ep : obj.scaleX,
            scaleY: p.scaleY !== undefined ? p.scaleY + (n.scaleY - p.scaleY) * ep : obj.scaleY,
            opacity: pOp + (nOp - pOp) * ep,
            visible: n.visible !== undefined ? n.visible : true
        });

        // Компенсация pivot при интерполяции
        if (p.pivotGlobalX !== undefined && n.pivotGlobalX !== undefined) {
            const interpPivotX = p.pivotGlobalX + (n.pivotGlobalX - p.pivotGlobalX) * ep;
            const interpPivotY = p.pivotGlobalY + (n.pivotGlobalY - p.pivotGlobalY) * ep;
            applyPivotCompensation(obj, interpPivotX, interpPivotY);
        }

        obj.setCoords();
    });
    syncBackgroundVideo(time);
    canvas.renderAll();
}

// Функция компенсации pivot
// Функция компенсации pivot
function applyPivotCompensation(obj, targetPivotX, targetPivotY) {
    const px = obj.pivotX !== undefined ? obj.pivotX : 0.5;
    const py = obj.pivotY !== undefined ? obj.pivotY : 0.5;

    // Если pivot в центре — компенсация не нужна
    if (px === 0.5 && py === 0.5) return;

    // Центр объекта (left/top — это верхний левый угол bounding box)
    const centerX = obj.left + obj.width / 2;
    const centerY = obj.top + obj.height / 2;

    // Pivot в локальных координатах (относительно центра)
    const localPivotX = (px - 0.5) * obj.width;
    const localPivotY = (py - 0.5) * obj.height;

    // Поворачиваем localPivot на текущий угол объекта
    const angleRad = obj.angle * Math.PI / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const rotatedPivotX = localPivotX * cos - localPivotY * sin;
    const rotatedPivotY = localPivotX * sin + localPivotY * cos;

    // Где сейчас находится pivot (без компенсации)
    const currentPivotX = centerX + rotatedPivotX;
    const currentPivotY = centerY + rotatedPivotY;

    // Корректируем left/top так, чтобы pivot оказался в целевой позиции
    const offsetX = targetPivotX - currentPivotX;
    const offsetY = targetPivotY - currentPivotY;
    obj.left += offsetX;
    obj.top += offsetY;
}
