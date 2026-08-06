
// ================= СОХРАНЕНИЕ =================

async function saveProject() {
    try {
        const zip = new JSZip();
        const assetsFolder = zip.folder('assets');
        const objects = canvas.getObjects().filter(o => !o.isBackgroundImage);
        const projectData = {
            version: 2,
            projectName: projectName,
            duration: DURATION,
            timeStep: TIME_STEP,
            gridSize: gridSize,
            bgMode: bgMode,
            bgColor: bgColor,
            canvasWidth: canvas.getWidth(),
            canvasHeight: canvas.getHeight(),
            objects: []
        };

        if (bgMode === 'image' && bgImageDataURL) {
          const bgAssetName = `background_${Date.now()}.png`;
          const bgBlob = dataURLtoBlob(bgImageDataURL);
          assetsFolder.file(bgAssetName, bgBlob);
          projectData.bgAssetRef = 'assets/' + bgAssetName;
        } else if (bgMode === 'video' && bgVideoDataURL) {
          const mimeMatch = bgVideoDataURL.split(',')[0].match(/video\/([a-z0-9]+)/i);
          const ext = mimeMatch ? mimeMatch[1] : 'mp4';

          const bgAssetName = `background_video_${Date.now()}.${ext}`;
          const bgBlob = dataURLtoBlob(bgVideoDataURL);

          assetsFolder.file(bgAssetName, bgBlob);

          projectData.bgAssetRef = 'assets/' + bgAssetName;
          projectData.bgVideoLoop = bgVideoLoop;
        }

        for (let i = 0; i < objects.length; i++) {
            const obj = objects[i];
            if (obj.objType !== 'image') continue;

            let dataURL = obj._sourceDataURL;
            if (!dataURL) {
                dataURL = obj.toDataURL({ format: 'png', multiplier: 1 });
            }

            let fileName = obj.originalFileName || `image_${i}.png`;
            const baseName = fileName.replace(/\.[^/.]+$/, '');
            const ext = fileName.split('.').pop() || 'png';
            let assetName = `${baseName}_${obj.objId}.${ext}`;
            if (assetName.length > 80) {
                assetName = `img_${i}_${obj.objId.slice(-6)}.${ext}`;
            }

            const blob = dataURLtoBlob(dataURL);
            assetsFolder.file(assetName, blob);

            projectData.objects.push({
                objId: obj.objId,
                objName: obj.objName,
                objColor: obj.objColor,
                objType: obj.objType,
                originalFileName: obj.originalFileName,
                assetRef: 'assets/' + assetName,
                left: obj.left,
                top: obj.top,
                angle: obj.angle,
                scaleX: obj.scaleX,
                scaleY: obj.scaleY,
                opacity: obj.opacity,
                visible: obj.visible,
                keyframes: obj.keyframes || {}
            });
        }

        zip.file('project.json', JSON.stringify(projectData, null, 2));

        const content = await zip.generateAsync({ type: 'blob' });
        const safeName = projectName.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_');
        saveAs(content, `${safeName}_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.zip`);
        toast(`Проект "${projectName}" сохранён`, 'success');
    } catch (err) {
        console.error(err);
        toast('Ошибка сохранения: ' + err.message, 'error', 4000);
    }
}
