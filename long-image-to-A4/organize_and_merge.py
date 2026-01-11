
import os
import shutil
import re
from pathlib import Path
from PIL import Image

def natural_sort_key(filename):
    """自然排序的key函数"""
    return [int(text) if text.isdigit() else text.lower()
            for text in re.split('([0-9]+)', str(filename))]

def organize_and_merge():
    current_dir = Path(__file__).parent
    output_dir = current_dir / "output"
    
    if not output_dir.exists():
        print(f"找不到目录: {output_dir}")
        return

    # 1. 扫描文件并分组
    print("正在扫描文件...")
    files_map = {} # {base_name: [file_path, ...]}
    
    for file_path in output_dir.glob("*.png"):
        # 文件名格式: name_page_001.png
        # 我们需要分割出 name
        name = file_path.name
        if "_page_" in name:
            base_name = name.rsplit("_page_", 1)[0]
            if base_name not in files_map:
                files_map[base_name] = []
            files_map[base_name].append(file_path)
    
    if not files_map:
        print("未在 output 目录下找到符合格式的 png 文件。")
        # 也许文件已经在子目录里了？检查一下子目录
        for subdir in [d for d in output_dir.iterdir() if d.is_dir()]:
            base_name = subdir.name
            pngs = list(subdir.glob("*.png"))
            if pngs:
                if base_name not in files_map:
                    files_map[base_name] = []
                files_map[base_name].extend(pngs)
    
    print(f"找到 {len(files_map)} 组图片系列。")

    # 2. 处理每一组
    for base_name, files in files_map.items():
        print(f"\n处理系列: {base_name}")
        
        # 目标子目录
        target_subdir = output_dir / base_name
        target_subdir.mkdir(exist_ok=True)
        
        # 移动文件 (如果文件不在目标子目录中)
        sorted_files = []
        for file_path in files:
            if file_path.parent != target_subdir:
                new_path = target_subdir / file_path.name
                shutil.move(str(file_path), str(new_path))
                sorted_files.append(new_path)
            else:
                sorted_files.append(file_path)
        
        # 重新排序确保顺序正确
        sorted_files.sort(key=lambda x: natural_sort_key(x.name))
        
        print(f"  已整理 {len(sorted_files)} 个文件到 {target_subdir.name}")
        
        # 合并为 PDF
        pdf_path = output_dir / f"{base_name}.pdf"
        print(f"  正在生成 PDF: {pdf_path.name}")
        
        if not sorted_files:
            continue
            
        try:
            images = []
            for img_path in sorted_files:
                img = Image.open(img_path)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                images.append(img)
            
            if images:
                images[0].save(
                    pdf_path,
                    save_all=True,
                    append_images=images[1:],
                    resolution=300.0,
                    quality=95,
                    optimize=True
                )
                print(f"  ✓ PDF 生成成功")
            
            # 关闭图片
            for img in images:
                img.close()
                
        except Exception as e:
            print(f"  × PDF 生成失败: {e}")

    print("\n" + "="*60)
    print("所有任务完成！")

if __name__ == "__main__":
    organize_and_merge()
