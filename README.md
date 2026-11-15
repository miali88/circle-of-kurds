# Circle of Cards

A static directory with searchable cards, a table, location and sector filters, individual profiles, and CSV downloads. The public source ships with fictional sample records.

Run with Python 3.11 or newer and a SQLite build with JSON support.

```sh
python3 scripts/build.py
python3 -m http.server --bind 127.0.0.1 --directory dist 4173
```

Open [the local preview](http://127.0.0.1:4173/). The build creates the SQLite database at `data/circle-of-cards.sqlite`, the export at `data/directory.csv`, and the static site in `dist/`.

Edit `data/businesses.json` to add your listings. Each record contains its trading location, founders, ownership evidence, and source links. To add a logo you have permission to use, save it as `site/logos/<record-id>.png` and rebuild. Record the image source in `logoSource`.

See [the hero prompt and AI SDK review workflow](HERO-IMAGE.md) and the [MIT licence](LICENSE).
