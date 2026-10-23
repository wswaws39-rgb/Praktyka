# Backend — Node.js, Express i PostgreSQL

Serwer udostępnia frontend i API pod jednym adresem:
http://127.0.0.1:3000. Dodawanie, edycja i usuwanie zadań zmieniają dane
w PostgreSQL. Po odświeżeniu strony zadania są ponownie pobierane z bazy.

## Wymagania

- [Node.js](https://nodejs.org/) 22 lub nowszy z npm.
- Działający PostgreSQL i istniejąca baza task_manager z tabelami projektu.
- pgAdmin do sprawdzenia bazy i konfiguracji roli połączenia.

pgAdmin zarządza bazą. Node.js uruchamia serwer aplikacji.

## 1. Przygotuj połączenie w pgAdmin

Połącz się z PostgreSQL, wybierz bazę task_manager i otwórz Query Tool:

~~~sql
SELECT current_database();
SELECT id, login FROM public.users ORDER BY id;
~~~

W istniejącej bazie z tabelami i rolą task_app wykonaj jako właściciel bazy
plik database/05_app_permissions.sql.

Dla nowej bazy task_manager wykonaj po kolei: 01_schema.sql, 02_seed.sql,
04_roles.sql, 05_app_permissions.sql. Pliki schematu, danych przykładowych
i tworzenia ról są przeznaczone do pierwszego przygotowania bazy;
plik 05 można wykonywać ponownie.

W drzewie serwera wybierz **Login/Group Roles → task_app → Properties →
Definition → Password**. Ustaw lokalne hasło tej roli i zapisz.

## 2. Przygotuj konfigurację na Windows

Pobierz i rozpakuj aktualną gałąź feature/frontend-crud.
Otwórz folder backend w Eksploratorze, kliknij pasek adresu,
wpisz powershell i naciśnij Enter.

Sprawdź Node.js, następnie utwórz plik konfiguracji:

~~~powershell
node --version
Copy-Item .env.example .env
notepad .env
~~~

Uzupełnij plik według ustawień swojego serwera PostgreSQL:

| Pole | Wartość |
|---|---|
| PGHOST | Adres PostgreSQL, zwykle 127.0.0.1 |
| PGPORT | Port PostgreSQL, zwykle 5432 |
| PGDATABASE | Nazwa istniejącej bazy, np. task_manager |
| PGUSER | Rola połączenia: task_app |
| PGPASSWORD | Hasło tej roli wewnątrz cudzysłowów |
| APP_USER_LOGIN | Login z tabeli users, np. anna |
| PORT | Port strony i API, domyślnie 3000 |

Zapisz i zamknij plik. Plik .env jest pomijany przez Git.
Zainstaluj zależności i uruchom serwer:

~~~powershell
npm.cmd ci
npm.cmd start
~~~

Na Linux/macOS użyj cp .env.example .env, edytuj plik i wykonaj
npm ci oraz npm start w katalogu backend.

## 3. Otwórz stronę

Otwórz **http://127.0.0.1:3000**. Serwer udostępnia HTML, CSS,
JavaScript i API /api/tasks. Pozostaw okno terminala otwarte.
Zatrzymanie serwera: **Ctrl+C**.

Otwarcie index.html przez file:/// nie uruchamia API.
Do działania z bazą używaj adresu HTTP.

## 4. Sprawdź zapis w pgAdmin

Dodaj na stronie zadanie, zmień jego status i odśwież stronę.
W Query Tool w tej samej bazie sprawdź dane:

~~~sql
SELECT id, title, description, status, user_id
FROM public.tasks
WHERE user_id = (SELECT id FROM public.users WHERE login = 'anna')
ORDER BY id DESC;
~~~

Jeśli wybrano inny APP_USER_LOGIN, użyj tego loginu w zapytaniu.
Po usunięciu zadania rekord znika z tasks. Komentarze do tego zadania
usuwa istniejąca relacja ON DELETE CASCADE.

## API

| Metoda | Adres | Wynik |
|---|---|---|
| GET | /api/tasks | 200, tablica zadań wybranego użytkownika |
| POST | /api/tasks | 201, utworzone zadanie |
| PUT | /api/tasks/{id} | 200, zaktualizowane zadanie |
| DELETE | /api/tasks/{id} | 204, puste ciało odpowiedzi |

POST i PUT przyjmują JSON z title, description i status.
Tytuł po usunięciu skrajnych spacji ma 1–200 znaków, opis jest opcjonalny.
Status: new, in_progress lub done. Klient nie może przesyłać user_id
ani dodatkowych pól.

Nieprawidłowe dane i identyfikator zwracają 400, brak zadania 404,
za duże ciało zapytania 413, a błąd serwera 500.
Limit ciała zapytania: 64 KiB. Parametry SQL przekazywane są przez $1, $2 itd.

## Użytkownik i zakres

Jest to lokalna aplikacja dla jednego użytkownika wskazanego przez
APP_USER_LOGIN. Serwer pobiera jego prawdziwy identyfikator z tabeli users
i ogranicza operacje na zadaniach do tego identyfikatora.
PGUSER jest rolą połączenia z PostgreSQL, a nie loginem użytkownika aplikacji.

Ten etap nie zawiera logowania i rejestracji. Serwer nasłuchuje wyłącznie
na 127.0.0.1, odrzuca obcy Host i pochodzenie żądania.
Udostępnienie aplikacji innym osobom wymaga mechanizmu uwierzytelniania.

## Testy

npm test sprawdza HTTP, walidację, błędy, ochronę konfiguracji
i ograniczenia lokalnego serwera.

npm run test:integration wymaga jawnego TEST_DATABASE_URL do oddzielnej
bazy o nazwie kończącej się na _test oraz konta z prawem tworzenia schematów
i ról. Test tworzy własny schemat, wczytuje pliki 01 i 02, łączy API przez
ograniczoną rolę i sprawdza rzeczywiste zmiany w PostgreSQL, kaskadę komentarzy
oraz rozdzielenie danych użytkowników. Następnie usuwa swój schemat i rolę.
Test nie korzysta z konfiguracji aplikacji w .env.

Workflow Backend CI uruchamia oba zestawy testów z PostgreSQL 16.
Workflow Frontend CI sprawdza HTML, CSS i składnię JavaScript.
