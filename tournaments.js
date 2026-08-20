// ─── Discord Webhook ──────────────────────────────────────────────────────────
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1540107203615260733/y28DbDlKsJiHDZmWzbddh7MN4qTWBYncHOWNCcSdRtMJCik2sxTbihuQ6cP6DNrQVgi1';

// ─── Tournament Feed (static fallback — Reddit API no longer allows unauthenticated access) ─────
document.addEventListener('DOMContentLoaded', () => {
    const tournamentsContainer = document.getElementById('tournaments-container');
    tournamentsContainer.innerHTML = `
        <div class="update-card" style="text-align: center; padding: 3rem 2rem;">
            <i class="fa-solid fa-trophy" style="font-size: 2.5rem; color: var(--accent-gold); margin-bottom: 1rem; display: block;"></i>
            <h2 style="font-size: 1.3rem; margin-bottom: 0.75rem;">No tournaments scheduled right now</h2>
            <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.6;">
                Custom tournaments are announced in our Discord server.<br>
                Join to stay up to date and register below when one goes live!
            </p>
            <a href="social-media.html" class="btn btn-primary" style="font-size: 0.9rem;">
                <i class="fa-brands fa-discord" style="margin-right: 8px;"></i>Join our Discord
            </a>
        </div>
    `;
});

// ─── Modal & Form Logic ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const overlay      = document.getElementById('tournament-modal');
    const openBtn      = document.getElementById('open-tournament-modal');
    const closeBtn     = document.getElementById('close-tournament-modal');
    const closeSuccess = document.getElementById('close-success-modal');
    const form         = document.getElementById('tournament-form');
    const errorBox     = document.getElementById('form-error');
    const steps        = Array.from(document.querySelectorAll('.form-step'));
    const teammateGroup = document.getElementById('teammate-group');

    let currentStep = 1;

    // ── Open / Close ──────────────────────────────────────────────────────────
    function openModal() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        showStep(1);
        form.reset();
        teammateGroup.style.display = 'none';
        hideError();
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    closeSuccess?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
    });

    // ── Step navigation ───────────────────────────────────────────────────────
    function showStep(n) {
        currentStep = n;
        steps.forEach(s => s.classList.remove('active'));
        const target = steps.find(s => s.dataset.step === String(n));
        if (target) target.classList.add('active');
        // Scroll modal to top whenever step changes
        overlay.querySelector('.modal-box')?.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.querySelectorAll('.step-next').forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                hideError();
                showStep(currentStep + 1);
            }
        });
    });

    document.querySelectorAll('.step-prev').forEach(btn => {
        btn.addEventListener('click', () => { hideError(); showStep(currentStep - 1); });
    });

    // ── Conditional teammate field ────────────────────────────────────────────
    document.querySelectorAll('input[name="t-mode"]').forEach(radio => {
        radio.addEventListener('change', () => {
            const is2v2 = radio.value === '2v2' && radio.checked;
            teammateGroup.style.display = is2v2 ? 'flex' : 'none';
        });
    });

    // ── Validation ────────────────────────────────────────────────────────────
    function validateStep(step) {
        if (step === 1) {
            const discord   = document.getElementById('t-discord').value.trim();
            const username  = document.getElementById('t-username').value.trim();
            const playerid  = document.getElementById('t-playerid').value.trim();
            if (!discord)   return showError('Please enter your Discord username.');
            if (!username)  return showError('Please enter your Rocket League Sideswipe username.');
            if (!playerid)  return showError('Please enter your Sideswipe Player ID.');
            return true;
        }
        if (step === 2) {
            const region = document.querySelector('input[name="t-region"]:checked');
            const rank   = document.getElementById('t-rank').value;
            if (!region) return showError('Please select your region.');
            if (!rank)   return showError('Please select your rank.');
            return true;
        }
        if (step === 3) {
            const mode    = document.querySelector('input[name="t-mode"]:checked');
            const contact = document.getElementById('t-contact').value.trim();
            const rules   = document.querySelector('input[name="t-rules"]:checked');
            if (!mode)    return showError('Please select a game mode.');
            if (!contact) return showError('Please enter a contact method.');
            if (!rules)   return showError('Please answer the rules agreement question.');
            if (rules.value === 'no') return showError('You must agree to the tournament rules to register.');
            return true;
        }
        return true;
    }

    function showError(msg) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return false;
    }

    function hideError() {
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }

    // ── Submit → Discord Webhook ──────────────────────────────────────────────
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateStep(3)) return;

        const submitBtn = document.getElementById('submit-tournament');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 6px;"></i>Sending…';
        hideError();

        const discord   = document.getElementById('t-discord').value.trim();
        const username  = document.getElementById('t-username').value.trim();
        const playerid  = document.getElementById('t-playerid').value.trim();
        const region    = document.querySelector('input[name="t-region"]:checked').value;
        const rank      = document.getElementById('t-rank').value;
        const mode      = document.querySelector('input[name="t-mode"]:checked').value;
        const teammate  = document.getElementById('t-teammate').value.trim() || 'N/A';
        const contact   = document.getElementById('t-contact').value.trim();
        const timestamp = new Date().toISOString();

        const payload = {
            username: 'Tournament Registration',
            avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
            embeds: [{
                title: '🏆 New Custom Tournament Entry',
                color: 0xE67E22,
                fields: [
                    { name: '👤 Discord Username',          value: discord,   inline: true  },
                    { name: '🎮 RL Sideswipe Username',     value: username,  inline: true  },
                    { name: '🪪 Sideswipe Player ID',       value: playerid,  inline: false },
                    { name: '🌍 Region',                    value: region,    inline: true  },
                    { name: '🏅 Rank',                      value: rank,      inline: true  },
                    { name: '🎮 Game Mode',                 value: mode,      inline: true  },
                    { name: '👥 Teammate',                  value: teammate,  inline: false },
                    { name: '📩 Contact',                   value: contact,   inline: false },
                    { name: '✅ Rules Agreement',           value: 'Agreed',  inline: false },
                ],
                footer: { text: 'RLSideswipe Website — Tournament Registration' },
                timestamp,
            }]
        };

        try {
            const res = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

            showStep('success');
        } catch (err) {
            console.error('Webhook error:', err);
            showError('Something went wrong sending your entry. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right: 6px;"></i>Submit Entry';
        }
    });
});
