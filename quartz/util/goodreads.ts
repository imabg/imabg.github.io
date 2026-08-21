export interface GoodreadsBook {
  id: string
  title: string
  author: string
  link: string
  cover: string
  rating: number
  averageRating: number
  dateAdded: string | null
  dateRead: string | null
  shelves: string[]
  published: string
  isbn: string
  noteSlug?: string
}

export interface GoodreadsShelf {
  id: string
  label: string
  books: GoodreadsBook[]
}

export interface GoodreadsData {
  fetchedAt: string
  profileUrl: string
  userId: string
  shelves: GoodreadsShelf[]
  ok: boolean
  error?: string
}

export interface GoodreadsShelfConfig {
  id: string
  label: string
  limit: number
}

export interface GoodreadsFetchOptions {
  userId: string
  shelves: GoodreadsShelfConfig[]
}

const DEFAULT_UA = "Mozilla/5.0 (compatible; imabg.in Goodreads sync; +https://imabg.in)"

export function goodreadsProfileUrl(userId: string): string {
  return `https://www.goodreads.com/user/show/${userId}`
}

export function goodreadsRssUrl(userId: string, shelf: string, limit: number): string {
  const params = new URLSearchParams({
    shelf,
    per_page: String(Math.max(1, Math.min(limit, 200))),
  })
  return `https://www.goodreads.com/review/list_rss/${userId}?${params.toString()}`
}

function firstTag(xml: string, name: string): string {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i")
  const match = xml.match(re)
  return match?.[1] ?? ""
}

export function decodeGoodreadsText(raw: string): string {
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function optionalDate(raw: string): string | null {
  const value = decodeGoodreadsText(raw)
  return value.length > 0 ? value : null
}

function toNumber(raw: string): number {
  const value = Number.parseFloat(decodeGoodreadsText(raw))
  return Number.isFinite(value) ? value : 0
}

export function parseGoodreadsRss(xml: string): GoodreadsBook[] {
  const chunks = xml.split(/<item>/i).slice(1)
  const books: GoodreadsBook[] = []

  for (const chunk of chunks) {
    const item = chunk.split(/<\/item>/i)[0] ?? ""
    const id = decodeGoodreadsText(firstTag(item, "book_id"))
    const title = decodeGoodreadsText(firstTag(item, "title"))
    if (!id && !title) {
      continue
    }

    const cover =
      decodeGoodreadsText(firstTag(item, "book_large_image_url")) ||
      decodeGoodreadsText(firstTag(item, "book_medium_image_url")) ||
      decodeGoodreadsText(firstTag(item, "book_image_url"))

    const shelves = decodeGoodreadsText(firstTag(item, "user_shelves"))
      .split(",")
      .map((shelf) => shelf.trim())
      .filter((shelf) => shelf.length > 0)

    books.push({
      id: id || title,
      title,
      author: decodeGoodreadsText(firstTag(item, "author_name")),
      link: decodeGoodreadsText(firstTag(item, "link")),
      cover,
      rating: toNumber(firstTag(item, "user_rating")),
      averageRating: toNumber(firstTag(item, "average_rating")),
      dateAdded: optionalDate(firstTag(item, "user_date_added")),
      dateRead: optionalDate(firstTag(item, "user_read_at")),
      shelves,
      published: decodeGoodreadsText(firstTag(item, "book_published")),
      isbn: decodeGoodreadsText(firstTag(item, "isbn")),
    })
  }

  return books
}

export function normalizeBookTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, "")
    .replace(/[^a-z0-9]+/g, "")
}

export function titlesOverlap(bookTitle: string, noteTitle: string): boolean {
  const book = normalizeBookTitle(bookTitle)
  const note = normalizeBookTitle(noteTitle)
  if (!book || !note) {
    return false
  }
  return book === note || book.includes(note) || note.includes(book)
}

export interface NoteCandidate {
  slug: string
  title: string
}

export function matchNoteSlug(bookTitle: string, notes: NoteCandidate[]): string | undefined {
  return notes.find((note) => titlesOverlap(bookTitle, note.title))?.slug
}

export function attachNoteSlugs(books: GoodreadsBook[], notes: NoteCandidate[]): GoodreadsBook[] {
  return books.map((book) => {
    const noteSlug = matchNoteSlug(book.title, notes)
    return noteSlug ? { ...book, noteSlug } : book
  })
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": DEFAULT_UA,
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    throw new Error(`Goodreads RSS ${response.status} for ${url}`)
  }
  return response.text()
}

export async function fetchGoodreadsShelves(opts: GoodreadsFetchOptions): Promise<GoodreadsData> {
  const profileUrl = goodreadsProfileUrl(opts.userId)
  const fetchedAt = new Date().toISOString()
  const errors: string[] = []
  const shelves: GoodreadsShelf[] = []

  for (const shelf of opts.shelves) {
    try {
      const xml = await fetchText(goodreadsRssUrl(opts.userId, shelf.id, shelf.limit))
      shelves.push({
        id: shelf.id,
        label: shelf.label,
        books: parseGoodreadsRss(xml).slice(0, shelf.limit),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${shelf.id}: ${message}`)
      shelves.push({
        id: shelf.id,
        label: shelf.label,
        books: [],
      })
    }
  }

  const ok = shelves.some((shelf) => shelf.books.length > 0) || errors.length === 0
  return {
    fetchedAt,
    profileUrl,
    userId: opts.userId,
    shelves,
    ok,
    error: errors.length > 0 ? errors.join("; ") : undefined,
  }
}
