import React, { Component, useMemo,  useState } from 'react';
import './App.css';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import 'bootstrap/dist/css/bootstrap.css';
import {useDropzone} from 'react-dropzone';
import SoundEffectWrapper from './SoundEffectWrapper';
import EffectSlider from './FAI_Slider';
import Slider from 'react-rangeslider';
import * as Tone from 'tone';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Dropdown from 'react-bootstrap/Dropdown';
import { HotKeys, GlobalHotKeys, ObserveKeys, getApplicationKeyMap } from 'react-hotkeys';
import Badge from 'react-bootstrap/Badge';
import PlayHead from "./sequencer/components/PlayHead";
import TrackList from "./sequencer/components/TrackList";
import ToolBar from "./sequencer/components/Toolbar";
import Steps from "./sequencer/components/Steps";
import useStyles from "./sequencer/hooks/useStyles";
import Sequencer from "./sequencer/Sequencer";
import {getDateString} from "./utils";
import SoundVisualizer from "./components/SoundVisualizer";
import ParticlesBg from 'particles-bg';
import RefreshLogo from "./img/refresh_icon.svg";
import * as d3 from 'd3';
import BarChart from './D3/Scatterplot.js';
import Chart from "react-apexcharts";
import Form from 'react-bootstrap/Form';
import Accordion from "react-bootstrap/Accordion";

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out'
};

const activeStyle = {
  borderColor: '#2196f3'
};

const acceptStyle = {
  borderColor: '#00e676'
};

const rejectStyle = {
  borderColor: '#ff1744'
};




function StyledDropzone(props) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({accept: 'audio/wav', onDrop: props.onDrop});

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);

  return (
    <div className="container">
      <div {...getRootProps({style})}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
    </div>
  );
}

class App extends React.Component {

  constructor(props) {
    super(props);
    this.myRef = React.createRef();

    this.state = {
      isLoading: false,
      isGAN: true,
      isLoadingModel: false,
      isReadyForGeneration: false,
      isReadyForPostprocessing: false,
      loadingTextIdx: 0,
      isApplicationReady: false,
      isAE: false,
      isDDSP: false,
      isBookmarked: false,
      isSimilaritySearch: false,
      isUploadSuccessful: false,
      bookmarks: [],
      history: [],
      playing: false,
      isReversed: false,
      model: "Model Selection",
      model_instrument: "Instrument",
      result: "idd",
      selectedPoint: null,
      visualizations: null,
      files: "",
      sound: null,
      processedSound: null,
      volumeSliderValue: 100,
      distortion_value: 0,
      particlesColor: "#a9a9a9",
      reverb_value: 0,
      volume_value: 100,
      lowpass_value: 100,
      highpass_value: 0,
      ae_variance: 0,
      sequencerProps: {
        startTime: null,
        pastLapsedTime: 0,
        BPM: 120,
        setBPM: 120,
        currentStepID: null,
        totalSteps: 16
      },
      series: [{
              name: "Autoencoder Claps",
              data: [{
                    x: 34.7574,
                    y: 37.994343,
                    sound: "clap2"
                }, {
                    x: -31.031717,
                    y: 10.498918,
                    sound: "clap3"
                }],
            }],
      options: {
              chart: {
                 toolbar: {
                show: false},
                type: 'scatter',
                zoom: {
                  enabled: true,
                  type: 'xy'
                },
                events: {
                  markerClick: this.scatterMarkerClick
                }
              },
              xaxis: {
                tickAmount: 10,
                labels: {
                  show: false,
                  formatter: function(val) {
                    return parseFloat(val).toFixed(1)
                  }
                }
              },
              yaxis: {
                show: false,
                tickAmount: 7
              }
            }
    };
  }

  componentDidMount(){
    this.getBookmarksList()
    this.getHistoryList()
    this.initializeModels()
  }

  keyMap = {
      SPACE: "space",
      ENTER: "enter",
      SEQUENCER: "s"
  };

  particles_config = {
      num: [4, 7],
      rps: 0.1,
      radius: [5, 40],
      life: [1.5, 3],
      v: [2, 3],
      tha: [-40, 40],
      alpha: [0.6, 0],
      scale: [1, 0.1],
      position: "center", // all or center or {x:1,y:1,width:100,height:100}
      color: ["random", "#ff0000"],
      cross: "dead", // cross or bround
      random: 15,  // or null,
      g: 5,    // gravity
      onParticleUpdate: (ctx, particle) => {
          ctx.beginPath();
          ctx.rect(particle.p.x, particle.p.y, particle.radius * 2, particle.radius * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          ctx.closePath();
      }
    };

  loadingTextArray = ["Loading your Model...", "This may take a while...", "You look good today!", "Did you drink enough water?", "It's not you. It's me.", "Help, I'm trapped in a loader!",  "Counting backwards from Infinity", "Don't Panic"];

  storeDropContent = (acceptedFiles) => {
    var reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);
    var that = this;
    reader.onloadend = function() {
        /* reader.result contains based64 encoded stuff */
        let base64stuff = reader.result.replace(/^data:.+;base64,/, '');
        that.setState({files: base64stuff});

        fetch('/upload',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: base64stuff,
        })
      })
      .then(response => response.json())
      .then(response => {
         that.setState({
            isReadyForGeneration: true,
            isUploadSuccessful: true
        })

      });

    }
  }

  scatterMarkerClick = (event, chartContext, { seriesIndex, dataPointIndex, config}) => {
                            var point = this.state.series[0].data[dataPointIndex].sound
                            this.setState({ selectedPoint: point })

                    }

  onGenerate = (event) => {
    this.setState({ isLoading: true });
    fetch('/generate',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: this.state.files ? this.state.files : "generated.wav",
          model: this.state.model,
          model_instrument: this.state.model_instrument,
          selectedPoint: this.state.selectedPoint,
          ae_variance: this.state.ae_variance,
          timestamp: new Date().getTime()
        })
      })
      .then(response => response.json())
      .then(response => {
        var snd = new Audio("data:audio/wav;base64," + response.result);
        this.setState({
          result: response.result,
          sound: snd,
          processedSound: snd,
          isLoading: false,
          isReadyForPostprocessing: true,
          particlesColor: this.changeParticlesColor()
        });
        snd.play();
        this.getHistoryList()
      });
  }

  downloadStuff = () => {
    if(!this.state.result) {
      alert("Nothing to download you fool");
      return;
    }
        const sound = new Audio("data:audio/wav;base64," + this.state.result);

        const byteCharacters = atob(this.state.result);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new Blob([byteArray], {type: 'audio/wav'});

        const element = document.createElement("a");
        element.href = URL.createObjectURL(file);
        element.download = "sound.wav";
        document.body.appendChild(element);
        element.click();

  }

      playOriginalSound = () => {
     fetch('/play',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: "original",
          model: this.state.model,
          model_instrument: this.state.model_instrument,
          selectedPoint: this.state.selectedPoint,
          ae_variance: this.state.ae_variance,
          timestamp: new Date().getTime()
        })
      })
      .then(response => response.json())
      .then(response => {
        const snd = new Audio("data:audio/wav;base64," + response.result);
        snd.play();
      });
     }

    playStuff = () => {
     fetch('/play',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: this.state.files ? this.state.files : "processed.wav"
        })
      })
      .then(response => response.json())
      .then(response => {
        const snd = new Audio("data:audio/wav;base64," + response.result);
        this.setState({
          result: response.result,
          processedSound: snd,
          isLoading: false,
        });

        snd.play();
      });
     }

  handleCancelClick = (event) => {
    this.setState({ result: "" });
  }

  handleAnotherUpload = (event) => {
    this.setState({ isReadyForGeneration: false,
                    isUploadSuccessful: false,
                    isReadyForPostprocessing: false
     });
  }


  handleHotKeySpace= () => {
    this.playStuff()
  }

  handleHotKeySequencer= () => {
    let sequencerProps = this.state.sequencerProps
    if (sequencerProps.startTime){
        sequencerProps.startTime = null
        sequencerProps.pastLapsedTime = 0
    }else{
    sequencerProps.startTime = performance.now()
    }
    this.setState({sequencerProps: sequencerProps})
  }

  handleHotKeyEnter= () => {
      this.onGenerate()
  }

  loadSimilarityModelInBackend = () => {

    fetch('/similarity',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: "similarity",
        })
      })
      .then(response => response.json())
      .then(response => {
        clearInterval(this.timeout)
        this.setState({
          isLoadingModel: false,
          isReadyForGeneration: true,
          isSimilaritySearch: true,
          isUploadSuccessful: false,
          isReadyForPostprocessing: false,
          isReadyForGeneration: false
        });

      });
  }

  loadModelInBackend = (v_model, v_model_instrument) => {

    fetch('/tsne',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: "tsne",
          model_instrument: v_model_instrument
        })
      })
      .then(response => response.json())
      .then(response => {
        this.setState({
          series: response.result,
          isLoadingModel: false,
          isReadyForGeneration: true
        });
        clearInterval(this.timeout)

      });
  }

  handleDropdownVAE = (event) => {
    this.setState({model: "Variational Autoencoder" ,
                   isGAN: false,
                   isSimilaritySearch: false,
                   isReadyForPostprocessing: false,
                   isReadyForGeneration: false})

    if (this.state.model_instrument !== "Instrument"){
        this.timeout = setInterval(() => {
          let currentIdx = this.state.loadingTextIdx;
          this.setState({ loadingTextIdx: currentIdx + 1 });
        }, 2500)

         this.setState({
            isLoadingModel: true
        })

        this.loadModelInBackend(event.target.id, this.state.model_instrument)

        }

  }

  handleSimilaritySearch = (event) => {
    this.setState({model: "Similarity Search",
                   isGAN: true,
                   isLoadingModel: false,
                   isReadyForGeneration: true,
                   isSimilaritySearch: true,
                   isUploadSuccessful: false,
                   isReadyForPostprocessing: false,
                   isReadyForGeneration: false
                  })
  }


  handleRandom = (event) => {
    var random_boolean = Math.random() < 0.5;
    var v_distortion_value = Math.floor(Math.random() * 101);
    var v_reverb_value = Math.floor(Math.random() * 101);
    var v_highpass_value = Math.floor(Math.random() * 101);
    var v_lowpass_value = Math.floor(Math.random() * 101);

    this.setState({
    distortion_value: v_distortion_value,
    reverb_value: v_reverb_value,
    highpass_value: v_highpass_value,
    lowpass_value: v_lowpass_value,
    isReversed: random_boolean
    })
    this.setState({isBookmarked: false})
    this.postEffectsUpdate(random_boolean, v_reverb_value, v_highpass_value, v_lowpass_value, v_distortion_value)
  }

  handleDropdownInstrument = (event) => {
    this.setState({model_instrument: event.target.id,
                   isReadyForPostprocessing: false,
                   isReadyForGeneration: false})

    if (this.state.model != "Model Selection"){
        this.timeout = setInterval(() => {
          let currentIdx = this.state.loadingTextIdx;
          this.setState({ loadingTextIdx: currentIdx + 1 });
        }, 2500)
        this.setState({
            isLoadingModel: true
        })
        this.loadModelInBackend(this.state.model, event.target.id)

        }

  }

  handleDropdownPresets = (event) => {
    fetch('/getMongoDBData',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({id : event.target.id,
                              type: "presets"
        })
      })
      .then(response => response.json())
      .then(response => {
        this.setState({
            distortion_value: response.distortion_value,
            reverb_value: response.reverb_value,
            highpass_value: response.highpass_value,
            lowpass_value: response.lowpass_value,
            isReversed: response.isReversed,
            volume_value: response.volume_value
        })
        this.setState({isBookmarked: false})
        this.postEffectsUpdate()

      });
  }

  handleReverseSound = (event) => {
    if(this.state.isReversed === false) {
      this.setState({isReversed: true })
      this.postEffectsUpdate(true)
    } else {
      this.setState({isReversed: false })
      this.postEffectsUpdate(false)
    }
  }

  handleVisualization = (event) => {
    fetch('/getVisualization',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          data: "visualization"
        })
      })
      .then(response => response.json())
      .then(response => {
        var snd = new Audio("data:audio/wav;base64," + response.result);
        this.setState({
          visualizations: response.visualization
        });

      });
  }


  getBookmarkData = (event) => {
    //Handle History could be bookmark or history

    fetch('/getMongoDBData',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({id : event.target.id,
                              type: "bookmark"
        })
      })
      .then(response => response.json())
      .then(response => {
        const snd = new Audio("data:audio/wav;base64," + response.result);
        this.setState({
            distortion_value: response.distortion_value,
            reverb_value: response.reverb_value,
            highpass_value: response.highpass_value,
            lowpass_value: response.lowpass_value,
            isReversed: response.isReversed,
            volume_value: response.volume_value,
            result: response.result,
            processedSound: snd,
            isLoading: false,
        })
        snd.play();
        this.setState({isBookmarked: false})
        this.postEffectsUpdate()
      });
  }

  getHistoryData = (event) => {
    fetch('/getMongoDBData',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({id : event.target.id,
                              type: "history"
        })
      })
      .then(response => response.json())
      .then(response => {

        const snd = new Audio("data:audio/wav;base64," + response.result);
        this.setState({
          result: response.result,
          processedSound: snd,
          isLoading: false,
        });
        snd.play();

      });
  }

  handleBookmark = (event) => {
    if(this.state.isBookmarked === false) {
          fetch('/bookmark',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({data : "Bookmark_value",
                              volume_value: this.state.volume_value,
                              distortion_value: this.state.distortion_value,
                              reverb_value: this.state.reverb_value,
                              highpass_value: this.state.highpass_value,
                              lowpass_value: this.state.lowpass_value,
                              isReversed: this.state.isReversed,
                              model: this.state.model,
                              model_instrument: this.state.model_instrument,
                              timestamp: new Date().getTime()
        })
      })
      .then(response => response.json())
      .then(response => {
        this.setState({isBookmarked : true })
        this.getBookmarksList()
      });
    } else {
      this.setState({isBookmarked: false })
    }
   }

   handleScatterClick = (event) => {
    //console.log("Scatter")
    console.log(event)
    }

   changeParticlesColor = () => {
   var colors = ["#0000ff", "#ff00ff",
                "#ff0000", "#00ffff",
                "#00ff00"];

   return colors[Math.floor(Math.random() * colors.length)];
   }

   getBookmarksList = () => {
    fetch('/getMongoDBList',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({type: "bookmarks"
        })
      })
      .then(response => response.json())
      .then(response => {

        let tmp_bookmarks = response.result
        tmp_bookmarks.sort((a, b) => { return b.timestamp - a.timestamp })

        this.setState({
            bookmarks: tmp_bookmarks
        })

      });
   }

   getHistoryList = () => {
    fetch('/getMongoDBList',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({type: "history"
        })
      })
      .then(response => response.json())
      .then(response => {

        let tmp_history = response.result
        tmp_history.sort((a, b) => { return b.timestamp - a.timestamp })

        this.setState({
            history: tmp_history
        })

      });
   }

    initializeModels = () => {
    fetch('/initializeModels',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({type: "Initialize"
        })
      })
      .then(response => response.json())
      .then(response => {
        this.setState({isApplicationReady: true})
      });
   }


   handleOnChange = (value, effect) => {

   if(effect === "distortion"){
    this.setState({distortion_value: value})
    }
    if(effect === "reverb"){
    this.setState({reverb_value: value})
    }
    if(effect === "volume"){
    this.setState({volume_value: value})
    }
    if(effect === "lowpass"){
    this.setState({lowpass_value: value})
    }
     if(effect === "highpass"){
    this.setState({highpass_value: value})
    }

  }

  postEffectsUpdate = (isReversed = null, volume_value=null, reverb_value=null, highpass_value=null, lowpass_value=null, distortion_value=null) => {
    if(isReversed===null){ isReversed = this.state.isReversed}
    if(volume_value===null){volume_value= this.state.volume_value}
    if(distortion_value===null){distortion_value=this.state.distortion_value}
    if(reverb_value===null){reverb_value=this.state.reverb_value}
    if(highpass_value===null){highpass_value=this.state.highpass_value}
    if(lowpass_value===null){lowpass_value=this.state.lowpass_value}

    fetch('/effects',
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({data : "Effect_Values",
                              volume_value: volume_value,
                              distortion_value: distortion_value,
                              reverb_value: reverb_value,
                              highpass_value: highpass_value,
                              lowpass_value: lowpass_value,
                              isReversed: isReversed
        })
      })
      .then(response => response.json())
      .then(response => {
        console.log("successfully generated processed.wav file")
      });

  }

  handleChangeComplete = (event, effect) => {
    this.postEffectsUpdate()
    this.setState({isBookmarked: false})
  };

  setStartTime = (startTime) => {
      let sequencerProps = this.state.sequencerProps;
      sequencerProps.startTime = startTime;
      this.setState({sequencerProps: sequencerProps});
  }

  handleChangeAEVariance = (event)  => {
  this.setState({ae_variance: event.target.value});
  }

  setPastLapse = (pastLapse) => {
      let sequencerProps = this.state.sequencerProps;
      sequencerProps.pastLapse = pastLapse;
      this.setState({sequencerProps: sequencerProps});
  }

  setBPM = (setBPM) => {
      let sequencerProps = this.state.sequencerProps;
      sequencerProps.setBPM = setBPM;
      this.setState({sequencerProps: sequencerProps});
  }

  render() {
    const isLoading = this.state.isLoading;
    let bookmark_btn_class = this.state.isBookmarked ? "dark": "success";
    let bookmark_btn_text = this.state.isBookmarked ? "Bookmarked ⭐": "Bookmark";
    let reversed_btn_class = this.state.isReversed ? "secondary": "success";
    let reversed_btn_text = this.state.isReversed ? "Undo Reverse": "Reverse Sound";
    let loadingText = this.loadingTextArray[this.state.loadingTextIdx % this.loadingTextArray.length];

    return (
      <Container>
        <GlobalHotKeys keyMap={this.keyMap} handlers={{
          SPACE: this.handleHotKeySpace,
          SEQUENCER: this.handleHotKeySequencer,
          ENTER: this.handleHotKeyEnter
          }}/>
        <div className="content">
        { this.state.isApplicationReady ?
        <React.Fragment>
          <Row>
            <Col className="fennekcol">
              <h2>Select your Model and Instrument</h2>
            </Col>
          </Row>
          <Row>
              <Col className="fennekcol">
                  <Dropdown>
                    <Dropdown.Toggle block variant="primary" id="dropdown-basic">
                     {this.state.model}
                    </Dropdown.Toggle>
                  <Dropdown.Menu align="right" >
                    <Dropdown.Item onClick={this.handleDropdownVAE}>Variational Autoencoder</Dropdown.Item>
                    <Dropdown.Item onClick={this.handleSimilaritySearch}>Similarity Search</Dropdown.Item>
                  </Dropdown.Menu>
                  </Dropdown>
               </Col>
               {!this.state.isSimilaritySearch ?
               <Col className="fennekcol">
                   <Dropdown>
                    <Dropdown.Toggle block variant="primary" id="dropdown-basic">
                     {this.state.model_instrument}
                    </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item id="Kick" onClick={this.handleDropdownInstrument}>Kick</Dropdown.Item>
                        <Dropdown.Item id="Snare" onClick={this.handleDropdownInstrument}>Snare</Dropdown.Item>
                        <Dropdown.Item id="Hihat"onClick={this.handleDropdownInstrument}>Hi-Hat</Dropdown.Item>
                        <Dropdown.Item id="Clap" onClick={this.handleDropdownInstrument}>Clap</Dropdown.Item>
                        <Dropdown.Item id="Crash" onClick={this.handleDropdownInstrument}>Crash</Dropdown.Item>
                        <Dropdown.Item id="Toms" onClick={this.handleDropdownInstrument}>Toms</Dropdown.Item>
                      </Dropdown.Menu>
                  </Dropdown>
                </Col>
                : <div/>}
          </Row>
         <ParticlesBg color={this.state.particlesColor}  type="cobweb" bg={true} num={30} />
          <Row>
          <Col className="fennekcol">
          {this.state.isSimilaritySearch ?
          <React.Fragment>
              <h2>Add your Input</h2>
              {!this.state.isUploadSuccessful ?
              <StyledDropzone onDrop={this.storeDropContent}>
                {({getRootProps, getInputProps}) => (
                  <section>
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <p>Drag 'n' drop some files here, or click to select files</p>
                    </div>
                  </section>
                )}
              </StyledDropzone>
              :
               <React.Fragment>
              <p>Your Upload was successful! Go ahead and generate your file</p>
              <Button
                variant="primary"
                onClick={this.handleAnotherUpload}>
                Upload Another File
              </Button>
              </React.Fragment>
              }
              </React.Fragment>
          : <div/>}
          </Col>
          </Row>
          {this.state.isLoadingModel ?
          <div align="center">
          <p>{loadingText}</p>
          <div class="spinner-border text-primary" role="status">
          <span class="sr-only">Loading...</span>
          </div>
          </div>
          : <div/>}
          {this.state.isReadyForGeneration ?
          <React.Fragment>
          <Row className="justify-content-md-center row">
           <Col className="fennekcol">
              {this.state.isGAN ?
              <div/>
              :
              <React.Fragment>
              <div align="center" width="80%">
              <Chart
                  options={this.state.options}
                  series={this.state.series}
                  dataPointSelection= {this.handleScatterClick}
                  type="scatter"
                  width="600"
              />
              <p>Variance</p>
              <input
                  id="typeinp"
                  type="range"
                  min="0" max="5"
                  value={this.state.ae_variance}
                  onChange={this.handleChangeAEVariance}
                  step="1"/>
              </div>
              <div align="center">
               <Button
                variant="primary"
                onClick={this.playOriginalSound}>
                Listen to Original Sound
              </Button>
              </div>
              </React.Fragment>
              }
            </Col>
          </Row>
          <Row>
            <Col className="fennekcol">
            <hr/>
            <h2>Generate your Sound</h2>
            <p class="text-secondary">Hotkeys: 'Enter' to generate, 'Space' to Play  and 's' to Sequence Sound </p>
              <Button
                block
                variant="primary"
                disabled={isLoading}
                onClick={!isLoading ? this.onGenerate : null}>
                { isLoading ? 'Generating...' : 'Generate Sound with AI' }
              </Button>
            </Col>
          </Row>
          <Row style={{marginTop:"-10px"}} className="justify-content-md-center row">
          <Accordion style={{"text-align": "center"}}>
             <Accordion.Toggle as={Button} variant="link" eventKey="0">
                    Show Generation History
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="0">
                <Row>
                <div class="col-12">
                <ul class="list-group">
                    {this.state.history.map((history) => {
                    return <li id={history._id}
                               class="list-group-item py-1 list-group-item-action"
                               onClick={this.getHistoryData}>{history.instrument}
                               <Badge variant="warning" style={{"margin-left": "20px"}}>{history.model}</Badge>
                               <Badge variant="danger" style={{"margin-left": "20px"}}>{getDateString(history.timestamp)}</Badge>
                           </li>
                    })}
                </ul>
                </div>
                </Row>
            </Accordion.Collapse>
          </Accordion>
          </Row>
          </React.Fragment> : <div/>
          }
          {this.state.isReadyForPostprocessing ?
          <React.Fragment>
            <Col className="fennekcol">
            <hr/>
            <h2>Postprocessing</h2>
            </Col>
          <Row className="justify-content-md-center row" >
            {
              this.state.result ?
                  <div>
                  <Row>
                    <Col className="effectcol">
                      <Button block variant={"success"} onClick={this.playStuff}>
                        {this.state.playing ? "Playing..." :"▶"}
                      </Button>
                     </Col>
                  </Row>
                         <Row>
                             <Col className="effectcol">
                             <EffectSlider
                                value={this.state.distortion_value}
                                effect="distortion"
                                sound={this.state.sound}
                                handleOnChange={this.handleOnChange}
                                handleChangeComplete={this.handleChangeComplete}
                                orientation="horizontal"
                              />
                              <Row className="justify-content-md-center row">
                              <p> Distortion </p>
                              </Row>
                              </Col>
                              <Col className="effectcol">
                              <EffectSlider
                                value={this.state.reverb_value}
                                effect="reverb"
                                sound={this.state.sound}
                                handleOnChange={this.handleOnChange}
                                handleChangeComplete={this.handleChangeComplete}
                                orientation="horizontal"
                              />
                               <Row className="justify-content-md-center row">
                              <p> Reverb </p>
                              </Row>
                              </Col>
                              <Col className="effectcol">
                              <EffectSlider
                                value={this.state.volume_value}
                                effect="volume"
                                sound={this.state.sound}
                                handleOnChange={this.handleOnChange}
                                handleChangeComplete={this.handleChangeComplete}
                                orientation="horizontal"
                              />
                               <Row className="justify-content-md-center row">
                              <p> Volume </p>
                              </Row>
                              </Col>
                              <Col className="effectcol">
                              <EffectSlider
                                value={this.state.lowpass_value}
                                effect="lowpass"
                                sound={this.state.sound}
                                handleOnChange={this.handleOnChange}
                                handleChangeComplete={this.handleChangeComplete}
                                orientation="horizontal"
                              />
                               <Row className="justify-content-md-center row">
                              <p> Lowpass </p>
                              </Row>
                              </Col>
                              <Col className="effectcol">
                              <EffectSlider
                                value={this.state.highpass_value}
                                effect="highpass"
                                sound={this.state.sound}
                                handleOnChange={this.handleOnChange}
                                handleChangeComplete={this.handleChangeComplete}
                                orientation="horizontal"
                              />
                               <Row className="justify-content-md-center row">
                              <p> Highpass </p>
                              </Row>
                              </Col>
                         </Row>
                            <Row>
                    <Col className="effectcol">
                    <Button variant={"success"} onClick={this.handleRandom}>Random 🎲</Button>
                    </Col>
                    <Col className="effectcol">
                    <Button variant={reversed_btn_class} onClick={this.handleReverseSound}>{reversed_btn_text}</Button>
                    </Col>
                    <Col className="effectcol">
                    <Dropdown>
                <Dropdown.Toggle variant="success" id="dropdown-basic">
                 Presets
                </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item id="Big Room" onClick={this.handleDropdownPresets}>Big Room</Dropdown.Item>
                <Dropdown.Item id="Small Room" onClick={this.handleDropdownPresets}>Small Room</Dropdown.Item>
                <Dropdown.Item id="Clipping" onClick={this.handleDropdownPresets}>Clipping</Dropdown.Item>
              </Dropdown.Menu>
              </Dropdown>
                    </Col>
                    <Col className="effectcol">
                    <Button variant={bookmark_btn_class} onClick={this.handleBookmark}>{bookmark_btn_text}</Button>
                    </Col>
                    </Row>
                  </div>
                  :
                  <div/>
            }
          </Row>
          <Col className="fennekcol">
          <p class="text-secondary">Your bookmarked sounds</p>
          </Col>
          <Row>
            <div class="col-12">
                <ul class="list-group">
                    {this.state.bookmarks.map((bookmark) => {
                    return <li id={bookmark._id}
                               class="list-group-item list-group-item-action"
                               onClick={this.getBookmarkData}>{bookmark.instrument}
                               <Badge variant="warning" style={{"margin-left": "20px"}}>{bookmark.model}</Badge>
                               <Badge variant="danger" style={{"margin-left": "20px"}}>{getDateString(bookmark.timestamp)}</Badge>
                           </li>
                    })}
                </ul>
          </div>
          </Row>

          <Row>
          <Col className="fennekcol">
          <hr/>
          <h2>Sound Visualizer</h2>
          <Row className="justify-content-md-center row">
           <Button className="justify-content-md-center" class="border border-primary" variant={"light"} onClick={this.handleVisualization}><img src={RefreshLogo}/></Button>
          </Row>
          </Col>
          </Row>
          <Row>
              <Col className="fennekcol">
                  <SoundVisualizer
                    visualizations={this.state.visualizations}
                  />
              </Col>
          </Row>
          { this.state.result && this.state.result !== "i" ?
            <React.Fragment>
            <Row style={{"margin-top": "30px"}}>
              <Col className="fennekcol">
                <hr/>
                <h2>Sequencer</h2>
                <Sequencer
                    startTime={this.state.sequencerProps.startTime}
                    pastLapsedTime={this.state.sequencerProps.pastLapsedTime}
                    BPM={this.state.sequencerProps.setBPM}
                    base64Sound={this.state.result}
                    setStartTime={this.setStartTime}
                    setPastLapse={this.setPastLapse}
                    setBPM={this.setBPM}
                />
              </Col>
              </Row>
              <Row className="justify-content-md-center row">
                    <Button variant={"primary"} onClick={this.downloadStuff}>Download</Button>
              </Row>
              </React.Fragment>
              :
              null
          }
          </React.Fragment> : <div/>
          }
         </React.Fragment> :
         <React.Fragment>
         <ParticlesBg color={this.state.particlesColor}  type="cobweb" bg={true} num={30} />
        <div align="center">
         <p>Loading Application...</p>
         <div class="spinner-border text-primary" role="status" align="center">
         <span class="sr-only">Loading...</span>
         </div>
         </div>
         </React.Fragment>
         }
        </div>
      </Container>
    );
  }
}

export default App;