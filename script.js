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

        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk();
    })
    .catch(err => console.error("Błąd:", err));

// AKTUALIZACJA POLA TEKSTOWEGO
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

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) {
            suggBox.style.display = 'none';
        }
    });
}

// 3. PRZYCISK I ENTER
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

    if (guessesCount >= MAX_GUESSES) return;
    if (!guess) {
        alert("Wybierz kierowcę z listy podpowiedzi!");
        return;
    }

    guessesCount++;
    renderRow(guess);

    if (guess.name === targetDriver.name) {
        setTimeout(() => {
            alert(`BRAWO! 🎉 Zgadłeś za ${guessesCount} razem!\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("WYGRANA!");
        }, 500);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => {
            alert(`KONIEC GRY! 😢\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("PRZEGRANA :(");
        }, 500);
    } else {
        aktualizujPlaceholder();
    }

    input.value = '';
    document.getElementById('suggestions').style.display = 'none';
}

function zablokujGre(wiadomosc) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = wiadomosc;
    document.querySelector('button').disabled = true;
}

// -----------------------------------------------------
// TWOJE ZASADY - SPRAWDZANIE LICZB
// -----------------------------------------------------
function compareNumbers(guessVal, targetVal) {
    const g = Number(guessVal);
    const t = Number(targetVal);

    if (g === t) return 'correct';       // ZIELONY (Trafiony)
    if (g < t) return 'near';            // ŻÓŁTY (Wpisano niższą wartość od poprawnej)
    return 'higher';                     // FIOLETOWY (Wpisano wyższą wartość od poprawnej)
}

// 5. RYSOWANIE KAFELKÓW NA EKRANIE
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    // KOD i NARODOWOŚĆ (Tylko zielony lub szary)
    const codeStatus = (guess.code === targetDriver.code) ? 'correct' : 'wrong';
    const natStatus = (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong';

    // ZESPÓŁ (Zielony, Żółty lub Szary)
    let teamStatus = 'wrong';
    if (guess.team === targetDriver.team) {
        teamStatus = 'correct'; // Obecny zespół
    } else if (targetDriver.past_teams && targetDriver.past_teams.includes(guess.team)) {
        teamStatus = 'near';    // Żółty dla byłego zespołu
    }

    // LICZBY (Korzystają z Twoich zasad kolorów)
    const numStatus = compareNumbers(guess.number, targetDriver.number);
    const debStatus = compareNumbers(guess.debut, targetDriver.debut);
    const winsStatus = compareNumbers(guess.wins, targetDriver.wins);

    // FUNKCJA TWORZĄCA KWADRACIK
    function createTile(label, value, status, delay) {
        const tile = document.createElement('div');
        tile.className = `tile ${status}`;
        tile.style.animationDelay = delay + 's';
        tile.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
        return tile;
    }

    // DODAWANIE DO RZĘDU
    row.appendChild(createTile('DRIVER', guess.code, codeStatus, 0));
    row.appendChild(createTile('NAT', guess.nationality, natStatus, 0.1));
    row.appendChild(createTile('TEAM', guess.team, teamStatus, 0.2));
    row.appendChild(createTile('NUM', guess.number, numStatus, 0.3));
    row.appendChild(createTile('YEAR', guess.debut, debStatus, 0.4));
    row.appendChild(createTile('WINS', guess.wins, winsStatus, 0.5));

    board.prepend(row);
}
let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;
let currentFocus = -1; // Zmienna śledząca, gdzie jest "kursor" na liście

// 1. ŁADOWANIE DANYCH
fetch('kierowcy.json?v=' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
        allDrivers = data;
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk();
    })
    .catch(err => console.error("Błąd:", err));

// AKTUALIZACJA POLA TEKSTOWEGO
function aktualizujPlaceholder() {
    const input = document.getElementById('driverInput');
    if (guessesCount < MAX_GUESSES) {
        input.placeholder = `Wpisz kierowcę (Próba ${guessesCount + 1}/${MAX_GUESSES})`;
    }
}

// 2. LOGIKA PODPOWIEDZI I KLAWIATURY
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    // Kiedy wpisujesz litery (resetujemy listę)
    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';
        currentFocus = -1; // Resetujemy pozycję strzałki

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

                // Kliknięcie palcem / myszką (Dla telefonów)
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

    // STEROWANIE KLAWIATURĄ (Strzałki i Enter)
    input.addEventListener('keydown', function(e) {
        let items = suggBox.getElementsByClassName('suggestion-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault(); // Blokuje przesuwanie się tekstu w polu
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0; // Wracamy na górę
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = (items.length - 1); // Idziemy na sam dół
            addActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Jeśli lista jest otwarta i ktoś jest zaznaczony -> Wybierz go
            if (currentFocus > -1 && suggBox.style.display === 'block') {
                if (items[currentFocus]) {
                    items[currentFocus].click();
                }
            } else {
                // Jeśli lista jest zamknięta -> Strzelaj w grze
                makeGuess();
            }
        }
    });

    // Funkcje pomocnicze do podświetlania i scrollowania
    function addActive(items) {
        if (!items || items.length === 0) return;
        // Najpierw zdejmij podświetlenie ze wszystkich
        for (let i = 0; i < items.length; i++) {
            items[i].classList.remove('suggestion-active');
        }
        // Dodaj podświetlenie do wybranego
        items[currentFocus].classList.add('suggestion-active');
        // Zmuś listę do przesunięcia, żeby kierowca był widoczny!
        items[currentFocus].scrollIntoView({ block: "nearest" });
    }

    // Zamykanie kliknięciem w tło
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) {
            suggBox.style.display = 'none';
        }
    });
}

// 3. PRZYCISK "ZGADNIJ"
function inicjujPrzycisk() {
    const btn = document.querySelector('button');
    btn.onclick = makeGuess; // Tutaj usunąłem stary Enter, jest teraz wyżej
}

// 4. LOGIKA STRZAŁU
function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    if (guessesCount >= MAX_GUESSES) return;
    if (!guess) {
        alert("Wybierz kierowcę z listy podpowiedzi!");
        return;
    }

    guessesCount++;
    renderRow(guess);

    if (guess.name === targetDriver.name) {
        setTimeout(() => {
            alert(`BRAWO! 🎉 Zgadłeś za ${guessesCount} razem!\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("WYGRANA!");
        }, 500);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => {
            alert(`KONIEC GRY! 😢\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("PRZEGRANA :(");
        }, 500);
    } else {
        aktualizujPlaceholder();
    }

    input.value = '';
    currentFocus = -1; // Po strzale znowu resetujemy strzałki
    document.getElementById('suggestions').style.display = 'none';
}

function zablokujGre(wiadomosc) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = wiadomosc;
    document.querySelector('button').disabled = true;
}

// -----------------------------------------------------
// LOGIKA KOLORÓW
// -----------------------------------------------------
function compareNumbers(guessVal, targetVal) {
    const g = Number(guessVal);
    const t = Number(targetVal);

    if (g === t) return 'correct';
    if (g < t) return 'near';
    return 'higher';
}

// 5. RYSOWANIE KAFELKÓW NA EKRANIE
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
        teamStatus = 'near';
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
