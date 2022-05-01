import React, { useState, useRef }  from 'react';
import 'react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css';
import RangeSlider from 'react-bootstrap-range-slider';
import SoundEffectWrapper from './SoundEffectWrapper';

class Slider extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      count: 0
    };
  }

  render() {
   //   console.log(this.props)
    return (
      <div>
        <SliderHook type={this.props.type}/>
      </div>
    )
    ;
   }

};

const SliderHook = (props) => {
  const [ value, setValue ] = useState(0);
  const [ finalValue, setFinalValue ] = React.useState(null);

  return (
    <RangeSlider
      value={value}
      onChange={changeEvent => setValue(changeEvent.target.value)}
      onAfterChange={e => setFinalValue(e.target.value)}
    />
  );

};

export default Slider