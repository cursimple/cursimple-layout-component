# Layout · CurSimple extension component

[中文](README.md)

Switches [CurSimple](https://github.com/cursimple/cursimple-app) navigation from the side drawer to a **bottom bar**:

- **Bottom bar**: Schedule stays first and "Me" stays last, with up to 3 entries in between (Memos and Components by default), reorderable by dragging
- **Switch back any time**: pick "Sidebar" in the component, or tap "Back to sidebar" under Settings → Sidebar in CurSimple; disabling or removing the component also returns to the sidebar
- **Nothing gets lost**: pages that are not on the bar are listed under "Me", together with the theme, schedule background, temporary changes and update shortcuts

The component and the app are decoupled: the available layouts, entries and ordering rules live in this component, while CurSimple only offers a generic layout capability and draws it. Future layouts will be added to this component.

Sidebar order and visibility do not need this component; adjust them under Settings → Sidebar in CurSimple.

## Install

Requires CurSimple **0.7.11** or later. Search for "布局" under Plugins → Components in CurSimple, or download `app-layout-v*.zip` from [Releases](../../releases) and import it with local install.

Open "布局" from the sidebar and choose "底边栏" (bottom bar).

## Development

```bash
npm test         # rules and manifest tests
npm run preview  # browser preview with a simulated host
npm run pack     # builds dist/app-layout-v<version>.zip and dist/manifest.json for the market
```

Preview parameters: `?mode=bottomBar`, `?theme=dark`, `?scale=1.3`, `?legacy=1` (older host), `?fail=1` (apply fails); use `/frame?w=320&…` for narrow screens.

Pushing a `v<version>` tag tests, packs and publishes a release; the tag must match the version in `manifest.json`.

## License

MIT. Icons are Google Material Icons Rounded (Apache-2.0, see `plugin-packages/app-layout/ui/material-icons.LICENSE.txt`).
