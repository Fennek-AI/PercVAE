import matplotlib
matplotlib.use('Agg')
import librosa, librosa.display
import matplotlib.pyplot as plt
import io
import base64
import numpy as np


def getWaveForm(file):
    FIG_SIZE = (7.5, 5)
    # waveform
    signal, sr = librosa.load(file, sr=22050)  # sr (samplerate) * T (frequency) -> 22050 * 30s
    plt.figure(figsize=FIG_SIZE, dpi=100)
    librosa.display.waveplot(signal, sr=sr)

    plt.xlabel("Time")
    plt.ylabel("Amplitude")
    # plt.show()

    return plt


def getSpectrogram(file):
    FIG_SIZE = (7.5, 5)
    signal, sr = librosa.load(file, sr=22050)  # sr (samplerate) * T (frequency) -> 22050 * 30s

    # STFT -> Spectrogram
    hop_length = 512  # in num. of samples = Amount we are shifting each tourier transform to the right
    hop_length = 256
    n_fft = 2048  # window in num. of samples = The window when performing a single fourier Transform, this amount of samples
    n_fft = 1024

    # calculate duration hop length and window in seconds
    hop_length_duration = float(hop_length) / sr
    n_fft_duration = float(n_fft) / sr

    # perform stft
    stft = librosa.stft(signal, n_fft=n_fft, hop_length=hop_length)

    # calculate abs values on complex numbers to get magnitude
    spectrogram = np.abs(stft)

    # apply logarithm to cast amplitude to Decibels
    log_spectrogram = librosa.amplitude_to_db(spectrogram)

    plt.figure(figsize=FIG_SIZE, dpi=100)
    librosa.display.specshow(log_spectrogram, sr=sr, hop_length=hop_length, y_axis='log')
    plt.xlabel("Time")
    plt.ylabel("Frequency")

    # Logarithmic visualization helps us to undestand values better
    plt.colorbar(format="%+2.0f dB")
    plt.title("Spectrogram (dB)")

    # plt.show()

    return plt

def getPowerSpectrum(file):
    FIG_SIZE = (7.5, 5)
    sampleRate = librosa.get_samplerate(file)
    signal, sr = librosa.load(file, sr=22050)  # sr (samplerate) * T (frequency) -> 22050 * 30s

    # FFT -> power spectrum
    # perform Fourier transform
    fft = np.fft.fft(signal)

    # calculate abs values on complex numbers to get magnitude
    spectrum = np.abs(fft)

    # create frequency variable
    f = np.linspace(0, sr, len(spectrum))

    # take half of the spectrum and frequency
    left_spectrum = spectrum[:int(len(spectrum) / 2)]
    left_f = f[:int(len(spectrum) / 2)]

    # plot spectrum
    plt.figure(figsize=FIG_SIZE)
    plt.plot(left_f, left_spectrum, alpha=0.4)
    plt.xlabel("Frequency")
    plt.ylabel("Magnitude")
    plt.title("Power spectrum")


def pltToString(plt):
    my_stringIObytes = io.BytesIO()
    plt.savefig(my_stringIObytes, format='png')
    my_stringIObytes.seek(0)
    base64_img = base64.b64encode(my_stringIObytes.read())
    plt.axis('off')
    plt.close()
    return base64_img
