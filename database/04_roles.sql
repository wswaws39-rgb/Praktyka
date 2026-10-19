-- Uzytkownik z prawem SELECT do tabel aplikacji.
-- Uruchom jeden raz jako postgres w bazie task_manager.
-- Testy uprawnien wykonuj w tej samej sesji przez SET ROLE userek
-- oraz RESET ROLE. Przy tej metodzie nie jest potrzebne osobne logowanie.

CREATE ROLE userek LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;

GRANT CONNECT ON DATABASE task_manager TO userek;
GRANT USAGE ON SCHEMA public TO userek;
GRANT SELECT ON TABLE public.users, public.tasks, public.comment TO userek;

-- Zadanie 6 - rola uzytkownika aplikacji

-- Tworzenie roli task_app
CREATE ROLE task_app LOGIN
NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- Dostep do bazy danych
GRANT CONNECT ON DATABASE task_manager TO task_app;

-- Dostep do schematu public
GRANT USAGE ON SCHEMA public TO task_app;

-- Uprawnienia do tabel tasks i comment
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.tasks, public.comment
TO task_app;

-- Uprawnienia do tabeli users
-- Bez mozliwosci usuwania uzytkownikow
GRANT SELECT, INSERT, UPDATE
ON TABLE public.users
TO task_app;
