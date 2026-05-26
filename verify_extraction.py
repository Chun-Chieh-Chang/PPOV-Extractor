import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass
import json
from main import extract_data_from_pdf

def test_single_pdf():
    pdf_path = "TestData/PPOV_MI03001(B)_A02-210-251_Rev.B_2025-06-11.pdf"
    config_path = "config.json"
    
    if not os.path.exists(pdf_path):
        print(f"Error: {pdf_path} not found")
        return False
        
    with open(config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
        
    print(f"Extracting from: {pdf_path}")
    data = extract_data_from_pdf(pdf_path, config)
    
    if data:
        print("\nExtracted Parameters:")
        print("-" * 50)
        for k, v in data.items():
            print(f"{k}: {v}")
        print("-" * 50)
        
        # Verify specific fields
        expected = {
            "充填階段的模重_目標值": "5.08",
            "保壓完的模重_目標值": "5.60",
            "鎖模力_目標值": "40",
            "烘料條件": "N/A",
            "模具溫度設定-母模_目標值": "N/A",
            "模具溫度設定-母模_實際值": "N/A",
            "模具溫度設定-公模_目標值": "N/A",
            "模具溫度設定-公模_實際值": "N/A",
            "模具溫度設定-滑塊_目標值": "N/A",
            "模具溫度設定-滑塊_實際值": "N/A"
        }
        
        passed = True
        for field, exp_val in expected.items():
            act_val = data.get(field)
            if act_val != exp_val:
                print(f"❌ FAIL: {field} expected {exp_val}, got {act_val}")
                passed = False
            else:
                print(f"✅ PASS: {field} = {act_val}")
                
        if passed:
            print("\n🎉 ALL TESTS PASSED!")
            return True
        else:
            print("\n❌ SOME TESTS FAILED!")
            return False
    else:
        print("Error extracting data")
        return False

if __name__ == "__main__":
    success = test_single_pdf()
    sys.exit(0 if success else 1)
