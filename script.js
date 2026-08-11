import { db } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentServerIP = 'Roblox Hamburg RP'; // Default

    // Firestore Live Listener
    const configRef = doc(db, 'config', 'website');
    onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            updateWebsiteContent(data);
        } else {
            console.log("No config found in Firestore, using defaults.");
        }
    });

    function updateWebsiteContent(data) {
        // Update Server IP Widget
        if (data.serverIP) {
            currentServerIP = data.serverIP;
            const ipWidget = document.querySelector('.widget[data-type="ip"]');
            if (ipWidget) {
                ipWidget.setAttribute('data-copy', data.serverIP);
            }
        }

        // Update Discord Widget
        if (data.discordLink) {
            const discordWidget = document.querySelector('.widget[data-type="discord"]');
            if (discordWidget) {
                discordWidget.setAttribute('data-copy', data.discordLink);
                updateDiscordCount(data.discordLink);
            }
        }

        const ownersContainer = document.getElementById('staff-container');
        if (ownersContainer && data.staff) {
            ownersContainer.innerHTML = ''; // Clear current
            
            const renderStaff = () => {
                data.staff.forEach(staff => {
                    const card = document.createElement('div');
                    card.className = 'owner-card';
                    // Render with a placeholder first
                    card.innerHTML = `
                        <div class="avatar-wrapper">
                            <img src="https://tr.rbxcdn.com/38c6edcb50633730fa4afbc5c7011b71/150/150/AvatarHeadshot/Png" alt="${staff.name}" class="owner-avatar" id="avatar-${staff.name.replace(/\s+/g, '-')}-${Math.random().toString(36).substring(7)}">
                        </div>
                        <div class="owner-info">
                            <h3>${staff.name}</h3>
                            <div style="display: flex; gap: 5px; justify-content: center; flex-wrap: wrap;">
                                ${staff.badges ? staff.badges.map(b => `<span class="badge ${b.rankClass}">${b.rank}</span>`).join('') : `<span class="badge ${staff.rankClass}">${staff.rank}</span>`}
                            </div>
                        </div>
                    `;
                    
                    ownersContainer.appendChild(card);
                    
                    if (staff.userid) {
                        // Pass the exact image element id
                        const imgId = card.querySelector('.owner-avatar').id;
                        fetchAvatar(staff.userid, imgId);
                    }
                });
            };

            // Render twice for seamless marquee
            renderStaff();
            renderStaff();
        }

        // Update "Updates" nav link gold glow
        const updatesLinks = document.querySelectorAll('.nav-link[href="updates.html"]');
        let showBadge = data.hasNewUpdates;
        if (showBadge && data.updatesBadgeExpiresAt && Date.now() > data.updatesBadgeExpiresAt) {
            showBadge = false;
        }

        updatesLinks.forEach(link => {
            if (showBadge) {
                link.classList.add('has-updates');
            } else {
                link.classList.remove('has-updates');
            }
        });

        // Render updates on updates.html
        const updatesContainer = document.getElementById('updates-container');
        if (updatesContainer && data.updates) {
            updatesContainer.innerHTML = '';
            data.updates.forEach(update => {
                const showButton = update.hasButton !== undefined ? update.hasButton : !!update.buttonText;
                const card = document.createElement('div');
                card.className = 'update-card';
                card.innerHTML = `
                    <div class="update-meta">
                        <span class="update-date">${update.date}</span>
                    </div>
                    <div class="update-content">
                        <h2>${update.title}</h2>
                        <p>${update.description}</p>
                        ${(showButton && update.buttonText) ? `<a href="${update.buttonLink}" class="btn ${update.buttonClass}">${update.buttonText}</a>` : ''}
                    </div>
                `;
                updatesContainer.appendChild(card);
            });
        }
    }

    async function fetchAvatar(userId, imgId) {
        try {
            const avatarResponse = await fetch(`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
            const avatarData = await avatarResponse.json();
            
            if (avatarData && avatarData.data && avatarData.data.length > 0) {
                const avatarUrl = avatarData.data[0].imageUrl;
                const imgEl = document.getElementById(imgId);
                if (imgEl && avatarUrl) {
                    imgEl.src = avatarUrl;
                }
            }
        } catch (error) {
            console.error('Error fetching Roblox avatar for', imgId, error);
        }
    }

    // Copy Widget Logic
    const copyables = document.querySelectorAll('.copyable');
    copyables.forEach(widget => {
        widget.addEventListener('click', async () => {
            const textToCopy = widget.getAttribute('data-copy');
            const tooltip = widget.querySelector('.tooltip');
            try {
                await navigator.clipboard.writeText(textToCopy);
                tooltip.classList.add('show');
                widget.style.transform = 'scale(0.97)';
                setTimeout(() => widget.style.transform = '', 150);
                setTimeout(() => tooltip.classList.remove('show'), 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        });
    });

    async function updateDiscordCount(inviteUrl) {
        try {
            // Extract invite code from URL (e.g. https://discord.gg/mQt4J5Brug)
            const match = inviteUrl.match(/discord\.gg\/([a-zA-Z0-9-]+)/);
            if (!match) return;
            const inviteCode = match[1];

            const response = await fetch(`https://discord.com/api/v9/invites/${inviteCode}?with_counts=true`);
            const data = await response.json();

            if (data && data.approximate_member_count !== undefined) {
                const countEl = document.getElementById('discord-count');
                if (countEl) {
                    countEl.textContent = `${data.approximate_member_count} members in the discord`;
                }
            }
        } catch (error) {
            console.error('Error fetching Discord count:', error);
            const countEl = document.getElementById('discord-count');
            if (countEl) {
                countEl.textContent = 'Join our community!';
            }
        }
    }
});
