# Backup bazy danych PostgreSQL

## 1. Tworzenie kopii zapasowej
Kopię bazy task_manager wykonano w pgAdmin 4.

- Format: Custom
- Plik: task_manager.backup
- Baza danych: task_manager

## 2. Przywracanie bazy
1. Otwórz pgAdmin 4.
2. Wybierz bazę task_manager.
3. Kliknij Restore.
4. Wskaż plik task_manager.backup.
5. Rozpocznij przywracanie danych.

## 3. Weryfikacja
Po przywróceniu sprawdź dane:

SELECT COUNT(*) FROM public.comment;

## 4. Bezpieczeństwo
Przechowywanie kopii zapasowej na tym samym dysku co baza danych jest ryzykowne. W przypadku awarii dysku można utracić zarówno bazę, jak i jej kopię. Dlatego backup należy przechowywać również na innym nośniku.
