"""
批量拆分图片脚本
自动处理当前目录下的所有图片文件
"""

import os
from pathlib import Path
from split_long_image import ImageSplitter


def batch_split_images(dpi=300):
    """批量拆分当前目录下的所有图片"""
    
    # 支持的图片格式
    image_extensions = {'.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp'}
    
    # 获取当前目录
    current_dir = Path(__file__).parent
    
    # 查找所有图片文件
    image_files = [
        f for f in current_dir.iterdir() 
        if f.is_file() and f.suffix.lower() in image_extensions
    ]
    
    if not image_files:
        print("未找到任何图片文件！")
        return
    
    print("=" * 60)
    print(f"找到 {len(image_files)} 个图片文件")
    print("=" * 60)
    print()
    
    for idx, image_file in enumerate(image_files, 1):
        print(f"\n{'='*60}")
        print(f"处理第 {idx}/{len(image_files)} 个文件")
        print(f"{'='*60}")
        print()
        
        # 为每个图片创建独立的输出文件夹
        output_dir = current_dir / "output" / image_file.stem
        
        splitter = ImageSplitter(str(image_file), dpi=dpi)
        
        if splitter.load_image():
            splitter.split_and_save(output_dir=output_dir)
    
    print("\n" + "=" * 60)
    print("✓ 所有图片处理完成！")
    print(f"✓ 输出目录：{current_dir / 'output'}")
    print("=" * 60)


if __name__ == "__main__":
    batch_split_images(dpi=300)
