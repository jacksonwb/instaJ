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

	const currentEffects = []

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
			}
			else {
				currentEffects.push(effect)
			}
		}
	}

	let buttons = [
		{
			buttonText:'gray',
			onClick: getEffectToggle('gray')
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
		<div ref={photoWindow} className='photo-window' >
			<div className='photo-container center'>
				<OutputCanvas windowRef={photoWindow} canvasRef={canvasEl} videoRef={videoEl} effects={currentEffects}/>
				<video ref={videoEl} autoPlay style={{display:"none"}}></video>
			</div>
			<FloatButton img='/public/camera.svg' click={()=> {
				submitPhoto(canvasEl.current.toDataURL())
				window.location.href='/'
			}}/>
			<EffectsMenu buttons={buttons} effects={currentEffects}/>
		</div>
		</>
	)
}

function EffectsMenu(props) {
	const [, updateState] = useState()
	return (
		<div className='effects-menu'>
			{props.buttons.map((button) => {
				let handler = () => {
					updateState([])
					button.onClick()
				}
				return <EffectsButton key={button.buttonText} buttonText={button.buttonText} clickHandler={handler} active={props.effects.includes(button.buttonText)}/>
			})}
		</div>
	)
}

function EffectsButton(props) {
	let style = {}
	if (props.active) {
		style = {backgroundColor:'darkgray'}
	}
	return (
		<div className='effects-button' onClick={props.clickHandler} style={style}>{props.buttonText}</div>
	)
}

function OutputCanvas(props) {
	let img = new Image()
	img.src = '/public/jackson.png'
	let dropBoxRef = useRef(null)

	const [showDrop, setShowDrop] = useState(false)
	const [canvasImgSrc, setCanvasImgSrc] = useState(null)
	let canvasSrc = canvasImgSrc || props.videoRef.current

	useEffect(() => {
		window.requestAnimationFrame(() => {drawToCanvas(canvasSrc)})
	})

	function applyFilterEffects(effects) {
		let filterString = ''

		let effectsDefs = {
			'gray': () => {
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

	function dragLeaveHandler(e) {
		e.preventDefault()
		e.stopPropagation()
		console.log('Drag leave event')
		setShowDrop(false)
	}

	function dragEnterHandler(e) {
		e.preventDefault()
		e.stopPropagation()
		console.log('Drag enter event')
		setShowDrop(true)
	}

	function dragOverHandler(e) {
		e.preventDefault()
		e.stopPropagation()
		console.log('File in drop zone')
	}

	function dropHandler(e) {
		e.preventDefault()
		e.stopPropagation()
		if (e.dataTransfer.items[0].kind === 'file') {
			var file = e.dataTransfer.items[0].getAsFile();
			console.log(`Got file ${file.name}`);
			createImageBitmap(file).then((img) => {
				setShowDrop(false)
				let save = img
				setCanvasImgSrc(save);
				console.log(canvasImgSrc)
			}).catch((err) => {
				console.log(err)
			})
		}
	}

	function drawToCanvas(src) {
		props.canvasRef.current.width = props.videoRef.current.videoWidth
		props.canvasRef.current.height =props.videoRef.current.videoHeight
		applyFilterEffects(props.effects)
		if (src)
			props.canvasRef.current.getContext('2d').drawImage(src, 0, 0, props.canvasRef.current.width, props.canvasRef.current.height)
		applyImageEffects(props.effects)
		window.requestAnimationFrame(() => {drawToCanvas(canvasSrc)})
	}

	return (
		<div className='drop-container' >
			<canvas id='main-canvas' className='photo-canvas' ref={props.canvasRef}/>
			<div ref={dropBoxRef} className='drop-box' style={{opacity: showDrop ? '1' : '0'}} onDragOver={dragOverHandler} onDrop={dropHandler} onDragLeave={dragLeaveHandler} onDragEnter={dragEnterHandler}>
				Drop to upload...
			</div>
		</div>
	)
}

ReactDOM.render(
	<AppContainer>
		<MenuBar/>
		<PhotoApp/>
	</AppContainer>,
	document.getElementById('app')
)
