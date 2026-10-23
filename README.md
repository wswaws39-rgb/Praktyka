# Praktyka — internetowy system zarządzania zadaniami

## Opis projektu

Projekt jest aplikacją internetową do zarządzania zadaniami. Użytkownik będzie mógł zapisywać zadania, przeglądać je i aktualizować ich status. Aplikacja pomoże sprawdzić, co jeszcze trzeba zrobić i które zadania zostały zakończone.

## Cel projektu

Celem aplikacji jest ułatwienie organizacji pracy. Podczas realizacji projektu uczymy się tworzyć interfejs użytkownika, przygotowywać część serwerową i korzystać z bazy danych. Ćwiczymy także pracę z Git, GitHub i automatyczne sprawdzanie kodu.

## Planowane funkcjonalności

- Dodawanie zadań z tytułem i opisem.
- Wyświetlanie zadań w trzech kolumnach według statusu.
- Edytowanie i usuwanie zadań.
- Zmiana statusu: do zrobienia, w trakcie lub zakończone.
- Wyszukiwanie i filtrowanie zadań.
- Zapisywanie zadań w bazie danych.

## Planowane technologie

- HTML — struktura stron i formularzy.
- CSS — wygląd interfejsu.
- JavaScript — obsługa działań użytkownika i komunikacja z API.
- PostgreSQL — przechowywanie danych.
- Node.js i Express — serwer HTTP i API obsługujące zadania.

## Narzędzia

- Git — zapisywanie historii zmian.
- GitHub — przechowywanie repozytorium i przegląd zmian przez pull requesty.
- GitHub Actions — automatyczne sprawdzanie kodu.
- Markdown — tworzenie dokumentacji.

## Struktura projektu

- `frontend/` — interfejs widoczny dla użytkownika.
- `backend/` — obsługa zapytań, logika aplikacji i komunikacja z bazą danych.
- `database/` — pliki związane z bazą danych.
- `docs/` — dodatkowa dokumentacja.
- `tests/` — testy aplikacji.
- `.github/workflows/` — konfiguracja GitHub Actions.

## Dokumentacja poszczególnych części

- [Dokumentacja frontendu](frontend/README.md)
- [Dokumentacja backendu](backend/README.md)

## Uruchomienie

Przygotuj PostgreSQL według [instrukcji backendu](backend/README.md).
W katalogu `backend` skopiuj `.env.example` do `.env` i uzupełnij dane
lokalnej bazy, następnie wykonaj `npm ci` oraz `npm start`.

Otwórz `http://127.0.0.1:3000`. Ten serwer udostępnia frontend i API.
pgAdmin pozwala sprawdzić, czy dodawanie, edycja i usuwanie zmieniają dane.
Pełna instrukcja dla Windows znajduje się w `backend/README.md`.

## Pierwsze zajęcia

Poznaliśmy prowadzącego, zasady BHP, organizację praktyk i wymagania projektu. Założyliśmy konta GitHub oraz utworzyliśmy lokalne repozytorium.

Ćwiczyliśmy operacje commit, push i pull, tworzenie pull requestów oraz rozwiązywanie konfliktów. Zabezpieczyliśmy gałąź main przed bezpośrednimi zmianami i dodaliśmy workflow GitHub Actions sprawdzający kod.
