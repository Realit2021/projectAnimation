// ================= ПРИВЯЗКА ОБЪЕКТОВ (PARENTING) =================

// Устанавливаем родителя для выделенного объекта
function setParent() {
    const child = canvas.getActiveObject();
    if (!child || child.isBackgroundImage) {
        toast('Выберите дочерний объект', 'info');
        return;
    }

    const objects = canvas.getObjects().filter(o => !o.isBackgroundImage && o !== child);
    if (objects.length === 0) {
        toast('Нет объектов для привязки', 'info');
        return;
    }

    const menuItems = objects.map(obj => ({
        label: obj.objName || 'Без имени',
        action: () => {
            child.parentId = obj.objId;
            // Вычисляем и сохраняем локальные координаты дочернего относительно родителя
            computeLocalTransform(child, obj);
            canvas.renderAll();
            updateInspector();
            saveState();
            toast(`Привязано к "${obj.objName}"`, 'success', 1500);
        }
    }));

    menuItems.push({
        label: '❌ Отвязать',
        action: () => {
            child.parentId = null;
            delete child._localX;
            delete child._localY;
            delete child._localAngle;
            delete child._localScaleX;
            delete child._localScaleY;
            canvas.renderAll();
            updateInspector();
            saveState();
            toast('Привязка удалена', 'success', 1500);
        }
    });

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    showContextMenu(centerX, centerY, menuItems);
}

// Вычисление локальных координат дочернего относительно родителя
function computeLocalTransform(child, parent) {
    // Получаем глобальную позицию дочернего
    const globalPoint = { x: child.left, y: child.top };

    // Преобразуем в локальные координаты родителя через обратную матрицу
    const parentMatrix = parent.calcTransformMatrix();
    const inverseMatrix = fabric.util.invertTransform(parentMatrix);
    const localPoint = fabric.util.transformPoint(globalPoint, inverseMatrix);

    child._localX = localPoint.x;
    child._localY = localPoint.y;
    child._localAngle = child.angle - parent.angle;
    child._localScaleX = child.scaleX / parent.scaleX;
    child._localScaleY = child.scaleY / parent.scaleY;
}

// Получение родителя объекта
function getParent(obj) {
    if (!obj.parentId) return null;
    return canvas.getObjects().find(o => o.objId === obj.parentId);
}

// Получение всех дочерних объектов
function getChildren(obj) {
    return canvas.getObjects().filter(o => o.parentId === obj.objId);
}

// Применение трансформации родителя к дочерним объектам (ПРАВИЛЬНАЯ МАТЕМАТИКА)
function applyParentTransforms() {
    canvas.getObjects().forEach(obj => {
        if (obj.isBackgroundImage || !obj.parentId) return;

        const parent = getParent(obj);
        if (!parent) return;

        // Если локальные координаты не инициализированы — вычисляем их
        if (obj._localX === undefined || obj._localY === undefined) {
            computeLocalTransform(obj, parent);
        }

        // Получаем матрицу трансформации родителя
        const parentMatrix = parent.calcTransformMatrix();

        // Преобразуем локальную позицию дочернего в глобальную через матрицу родителя
        const localPoint = { x: obj._localX, y: obj._localY };
        const globalPoint = fabric.util.transformPoint(localPoint, parentMatrix);

        // Применяем трансформацию
        obj.set({
            left: globalPoint.x,
            top: globalPoint.y,
            angle: parent.angle + obj._localAngle,
            scaleX: parent.scaleX * obj._localScaleX,
            scaleY: parent.scaleY * obj._localScaleY
        });
        obj.setCoords();
    });
}

// Перехватываем applyStateAtTime для применения привязок при анимации
const _originalApplyStateAtTime = applyStateAtTime;
applyStateAtTime = function(time) {
    _originalApplyStateAtTime(time);
    applyParentTransforms();
    canvas.renderAll();
};

// Инициализация событий привязки
function initParentingEvents() {
    // При перемещении родителя — пересчитываем локальные координаты дочерних
    canvas.on('object:moving', (e) => {
        const parent = e.target;
        if (parent.isBackgroundImage) return;

        const children = getChildren(parent);
        children.forEach(child => {
            // Пересчитываем локальные координаты при каждом движении
            computeLocalTransform(child, parent);
        });
    });

    // При масштабировании родителя
    canvas.on('object:scaling', (e) => {
        const parent = e.target;
        if (parent.isBackgroundImage) return;

        const children = getChildren(parent);
        children.forEach(child => {
            computeLocalTransform(child, parent);
        });
    });

    // При вращении родителя
    canvas.on('object:rotating', (e) => {
        const parent = e.target;
        if (parent.isBackgroundImage) return;

        const children = getChildren(parent);
        children.forEach(child => {
            computeLocalTransform(child, parent);
        });
    });

    // При завершении трансформации — сохраняем состояние
    canvas.on('object:modified', (e) => {
        const parent = e.target;
        if (parent.isBackgroundImage) return;

        const children = getChildren(parent);
        children.forEach(child => {
            computeLocalTransform(child, parent);
        });
        saveState();
    });
}
