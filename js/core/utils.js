 
// ================= УТИЛИТЫ =================

function toast(message, type = 'info', duration = 2500) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
        el.style.transition = 'opacity 0.3s';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 300);
    }, duration);
}

function roundToStep(time) {
    return Math.round(time / TIME_STEP) * TIME_STEP;
}

function findNearestKeyframe(time, targetObj = null) {
    const objects = targetObj ? [targetObj] : canvas.getObjects().filter(o => !o.isBackgroundImage);
    let best = null;
    let bestDist = Infinity;
    objects.forEach(obj => {
        if (!obj.keyframes) return;
        Object.keys(obj.keyframes).forEach(tStr => {
            const t = parseFloat(tStr);
            const distPx = Math.abs(t - time) * PX_PER_SEC;
            if (distPx < bestDist) {
                bestDist = distPx;
                best = { obj, time: t, distPx };
            }
        });
    });
    return best;
}

function snapTime(time) {
    const nearest = findNearestKeyframe(time);
    if (nearest && nearest.distPx <= SNAP_PX) {
        return { time: nearest.time, snapped: true, obj: nearest.obj };
    }
    return { time, snapped: false };
}

function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8 = new Uint8Array(n);
    for (let i = 0; i < n; i++) u8[i] = bstr.charCodeAt(i);
    return new Blob([u8], { type: mime });
}

function dataURLtoFile(dataURL, filename) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    const u8arr = new Uint8Array(bstr.length);
    for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
    return new File([u8arr], filename, { type: mime });
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}
