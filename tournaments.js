document.addEventListener('DOMContentLoaded', async () => {
    const tournamentsContainer = document.getElementById('tournaments-container');
    
    try {
        // Fetching community tournaments from Reddit Esport/Tournament keywords
        const response = await fetch('https://www.reddit.com/r/RLSideswipe/search.json?q=tournament+OR+esports&restrict_sr=1&sort=new&limit=10');
        const data = await response.json();
        
        tournamentsContainer.innerHTML = '';
        
        if (data && data.data && data.data.children) {
            const posts = data.data.children;
            
            posts.forEach(post => {
                const item = post.data;
                const card = document.createElement('div');
                card.className = 'update-card';
                
                const date = new Date(item.created_utc * 1000).toLocaleDateString('nl-NL', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                
                let thumbnail = '';
                if (item.thumbnail && item.thumbnail !== 'self' && item.thumbnail !== 'default' && item.thumbnail !== 'nsfw' && item.thumbnail !== 'spoiler') {
                    thumbnail = `<img src="${item.thumbnail}" style="max-width: 100%; border-radius: 8px; margin-top: 15px; border: 1px solid var(--card-border);">`;
                }

                const txt = document.createElement('textarea');
                txt.innerHTML = item.title;
                const decodedTitle = txt.value;

                card.innerHTML = `
                    <div class="update-meta">
                        <span class="update-date"><i class="fa-solid fa-trophy" style="margin-right: 5px;"></i>${date} - Community Tournament</span>
                    </div>
                    <div class="update-content">
                        <h2 style="font-size: 1.25rem;">${decodedTitle}</h2>
                        ${thumbnail}
                        <div style="margin-top: 15px;">
                            <a href="https://reddit.com${item.permalink}" target="_blank" class="btn btn-primary btn-sm" style="font-size: 0.8rem; padding: 6px 12px;">Bekijk Toernooi</a>
                        </div>
                    </div>
                `;
                tournamentsContainer.appendChild(card);
            });
            
            if (posts.length === 0) {
                tournamentsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Geen recente toernooien gevonden.</p>';
            }
        } else {
            throw new Error("Invalid response format");
        }
    } catch (err) {
        console.error('Error fetching tournaments:', err);
        tournamentsContainer.innerHTML = `
            <div class="update-card" style="text-align: center;">
                <p>Toernooien konden momenteel niet worden geladen. Probeer het later opnieuw.</p>
            </div>
        `;
    }
});
