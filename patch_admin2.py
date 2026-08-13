with open('admin.js', 'r') as f:
    content = f.read()

# Remove elements
content = content.replace("    const newsListContainer = document.getElementById('news-list');\n    const addNewsBtn = document.getElementById('add-news-btn');\n    const tournamentsListContainer = document.getElementById('tournaments-list');\n    const addTournamentBtn = document.getElementById('add-tournament-btn');", "")

# Remove autoSave news and tournaments
import re
content = re.sub(r'        const newsInputs = document\.querySelectorAll.*?\}\)\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'        const tournamentsInputs = document\.querySelectorAll.*?\}\)\);\n', '', content, flags=re.DOTALL)

# Remove news and tournaments from configData
content = content.replace("            news: news,\n            tournaments: tournaments,\n", "")

# Remove defaults
content = content.replace(",\n        news: [],\n        tournaments: []", "")

# Remove from loadConfiguration
content = re.sub(r'            newsListContainer\.innerHTML = \'\';.*?\}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'            tournamentsListContainer\.innerHTML = \'\';.*?\}\);\n', '', content, flags=re.DOTALL)

# Remove createNewsInput and createTournamentInput and event listeners
# Since they are at the end of the file right after createUpdateInput, let's just find "function createNewsInput" and remove to the end of the event listeners
# Actually, the simplest way is to regex out the functions.
content = re.sub(r'    function createNewsInput.*?\}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'    function createTournamentInput.*?\}\n\n', '', content, flags=re.DOTALL)
content = re.sub(r'    addNewsBtn\.addEventListener.*?\}\);\n', '', content, flags=re.DOTALL)
content = re.sub(r'    addTournamentBtn\.addEventListener.*?\}\);\n', '', content, flags=re.DOTALL)

with open('admin.js', 'w') as f:
    f.write(content)
