import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { joinSegments, pathToRoot } from "../util/path"
// @ts-ignore
import script from "./scripts/goodreads.inline"
import style from "./styles/goodreads.scss"

interface Options {
  mode: "full" | "currently-reading"
}

const defaultOptions: Options = {
  mode: "full",
}

export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  const GoodreadsShelves: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    const root = pathToRoot(fileData.slug!)
    return (
      <div
        class={classNames(
          displayClass,
          "goodreads-shelves",
          opts.mode === "currently-reading" ? "compact" : "full",
        )}
        data-mode={opts.mode}
        data-root={root}
        data-json={joinSegments(root, "static/goodreads.json")}
      >
        <p class="goodreads-status">Loading shelves from Goodreads…</p>
      </div>
    )
  }

  GoodreadsShelves.css = style
  GoodreadsShelves.afterDOMLoaded = script
  return GoodreadsShelves
}) satisfies QuartzComponentConstructor
