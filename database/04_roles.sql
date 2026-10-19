-- Role uzytkownikow bazy danych

-- Tworzenie rol, jesli jeszcze nie istnieja
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'userek'
    ) THEN
        CREATE ROLE userek LOGIN
        NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_roles WHERE rolname = 'task_app'
    ) THEN
        CREATE ROLE task_app LOGIN
        NOSUPERUSER NOCREATEDB NOCREATEROLE;
    END IF;
END
$$;

-- Dostep do bazy i schematu
GRANT CONNECT ON DATABASE task_manager
TO userek, task_app;

GRANT USAGE ON SCHEMA public
TO userek, task_app;

-- Userek: tylko odczyt
GRANT SELECT
ON TABLE public.users, public.tasks, public.comments
TO userek;

-- Task_app: odczyt i modyfikacja zadan i komentarzy
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.tasks, public.comments
TO task_app;

-- Task_app: bez prawa usuwania uzytkownikow
GRANT SELECT, INSERT, UPDATE
ON TABLE public.users
TO task_app;
