; PPOV Extractor Inno Setup Script
; Version: 1.8.2

[Setup]
AppId={{D8F9A4B0-C2E3-4B5D-8E1F-A8B9C0D1E2F3}
AppName=PPOV Extractor
AppVersion=1.9.3
AppPublisher=Chun-Chieh Chang
VersionInfoCompany=Chun-Chieh Chang
VersionInfoDescription=PPOV Extractor Professional Installer
VersionInfoVersion=1.8.2.0
VersionInfoCopyright=Copyright (C) 2026 Chun-Chieh Chang
DefaultDirName={autopf}\PPOV Extractor
DefaultGroupName=PPOV Extractor
AllowNoIcons=yes
LicenseFile=BUILD_README.md
OutputBaseFilename=PPOV-Extractor-Setup-v1.9.3
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "chinesetraditional"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "dist\PPOV-Extractor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "config.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "System_Admin_Manual.html"; DestDir: "{app}"; Flags: ignoreversion

; Persistent data files in user's APPDATA
Source: "users.json"; DestDir: "{userappdata}\PPOV-Extractor"; Flags: onlyifdoesntexist uninsneveruninstall
Source: "ppov_database.json"; DestDir: "{userappdata}\PPOV-Extractor"; Flags: onlyifdoesntexist uninsneveruninstall

[Icons]
Name: "{group}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"
Name: "{group}\系統管理員手冊"; Filename: "{app}\System_Admin_Manual.html"
Name: "{group}\{cm:UninstallProgram,PPOV Extractor}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PPOV-Extractor.exe"; Description: "{cm:LaunchProgram,PPOV Extractor}"; Flags: nowait postinstall skipifsilent

