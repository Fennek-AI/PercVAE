from fennekservice.models.model import FennekModel
from fennekservice.models.samplevae.tool_class import SoundSampleTool

import os


class SampleVAEModel(FennekModel):

    def __init__(self, model_id: str = 'model_toms', instrument: str = "Toms",
                 library_dir: str = "fennekservice/models/samplevae/model_toms", ae_variance: float = 0.0,
                 selectedSound: str = ""):
        models = {"Kick": 'model_kick',
                  "Snare": 'model_snare',
                  "Crash": 'model_crash',
                  "Toms": 'model_toms',
                  "Clap": 'model_clap',
                  "Hihat": 'model_hihat',
                  "Similarity Search": 'model_all2'
                  }
        self.instrument = instrument
        self.model_id = models[instrument]

        super().__init__()

        real_path = os.path.realpath(__file__)
        dir_path = os.path.dirname(real_path)
        log_dir = os.path.join(dir_path, model_id)

        self.tool = SoundSampleTool(logdir=log_dir,
                                    library_dir=library_dir,
                                    library_segmentation=False)
        self.ae_variance = float(ae_variance)

    def find_similar(self, target_file, x=None, **kwargs):
        similar_files, onsets, distances = self.tool.find_similar(target_file, num_similar=5)
        return similar_files

    def get_TSNE(self, x=None, **kwargs):
        return self.tool.get_TSNE()

    def get_model_id(self):
        return self.model_id

    def get_instrument(self):
        return self.instrument

    def forward(self, x=None, selectedSound="", ae_variance=0.0, **kwargs):
        relative_file_path = "generated.wav"

        audio_files = []
        weights = []

        self.tool.generate(out_file=relative_file_path,
                           audio_files=audio_files,
                           weights=weights,
                           normalize_weights=True,
                           variance=ae_variance,
                           selectedSound=selectedSound)

        with open(relative_file_path, "rb") as f:
            y = f.read()

        return y

    def feature_coherence(self, x=None, selectedSound="", ae_variance=0.0, **kwargs):
        relative_file_path = "generated.wav"
        weights = []

        self.tool.generate_selected_sound(out_file=relative_file_path,
                                          weights=weights,
                                          normalize_weights=True,
                                          variance=ae_variance,
                                          selectedSound=selectedSound)

        with open(relative_file_path, "rb") as f:
            y = f.read()

        return y
