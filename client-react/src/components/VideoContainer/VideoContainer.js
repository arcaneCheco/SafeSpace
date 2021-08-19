import React from 'react'
import './VideoContainer.css'
import Signalling from './Signalling'

const VideoContainer = () => {
  return (
    <div className='VideoContainer'>
      <h1 style={{ textAlign: 'center', margin: 0, padding: 100, color: 'gray' }}>A nice spot to put some Web RTC up possibly</h1>
      <Signalling />
    </div>
  )
}

export default VideoContainer;
