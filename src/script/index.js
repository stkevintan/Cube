import ipc from 'ipc'
import React from 'react'
import {Sidebar} from './script/sidebar'
import {Footer} from './script/footer'
window.onload = () => {
    ipc.send('load-source');
    React.render(<Sidebar />,document.querySelector('#body .sidebar'));
    React.render(<Footer />,document.querySelector('#footer'));
}
