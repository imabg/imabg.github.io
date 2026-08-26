# imabg.github.io

Personal site for [Abhay Goswami](https://imabg.github.io). Notes and updates on backend systems, plus what I’m currently reading.

Built with [Hugo](https://gohugo.io/). GitHub Pages deploys on every push to `master`, and again every Sunday so the Goodreads shelf stays current.

## Local

Hugo extended **0.165.0+**:

```bash
hugo server
```

Open http://localhost:1313/.

## Write a post

```bash
hugo new posts/my-update.md
```

Set `draft: false`, add a title and date, then put the file in `content/posts/`. Optional `tags` and `categories` (`papers`, `books`, `notes`, `podcasts`).

## Currently reading

The homepage section has two sources:

1. **Manual items** (papers, books, anything) — edit [`data/reading.yaml`](data/reading.yaml):

   ```yaml
   items:
     - title: "MapReduce: Simplified Data Processing on Large Clusters"
       authors: "Dean and Ghemawat"
       type: paper          # paper | book | article
       url: https://...
       source: OSDI 2004
   ```

   An empty `items:` list hides the manual group.

2. **Goodreads currently-reading** — fetched at build time from user `190374561`. No client-side JavaScript. If Goodreads is down, the rest of the site still builds.

## Deploy

Push to `master`, or run the **Deploy Hugo site to GitHub Pages** workflow. The Sunday cron rebuild exists so the Goodreads shelf updates without a content change.
