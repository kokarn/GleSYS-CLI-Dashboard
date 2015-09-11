'use strict';

var blessed = require( 'blessed' ),
    contrib = require( 'blessed-contrib' ),
    glesys = require( './modules/glesys.js' ),
    remotelog = require( './modules/remotelog.js' ),
    chalk = require( 'chalk' );

function start(){
    var screen = blessed.screen(),
        gridValues = {
            gridRows: 15,
            gridColumns: 14,
            serverWidgetWidth: 2,
            serverWidgetHeight: 3,
            errorLogHeight: 3
        },
        grid = new contrib.grid({
            rows: gridValues.gridRows, cols: gridValues.gridColumns, screen: screen
        }),
        infoMessage = grid.set( 0, 0, 2, gridValues.gridColumns, blessed.text, {
            align: 'center',
            hidden: true,
            border: {
                fg: 'red'
            }
        }),
        errorLog = grid.set( gridValues.gridRows - gridValues.errorLogHeight, 0, gridValues.errorLogHeight, gridValues.gridColumns, contrib.log, {
            fg: 'green',
            selectedFg: 'green',
            label: 'Server Error log'
        }),
        loadingIndicator = grid.set( Math.floor( ( gridValues.gridRows - 2 ) / 2 ), Math.floor( ( gridValues.gridColumns - 2 ) / 2 ), 2, 2, blessed.loading, {
            align: 'center'
        }),
        servers,
        serverWidgets = {};

    try {
        var settings = require( './settings.js' );
    } catch( error ){
        console.log( chalk.red( 'Failed to load settings. Please run "node credentials.js"' ) );
        process.exit();
    }

    function setErrorMessage( message ){
        infoMessage.setText( message );
        infoMessage.show();

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
            });
        });

        screen.render();
    }

    screen.key( [ 'escape', 'q', 'C-c' ], function( ch, key ) {
        return process.exit( 0 );
    });

    loadingIndicator.load( 'Loading server list' );
    screen.render();

    glesys.apiKey = settings.glesysApiKey;
    glesys.account = settings.glesysAccount;

    glesys.getServerList( function( data ){
        loadingIndicator.stop();

        if( data.status !== undefined && data.status == 'failed' ){
            setErrorMessage( data.message );
        } else {
            servers = data;

            updateServers();
            // This data is apparently cached for a minute
            setInterval( updateServers, 60000 );
        }

        servers.forEach( function( serverData, index ){
            var logger = new remotelog();

            logger.serverName = serverData.hostname;
            logger.domain = settings.serverMainDomainname
            logger.username = settings.serverUsername;
            logger.password = settings.serverPassword;
            logger.callbackMethod = function( message ){
                errorLog.log( message );
                screen.render();
            };

            logger.connect();
        });
    });
}

module.exports.start = start;
