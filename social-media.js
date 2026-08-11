import { db } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {

    let videos = [];

    const grid = document.getElementById('video-grid');
    const emptyState = document.getElementById('empty-state');
    const detailModal = document.getElementById('detail-modal');
    const detailModalClose = document.getElementById('detail-modal-close');
    
    const discordModal = document.getElementById('discord-modal');
    const discordBtn = document.getElementById('discord-widget-btn');
    const discordClose = document.getElementById('discord-modal-close');

    // Setup Firestore listener
    const configRef = doc(db, 'config', 'website');
    onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            videos = data.socialMedia || [];
            
            // Add internal IDs for modal linking
            videos = videos.map((v, i) => ({ ...v, _id: i }));
            
            // Updates nav badge logic
            let showBadge = data.hasNewUpdates;
            if (showBadge && data.updatesBadgeExpiresAt) {
                if (Date.now() > data.updatesBadgeExpiresAt) {
                    showBadge = false;
                }
            }
            
            const updateLink = document.querySelector('nav a[href="updates.html"]');
            if (updateLink) {
                if (showBadge) {
                    updateLink.classList.add('has-updates');
                } else {
                    updateLink.classList.remove('has-updates');
                }
            }

            const discordJoinLink = document.getElementById('discord-direct-join');
            if (discordJoinLink && data.discordLink) {
                discordJoinLink.href = data.discordLink;
            }

            renderGrid();
        } else {
            console.log("No config document found!");
            videos = [];
            renderGrid();
        }
    });

    function renderGrid() {
        grid.innerHTML = '';

        if (videos.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        videos.forEach((video, index) => {
            const card = document.createElement('div');
            card.className = 'video-card';
            card.style.animationDelay = `${index * 0.08}s`;
            card.dataset.id = video._id;

            // Append first to keep order
            grid.appendChild(card);

            const renderCard = (thumb) => {
                if (!card.parentNode) return;

                const thumbHTML = thumb
                    ? `<img class="video-card-thumb" src="${escapeHTML(thumb)}" alt="${escapeHTML(video.title)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                       <div class="video-card-no-img" style="display:none;">${video.platform === 'youtube' ? '<i class="fa-brands fa-youtube"></i>' : '<i class="fa-brands fa-tiktok"></i>'}</div>`
                    : `<div class="video-card-no-img">${video.platform === 'youtube' ? '<i class="fa-brands fa-youtube"></i>' : '<i class="fa-brands fa-tiktok"></i>'}</div>`;

                card.innerHTML = `
                    ${thumbHTML}
                    <div class="video-card-overlay">
                        <div class="video-card-title">${escapeHTML(video.title)}</div>
                        <div class="video-card-platform ${video.platform}">
                            ${video.platform === 'tiktok' ? '<i class="fa-brands fa-tiktok" style="margin-right:4px;"></i> TikTok' : '<i class="fa-brands fa-youtube" style="margin-right:4px;"></i> YouTube'}
                        </div>
                    </div>
                `;
                
                // Set click event directly to avoid multiple listeners
                card.onclick = () => openDetail(video._id, thumb);
            };

            let thumbUrl = video.thumbnail;
            if (thumbUrl) {
                renderCard(thumbUrl);
            } else {
                if (video.platform === 'youtube') {
                    const match = video.link.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/);
                    if (match && match[2].length === 11) {
                        thumbUrl = `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg`;
                    }
                    renderCard(thumbUrl);
                } else if (video.platform === 'tiktok') {
                    renderCard(''); // Placeholder initially
                    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(video.link)}`;
                    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(oembedUrl)}`)
                        .then(res => res.json())
                        .then(data => {
                            if (data.contents) {
                                const parsed = JSON.parse(data.contents);
                                if (parsed.thumbnail_url) renderCard(parsed.thumbnail_url);
                            }
                        })
                        .catch(e => console.error("Could not fetch TikTok thumbnail", e));
                } else {
                    renderCard('');
                }
            }
        });
    }

    // Modal Logic
    function openModal(modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    detailModalClose.addEventListener('click', () => closeModal(detailModal));

    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModal(detailModal);
    });

    if (discordBtn) {
        discordBtn.addEventListener('click', () => openModal(discordModal));
    }
    
    if (discordClose) {
        discordClose.addEventListener('click', () => closeModal(discordModal));
    }
    
    discordModal.addEventListener('click', (e) => {
        if (e.target === discordModal) closeModal(discordModal);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(detailModal);
            closeModal(discordModal);
        }
    });

    function openDetail(id, resolvedThumb) {
        const video = videos.find(v => v._id === id);
        if (!video) return;

        const thumbToUse = resolvedThumb || video.thumbnail;

        document.getElementById('detail-title').textContent = video.title;
        document.getElementById('detail-img').src = thumbToUse || '';
        document.getElementById('detail-img').alt = video.title;

        const thumbContainer = document.getElementById('detail-thumbnail');
        thumbContainer.style.display = thumbToUse ? 'flex' : 'none';

        const badge = document.getElementById('detail-platform');
        badge.innerHTML = video.platform === 'tiktok' ? '<i class="fa-brands fa-tiktok" style="margin-right:4px;"></i> TikTok' : '<i class="fa-brands fa-youtube" style="margin-right:4px;"></i> YouTube';
        badge.className = 'detail-badge ' + video.platform;

        const linkEl = document.getElementById('detail-link');
        linkEl.href = video.link;
        linkEl.textContent = 'Watch video →';

        openModal(detailModal);
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});
