package sse

import (
	"encoding/json"
	"fmt"
	"log"
	"sync"
)

type Hub struct {
	clients    map[chan string]bool
	clientsMu  sync.RWMutex
	register   chan chan string
	unregister chan chan string
	broadcast  chan string
}

func NewHub() *Hub {
	hub := &Hub{
		clients:    make(map[chan string]bool),
		register:   make(chan chan string),
		unregister: make(chan chan string),
		broadcast:  make(chan string, 100),
	}
	go hub.run()
	return hub
}

func (h *Hub) run() {
	for {
		select {
		case ch := <-h.register:
			h.clientsMu.Lock()
			h.clients[ch] = true
			count := len(h.clients)
			h.clientsMu.Unlock()
			log.Printf("[SSE] Client subscribed. Active connections: %d", count)

		case ch := <-h.unregister:
			h.clientsMu.Lock()
			if _, ok := h.clients[ch]; ok {
				delete(h.clients, ch)
				close(ch)
			}
			count := len(h.clients)
			h.clientsMu.Unlock()
			log.Printf("[SSE] Client unsubscribed. Active connections: %d", count)

		case msg := <-h.broadcast:
			h.clientsMu.RLock()
			for ch := range h.clients {
				select {
				case ch <- msg:
				default:
					log.Printf("[SSE] Buffer full, dropped message for slow client")
				}
			}
			h.clientsMu.RUnlock()
		}
	}
}

func (h *Hub) Register(ch chan string) {
	h.register <- ch
}

func (h *Hub) Unregister(ch chan string) {
	h.unregister <- ch
}

func (h *Hub) Broadcast(eventName string, data interface{}) {
	payload, err := json.Marshal(data)
	if err != nil {
		log.Printf("[SSE] Error marshaling event data: %v", err)
		return
	}
	formatted := fmt.Sprintf("event: %s\ndata: %s\n\n", eventName, string(payload))
	h.broadcast <- formatted
}
