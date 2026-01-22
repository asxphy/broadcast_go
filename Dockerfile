# -------- Build backend --------
FROM golang:1.24-alpine AS backend-builder

WORKDIR /app

COPY server/go.mod server/go.sum ./server/
WORKDIR /app/server
RUN go mod download

COPY server .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app

FROM alpine:latest

WORKDIR /app

COPY --from=backend-builder /app/server/app .

COPY frontend/dist ./frontend/dist

COPY server/migrations ./migrations
COPY server/.env /app/

EXPOSE 8080

CMD ["./app"]
