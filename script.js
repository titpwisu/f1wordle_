let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;

// 1. ŁADOWANIE DANYCH
fetch('kierowcy.json?v=' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
        allDrivers = data;
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];
        console.log("Dane załadowane. Cel na dziś:", targetDriver.name);
        
        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk(); 
    })
    .catch(err => console.error("BŁĄD: Nie znaleziono pliku kierowcy.json!", err));

// POMOCNICZA FUNKCJA DO TEKSTU W INPUT
function aktualizujPlaceholder() {
    const input = document.getElementById('driverInput');
    if (guessesCount < MAX_GUESSES) {
        input.placeholder = `Wpisz kierowcę (Próba ${guessesCount + 1}/${MAX_GUESSES})`;
    }
}

// 2. LOGIKA PODPOWIEDZI
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';

        if (val.length < 1) {
            suggBox.style.display = 'none';
            return;
        }

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
        } else {
            suggBox.style.display = 'none';
        }
    });

    // Chowanie podpowiedzi kliknięciem poza nie
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) {
            suggBox.style.display = 'none';
        }
    });
}

// 3. INICJALIZACJA PRZYCISKU I ENTERA
function inicjujPrzycisk() {
    const btn = document.querySelector('button');
    const input = document.getElementById('driverInput');

    btn.onclick = makeGuess;

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            makeGuess();
        }
    });
}

// 4. LOGIKA STRZAŁU
function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    // Zabezpieczenia
    if (guessesCount >= MAX_GUESSES) return; // Zablokuj jeśli limit wykorzystany
    if (!guess) {
        alert("Wybierz kierowcę z listy podpowiedzi!");
        return;
    }

    // Zwiększamy licznik prób i renderujemy kafelki
    guessesCount++;
    renderRow(guess);

    // SPRAWDZENIE WYGRANEJ LUB PRZEGRANEJ
    if (guess.name === targetDriver.name) {
        setTimeout(() => {
            alert(`BRAWO! 🎉 Zgadłeś za ${guessesCount} razem!\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("WYGRANA!");
        }, 500);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => {
            alert(`KONIEC GRY! 😢\nWykorzystałeś ${MAX_GUESSES} prób.\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("PRZEGRANA :(");
        }, 500);
    } else {
        // Zaktualizuj tekst w polu, jeśli gramy dalej
        aktualizujPlaceholder();
    }

    input.value = '';
    document.getElementById('suggestions').style.display = 'none';
}

// POMOCNICZA FUNKCJA BLOKUJĄCA GRĘ
function zablokujGre(wiadomosc) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = wiadomosc;
    document.querySelector('button').disabled = true;
}

// POMOCNICZA FUNKCJA DO LICZB
function compareNumbers(guessValue, targetValue) {
    if (guessValue === targetValue) return 'correct';
    if (guessValue < targetValue) return 'lower-or-past'; // Mniej = Żółty
    return 'higher'; // Więcej = Fioletowy
}

// 5. WYŚWIETLANIE 6 KAFELKÓW
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    const codeStatus = (guess.code === targetDriver.code) ? 'correct' : 'wrong';
    const natStatus = (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong';
    
    let teamStatus = 'wrong';
    if (guess.team === targetDriver.team) {
        teamStatus = 'correct';
    } else if (targetDriver.past_teams && targetDriver.past_teams.includes(guess.team)) {
        teamStatus = 'lower-or-past'; 
    }

    const numStatus = compareNumbers(guess.number, targetDriver.number);
    const debStatus = compareNumbers(guess.debut, targetDriver.debut);
    const winsStatus = compareNumbers(guess.wins, targetDriver.wins);

    function createTile(label, value, status, delay) {
        const tile = document.createElement('div');
        tile.className = `tile ${status}`;
        tile.style.animationDelay = delay + 's';
        tile.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
        return tile;
    }

    row.appendChild(createTile('KOD', guess.code, codeStatus, 0));
    row.appendChild(createTile('NAT', guess.nationality, natStatus, 0.1));
    row.appendChild(createTile('TEAM', guess.team, teamStatus, 0.2));
    row.appendChild(createTile('NUM', guess.number, numStatus, 0.3));
    row.appendChild(createTile('ROK', guess.debut, debStatus, 0.4));
    row.appendChild(createTile('WINS', guess.wins, winsStatus, 0.5));

    board.prepend(row);
}
