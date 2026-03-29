let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;
let currentFocus = -1;

// 1. START GRY
async function inicjujGre() {
    try {
        console.log("Ładowanie danych...");
        const res = await fetch('kierowcy.json?v=' + new Date().getTime());
        allDrivers = await res.json();

        // Pobieramy dane z API
        await updateWinsFromAPI();

        // Losujemy kierowcę dnia
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        // ODBLOKOWUJEMY INPUT (Ważne!)
        const input = document.getElementById('driverInput');
        if (input) {
            input.disabled = false;
            input.placeholder = "Wpisz nazwisko kierowcy...";
        }

        console.log("Gra gotowa! Cel: " + targetDriver.name + " (Wygrane: " + targetDriver.wins + ")");

        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk();
    } catch (err) {
        console.error("Błąd startu:", err);
    }
}

// 2. API
async function updateWinsFromAPI() {
    try {
        const response = await fetch('https://api.jolpi.ca/ergast/f1/driverstandings/1.json?limit=1000');
        const data = await response.json();
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        allDrivers.forEach(driver => {
            const apiData = standings.find(s => s.Driver.driverId === driver.id);
            if (apiData) {
                driver.wins = parseInt(apiData.wins);
            }
        });
        console.log("Synchronizacja z F1 zakończona pomyślnie.");
    } catch (e) {
        console.warn("API nie odpowiedziało, gramy na danych z pliku.");
    }
}

// 3. PODPOWIEDZI
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';
        if (val.length < 1) { suggBox.style.display = 'none'; return; }

        const matches = allDrivers.filter(d => d.name.toLowerCase().includes(val));
        if (matches.length > 0) {
            suggBox.style.display = 'block';
            matches.forEach(driver => {
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
}

// 4. PRZYCISK I STRZAŁ
function inicjujPrzycisk() {
    const btn = document.querySelector('button');
    if (btn) btn.onclick = makeGuess;
}

function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    if (guessesCount >= MAX_GUESSES || !guess) {
        if (!guess && val !== "") alert("Wybierz kierowcę z listy!");
        return;
    }

    guessesCount++;
    renderRow(guess);

    if (guess.name === targetDriver.name) {
        setTimeout(() => { alert("BRAWO! 🎉"); zablokujGre("WYGRANA!"); }, 500);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => { alert("KONIEC! To był " + targetDriver.name); zablokujGre("PRZEGRANA"); }, 500);
    } else {
        aktualizujPlaceholder();
    }
    input.value = '';
}

// 5. KAFELKI
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
        t.innerHTML = v;
        row.appendChild(t);
    });
    board.appendChild(row);
}

function compareNumbers(g, t) {
    if (Number(g) === Number(t)) return 'correct';
    return Number(g) < Number(t) ? 'near' : 'higher';
}

function zablokujGre(msg) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = msg;
    document.querySelector('button').disabled = true;
}

function aktualizujPlaceholder() {
    const input = document.getElementById('driverInput');
    if (input) input.placeholder = `Próba ${guessesCount + 1}/${MAX_GUESSES}`;
}

inicjujGre();
