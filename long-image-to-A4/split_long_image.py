"""
长图自动拆分成A4尺寸图片的脚本

功能：
1. 读取长图
2. 按A4纸张比例（210mm x 297mm）拆分图片
3. 保存为多个A4尺寸的图片文件

使用方法：
python split_long_image.py <输入图片路径>
"""

import os
import sys
from PIL import Image
from pathlib import Path


class ImageSplitter:
    # A4纸张尺寸（单位：像素，基于300 DPI）
    A4_WIDTH_PX = int(210 / 25.4 * 300)   # 2480 像素
    A4_HEIGHT_PX = int(297 / 25.4 * 300)  # 3508 像素
    
    def __init__(self, image_path, dpi=300):
        """
        初始化图片拆分器
        
        参数：
            image_path: 输入图片路径
            dpi: 输出图片的DPI，默认300（高质量打印）
        """
        self.image_path = image_path
        self.dpi = dpi
        # 根据DPI调整A4尺寸
        self.a4_width = int(210 / 25.4 * dpi)
        self.a4_height = int(297 / 25.4 * dpi)
        
    def load_image(self):
        """加载图片"""
        try:
            self.image = Image.open(self.image_path)
            print(f"成功加载图片: {self.image_path}")
            print(f"图片尺寸: {self.image.size[0]} x {self.image.size[1]} 像素")
            return True
        except Exception as e:
            print(f"加载图片失败: {e}")
            return False
    
    def calculate_splits(self):
        """计算需要拆分的数量"""
        img_width, img_height = self.image.size
        
        # 计算宽度缩放比例，使图片宽度适配A4宽度
        scale = self.a4_width / img_width
        
        # 缩放后的图片高度
        scaled_height = int(img_height * scale)
        
        # 计算需要拆分成多少页
        num_pages = (scaled_height + self.a4_height - 1) // self.a4_height
        
        print(f"图片将被拆分成 {num_pages} 页A4纸")
        
        return scale, scaled_height, num_pages
    
    def split_and_save(self, output_dir=None):
        """
        拆分并保存图片
        
        参数：
            output_dir: 输出目录，默认为输入图片所在目录下的output文件夹
        """
        if not hasattr(self, 'image'):
            print("请先加载图片！")
            return False
        
        # 设置输出目录
        if output_dir is None:
            input_dir = Path(self.image_path).parent
            output_dir = input_dir / "output"
        else:
            output_dir = Path(output_dir)
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 计算拆分参数
        scale, scaled_height, num_pages = self.calculate_splits()
        img_width, img_height = self.image.size
        
        # 先调整图片宽度为A4宽度
        new_width = self.a4_width
        new_height = int(img_height * scale)
        resized_image = self.image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        print(f"调整后图片尺寸: {new_width} x {new_height} 像素")
        
        # 获取原文件名（不含扩展名）
        base_name = Path(self.image_path).stem
        
        # 拆分并保存
        for i in range(num_pages):
            # 计算当前页的裁剪区域
            top = i * self.a4_height
            bottom = min((i + 1) * self.a4_height, new_height)
            
            # 裁剪图片
            cropped = resized_image.crop((0, top, new_width, bottom))
            
            # 如果最后一页高度不足A4，创建白色背景并粘贴
            if bottom - top < self.a4_height:
                # 创建白色A4画布
                canvas = Image.new('RGB', (self.a4_width, self.a4_height), 'white')
                # 将裁剪的图片粘贴到画布顶部
                canvas.paste(cropped, (0, 0))
                cropped = canvas
            
            # 保存图片
            output_path = output_dir / f"{base_name}_page_{i+1:03d}.png"
            cropped.save(output_path, dpi=(self.dpi, self.dpi))
            print(f"已保存第 {i+1}/{num_pages} 页: {output_path}")
        
        print(f"\n✓ 拆分完成！所有图片已保存到: {output_dir}")
        return True


def main():
    """主函数"""
    print("=" * 60)
    print("长图自动拆分成A4尺寸工具")
    print("=" * 60)
    print()
    
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("使用方法：")
        print("  python split_long_image.py <输入图片路径> [DPI]")
        print()
        print("示例：")
        print("  python split_long_image.py long_image.png")
        print("  python split_long_image.py long_image.jpg 200")
        print()
        return
    
    image_path = sys.argv[1]
    
    # 检查DPI参数
    dpi = 300  # 默认DPI
    if len(sys.argv) >= 3:
        try:
            dpi = int(sys.argv[2])
        except ValueError:
            print(f"警告：DPI参数无效，使用默认值 {dpi}")
    
    # 检查文件是否存在
    if not os.path.exists(image_path):
        print(f"错误：找不到文件 '{image_path}'")
        return
    
    print(f"输入图片: {image_path}")
    print(f"输出DPI: {dpi}")
    print()
    
    # 创建拆分器并执行
    splitter = ImageSplitter(image_path, dpi=dpi)
    
    if splitter.load_image():
        splitter.split_and_save()


if __name__ == "__main__":
    main()
