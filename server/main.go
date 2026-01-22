package main

import (
	"fmt"
	"my-app/server/internals/db"
	"my-app/server/internals/handlers"
	"my-app/server/internals/middleware"
	"my-app/server/internals/utils"
	"net/http"
	"os"
)

func main() {
	dsn := fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=disable",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

	dbConn, err := db.Connect(dsn)
	if err != nil {
		panic(err)
	}
	mux := http.NewServeMux()

	// WebSocket
	mux.HandleFunc("/ws", handlers.WebSocketHandler)

	// User
	mux.Handle("/signup", handlers.SignUp(dbConn))
	mux.Handle("/login", handlers.Login(dbConn))
	mux.Handle("/homefeed", middleware.AuthMiddleWare(handlers.HomeFeed(dbConn)))
	mux.Handle("/logout", handlers.Logout())
	mux.Handle("/refresh", handlers.Refresh())
	mux.Handle("/auth/me", handlers.AuthDetails())

	// Channel
	mux.Handle("/channel/get", middleware.AuthMiddleWare(handlers.GetChannel(dbConn)))
	mux.Handle("/channel/create", middleware.AuthMiddleWare(handlers.CreateChannel(dbConn)))
	mux.Handle("/channel/toggle-follow", middleware.AuthMiddleWare(handlers.ToggleFollowChannel(dbConn)))
	mux.Handle("/channel/search", middleware.AuthMiddleWare(handlers.SearchChannel(dbConn)))

	protected := middleware.AuthMiddleWare(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Authenticated"))
	}))

	mux.Handle("/me", protected)

	http.ListenAndServe(":8080", utils.CORSMiddleware(mux))
}
