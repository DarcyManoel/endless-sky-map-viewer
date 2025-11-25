let canvas=document.getElementById(`canvas`)
	canvas.height=screen.height
	canvas.width=screen.width
let canvasContext=canvas.getContext(`2d`)
let overlay=document.getElementById(`overlay`)
	overlay.height=screen.height
	overlay.width=screen.width
let overlayContext=overlay.getContext(`2d`)
function initialize(){
	display=localStorage.getItem(`display`)
	for(i1=0;i1<displayOptions.length;i1++){
		document.getElementById(`display`).innerHTML+=`<label id="`+displayOptions[i1]+`" class="dark" onclick="cycleDisplay(this.id)">`+displayOptions[i1][0].toUpperCase()+displayOptions[i1].slice(1)+`</label><br>`
	}
	highlightDisplay()
	ownership=localStorage.getItem(`ownership`)
	for(i1=0;i1<ownershipOptions.length;i1++){
		document.getElementById(`ownership`).innerHTML+=`<label id="`+ownershipOptions[i1]+`" class="dark" onclick="cycleOwnership(this.id)">`+ownershipOptions[i1][0].toUpperCase()+ownershipOptions[i1].slice(1)+`</label><br>`
	}
	highlightOwnership()
	if(localStorage.getItem(`showHotkeys`)==`true`){
		showHotkeys=1
	}
	highlightHotkeys()
	canvasContext.scale((1/3)/scale,(1/3)/scale)
	overlayContext.scale((1/3)/scale,(1/3)/scale)
}
let dataFiles=[]
function importData(){
	let input=document.createElement(`input`)
	input.type=`file`
	input.webkitdirectory=true
	input.multiple=true
	input.style.display=`none`
	input.onchange=async event=>{
		dataFiles=[]
		for(let file of event.target.files){
			try{
				if(!file.name.endsWith(`.txt`)){continue}
				dataFiles.push(await file.text())
			}catch{}
		}
		parseLinesToTree()
		curateData()
	}
	document.body.appendChild(input)
	input.click()
	document.body.removeChild(input)
}
let nodes=[]
function parseLinesToTree(){
	nodes=[]
	let stack=[{children:nodes,indent:-1}] // initialize stack with virtual root nodes for hierarchy tracking
	for(let fileText of dataFiles){
		let lines=fileText
			.replace(/#.*$/gm,``) // remove comments since Endless Sky uses `#` for comment lines
			.split(/\n/) // split text into lines to process sequentially
		for(let line of lines){
			if(!line.trim())continue // skip empty or whitespace-only lines since they hold no data
			let indent=line.match(/^\t*/)[0].length // count leading tabs to determine indentation depth
			let node={line:line.trim(),children:[]} // create a node object with line content and empty children array
			while(stack.length&&stack.at(-1).indent>=indent){
				stack.pop() // remove the most recently stacked node since its indent is too deep to be the parent of the current line
			} // ensure the stack's top node has an indent smaller than the current line so we attach the node to the correct parent
			stack.at(-1).children.push(node) // attach current node to the most recent valid parent
			stack.push({...node,indent}) // push current node onto stack with its indent level to track nesting
		}
	}
	return nodes
}
let colours={}
let governments={}
let wormholes={}
let systems={}
function curateData(){
	// colours
	let colourNodes=nodes.filter(node=>node.line.startsWith(`color `))  // select only nodes that define colours
	for(let colour of colourNodes){
		let[name,channels]=colour.line // get name of colour and channels for the colour
			.replace(`color `,``)
			.replaceAll(`"`,``)
			.split(/(?<=[A-Za-z\)]) (?=[\d\.])/)
		colours[name]=channels // add colour key with relevant attributes
			.split(` `)
			.map(Number)
	}
	// governments
	let governmentNodes=nodes.filter(node=>node.line.startsWith(`government `))  // select only nodes that define governments
	for(let government of governmentNodes){
		let name=government.line // get name of government
			.replace(`government `,``)
			.replaceAll(`"`,``)
		let colourNode=government.children.find(child=>child.line.startsWith(`color `)) // get color node of government
		if(!colourNode)continue
		let colour=colourNode.line.endsWith(`"`) // get colour channels of government
			?colours[colourNode.line // get referenced colour channels from string
				.replace(`color `,``)
				.replaceAll(`"`,``)
			]
			:colourNode.line // convert colour string into channels array
				.replace(`color `,``)
				.split(` `)
				.map(Number)
		governments[name]=colour // add government key with relevant attributes
	}
	// wormholes
	let wormholeNodes=nodes.filter(node=>node.line.startsWith(`wormhole `))  // select only nodes that define wormholes
	for(let wormhole of wormholeNodes){
		// name
		let name=wormhole.line // get name of wormhole
			.replace(`wormhole `,``)
			.replaceAll(`"`,``)
		// mappable
		let mappable=wormhole.children
			.some(child=>child.line.includes(`mappable`))
		// links
		let links=wormhole.children // get link nodes of system
			.filter(child=>child.line.startsWith(`link `))
			.map(link=>link.line.replace(`link `,``))
			.map(link=>{
				let delimiter=/" "/
					.test(link)
						?`" "`
						:/" /.test(link)
							?`" `
							:/ "/.test(link)
								?` "`
								:` `
				return link
					.split(delimiter)
					.map(systemName=>systemName.replaceAll(`"`,``))
			})
		// colour
		let colourNode=wormhole.children.find(child=>child.line.startsWith(`color `)) // get color node of wormhole
		let colour
		if(colourNode){
			colour=colourNode.line.endsWith(`"`) // get colour channels of wormhole
				?colours[colourNode.line // get referenced colour channels from string
					.replace(`color `,``)
					.replaceAll(`"`,``)
				]
				:colourNode.line // convert colour string into channels array
					.replace(`color `,``)
					.split(` `)
					.map(Number)
		}else{
			colour=[.5,.2,.9] // default wormholes colour in Endless Sky
		}
		//
		wormholes[name]={
			mappable,
			links,
			colour
		}
	}
	// systems
	let systemNodes=nodes.filter(node=>node.line.startsWith(`system `))  // select only nodes that define systems
	for(let system of systemNodes){
		// name
		let name=system.line // get name of system
			.replace(`system `,``)
			.replaceAll(`"`,``)
		// position
		let positionNode=system.children.find(child=>child.line.startsWith(`pos `)) // get pos(ition) node of system
		let position=positionNode.line
			.replace(`pos `,``)
			.split(` `)
			.map(Number)
		// colour
		let governmentNode=system.children.find(child=>child.line.startsWith(`government `)) // get government node of system
		let government=governmentNode.line
			.replace(`government `,``)
			.replaceAll(`"`,``)
		// links
		let links=system.children // get link nodes of system
			.filter(child=>child.line.startsWith(`link `))
			.map(link=>link.line
				.replace(`link `,``)
				.replaceAll(`"`,``)
			)
		// planets
		let planets=system.children // get object nodes of system, excluding wormholes
			.filter(child=>child.line.startsWith(`object `))
			.filter(planet=>!planet.children.some(child=>child.line.includes(`wormhole`)))
		// jump range
		let jumpRangePresent=system.children
			.some(child=>child.line.includes(`"jump range" `))
		let jumpRange=100
		if(jumpRangePresent){
			let jumpRangeNode=system.children // get jump range node of system if present
				.find(child=>child.line.startsWith(`"jump range" `))
			jumpRange=+jumpRangeNode.line
				.replace(`"jump range" `,``)
				.replaceAll(`"`,``)
		}
		//
		systems[name]={ // add system key with relevant attributes
			position,
			colour:governments[government],
			links,
			planets:planets.length,
			jumpRange
		}
	}
	//
	loadGalaxies()
}
let galaxies=[]
function loadGalaxies(){
	let galaxyNodes=nodes // get galaxies in alphabetical order, excluding label galaxies
		.filter(node=>node.line.startsWith(`galaxy `))
		.filter(node=>!node.line.includes(`label`))
		.sort((a,b)=>a.line.localeCompare(b.line))
	let galaxiesLoaded=0
	for(let galaxy of galaxyNodes){
		let galaxyName=galaxy.line // get name of galaxy
			.replace(`galaxy `,``)
			.replaceAll(`"`,``)
		let positionNode=galaxy.children.find(child=>child.line.startsWith(`pos `)) // get position node of galaxy
		let galaxyPositionLocal=positionNode.line // get coordinates of galaxy
			.replace(`pos `,``)
			.split(` `)
			.map(Number)
		let spriteNode=galaxy.children.find(child=>child.line.startsWith(`sprite `)) // get sprite node of galaxy
		let galaxySpriteName=spriteNode.line // get name of galaxy sprite
			.replaceAll(`"`,``)
			.split(`/`)
			.at(-1)
		let galaxySprite=new Image()
		galaxySprite.src=`galaxies/${galaxySpriteName}.jpg` // load galaxy sprite from redefined path
		galaxySprite.onload=function(){ // draw galaxy on canvas after sprite loads
			galaxies.push({
				galaxyName,
				sprite:galaxySprite,
				position:galaxyPositionLocal
			})
			galaxiesLoaded++
			if(galaxiesLoaded===galaxyNodes.length){ // draw systems after final galaxy has been rendered
				readyInteractables()
				drawGalaxies()
			}
		}
	}
}
let isLoaded=0
function readyInteractables(){
	isLoaded=1
	document.getElementById(`galaxies`).innerHTML=``
	for(let galaxy of galaxies){
		document.getElementById(`galaxies`).innerHTML+=`<label id="`+galaxy.galaxyName+`" class="dark" onclick="cycleGalaxy(this.id)">'`+galaxy.galaxyName+`'</label><br>`
	}
	document.querySelectorAll(`.blocked`).forEach((element)=>{
		element.classList.remove(`blocked`)
	})
	document.querySelectorAll(`.hiddenTemp`).forEach((element)=>{
		element.classList.remove(`hiddenTemp`)
	})
	highlightGalaxy()
}
var galaxySelected=0
var galaxyPosition=[112,22]
function cycleGalaxy(id){
	for(let galaxy of galaxies){
		if(galaxy.galaxyName===id){
			galaxySelected=galaxies.indexOf(galaxy)
			galaxyPosition=galaxy.position
		}
	}
	highlightGalaxy()
	drawGalaxies()
}
function highlightGalaxy(){
	for(let galaxy of galaxies){
		document.getElementById(galaxy.galaxyName).classList.add(`dark`)
	}
	document.getElementById(galaxies[galaxySelected].galaxyName).classList.remove(`dark`)
}
function drawGalaxies(){
	canvasContext.clearRect(0,0,100000,100000) // initialise canvas by clearing entire map draw area
	for(let galaxy of galaxies){
		canvasContext.drawImage(
			galaxy.sprite,
			((galaxy.sprite.width/2)*-1)-galaxyPosition[0]+canvas.width*1.5*scale+galaxy.position[0],
			((galaxy.sprite.height/2)*-1)-galaxyPosition[1]+canvas.height*1.5*scale+galaxy.position[1]
		)
	}
	drawMap()
}
function drawMap(){
	for(let system of Object.values(systems)){
		drawSystem(
			system.position[0],
			system.position[1],
			system.colour,
			system.planets
		)
		for(let link of system.links){
			drawLink(
				system.position[0],
				system.position[1],
				systems[link].position[0]-((systems[link].position[0]-system.position[0])/2),
				systems[link].position[1]-((systems[link].position[1]-system.position[1])/2),
				system.colour
			)
		}
	}
	for(let wormhole of Object.values(wormholes)){
		for(let link of wormhole.links){
			drawWormhole(
				systems[link[0]].position[0],
				systems[link[0]].position[1],
				systems[link[1]].position[0],
				systems[link[1]].position[1],
				wormhole.colour
			)
		}
	}
	drawOverlay()
}
function drawOverlay(){
	overlayContext.clearRect(0,0,100000,100000)
	for(let systemName of systemsSelected){
		drawSelect(systems[systemName].position[0],systems[systemName].position[1])
		drawRange(systems[systemName].position[0],systems[systemName].position[1],systems[systemName].jumpRange,systems[systemName].colour,systems[systemName].planets)
	}
	if(target&&inRange){
		drawRange(systems[target].position[0],systems[target].position[1],systems[target].jumpRange,systems[target].colour,systems[target].planets)
	}
}
function drawSystem(x,y,colour,planetCount){
	var radius
	if(display==`original`){
		radius=9
	}else{
		radius=1
	}
	canvasContext.beginPath()
	canvasContext.arc(canvas.width*1.5*scale+ +x-galaxyPosition[0],canvas.height*1.5*scale+ +y-galaxyPosition[1],radius,0,2*Math.PI)
	canvasContext.setLineDash([])
	canvasContext.lineWidth=3.6
	if(planetCount>0||ownership==`claims`){
		canvasContext.strokeStyle=`rgb(`+colour[0]*255+`,`+colour[1]*255+`,`+colour[2]*255+`)`
	}else{
		canvasContext.strokeStyle=`rgb(102,102,102)`
	}
	canvasContext.stroke()
}
function drawLink(startX,startY,endX,endY,colour){
	canvasContext.beginPath()
	canvasContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
	canvasContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
	canvasContext.lineWidth=2
	if(display==`original`){
		canvasContext.setLineDash([0,15,10000])
		canvasContext.strokeStyle=`rgb(102,102,102)`
	}else{
		canvasContext.setLineDash([])
		if(colour){
			canvasContext.strokeStyle=`rgb(`+colour[0]*255+`,`+colour[1]*255+`,`+colour[2]*255+`)`
		}
	}
	canvasContext.stroke()
}
function drawWormhole(startX,startY,endX,endY,colour){
	canvasContext.beginPath()
	canvasContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
	canvasContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
	if(display==`original`){
		canvasContext.setLineDash([0,15,10000])
		canvasContext.lineWidth=1
	}else{
		canvasContext.setLineDash([])
		canvasContext.lineWidth=2
	}
	canvasContext.strokeStyle=`rgba(`+colour[0]*255+`,`+colour[1]*255+`,`+colour[2]*255+`,.5)`
	canvasContext.stroke()
	if(display==`original`){
		canvasContext.beginPath()
		canvasContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
		canvasContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
		canvasContext.setLineDash([0,15,25,10000])
		canvasContext.lineWidth=4
		canvasContext.strokeStyle=`rgb(`+colour[0]*255+`,`+colour[1]*255+`,`+colour[2]*255+`)`
		canvasContext.stroke()
	}
}
function drawSelect(x,y){
	overlayContext.beginPath()
	if(display==`original`){
		overlayContext.arc(canvas.width*1.5*scale+ +x-galaxyPosition[0],canvas.height*1.5*scale+ +y-galaxyPosition[1],16,0,2*Math.PI)
	}else{
		overlayContext.arc(canvas.width*1.5*scale+ +x-galaxyPosition[0],canvas.height*1.5*scale+ +y-galaxyPosition[1],4,0,2*Math.PI)
	}
	overlayContext.setLineDash([])
	overlayContext.lineWidth=2
	overlayContext.strokeStyle=`rgb(255,255,255)`
	overlayContext.stroke()
}
function drawRange(x,y,jumpRange,colour,planetCount){
	overlayContext.beginPath()
	overlayContext.setLineDash([])
	overlayContext.lineWidth=1
	overlayContext.arc(canvas.width*1.5*scale+ +x-galaxyPosition[0],canvas.height*1.5*scale+ +y-galaxyPosition[1],jumpRange,0,2*Math.PI)
	if(display==`original`){
		overlayContext.strokeStyle=`rgb(102,102,102)`
		overlayContext.stroke()
	}else{
		if(planetCount>0||ownership==`claims`){
			overlayContext.fillStyle=`rgba(`+colour[0]*255+`,`+colour[1]*255+`,`+colour[2]*255+`,.1)`
		}else{
			overlayContext.fillStyle=`rgba(102,102,102,.1)`
		}
		overlayContext.fill()
	}
}
const displayOptions=[`original`,`modern`]
var display=displayOptions[0]
function cycleDisplay(id){
	display=displayOptions[displayOptions.indexOf(id)]
	localStorage.setItem(`display`,display)
	highlightDisplay()
	drawGalaxies()
}
function highlightDisplay(){
	for(i1=0;i1<displayOptions.length;i1++){
		document.getElementById(displayOptions[i1]).classList.add(`dark`)
	}
	if(display==`original`){
		document.getElementById(`original`).classList.remove(`dark`)
	}else if(display==`modern`){
		document.getElementById(`modern`).classList.remove(`dark`)
	}
}
const ownershipOptions=[`habitation`,`claims`]
var ownership=ownershipOptions[0]
function cycleOwnership(id){
	ownership=ownershipOptions[ownershipOptions.indexOf(id)]
	localStorage.setItem(`ownership`,ownership)
	highlightOwnership()
	drawGalaxies()
}
function highlightOwnership(){
	for(i1=0;i1<ownershipOptions.length;i1++){
		document.getElementById(ownershipOptions[i1]).classList.add(`dark`)
	}
	if(ownership==`habitation`){
		document.getElementById(`habitation`).classList.remove(`dark`)
	}else if(ownership==`claims`){
		document.getElementById(`claims`).classList.remove(`dark`)
	}
}
let xCoordinate
let yCoordinate
let distance
let target
let targetPrev
let inRange
let inRangePrev
document.addEventListener(`mousemove`,mouseMove)
function mouseMove(event){
	if(isBlockedInteraction||!isLoaded){
		return
	}
	let rect=canvas.getBoundingClientRect() // get canvas position and size in CSS pixels
	xCoordinate=Math.round(((event.clientX-rect.left)*(canvas.width*3/rect.width)-canvas.width*1.5)*scale) // convert cursor X from CSS pixels to canvas space
	yCoordinate=Math.round(((event.clientY-rect.top)*(canvas.height*3/rect.height)-canvas.height*1.5)*scale) // convert cursor Y from CSS pixels to canvas space
	distance=undefined
	for(let[systemName,system]of Object.entries(systems)){
		if(Math.dist(system.position[0]-galaxyPosition[0],system.position[1]-galaxyPosition[1],xCoordinate,yCoordinate)<distance||!distance){
			target=systemName
			distance=Math.dist(system.position[0]-galaxyPosition[0],system.position[1]-galaxyPosition[1],xCoordinate,yCoordinate)
		}
	}
	inRange=undefined
	if(distance<=systems[target].jumpRange){
		inRange=1
	}
	if(inRange!==inRangePrev||target!==targetPrev){
		targetPrev=target
		inRangePrev=inRange
		drawOverlay()
	}
}
document.addEventListener(`mousedown`,mouseDown)
function mouseDown(){
	if(isBlockedInteraction){
		return
	}
	if(target){
		if(distance<=systems[target].jumpRange){
			systemsSelected=systemsSelected
				.includes(target)
					?systemsSelected.filter(item=>item!==target)
					:[...systemsSelected,target]
		}
	}
	drawOverlay()
}
var showHotkeys=0
function toggleHotkeys(){
	showHotkeys=!showHotkeys
	localStorage.setItem(`showHotkeys`,showHotkeys)
	highlightHotkeys()
}
function highlightHotkeys(){
	document.getElementById(`hotkeys`).classList.toggle(`dark`)
	var hotkeys=document.getElementsByTagName("sup")
	if(showHotkeys){
		document.getElementById(`hotkeys`).classList.remove(`dark`)
		for(i1=0;i1<hotkeys.length;i1++){
			document.getElementsByTagName("sup")[i1].classList.remove(`hiddenPerm`)
		}
	}else{
		document.getElementById(`hotkeys`).classList.add(`dark`)
		for(i1=0;i1<hotkeys.length;i1++){
			document.getElementsByTagName("sup")[i1].classList.add(`hiddenPerm`)
		}
	}
}
var isBlockedKeyDown=0
document.addEventListener(`keydown`,keyDown)
function keyDown(event){
	if(isLoaded){
		if(!isBlockedKeyDown){
			if(event.keyCode==18){		//	Alt
				toggleOptionsMenu(1)
			}
			if(showHotkeys){
				if(event.keyCode==83){		//	S
					expandSystemSelection()
				}
				if(event.keyCode==187){		//	+
					changeZoomLevel(1)
				}
				if(event.keyCode==189){		//	-
					changeZoomLevel(0)
				}
			}
		}
		if(event.keyCode){
			isBlockedKeyDown=1
		}
	}
}
document.addEventListener(`keyup`,keyUp)
function keyUp(event){
	isBlockedKeyDown=0
	if(event.keyCode==18){		//	Alt
		toggleOptionsMenu(0)
	}
}
var isBlockedInteraction=0
function toggleOptionsMenu(call){
	if(call){
		document.getElementById(`optionsMenus`).classList.remove(`hiddenPerm`)
		isBlockedInteraction=1
	}else{
		document.getElementById(`optionsMenus`).classList.add(`hiddenPerm`)
		isBlockedInteraction=0
	}
}
var systemsSelected=[]
function expandSystemSelection(){
	var expanded=0
	if(systemsSelected.length){
		for(let systemName of systemsSelected){
			for(let link of systems[systemName].links){
				if(!systemsSelected.includes(link)){
					expanded=1
					systemsSelected.push(link)
				}
			}
		}
	}
	else{
		for(let systemName of Object.keys(systems)){
			expanded=1
			systemsSelected.push(systemName)
		}
	}
	if(systemsSelected.length){
		if(!expanded){
			systemsSelected=[]
		}
	}
	drawGalaxies()
}
//	11.2x diff between min & max zoom
//	From 4x in to 2.8x out from default
const zoomLevels=[	//	Root of
	2.8,			//	8
	2,				//	4
	1.4,			//	2
	1,				//	1
	0.7,			//	0.5
	0.5,			//	0.25
	0.35,			//	0.125
	0.25			//	0.0625
]
var scale=1
function changeZoomLevel(zoomIn){
	canvasContext.scale(3*scale,3*scale)
	overlayContext.scale(3*scale,3*scale)
	var scaleIndex=zoomLevels.indexOf(scale)
	if(zoomIn){
		if((scaleIndex+1)<zoomLevels.length){
			scale=zoomLevels[scaleIndex+1]
		}
	}else{
		if(scaleIndex>0){
			scale=zoomLevels[scaleIndex-1]
		}
	}
	if(scale==zoomLevels[zoomLevels.length-1]){
		document.getElementById(`zoomIn`).classList.remove(`dark`)
		document.getElementById(`zoomInSuper`).classList.add(`dark`)
		document.getElementById(`zoomOut`).classList.add(`dark`)
		document.getElementById(`zoomOutSuper`).classList.remove(`dark`)
	}else if(scale==zoomLevels[0]){
		document.getElementById(`zoomIn`).classList.add(`dark`)
		document.getElementById(`zoomInSuper`).classList.remove(`dark`)
		document.getElementById(`zoomOut`).classList.remove(`dark`)
		document.getElementById(`zoomOutSuper`).classList.add(`dark`)
	}else{
		document.getElementById(`zoomIn`).classList.add(`dark`)
		document.getElementById(`zoomInSuper`).classList.remove(`dark`)
		document.getElementById(`zoomOut`).classList.add(`dark`)
		document.getElementById(`zoomOutSuper`).classList.remove(`dark`)
	}
	canvasContext.scale((1/3)/scale,(1/3)/scale)
	overlayContext.scale((1/3)/scale,(1/3)/scale)
	drawGalaxies()
}
//	Shortcuts
Math.dist=function(x1,y1,x2,y2){
	return Math.sqrt((+x2-+x1)*(+x2-+x1)+(+y2-+y1)*(+y2-+y1))
}
