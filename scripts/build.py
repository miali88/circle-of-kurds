"""Rebuild the SQLite database, then export it for the site and as CSV."""

import csv
import json
import shutil
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SITE = ROOT / "site"
DIST = ROOT / "dist"

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE businesses (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL,
    area TEXT NOT NULL, region TEXT NOT NULL, sector TEXT NOT NULL,
    kind TEXT NOT NULL, status TEXT NOT NULL, description TEXT NOT NULL,
    founders TEXT NOT NULL CHECK (json_valid(founders)),
    owner TEXT NOT NULL, operations TEXT NOT NULL, website TEXT NOT NULL,
    logo TEXT, logoSource TEXT, checked TEXT NOT NULL
);
CREATE TABLE sources (
    business_id TEXT NOT NULL REFERENCES businesses(id),
    position INTEGER NOT NULL, label TEXT NOT NULL, url TEXT NOT NULL,
    PRIMARY KEY (business_id, position)
);
CREATE INDEX businesses_region ON businesses(region);
"""
FIELDS = (
    "id", "name", "city", "area", "region", "sector", "kind", "status",
    "description", "founders", "owner", "operations", "website", "logo",
    "logoSource", "checked"
)


def build():
    businesses = json.loads((DATA / "businesses.json").read_text())
    database = DATA / "circle-of-cards.sqlite"
    with TemporaryDirectory(dir=DATA) as folder:
        partial = Path(folder) / database.name
        with sqlite3.connect(partial) as db:
            db.executescript(SCHEMA)
            for business in businesses:
                record = {**business, "founders": json.dumps(business["founders"], ensure_ascii=False)}
                logo = SITE / "logos" / (business["id"] + ".png")
                record["logo"] = "logos/" + logo.name if logo.is_file() else None
                columns = ", ".join(FIELDS)
                placeholders = ", ".join("?" for _ in FIELDS)
                db.execute(f"INSERT INTO businesses ({columns}) VALUES ({placeholders})",
                           [record[key] for key in FIELDS])
                db.executemany("INSERT INTO sources VALUES (?, ?, ?, ?)", [
                    (business["id"], position, source["label"], source["url"])
                    for position, source in enumerate(business["sources"])
                ])
        partial.replace(database)

    with sqlite3.connect(database) as db:
        db.row_factory = sqlite3.Row
        records = [dict(row) for row in db.execute("SELECT * FROM businesses ORDER BY rowid")]
        for record in records:
            record["founders"] = json.loads(record["founders"])
            record["sources"] = [dict(row) for row in db.execute(
                "SELECT label, url FROM sources WHERE business_id = ? ORDER BY position",
                (record["id"],)
            )]

    fields = [*FIELDS, "sources"]
    with (DATA / "directory.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        for record in records:
            writer.writerow({
                **record, "founders": " | ".join(record["founders"]),
                "sources": " | ".join(source["url"] for source in record["sources"])
            })

    shutil.copytree(SITE, DIST, dirs_exist_ok=True)
    (DIST / "directory-data.js").write_text(
        "window.directoryData = " + json.dumps(records, ensure_ascii=False, indent=2) + ";\n"
    )
    shutil.copyfile(DATA / "directory.csv", DIST / "directory.csv")
    print(f"Built {len(records)} records in {database}")


if __name__ == "__main__":
    build()
