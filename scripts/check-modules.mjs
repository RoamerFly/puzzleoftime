#!/usr/bin/env node

/**
 * === check:modules — 模块隔离检查脚本 ===
 *
 * 检查规则：
 * 1. 跨模块导入：禁止从其他模块内部路径导入
 * 2. 资源混用：禁止在模块外部引用模块内部资源路径
 * 3. CSS 污染：检查模块 CSS 是否使用专属前缀
 *
 * 用法：node scripts/check-modules.mjs
 * 退出码：0 = 通过，1 = 有违规
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, relative, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '..', 'src');
const MODULES_DIR = resolve(SRC, 'modules');

const MODULE_NAMES = ['elder', 'caregiver', 'manager'];
const MODULE_PREFIXES = { elder: 'elder-', caregiver: 'caregiver-', manager: 'manager-' };
const MODULE_PUBLIC_FILES = ['index.ts', 'index.tsx'];

let violations = 0;

function report(category, message) {
  console.error(`\x1b[31m[${category}]\x1b[0m ${message}`);
  violations++;
}

function isInModuleDir(filePath, moduleName) {
  return filePath.startsWith(resolve(MODULES_DIR, moduleName) + '/') ||
         filePath === resolve(MODULES_DIR, moduleName);
}

function getModuleOfPath(filePath) {
  for (const m of MODULE_NAMES) {
    if (isInModuleDir(filePath, m)) return m;
  }
  return null;
}

// 递归收集 src/ 下所有 .ts/.tsx/.css 文件
function collectFiles(dir, ext) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = resolve(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      results.push(...collectFiles(fp, ext));
    } else if (e.name.endsWith(ext)) {
      results.push(fp);
    }
  }
  return results;
}

const tsFiles = collectFiles(SRC, '.ts').filter(f => !f.endsWith('.d.ts'));
const tsxFiles = collectFiles(SRC, '.tsx');
const cssFiles = collectFiles(SRC, '.css');

const allSrcFiles = [...tsFiles, ...tsxFiles];

// ============================================================
// 规则 1：跨模块导入检查
// ============================================================
console.log('\n=== 规则 1：跨模块导入检查 ===\n');

for (const file of allSrcFiles) {
  const content = readFileSync(file, 'utf8');
  const relPath = relative(SRC, file);
  const fileModule = getModuleOfPath(file);

  // 匹配 import ... from '...' 或 import(...) 中的路径
  const importRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRe.exec(content)) !== null) {
    const importPath = match[1];

    // 只检查相对路径
    if (!importPath.startsWith('.')) continue;

    const resolved = resolve(dirname(file), importPath);
    const resolvedRel = relative(SRC, resolved);
    const targetModule = getModuleOfPath(resolved);

    // 规则 1a：禁止从其他模块内部导入（只允许导入其他模块的 index.ts）
    if (targetModule && targetModule !== fileModule) {
      const targetBase = resolve(MODULES_DIR, targetModule);
      const targetRel = relative(targetBase, resolved);
      // 允许导入目标模块的 index.ts/index.tsx 或目录本身（隐式 index）
      const isIndexImport = targetRel === 'index.ts' || targetRel === 'index.tsx' || targetRel === '';
      if (!isIndexImport) {
        report('CROSS_MODULE',
          `${relPath} → 深入导入了 ${targetModule} 模块内部文件 (${targetRel})，只允许通过 index.ts 导入`);
      }
    }

    // 规则 1b：禁止跨模块引用（从模块 A 导入模块 B 的任何内容，除了公共注册文件）
    if (fileModule && targetModule && fileModule !== targetModule) {
      // register.ts 是唯一的例外
      if (!file.endsWith('/register.ts') && !file.endsWith('/register.tsx')) {
        report('CROSS_MODULE',
          `${relPath} → 导入了其他模块 (${targetModule})，模块间禁止直接引用`);
      }
    }
  }
}

// ============================================================
// 规则 2：资源混用检查
// ============================================================
console.log('\n=== 规则 2：资源混用检查 ===\n');

for (const file of allSrcFiles) {
  const content = readFileSync(file, 'utf8');
  const relPath = relative(SRC, file);
  const fileModule = getModuleOfPath(file);

  // 检查是否有硬编码的 assets 路径引用
  const assetPathRe = /\/assets\/(elder|caregiver|manager)\//g;
  let assetMatch;
  while ((assetMatch = assetPathRe.exec(content)) !== null) {
    const refModule = assetMatch[1];
    // 如果当前文件不在模块目录下，或者在模块目录下但引用了其他模块的资源
    if (!fileModule) {
      // 公共层文件引用了模块专属资源 — 只允许通过模块的 assets.ts 访问
      // 检查是否从 assets.ts 导入
      const isAssetIndex = content.includes(`./assets/assets`) ||
                           content.includes(`from './assets`);
      // 如果当前文件是模块的 assets.ts，允许引用
      const isModuleAssetIndex = file.includes('/modules/') && file.includes('/assets/assets.ts');
      if (!isModuleAssetIndex) {
        report('ASSET_MIXING',
          `${relPath} → 引用了 ${refModule} 模块的资源路径 (/assets/${refModule}/...)，公共层不应直接引用模块资源`);
      }
    } else if (fileModule !== refModule) {
      report('ASSET_MIXING',
        `${relPath} → ${fileModule} 模块引用了 ${refModule} 模块的资源路径 (/assets/${refModule}/...)，禁止跨模块引用资源`);
    }
  }
}

// ============================================================
// 规则 3：CSS 污染检查
// ============================================================
console.log('\n=== 规则 3：CSS 污染检查 ===\n');

for (const cssFile of cssFiles) {
  const content = readFileSync(cssFile, 'utf8');
  const relPath = relative(SRC, cssFile);
  const fileModule = getModuleOfPath(cssFile);

  // 只检查模块目录下的 CSS
  if (!fileModule) continue;

  const prefix = MODULE_PREFIXES[fileModule];

  // 提取所有类选择器（排除伪类、属性选择器等）
  const classRe = /\.([a-zA-Z_][\w-]*)\s*[{,]/g;
  let classMatch;
  while ((classMatch = classRe.exec(content)) !== null) {
    const className = classMatch[1];

    // 跳过 :global 包装内的、或明显是全局/通用类的
    // CSS Module 文件 (.module.css) 本身就有作用域隔离，但纯 .css 文件需要检查
    if (cssFile.endsWith('.module.css')) {
      // CSS Module 有自动作用域，但仍然建议使用模块前缀
      // 跳过 :global() 块内的检查
      const beforeMatch = content.substring(0, classMatch.index);
      const linesBefore = beforeMatch.split('\n');
      const currentLine = linesBefore[linesBefore.length - 1] || '';
      if (currentLine.includes(':global')) continue;
      // CSS Module 文件不强求前缀（因为本身有作用域）
      continue;
    }

    // 纯 CSS 文件必须有模块前缀
    if (!className.startsWith(prefix)) {
      // 允许一些基础类名（如 module-root、scene-root 后面跟模块前缀的情况）
      // 但对于纯CSS文件必须严格
      report('CSS_POLLUTION',
        `${relPath} → 类名 ".${className}" 没有使用 ${fileModule} 模块专属前缀 "${prefix}"`);
      break; // 只报第一个违规，避免刷屏
    }
  }
}

// ============================================================
// 结果汇总
// ============================================================
console.log('\n' + '='.repeat(50));
if (violations === 0) {
  console.log('\x1b[32m✅ 模块隔离检查通过！未发现违规。\x1b[0m');
  process.exit(0);
} else {
  console.log(`\x1b[31m❌ 发现 ${violations} 处违规，请修复后重试。\x1b[0m`);
  process.exit(1);
}
