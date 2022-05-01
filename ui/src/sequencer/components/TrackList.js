import React, { useContext, memo } from 'react'
import { Context } from '../hooks/useStore'
import { soundFiles } from '../constants/config'
import Track from './Track'
import './Track.css'

const TrackList = ({ currentStepID, base64Sound }) => {
    const { sequence: { trackList, noteCount } } = useContext(Context)
    const content = trackList.map((track, trackID) => {
        const { title, onNotes, soundFile } = track;

        return (
            <Track
                key={title}
                trackID={+trackID}
                currentStepID={currentStepID}
                title={title}
                noteCount={noteCount}
                onNotes={onNotes}
                soundFilePath={base64Sound}
            />
        )
    })

    return (
        <div className="track-list">
            {content}
        </div>
    )
}

export default memo(TrackList)

