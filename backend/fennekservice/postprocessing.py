from pysndfx import AudioEffectsChain


class Postprocessor():
    isReverseToggleOn = False
    isLowpassOn = False
    lowpass_value = 0
    isHighpassOn = False
    highpass_value = 0
    isGainOn = False
    gain_value = 0
    isOverdriveOn = False
    overdrive_value = 0
    isSpaceOn = False
    space_value = 0
    infile = None
    fx = None

    def __init__(self, infile):
        self.infile = infile
        self.fx = AudioEffectsChain()
        return

    def __call__(self, x=None, **kwargs):
        return self.forward(x)

    def forward(self, x=None, **kwargs):
        """
        Main prediction function for generating a sound with the Fennek model
        :param x: input to generation model
        :return:
        """
        pass

    def addReverse(self):
        if not self.isReverseToggleOn:
            self.fx.reverse()
            self.isReverseToggleOn = True
            self.generateProcessedFile()
        else:
            print("Reverse is already set to True!")
        return

    def generateProcessedFile(self):
        outfile = "processed.wav"
        self.fx(self.infile, outfile)
        return

    def applyEffects(self):
        fx = (
            AudioEffectsChain()
                .highshelf()
                .reverb()
                .phaser()
                .delay()
                .lowshelf()
        )
        outfile = "processed.wav"
        fx(self.infile, outfile)
        return outfile

    def addEffects(self):
        fx = (
            AudioEffectsChain()
                .reverse()
        )
        fx = (
            AudioEffectsChain()
                .lowpass(frequency=1500)
        )

        fx = (
            AudioEffectsChain()
                .highpass(frequency=1500)
        )
        fx = (
            AudioEffectsChain()
                .delay()
        )

        return fx
