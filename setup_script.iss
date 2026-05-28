; PPOV Extractor Inno Setup Script
; Version: 1.8.2

[Setup]
AppId={{D8F9A4B0-C2E3-4B5D-8E1F-A8B9C0D1E2F3}
AppName=PPOV Extractor
AppVersion=1.8.2
AppPublisher=Chun-Chieh Chang
DefaultDirName={autopf}\PPOV Extractor
DefaultGroupName=PPOV Extractor
AllowNoIcons=yes
LicenseFile=BUILD_README.md
; 輸出安裝包名稱
OutputBaseFilename=PPOV-Extractor-Setup-v1.8.2
Compression=lzma
SolidCompression=yes
WizardStyle=modern
; 設置安裝圖示 (如果有 .ico 檔案)
; SetupIconFile=static\favicon.ico 

[Languages]
Name: "chinesetraditional"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; 主程式與資源
Source: "dist\PPOV-Extractor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "config.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "System_Admin_Manual.html"; DestDir: "{app}"; Flags: ignoreversion

; 資料檔案 (如果不存在則建立，升級時不覆蓋以保留使用者密碼與數據)
Source: "users.json"; DestDir: "{app}"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "ppov_database.json"; DestDir: "{app}"; Flags: onlyifdoesntexist uninsneveruninstall

[Icons]
Name: "{group}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"
Name: "{group}\系統管理員手冊"; Filename: "{app}\System_Admin_Manual.html"
Name: "{group}\{cm:UninstallProgram,PPOV Extractor}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PPOV-Extractor.exe"; Description: "{cm:LaunchProgram,PPOV Extractor}"; Flags: nowait postinstall skipifsilent

