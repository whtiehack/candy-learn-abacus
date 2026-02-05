# Proposal: 修复9档自由模式交互问题及优化屏幕方向逻辑

## Context (背景)

### 用户需求
1. **9档自由模式算盘珠无法滑动** - 用户无法通过拖拽操作移动珠子
2. **9档自由模式缺少捏珠功能** - 无法同时用拇指向上拨下珠、食指向下拨上珠（多点触控）
3. **3档模式正常工作** - 作为对比参考，3档模式的滑动和点击功能正常
4. **宽屏不应强制横屏** - 当设备屏幕已经是宽屏（宽>高）时，不应再强制旋转

### 技术约束（已发现）

#### 硬约束
| 约束 | 描述 | 影响 |
|------|------|------|
| CSS rotate-90 不改变 pointer 坐标 | `FreeModeView.tsx:26` 使用 CSS `rotate-90` 旋转容器，但 `clientX/clientY` 始终相对于视口，不受 CSS 变换影响 | 需要通过 `forceLandscape` 参数手动映射坐标轴 |
| forceLandscape 坐标映射 | `AbacusVisual.tsx:127-129` 的 `getCoord()` 函数：`forceLandscape ? e.clientX : e.clientY` | 9档模式使用 `clientX`，3档模式使用 `clientY` |
| Pointer Events 捕获机制 | 使用 `setPointerCapture/releasePointerCapture` 确保拖拽事件被正确捕获 | 事件处理器必须正确绑定到可交互元素 |
| 拖拽阈值 | `DRAG_THRESHOLD = 8px`，用于区分点击和拖拽 | 移动距离超过 8px 才触发拖拽逻辑 |

#### 软约束
| 约束 | 描述 |
|------|------|
| 3档模式无 CSS 旋转 | GameView 中的 AbacusVisual 使用默认参数，无 `forceLandscape`，无 CSS 旋转 |
| 9档模式使用虚拟横屏 | FreeModeView 通过 CSS `rotate-90` 实现虚拟横屏布局 |
| isCompact 与 forceLandscape 互斥 | `isCompact = digitCount > 5 && !forceLandscape`，9档横屏模式不启用紧凑布局 |

### 根因分析

#### 问题1：9档模式珠子无法滑动

**可能原因**（按优先级排序）：

1. **坐标映射方向错误** - CSS `rotate-90` 是顺时针旋转，视觉上的"向下"对应屏幕坐标的"向右"（+X）。当前代码假设 `forceLandscape=true` 时正 delta 表示"向下"，但实际可能需要反转。

2. **事件捕获链中断** - FreeModeView 的嵌套容器结构（`fixed inset-0` + `absolute left-full` + `rotate-90`）可能导致 pointer 事件在某个层级被阻止或坐标计算错误。

3. **触摸事件被阻止** - 某个父容器可能有 `touch-action: none` 或其他 CSS 属性阻止了触摸事件的正常传播。

#### 问题2：缺少捏珠功能（多点触控）

**分析**：当前实现使用单独的 `heavenDragRef` 和 `earthDragRef` 来跟踪上珠和下珠的拖拽状态。理论上支持多点触控（每个 ref 跟踪不同的 pointerId），但需要验证：
- 多个手指同时触摸时，事件是否正确分发到不同的珠子
- `setPointerCapture` 是否影响多点触控

#### 问题3：宽屏强制旋转

**当前行为**：FreeModeView 无条件应用 CSS `rotate-90` 旋转。

**期望行为**：当 `window.innerWidth > window.innerHeight` 时，不应用旋转。

---

## Requirements (需求)

### REQ-1: 修复9档模式珠子滑动功能

**场景**：用户在9档自由模式中，用手指在珠子上滑动

**期望结果**：
- 向下滑动上珠（天珠）→ 上珠激活（靠近横梁）
- 向上滑动上珠 → 上珠复位
- 向上滑动下珠（地珠）→ 下珠激活（靠近横梁）
- 向下滑动下珠 → 下珠复位

**验证方法**：
1. 进入9档自由模式
2. 在任意一档的上珠上向下滑动，观察上珠是否移动到横梁位置
3. 在任意一档的下珠上向上滑动，观察下珠是否移动到横梁位置
4. 数值显示应正确更新

### REQ-2: 修复9档模式珠子点击功能

**场景**：用户在9档自由模式中，点击（轻触）珠子

**期望结果**：
- 点击上珠 → 切换上珠激活状态
- 点击下珠 → 切换下珠激活状态

**验证方法**：
1. 进入9档自由模式
2. 点击任意一档的上珠，观察其状态是否切换
3. 点击任意一档的下珠，观察其状态是否切换

### REQ-3: 支持捏珠功能（多点触控）

**场景**：用户同时用拇指向上拨下珠、食指向下拨上珠

**期望结果**：
- 上珠和下珠同时响应各自的拖拽操作
- 两个操作互不干扰

**验证方法**：
1. 进入9档自由模式
2. 在同一档位，用两个手指同时操作上珠和下珠
3. 观察两个珠子是否同时正确响应

### REQ-4: 宽屏设备不强制旋转

**场景**：用户在宽屏设备（如平板横屏、桌面浏览器）上打开9档自由模式

**期望结果**：
- 当 `window.innerWidth > window.innerHeight` 时，不应用 CSS `rotate-90` 旋转
- 界面直接以横屏布局显示，无需虚拟旋转
- 珠子交互功能正常（使用 `clientY` 而非 `clientX`）

**验证方法**：
1. 在宽屏设备上打开应用
2. 进入9档自由模式
3. 观察界面是否正常显示（无旋转）
4. 测试珠子滑动和点击功能是否正常

---

## Success Criteria (成功判据)

| 编号 | 判据 | 验证方式 |
|------|------|----------|
| SC-1 | 9档模式珠子可通过滑动操作移动 | 手动测试：在移动设备上滑动珠子 |
| SC-2 | 9档模式珠子可通过点击切换状态 | 手动测试：点击珠子观察状态变化 |
| SC-3 | 9档模式支持多点触控（捏珠） | 手动测试：同时用两指操作同一档位的上下珠 |
| SC-4 | 宽屏设备不显示旋转后的界面 | 在桌面浏览器或平板横屏模式下测试 |
| SC-5 | 3档模式功能不受影响 | 回归测试：验证 GameView 中的算盘功能正常 |
| SC-6 | 数值显示正确更新 | 操作珠子后，顶部数值显示应正确反映算盘状态 |

---

## Implementation Hints (实施提示)

### 调试建议
1. 在 `getCoord()` 函数中添加 `console.log` 输出坐标值，验证坐标映射是否正确
2. 检查 `handleHeavenMove` 和 `handleEarthMove` 中的 delta 计算方向
3. 验证 CSS `rotate-90` 后，视觉"向下"对应的坐标变化方向

### 宽屏检测实现
```typescript
// FreeModeView.tsx
const [isWideScreen, setIsWideScreen] = useState(false);

useEffect(() => {
  const checkWideScreen = () => {
    setIsWideScreen(window.innerWidth > window.innerHeight);
  };
  checkWideScreen();
  window.addEventListener('resize', checkWideScreen);
  return () => window.removeEventListener('resize', checkWideScreen);
}, []);

// 条件性应用旋转
const containerClass = isWideScreen
  ? 'w-full h-full flex flex-col ...' // 无旋转
  : 'w-[100vh] h-[100vw] absolute top-0 left-full origin-top-left transform rotate-90 ...'; // 旋转
```

### 关键文件
- `views/FreeModeView.tsx` - 9档自由模式视图，需要添加宽屏检测
- `components/AbacusVisual.tsx` - 算盘组件，需要调试/修复坐标映射逻辑

---

## Dependencies (依赖)

- 无外部依赖
- 需要在真实移动设备上测试触摸交互

## Risks (风险)

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| 坐标映射修复可能影响3档模式 | 中 | 修改后需回归测试 GameView |
| 多点触控在某些设备上可能不支持 | 低 | 确保单点触控仍然正常工作 |
| 宽屏检测可能在窗口调整大小时闪烁 | 低 | 使用 debounce 或在组件挂载时只检测一次 |
