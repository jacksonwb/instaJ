import React, {useEffect, useState, useRef} from 'react';
import ReactDOM from 'react-dom'
import AppContainer from './components/AppContainer'
import MenuBar from './components/MenuBar'
import FloatButton from './components/FloatButton'

function PhotoApp(props) {

	return (
		<div>
			<PhotoWindow/>
		</div>
	);
}

function PhotoWindow(props) {
	const videoEl = useRef(null)
	const canvasEl = useRef(null)

	function submitPhoto(data) {
		console.log(JSON.stringify({image: data}))
		fetch('/api/newimg', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({image: data})
		}).then(()=>{console.log('submitted')})
	}

	function drawToCanvas() {
		canvasEl.current.width = videoEl.current.videoWidth
		canvasEl.current.height = videoEl.current.videoHeight
		canvasEl.current.getContext('2d').drawImage(videoEl.current, 0, 0, canvasEl.current.width, canvasEl.current.height)
		window.requestAnimationFrame(drawToCanvas)
	}

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({video:true})
		.then(stream => {
			videoEl.current.srcObject = stream
		})
		.catch(error => {console.log(error)})
	})

	useEffect(() => {
		window.requestAnimationFrame(drawToCanvas)
	})

	return (
		<>
		<div className='photo-container center'>
			<canvas className="photo-canvas" ref={canvasEl}></canvas>
			<video ref={videoEl} autoPlay style={{display:"none"}}></video>
		</div>
		<FloatButton img='/public/camera.svg' click={()=> {
			submitPhoto(canvasEl.current.toDataURL())
		}}/>
		</>
	)
}

ReactDOM.render(
	<AppContainer>
		<MenuBar/>
		<PhotoApp/>
	</AppContainer>,
	document.getElementById('app')
)
