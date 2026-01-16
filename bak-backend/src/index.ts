import { Hono } from 'hono'
import { rideRoutes } from './api/ride/router';
import { upgradeWebSocket, websocket } from 'hono/bun'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("/health", (c) =>
  c.json({ ok: true, runtime: "bun", framework: "hono" })
);

app.route('/', rideRoutes)

export default {
  fetch: app.fetch,
  port: 3000,
  websocket,
}
