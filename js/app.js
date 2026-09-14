// ==================== 全局状态 ====================
let currentPage = 'home';
let viewModeActress = 'list';
let actressSortMode = 'time-desc'; // 'works-desc' | 'time-desc' | 'name-desc'
let detailReturnPage = 'page-home';
// 所有页面的滚动位置记忆（key: pageId, value: scrollY）
let _pageScrollPos = {};
let currentActressId = null;
let detailActressId = null;
let currentVideoId = null;
let currentRandomType = 'actress';
let isRandomRolling = false;
let actressWorksCountMap = {};
// 女优 id -> 全部名称变体（原名/别名/替换名）缓存，随 updateActressWorksCount() 一起重建，
// 避免搜索、详情页、打卡提示等热路径反复遍历全部名称映射。
let actressAllNamesMap = {};
let checkinCurrentDate = '';
let checkinViewYear = 0;
let checkinViewMonth = 0;
// 已勾选待提交的打卡条目（临时缓存，确认后才写入）：{ type:'actress'|'work', id, name(显示名), code(番号), actress(关联演员) }
let checkinPendingEntries = [];
// 页面导航历史栈
let pageHistory = [];

// 批量选择状态
let batchModeActress = false;
let batchModeWork = false;
let selectedActresses = new Set();
let selectedWorks = new Set();
// 作品筛选状态
// ==================== DOM 元素 ====================
const els = {
  appTitle: document.getElementById('appTitle'),
  backBtn: document.getElementById('backBtn'),
  settingsIconWrap: document.getElementById('settingsIconWrap'),
  pages: document.querySelectorAll('.page'),
  navItems: document.querySelectorAll('.nav-item'),
  // 首页
  homeStatActress: document.getElementById('homeStatActress'),
  homeStatVideo: document.getElementById('homeStatVideo'),
  // 女优页
  searchInputActress: document.getElementById('searchInputActress'),
  searchCountActress: document.getElementById('searchCountActress'),
  searchClearActress: document.getElementById('searchClearActress'),
  statusTextActress: document.getElementById('statusTextActress'),
  refreshBtnActress: document.getElementById('refreshBtnActress'),
  actressGrid: document.getElementById('actressGrid'),
  viewToggleActress: document.getElementById('viewToggleActress'),
  sortSelectActress: document.getElementById('sortSelectActress'),
  batchActressBtn: document.getElementById('batchActressBtn'),
  importActressBtn: document.getElementById('importActressBtn'),
  batchInfoActress: document.getElementById('batchInfoActress'),
  batchBarActress: document.getElementById('batchBarActress'),
  batchSelectAllActress: document.getElementById('batchSelectAllActress'),
  batchDeleteActress: document.getElementById('batchDeleteActress'),
  batchCancelActress: document.getElementById('batchCancelActress'),
  // 作品页
  searchInputWork: document.getElementById('searchInputWork'),
  searchCountWork: document.getElementById('searchCountWork'),
  searchClearWork: document.getElementById('searchClearWork'),
  statusTextWork: document.getElementById('statusTextWork'),
  refreshBtnWork: document.getElementById('refreshBtnWork'),
  worksGrid: document.getElementById('worksGrid'),
  batchWorkBtn: document.getElementById('batchWorkBtn'),
  importWorkBtn: document.getElementById('importWorkBtn'),
  exportWorkBtn: document.getElementById('exportWorkBtn'),
  batchInfoWork: document.getElementById('batchInfoWork'),
  batchBarWork: document.getElementById('batchBarWork'),
  batchSelectAllWork: document.getElementById('batchSelectAllWork'),
  batchDeleteWork: document.getElementById('batchDeleteWork'),
  batchCancelWork: document.getElementById('batchCancelWork'),
  // 详情页
  detailAvatar: document.getElementById('detailAvatar'),
  detailName: document.getElementById('detailName'),
  detailMeta: document.getElementById('detailMeta'),
  detailFavBtn: document.getElementById('detailFavBtn'),
  detailCopyBtn: document.getElementById('detailCopyBtn'),
  detailCheckinCount: document.getElementById('detailCheckinCount'),
  worksList: document.getElementById('worksList'),
  // 弹窗
  videoModal: document.getElementById('video-modal'),
  actressModal: document.getElementById('actress-modal'),
  detailModal: document.getElementById('detail-modal'),
  randomModal: document.getElementById('random-modal'),
  videoForm: document.getElementById('video-form'),
  btnApiFetch: document.getElementById('btn-api-fetch'),
  actressForm: document.getElementById('actress-form'),
  detailTitle: document.getElementById('detail-title'),
  detailBody: document.getElementById('detail-body'),
  randomResult: document.getElementById('random-result'),
  btnDoRandom: document.getElementById('btn-do-random'),
  btnShowHistory: document.getElementById('btn-show-history'),
  btnClearHistory: document.getElementById('btn-clear-history'),
  btnBackToPick: document.getElementById('btn-back-to-pick'),
  randomPickView: document.getElementById('random-pick-view'),
  randomHistoryView: document.getElementById('random-history-view'),
  randomHistoryList: document.getElementById('random-history-list'),
  statsPageContent: document.getElementById('statsPageContent'),
  searchInputCheckin: document.getElementById('searchInputCheckin'),
  searchClearCheckin: document.getElementById('searchClearCheckin'),
  searchCountCheckin: document.getElementById('searchCountCheckin'),
  statsSearchResults: document.getElementById('statsSearchResults'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmDialogTitle: document.getElementById('confirmDialogTitle'),
  confirmDialogText: document.getElementById('confirmDialogText'),
  confirmDialogCancel: document.getElementById('confirmDialogCancel'),
  confirmDialogOk: document.getElementById('confirmDialogOk'),
  settingsImportFile: document.getElementById('settingsImportFile'),
  webdavUrl: document.getElementById('webdavUrl'),
  webdavUser: document.getElementById('webdavUser'),
  webdavPass: document.getElementById('webdavPass'),
  webdavSaveBtn: document.getElementById('webdavSaveBtn'),
  webdavTestBtn: document.getElementById('webdavTestBtn'),
  webdavUploadBtn: document.getElementById('webdavUploadBtn'),
  webdavRestoreBtn: document.getElementById('webdavRestoreBtn'),
  webdavHint: document.getElementById('webdavHint'),
  // 打卡
  checkinModal: document.getElementById('checkin-modal'),
  checkinModalTitle: document.getElementById('checkin-modal-title'),
  checkinSearchInput: document.getElementById('checkin-search-input'),
  checkinSuggestList: document.getElementById('checkin-suggest-list'),
  checkinNoMatch: document.getElementById('checkin-no-match'),
  checkinLinkedHint: document.getElementById('checkin-linked-hint'),
  videoActressesInput: document.getElementById('video-actresses'),
  videoActressSuggestList: document.getElementById('videoActressSuggestList'),
  checkinPendingGroup: document.getElementById('checkin-pending-group'),
  checkinPendingList: document.getElementById('checkin-pending-list'),
  checkinClearBtn: document.getElementById('checkin-clear-btn'),
  checkinNote: document.getElementById('checkin-note'),
  btnDoCheckin: document.getElementById('btn-do-checkin'),
  checkinExistingList: document.getElementById('checkin-existing-list'),
  checkinCalendarGrid: document.getElementById('checkinCalendarGrid'),
  checkinYearBtn: document.getElementById('checkinYearBtn'),
  checkinMonthBtn: document.getElementById('checkinMonthBtn'),
  checkinYearList: document.getElementById('checkinYearList'),
  checkinMonthList: document.getElementById('checkinMonthList'),
  checkinTotal: document.getElementById('checkinTotal'),
  checkinMonthCount: document.getElementById('checkinMonthCount'),
  // 名称替换
  nameMappingModal: document.getElementById('name-mapping-modal'),
  mappingOriginal: document.getElementById('mappingOriginal'),
  mappingReplacement: document.getElementById('mappingReplacement'),
  btnAddMapping: document.getElementById('btnAddMapping'),
  nameMappingList: document.getElementById('nameMappingList'),
  syncMappingCount: document.getElementById('syncMappingCount'),
  // 女优显示名替换
  actressDisplayName: document.getElementById('actress-display-name')
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  initBackButton();
  observeNewImages();
  init();
});

// 新插入的 DOM 里可能带 IndexedDB 图片占位（data-img-ref），统一做视口懒加载水合。
// 批量渲染会高频插入节点，这里把多次变更合并到一次 rAF，避免重复扫描子树。
function observeNewImages() {
  if (!window.MutationObserver) return;
  const pendingRoots = new Set();
  let scheduled = false;

  const flush = () => {
    scheduled = false;
    const roots = [...pendingRoots];
    pendingRoots.clear();
    roots.forEach(node => {
      if (node.isConnected) hydrateImages(node);
    });
  };

  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1 || !node.isConnected) return;
      // 已入队节点的子孙无需重复入队
      for (const root of pendingRoots) {
        if (root === node || root.contains(node)) return;
      }
      pendingRoots.add(node);
    }));
    if (pendingRoots.size && !scheduled) {
      scheduled = true;
      requestAnimationFrame(flush);
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function init() {
  // 本地数据为同步读取，无需加载遮罩与人为延迟，直接渲染首屏
  updateActressWorksCount();
  showPage('page-home', false);
  updateHomeStats();
  // 空闲时后台预热女优/作品列表：首次底栏切换时无需现场渲染
  prefetchListPages();
  // 后台迁移旧版 base64 图片到 IndexedDB（不阻塞界面）
  if (window.indexedDB) {
    DB.migrateLegacyImages().then(n => {
      if (n > 0) {
        updateActressWorksCount();
        refreshCurrentPage();
        updateHomeStats();
      }
    }).catch(() => {});
  }
}

// 空闲预热：在后台预渲染女优/作品列表（页面此时 display:none，不参与布局/绘制）
// 首次切换底栏时列表指纹一致 → 直接复用，切换零等待
function prefetchListPages() {
  const run = () => {
    try {
      if (actressFingerprint() !== _actressRenderFingerprint) renderActresses();
      if (workFingerprint() !== _workRenderFingerprint) renderWorks();
    } catch (err) {
      console.warn('列表预热失败', err);
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 600);
  }
}

// ==================== 返回手势/按键处理（统一分层规则） ====================
// 层级：弹窗/浮层 → 仅关闭弹窗；二级子页面 → 逐层返回；仅首页拦截返回并弹退出确认
function initBackButton() {
  // Capacitor Android 硬件返回键（await 确保监听注册成功，拦截系统默认退出）
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    const handle = window.Capacitor.Plugins.App.addListener('backButton', () => {
      handleBackAction();
    });
    if (handle && typeof handle.then === 'function') handle.catch(() => {});
  }

  // 浏览器 popstate（Web 端返回手势）
  window.history.pushState({ page: 'home' }, '');
  window.addEventListener('popstate', (e) => {
    handleBackAction();
    window.history.pushState({ page: currentPage }, '');
  });
}

let _lastBackActionAt = 0;

// 统一返回处理：防抖合并 backButton + popstate 双触发，避免弹窗刚打开又被关闭
function handleBackAction() {
  const now = Date.now();
  if (now - _lastBackActionAt < 300) return;
  _lastBackActionAt = now;

  // 1. 封面预览浮层：仅关闭预览
  if (document.querySelector('.cover-preview-overlay')) {
    closeCoverPreview();
    return;
  }
  // 2. 弹窗/浮层：仅关闭当前弹窗（优先确认弹窗——只关自身等同取消，保留底层弹窗）
  if (els.confirmModal && els.confirmModal.classList.contains('show')) {
    closeConfirmDialogOnly();
    return;
  }
  const openModal = document.querySelector('.modal.show');
  if (openModal) {
    closeAllModals();
    return;
  }
  // 3. 有历史栈：逐层返回上一级
  if (pageHistory.length > 0) {
    goBack();
    return;
  }
  // 4. 首页（一级根页面）返回：直接退出应用，不再弹确认弹窗
  if (currentPage === 'home') {
    confirmExitApp();
    return;
  }
  // 5. 其余页面（女优/作品列表、二级子页面，历史栈空）：回退到首页
  showPage('page-home', false);
  updateHomeStats();
}

// ==================== 事件绑定 ====================
function bindEvents() {
  // 底部导航 — 使用 touchend 实现零延迟响应（移动端），click 作为桌面端回退
  function handleNavClick(page) {
    pageHistory = [];
    if (page === 'home') {
      showPage('page-home', false);
      updateHomeStats();
    } else if (page === 'actresses') {
      loadActressList(true);
    } else if (page === 'works') {
      loadWorkList(true);
    }
  }

  els.navItems.forEach(btn => {
    let touchHandled = false;
    let startX = 0, startY = 0, startAt = 0;

    // 点击判定：位移半径放宽到 25px（拇指快速点按常有 10~25px 轻微滑动，
    // 浏览器自身 tap 阈值约 8~10px，过严会形成"点了没反应"的死区）
    const isNavTap = (x, y) => {
      if (Date.now() - startAt > 1000) return false; // 长按后抬起不当作点击
      const dx = x - startX, dy = y - startY;
      return dx * dx + dy * dy <= 25 * 25;
    };

    // 移动端：touchend 立即触发，零延迟
    btn.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      touchHandled = false; // 新触摸开始，清除上次残留的去重标志
      startX = t.clientX;
      startY = t.clientY;
      startAt = Date.now();
    }, { passive: true });

    btn.addEventListener('touchend', (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      if (!isNavTap(t.clientX, t.clientY)) return;
      touchHandled = true;
      handleNavClick(btn.dataset.page);
    }, { passive: true });

    // 滚动接管/来电等系统中断：重置状态等待下次触摸
    btn.addEventListener('touchcancel', () => {
      touchHandled = false;
    }, { passive: true });

    // 桌面端：click 事件；移动端 touchend 已处理过时去重
    btn.addEventListener('click', () => {
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      handleNavClick(btn.dataset.page);
    });
  });

  // 返回按钮
  els.backBtn.addEventListener('click', goBack);

  // 右上角设置图标（再次点击退出设置页）
  els.settingsIconWrap.addEventListener('click', () => {
    if (currentPage === 'settings') {
      goBack();
    } else {
      showPage('page-settings');
    }
  });

  // 首页快捷功能
  document.getElementById('homeRandomBtn').addEventListener('click', openRandomModal);
  document.getElementById('homeCheckinBtn').addEventListener('click', () => {
    showPage('page-checkin');
    initCheckinPage();
  });
  document.getElementById('homeStatsBtn').addEventListener('click', () => openStatsPage());
  document.getElementById('homeSitesBtn').addEventListener('click', openSitesModal);
  document.getElementById('checkinStatsBtn').addEventListener('click', openStatsPage);

  // 首页统计卡片点击跳转
  els.homeStatActress.addEventListener('click', () => {
    pageHistory = [];
    loadActressList(true);
  });
  els.homeStatVideo.addEventListener('click', () => {
    pageHistory = [];
    loadWorkList(true);
  });

  // 女优页搜索
  els.searchInputActress.addEventListener('input', () => {
    const hasValue = els.searchInputActress.value.length > 0;
    els.searchClearActress.classList.toggle('show', hasValue);
    renderActresses();
  });
  els.searchClearActress.addEventListener('click', () => {
    els.searchInputActress.value = '';
    els.searchClearActress.classList.remove('show');
    renderActresses();
  });

  // 作品页搜索
  els.searchInputWork.addEventListener('input', () => {
    const hasValue = els.searchInputWork.value.length > 0;
    els.searchClearWork.classList.toggle('show', hasValue);
    renderWorks();
  });
  els.searchClearWork.addEventListener('click', () => {
    els.searchInputWork.value = '';
    els.searchClearWork.classList.remove('show');
    renderWorks();
  });

  // 打卡记录搜索（统计页）
  els.searchInputCheckin.addEventListener('input', () => renderCheckinSearch());
  els.searchClearCheckin.addEventListener('click', () => {
    els.searchInputCheckin.value = '';
    renderCheckinSearch();
  });

  // 视图切换（女优页）
  els.viewToggleActress.addEventListener('click', toggleActressViewMode);

  // 排序切换（女优页）
  els.sortSelectActress.addEventListener('change', () => {
    actressSortMode = els.sortSelectActress.value;
    renderActresses();
  });

  // 刷新
  els.refreshBtnActress.addEventListener('click', () => refreshData('actress'));
  els.refreshBtnWork.addEventListener('click', () => refreshData('work'));

  // 详情页收藏
  els.detailFavBtn.addEventListener('click', editCurrentActress);

  // 详情页复制名字
  els.detailCopyBtn.addEventListener('click', () => {
    if (!detailActressId) return;
    const actress = DB.getActress(detailActressId);
    if (!actress) return;
    copyActressName(DB.applyNameMapping(actress.name));
  });

  // 详情页添加作品（预填当前女优名）
  document.getElementById('detailAddWorkBtn').addEventListener('click', () => {
    if (!detailActressId) return;
    const actress = DB.getActress(detailActressId);
    if (!actress) return;
    openVideoModal();
    document.getElementById('video-actresses').value = DB.applyNameMapping(actress.name);
  });

  // 女优批量操作
  els.batchActressBtn.addEventListener('click', () => toggleBatchMode('actress'));
  els.batchSelectAllActress.addEventListener('click', () => selectAllBatch('actress'));
  els.batchDeleteActress.addEventListener('click', () => deleteBatch('actress'));
  els.batchCancelActress.addEventListener('click', () => exitBatchMode('actress'));
  els.importActressBtn.addEventListener('click', () => openActressModal());

  // 作品批量操作
  els.batchWorkBtn.addEventListener('click', () => toggleBatchMode('work'));
  els.batchSelectAllWork.addEventListener('click', () => selectAllBatch('work'));
  els.batchDeleteWork.addEventListener('click', () => deleteBatch('work'));
  els.batchCancelWork.addEventListener('click', () => exitBatchMode('work'));
  els.importWorkBtn.addEventListener('click', () => openVideoModal());
  els.exportWorkBtn.addEventListener('click', exportWorksTxt);
  // 设置页按钮
  document.getElementById('settingsRandomBtn').addEventListener('click', openRandomModal);
  document.getElementById('settingsStatsBtn').addEventListener('click', () => openStatsPage());
  document.getElementById('settingsExportBtn').addEventListener('click', exportData);
  document.getElementById('settingsImportBtn').addEventListener('click', () => els.settingsImportFile.click());

  // 设置页二级菜单点击
  document.querySelectorAll('.settings-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.settingsMenu;
      const map = { random: 'page-settings-random', stats: 'page-settings-stats', name: 'page-settings-name', backup: 'page-settings-backup' };
      if (map[name]) showPage(map[name]);
    });
  });

  // WebDAV 备份
  els.webdavSaveBtn.addEventListener('click', saveWebdavConfig);
  els.webdavTestBtn.addEventListener('click', testWebdavConnection);
  els.webdavUploadBtn.addEventListener('click', uploadBackupToWebdav);
  els.webdavRestoreBtn.addEventListener('click', restoreFromWebdav);
  els.settingsImportFile.addEventListener('change', importData);

  // 名称替换
  document.getElementById('settingsNameMappingBtn').addEventListener('click', openNameMappingModal);
  document.getElementById('settingsApplyMappingBtn').addEventListener('click', applyMappingsToExistingData);
  document.getElementById('settingsMergeActressBtn').addEventListener('click', mergeActressesByReplacementNameHandler);
  els.btnAddMapping.addEventListener('click', addNameMappingFromForm);
  els.mappingOriginal.addEventListener('keydown', e => { if (e.key === 'Enter') els.mappingReplacement.focus(); });
  els.mappingReplacement.addEventListener('keydown', e => { if (e.key === 'Enter') addNameMappingFromForm(); });

  // 表单提交
  els.videoForm.addEventListener('submit', handleVideoSubmit);
  els.actressForm.addEventListener('submit', handleActressSubmit);

  // 番号输入框自动补全「-」
  const videoCodeInput = document.getElementById('video-code');
  if (videoCodeInput) {
    videoCodeInput.addEventListener('blur', () => {
      const normalized = normalizeVideoCode(videoCodeInput.value);
      if (normalized !== videoCodeInput.value) {
        videoCodeInput.value = normalized;
      }
    });
  }

  // 图片预览
  document.getElementById('video-cover').addEventListener('change', e => previewImage(e, 'video-cover-preview'));
  document.getElementById('actress-avatar').addEventListener('change', e => previewImage(e, 'actress-avatar-preview'));

  // 删除按钮
  document.getElementById('btn-delete-video').addEventListener('click', deleteCurrentVideo);
  document.getElementById('btn-delete-actress').addEventListener('click', deleteCurrentActress);

  // 封面长按预览
  initWorkCoverLongPress();

  // 随机抽取（抽取进行中锁定分类，禁止切换）
  document.querySelectorAll('.random-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRandomRolling) return;
      document.querySelectorAll('.random-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentRandomType = btn.dataset.random;
      resetRandomResult();
    });
  });
  els.btnDoRandom.addEventListener('click', doRandom);
  els.btnShowHistory.addEventListener('click', showRandomHistory);
  els.btnClearHistory.addEventListener('click', clearRandomHistory);
  els.btnBackToPick.addEventListener('click', backToRandomPick);

  // API 获取（作品编辑表单）
  els.btnApiFetch.addEventListener('click', fetchAndFillVideoForm);

  // 打卡
  document.getElementById('checkinPrevMonth').addEventListener('click', () => {
    checkinViewMonth--;
    if (checkinViewMonth < 0) { checkinViewMonth = 11; checkinViewYear--; }
    renderCheckinCalendar();
  });
  document.getElementById('checkinNextMonth').addEventListener('click', () => {
    checkinViewMonth++;
    if (checkinViewMonth > 11) { checkinViewMonth = 0; checkinViewYear++; }
    renderCheckinCalendar();
  });
  els.checkinYearBtn.addEventListener('click', toggleYearPicker);
  els.checkinMonthBtn.addEventListener('click', toggleMonthPicker);
  els.checkinSearchInput.addEventListener('input', () => renderCheckinSuggestions());
  els.checkinSearchInput.addEventListener('focus', () => renderCheckinSuggestions());
  setupVideoActressAutocomplete();
  els.checkinClearBtn.addEventListener('click', clearCheckinPending);
  els.btnDoCheckin.addEventListener('click', doCheckin);

  // 全局统一确认弹窗（替换原生 confirm；关闭时仅关闭自身，保留底层弹窗）
  els.confirmDialogOk.addEventListener('click', () => {
    const r = _confirmResolver;
    _confirmResolver = null;
    closeConfirmDialogOnly();
    if (r) r(true);
  });
  els.confirmDialogCancel.addEventListener('click', () => {
    const r = _confirmResolver;
    _confirmResolver = null;
    closeConfirmDialogOnly();
    if (r) r(false);
  });

  // 关闭弹窗
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  // 点击弹窗背景关闭（确认弹窗只关自身，保留底层弹窗）
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
      if (e.target !== modal) return;
      if (modal === els.confirmModal) {
        closeConfirmDialogOnly();
      } else {
        closeAllModals();
      }
    });
  });
}

// 只关闭确认弹窗，保留底层弹窗（删除确认后停留在原页面）
function closeConfirmDialogOnly() {
  els.confirmModal.classList.remove('show');
  if (!document.querySelector('.modal.show')) {
    document.body.style.overflow = '';
  }
  resolveConfirmDialog();
}

// ==================== 页面切换 ====================
function showPage(pageId, pushHistory = true) {
  // 保存离开页面的滚动位置
  if (currentPage && currentPage !== 'home') {
    _pageScrollPos['page-' + currentPage] = window.scrollY;
  }

  // 记录历史
  if (pushHistory && currentPage !== pageId.replace('page-', '')) {
    pageHistory.push('page-' + currentPage);
  }

  els.pages.forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');

  currentPage = pageId.replace('page-', '');

  // 更新底部导航
  updateNavActive(currentPage);

  // 右上角设置图标在所有页面显示
  els.settingsIconWrap.style.display = 'flex';

  // 更新顶部导航标题
  if (pageId === 'page-home') {
    updateHeader('AV Manager', false);
  } else if (pageId === 'page-actresses') {
    updateHeader('女优', false);
  } else if (pageId === 'page-works') {
    updateHeader('作品', false);
  } else if (pageId === 'page-detail') {
    updateHeader('女优详情', true);
  } else if (pageId === 'page-checkin') {
    updateHeader('打卡', true);
  } else if (pageId === 'page-stats') {
    updateHeader('打卡统计', true);
    renderStatsPage();
  } else if (pageId === 'page-settings') {
    updateHeader('设置', false);
  } else if (pageId === 'page-settings-random') {
    updateHeader('随机抽取', true);
  } else if (pageId === 'page-settings-stats') {
    updateHeader('统计分析', true);
  } else if (pageId === 'page-settings-name') {
    updateHeader('名称替换', true);
    if (els.syncMappingCount) {
      els.syncMappingCount.textContent = `当前 ${DB.getNameMappings().length} 条替换规则`;
    }
  } else if (pageId === 'page-settings-backup') {
    updateHeader('数据备份', true);
    loadWebdavConfigIntoForm();
  }

  // 恢复目标页面的滚动位置（延迟到DOM渲染后）
  const savedPos = _pageScrollPos[pageId] || 0;
  requestAnimationFrame(() => {
    window.scrollTo(0, savedPos);
  });
}

function updateNavActive(pageName) {
  els.navItems.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });
}

function updateHeader(title, showBack) {
  els.appTitle.textContent = title;
  if (showBack) els.backBtn.classList.add('show');
  else els.backBtn.classList.remove('show');
}

function goBack() {
  // 如果有弹窗打开，先关闭弹窗
  if (document.querySelector('.cover-preview-overlay')) {
    closeCoverPreview();
    return;
  }
  const openModal = document.querySelector('.modal.show');
  if (openModal) {
    closeAllModals();
    return;
  }

  // 从历史栈返回（保留搜索状态）
  if (pageHistory.length > 0) {
    const prevPage = pageHistory.pop();
    if (prevPage === 'page-home') {
      showPage('page-home', false);
      updateHomeStats();
    } else if (prevPage === 'page-actresses') {
      loadActressList(false);
    } else if (prevPage === 'page-works') {
      loadWorkList(false);
    } else {
      showPage(prevPage, false);
    }
    return;
  }

  // 从详情页返回时恢复列表（保留搜索状态）
  if (currentPage === 'detail') {
    if (detailReturnPage === 'page-actresses') {
      loadActressList(false);
    } else {
      loadWorkList(false);
    }
    return;
  }

  // 历史栈空时，非首页页面返回首页（女优/作品列表、二级子页面）
  if (currentPage === 'home') {
    // 首页：直接退出应用，不再弹确认弹窗
    confirmExitApp();
    return;
  }
  showPage('page-home', false);
  updateHomeStats();
}

// 直接退出：原生 App 直接退出；浏览器环境尝试关闭窗口
function confirmExitApp() {
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.exitApp();
  } else {
    try { window.close(); } catch (e) { /* 浏览器可能禁止关闭 */ }
  }
}

function imageAttr(value) {
  if (!value) return '';
  if (typeof ImageStore !== 'undefined' && ImageStore.isRef(value)) {
    return `data-img-ref="${escapeHtml(value)}"`;
  }
  return `src="${escapeHtml(value)}"`;
}

async function hydrateImages(root = document) {
  if (!root) return;
  const imgs = [];
  // 自身可能就是目标图片（innerHTML 直接追加 img 时 addedNodes 是 img 本身）
  if (root.matches && root.matches('img[data-img-ref]')) imgs.push(root);
  if (root.querySelectorAll) {
    root.querySelectorAll('img[data-img-ref]').forEach(img => imgs.push(img));
  }
  if (!imgs.length) return;
  const observer = getLazyImgObserver();
  if (observer) {
    // 懒加载：仅当图片接近视口时才从 IndexedDB 读取并解码，避免大数据量列表一次性全量加载卡顿
    imgs.forEach(img => observer.observe(img));
  } else {
    // 老环境无 IntersectionObserver：立即加载
    imgs.forEach(img => loadImgRef(img));
  }
}

// 共享的懒加载观察器：统一为列表中的 IndexedDB 图片做视口懒加载
let _lazyImgObserver = null;
function getLazyImgObserver() {
  if (_lazyImgObserver) return _lazyImgObserver;
  if (typeof IntersectionObserver !== 'function') return null;
  _lazyImgObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        _lazyImgObserver.unobserve(img);
        loadImgRef(img);
      }
    });
  }, { rootMargin: '240px 0px' });
  return _lazyImgObserver;
}

// 加载单个 IndexedDB 图片引用
async function loadImgRef(img) {
  const ref = img.dataset.imgRef;
  if (!ref || img.src) return;
  try {
    const src = await DB.getImageSrc(ref);
    // 兼容 href(旧 Promise/getAttribute) 之外的 getImageSrc；若仍无 src 则跳过
    if (src && !img.src) img.src = src;
  } catch (e) {
    // 单个图片加载失败不影响整体
  }
  img.removeAttribute('data-img-ref');
}

// ==================== 全局统一确认弹窗（替换原生 alert/confirm） ====================
let _confirmResolver = null;

// 返回 Promise<boolean>；取消/遮罩关闭/返回键均 resolve(false)
function showConfirmDialog({ title = '确认操作', message = '', confirmText = '确定', cancelText = '取消' } = {}) {
  els.confirmDialogTitle.textContent = title;
  els.confirmDialogText.textContent = message;
  els.confirmDialogOk.textContent = confirmText;
  els.confirmDialogCancel.textContent = cancelText;
  // 打开确认弹窗（保留底层弹窗不关闭），再挂载新 resolver
  openModal(els.confirmModal, true);
  return new Promise(resolve => {
    _confirmResolver = resolve;
  });
}

// 关闭弹窗时兜底 resolve(false)，防止 promise 挂起（如打开其它弹窗/返回键）
function resolveConfirmDialog() {
  if (_confirmResolver) {
    const r = _confirmResolver;
    _confirmResolver = null;
    r(false);
  }
}

// ==================== 剪贴板复制 ====================
async function copyTextToClipboard(text) {
  // 优先 Clipboard API（存在即环境支持；需用户手势内调用）
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) { /* 继续走 fallback */ }
  // fallback：临时 textarea + execCommand（兼容旧 WebView）
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (err) {
    return false;
  }
}

// 复制女优显示名（日文艺名）并提示
async function copyActressName(name) {
  const text = (name || '').trim();
  if (!text) { showToast('暂无名字可复制', 'error'); return; }
  const ok = await copyTextToClipboard(text);
  showToast(ok ? '名字复制成功' : '复制失败，请手动复制', ok ? 'success' : 'error');
}

// ==================== 首页 ====================
function updateHomeStats() {
  els.homeStatActress.querySelector('.home-stat-value').textContent = DB.getActresses().length;
  els.homeStatVideo.querySelector('.home-stat-value').textContent = DB.getVideos().length;
}

// ==================== 列表加载（统一入口 + 常驻缓存） ====================
// 页面切换不销毁 DOM；指纹相同（数据/排序/搜索/视图未变）时跳过重渲染，直接恢复滚动位置
let _actressRenderFingerprint = '';
let _workRenderFingerprint = '';

function actressFingerprint() {
  return DB.getActresses().map(a => a.id + '|' + (actressWorksCountMap[a.id] || 0)).join(',')
    + '#' + actressSortMode + '#' + viewModeActress + '#' + els.searchInputActress.value.trim().toLowerCase();
}

function workFingerprint() {
  return DB.getVideos().map(v => v.id + '|' + (v.updatedAt || '')).join(',')
    + '#' + els.searchInputWork.value.trim().toLowerCase();
}

// resetSearch=true 时清空搜索框，保证所有条目正常展示（导航/首页卡片进入）
function loadActressList(resetSearch = false) {
  if (resetSearch && els.searchInputActress.value) {
    els.searchInputActress.value = '';
    els.searchClearActress.classList.remove('show');
  }
  showPage('page-actresses', false);
  applyActressViewMode();
  updateActressStatus();
  const fp = actressFingerprint();
  // 列表未变化：跳过重渲染（滚动位置已由 showPage 恢复）
  if (fp === _actressRenderFingerprint) return;
  // 列表有变化：推迟一帧再渲染，让页面切换帧只绘制轻量框架（页头/底栏），
  // 避免卡片构建与图片水合挤在切换瞬间造成卡顿
  requestAnimationFrame(() => {
    if (fp === _actressRenderFingerprint) return; // 已被其它渲染处理
    renderActresses();
    window.scrollTo(0, _pageScrollPos['page-actresses'] || 0);
  });
}

function loadWorkList(resetSearch = false) {
  if (resetSearch && els.searchInputWork.value) {
    els.searchInputWork.value = '';
    els.searchClearWork.classList.remove('show');
  }
  showPage('page-works', false);
  updateWorkStatus();
  const fp = workFingerprint();
  // 列表未变化：跳过重渲染（滚动位置已由 showPage 恢复）
  if (fp === _workRenderFingerprint) return;
  // 列表有变化：推迟一帧再渲染，让页面切换帧只绘制轻量框架
  requestAnimationFrame(() => {
    if (fp === _workRenderFingerprint) return; // 已被其它渲染处理
    renderWorks();
    window.scrollTo(0, _pageScrollPos['page-works'] || 0);
  });
}

// ==================== 女优列表 ====================
let _actressRenderToken = 0;
let _workRenderToken = 0;

// 女优名称匹配（列表展示与批量全选共用）
function actressNameMatches(actress, query) {
  if (!query) return true;
  const displayName = (DB.applyNameMapping(actress.name) || '').toLowerCase();
  return (!!actress.name && actress.name.toLowerCase().includes(query)) ||
         (!!actress.alias && actress.alias.toLowerCase().includes(query)) ||
         displayName.includes(query);
}

// 女优搜索过滤：名称命中，或出现在番号/标题命中的作品里
// （renderActresses 与 selectAllBatch 共用，保证「全选」范围与列表展示一致）
function filterActressesByQuery(actresses, query) {
  if (!query) return actresses;
  // 匹配作品番号/标题 → 找出这些作品关联的女优（如搜 IPX-536 或 ipx536 返回桃乃木香奈）
  const normalizedQuery = (normalizeVideoCode(query) || query).toLowerCase();
  const videoMatchedActressNames = new Set();
  DB.getVideos().forEach(v => {
    const code = (v.code || '').toLowerCase();
    const title = (v.title || '').toLowerCase();
    if (code.includes(query) || code.includes(normalizedQuery) || title.includes(query)) {
      (v.actresses || '').split(',').forEach(n => {
        const t = n.trim();
        if (t) videoMatchedActressNames.add(t.toLowerCase());
      });
    }
  });

  if (videoMatchedActressNames.size === 0) {
    return actresses.filter(a => actressNameMatches(a, query));
  }
  return actresses.filter(a => {
    if (actressNameMatches(a, query)) return true;
    // 该女优是否出现在番号匹配的作品中（用全部名称变体匹配）
    return getActressAllNamesCached(a).some(n => videoMatchedActressNames.has(n.toLowerCase()));
  });
}

function renderActresses() {
  // 进入即失效上一轮分批渲染：即使本次渲染为空结果，旧批次也不会再向网格追加卡片
  const token = ++_actressRenderToken;
  const query = els.searchInputActress.value.trim().toLowerCase();
  const actresses = filterActressesByQuery(DB.getActresses(), query);

  // 排序
  if (actressSortMode === 'works-desc') {
    actresses.sort((a, b) => (actressWorksCountMap[b.id] || 0) - (actressWorksCountMap[a.id] || 0));
  } else if (actressSortMode === 'time-desc') {
    actresses.sort((a, b) =>
      toTimestamp(b.updatedAt || b.createdAt) - toTimestamp(a.updatedAt || a.createdAt));
  } else {
    // name-desc: 按显示名降序（Z→A）
    actresses.sort((a, b) => (DB.applyNameMapping(b.name) || '').localeCompare(DB.applyNameMapping(a.name) || '', 'ja'));
  }

  els.searchCountActress.textContent = query ? `${actresses.length} 个结果` : '';

  if (actresses.length === 0) {
    els.actressGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;"><p>${query ? '无匹配结果' : '暂无女优，请在首页添加'}</p></div>`;
    _actressRenderFingerprint = actressFingerprint();
    return;
  }

  // 分批渲染：首批 30 条立即渲染，剩余分批加载（异步不阻塞主线程）
  const BATCH_FIRST = 30;
  const BATCH_SIZE = 50;

  els.actressGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const firstBatch = actresses.slice(0, BATCH_FIRST);
  firstBatch.forEach(actress => fragment.appendChild(createActressCard(actress)));
  els.actressGrid.appendChild(fragment);
  _actressRenderFingerprint = actressFingerprint();

  // 分批渲染剩余项
  if (actresses.length > BATCH_FIRST) {
    let offset = BATCH_FIRST;
    function renderNextBatch() {
      if (token !== _actressRenderToken) return; // 已被新的渲染取消
      const batch = actresses.slice(offset, offset + BATCH_SIZE);
      const frag = document.createDocumentFragment();
      batch.forEach(actress => frag.appendChild(createActressCard(actress)));
      els.actressGrid.appendChild(frag);
      offset += BATCH_SIZE;
      if (offset < actresses.length) {
        requestAnimationFrame(renderNextBatch);
      }
    }
    requestAnimationFrame(renderNextBatch);
  }
}

function createActressCard(actress) {
  const card = document.createElement('div');
  card.className = 'actress-card';
  card.dataset.id = actress.id;

  if (batchModeActress) {
    card.classList.add('batch-mode');
    if (selectedActresses.has(actress.id)) {
      card.classList.add('selected');
    }
  }

  const worksCount = actressWorksCountMap[actress.id] || 0;
  const isFav = actress.favorited;
  const displayName = DB.applyNameMapping(actress.name);

  const avatarHtml = actress.avatar
    ? `<img ${imageAttr(actress.avatar)} alt="${escapeHtml(displayName)}">`
    : `<div class="avatar-placeholder"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`;

  card.innerHTML = `
    <div class="batch-checkbox">${selectedActresses.has(actress.id) ? '✓' : ''}</div>
    <div class="actress-avatar-wrap">
      ${avatarHtml}
      ${isFav ? `<div class="fav-mark">♥</div>` : ''}
    </div>
    <div class="actress-info">
      <div class="actress-name">${escapeHtml(displayName)}</div>
      <div class="actress-count">${worksCount} 部作品</div>
    </div>
  `;

  card.addEventListener('click', () => {
    if (batchModeActress) {
      toggleSelectActress(actress.id);
    } else {
      openActressDetail(actress.id);
    }
  });
  return card;
}

function applyActressViewMode() {
  const gridIcon = els.viewToggleActress.querySelector('.grid-icon');
  const listIcon = els.viewToggleActress.querySelector('.list-icon');
  if (viewModeActress === 'list') {
    els.actressGrid.classList.add('list-view');
    gridIcon.style.display = 'none';
    listIcon.style.display = 'block';
  } else {
    els.actressGrid.classList.remove('list-view');
    gridIcon.style.display = 'block';
    listIcon.style.display = 'none';
  }
}

function toggleActressViewMode() {
  viewModeActress = viewModeActress === 'grid' ? 'list' : 'grid';
  applyActressViewMode();
  renderActresses();
}

function updateActressStatus() {
  els.statusTextActress.textContent = `共 ${DB.getActresses().length} 位女优`;
}

// ==================== 作品列表 ====================
// 作品搜索过滤（renderWorks 与 selectAllBatch 共用）
function filterWorksByQuery(videos, query) {
  if (!query) return videos;
  const normalizedQuery = (normalizeVideoCode(query) || query).toLowerCase();
  return videos.filter(v => {
    const code = (v.code || '').toLowerCase();
    const title = (v.title || '').toLowerCase();
    const actresses = (v.actresses || '').toLowerCase();
    const studio = (v.studio || '').toLowerCase();
    return code.includes(query) ||
           (normalizedQuery !== query && code.includes(normalizedQuery)) ||
           title.includes(query) ||
           actresses.includes(query) ||
           studio.includes(query);
  });
}

function renderWorks() {
  // 进入即失效上一轮分批渲染（同 renderActresses）
  const token = ++_workRenderToken;
  const query = els.searchInputWork.value.trim().toLowerCase();
  const videos = filterWorksByQuery(DB.getVideos(), query);

  // 与导出顺序保持一致：优先添加时间，缺失时回退修改时间
  videos.sort((a, b) =>
    toTimestamp(b.createdAt || b.updatedAt) - toTimestamp(a.createdAt || a.updatedAt));

  els.searchCountWork.textContent = query ? `${videos.length} 个结果` : '';

  if (videos.length === 0) {
    const container = document.createElement('div');
    container.className = 'empty-state';
    container.style.gridColumn = '1 / -1';

    if (query) {
      container.innerHTML = `
        <p>未找到「${escapeHtml(query)}」相关作品</p>
        <button class="btn-primary btn-sm" id="workSearchApiFetchBtn">从 API 获取并添加</button>
      `;
    } else {
      container.innerHTML = `<p>${query ? '无匹配结果' : '暂无作品，请在首页添加'}</p>`;
    }

    els.worksGrid.innerHTML = '';
    els.worksGrid.appendChild(container);

    if (query) {
      document.getElementById('workSearchApiFetchBtn').addEventListener('click', () => {
        openVideoModalWithApiFetch(query);
      });
    }
    _workRenderFingerprint = workFingerprint();
    return;
  }

  // 分批渲染：首批 30 条立即渲染，剩余分批加载（异步不阻塞主线程）
  const BATCH_FIRST = 30;
  const BATCH_SIZE = 50;

  els.worksGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const firstBatch = videos.slice(0, BATCH_FIRST);
  firstBatch.forEach(video => fragment.appendChild(createWorkPosterCard(video)));
  els.worksGrid.appendChild(fragment);
  _workRenderFingerprint = workFingerprint();

  if (videos.length > BATCH_FIRST) {
    let offset = BATCH_FIRST;
    function renderNextWorkBatch() {
      if (token !== _workRenderToken) return; // 已被新的渲染取消
      const batch = videos.slice(offset, offset + BATCH_SIZE);
      const frag = document.createDocumentFragment();
      batch.forEach(video => frag.appendChild(createWorkPosterCard(video)));
      els.worksGrid.appendChild(frag);
      offset += BATCH_SIZE;
      if (offset < videos.length) {
        requestAnimationFrame(renderNextWorkBatch);
      }
    }
    requestAnimationFrame(renderNextWorkBatch);
  }
}

function createWorkPosterCard(video) {
  const card = document.createElement('div');
  card.className = 'work-poster-card';
  card.dataset.id = video.id;

  if (batchModeWork) {
    card.classList.add('batch-mode');
    if (selectedWorks.has(video.id)) {
      card.classList.add('selected');
    }
  }

  const coverSrc = video.cover || video.coverUrl || '';
  const coverHtml = coverSrc
    ? `<img ${imageAttr(coverSrc)} alt="${escapeHtml(video.code)}">`
    : `<div class="work-poster-placeholder">🎬</div>`;

  card.innerHTML = `
    <div class="batch-checkbox">${selectedWorks.has(video.id) ? '✓' : ''}</div>
    <div class="work-poster-cover">
      ${coverHtml}
    </div>
    <div class="work-poster-info">
      <div class="work-poster-code">${escapeHtml(video.code)}</div>
      <div class="work-poster-title">${escapeHtml(video.title || '无标题')}</div>
    </div>
  `;

  card.addEventListener('click', () => {
    if (batchModeWork) {
      toggleSelectWork(video.id);
    } else {
      showVideoDetail(video.id);
    }
  });
  return card;
}

function updateWorkStatus() {
  els.statusTextWork.textContent = `共 ${DB.getVideos().length} 部作品`;
}

// ==================== 批量操作 ====================
function toggleBatchMode(type) {
  if (type === 'actress') {
    batchModeActress = !batchModeActress;
    if (!batchModeActress) {
      selectedActresses.clear();
    }
    els.batchBarActress.style.display = batchModeActress ? 'flex' : 'none';
    els.batchActressBtn.textContent = batchModeActress ? '退出选择' : '批量选择';
    els.batchInfoActress.style.display = batchModeActress ? 'inline' : 'none';
    updateBatchInfo('actress');
    renderActresses();
  } else if (type === 'work') {
    batchModeWork = !batchModeWork;
    if (!batchModeWork) {
      selectedWorks.clear();
    }
    els.batchBarWork.style.display = batchModeWork ? 'flex' : 'none';
    els.batchWorkBtn.textContent = batchModeWork ? '退出选择' : '批量选择';
    els.batchInfoWork.style.display = batchModeWork ? 'inline' : 'none';
    updateBatchInfo('work');
    renderWorks();
  }
}

function exitBatchMode(type) {
  if (type === 'actress') {
    batchModeActress = false;
    selectedActresses.clear();
    els.batchBarActress.style.display = 'none';
    els.batchActressBtn.textContent = '批量选择';
    els.batchInfoActress.style.display = 'none';
    renderActresses();
  } else if (type === 'work') {
    batchModeWork = false;
    selectedWorks.clear();
    els.batchBarWork.style.display = 'none';
    els.batchWorkBtn.textContent = '批量选择';
    els.batchInfoWork.style.display = 'none';
    renderWorks();
  }
}

function toggleSelectActress(id) {
  if (selectedActresses.has(id)) {
    selectedActresses.delete(id);
  } else {
    selectedActresses.add(id);
  }
  updateBatchInfo('actress');
  renderActresses();
}

function toggleSelectWork(id) {
  if (selectedWorks.has(id)) {
    selectedWorks.delete(id);
  } else {
    selectedWorks.add(id);
  }
  updateBatchInfo('work');
  renderWorks();
}

function updateBatchInfo(type) {
  if (type === 'actress') {
    els.batchInfoActress.textContent = `已选 ${selectedActresses.size} 项`;
  } else if (type === 'work') {
    els.batchInfoWork.textContent = `已选 ${selectedWorks.size} 项`;
  }
}

function selectAllBatch(type) {
  if (type === 'actress') {
    const query = els.searchInputActress.value.trim().toLowerCase();
    // 与列表展示使用同一套过滤逻辑，保证「全选」= 当前可见项
    const actresses = filterActressesByQuery(DB.getActresses(), query);
    if (selectedActresses.size === actresses.length) {
      selectedActresses.clear();
    } else {
      selectedActresses.clear();
      actresses.forEach(a => selectedActresses.add(a.id));
    }
    updateBatchInfo('actress');
    renderActresses();
  } else if (type === 'work') {
    const query = els.searchInputWork.value.trim().toLowerCase();
    const videos = filterWorksByQuery(DB.getVideos(), query);
    if (selectedWorks.size === videos.length) {
      selectedWorks.clear();
    } else {
      selectedWorks.clear();
      videos.forEach(v => selectedWorks.add(v.id));
    }
    updateBatchInfo('work');
    renderWorks();
  }
}

function deleteBatch(type) {
  if (type === 'actress') {
    if (selectedActresses.size === 0) {
      showToast('请先选择要删除的女优', 'error');
      return;
    }
    showConfirmDialog({
      title: '批量删除女优',
      message: `确定删除选中的 ${selectedActresses.size} 位女优吗？`,
      confirmText: '删除'
    }).then(ok => {
      if (!ok) return;
      DB.deleteActresses([...selectedActresses]);
      selectedActresses.clear();
      exitBatchMode('actress');
      updateActressWorksCount();
      renderActresses();
      updateActressStatus();
      updateHomeStats();
      showToast('批量删除成功', 'success');
    });
  } else if (type === 'work') {
    if (selectedWorks.size === 0) {
      showToast('请先选择要删除的作品', 'error');
      return;
    }
    showConfirmDialog({
      title: '批量删除作品',
      message: `确定删除选中的 ${selectedWorks.size} 部作品吗？`,
      confirmText: '删除'
    }).then(ok => {
      if (!ok) return;
      DB.deleteVideos([...selectedWorks]);
      selectedWorks.clear();
      exitBatchMode('work');
      updateActressWorksCount();
      renderWorks();
      updateWorkStatus();
      updateHomeStats();
      showToast('批量删除成功', 'success');
    });
  }
}

// ==================== 刷新 ====================
function refreshData(type) {
  const btn = type === 'actress' ? els.refreshBtnActress : els.refreshBtnWork;
  btn.classList.add('spin');
  setTimeout(() => {
    updateActressWorksCount();
    if (type === 'actress') {
      renderActresses();
      updateActressStatus();
    } else {
      renderWorks();
      updateWorkStatus();
    }
    updateHomeStats();
    btn.classList.remove('spin');
    showToast('数据已刷新', 'success');
  }, 600);
}

// 取女优全部名称变体（优先读缓存；缓存随 updateActressWorksCount 重建）
function getActressAllNamesCached(actress) {
  if (!actress) return [];
  const cached = actressAllNamesMap[actress.id];
  if (cached) return cached;
  const names = DB.getActressAllNames(actress);
  actressAllNamesMap[actress.id] = names;
  return names;
}

function updateActressWorksCount() {
  const actresses = DB.getActresses();
  const videos = DB.getVideos();
  actressWorksCountMap = {};
  actressAllNamesMap = {};

  // 建立女优所有名称变体 -> id 映射（小写），包含原名、别名、映射名
  const nameToId = {};
  actresses.forEach(actress => {
    actressWorksCountMap[actress.id] = 0;
    const allNames = DB.getActressAllNames(actress);
    actressAllNamesMap[actress.id] = allNames;
    allNames.forEach(n => {
      nameToId[n.toLowerCase()] = actress.id;
    });
  });

  // 遍历作品一次统计，O(V)
  videos.forEach(v => {
    if (!v.actresses) return;
    const names = v.actresses.split(',').map(n => n.trim().toLowerCase());
    const counted = new Set(); // 防止同一作品因多个变体名被重复计数
    names.forEach(name => {
      const id = nameToId[name];
      if (id && !counted.has(id)) {
        actressWorksCountMap[id]++;
        counted.add(id);
      }
    });
  });
}

// ==================== 详情页 ====================
function openActressDetail(actressId) {
  const actress = DB.getActress(actressId);
  if (!actress) return;

  detailActressId = actressId;
  detailReturnPage = 'page-actresses';

  const displayName = DB.applyNameMapping(actress.name);

  els.detailAvatar.innerHTML = actress.avatar
    ? `<img ${imageAttr(actress.avatar)} alt="${escapeHtml(displayName)}">`
    : `<div class="avatar-placeholder-large"><svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`;

  els.detailName.textContent = displayName;

  const metaParts = [];
  if (actress.alias) metaParts.push(`别名: ${actress.alias}`);
  if (actress.birthday) {
    const age = calcAge(actress.birthday);
    metaParts.push(`生日: ${actress.birthday}${age !== null ? `（${age}岁）` : ''}`);
  }
  if (actress.height) metaParts.push(`身高: ${actress.height}cm`);
  if (actress.measurements) metaParts.push(`三围: ${actress.measurements}`);
  if (actress.note) metaParts.push(`备注: ${actress.note}`);
  els.detailMeta.textContent = metaParts.join(' · ') || '暂无详细信息';

  // 获取该女优的所有名称变体（原名、别名、映射名），用于匹配作品
  const allNames = getActressAllNamesCached(actress).map(n => n.toLowerCase());
  const works = DB.getVideos().filter(v => {
    if (!v.actresses) return false;
    const videoNames = v.actresses.split(',').map(n => n.trim().toLowerCase());
    return videoNames.some(n => allNames.includes(n));
  });

  els.worksList.innerHTML = '';
  if (works.length === 0) {
    els.worksList.innerHTML = '<div class="empty-state" style="padding: 40px 0;"><p>暂无作品</p></div>';
  } else {
    works.sort((a, b) =>
      toTimestamp(b.createdAt || b.updatedAt) - toTimestamp(a.createdAt || a.updatedAt));
    works.forEach(video => els.worksList.appendChild(createWorkCard(video)));
  }

  updateDetailCheckinCount();
  showPage('page-detail');
}

function updateDetailCheckinCount() {
  if (!detailActressId) return;
  const actress = DB.getActress(detailActressId);
  if (!actress) return;
  const allNames = getActressAllNamesCached(actress).map(n => n.toLowerCase());
  const checkins = DB.getCheckins();
  let count = 0;
  checkins.forEach(c => {
    const rec = DB.normalizeCheckinRecord(c);
    if (rec.type === 'actress') {
      const n = (rec.actress || rec.name || '').toLowerCase();
      if (allNames.some(a => a === n)) count++;
    } else if (rec.type === 'work' && rec.actress) {
      const names = rec.actress.split(',').map(n => n.trim().toLowerCase());
      if (names.some(n => allNames.includes(n))) count++;
    }
  });
  const el = document.getElementById('detailCheckinCount');
  if (el) el.textContent = `打卡次数：${count}次`;
}

function createWorkCard(video) {
  const card = document.createElement('div');
  card.className = 'work-card';
  card.dataset.id = video.id;

  const coverSrc2 = video.cover || video.coverUrl || '';
  const coverHtml = coverSrc2
    ? `<img ${imageAttr(coverSrc2)} alt="${escapeHtml(video.code)}">`
    : `<div class="work-placeholder">🎬</div>`;

  const tags = [];
  if (video.studio) tags.push(video.studio);
  if (video.date) tags.push(video.date);

  card.innerHTML = `
    <div class="work-cover">${coverHtml}</div>
    <div class="work-info">
      <div class="work-code">${escapeHtml(video.code)}</div>
      <div class="work-title">${escapeHtml(video.title || '无标题')}</div>
      <div class="work-tags">${tags.map(t => `<span class="work-tag">${escapeHtml(t)}</span>`).join('')}</div>
    </div>
  `;
  card.addEventListener('click', () => showVideoDetail(video.id));
  return card;
}

// ==================== 编辑女优 ====================
function editCurrentActress() {
  if (!detailActressId) return;
  openActressModal(detailActressId);
}

// ==================== 弹窗控制 ====================
function openModal(modal, keepOthers = false) {
  if (!keepOthers) closeAllModals();
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  // 弹窗内容自动滚动到顶部
  const content = modal.querySelector('.modal-content, .detail-modal-content, .random-modal-content');
  if (content) {
    requestAnimationFrame(() => {
      content.scrollTop = 0;
    });
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
  closeCoverPreview();
  document.body.style.overflow = '';
  currentVideoId = null;
  currentActressId = null;
  resetForms();
  resolveConfirmDialog();
}

function resetForms() {
  els.videoForm.reset();
  els.actressForm.reset();
  document.getElementById('video-cover-preview').innerHTML = '';
  document.getElementById('actress-avatar-preview').innerHTML = '';
  document.getElementById('video-id').value = '';
  document.getElementById('actress-id').value = '';
  document.getElementById('video-modal-title').textContent = '添加作品';
  document.getElementById('actress-modal-title').textContent = '添加女优';
  document.getElementById('btn-delete-video').style.display = 'none';
  document.getElementById('btn-delete-actress').style.display = 'none';
  document.getElementById('video-cover').dataset.imageValue = '';
  document.getElementById('actress-avatar').dataset.imageValue = '';
  if (els.actressDisplayName) els.actressDisplayName.value = '';
}

// ==================== 作品弹窗 ====================
function openVideoModal(videoId = null) {
  openModal(els.videoModal);
  currentVideoId = videoId;
  if (videoId) {
    const video = DB.getVideo(videoId);
    if (!video) return;
    document.getElementById('video-modal-title').textContent = '编辑作品';
    document.getElementById('video-id').value = video.id;
    document.getElementById('video-code').value = video.code || '';
    document.getElementById('video-title').value = video.title || '';
    document.getElementById('video-actresses').value = video.actresses || '';
    document.getElementById('video-studio').value = video.studio || '';
    document.getElementById('video-year').value = video.year || '';
    document.getElementById('video-date').value = video.date || '';
    document.getElementById('video-duration').value = video.duration || '';
    document.getElementById('video-quality').value = video.quality || '';
    document.getElementById('video-tags').value = video.tags || '';
    document.getElementById('video-cover-url').value = video.coverUrl || '';
    document.getElementById('video-playlink').value = video.playLink || '';
    document.getElementById('video-description').value = video.description || '';
    document.getElementById('video-note').value = video.note || '';
    // 封面预览：优先显示本地上传的 base64，其次显示 URL
    if (video.cover) {
      document.getElementById('video-cover-preview').innerHTML = `<img ${imageAttr(video.cover)} alt="封面预览">`;
    } else if (video.coverUrl) {
      document.getElementById('video-cover-preview').innerHTML = `<img src="${video.coverUrl}" alt="封面预览">`;
    }
    document.getElementById('btn-delete-video').style.display = 'inline-block';
  }
}

// 搜索无结果时，打开作品弹窗并自动从 API 获取填充
async function openVideoModalWithApiFetch(code) {
  if (!code || !code.trim()) return;
  code = normalizeVideoCode(code.trim());
  openVideoModal();
  document.getElementById('video-code').value = code;
  // 等待弹窗动画渲染后再调用 API
  await new Promise(resolve => setTimeout(resolve, 150));
  await fetchAndFillVideoForm();
}

// ==================== 女优弹窗 ====================
function openActressModal(actressId = null) {
  openModal(els.actressModal);
  currentActressId = actressId;
  if (actressId) {
    const actress = DB.getActress(actressId);
    if (!actress) return;
    document.getElementById('actress-modal-title').textContent = '编辑女优';
    document.getElementById('actress-id').value = actress.id;
    document.getElementById('actress-name').value = actress.name || '';
    document.getElementById('actress-birthday').value = actress.birthday || '';
    document.getElementById('actress-height').value = actress.height || '';
    document.getElementById('actress-note').value = actress.note || '';
    // 显示名替换：查找该女优原名对应的映射规则（支持逗号分隔多原名）
    const mappings = DB.getNameMappings();
    const actressNameLower = (actress.name || '').toLowerCase();
    const existing = mappings.find(m => {
      const originals = m_original_split(m.original);
      return originals.includes(actressNameLower);
    });
    els.actressDisplayName.value = existing ? existing.replacement : '';
    if (actress.avatar) {
      document.getElementById('actress-avatar-preview').innerHTML = `<img ${imageAttr(actress.avatar)} alt="头像预览">`;
    }
    document.getElementById('btn-delete-actress').style.display = 'inline-block';
  }
}

// ==================== 图片预览 ====================
async function previewImage(event, previewId) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const imageValue = await DB.saveImage(file);
    document.getElementById(previewId).innerHTML = `<img ${imageAttr(imageValue)} alt="预览">`;
    event.target.dataset.imageValue = imageValue;
  } catch (err) {
    showToast('图片读取失败', 'error');
  }
}

// ==================== 表单提交 ====================
async function handleVideoSubmit(e) {
  e.preventDefault();

  const coverInput = document.getElementById('video-cover');
  const coverUrl = document.getElementById('video-cover-url').value.trim();
  let cover = '';
  // 优先使用本地上传的 base64
  if (coverInput.dataset.imageValue) {
    cover = coverInput.dataset.imageValue;
  } else if (currentVideoId) {
    const old = DB.getVideo(currentVideoId);
    cover = old ? old.cover : '';
  }

  const data = {
    code: normalizeVideoCode(document.getElementById('video-code').value.trim()),
    title: document.getElementById('video-title').value.trim(),
    actresses: document.getElementById('video-actresses').value.trim(),
    studio: document.getElementById('video-studio').value.trim(),
    year: document.getElementById('video-year').value.trim(),
    date: document.getElementById('video-date').value,
    duration: document.getElementById('video-duration').value.trim(),
    quality: document.getElementById('video-quality').value.trim(),
    tags: document.getElementById('video-tags').value.trim(),
    coverUrl: coverUrl,
    playLink: document.getElementById('video-playlink').value.trim(),
    description: document.getElementById('video-description').value.trim(),
    note: document.getElementById('video-note').value.trim(),
    cover
  };

  if (!data.code) {
    showToast('请输入番号', 'error');
    return;
  }

  // 规整女优名：去空白、去重（避免 "A,A" 这类脏数据入库）
  data.actresses = normalizeNameList(data.actresses);

  // 自动关联/创建女优
  if (data.actresses) {
    const names = data.actresses.split(',').map(n => n.trim()).filter(Boolean);
    names.forEach(name => {
      if (!DB.findActressByName(name)) {
        DB.addActress({ name });
      }
    });
  }

  if (currentVideoId) {
    DB.updateVideo(currentVideoId, data);
    showToast('作品已更新', 'success');
  } else {
    DB.addVideo(data);
    showToast(DB._lastAddWasReplace ? '番号已存在，已替换旧记录' : '作品已添加', 'success');
  }

  updateActressWorksCount();
  closeAllModals();
  refreshCurrentPage();
  updateHomeStats();

  // 如果在详情页，刷新作品列表
  if (currentPage === 'detail' && detailActressId) {
    openActressDetail(detailActressId);
  }
}

async function handleActressSubmit(e) {
  e.preventDefault();

  const avatarInput = document.getElementById('actress-avatar');
  let avatar = '';
  if (avatarInput.dataset.imageValue) {
    avatar = avatarInput.dataset.imageValue;
  } else if (currentActressId) {
    const old = DB.getActress(currentActressId);
    avatar = old ? old.avatar : '';
  }

  const data = {
    name: document.getElementById('actress-name').value.trim(),
    birthday: parseBirthdayInput(document.getElementById('actress-birthday').value),
    height: document.getElementById('actress-height').value.trim(),
    note: document.getElementById('actress-note').value.trim(),
    avatar
  };

  if (!data.name) {
    showToast('请输入名字', 'error');
    return;
  }

  if (currentActressId) {
    const oldActress = DB.getActress(currentActressId);
    const oldName = oldActress ? oldActress.name : '';

    DB.updateActress(currentActressId, data);
    handleDisplayNameMapping(oldName, data.name);

    // 按替换名合并女优，如果当前女优被合并到其他女优，更新引用
    const mergedCount = DB.mergeActressesByReplacementName();
    if (mergedCount > 0) {
      // 当前女优可能已被合并，检查是否还存在
      if (!DB.getActress(currentActressId)) {
        // 查找合并后保留的女优（按显示名查找）
        const displayName = DB.applyNameMapping(data.name);
        const kept = DB.getActresses().find(a =>
          DB.applyNameMapping(a.name).toLowerCase() === displayName.toLowerCase()
        );
        if (kept) {
          currentActressId = kept.id;
          detailActressId = kept.id;
        }
      }
      showToast(`女优已更新，自动合并 ${mergedCount} 个重复女优`, 'success');
    } else {
      showToast('女优已更新', 'success');
    }
  } else {
    // 检查是否已存在同名女优
    const existing = DB.findActressByName(data.name);
    if (existing) {
      showToast('该女优已存在，已自动关联', 'info');
    } else {
      DB.addActress(data);
      handleDisplayNameMapping('', data.name);

      // 按替换名合并女优
      const mergedCount = DB.mergeActressesByReplacementName();
      if (mergedCount > 0) {
        showToast(`女优已添加，自动合并 ${mergedCount} 个重复女优`, 'success');
      } else {
        showToast('女优已添加', 'success');
      }
    }
  }

  updateActressWorksCount();
  closeAllModals();
  refreshCurrentPage();
  updateHomeStats();

  // 如果在详情页，刷新详情
  if (currentPage === 'detail' && detailActressId) {
    openActressDetail(detailActressId);
  }
}

// 处理女优显示名替换映射
// oldName: 修改前的原名（新增时为空），newName: 当前原名
function handleDisplayNameMapping(oldName, newName) {
  const displayName = els.actressDisplayName.value.trim();
  const mappings = DB.getNameMappings();

  // 如果改名了，先清理旧名的映射（检查逗号分隔的多原名）
  if (oldName && oldName !== newName) {
    const oldLower = oldName.toLowerCase();
    mappings.forEach(m => {
      const originals = m_original_split(m.original);
      if (originals.includes(oldLower)) {
        DB.deleteNameMapping(m.id);
      }
    });
  }

  if (displayName) {
    // 有替换名：创建/更新映射 original=newName → replacement=displayName
    // 如果替换名和原名相同，不创建（无意义）
    if (displayName.toLowerCase() !== newName.toLowerCase()) {
      DB.addNameMapping(newName, displayName);
    }
  } else {
    // 替换名为空：如果该女优原名有映射，删除它
    const newLower = newName.toLowerCase();
    mappings.forEach(m => {
      const originals = m_original_split(m.original);
      if (originals.includes(newLower)) {
        DB.deleteNameMapping(m.id);
      }
    });
  }
}

function refreshCurrentPage() {
  if (currentPage === 'actresses') {
    renderActresses();
    updateActressStatus();
  } else if (currentPage === 'works') {
    renderWorks();
    updateWorkStatus();
  } else if (currentPage === 'home') {
    updateHomeStats();
  }
}

function deleteCurrentVideo() {
  if (!currentVideoId) return;
  showConfirmDialog({
    title: '删除作品',
    message: '确定删除这个作品吗？',
    confirmText: '删除'
  }).then(ok => {
    if (!ok) return;
    DB.deleteVideo(currentVideoId);
    updateActressWorksCount();
    closeAllModals();
    refreshCurrentPage();
    updateHomeStats();
    if (currentPage === 'detail' && detailActressId) {
      openActressDetail(detailActressId);
    }
    showToast('作品已删除', 'success');
  });
}

function deleteCurrentActress() {
  if (!currentActressId) return;
  showConfirmDialog({
    title: '删除女优',
    message: '确定删除这个女优吗？',
    confirmText: '删除'
  }).then(ok => {
    if (!ok) return;
    DB.deleteActress(currentActressId);
    detailActressId = null;
    closeAllModals();
    // 在详情页删除后返回女优列表
    if (currentPage === 'detail') {
      loadActressList(true);
    } else {
      refreshCurrentPage();
    }
    updateHomeStats();
    showToast('女优已删除', 'success');
  });
}

// ==================== 作品详情弹窗 ====================
function showVideoDetail(videoId) {
  const video = DB.getVideo(videoId);
  if (!video) return;

  els.detailTitle.textContent = video.code;

  // 封面图：优先 base64，其次 URL
  const coverSrc = video.cover || video.coverUrl || '';
  const coverHtml = coverSrc
    ? `<img class="detail-cover" ${imageAttr(coverSrc)} alt="${escapeHtml(video.code)}">`
    : `<div class="detail-cover-placeholder">🎬</div>`;

  // 女优（显示替换后的名称）
  const actressNames = video.actresses ? video.actresses.split(',').map(n => n.trim()).filter(Boolean) : [];
  const actressAvatars = actressNames.map(name => {
    const actress = DB.findActressByName(name);
    const displayName = DB.applyNameMapping(name);
    return actress && actress.avatar
      ? `<img class="actress-avatar-small" ${imageAttr(actress.avatar)} title="${escapeHtml(displayName)}">`
      : '';
  }).join('');

  // 信息标签
  const tags = [];
  if (video.quality) tags.push(video.quality);
  if (video.year) tags.push(video.year);
  if (video.studio) tags.push(video.studio);
  if (video.duration) tags.push(video.duration);
  if (video.date) tags.push(video.date);
  const tagsHtml = tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('');

  // 自定义标签
  const customTags = video.tags ? video.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const customTagsHtml = customTags.map(t => `<span class="detail-tag detail-tag-custom">${escapeHtml(t)}</span>`).join('');

  els.detailBody.innerHTML = `
    ${coverHtml}
    <div class="detail-info">
      <h3>${escapeHtml(video.title || video.code || '无标题')}</h3>
      ${tagsHtml ? `<div class="detail-meta-tags">${tagsHtml}</div>` : ''}
      ${actressNames.length ? `<div class="detail-row"><span class="detail-label">女优</span><span class="detail-value">${escapeHtml(DB.applyNameMappingsToActresses(video.actresses))}</span></div>` : ''}
      ${actressAvatars ? `<div class="actress-avatars">${actressAvatars}</div>` : ''}
      ${video.studio ? `<div class="detail-row"><span class="detail-label">片商</span><span class="detail-value">${escapeHtml(video.studio)}</span></div>` : ''}
      ${video.duration ? `<div class="detail-row"><span class="detail-label">时长</span><span class="detail-value">${escapeHtml(video.duration)}</span></div>` : ''}
      ${video.date ? `<div class="detail-row"><span class="detail-label">发行</span><span class="detail-value">${escapeHtml(video.date)}</span></div>` : ''}
      ${customTagsHtml ? `<div class="detail-custom-tags">${customTagsHtml}</div>` : ''}
      ${video.description ? `<div class="detail-section-block"><div class="detail-section-title">简介</div><div class="detail-description">${escapeHtml(video.description).replace(/\n/g, '<br>')}</div></div>` : ''}
      ${video.note ? `<div class="detail-section-block"><div class="detail-section-title">备注</div><div class="detail-note">${escapeHtml(video.note).replace(/\n/g, '<br>')}</div></div>` : ''}
      ${renderPlayButton(video)}
      <button class="btn-primary detail-edit-btn" data-video-id="${escapeHtml(video.id)}" style="margin-top:10px;width:100%;">编辑</button>
    </div>
  `;

  // 统一用事件绑定（而非把数据拼进 onclick 的 JS 字符串），避免转义边界问题
  const playBtn = els.detailBody.querySelector('.detail-play-btn');
  if (playBtn) {
    playBtn.addEventListener('click', () => showPlaySourcePopup(playBtn.dataset.playCode));
  }
  const editBtn = els.detailBody.querySelector('.detail-edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => openVideoModal(editBtn.dataset.videoId));
  }

  openModal(els.detailModal);
}

// 生成播放按钮：用 whos.tv 搜索结果页在线播放（基于番号）
function renderPlayButton(video) {
  const code = (video.code || '').trim().toLowerCase();
  if (!code) return '';
  return `<button class="btn-secondary detail-play-btn" data-play-code="${escapeHtml(code)}">▶ 在线播放</button>`;
}

// ==================== 在线播放源选择 ====================
let playSourceCode = '';

function showPlaySourcePopup(code) {
  playSourceCode = code;
  openModal(document.getElementById('play-source-modal'));
}

document.getElementById('playSourceJable').addEventListener('click', () => {
  if (!playSourceCode) return;
  window.open(`https://jable.tv/search/${encodeURIComponent(playSourceCode)}/`, '_blank');
  closeAllModals();
});

document.getElementById('playSourceWhos').addEventListener('click', () => {
  if (!playSourceCode) return;
  window.open(`https://whos.tv/result?search=${encodeURIComponent(playSourceCode)}`, '_blank');
  closeAllModals();
});

// ==================== 随机抽取 ====================
function openRandomModal() {
  els.randomHistoryView.style.display = 'none';
  els.randomPickView.style.display = 'block';
  openModal(els.randomModal);
}

function resetRandomResult() {
  els.randomResult.innerHTML = '<div class="random-placeholder">点击按钮开始抽取</div>';
}

function doRandom() {
  if (isRandomRolling) return;

  const items = currentRandomType === 'video' ? DB.getVideos() : DB.getActresses();
  if (items.length === 0) {
    showToast(currentRandomType === 'video' ? '暂无作品可抽取' : '暂无可抽取的女优', 'error');
    return;
  }

  // 瞬间固定最终结果：移除轮播动画，仅保留结果单次轻微缩放
  isRandomRolling = true;
  els.btnDoRandom.disabled = true;

  const finalItem = items[Math.floor(Math.random() * items.length)];
  renderRandomPreview(finalItem, false);
  DB.addRandomHistory(currentRandomType, finalItem);

  isRandomRolling = false;
  els.btnDoRandom.disabled = false;
  els.btnDoRandom.textContent = '再次抽取';
}

function showDetailFromRandom(type, id) {
  closeAllModals();
  setTimeout(function() {
    if (type === 'video') {
      showVideoDetail(id);
    } else {
      openActressDetail(id);
    }
  }, 250);
}

function renderRandomPreview(item, isRolling) {
  if (currentRandomType === 'video') {
    els.randomResult.innerHTML = `
      <div class="random-card ${isRolling ? 'random-rolling' : 'random-final'}">
        ${(item.cover || item.coverUrl) ? `<img ${imageAttr(item.cover || item.coverUrl)} alt="${escapeHtml(item.code)}">` : '<div style="font-size:48px">🎬</div>'}
        <h3>${escapeHtml(item.code)}</h3>
        <p>${escapeHtml(item.title || '无标题')}</p>
        ${!isRolling ? `<button class="btn-secondary random-detail-btn" data-random-type="video" data-random-id="${escapeHtml(item.id)}" style="margin-top:12px;">查看详情</button>` : ''}
      </div>
    `;
  } else {
    const worksCount = actressWorksCountMap[item.id] || 0;
    const displayName = DB.applyNameMapping(item.name);
    els.randomResult.innerHTML = `
      <div class="random-card ${isRolling ? 'random-rolling' : 'random-final'}">
        ${item.avatar ? `<img ${imageAttr(item.avatar)} alt="${escapeHtml(displayName)}">` : '<div style="color:var(--primary);font-size:48px;display:flex;align-items:center;justify-content:center;"><svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>'}
        <h3>${escapeHtml(displayName)}</h3>
        <p>${worksCount} 部作品</p>
        ${!isRolling ? `<button class="btn-secondary random-detail-btn" data-random-type="actress" data-random-id="${escapeHtml(item.id)}" style="margin-top:12px;">查看详情</button>` : ''}
      </div>
    `;
  }

  const detailBtn = els.randomResult.querySelector('.random-detail-btn');
  if (detailBtn) {
    detailBtn.addEventListener('click', () =>
      showDetailFromRandom(detailBtn.dataset.randomType, detailBtn.dataset.randomId));
  }
}

// 随机抽取 - 历史记录
function showRandomHistory() {
  els.randomPickView.style.display = 'none';
  els.randomHistoryView.style.display = 'block';
  renderRandomHistory();
}

function backToRandomPick() {
  els.randomHistoryView.style.display = 'none';
  els.randomPickView.style.display = 'block';
}

function renderRandomHistory() {
  const history = DB.getRandomHistory();
  if (history.length === 0) {
    els.randomHistoryList.innerHTML = '<div class="random-history-empty">暂无抽取记录</div>';
    return;
  }

  els.randomHistoryList.innerHTML = '';
  history.forEach(record => {
    const item = document.createElement('div');
    item.className = 'random-history-item';

    const thumbHtml = record.cover
      ? `<img ${imageAttr(record.cover)} alt="${escapeHtml(record.name)}">`
      : (record.type === 'video'
        ? `<div>🎬</div>`
        : `<div style="color:var(--primary);display:flex;align-items:center;justify-content:center;"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`);

    const time = new Date(record.pickedAt);
    const timeStr = `${time.getMonth() + 1}/${time.getDate()} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;

    item.innerHTML = `
      <div class="random-history-thumb">${thumbHtml}</div>
      <div class="random-history-info">
        <div class="random-history-name">${escapeHtml(record.name)}</div>
        <div class="random-history-meta">${timeStr}${record.title ? ' · ' + escapeHtml(record.title) : ''}</div>
        <div class="random-history-category">${record.type === 'video' ? '作品' : '女优'}</div>
      </div>
      <button class="random-history-delete" aria-label="删除记录">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    `;

    item.addEventListener('click', () => {
      if (record.type === 'video') {
        showVideoDetail(record.itemId);
      } else {
        closeAllModals();
        openActressDetail(record.itemId);
      }
    });

    // 删除单条记录（二次确认，不触发条目点击）
    const deleteBtn = item.querySelector('.random-history-delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showConfirmDialog({
        title: '删除记录',
        message: `确定删除这条抽取记录「${record.name}」吗？`,
        confirmText: '删除'
      }).then(ok => {
        if (!ok) return;
        DB.deleteRandomHistory(record.id);
        renderRandomHistory();
        showToast('记录已删除', 'success');
      });
    });

    els.randomHistoryList.appendChild(item);
  });
}

function clearRandomHistory() {
  showConfirmDialog({
    title: '清空记录',
    message: '确定清空所有抽取记录吗？',
    confirmText: '清空'
  }).then(ok => {
    if (!ok) return;
    DB.clearRandomHistory();
    renderRandomHistory();
    showToast('记录已清空', 'success');
  });
}

// ==================== API 自动获取 ====================
const VOD_API_BASE = 'https://avdbapi.com/zh/api.php/provide/vod';

// 从 API 查询番号，返回最佳匹配项（优先 movie_code 精确匹配）
async function fetchVodFromApi(code) {
  const url = `${VOD_API_BASE}?ac=detail&wd=${encodeURIComponent(code)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error('API请求失败: ' + resp.status);
  const data = await resp.json();

  let items = [];
  if (Array.isArray(data)) {
    items = data;
  } else if (data.list && Array.isArray(data.list)) {
    items = data.list;
  } else if (data.movie_code || data.name) {
    items = [data];
  }

  if (items.length === 0) return null;

  const upperCode = code.toUpperCase();
  // 优先精确匹配 movie_code
  let best = items.find(it => (it.movie_code || '').toUpperCase() === upperCode);
  // 其次 slug 精确匹配
  if (!best) best = items.find(it => (it.slug || '').toUpperCase() === upperCode);
  // 最后取第一项
  if (!best) best = items[0];

  return best;
}

// 将 API 返回的单条数据解析为作品字段对象
function parseApiItemToVideoData(item, fallbackCode) {
  const code = (item.movie_code || item.slug || fallbackCode || '').trim().toUpperCase();

  let title = (item.name || item.origin_name || '').trim();
  if (title.toUpperCase().startsWith(code)) {
    title = title.substring(code.length).replace(/^[\s|\-]+/, '').trim();
  }
  if (!title) title = code;

  const actors = Array.isArray(item.actor) ? item.actor.map(a => a.trim()).filter(Boolean) : [];
  // 应用名称替换映射（英文 → 自定义名）
  const mappedActors = actors.map(a => DB.applyNameMapping(a));
  // 去重：多个原名可能映射到同一个替换名（如 Suzumura Airi 和 Airi Suzumura）
  const _seen = new Set();
  const uniqueActors = mappedActors.filter(a => {
    const key = a.toLowerCase();
    if (_seen.has(key)) return false;
    _seen.add(key);
    return true;
  });
  // 多演员时归类到"合集"，单演员正常显示
  const actressesStr = uniqueActors.length > 1 ? '合集' : (uniqueActors.length === 1 ? uniqueActors[0] : '');

  const categories = Array.isArray(item.category) ? item.category.filter(Boolean) : [];
  const tagStr = (item.tag ? [item.tag] : []).concat(categories).join(',');

  const coverUrl = (item.poster_url || item.thumb_url || '').trim();

  let playLink = '';
  if (item.episodes && item.episodes.server_data) {
    const sd = item.episodes.server_data;
    for (const key in sd) {
      if (sd[key] && sd[key].link_embed) {
        playLink = sd[key].link_embed;
        break;
      }
    }
  }

  let date = '';
  if (item.vod_pubdate) {
    const parsed = new Date(item.vod_pubdate);
    if (!isNaN(parsed)) {
      date = parsed.toISOString().slice(0, 10);
    }
  }

  return {
    code,
    title,
    actresses: actressesStr,
    studio: '',
    year: (item.year || '').toString().trim(),
    date,
    duration: (item.time || '').trim(),
    quality: (item.quality || '').trim(),
    tags: tagStr,
    coverUrl,
    playLink,
    description: (item.description || '').trim(),
    note: '',
    cover: ''
  };
}

// 单个作品表单：点击「API获取」按钮后调 API 填充表单
async function fetchAndFillVideoForm() {
  const codeInput = document.getElementById('video-code');
  let code = codeInput.value.trim();
  if (!code) {
    showToast('请先输入番号', 'error');
    return;
  }
  code = normalizeVideoCode(code);
  codeInput.value = code;

  els.btnApiFetch.disabled = true;
  els.btnApiFetch.textContent = '查询中...';
  try {
    const item = await fetchVodFromApi(code);
    if (!item) {
      showToast('未找到该番号的信息', 'error');
      return;
    }

    const data = parseApiItemToVideoData(item, code);

    // 全字段覆盖：先清空上一次查询残留的字段，再完整载入新 API 数据（番号与备注保留）
    const fields = [
      ['video-title', 'title'],
      ['video-actresses', 'actresses'],
      ['video-studio', 'studio'],
      ['video-year', 'year'],
      ['video-date', 'date'],
      ['video-duration', 'duration'],
      ['video-quality', 'quality'],
      ['video-tags', 'tags'],
      ['video-cover-url', 'coverUrl'],
      ['video-playlink', 'playLink'],
      ['video-description', 'description']
    ];
    fields.forEach(([elId, key]) => {
      const el = document.getElementById(elId);
      if (el) el.value = data[key] || '';
    });

    // 封面预览：清空旧预览后加载新封面
    const coverPreview = document.getElementById('video-cover-preview');
    coverPreview.innerHTML = data.coverUrl
      ? `<img src="${data.coverUrl}" alt="封面预览">`
      : '';

    showToast('API数据已载入（覆盖原字段）', 'success');
  } catch (err) {
    showToast('API获取失败: ' + err.message, 'error');
  } finally {
    els.btnApiFetch.disabled = false;
    els.btnApiFetch.textContent = 'API获取';
  }
}

// ==================== 打卡功能 ====================
function initCheckinPage() {
  const now = new Date();
  checkinViewYear = now.getFullYear();
  checkinViewMonth = now.getMonth();
  updateCheckinTopCards();
  renderCheckinCalendar();
}

function updateCheckinTopCards() {
  const stats = DB.getCheckinStats();
  els.checkinTotal.textContent = stats.total;
  els.checkinMonthCount.textContent = stats.thisMonth;
}

function formatDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function renderCheckinCalendar() {
  const stats = DB.getCheckinStats();
  const now = new Date();
  const todayStr = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());

  els.checkinYearBtn.textContent = `${checkinViewYear}年`;
  els.checkinMonthBtn.textContent = `${checkinViewMonth + 1}月`;
  els.checkinYearList.style.display = 'none';
  els.checkinMonthList.style.display = 'none';

  const firstDay = new Date(checkinViewYear, checkinViewMonth, 1);
  const lastDay = new Date(checkinViewYear, checkinViewMonth + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // 本月打卡天数
  let monthCount = 0;
  Object.keys(stats.byDate).forEach(date => {
    const d = new Date(date);
    if (d.getFullYear() === checkinViewYear && d.getMonth() === checkinViewMonth) monthCount++;
  });

  els.checkinTotal.textContent = stats.total;
  els.checkinMonthCount.textContent = monthCount;

  let html = '';
  // 空白格
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="checkin-day empty"></div>';
  }
  // 日期格
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDateStr(checkinViewYear, checkinViewMonth, day);
    const count = stats.byDate[dateStr] || 0;
    const isToday = dateStr === todayStr;
    const cls = `checkin-day${count > 0 ? ' has-checkin' : ''}${isToday ? ' is-today' : ''}`;
    html += `<div class="${cls}" data-date="${dateStr}">
      <span class="checkin-day-num">${day}</span>
      ${count > 0 ? `<span class="checkin-day-count">${count}</span>` : ''}
    </div>`;
  }
  els.checkinCalendarGrid.innerHTML = html;

  // 绑定点击和长按
  els.checkinCalendarGrid.querySelectorAll('.checkin-day:not(.empty)').forEach(el => {
    const dateStr = el.dataset.date;
    let longPressTimer = null;

    el.addEventListener('click', () => {
      if (longPressTimer) return; // 长按触发了，忽略click
      openCheckinModal(dateStr);
    });

    el.addEventListener('touchstart', () => {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        handleCheckinLongPress(dateStr);
      }, 600);
    });
    el.addEventListener('touchend', () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });
    el.addEventListener('touchmove', () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });
    // 鼠标长按
    el.addEventListener('mousedown', () => {
      longPressTimer = setTimeout(() => {
        longPressTimer = null;
        handleCheckinLongPress(dateStr);
      }, 600);
    });
    el.addEventListener('mouseup', () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });
    el.addEventListener('mouseleave', () => {
      if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });
  });
}

// 年份/月份选择器
function toggleYearPicker() {
  const isOpen = els.checkinYearList.style.display === 'block';
  els.checkinMonthList.style.display = 'none';
  if (isOpen) {
    els.checkinYearList.style.display = 'none';
    return;
  }
  // 生成年份列表：当前年份前后5年
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = [];
  for (let y = currentYear - 5; y <= currentYear + 5; y++) years.push(y);

  els.checkinYearList.innerHTML = years.map(y =>
    `<div class="checkin-picker-item ${y === checkinViewYear ? 'active' : ''}" data-year="${y}">${y}年</div>`
  ).join('');
  els.checkinYearList.style.display = 'block';

  els.checkinYearList.querySelectorAll('.checkin-picker-item').forEach(el => {
    el.addEventListener('click', () => {
      checkinViewYear = parseInt(el.dataset.year);
      renderCheckinCalendar();
    });
  });
}

function toggleMonthPicker() {
  const isOpen = els.checkinMonthList.style.display === 'block';
  els.checkinYearList.style.display = 'none';
  if (isOpen) {
    els.checkinMonthList.style.display = 'none';
    return;
  }
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  els.checkinMonthList.innerHTML = monthNames.map((m, i) =>
    `<div class="checkin-picker-item ${i === checkinViewMonth ? 'active' : ''}" data-month="${i}">${m}</div>`
  ).join('');
  els.checkinMonthList.style.display = 'block';

  els.checkinMonthList.querySelectorAll('.checkin-picker-item').forEach(el => {
    el.addEventListener('click', () => {
      checkinViewMonth = parseInt(el.dataset.month);
      renderCheckinCalendar();
    });
  });
}

function openCheckinModal(dateStr) {
  checkinCurrentDate = dateStr;
  checkinPendingEntries = [];
  els.checkinModalTitle.textContent = '添加打卡';

  els.checkinSearchInput.value = '';
  els.checkinSuggestList.innerHTML = '';
  els.checkinNoMatch.style.display = 'none';
  els.checkinLinkedHint.textContent = '';
  renderPendingList();

  els.checkinNote.value = '';
  renderCheckinExisting(dateStr);
  openModal(els.checkinModal);
}

// 构建合并条目列表：作品「番号 (演员名)」 + 女优「演员名」
function buildCheckinEntryList() {
  const list = [];
  DB.getVideos().forEach(v => {
    const code = v.code || '';
    const actresses = v.actresses || '';
    list.push({
      type: 'work',
      id: v.id,
      code,
      actress: actresses,
      name: code + (actresses ? ` (${actresses})` : ''),
      search: (code + ' ' + (v.title || '') + ' ' + actresses).toLowerCase(),
      createdAt: v.createdAt || ''
    });
  });
  DB.getActresses().forEach(a => {
    const display = DB.applyNameMapping(a.name);
    list.push({
      type: 'actress',
      id: a.id,
      code: '',
      actress: display,
      name: display,
      search: (a.name + ' ' + (a.alias || '') + ' ' + display).toLowerCase(),
      createdAt: a.createdAt || ''
    });
  });
  return list;
}

// 上半区：本地条目匹配列表；下半区：自定义新建条目区
function renderCheckinSuggestions() {
  const query = els.checkinSearchInput.value.trim().toLowerCase();
  const listEl = els.checkinSuggestList;
  const allEntries = buildCheckinEntryList();

  let matched;
  if (query) {
    matched = allEntries.filter(e => e.search.includes(query));
  } else {
    // 无输入：最近条目按最近添加的作品倒序排列
    matched = allEntries
      .map((e, i) => ({ e, i }))
      .sort((x, y) => {
        const xt = x.e.createdAt || '';
        const yt = y.e.createdAt || '';
        if (xt !== yt) return xt > yt ? -1 : 1;
        if (x.e.type !== y.e.type) return x.e.type === 'work' ? -1 : 1;
        return x.i - y.i;
      })
      .map(p => p.e);
  }
  matched = matched.slice(0, 12);

  listEl.innerHTML = '';
  if (matched.length > 0) {
    const header = document.createElement('div');
    header.className = 'checkin-suggest-header';
    header.textContent = query ? `本地条目（${matched.length}）` : '最近条目';
    listEl.appendChild(header);
    matched.forEach(e => {
      const item = document.createElement('div');
      item.className = 'checkin-suggest-item';
      item.innerHTML = `<span class="checkin-suggest-type">${e.type === 'work' ? '作品' : '女优'}</span><span class="checkin-suggest-name">${escapeHtml(e.name)}</span>`;
      item.addEventListener('click', () => selectCheckinEntry(e));
      listEl.appendChild(item);
    });
  }

  // 无匹配提示
  els.checkinNoMatch.style.display = (query && matched.length === 0) ? 'block' : 'none';

  renderCheckinLinkedHint();
}

// 点击本地条目 → 临时勾选加入待提交列表（不立即保存）
function selectCheckinEntry(entry) {
  if (!checkinPendingEntries.some(p => p.type === entry.type && p.id === entry.id)) {
    checkinPendingEntries.push({ ...entry });
    showToast(`已勾选：${entry.name}`, 'info', 1200);
  } else {
    showToast('该条目已在勾选列表中', 'info', 1200);
  }
  // 清空搜索框，方便连续添加
  els.checkinSearchInput.value = '';
  els.checkinSuggestList.innerHTML = '';
  els.checkinNoMatch.style.display = 'none';
  els.checkinLinkedHint.textContent = '';
  renderPendingList();
}

// 渲染待提交勾选列表
function renderPendingList() {
  const group = els.checkinPendingGroup;
  const list = els.checkinPendingList;
  if (!group || !list) return;
  if (checkinPendingEntries.length === 0) {
    group.style.display = 'none';
    list.innerHTML = '';
    return;
  }
  group.style.display = 'block';
  list.innerHTML = '';
  checkinPendingEntries.forEach((entry, idx) => {
    const chip = document.createElement('div');
    chip.className = 'checkin-pending-item';
    const typeLabel = entry.type === 'work' ? '作品' : entry.type === 'actress' ? '女优' : '自定义';
    chip.innerHTML = `
      <span class="checkin-pending-type">${typeLabel}</span>
      <span class="checkin-pending-name">${escapeHtml(entry.name)}</span>
      <button class="checkin-pending-remove" data-idx="${idx}" aria-label="移除">×</button>
    `;
    chip.querySelector('.checkin-pending-remove').addEventListener('click', () => {
      checkinPendingEntries.splice(idx, 1);
      renderPendingList();
    });
    list.appendChild(chip);
  });
}

// 清空全部勾选
function clearCheckinPending() {
  if (checkinPendingEntries.length === 0) {
    showToast('当前没有勾选的条目', 'info');
    return;
  }
  showConfirmDialog({
    title: '清空勾选',
    message: `清空已勾选的 ${checkinPendingEntries.length} 个条目？`,
    confirmText: '清空'
  }).then(ok => {
    if (!ok) return;
    checkinPendingEntries = [];
    renderPendingList();
    showToast('已清空勾选', 'success');
  });
}

// 输入框下方的关联提示：本地作品→关联女优；本地女优→其作品
function renderCheckinLinkedHint() {
  const hintEl = els.checkinLinkedHint;
  const text = els.checkinSearchInput.value.trim();
  if (!text) { hintEl.textContent = ''; return; }

  // 兼容「番号 (演员名)」格式：解析出番号再匹配本地作品
  const parsed = parseCustomEntry(text);
  const video = parsed.code
    ? DB.getVideos().find(v => (v.code || '').toLowerCase() === parsed.code.toLowerCase())
    : null;
  if (video && video.actresses) {
    hintEl.textContent = `将同时关联女优：${video.actresses}`;
    return;
  }

  const actress = DB.getActresses().find(a =>
    DB.applyNameMapping(a.name).toLowerCase() === text.toLowerCase() ||
    (a.name || '').toLowerCase() === text.toLowerCase()
  );
  if (actress) {
    const allNames = getActressAllNamesCached(actress).map(n => n.toLowerCase());
    const works = DB.getVideos()
      .filter(v => v.actresses && v.actresses.split(',').map(n => n.trim().toLowerCase()).some(n => allNames.includes(n)))
      .slice(0, 5);
    if (works.length > 0) {
      hintEl.innerHTML = '该女优作品：' + works.map(v =>
        `<a href="javascript:void(0)" data-code="${escapeHtml(v.code)}">${escapeHtml(v.code)}</a>`
      ).join(' ');
      hintEl.querySelectorAll('a[data-code]').forEach(a => a.addEventListener('click', () => {
        els.checkinSearchInput.value = a.dataset.code;
        renderCheckinSuggestions();
      }));
      return;
    }
  }
  hintEl.textContent = '';
}

// 解析搜索文本中的番号/女优名（仅用于本地关联提示，不再创建自定义条目）
function parseCustomEntry(text) {
  text = text.trim();
  let m = text.match(/^([A-Za-z0-9-]+)\s*[（(](.+)[)）]\s*$/);
  if (m) {
    return {
      code: normalizeVideoCode(m[1]),
      actress: m[2].split(/[,，]/).map(s => s.trim()).filter(Boolean).join(',')
    };
  }
  if (/^[A-Za-z0-9-]+$/.test(text)) {
    return { code: normalizeVideoCode(text), actress: '' };
  }
  return { code: '', actress: text };
}

// 一键提交打卡
function doCheckin() {
  if (!checkinCurrentDate) return;
  const finalPending = checkinPendingEntries;

  // 提交二次确认（统一自定义弹窗）
  const confirmMsg = finalPending.length === 0
    ? `确认在 ${checkinCurrentDate} 添加打卡记录？（未选择条目，仅记录日期${els.checkinNote.value.trim() ? '与备注' : ''}）`
    : `确认在 ${checkinCurrentDate} 添加 ${finalPending.length} 条打卡记录？`;
  showConfirmDialog({
    title: '确认打卡',
    message: confirmMsg,
    confirmText: '确认'
  }).then(ok => {
    if (!ok) return;
    commitCheckin(finalPending);
  });
}

// 批量写入打卡记录（确认弹窗通过后执行）
function commitCheckin(finalPending) {
  const note = els.checkinNote.value.trim();
  if (finalPending.length === 0) {
    // 无条目打卡：仅记录日期与备注
    DB.addCheckin({
      date: checkinCurrentDate,
      targetType: 'none',
      targetId: '',
      targetName: '',
      targetCode: '',
      targetActress: '',
      note
    });
    showToast('已打卡（无条目）', 'success');
  } else {
    finalPending.forEach(entry => {
      let record;
      if (entry.type === 'work') {
        const video = DB.getVideo(entry.id);
        record = {
          targetType: 'work',
          targetId: entry.id,
          targetName: entry.name,
          targetCode: entry.code,
          targetActress: video && video.actresses ? video.actresses : entry.actress
        };
      } else if (entry.type === 'actress') {
        record = {
          targetType: 'actress',
          targetId: entry.id,
          targetName: entry.name,
          targetCode: '',
          targetActress: entry.name
        };
      }
      DB.addCheckin({
        date: checkinCurrentDate,
        targetType: record.targetType,
        targetId: record.targetId,
        targetName: record.targetName,
        targetCode: record.targetCode,
        targetActress: record.targetActress,
        note
      });
    });
    checkinPendingEntries = [];
    renderPendingList();
    showToast(`已提交 ${finalPending.length} 条打卡记录`, 'success');
  }
  renderCheckinCalendar();
  updateCheckinTopCards();
  renderCheckinExisting(checkinCurrentDate);
  updateDetailCheckinCount();
  els.checkinNote.value = '';
}

function renderCheckinExisting(dateStr) {
  const records = DB.getCheckinsByDate(dateStr);
  if (records.length === 0) {
    els.checkinExistingList.innerHTML = '<p class="checkin-empty">今日暂无打卡记录</p>';
    return;
  }
  els.checkinExistingList.innerHTML = '<h4 class="checkin-existing-title">今日打卡记录</h4>';
  records.forEach(r => {
    const rec = DB.normalizeCheckinRecord(r);
    const typeLabel = rec.type === 'actress' ? '女优' : rec.type === 'work' ? '作品' : (r.targetType === 'none' || !rec.name) ? '无条目' : '自定义';
    // 打卡时间：HH:mm（24 小时制，精确到分钟）；旧记录无 createdAt 时不显示
    const cd = r.createdAt ? new Date(r.createdAt) : null;
    const timeStr = cd && !isNaN(cd.getTime())
      ? `${String(cd.getHours()).padStart(2, '0')}:${String(cd.getMinutes()).padStart(2, '0')}`
      : '';
    const item = document.createElement('div');
    item.className = 'checkin-existing-item';
    item.innerHTML = `
      <div class="checkin-existing-info">
        <span class="checkin-existing-type">${typeLabel}</span>
        ${rec.name ? `<span class="checkin-existing-name">${escapeHtml(rec.name)}</span>` : ''}
        ${r.note ? `<span class="checkin-existing-note">${escapeHtml(r.note)}</span>` : ''}
      </div>
      ${timeStr ? `<span class="checkin-existing-time">${timeStr}</span>` : ''}
      <button class="btn-delete btn-sm" data-id="${r.id}">删除</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      deleteCheckin(r.id);
    });
    els.checkinExistingList.appendChild(item);
  });
}

function deleteCheckin(id) {
  showConfirmDialog({
    title: '删除打卡',
    message: '确认删除这条打卡记录？',
    confirmText: '删除'
  }).then(ok => {
    if (!ok) return;
    DB.deleteCheckin(id);
    showToast('已删除', 'success');
    renderCheckinCalendar();
    updateCheckinTopCards();
    renderCheckinExisting(checkinCurrentDate);
    updateDetailCheckinCount();
  });
}

function handleCheckinLongPress(dateStr) {
  const records = DB.getCheckinsByDate(dateStr);
  if (records.length === 0) {
    showToast('该日期无打卡记录', 'error');
    return;
  }
  showConfirmDialog({
    title: '删除打卡',
    message: `确认删除 ${dateStr} 的所有打卡记录（共 ${records.length} 条）？`,
    confirmText: '删除'
  }).then(ok => {
    if (!ok) return;
    records.forEach(r => DB.deleteCheckin(r.id));
    showToast('已删除该日期所有打卡', 'success');
    renderCheckinCalendar();
    updateCheckinTopCards();
    updateDetailCheckinCount();
  });
}
// ==================== 统计分析 ====================
// ==================== 打卡热力图（年度打卡分布） ====================
// 颜色分级：0=无 1=较少 … 4=最多（按当年打卡最多一天为基准）
function buildCheckinHeatmap(byDate) {
  const years = Object.keys(byDate).map(k => parseInt(k.split('-')[0], 10)).filter(n => n > 0);
  const uniq = [...new Set(years)].sort((a, b) => a - b);
  if (!uniq.length) return '<div class="stats-empty">暂无打卡数据</div>';
  return uniq.map(y => buildHeatmapYearBlock(byDate, y)).join('');
}

function buildHeatmapYearBlock(byDate, year) {
  const counts = Object.values(byDate);
  const maxCount = counts.length ? Math.max.apply(null, counts) : 1;
  const start = new Date(year, 0, 1);
  const startDow = start.getDay(); // 0=周日
  const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  const cols = Math.ceil((startDow + totalDays) / 7);

  // 顶部月份标签（每列等宽，允许向右溢出）
  let labels = '';
  for (let m = 0; m < 12; m++) {
    const dayNumber = Math.round((new Date(year, m, 1) - start) / 86400000);
    const col = Math.floor((startDow + dayNumber) / 7);
    labels += `<span style="grid-column:${col + 1}">${m + 1}月</span>`;
  }

  // 7 行（周）的格子，按列(周)填充
  let cells = '';
  const total = cols * 7;
  for (let i = 0; i < total; i++) {
    const day = i - startDow;
    if (day < 0 || day >= totalDays) {
      cells += '<span class="heatmap-cell empty"></span>';
      continue;
    }
    const d = new Date(year, 0, 1);
    d.setDate(d.getDate() + day);
    const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const count = byDate[key] || 0;
    const lvl = count === 0 ? 0
      : (count >= Math.ceil(maxCount * 0.85) ? 4
      : (count >= Math.ceil(maxCount * 0.55) ? 3
      : (count >= Math.ceil(maxCount * 0.28) ? 2 : 1)));
    cells += `<span class="heatmap-cell" data-lvl="${lvl}" data-date="${key}" data-count="${count}" title="${key}${count ? ' · ' + count + ' 次打卡' : ''}"></span>`;
  }

  return `
    <div class="heatmap-block">
      <div class="heatmap-year">${year}年</div>
      <div class="heatmap-wrap" style="--heat-cols:${cols}">
        <div class="heatmap-labels">${labels}</div>
        <div class="heatmap-grid">${cells}</div>
      </div>
    </div>`;
}

function openStatsPage() {
  showPage('page-stats');
}

function renderStatsPage() {
  const allCheckins = DB.getCheckins();

  // 1. 打卡极值计算
  const totalCount = allCheckins.length;
  const byDate = {};
  const byMonth = {};
  allCheckins.forEach(c => {
    const date = c.date;
    byDate[date] = (byDate[date] || 0) + 1;
    const [y, m] = date.split('-');
    const key = `${y}-${m}`;
    byMonth[key] = (byMonth[key] || 0) + 1;
  });

  const { streak: currentStreak } = recalcCheckinStreak(byDate);
  const bestStreak = calcBestCheckinStreak(byDate);
  const peakMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0];
  const peakMonthLabel = peakMonth ? `${parseInt(peakMonth[0].split('-')[0])}年${parseInt(peakMonth[0].split('-')[1])}月` : '—';
  const peakMonthCount = peakMonth ? peakMonth[1] : 0;

  // 2. 12个月数据
  const currentYear = new Date().getFullYear();
  const months = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${currentYear}-${String(m).padStart(2, '0')}`;
    months.push({ m, label: `${m}月`, count: byMonth[key] || 0 });
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1);

  // 3. 女优打卡排行
  const counts = {};
  allCheckins.forEach(c => {
    const rec = DB.normalizeCheckinRecord(c);
    if (rec.type === 'actress') {
      const n = rec.actress || rec.name;
      if (n) counts[n] = (counts[n] || 0) + 1;
    } else if (rec.type === 'work' && rec.actress) {
      rec.actress.split(',').forEach(n => {
        const t = n.trim();
        if (t) counts[t] = (counts[t] || 0) + 1;
      });
    }
  });
  const actressList = Object.entries(counts)
    .map(([name, cnt]) => ({ displayName: DB.applyNameMapping(name), count: cnt }))
    .sort((a, b) => b.count - a.count);

  // 渲染
  let html = '';

  // 4 卡片 2×2 布局
  html += `<div class="stats-extremes">
    <div class="stats-extreme-card">
      <div class="stats-extreme-value">${totalCount}</div>
      <div class="stats-extreme-label">累计打卡</div>
    </div>
    <div class="stats-extreme-card">
      <div class="stats-extreme-value">${currentStreak}</div>
      <div class="stats-extreme-label">连续打卡</div>
    </div>
    <div class="stats-extreme-card">
      <div class="stats-extreme-value">${bestStreak}</div>
      <div class="stats-extreme-label">最高连续</div>
    </div>
    <div class="stats-extreme-card">
      <div class="stats-extreme-value">${peakMonthLabel}</div>
      <div class="stats-extreme-label">最多月份</div>
      <div class="stats-extreme-sub">${peakMonthCount} 次</div>
    </div>
  </div>`;

  // 打卡热力图
  html += '<div class="stats-section"><h3 class="stats-section-title">打卡热力图</h3>';
  html += buildCheckinHeatmap(byDate);
  html += `<div class="heatmap-legend">
    <span class="hl-label">少</span>
    <span class="heatmap-cell hc-lg" data-lvl="0"></span>
    <span class="heatmap-cell hc-lg" data-lvl="1"></span>
    <span class="heatmap-cell hc-lg" data-lvl="2"></span>
    <span class="heatmap-cell hc-lg" data-lvl="3"></span>
    <span class="heatmap-cell hc-lg" data-lvl="4"></span>
    <span class="hl-label">多</span>
  </div></div>`;

  // 月度柱状图
  html += '<div class="stats-section"><h3 class="stats-section-title">月度打卡</h3>';
  html += '<div class="stats-monthly-chart">';
  months.forEach(({ label, count }) => {
    const isPeak = count > 0 && count === maxMonthCount;
    const barH = maxMonthCount > 0 ? Math.round(count / maxMonthCount * 80) : 0;
    const barStyle = count > 0
      ? `height:${Math.max(barH, 4)}px`
      : 'height:0;padding-top:0;opacity:0';
    html += `<div class="stats-monthly-bar${isPeak ? ' stats-monthly-peak' : ''}">
      <div class="stats-monthly-bar-fill" style="${barStyle}">${count > 0 ? count : ''}</div>
      <div class="stats-monthly-bar-label">${label}</div>
    </div>`;
  });
  html += '</div></div>';

  // 女优打卡排行
  html += '<div class="stats-section"><h3 class="stats-section-title">女优排行</h3>';
  if (actressList.length === 0) {
    html += '<div class="stats-empty">暂无打卡数据</div>';
  } else {
    const maxA = actressList[0].count;
    html += '<div class="stats-actress-list">';
    actressList.forEach(({ displayName, count }) => {
      const pct = (count / maxA * 100).toFixed(1);
      html += `<div class="stats-actress-row">
        <span class="stats-actress-name">${escapeHtml(displayName)}</span>
        <span class="stats-actress-count">${count}次</span>
        <div class="stats-actress-bar"><div class="stats-actress-bar-fill" style="width:${pct}%"></div></div>
      </div>`;
    });
    html += '</div>';
  }
  html += '</div>';

  els.statsPageContent.innerHTML = html;

  // 热力图格子点击：显示该天的打卡日期与次数（触屏友好，title 提示在移动端不生效）
  const hCells = els.statsPageContent.querySelectorAll('.heatmap-cell[data-date]');
  for (let i = 0; i < hCells.length; i++) {
    hCells[i].addEventListener('click', function() {
      const date = this.dataset.date;
      const count = this.dataset.count;
      showToast(date + (count && count !== '0' ? ` · ${count} 次打卡` : ' · 无打卡'), '', 2500);
    });
  }

  // 同步刷新打卡搜索结果（保留搜索词，数据变更后保持结果最新）
  renderCheckinSearch();
}

// ==================== 打卡记录搜索（统计页） ====================
// 按番号/女优搜索打卡记录：按条目分组展示打卡次数与具体日期，便于对比
function renderCheckinSearch() {
  const query = els.searchInputCheckin.value.trim().toLowerCase();
  const hasQuery = query.length > 0;
  els.searchClearCheckin.classList.toggle('show', hasQuery);

  if (!hasQuery) {
    // 无搜索词：显示常规统计内容
    els.searchCountCheckin.textContent = '';
    els.statsSearchResults.style.display = 'none';
    els.statsSearchResults.innerHTML = '';
    els.statsPageContent.style.display = '';
    return;
  }

  // 搜索时聚焦结果，隐藏常规统计内容
  els.statsPageContent.style.display = 'none';
  els.statsSearchResults.style.display = '';

  // 番号匹配忽略大小写与连字符（IPX-536 / ipx536 均可命中）
  const normCode = s => (s || '').toLowerCase().replace(/[\s\-]/g, '');
  const qNorm = normCode(query);

  const matched = DB.getCheckins().filter(c => {
    const rec = DB.normalizeCheckinRecord(c);
    // 番号匹配（新旧格式记录的 code 均覆盖）
    if (rec.code && (rec.code.toLowerCase().includes(query) || normCode(rec.code).includes(qNorm))) return true;
    // 条目名匹配（自定义/旧格式记录）
    if (rec.name && rec.name.toLowerCase().includes(query)) return true;
    // 女优匹配：原始名与替换后的显示名都参与（如 Kana Momonogi / 桃乃木香奈）
    const names = (rec.actress || '').split(',');
    for (let i = 0; i < names.length; i++) {
      const t = names[i].trim();
      if (!t) continue;
      if (t.toLowerCase().includes(query)) return true;
      const disp = DB.applyNameMapping(t);
      if (disp && disp.toLowerCase().includes(query)) return true;
    }
    return false;
  });

  if (matched.length === 0) {
    els.searchCountCheckin.textContent = '0 条记录';
    els.statsSearchResults.innerHTML = '<div class="stats-empty">无匹配的打卡记录</div>';
    return;
  }

  // 按条目分组（作品按番号、女优按名、自定义按名），统计打卡次数与日期
  const groups = new Map();
  matched.forEach(c => {
    const rec = DB.normalizeCheckinRecord(c);
    let key, badge, badgeCls, title, sub = '';
    if (rec.type === 'work') {
      key = 'w:' + (rec.code || rec.name || 'unknown');
      badge = '作品';
      badgeCls = 'work';
      title = rec.code || rec.name;
      if (rec.actress) sub = DB.applyNameMappingsToActresses(rec.actress);
    } else if (rec.type === 'actress') {
      key = 'a:' + rec.name;
      badge = '女优';
      badgeCls = 'actress';
      title = DB.applyNameMapping(rec.name);
    } else {
      key = 'c:' + rec.name;
      badge = '自定义';
      badgeCls = 'custom';
      title = rec.name || '（无条目）';
    }
    if (!groups.has(key)) {
      groups.set(key, { badge, badgeCls, title, sub, count: 0, entries: [], latest: '' });
    }
    const g = groups.get(key);
    g.count++;
    g.entries.push(c);
    if ((c.date || '') > g.latest) g.latest = c.date || '';
  });

  // 组排序：打卡次数多的在前，次数相同时最近打卡的在前
  const groupList = [...groups.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (b.latest || '').localeCompare(a.latest || '');
  });

  els.searchCountCheckin.textContent = `${matched.length} 条记录 · ${groupList.length} 个条目`;

  let html = '';
  groupList.forEach(g => {
    // 组内日期降序（最近的打卡在最前）
    const entries = [...g.entries].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    html += `<div class="checkin-result-group">
      <div class="checkin-result-head">
        <span class="checkin-result-badge ${g.badgeCls}">${g.badge}</span>
        <span class="checkin-result-title">${escapeHtml(g.title)}</span>
        ${g.sub ? `<span class="checkin-result-sub">${escapeHtml(g.sub)}</span>` : ''}
        <span class="checkin-result-count">${g.count} 次</span>
      </div>
      <div class="checkin-result-dates">
        ${entries.map(c => `<div class="checkin-result-date">
          <span class="checkin-result-day">${escapeHtml(c.date || '未知日期')}</span>
          ${c.note ? `<span class="checkin-result-note">${escapeHtml(c.note)}</span>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  });
  els.statsSearchResults.innerHTML = html;
}

// 当前连续打卡天数（按日历逐日回溯，跨月安全）
function recalcCheckinStreak(byDate) {
  const today = new Date();
  let streak = 0;
  let cursor = new Date(today);
  while (true) {
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    if (byDate[ds]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && ds === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return { streak };
}

// 历史最高连续打卡天数
function calcBestCheckinStreak(byDate) {
  const sortedDates = Object.keys(byDate).sort();
  if (sortedDates.length === 0) return 0;
  let best = 0;
  let current = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
    const curr = new Date(sortedDates[i] + 'T00:00:00');
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best > 0 ? best : 1;
}

// ==================== 导入导出 ====================

// 显示/隐藏全局加载遮罩
function showGlobalLoading(text = '处理中...') {
  const overlay = document.getElementById('globalLoadingOverlay');
  const textEl = document.getElementById('globalLoadingText');
  if (textEl) textEl.textContent = text;
  if (overlay) overlay.classList.add('show');
}

function hideGlobalLoading() {
  const overlay = document.getElementById('globalLoadingOverlay');
  if (overlay) overlay.classList.remove('show');
}

async function exportData() {
  showGlobalLoading('正在导出...');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `avmanager_${dateStr}.json`;

  try {
    const data = await DB.exportData();
    const sites = getSites();
    const payload = { ...data, sites };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    await saveBlobToFile(blob, filename);
  } catch (err) {
    console.error('exportData error', err);
    showToast('导出失败: ' + err.message, 'error', 5000);
  } finally {
    hideGlobalLoading();
  }
}

// 导出作品列表为 TXT：按时间降序排列，每行格式「番号-女优名」
async function exportWorksTxt() {
  const videos = DB.getVideos();
  if (!videos.length) {
    showToast('暂无可导出的作品', 'info', 3000);
    return;
  }

  showGlobalLoading('正在导出作品...');

  try {
    // 与作品页列表顺序一致：添加时间优先，缺失时回退修改时间（getVideos 返回副本，可直接排序）
    const sorted = videos.sort((a, b) =>
      toTimestamp(b.createdAt || b.updatedAt) - toTimestamp(a.createdAt || a.updatedAt));

    const lines = sorted.map(v => {
      // 仅导出番号与女优：番号不使用标题（API 标题常为一整句描述性文字）
      const code = (v.code || '').trim();
      // 女优名：应用名称替换规则后的显示名（多个女优用逗号分隔）
      const actresses = DB.applyNameMappingsToActresses(v.actresses || '');
      if (!code && !actresses) return '';
      return code && actresses ? `${code}-${actresses}` : (code || actresses);
    }).filter(Boolean);

    // 加 UTF-8 BOM 并使用 CRLF 换行，保证 Windows 记事本等编辑器正确显示中文
    const blob = new Blob(['\ufeff' + lines.join('\r\n') + '\r\n'], { type: 'text/plain;charset=utf-8' });
    const dateStr = new Date().toISOString().slice(0, 10);
    await saveBlobToFile(blob, `avmanager_works_${dateStr}.txt`);
  } catch (err) {
    console.error('exportWorksTxt error', err);
    showToast('导出失败: ' + err.message, 'error', 5000);
  } finally {
    hideGlobalLoading();
  }
}

// 将 Blob 保存为文件：原生环境优先写入 Filesystem 各目录，均失败或非原生环境回退 WebView 下载
async function saveBlobToFile(blob, filename) {
  // 判断是否在原生 Capacitor App 中，且 Filesystem 插件已就绪
  const isNative = window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform();
  const hasFilesystem = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;

  if (isNative && hasFilesystem) {
    const Filesystem = window.Capacitor.Plugins.Filesystem;
    const base64 = await blobToBase64(blob);

    // 检查当前存储权限状态（Android 10 及以下 / 已授权所有文件访问时有用）
    let permissionGranted = false;
    try {
      const permResult = await withTimeout(
        Filesystem.checkPermissions(),
        3000,
        '检查存储权限超时'
      );
      permissionGranted = permResult && permResult.publicStorage === 'granted';
    } catch (permErr) {
      console.warn('检查存储权限失败', permErr);
    }

    // Android 11+ 优先使用无需权限的应用专属目录
    const attempts = [
      { dir: 'EXTERNAL', label: '应用外部存储' },
      { dir: 'DATA', label: '应用数据目录' },
      { dir: 'DOCUMENTS', label: 'Documents' }
    ];

    // 如果已有完整存储权限，再尝试根目录
    if (permissionGranted) {
      attempts.push({ dir: 'EXTERNAL_STORAGE', label: '内部存储根目录' });
    }

    const errors = [];
    for (const attempt of attempts) {
      try {
        await withTimeout(
          Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: attempt.dir,
            recursive: true
          }),
          10000,
          `${attempt.label}写入超时`
        );

        // 获取实际 URI 用于提示
        let displayPath = `${attempt.label}/${filename}`;
        try {
          const uriResult = await withTimeout(
            Filesystem.getUri({ path: filename, directory: attempt.dir }),
            3000,
            '获取文件路径超时'
          );
          if (uriResult && uriResult.uri) {
            displayPath = uriResult.uri;
          }
        } catch (uriErr) {
          console.warn('获取文件 URI 失败', uriErr);
        }

        showToast(`已导出：${displayPath}`, 'success', 5000);
        return;
      } catch (fsErr) {
        console.warn(`${attempt.label}写入失败`, fsErr);
        errors.push(`${attempt.label}: ${fsErr.message || fsErr}`);
      }
    }

    console.error('Filesystem 全部目录写入失败', errors);
    showToast('文件目录写入失败，尝试使用系统下载...', 'info', 3000);
    // 继续执行下方的通用下载回退
  }

  // 通用回退：触发浏览器/WebView 下载（兼容手机打包工具生成的 WebView APK）
  await fallbackDownload(blob, filename);
}

// 通用下载回退（在原生 WebView 中通常会调用系统下载管理器）
async function fallbackDownload(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`已导出 ${filename} 到下载目录`, 'success', 4000);
  } catch (dlErr) {
    console.error('下载回退也失败', dlErr);
    showToast('导出失败：' + dlErr.message, 'error', 5000);
  }
}

// 带超时的 Promise 包装
function withTimeout(promise, ms, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage || '操作超时'));
    }, ms);
    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Blob 转 base64（Capacitor Filesystem 需要 base64 写入二进制文件）
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function importData(e) {
  const file = e.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();

  showGlobalLoading('正在导入...');
  try {
    // 仅支持 JSON 文件
    if (!fileName.endsWith('.json')) {
      showToast('请选择 JSON 备份文件', 'error');
      e.target.value = '';
      return;
    }

    const jsonText = await file.text();
    const data = JSON.parse(jsonText);
    // 仅支持合并模式（保留现有数据）
    const result = await DB.importData(data, 'merge');
    // 导入站点导航列表
    if (data.sites) {
      saveSites(data.sites);
    }
    updateActressWorksCount();
    refreshCurrentPage();
    updateHomeStats();
    const avatarCount = data.actresses ? data.actresses.filter(a => a.avatar).length : 0;
    const coverCount = data.videos ? data.videos.filter(v => v.cover).length : 0;
    showToast(`导入成功：${result.videoCount} 部作品, ${result.actressCount} 位女优${avatarCount > 0 ? `, ${avatarCount} 个头像` : ''}${coverCount > 0 ? `, ${coverCount} 个封面` : ''}`, 'success');
  } catch (err) {
    showToast('导入失败: ' + err.message, 'error');
  } finally {
    hideGlobalLoading();
  }

  e.target.value = '';
}

// ==================== 名称替换管理 ====================
function openNameMappingModal() {
  els.mappingOriginal.value = '';
  els.mappingReplacement.value = '';
  renderNameMappingList();
  openModal(els.nameMappingModal);
}

function renderNameMappingList() {
  const mappings = DB.getNameMappings();
  // 更新设置页计数
  if (els.syncMappingCount) {
    els.syncMappingCount.textContent = `当前 ${mappings.length} 条替换规则`;
  }

  if (mappings.length === 0) {
    els.nameMappingList.innerHTML = '<div class="name-mapping-empty">暂无替换规则，请在上方添加</div>';
    return;
  }

  // 按原名字母排序
  mappings.sort((a, b) => a.original.localeCompare(b.original));

  els.nameMappingList.innerHTML = '';
  mappings.forEach(m => {
    const item = document.createElement('div');
    item.className = 'name-mapping-item';
    item.innerHTML = `
      <div class="name-mapping-text">
        <span class="name-mapping-original">${escapeHtml(m.original)}</span>
        <span class="name-mapping-arrow-inline">→</span>
        <span class="name-mapping-replacement">${escapeHtml(m.replacement)}</span>
      </div>
      <button class="btn-delete btn-sm" data-id="${m.id}">删除</button>
    `;
    item.querySelector('button').addEventListener('click', () => {
      DB.deleteNameMapping(m.id);
      // 映射变化会影响女优显示名与名称变体索引，需重建后再刷新列表
      updateActressWorksCount();
      refreshCurrentPage();
      renderNameMappingList();
      showToast('已删除替换规则', 'success');
    });
    els.nameMappingList.appendChild(item);
  });
}

function addNameMappingFromForm() {
  const original = els.mappingOriginal.value.trim();
  const replacement = els.mappingReplacement.value.trim();

  if (!original) {
    showToast('请输入原名', 'error');
    return;
  }
  if (!replacement) {
    showToast('请输入替换名', 'error');
    return;
  }
  // 原名支持逗号分隔多个，检查任意一个是否与替换名相同
  const originals = original.split(',').map(o => o.trim().toLowerCase()).filter(Boolean);
  if (originals.includes(replacement.toLowerCase())) {
    showToast('原名和替换名不能相同', 'error');
    return;
  }

  DB.addNameMapping(original, replacement);
  els.mappingOriginal.value = '';
  els.mappingReplacement.value = '';
  renderNameMappingList();
  els.mappingOriginal.focus();

  // 自动合并替换名相同的女优，并重建名称索引（映射变化会影响显示名与匹配结果）
  const mergedCount = DB.mergeActressesByReplacementName();
  updateActressWorksCount();
  refreshCurrentPage();
  updateHomeStats();
  if (mergedCount > 0) {
    showToast(`替换规则已添加，自动合并 ${mergedCount} 个重复女优`, 'success');
  } else {
    showToast('替换规则已添加', 'success');
  }
}

async function applyMappingsToExistingData() {
  const mappings = DB.getNameMappings();
  if (mappings.length === 0) {
    showToast('暂无替换规则，请先添加', 'error');
    return;
  }

  showConfirmDialog({
    title: '应用替换规则',
    message: `确定将 ${mappings.length} 条替换规则应用到所有已有作品数据吗？\n这将替换作品中女优名包含的英文名为自定义名，并自动合并替换名相同的女优。`
  }).then(ok => {
    if (!ok) return;
    const changed = DB.applyMappingsToAllVideos();

    // 按替换名合并女优（替换名相同的女优合并为一个）
    const mergedCount = DB.mergeActressesByReplacementName();

    updateActressWorksCount();
    refreshCurrentPage();
    updateHomeStats();
    showToast(`已应用替换规则，${changed} 部作品已更新${mergedCount > 0 ? '，合并 ' + mergedCount + ' 个重复女优' : ''}`, 'success');
  });
}

// 手动合并替换名相同的女优
function mergeActressesByReplacementNameHandler() {
  showConfirmDialog({
    title: '合并同名女优',
    message: '确定合并替换名相同的女优吗？\n替换名相同的女优将合并为一个，作品关联和打卡记录会自动迁移。',
    confirmText: '合并'
  }).then(ok => {
    if (!ok) return;
    const mergedCount = DB.mergeActressesByReplacementName();
    updateActressWorksCount();
    refreshCurrentPage();
    updateHomeStats();

    if (mergedCount > 0) {
      showToast(`已合并 ${mergedCount} 个重复女优`, 'success');
    } else {
      showToast('未发现替换名相同的女优，无需合并', 'info');
    }
  });
}

// ==================== WebDAV 云备份 ====================
const WEBDAV_CONFIG_KEY = 'jav_webdav_config';
const WEBDAV_DIR = 'avmanager/'; // 备份统一存放的云端目录

// 返回备份目录的完整 URL（保证以 / 结尾）
function webdavDir(cfg) {
  const base = (cfg && cfg.url ? cfg.url : '').replace(/\/+$/, '');
  return base + '/' + WEBDAV_DIR;
}

// 尝试在服务器上创建备份目录（MKCOL）；目录已存在时静默忽略
async function webdavEnsureDir() {
  const cfg = getWebdavConfig();
  if (!cfg || !cfg.url) throw new Error('未配置 WebDAV 服务器');
  try {
    await fetch(webdavDir(cfg), {
      method: 'MKCOL',
      headers: webdavHeaders('MKCOL') || {}
    });
  } catch (e) {
    // 网络等原因导致的 MKCOL 失败先不阻断，回调更明确
  }
}

function getWebdavConfig() {
  try {
    return JSON.parse(localStorage.getItem(WEBDAV_CONFIG_KEY)) || null;
  } catch {
    return null;
  }
}

function saveWebdavConfig() {
  const url = els.webdavUrl.value.trim();
  const username = els.webdavUser.value.trim();
  const password = els.webdavPass.value.trim();
  if (!url) {
    showToast('请输入服务器地址', 'error');
    return;
  }
  localStorage.setItem(WEBDAV_CONFIG_KEY, JSON.stringify({ url, username, password }));
  updateWebdavHint();
  showToast('WebDAV 配置已保存', 'success');
}

function loadWebdavConfigIntoForm() {
  const cfg = getWebdavConfig();
  if (!cfg) {
    updateWebdavHint();
    return;
  }
  els.webdavUrl.value = cfg.url || '';
  els.webdavUser.value = cfg.username || '';
  els.webdavPass.value = cfg.password || '';
  updateWebdavHint();
}

function updateWebdavHint() {
  if (!els.webdavHint) return;
  const cfg = getWebdavConfig();
  if (!cfg || !cfg.url) {
    els.webdavHint.textContent = '未配置。请先填写服务器地址、用户名、密码并保存。';
    els.webdavHint.style.color = 'var(--text-secondary)';
  } else {
    els.webdavHint.textContent = `已配置：${cfg.url}`;
    els.webdavHint.style.color = 'var(--secondary)';
  }
}

// WebDAV 请求：构造 Authorization 头
function webdavHeaders(method, body) {
  const cfg = getWebdavConfig();
  if (!cfg) return null;
  const headers = {};
  if (method === 'PUT' && body) headers['Content-Type'] = 'application/json';
  if (cfg.username || cfg.password) {
    headers['Authorization'] = 'Basic ' + btoa(`${cfg.username}:${cfg.password}`);
  }
  return headers;
}

// 推送一条备份到 WebDAV：返回写入的文件名
async function webdavPutBackup() {
  const cfg = getWebdavConfig();
  if (!cfg || !cfg.url) throw new Error('未配置 WebDAV 服务器');

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `avmanager_${dateStr}.json`;

  const data = await DB.exportData();
  const sites = getSites();
  const payload = { ...data, sites };
  const json = JSON.stringify(payload, null, 2);

  await webdavEnsureDir();

  const url = webdavDir(cfg) + filename;
  const response = await fetch(url, {
    method: 'PUT',
    headers: webdavHeaders('PUT', json),
    body: json
  });
  if (!response.ok) {
    throw new Error(`上传失败（HTTP ${response.status}）`);
  }
  return filename;
}

// 测试 WebDAV 连接：校验服务器可访问、凭据正确，并确保备份目录可用
async function testWebdavConnection() {
  const cfg = getWebdavConfig();
  if (!cfg || !cfg.url) {
    showToast('请先填写并保存 WebDAV 配置', 'error');
    return;
  }
  showGlobalLoading('正在测试 WebDAV 连接...');
  try {
    // 用 PROPFIND 探测服务器与凭据
    const probeUrl = (cfg.url.replace(/\/+$/, '') + '/');
    const res = await withTimeout(
      fetch(probeUrl, { method: 'PROPFIND', headers: Object.assign(webdavHeaders('PROPFIND') || {}, { Depth: '1' }) }),
      15000, '连接超时'
    );
    if (res.status === 401 || res.status === 403) {
      showToast('连接失败：账号或密码错误（HTTP ' + res.status + '）', 'error', 4000);
      return;
    }
    if (!res.ok && !(res.status >= 200 && res.status < 300)) {
      showToast('连接失败：服务器返回 HTTP ' + res.status, 'error', 4000);
      return;
    }
    // 尝试确保备份目录存在
    await webdavEnsureDir();
    updateWebdavHint();
    showToast('连接成功，备份目录 avmanager/ 已就绪', 'success', 3500);
  } catch (err) {
    console.error('webdav test error', err);
    showToast('连接失败：' + (err.message || '无法访问服务器'), 'error', 5000);
  } finally {
    hideGlobalLoading();
  }
}

// 上传备份到 WebDAV
async function uploadBackupToWebdav() {
  showGlobalLoading('正在上传到 WebDAV...');
  try {
    const filename = await withTimeout(webdavPutBackup(), 30000, '上传超时');
    showToast(`已上传备份：${WEBDAV_DIR}${filename}`, 'success', 4000);
  } catch (err) {
    console.error('webdav upload error', err);
    const msg = err.message || '未知错误';
    showToast('上传失败: ' + msg, 'error', 5000);
  } finally {
    hideGlobalLoading();
  }
}

// 从 WebDAV 下载并恢复（合并模式）
async function restoreFromWebdav() {
  const cfg = getWebdavConfig();
  if (!cfg || !cfg.url) {
    showToast('未配置 WebDAV 服务器', 'error');
    return;
  }
  await showConfirmDialog({
    title: '从云端恢复',
    message: '将从 WebDAV 下载备份并以合并方式恢复（保留现有数据）。继续？',
    confirmText: '恢复'
  }).then(async ok => {
    if (!ok) return;
    showGlobalLoading('正在从 WebDAV 下载...');
    try {
      // 先列出服务器上该目录下的 avmanager 备份文件
      const files = await withTimeout(webdavListBackups(), 20000, '列目录超时');
      if (!files.length) {
        showToast('服务器上未找到备份文件', 'error');
        return;
      }
      const target = files[0];
      const res = await withTimeout(fetch(target.url, { method: 'GET', headers: webdavHeaders('GET') }), 30000, '下载超时');
      if (!res.ok) throw new Error(`下载失败（HTTP ${res.status}）`);
      const data = await res.json();
      const result = await DB.importData(data, 'merge');
      if (data.sites) saveSites(data.sites);
      updateActressWorksCount();
      refreshCurrentPage();
      updateHomeStats();
      const avatarCount = data.actresses ? data.actresses.filter(a => a.avatar).length : 0;
      const coverCount = data.videos ? data.videos.filter(v => v.cover).length : 0;
      showToast(`已从 ${target.name} 恢复：${result.videoCount} 部作品, ${result.actressCount} 位女优${avatarCount ? `, ${avatarCount} 个头像` : ''}${coverCount ? `, ${coverCount} 个封面` : ''}`, 'success', 5000);
    } catch (err) {
      console.error('webdav restore error', err);
      showToast('恢复失败: ' + (err.message || '未知错误'), 'error', 5000);
    } finally {
      hideGlobalLoading();
    }
  });
}

// 通过 PROPFIND 列出 WebDAV 备份目录下的 avmanager 备份文件（按修改时间降序）
async function webdavListBackups() {
  const cfg = getWebdavConfig();
  const url = webdavDir(cfg);
  // 发起 PROPFIND 深度为 1，解析返回 XML
  const res = await fetch(url, {
    method: 'PROPFIND',
    headers: Object.assign(webdavHeaders('PROPFIND') || {}, { Depth: '1' })
  });
  let xmlText = '';
  try { xmlText = await res.text(); } catch { xmlText = ''; }
  // 即使非 XML(如 207)，尝试解析
  const files = [];
  if (xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const responses = doc.getElementsByTagName('response');
    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const hrefEl = resp.getElementsByTagName('href')[0];
      if (!hrefEl) continue;
      let href = (hrefEl.textContent || '').trim();
      const lastEl = resp.getElementsByTagName('getlastmodified')[0];
      const last = lastEl ? (lastEl.textContent || '').trim() : '';
      const base = decodeURIComponent(href.split('/').pop() || '');
      if (base.indexOf('avmanager_') === 0 && base.endsWith('.json') && last) {
        const abs = new URL(href, cfg.url).href;
        files.push({ name: base, last, url: abs });
      }
    }
  }
  // 按最后修改时间降序
  files.sort((a, b) => new Date(b.last) - new Date(a.last));
  return files;
}

// ==================== Toast 提示 ====================
let _toastTimer = null;

function showToast(message, type = '', duration = 2500) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  // 取消上一条提示的隐藏定时器，避免连续提示时后一条被提前关闭
  if (_toastTimer) {
    clearTimeout(_toastTimer);
    _toastTimer = null;
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;

  void toast.offsetWidth;
  toast.classList.add('show');

  _toastTimer = setTimeout(() => {
    _toastTimer = null;
    toast.classList.remove('show');
  }, duration);
}

// ==================== 封面长按预览 ====================
let _longPressTimer = null;
let _longPressTriggered = false;
const LONG_PRESS_DURATION = 600;

function initWorkCoverLongPress() {
  // 触摸事件（移动端）
  document.addEventListener('touchstart', (e) => {
    const coverImg = getCoverImageFromTarget(e.target);
    if (!coverImg) return;
    const card = coverImg.closest('[data-id]');
    if (!card) return;
    _longPressTriggered = false;
    _longPressTimer = setTimeout(() => {
      _longPressTriggered = true;
      showCoverPreview(coverImg.src, card.dataset.id);
    }, LONG_PRESS_DURATION);
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
  });
  document.addEventListener('touchmove', () => {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
  });

  // 鼠标事件（桌面端）
  document.addEventListener('mousedown', (e) => {
    const coverImg = getCoverImageFromTarget(e.target);
    if (!coverImg) return;
    const card = coverImg.closest('[data-id]');
    if (!card) return;
    _longPressTriggered = false;
    _longPressTimer = setTimeout(() => {
      _longPressTriggered = true;
      showCoverPreview(coverImg.src, card.dataset.id);
    }, LONG_PRESS_DURATION);
  });
  document.addEventListener('mouseup', () => {
    if (_longPressTimer) { clearTimeout(_longPressTimer); _longPressTimer = null; }
  });

  // 阻止长按后误触 click
  document.addEventListener('click', (e) => {
    if (_longPressTriggered) {
      e.preventDefault();
      e.stopPropagation();
      _longPressTriggered = false;
    }
  }, true);
}

function getCoverImageFromTarget(target) {
  if (!target) return null;
  const cover = target.closest('.work-poster-cover') || target.closest('.work-cover');
  if (!cover) return null;
  return cover.querySelector('img');
}

function showCoverPreview(src, videoId) {
  closeCoverPreview();
  const overlay = document.createElement('div');
  overlay.className = 'cover-preview-overlay';
  overlay.innerHTML = `
    <div class="cover-preview-content">
      <button class="cover-preview-close">&times;</button>
      <img class="cover-preview-img" src="${src}" alt="作品封面">
      <button class="cover-preview-delete">🗑</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCoverPreview();
  });
  overlay.querySelector('.cover-preview-close').addEventListener('click', closeCoverPreview);
  overlay.querySelector('.cover-preview-delete').addEventListener('click', () => {
    showCoverDeleteConfirm(overlay, videoId);
  });
}

function showCoverDeleteConfirm(overlay, videoId) {
  const existing = overlay.querySelector('.cover-preview-confirm');
  if (existing) { existing.remove(); return; }

  const confirmEl = document.createElement('div');
  confirmEl.className = 'cover-preview-confirm';
  confirmEl.innerHTML = `
    <p>确定删除这个作品吗？</p>
    <div class="cover-preview-confirm-actions">
      <button class="btn-secondary btn-sm">取消</button>
      <button class="btn-delete btn-sm">确认删除</button>
    </div>
  `;
  overlay.querySelector('.cover-preview-content').appendChild(confirmEl);

  confirmEl.querySelector('.btn-secondary').addEventListener('click', () => confirmEl.remove());
  confirmEl.querySelector('.btn-delete').addEventListener('click', () => {
    DB.deleteVideo(videoId);
    updateActressWorksCount();
    closeCoverPreview();
    refreshCurrentPage();
    updateHomeStats();
    if (currentPage === 'detail' && detailActressId) {
      openActressDetail(detailActressId);
    }
    showToast('作品已删除', 'success');
  });
}

function closeCoverPreview() {
  const overlay = document.querySelector('.cover-preview-overlay');
  if (overlay) overlay.remove();
  document.body.style.overflow = '';
}

// ==================== 工具函数 ====================
// escapeHtml / normalizeVideoCode / parseBirthdayInput / calcAge 等公共工具
// 已统一收敛到 js/utils.js，避免在多个文件中重复定义。

// ==================== 站点导航 ====================
const SITES_STORAGE_KEY = 'site_nav_list';
let sitesEditMode = -1; // -1 = adding, index = editing

document.getElementById('sitesAddBtn').addEventListener('click', () => openSitesForm(-1, '', ''));

function setupVideoActressAutocomplete() {
  const input = els.videoActressesInput;
  const list = els.videoActressSuggestList;
  if (!input || !list) return;

  const getTokenInfo = () => {
    const value = input.value;
    const cursor = input.selectionStart ?? value.length;
    const before = value.slice(0, cursor);
    const after = value.slice(cursor);
    const left = before.lastIndexOf(',') + 1;
    const rightRel = after.indexOf(',');
    const right = rightRel === -1 ? value.length : cursor + rightRel;
    const token = value.slice(left, right).trim();
    return { value, cursor, left, right, token };
  };

  const render = () => {
    const { token } = getTokenInfo();
    const actresses = DB.getActresses();
    const q = token.toLowerCase();
    const matched = (q ? actresses.filter(a => {
      const display = DB.applyNameMapping(a.name);
      return [a.name, a.alias || '', display].some(t => t && t.toLowerCase().includes(q));
    }) : actresses.slice(-12)).slice(0, 12);

    list.innerHTML = '';
    if (matched.length === 0) {
      list.style.display = 'none';
      return;
    }

    matched.forEach(a => {
      const display = DB.applyNameMapping(a.name);
      const item = document.createElement('div');
      item.className = 'video-actress-suggest-item';
      item.innerHTML = `<span class="video-actress-suggest-keyword">${escapeHtml(display)}</span>`;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        const { value, left, right } = getTokenInfo();
        const prefix = value.slice(0, left).replace(/\s*,?\s*$/, '');
        const suffix = value.slice(right).replace(/^\s*,?\s*/, '');
        const insert = display;
        const parts = [];
        if (prefix) parts.push(prefix);
        parts.push(insert);
        if (suffix) parts.push(suffix);
        input.value = parts.join(', ').replace(/,\s*,/g, ', ');
        list.style.display = 'none';
        input.focus();
      });
      list.appendChild(item);
    });
    list.style.display = 'block';
  };

  input.addEventListener('input', render);
  input.addEventListener('focus', render);
  input.addEventListener('blur', () => {
    setTimeout(() => { list.style.display = 'none'; }, 150);
  });
  document.addEventListener('click', e => {
    if (!list.contains(e.target) && e.target !== input) list.style.display = 'none';
  });
}

function getSites() {
  try {
    return JSON.parse(localStorage.getItem(SITES_STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveSites(sites) {
  localStorage.setItem(SITES_STORAGE_KEY, JSON.stringify(sites));
}

function openSitesModal() {
  renderSitesList();
  closeSitesForm();
  openModal(document.getElementById('sites-modal'));
}

function renderSitesList() {
  const sites = getSites();
  const list = document.getElementById('sitesList');
  const empty = document.getElementById('sitesEmpty');

  list.innerHTML = '';
  if (sites.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  sites.forEach((site, i) => {
    const el = document.createElement('div');
    el.className = 'sites-item';
    el.innerHTML = `
      <div class="sites-item-info">
        <div class="sites-item-title">${escapeHtml(site.title)}</div>
        <div class="sites-item-url">${escapeHtml(site.url)}</div>
      </div>
      <div class="sites-item-actions">
        <button class="sites-item-btn" data-edit="${i}" title="编辑">✎</button>
        <button class="sites-item-btn danger" data-delete="${i}" title="删除">✕</button>
      </div>
    `;
    el.querySelector('.sites-item-info').addEventListener('click', () => {
      window.open(site.url, '_blank');
    });
    el.querySelector('[data-edit]').addEventListener('click', (e) => {
      e.stopPropagation();
      openSitesForm(i, site.title, site.url);
    });
    el.querySelector('[data-delete]').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSite(i);
    });
    list.appendChild(el);
  });
}

function openSitesForm(index, title, url) {
  const body = document.querySelector('.sites-modal-body');
  const addBtn = document.getElementById('sitesAddBtn');

  sitesEditMode = index;

  const form = document.createElement('div');
  form.className = 'sites-form';
  form.style.display = 'block';
  form.id = 'sitesForm';
  form.innerHTML = `
    <div class="form-group">
      <label>站点标题</label>
      <input type="text" class="form-input" id="sitesFormTitle" placeholder="如：Jable 在线" value="${escapeHtml(title || '')}">
    </div>
    <div class="form-group">
      <label>站点网址</label>
      <input type="text" class="form-input" id="sitesFormUrl" placeholder="如：https://jable.tv" value="${escapeHtml(url || '')}">
    </div>
    <div class="sites-form-actions">
      <button id="sitesFormCancel">取消</button>
      <button id="sitesFormSave" class="btn-primary" style="background:var(--primary);color:#fff;border:none;">${index < 0 ? '添加' : '保存'}</button>
    </div>
  `;

  body.insertBefore(form, body.firstChild);

  document.getElementById('sitesFormSave').addEventListener('click', () => {
    const t = document.getElementById('sitesFormTitle').value.trim();
    let u = document.getElementById('sitesFormUrl').value.trim();
    if (!t || !u) { showToast('请填写标题和网址', 'error'); return; }
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    const sites = getSites();
    if (index < 0) {
      sites.push({ title: t, url: u });
    } else {
      sites[index] = { title: t, url: u };
    }
    saveSites(sites);
    closeSitesForm();
    renderSitesList();
    showToast(index < 0 ? '站点已添加' : '站点已更新', 'success');
  });

  document.getElementById('sitesFormCancel').addEventListener('click', () => {
    closeSitesForm();
    renderSitesList();
  });

  document.getElementById('sitesFormTitle').focus();
}

function closeSitesForm() {
  const form = document.getElementById('sitesForm');
  if (form) form.remove();
  sitesEditMode = -1;
}

function deleteSite(index) {
  const sites = getSites();
  const site = sites[index];
  showConfirmDialog({
    title: '删除站点',
    message: `确定删除「${site.title}」吗？`,
    confirmText: '删除'
  }).then(ok => {
    if (!ok) return;
    sites.splice(index, 1);
    saveSites(sites);
    closeSitesForm();
    renderSitesList();
    showToast('站点已删除', 'success');
  });
}
