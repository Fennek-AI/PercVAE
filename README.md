# PercVAE - Design Percussive Sounds with Deep Learning 🥁

PercVAE is a deep learning-based tool that allows for different types of sample generation of percussive sounds. This is part of the [Fennek AI project](https://www.fennek-ai.com) by Clemens Biehl \& Emrehan Firtin.

The deep learning architecture is based on the [SampleVAE by Max Frenzel](https://github.com/maxfrenzel/SampleVAE) which is implemented in TensorFlow and is based on a Variational Autoencoder (VAE) with Inverse Autoregressive Flows (IAF). The backend is based on Python, FastAPI, TensorFlow, Librosa, and for the frontend we used React.js.

## Feature Overview

The features of PercVAE were elicitated in Interviews with 6 music producers based on the  [master's thesis by Emrehan Firtin](https://drive.google.com/file/d/14PqFY33wq77BEJ0_uMPWQDu0E8QRTW5R/view?usp=sharing). The idea was to understand to which extent deep variational autoencoder can be used in the sound design process of music producers / or musicians. 

- **Visualization of Latent Space**: Interact with the latent space of the VAE with a Scatterplot through T-SNE dimensionality reduction
- **Post Processing capabilities**: Enrich your sounds with an effect rack, experiment with a randomization button and try out our carefully crafted presets
- **Sound Bookmarking & Generation History**: Save your favorite AI-generated samples with the respective VAE settings and don't be afraid to lose a cool sound through our history function 
- **Keyboard Shortcuts**: Speed up your workflow with intuitive shortcuts
- **Spectrogram Visualization**: Visualize your sounds to validate if what you hear is what you get
- **Step Sequencer**: 1,2,3,4: Hear your generated sounds in action
- **User Profiles and User Login**
- **File Download**

![Generation](https://www.fennek-ai.com/wordpress/wp-content/uploads/2022/05/PercVAE-Prototype-Screenshots-7.png)

## Installation

1. Clone the Github registry
2. [MongoDB.com](http://MongoDB.com): Create a database (free tier) and generate the corresponding link for python with the “connect” button. We use a MongoDB to store a registry of generated samples and the history function
2. Make sure you have an installed version of Conda and/or Miniconda on your machine
3. Create and activate conda environment in the terminal:

```bash
conda create -n percVAE python=3.7.9 pip
conda activate percVAE
pip install -r app/requirements.txt
```

5. Open the "percVAE/fennekservice/mongo.py" file and replace the link with your MongoDB link. If you have issues with this step, go home. Just kidding. Here's [the official documentation](https://www.mongodb.com/docs/guides/server/drivers/).
```python
client = pymongo.MongoClient("YOUR LINK HERE")
```

6. Run PercVAE and open your browser. The application will run here: [localhost:5000/index.html](localhost:5000/index.html)

```bash
python main.py
``` 

## User Login Data
When you log into the application, you can use one of the following users:
| Username | Password |
| --- | --- |
| Jimmy | Hendrix |
| Elton | John |
| Amy | Winehouse |
| Ian | Goodfellow |


## Code Changes

The used .wav-files of the model are mostly copyrighted sounds. If you want to create your own models it is necessary to follow the [SampleVAE guide](https://github.com/maxfrenzel/SampleVAE). 

To make sure your code changes are reflected in the application, there are some additional steps you need to take. 

For changes in the **frontend (javascript)**, go to the /ui folder and run the following in your terminal:

```bash
npm install
npm run build
```

For changes in the **backend (python)**:

```bash
python setup.py bdist_wheel
pip install --upgrade --force-reinstall dist/fennekservice-0.1-py3-none-any.whl 
```

Attention: You need to manually copy the react build from the build directory into the directory service/static (yes, there will be another dir in there called "static" as well).

## Roadmap and Shortcomings

The *play original* sound button needs to be enhanced: Currently, it is looking for the original sound file in the applications file structure. However, this shouldn’t be the case: It would make much more sense to take a point in the latent space and decode it. 
If you want to implement the please reach out to us ;). 

## Additional Screenshots
![Postprocessing](https://www.fennek-ai.com/wordpress/wp-content/uploads/2022/05/PercVAE-Prototype-Screenshots-14.png)
![Sequencer](https://www.fennek-ai.com/wordpress/wp-content/uploads/2022/05/PercVAE-Prototype-Screenshots-19.png)

