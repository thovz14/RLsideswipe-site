document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('news-container');
    
    try {
        // Fetching official news from Reddit via RSS to JSON converter
        const feedUrl = 'https://www.reddit.com/r/RLSideswipe/search.rss?q=flair%3A%22News%22+OR+flair%3A%22Psyonix%22&restrict_sr=1&sort=new';
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();
        
        newsContainer.innerHTML = '';
        
        if (data && data.status === 'ok' && data.items) {
            const posts = data.items;
            
            posts.forEach(item => {
                const card = document.createElement('div');
                card.className = 'update-card';
                
                // parse date (rss2json gives 'pubDate' like '2021-03-24 10:20:00')
                const dateObj = new Date(item.pubDate);
                const date = dateObj.toLocaleDateString('en-US', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });
                
                let thumbnail = '';
                if (item.thumbnail && !item.thumbnail.includes('default') && !item.thumbnail.includes('self')) {
                    thumbnail = `<img src="${item.thumbnail}" style="max-width: 100%; border-radius: 8px; margin-top: 15px; border: 1px solid var(--card-border);">`;
                }

                const txt = document.createElement('textarea');
                txt.innerHTML = item.title;
                const decodedTitle = txt.value;

                card.innerHTML = `
                    <div class="update-meta">
                        <span class="update-date"><i class="fa-solid fa-newspaper" style="margin-right: 5px;"></i>${date} - Official News</span>
                    </div>
                    <div class="update-content">
                        <h2 style="font-size: 1.25rem;">${decodedTitle}</h2>
                        ${thumbnail}
                        <div style="margin-top: 15px;">
                            <a href="${item.link}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 6px 12px;">Read Article</a>
                        </div>
                    </div>
                `;
                newsContainer.appendChild(card);
            });
            
            if (posts.length === 0) {
                newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent official news found.</p>';
            }
        } else {
            throw new Error("Invalid response format");
        }
    } catch (err) {
        console.error('Error fetching live news:', err);
        newsContainer.innerHTML = `
            <div class="update-card" style="text-align: center;">
                <p>Failed to load news at this time. Please try again later.</p>
            </div>
        `;
    }
});
