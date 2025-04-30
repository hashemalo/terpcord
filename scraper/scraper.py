import requests
import json
import os
from itertools import islice

API_BASE = "https://api.umd.io/v1"
SEMESTER = 202508   # pick a semester you know has real sections, e.g. 202001
OUT_DIR = "dept_sections"
os.makedirs(OUT_DIR, exist_ok=True)

def get_departments():
    return requests.get(f"{API_BASE}/courses/departments").json()

def get_courses_for_dept(dept_id):
    r = requests.get(
        f"{API_BASE}/courses",
        params={"dept_id": dept_id, "semester": SEMESTER, "per_page": 100}
    )
    r.raise_for_status()
    return r.json()

def chunks(iterable, size):
    it = iter(iterable)
    while True:
        batch = list(islice(it, size))
        if not batch:
            return
        yield batch

def get_sections_by_ids(section_ids):
    valid = [sid for sid in section_ids if "-" in sid]
    if not valid:
        return []

    all_sections = []
    for batch in chunks(valid, 50):
        ids_str = ",".join(batch)
        url = f"{API_BASE}/courses/sections/{ids_str}"
        resp = requests.get(url, params={"semester": SEMESTER})
        resp.raise_for_status()
        print(f"GET {resp.url} → {resp.status_code}, {len(resp.json())} items")
        all_sections.extend(resp.json())

    return all_sections

def main():
    all_full_sections = []  # ← accumulator for every dept

    for dept in get_departments():
        dept = dept["dept_id"]
        print(f"\n--- Dept {dept} ---")
        courses = get_courses_for_dept(dept)

        all_sids = []
        for crs in courses:
            all_sids.extend(crs.get("sections", []))

        print(f"Collected {len(all_sids)} section-IDs for {dept}")
        if not all_sids:
            print("  (no sections to fetch)")
            continue

        full_sections = get_sections_by_ids(all_sids)
        print(f"Fetched {len(full_sections)} section-objects for {dept}")

        # accumulate
        all_full_sections.extend(full_sections)

    # after looping all depts, write single file:
    out_path = os.path.join(OUT_DIR, "all_sections.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_full_sections, f, indent=4, ensure_ascii=False)
    print(f"\nWrote a total of {len(all_full_sections)} sections → {out_path}")

if __name__ == "__main__":
    main()

