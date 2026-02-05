# Tasks: 修复9档自由模式交互问题及优化屏幕方向逻辑

## 实施计划概览

```
TASK-1: 修改 AbacusVisual Props 定义
    ↓
TASK-2: 实现多指触控状态管理
    ↓
TASK-3: 添加方向变化监听与状态重置
    ↓
TASK-4: 修改 FreeModeView 宽屏检测
    ↓
TASK-5: 回归测试 3档模式
```

---

## TASK-1: 修改 AbacusVisual Props 定义

### 文件
`components/AbacusVisual.tsx`

### 变更内容

1. **添加新 Props**
```typescript
interface AbacusVisualProps {
  problem?: MathProblem;
  showValue: boolean;
  onChange?: (value: number) => void;
  digitCount?: number;
  labels?: string[];
  // NEW: Split props
  layoutLandscape?: boolean;
  inputRotated?: boolean;
  /** @deprecated Use layoutLandscape + inputRotated instead */
  forceLandscape?: boolean;
}
```

2. **Props 解析逻辑**
```typescript
// Inside AbacusVisual component:
const effectiveLayoutLandscape = layoutLandscape ?? forceLandscape ?? false;
const effectiveInputRotated = inputRotated ?? forceLandscape ?? false;
```

3. **替换所有 `forceLandscape` 使用**
- 布局相关（isCompact, 尺寸计算）→ 使用 `effectiveLayoutLandscape`
- 坐标相关（getCoord）→ 使用 `effectiveInputRotated`

### 验证点
- [x] Props 类型定义正确
- [x] effectiveLayoutLandscape 和 effectiveInputRotated 计算正确
- [x] 所有原 forceLandscape 使用点已替换

---

## TASK-2: 实现多指触控状态管理

### 文件
`components/AbacusVisual.tsx` (Rod 组件)

### 变更内容

1. **替换 Ref 为 Map**
```typescript
// OLD:
const heavenDragRef = useRef<{ id: number, startVal: number, hasTriggered: boolean } | null>(null);
const earthDragRef = useRef<{ id: number, startVal: number, initialValue: number, hasTriggered: boolean } | null>(null);

// NEW:
interface DragState {
  startVal: number;
  hasTriggered: boolean;
}

interface EarthDragState extends DragState {
  initialValue: number;
}

const heavenDragMap = useRef<Map<number, DragState>>(new Map());
const earthDragMap = useRef<Map<number, EarthDragState>>(new Map());
```

2. **修改 handleHeavenPointerDown**
```typescript
const handleHeavenPointerDown = (e: React.PointerEvent) => {
  e.preventDefault();
  // First pointer wins
  if (heavenDragMap.current.size > 0) return;

  e.currentTarget.setPointerCapture(e.pointerId);
  heavenDragMap.current.set(e.pointerId, {
    startVal: getCoord(e),
    hasTriggered: false
  });
};
```

3. **修改 handleHeavenMove**
```typescript
const handleHeavenMove = (e: React.PointerEvent) => {
  const state = heavenDragMap.current.get(e.pointerId);
  if (!state || state.hasTriggered) return;

  const currentVal = getCoord(e);
  const delta = currentVal - state.startVal;

  if (!heavenActive && delta > DRAG_THRESHOLD) {
    updateWithSound(v => v >= 5 ? v : v + 5);
    state.hasTriggered = true;
  } else if (heavenActive && delta < -DRAG_THRESHOLD) {
    updateWithSound(v => v >= 5 ? v - 5 : v);
    state.hasTriggered = true;
  }
};
```

4. **修改 handleHeavenUp**
```typescript
const handleHeavenUp = (e: React.PointerEvent) => {
  const state = heavenDragMap.current.get(e.pointerId);
  if (!state) return;

  if (!state.hasTriggered && Math.abs(getCoord(e) - state.startVal) < DRAG_THRESHOLD) {
    updateWithSound(v => v >= 5 ? v - 5 : v + 5);
  }

  heavenDragMap.current.delete(e.pointerId);
  e.currentTarget.releasePointerCapture(e.pointerId);
};
```

5. **类似修改 Earth 相关处理器**

### 验证点
- [x] Map 正确初始化
- [x] 先到先得逻辑正确
- [x] 指针释放时正确清理 Map
- [x] 多指操作互不干扰

---

## TASK-3: 添加方向变化监听与状态重置

### 文件
`components/AbacusVisual.tsx` (Rod 组件)

### 变更内容

1. **添加方向变化监听器**
```typescript
useEffect(() => {
  const handleOrientationChange = () => {
    heavenDragMap.current.clear();
    earthDragMap.current.clear();
  };

  window.addEventListener('resize', handleOrientationChange);
  window.addEventListener('orientationchange', handleOrientationChange);

  return () => {
    window.removeEventListener('resize', handleOrientationChange);
    window.removeEventListener('orientationchange', handleOrientationChange);
  };
}, []);
```

### 验证点
- [x] resize 事件正确监听
- [x] orientationchange 事件正确监听
- [x] 事件触发时 Map 被清空
- [x] cleanup 正确移除监听器

---

## TASK-4: 修改 FreeModeView 宽屏检测

### 文件
`views/FreeModeView.tsx`

### 变更内容

1. **添加宽屏状态**
```typescript
const [isWideScreen, setIsWideScreen] = useState(false);

useEffect(() => {
  const checkWideScreen = () => {
    setIsWideScreen(window.innerWidth >= window.innerHeight);
  };

  checkWideScreen();
  window.addEventListener('resize', checkWideScreen);
  window.addEventListener('orientationchange', checkWideScreen);

  return () => {
    window.removeEventListener('resize', checkWideScreen);
    window.removeEventListener('orientationchange', checkWideScreen);
  };
}, []);
```

2. **条件性应用旋转 CSS**
```typescript
// Container class based on screen orientation
const containerClass = isWideScreen
  ? 'w-full h-full flex flex-col items-stretch bg-gradient-to-br from-candy-pink/10 to-candy-mint/10'
  : 'w-[100vh] h-[100vw] absolute top-0 left-full origin-top-left transform rotate-90 flex flex-col items-stretch bg-gradient-to-br from-candy-pink/10 to-candy-mint/10';
```

3. **传递正确的 Props**
```typescript
<AbacusVisual
  showValue={false}
  digitCount={9}
  labels={LABELS_9}
  layoutLandscape={true}
  inputRotated={!isWideScreen}
  onChange={setCurrentValue}
/>
```

### 验证点
- [x] 宽屏检测逻辑正确
- [x] CSS 类名条件性应用
- [x] inputRotated 与旋转状态同步
- [x] layoutLandscape 始终为 true

---

## TASK-5: 回归测试 3档模式

### 文件
`views/GameView.tsx` (无需修改，仅验证)

### 验证内容

1. **验证 AbacusVisual 调用**
```typescript
// 现有调用不传递任何新 props，应使用默认值
<AbacusVisual
  key={problem.id}
  problem={problem}
  showValue={gameData.settings.showAbacusValue}
  onChange={setCurrentAbacusValue}
/>
// effectiveLayoutLandscape = false
// effectiveInputRotated = false
```

### 验证点
- [x] 3档模式珠子滑动正常（使用 clientY）
- [x] 3档模式珠子点击正常
- [x] 数值计算正确
- [x] 无视觉布局变化

---

## 测试矩阵

| 场景 | 设备 | 操作 | 预期结果 |
|------|------|------|----------|
| 3档滑动 | 手机竖屏 | 向下滑上珠 | 上珠激活 |
| 3档点击 | 手机竖屏 | 点击下珠 | 下珠状态切换 |
| 9档滑动-窄屏 | 手机竖屏 | 向下滑上珠（视觉） | 上珠激活 |
| 9档滑动-宽屏 | 平板横屏 | 向下滑上珠 | 上珠激活 |
| 9档多指 | 手机/平板 | 同时操作上下珠 | 两珠同时响应 |
| 宽屏检测 | 桌面浏览器 | 调整窗口宽高 | 布局动态切换 |

---

## 依赖关系

```
TASK-1 ← TASK-2 (需要先定义 Props)
TASK-1 ← TASK-3 (需要先定义 Props)
TASK-1 ← TASK-4 (需要先定义 Props)
TASK-4 ← TASK-5 (需要先完成 FreeModeView 修改)
```

## 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 坐标映射错误 | TASK-5 回归测试 3档模式 |
| 多指冲突 | 严格按 pointerId 隔离 |
| iOS Safari 差异 | 真机测试 |
