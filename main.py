import os
import json
import pandas as pd
import pdfplumber
import re
import argparse
import sys
try:
    # 用於顯示資料夾選擇彈窗
    import tkinter as _tk
    from tkinter import filedialog as _filedialog
    _TK_AVAILABLE = True
except Exception:
    _TK_AVAILABLE = False

# ===============================================================
# Part 1: Extractor Functions
# 這些函式是提取資料的 "工具箱"
# ===============================================================

def find_text_after(text, keywords):
    """
    在全文中尋找關鍵字，並返回關鍵字後面的整行或多個字詞。
    適用於 "Key: Value" 這種格式。
    """
    def clean_val(val):
        if not val:
            return val
        # 移除可能的單位首碼如 (℃ / hr), (J / hr), (℃/hr), (J/hr)
        val = re.sub(r'^\s*\([J℃\w]\s*/\s*\w+\)\s*', '', val, flags=re.IGNORECASE)
        # 移除可能的冒號或空格
        val = re.sub(r'^[:\s 　]+', '', val)
        return val.strip()

    for keyword in keywords:
        # 第一種方法：嘗試抷取直到下一行的所有內容
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if keyword in line:
                # 在同一行中查找關鍵字後的內容
                keyword_pos = line.find(keyword)
                after_keyword = line[keyword_pos + len(keyword):].strip()
                
                after_keyword = clean_val(after_keyword)
                
                if after_keyword:
                    return after_keyword
                
                # 如果同一行沒有內容，檢查下一行
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not next_line.startswith(('產品', '模具', '射出', '原料', '圖面')):
                        return clean_val(next_line)
        
        # 第二種方法：使用正則表達式捕獲一個或多個字詞
        # 捕獲非空白字符直到换行或下一個關鍵字
        pattern = re.compile(f"{re.escape(keyword)}\\s*[::：]?\\s*([^\\n\\r]+)")
        match = pattern.search(text)
        if match:
            result = match.group(1).strip()
            # 移除可能在結尾的特殊字符
            result = re.sub(r'[\s 　]+$', '', result)
            if result:
                return clean_val(result)
    
    return "未找到"

def find_nested_value(text, keywords, parameters):
    """
    處理複雜情況，例如在一個大標題下尋找子項目的值。
    適用於 "產品平均重量 ... 目標值: 10g"
    """
    sub_keywords = parameters.get("sub_keywords", [])
    if not sub_keywords:
        return "設定錯誤: 缺少子關鍵字"

    # 我們會嘗試匹配 主關鍵字 和 子關鍵字 的所有組合
    for main_keyword in keywords:
        for sub_keyword in sub_keywords:
            # 正則表達式：找到主關鍵字，然後 non-greedily 匹配所有字符 (.*?)
            # 直到找到子關鍵字，然後像之前一樣提取後面的值。
            # re.DOTALL 讓 '.' 可以匹配換行符，非常重要！
            pattern = re.compile(
                f"{re.escape(main_keyword)}.*?{re.escape(sub_keyword)}\\s*[:：]?\\s*(\\S+)",
                re.DOTALL
            )
            match = pattern.search(text)
            if match:
                return match.group(1).strip()
    return "未找到"

def find_table_value(text, keywords, parameters):
    """
    Extracts table values (Target, Low, High, Actual) with extreme resilience.
    Uses a priority-based scanning window [i, i+1, i-1, i+2, i-2, i+3] and specific 
    handling for single-value parameters to avoid row-crossing errors.
    """
    value_type = parameters.get("value_type", "target")
    
    for keyword in keywords:
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if keyword in line:
                # Priority Scanning Window: [i, i+1, i-1, i+2, i-2, i+3]
                search_indices = [i, i + 1, i - 1, i + 2, i - 2, i + 3]
                
                # Parameters that usually have only one value (not a full Target/Low/High row)
                is_single_param = any(s in keyword.upper() for s in ["CYCLE", "TONNAGE", "SCREW DIA", "MOLD CYCLE"])
                
                # Phase 1: Look for multi-token rows (Table Data)
                for j in search_indices:
                    if j < 0 or j >= len(lines): continue
                    current_line = lines[j]
                    
                    # Extract numeric tokens and common placeholders
                    tokens = re.findall(r'\b\d+\.?\d*\b|NCA|N/A', current_line, re.IGNORECASE)

                    # Handle special slash formats (e.g., "10 / 20 / 30")
                    if len(tokens) == 6 and '/' in current_line:
                        tokens = [
                            f"{tokens[0]} / {tokens[1]}",
                            f"{tokens[2]} / {tokens[3]}",
                            f"{tokens[4]} / {tokens[5]}"
                        ]

                    # If we find 3+ tokens, it's likely a structured table row
                    if len(tokens) >= 3 and not is_single_param:
                        if value_type == "target": return tokens[0]
                        elif value_type == "low": return tokens[1]
                        elif value_type == "high": return tokens[2]
                        elif value_type == "actual": return tokens[3] if len(tokens) > 3 else "?芣??"

                # Phase 2: Fallback for single-value parameters (like Mold Cycle Time)
                # This ensures we don't pick up a value from a neighboring table row.
                if value_type == "target":
                    for j in search_indices:
                        if j < 0 or j >= len(lines): continue
                        current_line = lines[j].strip()
                        
                        # Case A: Keyword and token(s) on the same line
                        if keyword in lines[j]:
                            k_pos = lines[j].find(keyword)
                            after_k = lines[j][k_pos+len(keyword):].strip()
                            # Try to find the first token immediately following the keyword
                            match = re.search(r'\b(\d+\.?\d*|NCA|N/A)\b', after_k, re.IGNORECASE)
                            if match: return match.group(1)
                        
                        # Case B: Line contains exactly one token (and no other conflicting keywords)
                        tokens = re.findall(r'\b(\d+\.?\d*|NCA|N/A)\b', current_line, re.IGNORECASE)
                        if len(tokens) == 1:
                            # Avoid picking up tokens that belong to other process parameters
                            conflicts = ["FILL", "SHOT", "PACKED", "CLAMP", "TONNAGE", "CYCLE", "MOLD"]
                            if not any(c in current_line.upper() for c in conflicts if c not in keyword.upper()):
                                return tokens[0]

    return "?芣??" 

def find_material_number(text, keywords):
    """
    專門用於提取原料料號的函式，處理多種不同的格式。
    """
    for keyword in keywords:
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if keyword in line:
                # 在同一行中查找關鍵字後的內容
                keyword_pos = line.find(keyword)
                after_keyword = line[keyword_pos + len(keyword):].strip()
                after_keyword = re.sub(r'^[:\s　]+', '', after_keyword)
                
                # 如果同一行有內容，直接返回
                if after_keyword and after_keyword not in ['原料資訊', 'Material Information']:
                    return after_keyword
                
                # 如果同一行沒有內容，檢查下一行
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if next_line and not next_line.startswith(('產品', '模具', '射出', '原料', '圖面', '烘料', '螺桿', 'Material Information')):
                        # 清理結果，移除多餘的標題文字
                        result = next_line
                        # 移除常見的標題文字
                        result = re.sub(r'^(原料資訊|Material Information)\s*', '', result)
                        if result:
                            return result
                
                # 如果下一行是「原料資訊」，檢查再下一行
                if i + 1 < len(lines) and lines[i + 1].strip() == '原料資訊':
                    if i + 2 < len(lines):
                        next_next_line = lines[i + 2].strip()
                        if next_next_line and not next_next_line.startswith(('產品', '模具', '射出', '原料', '圖面', '烘料', '螺桿', 'Material Information')):
                            return next_next_line
                
                # 檢查關鍵字前面的內容（有些料號在關鍵字前面）
                before_keyword = line[:keyword_pos].strip()
                if before_keyword and not before_keyword.startswith(('產品', '模具', '射出', '原料', '圖面', '螺桿')):
                    # 提取最後一個有意義的詞組
                    parts = before_keyword.split()
                    if parts:
                        # 檢查最後幾個部分是否像料號
                        for j in range(len(parts)-1, max(0, len(parts)-3), -1):
                            candidate = ' '.join(parts[j:])
                            # 檢查是否像料號（包含字母 and 數字）
                            if re.search(r'[A-Za-z]', candidate) and re.search(r'[0-9]', candidate):
                                return candidate
                
                # 如果關鍵字前面沒有內容，檢查上一行
                if i > 0 and not before_keyword:
                    prev_line = lines[i - 1].strip()
                    if prev_line and not prev_line.startswith(('產品', '模具', '射出', '原料', '圖面', '螺桿')):
                        # 檢查是否像料號（包含字母 and 數字）
                        if re.search(r'[A-Za-z]', prev_line) and re.search(r'[0-9]', prev_line):
                            return prev_line
        
        # 使用正則表達式捕獲
        pattern = re.compile(f"{re.escape(keyword)}\\s*[::：]?\\s*([^\\n\\r]+)")
        match = pattern.search(text)
        if match:
            result = match.group(1).strip()
            result = re.sub(r'[\s　]+$', '', result)
            # 移除常見的標題文字
            result = re.sub(r'^(原料資訊|Material Information)\\s*', '', result)
            if result and result not in ['原料資訊', 'Material Information']:
                return result
    
    return "未找到"

# 將設定檔中的方法名稱映射到實際的 Python 函式
EXTRACTION_MAPPING = {
    "find_text_after": find_text_after,
    "find_nested_value": find_nested_value,
    "find_table_value": find_table_value,
    "find_material_number": find_material_number,
}


# ===============================================================
# Part 2: Utility Functions
# 工具函式
# ===============================================================

def generate_unique_filename(folder, base_name, extension):
    """
    生成不重複的檔名。如果檔案已存在，會在檔名後加上數字序號。
    
    Args:
        folder: 目標資料夾路徑
        base_name: 基本檔名（不含副檔名）
        extension: 副檔名（不含點號）
    
    Returns:
        完整的檔案路徑
    """
    # 確保資料夾存在
    if not os.path.exists(folder):
        os.makedirs(folder)
    
    # 嘗試基本檔名
    filename = f"{base_name}.{extension}"
    filepath = os.path.join(folder, filename)
    
    # 如果檔案不存在，直接返回
    if not os.path.exists(filepath):
        return filepath
    
    # 如果檔案存在，嘗試加上數字序號
    counter = 1
    while True:
        filename = f"{base_name}_{counter}.{extension}"
        filepath = os.path.join(folder, filename)
        if not os.path.exists(filepath):
            return filepath
        counter += 1

def _select_directory_dialog(title: str, initial_dir: str = None) -> str:
    """顯示資料夾選擇彈窗，返回使用者選擇的資料夾路徑；取消則返回空字串。"""
    import subprocess
    import sys
    try:
        # 用獨立的 python 子進程開啟 tkinter filedialog
        # 避免 Flask 的非主線程環境下呼叫 tkinter 導致視窗凍結或崩潰 (Tcl/Tk Thread-safety issue)
        cmd = [
            sys.executable,
            "-c",
            "import tkinter as tk; "
            "from tkinter import filedialog; "
            "root = tk.Tk(); "
            "root.withdraw(); "
            "root.attributes('-topmost', True); "
            f"print(filedialog.askdirectory(title={repr(title)}, initialdir={repr(initial_dir or '')}))"
        ]
        # 設定 creationflags 以便隱藏子進程的 cmd 視窗 (僅在 Windows 生效)
        creationflags = 0
        if sys.platform == "win32":
            # 0x08000000 = CREATE_NO_WINDOW
            creationflags = 0x08000000
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            creationflags=creationflags
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Subprocess filedialog error: {e}")
        # Fallback to local import if subprocess fails
        if not _TK_AVAILABLE:
            return ""
        try:
            root = _tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            path = _filedialog.askdirectory(title=title, initialdir=initial_dir or os.getcwd())
            root.destroy()
            return path or ""
        except Exception:
            return ""

def _save_file_dialog(title: str, default_filename: str, file_types: list) -> str:
    """顯示檔案儲存對話框，返回使用者選擇的檔案路徑；取消則返回空字串。"""
    import subprocess
    import sys
    try:
        # 用獨立的 python 子進程開啟 tkinter filedialog.asksaveasfilename
        file_types_str = str(file_types)
        cmd = [
            sys.executable,
            "-c",
            "import tkinter as tk; "
            "from tkinter import filedialog; "
            "root = tk.Tk(); "
            "root.withdraw(); "
            "root.attributes('-topmost', True); "
            f"print(filedialog.asksaveasfilename(title={repr(title)}, initialfile={repr(default_filename)}, filetypes={file_types_str}))"
        ]
        creationflags = 0
        if sys.platform == "win32":
            creationflags = 0x08000000
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            creationflags=creationflags
        )
        return result.stdout.strip()
    except Exception as e:
        print(f"Subprocess asksaveasfilename error: {e}")
        if not _TK_AVAILABLE:
            return ""
        try:
            root = _tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            path = _filedialog.asksaveasfilename(title=title, initialfile=default_filename, filetypes=file_types)
            root.destroy()
            return path or ""
        except Exception:
            return ""

def _select_files_dialog(title: str, initial_dir: str = None, file_types: list = None) -> list:
    """顯示檔案選擇彈窗，支援多選，返回使用者選擇的檔案路徑列表；取消則返回空列表。"""
    import subprocess
    import sys
    try:
        file_types_str = str(file_types or [("PDF Files", "*.pdf"), ("All Files", "*.*")])
        # 用獨立的 python 子進程開啟 tkinter filedialog.askopenfilenames
        # 將所選路徑以分號隔開輸出，方便解析
        cmd = [
            sys.executable,
            "-c",
            "import tkinter as tk; "
            "from tkinter import filedialog; "
            "root = tk.Tk(); "
            "root.withdraw(); "
            "root.attributes('-topmost', True); "
            f"paths = filedialog.askopenfilenames(title={repr(title)}, initialdir={repr(initial_dir or '')}, filetypes={file_types_str}); "
            "print(';'.join(paths) if paths else '')"
        ]
        creationflags = 0
        if sys.platform == "win32":
            creationflags = 0x08000000
            
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            creationflags=creationflags
        )
        out = result.stdout.strip()
        if out:
            return [p.strip() for p in out.split(";")]
        return []
    except Exception as e:
        print(f"Subprocess askopenfilenames error: {e}")
        if not _TK_AVAILABLE:
            return []
        try:
            root = _tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            paths = _filedialog.askopenfilenames(title=title, initialdir=initial_dir or os.getcwd(), filetypes=file_types or [("PDF Files", "*.pdf"), ("All Files", "*.*")])
            root.destroy()
            return list(paths) if paths else []
        except Exception:
            return []




def get_paths():
    """
    獲取輸入和輸出路徑，支援命令列參數、彈窗與命令列互動式輸入。
    優先序：命令列參數 > 彈窗 > 命令列互動
    """
    parser = argparse.ArgumentParser(description='PDF 資料提取工具')
    parser.add_argument('--input', '-i', type=str, help='輸入 PDF 檔案資料夾路徑')
    parser.add_argument('--output', '-o', type=str, help='輸出檔案資料夾路徑')
    parser.add_argument('--config', '-c', type=str, default='config.json', help='設定檔路徑')
    
    args = parser.parse_args()
    
    # 如果命令列有指定所有必要參數，直接使用
    if args.input and args.output:
        if os.path.exists(args.input) and os.path.isdir(args.input):
            return args.input, args.output, args.config
        else:
            print(f"錯誤：指定的輸入路徑不存在或不是資料夾: {args.input}")
            sys.exit(1)
    
    # 獲取輸入路徑
    if args.input:
        input_folder = args.input
        if not os.path.exists(input_folder) or not os.path.isdir(input_folder):
            print(f"錯誤：指定的輸入路徑不存在或不是資料夾: {input_folder}")
            sys.exit(1)
    else:
        # 優先嘗試用彈窗選擇
        selected = _select_directory_dialog("選擇輸入 PDF 資料夾", initial_dir=os.getcwd())
        if selected:
            input_folder = selected
        else:
            # 後備：命令列互動
            print("請選擇輸入 PDF 檔案的路徑：")
            print("1. 使用預設路徑: input_pdfs")
            print("2. 手動輸入路徑")
            while True:
                try:
                    choice = input("請選擇 (1/2): ").strip()
                    if choice == "1":
                        input_folder = "input_pdfs"
                        break
                    elif choice == "2":
                        input_folder = input("請輸入 PDF 檔案資料夾的完整路徑: ").strip()
                        input_folder = input_folder.strip('"\'')
                        if os.path.exists(input_folder) and os.path.isdir(input_folder):
                            break
                        else:
                            print(f"錯誤：路徑不存在或不是資料夾: {input_folder}")
                            print("請重新輸入。")
                    else:
                        print("請輸入 1 或 2")
                except (EOFError, KeyboardInterrupt):
                    print("\n程式已取消。")
                    sys.exit(0)
    
    # 獲取輸出路徑
    if args.output:
        output_folder = args.output
    else:
        # 優先彈窗
        selected_out = _select_directory_dialog("選擇輸出結果資料夾", initial_dir=os.getcwd())
        if selected_out:
            output_folder = selected_out
        else:
            # 後備：命令列互動
            print("\n請選擇輸出檔案的路徑：")
            print("1. 使用預設路徑: output")
            print("2. 手動輸入路徑")
            while True:
                try:
                    choice = input("請選擇 (1/2): ").strip()
                    if choice == "1":
                        output_folder = "output"
                        break
                    elif choice == "2":
                        output_folder = input("請輸入輸出檔案資料夾的完整路徑: ").strip()
                        output_folder = output_folder.strip('"\'')
                        break
                    else:
                        print("請輸入 1 或 2")
                except (EOFError, KeyboardInterrupt):
                    print("\n程式已取消。")
                    sys.exit(0)
    
    return input_folder, output_folder, args.config


# ===============================================================
# Part 3: PDF Processing Function
# 處理單一 PDF 檔案的完整流程
# ===============================================================

def detect_checked_unit(full_text):
    """
    偵測保壓壓力被勾稽的單位（Bar 或 kg/cm2）
    □ Bar ■ kg/cm2 表示 kg/cm2 被勾稽
    ■ Bar □ kg/cm2 表示 Bar 被勾稽
    """
    lines = full_text.split('\n')
    for line in lines:
        if '□' in line and '■' in line and ('Bar' in line or 'bar' in line):
            # 檢查哪個單位前面有 ■
            if '■ kg' in line or '■kg' in line:
                return 'kg/cm²'
            elif '■ Bar' in line or '■Bar' in line:
                return 'bar'
    # 預設回傳 kg/cm²
    return 'kg/cm²'

def extract_data_from_pdf(pdf_path, config):
    """
    從指定的單一 PDF 檔案中，根據設定檔提取所有資料。
    """
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # 將所有頁面的文字合併成一個大字串，方便全文搜索
            full_text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
    except Exception as e:
        print(f"  - 無法讀取 PDF 檔案 '{os.path.basename(pdf_path)}': {e}")
        return None

    # 偵測被勾稽的單位
    checked_unit = detect_checked_unit(full_text)

    # 準備一個字典來存放此 PDF 的所有提取結果
    extracted_data = {"檔案名稱": os.path.basename(pdf_path), "_單位_保壓壓力": checked_unit}

    # 遍歷設定檔中定義的每個欄位規則
    for field_rule in config["fields_to_extract"]:
        field_name = field_rule["name"]
        keywords = field_rule["keywords"]
        method_name = field_rule["extraction_method"]

        extraction_function = EXTRACTION_MAPPING.get(method_name)

        if extraction_function:
            # 根據函式是否需要額外參數來調用它
            if "parameters" in field_rule:
                # 傳遞被勾稽的單位給 find_table_value
                params = field_rule["parameters"].copy()
                params["checked_unit"] = checked_unit
                value = extraction_function(full_text, keywords, params)
            else:
                value = extraction_function(full_text, keywords)
            extracted_data[field_name] = value
        else:
            print(f"  - 警告：未知的提取方法 '{method_name}'，已跳過。")
            extracted_data[field_name] = "未知方法"

    return extracted_data


# ===============================================================
# Part 4: Main Execution Flow
# 整個程式的進入點和總控流程
# ===============================================================

def main():
    """
    主執行函式：讀取設定、遍歷PDF、提取資料、匯出Excel。
    """
    # 獲取路徑設定
    PDF_FOLDER, OUTPUT_FOLDER, CONFIG_PATH = get_paths()
    
    # 自動生成不重複的檔名
    OUTPUT_FILENAME = generate_unique_filename(OUTPUT_FOLDER, "extracted_data", "xlsx")
    
    print(f"\n使用設定：")
    print(f"  輸入資料夾: {PDF_FOLDER}")
    print(f"  輸出資料夾: {OUTPUT_FOLDER}")
    print(f"  設定檔: {CONFIG_PATH}")
    print(f"  輸出檔案: {os.path.basename(OUTPUT_FILENAME)}")

    # --- 1. 準備工作 ---
    # 確保輸出資料夾存在
    if not os.path.exists(OUTPUT_FOLDER):
        os.makedirs(OUTPUT_FOLDER)

    # 讀取設定檔
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"錯誤：找不到設定檔 '{CONFIG_PATH}'。請確保檔案存在且名稱正確。")
        return
    except json.JSONDecodeError:
        print(f"錯誤：設定檔 '{CONFIG_PATH}' 格式不正確，請檢查 JSON 語法。")
        return

    # --- 2. 尋找並處理所有 PDF 檔案 ---
    pdf_files = [os.path.join(PDF_FOLDER, f) for f in os.listdir(PDF_FOLDER) if f.lower().endswith('.pdf')]

    if not pdf_files:
        print(f"在資料夾 '{PDF_FOLDER}' 中沒有找到任何 PDF 檔案。")
        return

    def safe_print(text):
        try:
            print(text)
        except UnicodeEncodeError:
            # Fallback replacing heavy unicode symbols for generic cmd compatibility
            clean_text = text.replace("✅", "[OK]").replace("❌", "[ERROR]")
            # Encode and decode using backslashreplace to fully avoid crash
            print(clean_text.encode(sys.stdout.encoding or 'ascii', errors='backslashreplace').decode(sys.stdout.encoding or 'ascii'))

    all_results = []
    safe_print(f"找到 {len(pdf_files)} 個 PDF 檔案，開始提取...")

    # 遍歷每個 PDF 檔案
    for pdf_path in pdf_files:
        safe_print(f"正在處理: {os.path.basename(pdf_path)}...")
        data = extract_data_from_pdf(pdf_path, config)
        if data:
            all_results.append(data)
            # 特別檢查 R1-8107 檔案
            if "R1-8107" in os.path.basename(pdf_path):
                safe_print(f"  ✅ R1-8107 檔案成功提取，產品型號: {data.get('產品型號', 'N/A')}")
        else:
            safe_print(f"  ❌ 無法提取資料: {os.path.basename(pdf_path)}")

    # --- 3. 匯出結果 ---
    if not all_results:
        safe_print("\n提取結束，但沒有從任何檔案中成功提取到資料。")
        return

    # 將結果列表轉換為 pandas DataFrame
    df = pd.DataFrame(all_results)
    
    # 重新排列欄位順序，使其與 config.json 中的順序一致，更美觀
    column_order = ["檔案名稱"] + [field["name"] for field in config["fields_to_extract"]]
    df = df[column_order]

    # 將 DataFrame 儲存為 Excel 檔案
    try:
        df.to_excel(OUTPUT_FILENAME, index=False, engine='openpyxl')
        safe_print(f"\n提取完成！結果已成功儲存至: {OUTPUT_FILENAME}")
        safe_print(f"總共處理了 {len(df)} 個檔案")
        
        # 檢查 R1-8107 是否在結果中
        r1_8107_count = len(df[df['檔案名稱'].str.contains('R1-8107', na=False)])
        if r1_8107_count > 0:
            safe_print(f"✅ 找到 {r1_8107_count} 個包含 R1-8107 的檔案")
        else:
            safe_print("❌ 沒有找到包含 R1-8107 的檔案")
            
    except Exception as e:
        safe_print(f"\n儲存 Excel 檔案時發生錯誤: {e}")
        safe_print("請檢查檔案是否被其他程式開啟，或是否有寫入權限。")


if __name__ == "__main__":
    # 安裝所需套件的提示
    try:
        import pandas
        import openpyxl
        import pdfplumber
    except ImportError:
        print("="*60)
        print("錯誤：缺少必要的 Python 套件。")
        print("請在你的終端機或命令提示字元中執行以下指令來安裝：")
        print("pip install pandas openpyxl pdfplumber")
        print("="*60)
    else:
        main()