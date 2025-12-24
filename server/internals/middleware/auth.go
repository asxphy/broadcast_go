package middleware

import (
	"my-app/server/internals/utils"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleWare(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		cookie, err := r.Cookie("access_token")
		if err != nil || cookie.Value == "" {
			http.Error(w, "missing token", 401)
			return
		}

		token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
			return utils.Secret(), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "invalid token", 401)
			return
		}
		next.ServeHTTP(w, r)

	})
}
