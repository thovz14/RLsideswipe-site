import re

with open('admin.js', 'r') as f:
    content = f.read()

# 1. Elements
content = content.replace("const addUpdateBtn = document.getElementById('add-update-btn');", 
    "const addUpdateBtn = document.getElementById('add-update-btn');\n    const newsListContainer = document.getElementById('news-list');\n    const addNewsBtn = document.getElementById('add-news-btn');\n    const tournamentsListContainer = document.getElementById('tournaments-list');\n    const addTournamentBtn = document.getElementById('add-tournament-btn');")

# 2. autoSave
autosave_updates = """        const updateInputs = document.querySelectorAll('.update-input-row:not(.new-update-form)');
        const updates = Array.from(updateInputs).map(row => ({
            date: row.querySelector('.update-date').value,
            title: row.querySelector('.update-title').value,
            description: row.querySelector('.update-description').value,
            hasButton: row.querySelector('.update-btn-toggle').checked,
            buttonText: row.querySelector('.update-btn-text').value,
            buttonLink: row.querySelector('.update-btn-link').value,
            buttonClass: row.querySelector('.update-btn-class').value
        }));"""
autosave_news_tournaments = """
        const newsInputs = document.querySelectorAll('.news-input-row:not(.new-news-form)');
        const news = Array.from(newsInputs).map(row => ({
            date: row.querySelector('.news-date').value,
            title: row.querySelector('.news-title').value,
            description: row.querySelector('.news-description').value,
            hasButton: row.querySelector('.news-btn-toggle').checked,
            buttonText: row.querySelector('.news-btn-text').value,
            buttonLink: row.querySelector('.news-btn-link').value,
            buttonClass: row.querySelector('.news-btn-class').value
        }));

        const tournamentsInputs = document.querySelectorAll('.tournament-input-row:not(.new-tournament-form)');
        const tournaments = Array.from(tournamentsInputs).map(row => ({
            date: row.querySelector('.tournament-date').value,
            title: row.querySelector('.tournament-title').value,
            description: row.querySelector('.tournament-description').value,
            hasButton: row.querySelector('.tournament-btn-toggle').checked,
            buttonText: row.querySelector('.tournament-btn-text').value,
            buttonLink: row.querySelector('.tournament-btn-link').value,
            buttonClass: row.querySelector('.tournament-btn-class').value
        }));
"""
content = content.replace(autosave_updates, autosave_updates + autosave_news_tournaments)

configdata_replace = """            updates: updates,
            socialMedia: socialMedia"""
configdata_new = """            updates: updates,
            news: news,
            tournaments: tournaments,
            socialMedia: socialMedia"""
content = content.replace(configdata_replace, configdata_new)

# 3. Default Config
default_updates = """        updates: [
            {
                date: 'PLANNING: COMING SOON IN 2026',
                title: 'Server opening',
                description: 'Today the server will open for everyone to play! Get ready for an amazing adventure.',
                hasButton: true,
                buttonText: 'SERVER START',
                buttonLink: 'index.html',
                buttonClass: 'btn-primary'
            }
        ]"""
default_news_tournaments = """,
        news: [],
        tournaments: []"""
content = content.replace(default_updates, default_updates + default_news_tournaments)

# 4. loadConfiguration
load_updates = """            updatesListContainer.innerHTML = '';
            const updatesList = (data.updates && Array.isArray(data.updates)) ? data.updates : defaultConfig.updates;
            updatesList.forEach(upd => {
                const hasBtn = upd.hasButton !== undefined ? upd.hasButton : (upd.buttonText ? true : false);
                createUpdateInput(upd.date, upd.title, upd.description, hasBtn, upd.buttonText, upd.buttonLink, upd.buttonClass);
            });"""
load_news_tournaments = """
            newsListContainer.innerHTML = '';
            const newsList = (data.news && Array.isArray(data.news)) ? data.news : defaultConfig.news;
            newsList.forEach(item => {
                const hasBtn = item.hasButton !== undefined ? item.hasButton : (item.buttonText ? true : false);
                createNewsInput(item.date, item.title, item.description, hasBtn, item.buttonText, item.buttonLink, item.buttonClass);
            });

            tournamentsListContainer.innerHTML = '';
            const tournamentsList = (data.tournaments && Array.isArray(data.tournaments)) ? data.tournaments : defaultConfig.tournaments;
            tournamentsList.forEach(item => {
                const hasBtn = item.hasButton !== undefined ? item.hasButton : (item.buttonText ? true : false);
                createTournamentInput(item.date, item.title, item.description, hasBtn, item.buttonText, item.buttonLink, item.buttonClass);
            });
"""
content = content.replace(load_updates, load_updates + load_news_tournaments)

# 5. Functions createNewsInput and createTournamentInput
# To do this safely, I will regex extract the `createUpdateInput` function and just replace "update" with "news" and "tournament"
match = re.search(r'(?s)(function createUpdateInput.*?updatesListContainer\.appendChild\(div\);\n    })', content)
if match:
    create_update_func = match.group(1)
    
    create_news_func = create_update_func.replace('Update', 'News').replace('update', 'news')
    create_tourn_func = create_update_func.replace('Update', 'Tournament').replace('update', 'tournament')
    
    # Also need to add the addBtn event listeners
    event_listeners = """
    addNewsBtn.addEventListener('click', () => {
        createNewsInput('', '', '', true, '', '', 'btn-primary', true);
    });

    addTournamentBtn.addEventListener('click', () => {
        createTournamentInput('', '', '', true, '', '', 'btn-primary', true);
    });
    """
    
    content = content.replace(create_update_func, create_update_func + '\n\n' + create_news_func + '\n\n' + create_tourn_func + '\n' + event_listeners)

with open('admin.js', 'w') as f:
    f.write(content)
print("admin.js patched successfully.")
