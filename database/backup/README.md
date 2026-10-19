# Backup bazy danych PostgreSQL

## 1. Tworzenie kopii zapasowej
Kopię bazy task_manager wykonano w pgAdmin 4.

- Format: Custom
- Plik: task_manager_final.backup
- Baza danych: task_manager

## 2. Przywracanie bazy
1. Otwórz pgAdmin 4.
2. Wybierz bazę task_manager.
3. Kliknij Restore.
4. Wskaż plik task_manager_final.backup.
5. Rozpocznij przywracanie danych.

## 3. Weryfikacja
Po przywróceniu sprawdź dane:

SELECT
    (SELECT COUNT(*) FROM public.users) AS users,
    (SELECT COUNT(*) FROM public.tasks) AS tasks,
    (SELECT COUNT(*) FROM public.comments) AS comments;

## 4. Bezpieczeństwo
Przechowywanie kopii zapasowej na tym samym dysku co baza danych jest ryzykowne. W przypadku awarii dysku można utracić zarówno bazę, jak i jej kopię. Dlatego backup należy przechowywać również na innym nośniku.

## 5. Wynik testu przywracania

Utworzono testową bazę task_manager_check.

Przywrócono kopię zapasową za pomocą pgAdmin 4.

Wyniki weryfikacji:
- users: 6 rekordów
- tasks: 5 rekordów
- comment: 5 rekordów

Przywracanie zakończyło się sukcesem.
Wszystkie trzy tabele zostały odtworzone
wraz z danymi.
Powyższy test dotyczy poprzedniej kopii zapasowej.
Nowa kopia task_manager_final.backup wymaga
ponownej weryfikacji przywracania.
