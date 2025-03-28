import requests as rq
from bs4 import BeautifulSoup as bs
import time
import json
import os
# TerpCord Scraper
# !!
# Scraper for TerpCord. will scan the course catalog for UMD's app.testudo.edu
# and return a json file with the course names and professors in order to set up channels for TerpCord
# !!


# Fetches an html document from a given URL with error checking and retry logic
def html_response(url: str) -> rq.Response:
    headers = {'User-Agent': 'TerpCord/0.0.1'}
    attempts = 3

    for attempt in range(attempts):
        try:
            response = rq.get(url, headers=headers, timeout=10)
            response.raise_for_status() # Check for HTTP errors
            return response
        except rq.RequestException as e:
            if attempt < attempts - 1:
                continue
            else:
                raise e


# Fetches the JSON for a given course and term. Gets professors for each course along with course code
def get_courses(dept: str, term: str):
    courses_html = html_response(f"https://app.testudo.umd.edu/soc/{term}/{dept}/")

    courses_doc = bs(courses_html.content, 'html.parser')
    select = courses_doc.select('.course-id') # retrieves list of course ids for dept
    courses = [course.decode_contents() for course in select]
    course_list = []
    
    for c in courses:
        course_html = html_response(f"https://app.testudo.umd.edu/soc/{term}/sections?courseIds={c}")
        course_doc = bs(course_html.content, 'html.parser')
        profs = course_doc.select(".section-instructors")
        prof_list = []
        if profs:
            for p in profs:
                p = p.get_text(strip=True)
                if not p in prof_list:
                    prof_list.append(p)
            course_list.append({
            "name": c,
            "professors": prof_list
            })

    return course_list

def get_depts():
    soc = html_response("https://app.testudo.umd.edu/soc/")
        
    soc_doc = bs(soc.content, 'html.parser')
    select = soc_doc.select('#course-prefixes-page .two')

    dept_list = [dept.decode_contents() for dept in select]
    return dept_list

def main():
    term = "202508"
    depts = get_depts()
    data = {"depts": []}
    for dept in depts:
        courses = get_courses(dept, term)
        data["depts"].append({
            "name": dept,
            "courses": courses
        })
    json_data = json.dumps(data, indent=4)

    with open("data.json", "w") as outfile:
        outfile.write(json_data)
    

if __name__ == '__main__':
    main()