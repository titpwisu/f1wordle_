let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;
let currentFocus = -1;

// 1. INICJACJA GRY
async function inicjujGre() {
    try {
        console.log("Loading local data...");
        // Pobieramy Twój plik JSON
        const res = await fetch('kierowcy.json?v=' + new Date().getTime());
        allDrivers = await res.json();

        // 2. AUTOMATYCZNA AKTUALIZACJA Z F1DB
        // Ta funkcja nadpisze statystyki w pamięci, jeśli w sieci są nowsze dane
        await updateWinsFromAPI();

        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        const input = document.getElementById('driverInput');
        if (input) {
            input.disabled = false;
            input.placeholder = "Enter driver name...";
        }

        console.log("Game ready! Target: " + targetDriver.name);

        loadGameState(); // Wczytuje postęp z dzisiaj (Local Storage)
        inicjujPodpowiedzi();
        inicjujPrzycisk();
        inicjujZamykanieModala();
        inicjujZasady(); 
    } catch (err) {
        console.error("Start error:", err);
    }
}

// 2. FUNKCJA AUTOMATYZACJI (F1DB)
async function updateWinsFromAPI() {
    try {
        // Pobieramy surowe dane z repozytorium F1DB
        const response = await fetch('https://raw.githubusercontent.com/f1db/f1db/main/dist/f1db-drivers.json');
        const remoteDrivers = await response.json();
        console.log("F1DB Data loaded successfully!");

        allDrivers.forEach(localDriver => {
            // Szukamy kierowcy po ID (np. "antonelli")
            const remoteData = remoteDrivers.find(d => d.id === localDriver.id);
            if (remoteData && remoteData.stats) {
                const apiWins = parseInt(remoteData.stats.wins);
                
                // Jeśli w bazie online jest więcej wygranych niż w Twoim pliku
                if (apiWins > localDriver.wins) {
                    console.log(`🚀 AUTO-UPDATE: ${localDriver.name} wins ${localDriver.wins} -> ${apiWins}`);
                    localDriver.wins = apiWins;
                }
            }
        });
    } catch (e) {
        console.error("❌ Automated update FAILED:", e);
    }
}

// 3. LOGIKA PODPOWIEDZI (AUTOCOMPLETE)
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';
        currentFocus = -1;
        if (val.length < 1) { suggBox.style.display = 'none'; return; }

        const matches = allDrivers.filter(d => d.name.toLowerCase().includes(val));
        if (matches.length > 0) {
            suggBox.style.display = 'block';
            matches.forEach((driver) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerText = driver.name;
                div.onclick = () => {
                    input.value = driver.name;
                    suggBox.style.display = 'none';
                    input.focus();
                };
                suggBox.appendChild(div);
            });
        } else { suggBox.style.display = 'none'; }
    });

    input.addEventListener('keydown', (e) => {
        let items = suggBox.getElementsByClassName('suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            addActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1 && suggBox.style.display === 'block') {
                if (items[currentFocus]) items[currentFocus].click();
            } else {
                makeGuess();
            }
        }
    });

    function addActive(items) {
        if (!items || items.length === 0) return;
        for (let i = 0; i < items.length; i++) items[i].classList.remove('suggestion-active');
        if (currentFocus >= items.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = items.length - 1;
        items[currentFocus].classList.add('suggestion-active');
        items[currentFocus].scrollIntoView({ block: "nearest" });
    }

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) suggBox.style.display = 'none';
    });
}

// 4. LOGIKA ROZGRYWKI
function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val) ||
                  allDrivers.find(d => d.name.toLowerCase().includes(val));

    if (guessesCount >= MAX_GUESSES || !guess) {
        if (!guess && val !== "") alert("Please select a driver from the list!");
        return;
    }

    guessesCount++;
    renderRow(guess);
    saveGameState(guess);

    if (guess.name === targetDriver.name) {
        setTimeout(() => { pokazWynik(true); zablokujGre("YOU WON!"); }, 1000);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => { pokazWynik(false); zablokujGre("GAME OVER"); }, 1000);
    } else {
        aktualizujPlaceholder();
    }
    input.value = '';
    currentFocus = -1;
    document.getElementById('suggestions').style.display = 'none';
}

function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    const st = [
        (guess.code === targetDriver.code) ? 'correct' : 'wrong',
        (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong',
        (guess.team === targetDriver.team) ? 'correct' : (targetDriver.past_teams.includes(guess.team) ? 'near' : 'wrong'),
        compareNumbers(guess.number, targetDriver.number),
        compareNumbers(guess.debut, targetDriver.debut),
        compareNumbers(guess.wins, targetDriver.wins)
    ];

    const vals = [guess.code, guess.nationality, guess.team, guess.number, guess.debut, guess.wins];
    vals.forEach((v, i) => {
        const t = document.createElement('div');
        t.className = `tile ${st[i]}`;
        t.style.animationDelay = (i * 0.1) + 's';
        if (i >= 3) {
            if (st[i] === 'near') t.innerHTML = `<span>${v}</span><span class="arrow">↑</span>`;
            else if (st[i] === 'higher') t.innerHTML = `<span>${v}</span><span class="arrow">↓</span>`;
            else t.innerHTML = v;
        } else {
            t.innerHTML = v;
        }
        row.appendChild(t);
    });
    board.appendChild(row);
}

function compareNumbers(g, t) {
    const gNum = Number(g);
    const tNum = Number(t);
    if (gNum === tNum) return 'correct';
    return gNum < tNum ? 'near' : 'higher';
}

// 5. ZAPISYWANIE STANU (LOCAL STORAGE)
function saveGameState(guess) {
    const today = new Date().toDateString();
    let history = JSON.parse(localStorage.getItem('f1-wordle-state')) || { date: today, guesses: [] };
    if (history.date !== today) history = { date: today, guesses: [] };
    history.guesses.push(guess.name);
    localStorage.setItem('f1-wordle-state', JSON.stringify(history));
}

function loadGameState() {
    const today = new Date().toDateString();
    const saved = JSON.parse(localStorage.getItem('f1-wordle-state'));
    if (saved && saved.date === today) {
        saved.guesses.forEach(name => {
            const driver = allDrivers.find(d => d.name === name);
            if (driver) {
                guessesCount++;
                renderRow(driver);
                if (driver.name === targetDriver.name) {
                    zablokujGre("YOU WON!");
                    pokazWynik(true);
                } else if (guessesCount >= MAX_GUESSES) {
                    zablokujGre("GAME OVER");
                    pokazWynik(false);
                }
            }
        });
        aktualizujPlaceholder();
    }
}

// 6. MODALE I UI
function pokazWynik(czyWygrana) {
    const modal = document.getElementById('resultModal');
    if(!modal) return;
    document.getElementById('modalTitle').innerText = czyWygrana ? "CONGRATULATIONS!" : "GAME OVER...";
    const badge = document.getElementById('modalStatusBadge');
    badge.innerText = czyWygrana ? "WIN" : "LOSS";
    badge.className = czyWygrana ? "win-badge" : "lose-badge";
    document.getElementById('modalMessage').innerText = czyWygrana ? `You guessed it in ${guessesCount} tries!` : "Better luck tomorrow!";
    document.getElementById('targetDisplay').innerHTML = `Today's driver was:<br><b style="color:var(--f1-red)">${targetDriver.name}</b>`;
    modal.style.display = "block";
}

function zablokujGre(msg) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = msg;
    const btn = document.querySelector('button');
    if(btn) btn.disabled = true;
}

function aktualizujPlaceholder() {
    const input = document.getElementById('driverInput');
    if(input) input.placeholder = `Attempt ${guessesCount + 1}/${MAX_GUESSES}`;
}

function inicjujPrzycisk() {
    const btn = document.querySelector('.input-area button');
    if (btn) btn.onclick = makeGuess;
}

function inicjujZamykanieModala() {
    const modal = document.getElementById('resultModal');
    const closeBtn = document.getElementById('closeModalBtn');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = "none";
    window.addEventListener('click', (event) => {
        if (event.target == modal) modal.style.display = "none";
    });
}

function inicjujZasady() {
    const rulesModal = document.getElementById('rulesModal');
    const infoBtn = document.getElementById('infoBtn');
    const closeRulesBtn = document.getElementById('closeRulesBtn');

    if (infoBtn) infoBtn.onclick = () => rulesModal.style.display = "block";
    if (closeRulesBtn) closeRulesBtn.onclick = () => rulesModal.style.display = "none";

    window.addEventListener('click', (event) => {
        if (event.target == rulesModal) rulesModal.style.display = "none";
    });
}

// URUCHOMIENIE
inicjujGre();
