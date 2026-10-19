-- Tabela użytkowników
CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    login VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Tabela zadań
CREATE TABLE tasks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(200) NOT NULL
        CHECK (length(trim(title)) > 0),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'new'
        CHECK (status IN ('new', 'in_progress', 'done')),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    user_id INT NOT NULL REFERENCES users(id)
);

-- Tabela komentarzy
CREATE TABLE comment (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    task_id INT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id)
);
