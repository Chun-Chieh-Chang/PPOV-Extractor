document.addEventListener("DOMContentLoaded", () => {
    // State management
    const state = {
        folderPath: "",
        items: [],
        selectedItem: null,
    };

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

    // 使用者選好檔案後，自動上傳到後端解析
    inputMasterFile.addEventListener("change", async () => {
        const file = inputMasterFile.files[0];
        if (!file) return;

        btnLoadMasterFile.disabled = true;
        btnLoadMasterFile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 載入中...`;

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

    // --- GITHUB SYNC LOGIC ---
    const gitBadgeStatus = document.getElementById("gitBadgeStatus");
    const txtGitRemote = document.getElementById("txtGitRemote");
    const txtGitStatus = document.getElementById("txtGitStatus");
    const inputCommitMsg = document.getElementById("inputCommitMsg");
    const btnGitPush = document.getElementById("btnGitPush");
    const gitLogDetails = document.getElementById("gitLogDetails");

    async function updateGitStatus() {
        try {
            const res = await fetch("/api/git_status");
            const data = await res.json();
            if (data.success) {
                txtGitRemote.textContent = data.remote;
                txtGitStatus.textContent = `${data.branch} (${data.change_count} 個變更)`;
                
                if (data.has_changes) {
                    gitBadgeStatus.className = "badge badge-warning";
                    gitBadgeStatus.textContent = "待同步";
                } else {
                    gitBadgeStatus.className = "badge badge-success";
                    gitBadgeStatus.textContent = "已同步";
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

