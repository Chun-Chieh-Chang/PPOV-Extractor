document.addEventListener("DOMContentLoaded", () => {
    // State management
    const state = {
        folderPath: "",
        items: [],
        selectedItem: null,
        inspectionData: {}, // { partNo: { key: value, ... } }
        isEditMode: false,
        sortKey: null,
        sortDirection: "asc", // "asc" or "desc"
        user: null, // { username, role, display_name } (Phase D)
    };

    // Environment detection for GitHub Pages or local static file
    const isStaticMode = window.location.hostname.endsWith("github.io") || window.location.protocol === "file:";

    async function saveBlobWithPathPrompt(blob, suggestedName, format) {
        if (!window.showSaveFilePicker) {
            alert("此瀏覽器無法在匯出前詢問儲存路徑。\n\n請使用 Microsoft Edge / Google Chrome 開啟，或改用 Python 本機版匯出。");
            return false;
        }

        const pickerTypes = format === "json"
            ? [{
                description: "JSON Files",
                accept: { "application/json": [".json"] }
            }]
            : [{
                description: "Excel Files",
                accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }
            }];

        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName,
                types: pickerTypes
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            alert(`檔案已儲存：\n${fileHandle.name}`);
            return true;
        } catch (error) {
            if (error && error.name === "AbortError") {
                return false;
            }
            throw error;
        }
    }

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
    const btnInputInspection = document.getElementById("btnInputInspection");

    // New database and dashboard DOM elements
    const btnAddNewPart = document.getElementById("btnAddNewPart");
    const inputSinglePdf = document.getElementById("inputSinglePdf");
    const btnClearDatabase = document.getElementById("btnClearDatabase");
    const partEditModal = document.getElementById("partEditModal");
    const btnCloseEditModal = document.getElementById("btnCloseEditModal");
    const btnCancelEditModal = document.getElementById("btnCancelEditModal");
    const btnSavePartEdit = document.getElementById("btnSavePartEdit");
    const formPartEdit = document.getElementById("formPartEdit");
    const lblModalTitle = document.getElementById("lblModalTitle");
    
    // Stats dashboard widgets
    const txtStatsTotalParts = document.getElementById("txtStatsTotalParts");
    const txtStatsTotalFiles = document.getElementById("txtStatsTotalFiles");
    const txtStatsTotalPresses = document.getElementById("txtStatsTotalPresses");
    const txtStatsLastSync = document.getElementById("txtStatsLastSync");

    // Version Control UI Modal Elements
    const btnVersion = document.getElementById("btnVersion");
    const versionModal = document.getElementById("versionModal");
    const btnCloseVersion = document.getElementById("btnCloseVersion");

    // Phase D: Auth and Login UI Elements
    const loginOverlay = document.getElementById("loginOverlay");
    const formLogin = document.getElementById("formLogin");
    const login_username = document.getElementById("login_username");
    const login_password = document.getElementById("login_password");
    const loginErrorMsg = document.getElementById("loginErrorMsg");
    const loginErrorText = document.getElementById("loginErrorText");
    const btnLoginSubmit = document.getElementById("btnLoginSubmit");
    const userProfile = document.getElementById("userProfile");
    const txtUserDisplayName = document.getElementById("txtUserDisplayName");
    const txtUserRole = document.getElementById("txtUserRole");
    const btnLogout = document.getElementById("btnLogout");
    const btnLoginPrompt = document.getElementById("btnLoginPrompt");
    const btnCloseLogin = document.getElementById("btnCloseLogin");

    // Change-password modal DOM references
    const changePasswordModal = document.getElementById("changePasswordModal");
    const formChangePassword = document.getElementById("formChangePassword");
    const btnChangePassword = document.getElementById("btnChangePassword");
    const btnCloseChangePassword = document.getElementById("btnCloseChangePassword");
    const btnCancelChangePassword = document.getElementById("btnCancelChangePassword");
    const btnSubmitChangePassword = document.getElementById("btnSubmitChangePassword");
    const cp_current = document.getElementById("cp_current");
    const cp_new = document.getElementById("cp_new");
    const cp_confirm = document.getElementById("cp_confirm");
    const cpErrorMsg = document.getElementById("cpErrorMsg");
    const cpErrorText = document.getElementById("cpErrorText");
    const cpSuccessMsg = document.getElementById("cpSuccessMsg");
    const cpSuccessText = document.getElementById("cpSuccessText");


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

    // --- SYSTEM VERSION & CHANGELOG MODAL LOGIC ---
    if (btnVersion && versionModal && btnCloseVersion) {
        btnVersion.addEventListener("click", () => {
            versionModal.classList.add("active");
        });

        btnCloseVersion.addEventListener("click", () => {
            versionModal.classList.remove("active");
        });

        // Close when clicking outside of the modal content
        versionModal.addEventListener("click", (e) => {
            if (e.target === versionModal) {
                versionModal.classList.remove("active");
            }
        });

        // Close on Escape key press
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && versionModal.classList.contains("active")) {
                versionModal.classList.remove("active");
            }
        });
    }

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

    // --- EVENT DELEGATION FOR MASTER TABLE ROWS & BUTTONS (V1.5.1 Performance Optimization) ---
    tbodyMaster.addEventListener("click", (e) => {
        const tr = e.target.closest("tr");
        if (!tr || tr.parentElement !== tbodyMaster) return;
        
        const partNo = tr.getAttribute("data-part-no");
        if (!partNo) return;
        
        const item = state.items.find(x => x["產品型號"] === partNo);
        if (!item) return;

        // Check if edit button was clicked
        const btnEdit = e.target.closest(".btn-edit-row");
        if (btnEdit) {
            e.stopPropagation();
            openEditModal(item);
            return;
        }

        // Check if delete button was clicked
        const btnDelete = e.target.closest(".btn-delete-row");
        if (btnDelete) {
            e.stopPropagation();
            deletePartRecord(partNo);
            return;
        }

        // Otherwise, select the row
        document.querySelectorAll("#tableMaster tbody tr").forEach(row => row.classList.remove("selected"));
        tr.classList.add("selected");
        state.selectedItem = item;
        renderSpecSheet(item);
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

    // --- SORTING FUNCTIONS ---
    function sortData(data, key, direction) {
        return [...data].sort((a, b) => {
            const valA = (a[key] || "").toString().toLowerCase();
            const valB = (b[key] || "").toString().toLowerCase();
            
            if (direction === "asc") {
                return valA.localeCompare(valB, "zh-TW");
            } else {
                return valB.localeCompare(valA, "zh-TW");
            }
        });
    }

    function updateSortIcons() {
        document.querySelectorAll("#tableMaster th.sortable").forEach(th => {
            const icon = th.querySelector(".sort-icon");
            const key = th.getAttribute("data-sort-key");
            
            if (icon) {
                icon.className = "fa-solid sort-icon";
                if (key === state.sortKey) {
                    icon.className += state.sortDirection === "asc" ? " fa-sort-up" : " fa-sort-down";
                } else {
                    icon.className += " fa-sort";
                }
            }
        });
    }

    // --- RENDER MASTER TABLE ---
    function renderMasterTable(data) {
        let displayData = [...data];
        
        if (state.sortKey) {
            displayData = sortData(displayData, state.sortKey, state.sortDirection);
        }
        
        tbodyMaster.innerHTML = "";
        const isAdmin = state.user && state.user.role === "admin";
        if (displayData.length === 0) {
            tbodyMaster.innerHTML = `
                <tr>
                    <td colspan="${isAdmin ? 6 : 5}" class="empty-table-state">
                        <i class="fa-solid fa-folder-open empty-icon"></i>
                        <p>未找到符合條件的數據</p>
                    </td>
                </tr>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();
        displayData.forEach(item => {
            const tr = document.createElement("tr");
            const partNo = item["產品型號"] || "";
            tr.setAttribute("data-part-no", partNo);
            
            tr.innerHTML = `
                <td><strong>${partNo || "未知"}</strong></td>
                <td>${item["產品名稱"] || "N/A"}</td>
                <td>${item["圖面版次"] || "N/A"}</td>
                <td>${item["模具編號"] || "N/A"}</td>
                <td>${item["射出成型機編號"] || "N/A"}</td>
                ${isAdmin ? `
                <td>
                    <div class="row-actions">
                        <button class="btn-icon-action btn-edit-row" title="編輯品號"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon-action btn-delete-row" title="刪除品號"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
                ` : ""}
            `;

            // Highlight selected row
            if (state.selectedItem && state.selectedItem["產品型號"] === partNo) {
                tr.classList.add("selected");
            }

            fragment.appendChild(tr);
        });

        tbodyMaster.appendChild(fragment);

        // Update statistics cards
        updateStatistics();
    }

    // --- RENDER SPECIFICATION SHEET ---
    function renderSpecSheet(item) {
        blankPartState.style.display = "none";
        partSpecCard.style.display = "flex";
        txtSpecPartNo.textContent = item["產品型號"] || "未知品號";

        // Exit edit mode when switching parts
        if (state.isEditMode) {
            exitEditMode();
        }

        // Show the inspection input button
        btnInputInspection.style.display = "inline-flex";

        // 動態更新保壓壓力的單位
        const holdpUnit = item["_單位_保壓壓力"] || "kg/cm²";
        // 更新 templates/index.html 中的單位
        const holdpTargetCell = document.getElementById('td_holdp_t');
        if (holdpTargetCell && holdpTargetCell.parentElement) {
            const firstCell = holdpTargetCell.parentElement.querySelector('td:first-child');
            if (firstCell) {
                firstCell.textContent = `保壓壓力 (${holdpUnit})`;
            }
        }

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

        // Restore saved inspection data if available for this part
        const partNo = item["產品型號"];
        const saved = state.inspectionData[partNo];
        if (saved) {
            document.querySelectorAll('[data-input-key]').forEach(td => {
                const key = td.getAttribute('data-input-key');
                if (saved[key]) {
                    td.innerHTML = `<span class="inspect-value">${saved[key]}</span>`;
                } else {
                    td.textContent = '';
                }
            });
        } else {
            // Clear all editable cells
            document.querySelectorAll('[data-input-key]').forEach(td => {
                td.textContent = '';
            });
        }
    }

    // --- INSPECTION DATA INPUT MODE ---
    btnInputInspection.addEventListener("click", () => {
        if (state.isEditMode) {
            exitEditMode();
        } else {
            enterEditMode();
        }
    });

    function enterEditMode() {
        state.isEditMode = true;
        btnInputInspection.classList.add('editing');
        btnInputInspection.innerHTML = '<i class="fa-solid fa-check-circle"></i> 確認儲存';

        // Add edit-mode class to all spec tables
        document.querySelectorAll('.spec-table').forEach(table => {
            table.classList.add('edit-mode');
        });

        const partNo = state.selectedItem ? state.selectedItem["產品型號"] : null;
        const saved = partNo ? (state.inspectionData[partNo] || {}) : {};

        // Convert all [data-input-key] cells to input fields
        document.querySelectorAll('[data-input-key]').forEach(td => {
            const key = td.getAttribute('data-input-key');
            const currentVal = saved[key] || '';
            td.classList.add('editable-cell');
            td.innerHTML = `<input type="text" class="inspect-input" data-key="${key}" value="${currentVal}" placeholder="輸入...">`;
        });

        // Auto-focus the first input
        const firstInput = document.querySelector('.inspect-input');
        if (firstInput) firstInput.focus();

        // Add Tab navigation between inputs (Enter key moves to next)
        document.querySelectorAll('.inspect-input').forEach((input, idx, all) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const next = all[idx + 1];
                    if (next) next.focus();
                    else exitEditMode(); // Last field: auto-save
                }
            });
        });
    }

    function exitEditMode() {
        state.isEditMode = false;
        btnInputInspection.classList.remove('editing');
        btnInputInspection.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> 輸入查檢數據';

        // Remove edit-mode class
        document.querySelectorAll('.spec-table').forEach(table => {
            table.classList.remove('edit-mode');
        });

        // Collect all input values and save to state
        const partNo = state.selectedItem ? state.selectedItem["產品型號"] : null;
        if (!partNo) return;

        if (!state.inspectionData[partNo]) {
            state.inspectionData[partNo] = {};
        }

        document.querySelectorAll('.inspect-input').forEach(input => {
            const key = input.getAttribute('data-key');
            const val = input.value.trim();
            if (val) {
                state.inspectionData[partNo][key] = val;
            } else {
                delete state.inspectionData[partNo][key];
            }
        });

        // Convert inputs back to display text
        document.querySelectorAll('[data-input-key]').forEach(td => {
            const key = td.getAttribute('data-input-key');
            const val = state.inspectionData[partNo][key];
            td.classList.remove('editable-cell');
            if (val) {
                td.innerHTML = `<span class="inspect-value">${val}</span>`;
            } else {
                td.textContent = '';
            }
        });
    }

    // --- SORT TABLE HEADERS ---
    document.querySelectorAll("#tableMaster th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.getAttribute("data-sort-key");
            
            if (state.sortKey === key) {
                state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
            } else {
                state.sortKey = key;
                state.sortDirection = "asc";
            }
            
            updateSortIcons();
            
            const query = inputSearch.value.toLowerCase().trim();
            const filtered = state.items.filter(item => {
                const partNo = (item["產品型號"] || "").toLowerCase();
                const partName = (item["產品名稱"] || "").toLowerCase();
                return partNo.includes(query) || partName.includes(query);
            });
            renderMasterTable(filtered);
        });
    });

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
                    await saveBlobWithPathPrompt(blob, "PPOV_Master_Table.xlsx", "excel");
                } catch (e) {
                    alert("本地導出總表 Excel 失敗");
                }
            } else {
                const content = JSON.stringify(state.items, null, 2);
                const blob = new Blob([content], { type: "application/json" });
                await saveBlobWithPathPrompt(blob, "PPOV_Master_Table.json", "json");
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
                const buffer = await response.arrayBuffer();
                let mimeType, fileName;
                if (format === "excel") {
                    mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    fileName = "PPOV_Master_Table.xlsx";
                } else {
                    mimeType = "application/json";
                    fileName = "PPOV_Master_Table.json";
                }
                const blob = new Blob([buffer], { type: mimeType });
                await saveBlobWithPathPrompt(blob, fileName, format);
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
                
                // Color Palette (Coordinated Ice Blue Light Theme)
                const NAVY_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5F' } };
                const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3A7CA8' } };
                const SUBHEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF50718C' } };
                const ACCENT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FB' } };
                
                // Font styles
                const title_font = { name: 'Microsoft JhengHei', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
                const section_font = { name: 'Microsoft JhengHei', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                const label_font = { name: 'Microsoft JhengHei', size: 10, bold: true, color: { argb: 'FF1A3A5F' } };
                const value_font = { name: 'Microsoft JhengHei', size: 10, color: { argb: 'FF000000' } };
                const header_col_font = { name: 'Microsoft JhengHei', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
                
                // Borders
                const thin_border_side = { style: 'thin', color: { argb: 'FFB4D8E7' } };
                const thin_border = { left: thin_border_side, right: thin_border_side, top: thin_border_side, bottom: thin_border_side };
                
                // Alignments
                const center_align = { horizontal: 'center', vertical: 'middle', wrapText: true };
                const left_align = { horizontal: 'left', vertical: 'middle', wrapText: true };
                
                // Title row height will be set dynamically at the end
                
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
                    // Write inspection data if available
                    const actualKeyMap = {
                        '實際融膠溫度_實際值': 'melt_actual',
                        '填充時間_實際值': 'fill_actual',
                        '充填階段的產品平均重量_實際值': 'fillw_actual',
                        '保壓壓力_實際值': 'holdp_actual',
                        '保壓時間_實際值': 'holdt_actual',
                        '保壓完的產品平均重量_實際值': 'packw_actual',
                        '冷卻時間_實際值': 'cool_actual',
                        '模具溫度設定-母模_實際值': 'tempa_actual',
                        '模具溫度設定-公模_實際值': 'tempb_actual',
                        '模具溫度設定-滑塊_實際值': 'temps_actual',
                    };
                    const inspKey = actualKeyMap[actual_k];
                    const inspData = state.inspectionData[partNo] || {};
                    row.getCell(5).value = (inspKey && inspData[inspKey]) ? inspData[inspKey] : "";
                    
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
                    
                    // Write inspection check data if available
                    const refKeyMap = {
                        '充填階段的模重_目標值': 'ref_fill_shot_check',
                        '保壓完的模重_目標值': 'ref_packed_shot_check',
                        '鎖模力_目標值': 'ref_clamp_check',
                        '週期時間_目標值': 'ref_cycle_check',
                    };
                    const refInspKey = refKeyMap[key];
                    const refInspData = state.inspectionData[partNo] || {};
                    row.getCell(5).value = (refInspKey && refInspData[refInspKey]) ? refInspData[refInspKey] : "";
                    row.getCell(5).font = value_font;
                    row.getCell(5).alignment = center_align;
                    
                    for (let c = 1; c <= 5; c++) {
                        row.getCell(c).border = thin_border;
                    }
                    curr_row++;
                });
                
                curr_row++; // Spacing row

                // ─── 現場生產查檢紀錄 SECTION (Sign-off block) ───
                worksheet.mergeCells(curr_row, 1, curr_row, 5);
                const check_sec = worksheet.getCell(curr_row, 1);
                check_sec.value = "  現場生產查檢紀錄 (On-site Inspection Record)";
                check_sec.font = section_font;
                check_sec.fill = HEADER_FILL;
                check_sec.alignment = left_align;
                curr_row++;

                // Row 1: Actual Press No. & Date
                const check_row1 = worksheet.getRow(curr_row);
                check_row1.getCell(1).value = "實際機台編號 Actual Press No.";
                check_row1.getCell(1).font = label_font;
                check_row1.getCell(1).fill = ACCENT_FILL;
                check_row1.getCell(1).alignment = left_align;
                check_row1.getCell(1).border = thin_border;

                const signData = state.inspectionData[partNo] || {};
                check_row1.getCell(2).value = signData['sign_press_no'] || "";
                check_row1.getCell(2).border = thin_border;

                check_row1.getCell(3).value = "查檢日期 Inspection Date";
                check_row1.getCell(3).font = label_font;
                check_row1.getCell(3).fill = ACCENT_FILL;
                check_row1.getCell(3).alignment = left_align;
                check_row1.getCell(3).border = thin_border;

                worksheet.mergeCells(curr_row, 4, curr_row, 5);
                check_row1.getCell(4).value = signData['sign_date'] || "";
                check_row1.getCell(4).border = thin_border;
                check_row1.getCell(5).border = thin_border;
                curr_row++;

                // Row 2: Time & Inspector Signature
                const check_row2 = worksheet.getRow(curr_row);
                check_row2.getCell(1).value = "查檢時間 Inspection Time";
                check_row2.getCell(1).font = label_font;
                check_row2.getCell(1).fill = ACCENT_FILL;
                check_row2.getCell(1).alignment = left_align;
                check_row2.getCell(1).border = thin_border;

                check_row2.getCell(2).value = signData['sign_time'] || "";
                check_row2.getCell(2).border = thin_border;

                check_row2.getCell(3).value = "查檢員簽名 Inspector Signature";
                check_row2.getCell(3).font = label_font;
                check_row2.getCell(3).fill = ACCENT_FILL;
                check_row2.getCell(3).alignment = left_align;
                check_row2.getCell(3).border = thin_border;

                worksheet.mergeCells(curr_row, 4, curr_row, 5);
                check_row2.getCell(4).value = signData['sign_inspector'] || "";
                check_row2.getCell(4).border = thin_border;
                check_row2.getCell(5).border = thin_border;
                curr_row++;

                curr_row++; // Spacing row
                
                // Footer
                worksheet.mergeCells(curr_row, 1, curr_row, 5);
                const footer_cell = worksheet.getCell(curr_row, 1);
                footer_cell.value = "Wesley Chang @ Mouldex, 2026. QC Dept. | PPOV 射出成型數據查檢表";
                footer_cell.font = { name: 'Microsoft JhengHei', size: 8, italic: true, color: { argb: 'FF64748B' } };
                footer_cell.alignment = { horizontal: 'right', vertical: 'middle' };
                
                // Set optimized print-safe column widths (Total: 102, perfectly scaled to A4 width)
                worksheet.getColumn(1).width = 38;
                worksheet.getColumn(2).width = 16;
                worksheet.getColumn(3).width = 16;
                worksheet.getColumn(4).width = 16;
                worksheet.getColumn(5).width = 16;
                
                // Set Row Heights dynamically only for active rows with content to utilize vertical space
                worksheet.getRow(1).height = 52;
                for (let r = 2; r <= curr_row; r++) {
                    worksheet.getRow(r).height = 28;
                }
                
                // Use the public ExcelJS page setup API; browser builds can leave
                // internal worksheet metadata unavailable during workbook creation.
                worksheet.pageSetup = {
                    paperSize: 9, // A4 Paper Size
                    orientation: 'portrait',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 1,
                    printArea: `A1:E${curr_row}`, // Explicit print area to prevent blank page prints
                    margins: {
                        left: 0.31, right: 0.31,
                        top: 0.31, bottom: 0.31,
                        header: 0.0, footer: 0.0
                    },
                    horizontalCentered: true,
                    verticalCentered: true
                };
                
                // Write workbook to the path selected by the user.
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                await saveBlobWithPathPrompt(blob, `PPOV_Spec_${partNo}.xlsx`, "excel");
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
                body: JSON.stringify({ part_no: partNo, inspection_data: state.inspectionData[partNo] || {} })
            });
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
                await saveBlobWithPathPrompt(blob, `PPOV_Spec_${partNo}.xlsx`, "excel");
            } else {
                alert("品號規格單導出失敗");
            }
        } catch (e) {
            console.error("Single export error:", e);
        }
    });

    // --- NEW DATABASE & DASHBOARD CRUD CONTROLS (V1.5.0 Upgrade) ---

    // 1. Statistics dynamic update
    function updateStatistics() {
        if (!txtStatsTotalParts) return;
        
        const totalParts = state.items.length;
        txtStatsTotalParts.textContent = totalParts;
        
        const pdfFiles = new Set();
        state.items.forEach(item => {
            const fileName = item["檔案名稱"] || "";
            if (fileName && !fileName.startsWith("MANUAL_")) {
                pdfFiles.add(fileName);
            }
        });
        txtStatsTotalFiles.textContent = pdfFiles.size;
        
        const presses = new Set();
        state.items.forEach(item => {
            const pressNo = (item["射出成型機編號"] || "").trim().toUpperCase();
            if (pressNo && pressNo !== "N/A" && pressNo !== "未知" && pressNo !== "-") {
                presses.add(pressNo);
            }
        });
        txtStatsTotalPresses.textContent = presses.size;
        
        if (!state.lastSyncTime) {
            const now = new Date();
            state.lastSyncTime = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        }
        txtStatsLastSync.textContent = state.lastSyncTime;
        
        badgeCount.textContent = totalParts;
        
        const masterCardActions = document.querySelector(".master-table-card .card-actions");
        if (masterCardActions) {
            masterCardActions.style.display = "flex"; // Always show action bar for 'Add Part'
            
            const btnClearDatabase = document.getElementById("btnClearDatabase");
            const btnExportExcel = document.getElementById("btnExportExcel");
            const btnExportJson = document.getElementById("btnExportJson");
            
            if (totalParts > 0) {
                if (btnClearDatabase) btnClearDatabase.style.display = "inline-flex";
                if (btnExportExcel) btnExportExcel.style.display = "inline-flex";
                if (btnExportJson) btnExportJson.style.display = "inline-flex";
                inputSearch.disabled = false;
            } else {
                if (btnClearDatabase) btnClearDatabase.style.display = "none";
                if (btnExportExcel) btnExportExcel.style.display = "none";
                if (btnExportJson) btnExportJson.style.display = "none";
                inputSearch.disabled = true;
            }
        }
    }

    // 2. Open Edit/Add Modal
    function openEditModal(item = null) {
        if (!partEditModal) return;
        formPartEdit.reset();
        
        if (item) {
            lblModalTitle.textContent = `編輯品號規格數據 - ${item["產品型號"]}`;
            const partNoField = document.getElementById("edit_part_no");
            partNoField.value = item["產品型號"];
            partNoField.disabled = true;
            
            const inputs = formPartEdit.querySelectorAll("input, select");
            inputs.forEach(input => {
                const name = input.getAttribute("name");
                if (name && name !== "產品型號") {
                    const val = item[name];
                    input.value = (val !== undefined && val !== null) ? val : "";
                }
            });
        } else {
            lblModalTitle.textContent = "手動新增品號規格數據";
            const partNoField = document.getElementById("edit_part_no");
            partNoField.value = "";
            partNoField.disabled = false;
            
            const inputs = formPartEdit.querySelectorAll("input");
            inputs.forEach(input => {
                if (input.id !== "edit_part_no") {
                    input.value = "";
                }
            });
            const selUnit = formPartEdit.querySelector("select");
            if (selUnit) selUnit.value = "kg/cm²";
        }
        
        partEditModal.classList.add("active");
        
        setTimeout(() => {
            const editPartNo = document.getElementById("edit_part_no");
            if (editPartNo && !editPartNo.disabled) {
                editPartNo.focus();
            } else {
                const editPartName = document.getElementById("edit_part_name");
                if (editPartName) editPartName.focus();
            }
        }, 100);
    }

    // 3. Save part data edit
    async function savePartEdit() {
        const editPartNoField = document.getElementById("edit_part_no");
        const partNo = editPartNoField.value.trim();
        if (!partNo) {
            alert("請填寫產品型號 (品號)！");
            return;
        }
        
        const record = {};
        const inputs = formPartEdit.querySelectorAll("input, select");
        inputs.forEach(input => {
            const name = input.getAttribute("name");
            if (name) {
                record[name] = input.value.trim();
            }
        });
        record["產品型號"] = partNo;
        
        const isEdit = editPartNoField.disabled;
        
        if (isStaticMode) {
            if (isEdit) {
                const idx = state.items.findIndex(item => item["產品型號"] === partNo);
                if (idx !== -1) {
                    const oldItem = state.items[idx];
                    state.items[idx] = { ...oldItem, ...record };
                }
            } else {
                if (state.items.some(item => item["產品型號"] === partNo)) {
                    alert(`品號 ${partNo} 已存在於資料庫中！`);
                    return;
                }
                record["檔案名稱"] = `MANUAL_${partNo}.pdf`;
                state.items.push(record);
            }
            
            partEditModal.classList.remove("active");
            renderMasterTable(state.items);
            
            if (state.selectedItem && state.selectedItem["產品型號"] === partNo) {
                state.selectedItem = state.items.find(item => item["產品型號"] === partNo);
                renderSpecSheet(state.selectedItem);
            }
            alert(isEdit ? "品號規格修改成功！" : "品號規格新增成功！");
            return;
        }
        
        try {
            btnSavePartEdit.disabled = true;
            btnSavePartEdit.textContent = "儲存中...";
            
            const endpoint = isEdit ? "/api/db/edit" : "/api/db/add";
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(record)
            });
            const result = await response.json();
            
            if (result.success) {
                state.items = result.data;
                partEditModal.classList.remove("active");
                renderMasterTable(state.items);
                
                if (state.selectedItem && state.selectedItem["產品型號"] === partNo) {
                    state.selectedItem = state.items.find(item => item["產品型號"] === partNo);
                    renderSpecSheet(state.selectedItem);
                }
                alert(result.message || "儲存成功！");
            } else {
                alert(result.message || "儲存失敗！");
            }
        } catch (error) {
            console.error("Save edit error:", error);
            alert("伺服器通訊錯誤");
        } finally {
            btnSavePartEdit.disabled = false;
            btnSavePartEdit.textContent = "儲存變更";
        }
    }

    // 4. Delete part record
    async function deletePartRecord(partNo) {
        if (!partNo) return;
        const confirmDelete = confirm(`⚠️ 確定要刪除品號 ${partNo} 嗎？\n\n此動作將從資料庫中永久移除該筆規格數據！`);
        if (!confirmDelete) return;
        
        if (isStaticMode) {
            state.items = state.items.filter(item => item["產品型號"] !== partNo);
            renderMasterTable(state.items);
            if (state.selectedItem && state.selectedItem["產品型號"] === partNo) {
                state.selectedItem = null;
                blankPartState.style.display = "flex";
                partSpecCard.style.display = "none";
            }
            alert(`品號 ${partNo} 已在本地刪除！`);
            return;
        }
        
        try {
            const response = await fetch("/api/db/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ part_no: partNo })
            });
            const result = await response.json();
            if (result.success) {
                state.items = result.data;
                renderMasterTable(state.items);
                if (state.selectedItem && state.selectedItem["產品型號"] === partNo) {
                    state.selectedItem = null;
                    blankPartState.style.display = "flex";
                    partSpecCard.style.display = "none";
                }
                alert(result.message || "刪除成功！");
            } else {
                alert(result.message || "刪除失敗！");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("刪除要求傳送失敗");
        }
    }

    // 5. Clear Database
    async function clearDatabase() {
        const confirmClear = confirm(`⚠️ 警告：這將會徹底清空資料庫內的所有 PPOV 規格數據！\n\n此操作無法還原，確定要執行嗎？`);
        if (!confirmClear) return;
        
        if (isStaticMode) {
            state.items = [];
            renderMasterTable(state.items);
            state.selectedItem = null;
            blankPartState.style.display = "flex";
            partSpecCard.style.display = "none";
            alert("本地規格資料庫已完全清空！");
            return;
        }
        
        try {
            const response = await fetch("/api/db/clear", { method: "POST" });
            const result = await response.json();
            if (result.success) {
                state.items = [];
                renderMasterTable(state.items);
                state.selectedItem = null;
                blankPartState.style.display = "flex";
                partSpecCard.style.display = "none";
                alert(result.message || "資料庫清空成功！");
            } else {
                alert(result.message || "清空失敗！");
            }
        } catch (error) {
            console.error("Clear database error:", error);
            alert("清空要求傳送失敗");
        }
    }

    // 6. Bind Modal & File Input Event Listeners
    if (btnAddNewPart) {
        btnAddNewPart.addEventListener("click", async () => {
            if (isStaticMode) {
                alert("💡 提示：從單一 PDF 解析規格需要 Python 後端伺服器運行。\n\n在 GitHub 靜態展示頁面中，請使用上方『載入現有總表』直接選擇總表 Excel 載入數據！");
                return;
            }
            
            btnAddNewPart.disabled = true;
            const originalHtml = btnAddNewPart.innerHTML;
            btnAddNewPart.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在選擇...`;

            try {
                const response = await fetch("/api/db/import_pdf_native", {
                    method: "POST"
                });
                const result = await response.json();

                if (result.success) {
                    state.items = result.data;
                    renderMasterTable(state.items);
                    
                    // 自動搜尋並選取剛導入的品號，以實現即時渲染預覽
                    const newPartNo = result.last_part_no;
                    if (newPartNo) {
                        const foundItem = state.items.find(x => x["產品型號"] === newPartNo);
                        if (foundItem) {
                            state.selectedItem = foundItem;
                            renderSpecSheet(foundItem);
                            
                            // 高亮表格中的選中列
                            setTimeout(() => {
                                document.querySelectorAll("#tableMaster tbody tr").forEach(row => {
                                    if (row.getAttribute("data-part-no") === newPartNo) {
                                        row.classList.add("selected");
                                        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
                                    } else {
                                        row.classList.remove("selected");
                                    }
                                });
                            }, 100);
                        }
                    }
                    alert(result.message);
                } else {
                    if (result.message && result.message !== "未選擇任何 PDF 檔案") {
                        alert(result.message || "PDF 導入失敗！");
                    }
                }
            } catch (err) {
                console.error("Single PDF import error:", err);
                alert("伺服器連線異常，導入失敗！");
            } finally {
                btnAddNewPart.disabled = false;
                btnAddNewPart.innerHTML = originalHtml;
            }
        });
    }
    
    if (btnClearDatabase) {
        btnClearDatabase.addEventListener("click", clearDatabase);
    }
    
    if (btnCloseEditModal) {
        btnCloseEditModal.addEventListener("click", () => partEditModal.classList.remove("active"));
    }
    
    if (btnCancelEditModal) {
        btnCancelEditModal.addEventListener("click", () => partEditModal.classList.remove("active"));
    }
    
    if (btnSavePartEdit) {
        btnSavePartEdit.addEventListener("click", savePartEdit);
    }
    
    if (partEditModal) {
        partEditModal.addEventListener("click", (e) => {
            if (e.target === partEditModal) {
                partEditModal.classList.remove("active");
            }
        });
        
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && partEditModal.classList.contains("active")) {
                partEditModal.classList.remove("active");
            }
        });
    }

    // 7. Modal Form Enter Key Navigation
    const setupModalFormNavigation = () => {
        if (!formPartEdit) return;
        const inputs = formPartEdit.querySelectorAll("input, select");
        inputs.forEach((input, idx) => {
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    const next = inputs[idx + 1];
                    if (next) {
                        next.focus();
                    } else {
                        savePartEdit();
                    }
                }
            });
        });
    };
    setupModalFormNavigation();

    // 8. Initial Database Fetch (Flask Mode only)
    async function initFetchDatabase() {
        if (isStaticMode) {
            updateStatistics();
            return;
        }
        try {
            const response = await fetch("/api/db");
            const result = await response.json();
            if (result.success && result.count > 0) {
                state.items = result.data;
                renderMasterTable(state.items);
                txtCurrentFolder.textContent = `資料庫已連線，共收錄 ${result.count} 筆規格數據`;
            } else {
                updateStatistics();
            }
        } catch (err) {
            console.warn("DB init fetch failed:", err);
            updateStatistics();
        }
    }
    
    // --- Phase D: Authentication and RBAC Logic ---
    async function checkAuthStatus() {
        if (isStaticMode) {
            // 靜態模式：預設為 Operator 訪客身分，顯示管理員登入按鈕
            state.user = {
                role: "operator",
                display_name: "現場查檢員"
            };
            applyRoleMask("operator");
            loginOverlay.classList.remove("active");
            userProfile.style.display = "none";
            if (btnLoginPrompt) btnLoginPrompt.style.display = "inline-flex";
            
            initFetchDatabase();
            return;
        }
        
        try {
            const response = await fetch("/api/auth/status");
            const result = await response.json();
            if (result.success && result.logged_in) {
                state.user = result.user;
                applyRoleMask(state.user.role);
                loginOverlay.classList.remove("active");
                userProfile.style.display = "flex";
                txtUserDisplayName.textContent = state.user.display_name;
                txtUserRole.textContent = "Admin";
                txtUserRole.className = "user-role-badge admin";
                if (btnLoginPrompt) btnLoginPrompt.style.display = "none";
                
                initFetchDatabase();
            } else {
                // 預設登入為現場 Operator (免登入存取)
                state.user = {
                    role: "operator",
                    display_name: "現場查檢員"
                };
                applyRoleMask("operator");
                loginOverlay.classList.remove("active");
                userProfile.style.display = "none";
                if (btnLoginPrompt) btnLoginPrompt.style.display = "inline-flex";
                
                initFetchDatabase();
            }
        } catch (error) {
            console.error("Auth status check failed:", error);
            // 發生異常時以安全 Operator 唯讀權限開啟
            state.user = {
                role: "operator",
                display_name: "現場查檢員"
            };
            applyRoleMask("operator");
            loginOverlay.classList.remove("active");
            userProfile.style.display = "none";
            if (btnLoginPrompt) btnLoginPrompt.style.display = "inline-flex";
            initFetchDatabase();
        }
    }

    function applyRoleMask(role) {
        if (role === "admin") {
            // 還原所有管理按鈕
            if (btnAddNewPart) btnAddNewPart.style.display = "inline-flex";
            if (btnClearDatabase) btnClearDatabase.style.display = "inline-flex";
            if (btnLoadMasterFile) btnLoadMasterFile.style.display = "inline-flex";
            if (btnSelectFolder) btnSelectFolder.style.display = "inline-flex";
            if (btnStartExtract) {
                btnStartExtract.style.display = "inline-flex";
                btnStartExtract.disabled = !state.folderPath;
            }
            
            const thActions = document.querySelector(".table-actions-header");
            if (thActions) thActions.style.display = "table-cell";
        } else {
            // 操作員：隱藏所有敏感管理按鈕與表格動作列
            if (btnAddNewPart) btnAddNewPart.style.display = "none";
            if (btnClearDatabase) btnClearDatabase.style.display = "none";
            if (btnLoadMasterFile) btnLoadMasterFile.style.display = "none";
            if (btnSelectFolder) btnSelectFolder.style.display = "none";
            if (btnStartExtract) btnStartExtract.style.display = "none";
            
            const thActions = document.querySelector(".table-actions-header");
            if (thActions) thActions.style.display = "none";
        }
    }

    function setupAuthEventListeners() {
        // 管理員登入點擊提示
        if (btnLoginPrompt) {
            btnLoginPrompt.addEventListener("click", () => {
                loginOverlay.classList.add("active");
                if (login_username) {
                    login_username.value = "";
                    login_username.focus();
                }
                if (login_password) login_password.value = "";
                loginErrorMsg.style.display = "none";
            });
        }

        // 登入彈窗關閉按鈕
        if (btnCloseLogin) {
            btnCloseLogin.addEventListener("click", () => {
                loginOverlay.classList.remove("active");
            });
        }

        if (formLogin) {
            formLogin.addEventListener("submit", async (e) => {
                e.preventDefault();
                const username = login_username.value.trim();
                const password = login_password.value;
                
                if (!username || !password) {
                    showLoginError("請輸入帳號與密碼");
                    return;
                }
                
                btnLoginSubmit.disabled = true;
                const originalHtml = btnLoginSubmit.innerHTML;
                btnLoginSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在驗證...`;
                
                try {
                    const response = await fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username, password })
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        state.user = result.user;
                        applyRoleMask(state.user.role);
                        
                        formLogin.reset();
                        loginErrorMsg.style.display = "none";
                        
                        loginOverlay.classList.remove("active");
                        userProfile.style.display = "flex";
                        txtUserDisplayName.textContent = state.user.display_name;
                        txtUserRole.textContent = "Admin";
                        txtUserRole.className = "user-role-badge admin";
                        if (btnLoginPrompt) btnLoginPrompt.style.display = "none";
                        
                        // 重新繪製彙總表以顯示 Admin 的動作編輯按鈕
                        renderMasterTable(state.items);
                    } else {
                        showLoginError(result.message || "登入失敗");
                    }
                } catch (error) {
                    console.error("Login request failed:", error);
                    showLoginError("伺服器連線失敗");
                } finally {
                    btnLoginSubmit.disabled = false;
                    btnLoginSubmit.innerHTML = originalHtml;
                }
            });
        }
        
        if (btnLogout) {
            btnLogout.addEventListener("click", async () => {
                if (isStaticMode) {
                    state.user = {
                        role: "operator",
                        display_name: "現場查檢員"
                    };
                    applyRoleMask("operator");
                    userProfile.style.display = "none";
                    if (btnLoginPrompt) btnLoginPrompt.style.display = "inline-flex";
                    loginOverlay.classList.remove("active");
                    
                    // 重新渲染 Master Table，完全隱藏管理列
                    renderMasterTable(state.items);
                    return;
                }
                
                try {
                    const response = await fetch("/api/auth/logout", { method: "POST" });
                    const result = await response.json();
                    if (result.success) {
                        state.user = {
                            role: "operator",
                            display_name: "現場查檢員"
                        };
                        applyRoleMask("operator");
                        userProfile.style.display = "none";
                        if (btnLoginPrompt) btnLoginPrompt.style.display = "inline-flex";
                        loginOverlay.classList.remove("active");
                        
                        // 重新渲染 Master Table，完全隱藏管理列
                        renderMasterTable(state.items);
                    }
                } catch (error) {
                    console.error("Logout request failed:", error);
                }
            });
        }
    }
    
    function showLoginError(msg) {
        loginErrorText.textContent = msg;
        loginErrorMsg.style.display = "flex";
        
        const card = document.querySelector(".login-card");
        if (card) {
            card.style.animation = "none";
            void card.offsetWidth;
            card.style.animation = "shake 0.4s ease-in-out";
        }
    }

    // ---- 修改密碼 Modal 功能 ----

    function openChangePasswordModal() {
        if (!changePasswordModal) return;
        formChangePassword.reset();
        cpErrorMsg.style.display = "none";
        cpSuccessMsg.style.display = "none";
        changePasswordModal.classList.add("active");
        if (cp_current) cp_current.focus();
    }

    function closeChangePasswordModal() {
        if (!changePasswordModal) return;
        changePasswordModal.classList.remove("active");
    }

    function showCpError(msg) {
        cpSuccessMsg.style.display = "none";
        cpErrorText.textContent = msg;
        cpErrorMsg.style.display = "flex";
        // 觸發 shake 動畫
        const card = changePasswordModal ? changePasswordModal.querySelector(".modal-content") : null;
        if (card) {
            card.style.animation = "none";
            void card.offsetWidth;
            card.style.animation = "shake 0.4s ease-in-out";
        }
    }

    function showCpSuccess(msg) {
        cpErrorMsg.style.display = "none";
        cpSuccessText.textContent = msg;
        cpSuccessMsg.style.display = "flex";
    }

    function setupChangePasswordListeners() {
        if (btnChangePassword) {
            btnChangePassword.addEventListener("click", openChangePasswordModal);
        }
        if (btnCloseChangePassword) {
            btnCloseChangePassword.addEventListener("click", closeChangePasswordModal);
        }
        if (btnCancelChangePassword) {
            btnCancelChangePassword.addEventListener("click", closeChangePasswordModal);
        }
        // 點擊遮罩背景關閉
        if (changePasswordModal) {
            changePasswordModal.addEventListener("click", (e) => {
                if (e.target === changePasswordModal) closeChangePasswordModal();
            });
        }

        if (formChangePassword) {
            formChangePassword.addEventListener("submit", async (e) => {
                e.preventDefault();
                const currentPw = cp_current.value;
                const newPw = cp_new.value;
                const confirmPw = cp_confirm.value;

                if (!currentPw || !newPw || !confirmPw) {
                    showCpError("請填寫所有欄位");
                    return;
                }
                if (newPw !== confirmPw) {
                    showCpError("新密碼與確認密碼不一致");
                    return;
                }
                if (newPw.length < 6) {
                    showCpError("新密碼長度至少需要 6 個字元");
                    return;
                }

                // 靜態模式：無法真正更改密碼
                if (isStaticMode) {
                    showCpError("靜態展示模式不支援密碼修改功能");
                    return;
                }

                const originalHtml = btnSubmitChangePassword.innerHTML;
                btnSubmitChangePassword.disabled = true;
                btnSubmitChangePassword.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 儲存中...`;

                try {
                    const response = await fetch("/api/auth/change_password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            current_password: currentPw,
                            new_password: newPw,
                            confirm_password: confirmPw
                        })
                    });
                    const result = await response.json();

                    if (result.success) {
                        showCpSuccess(result.message || "密碼已成功更新！");
                        formChangePassword.reset();
                        // 2 秒後自動關閉
                        setTimeout(closeChangePasswordModal, 2000);
                    } else {
                        showCpError(result.message || "儲存失敗，請重試");
                    }
                } catch (error) {
                    console.error("Change password request failed:", error);
                    showCpError("伺服器連線失敗，請重試");
                } finally {
                    btnSubmitChangePassword.disabled = false;
                    btnSubmitChangePassword.innerHTML = originalHtml;
                }
            });
        }
    }

    setupChangePasswordListeners();
    setupAuthEventListeners();
    checkAuthStatus();

});


