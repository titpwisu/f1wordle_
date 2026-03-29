let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;

// 1. Ładowanie danych
async function inicjujGre() {
    try {
        const res = await fetch('kierowcy.json?v=' + Date.now());
        if (!res.ok) throw new Error("Nie znaleziono pliku JSON");
        allDrivers = await res.json();

        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        console.log("Gra załadowana poprawnie.");
        
        // Odblokowanie inputa i przypisanie zdarzeń
        const input = document.getElementById('driverInput');
        input.disabled = false;
        input.placeholder = "Wpisz nazwisko kierowcy...";
        
        inicjujPodpowiedzi();
        document.querySelector('button').onclick = makeGuess;
    } catch (err) {
        console.error("Błąd krytyczny:", err);
        document.getElementById('driverInput').placeholder = "Błąd ładowania danych!";
    }
}

// 2. Obsługa podpowiedzi
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

// 3. Logika strzału
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
        input.placeholder = `Próba ${guessesCount + 1}/${MAX_GUESSES}`;
    }
    input.value = '';
}

// 4. Rysowanie rzędu
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    const st = [
        (guess.code === targetDriver.code) ? 'correct' : 'wrong',
        (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong',
        (guess.team === targetDriver.team) ? 'correct' : (targetDriver.past_teams.includes(guess.team) ? 'near' : 'wrong'),
        comp(guess.number, targetDriver.number),
        comp(guess.debut, targetDriver.debut),
        comp(guess.wins, targetDriver.wins)
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

function comp(g, t) {
    if (Number(g) === Number(t)) return 'correct';
    return Number(g) < Number(t) ? 'near' : 'higher';
}

function zablokujGre(msg) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = msg;
    document.querySelector('button').disabled = true;
}

// Start
inicjujGre();
