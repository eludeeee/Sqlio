let db = null;
let currentCaseIndex = 0;
let currentUser = JSON.parse(localStorage.getItem('sqlio_user'));

const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
    ? 'http://localhost:3000/api' 
    : '/api';

// --- ROUTING & VIEWS ---
function showView(viewId) {
    document.getElementById('auth-view').style.display = 'none';
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('game-view').style.display = 'none';
    
    const view = document.getElementById(viewId);
    if(view) {
        // Remove flex if game-view which uses block/flex differently
        if(viewId === 'game-view') {
            view.style.display = 'block';
        } else {
            view.style.display = 'flex';
        }
    }
}

function initApp() {
    if (currentUser) {
        showDashboard();
    } else {
        showView('auth-view');
    }
    // Pre-initialize SQL
    initSQL();
}

async function showDashboard() {
    showView('dashboard-view');
    document.getElementById('dash-username').innerText = currentUser.username;
    document.getElementById('profile-score').innerText = currentUser.score;
    document.getElementById('profile-cases').innerText = currentUser.cases_solved;
    currentCaseIndex = currentUser.cases_solved; // Resume where left off
    
    // Update leaderboard
    loadLeaderboard();
}

async function loadLeaderboard() {
    try {
        const res = await fetch(`${API_URL}/leaderboard`);
        const data = await res.json();
        if (data.success) {
            const tbody = document.getElementById('leaderboard-body');
            tbody.innerHTML = '';
            data.leaderboard.forEach((user, index) => {
                const tr = document.createElement('tr');
                // Highlight current user
                if (user.username === currentUser.username) {
                    tr.style.background = 'rgba(56, 189, 248, 0.2)';
                }
                tr.innerHTML = `
                    <td>#${index + 1}</td>
                    <td>${user.username}</td>
                    <td>${user.score}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Failed to load leaderboard", e);
    }
}

// --- AUTH LOGIC ---
let isLoginMode = true;

document.getElementById('auth-tab-login').addEventListener('click', (e) => {
    isLoginMode = true;
    e.target.classList.add('active');
    document.getElementById('auth-tab-register').classList.remove('active');
    document.getElementById('auth-submit-btn').innerText = 'Masuk';
    document.getElementById('auth-error').style.display = 'none';
});

document.getElementById('auth-tab-register').addEventListener('click', (e) => {
    isLoginMode = false;
    e.target.classList.add('active');
    document.getElementById('auth-tab-login').classList.remove('active');
    document.getElementById('auth-submit-btn').innerText = 'Daftar';
    document.getElementById('auth-error').style.display = 'none';
});

document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    const endpoint = isLoginMode ? '/login' : '/register';
    
    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.success) {
            if (isLoginMode) {
                currentUser = data.user;
            } else {
                currentUser = { id: data.userId, username, score: 0, cases_solved: 0 };
            }
            localStorage.setItem('sqlio_user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            errorDiv.innerText = data.error;
            errorDiv.style.display = 'block';
        }
    } catch (err) {
        errorDiv.innerText = "Gagal terhubung ke server.";
        errorDiv.style.display = 'block';
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('sqlio_user');
    showView('auth-view');
    document.getElementById('auth-username').value = '';
    document.getElementById('auth-password').value = '';
});

// --- GAME LOGIC ---
document.getElementById('btn-play').addEventListener('click', () => {
    showView('game-view');
    loadCase(currentCaseIndex);
});

document.getElementById('btn-back-dash').addEventListener('click', () => {
    showDashboard();
});

// Initialize SQL.js
async function initSQL() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        db = new SQL.Database();
        document.getElementById('loader').style.display = 'none';
    } catch (err) {
        console.error("Failed to load SQL.js", err);
    }
}

function loadCase(index) {
    if (index >= casesData.length) {
        showWinScreen();
        return;
    }

    const currentCase = casesData[index];
    
    if (db) {
        db.close();
        db = new db.constructor(); 
    }
    
    try {
        db.run(currentCase.setupQuery);
    } catch (e) {
        console.error("Setup DB Error: ", e);
    }

    // Update UI
    document.getElementById('case-progress').innerText = `Case ${index + 1} / ${casesData.length}`;
    document.getElementById('case-title').innerText = currentCase.title;
    document.getElementById('case-description').innerText = currentCase.description;
    document.getElementById('case-instruction').innerText = currentCase.instruction;
    document.getElementById('clue-text').innerText = currentCase.clue || "...";
    
    document.getElementById('case-clue').style.display = 'none';
    document.getElementById('toggle-clue-btn').innerHTML = '<i data-lucide="help-circle" style="width: 16px; height: 16px;"></i> Clue';
    if(window.lucide) window.lucide.createIcons();
    
    document.getElementById('sql-editor').value = '';
    document.getElementById('results-body').innerHTML = '';
    document.getElementById('results-head').innerHTML = '';
    document.getElementById('empty-state').style.display = 'flex';
    
    hideFeedback();
    renderDbExplorer();
}

function renderDbExplorer() {
    const explorerContent = document.getElementById('db-explorer-content');
    explorerContent.innerHTML = '';

    try {
        const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table';");
        if (tablesRes.length === 0) return;

        const tables = tablesRes[0].values.map(row => row[0]);
        
        tables.forEach(table => {
            const result = db.exec(`SELECT * FROM ${table}`);
            
            const tableWrapper = document.createElement('div');
            tableWrapper.style.marginBottom = '2rem';
            
            const title = document.createElement('h4');
            title.innerText = `Tabel: ${table}`;
            title.style.color = 'var(--accent)';
            title.style.marginBottom = '0.5rem';
            
            const tableEl = document.createElement('table');
            tableEl.style.width = '100%';
            tableEl.style.background = 'rgba(0,0,0,0.5)';
            tableEl.style.borderRadius = '8px';
            tableEl.style.overflow = 'hidden';
            
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');
            
            if (result.length > 0) {
                const trHead = document.createElement('tr');
                result[0].columns.forEach(col => {
                    const th = document.createElement('th');
                    th.innerText = col;
                    trHead.appendChild(th);
                });
                thead.appendChild(trHead);
                
                result[0].values.forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach(val => {
                        const td = document.createElement('td');
                        td.innerText = val !== null ? val : 'NULL';
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                const td = document.createElement('td');
                td.innerText = "Tabel Kosong";
                tr.appendChild(td);
                tbody.appendChild(tr);
            }
            
            tableEl.appendChild(thead);
            tableEl.appendChild(tbody);
            tableWrapper.appendChild(title);
            tableWrapper.appendChild(tableEl);
            
            explorerContent.appendChild(tableWrapper);
        });
    } catch (e) {
        console.error("Gagal merender Database Explorer", e);
    }
}

function executeQuery() {
    const query = document.getElementById('sql-editor').value.trim();
    if (!query) return;

    hideFeedback();

    try {
        const result = db.exec(query);
        renderResults(result);
        validateResult(query, result);
    } catch (err) {
        showError(err.message);
    }
}

function renderResults(result) {
    const thead = document.getElementById('results-head');
    const tbody = document.getElementById('results-body');
    const emptyState = document.getElementById('empty-state');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (result.length === 0) {
        emptyState.style.display = 'flex';
        emptyState.innerText = '0 baris dikembalikan.';
        return;
    }

    emptyState.style.display = 'none';

    const columns = result[0].columns;
    const values = result[0].values;

    const trHead = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    values.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(val => {
            const td = document.createElement('td');
            td.innerText = val !== null ? val : 'NULL';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

function validateResult(userQuery, userResult) {
    const currentCase = casesData[currentCaseIndex];
    
    try {
        const expectedResult = db.exec(currentCase.expectedQuery);
        
        if (isResultEqual(userResult, expectedResult)) {
            // Case solved correctly!
            handleCaseSuccess();
        }
    } catch (e) {
        console.error("Expected query error:", e);
    }
}

async function handleCaseSuccess() {
    // Determine points (e.g. 100 points per case)
    const points = 100;
    
    try {
        // Send score to backend
        await fetch(`${API_URL}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, points })
        });
        
        // Update local user state
        currentUser.score += points;
        currentUser.cases_solved += 1;
        localStorage.setItem('sqlio_user', JSON.stringify(currentUser));
        
        showSuccess(`Luar biasa! Identifikasi target berhasil dikonfirmasi. (+${points} Poin)`);
    } catch (err) {
        console.error("Failed to update score", err);
        showSuccess("Luar biasa! Namun gagal mengirim skor ke server.");
    }
}

function isResultEqual(res1, res2) {
    if (res1.length !== res2.length) return false;
    if (res1.length === 0) return true;
    
    const r1 = res1[0];
    const r2 = res2[0];

    if (r1.columns.length !== r2.columns.length) return false;
    if (r1.values.length !== r2.values.length) return false;

    for (let i = 0; i < r1.values.length; i++) {
        for (let j = 0; j < r1.values[i].length; j++) {
            if (r1.values[i][j] !== r2.values[i][j]) {
                return false;
            }
        }
    }
    
    return true;
}

function showError(msg) {
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback error show';
    feedback.innerHTML = `<span><strong>Error:</strong> ${msg}</span>`;
}

function showSuccess(msg) {
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback success show';
    feedback.innerHTML = `
        <span>${msg}</span>
        <button class="next-btn" onclick="nextCase()">Next Case ➔</button>
    `;
}

function hideFeedback() {
    const feedback = document.getElementById('feedback');
    feedback.className = 'feedback';
}

function nextCase() {
    currentCaseIndex++;
    loadCase(currentCaseIndex);
}

function showWinScreen() {
    document.querySelector('main').innerHTML = `
        <div class="panel" style="width: 100%; text-align: center; justify-content: center; align-items: center;">
            <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Misi Selesai</h2>
            <p class="case-description">Selamat Detektif! Anda telah menyelesaikan semua case dan membantu SQLio menjaga keamanan dunia siber.</p>
            <button onclick="showDashboard()" style="margin-top: 2rem;">Kembali ke Dashboard</button>
        </div>
    `;
}

// Attach event listeners
document.getElementById('run-btn').addEventListener('click', executeQuery);

document.getElementById('sql-editor').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeQuery();
    }
});

// Tab Listeners
document.getElementById('toggle-clue-btn').addEventListener('click', function() {
    const clueDiv = document.getElementById('case-clue');
    if (clueDiv.style.display === 'none') {
        clueDiv.style.display = 'block';
        this.innerHTML = '<i data-lucide="eye-off" style="width: 16px; height: 16px;"></i> Hide Clue';
    } else {
        clueDiv.style.display = 'none';
        this.innerHTML = '<i data-lucide="help-circle" style="width: 16px; height: 16px;"></i> Clue';
    }
    if(window.lucide) window.lucide.createIcons();
});

document.getElementById('tab-btn-query').addEventListener('click', function() {
    document.getElementById('view-query').style.display = 'flex';
    document.getElementById('view-db').style.display = 'none';
    this.classList.add('active');
    this.style.background = 'rgba(255, 255, 255, 0.1)';
    this.style.color = 'var(--text-main)';
    
    const dbBtn = document.getElementById('tab-btn-db');
    dbBtn.classList.remove('active');
    dbBtn.style.background = 'transparent';
    dbBtn.style.color = 'var(--text-muted)';
});

document.getElementById('tab-btn-db').addEventListener('click', function() {
    document.getElementById('view-query').style.display = 'none';
    document.getElementById('view-db').style.display = 'flex';
    this.classList.add('active');
    this.style.background = 'rgba(255, 255, 255, 0.1)';
    this.style.color = 'var(--text-main)';
    
    const queryBtn = document.getElementById('tab-btn-query');
    queryBtn.classList.remove('active');
    queryBtn.style.background = 'transparent';
    queryBtn.style.color = 'var(--text-muted)';
});

// Initialize on load
window.addEventListener('load', initApp);
