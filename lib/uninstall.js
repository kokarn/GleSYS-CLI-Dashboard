'use strict';

var fs = require( 'fs' ),
    chalk = require( 'chalk' ),
    path = require( 'path' ),
    lib = path.join( path.dirname( fs.realpathSync( __filename ) ), '../lib' ),
    settingsPath = lib +  '/settings.js';

try {
    fs.unlink( settingsPath, function( error ){
        if( !error ){
            console.log( chalk.green( 'Settings file deleted successfully' ) );
        }
    });
} catch( error ){
    // Failed to remove settings.js
    console.log( chalk.red( 'Failed to delete settings' ) );
}
