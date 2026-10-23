-- Wykonaj jako właściciel bazy w istniejącej bazie task_manager.
-- Rola task_app jest utworzona w 04_roles.sql.
-- Skrypt nie zmienia danych ani hasła roli i można go uruchamiać ponownie.
GRANT USAGE, SELECT ON SEQUENCE public.tasks_id_seq TO task_app;
