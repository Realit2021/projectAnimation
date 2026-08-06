// ================= ЗАГРУЗКА =================
async function loadProject(file) {
  try {
    toast('Загрузка проекта...', 'info');

    const zip = await JSZip.loadAsync(file);
    const projectFile = zip.file('project.json');

    if (!projectFile) {
      toast('Файл project.json не найден в архиве', 'error', 4000);
      return;
    }

    const projectData = JSON.parse(await projectFile.async('string'));

    canvas.clear();
    clearBackground();

    canvas.backgroundColor = '#ffffff';

    objectCounter = 0;
    selectedKeyframe = null;
    currentTime = 0;

    bgImageObj = null;
    bgImageDataURL = null;

    bgVideoObj = null;
    bgVideoEl = null;
    bgVideoDataURL = null;

    projectName = projectData.projectName || 'Без названия';
    document.getElementById('project-name').textContent = projectName;

    DURATION = projectData.duration || 5;
    document.getElementById('inp-duration').value = DURATION;

    TIME_STEP = projectData.timeStep || 0.05;
    document.getElementById('inp-step').value = TIME_STEP.toFixed(2);

    if (projectData.gridSize) {
      gridSize = projectData.gridSize;
      document.getElementById('inp-grid-size').value = gridSize;
    }

    if (projectData.canvasWidth && projectData.canvasHeight) {
      canvas.setWidth(projectData.canvasWidth);
      canvas.setHeight(projectData.canvasHeight);
    }

    bgMode = projectData.bgMode || 'color';
    bgColor = projectData.bgColor || '#ffffff';
    bgVideoLoop = projectData.bgVideoLoop !== undefined ? projectData.bgVideoLoop : true;

    if (bgMode === 'color') {
      canvas.backgroundColor = bgColor;
    } else if (bgMode === 'transparent') {
      canvas.backgroundColor = null;
    } else if (bgMode === 'image' && projectData.bgAssetRef) {
      const bgFile = zip.file(projectData.bgAssetRef);

      if (bgFile) {
        const bgBlob = await bgFile.async('blob');
        const bgUrl = URL.createObjectURL(bgBlob);

        await new Promise((resolve) => {
          fabric.Image.fromURL(bgUrl, (img) => {
            const scaleX = canvas.getWidth() / img.width;
            const scaleY = canvas.getHeight() / img.height;
            const scale = Math.max(scaleX, scaleY);

            img.set({
              left: 0,
              top: 0,
              scaleX: scale,
              scaleY: scale,
              selectable: false,
              evented: false,
              hasControls: false,
              hasBorders: false,
              lockMovementX: true,
              lockMovementY: true,
              lockScalingX: true,
              lockScalingY: true,
              lockRotation: true,
              isBackgroundImage: true
            });

            bgImageObj = img;

            canvas.add(img);
            canvas.sendToBack(img);

            const reader = new FileReader();
            reader.onload = () => {
              bgImageDataURL = reader.result;
              resolve();
            };
            reader.readAsDataURL(bgBlob);
          });
        });
      }
    } else if (bgMode === 'video' && projectData.bgAssetRef) {
      const bgFile = zip.file(projectData.bgAssetRef);

      if (bgFile) {
        const bgBlob = await bgFile.async('blob');
        await loadBackgroundVideoFromBlob(bgBlob);
      }
    }

    canvas.renderAll();

    for (const objData of projectData.objects) {
      if (objData.objType !== 'image') continue;

      const assetFile = zip.file(objData.assetRef);

      if (!assetFile) {
        console.warn('Asset not found:', objData.assetRef);
        continue;
      }

      const blob = await assetFile.async('blob');
      const url = URL.createObjectURL(blob);

      await new Promise((resolve) => {
        fabric.Image.fromURL(url, (img) => {
          img.set({
            left: objData.left,
            top: objData.top,
            angle: objData.angle,
            scaleX: objData.scaleX,
            scaleY: objData.scaleY,
            opacity: objData.opacity ?? 1,
            visible: objData.visible !== undefined ? objData.visible : true
          });

          img.objId = objData.objId;
          img.objName = objData.objName;
          img.objColor = objData.objColor;
          img.objType = objData.objType;
          img.originalFileName = objData.originalFileName;
          img.keyframes = objData.keyframes || {};

          const reader = new FileReader();
          reader.onload = () => {
            img._sourceDataURL = reader.result;

            canvas.add(img);
            objectCounter++;
            canvas.renderAll();

            resolve();
          };
          reader.readAsDataURL(blob);
        });
      });
    }

    canvas.renderAll();

    renderTimeline();
    updatePlayhead();
    updateInspector();

    applyStateAtTime(currentTime);
    updateGridOverlay();

    toast(`Проект "${projectName}" загружен`, 'success');
  } catch (err) {
    console.error(err);
    toast('Ошибка загрузки: ' + err.message, 'error', 4000);
  }
}
