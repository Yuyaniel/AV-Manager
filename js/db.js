// 本地数据存储 (localStorage + IndexedDB 图片库)
// 公共纯函数（m_original_split / escapeHtml / normalizeVideoCode 等）见 js/utils.js，
// 需在本文件之前加载。

// 图片存储策略：图片主体放 IndexedDB，localStorage 里只保存轻量引用。
// 优点：避免 base64 挤爆 localStorage；仍是纯前端、无权限、无后端；导出时再转回 JSON 内联图片。
const ImageStore = {
  dbName: 'jav_manager_images',
  storeName: 'images',
  refPrefix: 'idb://image/',
  _dbPromise: null,
  _urlCache: new Map(),
  // blob URL 缓存上限：超过后回收「不再被任何 <img> 引用」的旧 URL，避免长会话内存持续增长
  maxUrlCache: 300,

  isRef(value) {
    return typeof value === 'string' && value.startsWith(this.refPrefix);
  },

  keyFromRef(ref) {
    return this.isRef(ref) ? ref.slice(this.refPrefix.length) : '';
  },

  open() {
    if (!window.indexedDB) return Promise.reject(new Error('IndexedDB 不可用'));
    if (this._dbPromise) return this._dbPromise;
    this._dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('打开图片库失败'));
    });
    return this._dbPromise;
  },

  async saveBlob(blob) {
    const db = await this.open();
    const key = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    await new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put({ key, blob, type: blob.type || 'image/jpeg', createdAt: new Date().toISOString() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('保存图片失败'));
    });
    return this.refPrefix + key;
  },

  async getBlob(ref) {
    const key = this.keyFromRef(ref);
    if (!key) return null;
    const db = await this.open();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).get(key);
      req.onsuccess = () => {
        const stored = req.result;
        if (!stored) { resolve(null); return; }
        let blob = stored.blob;
        // 兼容部分环境从 IndexedDB 读回的是 ArrayBuffer/Buffer 而非 Blob
        if (blob && !(blob instanceof Blob)) {
          try { blob = new Blob([blob], { type: stored.type || 'image/jpeg' }); } catch (e) { blob = null; }
        }
        resolve(blob);
      };
      req.onerror = () => reject(req.error || new Error('读取图片失败'));
    });
  },

  async getSrc(ref) {
    if (!this.isRef(ref)) return ref || '';
    const key = this.keyFromRef(ref);
    if (this._urlCache.has(key)) return this._urlCache.get(key);
    const blob = await this.getBlob(ref);
    if (!blob) return '';
    const url = URL.createObjectURL(blob);
    this._urlCache.set(key, url);
    this._pruneUrlCache();
    return url;
  },

  // 回收超出上限的旧 blob URL。
  // 注意：若某个 URL 仍被页面上的 <img> 使用，直接 revoke 会让该图变空白，
  // 因此只回收「DOM 中已无引用」的条目；仍被引用的条目移到队尾，稍后再尝试。
  _pruneUrlCache() {
    while (this._urlCache.size > this.maxUrlCache) {
      const oldestKey = this._urlCache.keys().next().value;
      const url = this._urlCache.get(oldestKey);
      if (this._isUrlInUse(url)) {
        this._urlCache.delete(oldestKey);
        this._urlCache.set(oldestKey, url);
        return; // 队首仍在使用，本轮不再回收（其它都在使用中）
      }
      if (url) URL.revokeObjectURL(url);
      this._urlCache.delete(oldestKey);
    }
  },

  _isUrlInUse(url) {
    if (!url || typeof document === 'undefined') return true;
    try {
      return !!document.querySelector(`img[src="${url}"]`);
    } catch (err) {
      // URL 含特殊字符导致选择器非法：保守认为仍在使用，不做回收
      return true;
    }
  },

  async delete(ref) {
    const key = this.keyFromRef(ref);
    if (!key) return;
    const cached = this._urlCache.get(key);
    if (cached) URL.revokeObjectURL(cached);
    this._urlCache.delete(key);
    try {
      const db = await this.open();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('删除图片失败'));
      });
    } catch (err) {
      console.warn('删除 IndexedDB 图片失败', err);
    }
  },

  dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const meta = parts[0] || '';
    const mime = (meta.match(/data:([^;]+)/) || [])[1] || 'image/jpeg';
    const binary = atob(parts[1] || '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  },

  blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  async saveDataUrl(dataUrl) {
    return this.saveBlob(this.dataUrlToBlob(dataUrl));
  },

  async exportRef(ref) {
    if (!this.isRef(ref)) return ref || '';
    const blob = await this.getBlob(ref);
    return blob ? await this.blobToDataUrl(blob) : '';
  }
};

const DB = {
  _keyVideos: 'jav_videos',
  _keyActresses: 'jav_actresses',
  _keyRandomHistory: 'jav_random_history',
  _keyCheckins: 'jav_checkins',
  _keyNameMappings: 'jav_name_mappings',
  _videosCache: null,
  _actressesCache: null,
  _nameMappingsCache: null,

  // 注意：返回的是缓存数组的浅拷贝。调用方可自由排序/截取，不会污染内部缓存顺序；
  // 元素对象本身仍与缓存共享引用，因此「修改元素字段 + saveVideos()」的方式依然有效。
  getVideos() {
    if (!this._videosCache) {
      try {
        this._videosCache = JSON.parse(localStorage.getItem(this._keyVideos)) || [];
      } catch {
        this._videosCache = [];
      }
    }
    return this._videosCache.slice();
  },

  saveVideos(videos) {
    this._videosCache = videos;
    localStorage.setItem(this._keyVideos, JSON.stringify(videos));
  },

  getVideo(id) {
    return this.getVideos().find(v => v.id === id);
  },

  addVideo(video) {
    const videos = this.getVideos();
    // 检查是否已存在相同番号（不区分大小写）
    const codeUpper = (video.code || '').toUpperCase();
    if (codeUpper) {
      const existingIndex = videos.findIndex(v => v.code && v.code.toUpperCase() === codeUpper);
      if (existingIndex >= 0) {
        // 存在相同番号：以最新添加的为主，替换旧记录（保留原 ID）
        video.id = videos[existingIndex].id;
        video.createdAt = videos[existingIndex].createdAt || new Date().toISOString();
        video.updatedAt = new Date().toISOString();
        videos.splice(existingIndex, 1, video);
        this.saveVideos(videos);
        this._lastAddWasReplace = true;
        return video;
      }
    }
    // 不存在则新增
    video.id = video.id || 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    video.createdAt = video.createdAt || new Date().toISOString();
    videos.push(video);
    this.saveVideos(videos);
    this._lastAddWasReplace = false;
    return video;
  },

  updateVideo(id, data) {
    const videos = this.getVideos();
    const idx = videos.findIndex(v => v.id === id);
    if (idx >= 0) {
      const oldCover = videos[idx].cover;
      videos[idx] = { ...videos[idx], ...data, updatedAt: new Date().toISOString() };
      if (oldCover && data.cover && oldCover !== data.cover && ImageStore.isRef(oldCover)) ImageStore.delete(oldCover);
      this.saveVideos(videos);
      return videos[idx];
    }
    return null;
  },

  deleteVideo(id) {
    this.deleteVideos([id]);
  },

  // 批量删除：一次性清理图片引用并只写一次 localStorage（避免逐条落盘的 O(n²) 开销）
  deleteVideos(ids) {
    const idSet = new Set(ids);
    if (idSet.size === 0) return 0;
    const videos = this.getVideos();
    videos.forEach(v => {
      if (idSet.has(v.id) && v.cover && ImageStore.isRef(v.cover)) ImageStore.delete(v.cover);
    });
    const remain = videos.filter(v => !idSet.has(v.id));
    const removed = videos.length - remain.length;
    if (removed > 0) this.saveVideos(remain);
    return removed;
  },

  // 同 getVideos()：返回浅拷贝，避免调用方排序污染缓存顺序
  getActresses() {
    if (!this._actressesCache) {
      try {
        this._actressesCache = JSON.parse(localStorage.getItem(this._keyActresses)) || [];
      } catch {
        this._actressesCache = [];
      }
    }
    return this._actressesCache.slice();
  },

  saveActresses(actresses) {
    this._actressesCache = actresses;
    localStorage.setItem(this._keyActresses, JSON.stringify(actresses));
  },

  getActress(id) {
    return this.getActresses().find(a => a.id === id);
  },

  findActressByName(name) {
    if (!name) return null;
    const trimmed = name.trim();
    const lower = trimmed.toLowerCase();
    const actresses = this.getActresses();
    // 1. 先按名称精确匹配（不区分大小写）
    let found = actresses.find(a => a.name && a.name.trim().toLowerCase() === lower);
    if (found) return found;
    // 2. 再按别名匹配（不区分大小写）
    found = actresses.find(a => a.alias && a.alias.trim().toLowerCase() === lower);
    if (found) return found;
    // 3. 名称映射：输入的是替换名，查找对应原名的女优
    const mappings = this.getNameMappings();
    const mapping = mappings.find(m => m.replacement.trim().toLowerCase() === lower);
    if (mapping) {
      const originals = m_original_split(mapping.original);
      for (const origLower of originals) {
        found = actresses.find(a => a.name && a.name.trim().toLowerCase() === origLower);
        if (found) return found;
      }
    }
    // 4. 名称映射：输入的是原名，但女优存储的是替换名（兜底）
    const reverseMapping = mappings.find(m => {
      const originals = m_original_split(m.original);
      return originals.includes(lower);
    });
    if (reverseMapping) {
      const repLower = reverseMapping.replacement.trim().toLowerCase();
      found = actresses.find(a => a.name && a.name.trim().toLowerCase() === repLower);
      if (found) return found;
    }
    return null;
  },

  // 获取一个女优的所有名称变体（原名 + 别名 + 名称映射的替换名/原名）
  // 用于：作品按女优名匹配时，应匹配所有变体
  getActressAllNames(actress) {
    if (!actress) return [];
    const names = new Set();
    const addIfValid = (n) => {
      const t = n && n.trim();
      if (t) names.add(t);
    };
    // 1. 女优原名
    addIfValid(actress.name);
    // 2. 女优别名
    addIfValid(actress.alias);
    // 3. 名称映射：原名 → 替换名（original 支持逗号分隔多原名）
    const mappings = this.getNameMappings();
    const lowerName = (actress.name || '').trim().toLowerCase();
    mappings.forEach(m => {
      const originals = m_original_split(m.original);
      // 如果原名列表中包含该女优名，加入替换名
      if (originals.includes(lowerName)) {
        addIfValid(m.replacement);
      }
      // 如果替换名匹配原名，加入所有原名（兜底，保留原始大小写）
      if (m.replacement.trim().toLowerCase() === lowerName) {
        m.original.split(',').map(o => o.trim()).filter(Boolean).forEach(o => addIfValid(o));
      }
    });
    return Array.from(names);
  },

  addActress(actress) {
    const actresses = this.getActresses();
    // 检查是否已存在同名女优（不区分大小写、含别名和名称映射）
    const existing = this.findActressByName(actress.name);
    if (existing) {
      // 已存在则返回已有记录，不创建重复
      return existing;
    }
    actress.id = actress.id || 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    actress.createdAt = actress.createdAt || new Date().toISOString();
    actress.favorited = actress.favorited || false;
    actresses.push(actress);
    this.saveActresses(actresses);
    return actress;
  },

  updateActress(id, data) {
    const actresses = this.getActresses();
    const idx = actresses.findIndex(a => a.id === id);
    if (idx >= 0) {
      const oldAvatar = actresses[idx].avatar;
      actresses[idx] = { ...actresses[idx], ...data, updatedAt: new Date().toISOString() };
      if (oldAvatar && data.avatar && oldAvatar !== data.avatar && ImageStore.isRef(oldAvatar)) ImageStore.delete(oldAvatar);
      this.saveActresses(actresses);
      return actresses[idx];
    }
    return null;
  },

  deleteActress(id) {
    this.deleteActresses([id]);
  },

  // 批量删除：同 deleteVideos()，一次性清理头像引用并只写一次 localStorage
  deleteActresses(ids) {
    const idSet = new Set(ids);
    if (idSet.size === 0) return 0;
    const actresses = this.getActresses();
    actresses.forEach(a => {
      if (idSet.has(a.id) && a.avatar && ImageStore.isRef(a.avatar)) ImageStore.delete(a.avatar);
    });
    const remain = actresses.filter(a => !idSet.has(a.id));
    const removed = actresses.length - remain.length;
    if (removed > 0) this.saveActresses(remain);
    return removed;
  },

  // 图片压缩后存入 IndexedDB，返回 idb://image/... 引用，避免占用 localStorage 配额
  async saveImage(file, maxSize = 900, quality = 0.82) {
    if (!file || !file.type || !file.type.startsWith('image/')) return '';

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const compressedDataUrl = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          } else {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // 统一转 JPEG：性能好、体积小；头像/封面不需要透明通道
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

    try {
      return await ImageStore.saveDataUrl(compressedDataUrl);
    } catch (err) {
      console.warn('IndexedDB 图片保存失败，回退为 base64', err);
      return compressedDataUrl;
    }
  },

  async getImageSrc(value) {
    return ImageStore.isRef(value) ? await ImageStore.getSrc(value) : (value || '');
  },

  async exportImageValue(value) {
    return ImageStore.isRef(value) ? await ImageStore.exportRef(value) : (value || '');
  },

  // 一次性迁移：把 localStorage 里存的老 base64 图片转入 IndexedDB
  // 返回迁移数量；迁移完成前旧数据仍可正常显示，无需中断使用
  async migrateLegacyImages() {
    if (this._migrated) return 0;
    this._migrated = true;
    if (!window.indexedDB) return 0;
    let count = 0;

    const migrate = async (value) => {
      if (!value || !value.startsWith('data:image') || ImageStore.isRef(value)) return value;
      try {
        const ref = await ImageStore.saveDataUrl(value);
        count++;
        return ref;
      } catch (err) {
        console.warn('图片迁移失败', err);
        return value;
      }
    };

    try {
      const videos = this.getVideos();
      let videosChanged = false;
      for (const v of videos) {
        if (v.cover && v.cover.startsWith('data:image')) {
          v.cover = await migrate(v.cover);
          videosChanged = true;
        }
      }
      if (videosChanged) this.saveVideos(videos);

      const actresses = this.getActresses();
      let actressesChanged = false;
      for (const a of actresses) {
        if (a.avatar && a.avatar.startsWith('data:image')) {
          a.avatar = await migrate(a.avatar);
          actressesChanged = true;
        }
      }
      if (actressesChanged) this.saveActresses(actresses);

      const history = this.getRandomHistory();
      let historyChanged = false;
      for (const h of history) {
        if (h.cover && h.cover.startsWith('data:image')) {
          h.cover = await migrate(h.cover);
          historyChanged = true;
        }
      }
      if (historyChanged) localStorage.setItem(this._keyRandomHistory, JSON.stringify(history));
    } catch (err) {
      console.warn('图片迁移过程出错', err);
    }
    return count;
  },

  // 随机抽取记录
  getRandomHistory() {
    try {
      return JSON.parse(localStorage.getItem(this._keyRandomHistory)) || [];
    } catch {
      return [];
    }
  },

  addRandomHistory(type, item) {
    const history = this.getRandomHistory();
    const record = {
      id: 'h_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      type: type,
      itemId: item.id,
      // 女优类型：记录替换后的显示名
      name: type === 'video' ? item.code : this.applyNameMapping(item.name),
      title: type === 'video' ? (item.title || '') : '',
      cover: type === 'video' ? (item.cover || '') : (item.avatar || ''),
      pickedAt: new Date().toISOString()
    };
    history.unshift(record);
    if (history.length > 50) history.length = 50;
    localStorage.setItem(this._keyRandomHistory, JSON.stringify(history));
    return record;
  },

  deleteRandomHistory(id) {
    const history = this.getRandomHistory().filter(h => h.id !== id);
    localStorage.setItem(this._keyRandomHistory, JSON.stringify(history));
  },

  clearRandomHistory() {
    localStorage.removeItem(this._keyRandomHistory);
  },

  // ==================== 名称替换映射 ====================
  // 同 getVideos()：返回浅拷贝，避免调用方排序污染缓存顺序
  getNameMappings() {
    if (!this._nameMappingsCache) {
      try {
        this._nameMappingsCache = JSON.parse(localStorage.getItem(this._keyNameMappings)) || [];
      } catch {
        this._nameMappingsCache = [];
      }
    }
    return this._nameMappingsCache.slice();
  },

  saveNameMappings(mappings) {
    this._nameMappingsCache = mappings;
    localStorage.setItem(this._keyNameMappings, JSON.stringify(mappings));
  },

  addNameMapping(original, replacement) {
    const mappings = this.getNameMappings();
    // 拆分为单个名称（保留原始大小写）
    const newNames = original.split(',').map(o => o.trim()).filter(Boolean);
    const newNamesLower = newNames.map(n => n.toLowerCase());
    // 检查是否有任意名称已存在于某条映射中
    const existing = mappings.find(m => {
      const existingOriginals = m_original_split(m.original);
      return existingOriginals.some(o => newNamesLower.includes(o));
    });
    if (existing) {
      // 合并：将不重复的名称追加到已有映射
      const existingLower = m_original_split(existing.original);
      const existingNames = existing.original.split(',').map(o => o.trim()).filter(Boolean);
      newNames.forEach((name, i) => {
        if (!existingLower.includes(newNamesLower[i])) {
          existingNames.push(name);
        }
      });
      existing.original = existingNames.join(',');
      existing.replacement = replacement.trim();
      existing.updatedAt = new Date().toISOString();
    } else {
      mappings.push({
        id: 'nm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
        original: original.trim(),
        replacement: replacement.trim(),
        createdAt: new Date().toISOString()
      });
    }
    this.saveNameMappings(mappings);
    return mappings;
  },

  deleteNameMapping(id) {
    const mappings = this.getNameMappings().filter(m => m.id !== id);
    this.saveNameMappings(mappings);
  },

  // 查找替换名：如果原文名在映射表中，返回替换名；否则返回原名
  // original 字段支持逗号分隔多个名称，如 "Airi Suzumura,Suzumura Airi"
  applyNameMapping(name) {
    if (!name || !name.trim()) return name;
    const mappings = this.getNameMappings();
    const lower = name.trim().toLowerCase();
    const found = mappings.find(m => {
      const originals = m_original_split(m.original);
      return originals.includes(lower);
    });
    return found ? found.replacement : name;
  },

  // 对逗号分隔的女优名串应用名称替换
  applyNameMappingsToActresses(actressesStr) {
    if (!actressesStr) return actressesStr;
    return actressesStr.split(',').map(n => {
      const trimmed = n.trim();
      if (!trimmed) return '';
      return this.applyNameMapping(trimmed);
    }).filter(Boolean).join(',');
  },

  // 批量应用映射到已有作品数据，返回受影响数量
  applyMappingsToAllVideos() {
    const videos = this.getVideos();
    let changed = 0;
    videos.forEach(v => {
      if (!v.actresses) return;
      const mapped = this.applyNameMappingsToActresses(v.actresses);
      if (mapped !== v.actresses) {
        v.actresses = mapped;
        v.updatedAt = new Date().toISOString();
        changed++;
      }
    });
    if (changed > 0) {
      this.saveVideos(videos);
    }
    return changed;
  },

  // 合并替换名相同的映射规则（如 "A→X" 和 "B→X" 合并为 "A,B→X"）
  mergeNameMappingsByReplacement() {
    const mappings = this.getNameMappings();
    const byReplacement = new Map();
    mappings.forEach(m => {
      const key = m.replacement.trim().toLowerCase();
      if (!byReplacement.has(key)) byReplacement.set(key, []);
      byReplacement.get(key).push(m);
    });
    let merged = false;
    byReplacement.forEach(group => {
      if (group.length <= 1) return;
      const keep = group[0];
      const seenLower = new Set();
      const allOriginals = [];
      group.forEach(m => {
        m.original.split(',').map(o => o.trim()).filter(Boolean).forEach(o => {
          const lower = o.toLowerCase();
          if (!seenLower.has(lower)) {
            seenLower.add(lower);
            allOriginals.push(o);
          }
        });
      });
      keep.original = allOriginals.join(',');
      keep.updatedAt = new Date().toISOString();
      // 删除多余的规则
      for (let i = 1; i < group.length; i++) {
        const idx = mappings.findIndex(m => m.id === group[i].id);
        if (idx >= 0) mappings.splice(idx, 1);
      }
      merged = true;
    });
    if (merged) this.saveNameMappings(mappings);
    return merged;
  },

  // 按替换名（显示名）合并女优：替换名相同的女优合并为一个
  // 返回被合并删除的女优数量
  mergeActressesByReplacementName() {
    // 先合并同名替换规则
    this.mergeNameMappingsByReplacement();

    const actresses = this.getActresses();
    const videos = this.getVideos();
    const checkins = this.getCheckins();

    // 按显示名分组
    const byDisplayName = new Map();
    actresses.forEach(a => {
      const displayName = this.applyNameMapping(a.name);
      const key = displayName.trim().toLowerCase();
      if (!byDisplayName.has(key)) byDisplayName.set(key, []);
      byDisplayName.get(key).push(a);
    });

    let mergedCount = 0;

    byDisplayName.forEach(group => {
      if (group.length <= 1) return;

      // 选择保留的女优：信息最全的优先，其次按创建时间最早
      const sorted = [...group].sort((a, b) => {
        let sa = 0, sb = 0;
        if (a.avatar) sa += 4;
        if (a.birthday) sa += 2;
        if (a.favorited) sa += 1;
        if (a.alias) sa += 1;
        if (a.height) sa += 1;
        if (a.note) sa += 1;
        if (b.avatar) sb += 4;
        if (b.birthday) sb += 2;
        if (b.favorited) sb += 1;
        if (b.alias) sb += 1;
        if (b.height) sb += 1;
        if (b.note) sb += 1;
        if (sa !== sb) return sb - sa;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });

      const keep = sorted[0];
      const toRemove = sorted.slice(1);

      // 收集被删除女优的所有名称变体 → 保留女优的原名
      const replaceMap = new Map();
      toRemove.forEach(a => {
        this.getActressAllNames(a).forEach(n => {
          replaceMap.set(n.toLowerCase(), keep.name);
        });
        replaceMap.set(a.name.trim().toLowerCase(), keep.name);
      });

      // 将逗号分隔的名称串按 replaceMap 替换为保留女优名，并去重
      const remapNameList = (str) => {
        const names = str.split(',').map(n => n.trim());
        let changed = false;
        const mapped = names.map(n => {
          if (!n) return n;
          const rep = replaceMap.get(n.toLowerCase());
          if (rep && rep.toLowerCase() !== n.toLowerCase()) {
            changed = true;
            return rep;
          }
          return n;
        });
        if (!changed) return str;
        const seen = new Set();
        return mapped.filter(n => {
          if (!n) return false;
          const k = n.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        }).join(',');
      };

      // 更新作品：将被删除女优的名称替换为保留女优的名称
      videos.forEach(v => {
        if (!v.actresses) return;
        const next = remapNameList(v.actresses);
        if (next !== v.actresses) {
          v.actresses = next;
          v.updatedAt = new Date().toISOString();
        }
      });

      // 更新打卡记录：女优类记录迁移 targetId；作品类记录的 targetActress 也要重映射，
      // 否则合并后按女优统计打卡次数会漏计
      const removeIdSet = new Set(toRemove.map(a => a.id));
      checkins.forEach(c => {
        if (c.targetActress) {
          const next = remapNameList(c.targetActress);
          if (next !== c.targetActress) c.targetActress = next;
        }
        if (c.targetType === 'actress') {
          if (removeIdSet.has(c.targetId)) {
            c.targetId = keep.id;
          }
          if (c.targetName) {
            const rep = replaceMap.get(c.targetName.trim().toLowerCase());
            if (rep) c.targetName = this.applyNameMapping(rep);
          }
        }
      });

      // 合并元数据：将被删除女优的信息补充到保留女优
      toRemove.forEach(a => {
        if (!keep.avatar && a.avatar) {
          keep.avatar = a.avatar; // 头像由保留女优接管
        } else if (a.avatar && a.avatar !== keep.avatar && ImageStore.isRef(a.avatar)) {
          // 未被接管：清理 IndexedDB 图片，避免残留
          ImageStore.delete(a.avatar);
        }
        if (!keep.birthday && a.birthday) keep.birthday = a.birthday;
        if (!keep.height && a.height) keep.height = a.height;
        if (!keep.measurements && a.measurements) keep.measurements = a.measurements;
        if (!keep.alias && a.alias) keep.alias = a.alias;
        if (!keep.note && a.note) keep.note = a.note;
        if (!keep.favorited && a.favorited) keep.favorited = true;
      });
      keep.updatedAt = new Date().toISOString();

      // 删除被合并的女优
      toRemove.forEach(a => {
        const idx = actresses.findIndex(x => x.id === a.id);
        if (idx >= 0) actresses.splice(idx, 1);
      });

      mergedCount += toRemove.length;
    });

    if (mergedCount > 0) {
      this.saveActresses(actresses);
      this.saveVideos(videos);
      this.saveCheckins(checkins);
    }
    return mergedCount;
  },

  // 打卡记录
  getCheckins() {
    try {
      return JSON.parse(localStorage.getItem(this._keyCheckins)) || [];
    } catch {
      return [];
    }
  },

  getCheckinsByDate(dateStr) {
    return this.getCheckins().filter(c => c.date === dateStr);
  },

  addCheckin(data) {
    const checkins = this.getCheckins();
    const record = {
      id: 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      date: data.date,
      targetType: data.targetType, // 'actress' | 'work' | 'custom'
      targetId: data.targetId || '',
      targetName: data.targetName || '',
      // 统一条目格式「番号 (演员名)」的辅助字段
      targetCode: data.targetCode || '',   // 作品番号（如有）
      targetActress: data.targetActress || '', // 关联演员名（如有）
      note: data.note || '',
      createdAt: new Date().toISOString()
    };
    checkins.push(record);
    this.saveCheckins(checkins);
    return record;
  },

  saveCheckins(checkins) {
    localStorage.setItem(this._keyCheckins, JSON.stringify(checkins));
  },

  deleteCheckin(id) {
    const checkins = this.getCheckins().filter(c => c.id !== id);
    this.saveCheckins(checkins);
  },

  // 打卡记录归一化：兼容旧格式记录（无 targetCode/targetActress 时从 targetName 解析）
  // 返回 { type: 'actress'|'work'|'custom', name, code, actress }
  normalizeCheckinRecord(c) {
    if (!c) return { type: 'custom', name: '', code: '', actress: '' };
    if (c.targetType === 'work' && (c.targetCode !== undefined || c.targetActress !== undefined)) {
      return { type: 'work', name: c.targetName || '', code: c.targetCode || '', actress: c.targetActress || '' };
    }
    if (c.targetType === 'actress') {
      const name = c.targetName || '';
      return { type: 'actress', name, code: '', actress: name };
    }
    const name = c.targetName || '';
    if (c.targetType === 'work') {
      // 旧格式 "IPX-536 (演员名)" 或 "IPX-536"
      const m = name.match(/^([A-Za-z0-9-]+)\s*(?:[（(](.+)[)）])?$/);
      const code = m ? m[1] : name;
      const actress = m && m[2] ? m[2].split(/[,，]/).map(s => s.trim()).filter(Boolean).join(',') : '';
      return { type: 'work', name, code, actress };
    }
    // 'none' 或无类型：按自定义处理
    return { type: 'custom', name, code: '', actress: '' };
  },

  getCheckinStats() {
    const checkins = this.getCheckins();
    const byDate = {};
    const byActress = {};
    const byWork = {};
    const byCustom = {};
    const byMonth = {};
    let actressCount = 0;
    let workCount = 0;
    let customCount = 0;

    checkins.forEach(c => {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
      const rec = this.normalizeCheckinRecord(c);
      if (rec.type === 'actress') {
        const key = rec.actress || rec.name || '（无条目）';
        byActress[key] = (byActress[key] || 0) + 1;
        actressCount++;
      } else if (rec.type === 'work') {
        const key = rec.code || rec.name || '（无条目）';
        byWork[key] = (byWork[key] || 0) + 1;
        workCount++;
        // 作品记录同时计入其演员
        if (rec.actress) {
          rec.actress.split(',').forEach(n => {
            const t = n.trim();
            if (t) byActress[t] = (byActress[t] || 0) + 1;
          });
        }
      } else {
        const key = rec.name || '（无条目）';
        byCustom[key] = (byCustom[key] || 0) + 1;
        customCount++;
      }
      // 月份统计
      const [y, m] = c.date.split('-');
      const monthKey = `${y}-${m}`;
      byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
    });

    // 本月打卡
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonth = byMonth[currentMonth] || 0;

    return {
      total: checkins.length,
      actressCount,
      workCount,
      customCount,
      byDate,
      byActress,
      byWork,
      byCustom,
      byMonth,
      thisMonth,
    };
  },

  // 导出数据（全量 JSON：作品 + 女优 + 打卡 + 随机记录 + 名称映射）
  // IndexedDB 图片在导出时转回 base64，保证单个 JSON 文件可完整恢复。
  async exportData() {
    const videos = await Promise.all(this.getVideos().map(async v => ({
      ...v,
      cover: await this.exportImageValue(v.cover)
    })));
    const actresses = await Promise.all(this.getActresses().map(async a => ({
      ...a,
      avatar: await this.exportImageValue(a.avatar)
    })));
    const randomHistory = await Promise.all(this.getRandomHistory().map(async r => ({
      ...r,
      cover: await this.exportImageValue(r.cover)
    })));
    return {
      version: 3,
      exportedAt: new Date().toISOString(),
      videos,
      actresses,
      checkins: this.getCheckins(),
      randomHistory,
      nameMappings: this.getNameMappings()
    };
  },

  // 导入数据
  // mode: 'merge' | 'replace'
  async importData(data, mode = 'merge') {
    if (!data || typeof data !== 'object') {
      throw new Error('无效的数据格式');
    }

    const normalizeImageValue = async (value) => {
      if (!value || ImageStore.isRef(value)) return value || '';
      if (typeof value === 'string' && value.startsWith('data:image')) {
        try {
          return await ImageStore.saveDataUrl(value);
        } catch (err) {
          console.warn('导入图片到 IndexedDB 失败，保留 base64', err);
          return value;
        }
      }
      return value;
    };

    const videos = Array.isArray(data.videos) ? await Promise.all(data.videos.map(async v => ({ ...v, cover: await normalizeImageValue(v.cover) }))) : [];
    const actresses = Array.isArray(data.actresses) ? await Promise.all(data.actresses.map(async a => ({ ...a, avatar: await normalizeImageValue(a.avatar) }))) : [];
    const checkins = Array.isArray(data.checkins) ? data.checkins : [];
    const randomHistory = Array.isArray(data.randomHistory) ? await Promise.all(data.randomHistory.map(async r => ({ ...r, cover: await normalizeImageValue(r.cover) }))) : [];
    const nameMappings = Array.isArray(data.nameMappings) ? data.nameMappings : [];

    // 数据校验与清理
    const validVideos = videos.filter(v => v.code || v.id).map(v => ({
      ...v,
      id: v.id || 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    }));

    const validActresses = actresses.filter(a => a.name || a.id).map(a => ({
      ...a,
      id: a.id || 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      favorited: a.favorited || false
    }));

    if (mode === 'replace') {
      this.saveVideos(validVideos);
      this.saveActresses(validActresses);
      this.saveCheckins(checkins);
      localStorage.setItem(this._keyRandomHistory, JSON.stringify(randomHistory));
      this.saveNameMappings(nameMappings);
    } else {
      // 合并：以 id 去重，新数据优先
      const existingVideos = this.getVideos();
      const existingActresses = this.getActresses();

      const videoMap = new Map(existingVideos.map(v => [v.id, v]));
      validVideos.forEach(v => videoMap.set(v.id, v));

      const actressMap = new Map(existingActresses.map(a => [a.id, a]));
      validActresses.forEach(a => actressMap.set(a.id, a));

      this.saveVideos(Array.from(videoMap.values()));
      this.saveActresses(Array.from(actressMap.values()));

      // 合并打卡记录（以 id 去重）
      const existingCheckins = this.getCheckins();
      const checkinMap = new Map(existingCheckins.map(c => [c.id, c]));
      checkins.forEach(c => checkinMap.set(c.id, c));
      this.saveCheckins(Array.from(checkinMap.values()));

      // 合并随机记录（以 id 去重）
      const existingRandom = this.getRandomHistory();
      const randomMap = new Map(existingRandom.map(r => [r.id, r]));
      randomHistory.forEach(r => randomMap.set(r.id, r));
      const mergedRandom = Array.from(randomMap.values());
      if (mergedRandom.length > 50) mergedRandom.length = 50;
      localStorage.setItem(this._keyRandomHistory, JSON.stringify(mergedRandom));

      // 合并名称映射（以排序后的原名集合去重，新数据优先）
      const existingMappings = this.getNameMappings();
      const mappingMap = new Map(existingMappings.map(m => [m_original_split(m.original).sort().join(','), m]));
      nameMappings.forEach(m => mappingMap.set(m_original_split(m.original).sort().join(','), m));
      this.saveNameMappings(Array.from(mappingMap.values()));
    }

    return {
      videoCount: validVideos.length,
      actressCount: validActresses.length,
      checkinCount: checkins.length
    };
  }
};
