let db = null;
let currentCaseIndex = 0;

// Initialize SQL.js
async function initSQL() {
    try {
        const SQL = await initSqlJs({
            // Fetch the wasm file from a CDN
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });
        db = new SQL.Database();
        
        // Hide loader and load first case
        document.getElementById('loader').style.display = 'none';
        loadCase(currentCaseIndex);
    } catch (err) {
        console.error("Failed to load SQL.js", err);
        document.getElementById('loader').innerHTML = "<p>Gagal memuat engine SQL. Periksa koneksi internet Anda.</p>";
    }
}

function loadCase(index) {
    if (index >= casesData.length) {
        showWinScreen();
        return;
    }

    const currentCase = casesData[index];
    
    // Reset and setup database for current case
    if (db) {
        // Clear all tables (dirty way: just create a new db instance to be clean)
        db.close();
        db = new db.constructor(); // Re-instantiate based on the prototype
    }
    
    // Execute setup query
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
    
    // Reset editor and results
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

    // Render Headers
    const trHead = document.createElement('tr');
    columns.forEach(col => {
        const th = document.createElement('th');
        th.innerText = col;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Render Rows
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
        // Execute expected query to compare
        const expectedResult = db.exec(currentCase.expectedQuery);
        
        if (isResultEqual(userResult, expectedResult)) {
            showSuccess("Luar biasa! Identifikasi target berhasil dikonfirmasi.");
        }
    } catch (e) {
        console.error("Expected query error:", e);
    }
}

function isResultEqual(res1, res2) {
    if (res1.length !== res2.length) return false;
    if (res1.length === 0) return true; // both empty
    
    const r1 = res1[0];
    const r2 = res2[0];

    // Check column count
    if (r1.columns.length !== r2.columns.length) return false;
    // Note: column names might be different if user uses aliases, but values should match
    
    // Check row count
    if (r1.values.length !== r2.values.length) return false;

    // Check data
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
            <button onclick="location.reload()" style="margin-top: 2rem;">Mainkan Ulang</button>
        </div>
    `;
}

// Attach event listeners
document.getElementById('run-btn').addEventListener('click', executeQuery);

// Allow Ctrl+Enter to execute
document.getElementById('sql-editor').addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        executeQuery();
    }
});

// UI Event Listeners
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
window.addEventListener('load', initSQL);
