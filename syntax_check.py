import ast
import tokenize
import io
from pathlib import Path

def check_syntax(file_path):
    # Read file content
    with open(file_path, 'r') as f:
        content = f.read()
    
    print(f"Checking syntax for: {file_path}")
    
    # Try to parse using AST
    try:
        ast.parse(content)
        print("AST Parse: PASSED")
    except SyntaxError as e:
        line_no = e.lineno
        print(f"AST Parse: FAILED at line {line_no}")
        print(f"Error message: {e}")
        
        # Show the problematic line and context
        with open(file_path, 'r') as f:
            lines = f.readlines()
            start = max(0, line_no - 3)
            end = min(len(lines), line_no + 2)
            print("\nContext:")
            for i in range(start, end):
                prefix = ">>>" if i+1 == line_no else "   "
                print(f"{prefix} {i+1}: {lines[i].rstrip()}")
    
    # Check for indentation issues with tokenize
    try:
        with open(file_path, 'rb') as f:
            tokens = list(tokenize.tokenize(f.readline))
        print("Tokenize: PASSED")
    except tokenize.TokenError as e:
        print(f"Tokenize: FAILED - {e}")
    
    # Check for mixed indentation
    indentation_types = set()
    with open(file_path, 'r') as f:
        for i, line in enumerate(f, 1):
            if line.startswith(' '):
                indentation_types.add('space')
            elif line.startswith('\t'):
                indentation_types.add('tab')
    
    if len(indentation_types) > 1:
        print("WARNING: Mixed indentation detected (tabs and spaces)")
    else:
        print("Indentation check: PASSED (consistent indentation)")

if __name__ == "__main__":
    check_syntax("/Users/JackEllis/THE WAY /modal_scripts/train_model.py") 