package main

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var (
	connections = make(map[*websocket.Conn]bool)
	mu          sync.Mutex
)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Upgrade error:", err)
	}
	mu.Lock()
	connections[conn] = true
	log.Println("USER Connected")
	log.Println("Total connections:", len(connections))
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(connections, conn)
		mu.Unlock()
		conn.Close()
		log.Println("User disconnected")
	}()

	for {
		messageType, p, err := conn.ReadMessage()
		if err != nil {
			log.Println(err)
			return
		}
		mu.Lock()
		for client := range connections {
			if conn != client {
				// log.Println("Broadcasting data to other clients")
				if err := client.WriteMessage(messageType, p); err != nil {
					log.Println("Broadcast error:", err)
					client.Close()
					delete(connections, client)
				}
			}
		}
		mu.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleWebSocket)
	http.ListenAndServe(":8080", nil)
}
