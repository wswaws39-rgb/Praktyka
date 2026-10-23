# Frontend — Moje zadania

## Funkcje

- Lista zadań oraz formularz dodawania i edycji.
- Usuwanie z potwierdzeniem.
- Zapytania `GET`, `POST`, `PUT` i `DELETE` przez `fetch`.
- Tytuł wymagany po usunięciu skrajnych spacji, maksymalnie 200 znaków.
- Statusy zgodne z bazą: `new`, `in_progress`, `done`.
- Komunikaty o braku połączenia, przekroczeniu czasu oczekiwania,
  błędnych danych, braku rekordu i błędzie serwera.
- Dane API są wyświetlane przez `textContent`; pola formularza przez `value`.
- Zachowanie danych formularza po nieudanym zapisie i blokada ponownych
  kliknięć podczas zapytania.
- Układ dla telefonu i komputera, zgodny z paletą i czcionkami z `docs/design.md`.

## Pliki

- `index.html` — struktura strony i formularza.
- `css/style.css` — kolory, wygląd i układ responsywny.
- `js/app.js` — walidacja, wyświetlanie danych i komunikacja z API.

## Uruchomienie

Serwer aplikacji powinien udostępniać katalog `frontend/` oraz API
`/api/tasks` w tej samej domenie. W `main` backend nie jest jeszcze
zaimplementowany: samo otwarcie frontendu nie uruchamia API ani bazy danych.

Sam wygląd strony można uruchomić lokalnie:

```bash
python -m http.server 8000 --directory frontend
```

Następnie otwórz `http://localhost:8000`.
Ten prosty serwer udostępnia pliki, ale nie obsługuje API.
Bez backendu strona pokaże komunikat o nieudanym pobraniu zadań.
Nie zastępuje bazy danych pamięcią przeglądarki ani danymi demonstracyjnymi.

Jeżeli backend działa pod innym adresem, zmień `API_URL` na początku
`js/app.js` i skonfiguruj dozwolone pochodzenie (CORS) po stronie backendu.

## Oczekiwany kontrakt API

| Metoda | Adres | Działanie |
|---|---|---|
| GET | `/api/tasks` | Pobranie tablicy zadań |
| POST | `/api/tasks` | Dodanie zadania |
| PUT | `/api/tasks/{id}` | Zapis zmian zadania |
| DELETE | `/api/tasks/{id}` | Usunięcie zadania |

Przykładowa odpowiedź na `GET /api/tasks`:

```json
[
  {
    "id": 1,
    "title": "Przygotować projekt",
    "description": "Dokończyć formularz i listę zadań.",
    "status": "new"
  }
]
```

Pusta lista to `[]`. `id` musi być dodatnią liczbą całkowitą lub jej
zapisem tekstowym. `description` może być tekstem, `null` albo nie występować.
Pozostałe wymienione pola są wymagane. Dodatkowe pola odpowiedzi są pomijane.

Treść `POST` i `PUT`:

```json
{
  "title": "Przygotować projekt",
  "description": "Dokończyć formularz i listę zadań.",
  "status": "in_progress"
}
```

Backend musi sam zweryfikować dane i uprawnienia oraz ustalić `user_id`
na podstawie zalogowanego użytkownika. Frontend nie wysyła fikcyjnego `user_id`.
Walidacja w przeglądarce nie zastępuje walidacji serwera.

Po udanym `POST`, `PUT` lub `DELETE` frontend ponownie pobiera listę.
Obsługuje odpowiedzi sukcesu z pustym ciałem, w tym `204 No Content`.
Błędy powinny zwracać odpowiedni status HTTP: `400`/`422`, `404` lub `5xx`.
Nie znaleziono zadania i nie znaleziono adresu API mogą mieć ten sam status
`404`, dlatego komunikat uwzględnia obie możliwości.

## Sprawdzenie

1. Sprawdź układ przy szerokości 390 px i 1280 px, również z długim tytułem.
2. Przy działającym API dodaj zadanie, edytuj je i usuń.
3. Sprawdź, czy kolejne zapytania `GET` pokazują zapisane zmiany.
4. Spróbuj wysłać pusty tytuł, same spacje i tytuł dłuższy niż 200 znaków.
5. Wyłącz API: powinien pojawić się komunikat, a wpisana treść ma pozostać
   w formularzu. Sprawdź także odpowiedzi `400`, `404` i `500`.
6. Wpisz w zadaniu tekst przypominający HTML. Musi być widoczny jako tekst.
7. Sprawdź w DevTools metody zapytań i przy działającym backendzie potwierdź
   zmiany w bazie danych.

Workflow `.github/workflows/ci.yaml` sprawdza HTML, CSS i składnię JavaScript
po utworzeniu Pull Request do `main`. Test działania z prawdziwą bazą
wymaga implementacji i uruchomienia backendu.
