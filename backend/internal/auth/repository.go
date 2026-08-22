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
	SELECT user_id, username, email, password_hash, role
	FROM users
	WHERE email=$1
	`

	err := r.DB.QueryRow(query, email).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}
func (r *Repository) Create(user *User) error {

	query := `
	INSERT INTO users(username,email,password_hash,role)
	VALUES($1,$2,$3,$4)
	`

	_, err := r.DB.Exec(
		query,
		user.Username,
		user.Email,
		user.PasswordHash,
		user.Role,
	)

	return err
}
