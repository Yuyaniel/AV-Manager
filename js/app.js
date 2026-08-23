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
let checkinCurrentDate = '';
let checkinViewYear = 0;
let checkinViewMonth = 0;
// 已勾选待提交的打卡条目（临时缓存，确认后才写入）：{ type:'actress'|'work'|'custom', id, name(显示名), code(番号), actress(关联演员) }
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
  loadingState: document.getElementById('loadingState'),
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
  confirmModal: document.getElementById('confirm-modal'),
  confirmDialogTitle: document.getElementById('confirmDialogTitle'),
  confirmDialogText: document.getElementById('confirmDialogText'),
  confirmDialogCancel: document.getElementById('confirmDialogCancel'),
  confirmDialogOk: document.getElementById('confirmDialogOk'),
  settingsImportFile: document.getElementById('settingsImportFile'),
  // 打卡
  checkinModal: document.getElementById('checkin-modal'),
  checkinModalTitle: document.getElementById('checkin-modal-title'),
  checkinSearchInput: document.getElementById('checkin-search-input'),
  checkinSuggestList: document.getElementById('checkin-suggest-list'),
  checkinNoMatch: document.getElementById('checkin-no-match'),
  checkinCustomRow: document.getElementById('checkin-custom-row'),
  checkinSaveLocal: document.getElementById('checkin-save-local'),
  checkinAddCustom: document.getElementById('checkin-add-custom'),
  checkinLinkedHint: document.getElementById('checkin-linked-hint'),
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
  if (window.MutationObserver) {
    new MutationObserver(mutations => {
      mutations.forEach(m => m.addedNodes.forEach(node => {
        if (node.nodeType === 1) hydrateImages(node);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }
  init();
});

function init() {
  showLoading(true);
  setTimeout(() => {
    updateActressWorksCount();
    showLoading(false);
    showPage('page-home', false);
    updateHomeStats();
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
  }, 300);
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
  // 底部导航 — 使用 touchstart 实现零延迟响应（移动端），click 作为桌面端回退
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
    let startX = 0, startY = 0;

    // 移动端：touchstart 立即触发，零延迟
    btn.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    btn.addEventListener('touchend', (e) => {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - startX);
      const dy = Math.abs(touch.clientY - startY);
      // 仅当几乎没有移动时才视为点击（排除滑动）
      if (dx < 10 && dy < 10) {
        touchHandled = true;
        handleNavClick(btn.dataset.page);
      }
    }, { passive: true });

    // 桌面端：click 事件
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
  // 设置页按钮
  document.getElementById('settingsRandomBtn').addEventListener('click', openRandomModal);
  document.getElementById('settingsStatsBtn').addEventListener('click', () => openStatsPage());
  document.getElementById('settingsExportBtn').addEventListener('click', exportData);
  document.getElementById('settingsImportBtn').addEventListener('click', () => els.settingsImportFile.click());
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
  els.checkinAddCustom.addEventListener('click', addCustomCheckinEntry);
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
    // 刷新替换规则计数
    if (els.syncMappingCount) {
      els.syncMappingCount.textContent = `当前 ${DB.getNameMappings().length} 条替换规则`;
    }
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

function showLoading(show) {
  els.loadingState.classList.toggle('show', show);
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
  imgs.forEach(async img => {
    const ref = img.dataset.imgRef;
    if (!ref || img.src) return;
    const src = await DB.getImageSrc(ref);
    if (src) img.src = src;
  });
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
  requestAnimationFrame(() => {
    if (fp !== _actressRenderFingerprint) renderActresses();
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
  requestAnimationFrame(() => {
    if (fp !== _workRenderFingerprint) renderWorks();
    window.scrollTo(0, _pageScrollPos['page-works'] || 0);
  });
}

// ==================== 女优列表 ====================
let _actressRenderToken = 0;
let _workRenderToken = 0;

function renderActresses() {
  const query = els.searchInputActress.value.trim().toLowerCase();
  let actresses = DB.getActresses();

  if (query) {
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

    actresses = actresses.filter(a => {
      const displayName = DB.applyNameMapping(a.name).toLowerCase();
      const nameMatch = (a.name && a.name.toLowerCase().includes(query)) ||
             (a.alias && a.alias.toLowerCase().includes(query)) ||
             displayName.includes(query);
      if (nameMatch) return true;
      // 该女优是否出现在番号匹配的作品中（用全部名称变体匹配）
      return DB.getActressAllNames(a).some(n => videoMatchedActressNames.has(n.toLowerCase()));
    });
  }

  // 排序
  if (actressSortMode === 'works-desc') {
    actresses.sort((a, b) => (actressWorksCountMap[b.id] || 0) - (actressWorksCountMap[a.id] || 0));
  } else if (actressSortMode === 'time-desc') {
    actresses.sort((a, b) => {
      const ta = new Date(b.updatedAt || b.createdAt || 0).getTime();
      const tb = new Date(a.updatedAt || a.createdAt || 0).getTime();
      return ta - tb;
    });
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
  const token = ++_actressRenderToken;
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
function renderWorks() {
  const query = els.searchInputWork.value.trim().toLowerCase();
  let videos = DB.getVideos();

  if (query) {
    const normalizedQuery = (normalizeVideoCode(query) || query).toLowerCase();
    videos = videos.filter(v => {
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

  videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
  const token = ++_workRenderToken;
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
    let actresses = DB.getActresses();
    if (query) {
      actresses = actresses.filter(a => {
        const displayName = DB.applyNameMapping(a.name).toLowerCase();
        return (a.name && a.name.toLowerCase().includes(query)) ||
               (a.alias && a.alias.toLowerCase().includes(query)) ||
               displayName.includes(query);
      });
    }
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
    let videos = DB.getVideos();
    if (query) {
      videos = videos.filter(v =>
        (v.code && v.code.toLowerCase().includes(query)) ||
        (v.title && v.title.toLowerCase().includes(query)) ||
        (v.actresses && v.actresses.toLowerCase().includes(query)) ||
        (v.studio && v.studio.toLowerCase().includes(query))
      );
    }
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
      selectedActresses.forEach(id => DB.deleteActress(id));
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
      selectedWorks.forEach(id => DB.deleteVideo(id));
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

function updateActressWorksCount() {
  const actresses = DB.getActresses();
  const videos = DB.getVideos();
  actressWorksCountMap = {};

  // 建立女优所有名称变体 -> id 映射（小写），包含原名、别名、映射名
  const nameToId = {};
  actresses.forEach(actress => {
    actressWorksCountMap[actress.id] = 0;
    const allNames = DB.getActressAllNames(actress);
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
  const allNames = DB.getActressAllNames(actress).map(n => n.toLowerCase());
  const works = DB.getVideos().filter(v => {
    if (!v.actresses) return false;
    const videoNames = v.actresses.split(',').map(n => n.trim().toLowerCase());
    return videoNames.some(n => allNames.includes(n));
  });

  els.worksList.innerHTML = '';
  if (works.length === 0) {
    els.worksList.innerHTML = '<div class="empty-state" style="padding: 40px 0;"><p>暂无作品</p></div>';
  } else {
    works.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    works.forEach(video => els.worksList.appendChild(createWorkCard(video)));
  }

  updateDetailCheckinCount();
  showPage('page-detail');
}

function updateDetailCheckinCount() {
  if (!detailActressId) return;
  const actress = DB.getActress(detailActressId);
  if (!actress) return;
  const allNames = DB.getActressAllNames(actress).map(n => n.toLowerCase());
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
    height: document.getElementById('actress-height').value,
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
      <button class="btn-primary" style="margin-top:10px;width:100%;" onclick="openVideoModal('${video.id}')">编辑</button>
    </div>
  `;
  openModal(els.detailModal);
}

// 生成播放按钮：用 whos.tv 搜索结果页在线播放（基于番号）
function renderPlayButton(video) {
  const code = (video.code || '').trim().toLowerCase();
  if (!code) return '';
  return `<button class="btn-secondary detail-play-btn" onclick="showPlaySourcePopup('${escapeHtml(code)}')">▶ 在线播放</button>`;
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
        ${!isRolling ? `<button class="btn-secondary" style="margin-top:12px;" onclick="showDetailFromRandom('video','${item.id}')">查看详情</button>` : ''}
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
        ${!isRolling ? `<button class="btn-secondary" style="margin-top:12px;" onclick="showDetailFromRandom('actress','${item.id}')">查看详情</button>` : ''}
      </div>
    `;
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

// 规范化番号：字母和数字之间自动补全「-」，如 ipx536 -> IPX-536
function normalizeVideoCode(code) {
  if (!code) return code;
  code = code.trim().toUpperCase();
  // 已包含「-」则不再处理
  if (code.includes('-')) return code;
  // 匹配 字母+数字 格式（至少 1 个字母和 1 个数字）
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return code;
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

function calcCheckinStreak(byDate) {
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
  return streak;
}

function openCheckinModal(dateStr) {
  checkinCurrentDate = dateStr;
  checkinPendingEntries = [];
  els.checkinModalTitle.textContent = '添加打卡';

  els.checkinSearchInput.value = '';
  els.checkinSuggestList.innerHTML = '';
  els.checkinNoMatch.style.display = 'none';
  els.checkinCustomRow.style.display = 'none';
  els.checkinSaveLocal.checked = false;
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
      search: (code + ' ' + (v.title || '') + ' ' + actresses).toLowerCase()
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
      search: (a.name + ' ' + (a.alias || '') + ' ' + display).toLowerCase()
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
    // 无输入：最近添加的条目
    matched = allEntries.slice(-12).reverse();
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

  // 自定义条目区：输入内容不是某个本地条目的精确匹配时显示
  const raw = els.checkinSearchInput.value.trim();
  const exactMatch = allEntries.find(e => e.name.toLowerCase() === raw.toLowerCase());
  els.checkinCustomRow.style.display = (raw && !exactMatch) ? 'flex' : 'none';

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
  els.checkinCustomRow.style.display = 'none';
  els.checkinLinkedHint.textContent = '';
  renderPendingList();
}

// 自定义条目「添加」按钮：将当前输入内容作为自定义条目加入待提交列表
function addCustomCheckinEntry() {
  const text = els.checkinSearchInput.value.trim();
  if (!text) { showToast('请先输入条目内容', 'error'); return; }
  const parsed = parseCustomEntry(text);
  const displayName = parsed.code
    ? (parsed.code + (parsed.actress ? ` (${parsed.actress})` : ''))
    : (parsed.actress || text);
  const entry = { type: 'custom', id: '', code: parsed.code, actress: parsed.actress, name: displayName };
  if (!checkinPendingEntries.some(p => p.type === 'custom' && p.name.toLowerCase() === displayName.toLowerCase())) {
    // 勾选「保存至本地库」则立即入库（入库是显式动作，不随打卡提交）
    if (els.checkinSaveLocal.checked) {
      saveCustomEntryToLocal(text);
    }
    checkinPendingEntries.push(entry);
    showToast(`已勾选自定义条目：${displayName}`, 'info', 1200);
  } else {
    showToast('该条目已在勾选列表中', 'info', 1200);
  }
  els.checkinSearchInput.value = '';
  els.checkinSuggestList.innerHTML = '';
  els.checkinNoMatch.style.display = 'none';
  els.checkinCustomRow.style.display = 'none';
  els.checkinSaveLocal.checked = false;
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
    const allNames = DB.getActressAllNames(actress).map(n => n.toLowerCase());
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

// 解析自定义条目文本：'番号 (演员名)' | '番号' | '演员名'
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

// 一键保存自定义条目到本地数据库（演员/作品）
function saveCustomEntryToLocal(text) {
  if (!text) { showToast('请先输入条目内容', 'error'); return; }
  const parsed = parseCustomEntry(text);
  let saved = 0;

  if (parsed.code) {
    const existing = DB.getVideos().find(v => (v.code || '').toUpperCase() === parsed.code.toUpperCase());
    if (existing) {
      // 番号已存在：补充演员
      if (parsed.actress) {
        const names = existing.actresses ? existing.actresses.split(',').map(n => n.trim()).filter(Boolean) : [];
        parsed.actress.split(',').forEach(n => {
          if (!names.some(x => x.toLowerCase() === n.toLowerCase())) names.push(n);
        });
        DB.updateVideo(existing.id, { actresses: names.join(',') });
      }
    } else {
      DB.addVideo({ code: parsed.code, actresses: parsed.actress });
      saved++;
    }
  }
  if (parsed.actress) {
    parsed.actress.split(',').forEach(name => {
      if (!DB.findActressByName(name)) {
        DB.addActress({ name });
        saved++;
      }
    });
  }
  updateActressWorksCount();
  refreshCurrentPage();
  updateHomeStats();
  showToast(saved > 0 ? `已保存 ${saved} 条到本地库` : '该条目已在本地库中', 'success');
}

function doCheckin() {
  if (!checkinCurrentDate) return;
  const pending = checkinPendingEntries;
  const searchText = els.checkinSearchInput.value.trim();

  // 条目不强制：无勾选时若输入框有内容则自动作为自定义条目；否则记录为无条目打卡
  if (pending.length === 0 && searchText) {
    addCustomCheckinEntry();
  }
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
      } else {
        // 自定义条目：统一展示格式「番号 (演员名)」
        const parsed = parseCustomEntry(entry.name);
        const displayName = parsed.code
          ? (parsed.code + (parsed.actress ? ` (${parsed.actress})` : ''))
          : (parsed.actress || entry.name);
        record = {
          targetType: 'custom',
          targetId: '',
          targetName: displayName,
          targetCode: parsed.code,
          targetActress: parsed.actress
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
    const item = document.createElement('div');
    item.className = 'checkin-existing-item';
    item.innerHTML = `
      <div class="checkin-existing-info">
        <span class="checkin-existing-type">${typeLabel}</span>
        ${rec.name ? `<span class="checkin-existing-name">${escapeHtml(rec.name)}</span>` : ''}
        ${r.note ? `<span class="checkin-existing-note">${escapeHtml(r.note)}</span>` : ''}
      </div>
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
    byDate[date] = true;
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
}

// 当前连续打卡天数（与 calcCheckinStreak 相同逻辑，修复跨月BUG）
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
  } catch (err) {
    console.error('exportData error', err);
    showToast('导出失败: ' + err.message, 'error', 5000);
  } finally {
    hideGlobalLoading();
  }
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

async function importData(e, source) {
  const file = e.target.files[0];
  if (!file) return;

  // 默认为合并模式（保留现有数据），移除可选项
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
    const result = await DB.importData(data, mode);
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

  // 自动合并替换名相同的女优
  const mergedCount = DB.mergeActressesByReplacementName();
  if (mergedCount > 0) {
    updateActressWorksCount();
    refreshCurrentPage();
    updateHomeStats();
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

// ==================== Toast 提示 ====================
function showToast(message, type = '', duration = 2500) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;

  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
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
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 解析生日输入文本，支持多种格式：
// "1992年11月30日" / "1992-11-30" / "1992/11/30" / "1992.11.30" / "19921130" / "1992 11 30"
// 返回 "YYYY-MM-DD" 格式，无法解析时返回原始输入
function parseBirthdayInput(input) {
  if (!input || !input.trim()) return '';
  const text = input.trim();

  // 匹配 "1992年11月30日" 格式
  let m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if (m) {
    return formatBirthdayStr(m[1], m[2], m[3]);
  }

  // 匹配 "1992-11-30" / "1992/11/30" / "1992.11.30" / "1992 11 30"
  m = text.match(/(\d{4})[\-\/\.\s]+(\d{1,2})[\-\/\.\s]+(\d{1,2})/);
  if (m) {
    return formatBirthdayStr(m[1], m[2], m[3]);
  }

  // 匹配 "19921130"（8位纯数字）
  m = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    return formatBirthdayStr(m[1], m[2], m[3]);
  }

  // 匹配 "1992年11月"（无日）
  m = text.match(/(\d{4})\s*年\s*(\d{1,2})\s*月/);
  if (m) {
    return formatBirthdayStr(m[1], m[2], '01');
  }

  // 匹配 "1992-11"（无日）
  m = text.match(/^(\d{4})[\-\/\.](\d{1,2})$/);
  if (m) {
    return formatBirthdayStr(m[1], m[2], '01');
  }

  // 无法解析，返回原始输入
  return text;
}

// 格式化为 YYYY-MM-DD，校验日期有效性
function formatBirthdayStr(year, month, day) {
  const y = parseInt(year, 10);
  const mo = parseInt(month, 10);
  const d = parseInt(day, 10);
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) {
    return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return `${year}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// 根据生日计算年龄，返回整数岁数；无法解析时返回 null
function calcAge(birthday) {
  if (!birthday) return null;
  const birth = new Date(birthday);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const mDiff = now.getMonth() - birth.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// ==================== 站点导航 ====================
const SITES_STORAGE_KEY = 'site_nav_list';
let sitesEditMode = -1; // -1 = adding, index = editing

document.getElementById('sitesAddBtn').addEventListener('click', () => openSitesForm(-1, '', ''));

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
