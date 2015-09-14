import ipc from 'ipc'
import React from 'react'
import {Body} from './script/body'
import {Footer} from './script/footer'
window.onload = () => {
    ipc.send('load-source');
    let activeEntry = 1;
    React.render(<Body active={activeEntry}/>,document.querySelector('#body'));
    React.render(<Footer />,document.querySelector('#footer'));
}
