# Getting started
1. install `git`, `node`, `github cli`, `docker`
2. authenticate your git using `github cli`, by running `gh auth login`
3. clone the repo `git clone git@github.com:AmbuLink-CS-55/AmbuLink-mono.git`
4. cd into the project you are going to be working on
5. follow the Contributing guide.

## run Postgres with PostGIS
```sh
cd backend

docker build -t postgres-postgis .

docker run --name postgres-db \
  -e POSTGRES_PASSWORD=123 \
  -p 5432:5432 \
  -d postgres-postgis

```

## run Redis 
```sh
docker run -d -p 6379:6379 --name redis redis:7-alpine
```
these should not error, if they do let me know.

## setting up drizzle schema 
```sh
cd backend

npm run generate

npm run migrate

# to check out the database
npm run studio
```

## general tips
- before branching out run `git pull` to make sure everything is up to date 
- in each project there is a `package.json` file, in there under `"scripts"` there are commands you can run using `npm run <COMMAND>`.
- `npm run start` should work with every project.

# Useful Docs
- expo: https://docs.expo.dev/
- nestjs: https://docs.nestjs.com/ 
- uniwind: https://uniwind.dev/
- tailwind: https://tailwindcss.com/docs/
- drizzle: https://orm.drizzle.team/docs/overview
- socketio: https://socket.io/
- postgis: https://postgis.net/docs/manual-3.6/
- postgis with drizzle: https://orm.drizzle.team/docs/extensions/pg#postgis, https://orm.drizzle.team/docs/guides-/postgis-geometry-point
- ioredis: https://ioredis.com/
