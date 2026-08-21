import type { GoodreadsBook, GoodreadsData, GoodreadsShelf } from "../../util/goodreads"

type Mode = "full" | "currently-reading"

let cached: GoodreadsData | null = null
let inflight: Promise<GoodreadsData> | null = null

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function stars(rating: number): string {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)))
  if (rounded === 0) {
    return ""
  }
  return `<span class="goodreads-rating" aria-label="${rounded} out of 5 stars">${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}</span>`
}

function formatDate(raw: string | null): string {
  if (!raw) {
    return ""
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

function noteHref(root: string, slug: string): string {
  const prefix = root === "." ? "" : `${root}/`
  return `${prefix}${slug}`
}

function bookCard(book: GoodreadsBook, root: string): string {
  const cover = book.cover
    ? `<img src="${escapeHtml(book.cover)}" alt="" loading="lazy" />`
    : `<div class="goodreads-cover-fallback">${escapeHtml(book.title)}</div>`
  const dateLabel = book.dateRead
    ? `Finished ${formatDate(book.dateRead)}`
    : formatDate(book.dateAdded)
  const note = book.noteSlug
    ? `<a class="internal goodreads-note" href="${escapeHtml(noteHref(root, book.noteSlug))}">Reading notes</a>`
    : ""

  return `<li>
    <article class="goodreads-card">
      <a class="goodreads-cover" href="${escapeHtml(book.link)}" rel="noopener noreferrer">
        ${cover}
      </a>
      <div class="goodreads-meta">
        <a class="goodreads-title" href="${escapeHtml(book.link)}" rel="noopener noreferrer">${escapeHtml(book.title)}</a>
        <span class="goodreads-author">${escapeHtml(book.author)}</span>
        ${stars(book.rating)}
        ${dateLabel ? `<span class="goodreads-date">${escapeHtml(dateLabel)}</span>` : ""}
        ${note}
      </div>
    </article>
  </li>`
}

function shelfSection(shelf: GoodreadsShelf, root: string): string {
  if (shelf.books.length === 0) {
    return `<section class="goodreads-shelf" data-shelf="${escapeHtml(shelf.id)}">
      <h3 class="goodreads-shelf-title">${escapeHtml(shelf.label)} <span class="goodreads-shelf-count">0</span></h3>
      <p class="goodreads-status">Nothing on this shelf right now.</p>
    </section>`
  }

  return `<section class="goodreads-shelf" data-shelf="${escapeHtml(shelf.id)}">
    <h3 class="goodreads-shelf-title">${escapeHtml(shelf.label)} <span class="goodreads-shelf-count">${shelf.books.length}</span></h3>
    <ul class="goodreads-grid">
      ${shelf.books.map((book) => bookCard(book, root)).join("")}
    </ul>
  </section>`
}

function render(data: GoodreadsData, mode: Mode, root: string): string {
  const shelves =
    mode === "currently-reading"
      ? data.shelves.filter((shelf) => shelf.id === "currently-reading")
      : data.shelves
  const heading = mode === "currently-reading" ? "Currently reading" : "Goodreads shelves"
  const more =
    mode === "currently-reading"
      ? `<a class="goodreads-profile" href="${escapeHtml(noteHref(root, "books"))}">All shelves</a>`
      : `<a class="goodreads-profile" href="${escapeHtml(data.profileUrl)}" rel="noopener noreferrer">View on Goodreads</a>`

  if (!data.ok && shelves.every((shelf) => shelf.books.length === 0)) {
    return `<div class="goodreads-heading"><h2>${escapeHtml(heading)}</h2>${more}</div>
      <p class="goodreads-status">Couldn’t refresh Goodreads shelves just now. They’ll update on the next site build.</p>`
  }

  return `<div class="goodreads-heading"><h2>${escapeHtml(heading)}</h2>${more}</div>
    ${shelves.map((shelf) => shelfSection(shelf, root)).join("")}`
}

async function loadData(url: string): Promise<GoodreadsData> {
  if (cached) {
    return cached
  }
  if (!inflight) {
    inflight = fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load Goodreads data (${response.status})`)
        }
        return response.json() as Promise<GoodreadsData>
      })
      .then((data) => {
        cached = data
        return data
      })
      .catch((error) => {
        inflight = null
        throw error
      })
  }
  return inflight
}

async function renderShelves() {
  const roots = document.querySelectorAll<HTMLElement>(".goodreads-shelves")
  for (const root of roots) {
    const jsonUrl = root.dataset.json
    const mode = (root.dataset.mode as Mode | undefined) ?? "full"
    const pathRoot = root.dataset.root ?? "."
    if (!jsonUrl) {
      continue
    }

    root.innerHTML = `<p class="goodreads-status">Loading shelves from Goodreads…</p>`
    try {
      const data = await loadData(jsonUrl)
      root.innerHTML = render(data, mode, pathRoot)
    } catch {
      root.innerHTML = `<p class="goodreads-status">Couldn’t load Goodreads shelves.</p>`
    }
  }
}

document.addEventListener("nav", () => {
  void renderShelves()
})
