BEGIN;

-- 1. Dodanie pięciu użytkowników
INSERT INTO users (login, email, password_hash, role) VALUES
    ('admin', 'admin@example.com', 'hash-placeholder-1', 'admin'),
    ('anna', 'anna@example.com', 'hash-placeholder-2', 'user'),
    ('piotr', 'piotr@example.com', 'hash-placeholder-3', 'user'),
    ('ola', 'ola@example.com', 'hash-placeholder-4', 'user'),
    ('jan', 'jan@example.com', 'hash-placeholder-5', 'user');

-- 2. Dodanie pięciu zadań
INSERT INTO tasks (title, description, status, user_id) VALUES
    ('Przygotować makietę', 'Ekran listy i formularza', 'done',
        (SELECT id FROM users WHERE login = 'anna')),

    ('Utworzyć tabele', 'Tabele users, tasks i comment', 'in_progress',
        (SELECT id FROM users WHERE login = 'anna')),

    ('Napisać README', 'Instrukcja uruchomienia projektu', 'new',
        (SELECT id FROM users WHERE login = 'piotr')),

    ('Przygotować logo', 'Logo aplikacji', 'done',
        (SELECT id FROM users WHERE login = 'ola')),

    ('Dodać filtrowanie', 'Filtrowanie zadań według statusu', 'new',
        (SELECT id FROM users WHERE login = 'jan'));

-- 3. Dodanie pięciu komentarzy
INSERT INTO comments (content, task_id, user_id) VALUES
    ('Makieta zaakceptowana.',
        (SELECT id FROM tasks WHERE title = 'Przygotować makietę'),
        (SELECT id FROM users WHERE login = 'admin')),

    ('Sprawdź klucze obce.',
        (SELECT id FROM tasks WHERE title = 'Utworzyć tabele'),
        (SELECT id FROM users WHERE login = 'admin')),

    ('Dodam opis instalacji.',
        (SELECT id FROM tasks WHERE title = 'Napisać README'),
        (SELECT id FROM users WHERE login = 'piotr')),

    ('Logo jest gotowe.',
        (SELECT id FROM tasks WHERE title = 'Przygotować logo'),
        (SELECT id FROM users WHERE login = 'ola')),

    ('Dodam filtrowanie według statusu.',
        (SELECT id FROM tasks WHERE title = 'Dodać filtrowanie'),
        (SELECT id FROM users WHERE login = 'jan'));

COMMIT;
