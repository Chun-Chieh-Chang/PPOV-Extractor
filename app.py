import os
import sys
import io
import json
import webbrowser
from threading import Timer
from flask import Flask, jsonify, request, render_template, send_file
import pandas as pd
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

# Ensure workspace is in python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from main import extract_data_from_pdf, _select_directory_dialog, _save_file_dialog

app = Flask(__name__)

# Global state to store extracted data in memory
db = {
    "extracted_data": [],
    "config": None,
    "last_folder": ""
}

def load_config():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            db["config"] = json.load(f)
    except Exception as e:
        print(f"Error loading config.json: {e}")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/config", methods=["GET"])
def get_config_endpoint():
    if not db["config"]:
        load_config()
    return jsonify(db["config"])

@app.route("/api/select_folder", methods=["POST"])
def select_folder():
    """Triggers native OS directory picker."""
    try:
        # Run dialog safely
        selected_path = _select_directory_dialog("選擇包含 PPOV PDF 的資料夾", db["last_folder"])
        if selected_path:
            db["last_folder"] = selected_path
            return jsonify({"success": True, "path": selected_path})
        return jsonify({"success": False, "message": "未選擇任何資料夾"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route("/api/extract", methods=["POST"])
def extract_data():
    """Performs extraction on all PDF files in the selected folder."""
    data_payload = request.json or {}
    folder_path = data_payload.get("path", db["last_folder"])
    
    if not folder_path or not os.path.exists(folder_path):
        return jsonify({"success": False, "message": "無效的資料夾路徑"})
    
    if not db["config"]:
        load_config()
        
    pdf_files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
    if not pdf_files:
        return jsonify({"success": False, "message": "此資料夾內無任何 PDF 檔案"})
        
    results = []
    for pdf_path in pdf_files:
        try:
            data = extract_data_from_pdf(pdf_path, db["config"])
            if data:
                results.append(data)
        except Exception as e:
            print(f"Error processing {pdf_path}: {e}")
            
    db["extracted_data"] = results
    return jsonify({
        "success": True, 
        "count": len(results), 
        "data": results,
        "fields": [f["name"] for f in db["config"]["fields_to_extract"]]
    })

@app.route("/api/export_master", methods=["POST"])
def export_master():
    """Generates and exports the master Excel or JSON file, prompting the user for the save path."""
    format_type = request.json.get("format", "excel")
    if not db["extracted_data"]:
        return jsonify({"success": False, "message": "目前無任何已提取之數據"})
        
    df = pd.DataFrame(db["extracted_data"])
    # Rearrange column order based on config
    column_order = ["檔案名稱"] + [field["name"] for field in db["config"]["fields_to_extract"]]
    df = df[column_order]
    
    # Prompt for save path using Native OS file dialog
    default_name = f"PPOV_Master_Table.{'xlsx' if format_type == 'excel' else 'json'}"
    file_types = [("Excel Files", "*.xlsx")] if format_type == "excel" else [("JSON Files", "*.json")]
    
    selected_path = _save_file_dialog(
        "選擇儲存總表檔案的位置", 
        default_name, 
        file_types
    )
    
    if not selected_path:
        return jsonify({"success": False, "message": "已取消儲存操作"})
        
    try:
        if format_type == "excel":
            df.to_excel(selected_path, index=False, engine='openpyxl')
        else:
            with open(selected_path, "w", encoding="utf-8") as f:
                json.dump(db["extracted_data"], f, ensure_ascii=False, indent=2)
                
        return jsonify({"success": True, "message": f"總表已成功儲存至:\n{selected_path}"})
    except Exception as e:
        return jsonify({"success": False, "message": f"寫入檔案時發生錯誤：{str(e)}"})

@app.route("/api/export_part", methods=["POST"])
def export_part_excel():
    """Generates a highly premium structured Excel sheet for a single part, prompting the user for the save path."""
    part_no = request.json.get("part_no")
    if not part_no:
        return jsonify({"success": False, "message": "請指定品號"})
        
    part_data = next((item for item in db["extracted_data"] if item.get("產品型號") == part_no), None)
    if not part_data:
        return jsonify({"success": False, "message": f"找不到品號 {part_no} 的數據"})
        
    # Prompt for save path using Native OS file dialog
    default_name = f"PPOV_Spec_{part_no}.xlsx"
    file_types = [("Excel Files", "*.xlsx")]
    
    selected_path = _save_file_dialog(
        f"選擇儲存品號 {part_no} 規格單的位置", 
        default_name, 
        file_types
    )
    
    if not selected_path:
        return jsonify({"success": False, "message": "已取消儲存操作"})
        
    # Generate beautifully styled spreadsheet using openpyxl
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = f"PPOV - {part_no}"
    ws.views.sheetView[0].showGridLines = True
    
    # ─── COLOR SYSTEM (Coordinated Ice Blue Light Theme) ───
    NAVY_FILL = PatternFill(start_color="1A3A5F", end_color="1A3A5F", fill_type="solid") # Deep Navy Blue
    HEADER_FILL = PatternFill(start_color="3A7CA8", end_color="3A7CA8", fill_type="solid") # Steel Blue
    SUBHEADER_FILL = PatternFill(start_color="50718C", end_color="50718C", fill_type="solid") # Slate Blue
    ACCENT_FILL = PatternFill(start_color="F0F7FB", end_color="F0F7FB", fill_type="solid") # Light Ice Blue
    
    # ─── FONTS ───
    title_font = Font(name="Microsoft JhengHei", size=16, bold=True, color="FFFFFF")
    section_font = Font(name="Microsoft JhengHei", size=11, bold=True, color="FFFFFF")
    label_font = Font(name="Microsoft JhengHei", size=10, bold=True, color="1A3A5F") # Navy label text
    value_font = Font(name="Microsoft JhengHei", size=10, color="000000")
    header_col_font = Font(name="Microsoft JhengHei", size=10, bold=True, color="FFFFFF")
    
    # Borders
    thin_border = Border(
        left=Side(style='thin', color='B4D8E7'), # Light Ice Blue Border
        right=Side(style='thin', color='B4D8E7'),
        top=Side(style='thin', color='B4D8E7'),
        bottom=Side(style='thin', color='B4D8E7')
    )
    double_bottom = Border(bottom=Side(style='double', color='1A3A5F'))
    
    # Alignments
    center_align = Alignment(horizontal="center", vertical="center", wrap_text=True)
    left_align = Alignment(horizontal="left", vertical="center", wrap_text=True)
    right_align = Alignment(horizontal="right", vertical="center")
    
    # Title Block will be formatted at Row 1
        
    # --- 1. TITLE BLOCK ---
    ws.merge_cells("A1:E1")
    title_cell = ws["A1"]
    title_cell.value = f"PPOV 射出成型數據查檢表 - {part_no}"
    title_cell.font = title_font
    title_cell.fill = NAVY_FILL
    title_cell.alignment = center_align
    
    # --- 2. BASIC INFORMATION SECTION (Rows 3-7) ---
    ws.merge_cells("A2:E2")
    info_sec = ws["A2"]
    info_sec.value = "  基本資訊 (Basic Information)"
    info_sec.font = section_font
    info_sec.fill = HEADER_FILL
    info_sec.alignment = Alignment(horizontal="left", vertical="center")
    
    basic_fields = [
        ("產品型號 Part No.", part_data.get("產品型號", "N/A"), "圖面版次 Drawing Rev.", part_data.get("圖面版次", "N/A")),
        ("產品名稱 Description", part_data.get("產品名稱", "N/A"), "模具編號 Mold No.", part_data.get("模具編號", "N/A")),
        ("模具穴數 Cavitation", part_data.get("模具穴數", "N/A"), "射出成型機編號 Press No.", part_data.get("射出成型機編號", "N/A")),
        ("機台噸數 Press Tonnage", part_data.get("射出成型機噸數", "N/A"), "螺桿尺寸 Screw Dia.", part_data.get("螺桿尺寸", "N/A")),
        ("原料料號 Material No.", part_data.get("原料料號", "N/A"), "烘料條件 Drying Cond.", part_data.get("烘料條件", "N/A"))
    ]
    
    curr_row = 3
    for f1, v1, f2, v2 in basic_fields:
        ws.cell(row=curr_row, column=1, value=f1).font = label_font
        ws.cell(row=curr_row, column=1).alignment = left_align
        ws.cell(row=curr_row, column=2, value=v1).font = value_font
        ws.cell(row=curr_row, column=2).alignment = left_align
        ws.cell(row=curr_row, column=3, value=f2).font = label_font
        ws.cell(row=curr_row, column=3).alignment = left_align
        ws.merge_cells(start_row=curr_row, start_column=4, end_row=curr_row, end_column=5)
        ws.cell(row=curr_row, column=4, value=v2).font = value_font
        ws.cell(row=curr_row, column=4).alignment = left_align
        
        # Apply border & soft background to label columns
        for c in range(1, 6):
            cell = ws.cell(row=curr_row, column=c)
            cell.border = thin_border
            if c in [1, 3]:
                cell.fill = ACCENT_FILL
        curr_row += 1
        
    curr_row += 1 # Spacing
    
    # --- 3. PROCESS PARAMETERS TABLE (Rows 9-20) ---
    ws.merge_cells(f"A{curr_row}:E{curr_row}")
    proc_sec = ws.cell(row=curr_row, column=1, value="  關鍵製程參數 (Key Process Parameters)")
    proc_sec.font = section_font
    proc_sec.fill = HEADER_FILL
    proc_sec.alignment = Alignment(horizontal="left", vertical="center")
    curr_row += 1
    
    # Columns Headers
    headers = ["參數項目 Parameter", "目標值 (Target)", "下限值 (Low)", "上限值 (High)", "實際值 (Actual)"]
    for c, h in enumerate(headers, 1):
        cell = ws.cell(row=curr_row, column=c, value=h)
        cell.font = header_col_font
        cell.fill = SUBHEADER_FILL
        cell.alignment = center_align
        cell.border = thin_border
    curr_row += 1
    
    proc_rows = [
        ("實際融膠溫度 Melt Temp (℃)", "實際融膠溫度_目標值", "實際融膠溫度_下限值", "實際融膠溫度_上限值", "實際融膠溫度_實際值"),
        ("填充時間 Fill Time (s)", "填充時間_目標值", "填充時間_下限值", "填充時間_上限值", "填充時間_實際值"),
        ("產品充填重量 Average Fill Weight (g)", "充填階段的產品平均重量_目標值", "充填階段的產品平均重量_下限值", "充填階段的產品平均重量_上限值", "充填階段的產品平均重量_實際值"),
        ("保壓壓力 Hold Pressure (bar)", "保壓壓力_目標值", "保壓壓力_下限值", "保壓壓力_上限值", "保壓壓力_實際值"),
        ("保壓時間 Hold Time (s)", "保壓時間_目標值", "保壓時間_下限值", "保壓時間_上限值", "保壓時間_實際值"),
        ("保壓完產品重量 Packed Weight (g)", "保壓完的產品平均重量_目標值", "保壓完的產品平均重量_下限值", "保壓完的產品平均重量_上限值", "保壓完的產品平均重量_實際值"),
        ("冷卻時間 Cooling Time (s)", "冷卻時間_目標值", "冷卻時間_下限值", "冷卻時間_上限值", "冷卻時間_實際值"),
        ("模具溫度-母模 Water Temp A-Side (℃)", "模具溫度設定-母模_目標值", "模具溫度設定-母模_下限值", "模具溫度設定-母模_上限值", "模具溫度設定-母模_實際值"),
        ("模具溫度-公模 Water Temp B-Side (℃)", "模具溫度設定-公模_目標值", "模具溫度設定-公模_下限值", "模具溫度設定-公模_上限值", "模具溫度設定-公模_實際值"),
        ("模具溫度-滑塊 Water Temp Slide (℃)", "模具溫度設定-滑塊_目標值", "模具溫度設定-滑塊_下限值", "模具溫度設定-滑塊_上限值", "模具溫度設定-滑塊_實際值"),
    ]
    
    for label, target_k, low_k, high_k, actual_k in proc_rows:
        ws.cell(row=curr_row, column=1, value=label).font = label_font
        ws.cell(row=curr_row, column=1).alignment = left_align
        ws.cell(row=curr_row, column=1).fill = ACCENT_FILL
        
        for c, key in enumerate([target_k, low_k, high_k], 2):
            cell = ws.cell(row=curr_row, column=c, value=part_data.get(key, "N/A"))
            cell.font = value_font
            cell.alignment = center_align
            
        # 實際值 (Column 5) 全部留空
        cell_actual = ws.cell(row=curr_row, column=5, value="")
        cell_actual.font = value_font
        cell_actual.alignment = center_align
            
        for c in range(1, 6):
            ws.cell(row=curr_row, column=c).border = thin_border
        curr_row += 1
        
    curr_row += 1 # Spacing
    
    # --- 4. REFERENCE PARAMETERS SECTION (Rows 22-26) ---
    ws.merge_cells(f"A{curr_row}:E{curr_row}")
    ref_sec = ws.cell(row=curr_row, column=1, value="  參考規格參數 (Reference Parameters)")
    ref_sec.font = section_font
    ref_sec.fill = HEADER_FILL
    ref_sec.alignment = Alignment(horizontal="left", vertical="center")
    curr_row += 1
    
    ref_fields = [
        ("充填階段模重 Fill Only Shot Weight (g)", "充填階段的模重_目標值"),
        ("保壓完模重 Packed Out Shot Weight (g)", "保壓完的模重_目標值"),
        ("鎖模力設定 Clamp Tonnage (ton)", "鎖模力_目標值"),
        ("生產週期時間 Mold Cycle Time (s)", "週期時間_目標值")
    ]
    
    for label, key in ref_fields:
        # Column 1: Label
        ws.cell(row=curr_row, column=1, value=label).font = label_font
        ws.cell(row=curr_row, column=1).alignment = left_align
        ws.cell(row=curr_row, column=1).fill = ACCENT_FILL
        
        # Columns 2-4 Merged: Extracted Reference Value
        ws.merge_cells(start_row=curr_row, start_column=2, end_row=curr_row, end_column=4)
        ws.cell(row=curr_row, column=2, value=part_data.get(key, "N/A")).font = value_font
        ws.cell(row=curr_row, column=2).alignment = center_align
        
        # Column 5: Blank Check Field (for user inspection)
        ws.cell(row=curr_row, column=5, value="").font = value_font
        ws.cell(row=curr_row, column=5).alignment = center_align
        
        for c in range(1, 6):
            ws.cell(row=curr_row, column=c).border = thin_border
        curr_row += 1
        
    # --- 5. 現場生產查檢紀錄 SECTION (Sign-off block) ---
    ws.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=5)
    check_sec = ws.cell(row=curr_row, column=1, value="  現場生產查檢紀錄 (On-site Inspection Record)")
    check_sec.font = section_font
    check_sec.fill = HEADER_FILL
    check_sec.alignment = Alignment(horizontal="left", vertical="center")
    curr_row += 1

    # Row 1: Actual Press No. & Date
    ws.cell(row=curr_row, column=1, value="實際機台編號 Actual Press No.").font = label_font
    ws.cell(row=curr_row, column=1).alignment = left_align
    ws.cell(row=curr_row, column=1).fill = ACCENT_FILL
    ws.cell(row=curr_row, column=1).border = thin_border

    ws.cell(row=curr_row, column=2, value="").font = value_font
    ws.cell(row=curr_row, column=2).border = thin_border

    ws.cell(row=curr_row, column=3, value="查檢日期 Inspection Date").font = label_font
    ws.cell(row=curr_row, column=3).alignment = left_align
    ws.cell(row=curr_row, column=3).fill = ACCENT_FILL
    ws.cell(row=curr_row, column=3).border = thin_border

    ws.merge_cells(start_row=curr_row, start_column=4, end_row=curr_row, end_column=5)
    ws.cell(row=curr_row, column=4, value="").font = value_font
    ws.cell(row=curr_row, column=4).border = thin_border
    ws.cell(row=curr_row, column=5).border = thin_border
    curr_row += 1

    # Row 2: Time & Inspector Signature
    ws.cell(row=curr_row, column=1, value="查檢時間 Inspection Time").font = label_font
    ws.cell(row=curr_row, column=1).alignment = left_align
    ws.cell(row=curr_row, column=1).fill = ACCENT_FILL
    ws.cell(row=curr_row, column=1).border = thin_border

    ws.cell(row=curr_row, column=2, value="").font = value_font
    ws.cell(row=curr_row, column=2).border = thin_border

    ws.cell(row=curr_row, column=3, value="查檢員簽名 Inspector Signature").font = label_font
    ws.cell(row=curr_row, column=3).alignment = left_align
    ws.cell(row=curr_row, column=3).fill = ACCENT_FILL
    ws.cell(row=curr_row, column=3).border = thin_border

    ws.merge_cells(start_row=curr_row, start_column=4, end_row=curr_row, end_column=5)
    ws.cell(row=curr_row, column=4, value="").font = value_font
    ws.cell(row=curr_row, column=4).border = thin_border
    ws.cell(row=curr_row, column=5).border = thin_border
    curr_row += 1

    # --- 6. FOOTER SIGNATURE ---
    curr_row += 1 # Spacing row
    ws.merge_cells(start_row=curr_row, start_column=1, end_row=curr_row, end_column=5)
    author_cell = ws.cell(row=curr_row, column=1, value="Wesley Chang @ Mouldex, 2026. QC Dept. | PPOV 射出成型數據查檢表")
    author_cell.font = Font(name="Microsoft JhengHei", size=8, italic=True, color="64748B") # Slate 500
    author_cell.alignment = Alignment(horizontal="right", vertical="center")
    
    # Set optimized print-safe column widths (Total: 102, perfectly scaled to A4 width)
    ws.column_dimensions['A'].width = 38  # Parameter Label
    ws.column_dimensions['B'].width = 16  # Target Value
    ws.column_dimensions['C'].width = 16  # Low Value
    ws.column_dimensions['D'].width = 16  # High Value
    ws.column_dimensions['E'].width = 16  # Actual Value/Check Record
    
    # ─── ROW HEIGHTS (Only active rows with content, preventing trailing page overflows) ───
    ws.row_dimensions[1].height = 52
    for r in range(2, curr_row + 1):
        ws.row_dimensions[r].height = 28
    
    # ─── PAGE PRINT SETUP (A4 & Auto Fit to 1 Page Width & Height) ───
    ws.page_setup.paperSize = 9  # A4 Paper Size
    ws.page_setup.orientation = ws.ORIENTATION_PORTRAIT
    ws.page_setup.fitToPage = True
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 1
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_area = f'A1:E{curr_row}'  # Explicitly restrict print area
    
    # Set print margins to exactly 0.8 cm (0.31 inches) & set header/footer to 0
    ws.page_margins.left = 0.31
    ws.page_margins.right = 0.31
    ws.page_margins.top = 0.31
    ws.page_margins.bottom = 0.31
    ws.page_margins.header = 0.0
    ws.page_margins.footer = 0.0
    
    # Enable horizontal and vertical page centering
    ws.print_options.horizontalCentered = True
    ws.print_options.verticalCentered = True
        
    # Save workbook to selected path directly
    try:
        wb.save(selected_path)
        return jsonify({"success": True, "message": f"規格單已成功儲存至:\n{selected_path}"})
    except Exception as e:
        return jsonify({"success": False, "message": f"寫入檔案時發生錯誤：{str(e)}"})

@app.route("/api/load_master_file", methods=["POST"])
def load_master_file():
    """接收瀏覽器上傳的 Excel 或 JSON 總表檔案，完全不依賴 tkinter。"""
    try:
        if "file" not in request.files:
            return jsonify({"success": False, "message": "未收到檔案"})

        f = request.files["file"]
        if not f or f.filename == "":
            return jsonify({"success": False, "message": "未選擇任何檔案"})

        filename = f.filename.lower()
        results = []

        if filename.endswith(".xlsx"):
            import io
            file_bytes = io.BytesIO(f.read())
            df = pd.read_excel(file_bytes, engine="openpyxl")
            # 一次性清洗所有 NaN 並轉為字串，避免逐格遍歷
            df = df.fillna("")
            for col in df.columns:
                df[col] = df[col].apply(
                    lambda x: "" if x == "" else str(x) if not isinstance(x, str) else x
                )
            results = df.to_dict(orient="records")

        elif filename.endswith(".json"):
            import io
            content = f.read().decode("utf-8")
            results = json.loads(content)

        else:
            return jsonify({"success": False, "message": "不支援的格式，請選擇 .xlsx 或 .json"})

        db["extracted_data"] = results

        if not db["config"]:
            load_config()

        return jsonify({
            "success": True,
            "count": len(results),
            "data": results,
            "fields": [f["name"] for f in db["config"]["fields_to_extract"]] if db["config"] else []
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})



def launch_browser():
    webbrowser.open("http://127.0.0.1:5000")

if __name__ == "__main__":
    load_config()
    # Start server and auto-launch default browser in a split second
    Timer(1.0, launch_browser).start()
    app.run(port=5000, debug=False)
