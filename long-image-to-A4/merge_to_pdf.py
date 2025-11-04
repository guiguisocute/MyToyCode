"""
将所有拆分后的A4图片合并成一个PDF文件
"""

import os
from pathlib import Path
from PIL import Image
from datetime import datetime


def natural_sort_key(filename):
    """自然排序的key函数，用于正确排序文件名"""
    import re
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', str(filename))]


def merge_images_to_pdf(output_dir=None, pdf_filename=None):
    """
    将output目录下所有子文件夹中的PNG图片合并成一个PDF
    
    参数：
        output_dir: 包含所有图片文件夹的目录（默认为当前目录下的output）
        pdf_filename: 输出PDF文件名（默认为带时间戳的文件名）
    """
    
    # 设置输出目录
    if output_dir is None:
        current_dir = Path(__file__).parent
        output_dir = current_dir / "output"
    else:
        output_dir = Path(output_dir)
    
    if not output_dir.exists():
        print(f"错误：找不到输出目录 {output_dir}")
        return False
    
    # 收集所有PNG图片
    all_images = []
    
    # 遍历output目录下的所有子文件夹
    subdirs = sorted([d for d in output_dir.iterdir() if d.is_dir()], 
                     key=natural_sort_key)
    
    if not subdirs:
        print("错误：output目录下没有找到任何子文件夹")
        return False
    
    print("=" * 60)
    print("收集图片文件...")
    print("=" * 60)
    
    for subdir in subdirs:
        # 获取该文件夹下所有PNG文件并按自然顺序排序
        png_files = sorted([f for f in subdir.glob("*.png")], 
                          key=natural_sort_key)
        
        if png_files:
            print(f"\n📁 {subdir.name}: 找到 {len(png_files)} 个文件")
            all_images.extend(png_files)
    
    if not all_images:
        print("\n错误：没有找到任何PNG图片")
        return False
    
    print(f"\n{'='*60}")
    print(f"✓ 总计找到 {len(all_images)} 个图片文件")
    print(f"{'='*60}\n")
    
    # 设置PDF文件名
    if pdf_filename is None:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        pdf_filename = f"merged_A4_{timestamp}.pdf"
    
    pdf_path = output_dir.parent / pdf_filename
    
    # 打开所有图片
    print("正在加载图片...")
    images = []
    
    for idx, img_path in enumerate(all_images, 1):
        try:
            img = Image.open(img_path)
            # 转换为RGB模式（PDF需要）
            if img.mode != 'RGB':
                img = img.convert('RGB')
            images.append(img)
            
            if idx % 10 == 0 or idx == len(all_images):
                print(f"  已加载 {idx}/{len(all_images)} 个图片...")
        except Exception as e:
            print(f"  警告：无法加载 {img_path.name}: {e}")
    
    if not images:
        print("错误：没有成功加载任何图片")
        return False
    
    # 保存为PDF
    print(f"\n正在生成PDF文件...")
    print(f"输出文件: {pdf_path}")
    
    try:
        # 第一张图片作为主图片，其余作为附加页
        images[0].save(
            pdf_path,
            save_all=True,
            append_images=images[1:],
            resolution=300.0,
            quality=95,
            optimize=False
        )
        
        # 获取文件大小
        file_size = pdf_path.stat().st_size
        size_mb = file_size / (1024 * 1024)
        
        print(f"\n{'='*60}")
        print(f"✓ PDF文件生成成功！")
        print(f"{'='*60}")
        print(f"文件位置: {pdf_path}")
        print(f"总页数: {len(images)} 页")
        print(f"文件大小: {size_mb:.2f} MB")
        print(f"{'='*60}\n")
        
        return True
        
    except Exception as e:
        print(f"\n错误：生成PDF失败: {e}")
        return False
    finally:
        # 关闭所有图片
        for img in images:
            img.close()


def main():
    """主函数"""
    print("=" * 60)
    print("A4图片合并为PDF工具")
    print("=" * 60)
    print()
    
    merge_images_to_pdf()


if __name__ == "__main__":
    main()
