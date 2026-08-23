package auth

import "database/sql"

type Repository struct {
	DB *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		DB: db,
	}
}

func (r *Repository) FindByEmail(email string) (*User, error) {
	var user User

	query := `
	SELECT id, username, email, password_hash, role, created_at
	FROM users
	WHERE email=$1
	`

	err := r.DB.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) Create(user *User) error {
	query := `
	INSERT INTO users (username, email, password_hash, role)
	VALUES ($1, $2, $3, $4)
	RETURNING id, created_at
	`

	return r.DB.QueryRow(
		query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.Role,
	).Scan(&user.ID, &user.CreatedAt)
}