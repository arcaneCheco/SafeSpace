'use strict';
const socket = io();
const e = React.createElement;

class VideoScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {

    return e(
      <div>
        <p>terfrfdsfds</p>
      </div>
    );
  }
}

const domContainer = document.querySelector('#videoScreen');
ReactDOM.render(e(VideoScreen), domContainer);