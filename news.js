document.addEventListener('DOMContentLoaded', async () => {
    const newsContainer = document.getElementById('news-container');

    try {
        // Fetch directly from Reddit's JSON API (browser requests include proper User-Agent)
        const redditUrl = 'https://www.reddit.com/r/RLSideswipe/search.json?q=flair%3A%22News%22+OR+flair%3A%22Psyonix%22&restrict_sr=1&sort=new&limit=15';
        const response = await fetch(redditUrl, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Reddit API returned ${response.status}`);
        }

        const data = await response.json();

        newsContainer.innerHTML = '';

        const posts = data?.data?.children;

        if (!posts || posts.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No recent official news found.</p>';
            return;
        }

        posts.forEach(({ data: item }) => {
            const card = document.createElement('div');
            card.className = 'update-card';

            const dateObj = new Date(item.created_utc * 1000);
            const date = dateObj.toLocaleDateString('en-US', {
                day: 'numeric', month: 'long', year: 'numeric'
            });

            let thumbnail = '';
            if (
                item.thumbnail &&
                item.thumbnail.startsWith('http') &&
                !item.thumbnail.includes('default') &&
                !item.thumbnail.includes('self') &&
                !item.thumbnail.includes('nsfw')
            ) {
                thumbnail = `<img src="${item.thumbnail}" style="max-width: 100%; border-radius: 8px; margin-top: 15px; border: 1px solid var(--card-border);">`;
            }

            // Decode HTML entities in title
            const txt = document.createElement('textarea');
            txt.innerHTML = item.title;
            const decodedTitle = txt.value;

            const postUrl = `https://www.reddit.com${item.permalink}`;

            card.innerHTML = `
                <div class="update-meta">
                    <span class="update-date"><i class="fa-solid fa-newspaper" style="margin-right: 5px;"></i>${date} - Official News</span>
                </div>
                <div class="update-content">
                    <h2 style="font-size: 1.25rem;">${decodedTitle}</h2>
                    ${thumbnail}
                    <div style="margin-top: 15px;">
                        <a href="${postUrl}" target="_blank" class="btn btn-secondary btn-sm" style="font-size: 0.8rem; padding: 6px 12px;">Read Article</a>
                    </div>
                </div>
            `;
            newsContainer.appendChild(card);
        });

    } catch (err) {
        console.error('Error fetching live news:', err);
        newsContainer.innerHTML = `
            <div class="update-card" style="text-align: center;">
                <p>Failed to load news at this time. Please try again later.</p>
            </div>
        `;
    }
});
