; PPOV Extractor - Inno Setup Script
; Version: 1.9.4

[Setup]
AppName=PPOV Extractor
AppVersion=1.9.4
DefaultDirName={autopf}\PPOV Extractor
DefaultGroupName=PPOV Extractor
OutputDir=C:\Users\USER\Downloads\PPOV-Extractor\output
OutputBaseFilename=PPOV-Extractor-Setup-v1.9.4
Compression=lzma
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "C:\Users\USER\Downloads\PPOV-Extractor\dist\PPOV-Extractor.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\USER\Downloads\PPOV-Extractor\docs\System_Admin_Manual.html"; DestDir: "{app}\docs"; Flags: ignoreversion
Source: "C:\Users\USER\Downloads\PPOV-Extractor\docs\Password_Management.html"; DestDir: "{app}\docs"; Flags: ignoreversion

[Icons]
Name: "{group}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"
Name: "{autodesktop}\PPOV Extractor"; Filename: "{app}\PPOV-Extractor.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\PPOV-Extractor.exe"; Description: "{cm:LaunchProgram,PPOV Extractor}"; Flags: nowait postinstall skipifsilent
