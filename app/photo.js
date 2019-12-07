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
	const photoWindow = useRef(null)
	const posterRef = useRef(null)

	function submitPhoto(data) {
		fetch('/api/newimg', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({image: data})
		}).then(()=>{console.log('submitted')})
	}

	const [currentEffects, setCurrentEffects] = useState([])

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({video:true})
		.then(stream => {
			videoEl.current.srcObject = stream
			videoEl.current.addEventListener('loadeddata', () => {
				photoWindow.current.style.opacity = 1
				posterRef.current.style.opacity = 0
				setTimeout(() => {
					posterRef.current.style.display = 'none'
				}, 250)
			})
		})
		.catch(error => {console.log(error)})
	})

	function getEffectToggle(effect) {
		return function () {
			if (currentEffects.includes(effect)) {
				currentEffects.splice(currentEffects.indexOf(effect), 1)
				setCurrentEffects(currentEffects)
			}
			else
				currentEffects.push(effect)
				setCurrentEffects(currentEffects)
		}
	}

	let buttons = [
		{
			buttonText:'gray',
			onClick: getEffectToggle('grayscale')
		},
		{
			buttonText: 'sepia',
			onClick: getEffectToggle('sepia')
		},
		{
			buttonText: 'contrast',
			onClick: getEffectToggle('contrast')
		},
		{
			buttonText: 'invert',
			onClick: getEffectToggle('invert')
		},
		{
			buttonText: 'jackson',
			onClick: getEffectToggle('jackson')
		}
	]

	return (
		<>
		<div className='poster' ref={posterRef}>
			<img className='poster-img' src='/public/thumb.png'/>
			<p className='poster-text'>loading...</p>
		</div>
		<div ref={photoWindow} className='photo-window'>
			<div className='photo-container center'>
				<OutputCanvas windowRef={photoWindow} canvasRef={canvasEl} videoRef={videoEl} effects={currentEffects}/>
				<video ref={videoEl} autoPlay style={{display:"none"}}></video>
			</div>
			<FloatButton img='/public/camera.svg' click={()=> {
				submitPhoto(canvasEl.current.toDataURL())
				window.location.href='/'
			}}/>
			<EffectsMenu buttons={buttons}/>
		</div>
		</>
	)
}

function EffectsButton(props) {
	return (
		<div className='effects-button' onClick={props.clickHandler}>{props.buttonText}</div>
	)
}
function EffectsMenu(props) {
	return (
		<div className='effects-menu'>
			{props.buttons.map((button) => {
				return <EffectsButton key={button.buttonText} buttonText={button.buttonText} clickHandler={button.onClick}/>
			})}
		</div>
	)
}

function OutputCanvas(props) {
	let img = new Image()
	img.src = '/public/jackson.png'

	function applyFilterEffects(effects) {
		let filterString = ''

		let effectsDefs = {
			'grayscale': () => {
				filterString += ' grayscale(100%)'
			},
			'sepia': () => {
				filterString += ' sepia(50%)'
			},
			'contrast': () => {
				filterString += ' contrast(200%)'
			},
			'invert': () => {
				filterString += ' invert(100%)'
			}
		}

		if (effects.length) {
			for (const effect of effects) {
				if (effect in effectsDefs)
					effectsDefs[effect]()
			}
			props.canvasRef.current.getContext('2d').filter = filterString.trimLeft()
		}
	}

	function applyImageEffects(effects) {
		let effectsDefs = {
			'jackson': () => {
				props.canvasRef.current.getContext('2d').drawImage(img, 20, 100, 200, 900)
			}
		}
		if (effects.length) {
			for (const effect of effects) {
				if (effect in effectsDefs)
					effectsDefs[effect]()
			}
		}

	}

	function drawToCanvas() {
		props.canvasRef.current.width = props.videoRef.current.videoWidth
		props.canvasRef.current.height =props.videoRef.current.videoHeight
		applyFilterEffects(props.effects)
		props.canvasRef.current.getContext('2d').drawImage(props.videoRef.current, 0, 0, props.canvasRef.current.width, props.canvasRef.current.height)
		applyImageEffects(props.effects)
		window.requestAnimationFrame(drawToCanvas)
	}

	useEffect(() => {
		window.requestAnimationFrame(drawToCanvas)
	})

	return (
		<canvas id='main-canvas' className='photo-canvas' ref={props.canvasRef}></canvas>
	)
}

ReactDOM.render(
	<AppContainer>
		<MenuBar/>
		<PhotoApp/>
	</AppContainer>,
	document.getElementById('app')
)
