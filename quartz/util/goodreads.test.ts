import test, { describe } from "node:test"
import assert from "node:assert/strict"
import {
  attachNoteSlugs,
  decodeGoodreadsText,
  goodreadsRssUrl,
  normalizeBookTitle,
  parseGoodreadsRss,
  titlesOverlap,
} from "./goodreads"

const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <item>
      <title><![CDATA[The Midnight Library]]></title>
      <link><![CDATA[https://www.goodreads.com/review/show/1]]></link>
      <book_id>52578297</book_id>
      <book_large_image_url><![CDATA[https://example.com/cover.jpg]]></book_large_image_url>
      <author_name>Matt Haig</author_name>
      <isbn>0525559477</isbn>
      <user_rating>5</user_rating>
      <user_read_at><![CDATA[Fri, 14 Aug 2026 00:00:00 +0000]]></user_read_at>
      <user_date_added><![CDATA[Thu, 13 Aug 2026 02:13:21 -0700]]></user_date_added>
      <user_shelves>read, favorites</user_shelves>
      <average_rating>4.00</average_rating>
      <book_published>2020</book_published>
    </item>
    <item>
      <title>Project Hail Mary</title>
      <link>https://www.goodreads.com/review/show/2</link>
      <book_id>54493401</book_id>
      <book_medium_image_url>https://example.com/phm.jpg</book_medium_image_url>
      <author_name>Andy Weir</author_name>
      <isbn></isbn>
      <user_rating>0</user_rating>
      <user_read_at></user_read_at>
      <user_date_added>Sat, 15 Aug 2026 07:17:23 -0700</user_date_added>
      <user_shelves>currently-reading</user_shelves>
      <average_rating>4.50</average_rating>
      <book_published>2021</book_published>
    </item>
  </channel>
</rss>`

describe("goodreads RSS parsing", () => {
  test("extracts books and strips CDATA", () => {
    const books = parseGoodreadsRss(sampleRss)
    assert.equal(books.length, 2)
    assert.equal(books[0].title, "The Midnight Library")
    assert.equal(books[0].author, "Matt Haig")
    assert.equal(books[0].rating, 5)
    assert.equal(books[0].cover, "https://example.com/cover.jpg")
    assert.deepEqual(books[0].shelves, ["read", "favorites"])
    assert.equal(books[1].title, "Project Hail Mary")
    assert.equal(books[1].rating, 0)
    assert.equal(books[1].dateRead, null)
    assert.equal(books[1].cover, "https://example.com/phm.jpg")
  })

  test("decodes entities and HTML", () => {
    assert.equal(decodeGoodreadsText("<![CDATA[White Nights]]>"), "White Nights")
    assert.equal(decodeGoodreadsText("Hard &amp; soft"), "Hard & soft")
    assert.equal(decodeGoodreadsText("Hello<br/>world"), "Hello world")
  })

  test("builds the public RSS URL", () => {
    assert.equal(
      goodreadsRssUrl("190374561", "currently-reading", 20),
      "https://www.goodreads.com/review/list_rss/190374561?shelf=currently-reading&per_page=20",
    )
  })
})

describe("goodreads note matching", () => {
  test("normalizes leading articles and punctuation", () => {
    assert.equal(normalizeBookTitle("The Midnight Library"), "midnightlibrary")
    assert.equal(
      normalizeBookTitle("Hard thing about hard things - Ben Horowitz"),
      "hardthingabouthardthingsbenhorowitz",
    )
  })

  test("links a Goodreads title to an existing note", () => {
    const notes = [
      { slug: "books/MidnightLibrary", title: "Midnight Library - Haig, Matt" },
      {
        slug: "books/HardThingsAboutHardThings",
        title: "Hard thing about hard things - Ben Horowitz",
      },
    ]
    const books = attachNoteSlugs(
      [
        {
          id: "1",
          title: "The Midnight Library",
          author: "",
          link: "",
          cover: "",
          rating: 0,
          averageRating: 0,
          dateAdded: null,
          dateRead: null,
          shelves: [],
          published: "",
          isbn: "",
        },
        {
          id: "2",
          title: "Project Hail Mary",
          author: "",
          link: "",
          cover: "",
          rating: 0,
          averageRating: 0,
          dateAdded: null,
          dateRead: null,
          shelves: [],
          published: "",
          isbn: "",
        },
      ],
      notes,
    )
    assert.equal(books[0].noteSlug, "books/MidnightLibrary")
    assert.equal(books[1].noteSlug, undefined)
    assert(
      titlesOverlap(
        "The Hard Thing About Hard Things",
        "Hard thing about hard things - Ben Horowitz",
      ),
    )
  })
})
