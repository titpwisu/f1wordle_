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

        await updateWinsFromAPI();

        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        const input = document.getElementById('driverInput');
        if (input) {
            input.disabled = false;
            input.placeholder = "Wpisz nazwisko kierowcy...";
        }

        console.log("Gra gotowa! Cel: " + targetDriver.name);

        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk();
    } catch (err) {
        console.error("Błąd startu:", err);
    }
}

// 2. API WYGRANYCH
async function updateWinsFromAPI() {
    try {
        const response = await fetch('https://api.jolpi.ca/ergast/f1/driverstandings/1.json?limit=1000');
        const data = await response.json();
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        allDrivers.forEach(driver => {
            const apiData = standings.find(s => s.Driver.driverId === driver.id);
            if (apiData) driver.wins = parseInt(apiData.wins);
        });
    } catch (e) {
        console.warn("Błąd API, używam danych z pliku.");
    }
}

// 3. LOGIKA PODPOWIEDZI I ENTERA
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

// 4. STRZAŁ I WYNIK
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
        setTimeout(() => { pokazWynik(true); zablokujGre("WYGRANA!"); }, 1000);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => { pokazWynik(false); zablokujGre("PRZEGRANA"); }, 1000);
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

        // Tylko kolumny liczbowe (NUM, ROK, WINS) dostają strzałki
        if (i >= 3) {
            if (st[i] === 'near') {
                t.innerHTML = `<span>${v}</span><span class="arrow">↑</span>`;
            } else if (st[i] === 'higher') {
                t.innerHTML = `<span>${v}</span><span class="arrow">↓</span>`;
            } else {
                t.innerHTML = v;
            }
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

function pokazWynik(czyWygrana) {
    const modal = document.getElementById('resultModal');
    if(!modal) return;
    
    document.getElementById('modalTitle').innerText = czyWygrana ? "GRATULACJE!" : "KONIEC GRY...";
    const badge = document.getElementById('modalStatusBadge');
    badge.innerText = czyWygrana ? "WYGRANA" : "PRZEGRANA";
    badge.className = czyWygrana ? "win-badge" : "lose-badge";
    document.getElementById('modalMessage').innerText = czyWygrana ? `Zgadłeś w ${guessesCount} próbach!` : "Inżynierowie nie są zadowoleni...";
    document.getElementById('targetDisplay').innerHTML = `Dzisiejszy kierowca to:<br><span style="font-size: 1.5rem; color: #e10600;">${targetDriver.name}</span>`;
    modal.style.display = "block";
}

function zablokujGre(msg) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = msg;
    document.querySelector('button').disabled = true;
}

function aktualizujPlaceholder() {
    document.getElementById('driverInput').placeholder = `Próba ${guessesCount + 1}/${MAX_GUESSES}`;
}

inicjujGre();
