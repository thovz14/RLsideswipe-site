document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('news-container');

    try {
        // Use rss2json with a simple query — same approach that works for tournaments
        const feedUrl = 'https://www.reddit.com/r/RLSideswipe/search.rss?q=news+OR+update+OR+psyonix&restrict_sr=1&sort=new&t=' + Math.floor(Date.now() / 3600000);
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();

        newsContainer.innerHTML = '';

        if (data && data.status === 'ok' && data.items) {
            const posts = data.items;

            if (posts.length === 0) {
                newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent news found.</p>';
                return;
            }

            posts.forEach(item => {
                const card = document.createElement('div');
                card.className = 'update-card';

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
        } else {
            throw new Error(data.message || 'Invalid response format');
        }

    } catch (err) {
        console.error('Error fetching news:', err);
        newsContainer.innerHTML = `
            <div class="update-card" style="text-align: center;">
                <p>Failed to load news at this time. Please try again later.</p>
            </div>
        `;
    }
});
