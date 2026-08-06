 
import os

output_file = "FULL_PROJECT.txt"
extensions = ('.html', '.css', '.js', '.md')

print("⏳ Сборка файлов проекта...")

with open(output_file, 'w', encoding='utf-8') as outfile:
    for root, dirs, files in os.walk('.'):
        # Исключаем скрытые папки и node_modules
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ['node_modules', '.git']]

        for file in files:
            if file.endswith(extensions):
                filepath = os.path.join(root, file)
                outfile.write(f"\n\n{'='*70}\n")
                outfile.write(f"FILE: {filepath.replace(os.sep, '/')}\n")
                outfile.write(f"{'='*70}\n\n")

                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(infile.read())
                except Exception as e:
                    outfile.write(f"Ошибка чтения файла: {e}\n")

size_kb = os.path.getsize(output_file) / 1024
print(f"✅ Готово! Весь код сохранен в файл: {output_file}")
print(f"📦 Размер итогового файла: {size_kb:.2f} KB")
