// ================= ЦЕНТР ВРАЩЕНИЯ (PIVOT POINT) =================

(function addPivotControl() {
    const pivotControl = new fabric.Control({
        x: 0,
        y: 0,
        cursorStyle: 'move',

        actionHandler: function(eventData, transform, x, y) {
            const obj = transform.target;
            const pointer = canvas.getPointer(eventData);

            const localPoint = fabric.util.transformPoint(
                { x: pointer.x, y: pointer.y },
                fabric.util.invertTransform(obj.calcTransformMatrix())
            );

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

            const offsetX = (px - 0.5) * fabricObject.width;
            const offsetY = (py - 0.5) * fabricObject.height;

            const objCanvas = fabricObject.canvas || canvas;
            if (!objCanvas || !objCanvas.viewportTransform) {
                return fabric.util.transformPoint(
                    { x: offsetX, y: offsetY },
                    fabricObject.calcTransformMatrix()
                );
            }

            return fabric.util.transformPoint(
                { x: offsetX, y: offsetY },
                fabric.util.multiplyTransformMatrices(
                    objCanvas.viewportTransform,
                    fabricObject.calcTransformMatrix()
                )
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
    let isRotatingWithCustomPivot = false;
    let initialPivotCanvasPoint = { x: 0, y: 0 };

    canvas.on('mouse:down', (e) => {
        if (e.target && e.transform && e.transform.action === 'rotate') {
            const obj = e.target;
            const px = obj.pivotX !== undefined ? obj.pivotX : 0.5;
            const py = obj.pivotY !== undefined ? obj.pivotY : 0.5;

            // Если pivot смещен от центра, включаем компенсацию
            if (px !== 0.5 || py !== 0.5) {
                isRotatingWithCustomPivot = true;

                const centerX = obj.left + obj.width / 2;
                const centerY = obj.top + obj.height / 2;
                const localPivotX = (px - 0.5) * obj.width;
                const localPivotY = (py - 0.5) * obj.height;

                const angleRad = obj.angle * Math.PI / 180;
                const cos = Math.cos(angleRad);
                const sin = Math.sin(angleRad);
                const rotatedPivotX = localPivotX * cos - localPivotY * sin;
                const rotatedPivotY = localPivotX * sin + localPivotY * cos;

                initialPivotCanvasPoint = {
                    x: centerX + rotatedPivotX,
                    y: centerY + rotatedPivotY
                };
            }
        }
    });

    canvas.on('object:rotating', (e) => {
        if (!isRotatingWithCustomPivot) return;
        const obj = e.target;

        const px = obj.pivotX !== undefined ? obj.pivotX : 0.5;
        const py = obj.pivotY !== undefined ? obj.pivotY : 0.5;

        const centerX = obj.left + obj.width / 2;
        const centerY = obj.top + obj.height / 2;
        const localPivotX = (px - 0.5) * obj.width;
        const localPivotY = (py - 0.5) * obj.height;

        const angleRad = obj.angle * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const rotatedPivotX = localPivotX * cos - localPivotY * sin;
        const rotatedPivotY = localPivotX * sin + localPivotY * cos;

        const currentPivotX = centerX + rotatedPivotX;
        const currentPivotY = centerY + rotatedPivotY;

        const offsetX = initialPivotCanvasPoint.x - currentPivotX;
        const offsetY = initialPivotCanvasPoint.y - currentPivotY;

        obj.left += offsetX;
        obj.top += offsetY;

        obj.setCoords();
    });

    canvas.on('mouse:up', () => {
        if (isRotatingWithCustomPivot) {
            isRotatingWithCustomPivot = false;
            saveState();
        }
    });
}
