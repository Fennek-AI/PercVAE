import pymongo
from bson.objectid import ObjectId


def connect_mongoDB():
    client = pymongo.MongoClient(
        "------------------>YOUR LINK HERE<----------------------")
    db = client.test
    print("MongoDB Connection established.")
    print(client.list_database_names())

    dblist = client.list_database_names()
    if "myDB" in dblist:
        print("The database exists.")
    # load config for this file
    db = client["myDB"]

    return db


def get_mongoDB_presets(db, preset):
    col_bookmarks = db["Bookmarks"]
    x = col_bookmarks.find_one({"user": "Preset", "model": preset})
    return x


def get_mongoDB_bookmarks(uname, db, bookmark_id):
    col_bookmarks = db["Bookmarks"]
    x = col_bookmarks.find_one({"user": uname, "_id": ObjectId(bookmark_id)})
    return x


def get_mongoDB_history(uname, db, history_id):
    col_bookmarks = db["Bookmarks"]
    x = col_bookmarks.find_one({"user": uname, "_id": ObjectId(history_id)})
    return x


def get_mongoDB_bookmarkListPerUser(uname, db):
    col_bookmarks = db["Bookmarks"]
    x = list(col_bookmarks.find({"user": uname, "type": "Bookmark"}))
    for i in range(len(x)):
        x[i]["_id"] = str(x[i]["_id"])
    return x


def get_mongoDB_historyListPerUser(uname, db):
    col_bookmarks = db["Bookmarks"]
    x = list(col_bookmarks.find({"user": uname, "type": "History"}).sort([("timestamp", -1)]).limit(10))
    for i in range(len(x)):
        x[i]["_id"] = str(x[i]["_id"])
    return x


async def post_mongoDB_history(uname, db, model, model_instrument, timestamp, wavfile):
    col_bookmarks = db["Bookmarks"]
    history_dict = {
        "user": uname,
        "type": "History",
        "model": model,
        "instrument": model_instrument,
        "timestamp": timestamp,
        "WAV": wavfile
    }
    x = col_bookmarks.insert_one(history_dict)
    return x


def post_mongoDB_bookmarks(uname, db, isReversed, lowpass_value, highpass_value, distortion_value, reverb_value,
                           volume_value, model, model_instrument, timestamp, wavfile):
    col_bookmarks = db["Bookmarks"]
    bookmarks_dict = {
        "user": uname,
        "type": "Bookmark",
        "model": model,
        "instrument": model_instrument,
        "timestamp": timestamp,
        "WAV": wavfile,
        "v_volume": volume_value,
        "v_distortion": distortion_value,
        "v_reverb": reverb_value,
        "v_lowpass": lowpass_value,
        "v_highpass": highpass_value,
        "v_isReversed": isReversed
    }
    x = col_bookmarks.insert_one(bookmarks_dict)
    return x
