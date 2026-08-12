import { db } from './firebase-config.js';
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const configRef = doc(db, 'config', 'website');
    const tournamentsContainer = document.querySelector('.update-cards');

    onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            if (data.tournaments && data.tournaments.length > 0) {
                tournamentsContainer.innerHTML = ''; // Clear current
                data.tournaments.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'update-card';
                    
                    let btnHtml = '';
                    if (item.hasButton && item.buttonText) {
                        btnHtml = `<a href="${item.buttonLink}" target="_blank" class="btn ${item.buttonClass}">${item.buttonText}</a>`;
                    }

                    card.innerHTML = `
                        <div class="update-meta">
                            <span class="update-date">${item.date}</span>
                        </div>
                        <div class="update-content">
                            <h2>${item.title}</h2>
                            <p>${item.description}</p>
                            ${btnHtml}
                        </div>
                    `;
                    tournamentsContainer.appendChild(card);
                });
            } else {
                tournamentsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">Geen toernooien gepland op dit moment.</p>';
            }
        }
    });
});
