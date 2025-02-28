import re
import os

def determine_variant(class_string):
    # Determine button variant based on class string
    if 'bg-indigo-600' in class_string or 'bg-blue-600' in class_string:
        return 'primary'
    elif 'bg-red-600' in class_string:
        return 'danger'
    elif 'bg-white' in class_string or 'bg-gray-300' in class_string:
        return 'default'
    else:
        return 'primary'

def update_button_in_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Import Button if not already imported
    if 'import Button from' not in content:
        content = "import Button from '../components/Button';\n" + content
    
    # Replace button classes with Button component
    button_pattern = r'className="(.*?px-4 py-2.*?)"'
    def replace_button(match):
        class_string = match.group(1)
        variant = determine_variant(class_string)
        return f'variant="{variant}"'
    
    updated_content = re.sub(button_pattern, replace_button, content)
    
    with open(file_path, 'w') as f:
        f.write(updated_content)

def main():
    # Directories to search for .tsx files
    search_dirs = [
        'src/pages',
        'src/components'
    ]
    
    for search_dir in search_dirs:
        for root, _, files in os.walk(search_dir):
            for file in files:
                if file.endswith('.tsx'):
                    file_path = os.path.join(root, file)
                    update_button_in_file(file_path)

if __name__ == '__main__':
    main()
