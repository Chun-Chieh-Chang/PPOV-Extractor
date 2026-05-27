document.addEventListener("DOMContentLoaded", () => {
    // State management
    const state = {
        folderPath: "",
        items: [],
        selectedItem: null,
    };

    // Environment detection for GitHub Pages or local static file
    const isStaticMode = window.location.hostname.endsWith("github.io") || window.location.protocol === "file:";

    if (isStaticMode) {
        // Show premium visual tip for static mode
        setTimeout(() => {
            const leftPanel = document.querySelector(".left-panel");
            if (leftPanel) {
                const banner = document.createElement("div");
                banner.className = "card";
                banner.style.padding = "14px 20px";
                banner.style.border = "1px solid rgba(245, 158, 11, 0.4)";
                banner.style.backgroundColor = "rgba(245, 158, 11, 0.08)";
                banner.style.color = "#F59E0B";
                banner.style.fontSize = "13px";
                banner.style.lineHeight = "1.5";
                banner.style.marginBottom = "8px";
                banner.innerHTML = `
                    <i class="fa-solid fa-circle-info" style="margin-right: 6px;"></i>
                    <strong>靜態網頁展示模式</strong>：已啟用免伺服器瀏覽與 Morandi 規格單 Excel 生成引擎。請直接點擊上方 <strong>「載入現有總表」</strong> 匯入 <code>PPOV_Master_Table.xlsx</code> 或 JSON 即可瀏覽與導出規格單！
                `;
                leftPanel.insertBefore(banner, leftPanel.firstChild);
            }
        }, 100);
    }

    // DOM Elements
    const btnLoadMasterFile = document.getElementById("btnLoadMasterFile");
    const btnSelectFolder = document.getElementById("btnSelectFolder");
    const btnStartExtract = document.getElementById("btnStartExtract");
    const txtCurrentFolder = document.getElementById("txtCurrentFolder");
    const progressContainer = document.getElementById("progressContainer");
    const progressFill = document.getElementById("progressFill");
    const txtProgressPercent = document.getElementById("txtProgressPercent");
    const badgeCount = document.getElementById("badgeCount");
    const masterExportGroup = document.getElementById("masterExportGroup");
    const inputSearch = document.getElementById("inputSearch");
    const tbodyMaster = document.getElementById("tbodyMaster");
    const blankPartState = document.getElementById("blankPartState");
    const partSpecCard = document.getElementById("partSpecCard");
    const txtSpecPartNo = document.getElementById("txtSpecPartNo");
    const btnExportExcel = document.getElementById("btnExportExcel");
    const btnExportJson = document.getElementById("btnExportJson");
    const btnExportPartSpec = document.getElementById("btnExportPartSpec");

    // Grid specification values
    const specFields = {
        specPartNo: "產品型號",
        specPartName: "產品名稱",
        specDrawingRev: "圖面版次",
        specMoldNo: "模具編號",
        specCavitation: "模具穴數",
        specPressNo: "射出成型機編號",
        specPressTonnage: "射出成型機噸數",
        specScrewDia: "螺桿尺寸",
        specScrewType: "螺桿形式",
        specMaterialNo: "原料料號",
        specDryingCond: "烘料條件",
        
        // Tabular metrics
        td_melt_t: "實際融膠溫度_目標值", td_melt_l: "實際融膠溫度_下限值", td_melt_h: "實際融膠溫度_上限值", td_melt_a: "實際融膠溫度_實際值",
        td_fill_t: "填充時間_目標值", td_fill_l: "填充時間_下限值", td_fill_h: "填充時間_上限值", td_fill_a: "填充時間_實際值",
        td_fillw_t: "充填階段的產品平均重量_目標值", td_fillw_l: "充填階段的產品平均重量_下限值", td_fillw_h: "充填階段的產品平均重量_上限值", td_fillw_a: "充填階段的產品平均重量_實際值",
        td_holdp_t: "保壓壓力_目標值", td_holdp_l: "保壓壓力_下限值", td_holdp_h: "保壓壓力_上限值", td_holdp_a: "保壓壓力_實際值",
        td_holdt_t: "保壓時間_目標值", td_holdt_l: "保壓時間_下限值", td_holdt_h: "保壓時間_上限值", td_holdt_a: "保壓時間_實際值",
        td_packw_t: "保壓完的產品平均重量_目標值", td_packw_l: "保壓完的產品平均重量_下限值", td_packw_h: "保壓完的產品平均重量_上限值", td_packw_a: "保壓完的產品平均重量_實際值",
        td_cool_t: "冷卻時間_目標值", td_cool_l: "冷卻時間_下限值", td_cool_h: "冷卻時間_上限值", td_cool_a: "冷卻時間_實際值",
        td_tempa_t: "模具溫度設定-母模_目標值", td_tempa_l: "模具溫度設定-母模_下限值", td_tempa_h: "模具溫度設定-母模_上限值", td_tempa_a: "模具溫度設定-母模_實際值",
        td_tempb_t: "模具溫度設定-公模_目標值", td_tempb_l: "模具溫度設定-公模_下限值", td_tempb_h: "模具溫度設定-公模_上限值", td_tempb_a: "模具溫度設定-公模_實際值",
        td_temps_t: "模具溫度設定-滑塊_目標值", td_temps_l: "模具溫度設定-滑塊_下限值", td_temps_h: "模具溫度設定-滑塊_上限值", td_temps_a: "模具溫度設定-滑塊_實際值",
        
        // Ref metrics
        refFillShotWeight: "充填階段的模重_目標值",
        refPackedShotWeight: "保壓完的模重_目標值",
        refClampTonnage: "鎖模力_目標值",
        refCycleTime: "週期時間_目標值"
    };

    // --- BUTTON: LOAD EXISTING MASTER ---
    const inputMasterFile = document.getElementById("inputMasterFile");

    // 按鈕只負責觸發瀏覽器原生檔案選擇器（秒開，無需等待後端）
    btnLoadMasterFile.addEventListener("click", () => {
        inputMasterFile.value = ""; // 清空，確保同一檔案可重複選
        inputMasterFile.click();
    });

    // 使用者選好檔案後，自動上傳或在本地解析
    inputMasterFile.addEventListener("change", async () => {
        const file = inputMasterFile.files[0];
        if (!file) return;

        btnLoadMasterFile.disabled = true;
        btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 載入中...`;

        if (isStaticMode) {
            try {
                const isJson = file.name.toLowerCase().endsWith(".json");
                if (isJson) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const jsonData = JSON.parse(e.target.result);
                            state.items = jsonData;
                            renderMasterTable(state.items);
                            badgeCount.textContent = state.items.length;
                            if (state.items.length > 0) {
                                masterExportGroup.style.display = "flex";
                                inputSearch.disabled = false;
                                txtCurrentFolder.textContent = `已本地解析：${file.name}（共 ${state.items.length} 筆）`;
                            }
                        } catch (err) {
                            alert("JSON 格式解析錯誤");
                        }
                        btnLoadMasterFile.disabled = false;
                        btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-file-excel"></i> 載入現有總表`;
                    };
                    reader.readAsText(file);
                } else {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            const firstSheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[firstSheetName];
                            
                            // Parse Excel to JSON array
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            
                            state.items = jsonData.map(row => {
                                const newRow = {};
                                for (const [k, v] of Object.entries(row)) {
                                    newRow[k] = (v === null || v === undefined) ? "" : String(v);
                                }
                                return newRow;
                            });
                            
                            renderMasterTable(state.items);
                            badgeCount.textContent = state.items.length;
                            if (state.items.length > 0) {
                                masterExportGroup.style.display = "flex";
                                inputSearch.disabled = false;
                                txtCurrentFolder.textContent = `已本地解析：${file.name}（共 ${state.items.length} 筆）`;
                            }
                        } catch (err) {
                            console.error(err);
                            alert("本地解析 Excel 總表時出錯！請確認檔案格式是否正確。");
                        }
                        btnLoadMasterFile.disabled = false;
                        btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-file-excel"></i> 載入現有總表`;
                    };
                    reader.readAsArrayBuffer(file);
                }
            } catch (error) {
                console.error("Local load error:", error);
                btnLoadMasterFile.disabled = false;
                btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-file-excel"></i> 載入現有總表`;
            }
            return;
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/load_master_file", {
                method: "POST",
                body: formData   // 瀏覽器直接傳檔案，後端不需要 tkinter
            });
            const result = await response.json();
            if (result.success) {
                state.items = result.data;
                renderMasterTable(state.items);
                badgeCount.textContent = result.count;
                if (result.count > 0) {
                    masterExportGroup.style.display = "flex";
                    inputSearch.disabled = false;
                    txtCurrentFolder.textContent = `已載入：${file.name}（共 ${result.count} 筆）`;
                }
            } else {
                alert(result.message || "載入失敗");
            }
        } catch (error) {
            console.error("Error loading master file:", error);
            alert("載入總表程序發生異常錯誤");
        } finally {
            btnLoadMasterFile.disabled = false;
            btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-file-excel"></i> 載入現有總表`;
        }
    });


    // --- BUTTON: SELECT FOLDER ---
    btnSelectFolder.addEventListener("click", async () => {
        if (isStaticMode) {
            alert("💡 提示：本機資料夾選擇與 PDF 數據提取功能需要 Python 後端伺服器運行。\n\n在 GitHub 靜態展示頁面中，請使用上方『載入現有總表』直接選擇並分析解析後的檔案！");
            return;
        }
        try {
            const response = await fetch("/api/select_folder", { method: "POST" });
            const result = await response.json();
            if (result.success) {
                state.folderPath = result.path;
                txtCurrentFolder.textContent = result.path;
                btnStartExtract.disabled = false;
            } else {
                console.warn(result.message);
            }
        } catch (error) {
            console.error("Error choosing folder:", error);
        }
    });

    // --- BUTTON: START EXTRACTION ---
    btnStartExtract.addEventListener("click", async () => {
        if (isStaticMode) return;
        if (!state.folderPath) return;

        // Reset UI progress states
        btnSelectFolder.disabled = true;
        btnStartExtract.disabled = true;
        progressContainer.style.display = "block";
        progressFill.style.width = "0%";
        txtProgressPercent.textContent = "0%";

        // Simulating loader step widths for responsive UI feedback
        let progress = 10;
        const progressTimer = setInterval(() => {
            if (progress < 90) {
                progress += Math.floor(Math.random() * 5) + 2;
                progressFill.style.width = `${progress}%`;
                txtProgressPercent.textContent = `${progress}%`;
            }
        }, 300);

        try {
            const response = await fetch("/api/extract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ path: state.folderPath })
            });
            const result = await response.json();

            clearInterval(progressTimer);
            progressFill.style.width = "100%";
            txtProgressPercent.textContent = "100%";

            setTimeout(() => {
                progressContainer.style.display = "none";
                btnSelectFolder.disabled = false;
                btnStartExtract.disabled = false;
                
                if (result.success) {
                    state.items = result.data;
                    renderMasterTable(state.items);
                    badgeCount.textContent = result.count;
                    if (result.count > 0) {
                        masterExportGroup.style.display = "flex";
                        inputSearch.disabled = false;
                    }
                } else {
                    alert(result.message || "提取失敗");
                }
            }, 500);

        } catch (error) {
            clearInterval(progressTimer);
            progressContainer.style.display = "none";
            btnSelectFolder.disabled = false;
            btnStartExtract.disabled = false;
            console.error("Extraction error:", error);
            alert("伺服器提取程序發生異常錯誤");
        }
    });

    // --- RENDER MASTER TABLE ---
    function renderMasterTable(data) {
        tbodyMaster.innerHTML = "";
        if (data.length === 0) {
            tbodyMaster.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-table-state">
                        <i class="fa-solid fa-folder-open empty-icon"></i>
                        <p>未找到符合條件的數據</p>
                    </td>
                </tr>
            `;
            return;
        }

        data.forEach(item => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${item["產品型號"] || "未知"}</strong></td>
                <td>${item["產品名稱"] || "N/A"}</td>
                <td>${item["圖面版次"] || "N/A"}</td>
                <td>${item["模具編號"] || "N/A"}</td>
                <td>${item["射出成型機編號"] || "N/A"}</td>
            `;

            // Highlight selected row
            if (state.selectedItem && state.selectedItem["產品型號"] === item["產品型號"]) {
                tr.classList.add("selected");
            }

            tr.addEventListener("click", () => {
                document.querySelectorAll("#tableMaster tbody tr").forEach(row => row.classList.remove("selected"));
                tr.classList.add("selected");
                state.selectedItem = item;
                renderSpecSheet(item);
            });

            tbodyMaster.appendChild(tr);
        });
    }

    // --- RENDER SPECIFICATION SHEET ---
    function renderSpecSheet(item) {
        blankPartState.style.display = "none";
        partSpecCard.style.display = "flex";
        txtSpecPartNo.textContent = item["產品型號"] || "未知品號";

        // Update each DOM grid item dynamically
        for (const [domId, key] of Object.entries(specFields)) {
            const element = document.getElementById(domId);
            if (element) {
                if (domId.endsWith("_a")) {
                    element.textContent = ""; // 實際值全部留空
                } else {
                    const val = item[key];
                    element.textContent = (val !== undefined && val !== null) ? val : "N/A";
                }
            }
        }
    }

    // --- FILTER & SEARCH ---
    inputSearch.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = state.items.filter(item => {
            const partNo = (item["產品型號"] || "").toLowerCase();
            const partName = (item["產品名稱"] || "").toLowerCase();
            return partNo.includes(query) || partName.includes(query);
        });
        renderMasterTable(filtered);
    });

    // --- EXPORT MASTER EXCEL ---
    btnExportExcel.addEventListener("click", () => triggerFileExport("excel"));

    // --- EXPORT MASTER JSON ---
    btnExportJson.addEventListener("click", () => triggerFileExport("json"));

    async function triggerFileExport(format) {
        if (isStaticMode) {
            if (format === "excel") {
                try {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet("Master Table");
                    
                    const columnOrder = ["檔案名稱", "產品型號", "產品名稱", "圖面版次", "模具編號", "模具穴數", "射出成型機編號", "射出成型機噸數", "螺桿尺寸", "螺桿形式", "原料料號", "烘料條件", "實際融膠溫度_目標值", "實際融膠溫度_下限值", "實際融膠溫度_上限值", "實際融膠溫度_實際值", "填充時間_目標值", "填充時間_下限值", "填充時間_上限值", "填充時間_實際值", "充填階段的產品平均重量_目標值", "充填階段的產品平均重量_下限值", "充填階段的產品平均重量_上限值", "充填階段的產品平均重量_實際值", "保壓壓力_目標值", "保壓壓力_下限值", "保壓壓力_上限值", "保壓壓力_實際值", "保壓時間_目標值", "保壓時間_下限值", "保壓時間_上限值", "保壓時間_實際值", "保壓完的產品平均重量_目標值", "保壓完的產品平均重量_下限值", "保壓完的產品平均重量_上限值", "保壓完的產品平均重量_實際值", "冷卻時間_目標值", "冷卻時間_下限值", "冷卻時間_上限值", "冷卻時間_實際值", "模具溫度設定-母模_目標值", "模具溫度設定-母模_下限值", "模具溫度設定-母模_上限值", "模具溫度設定-母模_實際值", "模具溫度設定-公模_目標值", "模具溫度設定-公模_下限值", "模具溫度設定-公模_上限值", "模具溫度設定-公模_實際值", "模具溫度設定-滑塊_目標值", "模具溫度設定-滑塊_下限值", "模具溫度設定-滑塊_上限值", "模具溫度設定-滑塊_實際值", "充填階段的模重_目標值", "保壓完的模重_目標值", "鎖模力_目標值", "週期時間_目標值"];
                    
                    worksheet.addRow(columnOrder);
                    state.items.forEach(item => {
                        const rowVals = columnOrder.map(col => item[col] || "");
                        worksheet.addRow(rowVals);
                    });
                    
                    const buffer = await workbook.xlsx.writeBuffer();
                    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "PPOV_Master_Table.xlsx";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } catch (e) {
                    alert("本地導出總表 Excel 失敗");
                }
            } else {
                const content = JSON.stringify(state.items, null, 2);
                const blob = new Blob([content], { type: "application/json" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "PPOV_Master_Table.json";
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            return;
        }

        try {
            const response = await fetch("/api/export_master", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format })
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = format === "excel" ? "PPOV_Master_Table.xlsx" : "PPOV_Master_Table.json";
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("總表導出失敗");
            }
        } catch (e) {
            console.error("Export error:", e);
        }
    }

    // --- EXPORT SINGLE PART SPEC SHEET EXCEL ---
    btnExportPartSpec.addEventListener("click", async () => {
        if (!state.selectedItem) return;
        const partNo = state.selectedItem["產品型號"];
        
        if (isStaticMode) {
            try {
                const partData = state.selectedItem;
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(`PPOV - ${partNo}`);
                worksheet.views = [{ showGridLines: true }];
                
                // Color Palette
                const NAVY_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
                const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
                const SUBHEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
                const ACCENT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                
                // Font styles
                const title_font = { name: 'Microsoft JhengHei', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
                const section_font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                const label_font = { name: 'Microsoft JhengHei', size: 10, bold: true, color: { argb: 'FF334155' } };
                const value_font = { name: 'Microsoft JhengHei', size: 10, color: { argb: 'FF000000' } };
                const header_col_font = { name: 'Microsoft JhengHei', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                
                // Borders
                const thin_border_side = { style: 'thin', color: { argb: 'FFCBD5E1' } };
                const thin_border = { left: thin_border_side, right: thin_border_side, top: thin_border_side, bottom: thin_border_side };
                
                // Alignments
                const center_align = { horizontal: 'center', vertical: 'middle', wrapText: true };
                const left_align = { horizontal: 'left', vertical: 'middle', wrapText: true };
                
                // Set Row Heights
                worksheet.getRow(1).height = 40;
                for (let r = 2; r < 40; r++) {
                    worksheet.getRow(r).height = 24;
                }
                
                // Title Block (Row 1)
                worksheet.mergeCells('A1:E1');
                const title_cell = worksheet.getCell('A1');
                title_cell.value = `PPOV 射出成型數據查檢表 - ${partNo}`;
                title_cell.font = title_font;
                title_cell.fill = NAVY_FILL;
                title_cell.alignment = center_align;
                
                // Basic Info Header (Row 2)
                worksheet.mergeCells('A2:E2');
                const info_sec = worksheet.getCell('A2');
                info_sec.value = "  基本資訊 (Basic Information)";
                info_sec.font = section_font;
                info_sec.fill = HEADER_FILL;
                info_sec.alignment = left_align;
                
                const basic_fields = [
                    ["產品型號 Part No.", partData["產品型號"] || "N/A", "圖面版次 Drawing Rev.", partData["圖面版次"] || "N/A"],
                    ["產品名稱 Description", partData["產品名稱"] || "N/A", "模具編號 Mold No.", partData["模具編號"] || "N/A"],
                    ["模具穴數 Cavitation", partData["模具穴數"] || "N/A", "射出成型機編號 Press No.", partData["射出成型機編號"] || "N/A"],
                    ["機台噸數 Press Tonnage", partData["射出成型機噸數"] || "N/A", "螺桿尺寸 Screw Dia.", partData["螺桿尺寸"] || "N/A"],
                    ["原料料號 Material No.", partData["原料料號"] || "N/A", "烘料條件 Drying Cond.", partData["烘料條件"] || "N/A"]
                ];
                
                let curr_row = 3;
                basic_fields.forEach(([f1, v1, f2, v2]) => {
                    const row = worksheet.getRow(curr_row);
                    row.getCell(1).value = f1;
                    row.getCell(1).font = label_font;
                    row.getCell(1).fill = ACCENT_FILL;
                    row.getCell(1).alignment = left_align;
                    
                    row.getCell(2).value = v1;
                    row.getCell(2).font = value_font;
                    row.getCell(2).alignment = left_align;
                    
                    row.getCell(3).value = f2;
                    row.getCell(3).font = label_font;
                    row.getCell(3).fill = ACCENT_FILL;
                    row.getCell(3).alignment = left_align;
                    
                    worksheet.mergeCells(curr_row, 4, curr_row, 5);
                    row.getCell(4).value = v2;
                    row.getCell(4).font = value_font;
                    row.getCell(4).alignment = left_align;
                    
                    for (let c = 1; c <= 5; c++) {
                        row.getCell(c).border = thin_border;
                    }
                    curr_row++;
                });
                
                curr_row++; // Spacing
                
                // Key Process Parameters Header
                worksheet.mergeCells(curr_row, 1, curr_row, 5);
                const proc_sec = worksheet.getCell(curr_row, 1);
                proc_sec.value = "  關鍵製程參數 (Key Process Parameters)";
                proc_sec.font = section_font;
                proc_sec.fill = HEADER_FILL;
                proc_sec.alignment = left_align;
                curr_row++;
                
                // Column Headers
                const headers = ["參數項目 Parameter", "目標值 (Target)", "下限值 (Low)", "上限值 (High)", "實際值 (Actual)"];
                const header_row = worksheet.getRow(curr_row);
                headers.forEach((h, idx) => {
                    const cell = header_row.getCell(idx + 1);
                    cell.value = h;
                    cell.font = header_col_font;
                    cell.fill = SUBHEADER_FILL;
                    cell.alignment = center_align;
                    cell.border = thin_border;
                });
                curr_row++;
                
                const proc_rows = [
                    ["實際融膠溫度 Melt Temp (℃)", "實際融膠溫度_目標值", "實際融膠溫度_下限值", "實際融膠溫度_上限值", "實際融膠溫度_實際值"],
                    ["填充時間 Fill Time (s)", "填充時間_目標值", "填充時間_下限值", "填充時間_上限值", "填充時間_實際值"],
                    ["產品充填重量 Average Fill Weight (g)", "充填階段的產品平均重量_目標值", "充填階段的產品平均重量_下限值", "充填階段的產品平均重量_上限值", "充填階段的產品平均重量_實際值"],
                    ["保壓壓力 Hold Pressure (bar)", "保壓壓力_目標值", "保壓壓力_下限值", "保壓壓力_上限值", "保壓壓力_實際值"],
                    ["保壓時間 Hold Time (s)", "保壓時間_目標值", "保壓時間_下限值", "保壓時間_上限值", "保壓時間_實際值"],
                    ["保壓完產品重量 Packed Weight (g)", "保壓完的產品平均重量_目標值", "保壓完的產品平均重量_下限值", "保壓完的產品平均重量_上限值", "保壓完的產品平均重量_實際值"],
                    ["冷卻時間 Cooling Time (s)", "冷卻時間_目標值", "冷卻時間_下限值", "冷卻時間_上限值", "冷卻時間_實際值"],
                    ["模具溫度-母模 Water Temp A-Side (℃)", "模具溫度設定-母模_目標值", "模具溫度設定-母模_下限值", "模具溫度設定-母模_上限值", "模具溫度設定-母模_實際值"],
                    ["模具溫度-公模 Water Temp B-Side (℃)", "模具溫度設定-公模_目標值", "模具溫度設定-公模_下限值", "模具溫度設定-公模_上限值", "模具溫度設定-公模_實際值"],
                    ["模具溫度-滑塊 Water Temp Slide (℃)", "模具溫度設定-滑塊_目標值", "模具溫度設定-滑塊_下限值", "模具溫度設定-滑塊_上限值", "模具溫度設定-滑塊_實際值"],
                ];
                
                proc_rows.forEach(([label, target_k, low_k, high_k, actual_k]) => {
                    const row = worksheet.getRow(curr_row);
                    row.getCell(1).value = label;
                    row.getCell(1).font = label_font;
                    row.getCell(1).fill = ACCENT_FILL;
                    row.getCell(1).alignment = left_align;
                    
                    row.getCell(2).value = partData[target_k] || "N/A";
                    row.getCell(3).value = partData[low_k] || "N/A";
                    row.getCell(4).value = partData[high_k] || "N/A";
                    row.getCell(5).value = ""; // 實際值留空
                    
                    for (let c = 2; c <= 5; c++) {
                        row.getCell(c).font = value_font;
                        row.getCell(c).alignment = center_align;
                    }
                    
                    for (let c = 1; c <= 5; c++) {
                        row.getCell(c).border = thin_border;
                    }
                    curr_row++;
                });
                
                curr_row++; // Spacing
                
                // Reference parameters header
                worksheet.mergeCells(curr_row, 1, curr_row, 5);
                const ref_sec = worksheet.getCell(curr_row, 1);
                ref_sec.value = "  參考規格參數 (Reference Parameters)";
                ref_sec.font = section_font;
                ref_sec.fill = HEADER_FILL;
                ref_sec.alignment = left_align;
                curr_row++;
                
                const ref_fields = [
                    ["充填階段模重 Fill Only Shot Weight (g)", "充填階段的模重_目標值"],
                    ["保壓完模重 Packed Out Shot Weight (g)", "保壓完的模重_目標值"],
                    ["鎖模力設定 Clamp Tonnage (ton)", "鎖模力_目標值"],
                    ["生產週期時間 Mold Cycle Time (s)", "週期時間_目標值"]
                ];
                
                ref_fields.forEach(([label, key]) => {
                    const row = worksheet.getRow(curr_row);
                    row.getCell(1).value = label;
                    row.getCell(1).font = label_font;
                    row.getCell(1).fill = ACCENT_FILL;
                    row.getCell(1).alignment = left_align;
                    
                    worksheet.mergeCells(curr_row, 2, curr_row, 4);
                    row.getCell(2).value = partData[key] || "N/A";
                    row.getCell(2).font = value_font;
                    row.getCell(2).alignment = center_align;
                    
                    row.getCell(5).value = ""; // check box
                    row.getCell(5).font = value_font;
                    row.getCell(5).alignment = center_align;
                    
                    for (let c = 1; c <= 5; c++) {
                        row.getCell(c).border = thin_border;
                    }
                    curr_row++;
                });
                
                curr_row++; // Spacing row
                
                // Footer
                worksheet.mergeCells(curr_row, 1, curr_row, 5);
                const footer_cell = worksheet.getCell(curr_row, 1);
                footer_cell.value = "Wesley Chang @ Mouldex, 2026. QC Dept. | PPOV 射出成型數據查檢表";
                footer_cell.font = { name: 'Microsoft JhengHei', size: 8, italic: true, color: { argb: 'FF64748B' } };
                footer_cell.alignment = { horizontal: 'right', vertical: 'middle' };
                
                // Adjust widths
                worksheet.getColumn(1).width = 38;
                worksheet.getColumn(2).width = 16;
                worksheet.getColumn(3).width = 16;
                worksheet.getColumn(4).width = 16;
                worksheet.getColumn(5).width = 16;
                
                // Write workbook to buffer and download
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `PPOV_Spec_${partNo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (err) {
                console.error("Client-side Excel generation error:", err);
                alert("瀏覽器本地生成規格表單失敗");
            }
            return;
        }

        try {
            const response = await fetch("/api/export_part", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ part_no: partNo })
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `PPOV_Spec_${partNo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                alert("品號規格單導出失敗");
            }
        } catch (e) {
            console.error("Single export error:", e);
        }
    });

    // --- GITHUB SYNC LOGIC & MODAL CONTROLLERS ---
    const gitModal = document.getElementById("gitModal");
    const btnOpenGitModal = document.getElementById("btnOpenGitModal");
    const btnCloseGitModal = document.getElementById("btnCloseGitModal");
    const gitBadgeDot = document.getElementById("gitBadgeDot");

    const gitBadgeStatus = document.getElementById("gitBadgeStatus");
    const txtGitRemote = document.getElementById("txtGitRemote");
    const txtGitStatus = document.getElementById("txtGitStatus");
    const inputCommitMsg = document.getElementById("inputCommitMsg");
    const btnGitPush = document.getElementById("btnGitPush");
    const gitLogDetails = document.getElementById("gitLogDetails");

    if (isStaticMode) {
        btnOpenGitModal.style.display = "none";
    }

    // Open Git Modal with smooth animation
    btnOpenGitModal.addEventListener("click", () => {
        if (isStaticMode) return;
        gitModal.style.display = "flex";
        // Force reflow
        void gitModal.offsetWidth;
        gitModal.classList.add("active");
        updateGitStatus();
    });

    // Close Git Modal
    function closeGitModal() {
        gitModal.classList.remove("active");
        setTimeout(() => {
            gitModal.style.display = "none";
        }, 300);
    }

    btnCloseGitModal.addEventListener("click", closeGitModal);

    // Close modal if user clicks outside of modal content
    gitModal.addEventListener("click", (e) => {
        if (e.target === gitModal) {
            closeGitModal();
        }
    });

    async function updateGitStatus() {
        if (isStaticMode) return;
        try {
            const res = await fetch("/api/git_status");
            const data = await res.json();
            if (data.success) {
                txtGitRemote.textContent = data.remote;
                txtGitStatus.textContent = `${data.branch} (${data.change_count} 個變更)`;
                
                if (data.has_changes) {
                    gitBadgeStatus.className = "badge badge-warning";
                    gitBadgeStatus.textContent = "待同步";
                    gitBadgeDot.style.display = "inline-block";
                } else {
                    gitBadgeStatus.className = "badge badge-success";
                    gitBadgeStatus.textContent = "已同步";
                    gitBadgeDot.style.display = "none";
                }
            } else {
                txtGitStatus.textContent = "偵測失敗";
            }
        } catch (err) {
            console.error("Error reading git status:", err);
        }
    }

    // Initialize Git Status on load
    updateGitStatus();

    btnGitPush.addEventListener("click", async () => {
        const commitMsg = inputCommitMsg.value.trim();
        if (!commitMsg) {
            alert("請輸入 Commit 提交訊息！");
            return;
        }

        btnGitPush.disabled = true;
        btnGitPush.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 確效並推送中...`;
        gitLogDetails.style.display = "none";
        gitLogDetails.textContent = "";

        try {
            const response = await fetch("/api/git_push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commit_msg: commitMsg })
            });
            const result = await response.json();
            
            if (result.success) {
                alert(result.message);
                updateGitStatus();
                closeGitModal();
            } else {
                alert(result.message || "推送失敗");
                if (result.details) {
                    gitLogDetails.style.display = "block";
                    gitLogDetails.textContent = result.details;
                }
            }
        } catch (error) {
            console.error("Git push error:", error);
            alert("與伺服器連線發生異常");
        } finally {
            btnGitPush.disabled = false;
            btnGitPush.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 執行軟體確效並推送`;
        }
    });
});

