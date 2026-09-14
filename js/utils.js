// ==================== 通用纯函数工具 ====================
// 无 DOM、无数据层依赖的纯函数，供 db.js / app.js 共用。
// 加载顺序要求：本文件必须在 db.js、app.js 之前引入。

// 将映射的 original 字段按逗号拆分为小写名称数组（original 可含多个别名，逗号分隔）
function m_original_split(original) {
  return (original || '').split(',').map(o => o.trim().toLowerCase()).filter(Boolean);
}

// HTML 转义（用于拼接 innerHTML / 属性值）
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

// 规整逗号分隔的名称串：去首尾空白、去空项、按大小写不敏感去重（保持原顺序）
// 用于避免「A,A」这类重复女优名写入数据
function normalizeNameList(str) {
  if (!str) return '';
  const seen = new Set();
  return str.split(',').map(n => n.trim()).filter(n => {
    if (!n) return false;
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).join(',');
}

// 时间戳安全转换：缺失或非法时间统一返回 0，避免 NaN 参与排序导致结果不确定
function toTimestamp(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
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
