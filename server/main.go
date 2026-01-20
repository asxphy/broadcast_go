package main

import (
	"my-app/server/internals/db"
	"my-app/server/internals/handlers"
	"my-app/server/internals/middleware"
	"my-app/server/internals/utils"
	"net/http"
)

func main() {
	dsn := "postgres://postgres:password@localhost:5432/appdb?sslmode=disable"
	db, _ := db.Connect(dsn)

	mux := http.NewServeMux()

	// WebSocket
	mux.HandleFunc("/ws", handlers.WebSocketHandler)

	// User
	mux.Handle("/signup", handlers.SignUp(db))
	mux.Handle("/login", handlers.Login(db))
	mux.Handle("/homefeed", middleware.AuthMiddleWare(handlers.HomeFeed(db)))
	mux.Handle("/logout", handlers.Logout())
	mux.Handle("/refresh", handlers.Refresh())
	mux.Handle("/auth/me", handlers.AuthDetails())

	// Channel
	mux.Handle("/channel/get", middleware.AuthMiddleWare(handlers.GetChannel(db)))
	mux.Handle("/channel/create", middleware.AuthMiddleWare(handlers.CreateChannel(db)))
	mux.Handle("/channel/toggle-follow", middleware.AuthMiddleWare(handlers.ToggleFollowChannel(db)))
	mux.Handle("/channel/search", middleware.AuthMiddleWare(handlers.SearchChannel(db)))

	protected := middleware.AuthMiddleWare(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Authenticated"))
	}))

	mux.Handle("/me", protected)

	http.ListenAndServe(":8080", utils.CORSMiddleware(mux))
}
