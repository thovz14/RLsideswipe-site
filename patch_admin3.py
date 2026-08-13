import re
with open('admin.js', 'r') as f:
    content = f.read()

content = re.sub(r'\s*const newsListContainer.*?;\n', '\n', content)
content = re.sub(r'\s*const addNewsBtn.*?;\n', '\n', content)
content = re.sub(r'\s*const tournamentsListContainer.*?;\n', '\n', content)
content = re.sub(r'\s*const addTournamentBtn.*?;\n', '\n', content)

content = re.sub(r'\s*const newsInputs = document\.querySelectorAll.*?\}\)\);\n', '\n', content, flags=re.DOTALL)
content = re.sub(r'\s*const tournamentsInputs = document\.querySelectorAll.*?\}\)\);\n', '\n', content, flags=re.DOTALL)

with open('admin.js', 'w') as f:
    f.write(content)
