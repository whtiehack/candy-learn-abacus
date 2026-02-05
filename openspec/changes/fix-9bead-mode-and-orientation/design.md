# Design: 修复9档自由模式交互问题及优化屏幕方向逻辑

## Architecture Overview

### Current State
```
FreeModeView
├── CSS rotate-90 (unconditional)
└── AbacusVisual (forceLandscape=true)
    ├── getCoord() → clientX when forceLandscape
    ├── heavenDragRef (single pointer)
    └── earthDragRef (single pointer)
```

### Target State
```
FreeModeView
├── isWideScreen detection (innerWidth >= innerHeight)
├── CSS rotate-90 (conditional: only when !isWideScreen)
└── AbacusVisual
    ├── layoutLandscape: boolean (layout mode)
    ├── inputRotated: boolean (coordinate mapping)
    ├── getCoord() → axis selection + sign correction
    ├── heavenDragMap (per-pointer Map)
    └── earthDragMap (per-pointer Map)
```

## Technical Decisions

### TD-1: 坐标映射修复

**决策**: 修正 `getCoord()` 函数以正确处理 CSS rotate-90 的坐标变换

**理由**: CSS `rotate(90deg)` 顺时针旋转后，视觉上的"向下"对应屏幕坐标的"向右"(+X)。当前实现假设正 delta 表示"向下"是正确的，但需要验证。

**实现**:
```typescript
const getCoord = (e: React.PointerEvent): number => {
  if (inputRotated) {
    // CSS rotate-90 CW: visual down = screen right (+X)
    return e.clientX;
  }
  return e.clientY;
};
```

**约束**:
- `DRAG_THRESHOLD = 8px` (保持不变)
- 仅使用 delta 值判断，不使用绝对坐标

### TD-2: 宽屏检测

**决策**: 使用 `innerWidth >= innerHeight` 作为宽屏判断标准

**理由**: 用户确认使用简单判断，等于时也视为宽屏

**实现**:
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

**约束**:
- 无防抖处理（简单判断足够快）
- 同时监听 `resize` 和 `orientationchange`

### TD-3: Props 拆分与向后兼容

**决策**: 拆分 `forceLandscape` 为 `layoutLandscape` 和 `inputRotated`，保留 `forceLandscape` 作为别名

**理由**: 用户确认需要向后兼容

**实现**:
```typescript
interface AbacusVisualProps {
  // ... existing props
  layoutLandscape?: boolean;  // Controls layout/sizing
  inputRotated?: boolean;     // Controls coordinate mapping
  /** @deprecated Use layoutLandscape + inputRotated instead */
  forceLandscape?: boolean;   // Alias: sets both to true
}

// Inside component:
const effectiveLayoutLandscape = layoutLandscape ?? forceLandscape ?? false;
const effectiveInputRotated = inputRotated ?? forceLandscape ?? false;
```

**Props 行为矩阵**:
| layoutLandscape | inputRotated | 用例 |
|-----------------|--------------|------|
| false | false | 3档模式 (GameView) |
| true | true | 9档旋转模式 (手机竖屏) |
| true | false | 9档原生横屏 (宽屏设备) |
| false | true | 无效组合，忽略 |

### TD-4: 多点触控支持

**决策**: 使用 per-pointer Map 替换单一 ref，冲突策略为"先到先得"

**理由**: 用户确认使用先到先得策略

**实现**:
```typescript
interface DragState {
  startVal: number;      // 起始坐标
  initialValue: number;  // 起始珠子值 (earth only)
  hasTriggered: boolean; // 是否已触发状态变化
}

const heavenDragMap = useRef<Map<number, DragState>>(new Map());
const earthDragMap = useRef<Map<number, { beadIndex: number } & DragState>>(new Map());

// On pointer down:
if (heavenDragMap.current.size === 0) {
  heavenDragMap.current.set(pointerId, { startVal, hasTriggered: false });
}
// else: ignore (first pointer wins)

// On pointer up/cancel:
heavenDragMap.current.delete(pointerId);
```

**约束**:
- 同一珠子类型只允许一个活跃指针
- 不同珠子类型（heaven/earth）可同时有活跃指针
- 每个指针独立应用 `DRAG_THRESHOLD`

### TD-5: 方向变化处理

**决策**: 方向变化时重置所有拖拽状态

**理由**: 用户确认使用重置策略

**实现**:
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

## File Changes

### Modified Files
1. **views/FreeModeView.tsx**
   - 添加 `isWideScreen` 状态和检测逻辑
   - 条件性应用 CSS `rotate-90`
   - 传递正确的 `layoutLandscape` 和 `inputRotated` props

2. **components/AbacusVisual.tsx**
   - 添加 `layoutLandscape` 和 `inputRotated` props
   - 保留 `forceLandscape` 向后兼容
   - 替换 `heavenDragRef`/`earthDragRef` 为 Map
   - 添加方向变化监听器

### No New Files Required

## Risks & Mitigations

| 风险 | 严重度 | 缓解措施 |
|------|--------|----------|
| 坐标映射修改影响3档模式 | 中 | 3档模式不传递任何新 props，行为不变 |
| Map 在低端设备上 GC 压力 | 低 | Map 最多 2 个条目，可忽略 |
| resize 事件频繁触发重置 | 低 | 仅清空 Map，无其他副作用 |
| iOS Safari 指针事件差异 | 中 | 需要真机测试验证 |

## Dependencies
- 无外部依赖
- 需要真机测试触摸交互
