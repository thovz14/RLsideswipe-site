import re

with open('admin.js', 'r') as f:
    content = f.read()

# 1. Elements
content = re.sub(r'    const newsListContainer = document\.getElementById\(\'news-list\'\);\n    const addNewsBtn = document\.getElementById\(\'add-news-btn\'\);\n    const tournamentsListContainer = document\.getElementById\(\'tournaments-list\'\);\n    const addTournamentBtn = document\.getElementById\(\'add-tournament-btn\'\);', '', content)

# 2. autoSave
content = re.sub(r'\s*const newsInputs = document\.querySelectorAll.*?\}\)\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*const tournamentsInputs = document\.querySelectorAll.*?\}\)\);\n', '', content, flags=re.DOTALL)
content = content.replace("            news: news,\n            tournaments: tournaments,\n", "")

# 3. Default Config
content = content.replace(",\n        news: [],\n        tournaments: []", "")

# 4. loadConfiguration
content = re.sub(r'\s*newsListContainer\.innerHTML = \'\';.*?\}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'\s*tournamentsListContainer\.innerHTML = \'\';.*?\}\);\n', '', content, flags=re.DOTALL)

# 5. Functions and Event Listeners
# Let's find the start of createNewsInput
idx = content.find("function createNewsInput")
if idx != -1:
    content = content[:idx]

with open('admin.js', 'w') as f:
    f.write(content)
