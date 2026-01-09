import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.get("/health", (c) =>
  c.json({ ok: true, runtime: "bun", framework: "hono" })
);

export default app
