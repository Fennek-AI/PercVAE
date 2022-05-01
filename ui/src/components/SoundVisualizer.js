import React from "react";
import Image from "react-bootstrap/Image";
import Button from "react-bootstrap/Button";
import Carousel from "react-bootstrap/Carousel";
import Accordion from "react-bootstrap/Accordion";

import "../stylesheets/SoundVisualizer.css";


class SoundVisualizer extends React.Component {
    render() {
        if (!this.props.visualizations || this.props.visualizations.length === 0) {
            return null;
        }

        return (
               <Accordion style={{"text-align": "center"}}>
                <Accordion.Toggle as={Button} variant="link" eventKey="0">
                    Show Visualizer
                </Accordion.Toggle>
                <Accordion.Collapse eventKey="0">
                    <Carousel>
                        {this.props.visualizations.map(v =>
                            <Carousel.Item>
                                <h3>{v.name}</h3>
                                <Image style={{"width": "80%", "height": "auto"}} src={'data:image/png;base64,' + v.base64img} rounded/>
                            </Carousel.Item>
                        )}
                    </Carousel>
                </Accordion.Collapse>
            </Accordion>
        )
    }
}

export default SoundVisualizer;
