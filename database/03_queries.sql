-- 1. Loginy i adresy e-mail, alfabetycznie według loginu
SELECT login, email
FROM users
ORDER BY login ASC;


-- 2. Tytuły i statusy zakończonych zadań
SELECT title, status
FROM tasks
WHERE status = 'done';


-- 3. Liczba zadań w każdym statusie, od największej liczby
SELECT status, COUNT(*) AS liczba_zadan
FROM tasks
GROUP BY status
ORDER BY liczba_zadan DESC, status ASC;


-- 4. Tytuł każdego zadania i login jego autora
SELECT t.title, u.login AS autor
FROM tasks AS t
JOIN users AS u ON u.id = t.user_id
ORDER BY t.id;

-- 5. INSERT - dodawanie nowego zadania
INSERT INTO tasks (title, description, status, user_id)
VALUES (
    'Zadanie testowe CRUD',
    'Test dodawania zadania',
    'new',
    (SELECT id FROM users WHERE login = 'anna')
);

-- 6. UPDATE - aktualizacja statusu zadania
UPDATE tasks
SET status = 'in_progress'
WHERE title = 'Zadanie testowe CRUD';

-- 7. DELETE - usuwanie zadania
DELETE FROM tasks
WHERE title = 'Zadanie testowe CRUD';
