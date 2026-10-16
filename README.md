# praktyka-project - Moje Zadania

Repo na praktyki, INF.03. Aplikacja do zapisywania zadań.

## Co to jest

Zwykła lista zadań. Można dodawać zadania, zmieniać status (do zrobienia / w trakcie / wykonane), edytować i usuwać. Do tego komentarze i logowanie (na razie prototyp).

## Gdzie co jest

```text
frontend/   - strona (index.html + style.css + app.js)
backend/    - tu później będzie API
database/   - baza PostgreSQL (schema.sql, seed.sql)
docs/       - opis, kolory, ERD
tests/      - co sprawdzałem ręcznie
```

## Jak odpalić

1. Otwierasz `frontend/index.html` w Chrome, nic nie trzeba instalować.
2. Baza: instalujesz PostgreSQL 18, hasło dajesz `postgres`, tworzysz bazę `taskmanager` i odpalasz `database/schema.sql`, potem `seed.sql`.

## Docs

- `docs/wymagania.md` - co program ma robić
- `docs/design.md` - jak ma wyglądać
- `docs/erd.md` - baza, tabele USERS, TASKS, COMMENTS
- `docs/notatki-markdown.md` - moje notatki z Markdown
