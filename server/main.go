package main

import (
	"fmt"
	"log"
	"my-app/server/internals/db"
	"my-app/server/internals/handlers"
	"my-app/server/internals/middleware"
	"my-app/server/internals/utils"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func serveReact(mux *http.ServeMux) {
	fs := http.FileServer(http.Dir("../frontend/dist"))

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		path := "../frontend/dist" + r.URL.Path

		// Serve file if it exists
		if _, err := os.Stat(path); err == nil {
			fs.ServeHTTP(w, r)
			return
		}

		// Otherwise serve index.html (React Router)
		http.ServeFile(w, r, "../frontend/dist/index.html")
	})
}
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}
	fmt.Printf(
		"hey user=%s password=%s host=%s port=%s db=%s\n",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("DB_NAME"),
	)

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
	// if err := db.RunMigrations(dbConn); err != nil {
	// 	log.Fatal("migration failed:", err)
	// }
	mux := http.NewServeMux()

	serveReact(mux)

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
