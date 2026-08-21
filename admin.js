import { auth, db, storage } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');

    const configIp = document.getElementById('config-ip');
    const configDiscord = document.getElementById('config-discord');
    const configWebhook = document.getElementById('config-webhook');
    const staffListContainer = document.getElementById('staff-list');
    const addStaffBtn = document.getElementById('add-staff-btn');
    const socialMediaListContainer = document.getElementById('social-media-list');
    const addSocialBtn = document.getElementById('add-social-btn');
    const updatesListContainer = document.getElementById('updates-list');
    const addUpdateBtn = document.getElementById('add-update-btn');
    const saveStatus = document.getElementById('save-status');
    const configUpdatesBadge = document.getElementById('config-updates-badge');
    const configUpdatesDuration = document.getElementById('config-updates-duration');

    let saveTimeout = null;
    let isLoading = false;
    let currentBadgeExpiration = null;

    // Gold glow on Updates nav link (works on admin page too)
    const configRef = doc(db, 'config', 'website');
    onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            let showBadge = data.hasNewUpdates;
            if (showBadge && data.updatesBadgeExpiresAt && Date.now() > data.updatesBadgeExpiresAt) {
                showBadge = false;
            }
            const updatesLinks = document.querySelectorAll('.nav-link[href="updates.html"]');
            updatesLinks.forEach(link => {
                if (showBadge) {
                    link.classList.add('has-updates');
                } else {
                    link.classList.remove('has-updates');
                }
            });
        }
    });

    // Authentication State
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadConfiguration();
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    });

    // Login Logic
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;
        loginError.textContent = '';

        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Login error:', error.code, error.message);
            if (error.code === 'auth/invalid-email') {
                loginError.textContent = 'Voer een geldig e-mailadres in.';
            } else if (error.code === 'auth/wrong-password') {
                loginError.textContent = 'Onjuiste gebruikersnaam of wachtwoord.';
            } else if (error.code === 'auth/user-not-found') {
                loginError.textContent = 'Geen account gevonden met dit e-mailadres.';
            } else if (error.code === 'auth/too-many-requests') {
                loginError.textContent = 'Teveel pogingen. Probeer het later opnieuw.';
            } else if (error.code === 'auth/network-request-failed') {
                loginError.textContent = 'Verbindingsprobleem. Controleer je internetverbinding.';
            } else {
                loginError.textContent = `Fout: ${error.message}`;
            }
        }
    });

    // Logout Logic
    logoutBtn.addEventListener('click', () => {
        signOut(auth);
    });

    // Auto-save with debounce
    function scheduleAutoSave() {
        if (isLoading) return;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = 'var(--text-muted)';
        saveTimeout = setTimeout(() => autoSave(), 800);
    }

    async function autoSave() {
        const staffInputs = document.querySelectorAll('.staff-input-row');
        const staff = Array.from(staffInputs).map(row => {
            const badgeRows = row.querySelectorAll('.badge-input-row');
            const badges = Array.from(badgeRows).map(bRow => ({
                rank: bRow.querySelector('.staff-rank').value,
                rankClass: bRow.querySelector('.staff-class').value
            }));

            return {
                name: row.querySelector('.staff-name').value,
                avatar: row.querySelector('.staff-avatar').value,
                badges: badges,
                playtime: '0',
                kills: '0',
                deaths: '0'
            };
        });

        const updateInputs = document.querySelectorAll('.update-input-row:not(.new-update-form)');
        const updates = Array.from(updateInputs).map(row => ({
            date: row.querySelector('.update-date').value,
            title: row.querySelector('.update-title').value,
            description: row.querySelector('.update-description').value,
            hasButton: row.querySelector('.update-btn-toggle').checked,
            buttonText: row.querySelector('.update-btn-text').value,
            buttonLink: row.querySelector('.update-btn-link').value,
            buttonClass: row.querySelector('.update-btn-class').value
        }));


        const socialInputs = document.querySelectorAll('.social-input-row');
        const socialMedia = Array.from(socialInputs).map(row => ({
            title: row.querySelector('.social-title').value,
            platform: row.querySelector('.social-platform').value,
            link: row.querySelector('.social-link').value,
            thumbnail: row.querySelector('.social-thumbnail').value
        }));

        let expiresAt = null;
        if (configUpdatesBadge.checked) {
            if (currentBadgeExpiration && Date.now() < currentBadgeExpiration) {
                expiresAt = currentBadgeExpiration;
            } else {
                const hours = parseInt(configUpdatesDuration.value) || 24;
                expiresAt = Date.now() + (hours * 60 * 60 * 1000);
                currentBadgeExpiration = expiresAt;
            }
        } else {
            currentBadgeExpiration = null;
        }

        const configData = {
            serverIP: configIp ? configIp.value : '',
            discordLink: configDiscord ? configDiscord.value : '',
            webhookUrl: configWebhook ? configWebhook.value : '',
            hasNewUpdates: configUpdatesBadge ? configUpdatesBadge.checked : false,
            updatesBadgeExpiresAt: expiresAt,
            staff: staff,
            updates: updates,
            socialMedia: socialMedia
        };

        try {
            await setDoc(doc(db, 'config', 'website'), configData, { merge: true });
            saveStatus.textContent = 'Saved ✓';
            saveStatus.style.color = 'var(--accent-green)';
            setTimeout(() => saveStatus.textContent = '', 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            saveStatus.textContent = 'Error saving.';
            saveStatus.style.color = '#e74c3c';
        }
    }

    // Listen for changes on IP, Discord, Webhook and toggle
    if (configIp) configIp.addEventListener('input', scheduleAutoSave);
    if (configDiscord) configDiscord.addEventListener('input', scheduleAutoSave);
    if (configWebhook) configWebhook.addEventListener('input', scheduleAutoSave);
    
    configUpdatesDuration.addEventListener('change', () => {
        const hours = parseInt(configUpdatesDuration.value) || 24;
        currentBadgeExpiration = Date.now() + (hours * 60 * 60 * 1000);
        scheduleAutoSave();
    });

    configUpdatesBadge.addEventListener('change', () => {
        configUpdatesDuration.style.display = configUpdatesBadge.checked ? 'block' : 'none';
        if (configUpdatesBadge.checked) {
            const hours = parseInt(configUpdatesDuration.value) || 24;
            currentBadgeExpiration = Date.now() + (hours * 60 * 60 * 1000);
        } else {
            currentBadgeExpiration = null;
        }
        updateUpdatesNavState(configUpdatesBadge.checked);
        scheduleAutoSave();
    });

    function updateUpdatesNavState(isActive) {
        const updatesLinks = document.querySelectorAll('.nav-link[href="updates.html"]');
        updatesLinks.forEach(link => {
            if (isActive) {
                link.classList.add('has-updates');
            } else {
                link.classList.remove('has-updates');
            }
        });
    }

    let draggedStaff = null;

    // Staff member creation
    function createStaffInput(name = '', avatar = '', badges = [{rank: 'OWNER', rankClass: 'owner-badge'}]) {
        const div = document.createElement('div');
        div.className = 'staff-input-row';
        div.draggable = false;
        div.style.flexDirection = 'column';
        div.style.border = '1px solid var(--card-border)';
        div.style.padding = '15px';
        div.style.marginBottom = '15px';
        div.style.borderRadius = '8px';
        div.style.backgroundColor = 'var(--card-bg)';
        div.style.transition = 'opacity 0.2s';
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; width: 100%;">
                <div class="drag-handle" style="color: var(--text-muted); padding: 5px; cursor: grab;"><i class="fa-solid fa-grip-vertical"></i> Sleep om te verplaatsen</div>
                <button type="button" class="btn btn-secondary remove-staff-btn" style="padding: 5px 10px; font-size: 0.8rem; flex: unset;"><i class="fa-solid fa-trash"></i> Verwijder Staf</button>
            </div>
            <div style="display: flex; gap: 15px; margin-bottom: 15px; width: 100%;">
                <!-- Avatar Preview -->
                <div style="width: 80px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;">
                    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.8); border-radius: 50%; overflow: hidden; border: 1px solid var(--card-border); position: relative;">
                        <img class="staff-avatar-preview" src="${avatar}" style="width: 100%; height: 100%; object-fit: cover; display: ${avatar ? 'block' : 'none'};">
                        <div class="staff-avatar-placeholder" style="position: absolute; inset: 0; display: ${avatar ? 'none' : 'flex'}; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1.5rem;">
                            <i class="fa-solid fa-user"></i>
                        </div>
                    </div>
                    <label class="btn btn-secondary btn-sm" style="text-align: center; cursor: pointer; padding: 4px; font-size: 0.7rem;">
                        <i class="fa-solid fa-upload"></i> Upload
                        <input type="file" class="staff-avatar-upload" accept="image/*" style="display: none;">
                    </label>
                    <span class="staff-upload-status" style="font-size: 0.7rem; text-align: center; color: var(--accent-green);"></span>
                </div>
                
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px; justify-content: center;">
                    <input type="text" class="staff-name" placeholder="Naam" value="${name}">
                    <input type="text" class="staff-avatar" placeholder="Avatar URL (Of upload een afbeelding)" value="${avatar}" style="font-size: 0.85rem;">
                </div>
            </div>
            <div class="badges-container" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
                <!-- badges here -->
            </div>
            <button type="button" class="btn btn-secondary btn-sm add-badge-btn" style="align-self: flex-start; margin-top: 10px;">+ Voeg badge toe (Max 3)</button>
        `;

        const avatarPreview = div.querySelector('.staff-avatar-preview');
        const avatarPlaceholder = div.querySelector('.staff-avatar-placeholder');
        const avatarInput = div.querySelector('.staff-avatar');

        const updatePreview = (url) => {
            if (url) {
                avatarPreview.src = url;
                avatarPreview.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            } else {
                avatarPreview.style.display = 'none';
                avatarPlaceholder.style.display = 'flex';
            }
        };

        avatarInput.addEventListener('input', (e) => {
            updatePreview(e.target.value);
            scheduleAutoSave();
        });

        div.querySelector('.staff-avatar-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const statusEl = div.querySelector('.staff-upload-status');
            statusEl.textContent = 'Verwerken...';
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    
                    avatarInput.value = dataUrl;
                    updatePreview(dataUrl);
                    statusEl.textContent = 'Opgeslagen!';
                    scheduleAutoSave();
                    setTimeout(() => statusEl.textContent = '', 3000);
                };
                img.onerror = () => {
                    statusEl.textContent = 'Mislukt';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        const badgesContainer = div.querySelector('.badges-container');
        const addBadgeBtn = div.querySelector('.add-badge-btn');

        const addBadgeRow = (rank, rankClass) => {
            if (badgesContainer.children.length >= 3) return;
            const badgeRow = document.createElement('div');
            badgeRow.className = 'badge-input-row';
            badgeRow.style.display = 'flex';
            badgeRow.style.gap = '10px';
            badgeRow.style.width = '100%';
            badgeRow.innerHTML = `
                <input type="text" class="staff-rank" placeholder="Rank (e.g. OWNER)" value="${rank}" style="flex: 1;">
                <select class="staff-class" style="flex: 1;">
                    <option value="owner-badge" ${rankClass === 'owner-badge' ? 'selected' : ''}>Owner Badge</option>
                    <option value="co-owner-badge" ${rankClass === 'co-owner-badge' ? 'selected' : ''}>Co-Owner Badge</option>
                    <option value="developer-badge" ${rankClass === 'developer-badge' ? 'selected' : ''}>Developer Badge</option>
                    <option value="admin-badge" ${rankClass === 'admin-badge' ? 'selected' : ''}>Admin Badge</option>
                    <option value="builder-badge" ${rankClass === 'builder-badge' ? 'selected' : ''}>Builder Badge</option>
                    <option value="media-badge" ${rankClass === 'media-badge' ? 'selected' : ''}>Media Badge</option>
                </select>
                <button type="button" class="btn btn-secondary remove-badge-btn" style="padding: 5px 10px;"><i class="fa-solid fa-xmark"></i></button>
            `;
            
            badgeRow.querySelector('.staff-rank').addEventListener('input', scheduleAutoSave);
            badgeRow.querySelector('.staff-class').addEventListener('change', scheduleAutoSave);
            badgeRow.querySelector('.remove-badge-btn').addEventListener('click', () => {
                badgeRow.remove();
                addBadgeBtn.style.display = 'block';
                scheduleAutoSave();
            });

            badgesContainer.appendChild(badgeRow);

            if (badgesContainer.children.length >= 3) {
                addBadgeBtn.style.display = 'none';
            }
            scheduleAutoSave();
        };

        badges.forEach(b => addBadgeRow(b.rank, b.rankClass));

        addBadgeBtn.addEventListener('click', () => addBadgeRow('NEW', 'owner-badge'));

        // Auto-save on any staff field change
        div.querySelector('.staff-name').addEventListener('input', scheduleAutoSave);
        div.querySelector('.staff-avatar').addEventListener('input', scheduleAutoSave);

        div.querySelector('.remove-staff-btn').addEventListener('click', () => {
            div.remove();
            scheduleAutoSave();
        });

        const dragHandle = div.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mouseenter', () => div.draggable = true);
            dragHandle.addEventListener('mouseleave', () => div.draggable = false);
        }

        // Drag and Drop Logic
        div.addEventListener('dragstart', function(e) {
            draggedStaff = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        div.addEventListener('dragend', function() {
            draggedStaff = null;
            this.style.opacity = '1';
        });

        div.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.border = '1px dashed var(--accent-gold)';
        });

        div.addEventListener('dragleave', function() {
            this.style.border = '1px solid var(--card-border)';
        });

        div.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.border = '1px solid var(--card-border)';
            if (draggedStaff !== this && draggedStaff !== null) {
                const allStaff = [...staffListContainer.querySelectorAll('.staff-input-row')];
                const draggedIndex = allStaff.indexOf(draggedStaff);
                const targetIndex = allStaff.indexOf(this);
                if (draggedIndex < targetIndex) {
                    this.after(draggedStaff);
                } else {
                    this.before(draggedStaff);
                }
                scheduleAutoSave();
            }
        });

        staffListContainer.appendChild(div);
    }

    addStaffBtn.addEventListener('click', () => {
        createStaffInput();
        scheduleAutoSave();
    });

    let draggedSocial = null;

    // Social Media creation
    function createSocialInput(title = '', platform = 'tiktok', link = '', thumbnail = '') {
        const div = document.createElement('div');
        div.className = 'social-input-row';
        div.draggable = false;
        div.style.border = '1px solid var(--card-border)';
        div.style.padding = '15px';
        div.style.marginBottom = '15px';
        div.style.borderRadius = '8px';
        div.style.backgroundColor = 'var(--card-bg)';
        div.style.transition = 'opacity 0.2s';
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div class="drag-handle" style="color: var(--text-muted); padding: 5px; cursor: grab;">
                    <i class="fa-solid fa-grip-vertical"></i> Sleep om te verplaatsen
                </div>
                <button type="button" class="btn btn-secondary remove-social-btn" style="padding: 5px 10px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i> Verwijder Video</button>
            </div>
            <div style="display: flex; gap: 15px; margin-top: 10px;">
                <!-- Thumbnail Preview -->
                <div style="width: 120px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;">
                    <div style="width: 100%; aspect-ratio: 9/12; background: rgba(255,255,255,0.8); border-radius: 8px; overflow: hidden; border: 1px solid var(--card-border); position: relative;">
                        <img class="social-thumb-preview" src="${thumbnail}" style="width: 100%; height: 100%; object-fit: cover; display: ${thumbnail ? 'block' : 'none'};">
                        <div class="social-thumb-placeholder" style="position: absolute; inset: 0; display: ${thumbnail ? 'none' : 'flex'}; align-items: center; justify-content: center; color: var(--text-muted); font-size: 2rem;">
                            <i class="fa-regular fa-image"></i>
                        </div>
                    </div>
                    <label class="btn btn-secondary btn-sm" style="text-align: center; cursor: pointer; padding: 6px; font-size: 0.75rem;">
                        <i class="fa-solid fa-upload"></i> Upload
                        <input type="file" class="social-thumb-upload" accept="image/*" style="display: none;">
                    </label>
                    <span class="upload-status" style="font-size: 0.75rem; text-align: center; color: var(--accent-green);"></span>
                </div>
                
                <!-- Inputs -->
                <div style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" class="social-title" placeholder="Titel van de video" value="${title}">
                    <select class="social-platform">
                        <option value="tiktok" ${platform === 'tiktok' ? 'selected' : ''}>TikTok</option>
                        <option value="youtube" ${platform === 'youtube' ? 'selected' : ''}>YouTube</option>
                    </select>
                    <input type="text" class="social-link" placeholder="Video Link (e.g. https://tiktok.com/...)" value="${link}">
                    <input type="text" class="social-thumbnail" placeholder="Thumbnail URL (Of laat leeg voor auto)" value="${thumbnail}" style="color: var(--text-muted); font-size: 0.85rem;">
                </div>
            </div>
        `;

        const thumbPreview = div.querySelector('.social-thumb-preview');
        const thumbPlaceholder = div.querySelector('.social-thumb-placeholder');
        const thumbInput = div.querySelector('.social-thumbnail');

        const updatePreview = (url) => {
            if (url) {
                thumbPreview.src = url;
                thumbPreview.style.display = 'block';
                thumbPlaceholder.style.display = 'none';
            } else {
                thumbPreview.style.display = 'none';
                thumbPlaceholder.style.display = 'flex';
            }
        };

        thumbInput.addEventListener('input', (e) => {
            updatePreview(e.target.value);
            scheduleAutoSave();
        });

        div.querySelector('.social-thumb-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const statusEl = div.querySelector('.upload-status');
            statusEl.textContent = 'Verwerken...';
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 480;
                    const MAX_HEIGHT = 640;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convert to highly compressed JPEG to save database space
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    
                    thumbInput.value = dataUrl;
                    updatePreview(dataUrl);
                    statusEl.textContent = 'Opgeslagen!';
                    scheduleAutoSave();
                    setTimeout(() => statusEl.textContent = '', 3000);
                };
                img.onerror = () => {
                    statusEl.textContent = 'Mislukt';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        div.querySelector('.social-title').addEventListener('input', scheduleAutoSave);
        div.querySelector('.social-platform').addEventListener('change', scheduleAutoSave);
        div.querySelector('.social-link').addEventListener('input', scheduleAutoSave);
        div.querySelector('.social-thumbnail').addEventListener('input', scheduleAutoSave);

        div.querySelector('.remove-social-btn').addEventListener('click', () => {
            div.remove();
            scheduleAutoSave();
        });

        const dragHandle = div.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mouseenter', () => div.draggable = true);
            dragHandle.addEventListener('mouseleave', () => div.draggable = false);
        }

        // Drag and Drop Logic
        div.addEventListener('dragstart', function(e) {
            draggedSocial = this;
            setTimeout(() => this.style.opacity = '0.5', 0);
            e.dataTransfer.effectAllowed = 'move';
        });

        div.addEventListener('dragend', function() {
            draggedSocial = null;
            this.style.opacity = '1';
        });

        div.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.border = '1px dashed var(--accent-gold)';
        });

        div.addEventListener('dragleave', function() {
            this.style.border = '1px solid var(--card-border)';
        });

        div.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.border = '1px solid var(--card-border)';
            if (draggedSocial !== this && draggedSocial !== null) {
                const allSocials = [...socialMediaListContainer.querySelectorAll('.social-input-row')];
                const draggedIndex = allSocials.indexOf(draggedSocial);
                const targetIndex = allSocials.indexOf(this);
                if (draggedIndex < targetIndex) {
                    this.after(draggedSocial);
                } else {
                    this.before(draggedSocial);
                }
                scheduleAutoSave();
            }
        });

        socialMediaListContainer.appendChild(div);
    }

    addSocialBtn.addEventListener('click', () => {
        createSocialInput();
        scheduleAutoSave();
    });

    let draggedUpdate = null;

    // Update creation
    function createUpdateInput(date = '', title = '', description = '', hasButton = true, buttonText = '', buttonLink = 'index.html', buttonClass = 'btn-primary', isNew = false) {
        const div = document.createElement('div');
        div.className = 'update-input-row' + (isNew ? ' new-update-form' : '');
        div.draggable = false;
        div.style.border = isNew ? '2px dashed var(--accent-gold)' : '1px solid var(--card-border)';
        div.style.padding = '15px';
        div.style.marginBottom = '15px';
        div.style.borderRadius = '8px';
        div.style.cursor = isNew ? 'default' : 'grab';
        div.style.backgroundColor = 'var(--card-bg)';
        div.style.transition = 'opacity 0.2s';
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div class="drag-handle" style="color: var(--text-muted); padding: 5px; cursor: ${isNew ? 'default' : 'grab'};">
                    ${isNew ? '<i class="fa-solid fa-plus"></i> Nieuwe Update Maken' : '<i class="fa-solid fa-grip-vertical"></i> Sleep om te verplaatsen'}
                </div>
                ${isNew ? '<button type="button" class="btn btn-secondary cancel-update-btn" style="padding: 5px 10px; font-size: 0.8rem;"><i class="fa-solid fa-xmark"></i> Annuleren</button>' : '<button type="button" class="btn btn-secondary remove-update-btn" style="padding: 5px 10px; font-size: 0.8rem;"><i class="fa-solid fa-trash"></i> Verwijder Update</button>'}
            </div>
            <div class="form-group"><input type="text" class="update-date" placeholder="Date (e.g. MAY 2 2026)" value="${date}"></div>
            <div class="form-group"><input type="text" class="update-title" placeholder="Title" value="${title}"></div>
            <div class="form-group"><textarea class="update-description" placeholder="Description" style="width: 100%; padding: 12px 16px; border-radius: 8px; background: rgba(255,255,255,0.8); border: 1px solid var(--card-border); color: var(--text-main); font-family: 'Inter';">${description}</textarea></div>
            <div class="form-group toggle-row" style="margin-bottom: 10px;">
                <label>Actieknop tonen? <span class="btn-status-text" style="color: var(--text-muted); font-weight: normal; margin-left: 10px;">${hasButton ? '' : '(Button off)'}</span></label>
                <label class="toggle-switch">
                    <input type="checkbox" class="update-btn-toggle" ${hasButton ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="btn-inputs-container" style="display: ${hasButton ? 'flex' : 'none'}; gap: 10px; margin-bottom: 10px;">
                <input type="text" class="update-btn-text" placeholder="Button Text" value="${buttonText}" style="flex: 1;">
                <input type="text" class="update-btn-link" placeholder="Button Link" value="${buttonLink}" style="flex: 1;">
                <select class="update-btn-class" style="flex: 1;">
                    <option value="btn-primary" ${buttonClass === 'btn-primary' ? 'selected' : ''}>Primary (White)</option>
                    <option value="btn-secondary" ${buttonClass === 'btn-secondary' ? 'selected' : ''}>Secondary (Outline)</option>
                </select>
            </div>
            ${isNew ? '<button type="button" class="btn btn-primary confirm-add-btn" style="width: 100%; margin-top: 10px;">ADD UPDATE</button>' : ''}
        `;

        const btnToggle = div.querySelector('.update-btn-toggle');
        const btnContainer = div.querySelector('.btn-inputs-container');
        const btnStatus = div.querySelector('.btn-status-text');

        btnToggle.addEventListener('change', () => {
            if (btnToggle.checked) {
                btnContainer.style.display = 'flex';
                btnStatus.textContent = '';
            } else {
                btnContainer.style.display = 'none';
                btnStatus.textContent = '(Button off)';
            }
            if (!isNew) scheduleAutoSave();
        });

        if (isNew) {
            // Logic for a new, unsaved update form
            div.querySelector('.cancel-update-btn').addEventListener('click', () => {
                div.remove();
            });

            div.querySelector('.confirm-add-btn').addEventListener('click', () => {
                const newDate = div.querySelector('.update-date').value;
                const newTitle = div.querySelector('.update-title').value;
                const newDesc = div.querySelector('.update-description').value;
                const newHasBtn = div.querySelector('.update-btn-toggle').checked;
                const newBtnTxt = div.querySelector('.update-btn-text').value;
                const newBtnLnk = div.querySelector('.update-btn-link').value;
                const newBtnCls = div.querySelector('.update-btn-class').value;
                
                // Replace this form with a saved block
                div.remove();
                createUpdateInput(newDate, newTitle, newDesc, newHasBtn, newBtnTxt, newBtnLnk, newBtnCls, false);
                scheduleAutoSave();
            });
        } else {
            // Auto-save on any update field change for saved updates
            div.querySelector('.update-date').addEventListener('input', scheduleAutoSave);
            div.querySelector('.update-title').addEventListener('input', scheduleAutoSave);
            div.querySelector('.update-description').addEventListener('input', scheduleAutoSave);
            div.querySelector('.update-btn-text').addEventListener('input', scheduleAutoSave);
            div.querySelector('.update-btn-link').addEventListener('input', scheduleAutoSave);
            div.querySelector('.update-btn-class').addEventListener('change', scheduleAutoSave);

            div.querySelector('.remove-update-btn').addEventListener('click', () => {
                div.remove();
                scheduleAutoSave();
            });

            const dragHandle = div.querySelector('.drag-handle');
            if (dragHandle) {
                dragHandle.addEventListener('mouseenter', () => div.draggable = true);
                dragHandle.addEventListener('mouseleave', () => div.draggable = false);
            }

            // Drag and Drop Logic
            div.addEventListener('dragstart', function(e) {
                draggedUpdate = this;
                setTimeout(() => this.style.opacity = '0.5', 0);
                e.dataTransfer.effectAllowed = 'move';
            });

            div.addEventListener('dragend', function() {
                draggedUpdate = null;
                this.style.opacity = '1';
            });

            div.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.style.border = '1px dashed var(--accent-gold)';
            });

            div.addEventListener('dragleave', function() {
                this.style.border = '1px solid var(--card-border)';
            });

            div.addEventListener('drop', function(e) {
                e.preventDefault();
                this.style.border = '1px solid var(--card-border)';
                if (draggedUpdate !== this) {
                    const allUpdates = [...updatesListContainer.querySelectorAll('.update-input-row:not(.new-update-form)')];
                    const draggedIndex = allUpdates.indexOf(draggedUpdate);
                    const targetIndex = allUpdates.indexOf(this);
                    if (draggedIndex < targetIndex) {
                        this.after(draggedUpdate);
                    } else {
                        this.before(draggedUpdate);
                    }
                    scheduleAutoSave();
                }
            });
        }

        updatesListContainer.appendChild(div);
    }


    addUpdateBtn.addEventListener('click', () => {
        createUpdateInput('', '', '', true, '', 'index.html', 'btn-primary', true);
    });

    const defaultConfig = {
        serverIP: 'Rocket League Sideswipe',
        discordLink: 'https://discord.gg/mQt4J5Brug',
        hasNewUpdates: false,
        staff: [
            { name: 'tienmaster10', avatar: '', badges: [{rank: 'OWNER', rankClass: 'owner-badge'}] }
        ],
        updates: [
            {
                date: 'PLANNING: COMING SOON IN 2026',
                title: 'Server opening',
                description: 'Today the server will open for everyone to play! Get ready for an amazing adventure.',
                hasButton: true,
                buttonText: 'SERVER START',
                buttonLink: 'index.html',
                buttonClass: 'btn-primary'
            }
        ]
    };

    async function loadConfiguration() {
        isLoading = true;
        try {
            const docRef = doc(db, 'config', 'website');
            const docSnap = await getDoc(docRef);

            let data;
            if (docSnap.exists()) {
                data = docSnap.data();
            } else {
                data = defaultConfig;
                await setDoc(docRef, data);
            }

            if (configIp) configIp.value = data.serverIP || defaultConfig.serverIP;
            if (configDiscord) configDiscord.value = data.discordLink || defaultConfig.discordLink;
            if (configWebhook) configWebhook.value = data.webhookUrl || '';
            
            if (data.hasNewUpdates) {
                if (data.updatesBadgeExpiresAt && Date.now() > data.updatesBadgeExpiresAt) {
                    configUpdatesBadge.checked = false;
                    currentBadgeExpiration = null;
                } else {
                    configUpdatesBadge.checked = true;
                    currentBadgeExpiration = data.updatesBadgeExpiresAt || null;
                }
            } else {
                configUpdatesBadge.checked = false;
                currentBadgeExpiration = null;
            }
            
            configUpdatesDuration.style.display = configUpdatesBadge.checked ? 'block' : 'none';
            updateUpdatesNavState(configUpdatesBadge.checked);

            staffListContainer.innerHTML = '';
            const staffList = (data.staff && Array.isArray(data.staff)) ? data.staff : defaultConfig.staff;
            staffList.forEach(staff => {
                let badges = staff.badges;
                if (!badges && staff.rank) {
                    badges = [{rank: staff.rank, rankClass: staff.rankClass}];
                }
                
                // Migrate old userid to avatar if avatar doesn't exist
                let avatarUrl = staff.avatar || '';
                if (!avatarUrl && staff.userid) {
                    // Try to generate a roblox fallback or just leave empty
                    // Since it's changing to sideswipe, we just leave it empty so they can re-upload
                }
                
                createStaffInput(staff.name, avatarUrl, badges);
            });

            updatesListContainer.innerHTML = '';
            const updatesList = (data.updates && Array.isArray(data.updates)) ? data.updates : defaultConfig.updates;
            updatesList.forEach(upd => {
                const hasBtn = upd.hasButton !== undefined ? upd.hasButton : (upd.buttonText ? true : false);
                createUpdateInput(upd.date, upd.title, upd.description, hasBtn, upd.buttonText, upd.buttonLink, upd.buttonClass);
            });

            socialMediaListContainer.innerHTML = '';
            const socialList = (data.socialMedia && Array.isArray(data.socialMedia)) ? data.socialMedia : (defaultConfig.socialMedia || []);
            socialList.forEach(soc => {
                createSocialInput(soc.title, soc.platform, soc.link, soc.thumbnail);
            });

        } catch (error) {
            console.error('Error loading config:', error);
            saveStatus.textContent = 'Error loading configuration.';
            saveStatus.style.color = '#e74c3c';
        } finally {
            isLoading = false;
        }
    }
});

// ─── Leaderboard Admin Panel ──────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const overlay    = document.getElementById('lb-admin-overlay');
    const openBtn    = document.getElementById('open-lb-admin');
    const closeBtn   = document.getElementById('close-lb-admin');
    const playerList = document.getElementById('lb-players-list');
    const addBtn     = document.getElementById('lb-add-player');
    const saveBtn    = document.getElementById('lb-save');
    const saveStatus = document.getElementById('lb-save-status');

    if (!overlay) return; // not on admin page

    // Open / close
    openBtn.addEventListener('click', async () => {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        await loadLbPlayers();
    });

    function closeOverlay() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeOverlay();
    });

    // Load existing players from Firebase
    async function loadLbPlayers() {
        playerList.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:1rem;">Loading…</p>';
        try {
            const snap = await getDoc(doc(db, 'config', 'website'));
            const data = snap.exists() ? snap.data() : {};
            const players = data.leaderboardPlayers || [];
            playerList.innerHTML = '';
            players.forEach(p => addPlayerRow(p));
        } catch (e) {
            playerList.innerHTML = '<p style="color:#e74c3c;padding:1rem;">Failed to load.</p>';
        }
    }

    // Add a player row (optionally pre-filled)
    function addPlayerRow(data = {}) {
        const card = document.createElement('div');
        card.className = 'lb-player-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="font-size: 1.1rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 8px;"><i class="fa-solid fa-user" style="color:var(--accent-gold);"></i> Tournament Player</h3>
                <button class="btn btn-secondary lb-remove-btn" title="Remove player" style="padding:6px 10px;">
                    <i class="fa-solid fa-trash" style="margin-right:6px;"></i> Remove
                </button>
            </div>
            
            <div class="lb-card-section">
                <h4>Player Info</h4>
                <div class="lb-card-grid">
                    <div class="lb-form-group">
                        <label>Discord Username</label>
                        <input class="lbp-discord" type="text" placeholder="e.g. user#1234" value="${data.discordUsername || ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Sideswipe Username</label>
                        <input class="lbp-sideswipe" type="text" placeholder="e.g. ProPlayer" value="${data.sideswipeUsername || ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Region</label>
                        <input class="lbp-region" type="text" placeholder="e.g. Europe" value="${data.region || ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Rank</label>
                        <input class="lbp-rank" type="text" placeholder="e.g. Grand Champion" value="${data.rank || ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Teammate</label>
                        <input class="lbp-teammate" type="text" placeholder="e.g. mate#5678" value="${data.teammate || ''}">
                    </div>
                </div>
            </div>

            <div class="lb-card-section">
                <h4>Tournament Stats</h4>
                <div class="lb-card-grid">
                    <div class="lb-form-group">
                        <label>Wins</label>
                        <input class="lbp-wins" type="number" placeholder="0" min="0" value="${data.wins ?? ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Losses</label>
                        <input class="lbp-losses" type="number" placeholder="0" min="0" value="${data.losses ?? ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Goals</label>
                        <input class="lbp-goals" type="number" placeholder="0" min="0" value="${data.goals ?? ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Points</label>
                        <input class="lbp-points" type="number" placeholder="0" min="0" value="${data.points ?? ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Placement</label>
                        <input class="lbp-placement" type="text" placeholder="e.g. 1st, Top 4" value="${data.placement || ''}">
                    </div>
                    <div class="lb-form-group">
                        <label>Tournament Wins</label>
                        <input class="lbp-twins" type="number" placeholder="0" min="0" value="${data.tournamentWins ?? ''}">
                    </div>
                </div>
            </div>
        `;
        card.querySelector('.lb-remove-btn').addEventListener('click', () => card.remove());
        playerList.appendChild(card);
    }

    addBtn.addEventListener('click', () => addPlayerRow());

    // Save to Firebase
    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveStatus.textContent = 'Saving…';
        saveStatus.style.color = 'var(--text-muted)';

        const cards = playerList.querySelectorAll('.lb-player-card');
        const players = Array.from(cards).map(card => {
            return {
                discordUsername: card.querySelector('.lbp-discord').value.trim(),
                sideswipeUsername: card.querySelector('.lbp-sideswipe').value.trim(),
                region: card.querySelector('.lbp-region').value.trim(),
                rank: card.querySelector('.lbp-rank').value.trim(),
                teammate: card.querySelector('.lbp-teammate').value.trim(),
                wins: parseInt(card.querySelector('.lbp-wins').value) || 0,
                losses: parseInt(card.querySelector('.lbp-losses').value) || 0,
                goals: parseInt(card.querySelector('.lbp-goals').value) || 0,
                points: parseInt(card.querySelector('.lbp-points').value) || 0,
                placement: card.querySelector('.lbp-placement').value.trim(),
                tournamentWins: parseInt(card.querySelector('.lbp-twins').value) || 0
            };
        }).filter(p => p.discordUsername);

        try {
            await setDoc(doc(db, 'config', 'website'), { leaderboardPlayers: players }, { merge: true });
            saveStatus.textContent = 'Saved ✓';
            saveStatus.style.color = 'var(--accent-green)';
            setTimeout(() => saveStatus.textContent = '', 3000);
        } catch (e) {
            saveStatus.textContent = 'Error saving.';
            saveStatus.style.color = '#e74c3c';
            console.error(e);
        } finally {
            saveBtn.disabled = false;
        }
    });
});

