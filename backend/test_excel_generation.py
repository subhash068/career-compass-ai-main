"""
Test Excel generation directly
"""
import pandas as pd
import io

def test_excel_generation():
    print("Testing Excel generation...")
    
    template_data = {
        'question_text': ['What is the capital of France?'],
        'options': ['Paris, London, Berlin, Madrid'],
        'correct_answer': ['Paris'],
        'difficulty': ['easy'],
        'explanation': ['Paris is the capital of France.'],
        'skill_id': [1]
    }
    
    df = pd.DataFrame(template_data)
    print(f"DataFrame created: {df.shape}")
    
    output = io.BytesIO()
    
    try:
        # Try xlsxwriter first
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, index=False, sheet_name='Questions')
            workbook = writer.book
            worksheet = writer.sheets['Questions']
            worksheet.set_column('A:A', 50)
            worksheet.set_column('B:B', 40)
            worksheet.set_column('C:C', 20)
            worksheet.set_column('D:D', 15)
            worksheet.set_column('E:E', 50)
            worksheet.set_column('F:F', 10)
        print("✓ xlsxwriter engine works!")
    except Exception as e:
        print(f"✗ xlsxwriter failed: {e}")
        try:
            # Fallback to openpyxl
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Questions')
            print("✓ openpyxl engine works!")
        except Exception as e2:
            print(f"✗ openpyxl also failed: {e2}")
            return False
    
    output.seek(0)
    content = output.read()
    print(f"✓ Excel file generated: {len(content)} bytes")
    
    # Verify it's a valid Excel file
    if content[:4] == b'PK\x03\x04':
        print("✓ Valid Excel file format (ZIP/XLSX)")
        return True
    else:
        print(f"✗ Invalid file format. First bytes: {content[:20]}")
        return False

if __name__ == "__main__":
    import sys
    success = test_excel_generation()
    sys.exit(0 if success else 1)
