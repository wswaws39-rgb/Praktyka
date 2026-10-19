-- Zadanie 6: uzytkownik z prawem SELECT do tabel aplikacji.
-- Uruchom jeden raz jako postgres w bazie task_manager.
-- Testy uprawnien wykonuj w tej samej sesji przez SET ROLE userek
-- oraz RESET ROLE. Przy tej metodzie nie jest potrzebne osobne logowanie.

CREATE ROLE userek LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE;

GRANT CONNECT ON DATABASE task_manager TO userek;
GRANT USAGE ON SCHEMA public TO userek;
GRANT SELECT ON TABLE public.users, public.tasks, public.comment TO userek;
