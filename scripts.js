const canvas=document.getElementById(`canvas`)
	canvas.height=screen.height
	canvas.width=screen.width
const canvasContext=canvas.getContext(`2d`)
const overlay=document.getElementById(`overlay`)
	overlay.height=screen.height
	overlay.width=screen.width
const overlayContext=overlay.getContext(`2d`)
const galaxy=document.getElementById(`background`)
const galaxyCentre=[galaxy.width/2*-1,galaxy.height/2*-1]
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
	drawGalaxies()
}
var systems=[]
var governments=[]
var galaxies=[]
var wormholes=[]
var colors=[]
function uploadFiles(that){
	var files=event.target.files
	for(i1=0;i1<files.length;i1++){
		var systemsReader=new FileReader()
		systemsReader.readAsText(files[i1])
		systemsReader.onload=function(e){
			var output=e.target.result
			lines=output.split(`\n`)
			for(i2=0;i2<lines.length;i2++){
				parseLine:{
					if(lines[i2].startsWith(`system `)){
						//	Override
						for(i3=0;i3<systems.length;i3++){
							if(lines[i2].slice(7).replaceAll(`"`,``).replaceAll(`\r`,``)==systems[i3][0]){
								for(i4=i2+1;i4<lines.length,lines[i4].startsWith(`\t`);i4++){
									defineSystem(1)
								}
								break parseLine
							}
						}
						//	Define
						systems.push([lines[i2].slice(7).replaceAll(`"`,``).replaceAll(`\r`,``),[],[`Unhabitation`],[],[],[],[100],[],[],[]])
						for(i3=i2+1;i3<lines.length,lines[i3].startsWith(`\t`);i3++){
							defineSystem(0)
						}
						break parseLine
					}else if(lines[i2].startsWith(`government `)){
						//	Override
						for(i3=0;i3<governments.length;i3++){
							if(lines[i2].slice(11).replaceAll(`"`,``).replaceAll(`\r`,``)==governments[i3][0]){
								for(i4=i2+1;i4<lines.length,lines[i4].startsWith(`\t`);i4++){
									defineGovernment()
								}
								break parseLine
							}
						}
						//	Define
						governments.push([lines[i2].slice(11).replaceAll(`"`,``).replaceAll(`\r`,``),[]])
						for(i3=i2+1;i3<lines.length,lines[i3].startsWith(`\t`);i3++){
							defineGovernment()
						}
						break parseLine
					}else if(lines[i2].startsWith(`galaxy `)){
						//	Define
						galaxies.push([lines[i2].slice(7).replaceAll(` `,``).replaceAll(`"`,``).replaceAll(`\r`,``),[],[]])
						for(i3=i2+1;i3<lines.length,lines[i3].startsWith(`\t`);i3++){
							defineGalaxy()
						}
						break parseLine
					}else if(lines[i2].startsWith(`wormhole `)){
						//	Define
						wormholes.push([lines[i2].slice(9).replaceAll(`\r`,``),0,[],[]])
						for(i3=i2+1;i3<lines.length,lines[i3].startsWith(`\t`);i3++){
							defineWormhole()
						}
						break parseLine
					}else if(lines[i2].startsWith(`color `)){
						//	Define
						colors.push(lines[i2].slice(7).replaceAll(`\r`,``).split(`" `))
						break parseLine
					}
				}
			}
		}
	}
	setTimeout(curateData,500)
	setTimeout(readyInteractables,500)
}
function defineGalaxy(){
	if(lines[i3].startsWith(`\tpos `)){
		galaxies[galaxies.length-1][1]=lines[i3].slice(5).replaceAll(`"`,``).replaceAll(`\r`,``).split(` `)
	}
	if(lines[i3].startsWith(`\tsprite `)){
		galaxies[galaxies.length-1][2]=lines[i3].slice(8).replaceAll(`"`,``).replaceAll(`\r`,``).split(`/`).at(-1)
	}
}
function defineSystem(override){
	if(override){
		if(lines[i4].startsWith(`\tpos `)){
			systems[i3][1]=lines[i4].slice(5).replaceAll(`"`,``).replaceAll(`\r`,``).split(` `)
		}else if(lines[i4].startsWith(`\tgovernment `)){
			systems[i3][2]=[lines[i4].slice(12).replaceAll(`"`,``).replaceAll(`\r`,``),[]]
		}else if(lines[i4].startsWith(`\tadd link `)){
			systems[i3][3].push([lines[i4].slice(10).replaceAll(`"`,``).replaceAll(`\r`,``),[],[]])
		}else if(lines[i4].startsWith(`\tadd object `)){
			var segmented=0
			for(i5=0;i5<systems[i3][4].length;i5++){
				if(systems[i3][4][i5]==lines[i4].slice(12).replaceAll(`"`,``).replaceAll(`\r`,``)){
					segmented=1
				}
			}
			if(!segmented){
				systems[i3][4].push(lines[i4].slice(12).replaceAll(`"`,``).replaceAll(`\r`,``))
			}
		}else if(lines[i4].startsWith(`\t"jump range" `)){
			systems[i3][6]=lines[i4].slice(14).replaceAll(`"`,``).replaceAll(`\r`,``)
		}
	}else{
		if(lines[i3].startsWith(`\tpos `)){
			systems[systems.length-1][1]=lines[i3].slice(5).replaceAll(`"`,``).replaceAll(`\r`,``).split(` `)
		}else if(lines[i3].startsWith(`\tgovernment `)){
			systems[systems.length-1][2]=[lines[i3].slice(12).replaceAll(`"`,``).replaceAll(`\r`,``),[]]
		}else if(lines[i3].startsWith(`\tlink `)){
			systems[systems.length-1][3].push([lines[i3].slice(6).replaceAll(`"`,``).replaceAll(`\r`,``),[],[]])
		}else if(lines[i3].startsWith(`\tobject `)){
			var segmented=0
			for(i4=0;i4<systems[systems.length-1][4].length;i4++){
				if(systems[systems.length-1][4][i4]==lines[i3].slice(8).replaceAll(`"`,``).replaceAll(`\r`,``)){
					segmented=1
				}
			}
			if(!segmented){
				systems[systems.length-1][4].push(lines[i3].slice(8).replaceAll(`"`,``).replaceAll(`\r`,``))
			}
		}else if(lines[i3].startsWith(`\t\tobject `)){
			var segmented=0
			for(i4=0;i4<systems[systems.length-1][4].length;i4++){
				if(systems[systems.length-1][4][i4]==lines[i3].slice(9).replaceAll(`"`,``).replaceAll(`\r`,``)){
					segmented=1
				}
			}
			if(!segmented){
				systems[systems.length-1][4].push(lines[i3].slice(9).replaceAll(`"`,``).replaceAll(`\r`,``))
			}
		}else if(lines[i3].startsWith(`\t"jump range" `)){
			systems[systems.length-1][6]=lines[i3].slice(14).replaceAll(`"`,``).replaceAll(`\r`,``)
		}else if(lines[i3].startsWith(`\ttrade `)){
			systems[systems.length-1][9].push(lines[i3].slice(7).replaceAll(`"`,``).replaceAll(`\r`,``))
		}
	}
}
function defineWormhole(){
	if(lines[i3].startsWith(`\tmappable`)){
		wormholes[wormholes.length-1][1]=1
	}else if(lines[i3].startsWith(`\tlink `)){
		if(lines[i3].includes(`" `)){
			wormholes[wormholes.length-1][2].push([lines[i3].slice(6).split(`" `),[]])
			wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][0]=wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][0].replaceAll(`"`,``)
			wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][1]=wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][1].replaceAll(`"`,``)
		}else if(lines[i3].includes(` "`)){
			wormholes[wormholes.length-1][2].push([lines[i3].slice(6).split(` "`),[]])
			wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][0]=wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][0].replaceAll(`"`,``)
			wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][1]=wormholes[wormholes.length-1][2][wormholes[wormholes.length-1][2].length-1][0][1].replaceAll(`"`,``)
		}else{
			wormholes[wormholes.length-1][2].push([lines[i3].slice(6).split(` `),[]])
		}
	}else if(lines[i3].startsWith(`\tcolor `)){
		wormholes[wormholes.length-1][3]=[lines[i3].slice(7).replaceAll(`"`,``),lines[i3].slice(7).replaceAll(`"`,``)]
	}
}
function defineGovernment(){
	if(lines[i3].startsWith(`\tcolor `)){
		if(lines[i3].includes(`governments:`)){
			for(i5=0;i5<lines.length;i5++){
				if(lines[i5].startsWith(`color "governments: `+lines[i3].slice(21,-1)+`"`)){
					var sliceLength=22+lines[i3].slice(21,-1).length
					governments[governments.length-1][1]=lines[i5].slice(sliceLength).replaceAll(`"`,``).replaceAll(`\r`,``).split(` `)
				}
			}
		}
		else{
			governments[governments.length-1][1]=lines[i3].slice(7).replaceAll(`"`,``).replaceAll(`\r`,``).split(` `)
		}
	}
}
var isLoaded=0
var cyclableGalaxies=[]
const tradeTemplate=[`Food`,`Clothing`,`Metal`,`Plastic`,`Equipment`,`Medical`,`Industrial`,`Electronics`,`Heavy Metals`,`Luxury Goods`]
var tradeAverage=[[`Food`,0,0],[`Clothing`,0,0],[`Metal`,0,0],[`Plastic`,0,0],[`Equipment`,0,0],[`Medical`,0,0],[`Industrial`,0,0],[`Electronics`,0,0],[`Heavy Metals`,0,0],[`Luxury Goods`,0,0]]
function curateData(){
	//	Galaxies cyclable
	cyclableGalaxies=[galaxies.find(galaxy=>galaxy[0]===`MilkyWay`)]
	for(i1=0;i1<galaxies.length;i1++){
		var galaxyTooClose=0
		for(i2=0;i2<cyclableGalaxies.length;i2++){
			if(Math.dist(cyclableGalaxies[i2][1][0],cyclableGalaxies[i2][1][1],galaxies[i1][1][0],galaxies[i1][1][1])<2000){
				galaxyTooClose=1
			}
		}
		if(!galaxyTooClose){
			cyclableGalaxies.push(galaxies[i1])
		}
	}
	//	Systems local lookup
	for(i1=0;i1<systems.length;i1++){
		//	Government
		for(i2=0;i2<governments.length;i2++){
			if(systems[i1][2][0]==governments[i2][0]){
				systems[i1][2][1]=governments[i2][1]
			}
		}
		//	Links
		for(i2=0;i2<systems[i1][3].length;i2++){
			for(i3=0;i3<systems.length;i3++){
				if(systems[i1][3][i2][0]==systems[i3][0]){
					//	Position
					systems[i1][3][i2][1]=systems[i3][1]
					//	Government
					systems[i1][3][i2][2]=systems[i3][2]
				}
			}
		}
		//	Objects that are wormholes
		for(i2=0;i2<systems[i1][4].length;i2++){
			for(i3=0;i3<wormholes.length;i3++){
				if(wormholes[i3][0].includes(systems[i1][4][i2])){
					systems[i1][5].push(systems[i1][4][i2])
					systems[i1][4].splice(i2,1)
				}
			}
		}
		//	Systems in range
		systems[i1][7]=[]
		for(i2=0;i2<systems.length;i2++){
			if(Math.dist(systems[i1][1][0],systems[i1][1][1],systems[i2][1][0],systems[i2][1][1])<=systems[i1][6]&&systems[i1][0]!==systems[i2][0]){
				systems[i1][7].push([systems[i2][0],systems[i2][1]])
			}
		}
		//	Systems with overlapping ranges
		systems[i1][8]=[]
		for(i2=0;i2<systems.length;i2++){
			if(Math.dist(systems[i1][1][0],systems[i1][1][1],systems[i2][1][0],systems[i2][1][1])<=+systems[i1][6]+ +systems[i2][6]&&systems[i1][0]!==systems[i2][0]){
				systems[i1][8].push([[systems[i2][0],systems[i2][1]],0])
			}
		}
		for(i2=0;i2<systems[i1][8].length;i2++){
			systems[i1][8][i2][1]=Math.atan2(systems[i1][8][i2][0][1][0]-systems[i1][1][0],systems[i1][8][i2][0][1][1]-systems[i1][1][1])
		}
		systems[i1][8].sort((a,b)=>a[1]-b[1])
		//	Trade Values
		for(i2=0;i2<systems[i1][9].length;i2++){
			systems[i1][9][i2]=splitLastOccurrence(systems[i1][9][i2],` `)
		}
		systems[i1][9].sort(sortTrade)
	}
	//	Wormholes local lookup
	for(i1=0;i1<wormholes.length;i1++){
		//	Links
		for(i2=0;i2<wormholes[i1][2].length;i2++){
			for(i3=0;i3<systems.length;i3++){
				if(systems[i3][0]==wormholes[i1][2][i2][0][0]){
					wormholes[i1][2][i2][1][0]=systems[i3][1]
				}else if(systems[i3][0]==wormholes[i1][2][i2][0][1]){
					wormholes[i1][2][i2][1][1]=systems[i3][1]
				}
			}
		}
		//	Colour
		for(i2=0;i2<colors.length;i2++){
			if(wormholes[i1][3][0]==colors[i2][0]){
				wormholes[i1][3][1]=colors[i2][1]
			}
		}
	}
	//	begin rendering after galaxy images are loaded
	for(let galaxy of cyclableGalaxies){
		let galaxySprite=new Image()
		galaxySprite.src=`galaxies/${galaxy[2]}.jpg`
		galaxySprite.onload=function(){
			galaxiesLoaded++
			if(galaxiesLoaded===cyclableGalaxies.length)drawGalaxies()
		}
		galaxyImages.push({galaxySprite,galaxy})
	}
}
function readyInteractables(){
	isLoaded=1
	document.getElementById(`galaxies`).innerHTML=``
	for(i1=0;i1<cyclableGalaxies.length;i1++){
		document.getElementById(`galaxies`).innerHTML+=`<label id="`+cyclableGalaxies[i1][0]+`" class="dark" onclick="cycleGalaxy(this.id)">`+cyclableGalaxies[i1][0]+`</label><br>`
	}
	document.querySelectorAll(`.blocked`).forEach((element)=>{
		element.classList.remove(`blocked`)
	})
	document.querySelectorAll(`.hiddenTemp`).forEach((element)=>{
		element.classList.remove(`hiddenTemp`)
	})
	highlightGalaxy()
}
let galaxyImages=[]
let galaxiesLoaded=0
function drawGalaxies(){
	canvasContext.clearRect(0,0,100000,100000)
	for(let galaxy of galaxyImages){
		let galaxySprite=galaxy.galaxySprite
		let galaxyDetails=galaxy.galaxy
		canvasContext.drawImage(galaxySprite,((galaxySprite.width/2)*-1)- +galaxyPosition[0]+canvas.width*1.5*scale+ +galaxyDetails[1][0],((galaxySprite.height/2)*-1)- +galaxyPosition[1]+canvas.height*1.5*scale+ +galaxyDetails[1][1])
	}
	drawMap()
}
function drawMap(){
	for(i1=0;i1<systems.length;i1++){
		drawSystem(systems[i1][1][0],systems[i1][1][1],systems[i1][2][1],systems[i1][4].length)
		for(i2=0;i2<systems[i1][3].length;i2++){
			drawLink(systems[i1][1][0],systems[i1][1][1],systems[i1][3][i2][1][0]-((systems[i1][3][i2][1][0]-systems[i1][1][0])/2),systems[i1][3][i2][1][1]-((systems[i1][3][i2][1][1]-systems[i1][1][1])/2))
		}
	}
	for(i1=0;i1<wormholes.length;i1++){
		if(wormholes[i1][1]){
			for(i2=0;i2<wormholes[i1][2].length;i2++){
				if(wormholes[i1][3].length){
					drawWormhole(wormholes[i1][2][i2][1][0][0],wormholes[i1][2][i2][1][0][1],wormholes[i1][2][i2][1][1][0],wormholes[i1][2][i2][1][1][1],wormholes[i1][3][1])
				}else{
					drawWormhole(wormholes[i1][2][i2][1][0][0],wormholes[i1][2][i2][1][0][1],wormholes[i1][2][i2][1][1][0],wormholes[i1][2][i2][1][1][1])
				}
			}
		}
	}
	drawOverlay()
}
function drawOverlay(){
	overlayContext.clearRect(0,0,100000,100000)
	if(rangeCheck){
		if(target){
			if(distance<=systems[target][6]){
				for(i2=0;i2<systems[target][3].length;i2++){
					drawRangeCheck(systems[target][1][0],systems[target][1][1],systems[target][3][i2][1][0],systems[target][3][i2][1][1],1)
				}
				for(i2=0;i2<systems[target][7].length;i2++){
					if(Math.dist(systems[target][1][0],systems[target][1][1],systems[target][7][i2][1][0],systems[target][7][i2][1][1])<=systems[target][6]){
						drawRangeCheck(systems[target][1][0],systems[target][1][1],systems[target][7][i2][1][0],systems[target][7][i2][1][1],1)
					}
				}
			}
		}
		for(i1=0;i1<systemsSelected.length;i1++){
			for(i2=0;i2<systems[systemsSelected[i1]][3].length;i2++){
				drawRangeCheck(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i1]][3][i2][1][0],systems[systemsSelected[i1]][3][i2][1][1],1)
			}
			for(i2=0;i2<systems[systemsSelected[i1]][7].length;i2++){
				if(Math.dist(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i1]][7][i2][1][0],systems[systemsSelected[i1]][7][i2][1][1])<=systems[systemsSelected[i1]][6]){
					drawRangeCheck(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i1]][7][i2][1][0],systems[systemsSelected[i1]][7][i2][1][1],1)
				}
			}
		}
	}
	if(linklengthCheck){
		drawLinkLengthCore()
		for(i1=0;i1<systemsSelected.length;i1++){
			for(i2=0;i2<systems[systemsSelected[i1]][3].length;i2++){
				drawLinkLengthCheck(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i1]][3][i2][1][0],systems[systemsSelected[i1]][3][i2][1][1],systems[systemsSelected[i1]][3][i2][2][1])
			}
		}
	}
	if(!rangeCheck){
		for(i1=0;i1<systemsSelected.length;i1++){
			drawSelect(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1])
			drawRange(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i1]][6],systems[systemsSelected[i1]][2][1],systems[systemsSelected[i1]][4].length)
		}
		if(target){
			if(distance<=systems[target][6]){
				drawRange(systems[target][1][0],systems[target][1][1],systems[target][6],systems[target][2][1],systems[target][4].length)
				if(showSystemInformation){
					drawSystemInformation(target)
				}
			}
		}
	}
	if(showTrade){
		drawTrade()
	}
	if(showSystemInformation){
		for(i1=0;i1<systemsSelected.length;i1++){
			drawSystemInformation(systemsSelected[i1])
		}
	}
}
function drawSystemInformation(system){
	overlayContext.beginPath()
	overlayContext.textAlign=`center`
	overlayContext.font=32*scale+`px Ubuntu`
	overlayContext.fillStyle=`#9f9f9f`
	overlayContext.fillText(systems[system][0],canvas.width*1.5*scale+ +systems[system][1][0]-galaxyPosition[0],canvas.height*1.5*scale+ +systems[system][1][1]-galaxyPosition[1]+(40*scale))
	overlayContext.fillText(systems[system][1].join(`  `),canvas.width*1.5*scale+ +systems[system][1][0]-galaxyPosition[0],canvas.height*1.5*scale+ +systems[system][1][1]-galaxyPosition[1]+(80*scale))
}
function drawTrade(){
	document.getElementById(`selectedCount`).innerHTML=``
	document.getElementById(`selectedHabitation`).innerHTML=``
	tradeAverage=[[`Food`,0,``,0],[`Clothing`,0,``,0],[`Metal`,0,``,0],[`Plastic`,0,``,0],[`Equipment`,0,``,0],[`Medical`,0,``,0],[`Industrial`,0,``,0],[`Electronics`,0,``,0],[`Heavy Metals`,0,``,0],[`Luxury Goods`,0,``,0]]
	document.getElementById(`systemTrade`).innerHTML=``
	if(systemsSelected.length){
		for(i1=0;i1<systemsSelected.length;i1++){
			if(target){
				for(i2=0;i2<systems[target][9].length;i2++){
					if(distance<=systems[target][6]&&systems[target][9].length){
						tradeAverage[i2][1]=systems[target][9][i2][1]
					}else{
						tradeAverage[i2][1]=systems[systemsSelected[systemsSelected.length-1]][9][i2][1]
					}
				}
			}
			for(i2=0;i2<systems[systemsSelected[i1]][9].length;i2++){
				tradeAverage[i2][3]=tradeAverage[i2][3]+parseInt(systems[systemsSelected[i1]][9][i2][1])
			}
		}
		for(i1=0;i1<tradeAverage.length;i1++){
			tradeAverage[i1][3]=Math.round((tradeAverage[i1][3]/systemsSelected.length)*100)/100
			if(tradeAverage[i1][1]>0&&tradeAverage[i1][3]>0){
				if(tradeAverage[i1][1]>tradeAverage[i1][3]){
					tradeAverage[i1][2]=`+`+(Math.round((tradeAverage[i1][1]/tradeAverage[i1][3])*100)-100)+`%`
				}
				if(tradeAverage[i1][1]<tradeAverage[i1][3]){
					tradeAverage[i1][2]=`-`+(100-Math.round((tradeAverage[i1][1]/tradeAverage[i1][3])*100))+`%`
				}
			}
		}
		if(systemsSelected.length>1){
			var selectedHabitation=0
			for(i1=0;i1<systemsSelected.length;i1++){
				if(systems[systemsSelected[i1]][4].length){
					selectedHabitation++
				}
			}
			document.getElementById(`selectedCount`).innerHTML=systemsSelected.length+` systems selected`
			document.getElementById(`selectedHabitation`).innerHTML=Math.round(selectedHabitation*100/systemsSelected.length*100)/100+`% Habitation`
		}else{
			document.getElementById(`selectedHabitation`).innerHTML=``
		}
		document.getElementById(`systemTrade`).innerHTML=
			`<table>
				<tr>
					<th></th>
					<th title="Cost in target system (hovered or last selected)">TGT</th>
					<th title="Cost difference % between target system and average of selected systems">DIFF</th>
					<th title="Average cost in all selected systems">AVG</th>
				</tr>
				<tr><td>`+tradeAverage.map(e=>e.join(`</td><td>`)).join('</td></tr><tr><td>')+`</td></tr>
			</table>`
	}else{
		if(target){
			if(distance<=systems[target][6]){
				if(systems[target][9].length){
					document.getElementById(`systemTrade`).innerHTML=`<table><tr><td class="dark">`+systems[target][9].map(e=>e.join(`</td><td class="dark">`)).join('</td></tr><tr><td class="dark">')+`</td></tr></table>`
				}else{
					document.getElementById(`systemTrade`).innerHTML=
						`<table>
							<tr><td class="dark">Food</td><td class="dark">0</td></tr>
							<tr><td class="dark">Clothing</td><td class="dark">0</td></tr>
							<tr><td class="dark">Metal</td><td class="dark">0</td></tr>
							<tr><td class="dark">Plastic</td><td class="dark">0</td></tr>
							<tr><td class="dark">Equipment</td><td class="dark">0</td></tr>
							<tr><td class="dark">Medical</td><td class="dark">0</td></tr>
							<tr><td class="dark">Industrial</td><td class="dark">0</td></tr>
							<tr><td class="dark">Electronics</td><td class="dark">0</td></tr>
							<tr><td class="dark">Heavy Metals</td><td class="dark">0</td></tr>
							<tr><td class="dark">Luxury Goods</td><td class="dark">0</td></tr>
						</table>`
				}
			}
		}
	}
}
function drawSystem(x,y,systemGovernment,planetCount){
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
		canvasContext.strokeStyle=`rgb(`+systemGovernment[0]*255+`,`+systemGovernment[1]*255+`,`+systemGovernment[2]*255+`)`
	}else{
		canvasContext.strokeStyle=`rgb(102,102,102)`
	}
	canvasContext.stroke()
}
function drawLink(startX,startY,endX,endY,systemGovernment){
	canvasContext.beginPath()
	canvasContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
	canvasContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
	canvasContext.lineWidth=2
	if(display==`original`){
		canvasContext.setLineDash([0,15,10000])
		canvasContext.strokeStyle=`rgb(102,102,102)`
	}else{
		canvasContext.setLineDash([])
		if(systemGovernment){
			canvasContext.strokeStyle=`rgb(`+systemGovernment[0]*255+`,`+systemGovernment[1]*255+`,`+systemGovernment[2]*255+`)`
		}
	}
	canvasContext.stroke()
}
function drawWormhole(startX,startY,endX,endY,color){
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
	if(color){
		canvasContext.strokeStyle=`rgba(`+color.split(` `)[0]*255+`,`+color.split(` `)[1]*255+`,`+color.split(` `)[2]*255+`,.5)`
	}else{
		canvasContext.strokeStyle=`rgba(128,51,230,.5)`
	}
	canvasContext.stroke()
	if(display==`original`){
		canvasContext.beginPath()
		canvasContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
		canvasContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
		canvasContext.setLineDash([0,15,25,10000])
		canvasContext.lineWidth=4
		if(color){
			canvasContext.strokeStyle=`rgb(`+color.split(` `)[0]*255+`,`+color.split(` `)[1]*255+`,`+color.split(` `)[2]*255+`)`
		}else{
			canvasContext.strokeStyle=`rgb(128,51,230)`
		}
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
function drawRange(x,y,range,systemGovernment,planetCount){
	overlayContext.beginPath()
	overlayContext.setLineDash([])
	overlayContext.lineWidth=1
	overlayContext.arc(canvas.width*1.5*scale+ +x-galaxyPosition[0],canvas.height*1.5*scale+ +y-galaxyPosition[1],range,0,2*Math.PI)
	if(display==`original`){
		overlayContext.strokeStyle=`rgb(102,102,102)`
		overlayContext.stroke()
	}else{
		if(planetCount>0||ownership==`claims`){
			overlayContext.fillStyle=`rgba(`+systemGovernment[0]*255+`,`+systemGovernment[1]*255+`,`+systemGovernment[2]*255+`,.1)`
		}else{
			overlayContext.fillStyle=`rgba(102,102,102,.1)`
		}
		overlayContext.fill()
	}
}
function drawLinkLengthCore(){
	overlayContext.beginPath()
	overlayContext.arc(4100*scale,200*scale,9*scale,0,2*Math.PI)
	overlayContext.setLineDash([])
	overlayContext.lineWidth=3.6*scale
	overlayContext.strokeStyle=`rgb(102,102,102)`
	overlayContext.stroke()
	overlayContext.beginPath()
	overlayContext.arc(4100*scale,200*scale,100*scale,0,2*Math.PI)
	overlayContext.setLineDash([])
	overlayContext.lineWidth=1*scale
	overlayContext.strokeStyle=`rgb(102,102,102)`
	overlayContext.stroke()
}
function drawLinkLengthCheck(startX,startY,endX,endY,systemGovernment){
	overlayContext.beginPath()
	overlayContext.arc((endX-startX+4100)*scale,(endY-startY+200)*scale,1*scale,0,2*Math.PI)
	overlayContext.setLineDash([])
	overlayContext.lineWidth=3.6*scale
	if(systemGovernment){
		overlayContext.strokeStyle=`rgb(`+systemGovernment[0]*255+`,`+systemGovernment[1]*255+`,`+systemGovernment[2]*255+`)`
	}else{
		overlayContext.strokeStyle=`rgb(102,102,102)`
	}
	overlayContext.stroke()
}
function drawRangeCheck(startX,startY,endX,endY,lineWidth){
	overlayContext.beginPath()
	overlayContext.moveTo(canvas.width*1.5*scale+ +startX-galaxyPosition[0],canvas.height*1.5*scale+ +startY-galaxyPosition[1])
	overlayContext.lineTo(canvas.width*1.5*scale+ +endX-galaxyPosition[0],canvas.height*1.5*scale+ +endY-galaxyPosition[1])
	overlayContext.setLineDash([])
	if(lineWidth){
		overlayContext.lineWidth=lineWidth
	}else{
		overlayContext.lineWidth=.5
	}
	overlayContext.strokeStyle=`rgb(0,255,0)`
	overlayContext.stroke()
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
var galaxySelected=0
var galaxyPosition=[112,22]
function cycleGalaxy(id){
	for(i1=0;i1<cyclableGalaxies.length;i1++){
		if(cyclableGalaxies[i1][0]==id){
			galaxySelected=i1
			galaxyPosition=cyclableGalaxies[i1][1]
		}
	}
	highlightGalaxy()
	drawGalaxies()
}
function highlightGalaxy(){
	for(i1=0;i1<cyclableGalaxies.length;i1++){
		document.getElementById(cyclableGalaxies[i1][0]).classList.add(`dark`)
	}
	document.getElementById(cyclableGalaxies[galaxySelected][0]).classList.remove(`dark`)
}
var xCoordinate
var yCoordinate
var distance
var targetPrev=0
var target=0
var inRangePrev=0
var inRange=0
document.addEventListener(`mousemove`,mouseMove)
function mouseMove(event){
	if(isBlockedInteraction){
		return
	}
	xCoordinate=Math.round((event.offsetX*3-canvas.width*1.5)*scale)
	yCoordinate=Math.round((event.offsetY*3-canvas.height*1.5)*scale)
	for(i1=0;i1<systems.length;i1++){
		if(Math.dist(systems[i1][1][0]-galaxyPosition[0],systems[i1][1][1]-galaxyPosition[1],xCoordinate,yCoordinate)<distance||i1==0){
			target=i1
			distance=Math.dist(systems[i1][1][0]-galaxyPosition[0],systems[i1][1][1]-galaxyPosition[1],xCoordinate,yCoordinate)
		}
	}
	inRangePrev=inRange
	if(target){
		if(distance>systems[target][6]){
			inRange=0
		}else{
			inRange=1
		}
	}
	if(inRange!==inRangePrev||(inRange&&target!==targetPrev)){
		targetPrev=target
		drawOverlay()
	}
}
var lastSelected
var closestDistances
var closestDistance
document.addEventListener(`mousedown`,mouseDown)
function mouseDown(){
	if(isBlockedInteraction){
		return
	}
	if(target){
		if(distance<=systems[target][6]){
			var spliced=0
			for(i1=0;i1<systemsSelected.length;i1++){
				if(systemsSelected[i1]==target){
					systemsSelected.splice(i1,1)
					spliced=1
					break
				}
			}
			if(!spliced){
				systemsSelected.push(target)
				lastSelected=target
			}
		}
	}
	var canExpand=0
	closestDistances=[]
	if(systemsSelected.length){
		closestDistances.length=systemsSelected.length
		for(i1=0;i1<systemsSelected.length;i1++){
			for(i2=0;i2<systems[systemsSelected[i1]][3].length;i2++){
				for(i3=0;i3<systems.length;i3++){
					if(systems[i3][0]==systems[systemsSelected[i1]][3][i2][0]){
						if(!systemsSelected.includes(i3)){
							canExpand=1
						}
					}
				}
			}
			closestDistance=100000
			for(i2=0;i2<systemsSelected.length;i2++){
				currentDistance=Math.dist(systems[systemsSelected[i1]][1][0],systems[systemsSelected[i1]][1][1],systems[systemsSelected[i2]][1][0],systems[systemsSelected[i2]][1][1])
				if(currentDistance<closestDistance){
					closestDistance=currentDistance
				}
			}
			closestDistances[i1]=closestDistance
		}
		console.log(closestDistances)
	}
	drawGalaxies()
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
				if(event.keyCode==73){		//	I
					toggleSystemInformation()
				}
				if(event.keyCode==74){		//	J
					toggleRangeCheck()
				}
				if(event.keyCode==76){		//	L
					toggleLinkLengthCheck()
				}
				if(event.keyCode==83){		//	S
					expandSystemSelection()
				}
				if(event.keyCode==84){		//	T
					toggleTrade()
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
var showSystemInformation=0
function toggleSystemInformation(){
	showSystemInformation=!showSystemInformation
	highlightSystemInformation()
	drawOverlay()
}
function highlightSystemInformation(){
	if(showSystemInformation){
		document.getElementById(`systemInformation`).classList.remove(`dark`)
	}else{
		document.getElementById(`systemInformation`).classList.add(`dark`)
	}
}
var rangeCheck=0
function toggleRangeCheck(){
	rangeCheck=!rangeCheck
	highlightRangeCheck()
	drawGalaxies()
}
function highlightRangeCheck(){
	if(rangeCheck){
		document.getElementById(`jumpTargets`).classList.remove(`dark`)
	}else{
		document.getElementById(`jumpTargets`).classList.add(`dark`)
	}
}
var linklengthCheck=0
function toggleLinkLengthCheck(){
	linklengthCheck=!linklengthCheck
	highlightLinkLengthCheck()
	drawGalaxies()
}
function highlightLinkLengthCheck(){
	if(linklengthCheck){
		document.getElementById(`linkLength`).classList.remove(`dark`)
	}else{
		document.getElementById(`linkLength`).classList.add(`dark`)
	}
}
var systemsSelected=[]
function expandSystemSelection(){
	var expanded=0
	if(systemsSelected.length){
		for(i1=0;i1<systemsSelected.length;i1++){
			for(i2=0;i2<systems[systemsSelected[i1]][3].length;i2++){
				for(i3=0;i3<systems.length;i3++){
					if(systems[i3][0]==systems[systemsSelected[i1]][3][i2][0]){
						if(!systemsSelected.includes(i3)){
							expanded=1
							systemsSelected.push(i3)
						}
					}
				}
			}
		}
	}
	else{
		for(i1=0;i1<systems.length;i1++){
			expanded=1
			systemsSelected.push(i1)
		}
	}
	if(systemsSelected.length){
		if(!expanded){
			systemsSelected=[]
		}
	}
	drawGalaxies()
}
var showTrade=0
function toggleTrade(){
	showTrade=!showTrade
	highlightTrade()
	document.getElementById(`systemTrade`).innerHTML=``
	if(showTrade){
		drawTrade()
	}
}
function highlightTrade(){
	if(showTrade){
		document.getElementById(`tradeValues`).classList.remove(`dark`)
	}else{
		document.getElementById(`tradeValues`).classList.add(`dark`)
	}
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
function splitLastOccurrence(string,substring) {
	var lastIndex=string.lastIndexOf(substring)
	var before=string.slice(0,lastIndex)
	var after=string.slice(lastIndex+1)
	return[before,after]
}
function sortTrade(a,b) {
	return tradeTemplate.indexOf(a[0])-tradeTemplate.indexOf(b[0])
}
