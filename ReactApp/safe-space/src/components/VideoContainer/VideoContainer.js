import React from 'react'
import './VideoContainer.css'
import Signaling from './signalling';

const VideoContainer = () => {
  return (
    <div className='VideoContainer'>
      <h1 style={{ textAlign: 'center', margin: 0, padding: 100, color: 'gray' }}>A nice spot to put some Web RTC up possibly 🌈🚀</h1>
      <Signaling />
    </div>
  )
}

export default VideoContainer;
