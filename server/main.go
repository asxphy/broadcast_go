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

	mux.HandleFunc("/ws", handlers.WebSocketHandler)
	mux.Handle("/signup", handlers.SignUp(db))
	mux.Handle("/login", handlers.Login(db))
	mux.Handle("/logout", handlers.Logout())
	mux.Handle("/refresh", handlers.Refresh())
	mux.Handle("/auth/me", handlers.AuthDetails())
	mux.Handle("/channel/create", middleware.AuthMiddleWare(handlers.CreateChannel(db)))

	protected := middleware.AuthMiddleWare(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Authenticated"))
	}))

	mux.Handle("/me", protected)

	http.ListenAndServe(":8080", utils.CORSMiddleware(mux))
}
