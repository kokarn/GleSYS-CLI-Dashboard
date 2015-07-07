'use strict';

var readline = require( 'readline-sync' ),
    fs = require( 'fs' ),
    chalk = require( 'chalk' ),
    path = require( 'path' ),
    lib = path.join( path.dirname( fs.realpathSync( __filename ) ), '../lib' ),
    settingsPath = lib +  '/settings.js',
    currentSettings = {},
    updateSettings = false,
    requiredSettings = {
        glesysApiKey : 'What is your API key? ',
        glesysAccount : 'What is your account id? ',
        serverUsername : 'What server username should we use to connect? ',
        serverPassword : 'What is the password for the accounts? ',
        serverMainDomainname : 'What is the main domain for the servers? '
    };

function writeData( file ){
    var key;

    for( key in requiredSettings ){
        currentSettings[ key ] = readline.question( requiredSettings[ key ] );
    }

    fs.write( file, 'module.exports = ' + JSON.stringify( currentSettings ) + ';', 'utf8', function( error, data ){
        if( error ){
            console.log( chalk.red( error ) );
        } else {
            console.log( chalk.green( 'Config vars saved to settings.js' ) );
        }
    });
}

try {
    currentSettings = require( settingsPath );

    for( var key in requiredSettings ){
        if( currentSettings[ key ] === undefined || currentSettings[ key ].length <= 0 ){
            updateSettings = true;
            break;
        }
    }

    if( !updateSettings ){
        console.log( chalk.green( 'Config data found already in settings.js' ) );
    }
} catch( error ){
    // Failed to open settings.js, let's write some new settings
    updateSettings = true;
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
