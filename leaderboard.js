import { db } from './firebase-config.js';
import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

const PLACEMENT_POINTS = { 1: 100, 2: 75, 3: 50, 4: 25, 5: 15, 6: 10, 7: 5, 8: 5 };

function placementPoints(p) {
    return PLACEMENT_POINTS[p] ?? 2;
}

function computePoints(player) {
    const placements = player.placements || [];
    return placements.reduce((sum, p) => sum + placementPoints(p), 0);
}

function getInitial(name) {
    return (name || '?')[0].toUpperCase();
}

function renderPodium(sorted) {
    const container = document.getElementById('podium-container');
    if (!container) return;

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No players yet.</p>';
        return;
    }

    // Podium order: 2nd, 1st, 3rd
    const slots = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
    const orders = sorted.length >= 2 ? [2, 1, 3] : [1];
    const crowns = ['🥈', '🥇', '🥉'];

    container.innerHTML = '';

    // Build in display order: 2nd left, 1st centre, 3rd right
    const displayOrder = sorted.length === 1
        ? [sorted[0]]
        : sorted.length === 2
            ? [sorted[1], sorted[0]]
            : [sorted[1], sorted[0], sorted[2]];

    const crownMap = { 0: '🥇', 1: '🥈', 2: '🥉' };

    displayOrder.forEach((player, idx) => {
        const rank = sorted.indexOf(player) + 1;
        const pts = computePoints(player);
        const slot = document.createElement('div');
        slot.className = 'podium-slot';
        slot.innerHTML = `
            <div class="podium-avatar">
                ${rank === 1 ? '<span class="podium-crown">👑</span>' : ''}
                ${getInitial(player.discordUsername)}
            </div>
            <div class="podium-name"><i class="fa-brands fa-discord lb-disc-icon"></i> ${player.discordUsername}</div>
            <div class="podium-pts">${pts} pts</div>
            <div class="podium-block">${crownMap[rank - 1] || rank}</div>
        `;
        container.appendChild(slot);
    });
}

function renderTable(sorted) {
    const wrap = document.getElementById('lb-table-wrap');
    if (!wrap) return;

    if (sorted.length === 0) {
        wrap.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">No players yet.</p>';
        return;
    }

    const rankIcon = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
    const rankClass = (r) => r <= 3 ? `lb-rank lb-rank-${r}` : 'lb-rank';

    const rows = sorted.map((p, i) => {
        const pts = computePoints(p);
        const rank = i + 1;
        return `
            <tr>
                <td class="${rankClass(rank)}">${rankIcon(rank)}</td>
                <td class="lb-username"><i class="fa-brands fa-discord lb-disc-icon"></i>${p.discordUsername}</td>
                <td class="lb-pts">${pts}</td>
                <td class="lb-stat">${p.matchesPlayed ?? 0}</td>
                <td class="lb-stat">${p.wins ?? 0}</td>
                <td class="lb-stat">${p.losses ?? 0}</td>
                <td class="lb-stat">${p.goalsScored ?? 0}</td>
                <td class="lb-stat">${p.goalsConceded ?? 0}</td>
                <td class="lb-stat">${(p.placements || []).join(', ') || '—'}</td>
            </tr>
        `;
    }).join('');

    wrap.innerHTML = `
        <table class="lb-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Played</th>
                    <th>Wins</th>
                    <th>Losses</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>Placements</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// Live listener
const lbRef = doc(db, 'config', 'website');
onSnapshot(lbRef, (snap) => {
    const data = snap.exists() ? snap.data() : {};
    const players = data.leaderboardPlayers || [];
    const sorted = [...players].sort((a, b) => computePoints(b) - computePoints(a));
    renderPodium(sorted);
    renderTable(sorted);
}, (err) => {
    console.warn('Leaderboard read error:', err.message);
    const wrap = document.getElementById('lb-table-wrap');
    if (wrap) wrap.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:2rem;">Could not load leaderboard.</p>';
});
