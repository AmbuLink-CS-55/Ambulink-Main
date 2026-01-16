# Plans and Notes
- will add auth after completing basics, it should be easy to just plug. https://docs.nestjs.com/security/authentication

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

# Tech Overview
## Nest cli
```sh
# nest generate <schematic> <name>
nest g co users              # controller
nest g s users               # service
nest g mo users              # module
nest g res users             # full CRUD resource
nest g pi users              # pipe
nest g gu users              # guard
```
