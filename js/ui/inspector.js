
// ================= ИНСПЕКТОР =================

function updateInspector() {
    const content = document.getElementById('inspector-content');
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) {
        content.innerHTML = `<div id="no-selection">${obj && obj.isBackgroundImage ? 'Выбран фоновый объект<br><br>Его свойства нельзя редактировать' : 'Объект не выбран<br><br>Добавьте изображение или выделите объект на холсте'}</div>`;
        return;
    }
    const w = (obj.width * obj.scaleX).toFixed(1);
    const h = (obj.height * obj.scaleY).toFixed(1);
    const isVisible = obj.visible !== false;

    content.innerHTML = `
        <div class="inspector-section">
            <h4>Объект</h4>
            <div class="prop-row"><label>Имя</label><input type="text" id="inp-name" value="${esc(obj.objName||'')}"></div>
            <div class="prop-row"><label>Тип</label><input type="text" value="${obj.objType||'image'}" readonly style="color:var(--text-dim)"></div>
            ${obj.originalFileName ? `<div class="prop-row"><label>Файл</label><input type="text" value="${esc(obj.originalFileName)}" readonly style="color:var(--text-dim)"></div>` : ''}
            <div class="prop-row">
                <label>Видимость</label>
                <div class="visibility-indicator ${isVisible ? 'visible' : 'hidden'}" id="btn-toggle-vis" title="Клик — переключить (H)">
                    ${isVisible ? '👁 Видим' : '🚫 Скрыт'}
                </div>
            </div>
            ${obj.parentId ? `
            <div class="prop-row">
                <label>Родитель</label>
                <input type="text" value="${esc(getParent(obj)?.objName || 'Не найден')}" readonly style="color:var(--text-dim); cursor:pointer;" onclick="setParent()" title="Клик — изменить привязку">
            </div>
            ` : ''}
        </div>
        <div class="inspector-section">
            <h4>Трансформация</h4>
            <div class="prop-row"><label>Позиция</label>
                <div class="prop-pair">
                    <div><span class="mini-label">X</span><input type="number" id="inp-x" value="${Math.round(obj.left)}" step="1"></div>
                    <div><span class="mini-label">Y</span><input type="number" id="inp-y" value="${Math.round(obj.top)}" step="1"></div>
                </div></div>
            <div class="prop-row"><label>Размер</label>
                <div class="prop-pair">
                    <div><span class="mini-label">W</span><input type="number" id="inp-w" value="${Math.round(w)}" step="1" min="1"></div>
                    <div><span class="mini-label">H</span><input type="number" id="inp-h" value="${Math.round(h)}" step="1" min="1"></div>
                </div></div>
            <div class="prop-row"><label>Поворот</label>
                <div class="prop-pair"><div><span class="mini-label">°</span><input type="number" id="inp-angle" value="${Math.round(obj.angle)}" step="1"></div></div></div>
            <div class="prop-row"><label>Масштаб</label>
                <div class="prop-pair">
                    <div><span class="mini-label">X</span><input type="number" id="inp-sx" value="${obj.scaleX.toFixed(2)}" step="0.05"></div>
                    <div><span class="mini-label">Y</span><input type="number" id="inp-sy" value="${obj.scaleY.toFixed(2)}" step="0.05"></div>
                </div></div>
        </div>
        <div class="inspector-section">
            <h4>Внешний вид</h4>
            <div class="prop-row"><label>Opacity</label><input type="number" id="inp-opacity" value="${obj.opacity.toFixed(2)}" step="0.05" min="0" max="1"></div>
        </div>
        <div class="inspector-section">
            <h4>Анимация</h4>
            <div class="prop-row"><label>Кадры</label><input type="text" value="${Object.keys(obj.keyframes||{}).length}" readonly style="color:var(--text-dim)"></div>
        </div>
        <div class="inspector-actions">
            <button id="btn-z-front" title="На передний план">⬆️ Верх</button>
            <button id="btn-z-back" title="На задний план">⬇️ Низ</button>
        </div>
        <div class="inspector-actions">
            <button id="btn-reset-pivot" title="Сбросить центр вращения в центр объекта">🎯 Центр</button>
        </div>
        <div class="inspector-actions">
            <button id="btn-duplicate">Дубликат</button>
            <button id="btn-delete" class="danger">Удалить</button>
        </div>

                `;
    bindInspectorEvents(obj);
}

function bindInspectorEvents(obj) {
    const b = (id, fn) => { const el = document.getElementById(id); if (el) el.oninput = fn; };
    b('inp-name', e => { obj.objName = e.target.value; renderTrackLabels(); });
    b('inp-x', e => { obj.set('left', parseFloat(e.target.value)||0); obj.setCoords(); canvas.renderAll(); });
    b('inp-y', e => { obj.set('top', parseFloat(e.target.value)||0); obj.setCoords(); canvas.renderAll(); });
    b('inp-w', e => { obj.set('scaleX', (parseFloat(e.target.value)||1)/obj.width); obj.setCoords(); canvas.renderAll(); const s=document.getElementById('inp-sx'); if(s) s.value=obj.scaleX.toFixed(2); });
    b('inp-h', e => { obj.set('scaleY', (parseFloat(e.target.value)||1)/obj.height); obj.setCoords(); canvas.renderAll(); const s=document.getElementById('inp-sy'); if(s) s.value=obj.scaleY.toFixed(2); });
    b('inp-angle', e => { obj.set('angle', parseFloat(e.target.value)||0); obj.setCoords(); canvas.renderAll(); });
    b('inp-sx', e => { obj.set('scaleX', parseFloat(e.target.value)||0.01); obj.setCoords(); canvas.renderAll(); const w=document.getElementById('inp-w'); if(w) w.value=Math.round(obj.width*obj.scaleX); });
    b('inp-sy', e => { obj.set('scaleY', parseFloat(e.target.value)||0.01); obj.setCoords(); canvas.renderAll(); const h=document.getElementById('inp-h'); if(h) h.value=Math.round(obj.height*obj.scaleY); });
    b('inp-opacity', e => {
        let v = parseFloat(e.target.value);
        if (isNaN(v)) v = 1;
        obj.set('opacity', Math.max(0, Math.min(1, v)));
        canvas.renderAll();
    });

    const btnVis = document.getElementById('btn-toggle-vis');
    if (btnVis) {
        btnVis.onclick = () => {
            obj.visible = !obj.visible;
            canvas.renderAll();
            updateInspector();
            renderTrackLabels();
            renderTracks();
        };
    }

    document.getElementById('btn-duplicate').onclick = duplicateActiveObject;
    document.getElementById('btn-delete').onclick = deleteActiveObject;
    document.getElementById('btn-reset-pivot').onclick = resetPivotToCenter;
    document.getElementById('btn-z-front').onclick = bringToFront;
    document.getElementById('btn-z-back').onclick = sendToBack;
    document.getElementById('btn-duplicate').onclick = () => {
        duplicateActiveObject();
        saveState(); // Сохраняем в историю после дублирования
    };
    document.getElementById('btn-delete').onclick = () => {
        deleteActiveObject();
        saveState(); // Сохраняем в историю после удаления
    };
}
