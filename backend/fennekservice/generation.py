import os
import base64
import math
import gc
import logging
import threading

import gin
from pysndfx import AudioEffectsChain
import librosa

from fennekservice.models.samplevae.samplevae import SampleVAEModel

dict_models = {
    "Kick": 'model_kick',
    "Snare": 'model_snare',
    "Crash": 'model_crash',
    "Toms": 'model_toms',
    "Clap": 'model_clap',
    "Hihat": 'model_hihat',
    "Similarity Search": 'model_all2'
}

dict_library_dir = {
    "Kick": 'fennekservice/models/samplevae/model_kick',
    "Snare": 'fennekservice/models/samplevae/model_snare',
    "Crash": 'fennekservice/models/samplevae/model_crash',
    "Toms": 'fennekservice/models/samplevae/model_toms',
    "Clap": 'fennekservice/models/samplevae/model_clap',
    "Hihat": 'fennekservice/models/samplevae/model_hihat',
    "Similarity Search": 'fennekservice/models/samplevae'
}

Samplevae_model1 = None
Samplevae_model2 = None
Samplevae_model3 = None
Samplevae_model4 = None

Samplevae_model_kick = None
Samplevae_model_snare = None
Samplevae_model_crash = None
Samplevae_model_toms = None
Samplevae_model_clap = None
Samplevae_model_hihat = None
Samplevae_model_all2 = None


def getSampleVAE(username):
    if username == "Amy":
        global Samplevae_model1
        return Samplevae_model1
    elif username == "Elton":
        global Samplevae_model2
        return Samplevae_model2
    elif username == "Jimmy":
        global Samplevae_model3
        return Samplevae_model3
    elif username == "Ian":
        global Samplevae_model4
        return Samplevae_model4
    else:
        return SampleVAEModel()


def getSampleVAEforInstrument(model_instrument):
    if model_instrument == "Kick":
        return Samplevae_model_kick
    if model_instrument == "Snare":
        return Samplevae_model_snare
    if model_instrument == "Crash":
        return Samplevae_model_crash
    if model_instrument == "Toms":
        return Samplevae_model_toms
    if model_instrument == "Clap":
        return Samplevae_model_clap
    if model_instrument == "Hihat":
        return Samplevae_model_hihat
    if model_instrument == "Similarity Search":
        return Samplevae_model_all2


def initializeModels(model_instrument):
    logging.info(f'Thread: {model_instrument} id = {threading.get_ident()}')
    logging.info(f'Thread: {model_instrument} name = {threading.currentThread().name}')
    global Samplevae_model_kick
    global Samplevae_model_snare
    global Samplevae_model_crash
    global Samplevae_model_toms
    global Samplevae_model_clap
    global Samplevae_model_hihat
    global Samplevae_model_all2
    if model_instrument == "Kick" and Samplevae_model_kick is None:
        Samplevae_model_kick = SampleVAEModel(model_id=dict_models["Kick"], instrument="Kick",
                                              library_dir=dict_library_dir["Kick"])
    if model_instrument == "Snare" and Samplevae_model_snare is None:
        Samplevae_model_snare = SampleVAEModel(model_id=dict_models["Snare"], instrument="Snare",
                                               library_dir=dict_library_dir["Snare"])
    if model_instrument == "Crash" and Samplevae_model_crash is None:
        Samplevae_model_crash = SampleVAEModel(model_id=dict_models["Crash"], instrument="Crash",
                                               library_dir=dict_library_dir["Crash"])
    if model_instrument == "Toms" and Samplevae_model_toms is None:
        Samplevae_model_toms = SampleVAEModel(model_id=dict_models["Toms"], instrument="Toms",
                                              library_dir=dict_library_dir["Toms"])
    if model_instrument == "Clap" and Samplevae_model_clap is None:
        Samplevae_model_clap = SampleVAEModel(model_id=dict_models["Clap"], instrument="Clap",
                                              library_dir=dict_library_dir["Clap"])
    if model_instrument == "Hihat" and Samplevae_model_hihat is None:
        Samplevae_model_hihat = SampleVAEModel(model_id=dict_models["Hihat"], instrument="Hihat",
                                               library_dir=dict_library_dir["Hihat"])
    if model_instrument == "Similarity Search" and Samplevae_model_all2 is None:
        Samplevae_model_all2 = SampleVAEModel(model_id=dict_models["Similarity Search"], instrument="Similarity Search",
                                              library_dir=dict_library_dir["Similarity Search"])
    logging.info(f'Thread {model_instrument}: finished')


def assignSampleVAE(username, SampleVAE):
    print("assignment of SampleVAE Instance to User started")
    if username == "Amy":
        global Samplevae_model1
        Samplevae_model1 = SampleVAE
    elif username == "Elton":
        global Samplevae_model2
        Samplevae_model2 = SampleVAE
    elif username == "Jimmy":
        global Samplevae_model3
        Samplevae_model3 = SampleVAE
    elif username == "Ian":
        global Samplevae_model4
        Samplevae_model4 = SampleVAE


@gin.configurable
def generate_sound(model_id: str = 'my_model', model_instrument: str = 'my_instrument',
                   ae_variance: float = 0.0, selectedPoint: str = '', username: str = "Ian", **kwargs):
    usr_file = "fennekservice/" + username + "-generated.wav"
    usr_upload_file_path = "fennekservice/" + username + "-upload.wav"
    usr_outfile = "fennekservice/" + username + "-processed.wav"
    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)
    outfile = os.path.join(cwd, usr_outfile)
    usr_upload_file = os.path.join(cwd, usr_upload_file_path)
    result_wave = None

    # Load VAE Model if Variational Autoencoder is selected
    if model_id == "Variational Autoencoder":
        Samplevae_model = getSampleVAEforInstrument(model_instrument)
        if selectedPoint == None:
            selectedPoint = ""
        result_wave = Samplevae_model.forward(selectedSound=selectedPoint, ae_variance=ae_variance)

        with open(file, "wb") as fout:
            fout.write(result_wave)

    # Load Similarity Search if selected
    if model_id == "Similarity Search":
        model_instrument = "Similarity Search"
        Samplevae_model = getSampleVAEforInstrument(model_instrument)
        similarSounds = Samplevae_model.find_similar(target_file=usr_upload_file)
        result_wave = Samplevae_model.forward(selectedSound=similarSounds[0])

        path = similarSounds[0]
        dirofdir = os.path.dirname(os.path.dirname(path))
        dirname1 = os.path.basename(dirofdir)

        for key, value in dict_models.items():
            if value == dirname1:
                model_instrument = key

        with open(file, "wb") as fout:
            fout.write(result_wave)

    fx = (
        AudioEffectsChain()
    )
    fx(file, outfile)

    gc.collect()
    return result_wave, model_instrument


def play_sound(username: str = "Ian", **kwargs):
    usr_outfile = "fennekservice/" + username + "-processed.wav"
    cwd = os.getcwd()
    outfile = os.path.join(cwd, usr_outfile)

    with open(outfile, "rb") as f:
        result_wave = f.read()

    return result_wave


def play_sound_original(selectedPoint: str = 'point', username: str = "Ian", model_instrument: str = "Kick", **kwargs):
    # TODO: Refactor Method to make it decode a point from latent space instead of getting the original file from the disk
    Samplevae_model = getSampleVAEforInstrument(model_instrument)

    dir = dict_library_dir[Samplevae_model.get_instrument()] + "/Data/"

    if selectedPoint[-4:] == '_0.0':
        selectedPoint = selectedPoint[:-4] + ".wav"

    file_dir = os.path.join(dir, selectedPoint)
    cwd = os.getcwd()
    file = os.path.join(cwd, file_dir)

    result_wave = None
    with open(file, "rb") as f:
        result_wave = f.read()

    return result_wave


def applyEffectsOnGeneratedFile(isReversed, lowpass_value, highpass_value, distortion_value, reverb_value, volume_value,
                                username: str = "Ian"):
    usr_file = "fennekservice/" + username + "-generated.wav"
    usr_outfile = "fennekservice/" + username + "-processed.wav"
    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)
    outfile = os.path.join(cwd, usr_outfile)

    fx = (
        AudioEffectsChain()
    )

    sampleRate = librosa.get_samplerate(file)

    # 1. add Reverse
    if isReversed:
        fx.reverse()

    # 2. add Lowpass
    if lowpass_value > 0:
        value = (lowpass_value / 100) * (sampleRate / 2)
        # People Hear 20.000
        fx.lowpass(frequency=value)
    else:
        fx.lowpass(frequency=50)

    # 3. add Highpass
    if highpass_value > 0:
        value = (highpass_value / 150) * (sampleRate / 2)
        fx.highpass(frequency=value)
    else:
        fx.highpass(frequency=1)

    # 4. Overdrive 0-50
    value = math.floor(distortion_value / 2)
    fx.overdrive(distortion_value)
    value2 = value / 50 * -15
    fx.gain(value2)

    # 6. Reverb
    if reverb_value > 0:
        value = math.floor(reverb_value / 2)
        fx.reverb(reverberance=value, room_scale=value, hf_damping=value)
        fx.delay()

    # 7. Volume
    value = -30 + (volume_value / 100 * 30)
    fx.gain(value)

    fx(file, outfile)

    return outfile


def preload_similarity(username):
    Samplevae_model = getSampleVAEforInstrument("Similarity Search")
    model_instrument = "Similarity Search"
    return "success"

def get_tsne_and_preload_model(model_instrument, username):
    Samplevae_model = getSampleVAEforInstrument(model_instrument)

    response = {"name": model_instrument}
    data = Samplevae_model.get_TSNE()
    for x in data:
        x['x'] = float(x['x'])
        x['y'] = float(x['y'])

    response["data"] = data
    return response


def upload_file(data: str = "", username: str = "Ian", **kwargs):
    usr_file = "fennekservice/" + username + "-upload.wav"
    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)

    result_wave = base64.b64decode(data)
    with open(file, "wb") as fout:
        fout.write(result_wave)

    return "success"


def decode_and_save_file(data: str = "", username: str = "Ian", **kwargs):
    usr_file = "fennekservice/" + username + "-generated.wav"
    usr_outfile = "fennekservice/" + username + "-processed.wav"

    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)
    outfile = os.path.join(cwd, usr_outfile)

    result_wave = base64.b64decode(data)
    with open(file, "wb") as fout:
        fout.write(result_wave)

    with open(outfile, "wb") as fout:
        fout.write(result_wave)

    return "success"


def get_generation_file(username: str = "Ian", **kwargs):
    usr_file = "fennekservice/" + username + "-generated.wav"
    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)

    result_wave = None
    with open(file, "rb") as f:
        result_wave = f.read()

    return result_wave


def write_similar_files_to_txt(username: str = "Ian", text=None, **kwargs):
    usr_file = "fennekservice/" + username + "-data.txt"
    cwd = os.getcwd()
    file = os.path.join(cwd, usr_file)

    with open(file, "w") as f:
        f.write(text)
