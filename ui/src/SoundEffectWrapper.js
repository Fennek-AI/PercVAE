import * as Tone from 'tone'
//ADSR

class SoundEffectWrapper{
  constructor(wavURL) {
    this.player = new Tone.Player(wavURL).toDestination();
    this.distortion = new Tone.Distortion(0).toDestination();
    this.volume = new Tone.Volume(-12).toMaster();
    this.reverb =  new Tone.Freeverb(0).toDestination();
  }

  setReverb(value){
    if(this.reverb == null)
    {
        console.log("Reverb does not exist")
        //create a reverb effect
        const freeverb = new Tone.Freeverb().toDestination();
        freeverb.roomsize = value;
        freeverb.dampening = 500 + (value * 100) ;
        this.reverb = freeverb;
        //connect player to the distortion
        this.player.connect(this.reverb);
    }else{
        console.log("Reverb exists")
        console.log("Ok lets set this value as Reverb" + value)
        this.reverb.roomsize = value;
        this.reverb.dampening = 1 + (value * 2000) ;
        this.reverb.wet.value = value;
        //this.reverb.reverb = value;
        console.log("roomsize="+this.reverb.roomsize)
        console.log("damping="+this.reverb.dampening)
        console.log("Reverb exists")
        this.player.connect(this.reverb);
    }
    //const distortion = new Tone.Distortion();
  }

  setVolume(value){
    var int_volume = 0;
    value = value * 50;
    if(this.volume == null)
    {
        console.log("Volume does not exist")
        //create a distortion effect
        int_volume = ( value - 100)
        console.log("value" + value)
        console.log("int_volume" + int_volume)
        const volume = new Tone.Volume(-12).toDestination();
        this.volume = volume;
        //connect player to the distortion
        //this.player.connect(this.volume);
    }else{
        console.log("Volume exists")
        console.log("Ok lets set this value as Volume" + value)
        int_volume = - 50 + value
        console.log("int_volume" + int_volume)
        this.volume.volume.value = int_volume;
        this.player.volume.value=this.volume.volume.value;
    }

  }

  setDistortion(value){

    if(this.distortion == null)
    {
        console.log("Distortion does not exist")
        //create a distortion effect
        const distortion = new Tone.Distortion(value).toDestination();
        this.distortion = distortion;
        //connect player to the distortion
        this.player.connect(this.distortion);
    }else{
        console.log("Distortion exists")
        console.log("Ok lets set this value as distortion" + value)
        this.distortion.distortion = value;
        this.player.connect(this.distortion);
    }
    //const distortion = new Tone.Distortion();
  }

  addEQ(wavURL){
    const filter = new Tone.Filter(400, 'lowpass').toDestination();
    this.player.connect(filter);
  }

  addDelay(wavURL){
    const feedbackDelay = new Tone.FeedbackDelay(0.125, 0.5).toDestination();
    // connect the player to the feedback delay and filter in parallel
    this.player.connect(feedbackDelay);
  }

  play(){
    Tone.loaded().then(() => {
        this.player.start();
    });
  }

  getPlayer(){
    return this.player
  }

  getReverb(){
    return {
    roomsize: this.reverb.roomsize,
    dampening: this.reverb.dampening,
    wet: this.reverb.wet.value
    };
  }

  getVolume(){
    return this.volume.volume.value
  }

  getDistortion(){
    return this.distortion.distortion
  }



}

  export default SoundEffectWrapper;