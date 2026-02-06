# Cloning and Running the Project

## Getting started
1. install `git`, `node`, `github cli`, `docker`
2. authenticate your git using `github cli`, by running `gh auth login`
3. clone the repo `git clone git@github.com:AmbuLink-CS-55/AmbuLink-mono.git`
4. cd into the project you are going to be working on
5. follow the Contributing guide.

## setting up enviornmental variables
1. make a copy of `.env.example` and name it `.env`, do this for both backend and frontend.
2. for now you only have to change the value for `EXPO_PUBLIC_API_SERVER_URL`, `EXPO_PUBLIC_WS_SERVER_URL` in mobile,keep the port the same just change ip address to yours.

## run Postgres with PostGIS
```sh
cd backend

docker build -t postgres-postgis .

docker run --name postgres-db -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres-postgis
```

## setting up drizzle schema
```sh
cd backend

npm run generate
# this will generate a drizzle directory with a `.sql` file inside it. add `CREATE EXTENSION postgis;` at the top of the `.sql` file.

npm run migrate

npm run seed

# to check out the database (optional)
npm run studio
```
so far these should not error, if they do let me know.

## installing dependencies 
```sh
cd mobile 
npm i -y

cd ..

cd backend
npm i -y
```

# general tips
- before branching out run `git pull` to make sure everything is up to date 
- in each project there is a `package.json` file, in there under `"scripts"` there are commands you can run using `npm run <COMMAND>`.
- `npm run start` works with every project.

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
- https://kadajett.github.io/agent-nestjs-skills/
