package model

// Model represents a placeholder data model for the application.
type Model struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// New creates a new Model instance.
func New(id, name string) *Model {
	return &Model{ID: id, Name: name}
}
