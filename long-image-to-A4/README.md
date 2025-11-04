# 长图自动拆分成A4尺寸工具

这是一个Python脚本，可以将长图自动拆分成多个A4尺寸的图片，方便打印。

## 功能特点

- ✨ 自动将长图按A4纸张比例（210mm x 297mm）拆分
- 📏 支持自定义DPI（默认300 DPI高质量打印）
- 🎨 自动调整图片宽度适配A4宽度
- 📄 最后一页自动补白色背景
- 💾 输出PNG格式，保证高质量

## 环境部署

### 1. 创建虚拟环境

```powershell
# 进入项目目录
cd "d:\GitHub Cave\MyToyCode\long-image-to-A4"

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\Activate.ps1
```

如果PowerShell执行策略限制，可能需要先运行：
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 2. 安装依赖

```powershell
# 确保虚拟环境已激活
pip install -r requirements.txt
```

## 使用方法

### 基本用法

```powershell
# 激活虚拟环境（如果还未激活）
.\venv\Scripts\Activate.ps1

# 拆分图片（使用默认300 DPI）
python split_long_image.py your_long_image.png
```

### 指定DPI

```powershell
# 使用200 DPI（文件更小）
python split_long_image.py your_long_image.jpg 200

# 使用600 DPI（更高质量）
python split_long_image.py your_long_image.png 600
```

### 输出说明

- 输出文件会保存在 `output` 文件夹中
- 文件命名格式：`原文件名_page_001.png`, `原文件名_page_002.png` 等
- 每个输出文件都是标准A4尺寸

## 示例

假设你有一张名为 `long_screenshot.png` 的长图：

```powershell
python split_long_image.py long_screenshot.png
```

程序会：
1. 读取 `long_screenshot.png`
2. 计算需要拆分的页数
3. 在 `output` 文件夹中生成：
   - `long_screenshot_page_001.png`
   - `long_screenshot_page_002.png`
   - `long_screenshot_page_003.png`
   - ...

## 技术参数

- **A4纸张尺寸**：210mm × 297mm
- **默认DPI**：300（适合高质量打印）
- **像素尺寸**（300 DPI）：2480 × 3508 像素
- **支持格式**：PNG, JPG, JPEG, BMP 等常见图片格式

## 常见问题

### Q: 如何退出虚拟环境？
```powershell
deactivate
```

### Q: 如何调整输出质量？
修改DPI参数：
- 150 DPI：普通打印
- 300 DPI：高质量打印（推荐）
- 600 DPI：专业印刷

### Q: 支持哪些图片格式？
支持所有PIL/Pillow支持的格式，包括PNG、JPG、JPEG、BMP、GIF等。

## 依赖项

- Python 3.7+
- Pillow (PIL Fork) - 图像处理库

## 许可证

MIT License
