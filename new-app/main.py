from flask import Flask, request, send_from_directory
from google.cloud import datastore

app = Flask(__name__)
datastore_client = datastore.Client()

BUSINESSES = "businesses"
OWNERS = "owners"
REVIEWS = "reviews"
USERS = "users"


# Create a business - POST /businesses
@app.route('/' + BUSINESSES, methods=['POST'])
def create_business():
    content = request.get_json()

    required_fields = [
        'owner_id',
        'name',
        'street_address',
        'city',
        'state',
        'zip_code'
    ]

    missing = [field for field in required_fields if field not in content]

    if missing:
        return {
            "Error": "The request body is missing at least one of the required attributes"
        }, 400

    key = datastore_client.key(BUSINESSES)
    business = datastore.Entity(key=key)

    business.update({
        "owner_id": content["owner_id"],
        "name": content["name"],
        "street_address": content["street_address"],
        "city": content["city"],
        "state": content["state"],
        "zip_code": content["zip_code"]
    })

    datastore_client.put(business)

    return {
        "id": business.key.id,
        "owner_id": business["owner_id"],
        "name": business["name"],
        "street_address": business["street_address"],
        "city": business["city"],
        "state": business["state"],
        "zip_code": business["zip_code"]
    }, 201

#get a businesses - query 
@app.route('/' + BUSINESSES, methods=['GET'])
def get_businesses():
    # use a Query to return the businesses from the db 
    query = datastore_client.query(kind=BUSINESSES)
    results = list(query.fetch()) #fetch them on a list

    businesses = []

    # go through all of the businesses in results (fecthed quert list)
    for business in results:
        businesses.append({ #append each business to businesses array
            "id": business.key.id,
            "owner_id": business["owner_id"],
            "name": business["name"],
            "street_address": business["street_address"],
            "city": business["city"],
            "state": business["state"],
            "zip_code": business["zip_code"]
        })

    return businesses, 200

#get a business sending business_id
@app.route('/' + BUSINESSES + '/<int:business_id>', methods=['GET'])
def get_business(business_id):

    # Create key WITH the ID
    key = datastore_client.key(BUSINESSES, business_id)

    # Fetch from Datastore - Using key is to get one entity per key
    business = datastore_client.get(key)

    # If not found
    if business is None:
        return {
            "Error": "No business with this business_id exists"
        }, 404

    return {
        "id": business.key.id,
        "owner_id": business["owner_id"],
        "name": business["name"],
        "street_address": business["street_address"],
        "city": business["city"],
        "state": business["state"],
        "zip_code": business["zip_code"]
    }, 200

#Edit a businesses - key business_id
@app.route('/' + BUSINESSES + '/<int:business_id>', methods=['PUT'])
def put_business(business_id):
    content = request.get_json()

    required_fields = [
        'owner_id',
        'name',
        'street_address',
        'city',
        'state',
        'zip_code'
    ]

    missing = [field for field in required_fields if field not in content]

    if missing:
        return {
            "Error": "The request body is missing at least one of the required attributes"
        }, 400
    # Create key WITH the ID
    key = datastore_client.key(BUSINESSES, business_id)

    # Fetch from Datastore - Using key is to get one entity per key
    business = datastore_client.get(key)

    # If not found 
    if business is None:
        return {
            "Error": "No business with this business_id exists"
        }, 404
    
    business.update({
        "owner_id": content["owner_id"],
        "name": content["name"],
        "street_address": content["street_address"],
        "city": content["city"],
        "state": content["state"],
        "zip_code": content["zip_code"]
    })

    datastore_client.put(business)

    return {
        "id": business.key.id,
        "owner_id": business["owner_id"],
        "name": business["name"],
        "street_address": business["street_address"],
        "city": business["city"],
        "state": business["state"],
        "zip_code": business["zip_code"]
    }, 200

# Edit a business using business_id
@app.route('/' + BUSINESSES + '/<int:business_id>', methods=['DELETE'])
def delete_business(business_id):

    # Create key with ID
    key = datastore_client.key(BUSINESSES, business_id)

    # Check if it exists
    business = datastore_client.get(key)

    if business is None:
        return {
            "Error": "No business with this business_id exists"
        }, 404

    query = datastore_client.query(kind=REVIEWS)
    query.add_filter("business_id", "=", business_id)
    reviews = list(query.fetch())

    for review in reviews:
        datastore_client.delete(review.key)

    datastore_client.delete(key)
    return '', 204

#list all business for an owner 
# parameters owner_id
@app.route('/' + OWNERS + '/<int:owner_id>/' + BUSINESSES, methods=['GET'])
def get_businesses_from_owner(owner_id):

    # Query businesses filtered by owner_id
    query = datastore_client.query(kind=BUSINESSES)
    query.add_filter("owner_id", "=", owner_id)

    results = list(query.fetch())

    businesses = []

    for business in results:
        businesses.append({
            "id": business.key.id,
            "owner_id": business["owner_id"],
            "name": business["name"],
            "street_address": business["street_address"],
            "city": business["city"],
            "state": business["state"],
            "zip_code": business["zip_code"]
        })

    return businesses, 200

# post request to create a review! 
@app.route('/' + REVIEWS, methods=['POST'])
def create_review():
    content = request.get_json()

    required_fields = ["user_id", "business_id", "stars"]
    missing = [field for field in required_fields if field not in content]

    if missing:
        return {
            "Error": "The request body is missing at least one of the required attributes"
        }, 400

    # Check that the business exists
    business_key = datastore_client.key(BUSINESSES, content["business_id"])
    business = datastore_client.get(business_key)

    if business is None:
        return {
            "Error": "No business with this business_id exists"
        }, 404

    # Check whether this user already reviewed this business
    query = datastore_client.query(kind=REVIEWS)
    query.add_filter("user_id", "=", content["user_id"])
    query.add_filter("business_id", "=", content["business_id"])
    existing_reviews = list(query.fetch())

    if len(existing_reviews) > 0:
        return {
            "Error": "You have already submitted a review for this business. You can update your previous review, or delete it and submit a new review"
        }, 409

    # Create the review
    key = datastore_client.key(REVIEWS)
    review = datastore.Entity(key=key)

    review.update({
        "user_id": content["user_id"],
        "business_id": content["business_id"],
        "stars": content["stars"]
    })

    if "review_text" in content:
        review["review_text"] = content["review_text"]

    datastore_client.put(review)

    response = {
        "id": review.key.id,
        "user_id": review["user_id"],
        "business_id": review["business_id"],
        "stars": review["stars"]
    }

    if "review_text" in review:
        response["review_text"] = review["review_text"]

    return response, 201

@app.route('/' + REVIEWS, methods=['GET'])
def get_reviews():
    query = datastore_client.query(kind=REVIEWS)
    results = list(query.fetch())

    reviews = []
    for review in results:
        review_data = {
            "id": review.key.id,
            "user_id": review["user_id"],
            "business_id": review["business_id"],
            "stars": review["stars"]
        }
        if "review_text" in review:
            review_data["review_text"] = review["review_text"]
        reviews.append(review_data)

    return reviews, 200

# edit a review using PUT method
# parameters review_id
@app.route('/' + REVIEWS + '/<int:review_id>', methods=['PUT'])
def edit_review(review_id):
    content = request.get_json()

    if content is None or "stars" not in content:
        return {
            "Error": "The request body is missing at least one of the required attributes"
        }, 400

    key = datastore_client.key(REVIEWS, review_id)
    review = datastore_client.get(key)

    if review is None:
        return {
            "Error": "No review with this review_id exists"
        }, 404

    # Only update fields that are present
    review["stars"] = content["stars"]

    if "review_text" in content:
        review["review_text"] = content["review_text"]

    datastore_client.put(review)

    response = {
        "id": review.key.id,
        "user_id": review["user_id"],
        "business_id": review["business_id"],
        "stars": review["stars"]
    }

    if "review_text" in review:
        response["review_text"] = review["review_text"]

    return response, 200

#delete a review using delete method 
# parameters review_id
@app.route('/' + REVIEWS + '/<int:review_id>', methods=['DELETE'])
def delete_review(review_id):
    key = datastore_client.key(REVIEWS, review_id)
    review = datastore_client.get(key)

    if review is None:
        return {
            "Error": "No review with this review_id exists"
        }, 404

    datastore_client.delete(key)
    return '', 204


#get a review using mwthod get
@app.route('/' + REVIEWS + '/<int:review_id>', methods=['GET'])
def get_review(review_id):
    key = datastore_client.key(REVIEWS, review_id)
    review = datastore_client.get(key)

    if review is None:
        return {
            "Error": "No review with this review_id exists"
        }, 404

    response = {
        "id": review.key.id,
        "user_id": review["user_id"],
        "business_id": review["business_id"],
        "stars": review["stars"]
    }

    if "review_text" in review:
        response["review_text"] = review["review_text"]

    return response, 200

# get reviews for users using GET method
# parameters user_id 
@app.route('/' + USERS + '/<int:user_id>/' + REVIEWS, methods=['GET'])
def get_reviews_for_user(user_id):
    query = datastore_client.query(kind=REVIEWS)
    query.add_filter("user_id", "=", user_id)

    results = list(query.fetch())

    reviews = []

    for review in results:
        review_data = {
            "id": review.key.id,
            "user_id": review["user_id"],
            "business_id": review["business_id"],
            "stars": review["stars"]
        }

        if "review_text" in review:
            review_data["review_text"] = review["review_text"]

        reviews.append(review_data)

    return reviews, 200

@app.route("/")
def root():
    return send_from_directory("frontend", "index.html")

@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory("frontend", filename)

@app.route("/styles.css")
def styles():
    return send_from_directory("frontend", "styles.css")


@app.route("/script.js")
def script():
    return send_from_directory("frontend", "script.js")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)