import requests

businesses = [
    {"owner_id": 1, "name": "Rosa's Bakery", "street_address": "123 Elm St", "city": "Sacramento", "state": "CA", "zip_code": 95814},
    {"owner_id": 2, "name": "Green Thumb Nursery", "street_address": "456 Oak Ave", "city": "Sacramento", "state": "CA", "zip_code": 95815},
    {"owner_id": 3, "name": "Village Hardware", "street_address": "789 Pine Rd", "city": "Sacramento", "state": "CA", "zip_code": 95816},
]

for b in businesses:
    r = requests.post("https://project3-494903.wl.r.appspot.com", json=b)
    print(r.status_code, r.json())