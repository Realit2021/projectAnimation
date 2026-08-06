
// ================= ИСТОРИЯ (UNDO / REDO) =================

const MAX_HISTORY = 30;
let historyStack = [];
let redoStack = [];
let isHistoryLocked = false; // Блокировка во время восстановления

// Расширяем Fabric.js, чтобы он сохранял наши кастомные свойства в JSON
fabric.Object.prototype.toObject = (function(toObject) {
    return function(propertiesToInclude) {
        return toObject.call(this, [
            'objId', 'objName', 'objColor', 'objType',
            'originalFileName', 'keyframes', 'isBackgroundImage',
            'pivotX', 'pivotY', 'parentId',
            ...(propertiesToInclude || [])
        ]);
    };
})(fabric.Object.prototype.toObject);

function saveState() {
    if (isHistoryLocked) return;

    // Очищаем redo при новом действии
    redoStack = [];

    const state = {
        canvasJson: canvas.toJSON(),
        currentTime,
        DURATION,
        TIME_STEP,
        projectName,
        bgMode,
        bgColor
    };

    historyStack.push(state);
    if (historyStack.length > MAX_HISTORY) {
        historyStack.shift();
    }
        updateUndoRedoButtons();
}

function undo() {
    if (historyStack.length <= 1) {
        toast('Нечего отменять', 'info');
        return;
    }

    isHistoryLocked = true;
    const currentState = historyStack.pop();
    redoStack.push(currentState);
    const prevState = historyStack[historyStack.length - 1];

    restoreState(prevState);
    isHistoryLocked = false;
    toast('Отменено', 'info', 1000);
        updateUndoRedoButtons();
}

function redo() {
    if (redoStack.length === 0) {
        toast('Нечего возвращать', 'info');
        return;
    }

    isHistoryLocked = true;
    const nextState = redoStack.pop();
    historyStack.push(nextState);

    restoreState(nextState);
    isHistoryLocked = false;
    toast('Возвращено', 'info', 1000);
        updateUndoRedoButtons();
}

function restoreState(state) {
    canvas.loadFromJSON(state.canvasJson, () => {
        currentTime = state.currentTime;
        DURATION = state.DURATION;
        TIME_STEP = state.TIME_STEP;
        projectName = state.projectName;
        bgMode = state.bgMode;
        bgColor = state.bgColor;

        // Обновляем UI
        document.getElementById('inp-duration').value = DURATION;
        document.getElementById('inp-step').value = TIME_STEP.toFixed(2);
        document.getElementById('project-name').textContent = projectName;

        canvas.renderAll();
        renderTimeline();
        updatePlayhead();
        updateInspector();
        updateGridOverlay();
    });
}

function initHistory() {
    // Сохраняем начальное состояние при загрузке
    saveState();

    // Триггеры для автосохранения состояния
    canvas.on('object:added', () => setTimeout(saveState, 10));
    canvas.on('object:removed', () => setTimeout(saveState, 10));
    canvas.on('object:modified', () => setTimeout(saveState, 10));
}
// ================= ОБНОВЛЕНИЕ КНОПОК UNDO/REDO =================
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');

    if (undoBtn) {
        undoBtn.disabled = historyStack.length <= 1;
    }
    if (redoBtn) {
        redoBtn.disabled = redoStack.length === 0;
    }
}
