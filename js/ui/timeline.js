 
// ================= TIMELINE =================

let currentTime = 0;
let selectedKeyframe = null;

function renderTimeline() {
    renderRuler();
    renderTrackLabels();
    renderTracks();
    updateKfStatus();
    document.getElementById('timeline-info').textContent = `Длительность: ${DURATION} сек | Шаг: ${TIME_STEP.toFixed(2)} сек`;
}

function renderRuler() {
    const ruler = document.getElementById('time-ruler');
    ruler.innerHTML = '';
    const totalWidth = DURATION * PX_PER_SEC;
    document.getElementById('timeline-content').style.width = `${totalWidth}px`;
    document.getElementById('tracks-area').style.width = `${totalWidth}px`;
    ruler.style.width = `${totalWidth}px`;

    for (let i = 0; i <= DURATION; i++) {
        const mark = document.createElement('div');
        mark.className = 'ruler-mark';
        mark.style.left = `${i * PX_PER_SEC}px`;
        mark.innerText = `${i}s`;
        ruler.appendChild(mark);
    }
}

function renderTrackLabels() {
    const list = document.getElementById('track-labels-list');
    list.innerHTML = '';
    const objects = canvas.getObjects().filter(o => !o.isBackgroundImage);
    const selected = canvas.getActiveObject();
    objects.forEach(obj => {
        const label = document.createElement('div');
        label.className = 'track-label' + (obj === selected ? ' selected' : '');
        const isVisible = obj.visible !== false;
        label.innerHTML = `
            <div class="track-icon" style="background:${obj.objColor || '#888'}"></div>
            <div class="track-eye ${isVisible ? '' : 'hidden'}" title="${isVisible ? 'Скрыть (H)' : 'Показать (H)'}">
                ${isVisible ? '👁' : '🚫'}
            </div>
            <div class="track-name" title="${obj.objName}">${obj.objName}</div>`;

        const eyeEl = label.querySelector('.track-eye');
        eyeEl.onclick = (e) => {
            e.stopPropagation();
            obj.visible = !obj.visible;
            canvas.renderAll();
            updateInspector();
            renderTrackLabels();
            renderTracks();
        };

        label.onclick = () => {
            canvas.setActiveObject(obj);
            canvas.renderAll();
            updateInspector();
            renderTrackLabels();
            renderTracks();
        };
        list.appendChild(label);
    });
}

function renderTracks() {
    const area = document.getElementById('tracks-area');
    area.innerHTML = '';
    const objects = canvas.getObjects().filter(o => !o.isBackgroundImage);
    const selected = canvas.getActiveObject();

    const gridContainer = document.createElement('div');
    gridContainer.style.cssText = 'position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:0;';
    for (let t = 0; t <= DURATION; t += GRID_MINOR_STEP) {
        const line = document.createElement('div');
        const isMajor = Math.abs(t - Math.round(t)) < 0.001;
        line.className = 'grid-line ' + (isMajor ? 'major' : 'minor');
        line.style.left = `${t * PX_PER_SEC}px`;
        gridContainer.appendChild(line);
    }
    area.appendChild(gridContainer);

    objects.forEach((obj) => {
        const row = document.createElement('div');
        row.className = 'track-row' + (obj === selected ? ' selected' : '');
        row.style.height = `${TRACK_HEIGHT}px`;
        row.style.position = 'relative';

        if (obj.keyframes) {
            const times = Object.keys(obj.keyframes).map(Number).sort((a, b) => a - b);

            for (let i = 0; i < times.length - 1; i++) {
                const st = times[i], et = times[i + 1];
                const startKf = obj.keyframes[st];
                const endKf = obj.keyframes[et];
                const seg = endKf.segment || { easing: 'linear' };

                const startVisible = startKf.visible !== undefined ? startKf.visible : true;
                const endVisible = endKf.visible !== undefined ? endKf.visible : true;

                if (!startVisible && !endVisible) {
                    const hiddenEl = document.createElement('div');
                    hiddenEl.className = 'hidden-segment';
                    hiddenEl.style.left = `${st * PX_PER_SEC + 6}px`;
                    hiddenEl.style.width = `${Math.max(0, (et - st) * PX_PER_SEC - 12)}px`;
                    hiddenEl.innerHTML = `<span class="hidden-label">СКРЫТ</span>`;
                    row.appendChild(hiddenEl);
                } else {
                    const segEl = document.createElement('div');
                    segEl.className = 'animation-segment';
                    segEl.style.left = `${st * PX_PER_SEC + 6}px`;
                    segEl.style.width = `${Math.max(0, (et - st) * PX_PER_SEC - 12)}px`;
                    segEl.innerHTML = `<span class="seg-label">${seg.easing}</span>` +
                                      buildMiniGraphSVG(seg.easing, obj.objColor || '#4a9eff');
                    segEl.onclick = (e) => {
                        e.stopPropagation();
                        showEasingPopup(obj, et, segEl);
                    };
                    row.appendChild(segEl);
                }
            }

            times.forEach(time => {
                const kf = document.createElement('div');
                kf.className = 'keyframe';
                kf.style.left = `${time * PX_PER_SEC}px`;
                kf.style.background = obj.objColor || '#ffcc00';
                kf.title = `${obj.objName} @ ${time}s\nПКМ — удалить`;
                kf.dataset.objId = obj.objId;
                kf.dataset.time = time;

                if (Math.abs(currentTime - time) < 0.001) kf.classList.add('active');
                if (selectedKeyframe && selectedKeyframe.obj === obj && Math.abs(selectedKeyframe.time - time) < 0.001) {
                    kf.classList.add('selected-kf');
                }

                kf.addEventListener('mousedown', (e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    e.preventDefault();
                    kf.classList.add('dragging');
                    const scrollEl = document.getElementById('timeline-scroll');
                    const tracksRect = area.getBoundingClientRect();
                    const originalTime = time;

                    const onMove = (me) => {
                        const x = me.clientX - tracksRect.left + scrollEl.scrollLeft;
                        let newTime = (x / PX_PER_SEC);
                        newTime = roundToStep(newTime);
                        newTime = Math.max(0, Math.min(DURATION, newTime));
                        const otherTimes = times.filter(t => Math.abs(t - originalTime) > 0.001);
                        for (const ot of otherTimes) {
                            if (Math.abs(newTime - ot) < TIME_STEP) {
                                newTime = newTime < ot ? ot - TIME_STEP : ot + TIME_STEP;
                            }
                        }
                        newTime = Math.max(0, Math.min(DURATION, roundToStep(newTime)));
                        kf.style.left = `${newTime * PX_PER_SEC}px`;
                        kf._dragTime = newTime;
                    };

                    const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        kf.classList.remove('dragging');
                        const newTime = kf._dragTime;
                        if (newTime !== undefined && Math.abs(newTime - originalTime) > 0.001) {
                            const data = obj.keyframes[originalTime];
                            delete obj.keyframes[originalTime];
                            obj.keyframes[newTime] = data;
                            if (selectedKeyframe && selectedKeyframe.obj === obj && Math.abs(selectedKeyframe.time - originalTime) < 0.001) {
                                selectedKeyframe = { obj, time: newTime };
                            }
                            renderTimeline();
                        }
                    };

                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                });

                kf.onclick = (e) => {
                    e.stopPropagation();
                    currentTime = time;
                    selectedKeyframe = { obj, time };
                    updatePlayhead();
                    applyStateAtTime(currentTime);
                    canvas.setActiveObject(obj);
                    canvas.renderAll();
                    updateInspector();
                    renderTrackLabels();
                    renderTracks();
                    updateTimelineKfButton();
                };

                kf.oncontextmenu = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    selectedKeyframe = { obj, time };
                    renderTracks();
                    showContextMenu(e.clientX, e.clientY, [
                        {
                            label: 'Удалить кадр',
                            shortcut: 'Del',
                            danger: true,
                            action: () => {
                                if (confirm(`Удалить ключевой кадр @ ${time}s?`)) {
                                    deleteKeyframe(obj, time);
                                }
                            }
                        }
                    ]);
                };

                row.appendChild(kf);
            });
        }
        area.appendChild(row);
    });
}

function updatePlayhead(snapped = false) {
    const ph = document.getElementById('playhead');
    ph.style.left = `${currentTime * PX_PER_SEC}px`;
    if (snapped) ph.classList.add('snapped');
    else ph.classList.remove('snapped');
    document.getElementById('time-display').innerText = `${currentTime.toFixed(2)}s`;
}

function updateKfStatus() {
    const status = document.getElementById('kf-status');
    const active = canvas.getActiveObject();
    let onKf = null;
    if (active && active.keyframes) {
        const nearest = findNearestKeyframe(currentTime, active);
        if (nearest && nearest.distPx <= SNAP_PX) onKf = nearest;
    }
    if (onKf) {
        status.textContent = `● На кадре @ ${onKf.time.toFixed(2)}s`;
        status.className = 'on-kf';
    } else if (selectedKeyframe) {
        status.textContent = `◇ Выделен: ${selectedKeyframe.time.toFixed(2)}s`;
        status.className = '';
    } else {
        status.textContent = `◌ Между кадрами`;
        status.className = '';
    }
}

function showEasingPopup(obj, endTime, segEl) {
    const popup = document.getElementById('easing-popup');
    const segment = obj.keyframes[endTime].segment || { easing: 'linear' };
    popup.style.visibility = 'hidden';
    popup.classList.add('show');
    const rect = segEl.getBoundingClientRect();
    const popRect = popup.getBoundingClientRect();
    let top = rect.top - popRect.height - 8;
    let left = rect.left + rect.width / 2 - popRect.width / 2;
    if (top < 4) top = rect.bottom + 8;
    if (left < 4) left = 4;
    if (left + popRect.width > window.innerWidth - 4) left = window.innerWidth - popRect.width - 4;
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.visibility = 'visible';

    const list = document.getElementById('easing-list');
    list.innerHTML = '';
    Object.keys(EASINGS).forEach(name => {
        const option = document.createElement('div');
        option.className = 'easing-option' + (name === segment.easing ? ' selected' : '');
        option.textContent = name;
        option.onclick = (e) => {
            e.stopPropagation();
            segment.easing = name;
            obj.keyframes[endTime].segment = segment;
            renderTracks();
            popup.classList.remove('show');
        };
        option.onmouseenter = () => updatePopupGraph(name);
        list.appendChild(option);
    });
    updatePopupGraph(segment.easing);
}

function updatePopupGraph(easingName) {
    const func = EASINGS[easingName];
    let d = 'M 0 100 ';
    for (let i = 0; i <= 100; i++) {
        d += `L ${i} ${100 - func(i/100)*100} `;
    }
    document.getElementById('popup-graph-path').setAttribute('d', d);
}

function showContextMenu(x, y, items) {
    let menuEl = document.getElementById('context-menu');
    if (!menuEl) {
        menuEl = document.createElement('div');
        menuEl.id = 'context-menu';
        menuEl.style.cssText = 'position:fixed;background:var(--bg-panel);border:1px solid var(--border);border-radius:4px;box-shadow:0 4px 15px rgba(0,0,0,0.5);z-index:1100;display:none;min-width:160px;padding:4px 0;';
        document.body.appendChild(menuEl);
    }
    menuEl.innerHTML = '';
    items.forEach(item => {
        const el = document.createElement('div');
        el.style.cssText = 'padding:6px 14px;font-size:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;';
        if (item.danger) el.style.color = '#ff6b6b';
        el.innerHTML = `<span>${item.label}</span>${item.shortcut ? `<span style="color:var(--text-dim);font-size:10px;margin-left:20px;">${item.shortcut}</span>` : ''}`;
        el.onmouseenter = () => el.style.background = 'var(--accent)';
        el.onmouseleave = () => el.style.background = '';
        el.onclick = (e) => {
            e.stopPropagation();
            menuEl.style.display = 'none';
            item.action();
        };
        menuEl.appendChild(el);
    });
    menuEl.style.left = `${x}px`;
    menuEl.style.top = `${y}px`;
    menuEl.style.display = 'block';
}

function initScrub() {
    const ruler = document.getElementById('time-ruler');
    let isScrubbing = false;

    function scrubTo(e) {
        const rect = ruler.getBoundingClientRect();
        const scrollEl = document.getElementById('timeline-scroll');
        const x = e.clientX - rect.left + scrollEl.scrollLeft;
        let t = Math.max(0, Math.min(DURATION, x / PX_PER_SEC));
        t = roundToStep(t);
        const snap = snapTime(t);
        currentTime = snap.time;
        updatePlayhead(snap.snapped);
        applyStateAtTime(currentTime);
        renderTracks();
        updateKfStatus();
        updateTimelineKfButton();
    }

    ruler.addEventListener('mousedown', (e) => {
        isScrubbing = true;
        scrubTo(e);
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isScrubbing) return;
        scrubTo(e);
    });

    document.addEventListener('mouseup', () => {
        if (isScrubbing) {
            isScrubbing = false;
            document.body.style.cursor = '';
        }
    });
}

// ================= ДИНАМИЧЕСКАЯ КНОПКА КАДРА =================
function updateTimelineKfButton() {
    const btn = document.getElementById('btn-timeline-kf');
    if (!btn) return;

    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) {
        btn.textContent = '◆ Добавить кадр';
        btn.className = 'primary';
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.onclick = null;
        return;
    }

    btn.disabled = false;
    btn.style.opacity = '1';

    const nearest = findNearestKeyframe(currentTime, obj);
    if (nearest && nearest.distPx <= SNAP_PX) {
        // Мы стоим на существующем кадре -> кнопка удаления
        btn.textContent = '🗑️ Удалить кадр';
        btn.className = 'danger';
        btn.onclick = () => {
            deleteKeyframe(obj, nearest.time);
            updateTimelineKfButton();
        };
    } else {
        // Мы между кадрами -> кнопка добавления
        btn.textContent = '◆ Добавить кадр';
        btn.className = 'primary';
        btn.onclick = () => {
            addKeyframe();
            updateTimelineKfButton();
        };
    }
}
