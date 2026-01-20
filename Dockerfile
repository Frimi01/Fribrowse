FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app

FROM alpine:3.22

WORKDIR /app

# Create non-root user
RUN adduser -D appuser

COPY --from=builder /app/app /app/app
COPY --from=builder /app/public /app/public

# For JSON storage support (optional)
RUN mkdir -p /app/data /app/backups && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 3002
ENTRYPOINT ["/app/app"]

