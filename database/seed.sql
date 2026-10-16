-- Dane przykładowe (psql -U postgres -d taskmanager -f database/seed.sql)

INSERT INTO users (username, email, password_hash) VALUES
  ('jan_kowalski', 'jan@example.com', '$2b$12$przykladHASHjanxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
  ('anna_nowak', 'anna@example.com', '$2b$12$przykladHASHannaXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
ON CONFLICT (email) DO NOTHING;

INSERT INTO tasks (user_id, title, description, status, due_date) VALUES
  ((SELECT id FROM users WHERE email='jan@example.com'), 'Przygotować ERD', 'Tabele USERS, TASKS, COMMENTS', 'in_progress', CURRENT_DATE + 2),
  ((SELECT id FROM users WHERE email='jan@example.com'), 'Zrobić makiety', 'Lista, formularz, logowanie', 'done', CURRENT_DATE - 1),
  ((SELECT id FROM users WHERE email='anna@example.com'), 'Zainstalować PostgreSQL 18', 'Port domyślny, hasło postgres', 'todo', CURRENT_DATE + 5)
ON CONFLICT DO NOTHING;

INSERT INTO comments (task_id, user_id, content) VALUES
  ((SELECT id FROM tasks WHERE title='Przygotować ERD' LIMIT 1),
   (SELECT id FROM users WHERE email='anna@example.com'),
   'Pamiętaj o ON DELETE CASCADE przy task_id.');
