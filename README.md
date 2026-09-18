# imabg.github.io

Personal site for [Abhay Goswami](https://imabg.github.io). Notes and updates on backend systems, plus what I’m currently reading.

Built with [Hugo](https://gohugo.io/). GitHub Pages deploys on every push to `master`, and again every Sunday so the Goodreads shelf stays current.

## Local

Hugo extended **0.165.0+**:

```bash
hugo server
```

Open http://localhost:1313/.

## Add a paper

Edit [`data/papers.yaml`](data/papers.yaml). It is a YAML list (`site.Data.papers`). Append an item:

```yaml
- title: Paper title
  authors: Author names
  venue: OSDI
  year: 2006
  topics: [databases]
  url: https://example.com/paper.pdf
  # blurb: optional one-liner
```

`authors`, `venue`, and `year` may be empty. `blurb` is optional.

## Write an article

```bash
hugo new articles/my-notes.md
```

Set `draft: false`, add a title and date. Files live in `content/articles/`. Optional `tags`. For a page bundle (notes plus images), use a folder with `index.md`.

## Add a conference

Edit [`data/conferences.yaml`](data/conferences.yaml). It is a YAML list. Append an item:

```yaml
- title: Conference Name
  year: 2026
  link: https://example.com
  topics: [systems, go]
```

## Add a technical book

Edit [`data/books.yaml`](data/books.yaml). It is a YAML list (`site.Data.books`). Append an item:

```yaml
- title: Book title
  authors: Author name
  source: O'Reilly
  url: https://...
  status: reading          # reading | read
```

`status: reading` shows on the homepage and under **In progress**. `status: read` shows under **Already read**. Goodreads books stay on the homepage shelf and are not listed here.

## Currently reading

The homepage section has two sources:

1. **Manual items** (papers and articles) — edit [`data/reading.yaml`](data/reading.yaml):

   ```yaml
   items:
     - title: "MapReduce: Simplified Data Processing on Large Clusters"
       authors: "Dean and Ghemawat"
       type: paper          # paper | article
       url: https://...
       source: OSDI 2004
   ```

   An empty `items:` list hides the manual group. Technical books come from [`data/books.yaml`](data/books.yaml) (`status: reading`).

2. **Goodreads currently-reading** — fetched at build time from user `190374561`. No client-side JavaScript. If Goodreads is down, the rest of the site still builds.

## Deploy

Push to `master`, or run the **Deploy Hugo site to GitHub Pages** workflow. The Sunday cron rebuild exists so the Goodreads shelf updates without a content change.
