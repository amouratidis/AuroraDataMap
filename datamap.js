// Get the SVG as a variable
var svgSelection;

// Create the SVG Width/Height/Padding constants
var svgWidth   = 800;
var svgHeight  = 500;
var svgPadding = 20;

// Ping Variables
var iRadius = 10;

// Heatmap Variables
var iNodeCount = 0;
var iHeatmap   = [];
var sSections  = [];
var sSectNames = [];

// Animation Variables
var iPingAnim   = 500;
var iNodeAnim   = 2000;
var iInterval   = 250;
var iTime       = 0;

// Used for the Region Label
var iTopRegion = 0;
var sTopRegion = "";

// Data Variable
var dataset = [];

// Mouse Tracking
var cursorX;
var cursorY;

// Update the mouse position when moved
document.onmousemove = function( e )
{
    cursorX = e.pageX;
    cursorY = e.pageY;
}


// Queue up the Data Loading
queue()
	.defer( d3.csv, "P2Data.csv" )
	.defer( d3.xml, "North_America_second_level_political_division_2_and_Greenland.svg" )
	.defer( formatData )
	.await( start );


// SetUp the Data
function formatData( queueCallBack )
{
	// Scaling Functions
	var xScale = d3.scale.linear()
		.domain( [0, svgWidth] )
		.range( [svgPadding, svgWidth - svgPadding] );

	var yScale = d3.scale.linear()
		.domain( [0, svgHeight] )
		.range( [svgHeight - svgPadding, svgPadding] );
			
	// Callback Function
	queueCallBack( null );
}


// Start of the program - Called after data is loaded
function start( error, csvOutput, svgMap )
{
	// If there was an Error loading the file - Show it
	if( error )
		throw error;

	// Save our Dataset
	dataset = csvOutput;
	
	// Add the SVG to our page
	document.getElementById("MapHolder").appendChild( svgMap.documentElement );
	
	// Select the SVG
	svgSelection = d3.select( "#map" );
	
	// Setup sections
	svgSelection.selectAll( ".section" )
		.style( "stroke", "black" )
		.style( "stroke-width", "1px" )
		.style( "fill", "#edf8fb" )
	    .on("mouseover", function()
		{
			var sectionID = this.id;
		
			d3.select( this )
				.style( "stroke", "black" )
				.style( "stroke-width", "3px" );
				
			d3.select( "#ProvinceText" )
				.attr( "opacity", 0 )
				.transition()
				.duration( iPingAnim )
				.attr( "opacity", 1 )
				.text( function()
				{
					var iIndex = checkSection( "#" + sectionID );
					
					if( iIndex < 0 )
						return "";
					else
						return sSectNames[iIndex] + ": " + iHeatmap[iIndex];
				});
		})
		.on( "mouseout", function()
		{
			d3.select( this )
				.style( "stroke", "black" )
				.style( "stroke-width", "1px" );
				
			d3.select( "#ProvinceText" )
				.transition()
				.duration( iPingAnim )
				.attr( "opacity", 0 );
		});
		
	
	// Show the data
	showData();
}


// Using the data created, show it
function showData()
{		
	var iIndex = 0;
	
	var heatmapInterval = setInterval( function()
	{	
		iTime = iTime + ( iInterval / 1000 );
		
		// Check if the time of the next ping has passed
		if( parseInt( dataset[iIndex].Time ) > iTime )
			return;
			
		// Parse variables from the dataset
		var iXVal = parseInt( dataset[iIndex].ScreenX );
		var iYVal = parseInt( dataset[iIndex].ScreenY );
		var sCity = dataset[iIndex].City;
		var sSect = "#" + dataset[iIndex].Section;
		var sData = dataset[iIndex].DeviceType;
		var sProv = dataset[iIndex].Province;
			
		// Fall-through means we're good to add the next ping and heatmap node
		addPing( iXVal, iYVal, sCity, sData );
		addNode( iXVal, iYVal, sSect, sProv );
		
		// Increase our Index
		iIndex++;
	
		// Show the total ping count
		document.getElementById("TotalPings").innerHTML = "Ping Count: " + iIndex;
	
		// Check if the Index is greater than the dataset
		if( iIndex >= dataset.length )
			clearInterval( heatmapInterval );
			
	}, iInterval );	
}


// Show a specific ping on the map
function addPing( iXVal, iYVal, sCity, sDataType )
{
	// Create the ping and animation
	svgSelection.append( "circle" )
		.attr( "class", "ping" )
		.attr( "opacity", 0 )
		.attr( "cx", iXVal )
		.attr( "cy", iYVal )
		.attr( "r", iRadius * 4 )
		.style( "fill", getDataColor( sDataType ) )
		.style( "stroke", "black" )
		.style( "stroke-width", "3px" )
		.transition()
		.duration( iPingAnim )
		.attr( "opacity", 1 )
		.attr( "r", iRadius )
		.transition()
		.delay( iPingAnim * 2 )
		.attr( "opacity", 0 )
		.remove();
		
	// Space the text correctly
	iXVal = iXVal - ( sCity.length * 6.5 );
	iYVal = iYVal - 20;
			
	// Create the city text
	svgSelection.append( "text" )
		.attr( "class", "text" )
		.attr( "opacity", 0 )
		.text( sCity )
		.attr( "x", iXVal )
		.attr( "y", iYVal )
		.transition()
		.duration( iPingAnim )
		.attr( "opacity", 1 )
		.transition()
		.delay( iPingAnim * 2 )
		.attr( "opacity", 0 )
		.remove();
}


// Show a new heatmap node on the map
function addNode( iXVal, iYVal, sSect, sProv )
{
	// Retrieve the section index ( -1 is not found )
	var iSectIndex = checkSection( sSect );
	
	if( iSectIndex >= 0 )
	{
		iHeatmap[iSectIndex] = iHeatmap[iSectIndex] + 1;
		
		// Calculate the new top region
		if( iHeatmap[iSectIndex] > iTopRegion )
		{
			sTopRegion = sSectNames[iSectIndex];
			iTopRegion = iHeatmap[iSectIndex];
		}
	}
	else
	{
		// Get the index of the new node
		var iNewIndex = sSections.length;
	
		// Add the new node to the arrays
		sSections[iNewIndex]  = sSect;
		sSectNames[iNewIndex] = sProv;
		iHeatmap[iNewIndex]   = 1;
		
		// Calculate the new top region
		if( iHeatmap[iNewIndex] > iTopRegion )
		{
			sTopRegion = sSectNames[iNewIndex];
			iTopRegion = iHeatmap[iNewIndex];
		}
	}
	

	
	// Update the most active region
	document.getElementById("RegionActivity").innerHTML = "Most Active Region: " + sTopRegion;
	
	// Increase the total amount of nodes
	iNodeCount++;
	
	// Update the visual nodes to reflect the arrays
	updateNodes();
}


// Updates the color and opacity of the heatmap nodes based on the counts
function updateNodes()
{
	for( iSection = 0; iSection < sSections.length; iSection++ )
	{
		var sSectionName  = sSections[iSection];
		var iSectionCount = iHeatmap[iSection];
		
		svgSelection
			.select( sSectionName )
			.transition()
			.duration( iNodeAnim )
			.attr( "opacity", 1 )
			.style( "fill", getHeatColor( iSection ) );
	}
}


// Check if a section exists - return the index if so, otherwise -1
function checkSection( sSectionName )
{
	// Loop through our cities and increment the matching cities count
	for( iIndex = 0; iIndex < sSections.length; iIndex++ )
	{
		// Check if the current city is the correct city
		if( sSections[iIndex] == sSectionName )
			return iIndex;
	}

	// Fall-through means not found, return -1
	return -1;
}


// Return a usable color for the map
function getHeatColor( iIndex )
{
	var iPercent = ( iHeatmap[ iIndex ] / iNodeCount ) * 100;

	// Lightest 00%
	if( iPercent <= 0 )
		return "#edf8fb";	
	// Light 00% - 05%
	else if( iPercent <= 05 )
		return "#b2e2e2";	
	// Middle 05% - 10%
	else if( iPercent <= 10 )
		return "#66c2a4";	
	// Dark 10% - 25%
	else if( iPercent <= 25 )
		return "#2ca25f";	
	// Darkest 25% - 100%
	else
		return "#006d2c";
}


// Returns the color used for a specific data-type
function getDataColor( sDataType )
{
	if( sDataType == "Real-time ASI Images" )
		return "#e31a1c";	
	else if( sDataType == "Riometer" )
		return "#fb9a99";
	else if( sDataType == "Redline Camera" )
		return "#ff7f00";
	else if( sDataType == "Autumn Magnetometer" )
		return "#fdbf6f";
	else if( sDataType == "Data Management Systems" )
		return "#cab2d6";
	else if( sDataType == "AuroraMAX" )
		return "#6a3d9a";
	else if( sDataType == "Full Colour Camera" )
		return "#ffff99";
	else if( sDataType == "THEMIS Magnetometer" )
		return "#b15928";
	else if( sDataType == "THEMIS Observatory" )
		return "#33a02c";
	else if( sDataType == "Remote IT Infrastructure" )
		return "#b2df8a";
	else if( sDataType == "Multispectral Photometer" )
		return "#1f78b4";
	else if( sDataType == "Proton Aurora Photometer" )
		return "#a6cee3";
	else
		return "#ffffff";
}