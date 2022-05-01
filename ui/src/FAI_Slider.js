import React, { Component } from 'react';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import './App.css';

class EffectSlider extends Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      value: props.value,
      sound: null,
      effect: ""
    }
  }

  handleChangeComplete = (event) => {
    this.props.handleChangeComplete(event,this.props.effect)
  }

  handleOnChange = (event) => {
     this.props.handleOnChange(event,this.props.effect)
  }

  render() {
    //console.log(this.props)
    this.state.sound = this.props.sound
    this.state.effect = this.props.effect

    return (
     <div className='slider-vertical'>
      <Slider
        value={this.props.value}
        orientation="vertical"
        onChange={this.handleOnChange}
        onChangeComplete={this.handleChangeComplete}
      />
      </div>
    )
  }
}

  export default EffectSlider;