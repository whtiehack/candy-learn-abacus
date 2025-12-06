# 🍬 糖果的珠心算小屋 (Candy's Abacus Cabin)

专为一年级女生设计的轻量级、可爱风珠心算练习 Web 应用。

## 📖 项目简介

这是一个纯前端的 React 网页应用，旨在通过游戏化的方式帮助小朋友练习珠心算。项目无需后端，所有进度数据存储在本地浏览器中（LocalStorage）。应用包含虚拟算盘辅助、糖果奖励机制、贴纸收集成就系统以及防沉迷设置。

## ✨ 核心功能

### 🎮 游戏模式
*   **多难度选择**：
    *   🌟 **10以内加减**：基础练习。
    *   📊 **20以内加减**：进位退位练习。
    *   🔢 **两位数加减**：大数挑战。
    *   ⚡ **1位数3连/4连加减**：混合运算心算挑战（结果可超10，过程不出现负数）。
*   **交互方式**：支持“算盘拨珠输入”和“选择题”两种模式。
*   **虚拟算盘**：直观的算珠动画，辅助理解数位关系（个位、十位、百位）。

### 🏆 激励系统
*   **糖果果实**：每答对一题获得一颗糖果，实时反馈。
*   **神奇花园**：可视化的糖果树，随着糖果数量增加而变得丰富。
*   **贴纸收集册**：达成特定成就（如连续答对、总题数）解锁精美贴纸。
*   **炫酷特效**：答对时的全屏彩带、烟花庆祝动画。

### 🛡️ 家长控制
*   **每日题量限制**：保护视力，默认每日 20 题（可配置）。
*   **辅助开关**：可隐藏/显示算盘及其数值提示。
*   **数据管理**：支持重置所有游戏进度。

## 🛠️ 技术栈

*   **Core**: React 19, TypeScript
*   **Styling**: Tailwind CSS (通过 CDN 配置), Custom CSS Animations
*   **Icons**: Lucide React
*   **Storage**: Browser LocalStorage (无后端)
*   **Deployment**: Vercel Ready

## 📂 项目结构

```
/
├── index.html              # 入口文件 (含 Tailwind CDN 配置)
├── src/
│   ├── App.tsx             # 主路由与布局容器
│   ├── types.ts            # TypeScript 类型定义
│   ├── constants.ts        # 游戏配置、贴纸数据、默认设置
│   ├── services/
│   │   ├── mathService.ts    # 出题逻辑、难度算法
│   │   └── storageService.ts # 本地数据持久化逻辑
│   ├── components/
│   │   ├── Button.tsx        # 通用按钮组件
│   │   └── AbacusVisual.tsx  # 交互式虚拟算盘组件
│   └── views/
│       ├── HomeView.tsx        # 首页
│       ├── LevelSelectView.tsx # 难度选择页
│       ├── GameView.tsx        # 答题游戏主页
│       ├── RewardsView.tsx     # 奖励与成就页
│       └── SettingsView.tsx    # 家长设置页
```

## 🚀 快速开始

1.  **环境准备**
    确保已安装 Node.js。

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **本地运行**
    ```bash
    npm run dev
    ```

4.  **构建部署**
    ```bash
    npm run build
    ```

## 🎨 设计细节

*   **配色**：采用 Candy Pink (#F9C6DA) 与 Mint Green (#C9F5E2) 为主色调，营造柔和可爱的氛围。
*   **动画**：大量使用 CSS Keyframes 实现 Q 弹 (Bounce)、浮动 (Float) 和光效 (Shine)，增加童趣。
*   **无障碍**：清晰的大按钮设计，适合儿童手指触控操作。

## 📝 开发备注

*   **出题逻辑**：位于 `mathService.ts`。连加连减模式采用了动态生成算法，确保每一步运算结果不为负数（适应低龄段认知），但最终结果没有硬性上限。
*   **数据存储**：数据保存在 `localStorage` 的 `candy_abacus_data_v1` 字段下。

---
Made with ❤️ for Candy.