const casesData = [
    {
        id: 1,
        title: "Case #1: Penggerebekan Server Ilegal",
        description: "Server dari situs web ilegal baru saja disita dalam operasi rahasia SQLio. Kami membutuhkan identitas dari orang-orang yang terlibat. Tolong serahkan semua detail pengguna yang ada di dalam database.",
        instruction: "Tampilkan semua kolom dari tabel USERS.",
        clue: "Gunakan SELECT * FROM nama_tabel;",
        expectedQuery: "SELECT * FROM USERS;",
        setupQuery: `
            CREATE TABLE USERS (id INTEGER PRIMARY KEY, username TEXT, role TEXT, joined_date TEXT);
            INSERT INTO USERS (username, role, joined_date) VALUES 
            ('cyber_ninja', 'admin', '2023-01-15'),
            ('shadow_broker', 'member', '2023-03-22'),
            ('neo_matrix', 'member', '2023-05-10');
        `
    },
    {
        id: 2,
        title: "Case #2: Daftar Email Rahasia",
        description: "Sebuah daftar email dari layanan online ilegal berhasil dicegat. Untuk mencegah serangan spam, SQLio perlu memblokir email-email tersebut. Tolong serahkan daftar email tanpa statusnya.",
        instruction: "Pilih HANYA kolom email dari tabel MAILING_LIST.",
        clue: "Ubah tanda * dengan nama kolom yang ingin dipilih.",
        expectedQuery: "SELECT email FROM MAILING_LIST;",
        setupQuery: `
            CREATE TABLE MAILING_LIST (id INTEGER PRIMARY KEY, email TEXT, status TEXT, last_active TEXT);
            INSERT INTO MAILING_LIST (email, status, last_active) VALUES 
            ('target1@darkweb.net', 'active', '2023-10-01'),
            ('target2@darkweb.net', 'bounced', '2023-09-15'),
            ('boss@darkweb.net', 'active', '2023-10-05');
        `
    },
    {
        id: 3,
        title: "Case #3: Kebocoran Data Anggota",
        description: "Detail pelanggan dari sebuah situs sindikat kriminal bocor. Untuk menyelidiki lebih lanjut, tolong serahkan alamat surat (MAILINGADDRESS) dan hash kata sandi (PASSWORDHASH).",
        instruction: "Pilih kolom MAILINGADDRESS dan PASSWORDHASH dari tabel MEMBERS.",
        clue: "Anda bisa memilih banyak kolom dengan memisahkannya menggunakan koma (,).",
        expectedQuery: "SELECT MAILINGADDRESS, PASSWORDHASH FROM MEMBERS;",
        setupQuery: `
            CREATE TABLE MEMBERS (id INTEGER PRIMARY KEY, fullname TEXT, MAILINGADDRESS TEXT, PASSWORDHASH TEXT);
            INSERT INTO MEMBERS (fullname, MAILINGADDRESS, PASSWORDHASH) VALUES 
            ('John Doe', '123 Elm St, NY', 'a1b2c3d4e5'),
            ('Jane Smith', '456 Oak St, CA', 'e5f6g7h8i9'),
            ('Bob Brown', '789 Pine St, TX', 'i9j0k1l2m3');
        `
    },
    {
        id: 4,
        title: "Case #4: Pola Alamat Tersangka",
        description: "Kami perlu memetakan lokasi operasional tersangka. Tolong serahkan semua alamat (ADDRESS) yang ada, namun pastikan tidak ada data alamat yang sama (duplikat).",
        instruction: "Pilih kolom ADDRESS dari tabel MEMBERS_ADDR dan pastikan hasilnya unik.",
        clue: "Gunakan kata kunci DISTINCT setelah SELECT.",
        expectedQuery: "SELECT DISTINCT ADDRESS FROM MEMBERS_ADDR;",
        setupQuery: `
            CREATE TABLE MEMBERS_ADDR (id INTEGER PRIMARY KEY, username TEXT, ADDRESS TEXT);
            INSERT INTO MEMBERS_ADDR (username, ADDRESS) VALUES 
            ('user1', '101 Cyber Way'),
            ('user2', '202 Data Drive'),
            ('user3', '101 Cyber Way'),
            ('user4', '303 Logic Lane');
        `
    },
    {
        id: 5,
        title: "Case #5: Agen Aktif",
        description: "SQLio mencurigai beberapa akun masih aktif beroperasi. Tolong serahkan semua detail dari agen yang memiliki status 'ACTIVE'.",
        instruction: "Pilih semua kolom dari AGENTS dengan syarat status adalah 'ACTIVE'.",
        clue: "Gunakan klausa WHERE nama_kolom = 'nilai'.",
        expectedQuery: "SELECT * FROM AGENTS WHERE status = 'ACTIVE';",
        setupQuery: `
            CREATE TABLE AGENTS (id INTEGER PRIMARY KEY, codename TEXT, status TEXT);
            INSERT INTO AGENTS (codename, status) VALUES 
            ('Alpha', 'ACTIVE'),
            ('Bravo', 'OFFLINE'),
            ('Charlie', 'ACTIVE');
        `
    },
    {
        id: 6,
        title: "Case #6: Transaksi Mencurigakan",
        description: "Pusat finansial melaporkan transaksi ilegal bernilai besar. Cari semua transaksi (TRANSACTIONS) di mana jumlah (amount) melebihi 10000.",
        instruction: "Pilih semua kolom dari TRANSACTIONS di mana amount > 10000.",
        clue: "Gunakan klausa WHERE dengan operator >.",
        expectedQuery: "SELECT * FROM TRANSACTIONS WHERE amount > 10000;",
        setupQuery: `
            CREATE TABLE TRANSACTIONS (id INTEGER PRIMARY KEY, tx_id TEXT, amount INTEGER);
            INSERT INTO TRANSACTIONS (tx_id, amount) VALUES 
            ('TX001', 5000),
            ('TX002', 15000),
            ('TX003', 12000),
            ('TX004', 300);
        `
    },
    {
        id: 7,
        title: "Case #7: Target Bernilai Tinggi",
        description: "Kami mendeteksi agen VIP yang sedang aktif. Kami perlu detail agen (AGENTS) dengan level akses (access_level) sama dengan 5 DAN statusnya 'ACTIVE'.",
        instruction: "Pilih semua kolom dari AGENTS di mana access_level = 5 AND status = 'ACTIVE'.",
        clue: "Gabungkan beberapa kondisi menggunakan operator AND.",
        expectedQuery: "SELECT * FROM AGENTS WHERE access_level = 5 AND status = 'ACTIVE';",
        setupQuery: `
            CREATE TABLE AGENTS (id INTEGER PRIMARY KEY, codename TEXT, access_level INTEGER, status TEXT);
            INSERT INTO AGENTS (codename, access_level, status) VALUES 
            ('Viper', 5, 'ACTIVE'),
            ('Ghost', 5, 'OFFLINE'),
            ('Phantom', 3, 'ACTIVE');
        `
    },
    {
        id: 8,
        title: "Case #8: Mengurutkan Catatan",
        description: "Log aktivitas server sudah didapatkan. Urutkan semua data dari tabel SERVER_LOGS berdasarkan waktu (timestamp) dari yang paling awal hingga terbaru.",
        instruction: "Pilih semua kolom dari SERVER_LOGS dan urutkan berdasarkan timestamp.",
        clue: "Gunakan klausa ORDER BY nama_kolom.",
        expectedQuery: "SELECT * FROM SERVER_LOGS ORDER BY timestamp;",
        setupQuery: `
            CREATE TABLE SERVER_LOGS (id INTEGER PRIMARY KEY, event TEXT, timestamp TEXT);
            INSERT INTO SERVER_LOGS (event, timestamp) VALUES 
            ('Login', '2024-01-02'),
            ('Logout', '2024-01-03'),
            ('Intrusion', '2024-01-01');
        `
    },
    {
        id: 9,
        title: "Case #9: Ancaman Terbesar",
        description: "Kami perlu mengetahui ancaman paling baru! Ambil log dari tabel SERVER_LOGS dan urutkan dari yang terbaru hingga terlama.",
        instruction: "Pilih semua kolom dari SERVER_LOGS, urutkan berdasarkan timestamp secara menurun (descending).",
        clue: "Gunakan ORDER BY nama_kolom DESC.",
        expectedQuery: "SELECT * FROM SERVER_LOGS ORDER BY timestamp DESC;",
        setupQuery: `
            CREATE TABLE SERVER_LOGS (id INTEGER PRIMARY KEY, event TEXT, timestamp TEXT);
            INSERT INTO SERVER_LOGS (event, timestamp) VALUES 
            ('Login', '2024-01-02'),
            ('Logout', '2024-01-03'),
            ('Intrusion', '2024-01-01');
        `
    },
    {
        id: 10,
        title: "Case #10: Tiga Hacker Teratas",
        description: "Kami hanya ingin melihat profil dari 3 peretas teratas yang paling berbahaya berdasarkan nilai threat_score dari tabel HACKERS.",
        instruction: "Urutkan tabel HACKERS berdasarkan threat_score secara menurun, lalu batasi hasilnya hanya 3 baris.",
        clue: "Gunakan gabungan ORDER BY ... DESC dan klausa LIMIT 3 di akhir query.",
        expectedQuery: "SELECT * FROM HACKERS ORDER BY threat_score DESC LIMIT 3;",
        setupQuery: `
            CREATE TABLE HACKERS (id INTEGER PRIMARY KEY, handle TEXT, threat_score INTEGER);
            INSERT INTO HACKERS (handle, threat_score) VALUES 
            ('ZeroDay', 99), ('ScriptKiddie', 15), ('Overlord', 85), ('Cipher', 95), ('Null', 40);
        `
    },
    {
        id: 11,
        title: "Case #11: Mencari Kata Kunci",
        description: "Sebuah pesan rahasia disisipkan di dalam database. Temukan semua baris dari tabel MESSAGES di mana isi pesan (content) mengandung kata 'bomb'.",
        instruction: "Pilih semua dari MESSAGES di mana content mirip (%...%) dengan kata 'bomb'.",
        clue: "Gunakan klausa WHERE content LIKE '%bomb%'. Tanda % artinya bisa ada teks apapun di awal atau akhir.",
        expectedQuery: "SELECT * FROM MESSAGES WHERE content LIKE '%bomb%';",
        setupQuery: `
            CREATE TABLE MESSAGES (id INTEGER PRIMARY KEY, sender TEXT, content TEXT);
            INSERT INTO MESSAGES (sender, content) VALUES 
            ('A', 'The bomb has been planted.'),
            ('B', 'Where is the payload?'),
            ('C', 'bomb defused.');
        `
    },
    {
        id: 12,
        title: "Case #12: Operasi Banyak Kota",
        description: "Tersangka diperkirakan bersembunyi di Tokyo, London, atau Berlin. Temukan semua baris dari tabel SUSPECTS di mana kotanya (city) adalah salah satu dari ketiga kota tersebut.",
        instruction: "Gunakan klausa IN untuk mencari SUSPECTS di kota 'Tokyo', 'London', 'Berlin'.",
        clue: "Gunakan WHERE city IN ('Tokyo', 'London', 'Berlin').",
        expectedQuery: "SELECT * FROM SUSPECTS WHERE city IN ('Tokyo', 'London', 'Berlin');",
        setupQuery: `
            CREATE TABLE SUSPECTS (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
            INSERT INTO SUSPECTS (name, city) VALUES 
            ('X1', 'Tokyo'), ('X2', 'Paris'), ('X3', 'London'), ('X4', 'Berlin'), ('X5', 'Madrid');
        `
    },
    {
        id: 13,
        title: "Case #13: Menghitung Anggota",
        description: "Berapa banyak jumlah anggota sindikat yang kita hadapi? Tolong berikan jumlah total (count) dari tabel SYNDICATE.",
        instruction: "Hitung total baris di tabel SYNDICATE.",
        clue: "Gunakan fungsi agregat SELECT COUNT(*) FROM nama_tabel.",
        expectedQuery: "SELECT COUNT(*) FROM SYNDICATE;",
        setupQuery: `
            CREATE TABLE SYNDICATE (id INTEGER PRIMARY KEY, alias TEXT);
            INSERT INTO SYNDICATE (alias) VALUES ('Goon1'), ('Goon2'), ('Goon3'), ('Goon4'), ('Boss');
        `
    },
    {
        id: 14,
        title: "Case #14: Laporan Wilayah",
        description: "Kami perlu tahu penyebaran musuh! Tampilkan jumlah tersangka (COUNT(id)) untuk setiap kota (city) dari tabel SUSPECTS.",
        instruction: "Pilih kolom city dan hitung jumlah (COUNT(id)). Kelompokkan hasilnya berdasarkan city.",
        clue: "Gunakan klausa GROUP BY city.",
        expectedQuery: "SELECT city, COUNT(id) FROM SUSPECTS GROUP BY city;",
        setupQuery: `
            CREATE TABLE SUSPECTS (id INTEGER PRIMARY KEY, name TEXT, city TEXT);
            INSERT INTO SUSPECTS (name, city) VALUES 
            ('X1', 'Tokyo'), ('X2', 'Tokyo'), ('X3', 'London'), ('X4', 'London'), ('X5', 'London');
        `
    },
    {
        id: 15,
        title: "Case #15: Menelusuri Identitas Sebenarnya",
        description: "Ini adalah level terakhir! Tabel ALIASES menyimpan nama samaran (alias_name) dan tabel REAL_NAMES menyimpan nama asli (real_name). Keduanya terhubung dengan kolom 'suspect_id'. Kami perlu Anda menggabungkan kedua tabel tersebut.",
        instruction: "Lakukan JOIN (atau INNER JOIN) antara ALIASES dan REAL_NAMES di mana ALIASES.suspect_id = REAL_NAMES.suspect_id. Tampilkan ALIASES.alias_name dan REAL_NAMES.real_name.",
        clue: "SELECT ALIASES.alias_name, REAL_NAMES.real_name FROM ALIASES JOIN REAL_NAMES ON ALIASES.suspect_id = REAL_NAMES.suspect_id;",
        expectedQuery: "SELECT ALIASES.alias_name, REAL_NAMES.real_name FROM ALIASES JOIN REAL_NAMES ON ALIASES.suspect_id = REAL_NAMES.suspect_id;",
        setupQuery: `
            CREATE TABLE ALIASES (id INTEGER PRIMARY KEY, suspect_id INTEGER, alias_name TEXT);
            CREATE TABLE REAL_NAMES (id INTEGER PRIMARY KEY, suspect_id INTEGER, real_name TEXT);
            INSERT INTO ALIASES (suspect_id, alias_name) VALUES (101, 'Joker'), (102, 'Riddler');
            INSERT INTO REAL_NAMES (suspect_id, real_name) VALUES (101, 'Arthur Fleck'), (102, 'Edward Nygma');
        `
    }
];
