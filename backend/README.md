

# Setup
## db 
```sh
docker run --name postgres-db -e POSTGRES_PASSWORD=mypassword -p 5432:5432 -d postgres:18
```
```sh
docker run -d -p 6379:6379 --name redis redis:7-alpine
```
```sh
npm run generate
npm run migrate
```
