import os
import sys
import glob

def bridge_sync(raw_path="raw"):
    """
    Knowledge Bridge Helper Script
    Automatically detects the latest Markdown file in raw/ 
    and prepares it for AI ingestion.
    """
    md_files = glob.glob(os.path.join(raw_path, "*.md"))
    if not md_files:
        print(f"Error: No Markdown files found in {raw_path}")
        return

    latest_file = max(md_files, key=os.path.getmtime)
    print(f"Detected latest knowledge source: {latest_file}")
    
    # In a real workflow, this script could also perform 
    # basic linting or encoding fixes (e.g., from Big5 to UTF-8)
    
    print(f"Ready for Sync. Please tell Gemini CLI: '啟動知識橋樑，同步 {latest_file}'")

if __name__ == "__main__":
    bridge_sync()
