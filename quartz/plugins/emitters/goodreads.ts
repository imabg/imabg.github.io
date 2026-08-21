import { QuartzEmitterPlugin } from "../types"
import { write } from "./helpers"
import {
  attachNoteSlugs,
  fetchGoodreadsShelves,
  GoodreadsFetchOptions,
  GoodreadsShelfConfig,
  NoteCandidate,
} from "../../util/goodreads"
import { FullSlug } from "../../util/path"

export interface GoodreadsOptions extends GoodreadsFetchOptions {}

const defaultShelves: GoodreadsShelfConfig[] = [
  { id: "currently-reading", label: "Currently reading", limit: 20 },
  { id: "read", label: "Recently finished", limit: 24 },
  { id: "to-read", label: "Want to read", limit: 24 },
]

export const Goodreads: QuartzEmitterPlugin<Partial<GoodreadsOptions>> = (userOpts) => {
  const opts: GoodreadsOptions = {
    userId: userOpts?.userId ?? "",
    shelves: userOpts?.shelves ?? defaultShelves,
  }

  return {
    name: "Goodreads",
    async *emit(ctx, content) {
      if (!opts.userId) {
        console.warn("Goodreads plugin: missing userId, skipping shelf sync")
        return
      }

      const notes: NoteCandidate[] = content
        .map(([, file]) => ({
          slug: file.data.slug ?? "",
          title: String(file.data.frontmatter?.title ?? ""),
        }))
        .filter((note) => note.slug.startsWith("books/") && note.slug !== "books/index")

      const data = await fetchGoodreadsShelves(opts)
      data.shelves = data.shelves.map((shelf) => ({
        ...shelf,
        books: attachNoteSlugs(shelf.books, notes),
      }))

      if (!data.ok) {
        console.warn(`Goodreads plugin: shelf sync failed (${data.error ?? "unknown error"})`)
      } else if (data.error) {
        console.warn(`Goodreads plugin: partial shelf sync (${data.error})`)
      }

      yield write({
        ctx,
        slug: "static/goodreads" as FullSlug,
        ext: ".json",
        content: JSON.stringify(data),
      })
    },
    async *partialEmit() {},
  }
}
