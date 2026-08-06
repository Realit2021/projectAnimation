// ================= ЦЕНТР ВРАЩЕНИЯ (PIVOT POINT) =================

(function addPivotControl() {
    const pivotControl = new fabric.Control({
        x: 0,
        y: 0,
        cursorStyle: 'move',
        actionName: 'pivot',

        actionHandler: function(eventData, transform, x, y) {
            const obj = transform.target;
            const pointer = canvas.getPointer(eventData);

            // Получаем текущую матрицу трансформации объекта
            const matrix = obj.calcTransformMatrix();
            
            // Преобразуем точку из координат канваса в локальные координаты объекта
            const localPoint = fabric.util.transformPoint(
                { x: pointer.x, y: pointer.y },
                fabric.util.invertTransform(matrix)
            );

            // Вычисляем новые координаты pivot в нормализованной системе (0-1)
            const newPivotX = (localPoint.x / obj.width) + 0.5;
            const newPivotY = (localPoint.y / obj.height) + 0.5;

            obj.set({
                pivotX: newPivotX,
                pivotY: newPivotY
            });

            obj.setCoords();
            canvas.renderAll();
            return true;
        },

        positionHandler: function(dim, finalMatrix, fabricObject) {
            const px = fabricObject.pivotX !== undefined ? fabricObject.pivotX : 0.5;
            const py = fabricObject.pivotY !== undefined ? fabricObject.pivotY : 0.5;

            // Вычисляем смещение pivot относительно центра объекта в локальных координатах
            const offsetX = (px - 0.5) * fabricObject.width;
            const offsetY = (py - 0.5) * fabricObject.height;

            // Преобразуем локальную точку pivot в глобальные координаты канваса
            const matrix = fabricObject.calcTransformMatrix();
            return fabric.util.transformPoint(
                { x: offsetX, y: offsetY },
                matrix
            );
        },

        mouseUpHandler: function() {
            saveState();
            return true;
        },

        render: function(ctx, left, top, styleOverride, fabricObject) {
            ctx.save();
            ctx.translate(left, top);

            ctx.fillStyle = '#ff6b6b';
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
            ctx.moveTo(0, -10); ctx.lineTo(0, 10);
            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
        }
    });

    fabric.Object.prototype.controls.pivotControl = pivotControl;
})();

function resetPivotToCenter() {
    const obj = canvas.getActiveObject();
    if (!obj || obj.isBackgroundImage) return;
    obj.set({ pivotX: 0.5, pivotY: 0.5 });
    obj.setCoords();
    canvas.renderAll();
    saveState();
    toast('Центр вращения сброшен', 'success', 1000);
}

function initPivotEvents() {
    // Вращение теперь работает корректно благодаря правильной реализации positionHandler
    // и использованию встроенного механизма Fabric.js controlsUtils.rotateWithPoint
    // Дополнительная компенсация в object:rotating больше не нужна
    
    canvas.on('mouse:up', () => {
        saveState();
    });
}
