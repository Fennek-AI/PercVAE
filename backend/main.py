import sys
sys.path.append("../")

import os
import secrets
from mimetypes import guess_type
import threading
import logging
import base64
import random, time
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import gin
import uvicorn
from fastapi import FastAPI, HTTPException, status, Depends, Response, BackgroundTasks
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel

from fennekservice.generation import dict_models
from fennekservice.visualization import pltToString, getWaveForm, getSpectrogram
from fennekservice.generation import initializeModels, get_tsne_and_preload_model, preload_similarity, generate_sound, \
    play_sound, play_sound_original, applyEffectsOnGeneratedFile, upload_file, decode_and_save_file, get_generation_file
from fennekservice.mongo import connect_mongoDB, get_mongoDB_presets, post_mongoDB_bookmarks, get_mongoDB_bookmarks, \
    get_mongoDB_bookmarkListPerUser, post_mongoDB_history, get_mongoDB_historyListPerUser, get_mongoDB_history


class GenerateBody(BaseModel):
    data: Optional[str]
    volume_value: Optional[int]
    distortion_value: Optional[int]
    reverb_value: Optional[int]
    ae_variance: Optional[int]
    highpass_value: Optional[int]
    lowpass_value: Optional[int]
    isReversed: Optional[bool]
    selectedPoint: Optional[str]
    model: Optional[str]
    model_instrument: Optional[str]
    timestamp: Optional[str]
    username: Optional[str]


class MongoBody(BaseModel):
    id: Optional[str]
    type: Optional[str]


app = FastAPI()
security = HTTPBasic()
mongoDB_client = connect_mongoDB()


@gin.configurable
def get_valid_credentials():
    userlist = {
        "1": {
            "uname": "Ian",
            "pw": "Goodfellow"
        },
        "2": {
            "uname": "Jimmy",
            "pw": "Hendrix"
        },
        "3": {
            "uname": "Elton",
            "pw": "John"
        },
        "4": {
            "uname": "Amy",
            "pw": "Winehouse"
        }
    }
    return userlist


def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    x = get_valid_credentials()

    correct_username = None
    correct_password = None

    for key in x.values():
        correct_username = secrets.compare_digest(credentials.username, key["uname"])
        correct_password = secrets.compare_digest(credentials.password, key["pw"])

        if correct_username and correct_password:
            return credentials.username

    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Auth Server (Anton) denied your request.",
            headers={"WWW-Authenticate": "Basic"},
        )

    return credentials.username


@app.get('/healthcheck')
def read_root(username: str = Depends(get_current_username)):
    return 'Server (Anton) works. Greetings.'


@app.post("/getMongoDBData")
def getMongoData(body: MongoBody, username: str = Depends(get_current_username)):
    if body.type == "presets":
        x = get_mongoDB_presets(mongoDB_client, body.id)
        response = {
            "distortion_value": x["v_distortion"],
            "reverb_value": x["v_reverb"],
            "highpass_value": x["v_highpass"],
            "lowpass_value": x["v_lowpass"],
            "isReversed": x["v_isReversed"],
            "volume_value": x["v_volume"]
        }

    if body.type == "bookmark":
        x = get_mongoDB_bookmarks(username, mongoDB_client, body.id)
        response_content = x["WAV"]
        decode_and_save_file(data=response_content, username=username)
        response = {
            "result": response_content,
            "distortion_value": x["v_distortion"],
            "reverb_value": x["v_reverb"],
            "highpass_value": x["v_highpass"],
            "lowpass_value": x["v_lowpass"],
            "isReversed": x["v_isReversed"],
            "volume_value": x["v_volume"]
        }

    if body.type == "history":
        x = get_mongoDB_history(username, mongoDB_client, body.id)
        response_content = x["WAV"]
        decode_and_save_file(data=response_content, username=username)
        response = {"result": response_content}

    return response


@app.post("/getMongoDBList")
def getMongoDataList(body: MongoBody, username: str = Depends(get_current_username)):
    if body.type == "bookmarks":
        x = get_mongoDB_bookmarkListPerUser(username, mongoDB_client)

    if body.type == "history":
        x = get_mongoDB_historyListPerUser(username, mongoDB_client)

    return {
        "result": x
    }


@app.post("/generate")
async def generate(body: GenerateBody, background_tasks: BackgroundTasks,
                   username: str = Depends(get_current_username)):
    args = [body.model, body.model_instrument, body.ae_variance, body.selectedPoint, username]

    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as e:
        future = e.submit(lambda p: generate_sound(*p), args)
        result = future.result()
        response_content = result[0]
        model_instrument = result[1]
    background_tasks.add_task(post_mongoDB_history, uname=username, db=mongoDB_client, model=body.model,
                              model_instrument=model_instrument, timestamp=body.timestamp,
                              wavfile=base64.b64encode(response_content))

    return {
        "result": base64.b64encode(response_content)
    }


@app.post("/getVisualization")
def visualize(body: GenerateBody, username: str = Depends(get_current_username)):
    usr_outfile = "fennekservice/" + username + "-processed.wav"

    return {
        "visualization": [
            {"name": "Waveform",
             "base64img": pltToString(getWaveForm(usr_outfile))},
            {"name": "Spectrogram",
             "base64img": pltToString(getSpectrogram(usr_outfile))}
        ]
    }


@app.post("/tsne")
def tsne(body: GenerateBody, username: str = Depends(get_current_username)):
    response = get_tsne_and_preload_model(model_instrument=body.model_instrument, username=username)

    return {
        "result": [response]
    }


@app.post("/similarity")
def tsne(username: str = Depends(get_current_username)):
    response = preload_similarity(username=username)

    return {
        "result": response
    }


@app.post("/upload")
def upload(body: GenerateBody, username: str = Depends(get_current_username)):
    upload_file(data=body.data, username=username)

    response = "upload successful"
    return {
        "result": response
    }


@app.post("/play")
def play(body: GenerateBody, username: str = Depends(get_current_username)):
    if body.data == "original":
        args = [body.selectedPoint, username, body.model_instrument]
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as e:
            future = e.submit(lambda p: play_sound_original(*p), args)
            result = future.result()
            response_content = result
    else:
        args = [username]
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as e:
            future = e.submit(lambda p: play_sound(*p), args)
            result = future.result()
            response_content = result

    return {
        "result": base64.b64encode(response_content)
    }


@app.post("/bookmark")
def addToBookmarks(body: GenerateBody, username: str = Depends(get_current_username)):
    current_sound = get_generation_file(username=username)
    x = post_mongoDB_bookmarks(username, mongoDB_client, body.isReversed, body.lowpass_value, body.highpass_value,
                               body.distortion_value, body.reverb_value, body.volume_value, body.model,
                               body.model_instrument, body.timestamp, wavfile=base64.b64encode(current_sound))
    response_content = "Successfully saved as Bookmark with id" + str(x)
    return {
        "result": response_content
    }


@app.post("/effects")
def addEffects(body: GenerateBody, username: str = Depends(get_current_username)):
    applyEffectsOnGeneratedFile(body.isReversed, body.lowpass_value, body.highpass_value, body.distortion_value,
                                body.reverb_value, body.volume_value, username=username)
    response_content = "Successfully applied effects on sound"
    return {
        "result": response_content
    }


@app.post("/initializeModels")
async def initializeModelsThread(body: GenerateBody, username: str = Depends(get_current_username), thread_pool=None):
    await startThreadsForModels()

    return {
        "result": "success"
    }


@app.get("/{filepath:path}")
async def get_site(filepath, username: str = Depends(get_current_username)):
    if filepath == "":
        filepath = "index.html"

    dir_path = os.path.dirname(os.path.realpath(__file__))
    filename = os.path.join(dir_path, "fennekservice", "static", filepath)

    if not os.path.isfile(filename):
        return Response(status_code=404)

    with open(filename, 'rb') as f:
        content = f.read()

    content_type, _ = guess_type(filename)
    return Response(content, media_type=content_type)


def main():
    dir_path = os.path.dirname(os.path.realpath(__file__))
    gin.parse_config_file(os.path.join(dir_path, 'config.gin'))
    uvicorn.run(app, host="0.0.0.0", port=os.environ.get("PORT", default=5000), workers=1)


async def startThreadsForModels():
    logging.basicConfig(format='%(levelname)s - %(asctime)s: %(message)s', datefmt='%H:%M:%S', level=logging.DEBUG)
    logging.getLogger('matplotlib.font_manager').disabled = True
    logging.info('Initializing Models Started')
    tasks = list(dict_models.keys())
    with ThreadPoolExecutor(max_workers=8) as e:
        e.map(initializeModels, tasks)
    logging.info('Initializing Models Finished')


if __name__ == "__main__":
    main()
