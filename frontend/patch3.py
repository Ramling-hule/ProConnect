import sys

filepath = 'src/app/u/[username]/page.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if ')}' in line and i == 86:
        continue # skip line 87
    new_lines.append(line)
    if '      </div>' in line and i == 116: # line 117
        new_lines.append('      </div>\n')

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
