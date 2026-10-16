# Co ma robić apka

## Musi być

1. Logowanie - email + hasło, jak złe to błąd.
2. Lista zadań - widać tytuł, opis, status.
3. Dodawanie - tytuł wymagany, bez tytułu nie zapisze.
4. Edycja - można zmienić wszystko.
5. Usuwanie - pyta "czy na pewno", kasuje też komentarze.
6. Komentarze do zadań.
7. Szukanie i filtr po statusie.

Statusy: do zrobienia, w trakcie, wykonane.

## Inne

- Ma działać na telefonie (jedna kolumna).
- Kolory czytelne, kontrast powyżej 4,5.
- Baza PostgreSQL.

## Kiedy uznaję że działa

- [ ] pusta lista pokazuje "brak zadań"
- [ ] bez tytułu nie da się dodać
- [ ] złe hasło pokazuje błąd
- [ ] schema.sql odpala się bez błędów
