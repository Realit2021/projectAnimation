// ================= МЕНЮ =================

function initMenu() {
    const menuItems = document.querySelectorAll('.menu-item');
    let activeMenu = null;

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.classList.contains('open')) {
                item.classList.remove('open');
                activeMenu = null;
            } else {
                menuItems.forEach(m => m.classList.remove('open'));
                item.classList.add('open');
                activeMenu = item;
            }
        });

        item.addEventListener('mouseenter', () => {
            if (activeMenu && activeMenu !== item) {
                menuItems.forEach(m => m.classList.remove('open'));
                item.classList.add('open');
                activeMenu = item;
            }
        });
    });

    document.addEventListener('click', () => {
        menuItems.forEach(m => m.classList.remove('open'));
        activeMenu = null;
    });

    document.querySelectorAll('.menu-entry').forEach(entry => {
        entry.addEventListener('click', (e) => {
            if (entry.classList.contains('disabled')) return;
            e.stopPropagation();
            const action = entry.dataset.action;
            menuItems.forEach(m => m.classList.remove('open'));
            activeMenu = null;
            handleMenuAction(action);
        });
    });
}

function handleMenuAction(action) {
    switch (action) {
        case 'undo':
          undo();
            break;
      case 'redo':
          redo();
          break;
      case 'set-parent':
setParent();
break;
      case 'toggle-parenting-links':
          toggleParentingLinks();
          break;
        case 'new-project': openNewProjectDialog(); break;
        case 'open-project': document.getElementById('load-input').click(); break;
        case 'save-project': saveProject(); break;
        case 'add-image': document.getElementById('file-input').click(); break;
        case 'export': openExportModal(); break;
        case 'duplicate': duplicateActiveObject(); break;
        case 'delete-object': deleteActiveObject(); break;
        case 'delete-keyframe':
            if (selectedKeyframe) {
                const { obj, time } = selectedKeyframe;
                if (confirm(`Удалить ключевой кадр @ ${time.toFixed(2)}s?`)) {
                    deleteKeyframe(obj, time);
                }
            } else {
                toast('Сначала выделите ключевой кадр', 'info');
            }
            break;
        case 'toggle-grid': document.getElementById('btn-grid').click(); break;
        case 'toggle-snap': document.getElementById('btn-snap').click(); break;
        case 'project-settings': openProjectSettings(); break;
        case 'add-keyframe': addKeyframe(); break;
        case 'toggle-visibility': toggleActiveVisibility(); break;
        case 'play-pause': togglePlay(); break;
        case 'go-start': goToStart(); break;
        case 'go-end': goToEnd(); break;
        case 'show-shortcuts': openModal('modal-shortcuts'); break;
        case 'about': openModal('modal-about'); break;
    }
}
