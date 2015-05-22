'use strict';

var readline = require( 'readline-sync' ),
    fs = require( 'fs' ),
    chalk = require( 'chalk' ),
    settingsPath = 'lib/settings.js',
    currentSettings,
    updateSettings = true;

try {
    currentSettings = require( './' + settingsPath );
    if( currentSettings.glesysApiKey !== undefined && currentSettings.glesysAccount !== undefined && currentSettings.glesysApiKey.length > 0 && currentSettings.glesysAccount.length > 0 ){
        console.log( chalk.green( 'Config data found already in settings.js' ) );
        updateSettings = false;
    }
} catch( error ){

}

function writeData( file ){
    var apiKey = readline.question( 'What is your API key? ' ),
        account = readline.question( 'What is your account id? ' );

    fs.write( file, 'module.exports = { glesysApiKey: "' + apiKey + '", glesysAccount: "' + account + '"};', 'utf8', function( error, data ){
            if( error ){
                console.log( chalk.red( error ) );
            } else {
                console.log( chalk.green( 'Config vars saved to settings.js' ) );
            }
        }
    );
}

if( updateSettings ){
    fs.open( settingsPath, 'r+', function( error, file ){
        if( error ){
            fs.open( settingsPath, 'w', function( error, file ){
                writeData( file );
            });
        } else {
            writeData( file );
        }

    } );
}
