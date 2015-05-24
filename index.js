var blessed = require( 'blessed'),
    contrib = require( 'blessed-contrib'),
    glesys = require( './glesys.js' ),
    screen = blessed.screen(),
    gridValues = {
        gridRows: 15,
        gridColumns: 15,
        serverWidgetWidth: 3,
        serverWidgetHeight: 3,
        responsTimeHeight: 3
    },
    grid = new contrib.grid({
        rows: gridValues.gridRows, cols: gridValues.gridColumns, screen: screen
    }),
    responses = grid.set( gridValues.gridRows - gridValues.responsTimeHeight, 0, gridValues.responsTimeHeight, gridValues.gridColumns, contrib.line, {
        label: 'GleSys API Response in ms',
        wholeNumbersOnly: true
    }),
    infoMessage = grid.set( 0, 0, 2, gridValues.gridColumns, blessed.text, {
        align: 'center',
        hidden: true,
        border: {
            fg: 'red'
        }
    }),
    loadingIndicator = grid.set( Math.floor( ( gridValues.gridRows - 2 ) / 2 ), Math.floor( ( gridValues.gridColumns - 2 ) / 2 ), 2, 2, blessed.loading, {
        align: 'center'
    }),
    servers,
    serverWidgets = {};

function setErrorMessage( message ){
    infoMessage.setText( message );
    infoMessage.show();

    screen.render();
}

function setResponstimes(){
    var keys = [],
        values = [],
        i;

    for( i = 0; i < glesys.responsetimes.length; i = i + 1 ){
        values.push( glesys.responsetimes[ i ].data );
        keys.push( glesys.responsetimes[ i ].label );
    }

    responses.setData( {
        title: 'GleSys API',
        x: keys,
        y: values,
        style: {
            line: 'red'
        }
    } );

    screen.render();
}

function updateServers(){
    servers.forEach( function( serverData, index ){
        var widgetCount = Object.keys( serverWidgets ).length,
            widgetsPerRow = Math.floor( gridValues.gridColumns / gridValues.serverWidgetWidth ),
            rowCount = Math.ceil( widgetCount / widgetsPerRow ),
            colPosition,
            rowPosition;

        if( rowCount === 0 ){
            rowCount = 1;
        }

        colPosition = ( widgetCount - ( ( rowCount - 1 ) * widgetsPerRow ) ) * gridValues.serverWidgetWidth;

        // Check if we will overflow to the right
        if( colPosition + gridValues.serverWidgetWidth > gridValues.gridColumns ){
            colPosition = 0;
            rowCount = rowCount + 1;
        }

        rowPosition = ( rowCount - 1 ) * gridValues.serverWidgetHeight;

        if( serverWidgets[ serverData.hostname ] === undefined ){
            serverWidgets[ serverData.hostname ] = grid.set(
                rowPosition, //row
                colPosition, //col
                gridValues.serverWidgetHeight, //rowSpan
                gridValues.serverWidgetWidth, //colSpan
                contrib.bar, {
                    label: serverData.hostname + ' - Usage (%)',
                    barWidth: 4,
                    barSpacing: 6,
                    xOffset: 0,
                    maxHeight: 100
                }
            );
        }

        glesys.getServerStatus( serverData.serverid, function( responseData ){
            var data = [
                Math.round( responseData.response.server.cpu.usage * 100 ),
                Math.round( ( responseData.response.server.memory.usage / responseData.response.server.memory.max ) * 100 ),
                Math.round( ( responseData.response.server.disk.usage / responseData.response.server.disk.max ) * 100 ),
            ];

            serverWidgets[ serverData.hostname ].setData({
                titles: [ 'CPU', 'MEM', 'DSK' ],
                data: data
            });

            screen.render();

            setResponstimes();
        });
    });

    screen.render();
}

screen.key([ 'escape', 'q', 'C-c' ], function( ch, key ) {
    return process.exit( 0 );
});

loadingIndicator.load( 'Loading server list' );
screen.render();

glesys.getServerList( function( data ){
    loadingIndicator.stop();

    if( data.status !== undefined && data.status == 'failed' ){
        setErrorMessage( data.message );
    } else {
        servers = data;

        setInterval( updateServers, 2000 );

        setResponstimes();
    }
});
